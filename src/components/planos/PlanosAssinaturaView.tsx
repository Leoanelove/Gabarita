import React, { useState, useMemo } from 'react';
import { Crown, CheckCircle2, Check } from 'lucide-react';
import { UserProfile, UserPlan } from '../../types';
import { FeatureGate } from '../../utils/featureGate';
import { PaymentService } from '../../services/paymentService';
import { Card, CardBody } from '../../design-system/Card';
import { Button } from '../../design-system/Button';
import { Badge } from '../../design-system/Badge';
import { useTheme } from '../../contexts/ThemeContext';

export const PLANOS_BANNER_THEMES: Record<string, string> = {
  verde: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Planos%20e%20Precos/Banner-Planos-verde.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBQbGFub3MgZSBQcmVjb3MvQmFubmVyLVBsYW5vcy12ZXJkZS5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzkyNjgxMjMyLCJleHAiOjQ5NDYyODEyMzJ9.ZKORMkXE457LoKX9tEhc3W5g6MPo09tNmoRT4aCb3uhwwZrWWJe_TnXkKSG6_iMG7s3lA5Ze5givXGDXuOtyKA",

  azul: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Planos%20e%20Precos/Banner-Planos-azul.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBQbGFub3MgZSBQcmVjb3MvQmFubmVyLVBsYW5vcy1henVsLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3OTI2ODEyNDYsImV4cCI6NDk0NjI4MTI0Nn0.xtz3XVW4kjEOTSfrBbd77E2fNpg9Wf-FyB-YHYnVoD5OD0uIXjcJnp9dQlT1vcQhXMH7Ruhw3jYvNkYuFgAj_Q",

  rosa: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Planos%20e%20Precos/Banner-Planos-rosa.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBQbGFub3MgZSBQcmVjb3MvQmFubmVyLVBsYW5vcy1yb3NhLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3OTI2ODEyNjEsImV4cCI6NDk0NjI4MTI2MX0.GvRJNmTp73eL1oYIT-WTGrrty2P_uUCY1ey_jQxZ6FKYC5G26xFYD904bmWZpH00Thmw1C7Kq_qH9_nYN-QfgA",

  roxo: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Planos%20e%20Precos/Banner-Planos-roxo.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBQbGFub3MgZSBQcmVjb3MvQmFubmVyLVBsYW5vcy1yb3hvLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3OTI2ODEyNzMsImV4cCI6NDk0NjI4MTI3M30.B1vB88vxbjpOYq3SBH7IfL8YP8W6hdItegzGbPzMAksv2lYU2lZjIUYvTqIWrj_2S9mbXIWndho1WP29MItnYA",

  laranja: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Planos%20e%20Precos/Banner-Planos-laranja.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBQbGFub3MgZSBQcmVjb3MvQmFubmVyLVBsYW5vcy1sYXJhbmphLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3OTI2ODEyODcsImV4cCI6NDk0NjI4MTI4N30.lt9dLGJm29C5tT0E11bj21Avwdx8-Fu36nSgmQ6Kv07AI9km7ZS3hycpLIhQv6zdvBcJqynbO46oW1QHikEGhw"
};

interface PlanosAssinaturaViewProps {
  user: UserProfile;
  onUpdateSubscription: (plan: UserPlan) => Promise<void>;
}

