import { projectId, publicAnonKey } from './supabase/info'

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-a8c4406a`

export class ApiClient {
  private accessToken: string | null = null

  setAccessToken(token: string | null) {
    this.accessToken = token
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.accessToken || publicAnonKey}`,
      ...options.headers as Record<string, string>
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`)
    }

    return data
  }

  // Auth methods
  async signUp(userData: {
    email: string
    password: string
    name: string
    phone?: string
    province?: string
    country: string
    userType?: 'customer' | 'caixa' | 'admin_comum' | 'admin_geral'
  }) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
  }

  async signIn(email: string, password: string) {
    return this.request('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
  }

  // User methods
  async getProfile() {
    return this.request('/user/profile')
  }

  async getHistory() {
    return this.request('/user/history')
  }

  // Store methods
  async getStores() {
    return this.request('/stores')
  }

  async createStore(storeData: {
    name: string
    country: string
    province: string
    address?: string
  }) {
    return this.request('/stores', {
      method: 'POST',
      body: JSON.stringify(storeData)
    })
  }

  // Transaction methods
  async createTransaction(transactionData: {
    customer_id: string
    store_id: string
    amount: number
    items: any[]
  }) {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData)
    })
  }

  async redeemPoints(redemptionData: {
    points_to_redeem: number
    store_id: string
  }) {
    return this.request('/redeem-points', {
      method: 'POST',
      body: JSON.stringify(redemptionData)
    })
  }

  // Admin methods
  async getPendingApprovals() {
    return this.request('/admin/pending-approvals')
  }

  async approveUser(userId: string, approved: boolean) {
    return this.request('/admin/approve-user', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, approved })
    })
  }

  async getAdminStats() {
    return this.request('/admin/stats')
  }

  // Configuration methods
  async getCountriesConfig() {
    return this.request('/config/countries')
  }

  async getPointsConfig() {
    return this.request('/config/points')
  }

  async updatePointsConfig(config: {
    points_config: any[]
    country?: string
    store_id?: string
  }) {
    return this.request('/config/points', {
      method: 'POST',
      body: JSON.stringify(config)
    })
  }

  // Customer lookup for cashiers
  async lookupCustomer(query: string) {
    return this.request(`/customer/lookup?query=${encodeURIComponent(query)}`)
  }

  // Health check
  async healthCheck() {
    return this.request('/health')
  }
}

export const apiClient = new ApiClient()