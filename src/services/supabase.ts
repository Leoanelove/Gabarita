import { createClient } from '@supabase/supabase-js';

const rawUrl = 
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_SUPABASE_URL) ||
  'https://zuzzoqdytblgswwlevjc.supabase.co';

const SUPABASE_URL = rawUrl.includes('zuzzcq') ? rawUrl.replace('zuzzcq', 'zuzzoq') : rawUrl;

const rawKey = 
  (typeof process !== 'undefined' && process.env?.SUPABASE_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_SUPABASE_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1enpvcWR5dGJsZ3N3d2xldmpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4MzY4ODUsImV4cCI6MjEwNzQxMjg4NX0.OJ_oDBnF7mIA16DE_5MxyJQRkfGaEMEueAwiIuXKnWQ';

const SUPABASE_ANON_KEY = (rawKey && !rawKey.startsWith('sb_'))
  ? rawKey
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1enpvcWR5dGJsZ3N3d2xldmpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4MzY4ODUsImV4cCI6MjEwNzQxMjg4NX0.OJ_oDBnF7mIA16DE_5MxyJQRkfGaEMEueAwiIuXKnWQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
