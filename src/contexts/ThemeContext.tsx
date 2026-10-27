import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ColorSkin } from '../types';
import { DatabaseService } from '../services/db';

type Theme = 'light' | 'dark' | 'system';

export interface SkinPalette {
  id: ColorSkin;
  name: string;
  shortLabel: string;
  description: string;
  primary: string;
  primaryHover: string;
  secondary: string;
  accent: string;
  gradient: string;
  chartColors: string[];
  ringColor: string;
  glowColor: string;
  chipBg: string;
  chipDot: string;
  activeBadge: string;
}

export const THEME_STORAGE_KEY = 'gabarita_theme';
export const SKIN_STORAGE_KEY = 'gabarita_color_skin';
export const THEME_PREFERENCE_KEY = 'theme_preference';
export const LAST_ACTIVE_TIMESTAMP_KEY = 'last_active_timestamp';
export const INACTIVITY_LIMIT_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias em milissegundos

const VALID_SKINS: ColorSkin[] = ['verde', 'azul', 'rosa', 'roxo', 'purple', 'laranja', 'orange', 'dbz'];

export function isValidSkin(value: string | null): value is ColorSkin {
  return Boolean(value && VALID_SKINS.includes(value as ColorSkin));
}

export function normalizeSkin(skin: string | null | undefined): ColorSkin {
  if (!skin || !isValidSkin(skin)) return 'verde';
  if (skin === 'purple') return 'roxo';
  if (skin === 'orange' || skin === 'dbz') return 'laranja';
  return skin;
}

/**
 * Resolve o tema inicial aplicando a regra de fallback:
 * - Se não houver `theme_preference` salvo OU se `(Date.now() - last_active_timestamp) > 7 dias`,
 *   retorna obrigatoriamente o tema 'verde' (#00A86B).
 */
export function resolveInitialSkinWithFallback(): ColorSkin {
  try {
    const savedPref = localStorage.getItem(THEME_PREFERENCE_KEY) || localStorage.getItem(SKIN_STORAGE_KEY);
    const lastActiveStr = localStorage.getItem(LAST_ACTIVE_TIMESTAMP_KEY);

    if (!savedPref || !isValidSkin(savedPref)) {
      localStorage.setItem(THEME_PREFERENCE_KEY, 'verde');
      localStorage.setItem(SKIN_STORAGE_KEY, 'verde');
      return 'verde';
    }

    if (!lastActiveStr) {
      // Sem registro de último acesso ativo -> inicia no verde padrão e registra timestamp inicial
      localStorage.setItem(THEME_PREFERENCE_KEY, 'verde');
      localStorage.setItem(SKIN_STORAGE_KEY, 'verde');
      return 'verde';
    }

    const lastActive = Number(lastActiveStr);
    const now = Date.now();

    if (Number.isNaN(lastActive) || now - lastActive > INACTIVITY_LIMIT_MS) {
      // Inatividade > 7 dias -> fallback obrigatório para verde padrão
      localStorage.setItem(THEME_PREFERENCE_KEY, 'verde');
      localStorage.setItem(SKIN_STORAGE_KEY, 'verde');
      return 'verde';
    }

    return normalizeSkin(savedPref);
  } catch (e) {
    console.warn('Erro ao resolver tema com fallback:', e);
    return 'verde';
  }
}

/**
 * Atualiza o timestamp de atividade recente do usuário
 */
export function touchLastActiveTimestamp(): void {
  try {
    localStorage.setItem(LAST_ACTIVE_TIMESTAMP_KEY, String(Date.now()));
  } catch (e) {
    console.warn('Erro ao atualizar last_active_timestamp:', e);
  }
}

