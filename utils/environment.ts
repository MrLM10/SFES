/**
 * Environment Detection - Simplified Version
 */

export interface EnvironmentInfo {
  isBrowser: boolean;
  isNode: boolean;
  isFigma: boolean;
  isVercel: boolean;
  isNetlify: boolean;
  isDevelopment: boolean;
  isProduction: boolean;
}

// Browser detection
function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined';
}

// Node detection
function isNodeEnvironment(): boolean {
  return typeof process !== 'undefined' && 
         process.versions !== undefined && 
         process.versions.node !== undefined;
}

// Figma detection
function isFigmaEnvironment(): boolean {
  if (!isBrowserEnvironment()) return false;
  
  try {
    const hostname = window.location.hostname;
    return hostname.includes('figma');
  } catch {
    return false;
  }
}

// Vercel detection
function isVercelEnvironment(): boolean {
  if (!isNodeEnvironment()) return false;
  
  try {
    return Boolean(process.env.VERCEL);
  } catch {
    return false;
  }
}

// Netlify detection
function isNetlifyEnvironment(): boolean {
  if (!isNodeEnvironment()) return false;
  
  try {
    return Boolean(process.env.NETLIFY);
  } catch {
    return false;
  }
}

// Development environment detection
function isDevelopmentEnvironment(): boolean {
  // Check Node environment
  if (isNodeEnvironment()) {
    try {
      const nodeEnv = process.env.NODE_ENV;
      if (nodeEnv === 'development') return true;
    } catch {
      // Silent fail
    }
  }
  
  // Check browser environment
  if (isBrowserEnvironment()) {
    try {
      const hostname = window.location.hostname;
      
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return true;
      }
      
      if (hostname.includes('figma')) {
        return true;
      }
    } catch {
      // Silent fail
    }
  }
  
  return false;
}

// Production environment detection
function isProductionEnvironment(): boolean {
  // Check Node environment
  if (isNodeEnvironment()) {
    try {
      const nodeEnv = process.env.NODE_ENV;
      if (nodeEnv === 'production') return true;
    } catch {
      // Silent fail
    }
  }
  
  // If development is detected, it's not production
  if (isDevelopmentEnvironment()) {
    return false;
  }
  
  return true;
}

export class EnvironmentDetector {
  private static cachedInfo: EnvironmentInfo | null = null;
  
  static getInfo(): EnvironmentInfo {
    if (this.cachedInfo) {
      return this.cachedInfo;
    }
    
    this.cachedInfo = {
      isBrowser: isBrowserEnvironment(),
      isNode: isNodeEnvironment(),
      isFigma: isFigmaEnvironment(),
      isVercel: isVercelEnvironment(),
      isNetlify: isNetlifyEnvironment(),
      isDevelopment: isDevelopmentEnvironment(),
      isProduction: isProductionEnvironment()
    };
    
    return this.cachedInfo;
  }
  
  static getEnvironmentVariable(name: string): string | undefined {
    // Try Vite environment variables
    try {
      if (typeof globalThis !== 'undefined' && globalThis.import && globalThis.import.meta) {
        const env = globalThis.import.meta.env;
        if (env && env[name]) {
          const value = env[name];
          if (typeof value === 'string' && value.length > 0) {
            return value;
          }
        }
      }
    } catch {
      // Silent fail
    }
    
    // Try process environment variables
    try {
      if (typeof process !== 'undefined' && process.env) {
        const value = process.env[name];
        if (typeof value === 'string' && value.length > 0) {
          return value;
        }
      }
    } catch {
      // Silent fail
    }
    
    return undefined;
  }
  
  static getSafeBaseUrl(): string {
    // Try environment variables
    const viteUrl = this.getEnvironmentVariable('VITE_APP_URL');
    if (viteUrl && this.isValidUrl(viteUrl)) {
      return this.cleanUrl(viteUrl);
    }
    
    const reactUrl = this.getEnvironmentVariable('REACT_APP_URL');
    if (reactUrl && this.isValidUrl(reactUrl)) {
      return this.cleanUrl(reactUrl);
    }
    
    // Try localStorage
    if (isBrowserEnvironment()) {
      try {
        const storedUrl = localStorage.getItem('admin_base_url');
        if (storedUrl && this.isValidUrl(storedUrl)) {
          return this.cleanUrl(storedUrl);
        }
      } catch {
        // Silent fail
      }
    }
    
    // Fallback to current origin or localhost
    if (isBrowserEnvironment()) {
      try {
        return window.location.origin;
      } catch {
        // Silent fail
      }
    }
    
    return 'http://localhost:3000';
  }
  
  static isValidUrl(url: string): boolean {
    if (!url || typeof url !== 'string' || url.length === 0) {
      return false;
    }
    
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }
  
  static cleanUrl(url: string): string {
    if (!url) return '';
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }
  
  static logEnvironmentInfo(): void {
    const info = this.getInfo();
    const baseUrl = this.getSafeBaseUrl();
    
    console.group('Environment Info');
    console.log('Environment:', info);
    console.log('Base URL:', baseUrl);
    console.groupEnd();
  }
}

// Export utility functions
export function getEnvironmentInfo(): EnvironmentInfo {
  return EnvironmentDetector.getInfo();
}

export function getEnvironmentVariable(name: string): string | undefined {
  return EnvironmentDetector.getEnvironmentVariable(name);
}

export function getSafeBaseUrl(): string {
  return EnvironmentDetector.getSafeBaseUrl();
}

export function logEnvironmentInfo(): void {
  EnvironmentDetector.logEnvironmentInfo();
}