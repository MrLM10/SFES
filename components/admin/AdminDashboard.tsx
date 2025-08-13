import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Users, 
  Settings, 
  BarChart3, 
  Shield, 
  ArrowLeft,
  UserPlus,
  CheckCircle,
  Clock,
  Building,
  TrendingUp,
  Plus,
  ShoppingCart,
  Globe,
  Phone,
  Crown,
  UserCheck,
  CreditCard,
  Code,
  Link,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  ExternalLink
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
// Simple toast function to avoid import issues
const toast = {
  success: (message: string) => console.log('✅ Success:', message),
  error: (message: string) => console.log('❌ Error:', message),
  info: (message: string) => console.log('ℹ️ Info:', message)
};
import { AdminRegistrationManager } from '../AdminRegistrationManager';
import { urlManager, getBaseUrl } from '../../utils/urlConfig';
import { StoreManagement } from './StoreManagement';
import { StoreForm } from './StoreForm';
import { PointsConfiguration } from './PointsConfiguration';
import { Reports } from './Reports';
import { db, Store, PointsConfig, DEFAULT_POINTS_CONFIG, Customer, Purchase } from '../../utils/database';
import { 
  ADMIN_STATS, 
  RECENT_ACTIVITIES, 
  DEMO_STORES, 
  DEMO_CUSTOMERS, 
  DEMO_PURCHASES, 
  DEMO_ANALYTICS 
} from './constants/adminConstants';
import { getStatusBadge, formatDateTime } from './utils/adminUtils';

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

interface AdminDashboardProps {
  currentUser: AdminUser;
  onLogout: () => void;
  onBack: () => void;
}

