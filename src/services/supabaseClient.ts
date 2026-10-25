import { createClient } from '@supabase/supabase-js';

// Obtenção segura das credenciais com fallback direto para os parâmetros fornecidos
const rawUrl = 
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  'https://zuzzoqdytblgswwlevjc.supabase.co';

const supabaseUrl = rawUrl.includes('zuzzcq') ? rawUrl.replace('zuzzcq', 'zuzzoq') : rawUrl;

const rawKey = 
  (typeof process !== 'undefined' && process.env?.SUPABASE_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1enpvcWR5dGJsZ3N3d2xldmpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4MzY4ODUsImV4cCI6MjEwNzQxMjg4NX0.OJ_oDBnF7mIA16DE_5MxyJQRkfGaEMEueAwiIuXKnWQ';

const supabaseKey = (rawKey && !rawKey.startsWith('sb_'))
  ? rawKey
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1enpvcWR5dGJsZ3N3d2xldmpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4MzY4ODUsImV4cCI6MjEwNzQxMjg4NX0.OJ_oDBnF7mIA16DE_5MxyJQRkfGaEMEueAwiIuXKnWQ';

export const SUPABASE_CONFIG = {
  url: supabaseUrl,
  anonKey: supabaseKey,
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface SupabaseEdital {
  id?: string;
  concurso_id?: string;
  concurso_titulo?: string;
  cargo?: string;
  raw_text?: string;
  status?: string;
  disciplinas?: any;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseQuestao {
  id?: string;
  disciplina_id?: string;
  assunto_id?: string;
  disciplina_name?: string;
  assunto_name?: string;
  banca?: string;
  year?: number;
  organ?: string;
  code?: string;
  statement: string;
  options?: any;
  correct_option_id?: string;
  explanation?: string;
  difficulty?: string;
  tags?: string[];
  created_at?: string;
}
