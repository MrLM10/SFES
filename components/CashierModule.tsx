import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  ArrowLeft, 
  Scan, 
  Plus, 
  Minus, 
  Trash2, 
  DollarSign,
  Receipt,
  User,
  Star,
  Calculator,
  Check,
  X,
  AlertCircle,
  Wifi,
  WifiOff,
  Loader2,
  UserPlus,
  Phone
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { BarcodeScanner } from './BarcodeScanner';
import { db, Product, Customer, Purchase, PurchaseItem, DEFAULT_POINTS_CONFIG, SAMPLE_PRODUCTS, calculatePointsForAmount, calculateDiscountFromPoints } from '../utils/database';

interface CashierModuleProps {
  onBack: () => void;
  storeId?: string;
}

interface CartItem extends PurchaseItem {
  product: Product;
}

interface CashierUser {
  id: string;
  name: string;
  storeId: string;
  storeName: string;
}

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  country: string;
}

export function CashierModule({ onBack, storeId }: CashierModuleProps) {
  const [currentUser, setCurrentUser] = useState<CashierUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Added missing state variable
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [lastSale, setLastSale] = useState<Purchase | null>(null);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [products, setProducts] = useState<Product[]>(SAMPLE_PRODUCTS);
  
  const [loginForm, setLoginForm] = useState({
    email: 'caixa@teste.com',
    password: 'senha123'
  });

  const [customerForm, setCustomerForm] = useState<CustomerFormData>({
    name: '',
    email: '',
    phone: '',
    country: 'Moçambique'
  });

  const [offlineQueue, setOfflineQueue] = useState<Purchase[]>([]);

  useEffect(() => {
    // Monitor online status
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load offline data
    loadOfflineData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isLoggedIn && currentUser) {
      loadStoreProducts();
    }
  }, [isLoggedIn, currentUser]);

  const loadOfflineData = () => {
    const savedQueue = localStorage.getItem('cashier_offline_queue');
    if (savedQueue) {
      setOfflineQueue(JSON.parse(savedQueue));
    }
  };

  const saveOfflineData = (queue: Purchase[]) => {
    localStorage.setItem('cashier_offline_queue', JSON.stringify(queue));
  };

  const loadStoreProducts = async () => {
    if (!currentUser) return;
    
    try {
      if (isOnline) {
        const storeProducts = await db.getProducts(currentUser.storeId);
        if (storeProducts.length > 0) {
          setProducts(storeProducts);
        }
      }
    } catch (error) {
      console.log('Failed to load store products, using default catalog');
    }
  };

  const syncOfflineData = async () => {
    if (offlineQueue.length > 0 && isOnline) {
      try {
        for (const purchase of offlineQueue) {
          await db.createPurchase(purchase);
        }
        setOfflineQueue([]);
        saveOfflineData([]);
        setSuccessMessage(`${offlineQueue.length} vendas sincronizadas com sucesso!`);
      } catch (error) {
        console.error('Error syncing offline data:', error);
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Demo authentication for different store users
      let user: CashierUser;
      
      if (loginForm.email === 'caixa@teste.com' && loginForm.password === 'senha123') {
        user = {
          id: 'caixa-1',
          name: 'Operador de Caixa',
          storeId: storeId || 'store-1',
          storeName: `Loja ${storeId || 'Shoprite Maputo Central'}`
        };
      } else if (loginForm.email === 'caixa2@teste.com' && loginForm.password === 'senha123') {
        user = {
          id: 'caixa-2',
          name: 'Operador de Caixa 2',
          storeId: 'store-2',
          storeName: 'Shoprite Beira'
        };
      } else {
        throw new Error('Credenciais inválidas');
      }
      
      setCurrentUser(user);
      setIsLoggedIn(true);
      setSuccessMessage('Login realizado com sucesso!');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCart([]);
    setCustomer(null);
    setCustomerEmail('');
    setCustomerPhone('');
    setError('');
    setSuccessMessage('');
  };

  const searchCustomer = async () => {
    if (!customerEmail.trim() && !customerPhone.trim()) {
      setError('Digite o email ou telefone do cliente');
      return;
    }
    
    setIsLoadingCustomer(true);
    setError('');
    
    try {
      let foundCustomer: Customer | null = null;
      
      if (isOnline) {
        try {
          if (customerEmail.trim()) {
            foundCustomer = await db.getCustomerByEmail(customerEmail.trim());
          } else if (customerPhone.trim()) {
            foundCustomer = await db.getCustomerByPhone(customerPhone.trim());
          }
        } catch (error) {
          console.log('API call failed, using demo data');
        }
      }
      
      // Demo customer data if not found
      if (!foundCustomer) {
        if (customerEmail === 'cliente@teste.com' || customerPhone === '+258841234567') {
          foundCustomer = {
            id: 'customer-1',
            email: 'cliente@teste.com',
            phone: '+258841234567',
            name: 'Ana Santos',
            country: 'Moçambique',
            pointsBalance: { 'store-1': 150, 'store-2': 75 },
            totalPurchases: 5420,
            totalPoints: 280,
            isActive: true,
            createdAt: '2024-01-10T10:00:00Z'
          };
        }
      }
      
      if (foundCustomer) {
        setCustomer(foundCustomer);
        setSuccessMessage(`Cliente encontrado: ${foundCustomer.name}`);
      } else {
        // Show customer registration form
        setCustomerForm({
          name: '',
          email: customerEmail.trim(),
          phone: customerPhone.trim(),
          country: 'Moçambique'
        });
        setShowCustomerForm(true);
      }
    } catch (error) {
      setError('Erro ao buscar cliente. Tente novamente.');
    } finally {
      setIsLoadingCustomer(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const newCustomer: Customer = {
        id: `customer-${Date.now()}`,
        name: customerForm.name,
        email: customerForm.email,
        phone: customerForm.phone,
        country: customerForm.country,
        pointsBalance: {},
        totalPurchases: 0,
        totalPoints: 0,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      try {
        if (isOnline) {
          const createdCustomer = await db.createCustomer(newCustomer);
          setCustomer(createdCustomer);
        } else {
          setCustomer(newCustomer);
        }
      } catch (error) {
        setCustomer(newCustomer);
      }

      setShowCustomerForm(false);
      setSuccessMessage(`Cliente cadastrado: ${newCustomer.name}`);
    } catch (error) {
      setError('Erro ao cadastrar cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBarcodeScan = async (barcode: string) => {
    try {
      setError('');
      let product: Product | null = null;

      // Try to get product from store-specific catalog first
      if (isOnline && currentUser) {
        try {
          product = await db.getProductByBarcode(barcode, currentUser.storeId);
        } catch (error) {
          console.log('API call failed, searching in local products');
        }
      }

      // Fallback to local products
      if (!product) {
        product = products.find(p => p.barcode === barcode) || null;
      }

      if (product) {
        addToCart(product);
        setSuccessMessage(`Produto adicionado: ${product.name}`);
      } else {
        setError(`Produto não encontrado para o código: ${barcode}`);
      }
    } catch (error) {
      setError('Erro ao buscar produto. Tente novamente.');
    }
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.productId === product.id);
      
      if (existingIndex >= 0) {
        const newCart = [...prevCart];
        newCart[existingIndex].quantity += quantity;
        newCart[existingIndex].totalPrice = newCart[existingIndex].quantity * product.price;
        return newCart;
      } else {
        const newItem: CartItem = {
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice: product.price,
          totalPrice: product.price * quantity,
          product
        };
        return [...prevCart, newItem];
      }
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart => 
      prevCart.map(item => 
        item.productId === productId 
          ? { 
              ...item, 
              quantity: newQuantity, 
              totalPrice: newQuantity * item.unitPrice 
            }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    const pointsEarned = calculatePointsForAmount(subtotal, DEFAULT_POINTS_CONFIG);
    let discount = 0;
    let pointsUsed = 0;

    if (usePoints && customer && currentUser && pointsToUse > 0) {
      const availablePoints = customer.pointsBalance[currentUser.storeId] || 0;
      const maxPointsToUse = Math.min(pointsToUse, availablePoints);
      pointsUsed = maxPointsToUse;
      discount = calculateDiscountFromPoints(maxPointsToUse, DEFAULT_POINTS_CONFIG);
    }

    const total = Math.max(0, subtotal - discount);
    
    return {
      subtotal,
      discount,
      total,
      pointsEarned,
      pointsUsed
    };
  };

  const processPayment = async () => {
    if (cart.length === 0) return;
    if (!customer) {
      setError('É necessário identificar o cliente antes de finalizar a venda.');
      return;
    }
    if (!currentUser) {
      setError('Erro de sessão. Faça login novamente.');
      return;
    }

    setIsProcessingSale(true);
    setError('');

    try {
      const totals = calculateTotals();
      
      // Validate cash payment
      if (paymentMethod === 'cash') {
        const cashAmount = parseFloat(cashReceived);
        if (isNaN(cashAmount) || cashAmount < totals.total) {
          throw new Error('Valor em dinheiro insuficiente.');
        }
      }

      // Validate points usage
      if (usePoints && totals.pointsUsed > 0) {
        const availablePoints = customer.pointsBalance[currentUser.storeId] || 0;
        if (totals.pointsUsed > availablePoints) {
          throw new Error('Pontos insuficientes.');
        }
      }

      const purchase: Purchase = {
        id: `purchase-${Date.now()}`,
        customerId: customer.id,
        storeId: currentUser.storeId,
        cashierId: currentUser.id,
        items: cart.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        })),
        totalAmount: totals.total,
        currency: 'MZN',
        pointsEarned: totals.pointsEarned,
        pointsUsed: totals.pointsUsed,
        discountApplied: totals.discount,
        paymentMethod,
        status: 'completed',
        createdAt: new Date().toISOString()
      };

      // Calculate new customer points balance
      const currentStorePoints = customer.pointsBalance[currentUser.storeId] || 0;
      const newStorePoints = Math.max(0, currentStorePoints - totals.pointsUsed + totals.pointsEarned);
      const newTotalPoints = customer.totalPoints - totals.pointsUsed + totals.pointsEarned;

      const updatedCustomer: Customer = {
        ...customer,
        pointsBalance: {
          ...customer.pointsBalance,
          [currentUser.storeId]: newStorePoints
        },
        totalPurchases: customer.totalPurchases + totals.total,
        totalPoints: newTotalPoints
      };

      // Try to save online first
      if (isOnline) {
        try {
          const savedPurchase = await db.createPurchase(purchase);
          await db.updateCustomer(customer.id, {
            pointsBalance: updatedCustomer.pointsBalance,
            totalPurchases: updatedCustomer.totalPurchases,
            totalPoints: updatedCustomer.totalPoints
          });
          
          setLastSale(savedPurchase);
          setCustomer(updatedCustomer);
          
        } catch (error) {
          console.log('Online save failed, saving offline');
          // Save to offline queue
          const newQueue = [...offlineQueue, purchase];
          setOfflineQueue(newQueue);
          saveOfflineData(newQueue);
          setLastSale(purchase);
          setCustomer(updatedCustomer);
        }
      } else {
        // Save to offline queue
        const newQueue = [...offlineQueue, purchase];
        setOfflineQueue(newQueue);
        saveOfflineData(newQueue);
        setLastSale(purchase);
        setCustomer(updatedCustomer);
      }

      // Clear cart and show success
      setCart([]);
      setShowCheckout(false);
      setCashReceived('');
      setUsePoints(false);
      setPointsToUse(0);
      
      setSuccessMessage(
        `Venda finalizada! ${totals.pointsEarned > 0 ? `+${totals.pointsEarned} pontos ganhos. ` : ''}${totals.pointsUsed > 0 ? `${totals.pointsUsed} pontos usados. ` : ''}${isOnline ? '' : 'Dados salvos offline.'}`
      );

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao processar pagamento');
    } finally {
      setIsProcessingSale(false);
    }
  };

  const totals = calculateTotals();
  const maxPointsToUse = customer && currentUser ? (customer.pointsBalance[currentUser.storeId] || 0) : 0;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-gray-100 rounded-full">
              <ShoppingCart className="h-8 w-8 text-gray-700" />
            </div>
            <CardTitle>Login do Caixa</CardTitle>
            <CardDescription>
              Acesso ao sistema de vendas
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
                  E-mail: caixa@teste.com<br />
                  Senha: senha123<br />
                  <br />
                  <strong>Loja 2:</strong><br />
                  E-mail: caixa2@teste.com<br />
                  Senha: senha123
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-4 border-gray-600">
        <div className="container mx-auto max-w-6xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gray-700 p-3 rounded-full">
                <ShoppingCart className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sistema de Vendas</h1>
                <p className="text-gray-600">{currentUser?.storeName} - {currentUser?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className={isOnline ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                {isOnline ? <Wifi className="h-4 w-4 mr-1" /> : <WifiOff className="h-4 w-4 mr-1" />}
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
              {offlineQueue.length > 0 && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                  {offlineQueue.length} venda(s) pendente(s)
                </Badge>
              )}
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-8">
        {/* Messages */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <Check className="h-4 w-4" />
            <AlertDescription className="text-green-800">
              {successMessage}
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2" 
                onClick={() => setSuccessMessage('')}
              >
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Customer and Scanning */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {customer ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-green-800">{customer.name}</h3>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => { 
                          setCustomer(null); 
                          setCustomerEmail(''); 
                          setCustomerPhone('');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-green-700">{customer.email}</p>
                    <p className="text-sm text-green-700">{customer.phone}</p>
                    <div className="flex items-center mt-2">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="text-sm font-medium">
                        {(currentUser && customer.pointsBalance[currentUser.storeId]) || 0} pontos disponíveis
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Input
                        placeholder="E-mail do cliente"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchCustomer()}
                      />
                      <Input
                        placeholder="Telefone do cliente"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchCustomer()}
                      />
                    </div>
                    <Button 
                      onClick={searchCustomer} 
                      disabled={isLoadingCustomer || (!customerEmail.trim() && !customerPhone.trim())}
                      className="w-full"
                    >
                      {isLoadingCustomer ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <User className="h-4 w-4 mr-2" />
                      )}
                      Buscar Cliente
                    </Button>
                  </div>
                )}
                
                {!customer && (
                  <Alert className="mt-4 border-blue-200 bg-blue-50">
                    <AlertDescription className="text-blue-800">
                      <strong>Para teste:</strong> Use cliente@teste.com ou +258841234567<br />
                      <strong>Novo cliente:</strong> Digite qualquer email/telefone e será criado automaticamente
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Product Scanning */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Scan className="h-5 w-5 mr-2" />
                  Adicionar Produtos ({products.length} disponíveis)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setShowScanner(true)} 
                  className="w-full h-16 text-lg bg-blue-600 hover:bg-blue-700"
                >
                  <Scan className="h-6 w-6 mr-2" />
                  Escanear Código de Barras
                </Button>
                
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBarcodeScan('7896273302123')}
                  >
                    Arroz 5kg
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBarcodeScan('7896273302143')}
                  >
                    Coca-Cola 2L
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBarcodeScan('7896273302243')}
                  >
                    Detergente
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBarcodeScan('7896273302163')}
                  >
                    Frango 1.5kg
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBarcodeScan('7896273302124')}
                  >
                    Feijão 1kg
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBarcodeScan('7896273302126')}
                  >
                    Óleo de Soja
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBarcodeScan('7896273302183')}
                  >
                    Leite 1L
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBarcodeScan('7896273302184')}
                  >
                    Queijo 500g
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBarcodeScan('7896273302203')}
                  >
                    Pão Integral
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBarcodeScan('7896273302223')}
                  >
                    Banana 1kg
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBarcodeScan('7896273302224')}
                  >
                    Tomate 1kg
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBarcodeScan('7896273302245')}
                  >
                    Papel Higiênico
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBarcodeScan('7896273302165')}
                  >
                    Ovos 30un
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBarcodeScan('7896273302129')}
                  >
                    Farinha 1kg
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Cart Items */}
            {cart.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Itens da Compra ({cart.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.productName}</h4>
                          <p className="text-sm text-gray-500">{item.product.brand} - {item.product.category}</p>
                          <p className="text-sm font-medium">{item.unitPrice.toFixed(2)} MZN cada</p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeFromCart(item.productId)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="ml-4 text-right">
                          <p className="font-semibold">{item.totalPrice.toFixed(2)} MZN</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Summary and Checkout */}
          <div className="space-y-6">
            {/* Sale Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Resumo da Venda
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">{totals.subtotal.toFixed(2)} MZN</span>
                  </div>
                  
                  {totals.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto ({totals.pointsUsed} pontos):</span>
                      <span className="font-medium">-{totals.discount.toFixed(2)} MZN</span>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{totals.total.toFixed(2)} MZN</span>
                  </div>
                  
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Pontos a ganhar:</span>
                    <span className="flex items-center">
                      <Star className="h-3 w-3 mr-1" />
                      {totals.pointsEarned}
                    </span>
                  </div>
                </div>

                {/* Points Usage */}
                {customer && maxPointsToUse >= DEFAULT_POINTS_CONFIG.minimumPointsToRedeem && (
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="usePoints"
                        checked={usePoints}
                        onChange={(e) => setUsePoints(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="usePoints" className="text-sm">
                        Usar pontos para desconto
                      </Label>
                    </div>
                    
                    {usePoints && (
                      <div>
                        <Label htmlFor="pointsToUse" className="text-sm">
                          Pontos a usar (máx: {maxPointsToUse})
                        </Label>
                        <Input
                          id="pointsToUse"
                          type="number"
                          min="0"
                          max={maxPointsToUse}
                          value={pointsToUse}
                          onChange={(e) => setPointsToUse(parseInt(e.target.value) || 0)}
                          placeholder="0"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          1 ponto = 1 MZN de desconto
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Checkout Button */}
                <Button
                  onClick={() => setShowCheckout(true)}
                  disabled={cart.length === 0 || !customer}
                  className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
                >
                  <Receipt className="h-5 w-5 mr-2" />
                  Finalizar Venda
                </Button>
                
                {cart.length === 0 && (
                  <p className="text-sm text-gray-500 text-center">
                    Adicione produtos para continuar
                  </p>
                )}
                
                {!customer && cart.length > 0 && (
                  <p className="text-sm text-red-500 text-center">
                    Identifique o cliente para finalizar
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Last Sale */}
            {lastSale && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Última Venda</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p>Total: {lastSale.totalAmount.toFixed(2)} MZN</p>
                  <p>Pontos ganhos: +{lastSale.pointsEarned}</p>
                  {lastSale.pointsUsed > 0 && <p>Pontos usados: -{lastSale.pointsUsed}</p>}
                  <p>Método: {lastSale.paymentMethod}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(lastSale.createdAt).toLocaleString('pt-BR')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Barcode Scanner Modal */}
        <BarcodeScanner
          isOpen={showScanner}
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />

        {/* Customer Registration Modal */}
        <Dialog open={showCustomerForm} onOpenChange={setShowCustomerForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <UserPlus className="h-5 w-5 mr-2" />
                Cadastrar Novo Cliente
              </DialogTitle>
              <DialogDescription>
                Cliente não encontrado. Preencha os dados para cadastrar.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <Label htmlFor="customerName">Nome Completo</Label>
                <Input
                  id="customerName"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="Nome do cliente"
                />
              </div>

              <div>
                <Label htmlFor="customerEmail">E-mail</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="customerPhone">Telefone</Label>
                <Input
                  id="customerPhone"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                  required
                  placeholder="+258 84 123 4567"
                />
              </div>

              <div>
                <Label htmlFor="customerCountry">País</Label>
                <Select 
                  value={customerForm.country} 
                  onValueChange={(value) => setCustomerForm(prev => ({ ...prev, country: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Moçambique">Moçambique</SelectItem>
                    <SelectItem value="África do Sul">África do Sul</SelectItem>
                    <SelectItem value="Brasil">Brasil</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCustomerForm(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Cadastrar
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Checkout Modal */}
        <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Finalizar Venda</DialogTitle>
              <DialogDescription>
                Confirme os detalhes da venda e escolha o método de pagamento
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Sale Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Resumo da Venda</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{totals.subtotal.toFixed(2)} MZN</span>
                  </div>
                  {totals.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto ({totals.pointsUsed} pontos):</span>
                      <span>-{totals.discount.toFixed(2)} MZN</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold border-t pt-1">
                    <span>Total:</span>
                    <span>{totals.total.toFixed(2)} MZN</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Pontos a ganhar:</span>
                    <span>+{totals.pointsEarned} pontos</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <Label>Método de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={(value: 'cash' | 'card' | 'mobile') => setPaymentMethod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="card">Cartão</SelectItem>
                    <SelectItem value="mobile">Pagamento Móvel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cash Payment */}
              {paymentMethod === 'cash' && (
                <div>
                  <Label htmlFor="cashReceived">Valor Recebido (MZN)</Label>
                  <Input
                    id="cashReceived"
                    type="number"
                    step="0.01"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="0.00"
                  />
                  {cashReceived && parseFloat(cashReceived) >= totals.total && (
                    <p className="text-sm text-green-600 mt-1">
                      Troco: {(parseFloat(cashReceived) - totals.total).toFixed(2)} MZN
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-4">
                <Button variant="outline" onClick={() => setShowCheckout(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  onClick={processPayment}
                  disabled={isProcessingSale || (paymentMethod === 'cash' && parseFloat(cashReceived) < totals.total)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isProcessingSale ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Confirmar Pagamento
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}