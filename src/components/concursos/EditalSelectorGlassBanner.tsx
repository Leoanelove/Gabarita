import React, { ReactNode } from 'react';
import {
  FileText,
  Sparkles,
  ShieldCheck,
  Layers3
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

type ThemeKey = 'verde' | 'azul' | 'rosa' | 'roxo' | 'laranja';

const EDITAL_PALETTES: Record<ThemeKey, {
  primary: string;
  secondary: string;
  glow: string;
  soft: string;
}> = {
  verde: {
    primary: '#10B981',
    secondary: '#059669',
    glow: 'rgba(16,185,129,0.20)',
    soft: 'rgba(16,185,129,0.08)'
  },
  azul: {
    primary: '#3B82F6',
    secondary: '#2563EB',
    glow: 'rgba(59,130,246,0.20)',
    soft: 'rgba(59,130,246,0.08)'
  },
  rosa: {
    primary: '#EC4899',
    secondary: '#DB2777',
    glow: 'rgba(236,72,153,0.20)',
    soft: 'rgba(236,72,153,0.08)'
  },
  roxo: {
    primary: '#8B5CF6',
    secondary: '#7C3AED',
    glow: 'rgba(139,92,246,0.20)',
    soft: 'rgba(139,92,246,0.08)'
  },
  laranja: {
    primary: '#F97316',
    secondary: '#EA580C',
    glow: 'rgba(249,115,22,0.20)',
    soft: 'rgba(249,115,22,0.08)'
  }
};

function getEditalTheme(context: any): ThemeKey {
  const raw = String(
    context?.colorSkin ||
    context?.palette?.id ||
    context?.palette?.name ||
    context?.activeTheme ||
    context?.theme ||
    'verde'
  ).toLowerCase();

  if (/azul|blue|sky|cyan/.test(raw)) return 'azul';
  if (/rosa|pink|rose/.test(raw)) return 'rosa';
  if (/roxo|purple|violet/.test(raw)) return 'roxo';
  if (/laranja|orange|amber|dbz/.test(raw)) return 'laranja';

  return 'verde';
}

interface EditalSelectorGlassBannerProps {
  children: ReactNode;
}

export const EditalSelectorGlassBanner: React.FC<
  EditalSelectorGlassBannerProps
> = ({ children }) => {
  const themeContext = useTheme();
  const themeKey = getEditalTheme(themeContext);
  const palette = EDITAL_PALETTES[themeKey];
  const isDark = themeContext?.effectiveTheme === 'dark';

  return (
    <section
      className="edital-selector-glass-banner relative rounded-2xl border p-4 sm:p-5 transition-all duration-300"
      style={{
        borderColor: `${palette.primary}66`,
        background: isDark
          ? `
            radial-gradient(
              circle at 95% 5%,
              ${palette.glow},
              transparent 45%
            ),
            linear-gradient(
              125deg,
              ${palette.soft},
              rgba(15,23,42,0.92) 55%,
              ${palette.soft}
            )
          `
          : `
            radial-gradient(
              circle at 95% 5%,
              ${palette.glow},
              transparent 45%
            ),
            linear-gradient(
              125deg,
              ${palette.soft},
              rgba(255,255,255,0.88) 55%,
              ${palette.soft}
            )
          `,
        boxShadow: `0 8px 24px -4px ${palette.glow}, 0 2px 6px -1px rgba(0,0,0,0.06)`,
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)'
      }}
    >
      {/* Elementos vetoriais decorativos */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <div
          className="pointer-events-none absolute -right-8 -top-12 h-36 w-36 rounded-full blur-2xl"
          style={{ background: palette.glow }}
        />

        <div className="pointer-events-none absolute right-8 bottom-0 opacity-10">
          <Layers3
            className="h-24 w-24"
            style={{ color: palette.primary }}
          />
        </div>
      </div>

      {/* Cabeçalho */}
      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          {/* Ícone */}
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md transition-colors duration-300"
            style={{
              background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})`,
              boxShadow: `0 6px 16px ${palette.glow}`
            }}
          >
            <FileText className="h-5 w-5" />
          </div>

          {/* Título + descrição */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
                Selecionar Edital Cadastrado
              </h3>

              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs transition-colors duration-300"
                style={{
                  background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})`
                }}
              >
                <Sparkles className="h-2.5 w-2.5" />
                Opcional
              </span>
            </div>

            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Selecione um edital salvo para preencher automaticamente os dados e todo o conteúdo programático.
            </p>
          </div>
        </div>

        {/* Selo lateral de automação */}
        <div
          className="edital-automation-badge hidden md:inline-flex items-center gap-1.5 self-start rounded-xl border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md transition-colors duration-300 shrink-0"
          style={{
            borderColor: `${palette.primary}40`,
            backgroundColor: isDark ? 'rgba(15,23,42,0.75)' : 'rgba(255,255,255,0.75)',
            color: palette.primary
          }}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Preenchimento Inteligente</span>
        </div>
      </div>

      {/* Campo de busca integrado */}
      <div className="relative z-20 mt-3.5">
        {children}
      </div>
    </section>
  );
};

export default EditalSelectorGlassBanner;
