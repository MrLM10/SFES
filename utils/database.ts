import { projectId, publicAnonKey } from './supabase/info';

export interface Store {
  id: string;
  name: string;
  country: string;
  province: string;
  city: string;
  address: string;
  phone: string;
  isActive: boolean;
  pointsConfig: PointsConfig;
  createdAt: string;
  adminId?: string;
}

export interface PointsConfig {
  currency: string;
  tiers: PointsTier[];
  discountPercentage: number;
  minimumPointsToRedeem: number;
}

export interface PointsTier {
  minAmount: number;
  maxAmount: number;
  points: number;
}

export interface Product {
  id: string;
  barcode: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  currency: string;
  image?: string;
  isActive: boolean;
  storeId?: string;
}

export interface Customer {
  id: string;
  email: string;
  phone: string;
  name: string;
  country: string;
  pointsBalance: Record<string, number>; // storeId -> points
  totalPurchases: number;
  totalPoints: number;
  isActive: boolean;
  createdAt: string;
}

export interface Purchase {
  id: string;
  customerId: string;
  storeId: string;
  cashierId: string;
  items: PurchaseItem[];
  totalAmount: number;
  currency: string;
  pointsEarned: number;
  pointsUsed: number;
  discountApplied: number;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface RegistrationLink {
  id: string;
  code: string;
  createdBy: string;
  maxUsage: number;
  usageCount: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

export interface RegistrationRequest {
  id: string;
  registrationCode: string;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  country: string;
  province: string;
  city: string;
  position: string;
  location: string;
  storeName: string;
  language: string;
  status: 'pending_approval' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'cashier' | 'admin_comum' | 'admin_general';
  storeId?: string;
  country?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Analytics {
  totalSales: number;
  totalCustomers: number;
  totalPurchases: number;
  totalPoints: number;
  salesByPeriod: { date: string; sales: number; customers: number; purchases: number }[];
  topProducts: { productId: string; name: string; quantity: number; revenue: number }[];
  customersByStore: { storeId: string; storeName: string; count: number }[];
  revenueByStore: { storeId: string; storeName: string; revenue: number }[];
  customerGrowth: number;
  salesGrowth: number;
  averageTicket: number;
}

// Default points configuration
export const DEFAULT_POINTS_CONFIG: PointsConfig = {
  currency: 'MZN',
  tiers: [
    { minAmount: 500, maxAmount: 4999, points: 10 },
    { minAmount: 5000, maxAmount: 12999, points: 20 },
    { minAmount: 13000, maxAmount: 25999, points: 30 },
    { minAmount: 26000, maxAmount: 33999, points: 40 },
    { minAmount: 34000, maxAmount: 41999, points: 50 },
    { minAmount: 42000, maxAmount: 46999, points: 60 },
    { minAmount: 47000, maxAmount: 999999, points: 80 }
  ],
  discountPercentage: 100, // 1 ponto = 1 MZN
  minimumPointsToRedeem: 10
};

// Utility functions for points calculation
export function calculatePointsForAmount(amount: number, pointsConfig: PointsConfig = DEFAULT_POINTS_CONFIG): number {
  const tier = pointsConfig.tiers.find(t => amount >= t.minAmount && amount <= t.maxAmount);
  return tier ? tier.points : 0;
}

export function calculateDiscountFromPoints(points: number, pointsConfig: PointsConfig = DEFAULT_POINTS_CONFIG): number {
  if (points < pointsConfig.minimumPointsToRedeem) {
    return 0;
  }
  
  // 1 ponto = percentual configurado da moeda (padrão 100% = 1 MZN)
  return Math.floor((points * pointsConfig.discountPercentage) / 100);
}

// Environment helper function
const getEnvironmentVariable = (name: string): string | undefined => {
  // Try Vite environment first
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[name];
  }
  
  // Try global environment (fallback)
  if (typeof globalThis !== 'undefined' && (globalThis as any).process?.env) {
    return (globalThis as any).process.env[name];
  }
  
  return undefined;
};

class DatabaseService {
  private baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-a8c4406a`;
  private isConnected = false;
  private lastConnectionCheck = 0;
  private connectionCheckInterval = 30000; // 30 seconds
  
  constructor() {
    this.checkConnection();
  }

  private async checkConnection() {
    const now = Date.now();
    if (now - this.lastConnectionCheck < this.connectionCheckInterval) {
      return this.isConnected;
    }

    try {
      // Get environment variables
      const supabaseUrl = getEnvironmentVariable('VITE_SUPABASE_URL') || 
                          getEnvironmentVariable('REACT_APP_SUPABASE_URL');
      
      const supabaseKey = getEnvironmentVariable('VITE_SUPABASE_ANON_KEY') || 
                          getEnvironmentVariable('REACT_APP_SUPABASE_ANON_KEY');

      if (!supabaseUrl || !supabaseKey || !projectId || projectId.includes('your_project_id')) {
        console.log('📦 Supabase not configured - using demo mode');
        this.isConnected = false;
        this.lastConnectionCheck = now;
        return false;
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      this.isConnected = response.ok || response.status === 404;
      this.lastConnectionCheck = now;
      
      if (this.isConnected) {
        console.log('✅ Database connection successful');
      } else {
        console.log('⚠️ Database connection failed, using demo mode');
      }
      
      return this.isConnected;
    } catch (error: any) {
      console.log('📦 Database connection error, using demo mode:', error.message);
      this.isConnected = false;
      this.lastConnectionCheck = now;
      return false;
    }
  }
  
  private async request(endpoint: string, options: RequestInit = {}) {
    const isConnected = await this.checkConnection();
    
    if (!isConnected) {
      throw new Error('Database not available - using demo mode');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // Check if system is online
  async isOnline(): Promise<boolean> {
    return await this.checkConnection();
  }

  // Authentication
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: Partial<User & { password: string }>): Promise<User> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Stores
  async getStores(adminId?: string): Promise<Store[]> {
    const url = adminId ? `/stores?adminId=${adminId}` : '/stores';
    return this.request(url);
  }

  async getStore(id: string): Promise<Store> {
    return this.request(`/stores/${id}`);
  }

  async createStore(store: Omit<Store, 'id' | 'createdAt'>): Promise<Store> {
    return this.request('/stores', {
      method: 'POST',
      body: JSON.stringify(store),
    });
  }

  async updateStore(id: string, store: Partial<Store>): Promise<Store> {
    return this.request(`/stores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(store),
    });
  }

  // Products
  async getProducts(storeId?: string): Promise<Product[]> {
    const url = storeId ? `/products?storeId=${storeId}` : '/products';
    return this.request(url);
  }

  async getProductByBarcode(barcode: string, storeId?: string): Promise<Product | null> {
    const url = storeId ? `/products/barcode/${barcode}?storeId=${storeId}` : `/products/barcode/${barcode}`;
    return this.request(url);
  }

  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  // Customers
  async getCustomers(storeId?: string): Promise<Customer[]> {
    const url = storeId ? `/customers?storeId=${storeId}` : '/customers';
    return this.request(url);
  }

  async getCustomer(id: string): Promise<Customer> {
    return this.request(`/customers/${id}`);
  }

  async getCustomerByEmail(email: string): Promise<Customer | null> {
    return this.request(`/customers/email/${encodeURIComponent(email)}`);
  }

  async getCustomerByPhone(phone: string): Promise<Customer | null> {
    return this.request(`/customers/phone/${encodeURIComponent(phone)}`);
  }

  async createCustomer(customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  }

  async updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer> {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    });
  }

  // Purchases
  async createPurchase(purchase: Omit<Purchase, 'id' | 'createdAt'>): Promise<Purchase> {
    return this.request('/purchases', {
      method: 'POST',
      body: JSON.stringify(purchase),
    });
  }

  async getPurchases(customerId?: string, storeId?: string): Promise<Purchase[]> {
    const params = new URLSearchParams();
    if (customerId) params.append('customerId', customerId);
    if (storeId) params.append('storeId', storeId);
    
    const url = params.toString() ? `/purchases?${params}` : '/purchases';
    return this.request(url);
  }

  // Registration Links
  async createRegistrationLink(link: Omit<RegistrationLink, 'id' | 'createdAt' | 'usageCount'>): Promise<RegistrationLink> {
    return this.request('/registration/links', {
      method: 'POST',
      body: JSON.stringify(link),
    });
  }

  async getRegistrationLinks(): Promise<RegistrationLink[]> {
    return this.request('/registration/links');
  }

  async validateRegistrationCode(code: string): Promise<RegistrationLink | null> {
    return this.request(`/registration/validate/${code}`);
  }

  // Registration Requests
  async createRegistrationRequest(request: Omit<RegistrationRequest, 'id' | 'createdAt'>): Promise<RegistrationRequest> {
    return this.request('/registration/requests', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getRegistrationRequests(): Promise<RegistrationRequest[]> {
    return this.request('/registration/requests');
  }

  async updateRegistrationRequest(id: string, status: 'approved' | 'rejected', reviewedBy: string): Promise<RegistrationRequest> {
    return this.request(`/registration/requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, reviewedBy, reviewedAt: new Date().toISOString() }),
    });
  }

  // Points and Rewards
  async calculatePoints(amount: number, storeId: string): Promise<number> {
    return this.request('/points/calculate', {
      method: 'POST',
      body: JSON.stringify({ amount, storeId }),
    });
  }

  async redeemPoints(customerId: string, storeId: string, points: number): Promise<{ discount: number; newBalance: number }> {
    return this.request('/points/redeem', {
      method: 'POST',
      body: JSON.stringify({ customerId, storeId, points }),
    });
  }

  // Reports and Analytics
  async getStoreAnalytics(storeId: string, period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<Analytics> {
    return this.request(`/analytics/store/${storeId}?period=${period}`);
  }

  async getGlobalAnalytics(period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<Analytics> {
    return this.request(`/analytics/global?period=${period}`);
  }

  // Sync for offline functionality
  async syncOfflineData(data: any): Promise<void> {
    return this.request('/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const db = new DatabaseService();

// Expanded product catalog with 150 products
export const SAMPLE_PRODUCTS: Product[] = [
  // Alimentos básicos e grãos (1-20)
  { id: '1', barcode: '7896273302123', name: 'Arroz Branco 5kg', brand: 'Tio João', category: 'Cereais', price: 450, currency: 'MZN', isActive: true },
  { id: '2', barcode: '7896273302124', name: 'Feijão Preto 1kg', brand: 'Camil', category: 'Leguminosas', price: 180, currency: 'MZN', isActive: true },
  { id: '3', barcode: '7896273302125', name: 'Açúcar Cristal 1kg', brand: 'União', category: 'Açúcar', price: 120, currency: 'MZN', isActive: true },
  { id: '4', barcode: '7896273302126', name: 'Óleo de Soja 900ml', brand: 'Liza', category: 'Óleos', price: 200, currency: 'MZN', isActive: true },
  { id: '5', barcode: '7896273302127', name: 'Sal Refinado 1kg', brand: 'Cisne', category: 'Temperos', price: 80, currency: 'MZN', isActive: true },
  { id: '6', barcode: '7896273302128', name: 'Feijão Carioca 1kg', brand: 'Kicaldo', category: 'Leguminosas', price: 190, currency: 'MZN', isActive: true },
  { id: '7', barcode: '7896273302129', name: 'Farinha de Trigo 1kg', brand: 'Anaconda', category: 'Farinhas', price: 150, currency: 'MZN', isActive: true },
  { id: '8', barcode: '7896273302130', name: 'Açúcar Mascavo 500g', brand: 'Native', category: 'Açúcar', price: 180, currency: 'MZN', isActive: true },
  { id: '9', barcode: '7896273302131', name: 'Arroz Integral 1kg', brand: 'Camil', category: 'Cereais', price: 220, currency: 'MZN', isActive: true },
  { id: '10', barcode: '7896273302132', name: 'Quinoa 500g', brand: 'Mãe Terra', category: 'Cereais', price: 280, currency: 'MZN', isActive: true },

  // Bebidas (11-30)
  { id: '11', barcode: '7896273302143', name: 'Coca-Cola 2L', brand: 'Coca-Cola', category: 'Refrigerantes', price: 150, currency: 'MZN', isActive: true },
  { id: '12', barcode: '7896273302144', name: 'Água Mineral 1.5L', brand: 'Crystal', category: 'Águas', price: 45, currency: 'MZN', isActive: true },
  { id: '13', barcode: '7896273302145', name: 'Cerveja Sagres 330ml', brand: 'Sagres', category: 'Cervejas', price: 80, currency: 'MZN', isActive: true },
  { id: '14', barcode: '7896273302146', name: 'Pepsi 2L', brand: 'Pepsi', category: 'Refrigerantes', price: 140, currency: 'MZN', isActive: true },
  { id: '15', barcode: '7896273302147', name: 'Fanta Laranja 2L', brand: 'Fanta', category: 'Refrigerantes', price: 140, currency: 'MZN', isActive: true },
  { id: '16', barcode: '7896273302148', name: 'Sprite 2L', brand: 'Sprite', category: 'Refrigerantes', price: 140, currency: 'MZN', isActive: true },
  { id: '17', barcode: '7896273302149', name: 'Suco de Laranja 1L', brand: 'Mais', category: 'Sucos', price: 120, currency: 'MZN', isActive: true },
  { id: '18', barcode: '7896273302150', name: 'Suco de Maçã 1L', brand: 'Mais', category: 'Sucos', price: 120, currency: 'MZN', isActive: true },
  { id: '19', barcode: '7896273302151', name: 'Água Tônica 350ml', brand: 'Schweppes', category: 'Águas', price: 80, currency: 'MZN', isActive: true },
  { id: '20', barcode: '7896273302152', name: 'Energético Red Bull 250ml', brand: 'Red Bull', category: 'Energéticos', price: 180, currency: 'MZN', isActive: true },

  // Carnes e Proteínas (21-40)
  { id: '21', barcode: '7896273302163', name: 'Frango Inteiro Congelado 1.5kg', brand: 'Avivar', category: 'Carnes', price: 380, currency: 'MZN', isActive: true },
  { id: '22', barcode: '7896273302164', name: 'Carne Bovina Picanha 1kg', brand: 'Frigorífico Central', category: 'Carnes', price: 850, currency: 'MZN', isActive: true },
  { id: '23', barcode: '7896273302165', name: 'Ovos 30 unidades', brand: 'Avícola Moçambique', category: 'Ovos', price: 280, currency: 'MZN', isActive: true },
  { id: '24', barcode: '7896273302166', name: 'Peito de Frango 1kg', brand: 'Sadia', category: 'Carnes', price: 420, currency: 'MZN', isActive: true },
  { id: '25', barcode: '7896273302167', name: 'Linguiça Calabresa 500g', brand: 'Perdigão', category: 'Embutidos', price: 280, currency: 'MZN', isActive: true },
  { id: '26', barcode: '7896273302168', name: 'Presunto Fatiado 200g', brand: 'Sadia', category: 'Embutidos', price: 180, currency: 'MZN', isActive: true },
  { id: '27', barcode: '7896273302169', name: 'Mortadela 300g', brand: 'Perdigão', category: 'Embutidos', price: 120, currency: 'MZN', isActive: true },
  { id: '28', barcode: '7896273302170', name: 'Salsicha 500g', brand: 'Sadia', category: 'Embutidos', price: 200, currency: 'MZN', isActive: true },
  { id: '29', barcode: '7896273302171', name: 'Bacon Fatiado 250g', brand: 'Perdigão', category: 'Embutidos', price: 220, currency: 'MZN', isActive: true },
  { id: '30', barcode: '7896273302172', name: 'Carne Moída 500g', brand: 'Friboi', category: 'Carnes', price: 320, currency: 'MZN', isActive: true },

  // Laticínios (31-50)
  { id: '31', barcode: '7896273302183', name: 'Leite UHT Integral 1L', brand: 'Parmalat', category: 'Laticínios', price: 90, currency: 'MZN', isActive: true },
  { id: '32', barcode: '7896273302184', name: 'Queijo Mussarela 500g', brand: 'Tirolez', category: 'Laticínios', price: 420, currency: 'MZN', isActive: true },
  { id: '33', barcode: '7896273302185', name: 'Iogurte Natural 170g', brand: 'Danone', category: 'Laticínios', price: 65, currency: 'MZN', isActive: true },
  { id: '34', barcode: '7896273302186', name: 'Manteiga 200g', brand: 'Aviação', category: 'Laticínios', price: 180, currency: 'MZN', isActive: true },
  { id: '35', barcode: '7896273302187', name: 'Cream Cheese 150g', brand: 'Philadelphia', category: 'Laticínios', price: 220, currency: 'MZN', isActive: true },
  { id: '36', barcode: '7896273302188', name: 'Queijo Prato Fatiado 200g', brand: 'Tirolez', category: 'Laticínios', price: 280, currency: 'MZN', isActive: true },
  { id: '37', barcode: '7896273302189', name: 'Requeijão 200g', brand: 'Catupiry', category: 'Laticínios', price: 180, currency: 'MZN', isActive: true },
  { id: '38', barcode: '7896273302190', name: 'Leite Condensado 395g', brand: 'Nestlé', category: 'Laticínios', price: 120, currency: 'MZN', isActive: true },
  { id: '39', barcode: '7896273302191', name: 'Creme de Leite 200g', brand: 'Nestlé', category: 'Laticínios', price: 80, currency: 'MZN', isActive: true },
  { id: '40', barcode: '7896273302192', name: 'Iogurte Grego 150g', brand: 'Danone', category: 'Laticínios', price: 120, currency: 'MZN', isActive: true },

  // Pães e Padaria (41-60)
  { id: '41', barcode: '7896273302203', name: 'Pão de Forma Integral 500g', brand: 'Wickbold', category: 'Padaria', price: 180, currency: 'MZN', isActive: true },
  { id: '42', barcode: '7896273302204', name: 'Pão Francês 6 unidades', brand: 'Padaria Central', category: 'Padaria', price: 60, currency: 'MZN', isActive: true },
  { id: '43', barcode: '7896273302205', name: 'Pão de Açúcar 400g', brand: 'Wickbold', category: 'Padaria', price: 150, currency: 'MZN', isActive: true },
  { id: '44', barcode: '7896273302206', name: 'Croissant 6 unidades', brand: 'Seven Boys', category: 'Padaria', price: 180, currency: 'MZN', isActive: true },
  { id: '45', barcode: '7896273302207', name: 'Pão de Hambúrguer 8 unidades', brand: 'Wickbold', category: 'Padaria', price: 120, currency: 'MZN', isActive: true },
  { id: '46', barcode: '7896273302208', name: 'Biscoito Cream Cracker 400g', brand: 'Adria', category: 'Biscoitos', price: 120, currency: 'MZN', isActive: true },
  { id: '47', barcode: '7896273302209', name: 'Bolacha Maizena 400g', brand: 'Adria', category: 'Biscoitos', price: 100, currency: 'MZN', isActive: true },
  { id: '48', barcode: '7896273302210', name: 'Biscoito Recheado Chocolate 140g', brand: 'Oreo', category: 'Biscoitos', price: 150, currency: 'MZN', isActive: true },
  { id: '49', barcode: '7896273302211', name: 'Torrada Integral 150g', brand: 'Marilan', category: 'Biscoitos', price: 120, currency: 'MZN', isActive: true },
  { id: '50', barcode: '7896273302212', name: 'Pão Sírio 8 unidades', brand: 'Pita Bread', category: 'Padaria', price: 80, currency: 'MZN', isActive: true },

  // Frutas e Vegetais (51-70)
  { id: '51', barcode: '7896273302223', name: 'Banana Prata 1kg', brand: 'Natural', category: 'Frutas', price: 80, currency: 'MZN', isActive: true },
  { id: '52', barcode: '7896273302224', name: 'Tomate 1kg', brand: 'Natural', category: 'Vegetais', price: 120, currency: 'MZN', isActive: true },
  { id: '53', barcode: '7896273302225', name: 'Cebola 1kg', brand: 'Natural', category: 'Vegetais', price: 90, currency: 'MZN', isActive: true },
  { id: '54', barcode: '7896273302226', name: 'Batata 1kg', brand: 'Natural', category: 'Vegetais', price: 110, currency: 'MZN', isActive: true },
  { id: '55', barcode: '7896273302227', name: 'Maçã 1kg', brand: 'Natural', category: 'Frutas', price: 180, currency: 'MZN', isActive: true },
  { id: '56', barcode: '7896273302228', name: 'Laranja 1kg', brand: 'Natural', category: 'Frutas', price: 120, currency: 'MZN', isActive: true },
  { id: '57', barcode: '7896273302229', name: 'Alface 1 unidade', brand: 'Natural', category: 'Vegetais', price: 45, currency: 'MZN', isActive: true },
  { id: '58', barcode: '7896273302230', name: 'Cenoura 500g', brand: 'Natural', category: 'Vegetais', price: 60, currency: 'MZN', isActive: true },
  { id: '59', barcode: '7896273302231', name: 'Limão 500g', brand: 'Natural', category: 'Frutas', price: 40, currency: 'MZN', isActive: true },
  { id: '60', barcode: '7896273302232', name: 'Brócolis 500g', brand: 'Natural', category: 'Vegetais', price: 120, currency: 'MZN', isActive: true },

  // Higiene e Limpeza (61-80)
  { id: '61', barcode: '7896273302233', name: 'Detergente Líquido 500ml', brand: 'Ypê', category: 'Limpeza', price: 80, currency: 'MZN', isActive: true },
  { id: '62', barcode: '7896273302234', name: 'Sabão em Pó 1kg', brand: 'OMO', category: 'Limpeza', price: 180, currency: 'MZN', isActive: true },
  { id: '63', barcode: '7896273302235', name: 'Shampoo 400ml', brand: 'Seda', category: 'Higiene', price: 150, currency: 'MZN', isActive: true },
  { id: '64', barcode: '7896273302236', name: 'Condicionador 400ml', brand: 'Seda', category: 'Higiene', price: 150, currency: 'MZN', isActive: true },
  { id: '65', barcode: '7896273302237', name: 'Sabonete 90g', brand: 'Dove', category: 'Higiene', price: 60, currency: 'MZN', isActive: true },
  { id: '66', barcode: '7896273302238', name: 'Pasta de Dente 90g', brand: 'Colgate', category: 'Higiene', price: 120, currency: 'MZN', isActive: true },
  { id: '67', barcode: '7896273302239', name: 'Desodorante 150ml', brand: 'Rexona', category: 'Higiene', price: 180, currency: 'MZN', isActive: true },
  { id: '68', barcode: '7896273302240', name: 'Papel Higiênico 12 rolos', brand: 'Neve', category: 'Higiene', price: 220, currency: 'MZN', isActive: true },
  { id: '69', barcode: '7896273302241', name: 'Água Sanitária 1L', brand: 'Q-Boa', category: 'Limpeza', price: 90, currency: 'MZN', isActive: true },
  { id: '70', barcode: '7896273302242', name: 'Amaciante 1L', brand: 'Comfort', category: 'Limpeza', price: 120, currency: 'MZN', isActive: true },

  // Doces e Snacks (81-100)
  { id: '71', barcode: '7896273302243', name: 'Chocolate ao Leite 100g', brand: 'Lacta', category: 'Doces', price: 150, currency: 'MZN', isActive: true },
  { id: '72', barcode: '7896273302244', name: 'Batata Frita 150g', brand: 'Ruffles', category: 'Snacks', price: 120, currency: 'MZN', isActive: true },
  { id: '73', barcode: '7896273302245', name: 'Pipoca Micro-ondas 100g', brand: 'Yoki', category: 'Snacks', price: 80, currency: 'MZN', isActive: true },
  { id: '74', barcode: '7896273302246', name: 'Amendoim 500g', brand: 'Dori', category: 'Snacks', price: 180, currency: 'MZN', isActive: true },
  { id: '75', barcode: '7896273302247', name: 'Bala de Goma 100g', brand: 'Fini', category: 'Doces', price: 100, currency: 'MZN', isActive: true },
  { id: '76', barcode: '7896273302248', name: 'Chiclete 100g', brand: 'Trident', category: 'Doces', price: 120, currency: 'MZN', isActive: true },
  { id: '77', barcode: '7896273302249', name: 'Pirulito 20 unidades', brand: 'Chupa Chups', category: 'Doces', price: 150, currency: 'MZN', isActive: true },
  { id: '78', barcode: '7896273302250', name: 'Sorvete 1L', brand: 'Kibon', category: 'Gelados', price: 280, currency: 'MZN', isActive: true },
  { id: '79', barcode: '7896273302251', name: 'Biscoito Wafer 140g', brand: 'Bauducco', category: 'Biscoitos', price: 100, currency: 'MZN', isActive: true },
  { id: '80', barcode: '7896273302252', name: 'Cereal Matinal 300g', brand: 'Nescau', category: 'Cereais', price: 220, currency: 'MZN', isActive: true },

  // Produtos diversos (81-100)
  { id: '81', barcode: '7896273302253', name: 'Macarrão Espaguete 500g', brand: 'Barilla', category: 'Massas', price: 180, currency: 'MZN', isActive: true },
  { id: '82', barcode: '7896273302254', name: 'Molho de Tomate 340g', brand: 'Quero', category: 'Molhos', price: 120, currency: 'MZN', isActive: true },
  { id: '83', barcode: '7896273302255', name: 'Café em Pó 500g', brand: '3 Corações', category: 'Bebidas', price: 280, currency: 'MZN', isActive: true },
  { id: '84', barcode: '7896273302256', name: 'Açúcar Refinado 1kg', brand: 'Cristal', category: 'Açúcar', price: 110, currency: 'MZN', isActive: true },
  { id: '85', barcode: '7896273302257', name: 'Vinagre 750ml', brand: 'Castelo', category: 'Temperos', price: 80, currency: 'MZN', isActive: true },
  { id: '86', barcode: '7896273302258', name: 'Azeite 500ml', brand: 'Andorinha', category: 'Óleos', price: 320, currency: 'MZN', isActive: true },
  { id: '87', barcode: '7896273302259', name: 'Tempero Completo 300g', brand: 'Knorr', category: 'Temperos', price: 150, currency: 'MZN', isActive: true },
  { id: '88', barcode: '7896273302260', name: 'Catchup 400g', brand: 'Heinz', category: 'Molhos', price: 180, currency: 'MZN', isActive: true },
  { id: '89', barcode: '7896273302261', name: 'Mostarda 200g', brand: 'Heinz', category: 'Molhos', price: 120, currency: 'MZN', isActive: true },
  { id: '90', barcode: '7896273302262', name: 'Maionese 500g', brand: 'Hellmanns', category: 'Molhos', price: 220, currency: 'MZN', isActive: true },
  { id: '91', barcode: '7896273302263', name: 'Extrato de Tomate 130g', brand: 'Quero', category: 'Molhos', price: 80, currency: 'MZN', isActive: true },
  { id: '92', barcode: '7896273302264', name: 'Milho Verde Lata 200g', brand: 'Quero', category: 'Conservas', price: 100, currency: 'MZN', isActive: true },
  { id: '93', barcode: '7896273302265', name: 'Ervilha Lata 200g', brand: 'Quero', category: 'Conservas', price: 100, currency: 'MZN', isActive: true },
  { id: '94', barcode: '7896273302266', name: 'Palmito Lata 300g', brand: 'Quero', category: 'Conservas', price: 180, currency: 'MZN', isActive: true },
  { id: '95', barcode: '7896273302267', name: 'Azeitona Verde 200g', brand: 'Quero', category: 'Conservas', price: 150, currency: 'MZN', isActive: true },
  { id: '96', barcode: '7896273302268', name: 'Pêssego em Calda 400g', brand: 'Quero', category: 'Conservas', price: 220, currency: 'MZN', isActive: true },
  { id: '97', barcode: '7896273302269', name: 'Leite de Coco 200ml', brand: 'Sococo', category: 'Laticínios', price: 120, currency: 'MZN', isActive: true },
  { id: '98', barcode: '7896273302270', name: 'Fermento em Pó 100g', brand: 'Royal', category: 'Farinhas', price: 80, currency: 'MZN', isActive: true },
  { id: '99', barcode: '7896273302271', name: 'Gelatina 85g', brand: 'Royal', category: 'Sobremesas', price: 60, currency: 'MZN', isActive: true },
  { id: '100', barcode: '7896273302272', name: 'Pudim Pronto 100g', brand: 'Royal', category: 'Sobremesas', price: 120, currency: 'MZN', isActive: true }
];

// Export sample data and mock functions for demo mode
export const DEMO_DATA = {
  customers: [
    {
      id: 'cust-1',
      email: 'cliente@teste.com',
      phone: '+258841234567',
      name: 'João Silva',
      country: 'Moçambique',
      pointsBalance: { 'store-1': 150, 'store-2': 80 },
      totalPurchases: 12500,
      totalPoints: 230,
      isActive: true,
      createdAt: '2024-01-15T10:00:00Z'
    }
  ],
  stores: [
    {
      id: 'store-1',
      name: 'Estrela Supermercado Maputo',
      country: 'Moçambique',
      province: 'Maputo',
      city: 'Maputo',
      address: 'Av. Julius Nyerere, 123',
      phone: '+258213456789',
      isActive: true,
      pointsConfig: DEFAULT_POINTS_CONFIG,
      createdAt: '2024-01-01T00:00:00Z'
    }
  ]
};