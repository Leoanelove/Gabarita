import React, { useState, useEffect, useRef } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Sparkles,
  FileText,
  Clock,
  Calendar,
  Target,
  Info,
} from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import {
  useTheme,
  resolveInitialSkinWithFallback,
  touchLastActiveTimestamp,
} from '../../contexts/ThemeContext';
import { ColorSkin } from '../../types';
import { PrivacyPolicyModal } from '../privacy/PrivacyPolicyModal';
import { GezinhoLogo } from '../common/GezinhoLogo';

type AuthTab = 'login' | 'register';

const REMEMBERED_EMAIL_KEY = 'gabarita_remembered_email';

const resolveGoogleClientId = (): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) {
      return String(import.meta.env.VITE_GOOGLE_CLIENT_ID).trim();
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env?.VITE_GOOGLE_CLIENT_ID) {
      return String(process.env.VITE_GOOGLE_CLIENT_ID).trim();
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env?.GOOGLE_CLIENT_ID) {
      return String(process.env.GOOGLE_CLIENT_ID).trim();
    }
  } catch {}
  return '';
};

const GOOGLE_CLIENT_ID = resolveGoogleClientId();

interface LoginThemeStyles {
  primary: string;
  primaryHover: string;
  accentLight: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  bannerGradient: string;
  expandedGradient: string;
  glowColor: string;
  heatmapActive: string;
  heatmapMid: string;
  heatmapSoft: string;
}

const LOGIN_THEMES: Record<string, LoginThemeStyles> = {
  verde: {
    primary: '#00A86B',
    primaryHover: '#059669',
    accentLight: '#10b981',
    badgeBg: 'rgba(0, 168, 107, 0.12)',
    badgeBorder: 'rgba(0, 168, 107, 0.35)',
    badgeText: '#008756',
    bannerGradient: 'linear-gradient(145deg, #062c21 0%, #05583f 48%, #00A86B 100%)',
    expandedGradient: 'linear-gradient(135deg, #054936 0%, #047857 48%, #00c47c 100%)',
    glowColor: 'rgba(0, 168, 107, 0.28)',
    heatmapActive: '#10b981',
    heatmapMid: 'rgba(16, 185, 129, 0.65)',
    heatmapSoft: 'rgba(16, 185, 129, 0.3)',
  },
  azul: {
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    accentLight: '#38bdf8',
    badgeBg: 'rgba(37, 99, 235, 0.12)',
    badgeBorder: 'rgba(37, 99, 235, 0.35)',
    badgeText: '#1d4ed8',
    bannerGradient: 'linear-gradient(145deg, #0c1938 0%, #1e3a8a 48%, #2563eb 100%)',
    expandedGradient: 'linear-gradient(135deg, #172554 0%, #1d4ed8 48%, #0ea5e9 100%)',
    glowColor: 'rgba(37, 99, 235, 0.28)',
    heatmapActive: '#38bdf8',
    heatmapMid: 'rgba(56, 189, 248, 0.65)',
    heatmapSoft: 'rgba(56, 189, 248, 0.3)',
  },
  rosa: {
    primary: '#db2777',
    primaryHover: '#be185d',
    accentLight: '#f472b6',
    badgeBg: 'rgba(219, 39, 119, 0.12)',
    badgeBorder: 'rgba(219, 39, 119, 0.35)',
    badgeText: '#be185d',
    bannerGradient: 'linear-gradient(145deg, #320820 0%, #831843 48%, #db2777 100%)',
    expandedGradient: 'linear-gradient(135deg, #500724 0%, #be185d 48%, #ec4899 100%)',
    glowColor: 'rgba(219, 39, 119, 0.28)',
    heatmapActive: '#f472b6',
    heatmapMid: 'rgba(244, 114, 182, 0.65)',
    heatmapSoft: 'rgba(244, 114, 182, 0.3)',
  },
  roxo: {
    primary: '#7C3AED',
    primaryHover: '#6D28D9',
    accentLight: '#A78BFA',
    badgeBg: 'rgba(124, 58, 237, 0.12)',
    badgeBorder: 'rgba(124, 58, 237, 0.35)',
    badgeText: '#6D28D9',
    bannerGradient: 'linear-gradient(145deg, #1b0d33 0%, #4c1d95 48%, #7C3AED 100%)',
    expandedGradient: 'linear-gradient(135deg, #2e1065 0%, #6d28d9 48%, #8b5cf6 100%)',
    glowColor: 'rgba(124, 58, 237, 0.3)',
    heatmapActive: '#A78BFA',
    heatmapMid: 'rgba(167, 139, 250, 0.65)',
    heatmapSoft: 'rgba(167, 139, 250, 0.3)',
  },
  laranja: {
    primary: '#FF6B00',
    primaryHover: '#e65100',
    accentLight: '#fb923c',
    badgeBg: 'rgba(255, 107, 0, 0.12)',
    badgeBorder: 'rgba(255, 107, 0, 0.35)',
    badgeText: '#c2410c',
    bannerGradient: 'linear-gradient(145deg, #2e1002 0%, #9a3412 48%, #FF6B00 100%)',
    expandedGradient: 'linear-gradient(135deg, #431407 0%, #c2410c 48%, #FF6B00 100%)',
    glowColor: 'rgba(255, 107, 0, 0.3)',
    heatmapActive: '#fb923c',
    heatmapMid: 'rgba(251, 146, 60, 0.65)',
    heatmapSoft: 'rgba(251, 146, 60, 0.3)',
  },
};

