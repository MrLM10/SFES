import React, { useState } from 'react';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';

// Simple toast function to avoid import issues
const toast = {
  success: (message: string) => console.log('✅ Success:', message),
  error: (message: string) => console.log('❌ Error:', message),
  info: (message: string) => console.log('ℹ️ Info:', message)
};

interface CashierLoginScreenProps {
  storeId: string;
  onLoginSuccess: () => void;
  onBack: () => void;
}

export function CashierLoginScreen({ storeId, onLoginSuccess, onBack }: CashierLoginScreenProps) {
  const [loginForm, setLoginForm] = useState({ email: 'caixa@teste.com', password: 'senha123' });
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginForm.email || !loginForm.password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call for demo
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Demo validation
      if (loginForm.email === 'caixa@teste.com' && loginForm.password === 'senha123') {
        toast.success('Login realizado com sucesso!');
        onLoginSuccess();
      } else {
        toast.error('Credenciais inválidas. Use: caixa@teste.com / senha123');
      }
    } catch (error) {
      toast.error('Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin(e as any);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <header className="bg-white shadow-sm border-b-4 border-blue-600 p-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold">Acesso do Caixa</h1>
          </div>
          <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700">
            Loja: {storeId}
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-md">
        <Card className="shadow-xl border-2 border-blue-100">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 p-4 bg-blue-100 rounded-full">
              <ShoppingCart className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl text-gray-900">Login do Caixa</CardTitle>
            <CardDescription>
              Faça login para acessar o sistema de vendas
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                  onKeyPress={handleKeyPress}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  onKeyPress={handleKeyPress}
                  required
                />
              </div>
              
              <Button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 h-12"
                disabled={isLoading}
              >
                {isLoading && <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Entrar no Sistema
              </Button>
            </form>
            
            <Alert>
              <AlertDescription>
                <strong>Para demonstração:</strong><br />
                Email: caixa@teste.com<br />
                Senha: senha123
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}