// Centraliza lectura y validación de variables Vite.
// Vite inyecta variables que comienzan con VITE_ en import.meta.env.

// Tipado mínimo para evitar errores si no se incluye `vite/client` types.
declare global {
  interface ImportMetaEnv {
    VITE_API_BASE_URL: string;
    VITE_API_KEY: string;
  }
  interface ImportMeta {
    env: ImportMetaEnv;
  }
}

let ENV_ERROR: string | null = null;
let { VITE_API_BASE_URL, VITE_API_KEY } = (import.meta.env as ImportMetaEnv) || {};
if (!VITE_API_BASE_URL) {
  ENV_ERROR = 'Falta VITE_API_BASE_URL en .env.local (usando fallback http://localhost:3000)';
  VITE_API_BASE_URL = 'http://localhost:3000';
}
if (!VITE_API_KEY) {
  ENV_ERROR = ENV_ERROR ? ENV_ERROR + ' y falta VITE_API_KEY' : 'Falta VITE_API_KEY en .env.local';
}
export const ENV = { VITE_API_BASE_URL, VITE_API_KEY };
export { ENV_ERROR };