export const SKINS_CONFIG: Record<ColorSkin, SkinPalette> = {
  verde: {
    id: 'verde',
    name: 'Verde (Original)',
    shortLabel: 'Verde',
    description: 'Paleta padrão com foco e equilíbrio',
    primary: '#00A86B',
    primaryHover: '#059669',
    secondary: '#0d9488',
    accent: '#10b981',
    gradient: 'from-emerald-600 to-teal-400',
    chartColors: ['#00A86B', '#10b981', '#14b8a6', '#06b6d4', '#f59e0b', '#8b5cf6'],
    ringColor: 'ring-emerald-500',
    glowColor: 'rgba(0, 168, 107, 0.25)',
    chipBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    chipDot: 'bg-[#00A86B]',
    activeBadge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
  },
  azul: {
    id: 'azul',
    name: 'Azul (Foco)',
    shortLabel: 'Azul',
    description: 'Tons de azul e ciano para alta concentração',
    primary: '#2563eb',
    primaryHover: '#3b82f6',
    secondary: '#0284c7',
    accent: '#06b6d4',
    gradient: 'from-blue-600 to-cyan-400',
    chartColors: ['#2563eb', '#06b6d4', '#0284c7', '#38bdf8', '#6366f1', '#4f46e5'],
    ringColor: 'ring-blue-500',
    glowColor: 'rgba(37, 99, 235, 0.25)',
    chipBg: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
    chipDot: 'bg-blue-500',
    activeBadge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300',
  },
  rosa: {
    id: 'rosa',
    name: 'Rosa (Suave)',
    shortLabel: 'Rosa',
    description: 'Tons de rosa e lilás com sombras delicadas nos cards',
    primary: '#db2777',
    primaryHover: '#ec4899',
    secondary: '#a855f7',
    accent: '#d946ef',
    gradient: 'from-pink-600 to-purple-400',
    chartColors: ['#db2777', '#ec4899', '#a855f7', '#d946ef', '#f472b6', '#c084fc'],
    ringColor: 'ring-pink-500',
    glowColor: 'rgba(219, 39, 119, 0.25)',
    chipBg: 'bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30',
    chipDot: 'bg-pink-500',
    activeBadge: 'bg-pink-100 text-pink-800 dark:bg-pink-950/80 dark:text-pink-300',
  },
  roxo: {
    id: 'roxo',
    name: 'Roxo',
    shortLabel: 'Roxo',
    description: 'Tons de violeta e roxo com fundos adaptativos elegantes',
    primary: '#7C3AED',
    primaryHover: '#8B5CF6',
    secondary: '#6D28D9',
    accent: '#A78BFA',
    gradient: 'from-violet-600 to-purple-500',
    chartColors: ['#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD', '#6D28D9', '#4C1D95'],
    ringColor: 'ring-purple-500',
    glowColor: 'rgba(124, 58, 237, 0.35)',
    chipBg: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
    chipDot: 'bg-[#7C3AED]',
    activeBadge: 'bg-purple-100 text-purple-800 dark:bg-[#1F192E] dark:text-[#A78BFA] border border-purple-500/40',
  },
  get purple() { return this.roxo; },
  laranja: {
    id: 'laranja',
    name: 'Laranja',
    shortLabel: 'Laranja',
    description: 'Acentos laranja vibrante com adaptação perfeita em modo claro e escuro',
    primary: '#FF6B00',
    primaryHover: '#FF8533',
    secondary: '#D83100',
    accent: '#FFCC00',
    gradient: 'from-[#FF6B00] to-[#D83100]',
    chartColors: ['#FF6B00', '#FFCC00', '#D83100', '#FF9900', '#FFE600', '#E65100'],
    ringColor: 'ring-orange-500',
    glowColor: 'rgba(255, 107, 0, 0.35)',
    chipBg: 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/40',
    chipDot: 'bg-[#FF6B00]',
    activeBadge: 'bg-orange-100 text-orange-800 dark:bg-[#111A33] dark:text-[#FFCC00] border border-orange-500/40',
  },
  get orange() { return this.laranja; },
  get dbz() { return this.laranja; },
};

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  colorSkin: ColorSkin;
  setColorSkin: (skin: ColorSkin) => Promise<void>;
  palette: SkinPalette;
  reapplyTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch (e) {
      console.warn('Erro ao ler tema inicial', e);
    }
    return 'dark';
  });

  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('dark');

  const [colorSkin, setColorSkinState] = useState<ColorSkin>(() => {
    return resolveInitialSkinWithFallback();
  });

  // Reavalia e reaplica as classes de tema salvas pelo usuário
  const reapplyTheme = useCallback(() => {
    const root = document.documentElement;
    let targetTheme: Theme = theme;
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        targetTheme = saved;
      }
    } catch (e) {
      console.warn('Erro ao ler preferência de tema:', e);
    }

    let resolved: 'light' | 'dark';
    if (targetTheme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolved = targetTheme;
    }
    setEffectiveTheme(resolved);

    if (resolved === 'dark') {
      root.classList.add('dark', 'dark-mode');
      document.body?.classList.add('dark', 'dark-mode');
    } else {
      root.classList.remove('dark', 'dark-mode');
      document.body?.classList.remove('dark', 'dark-mode');
    }
  }, [theme]);

  // Aplica classes de tema (light/dark) no elemento raiz
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = () => {
      let resolved: 'light' | 'dark';
      if (theme === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        resolved = theme;
      }
      setEffectiveTheme(resolved);

      // A tela de login (sem sessão ativa) força isolamento de modo claro.
      // Classes 'dark' só são aplicadas no elemento raiz quando há sessão autenticada ativa.
      const hasActiveSession = Boolean(
        localStorage.getItem('gabarita_auth_session_v2') || localStorage.getItem('gabarita_user')
      );

      if (hasActiveSession && resolved === 'dark') {
        root.classList.add('dark', 'dark-mode');
        document.body?.classList.add('dark', 'dark-mode');
      } else {
        root.classList.remove('dark', 'dark-mode');
        document.body?.classList.remove('dark', 'dark-mode');
      }
    };

    applyTheme();
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  // Aplica o atributo data-skin, variáveis CSS e classes de tema no elemento raiz e no body
  useEffect(() => {
    const root = document.documentElement;
    const activePalette = SKINS_CONFIG[colorSkin] || SKINS_CONFIG.verde;

    root.setAttribute('data-skin', colorSkin);
    document.body?.setAttribute('data-skin', colorSkin);

    // Injeta variáveis CSS dinâmicas para uso global e na tela de login
    root.style.setProperty('--primary-color', activePalette.primary);
    root.style.setProperty('--primary-hover', activePalette.primaryHover);
    root.style.setProperty('--secondary-color', activePalette.secondary);
    root.style.setProperty('--accent-color', activePalette.accent);
    root.style.setProperty('--glow-color', activePalette.glowColor);

    root.classList.remove(
      'skin-verde', 'skin-azul', 'skin-rosa', 'skin-roxo', 'skin-purple', 'skin-dbz', 'skin-laranja', 'skin-orange',
      'theme-purple', 'theme-green', 'theme-blue', 'theme-pink', 'theme-dbz', 'theme-orange', 'theme-laranja'
    );
    document.body?.classList.remove(
      'skin-verde', 'skin-azul', 'skin-rosa', 'skin-roxo', 'skin-purple', 'skin-dbz', 'skin-laranja', 'skin-orange',
      'theme-purple', 'theme-green', 'theme-blue', 'theme-pink', 'theme-dbz', 'theme-orange', 'theme-laranja'
    );

    root.classList.add(`skin-${colorSkin}`);
    document.body?.classList.add(`skin-${colorSkin}`);

    if (colorSkin === 'verde') {
      root.classList.add('theme-green');
      document.body?.classList.add('theme-green');
    } else if (colorSkin === 'azul') {
      root.classList.add('theme-blue');
      document.body?.classList.add('theme-blue');
    } else if (colorSkin === 'rosa') {
      root.classList.add('theme-pink');
      document.body?.classList.add('theme-pink');
    } else if (colorSkin === 'roxo' || colorSkin === 'purple') {
      root.classList.add('theme-purple', 'skin-roxo');
      document.body?.classList.add('theme-purple', 'skin-roxo');
    } else if (colorSkin === 'laranja' || colorSkin === 'orange' || colorSkin === 'dbz') {
      root.classList.add('theme-orange', 'theme-laranja', 'skin-laranja', 'skin-orange');
      document.body?.classList.add('theme-orange', 'theme-laranja', 'skin-laranja', 'skin-orange');
    }

    try {
      localStorage.setItem(SKIN_STORAGE_KEY, colorSkin);
      localStorage.setItem(THEME_PREFERENCE_KEY, colorSkin);
    } catch (e) {
      console.warn('Erro ao persistir preferência de tema:', e);
    }
  }, [colorSkin]);

  // Sincroniza com o perfil apenas se houver sessão ativa válida e dentro da janela de 7 dias
  useEffect(() => {
    const syncFromProfile = async () => {
      try {
        const lastActiveStr = localStorage.getItem(LAST_ACTIVE_TIMESTAMP_KEY);
        const lastActive = lastActiveStr ? Number(lastActiveStr) : 0;
        const isExpired = !lastActive || Number.isNaN(lastActive) || Date.now() - lastActive > INACTIVITY_LIMIT_MS;

        if (isExpired) {
          setColorSkinState('verde');
          return;
        }

        const hasActiveSession = Boolean(
          localStorage.getItem('gabarita_auth_session_v2') || localStorage.getItem('gabarita_user')
        );
        if (!hasActiveSession) return;

        const user = await DatabaseService.getUserProfile('user_demo_01');
        if (user?.preferences?.colorSkin && isValidSkin(user.preferences.colorSkin)) {
          const normalized = normalizeSkin(user.preferences.colorSkin);
          setColorSkinState(normalized);
          touchLastActiveTimestamp();
        }
      } catch (err) {
        console.warn('Falha ao sincronizar tema do perfil', err);
      }
    };
    syncFromProfile();
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    touchLastActiveTimestamp();
  };

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
    touchLastActiveTimestamp();
  };

  const setColorSkin = useCallback(async (skin: ColorSkin) => {
    const normalized = normalizeSkin(skin);
    setColorSkinState(normalized);
    touchLastActiveTimestamp();
    try {
      localStorage.setItem(SKIN_STORAGE_KEY, normalized);
      localStorage.setItem(THEME_PREFERENCE_KEY, normalized);

      const user = await DatabaseService.getUserProfile('user_demo_01');
      const updatedPrefs = {
        ...(user.preferences || {
          theme: 'dark',
          notificationsEnabled: true,
          emailAlerts: false,
          pomodoroWorkMin: 50,
          pomodoroBreakMin: 10,
          soundEnabled: true,
        }),
        colorSkin: normalized,
      };
      await DatabaseService.updateUserProfile({
        preferences: updatedPrefs,
      });
    } catch (err) {
      console.warn('Erro ao persistir tema do usuário', err);
    }
  }, []);

  const palette = SKINS_CONFIG[colorSkin] || SKINS_CONFIG.verde;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        effectiveTheme,
        setTheme,
        toggleTheme,
        colorSkin,
        setColorSkin,
        palette,
        reapplyTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};
