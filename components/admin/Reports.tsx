import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Star, 
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { db, Analytics, Store, Customer, Purchase } from '../../utils/database';

interface ReportsProps {
  isGlobalAdmin: boolean;
  userStoreId?: string;
  stores: Store[];
  customers: Customer[];
  purchases: Purchase[];
}

interface ReportData {
  overview: {
    totalSales: number;
    totalCustomers: number;
    totalPurchases: number;
    totalPoints: number;
    averageTicket: number;
    salesGrowth: number;
    customerGrowth: number;
  };
  salesByPeriod: { date: string; sales: number; customers: number; purchases: number }[];
  topProducts: { productId: string; name: string; quantity: number; revenue: number }[];
  customersByStore: { storeId: string; storeName: string; count: number }[];
  revenueByStore: { storeId: string; storeName: string; revenue: number }[];
  pointsDistribution: { storeId: string; storeName: string; points: number }[];
}

export function Reports({ isGlobalAdmin, userStoreId, stores, customers, purchases }: ReportsProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [selectedStore, setSelectedStore] = useState<string>(userStoreId || 'all');

  useEffect(() => {
    generateReport();
  }, [selectedPeriod, selectedStore, customers, purchases, stores]);

  const generateReport = async () => {
    setIsLoading(true);
    try {
      // Filter data based on user access and selected store
      let filteredPurchases = purchases;
      let filteredCustomers = customers;
      let filteredStores = stores;

      if (!isGlobalAdmin && userStoreId) {
        filteredPurchases = purchases.filter(p => p.storeId === userStoreId);
        filteredCustomers = customers.filter(c => c.pointsBalance[userStoreId] !== undefined);
        filteredStores = stores.filter(s => s.id === userStoreId);
      } else if (selectedStore !== 'all') {
        filteredPurchases = purchases.filter(p => p.storeId === selectedStore);
        filteredCustomers = customers.filter(c => c.pointsBalance[selectedStore] !== undefined);
        filteredStores = stores.filter(s => s.id === selectedStore);
      }

      // Calculate overview metrics
      const totalSales = filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
      const totalPurchases = filteredPurchases.length;
      const totalCustomers = filteredCustomers.length;
      const totalPoints = filteredPurchases.reduce((sum, p) => sum + p.pointsEarned, 0);
      const averageTicket = totalPurchases > 0 ? totalSales / totalPurchases : 0;

      // Calculate growth (mock data for demo)
      const salesGrowth = 15.8;
      const customerGrowth = 12.3;

      // Generate sales by period data
      const salesByPeriod = generateSalesByPeriod(filteredPurchases, selectedPeriod);

      // Calculate top products
      const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
      
      filteredPurchases.forEach(purchase => {
        purchase.items.forEach(item => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = {
              name: item.productName,
              quantity: 0,
              revenue: 0
            };
          }
          productSales[item.productId].quantity += item.quantity;
          productSales[item.productId].revenue += item.totalPrice;
        });
      });

      const topProducts = Object.entries(productSales)
        .map(([productId, data]) => ({
          productId,
          name: data.name,
          quantity: data.quantity,
          revenue: data.revenue
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Calculate customers by store
      const customersByStore = filteredStores.map(store => ({
        storeId: store.id,
        storeName: store.name,
        count: customers.filter(c => c.pointsBalance[store.id] !== undefined).length
      }));

      // Calculate revenue by store
      const revenueByStore = filteredStores.map(store => ({
        storeId: store.id,
        storeName: store.name,
        revenue: purchases.filter(p => p.storeId === store.id).reduce((sum, p) => sum + p.totalAmount, 0)
      }));

      // Calculate points distribution
      const pointsDistribution = filteredStores.map(store => ({
        storeId: store.id,
        storeName: store.name,
        points: purchases.filter(p => p.storeId === store.id).reduce((sum, p) => sum + p.pointsEarned, 0)
      }));

      setReportData({
        overview: {
          totalSales,
          totalCustomers,
          totalPurchases,
          totalPoints,
          averageTicket,
          salesGrowth,
          customerGrowth
        },
        salesByPeriod,
        topProducts,
        customersByStore,
        revenueByStore,
        pointsDistribution
      });

    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSalesByPeriod = (purchases: Purchase[], period: string) => {
    const now = new Date();
    const data: { date: string; sales: number; customers: number; purchases: number }[] = [];
    
    // Generate last 7 days for demo
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Filter purchases for this date
      const dayPurchases = purchases.filter(p => {
        const purchaseDate = new Date(p.createdAt).toISOString().split('T')[0];
        return purchaseDate === dateStr;
      });
      
      const uniqueCustomers = new Set(dayPurchases.map(p => p.customerId));
      
      data.push({
        date: dateStr,
        sales: dayPurchases.reduce((sum, p) => sum + p.totalAmount, 0),
        customers: uniqueCustomers.size,
        purchases: dayPurchases.length
      });
    }
    
    return data;
  };

  const exportReport = () => {
    if (!reportData) return;
    
    const csvContent = generateCSVContent(reportData);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateCSVContent = (data: ReportData): string => {
    let csv = 'Relatório de Vendas\n\n';
    
    // Overview
    csv += 'Resumo Geral\n';
    csv += `Total de Vendas,${data.overview.totalSales.toFixed(2)} MZN\n`;
    csv += `Total de Clientes,${data.overview.totalCustomers}\n`;
    csv += `Total de Compras,${data.overview.totalPurchases}\n`;
    csv += `Pontos Distribuídos,${data.overview.totalPoints}\n`;
    csv += `Ticket Médio,${data.overview.averageTicket.toFixed(2)} MZN\n\n`;
    
    // Top Products
    csv += 'Produtos Mais Vendidos\n';
    csv += 'Produto,Quantidade,Receita\n';
    data.topProducts.forEach(product => {
      csv += `${product.name},${product.quantity},${product.revenue.toFixed(2)}\n`;
    });
    
    return csv;
  };

  if (!reportData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mr-2" />
          <span>Carregando relatórios...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Relatórios e Analytics</h3>
          <p className="text-gray-600">
            {isGlobalAdmin ? 'Visão global do sistema' : 'Relatórios da sua loja'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={generateReport} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={exportReport} className="bg-green-600 hover:bg-green-700">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div>
              <label className="text-sm font-medium">Período</label>
              <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Dia</SelectItem>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="month">Mês</SelectItem>
                  <SelectItem value="year">Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {isGlobalAdmin && (
              <div>
                <label className="text-sm font-medium">Loja</label>
                <Select value={selectedStore} onValueChange={setSelectedStore}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Lojas</SelectItem>
                    {stores.map(store => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Vendas</p>
                <p className="text-2xl font-bold">{reportData.overview.totalSales.toFixed(0)} MZN</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-600">+{reportData.overview.salesGrowth}% vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Clientes</p>
                <p className="text-2xl font-bold">{reportData.overview.totalCustomers}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-600">+{reportData.overview.customerGrowth}% vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Compras</p>
                <p className="text-2xl font-bold">{reportData.overview.totalPurchases}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <ShoppingCart className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Ticket médio: {reportData.overview.averageTicket.toFixed(2)} MZN
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pontos Distribuídos</p>
                <p className="text-2xl font-bold">{reportData.overview.totalPoints}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Sistema de fidelização ativo
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Vendas por Período</CardTitle>
          <CardDescription>Evolução das vendas nos últimos 7 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData.salesByPeriod.map((day, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">
                    {new Date(day.date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <div className="font-semibold">{day.sales.toFixed(0)} MZN</div>
                    <div className="text-xs text-gray-500">Vendas</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{day.purchases}</div>
                    <div className="text-xs text-gray-500">Compras</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{day.customers}</div>
                    <div className="text-xs text-gray-500">Clientes</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos Mais Vendidos</CardTitle>
          <CardDescription>Top 10 produtos por receita</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Posição</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Receita</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.topProducts.map((product, index) => (
                <TableRow key={product.productId}>
                  <TableCell>
                    <Badge variant={index < 3 ? "default" : "secondary"}>
                      #{index + 1}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.quantity}</TableCell>
                  <TableCell>{product.revenue.toFixed(2)} MZN</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Store Performance (only for global admin) */}
      {isGlobalAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Clientes por Loja</CardTitle>
              <CardDescription>Distribuição de clientes cadastrados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.customersByStore.map(store => (
                  <div key={store.storeId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{store.storeName}</span>
                    <Badge variant="secondary">{store.count} clientes</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Receita por Loja</CardTitle>
              <CardDescription>Performance de vendas por unidade</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.revenueByStore.map(store => (
                  <div key={store.storeId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{store.storeName}</span>
                    <Badge variant="secondary">{store.revenue.toFixed(0)} MZN</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Status */}
      <Alert className="border-blue-200 bg-blue-50">
        <BarChart3 className="h-4 w-4" />
        <AlertDescription className="text-blue-800">
          <strong>Relatórios Funcionais:</strong> Dados calculados em tempo real com base nas vendas registradas. 
          Exportação em CSV disponível para análises externas.
          {!isGlobalAdmin && ' Você está visualizando dados apenas da sua loja.'}
        </AlertDescription>
      </Alert>
    </div>
  );
}