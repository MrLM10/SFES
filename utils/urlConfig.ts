/**
 * URL Configuration Manager - Simplified Version
 */

export interface UrlConfig {
  baseUrl: string;
  isProduction: boolean;
  source: string;
}

// Simple string validation
function isValidString(value: any): boolean {
  return typeof value === 'string' && value.length > 0;
}

// URL validation
function isValidUrl(url: string): boolean {
  if (!isValidString(url)) return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

// Remove trailing slash
function cleanUrl(url: string): string {
  if (!isValidString(url)) return '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

// Get environment variable from Vite
function getViteUrl(): string | null {
  try {
    // Check if we're in a Vite environment
    if (typeof globalThis !== 'undefined' && (globalThis as any).import?.meta) {
      const env = (globalThis as any).import.meta.env;
      if (env && env.VITE_APP_URL) {
        return env.VITE_APP_URL;
      }
    }
    
    // Alternative check for import.meta
    if (typeof window !== 'undefined' && (window as any).import?.meta) {
      const env = (window as any).import.meta.env;
      if (env && env.VITE_APP_URL) {
        return env.VITE_APP_URL;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

// Get environment variable from process
function getProcessUrl(): string | null {
  try {
    if (typeof globalThis !== 'undefined' && (globalThis as any).process?.env) {
      const env = (globalThis as any).process.env;
      return env.VITE_APP_URL || env.REACT_APP_URL || null;
    }
    return null;
  } catch {
    return null;
  }
}

// Get URL from localStorage
function getStoredUrl(): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('admin_base_url');
    }
    return null;
  } catch {
    return null;
  }
}

// Get current browser origin
function getBrowserOrigin(): string {
  try {
    if (typeof window !== 'undefined' && window.location) {
      return window.location.origin;
    }
    return 'http://localhost:3000';
  } catch {
    return 'http://localhost:3000';
  }
}

// Create configuration
function createConfig(): UrlConfig {
  // Try environment variables first
  const envUrl = getViteUrl() || getProcessUrl();
  if (envUrl && isValidUrl(envUrl)) {
    return {
      baseUrl: cleanUrl(envUrl),
      isProduction: true,
      source: 'environment'
    };
  }
  
  // Try localStorage
  const storedUrl = getStoredUrl();
  if (storedUrl && isValidUrl(storedUrl)) {
    return {
      baseUrl: cleanUrl(storedUrl),
      isProduction: true,
      source: 'localStorage'
    };
  }
  
  // Fallback to current origin
  return {
    baseUrl: getBrowserOrigin(),
    isProduction: false,
    source: 'fallback'
  };
}

// Generate unique ID
function generateId(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

// Save URL to localStorage
function saveUrl(url: string): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('admin_base_url', url);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export class UrlManager {
  config: UrlConfig; // Made public to fix type error
  private static instance: UrlManager | null = null;
  
  constructor() {
    this.config = createConfig();
  }
  
  static getInstance(): UrlManager {
    if (!UrlManager.instance) {
      UrlManager.instance = new UrlManager();
    }
    return UrlManager.instance;
  }
  
  getBaseUrl(): string {
    return this.config.baseUrl;
  }
  
  getConfig(): UrlConfig {
    return { ...this.config };
  }
  
  setCustomUrl(url: string): boolean {
    if (!isValidUrl(url)) return false;
    
    const cleanedUrl = cleanUrl(url);
    const saved = saveUrl(cleanedUrl);
    
    if (saved) {
      this.config = {
        baseUrl: cleanedUrl,
        isProduction: true,
        source: 'localStorage'
      };
    }
    
    return saved;
  }
  
  generateCashierLink(store: string, customId?: string): string {
    const id = customId || generateId(store);
    return `${this.getBaseUrl()}/caixa/${id}`;
  }
  
  generateAdminLink(store: string, customId?: string): string {
    const id = customId || generateId(store);
    return `${this.getBaseUrl()}/admin/${id}`;
  }
  
  generateRegistrationLink(code: string): string {
    return `${this.getBaseUrl()}/registro/${code}`;
  }
  
  getUrlExamples(): string[] {
    return [
      'https://estrela-supermercado.vercel.app',
      'https://sistema.netlify.app',
      'https://meudominio.com',
      'https://app.minhalojavirtual.com'
    ];
  }
  
  refresh(): void {
    this.config = createConfig();
  }
}

// Singleton instance with fallback
let urlManagerInstance: UrlManager | null = null;

function getUrlManager(): UrlManager {
  if (!urlManagerInstance) {
    try {
      urlManagerInstance = UrlManager.getInstance();
    } catch (error) {
      console.error('UrlManager initialization failed:', error);
      
      // Create fallback object with config property
      const fallbackOrigin = getBrowserOrigin();
      const fallbackConfig = {
        baseUrl: fallbackOrigin,
        isProduction: false,
        source: 'fallback'
      };
      
      urlManagerInstance = {
        config: fallbackConfig,
        getBaseUrl: () => fallbackOrigin,
        getConfig: () => fallbackConfig,
        setCustomUrl: () => false,
        generateCashierLink: (store: string, customId?: string) => {
          const id = customId || store;
          return `${fallbackOrigin}/caixa/${id}`;
        },
        generateAdminLink: (store: string, customId?: string) => {
          const id = customId || store;
          return `${fallbackOrigin}/admin/${id}`;
        },
        generateRegistrationLink: (code: string) => `${fallbackOrigin}/registro/${code}`,
        getUrlExamples: () => ['https://exemplo.com'],
        refresh: () => {}
      } as UrlManager;
    }
  }
  
  return urlManagerInstance;
}

// Export utility functions
export function getBaseUrl(): string {
  try {
    return getUrlManager().getBaseUrl();
  } catch (error) {
    console.error('getBaseUrl failed:', error);
    return getBrowserOrigin();
  }
}

export function generateCashierLink(store: string, customId?: string): string {
  try {
    return getUrlManager().generateCashierLink(store, customId);
  } catch (error) {
    console.error('generateCashierLink failed:', error);
    const id = customId || store;
    return `${getBrowserOrigin()}/caixa/${id}`;
  }
}

export function generateAdminLink(store: string, customId?: string): string {
  try {
    return getUrlManager().generateAdminLink(store, customId);
  } catch (error) {
    console.error('generateAdminLink failed:', error);
    const id = customId || store;
    return `${getBrowserOrigin()}/admin/${id}`;
  }
}

export function generateRegistrationLink(code: string): string {
  try {
    return getUrlManager().generateRegistrationLink(code);
  } catch (error) {
    console.error('generateRegistrationLink failed:', error);
    return `${getBrowserOrigin()}/registro/${code}`;
  }
}

export const urlManager = getUrlManager();