const LOGIN_BG_IMAGES: Record<string, string> = {
  verde: '/assets/bannersauthpage/Banner_tela_login.verde.webp',
  azul: '/assets/bannersauthpage/Banner_tela_login.azul.webp',
  rosa: '/assets/bannersauthpage/Banner_tela_login.rosa.webp',
  roxo: '/assets/bannersauthpage/Banner_tela_login.roxo.webp',
  laranja: '/assets/bannersauthpage/Banner_tela_login.laranja.webp',
};

const LOGIN_BANNERS: Record<string, string> = {
  verde: '/assets/bannerslogin/Banner-login-verde.webp',
  azul: '/assets/bannerslogin/Banner-login-azul.webp',
  rosa: '/assets/bannerslogin/Banner-login-rosa.webp',
  roxo: '/assets/bannerslogin/Banner-login-roxo.webp',
  laranja: '/assets/bannerslogin/Banner-login-laranja.webp',
};

export const AuthPage: React.FC = () => {
  const {
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginAsGuest,
    resetPassword,
    setLoginTransitioning,
  } = useAuth();
  const { colorSkin, reapplyTheme } = useTheme();

  // Resolve o tema da tela de login respeitando o fallback de 7 dias para o Verde (#00A86B)
  const [loginSkin, setLoginSkin] = useState<ColorSkin>(() => resolveInitialSkinWithFallback());

  useEffect(() => {
    const resolved = resolveInitialSkinWithFallback();
    setLoginSkin(resolved);
  }, [colorSkin]);

  // A tela de login NUNCA renderiza em modo escuro (dark mode), independentemente de o usuário
  // estar no modo escuro antes de deslogar ou da preferência do SO (prefers-color-scheme).
  // Remove as classes 'dark' e 'dark-mode' da tag <html> e <body> enquanto a tela de login estiver montada.
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    root.classList.remove('dark', 'dark-mode');
    body?.classList.remove('dark', 'dark-mode');

    // Ao desmontar (após o login ser concluído), restaura a preferência real do usuário salva
    return () => {
      try {
        const savedTheme = localStorage.getItem('gabarita_theme') || 'dark';
        let isDark = false;
        if (savedTheme === 'dark') {
          isDark = true;
        } else if (savedTheme === 'system') {
          isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        if (isDark) {
          root.classList.add('dark', 'dark-mode');
          body?.classList.add('dark', 'dark-mode');
        }
      } catch (err) {
        console.warn('Erro ao restaurar classes de tema após login:', err);
      }
    };
  }, []);

  const themeStyles = LOGIN_THEMES[loginSkin] || LOGIN_THEMES.verde;
  const activeBgImage = LOGIN_BG_IMAGES[loginSkin] || LOGIN_BG_IMAGES.verde;
  const bannerImage = LOGIN_BANNERS[loginSkin] || LOGIN_BANNERS.verde;

  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem(REMEMBERED_EMAIL_KEY) || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(REMEMBERED_EMAIL_KEY));
    } catch {
      return false;
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITEKEY || '0x4AAAAAAAF6vRO8n_yCS06wS';
  const turnstileRef = useRef<TurnstileInstance>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const resetTurnstile = () => {
    setCaptchaToken(null);
    turnstileRef.current?.reset();
  };

  // Estados da transição cinematográfica pós-login (Banner Expansion)
  const [isExpanding, setIsExpanding] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(15);
  const [welcomeUserName, setWelcomeUserName] = useState<string>('Estudante');

  // Dispara a animação de expansão do banner cobrindo 100% do card antes de liberar o dashboard
  const triggerBannerExpansion = async (displayName?: string) => {
    const firstName = (displayName || 'Concurseiro(a)').trim().split(' ')[0];
    setWelcomeUserName(firstName);
    touchLastActiveTimestamp();
    setIsExpanding(true);
    setTransitionProgress(25);

    setTimeout(() => setTransitionProgress(72), 180);
    setTimeout(() => setTransitionProgress(100), 480);

    await new Promise(resolve => setTimeout(resolve, 680));
    try {
      reapplyTheme();
    } catch {}
    setLoginTransitioning(false);
  };

  const handleMainAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isExpanding) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();

    if (activeTab === 'login') {
      if (!cleanEmail) {
        setErrorMessage('Preencha o e-mail para continuar.');
        return;
      }
      if (!password) {
        setErrorMessage('Preencha a senha para continuar.');
        return;
      }
      if (!captchaToken) {
        setErrorMessage('Por favor, complete a verificação anti-robô (Cloudflare Turnstile) antes de prosseguir.');
        return;
      }

      try {
        if (rememberEmail) {
          localStorage.setItem(REMEMBERED_EMAIL_KEY, cleanEmail);
        } else {
          localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }
      } catch {}

      setIsSubmitting(true);
      setLoginTransitioning(true);

      try {
        const loggedUser = await loginWithEmail(cleanEmail, password, captchaToken);
        await triggerBannerExpansion(loggedUser?.name || cleanEmail.split('@')[0]);
      } catch (err: any) {
        console.warn('[AuthPage] Falha no login:', err.message);
        resetTurnstile();
        setLoginTransitioning(false);
        setIsSubmitting(false);
        setIsExpanding(false);
        setErrorMessage(err.message || 'E-mail ou senha incorretos.');
      }
    } else {
      const cleanName = name.trim();
      if (!cleanName) {
        setErrorMessage('Por favor, informe seu nome completo.');
        return;
      }
      if (!cleanEmail) {
        setErrorMessage('Por favor, informe seu e-mail para cadastro.');
        return;
      }
      if (!password) {
        setErrorMessage('Por favor, informe uma senha.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('A senha deve conter no mínimo 6 caracteres.');
        return;
      }
      if (!acceptedTerms) {
        setErrorMessage('Você deve aceitar os Termos de Uso e Política de Privacidade para criar uma conta.');
        return;
      }
      if (!captchaToken) {
        setErrorMessage('Por favor, complete a verificação anti-robô (Cloudflare Turnstile) antes de prosseguir.');
        return;
      }

      setIsSubmitting(true);
      setLoginTransitioning(true);

      try {
        const result = await registerWithEmail(cleanName, cleanEmail, password, acceptedTerms, captchaToken);
        if (result?.needsEmailConfirmation) {
          resetTurnstile();
          setLoginTransitioning(false);
          setIsSubmitting(false);
          setSuccessMessage('Cadastro realizado! Verifique seu e-mail para confirmar a conta antes de entrar.');
        } else {
          await triggerBannerExpansion(cleanName);
        }
      } catch (err: any) {
        console.warn('[AuthPage] Falha no cadastro:', err.message);
        resetTurnstile();
        setLoginTransitioning(false);
        setIsSubmitting(false);
        setIsExpanding(false);
        setErrorMessage(err.message || 'Não foi possível cadastrar seu usuário.');
      }
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (isSubmitting || isExpanding) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    const credential = credentialResponse.credential;
    if (!credential) {
      setErrorMessage('Não foi possível obter o ID Token (credential) do Google.');
      return;
    }

    setIsSubmitting(true);
    setLoginTransitioning(true);
    try {
      touchLastActiveTimestamp();
      const loggedUser = await loginWithGoogle(credential);
      await triggerBannerExpansion(loggedUser?.name || 'Concurseiro(a)');
    } catch (err: any) {
      console.warn('[AuthPage] Falha no Google ID Token Auth:', err.message);
      setLoginTransitioning(false);
      setIsSubmitting(false);
      setIsExpanding(false);
      setErrorMessage(err.message || 'Erro ao autenticar com o Google.');
    }
  };

  const handleGoogleError = () => {
    setIsSubmitting(false);
    setLoginTransitioning(false);
    setErrorMessage('O login com Google foi cancelado ou falhou. Tente novamente.');
  };

  const handleGoogleFallbackClick = () => {
    if (isSubmitting || isExpanding) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    const gAccounts = (window as any).google?.accounts?.id;
    if (GOOGLE_CLIENT_ID && gAccounts) {
      gAccounts.prompt();
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      setErrorMessage(
        'Configure a variável VITE_GOOGLE_CLIENT_ID no ambiente com o Client ID do Google Cloud Console para utilizar o login com Google ID Token.'
      );
    }
  };

  const handleGuestLogin = async () => {
    if (isSubmitting || isExpanding) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    setLoginTransitioning(true);
    try {
      const guestUser = await loginAsGuest();
      await triggerBannerExpansion(guestUser?.name || 'Visitante');
    } catch (err: any) {
      console.warn('[AuthPage] Falha no modo visitante:', err);
      setLoginTransitioning(false);
      setIsSubmitting(false);
      setIsExpanding(false);
      setErrorMessage('Não foi possível iniciar o modo demonstração.');
    }
  };

  const handleForgotPasswordClick = async () => {
    if (isSubmitting || isExpanding) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Informe seu e-mail no campo acima para enviarmos o link de recuperação de senha.');
      return;
    }
    if (!captchaToken) {
      setErrorMessage('Por favor, complete a verificação anti-robô (Cloudflare Turnstile) antes de prosseguir.');
      return;
    }
    setIsSubmitting(true);
    try {
      await resetPassword(cleanEmail, captchaToken);
      resetTurnstile();
      setSuccessMessage('Link de redefinição de senha enviado para seu e-mail!');
    } catch (err: any) {
      console.warn('[AuthPage] Falha na recuperação de senha:', err.message);
      resetTurnstile();
      setErrorMessage(err.message || 'Não foi possível enviar o e-mail de recuperação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F3F5F7] text-slate-900 flex items-center justify-center p-3 sm:p-6 relative overflow-hidden select-none"
      style={{
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.70), rgba(255, 255, 255, 0.70)), url("${activeBgImage}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Elementos decorativos sutis de fundo */}
      <div
        className="absolute -top-32 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none opacity-20 transition-colors duration-700"
        style={{ backgroundColor: themeStyles.primary }}
      />
      <div
        className="absolute -bottom-32 right-1/4 w-[450px] h-[450px] rounded-full blur-3xl pointer-events-none opacity-15 transition-colors duration-700"
        style={{ backgroundColor: themeStyles.accentLight }}
      />

      {/* Ícones marca d'água no fundo da página */}
      <Clock className="hidden xl:block absolute left-8 bottom-20 w-16 h-16 text-slate-300/50 pointer-events-none -rotate-12" />
      <Calendar className="hidden xl:block absolute right-24 top-1/3 w-14 h-14 text-slate-300/45 pointer-events-none rotate-6" />
      <Target className="hidden xl:block absolute right-14 bottom-16 w-16 h-16 text-slate-300/50 pointer-events-none" />

      {/* Toast flutuante de boas-vindas durante a expansão pós-login */}
      <div
        className={`fixed top-5 right-5 z-50 bg-white border border-slate-200/90 rounded-2xl shadow-2xl px-4 py-3 min-w-[240px] transition-all duration-500 pointer-events-none ${
          isExpanding
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 -translate-y-3 scale-95'
        }`}
        style={{
          borderLeftWidth: '4px',
          borderLeftColor: themeStyles.primary,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: themeStyles.badgeBg,
              color: themeStyles.primary,
            }}
          >
            <Info className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Usuário</p>
            <p className="text-xs text-slate-500">Olá, {welcomeUserName}!</p>
          </div>
        </div>
        <div className="mt-2.5 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${transitionProgress}%`,
              backgroundColor: themeStyles.primary,
            }}
          />
        </div>
      </div>

      {/* Container Principal de Login (2 Colunas com Expansão Fluida do Banner Direito) */}
      <div className="w-full max-w-[1060px] min-h-[650px] bg-white rounded-[28px] border border-slate-200/80 shadow-[0_24px_70px_rgba(15,23,42,0.08)] p-3 sm:p-3.5 relative overflow-hidden flex">
        {/* ===================================================================
            COLUNA ESQUERDA: FORMULÁRIO DE AUTENTICAÇÃO
            =================================================================== */}
        <div
          className={`w-full lg:w-[48%] px-4 py-5 sm:px-9 sm:py-7 flex flex-col justify-between z-10 transition-all duration-500 ease-in-out ${
            isExpanding
              ? 'opacity-0 -translate-x-6 pointer-events-none'
              : 'opacity-100 translate-x-0'
          }`}
        >
          {/* Topo: Logo + Nome + Badge Concursos */}
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex items-center justify-center">
                  <GezinhoLogo size={36} />
                </div>
                <span className="text-2xl font-black tracking-tight text-slate-900">
                  Gabarita
                </span>
                <span
                  className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: themeStyles.badgeBg,
                    borderColor: themeStyles.badgeBorder,
                    color: themeStyles.badgeText,
                  }}
                >
                  CONCURSOS
                </span>
              </div>

              {/* Alternador rápido Entrar / Criar Conta */}
              <button
                type="button"
                disabled={isSubmitting || isExpanding}
                onClick={() => {
                  setActiveTab(prev => (prev === 'login' ? 'register' : 'login'));
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  resetTurnstile();
                }}
                className="text-xs font-bold hover:underline cursor-pointer transition-colors"
                style={{ color: themeStyles.primary }}
              >
                {activeTab === 'login' ? 'Criar conta' : 'Já tenho conta'}
              </button>
            </div>

            {/* Saudação Principal */}
            <div>
              {activeTab === 'login' ? (
                <>
                  <h1 className="text-2xl sm:text-[30px] font-extrabold text-slate-900 leading-[1.18] tracking-tight">
                    Olá,
                    <br />
                    bem-vindo de volta
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
                    Entre para continuar seus estudos.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl sm:text-[28px] font-extrabold text-slate-900 leading-[1.18] tracking-tight">
                    Crie sua conta
                    <br />
                    no Gabarita
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
                    Planeje seus estudos com inteligência e conquiste sua vaga.
                  </p>
                </>
              )}
            </div>

            {/* Formulário */}
            <form onSubmit={handleMainAction} className="space-y-4" noValidate>
              {activeTab === 'register' && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-name"
                    className="block text-xs font-bold text-slate-700"
                  >
                    Nome Completo
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="auth-name"
                      type="text"
                      disabled={isSubmitting || isExpanding}
                      placeholder="Ex: Ana Carolina Ribeiro"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-sm pl-10 pr-4 py-2.5 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                    />
                  </div>
                </div>
              )}

              {/* E-mail */}
              <div className="space-y-1.5">
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-bold text-slate-700"
                >
                  E-mail
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-email"
                    type="email"
                    disabled={isSubmitting || isExpanding}
                    placeholder="seu.email@exemplo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-sm pl-10 pr-4 py-2.5 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="auth-password"
                    className="block text-xs font-bold text-slate-700"
                  >
                    Senha
                  </label>
                  <button
                    type="button"
                    disabled={isSubmitting || isExpanding}
                    onClick={handleForgotPasswordClick}
                    className="text-xs font-semibold hover:underline cursor-pointer transition-colors"
                    style={{ color: themeStyles.primary }}
                  >
                    Esqueci minha senha
                  </button>
                </div>

                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    disabled={isSubmitting || isExpanding}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-sm pl-10 pr-11 py-2.5 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    disabled={isSubmitting || isExpanding}
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3 p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                    aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Checkbox Lembrar E-mail (Login) ou Aceitar Termos (Cadastro) */}
              {activeTab === 'login' ? (
                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    id="remember-email"
                    type="checkbox"
                    disabled={isSubmitting || isExpanding}
                    checked={rememberEmail}
                    onChange={e => setRememberEmail(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 cursor-pointer accent-emerald-600"
                  />
                  <label
                    htmlFor="remember-email"
                    className="text-xs text-slate-600 cursor-pointer select-none"
                  >
                    Lembrar meu e-mail
                  </label>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 pt-0.5 text-xs">
                  <input
                    id="auth-terms"
                    type="checkbox"
                    disabled={isSubmitting || isExpanding}
                    checked={acceptedTerms}
                    onChange={e => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 cursor-pointer accent-emerald-600"
                  />
                  <label
                    htmlFor="auth-terms"
                    className="text-slate-500 leading-relaxed select-none cursor-pointer"
                  >
                    Li e concordo com os{' '}
                    <button
                      type="button"
                      onClick={() => setIsTermsModalOpen(true)}
                      className="font-semibold underline hover:opacity-80 cursor-pointer"
                      style={{ color: themeStyles.primary }}
                    >
                      Termos de Uso
                    </button>{' '}
                    e Política de Privacidade.
                  </label>
                </div>
              )}

              {/* Widget de Autenticação Anti-Robô Cloudflare Turnstile */}
              <div className="pt-0.5">
                <div className="min-h-[65px] flex items-center">
                  <Turnstile
                    ref={turnstileRef}
                    siteKey={turnstileSiteKey}
                    options={{
                      theme: 'light',
                    }}
                    onSuccess={(token) => setCaptchaToken(token)}
                    onExpire={() => setCaptchaToken(null)}
                    onError={() => setCaptchaToken(null)}
                  />
                </div>
              </div>

              {/* Alertas de Erro */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex flex-col gap-2 animate-fade-in">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                    <span className="font-medium leading-relaxed">{errorMessage}</span>
                  </div>
                  {activeTab === 'login' &&
                    (errorMessage.includes('E-mail ou senha incorretos') ||
                      errorMessage.includes('Nenhum usuário')) && (
                      <div className="pt-1.5 border-t border-rose-200 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('register');
                            setErrorMessage(null);
                            resetTurnstile();
                          }}
                          className="text-[11px] font-bold underline hover:opacity-80 cursor-pointer"
                          style={{ color: themeStyles.primary }}
                        >
                          Criar conta agora
                        </button>
                        <span className="text-slate-400">•</span>
                        <button
                          type="button"
                          onClick={handleForgotPasswordClick}
                          className="text-[11px] font-bold text-sky-600 underline hover:opacity-80 cursor-pointer"
                        >
                          Recuperar senha
                        </button>
                      </div>
                    )}
                </div>
              )}

              {/* Alertas de Sucesso */}
              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs flex items-start gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                  <span className="font-medium leading-relaxed">{successMessage}</span>
                </div>
              )}

              {/* Botão Principal de Submissão ('Entrar' / 'Cadastrar') */}
              <button
                type="submit"
                disabled={isSubmitting || isExpanding}
                style={{
                  backgroundColor: themeStyles.primary,
                }}
                className="w-full py-3 px-5 rounded-xl font-bold text-sm text-white shadow-md hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{activeTab === 'login' ? 'Entrando...' : 'Cadastrando...'}</span>
                  </>
                ) : (
                  <>
                    <span>{activeTab === 'login' ? 'Entrar' : 'Cadastrar'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divisor OU CONTINUE COM */}
            <div className="relative py-0.5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                <span className="bg-white px-3 text-slate-400 font-bold">
                  Ou continue com
                </span>
              </div>
            </div>

            {/* Botões Secundários: Google + Modo Demonstração */}
            <div className="space-y-2.5">
              <div className="relative w-full overflow-hidden rounded-xl">
                <button
                  type="button"
                  disabled={isSubmitting || isExpanding}
                  onClick={handleGoogleFallbackClick}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.5.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1s.7 5.4 1.9 7.8l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
                    />
                  </svg>
                  <span>Entrar com Google</span>
                </button>

                {GOOGLE_CLIENT_ID && !isSubmitting && !isExpanding && (
                  <div className="absolute inset-0 opacity-[0.01] flex items-center justify-center overflow-hidden cursor-pointer z-10 [&_iframe]:!w-full [&_iframe]:!h-full [&_div]:!w-full">
                    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        useOneTap={false}
                        width="400"
                        size="large"
                        text="signin_with"
                        shape="rectangular"
                        logo_alignment="center"
                      />
                    </GoogleOAuthProvider>
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={isSubmitting || isExpanding}
                onClick={handleGuestLogin}
                className="w-full py-2.5 px-4 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/60 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4 shrink-0" style={{ color: themeStyles.primary }} />
                <span>Entrar no Modo Demonstração (Sem cadastro)</span>
              </button>
            </div>
          </div>

          {/* Rodapé da Coluna Esquerda */}
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: themeStyles.primary }} />
              <span>Ambiente Seguro</span>
            </span>
            <button
              type="button"
              onClick={() => setIsTermsModalOpen(true)}
              className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Termos de Uso</span>
            </button>
          </div>
        </div>

        {/* ===================================================================
            COLUNA DIREITA: BANNER VISUAL TEMÁTICO & EXPANSÃO CINEMATOGRÁFICA
            No desktop: ocupa 51% à direita e expande para 100% da largura ao logar.
            No mobile: surge com fade/scale cobrindo o card ao logar.
            =================================================================== */}
        <div
          className={`login-showcase-banner ${
            isExpanding
              ? 'flex fixed lg:absolute inset-3 sm:inset-3.5 z-40 opacity-100 scale-100'
              : 'hidden lg:flex lg:absolute lg:top-3.5 lg:bottom-3.5 lg:right-3.5 lg:w-[51%] z-20 opacity-100 scale-100'
          } rounded-[22px] overflow-hidden flex-col justify-start items-center p-7 sm:p-10 text-white shadow-xl min-h-[520px]`}
          style={{
            background: isExpanding ? themeStyles.expandedGradient : themeStyles.bannerGradient,
            transition: 'all 650ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Imagem de fundo responsiva e imune a distorções de zoom */}
          <img
            src={bannerImage}
            alt="Banner do Gabarita"
            className="absolute inset-0 w-full h-full object-cover object-center -z-0 pointer-events-none select-none"
          />

          {/* Camada de contraste para destacar o texto em todos os 5 temas */}
          <div className="absolute inset-0 bg-black/40 pointer-events-none" />

          {/* CONTEÚDO DURANTE A TRANSIÇÃO PÓS-LOGIN (BANNER EXPANDIDO) */}
          {isExpanding ? (
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center animate-fade-in space-y-7 my-auto">
              {/* Cabeçalho de carregamento */}
              <div className="space-y-3">
                <h2
                  className="text-xl sm:text-2xl font-extrabold text-white tracking-tight drop-shadow-md"
                  style={{ color: '#ffffff' }}
                >
                  Preparando seus estudos...
                </h2>
                <div className="w-52 h-1 bg-white/25 rounded-full overflow-hidden mx-auto">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${transitionProgress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* CONTEÚDO PADRÃO DO BANNER DIREITO (PRÉ-LOGIN) */
            <div className="relative z-10 flex flex-col justify-between items-center h-full w-full flex-1 text-center">
              {/* PARTE SUPERIOR (TOPO) */}
              <div className="flex flex-col items-center max-w-md">
                <span
                  className="px-4 py-1 rounded-full text-xs font-semibold tracking-wider uppercase text-white backdrop-blur-md mb-4 border border-white/25 drop-shadow-md"
                  style={{
                    backgroundColor: `${themeStyles.primary}99`,
                  }}
                >
                  SUA APROVAÇÃO A UM PASSO
                </span>
                <h2 className="text-xl lg:text-2xl font-extrabold leading-snug drop-shadow-md">
                  <span className="text-white font-bold" style={{ color: '#ffffff' }}>
                    Tudo o que sua rotina de estudos precisa{' '}
                  </span>
                  <span
                    className="font-bold whitespace-nowrap"
                    style={{ color: themeStyles.accentLight }}
                  >
                    Em um só lugar!
                  </span>
                </h2>
              </div>

              {/* PARTE INFERIOR (CARD COM BORDA FINA + RODAPÉ) */}
              <div className="w-full max-w-md flex flex-col items-center space-y-4 mt-auto pt-6">
                {/* 1. Card Retangular com Borda Fina */}
                <div
                  className="w-full rounded-2xl border bg-black/30 backdrop-blur-md p-3.5 sm:p-4 text-center shadow-lg"
                  style={{
                    borderColor: themeStyles.accentLight,
                  }}
                >
                  <p className="text-xs sm:text-sm leading-relaxed drop-shadow-md">
                    <span className="text-white font-medium" style={{ color: '#ffffff' }}>
                      Transforme disciplina em resultado e chegue mais perto da{' '}
                    </span>
                    <span
                      className="font-bold"
                      style={{ color: themeStyles.accentLight }}
                    >
                      Sua Aprovação!
                    </span>
                  </p>
                </div>

                {/* 2. Rodapé Oficial da Marca (Abaixo do Card) */}
                <div className="flex flex-col items-center space-y-1">
                  <div className="flex items-center justify-center gap-2.5">
                    <img
                      src="https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/public/configuracoes/logo%20gabarita01.png"
                      alt="Logo Gabarita"
                      className="w-7 h-7 object-contain drop-shadow-md"
                    />
                    <span
                      className="text-xl font-black tracking-tight text-white drop-shadow-md"
                      style={{ color: '#ffffff' }}
                    >
                      Gabarita
                    </span>
                  </div>
                  <span className="text-xs tracking-wider text-white/80 font-medium drop-shadow-sm">
                    Estudo de Alto Rendimento
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Termos de Uso e Política de Privacidade */}
      <PrivacyPolicyModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
      />
    </div>
  );
};
