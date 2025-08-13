import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

const app = new Hono();

// CORS configuration
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.use('*', logger(console.log));

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Helper function to authenticate user
async function authenticateUser(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Authorization header missing or invalid' };
  }

  const token = authHeader.split(' ')[1];
  
  // Handle demo tokens
  if (token.startsWith('demo_token_')) {
    const userId = token.replace('demo_token_', '');
    const profile = await getUserProfile(userId);
    if (profile) {
      return { user: { id: userId, email: profile.email }, error: null };
    }
    return { user: null, error: 'Invalid demo token' };
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return { user: null, error: 'Invalid token' };
    }
    return { user, error: null };
  } catch (error) {
    return { user: null, error: 'Authentication failed' };
  }
}

// Helper function to get user profile
async function getUserProfile(userId: string) {
  try {
    const profile = await kv.get(`user_profile:${userId}`);
    return profile;
  } catch (error) {
    console.error(`Error getting user profile: ${error}`);
    return null;
  }
}

// Routes

// Health check
app.get('/make-server-a8c4406a/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// User Authentication Routes

// Register new user
app.post('/make-server-a8c4406a/auth/register', async (c) => {
  try {
    const body = await c.req.json();
    const { email, phone, password, name, country, province, userType = 'customer' } = body;

    console.log('Registration attempt:', { email, name, userType, country, province });

    if (!email || !password || !name) {
      return c.json({ error: 'Missing required fields: email, password, name' }, 400);
    }

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name, 
        country: country || 'MZ', 
        province: province || 'Maputo', 
        userType,
        phone 
      },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.error('Supabase auth error:', error);
      return c.json({ error: 'Registration failed', details: error.message }, 400);
    }

    if (!data.user) {
      console.error('No user data returned from Supabase');
      return c.json({ error: 'Registration failed', details: 'No user data returned' }, 400);
    }

    // Store user profile in KV store
    const userProfile = {
      id: data.user.id,
      email,
      phone: phone || '',
      name,
      country: country || 'MZ',
      province: province || 'Maputo',
      userType,
      totalPoints: 0,
      createdAt: new Date().toISOString(),
      isActive: true,
      isApproved: userType === 'customer' ? true : false
    };

    try {
      await kv.set(`user_profile:${data.user.id}`, userProfile);
      
      // Initialize additional data structures
      if (userType === 'customer') {
        await kv.set(`customer_stores:${data.user.id}`, []);
        await kv.set(`customer_transactions:${data.user.id}`, []);
      }
      
      console.log('User profile created successfully:', userProfile.id);
    } catch (kvError) {
      console.error('KV store error:', kvError);
      // Continue anyway, as the user is created in Supabase
    }

    return c.json({ 
      success: true, 
      user: { 
        id: data.user.id, 
        email, 
        name, 
        userType,
        country: userProfile.country,
        province: userProfile.province
      } 
    });

  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'Registration failed', details: error.message }, 500);
  }
});

