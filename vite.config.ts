import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

function sanitizeUrl(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  let u = raw.trim().replace(/^["']|["']$/g, '');
  if (!u) return '';
  if (!u.startsWith('http://') && !u.startsWith('https://')) {
    u = `https://${u}`;
  }
  if (u.includes('zuzzcq')) {
    u = u.replace('zuzzcq', 'zuzzoq');
  }
  try {
    const parsed = new URL(u);
    if (parsed.hostname.endsWith('.supabase.co') || parsed.pathname.includes('/rest') || parsed.pathname.includes('/auth')) {
      return parsed.origin;
    }
    return `${parsed.origin}${parsed.pathname}`.replace(/\/+(rest|auth)(\/v1)?\/?$/i, '').replace(/\/+$/, '');
  } catch {
    return u.replace(/\/+(rest|auth)(\/v1)?\/?$/i, '').replace(/\/+$/, '');
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const rawUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || env.SUPABASE_URL || process.env.SUPABASE_URL || '';
  const rawKey = env.VITE_SUPABASE_KEY || process.env.VITE_SUPABASE_KEY || env.SUPABASE_KEY || process.env.SUPABASE_KEY || '';
  const rawGoogleClientId = env.VITE_GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';

  const supabaseUrl = sanitizeUrl(rawUrl);
  const supabaseKey = (rawKey || '').trim().replace(/^["']|["']$/g, '');
  const googleClientId = (rawGoogleClientId || '').trim().replace(/^["']|["']$/g, '');

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.VITE_SUPABASE_KEY': JSON.stringify(supabaseKey),
      'process.env.SUPABASE_KEY': JSON.stringify(supabaseKey),
      'process.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(googleClientId),
      'process.env.GOOGLE_CLIENT_ID': JSON.stringify(googleClientId),
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || process.cwd(), '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      hmr: false,
      watch: null,
      allowedHosts: true as const,
    },
    preview: {
      host: '0.0.0.0',
      port: 3000,
    },
  };
});
