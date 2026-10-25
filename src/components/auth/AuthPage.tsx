import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../../design-system/Button';
import { Card, CardBody } from '../../design-system/Card';
import { PrivacyPolicyModal } from '../privacy/PrivacyPolicyModal';
import { GezinhoLogo } from '../common/GezinhoLogo';

type AuthTab = 'login' | 'register';
const LOGIN_BG_URL = 'https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Tela%20de%20Login/Banner_Tela_Login_verde.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvVGVsYSBkZSBMb2dpbi9CYW5uZXJfVGVsYV9Mb2dpbl92ZXJkZS5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzkyNzY4MzYzLCJleHAiOjQ5NDYzNjgzNjN9.tGSJVlCp1EecgtHwh9cLPgmWf4z93LT-VHGUtf7uOaKeaINSO1h4SIUoh_2U3eQlddVHyht6MTiRogysfvXSNw';

export const AuthPage: React.FC = () => {
  const { loginWithEmail, registerWithEmail, loginWithGoogle, resetPassword } = useAuth();
  const { palette } = useTheme();

  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMainAction = async (e: React.FormEvent) => {
    e.preventDefault();
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

      setIsSubmitting(true);
      try {
        await loginWithEmail(cleanEmail, password);
      } catch (err: any) {
        console.error("Erro Supabase Auth:", err);
        setErrorMessage(err.message || 'E-mail ou senha incorretos.');
      } finally {
        setIsSubmitting(false);
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

      setIsSubmitting(true);
      try {
        const result = await registerWithEmail(cleanName, cleanEmail, password, acceptedTerms);
        if (result?.needsEmailConfirmation) {
          setSuccessMessage('Cadastro realizado! Verifique seu e-mail para confirmar a conta antes de entrar.');
        } else {
          setSuccessMessage('Cadastro realizado com sucesso! Redirecionando...');
        }
      } catch (err: any) {
        console.error("Erro Supabase Auth:", err);
        setErrorMessage(err.message || 'Não foi possível cadastrar seu usuário no Supabase.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleGoogleAction = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Erro Supabase Auth:", err);
      setErrorMessage(err.message || 'Erro ao conectar com Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordClick = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Informe seu e-mail no campo acima para enviarmos o link de recuperação de senha.');
      return;
    }
    setIsSubmitting(true);
    try {
      await resetPassword(cleanEmail);
      setSuccessMessage('Link de redefinição de senha enviado para seu e-mail!');
    } catch (err: any) {
      console.error("Erro Supabase Auth:", err);
      setErrorMessage(err.message || 'Não foi possível enviar o e-mail de recuperação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
  className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden"
  style={{
    backgroundImage: `url("${LOGIN_BG_URL}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  }}
>
      {/* Efeitos de iluminação de fundo alinhados ao Design System */}
      <div
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full blur-3xl pointer-events-none opacity-20 dark:opacity-25"
        style={{ backgroundColor: palette.primary }}
      />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Identidade Visual e Cabeçalho */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-lg">
            <GezinhoLogo size={56} className="drop-shadow-md" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
              <span>Gabarita</span>
              <span
                className="text-[11px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full border"
                style={{
                  backgroundColor: `${palette.primary}18`,
                  color: palette.primary,
                  borderColor: `${palette.primary}40`,
                }}
              >
                Concursos
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
              Planejamento inteligente, edital verticalizado, revisões espaçadas e métricas de alta performance.
            </p>
          </div>
        </div>

        {/* Card Principal de Autenticação */}
        <Card className="bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
          <CardBody className="p-6 sm:p-8 space-y-6">
            {/* Alternância entre abas: 'Entrar' e 'Criar Conta' */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Criar Conta
              </button>
            </div>

            {/* Formulário Principal */}
            <form onSubmit={handleMainAction} className="space-y-4" noValidate>
              {activeTab === 'register' && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-name"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
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
                      placeholder="Ex: Ana Carolina Ribeiro"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm pl-10 pr-4 py-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Campo de E-mail */}
              <div className="space-y-1.5">
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
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
                    placeholder="seu.email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm pl-10 pr-4 py-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Campo de Senha com Ícone de Exibir/Ocultar + Link Esqueci Minha Senha */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="auth-password"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPasswordClick}
                    className="text-xs font-semibold hover:underline cursor-pointer transition-colors"
                    style={{ color: palette.primary }}
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
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm pl-10 pr-11 py-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                    aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Termos de Uso no Cadastro */}
              {activeTab === 'register' && (
                <div className="flex items-start gap-2.5 pt-1 text-xs">
                  <input
                    id="auth-terms"
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="auth-terms" className="text-slate-500 dark:text-slate-400 leading-relaxed select-none cursor-pointer">
                    Li e concordo com os{' '}
                    <button
                      type="button"
                      onClick={() => setIsTermsModalOpen(true)}
                      className="font-semibold underline hover:opacity-80 cursor-pointer"
                      style={{ color: palette.primary }}
                    >
                      Termos de Uso
                    </button>{' '}
                    e Política de Privacidade da plataforma.
                  </label>
                </div>
              )}

              {/* Mensagem de Erro de Validação ou Supabase (Posicionada diretamente acima do botão) */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5 animate-fade-in shadow-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                  <span className="font-medium leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {/* Feedback de Sucesso (Posicionado diretamente acima do botão) */}
              {successMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs flex items-start gap-2.5 animate-fade-in shadow-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                  <span className="font-medium leading-relaxed">{successMessage}</span>
                </div>
              )}

              {/* Botão Principal de Ação ('Entrar' / 'Cadastrar') */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
                className="w-full font-bold text-sm tracking-wide shadow-md mt-2 py-3 rounded-xl cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                leftIcon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : undefined}
                rightIcon={!isSubmitting ? <ArrowRight className="w-4 h-4" /> : undefined}
              >
                {isSubmitting 
                  ? (activeTab === 'login' ? 'Entrando...' : 'Cadastrando...') 
                  : (activeTab === 'login' ? 'Entrar' : 'Cadastrar')}
              </Button>
            </form>

            {/* Divisor Visual */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 dark:text-slate-500 font-bold">
                  Ou continue com
                </span>
              </div>
            </div>

            {/* Botão Estilizado para 'Entrar com Google' */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={isSubmitting}
              onClick={handleGoogleAction}
              className="w-full py-2.5 rounded-xl border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold text-sm cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              leftIcon={
                isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
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
                )
              }
            >
              {isSubmitting ? 'Conectando...' : 'Entrar com Google'}
            </Button>

            {/* Rodapé do Card com Link para Termos de Uso */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Ambiente Seguro</span>
              </span>
              <button
                type="button"
                onClick={() => setIsTermsModalOpen(true)}
                className="inline-flex items-center gap-1 font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 underline cursor-pointer transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Termos de Uso</span>
              </button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Modal de Termos de Uso e Política de Privacidade */}
      <PrivacyPolicyModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
      />
    </div>
  );
};
