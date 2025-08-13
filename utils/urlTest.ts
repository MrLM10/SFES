/**
 * Simple URL Testing Utilities
 */

// Get base URL with simple fallback logic
export function getSimpleBaseUrl(): string {
  // Try environment variables
  try {
    if (typeof globalThis !== 'undefined' && globalThis.import && globalThis.import.meta) {
      const env = globalThis.import.meta.env;
      if (env && env.VITE_APP_URL) {
        const url = env.VITE_APP_URL;
        if (typeof url === 'string' && url.length > 0) {
          return url.replace(/\/$/, '');
        }
      }
    }
  } catch {
    // Silent fail
  }

  // Try localStorage
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedUrl = localStorage.getItem('admin_base_url');
      if (storedUrl && typeof storedUrl === 'string' && storedUrl.length > 0) {
        return storedUrl.replace(/\/$/, '');
      }
    }
  } catch {
    // Silent fail
  }

  // Fallback to current origin
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }

  // Final fallback
  return 'http://localhost:3000';
}

// Generate simple links
export function generateSimpleLink(type: 'caixa' | 'admin' | 'registro', id: string): string {
  const baseUrl = getSimpleBaseUrl();
  return `${baseUrl}/${type}/${id}`;
}

// Test URL generation
export function testUrlGeneration(): void {
  console.log('🧪 Testing URL Generation...');
  
  const baseUrl = getSimpleBaseUrl();
  console.log('Base URL:', baseUrl);
  
  const cashierLink = generateSimpleLink('caixa', 'test123');
  console.log('Cashier Link:', cashierLink);
  
  const adminLink = generateSimpleLink('admin', 'admin456');
  console.log('Admin Link:', adminLink);
  
  const registrationLink = generateSimpleLink('registro', 'reg789');
  console.log('Registration Link:', registrationLink);
  
  console.log('✅ URL Generation Test Complete');
}