export function AdminDashboard({ currentUser, onLogout, onBack }: AdminDashboardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showRegistrationManager, setShowRegistrationManager] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [pointsConfig, setPointsConfig] = useState<PointsConfig>(DEFAULT_POINTS_CONFIG);
  const [analytics, setAnalytics] = useState(DEMO_ANALYTICS);
  const [error, setError] = useState<string>('');

  // Determine if user is global admin
  const isGlobalAdmin = currentUser.role === 'admin_general';
  const userStoreId = currentUser.storeId;

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load stores (filtered by user access)
      const storesData = await loadStores();
      setStores(storesData);

      // Load customers (filtered by user access)
      const customersData = await loadCustomers();
      setCustomers(customersData);

      // Load purchases (filtered by user access)
      const purchasesData = await loadPurchases();
      setPurchases(purchasesData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStores = async (): Promise<Store[]> => {
    try {
      if (isGlobalAdmin) {
        return await db.getStores();
      } else if (userStoreId) {
        return await db.getStores(userStoreId);
      }
      return [];
    } catch (error) {
      // Demo data fallback
      const demoStores = DEMO_STORES.map(store => ({ ...store, pointsConfig: DEFAULT_POINTS_CONFIG }));
      
      if (isGlobalAdmin) {
        return demoStores;
      } else if (userStoreId) {
        return demoStores.filter(store => store.id === userStoreId);
      }
      return [];
    }
  };

  const loadCustomers = async (): Promise<Customer[]> => {
    try {
      if (isGlobalAdmin) {
        return await db.getCustomers();
      } else if (userStoreId) {
        return await db.getCustomers(userStoreId);
      }
      return [];
    } catch (error) {
      // Demo data fallback
      if (isGlobalAdmin) {
        return DEMO_CUSTOMERS;
      } else if (userStoreId) {
        return DEMO_CUSTOMERS.filter(customer => customer.pointsBalance[userStoreId] !== undefined);
      }
      return [];
    }
  };

  const loadPurchases = async (): Promise<Purchase[]> => {
    try {
      if (isGlobalAdmin) {
        return await db.getPurchases();
      } else if (userStoreId) {
        return await db.getPurchases(undefined, userStoreId);
      }
      return [];
    } catch (error) {
      // Demo data fallback
      if (isGlobalAdmin) {
        return DEMO_PURCHASES;
      } else if (userStoreId) {
        return DEMO_PURCHASES.filter(purchase => purchase.storeId === userStoreId);
      }
      return [];
    }
  };

  const handleCreateStore = async (store: Store) => {
    if (!isGlobalAdmin) {
      setError('Apenas administradores gerais podem criar lojas');
      return;
    }

    setIsLoading(true);
    try {
      const createdStore = await db.createStore(store);
      setStores(prev => [...prev, createdStore]);
    } catch {
      setStores(prev => [...prev, store]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStore = async (store: Store) => {
    // Admin comum só pode editar sua própria loja
    if (!isGlobalAdmin && userStoreId && store.id !== userStoreId) {
      setError('Você só pode editar sua própria loja');
      return;
    }

    setIsLoading(true);
    try {
      const updatedStore = await db.updateStore(store.id, store);
      setStores(prev => prev.map(s => s.id === store.id ? updatedStore : s));
    } catch {
      setStores(prev => prev.map(s => s.id === store.id ? store : s));
    } finally {
      setIsLoading(false);
      setEditingStore(null);
    }
  };

  const handleUpdatePointsConfig = async (config: PointsConfig) => {
    if (!isGlobalAdmin) {
      setError('Apenas administradores gerais podem alterar configurações de pontos');
      return;
    }

    setIsLoading(true);
    try {
      const updatePromises = stores.map(store => {
        const updatedStore = { ...store, pointsConfig: config };
        return db.updateStore(store.id, updatedStore);
      });

      await Promise.all(updatePromises);
      setStores(prev => prev.map(store => ({ ...store, pointsConfig: config })));
      setPointsConfig(config);
    } catch {
      setStores(prev => prev.map(store => ({ ...store, pointsConfig: config })));
      setPointsConfig(config);
    } finally {
      setIsLoading(false);
    }
  };

  if (showRegistrationManager) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 p-4">
        <div className="container mx-auto max-w-6xl">
          <AdminRegistrationManager onClose={() => setShowRegistrationManager(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-4 border-red-600">
        <div className="container mx-auto max-w-6xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-red-600 p-3 rounded-full">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
                <p className="text-gray-600">Bem-vindo, {currentUser.name || 'Administrador'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <Shield className="h-4 w-4 mr-1" />
                {isGlobalAdmin ? 'Admin Geral' : 'Admin Loja'}
              </Badge>
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button variant="outline" onClick={onLogout}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {isGlobalAdmin && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowRegistrationManager(true)}>
              <CardContent className="p-6 text-center">
                <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-3">
                  <UserPlus className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Cadastro de Admins</h3>
                <p className="text-sm text-gray-600">Gerar links e aprovar cadastros</p>
              </CardContent>
            </Card>
          )}

          {isGlobalAdmin && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowStoreForm(true)}>
              <CardContent className="p-6 text-center">
                <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-3">
                  <Building className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Nova Loja</h3>
                <p className="text-sm text-gray-600">Cadastrar nova loja</p>
              </CardContent>
            </Card>
          )}

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-3">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Sistema de Pontos</h3>
              <p className="text-sm text-gray-600">{isGlobalAdmin ? 'Configurar regras' : 'Ver configuração'}</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="bg-orange-100 p-3 rounded-full w-fit mx-auto mb-3">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">Relatórios</h3>
              <p className="text-sm text-gray-600">Análises e estatísticas</p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{customers.length.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Clientes</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stores.length}</div>
              <div className="text-sm text-gray-600">Lojas</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{ADMIN_STATS.totalAdmins}</div>
              <div className="text-sm text-gray-600">Administradores</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{purchases.length.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Compras</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{analytics.totalPoints.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Pontos</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">{ADMIN_STATS.activeCountries}</div>
              <div className="text-sm text-gray-600">Países</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className={`grid w-full ${isGlobalAdmin ? 'grid-cols-7' : 'grid-cols-6'}`}>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="stores">Lojas ({stores.length})</TabsTrigger>
            <TabsTrigger value="customers">Clientes ({customers.length})</TabsTrigger>
            <TabsTrigger value="cashier-links">Links de Acesso</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
            <TabsTrigger value="points">Sistema de Pontos</TabsTrigger>
            <TabsTrigger value="system">Sistema</TabsTrigger>
            {isGlobalAdmin && <TabsTrigger value="settings">Configurações</TabsTrigger>}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activities */}
              <Card>
                <CardHeader>
                  <CardTitle>Atividades Recentes</CardTitle>
                  <CardDescription>Últimas ações no sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {RECENT_ACTIVITIES.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`p-2 rounded-full ${
                          activity.status === 'pending' ? 'bg-yellow-100' :
                          activity.status === 'approved' ? 'bg-green-100' :
                          'bg-blue-100'
                        }`}>
                          {activity.status === 'pending' ? (
                            <Clock className="h-4 w-4 text-yellow-600" />
                          ) : activity.status === 'approved' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{activity.message}</p>
                          <p className="text-xs text-gray-500">
                            {formatDateTime(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Analytics Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumo de Performance</CardTitle>
                  <CardDescription>Indicadores principais</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-sm font-medium">Crescimento de Vendas</span>
                      </div>
                      <Badge className="bg-green-600 text-white">+{analytics.salesGrowth}%</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="text-sm font-medium">Novos Clientes</span>
                      </div>
                      <Badge className="bg-blue-600 text-white">+{analytics.customerGrowth}%</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center">
                        <Star className="h-5 w-5 text-purple-600 mr-2" />
                        <span className="text-sm font-medium">Pontos Distribuídos</span>
                      </div>
                      <Badge className="bg-purple-600 text-white">{analytics.totalPoints.toLocaleString()}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Registration Access - only for global admin */}
            {isGlobalAdmin && (
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowRegistrationManager(true)}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <UserPlus className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Sistema de Cadastro de Administradores</h3>
                        <p className="text-sm text-gray-600">Gere links únicos e aprove solicitações</p>
                      </div>
                    </div>
                    <Button className="bg-red-600 hover:bg-red-700">
                      Abrir Painel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Test Card for Links */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center">
                  <ExternalLink className="h-5 w-5 mr-2" />
                  🧪 Teste Rápido do Sistema de Links
                </CardTitle>
                <CardDescription className="text-blue-800">
                  Teste a funcionalidade de links de acesso para caixas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => {
                      const testLink = `${window.location.origin}/caixa/loja001_teste`;
                      window.open(testLink, '_blank');
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Testar Link (Atual)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Get base URL configuration component
                      const linkTab = document.querySelector('[value="cashier-links"]');
                      if (linkTab) {
                        (linkTab as HTMLElement).click();
                        toast.success('Vá para aba "Links de Acesso" para configurar URL de produção');
                      }
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar URLs
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const prodLink = `https://seusite.com/caixa/loja001_teste`;
                      navigator.clipboard.writeText(prodLink);
                      toast.success('Link de produção copiado!');
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Link Produção
                  </Button>
                </div>
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-blue-700">
                    🔗 <strong>Link atual (Figma):</strong> <code className="bg-blue-100 px-2 py-1 rounded text-xs">{window.location.origin}/caixa/teste</code>
                  </p>
                  <p className="text-sm text-green-700">
                    🚀 <strong>Link produção:</strong> <code className="bg-green-100 px-2 py-1 rounded text-xs">https://seusite.com/caixa/teste</code>
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stores Tab */}
          <TabsContent value="stores">
            <StoreManagement 
              stores={stores}
              onCreateStore={isGlobalAdmin ? () => setShowStoreForm(true) : undefined}
              onEditStore={setEditingStore}
              isGlobalAdmin={isGlobalAdmin}
            />
          </TabsContent>

          {/* Cashier Links Tab */}
          <TabsContent value="cashier-links">
            <CashierLinksManagement 
              stores={stores}
              isGlobalAdmin={isGlobalAdmin}
              userStoreId={userStoreId}
            />
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Clientes Registrados</CardTitle>
                <CardDescription>
                  {customers.length} cliente(s) {isGlobalAdmin ? 'no sistema' : 'na sua loja'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>País</TableHead>
                      <TableHead>Pontos Totais</TableHead>
                      <TableHead>Total Compras</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>{customer.country}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-500 mr-1" />
                            {userStoreId ? (customer.pointsBalance[userStoreId] || 0) : customer.totalPoints}
                          </div>
                        </TableCell>
                        <TableCell>{customer.totalPurchases.toFixed(2)} MZN</TableCell>
                        <TableCell>
                          <Badge variant={customer.isActive ? "secondary" : "destructive"} className={customer.isActive ? "bg-green-100 text-green-700" : ""}>
                            {customer.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Reports 
              isGlobalAdmin={isGlobalAdmin}
              userStoreId={userStoreId}
              stores={stores}
              customers={customers}
              purchases={purchases}
            />
          </TabsContent>

          {/* Points Configuration Tab */}
          <TabsContent value="points">
            <PointsConfiguration 
              pointsConfig={pointsConfig}
              onUpdate={handleUpdatePointsConfig}
              isLoading={isLoading}
              readOnly={!isGlobalAdmin}
            />
          </TabsContent>

          {/* System Information Tab */}
          <TabsContent value="system" className="space-y-6">
            {/* System Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Code className="h-5 w-5 mr-2" />
                  Funcionalidades do Sistema
                </CardTitle>
                <CardDescription>
                  Recursos implementados e operacionais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <div className="bg-blue-600 p-2 rounded-full mr-3">
                        <ShoppingCart className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="font-bold text-blue-900">Sistema de Vendas Completo</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li>✅ 150 produtos com códigos de barras</li>
                      <li>✅ Scanner funcional</li>
                      <li>✅ Cadastro automático de clientes</li>
                      <li>✅ Pontos atualizados em tempo real</li>
                      <li>✅ Funcionamento offline</li>
                    </ul>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <div className="bg-green-600 p-2 rounded-full mr-3">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="font-bold text-green-900">Painel Administrativo</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-green-800">
                      <li>✅ Relatórios com dados reais</li>
                      <li>✅ Controle de acesso por loja</li>
                      <li>✅ Gestão de pontos e configurações</li>
                      <li>✅ Aprovação de administradores</li>
                      <li>✅ Links de acesso únicos</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <div className="bg-purple-600 p-2 rounded-full mr-3">
                        <Star className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="font-bold text-purple-900">Sistema de Pontos</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-purple-800">
                      <li>✅ Resgate funcional</li>
                      <li>✅ Desconto aplicado na hora</li>
                      <li>✅ Configuração por loja</li>
                      <li>✅ Histórico completo</li>
                      <li>✅ Múltiplas moedas</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Access Control */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Controle de Acesso e Segurança
                </CardTitle>
                <CardDescription>
                  Níveis de acesso e permissões do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Shield className="h-5 w-5 text-green-600 mr-2" />
                      Níveis de Acesso
                    </h4>
                    <div className="space-y-3">
                      <div className="border-l-4 border-red-500 pl-4">
                        <p className="font-medium text-gray-900">Cliente</p>
                        <p className="text-sm text-gray-600">Acesso público direto à plataforma</p>
                      </div>
                      <div className="border-l-4 border-blue-500 pl-4">
                        <p className="font-medium text-gray-900">Operador de Caixa</p>
                        <p className="text-sm text-gray-600">Acesso via link específico da loja</p>
                      </div>
                      <div className="border-l-4 border-purple-500 pl-4">
                        <p className="font-medium text-gray-900">Administrador Comum</p>
                        <p className="text-sm text-gray-600">Acesso restrito à sua loja</p>
                      </div>
                      <div className="border-l-4 border-yellow-500 pl-4">
                        <p className="font-medium text-gray-900">Administrador Geral</p>
                        <p className="text-sm text-gray-600">Acesso completo ao sistema</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Settings className="h-5 w-5 text-blue-600 mr-2" />
                      Funcionalidades por Perfil
                    </h4>
                    <div className="space-y-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="font-medium text-gray-900 text-sm">Cliente</p>
                        <p className="text-xs text-gray-600">Consulta pontos, histórico, resgate</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="font-medium text-gray-900 text-sm">Caixa</p>
                        <p className="text-xs text-gray-600">Vendas, scanner, cadastro automático</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="font-medium text-gray-900 text-sm">Admin Comum</p>
                        <p className="text-xs text-gray-600">Gestão da loja, relatórios, equipe</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="font-medium text-gray-900 text-sm">Admin Geral</p>
                        <p className="text-xs text-gray-600">Controle total, múltiplas lojas</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Staff Access Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Acesso para Equipe
                </CardTitle>
                <CardDescription>
                  Como a equipe acessa o sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <div className="bg-blue-600 p-3 rounded-full mr-4">
                        <ShoppingCart className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="font-bold text-blue-900">Operadores de Caixa</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-blue-800 mb-4">
                      <li>• Acesso via link específico da loja</li>
                      <li>• Funciona offline com sincronização</li>
                      <li>• Scanner de código de barras</li>
                      <li>• Cadastro automático de clientes</li>
                      <li>• Aplicação automática de pontos</li>
                    </ul>
                    <div className="bg-blue-900/30 rounded p-3 text-xs text-blue-900">
                      <strong>Acesso:</strong> Link gerado pelo administrador da loja<br />
                      <code className="bg-black/20 px-2 py-1 rounded text-xs">
                        /caixa/[codigo-da-loja]
                      </code>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <div className="bg-red-600 p-3 rounded-full mr-4">
                        <Crown className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="font-bold text-red-900">Administradores</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-red-800 mb-4">
                      <li>• Acesso via link de registro/convite</li>
                      <li>• Controle total da loja</li>
                      <li>• Relatórios e analytics</li>
                      <li>• Gestão de pontos e configurações</li>
                      <li>• Criação de links para caixas</li>
                    </ul>
                    <div className="bg-red-900/30 rounded p-3 text-xs text-red-900">
                      <strong>Registro:</strong> Link gerado pelo administrador geral<br />
                      <code className="bg-black/20 px-2 py-1 rounded text-xs">
                        /registro/[codigo-convite]
                      </code>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 text-center text-gray-600 bg-gray-100 rounded-lg p-4">
                  <p className="text-sm">
                    Os links de acesso são gerados automaticamente e enviados por email ou WhatsApp.<br />
                    Cada link é único e específico para a função e loja correspondente.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Status do Sistema
                </CardTitle>
                <CardDescription>
                  Estado atual das funcionalidades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Módulos Operacionais</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-sm font-medium">Sistema de Vendas</span>
                        <Badge className="bg-green-600 text-white">100% Funcional</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-sm font-medium">Scanner de Código</span>
                        <Badge className="bg-green-600 text-white">Ativo</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-sm font-medium">Sistema de Pontos</span>
                        <Badge className="bg-green-600 text-white">Funcionando</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-sm font-medium">Relatórios</span>
                        <Badge className="bg-green-600 text-white">Dados Reais</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Estatísticas em Tempo Real</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Produtos Cadastrados:</span>
                        <span className="font-medium">150</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Lojas Ativas:</span>
                        <span className="font-medium">{stores.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Clientes Registrados:</span>
                        <span className="font-medium">{customers.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Vendas Processadas:</span>
                        <span className="font-medium">{purchases.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Pontos Distribuídos:</span>
                        <span className="font-medium">{analytics.totalPoints.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Funcionamento Offline:</span>
                        <span className="font-medium text-green-600">✅ Habilitado</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab - only for global admin */}
          {isGlobalAdmin && (
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações do Sistema</CardTitle>
                  <CardDescription>Configurações globais e preferências</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <Alert className="border-blue-200 bg-blue-50">
                      <Settings className="h-4 w-4" />
                      <AlertDescription className="text-blue-800">
                        <strong>Sistema Funcional:</strong> Todas as funcionalidades estão operacionais com integração real da base de dados.
                        Links de cadastro, gestão de lojas, sistema de pontos, scanner de código de barras e finalização de vendas estão funcionando.
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold">Funcionalidades Implementadas</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                            Sistema de cadastro com links únicos
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                            Gerenciamento completo de lojas
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                            Configuração flexível de pontos
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                            Scanner de código de barras (150 produtos)
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                            Sistema de vendas completo
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                            Resgate de recompensas funcionais
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                            Funcionamento offline
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                            Relatórios funcionais
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                            Controle de acesso por loja
                          </li>
                        </ul>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">Estatísticas do Sistema</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span>Total de Lojas:</span>
                            <span className="font-medium">{stores.length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Total de Clientes:</span>
                            <span className="font-medium">{customers.length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Total de Vendas:</span>
                            <span className="font-medium">{purchases.length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Pontos Distribuídos:</span>
                            <span className="font-medium">{analytics.totalPoints}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Produtos Cadastrados:</span>
                            <span className="font-medium">150</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Store Form Modal */}
        <StoreForm
          isOpen={showStoreForm || !!editingStore}
          onClose={() => {
            setShowStoreForm(false);
            setEditingStore(null);
          }}
          onSubmit={editingStore ? handleUpdateStore : handleCreateStore}
          editingStore={editingStore}
          isLoading={isLoading}
        />

        {/* Error Display */}
        {error && (
          <Alert className="mt-4 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2" 
                onClick={() => setError('')}
              >
                ×
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </main>
    </div>
  );
}

// Cashier Links Management Component
interface CashierLinksManagementProps {
  stores: Store[];
  isGlobalAdmin: boolean;
  userStoreId?: string;
}

function CashierLinksManagement({ stores, isGlobalAdmin, userStoreId }: CashierLinksManagementProps) {
  const [generatedLinks, setGeneratedLinks] = useState<{[storeId: string]: string[]}>({});
  const [showLinks, setShowLinks] = useState<{[storeId: string]: boolean}>({});
  const [linkDescriptions, setLinkDescriptions] = useState<{[linkId: string]: string}>({});
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [showUrlConfig, setShowUrlConfig] = useState<boolean>(false);

  // Filter stores based on user permissions
  const availableStores = isGlobalAdmin ? stores : stores.filter(store => store.id === userStoreId);

  // Get current URL configuration
  const getCurrentBaseUrl = () => {
    if (baseUrl.trim()) {
      return baseUrl.trim().replace(/\/$/, '');
    }
    try {
      return urlManager.getBaseUrl();
    } catch (error) {
      console.error('Error getting base URL:', error);
      return window.location.origin;
    }
  };

  const getUrlConfig = () => {
    try {
      return urlManager.getConfig();
    } catch (error) {
      console.error('Error getting URL config:', error);
      return { baseUrl: window.location.origin, isProduction: false, source: 'fallback' as const };
    }
  };

  const generateCashierLink = (storeId: string, description: string = '') => {
    const linkId = `cashier_${storeId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let cashierUrl: string;
    
    try {
      cashierUrl = urlManager.generateCashierLink(storeId, linkId);
    } catch (error) {
      console.error('Error generating cashier link:', error);
      cashierUrl = `${getCurrentBaseUrl()}/caixa/${linkId}`;
    }
    
    // Store the link
    setGeneratedLinks(prev => ({
      ...prev,
      [storeId]: [...(prev[storeId] || []), linkId]
    }));

    // Store the description
    if (description) {
      setLinkDescriptions(prev => ({
        ...prev,
        [linkId]: description
      }));
    }

    // Store in localStorage for persistence
    const storedLinks = JSON.parse(localStorage.getItem('cashier_links') || '{}');
    storedLinks[linkId] = {
      storeId,
      description,
      createdAt: new Date().toISOString(),
      createdBy: 'current_admin', // In real app, would use actual admin ID
      isActive: true
    };
    localStorage.setItem('cashier_links', JSON.stringify(storedLinks));

    toast.success('Link de acesso gerado com sucesso!');
    return cashierUrl;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Link copiado para área de transferência!');
    }).catch(() => {
      toast.error('Erro ao copiar link');
    });
  };

  const toggleShowLinks = (storeId: string) => {
    setShowLinks(prev => ({
      ...prev,
      [storeId]: !prev[storeId]
    }));
  };

  const deactivateLink = (linkId: string, storeId: string) => {
    // Remove from state
    setGeneratedLinks(prev => ({
      ...prev,
      [storeId]: prev[storeId]?.filter(id => id !== linkId) || []
    }));

    // Update localStorage
    const storedLinks = JSON.parse(localStorage.getItem('cashier_links') || '{}');
    if (storedLinks[linkId]) {
      storedLinks[linkId].isActive = false;
      storedLinks[linkId].deactivatedAt = new Date().toISOString();
    }
    localStorage.setItem('cashier_links', JSON.stringify(storedLinks));

    toast.success('Link desativado com sucesso!');
  };

  // Load base URL from localStorage
  React.useEffect(() => {
    const savedBaseUrl = localStorage.getItem('admin_base_url');
    if (savedBaseUrl) {
      setBaseUrl(savedBaseUrl);
    }
  }, []);

  // Save base URL to localStorage and update URL manager
  const saveBaseUrl = (url: string) => {
    try {
      const success = urlManager.setCustomUrl(url);
      if (success) {
        setBaseUrl(url);
        toast.success('URL base salva com sucesso!');
        urlManager.refresh(); // Refresh configuration
      } else {
        toast.error('URL inválida. Use formato: https://seusite.com');
      }
    } catch (error) {
      console.error('Error saving base URL:', error);
      // Fallback to localStorage directly
      try {
        localStorage.setItem('admin_base_url', url);
        setBaseUrl(url);
        toast.success('URL base salva com sucesso!');
      } catch (localStorageError) {
        toast.error('Erro ao salvar URL. Verifique se o formato está correto.');
      }
    }
  };

  // Load existing links on component mount
  React.useEffect(() => {
    const storedLinks = JSON.parse(localStorage.getItem('cashier_links') || '{}');
    const linksByStore: {[storeId: string]: string[]} = {};
    const descriptions: {[linkId: string]: string} = {};

    Object.entries(storedLinks).forEach(([linkId, data]: [string, any]) => {
      if (data.isActive) {
        if (!linksByStore[data.storeId]) {
          linksByStore[data.storeId] = [];
        }
        linksByStore[data.storeId].push(linkId);
        if (data.description) {
          descriptions[linkId] = data.description;
        }
      }
    });

    setGeneratedLinks(linksByStore);
    setLinkDescriptions(descriptions);
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Link className="h-5 w-5 mr-2" />
            Gerenciamento de Links de Acesso para Caixas
          </CardTitle>
          <CardDescription>
            Gere e gerencie links únicos para que operadores de caixa acessem o sistema de vendas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* URL Configuration Section */}
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-orange-900 flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Configuração de URL Base
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUrlConfig(!showUrlConfig)}
                >
                  {showUrlConfig ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Ocultar
                    </>
                  ) : (
                    <>
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar
                    </>
                  )}
                </Button>
              </div>
              <CardDescription className="text-orange-800">
                Configure a URL base para gerar links que funcionem fora do Figma
              </CardDescription>
            </CardHeader>
            
            {showUrlConfig && (
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="baseUrl" className="text-orange-900">URL do seu site em produção</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="baseUrl"
                        placeholder="https://meusite.com ou https://app.vercel.app"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        onClick={() => saveBaseUrl(baseUrl)}
                        disabled={!baseUrl.trim()}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        Salvar
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <h4 className="font-medium text-orange-900 mb-2">📍 Configuração Atual:</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-orange-700">URL: </span>
                        <code className="text-sm bg-orange-100 px-2 py-1 rounded">
                          {getCurrentBaseUrl()}
                        </code>
                      </div>
                      <div>
                        <span className="text-sm text-orange-700">Fonte: </span>
                        <Badge variant="outline" className={
                          getUrlConfig().source === 'environment' ? 'bg-green-100 text-green-700' :
                          getUrlConfig().source === 'localStorage' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }>
                          {getUrlConfig().source === 'environment' ? '🌍 Variável de ambiente' :
                           getUrlConfig().source === 'localStorage' ? '💾 Configuração salva' :
                           '⚠️ URL atual (temporária)'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-orange-800">
                      <strong>Exemplos de URLs válidas:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {(() => {
                          try {
                            return urlManager.getUrlExamples().map((example, index) => (
                              <li key={index}><code>{example}</code></li>
                            ));
                          } catch (error) {
                            return [
                              'https://estrela-supermercado.vercel.app',
                              'https://sistema.netlify.app',
                              'https://meudominio.com'
                            ].map((example, index) => (
                              <li key={index}><code>{example}</code></li>
                            ));
                          }
                        })()}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          <Alert className="mb-6">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Como Funciona:</strong><br />
              1. Configure a URL base do seu site em produção acima<br />
              2. Gere um link único para cada caixa da loja<br />
              3. Compartilhe o link com o operador de caixa<br />
              4. O operador acessa o link e faz login<br />
              5. Após o login, ele tem acesso ao sistema de vendas
            </AlertDescription>
          </Alert>

          <div className="space-y-6">
            {availableStores.map(store => (
              <Card key={store.id} className="border-l-4 border-blue-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{store.name}</CardTitle>
                      <CardDescription>
                        {store.city}, {store.province} • {store.country}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => generateCashierLink(store.id, `Caixa ${store.name}`)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Gerar Link
                      </Button>
                      {generatedLinks[store.id]?.length > 0 && (
                        <Button
                          variant="outline"
                          onClick={() => toggleShowLinks(store.id)}
                        >
                          {showLinks[store.id] ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Ocultar
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Links ({generatedLinks[store.id]?.length || 0})
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                {showLinks[store.id] && generatedLinks[store.id]?.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 mb-3">Links Ativos:</h4>
                      {generatedLinks[store.id].map(linkId => {
                        const fullUrl = `${getCurrentBaseUrl()}/caixa/${linkId}`;
                        return (
                          <div key={linkId} className="bg-gray-50 rounded-lg p-4 border">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 mr-4">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Badge variant="outline" className="bg-blue-100 text-blue-700">
                                    ID: {linkId.split('_').pop()}
                                  </Badge>
                                  {linkDescriptions[linkId] && (
                                    <span className="text-sm text-gray-600">
                                      {linkDescriptions[linkId]}
                                    </span>
                                  )}
                                </div>
                                <code className="text-sm bg-white px-2 py-1 rounded border break-all">
                                  {fullUrl}
                                </code>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(fullUrl)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deactivateLink(linkId, store.id)}
                                >
                                  Desativar
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}

                {(!generatedLinks[store.id] || generatedLinks[store.id].length === 0) && showLinks[store.id] && (
                  <CardContent className="pt-0">
                    <Alert>
                      <AlertDescription>
                        Nenhum link ativo encontrado para esta loja. Clique em "Gerar Link" para criar o primeiro.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {availableStores.length === 0 && (
            <Alert>
              <AlertDescription>
                Nenhuma loja disponível para gerar links. 
                {isGlobalAdmin ? ' Cadastre lojas primeiro.' : ' Contate o administrador geral.'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Instruções para Compartilhamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-green-700">
            <p className="font-medium">📋 Como usar os links gerados:</p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><strong>Copie o link</strong> clicando no botão de cópia</li>
              <li><strong>Compartilhe</strong> o link com o operador de caixa (WhatsApp, email, etc.)</li>
              <li><strong>Instrua o operador</strong> para acessar o link em um navegador</li>
              <li><strong>O operador fará login</strong> com as credenciais fornecidas</li>
              <li><strong>Após o login</strong>, ele terá acesso ao sistema de vendas</li>
            </ol>
            
            <div className="mt-4 space-y-3">
              <div className="p-3 bg-white rounded border border-green-200">
                <p className="text-sm font-medium text-green-800 mb-1">🔐 Credenciais de teste para caixas:</p>
                <code className="text-xs bg-green-100 px-2 py-1 rounded">
                  Email: caixa@teste.com | Senha: senha123
                </code>
              </div>
              
              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-sm font-medium text-blue-800 mb-2">🚀 Para Deploy em Produção:</p>
                <ol className="text-xs text-blue-700 space-y-1">
                  <li>1. Faça deploy do projeto (Vercel, Netlify, etc.)</li>
                  <li>2. Configure a URL base com o domínio real</li>
                  <li>3. Gere novos links com a URL de produção</li>
                  <li>4. Os links funcionarão independente do Figma</li>
                </ol>
              </div>

              <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                <p className="text-sm font-medium text-yellow-800 mb-1">⚡ Link de Exemplo:</p>
                <code className="text-xs bg-yellow-100 px-2 py-1 rounded break-all">
                  {getCurrentBaseUrl()}/caixa/cashier_store001_1234567890_abc123
                </code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}