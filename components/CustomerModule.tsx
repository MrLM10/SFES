import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, MapPin, Phone, Mail, Eye, EyeOff, Bell, History, Gift, Globe, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
// Simple toast function to avoid import issues
const toast = {
  success: (message: string) => console.log('✅ Success:', message),
  error: (message: string) => console.log('❌ Error:', message),
  info: (message: string) => console.log('ℹ️ Info:', message)
};
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface CustomerModuleProps {
  onBack: () => void;
}

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  country: string;
  province: string;
  totalPoints: number;
  userType: string;
}

interface Transaction {
  id: string;
  type: 'earned' | 'redeemed';
  points: number;
  amount: number;
  storeId: string;
  date: string;
}

interface StorePoints {
  storeId: string;
  points: number;
  lastVisit: string;
}

export function CustomerModule({ onBack }: CustomerModuleProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('MZ');
  const [selectedLanguage, setSelectedLanguage] = useState('pt');
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [storePoints, setStorePoints] = useState<StorePoints[]>([]);
  const [accessToken, setAccessToken] = useState<string>('');

  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    province: ''
  });

  const countries = [
    { code: 'MZ', name: 'Moçambique', ddi: '+258', currency: 'MZN', flag: '🇲🇿' },
    { code: 'ZA', name: 'África do Sul', ddi: '+27', currency: 'ZAR', flag: '🇿🇦' },
    { code: 'US', name: 'Estados Unidos', ddi: '+1', currency: 'USD', flag: '🇺🇸' },
    { code: 'BR', name: 'Brasil', ddi: '+55', currency: 'BRL', flag: '🇧🇷' }
  ];

  const languages = [
    { code: 'pt', name: 'Português' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' }
  ];

  const currentCountry = countries.find(c => c.code === selectedCountry)!;

  const storeNames = {
    'store_1': 'Shoprite Maputo',
    'store_2': 'Shoprite Matola', 
    'store_3': 'Buiders Xai-Xai'
  };

  // Mock stores for when API data is not available
  const mockStores = [
    { id: 'store_1', name: 'Shoprite Maputo', province: 'Maputo', country: 'MZ' },
    { id: 'store_2', name: 'Shoprite Matola', province: 'Maputo', country: 'MZ' },
    { id: 'store_3', name: 'Buiders Xai-Xai', province: 'Gaza', country: 'MZ' }
  ];

  // API calls
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const url = `https://${projectId}.supabase.co/functions/v1/make-server-a8c4406a${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken || publicAnonKey}`,
      ...options.headers,
    };

    try {
      console.log(`Making API call to: ${url}`);
      
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();
      console.log(`API response for ${endpoint}:`, data);

      if (!response.ok) {
        throw new Error(data.error || data.details || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  };

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Attempting login for:', loginForm.email);
      
      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password
        })
      });

      console.log('Login response:', response);

      if (response.success) {
        setAccessToken(response.session.access_token);
        setUser(response.user);
        setIsLoggedIn(true);
        await loadDashboard(response.session.access_token);
        toast.success('Login realizado com sucesso!');
      } else {
        toast.error('Falha no login: ' + (response.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erro no login: ' + (error.message || 'Erro de conexão'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerForm.name || !registerForm.email || !registerForm.password || !registerForm.province) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Attempting registration for:', registerForm.email);
      
      const response = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: registerForm.name,
          email: registerForm.email,
          password: registerForm.password,
          phone: registerForm.phone ? currentCountry.ddi + ' ' + registerForm.phone : '',
          country: selectedCountry,
          province: registerForm.province,
          userType: 'customer'
        })
      });

      console.log('Registration response:', response);

      if (response.success) {
        toast.success('Conta criada com sucesso! Faça login para continuar.');
        // Reset form and switch to login tab
        setRegisterForm({
          name: '',
          email: '',
          phone: '',
          password: '',
          province: ''
        });
      } else {
        toast.error('Erro no cadastro: ' + (response.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Erro no cadastro: ' + (error.message || 'Erro de conexão'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboard = async (token: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a8c4406a/customer/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.profile) {
        setUser(data.profile);
        setStorePoints(data.storePoints || []);
        setTransactions(data.transactions || []);
      } else {
        console.error('Dashboard error:', data.error);
        // If profile is not found, use the user data from login
        if (user) {
          setStorePoints([]);
          setTransactions([]);
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      // Set empty data on error
      setStorePoints([]);
      setTransactions([]);
    }
  };

  const redeemPoints = async (points: number) => {
    if (!user || user.totalPoints < points) {
      toast.error('Pontos insuficientes para este resgate!');
      return;
    }

    setIsLoading(true);
    try {
      console.log(`Attempting to redeem ${points} points...`);
      
      const response = await apiCall('/customer/redeem', {
        method: 'POST',
        body: JSON.stringify({
          points,
          storeId: 'store_1' // Default store for demo
        })
      });

      if (response.success) {
        // Update user points immediately
        const newTotalPoints = user.totalPoints - points;
        setUser({ ...user, totalPoints: newTotalPoints });
        
        // Add new transaction immediately for instant feedback
        const newTransaction = {
          id: `redeem_${Date.now()}`,
          type: 'redeemed' as const,
          points: -points,
          amount: points, // 1 point = 1 MZN discount
          storeId: 'store_1',
          date: new Date().toISOString()
        };
        setTransactions(prev => [newTransaction, ...prev]);
        
        // Show success message with discount value
        toast.success(`✨ ${points} estrelas resgatadas! Desconto de ${points} ${currentCountry.currency} aplicado!`);
        
        // Reload dashboard data in background for consistency
        setTimeout(() => loadDashboard(accessToken), 1000);
      } else {
        throw new Error(response.error || 'Falha no resgate');
      }
    } catch (error) {
      console.error('Redeem error:', error);
      
      // Fallback for demo mode - simulate successful redemption
      if (error.message?.includes('fetch') || error.message?.includes('Failed')) {
        console.log('API unavailable, simulating redemption for demo...');
        
        const newTotalPoints = user.totalPoints - points;
        setUser({ ...user, totalPoints: newTotalPoints });
        
        const newTransaction = {
          id: `demo_redeem_${Date.now()}`,
          type: 'redeemed' as const,
          points: -points,
          amount: points,
          storeId: 'store_1',
          date: new Date().toISOString()
        };
        setTransactions(prev => [newTransaction, ...prev]);
        
        toast.success(`🎉 Resgate simulado: ${points} estrelas = ${points} ${currentCountry.currency} de desconto!`);
      } else {
        toast.error('Erro ao resgatar pontos: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50">
        <header className="bg-white shadow-sm border-b-4 border-red-600 p-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <Star className="h-6 w-6 text-red-600" />
              <h1 className="text-xl font-bold">Módulo Cliente</h1>
            </div>
            <div className="ml-auto flex items-center space-x-2">
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-md">
          <Card className="shadow-xl border-2 border-red-100">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 p-4 bg-red-100 rounded-full">
                <Star className="h-12 w-12 text-red-600 fill-red-600" />
              </div>
              <CardTitle className="text-2xl text-gray-900">Bem-vindo!</CardTitle>
              <CardDescription>
                Entre ou cadastre-se para acumular estrelas
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="register">Cadastrar</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-4 mt-6">
                  <div>
                    <Label htmlFor="login-email">Email</Label>
                    <Input 
                      id="login-email" 
                      type="email"
                      placeholder="seu@email.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="login-password">Senha</Label>
                    <div className="relative">
                      <Input 
                        id="login-password" 
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-red-600 hover:bg-red-700"
                    onClick={handleLogin}
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Entrar
                  </Button>
                  
                  <Alert>
                    <AlertDescription>
                      Use: cliente@teste.com / senha123 para testar
                    </AlertDescription>
                  </Alert>
                </TabsContent>
                
                <TabsContent value="register" className="space-y-4 mt-6">
                  <div>
                    <Label htmlFor="register-name">Nome Completo</Label>
                    <Input 
                      id="register-name" 
                      placeholder="Seu nome completo"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="register-country">País</Label>
                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map(country => (
                          <SelectItem key={country.code} value={country.code}>
                            <div className="flex items-center space-x-2">
                              <span>{country.flag}</span>
                              <span>{country.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {country.currency}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="register-phone">Telefone</Label>
                    <div className="flex space-x-2">
                      <Input 
                        value={currentCountry.ddi} 
                        readOnly 
                        className="w-20 bg-gray-50"
                      />
                      <Input 
                        id="register-phone" 
                        placeholder="84 123 4567" 
                        className="flex-1"
                        value={registerForm.phone}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="register-email">Email</Label>
                    <Input 
                      id="register-email" 
                      type="email" 
                      placeholder="seu@email.com"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="register-province">Província</Label>
                    <Select value={registerForm.province} onValueChange={(value) => setRegisterForm(prev => ({ ...prev, province: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione sua província" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="maputo">Maputo</SelectItem>
                        <SelectItem value="gaza">Gaza</SelectItem>
                        <SelectItem value="inhambane">Inhambane</SelectItem>
                        <SelectItem value="sofala">Sofala</SelectItem>
                        <SelectItem value="manica">Manica</SelectItem>
                        <SelectItem value="tete">Tete</SelectItem>
                        <SelectItem value="zambeze">Zambézia</SelectItem>
                        <SelectItem value="nampula">Nampula</SelectItem>
                        <SelectItem value="cabo-delgado">Cabo Delgado</SelectItem>
                        <SelectItem value="niassa">Niassa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="register-password">Senha</Label>
                    <div className="relative">
                      <Input 
                        id="register-password" 
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-red-600 hover:bg-red-700"
                    onClick={handleRegister}
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Criar Conta
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50">
      <header className="bg-white shadow-sm border-b-4 border-red-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <Star className="h-6 w-6 text-red-600" />
              <div>
                <h1 className="text-lg font-bold">{user?.name}</h1>
                <p className="text-sm text-gray-600">{currentCountry.flag} {currentCountry.name}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className="bg-red-100 text-red-700 border-red-200">
              {user?.totalPoints || 0} ⭐
            </Badge>
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="rewards">Recompensas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            {/* Points Summary */}
            <Card className="bg-gradient-to-r from-red-600 to-red-700 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg opacity-90">Total de Estrelas</h3>
                    <p className="text-3xl font-bold">{user?.totalPoints || 0}</p>
                  </div>
                  <Star className="h-12 w-12 fill-white" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-sm opacity-90">Próximo nível</p>
                    <p className="font-semibold">55 estrelas</p>
                    <Progress value={75} className="mt-2 h-2 bg-white/20" />
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-sm opacity-90">Desconto disponível</p>
                    <p className="font-semibold">10% OFF</p>
                    <p className="text-xs opacity-75">em compras acima de 500 {currentCountry.currency}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stores */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-red-600" />
                Meus Supermercados
              </h3>
              
              <div className="space-y-3">
                {storePoints.length > 0 ? storePoints.map((store, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{storeNames[store.storeId as keyof typeof storeNames] || store.storeId}</h4>
                          <p className="text-sm text-gray-600">
                            Última visita: {new Date(store.lastVisit).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Badge className="bg-red-100 text-red-700">
                          {store.points} ⭐
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhuma loja visitada ainda</p>
                      <p className="text-sm text-gray-400">Faça sua primeira compra para ganhar estrelas!</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Gift className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{storePoints.length}</p>
                  <p className="text-sm text-gray-600">Lojas visitadas</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <History className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{transactions.length}</p>
                  <p className="text-sm text-gray-600">Transações</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Histórico de Transações</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => loadDashboard(accessToken)}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Atualizar
              </Button>
            </div>
            
            <div className="space-y-3">
              {transactions.length > 0 ? transactions.map((transaction, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          transaction.type === 'earned' ? 'bg-green-100' : 'bg-orange-100'
                        }`}>
                          {transaction.type === 'earned' ? (
                            <Star className="h-4 w-4 text-green-600" />
                          ) : (
                            <Gift className="h-4 w-4 text-orange-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold">
                            {storeNames[transaction.storeId as keyof typeof storeNames] || transaction.storeId}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {new Date(transaction.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'earned' ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {transaction.type === 'earned' ? '+' : ''}{transaction.points} ⭐
                        </p>
                        <p className="text-sm text-gray-600">
                          {transaction.amount > 0 ? `${transaction.amount} ${currentCountry.currency}` : 'Desconto usado'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma transação encontrada</p>
                    <p className="text-sm text-gray-400">Suas compras aparecerão aqui</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="rewards" className="space-y-6 mt-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Recompensas Disponíveis</h3>
              
              <div className="grid gap-4">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-green-800">10% de Desconto</h4>
                        <p className="text-green-700">Em compras acima de 500 {currentCountry.currency}</p>
                        <p className="text-sm text-green-600 mt-1">Custa: 20 estrelas</p>
                      </div>
                      <Button 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => redeemPoints(20)}
                        disabled={!user || user.totalPoints < 20 || isLoading}
                      >
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Resgatar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-blue-800">15% de Desconto</h4>
                        <p className="text-blue-700">Em compras acima de 1000 {currentCountry.currency}</p>
                        <p className="text-sm text-blue-600 mt-1">Custa: 50 estrelas</p>
                      </div>
                      <Button 
                        onClick={() => redeemPoints(50)}
                        disabled={!user || user.totalPoints < 50 || isLoading}
                        variant={user && user.totalPoints >= 50 ? "default" : "outline"}
                      >
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {user && user.totalPoints >= 50 ? 'Resgatar' : 'Bloqueado'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 bg-purple-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-purple-800">20% de Desconto</h4>
                        <p className="text-purple-700">Em compras acima de 1500 {currentCountry.currency}</p>
                        <p className="text-sm text-purple-600 mt-1">Custa: 100 estrelas</p>
                      </div>
                      <Button 
                        onClick={() => redeemPoints(100)}
                        disabled={!user || user.totalPoints < 100 || isLoading}
                        variant={user && user.totalPoints >= 100 ? "default" : "outline"}
                      >
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {user && user.totalPoints >= 100 ? 'Resgatar' : 'Bloqueado'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Como Ganhar Mais Estrelas</h3>
              
              <div className="space-y-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-red-100 p-2 rounded-full">
                        <Star className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Compre regularmente</h4>
                        <p className="text-sm text-gray-600">Cada compra gera estrelas automaticamente</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Globe className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Visite diferentes lojas</h4>
                        <p className="text-sm text-gray-600">Ganhe bônus por explorar nossa rede</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}