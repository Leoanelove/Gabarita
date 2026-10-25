import { UserProfile } from '../types';
import { DatabaseService } from './db';
import { INITIAL_USER } from './seedData';

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
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

  static init(): void {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.isAuthenticated && parsed?.user) {
          this.updateState({
            user: parsed.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return;
        }
      }
    } catch (e) {
      console.warn('Erro ao restaurar sessão local de autenticação:', e);
    }

    // Inicia na tela de Login/Cadastro caso não haja sessão autenticada ativa
    this.updateState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
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

  private static getStoredBaseProfile(): UserProfile {
    try {
      const raw = localStorage.getItem('gabarita_user');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.id) {
          return parsed as UserProfile;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_USER;
  }

  private static persistSession(user: UserProfile): void {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, isAuthenticated: true }));
      localStorage.setItem('gabarita_user', JSON.stringify(user));
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

  static async loginWithEmail(email: string, _pass: string): Promise<UserProfile> {
    const baseProfile = this.getStoredBaseProfile();
    const cleanEmail = email.trim() || baseProfile.email || 'estudante@gabarita.com.br';
    const derivedName =
      baseProfile.name && baseProfile.name !== 'Concurseiro(a)'
        ? baseProfile.name
        : cleanEmail.split('@')[0] || 'Concurseiro(a)';

    const user: UserProfile = {
      ...baseProfile,
      email: cleanEmail,
      name: derivedName,
      updatedAt: new Date().toISOString(),
    };

    this.persistSession(user);
    return user;
  }

  static async registerWithEmail(
    name: string,
    email: string,
    _pass: string,
    consentGiven: boolean = true
  ): Promise<UserProfile> {
    const baseProfile = this.getStoredBaseProfile();
    const cleanEmail = email.trim() || baseProfile.email || 'estudante@gabarita.com.br';
    const cleanName = name.trim() || cleanEmail.split('@')[0] || 'Concurseiro(a)';

    const newProfile: UserProfile = {
      ...baseProfile,
      email: cleanEmail,
      name: cleanName,
      preferences: {
        ...baseProfile.preferences,
        consentGiven,
        consentDate: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };

    this.persistSession(newProfile);
    return newProfile;
  }

  static async loginWithGoogle(): Promise<UserProfile> {
    const baseProfile = this.getStoredBaseProfile();
    const googleProfile: UserProfile = {
      ...baseProfile,
      email: baseProfile.email || 'estudante.google@gmail.com',
      name: baseProfile.name || 'Concurseiro(a)',
      updatedAt: new Date().toISOString(),
    };

    this.persistSession(googleProfile);
    return googleProfile;
  }

  static async resetPassword(_email: string): Promise<void> {
    return Promise.resolve();
  }

  static async deleteAccount(): Promise<void> {
    const currentUser = this.currentState.user;
    if (currentUser) {
      await DatabaseService.deleteAccountData(currentUser.id);
    }
    this.clearSession();
  }

  static async logout(): Promise<void> {
    this.clearSession();
  }
}
