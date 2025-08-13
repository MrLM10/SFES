export const ADMIN_STATS = {
  totalCustomers: 1250,
  totalStores: 8,
  totalAdmins: 12,
  totalPurchases: 4890,
  totalPoints: 125480,
  activeCountries: 3
};

export const RECENT_ACTIVITIES = [
  {
    id: '1',
    type: 'new_registration',
    message: 'Nova solicitação de João Silva (Shoprite Maputo)',
    timestamp: '2024-01-17T10:30:00Z',
    status: 'pending'
  },
  {
    id: '2',
    type: 'admin_approved',
    message: 'Maria Costa aprovada como admin (Shoprite Beira)',
    timestamp: '2024-01-16T15:45:00Z',
    status: 'approved'
  },
  {
    id: '3',
    type: 'purchase',
    message: 'Compra de 2,500 MZN registrada - Cliente: Ana Santos',
    timestamp: '2024-01-16T14:20:00Z',
    status: 'completed'
  }
];

export const DEMO_STORES = [
  {
    id: 'store-1',
    name: 'Shoprite Maputo Central',
    country: 'Moçambique',
    province: 'Maputo',
    city: 'Maputo',
    address: 'Av. Julius Nyerere, 123',
    phone: '+258 21 123 456',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    adminId: 'admin-comum-1'
  },
  {
    id: 'store-2',
    name: 'Shoprite Beira',
    country: 'Moçambique',
    province: 'Sofala',
    city: 'Beira',
    address: 'Av. do Zimbabwe, 456',
    phone: '+258 23 456 789',
    isActive: true,
    createdAt: '2024-01-05T00:00:00Z',
    adminId: 'admin-comum-2'
  },
  {
    id: 'store-3',
    name: 'Shoprite Nampula',
    country: 'Moçambique',
    province: 'Nampula',
    city: 'Nampula',
    address: 'Av. Eduardo Mondlane, 789',
    phone: '+258 26 789 012',
    isActive: true,
    createdAt: '2024-01-10T00:00:00Z'
  }
];

export const DEMO_CUSTOMERS = [
  {
    id: 'customer-1',
    email: 'ana.santos@email.com',
    phone: '+258841234567',
    name: 'Ana Santos',
    country: 'Moçambique',
    pointsBalance: { 'store-1': 150, 'store-2': 80 },
    totalPurchases: 5420,
    totalPoints: 280,
    isActive: true,
    createdAt: '2024-01-10T10:00:00Z'
  },
  {
    id: 'customer-2',
    email: 'joão.manuel@email.com',
    phone: '+258847654321',
    name: 'João Manuel',
    country: 'Moçambique',
    pointsBalance: { 'store-1': 200 },
    totalPurchases: 8900,
    totalPoints: 450,
    isActive: true,
    createdAt: '2024-01-05T14:30:00Z'
  },
  {
    id: 'customer-3',
    email: 'maria.costa@email.com',
    phone: '+258843216789',
    name: 'Maria Costa',
    country: 'Moçambique',
    pointsBalance: { 'store-2': 120, 'store-3': 60 },
    totalPurchases: 3200,
    totalPoints: 180,
    isActive: true,
    createdAt: '2024-01-15T09:15:00Z'
  }
];

export const DEMO_PURCHASES = [
  {
    id: 'purchase-1',
    customerId: 'customer-1',
    storeId: 'store-1',
    cashierId: 'cashier-1',
    items: [
      { productId: '1', productName: 'Arroz 5kg', quantity: 2, unitPrice: 450, totalPrice: 900 },
      { productId: '9', productName: 'Coca-Cola 2L', quantity: 1, unitPrice: 150, totalPrice: 150 }
    ],
    totalAmount: 1050,
    currency: 'MZN',
    pointsEarned: 20,
    pointsUsed: 0,
    discountApplied: 0,
    paymentMethod: 'cash',
    status: 'completed',
    createdAt: '2024-01-17T14:30:00Z'
  }
];

export const DEMO_ANALYTICS = {
  totalSales: 125680,
  totalCustomers: 1250,
  totalPoints: 8940,
  salesByPeriod: [
    { date: '2024-01-01', sales: 15000, customers: 180 },
    { date: '2024-01-02', sales: 18000, customers: 220 },
    { date: '2024-01-03', sales: 16500, customers: 195 },
    { date: '2024-01-04', sales: 20000, customers: 245 },
    { date: '2024-01-05', sales: 17800, customers: 210 }
  ],
  topProducts: [
    { name: 'Arroz 5kg', quantity: 450, revenue: 202500 },
    { name: 'Coca-Cola 2L', quantity: 380, revenue: 57000 },
    { name: 'Óleo de Soja', quantity: 320, revenue: 64000 }
  ],
  customerGrowth: 15.8,
  salesGrowth: 23.4
};