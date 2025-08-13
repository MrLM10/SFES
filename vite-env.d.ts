/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_APP_URL?: string;
  readonly REACT_APP_SUPABASE_URL?: string;
  readonly REACT_APP_SUPABASE_ANON_KEY?: string;
  readonly REACT_APP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Global types for better TypeScript support
declare global {
  interface Window {
    localStorage: Storage;
    sessionStorage: Storage;
  }
}

export {};