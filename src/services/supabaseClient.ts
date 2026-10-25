import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const sanitizeSupabaseUrl = (raw: string): string => {
  if (!raw || typeof raw !== 'string') return '';
  let url = raw.trim().replace(/^["']|["']$/g, '');
  if (!url) return '';

  // Se por engano o usuário colocou a chave JWT no campo de URL
  if (url.startsWith('ey') && url.includes('.')) {
    console.error('[Gabarita Supabase] ATENÇÃO: A URL fornecida parece ser uma chave JWT em vez de uma URL válida.');
    return '';
  }

  // Garante o protocolo https
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  // Correção de erro tipográfico comum (zuzzcq -> zuzzoq)
  if (url.includes('zuzzcq')) {
    url = url.replace('zuzzcq', 'zuzzoq');
  }

  try {
    const parsed = new URL(url);
    // Para domínios *.supabase.co ou se a rota tiver /rest ou /auth, a raiz da API DEVE ser apenas o origin
    if (parsed.hostname.endsWith('.supabase.co') || parsed.pathname.includes('/rest') || parsed.pathname.includes('/auth')) {
      return parsed.origin;
    }
    // Caso geral: remove /rest, /rest/v1, /auth, /auth/v1 e barras no final
    let clean = `${parsed.origin}${parsed.pathname}`
      .replace(/\/+(rest|auth)(\/v1)?\/?$/i, '')
      .replace(/\/+$/, '');
    return clean;
  } catch {
    return url
      .replace(/\/+(rest|auth)(\/v1)?\/?$/i, '')
      .replace(/\/+$/, '');
  }
};

export const sanitizeSupabaseKey = (raw: string): string => {
  if (!raw || typeof raw !== 'string') return '';
  return raw.trim().replace(/^["']|["']$/g, '');
};

// 1. LEITURA ABRANGENTE DA URL DO SUPABASE:
// Prioridade estrita conforme especificação:
// 1. import.meta.env.VITE_SUPABASE_URL
// 2. process.env.VITE_SUPABASE_URL
// 3. process.env.SUPABASE_URL
const resolveSupabaseUrl = (): string => {
  let url = '';

  try {
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) {
      url = String(import.meta.env.VITE_SUPABASE_URL).trim();
    }
  } catch {}

  if (!url) {
    try {
      if (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) {
        url = String(process.env.VITE_SUPABASE_URL).trim();
      }
    } catch {}
  }

  if (!url) {
    try {
      if (typeof process !== 'undefined' && process.env?.SUPABASE_URL) {
        url = String(process.env.SUPABASE_URL).trim();
      }
    } catch {}
  }

  // Fallback seguro adicional para import.meta.env.SUPABASE_URL se fornecido
  if (!url) {
    try {
      if (typeof import.meta !== 'undefined' && (import.meta as any).env?.SUPABASE_URL) {
        url = String((import.meta as any).env.SUPABASE_URL).trim();
      }
    } catch {}
  }

  // Fallback seguro para o projeto padrão caso as variáveis não estejam preenchidas
  if (!url) {
    url = 'https://zuzzoqdytblgswwlevjc.supabase.co';
  }

  return sanitizeSupabaseUrl(url) || 'https://zuzzoqdytblgswwlevjc.supabase.co';
};

// 1. LEITURA ABRANGENTE DA CHAVE DO SUPABASE (ANON KEY):
// Prioridade estrita conforme especificação:
// 1. import.meta.env.VITE_SUPABASE_KEY
// 2. process.env.VITE_SUPABASE_KEY
// 3. process.env.SUPABASE_KEY
const resolveSupabaseKey = (): string => {
  let key = '';

  try {
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_KEY) {
      key = String(import.meta.env.VITE_SUPABASE_KEY).trim();
    }
  } catch {}

  if (!key) {
    try {
      if (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_KEY) {
        key = String(process.env.VITE_SUPABASE_KEY).trim();
      }
    } catch {}
  }

  if (!key) {
    try {
      if (typeof process !== 'undefined' && process.env?.SUPABASE_KEY) {
        key = String(process.env.SUPABASE_KEY).trim();
      }
    } catch {}
  }

  // Fallback seguro adicional para import.meta.env.SUPABASE_KEY se fornecido
  if (!key) {
    try {
      if (typeof import.meta !== 'undefined' && (import.meta as any).env?.SUPABASE_KEY) {
        key = String((import.meta as any).env.SUPABASE_KEY).trim();
      }
    } catch {}
  }

  // Fallback seguro da chave anon padrão do projeto
  if (!key) {
    key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1enpvcWR5dGJsZ3N3d2xldmpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4MzY4ODUsImV4cCI6MjEwNzQxMjg4NX0.OJ_oDBnF7mIA16DE_5MxyJQRkfGaEMEueAwiIuXKnWQ';
  }

  return sanitizeSupabaseKey(key);
};

const supabaseUrl = resolveSupabaseUrl();
const supabaseKey = resolveSupabaseKey();

// 2. VALIDAÇÃO PRÉVIA:
// Se os valores estiverem indefinidos ou vazios, adiciona console.error claro
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl.startsWith('http') &&
  supabaseKey.length > 10
);

if (!isSupabaseConfigured) {
  console.error(
    '[Gabarita Supabase] AVISO: Credenciais do Supabase ausentes ou incompletas!\n' +
    'Certifique-se de configurar VITE_SUPABASE_URL e VITE_SUPABASE_KEY no ambiente.'
  );
}

export const SUPABASE_CONFIG = {
  url: supabaseUrl,
  anonKey: supabaseKey,
  isConfigured: isSupabaseConfigured,
};

// Inicialização com cabeçalho 'apikey' explícito para garantir que nenhuma requisição
// sofra com "No API key found in request"
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      apikey: supabaseKey,
    },
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
