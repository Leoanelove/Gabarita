import type { ReactNode } from 'react';
import { Calendar, Target } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import type { Concurso } from '../../types';
import { MenuBannerFrame } from './MenuBannerFrame';

const BANNER_THEMES: Record<string, string> = {
  verde: '/assets/bannerspainelgeral/Banner-painel-geral-verde.webp',
  azul: '/assets/bannerspainelgeral/Banner-painel-geral-azul.webp',
  rosa: '/assets/bannerspainelgeral/Banner-painel-geral-rosa.webp',
  roxo: '/assets/bannerspainelgeral/Banner-painel-geral-roxo.webp',
  laranja: '/assets/bannerspainelgeral/Banner-painel-geral-laranja.webp',
};

interface ConcursoBannerProps {
  concurso: Concurso;
  progressPercent: number;
  completedTopics: number;
  totalTopics: number;
  isActive?: boolean;
  heading?: 'h1' | 'h2';
  showExamDate?: boolean;
  badges?: ReactNode;
  actions?: ReactNode;
}

type ConcursoComDataLegada = Concurso & { data_prova?: string; exam_date?: string };

function getExamDate(concurso: ConcursoComDataLegada): Date | null {
  const rawDate = concurso.examDate || concurso.dataProva || concurso.data_prova || concurso.exam_date;
  if (!rawDate) return null;

  const calendarDate = String(rawDate).trim().split('T')[0];
  const parts = calendarDate.split('-');
  const date = parts.length === 3
    ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    : new Date(rawDate);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function ConcursoBanner({
  concurso,
  progressPercent,
  completedTopics,
  totalTopics,
  isActive = true,
  heading: Heading = 'h2',
  showExamDate = false,
  badges,
  actions,
}: ConcursoBannerProps) {
  const { palette } = useTheme();
  const examDate = getExamDate(concurso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysRemaining = examDate ? Math.round((examDate.getTime() - today.getTime()) / 86400000) : null;
  const examPassed = daysRemaining !== null && daysRemaining < 0;
  const metaClass = 'text-xs font-semibold text-slate-200 bg-black/40 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/15';

  return (
    <MenuBannerFrame
      bannerThemes={BANNER_THEMES}
      minHeight="min-h-[220px] md:min-h-[240px]"
      className="card-banner banner-principal painel-geral-main-banner p-6 sm:p-8 text-white shadow-xl border border-slate-700/50 bg-slate-900 dark:bg-slate-950"
      bgWrapperClassName="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0"
      imgClassName="painel-geral-banner-bg-img absolute -left-[7%] -top-[24%] w-[114%] h-[148%] max-w-none object-cover object-[78%_center] md:object-[74%_center] pointer-events-none select-none transition-transform duration-300"
      contentClassName="flex flex-col md:flex-row md:items-center justify-between gap-6"
      alt=""
    >
      <div className="space-y-2 min-w-0 max-w-2xl">
        <div className="flex flex-wrap items-center gap-2">
          {isActive && <span className="badge-ativo px-2.5 py-0.5 rounded-full text-xs font-bold">Concurso Ativo</span>}
          {badges}
          <span className={metaClass}>Órgão: <strong className="text-white">{concurso.organ}</strong></span>
          <span className={metaClass}>Banca: <strong className="text-white">{concurso.banca}</strong></span>
        </div>
        <Heading className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm break-words">
          {concurso.title}
        </Heading>
        <p className="text-sm text-slate-200 leading-snug">
          <span>Cargo: <span className="cargo-destaque font-bold">{concurso.role}</span></span>
          <span className="block mt-0.5">
            Remuneração: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(concurso.remuneration || 0)}
          </span>
        </p>
        <div className="pt-2 max-w-lg space-y-1">
          <div className="flex justify-between gap-2 text-xs font-semibold">
            <span className="text-slate-200 flex items-center gap-1">
              <Target className="progresso-icone w-3.5 h-3.5 shrink-0" />
              Cobertura do Edital Verticalizado
            </span>
            <span className="progresso-texto font-bold shrink-0">{progressPercent}% ({completedTopics}/{totalTopics})</span>
          </div>
          <div
            role="progressbar"
            aria-label="Cobertura do Edital Verticalizado"
            aria-valuenow={progressPercent}
            className="progresso-trilho w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/20"
          >
            <div className="progresso-barra barra-progresso h-full rounded-full transition-all duration-700" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-start md:items-end justify-between gap-4 self-stretch md:shrink-0">
        <div
          ref={(el) => {
            if (el) el.style.setProperty('background-color', '#000000', 'important');
          }}
          className="dias-restantes-card flex items-center gap-4 px-5 py-3 rounded-2xl bg-black backdrop-blur-md border shadow-md transition-all"
          style={{
            backgroundColor: '#000000',
            borderColor: `${palette.primary}66`,
            boxShadow: `0 0 14px ${palette.glowColor || 'rgba(255,255,255,0.1)'}`,
          }}
        >
          <Calendar className="w-10 h-10 shrink-0 text-primary text-destaque-tema" style={{ color: palette.primary }} />
          <div className="flex flex-col items-center justify-center text-center">
            {examPassed ? (
              <span className="text-xl font-extrabold text-white">CONCLUÍDO</span>
            ) : (
              <>
                <span className="text-[11px] font-bold tracking-wider text-slate-300 uppercase">FALTAM</span>
                <div className="flex items-baseline gap-1.5 leading-none my-0.5">
                  <span className="text-3xl font-extrabold text-white">{daysRemaining ?? '--'}</span>
                  <span className="text-base font-bold text-primary text-destaque-tema" style={{ color: palette.primary }}>
                    {daysRemaining === 1 ? 'DIA' : 'DIAS'}
                  </span>
                </div>
              </>
            )}
            <span className="text-[9px] font-bold tracking-widest text-primary/90 text-destaque-tema mt-1 uppercase" style={{ color: palette.primary }}>
              {examPassed ? 'CONCURSO ENCERRADO' : 'PARA A PROVA'}
            </span>
            {showExamDate && (
              <span className="mt-1 text-xs text-slate-200">Prova: {examDate?.toLocaleDateString('pt-BR') ?? 'A definir'}</span>
            )}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </MenuBannerFrame>
  );
}