export const PlanosAssinaturaView: React.FC<PlanosAssinaturaViewProps> = ({
  user,
  onUpdateSubscription,
}) => {
  const { colorSkin, palette } = useTheme();
  const currentTheme = (
    colorSkin === 'purple' ? 'roxo' :
    colorSkin === 'orange' || colorSkin === 'dbz' ? 'laranja' :
    colorSkin || palette?.id || 'verde'
  ).toLowerCase();

  const themeKey = (currentTheme || 'verde').toLowerCase();
  const bannerUrl = PLANOS_BANNER_THEMES[themeKey] || PLANOS_BANNER_THEMES.verde;

  const themeGlowStyles = useMemo(() => {
    switch (themeKey) {
      case 'roxo':
        return {
          color: '#A78BFA',
          borderColor: 'rgba(167, 139, 250, 0.45)',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(167, 139, 250, 0.95), 0 0 18px rgba(139, 92, 246, 0.85), 0 0 32px rgba(124, 58, 237, 0.65)',
        };
      case 'laranja':
        return {
          color: '#FB923C',
          borderColor: 'rgba(251, 146, 60, 0.45)',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(251, 146, 60, 0.95), 0 0 18px rgba(249, 115, 22, 0.85), 0 0 32px rgba(234, 88, 12, 0.65)',
        };
      case 'azul':
        return {
          color: '#60A5FA',
          borderColor: 'rgba(96, 165, 250, 0.45)',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(96, 165, 250, 0.95), 0 0 18px rgba(37, 99, 235, 0.8), 0 0 32px rgba(29, 78, 216, 0.6)',
        };
      case 'rosa':
        return {
          color: '#F472B6',
          borderColor: 'rgba(244, 114, 182, 0.45)',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(244, 114, 182, 0.95), 0 0 18px rgba(219, 39, 119, 0.8), 0 0 32px rgba(190, 24, 93, 0.6)',
        };
      case 'verde':
      default:
        return {
          color: '#34D399',
          borderColor: 'rgba(52, 211, 153, 0.45)',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(52, 211, 153, 0.95), 0 0 18px rgba(16, 185, 129, 0.8), 0 0 32px rgba(5, 150, 105, 0.6)',
        };
    }
  }, [themeKey]);

  const currentPlan = FeatureGate.getUserPlan(user);
  const [selectedGateway, setSelectedGateway] = useState<'stripe' | 'mercadopago'>('stripe');
  const [isProcessing, setIsProcessing] = useState<UserPlan | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubscribe = async (plan: UserPlan) => {
    setIsProcessing(plan);
    setSuccessMessage(null);
    try {
      await PaymentService.createCheckoutSession(plan, selectedGateway);
      await onUpdateSubscription(plan);
      setSuccessMessage(`Parabéns! Você ativou com sucesso o ${PaymentService.getPlanPrice(plan).name}.`);
    } catch (e) {
      console.error('Erro na assinatura:', e);
    } finally {
      setIsProcessing(null);
    }
  };

  const plansList = [
    {
      id: 'gratuito' as UserPlan,
      name: 'Plano Gratuito',
      price: 'R$ 0',
      period: 'para sempre',
      description: 'Ideal para iniciar seus estudos.',
      features: ['1 Concurso Ativo', 'Edital verticalizado básico', 'Registro de sessões'],
      badge: 'Atual',
      badgeVariant: 'slate' as const,
      highlight: false,
    },
    {
      id: 'teste' as UserPlan,
      name: 'Teste Gratuito (7 Dias)',
      price: 'R$ 0',
      period: 'por 7 dias',
      description: 'Experimente recursos PRO.',
      features: ['Concursos ilimitados', 'Edital por IA', 'Assistente IA Ilimitado'],
      badge: 'Grátis',
      badgeVariant: 'sky' as const,
      highlight: false,
    },
    {
      id: 'mensal' as UserPlan,
      name: 'Plano Mensal PRO',
      price: 'R$ 49,90',
      period: 'por mês',
      description: 'Flexibilidade para preparação.',
      features: ['Tudo do Teste', 'Assistente prioritário', 'Relatórios e exportação'],
      badge: 'Popular',
      badgeVariant: 'purple' as const,
      highlight: false,
    },
    {
      id: 'anual' as UserPlan,
      name: 'Plano Anual PRO',
      price: 'R$ 29,90',
      period: 'por mês (anual)',
      description: 'Melhor custo-benefício.',
      features: ['Economia de 40%', 'Recursos PRO ilimitados', 'Suporte dedicado'],
      badge: '-40%',
      badgeVariant: 'emerald' as const,
      highlight: true,
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-fade-in">
      <div
        ref={(el) => {
          if (el) {
            el.style.setProperty('background-image', `url('${bannerUrl}')`, 'important');
            el.style.setProperty('background-size', '135% 135%', 'important');
            el.style.setProperty('background-position', '72% center', 'important');
            el.style.setProperty('background-repeat', 'no-repeat', 'important');
          }
        }}
        className="planos-banner w-full relative overflow-hidden rounded-2xl border border-slate-200/20 dark:border-slate-800 shadow-xl min-h-[190px] md:min-h-[210px] flex items-center justify-center bg-slate-950 py-8 px-6 md:px-10 card-banner metas-xp-banner"
        style={{
          backgroundImage: `url('${bannerUrl}')`,
          backgroundSize: '135% 135%',
          backgroundPosition: '72% center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Imagem correspondente cobrindo 100% do container */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
          <img
            key={bannerUrl}
            src={bannerUrl}
            alt="Banner Planos & Assinatura"
            className="w-full h-full object-cover object-center scale-100 transition-transform duration-300"
          />
        </div>

        {/* Overlay suave para alto contraste e legibilidade em modo claro e escuro */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/55 to-slate-950/75 pointer-events-none z-[1]" />

        <div className="relative z-10 text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-black/55 backdrop-blur-md border text-xs font-bold tracking-wide shadow-md"
            style={{
              color: themeGlowStyles.color,
              borderColor: themeGlowStyles.borderColor,
            }}
          >
            <Crown className="w-3.5 h-3.5 inline shrink-0" />
            <span>Assinatura & Planos</span>
          </div>
          <h2
            className="provas-banner-title text-2xl sm:text-3xl font-black !text-white tracking-tight leading-tight select-none drop-shadow-md"
            style={{
              color: '#FFFFFF',
              textShadow: themeGlowStyles.textShadow,
            }}
          >
            Escolha o plano ideal para a sua aprovação
          </h2>
          <p
            className="text-xs sm:text-sm !text-white/90 leading-relaxed max-w-xl mx-auto drop-shadow-xs"
            style={{ color: 'rgba(255, 255, 255, 0.92)' }}
          >
            Desbloqueie inteligência artificial avançada e editais ilimitados.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 max-w-xl mx-auto">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plansList.map(plan => {
          const isCurrent = currentPlan === plan.id;
          return (
            <Card
              key={plan.id}
              className={`plano-card relative flex flex-col justify-between overflow-hidden transition-all duration-300 ${
                plan.highlight ? 'plano-highlight border-2 border-emerald-500 shadow-xl' : ''
              }`}
            >
              <CardBody className="p-6 space-y-5 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white dark:drop-shadow-[0_2px_8px_rgba(255,255,255,0.1)]">
                      {plan.name}
                    </h3>
                    <Badge variant={plan.badgeVariant} size="sm" className="plano-badge font-bold">
                      {plan.badge}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight dark:drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)]">
                      {plan.price}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{plan.description}</p>
                  <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200">
                        <Check className="w-4 h-4 text-emerald-500 dark:text-[var(--primary-color)] shrink-0 mt-0.5 dark:drop-shadow-[0_0_6px_var(--primary-color)]" />
                        <span className="leading-tight">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-6">
                  {isCurrent ? (
                    <Button variant="outline" className="w-full plano-btn-current" disabled>
                      Plano Atual
                    </Button>
                  ) : (
                    <Button
                      variant={plan.highlight ? 'primary' : 'outline'}
                      className={`w-full plano-btn-action ${plan.highlight ? 'plano-btn-highlight' : ''}`}
                      isLoading={isProcessing === plan.id}
                      onClick={() => handleSubscribe(plan.id)}
                    >
                      {plan.id === 'gratuito' ? 'Selecionar' : 'Assinar Agora'}
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