// Login user
app.post('/make-server-a8c4406a/auth/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    console.log('Login attempt:', { email });

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    // Check for demo/test credentials first
    const testCredentials = {
      'cliente@teste.com': { name: 'João Silva', userType: 'customer', totalPoints: 125 },
      'caixa@teste.com': { name: 'Maria Santos', userType: 'cashier', totalPoints: 0 },
      'admin@teste.com': { name: 'Carlos Oliveira', userType: 'admin_geral', totalPoints: 0 }
    };

    if (testCredentials[email as keyof typeof testCredentials] && password === 'senha123') {
      console.log('Using demo login for:', email);
      
      const testUser = testCredentials[email as keyof typeof testCredentials];
      const userId = `demo_${email.split('@')[0]}`;
      
      // Create/update demo user profile
      const profile = {
        id: userId,
        email,
        phone: email === 'cliente@teste.com' ? '+258 84 123 4567' : '',
        name: testUser.name,
        country: 'MZ',
        province: 'Maputo',
        userType: testUser.userType,
        totalPoints: testUser.totalPoints,
        createdAt: new Date().toISOString(),
        isActive: true,
        isApproved: true
      };
      
      try {
        await kv.set(`user_profile:${userId}`, profile);
        if (profile.userType === 'customer') {
          await kv.set(`customer_stores:${userId}`, [
            { storeId: 'store_1', points: 45, lastVisit: new Date().toISOString() },
            { storeId: 'store_2', points: 80, lastVisit: new Date(Date.now() - 86400000).toISOString() }
          ]);
          await kv.set(`customer_transactions:${userId}`, [
            {
              id: `txn_${Date.now()}_${userId}`,
              type: 'earned',
              points: 10,
              amount: 1250,
              storeId: 'store_1',
              date: new Date().toISOString()
            }
          ]);
        }
      } catch (kvError) {
        console.error('KV store error during demo profile creation:', kvError);
      }
      
      // Create a mock session for demo purposes
      const mockSession = {
        access_token: `demo_token_${userId}`,
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: {
          id: userId,
          email,
          ...testUser
        }
      };
      
      return c.json({ 
        success: true, 
        session: mockSession,
        user: profile
      });
    }

    // Try Supabase Auth for real users
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Supabase auth error:', error);
      return c.json({ error: 'Login failed', details: error.message }, 401);
    }

    if (!data.user || !data.session) {
      console.error('No user or session data returned from Supabase');
      return c.json({ error: 'Login failed', details: 'No session created' }, 401);
    }

    // Get user profile from KV store
    let profile = await getUserProfile(data.user.id);
    
    // If no profile exists, create one from user metadata
    if (!profile && data.user.user_metadata) {
      console.log('Creating profile from user metadata');
      const metadata = data.user.user_metadata;
      profile = {
        id: data.user.id,
        email: data.user.email || email,
        phone: metadata.phone || '',
        name: metadata.name || 'User',
        country: metadata.country || 'MZ',
        province: metadata.province || 'Maputo',
        userType: metadata.userType || 'customer',
        totalPoints: 0,
        createdAt: data.user.created_at,
        isActive: true,
        isApproved: metadata.userType === 'customer' ? true : false
      };
      
      try {
        await kv.set(`user_profile:${data.user.id}`, profile);
        if (profile.userType === 'customer') {
          await kv.set(`customer_stores:${data.user.id}`, []);
          await kv.set(`customer_transactions:${data.user.id}`, []);
        }
      } catch (kvError) {
        console.error('KV store error during profile creation:', kvError);
      }
    }

    return c.json({ 
      success: true, 
      session: data.session,
      user: profile || {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || 'User',
        userType: data.user.user_metadata?.userType || 'customer',
        country: 'MZ',
        province: 'Maputo',
        totalPoints: 0
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed', details: error.message }, 500);
  }
});

// Send OTP for phone authentication
app.post('/make-server-a8c4406a/auth/send-otp', async (c) => {
  try {
    const { phone } = await c.req.json();

    const { data, error } = await supabase.auth.signInWithOtp({
      phone
    });

    if (error) {
      console.log(`OTP send error: ${error.message}`);
      return c.json({ error: 'Failed to send OTP', details: error.message }, 400);
    }

    return c.json({ success: true, message: 'OTP sent successfully' });

  } catch (error) {
    console.log(`OTP send error: ${error}`);
    return c.json({ error: 'Failed to send OTP', details: error.message }, 500);
  }
});

// Verify OTP
app.post('/make-server-a8c4406a/auth/verify-otp', async (c) => {
  try {
    const { phone, token } = await c.req.json();

    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    });

    if (error) {
      console.log(`OTP verification error: ${error.message}`);
      return c.json({ error: 'OTP verification failed', details: error.message }, 400);
    }

    // Get user profile
    const profile = await getUserProfile(data.user.id);

    return c.json({ 
      success: true, 
      session: data.session,
      user: profile 
    });

  } catch (error) {
    console.log(`OTP verification error: ${error}`);
    return c.json({ error: 'OTP verification failed', details: error.message }, 500);
  }
});

