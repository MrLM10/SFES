/**
 * Simple URL Helper - Clean TypeScript Version
 */

// Simple URL extraction function
function extractBaseUrl(): string {
  // Try environment variables via globalThis
  try {
    if (typeof globalThis !== 'undefined') {
      const envFromGlobal = (globalThis as any).import?.meta?.env;
      if (envFromGlobal && envFromGlobal.VITE_APP_URL) {
        const url = envFromGlobal.VITE_APP_URL;
        if (typeof url === 'string' && url.length > 0) {
          return url.endsWith('/') ? url.slice(0, -1) : url;
        }
      }
    }
  } catch (e) {
    // Silent fail
  }

  // Try process environment
  try {
    if (typeof process !== 'undefined' && process.env) {
      const url = process.env.VITE_APP_URL || process.env.REACT_APP_URL;
      if (url && typeof url === 'string' && url.length > 0) {
        return url.endsWith('/') ? url.slice(0, -1) : url;
      }
    }
  } catch (e) {
    // Silent fail
  }

  // Try localStorage
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const url = localStorage.getItem('admin_base_url');
      if (url && typeof url === 'string' && url.length > 0) {
        return url.endsWith('/') ? url.slice(0, -1) : url;
      }
    }
  } catch (e) {
    // Silent fail
  }

  // Browser fallback
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }

  // Final fallback
  return 'http://localhost:3000';
}

// Generate unique ID
function generateUniqueId(prefix: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${randomStr}`;
}

// Validate URL
function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Export functions
export function createCashierLink(storeId: string, linkId?: string): string {
  const baseUrl = extractBaseUrl();
  const id = linkId || generateUniqueId(storeId);
  return `${baseUrl}/caixa/${id}`;
}

export function createAdminLink(storeId: string, linkId?: string): string {
  const baseUrl = extractBaseUrl();
  const id = linkId || generateUniqueId(storeId);
  return `${baseUrl}/admin/${id}`;
}

export function createRegistrationLink(code: string): string {
  const baseUrl = extractBaseUrl();
  return `${baseUrl}/registro/${code}`;
}

export function getBaseUrl(): string {
  return extractBaseUrl();
}

export function setBaseUrl(url: string): boolean {
  if (!isValidUrl(url)) return false;
  
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
      localStorage.setItem('admin_base_url', cleanUrl);
      return true;
    }
  } catch (e) {
    return false;
  }

  return false;
}

// Test function
export function testSimpleUrl(): void {
  console.log('🧪 Testing Simple URL Functions...');
  
  const baseUrl = getBaseUrl();
  console.log('Base URL:', baseUrl);
  
  const cashierLink = createCashierLink('test_store');
  console.log('Cashier Link:', cashierLink);
  
  const adminLink = createAdminLink('test_store');
  console.log('Admin Link:', adminLink);
  
  const regLink = createRegistrationLink('test_code');
  console.log('Registration Link:', regLink);
  
  console.log('✅ Simple URL Test Complete');
}