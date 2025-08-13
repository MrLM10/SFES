import React, { useState } from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';

interface AdminUser {
  id: string;
  email: string;
  role: 'admin_general' | 'admin_comum';
  name?: string;
  country?: string;
  storeId?: string;
  isActive: boolean;
  createdAt: string;
}

interface AdminLoginFormProps {
  onLogin: (user: AdminUser) => void;
  onBack: () => void;
}

export function AdminLoginForm({ onLogin, onBack }: AdminLoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [loginForm, setLoginForm] = useState({
    email: 'admin@teste.com',
    password: 'senha123'
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let user: AdminUser;

      // Demo authentication
      if (loginForm.email === 'admin@teste.com' && loginForm.password === 'senha123') {
        user = {
          id: 'admin-geral-1',
          email: 'admin@teste.com',
          role: 'admin_general',
          name: 'Administrador Geral',
          country: 'Moçambique',
          isActive: true,
          createdAt: new Date().toISOString()
        };
      } else if (loginForm.email === 'admin1@teste.com' && loginForm.password === 'senha123') {
        user = {
          id: 'admin-comum-1',
          email: 'admin1@teste.com',
          role: 'admin_comum',
          name: 'Admin Loja Maputo',
          country: 'Moçambique',
          storeId: 'store-1',
          isActive: true,
          createdAt: new Date().toISOString()
        };
      } else if (loginForm.email === 'admin2@teste.com' && loginForm.password === 'senha123') {
        user = {
          id: 'admin-comum-2',
          email: 'admin2@teste.com',
          role: 'admin_comum',
          name: 'Admin Loja Beira',
          country: 'Moçambique',
          storeId: 'store-2',
          isActive: true,
          createdAt: new Date().toISOString()
        };
      } else {
        throw new Error('Credenciais inválidas');
      }
      
      onLogin(user);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle>Login Administrativo</CardTitle>
          <CardDescription>
            Acesso restrito ao painel de administração
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800">
                <strong>Credenciais de teste:</strong><br />
                <strong>Admin Geral:</strong> admin@teste.com / senha123<br />
                <strong>Admin Loja 1:</strong> admin1@teste.com / senha123<br />
                <strong>Admin Loja 2:</strong> admin2@teste.com / senha123
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-red-600 hover:bg-red-700" 
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}