import { UserProfile } from '../types';
import { DatabaseService } from './db';
import { INITIAL_USER } from './seedData';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface RegisterResult {
  user: UserProfile | null;
  needsEmailConfirmation: boolean;
  message?: string;
}

const AUTH_STORAGE_KEY = 'gabarita_auth_session_v2';

export class AuthService {
  private static listeners: ((state: AuthState) => void)[] = [];
  private static currentState: AuthState = {
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  };
  private static isInitialized = false;

  static async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Evita requisições quebradas se o cliente não possuir credenciais válidas
    if (!isSupabaseConfigured) {
      console.error('[Gabarita Auth] Supabase não está configurado com URL e Chave válidas. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_KEY.');
      this.clearSession();
      return;
    }

    this.setupAuthListener();

    // Restaurar sessão estritamente a partir do Supabase Auth
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (!sessionError && session?.user) {
        const u = session.user;
        const profile: UserProfile = {
          ...INITIAL_USER,
          id: u.id,
          email: u.email || '',
          name: u.user_metadata?.name || u.email?.split('@')[0] || 'Concurseiro(a)',
        };
        // Libera a renderização da aplicação imediatamente
        this.persistSession(profile);
        this.syncProfileInBackground(u.id);
        return;
      }
    } catch (err) {
      console.warn('Gabarita: Falha ao verificar sessão do Supabase:', err);
    }

    // Se não houver sessão ativa válida no Supabase, verifica se há sessão demo/guest salva
    try {
      const saved = localStorage.getItem('gabarita_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.id === 'user_demo_01') {
          this.persistSession(parsed);
          return;
        }
      }
    } catch {}

    // Se não houver sessão ativa válida no Supabase, limpa qualquer resquício
    this.clearSession();
  }

  private static setupAuthListener(): void {
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Supabase Auth Event]:', event, session?.user?.email);

      if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
        const u = session.user;
        const profile: UserProfile = {
          ...INITIAL_USER,
          id: u.id,
          email: u.email || '',
          name: u.user_metadata?.name || u.email?.split('@')[0] || 'Concurseiro(a)',
        };
        
        // Garante que o listener force a renderização imediata do dashboard
        this.persistSession(profile);

        // Atualização complementar em segundo plano sem bloquear o dashboard
        this.syncProfileInBackground(u.id);
      } else if (event === 'SIGNED_OUT') {
        this.clearSession();
      }
    });
  }

  static subscribe(callback: (state: AuthState) => void): () => void {
    this.listeners.push(callback);
    callback(this.currentState);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private static updateState(partial: Partial<AuthState>): void {
    this.currentState = { ...this.currentState, ...partial };
    this.listeners.forEach(cb => cb(this.currentState));
  }

  private static async syncProfileInBackground(userId: string, extra?: { name?: string }): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data && this.currentState.user) {
        const enriched: UserProfile = {
          ...this.currentState.user,
          name: data.name || extra?.name || this.currentState.user.name,
          role: data.role || this.currentState.user.role,
          photoURL: data.photo_url || this.currentState.user.photoURL,
          bio: data.bio || this.currentState.user.bio,
          targetConcursoId: data.target_concurso_id || this.currentState.user.targetConcursoId,
          targetConcursoTitle: data.target_concurso_title || this.currentState.user.targetConcursoTitle,
          studyHoursPerDay: data.study_hours_per_day ? Number(data.study_hours_per_day) : this.currentState.user.studyHoursPerDay,
          streakDays: data.streak_days ?? this.currentState.user.streakDays,
          xp: data.xp ?? this.currentState.user.xp,
          level: data.level ?? this.currentState.user.level,
          preferences: data.preferences || this.currentState.user.preferences,
          subscription: data.subscription || this.currentState.user.subscription,
        };
        this.persistSession(enriched);
      } else if (!data && this.currentState.user) {
        Promise.resolve(
          supabase.from('profiles').insert([{
            id: userId,
            email: this.currentState.user.email,
            name: this.currentState.user.name,
            role: 'aluno',
            preferences: this.currentState.user.preferences,
            created_at: this.currentState.user.createdAt,
            updated_at: this.currentState.user.updatedAt,
          }])
        ).catch(() => {});
      }
    } catch (e) {
      console.warn('Gabarita: Sincronização em segundo plano de profiles ignorada:', e);
    }
  }

  private static persistSession(user: UserProfile): void {
    try {
      localStorage.setItem('gabarita_user', JSON.stringify(user));
      localStorage.setItem('last_active_timestamp', String(Date.now()));
      if (user?.preferences?.colorSkin) {
        localStorage.setItem('theme_preference', user.preferences.colorSkin);
        localStorage.setItem('gabarita_color_skin', user.preferences.colorSkin);
      }
    } catch (e) {
      console.warn('Erro ao salvar sessão local:', e);
    }
    this.updateState({
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  }

  private static clearSession(): void {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem('gabarita_user');
    } catch (e) {
      console.warn('Erro ao limpar sessão local:', e);
    }
    this.updateState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }

  static translateAuthError(message: string): string {
    const raw = message || '';
    const msg = raw.toLowerCase();
    
    if (msg.includes('apikey') || msg.includes('api key') || msg.includes('no \'apikey\'') || msg.includes('no apikey')) {
      return 'Configuração de chave do Supabase ausente ou inválida. Verifique VITE_SUPABASE_KEY nos segredos/ambiente.';
    }
    if (msg.includes('invalid path specified') || msg.includes('invalid path')) {
      return 'A conexão com o serviço de autenticação foi reconfigurada. Por favor, tente novamente.';
    }
    if (msg.includes('invalid login credentials') || msg.includes('invalid_grant')) {
      return 'E-mail ou senha incorretos.';
    }
    if (msg.includes('user not found')) {
      return 'Nenhum usuário cadastrado com este e-mail.';
    }
    if (msg.includes('already registered') || msg.includes('user_already_exists') || msg.includes('email already in use')) {
      return 'Este e-mail já está cadastrado. Faça login com suas credenciais ou recupere a senha.';
    }
    if (msg.includes('password should be at least')) {
      return 'A senha deve conter no mínimo 6 caracteres.';
    }
    if (msg.includes('valid email') || msg.includes('email address is invalid') || msg.includes('invalid email')) {
      return 'Por favor, insira um endereço de e-mail válido.';
    }
    if (msg.includes('rate limit') || msg.includes('too many requests')) {
      return 'Muitas tentativas em pouco tempo. Por favor, aguarde alguns instantes.';
    }
    if (msg.includes('email not confirmed')) {
      return 'E-mail não confirmado. Por favor, verifique sua caixa de entrada e confirme o link recebido.';
    }
    return raw || 'Ocorreu um erro na autenticação. Verifique suas credenciais.';
  }

  static async loginWithEmail(email: string, pass: string): Promise<UserProfile> {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      const msg = 'Por favor, informe seu e-mail.';
      this.updateState({ isLoading: false, error: msg });
      throw new Error(msg);
    }
    if (!pass) {
      const msg = 'Por favor, informe sua senha.';
      this.updateState({ isLoading: false, error: msg });
      throw new Error(msg);
    }

    if (!isSupabaseConfigured) {
      const msg = 'Configuração do Supabase pendente. Verifique se VITE_SUPABASE_URL e VITE_SUPABASE_KEY estão configuradas no ambiente.';
      console.error("Erro Supabase Auth:", msg);
      this.updateState({ isLoading: false, error: msg });
      throw new Error(msg);
    }

    this.updateState({ error: null });

    // Chamada obrigatória e real ao Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: pass,
    });

    if (error) {
      console.warn("[Gabarita Auth] Falha na autenticação:", error.message);
      const translated = this.translateAuthError(error.message);
      this.updateState({ isLoading: false, error: translated });
      throw new Error(translated);
    }

    if (!data?.user) {
      const msg = 'Não foi possível autenticar o usuário no Supabase.';
      console.warn("[Gabarita Auth]:", msg);
      this.updateState({ isLoading: false, error: msg });
      throw new Error(msg);
    }

    const profile: UserProfile = {
      ...INITIAL_USER,
      id: data.user.id,
      email: data.user.email || cleanEmail,
      name: data.user.user_metadata?.name || cleanEmail.split('@')[0] || 'Concurseiro(a)',
    };

    // Atualiza imediatamente a sessão e libera o acesso ao dashboard
    this.persistSession(profile);
    this.syncProfileInBackground(data.user.id);
    return profile;
  }

  static async registerWithEmail(
    name: string,
    email: string,
    pass: string,
    consentGiven: boolean = true
  ): Promise<RegisterResult> {
    const cleanEmail = email.trim();
    const cleanName = name.trim();

    if (!cleanName) {
      const msg = 'Por favor, informe seu nome completo.';
      this.updateState({ isLoading: false, error: msg });
      throw new Error(msg);
    }
    if (!cleanEmail) {
      const msg = 'Por favor, informe seu e-mail.';
      this.updateState({ isLoading: false, error: msg });
      throw new Error(msg);
    }
    if (!pass || pass.length < 6) {
      const msg = 'A senha deve ter no mínimo 6 caracteres.';
      this.updateState({ isLoading: false, error: msg });
      throw new Error(msg);
    }
    if (!consentGiven) {
      const msg = 'Você precisa aceitar os Termos de Uso e Política de Privacidade.';
      this.updateState({ isLoading: false, error: msg });
      throw new Error(msg);
    }

    if (!isSupabaseConfigured) {
      const msg = 'Configuração do Supabase pendente. Verifique se VITE_SUPABASE_URL e VITE_SUPABASE_KEY estão configuradas no ambiente.';
      console.error("Erro Supabase Auth:", msg);
      this.updateState({ isLoading: false, error: msg });
      throw new Error(msg);
    }

    this.updateState({ error: null });

    // Chamada obrigatória e real ao Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: pass,
      options: {
        data: {
          name: cleanName,
        },
      },
    });

    if (error) {
      console.warn("[Gabarita Auth] Falha no cadastro:", error.message);
      const translated = this.translateAuthError(error.message);
      this.updateState({ isLoading: false, error: translated });
      throw new Error(translated);
    }

    if (!data?.user) {
      const msg = 'Não foi possível registrar o usuário no Supabase.';
      console.warn("[Gabarita Auth]:", msg);
      this.updateState({ isLoading: false, error: msg });
      throw new Error(msg);
    }

    // 1. AUTO-LOGIN APÓS CADASTRO (SIGN UP):
    // Se supabase.auth.signUp retornar com sessão ativa, atualiza imediatamente para o dashboard
    if (data.session) {
      const profile: UserProfile = {
        ...INITIAL_USER,
        id: data.user.id,
        email: cleanEmail,
        name: cleanName,
        preferences: {
          ...INITIAL_USER.preferences,
          consentGiven,
          consentDate: new Date().toISOString(),
        },
      };

      this.persistSession(profile);
      this.syncProfileInBackground(data.user.id, { name: cleanName });
      return { user: profile, needsEmailConfirmation: false };
    }

    // Se o Supabase exigir confirmação por e-mail antes de criar sessão
    this.updateState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });

    return {
      user: null,
      needsEmailConfirmation: true,
      message: 'Cadastro realizado! Verifique seu e-mail para confirmar a conta antes de entrar.',
    };
  }

  static async loginWithGoogle(): Promise<void> {
    if (!isSupabaseConfigured) {
      const msg = 'Configuração do Supabase pendente. Verifique se VITE_SUPABASE_URL e VITE_SUPABASE_KEY estão configuradas no ambiente.';
      console.error("Erro Supabase Auth:", msg);
      this.updateState({ isLoading: false, error: msg });
      throw new Error(msg);
    }
    this.updateState({ error: null });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      console.warn("[Gabarita Auth] Falha Google OAuth:", error.message);
      const translated = this.translateAuthError(error.message);
      this.updateState({ isLoading: false, error: translated });
      throw new Error(translated);
    }
  }

  static async resetPassword(email: string): Promise<void> {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      throw new Error('Informe seu e-mail para enviarmos o link de recuperação.');
    }
    if (!isSupabaseConfigured) {
      const msg = 'Configuração do Supabase pendente. Verifique se VITE_SUPABASE_URL e VITE_SUPABASE_KEY estão configuradas no ambiente.';
      console.error("Erro Supabase Auth:", msg);
      throw new Error(msg);
    }
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}`,
    });
    if (error) {
      console.warn("[Gabarita Auth] Falha reset senha:", error.message);
      throw new Error(this.translateAuthError(error.message));
    }
  }

  static async deleteAccount(): Promise<void> {
    const currentUser = this.currentState.user;
    if (currentUser) {
      try {
        await supabase.from('profiles').delete().eq('id', currentUser.id);
      } catch (e) {
        console.warn('Erro ao remover dados de perfil no Supabase:', e);
      }
    }
    await this.logout();
  }

  static async loginAsGuest(): Promise<UserProfile> {
    const guestProfile: UserProfile = {
      ...INITIAL_USER,
      id: 'user_demo_01',
      email: 'visitante@gabarita.com',
      name: 'Concurseiro(a) Visitante',
    };
    this.persistSession(guestProfile);
    return guestProfile;
  }

  static async logout(): Promise<void> {
    try {
      localStorage.setItem('last_active_timestamp', String(Date.now()));
    } catch {}
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Erro ao deslogar do Supabase:', err);
    }
    this.clearSession();
  }
}
