import React, { useState, useEffect } from 'react';
import { Star, ShoppingCart, Users, Settings, Globe, Phone, CheckCircle, XCircle, UserCheck, CreditCard, TrendingUp, Shield, Crown } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { CustomerModule } from './components/CustomerModule';
import { CashierModule } from './components/CashierModule';
import { AdminModule } from './components/AdminModule';
import { AdminRegistrationForm } from './components/AdminRegistrationForm';
import { CashierLoginScreen } from './components/CashierLoginScreen';
import { Badge } from './components/ui/badge';
import { Alert, AlertDescription } from './components/ui/alert';

// Simple toast function to avoid import issues
const toast = {
  success: (message: string) => console.log('✅ Success:', message),
  error: (message: string) => console.log('❌ Error:', message),
  info: (message: string) => console.log('ℹ️ Info:', message)
};

type AppRoute = 'home' | 'customer' | 'cashier' | 'admin' | 'registration' | 'cashier-login';
type AccessType = 'public' | 'cashier' | 'admin';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('home');
  const [accessType, setAccessType] = useState<AccessType>('public');
  const [registrationCode, setRegistrationCode] = useState<string>('');
  const [storeId, setStoreId] = useState<string>('');
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline' | 'demo'>('checking');
  const [detectedAccessType, setDetectedAccessType] = useState<string>('');

  useEffect(() => {
    // Check URL for special access routes
    const path = window.location.pathname;
    const hash = window.location.hash;
    
    console.log('🔍 Checking URL access:', { path, hash });
    
    // Admin registration route
    const registrationMatch = path.match(/\/registro\/([^\/]+)/);
    if (registrationMatch) {
      const code = registrationMatch[1];
      console.log('✅ Registration access detected:', code);
      setRegistrationCode(code);
      setCurrentRoute('registration');
      setAccessType('admin');
      setDetectedAccessType(`Registro Admin: ${code}`);
      window.history.replaceState({}, '', '/');
      toast.success(`Acesso de registro detectado: ${code}`);
      return;
    }

    // Cashier access route - should go to login first
    const cashierMatch = path.match(/\/caixa\/([^\/]+)/) || hash.match(/#\/caixa\/([^\/]+)/);
    if (cashierMatch) {
      const cashierStoreId = cashierMatch[1];
      console.log('✅ Cashier access link detected:', cashierStoreId);
      setStoreId(cashierStoreId);
      setCurrentRoute('cashier-login');
      setAccessType('cashier');
      setDetectedAccessType(`Link de Acesso: Caixa ${cashierStoreId}`);
      window.history.replaceState({}, '', '/');
      toast.success(`Link de acesso do caixa detectado: ${cashierStoreId}`);
      return;
    }

    // Admin access route
    const adminMatch = path.match(/\/admin\/([^\/]+)/) || hash.match(/#\/admin\/([^\/]+)/);
    if (adminMatch) {
      const adminStoreId = adminMatch[1];
      console.log('✅ Admin access detected:', adminStoreId);
      setStoreId(adminStoreId);
      setCurrentRoute('admin');
      setAccessType('admin');
      setDetectedAccessType(`Admin da Loja: ${adminStoreId}`);
      window.history.replaceState({}, '', '/');
      toast.success(`Acesso de admin detectado para loja: ${adminStoreId}`);
      return;
    }

    // Default to public access and check server status
    setAccessType('public');
    setCurrentRoute('home');
    setDetectedAccessType('');
    
    // Check server health on app start
    checkServerHealth();
  }, []);

  const getEnvironmentVariable = (name: string): string | undefined => {
    // Try Vite environment first
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[name];
    }
    
    // Try process environment (fallback)
    if (typeof globalThis !== 'undefined' && (globalThis as any).process?.env) {
      return (globalThis as any).process.env[name];
    }
    
    return undefined;
  };

  const checkServerHealth = async () => {
    setServerStatus('checking');
    
    try {
      // Try to get environment variables from different sources
      const supabaseUrl = getEnvironmentVariable('VITE_SUPABASE_URL') || 
                          getEnvironmentVariable('REACT_APP_SUPABASE_URL');
      
      const supabaseKey = getEnvironmentVariable('VITE_SUPABASE_ANON_KEY') || 
                          getEnvironmentVariable('REACT_APP_SUPABASE_ANON_KEY');
      
      console.log('🔍 Checking Supabase connection...', { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseKey,
        urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'none'
      });
      
      if (!supabaseUrl || !supabaseKey) {
        console.log('📦 No Supabase credentials found - using demo mode');
        setServerStatus('demo');
        return;
      }

      // Test Supabase connection
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      if (response.ok || response.status === 404) {
        console.log('✅ Supabase connection successful - using online mode');
        setServerStatus('online');
      } else {
        console.log('⚠️ Supabase connection failed - falling back to demo mode');
        setServerStatus('demo');
      }
    } catch (error) {
      console.log('📦 Connection error - using demo mode:', error);
      setServerStatus('demo');
    }
  };

  const handleAdminAccess = () => {
    setCurrentRoute('admin');
    setAccessType('admin');
  };

  // Handle successful cashier login
  const handleCashierLoginSuccess = () => {
    setCurrentRoute('cashier');
    // Keep the same accessType and storeId
  };

  // Registration form route
  if (currentRoute === 'registration') {
    return (
      <AdminRegistrationForm 
        registrationCode={registrationCode}
        onSuccess={() => {
          setCurrentRoute('home');
          setRegistrationCode('');
          setAccessType('public');
          setDetectedAccessType('');
        }}
        onBack={() => {
          setCurrentRoute('home');
          setRegistrationCode('');
          setAccessType('public');
          setDetectedAccessType('');
        }}
      />
    );
  }

  // Cashier login screen (when accessed via link)
  if (currentRoute === 'cashier-login' && accessType === 'cashier') {
    return (
      <CashierLoginScreen 
        storeId={storeId}
        onLoginSuccess={handleCashierLoginSuccess}
        onBack={() => {
          setCurrentRoute('home');
          setAccessType('public');
          setStoreId('');
          setDetectedAccessType('');
        }} 
      />
    );
  }

  // Cashier module (after successful login)
  if (currentRoute === 'cashier' && accessType === 'cashier') {
    return (
      <CashierModule 
        storeId={storeId}
        onBack={() => {
          setCurrentRoute('home');
          setAccessType('public');
          setStoreId('');
          setDetectedAccessType('');
        }} 
      />
    );
  }

  // Admin module (accessed via special link or direct access)
  if (currentRoute === 'admin' && accessType === 'admin') {
    return (
      <AdminModule 
        onBack={() => {
          setCurrentRoute('home');
          setAccessType('public');
          setStoreId('');
          setDetectedAccessType('');
        }} 
      />
    );
  }

  // Customer module
  if (currentRoute === 'customer') {
    return <CustomerModule onBack={() => setCurrentRoute('home')} />;
  }

  // Public home page - customer focused
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-4 border-red-600">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-red-600 p-3 rounded-full shadow-lg">
                <Star className="h-8 w-8 text-white fill-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Estrela Supermercado</h1>
                <p className="text-gray-600">Sistema Global de Fidelização</p>
                {detectedAccessType && (
                  <p className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-md mt-1">
                    🔗 {detectedAccessType}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Admin Access Button */}
              <Button 
                onClick={handleAdminAccess}
                variant="outline"
                className="border-2 border-yellow-500 text-yellow-700 hover:bg-yellow-50 hover:border-yellow-600 transition-all duration-200"
              >
                <Crown className="h-4 w-4 mr-2" />
                Acesso Admin
              </Button>
              
              <Badge variant="secondary" className="bg-red-100 text-red-700">
                <Globe className="h-4 w-4 mr-1" />
                Multi-país
              </Badge>
              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                <Phone className="h-4 w-4 mr-1" />
                Multi-loja
              </Badge>
              <Badge 
                variant="secondary" 
                className={serverStatus === 'online' ? "bg-green-100 text-green-700" : 
                           serverStatus === 'offline' ? "bg-red-100 text-red-700" : 
                           serverStatus === 'demo' ? "bg-blue-100 text-blue-700" :
                           "bg-yellow-100 text-yellow-700"}
              >
                {serverStatus === 'online' ? <CheckCircle className="h-4 w-4 mr-1" /> : 
                 serverStatus === 'offline' ? <XCircle className="h-4 w-4 mr-1" /> : 
                 serverStatus === 'demo' ? <Star className="h-4 w-4 mr-1" /> :
                 <div className="h-4 w-4 mr-1 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />}
                {serverStatus === 'checking' ? 'Conectando...' : 
                 serverStatus === 'online' ? 'Online' : 
                 serverStatus === 'offline' ? 'Offline' : 'Modo Demo'}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Status Alerts */}
        {serverStatus === 'checking' && (
          <Alert className="mb-8 border-yellow-200 bg-yellow-50">
            <div className="h-4 w-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
            <AlertDescription>
              <strong>Verificando Conexão:</strong> Conectando ao servidor e verificando credenciais...
            </AlertDescription>
          </Alert>
        )}

        {serverStatus === 'offline' && (
          <Alert className="mb-8 border-red-200 bg-red-50">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Sistema Temporariamente Indisponível:</strong> O servidor está offline. 
              O sistema funcionará em modo demo com dados locais.
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2"
                onClick={checkServerHealth}
              >
                Tentar Conectar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {serverStatus === 'online' && (
          <Alert className="mb-8 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>🚀 Sistema Online e Funcional:</strong> Conectado ao servidor Supabase com dados reais.
              <br />
              <strong>Para teste:</strong> Use cliente@teste.com ou +258841234567
              <br />
              <strong>✨ Recursos:</strong> 150 produtos • Scanner de código de barras • Vendas reais • Sistema de pontos funcional • Atualizações em tempo real
            </AlertDescription>
          </Alert>
        )}
        
        {serverStatus === 'demo' && (
          <Alert className="mb-8 border-blue-200 bg-blue-50">
            <Star className="h-4 w-4" />
            <AlertDescription>
              <strong>📦 Modo Demo Ativo:</strong> Sistema funcionando com dados simulados locais.
              <br />
              <strong>Para teste:</strong> Use cliente@teste.com ou +258841234567
              <br />
              <strong>🚀 Recursos:</strong> 150 produtos • Scanner de código de barras • Vendas reais • Sistema de pontos funcional • Relatórios completos
              <br />
              <strong>💡 Para conectar ao Supabase:</strong> Adicione suas credenciais nas variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
            </AlertDescription>
          </Alert>
        )}

        {/* Access Instructions for Employees */}
        {!detectedAccessType && (
          <Alert className="mb-8 border-purple-200 bg-purple-50">
            <Crown className="h-4 w-4" />
            <AlertDescription>
              <strong>👥 Para Funcionários:</strong> Links de acesso são gerados pelo administrador da loja.
              <br />
              <strong>🔗 Caixas:</strong> Use o link fornecido pelo seu supervisor para acessar o sistema de vendas
              <br />
              <strong>👑 Administradores:</strong> Clique no botão "Acesso Admin" acima para fazer login
            </AlertDescription>
          </Alert>
        )}

        {/* Hero Section - Enhanced */}
        <div className="text-center mb-16">
          <div className="relative flex justify-center mb-8">
            <div className="absolute -inset-4 bg-gradient-to-r from-red-600 to-red-500 rounded-full opacity-20 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-red-600 to-red-700 p-6 rounded-full shadow-2xl">
              <Star className="h-20 w-20 text-white fill-white animate-pulse" />
            </div>
          </div>
          <h2 className="text-5xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
            Ganhe Estrelas, Economize Sempre
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Acumule pontos em todas as suas compras e troque por descontos incríveis. 
            Um sistema completo de fidelização que funciona em múltiplas lojas e países.
          </p>
          
          {/* Key Benefits */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-red-100">
              <span className="text-red-600 font-semibold">✨ 1 Ponto = 1 MZN de Desconto</span>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-blue-100">
              <span className="text-blue-600 font-semibold">🌍 Funciona em Múltiplas Lojas</span>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-green-100">
              <span className="text-green-600 font-semibold">📱 Atualização em Tempo Real</span>
            </div>
          </div>
        </div>

        {/* Customer Access - Enhanced Main CTA */}
        <div className="max-w-2xl mx-auto mb-16">
          <Card className="group hover:shadow-2xl transition-all duration-500 border-2 border-red-200 hover:border-red-300 bg-gradient-to-br from-red-50 via-white to-red-50 overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-200/30 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-red-100/40 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
            
            <CardHeader className="text-center pb-6 relative z-10">
              <div className="mx-auto mb-6 p-8 bg-gradient-to-br from-red-600 to-red-700 rounded-full group-hover:from-red-700 group-hover:to-red-800 transition-all duration-300 shadow-2xl group-hover:shadow-red-200">
                <Star className="h-20 w-20 text-white fill-white" />
              </div>
              <CardTitle className="text-3xl text-gray-900 mb-3 font-bold">Acesso do Cliente</CardTitle>
              <CardDescription className="text-xl text-gray-600">
                Consulte seus pontos, histórico de compras e resgate benefícios
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 relative z-10">
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-8 mb-8 border border-red-100 shadow-lg">
                <h4 className="font-bold text-gray-900 mb-6 flex items-center justify-center text-lg">
                  <UserCheck className="h-6 w-6 text-red-600 mr-3" />
                  Suas Funcionalidades
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-yellow-100 p-2 rounded-lg">
                      <Star className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Saldo de Pontos</p>
                      <p className="text-sm text-gray-600">Por loja e país</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Histórico Completo</p>
                      <p className="text-sm text-gray-600">Todas as compras</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Resgate Instantâneo</p>
                      <p className="text-sm text-gray-600">Desconto na hora</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Globe className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Multi-plataforma</p>
                      <p className="text-sm text-gray-600">Várias lojas e países</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => setCurrentRoute('customer')}
                className="w-full h-16 text-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 font-bold"
              >
                <Star className="h-6 w-6 mr-3 animate-pulse" />
                Acessar Minha Conta de Cliente
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Points System Preview - Simplified */}
        <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-3xl p-12 text-white shadow-2xl mb-16 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          
          <div className="relative z-10">
            <h3 className="text-4xl font-bold text-center mb-4">Como Funciona o Sistema de Pontos</h3>
            <p className="text-center text-red-100 mb-12 text-xl max-w-3xl mx-auto">
              Cada compra gera pontos que você pode usar como dinheiro. É simples, rápido e vantajoso!
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
              {[
                { range: '500 - 5K', points: 10 },
                { range: '6K - 13K', points: 20 },
                { range: '14K - 26K', points: 30 },
                { range: '27K - 34K', points: 40 },
                { range: '35K - 42K', points: 50 },
                { range: '43K - 47K', points: 60 },
                { range: '48K+', points: 80 }
              ].map((tier, index) => (
                <Card key={index} className="bg-white/15 border-white/30 text-white backdrop-blur-sm hover:bg-white/20 transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="text-sm font-medium mb-2 text-red-100">{tier.range} MZN</div>
                    <div className="text-3xl font-bold mb-2">{tier.points}</div>
                    <div className="text-sm opacity-90">estrelas</div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto">
                <h4 className="text-2xl font-bold mb-4">💰 Conversão de Pontos</h4>
                <p className="text-xl mb-6">
                  <span className="bg-white/30 px-4 py-2 rounded-full font-bold">1 Ponto = 1 MZN de Desconto</span>
                </p>
                <p className="text-red-100">
                  ✨ Use seus pontos imediatamente • 🛒 Em qualquer compra • 🎯 Sem limite mínimo • 🏪 Em todas as lojas participantes
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-12 text-white">
          <h3 className="text-3xl font-bold mb-6">Pronto para Começar?</h3>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Junte-se aos milhares de clientes que já economizam com o programa Estrela Supermercado
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => setCurrentRoute('customer')}
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-lg px-8 py-4 h-auto"
            >
              <Star className="h-5 w-5 mr-2" />
              Começar Agora
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-2 border-white text-white hover:bg-white hover:text-gray-900 text-lg px-8 py-4 h-auto"
              onClick={() => {
                const element = document.querySelector('header');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Saiba Mais
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}