// Get current user profile
app.get('/make-server-a8c4406a/auth/profile', async (c) => {
  const { user, error } = await authenticateUser(c.req);
  
  if (error || !user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const profile = await getUserProfile(user.id);
  
  if (!profile) {
    return c.json({ error: 'Profile not found' }, 404);
  }

  return c.json({ user: profile });
});

// Customer Routes

// Get customer dashboard data
app.get('/make-server-a8c4406a/customer/dashboard', async (c) => {
  const { user, error } = await authenticateUser(c.req);
  
  if (error || !user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const profile = await getUserProfile(user.id);
    if (!profile) {
      return c.json({ error: 'User profile not found' }, 404);
    }
    
    const storePoints = await kv.get(`customer_stores:${user.id}`) || [];
    const transactions = await kv.get(`customer_transactions:${user.id}`) || [];

    return c.json({
      profile,
      storePoints,
      transactions: transactions.slice(0, 10), // Last 10 transactions
      totalPoints: profile.totalPoints || 0
    });

  } catch (error) {
    console.error(`Dashboard error: ${error}`);
    return c.json({ error: 'Failed to load dashboard', details: error.message }, 500);
  }
});

// Get customer transaction history
app.get('/make-server-a8c4406a/customer/transactions', async (c) => {
  const { user, error } = await authenticateUser(c.req);
  
  if (error || !user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const transactions = await kv.get(`customer_transactions:${user.id}`) || [];
    
    return c.json({ transactions });

  } catch (error) {
    console.log(`Transactions error: ${error}`);
    return c.json({ error: 'Failed to load transactions', details: error.message }, 500);
  }
});

// Redeem points for discount
app.post('/make-server-a8c4406a/customer/redeem', async (c) => {
  const { user, error } = await authenticateUser(c.req);
  
  if (error || !user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { points, storeId } = await c.req.json();
    
    const profile = await getUserProfile(user.id);
    if (!profile || profile.totalPoints < points) {
      return c.json({ error: 'Insufficient points' }, 400);
    }

    // Update user points
    profile.totalPoints -= points;
    await kv.set(`user_profile:${user.id}`, profile);

    // Add transaction record
    const transactions = await kv.get(`customer_transactions:${user.id}`) || [];
    const newTransaction = {
      id: `txn_${Date.now()}_${user.id}`,
      type: 'redeemed',
      points: -points,
      amount: 0,
      storeId,
      date: new Date().toISOString()
    };
    
    transactions.unshift(newTransaction);
    await kv.set(`customer_transactions:${user.id}`, transactions);

    return c.json({ 
      success: true, 
      remainingPoints: profile.totalPoints,
      transaction: newTransaction 
    });

  } catch (error) {
    console.log(`Redeem error: ${error}`);
    return c.json({ error: 'Failed to redeem points', details: error.message }, 500);
  }
});

// Cashier Routes

// Record a sale and award points
app.post('/make-server-a8c4406a/cashier/sale', async (c) => {
  const { user, error } = await authenticateUser(c.req);
  
  if (error || !user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { customerId, items, total, storeId } = await c.req.json();
    
    // Validate cashier permissions
    const cashierProfile = await getUserProfile(user.id);
    if (!cashierProfile || !['cashier', 'admin_comum', 'admin_geral'].includes(cashierProfile.userType)) {
      return c.json({ error: 'Unauthorized - Cashier or admin access required' }, 403);
    }

    // Calculate points based on total
    const pointsRules = await kv.get('points_rules:default') || [
      { min: 500, max: 5000, points: 10 },
      { min: 6000, max: 13000, points: 20 },
      { min: 14000, max: 26000, points: 30 },
      { min: 27000, max: 34000, points: 40 },
      { min: 35000, max: 42000, points: 50 },
      { min: 43000, max: 47000, points: 60 },
      { min: 48000, max: 1000000, points: 80 }
    ];

    const rule = pointsRules.find(r => total >= r.min && total <= r.max);
    const pointsEarned = rule ? rule.points : 0;

    // Update customer points
    const customerProfile = await getUserProfile(customerId);
    if (customerProfile) {
      customerProfile.totalPoints += pointsEarned;
      await kv.set(`user_profile:${customerId}`, customerProfile);

      // Update customer store points
      const storePoints = await kv.get(`customer_stores:${customerId}`) || [];
      const storeIndex = storePoints.findIndex(s => s.storeId === storeId);
      
      if (storeIndex >= 0) {
        storePoints[storeIndex].points += pointsEarned;
        storePoints[storeIndex].lastVisit = new Date().toISOString();
      } else {
        storePoints.push({
          storeId,
          points: pointsEarned,
          lastVisit: new Date().toISOString()
        });
      }
      
      await kv.set(`customer_stores:${customerId}`, storePoints);

      // Add transaction record
      const transactions = await kv.get(`customer_transactions:${customerId}`) || [];
      const newTransaction = {
        id: `txn_${Date.now()}_${customerId}`,
        type: 'earned',
        points: pointsEarned,
        amount: total,
        storeId,
        items,
        date: new Date().toISOString(),
        cashierId: user.id
      };
      
      transactions.unshift(newTransaction);
      await kv.set(`customer_transactions:${customerId}`, transactions);

      // Store sale record
      const saleRecord = {
        id: `sale_${Date.now()}_${storeId}`,
        customerId,
        cashierId: user.id,
        storeId,
        items,
        total,
        pointsAwarded: pointsEarned,
        date: new Date().toISOString()
      };
      
      await kv.set(`sale:${saleRecord.id}`, saleRecord);

      return c.json({ 
        success: true, 
        pointsAwarded: pointsEarned,
        sale: saleRecord 
      });
    } else {
      return c.json({ error: 'Customer not found' }, 404);
    }

  } catch (error) {
    console.log(`Sale recording error: ${error}`);
    return c.json({ error: 'Failed to record sale', details: error.message }, 500);
  }
});

// Find customer by email or phone
app.get('/make-server-a8c4406a/cashier/customer/:identifier', async (c) => {
  const { user, error } = await authenticateUser(c.req);
  
  if (error || !user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const identifier = c.req.param('identifier');
    
    console.log('Searching for customer:', identifier);
    
    // Search for customer by email or phone
    const userProfiles = await kv.getByPrefix('user_profile:');
    
    const customer = userProfiles.find(profile => 
      profile && (
        profile.email === identifier || 
        profile.phone === identifier ||
        (profile.phone && profile.phone.includes(identifier)) ||
        (profile.email && profile.email.toLowerCase().includes(identifier.toLowerCase()))
      )
    );

    if (!customer) {
      console.log('Customer not found, available users:', userProfiles.length);
      return c.json({ error: 'Customer not found' }, 404);
    }

    // Return customer info without sensitive data
    const safeCustomer = {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      totalPoints: customer.totalPoints || 0,
      province: customer.province,
      userType: customer.userType
    };
    
    console.log('Customer found:', safeCustomer.name);
    return c.json({ customer: safeCustomer });

  } catch (error) {
    console.error('Customer search error:', error);
    return c.json({ error: 'Failed to find customer', details: error.message }, 500);
  }
});

// Admin Routes

// Get admin dashboard data
app.get('/make-server-a8c4406a/admin/dashboard', async (c) => {
  const { user, error } = await authenticateUser(c.req);
  
  if (error || !user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const adminProfile = await getUserProfile(user.id);
    if (!adminProfile || !['admin_comum', 'admin_geral'].includes(adminProfile.userType)) {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    // Get system statistics
    const allUsers = await kv.getByPrefix('user_profile:');
    const allSales = await kv.getByPrefix('sale:');
    
    const customers = allUsers.filter(u => u.userType === 'customer');
    const totalCustomers = customers.length;
    const totalPoints = customers.reduce((sum, c) => sum + (c.totalPoints || 0), 0);
    const totalSales = allSales.reduce((sum, s) => sum + (s.total || 0), 0);

    return c.json({
      stats: {
        totalCustomers,
        totalPoints,
        totalSales,
        totalStores: adminProfile.userType === 'admin_geral' ? 3 : 1
      },
      recentSales: allSales.slice(0, 10)
    });

  } catch (error) {
    console.log(`Admin dashboard error: ${error}`);
    return c.json({ error: 'Failed to load dashboard', details: error.message }, 500);
  }
});

// Approve pending user
app.post('/make-server-a8c4406a/admin/approve/:userId', async (c) => {
  const { user, error } = await authenticateUser(c.req);
  
  if (error || !user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const adminProfile = await getUserProfile(user.id);
    if (!adminProfile || !['admin_comum', 'admin_geral'].includes(adminProfile.userType)) {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    const userId = c.req.param('userId');
    const userProfile = await getUserProfile(userId);
    
    if (!userProfile) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Update user status
    userProfile.isApproved = true;
    userProfile.approvedBy = user.id;
    userProfile.approvedAt = new Date().toISOString();
    
    await kv.set(`user_profile:${userId}`, userProfile);

    return c.json({ success: true, user: userProfile });

  } catch (error) {
    console.log(`User approval error: ${error}`);
    return c.json({ error: 'Failed to approve user', details: error.message }, 500);
  }
});

// Update points configuration (Admin Geral only)
app.post('/make-server-a8c4406a/admin/config/points', async (c) => {
  const { user, error } = await authenticateUser(c.req);
  
  if (error || !user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const adminProfile = await getUserProfile(user.id);
    if (!adminProfile || adminProfile.userType !== 'admin_geral') {
      return c.json({ error: 'Unauthorized - Global admin access required' }, 403);
    }

    const { country, storeId, pointsRules } = await c.req.json();
    
    const configKey = storeId ? `points_rules:${country}:${storeId}` : `points_rules:${country}`;
    await kv.set(configKey, pointsRules);

    return c.json({ success: true, message: 'Points configuration updated' });

  } catch (error) {
    console.log(`Points config error: ${error}`);
    return c.json({ error: 'Failed to update configuration', details: error.message }, 500);
  }
});

// Get all users for admin management
app.get('/make-server-a8c4406a/admin/users', async (c) => {
  const { user, error } = await authenticateUser(c.req);
  
  if (error || !user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const adminProfile = await getUserProfile(user.id);
    if (!adminProfile || !['admin_comum', 'admin_geral'].includes(adminProfile.userType)) {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    const userProfiles = await kv.getByPrefix('user_profile:');
    
    // Filter users based on admin type
    let filteredUsers = userProfiles;
    if (adminProfile.userType === 'admin_comum') {
      // Common admin can only see users from their store/region
      filteredUsers = userProfiles.filter(u => 
        u && u.province === adminProfile.province && 
        u.country === adminProfile.country
      );
    }

    // Remove sensitive information and ensure clean data
    const safeUsers = filteredUsers.filter(user => user && user.id).map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      country: user.country,
      province: user.province,
      userType: user.userType,
      totalPoints: user.totalPoints || 0,
      isApproved: user.isApproved,
      createdAt: user.createdAt
    }));

    return c.json({ users: safeUsers });

  } catch (error) {
    console.error('Users listing error:', error);
    return c.json({ error: 'Failed to load users', details: error.message }, 500);
  }
});

// Configuration routes
app.get('/make-server-a8c4406a/config/countries', async (c) => {
  try {
    const countries = await kv.get('countries_config') || [];
    return c.json({ success: true, countries });
  } catch (error) {
    console.error('Countries config error:', error);
    return c.json({ error: 'Failed to get countries configuration', details: error.message }, 500);
  }
});

app.get('/make-server-a8c4406a/config/points', async (c) => {
  try {
    const pointsConfig = await kv.get('points_config_default') || [];
    return c.json({ success: true, points_config: pointsConfig });
  } catch (error) {
    console.error('Points config error:', error);
    return c.json({ error: 'Failed to get points configuration', details: error.message }, 500);
  }
});

// Generate invitation link (Admin Geral only)
app.post('/make-server-a8c4406a/admin/generate-invite', async (c) => {
  const { user, error } = await authenticateUser(c.req);
  
  if (error || !user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const adminProfile = await getUserProfile(user.id);
    if (!adminProfile || adminProfile.userType !== 'admin_geral') {
      return c.json({ error: 'Unauthorized - Global admin access required' }, 403);
    }

    const { userType, country, province, storeName } = await c.req.json();
    
    const inviteCode = `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const invitation = {
      code: inviteCode,
      userType,
      country,
      province,
      storeName,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      isUsed: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };

    await kv.set(`invitation:${inviteCode}`, invitation);

    return c.json({ 
      success: true, 
      inviteCode,
      inviteLink: `${Deno.env.get('SUPABASE_URL')}/functions/v1/make-server-a8c4406a/invite/${inviteCode}`
    });

  } catch (error) {
    console.error('Invite generation error:', error);
    return c.json({ error: 'Failed to generate invitation', details: error.message }, 500);
  }
});

// Use invitation link
app.get('/make-server-a8c4406a/invite/:code', async (c) => {
  try {
    const code = c.req.param('code');
    const invitation = await kv.get(`invitation:${code}`);
    
    if (!invitation) {
      return c.json({ error: 'Invalid invitation code' }, 404);
    }

    if (invitation.isUsed) {
      return c.json({ error: 'Invitation already used' }, 400);
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      return c.json({ error: 'Invitation expired' }, 400);
    }

    return c.json({ invitation });

  } catch (error) {
    console.log(`Invitation validation error: ${error}`);
    return c.json({ error: 'Failed to validate invitation', details: error.message }, 500);
  }
});

// Initialize system data on startup
async function initializeSystem() {
  try {
    console.log('Initializing system data...');
    
    // Initialize default countries configuration
    const countries = [
      { code: 'MZ', name: 'Moçambique', ddi: '+258', currency: 'MZN', flag: '🇲🇿' },
      { code: 'ZA', name: 'África do Sul', ddi: '+27', currency: 'ZAR', flag: '🇿🇦' },
      { code: 'US', name: 'Estados Unidos', ddi: '+1', currency: 'USD', flag: '🇺🇸' },
      { code: 'BR', name: 'Brasil', ddi: '+55', currency: 'BRL', flag: '🇧🇷' }
    ];
    
    await kv.set('countries_config', countries);
    
    // Initialize default points configuration
    const pointsConfig = [
      { min: 500, max: 5000, points: 10, discount: 10 },
      { min: 6000, max: 13000, points: 20, discount: 10 },
      { min: 14000, max: 26000, points: 30, discount: 10 },
      { min: 27000, max: 34000, points: 40, discount: 10 },
      { min: 35000, max: 42000, points: 50, discount: 10 },
      { min: 43000, max: 47000, points: 60, discount: 10 },
      { min: 48000, max: 1000000, points: 80, discount: 10 }
    ];
    
    await kv.set('points_config_default', pointsConfig);
    
    console.log('System initialization completed');
  } catch (error) {
    console.error('Error initializing system:', error);
  }
}

// Initialize system on startup
initializeSystem();

// Error handling middleware
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: 'Internal server error', details: err.message }, 500);
});

console.log('Starting Estrela Supermercado server...');
console.log('Demo credentials available: cliente@teste.com, caixa@teste.com, admin@teste.com (password: senha123)');

// Start server
Deno.serve(app.fetch);