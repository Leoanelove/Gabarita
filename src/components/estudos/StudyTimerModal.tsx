import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Target, 
  X, 
  Minus, 
  SkipForward, 
  Square,
  AlertCircle,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export interface ThemeNeonToken {
  accent: string;
  accentHover: string;
  glow: string;
  subtleGlow: string;
  borderGlow: string;
  lightText: string;
}

export const THEME_NEON_TOKENS: Record<string, ThemeNeonToken> = {
  verde: {
    accent: '#10b981',
    accentHover: '#059669',
    glow: 'rgba(16, 185, 129, 0.65)',
    subtleGlow: 'rgba(16, 185, 129, 0.25)',
    borderGlow: 'rgba(16, 185, 129, 0.40)',
    lightText: '#ecfdf5',
  },
  azul: {
    accent: '#3b82f6',
    accentHover: '#2563eb',
    glow: 'rgba(59, 130, 246, 0.65)',
    subtleGlow: 'rgba(59, 130, 246, 0.25)',
    borderGlow: 'rgba(59, 130, 246, 0.40)',
    lightText: '#eff6ff',
  },
  rosa: {
    accent: '#ec4899',
    accentHover: '#db2777',
    glow: 'rgba(236, 72, 153, 0.65)',
    subtleGlow: 'rgba(236, 72, 153, 0.25)',
    borderGlow: 'rgba(236, 72, 153, 0.40)',
    lightText: '#fdf2f8',
  },
  roxo: {
    accent: '#a855f7',
    accentHover: '#9333ea',
    glow: 'rgba(168, 85, 247, 0.65)',
    subtleGlow: 'rgba(168, 85, 247, 0.25)',
    borderGlow: 'rgba(168, 85, 247, 0.40)',
    lightText: '#faf5ff',
  },
  laranja: {
    accent: '#f97316',
    accentHover: '#ea580c',
    glow: 'rgba(249, 115, 22, 0.65)',
    subtleGlow: 'rgba(249, 115, 22, 0.25)',
    borderGlow: 'rgba(249, 115, 22, 0.40)',
    lightText: '#fff7ed',
  },
};

type TimerMode = 'foco' | 'pausa_curta' | 'pausa_longa';

// Widget flutuante minimizado no canto inferior direito
interface FloatingTimerWidgetProps {
  onRestore: () => void;
  formattedTime: string;
  isRunning: boolean;
  onTogglePlay: () => void;
  themeToken: ThemeNeonToken;
  currentMode: TimerMode;
  progressRatio: number;
}

const FloatingTimerWidget: React.FC<FloatingTimerWidgetProps> = ({
  onRestore,
  formattedTime,
  isRunning,
  onTogglePlay,
  themeToken,
  progressRatio,
}) => {
  const widgetRadius = 46;
  const widgetCircumference = 2 * Math.PI * widgetRadius;
  const widgetStrokeDashoffset = widgetCircumference * (1 - progressRatio);

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 animate-in fade-in zoom-in-95 duration-200 select-none"
      style={{ filter: 'drop-shadow(0 12px 28px rgba(0,0,0,0.85))' }}
    >
      <div
        onClick={() => onRestore()}
        className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-slate-950/95 backdrop-blur-md cursor-pointer flex flex-col items-center justify-center p-2 transition-all duration-300 hover:scale-105 group"
        style={{
          border: `2px solid ${themeToken.accent}55`,
          boxShadow: `0 0 24px ${themeToken.subtleGlow}, inset 0 0 16px ${themeToken.subtleGlow}`,
        }}
        title="Clique para expandir o cronômetro de foco"
        role="button"
        tabIndex={0}
      >
        <svg className="absolute inset-0 w-full h-full -rotate-90 transform pointer-events-none p-1.5" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={widgetRadius}
            className="stroke-slate-800/80"
            strokeWidth="5"
            fill="transparent"
          />
          <circle
            cx="60"
            cy="60"
            r={widgetRadius}
            stroke={themeToken.accent}
            strokeWidth="5"
            strokeDasharray={widgetCircumference}
            strokeDashoffset={widgetStrokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-300"
            style={{ filter: `drop-shadow(0 0 6px ${themeToken.glow})` }}
          />
        </svg>

        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <span 
            className="text-[9px] font-bold tracking-widest uppercase mb-0.5"
            style={{ color: themeToken.accent }}
          >
            Foco Ativo
          </span>
          <div 
            className="text-lg sm:text-xl font-mono font-black tracking-wider text-white"
            style={{ textShadow: `0 0 8px ${themeToken.glow}` }}
          >
            {formattedTime}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay();
            }}
            className="mt-1 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={isRunning ? 'Pausar' : 'Continuar'}
          >
            {isRunning ? (
              <Pause className="w-3 h-3 fill-current" />
            ) : (
              <Play className="w-3 h-3 fill-current ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export interface StudyTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDurationMinutes?: number;
  initialMode?: TimerMode;
  contextSubtitle?: string;
  onStopAndSave: (elapsedSeconds: number, initialMetaMinutes: number) => void;
}

export const StudyTimerModal: React.FC<StudyTimerModalProps> = ({
  isOpen,
  onClose,
  initialDurationMinutes = 25,
  initialMode = 'foco',
  contextSubtitle,
  onStopAndSave,
}) => {
  const { colorSkin, palette, effectiveTheme } = useTheme();
  const isDarkMode = effectiveTheme === 'dark';
  const normalizedSkin = 
    (colorSkin === 'purple' ? 'roxo' : colorSkin === 'orange' || colorSkin === 'dbz' ? 'laranja' : colorSkin) || 'verde';
  const themeToken = THEME_NEON_TOKENS[normalizedSkin] || THEME_NEON_TOKENS.verde;

  // Estados de exibição e controle do Timer
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentMode, setCurrentMode] = useState<TimerMode>(initialMode);
  const [pomodoroCycle, setPomodoroCycle] = useState<number>(1);
  const [focoMinutes, setFocoMinutes] = useState<number>(initialDurationMinutes || 25);
  const [customMinutesInput, setCustomMinutesInput] = useState<string>('');
  const [secondsRemaining, setSecondsRemaining] = useState<number>((initialDurationMinutes || 25) * 60);
  const [totalFocusSeconds, setTotalFocusSeconds] = useState<number>(0);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Inicialização ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      setIsMinimized(false);
      setShowResetConfirm(false);
      setIsRunning(false);

      const targetMinutes = (initialDurationMinutes && initialDurationMinutes > 0) ? initialDurationMinutes : 25;
      setFocoMinutes(targetMinutes);
      setCustomMinutesInput(![25, 30, 45, 50, 60, 90].includes(targetMinutes) ? String(targetMinutes) : '');
      setSecondsRemaining(targetMinutes * 60);
      setTotalFocusSeconds(0);
      setCurrentMode(initialMode || 'foco');
      setPomodoroCycle(1);
    } else {
      setIsRunning(false);
      setIsMinimized(false);
    }
  }, [isOpen, initialDurationMinutes, initialMode]);

  // Contagem regressiva e acumulação de foco
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            if (interval) clearInterval(interval);
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });

        // Contabiliza tempo líquido somente quando estiver no modo foco
        if (currentMode === 'foco') {
          setTotalFocusSeconds((prev) => prev + 1);
        }
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, currentMode]);

  // Total de segundos do modo ativo para percentual
  const currentTotalSeconds = useMemo(() => {
    if (currentMode === 'foco') return focoMinutes * 60;
    if (currentMode === 'pausa_curta') return 5 * 60;
    return 15 * 60;
  }, [currentMode, focoMinutes]);

  // Ações do Cronômetro
  const handleToggleTimer = () => {
    if (secondsRemaining <= 0) {
      handleSkipNext();
      return;
    }
    setIsRunning(prev => !prev);
  };

  const handleSelectMode = (mode: TimerMode) => {
    if (mode === currentMode) return;
    setCurrentMode(mode);
    setIsRunning(false);
    if (mode === 'foco') {
      setSecondsRemaining(focoMinutes * 60);
    } else if (mode === 'pausa_curta') {
      setSecondsRemaining(5 * 60);
    } else {
      setSecondsRemaining(15 * 60);
    }
  };

  const handleChangeFocoMinutes = (mins: number) => {
    setFocoMinutes(mins);
    if (currentMode === 'foco' && !isRunning) {
      setSecondsRemaining(mins * 60);
    }
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setShowResetConfirm(false);
    if (currentMode === 'foco') {
      setSecondsRemaining(focoMinutes * 60);
      setTotalFocusSeconds(0);
    } else if (currentMode === 'pausa_curta') {
      setSecondsRemaining(5 * 60);
    } else {
      setSecondsRemaining(15 * 60);
    }
  };

  const handleSkipNext = () => {
    setIsRunning(false);
    if (currentMode === 'foco') {
      const nextCycle = pomodoroCycle >= 4 ? 1 : pomodoroCycle + 1;
      const nextMode: TimerMode = pomodoroCycle >= 4 ? 'pausa_longa' : 'pausa_curta';
      setPomodoroCycle(nextCycle);
      setCurrentMode(nextMode);
      setSecondsRemaining(nextMode === 'pausa_longa' ? 15 * 60 : 5 * 60);
    } else {
      setCurrentMode('foco');
      setSecondsRemaining(focoMinutes * 60);
    }
  };

  const handleClose = () => {
    setIsRunning(false);
    setIsMinimized(false);
    onClose();
  };

  // Botão Retrátil "Parar e salvar"
  const handleStopAndSave = () => {
    setIsRunning(false);
    setIsMinimized(false);
    // Tempo líquido: se acumulou totalFocusSeconds usa ele;
    // se por acaso o usuário fez contagem regressiva parcial sem acumular, pega a diferença
    let elapsed = totalFocusSeconds;
    if (elapsed <= 0 && currentMode === 'foco') {
      const diff = (focoMinutes * 60) - secondsRemaining;
      if (diff > 0) elapsed = diff;
    }
    // Se o usuário clicou em Parar e Salvar logo no início sem rodar o timer,
    // concede ao menos 1 minuto (60s) para poder registrar normalmente
    if (elapsed <= 0) {
      elapsed = 60;
    }

    onStopAndSave(elapsed, focoMinutes);
  };

  // Formatação de tempo em HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Percentual para o anel de progresso circular
  const progressRatio = Math.max(0, Math.min(1, 1 - (secondsRemaining / (currentTotalSeconds || 1))));
  const circumference = 2 * Math.PI * 78;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const angleInRotated = 2 * Math.PI * progressRatio;
  const handleX = 90 + 78 * Math.cos(angleInRotated);
  const handleY = 90 + 78 * Math.sin(angleInRotated);

  if (!isOpen) return null;

  // Se minimizado: renderiza o widget flutuante
  if (isMinimized) {
    return (
      <FloatingTimerWidget
        onRestore={() => setIsMinimized(false)}
        formattedTime={formatTime(secondsRemaining)}
        isRunning={isRunning}
        onTogglePlay={() => handleToggleTimer()}
        themeToken={themeToken}
        currentMode={currentMode}
        progressRatio={progressRatio}
      />
    );
  }

  return (
    <div className="fixed inset-0 !mt-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={() => handleClose()}
      />

      {/* Caixa do Modal de Foco (Limpo, sem formulários) */}
      <div className="relative w-full max-w-[560px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div 
              className="w-10 h-10 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300"
              style={{
                backgroundColor: `${palette.primary}15`,
                borderColor: `${palette.primary}30`,
                color: palette.primary,
                boxShadow: isDarkMode ? `0 0 16px ${themeToken.subtleGlow}` : undefined,
              }}
            >
              <Target className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white tracking-tight leading-tight whitespace-nowrap">
                Cronômetro de Foco
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 font-normal truncate">
                {contextSubtitle || 'Mantenha o foco absoluto no seu bloco atual'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Ciclo Pomodoro */}
            <div 
              className="font-mono text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 font-semibold border transition-all duration-300 whitespace-nowrap shrink-0"
              style={{
                backgroundColor: `${palette.primary}15`,
                borderColor: `${palette.primary}30`,
                color: isDarkMode ? themeToken.lightText : palette.primary,
                boxShadow: isDarkMode ? `0 0 10px ${themeToken.subtleGlow}` : undefined,
              }}
            >
              <span 
                className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                style={{ 
                  backgroundColor: palette.primary,
                  boxShadow: `0 0 6px ${palette.primary}`,
                }} 
              />
              <span>{pomodoroCycle} de 4</span>
            </div>

            {/* Botão Minimizar */}
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Minimizar cronômetro"
              aria-label="Minimizar cronômetro"
            >
              <Minus className="w-5 h-5" />
            </button>

            {/* Botão Fechar */}
            <button
              type="button"
              onClick={() => handleClose()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Fechar janela"
              aria-label="Fechar janela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo Central do Cronômetro */}
        <div className="overflow-y-auto px-5 py-4 sm:px-6 sm:py-5 space-y-5 custom-scrollbar text-xs sm:text-sm">
          
          {/* Abas de Ciclo (Foco | Pausa curta | Pausa longa) */}
          <div className="bg-slate-100 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 p-1 rounded-xl grid grid-cols-3 gap-1 shadow-inner">
            <button
              type="button"
              onClick={() => handleSelectMode('foco')}
              className={`py-2 px-3 rounded-lg text-xs sm:text-sm transition-all text-center cursor-pointer ${
                currentMode === 'foco'
                  ? 'text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
              }`}
              style={currentMode === 'foco' ? {
                backgroundColor: palette.primary,
                boxShadow: isDarkMode ? `0 0 16px ${themeToken.subtleGlow}` : `0 2px 8px ${palette.primary}40`,
              } : undefined}
            >
              Foco
            </button>

            <button
              type="button"
              onClick={() => handleSelectMode('pausa_curta')}
              className={`py-2 px-3 rounded-lg text-xs sm:text-sm transition-all text-center cursor-pointer ${
                currentMode === 'pausa_curta'
                  ? 'text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
              }`}
              style={currentMode === 'pausa_curta' ? {
                backgroundColor: palette.primary,
                boxShadow: isDarkMode ? `0 0 16px ${themeToken.subtleGlow}` : `0 2px 8px ${palette.primary}40`,
              } : undefined}
            >
              Pausa curta
            </button>

            <button
              type="button"
              onClick={() => handleSelectMode('pausa_longa')}
              className={`py-2 px-3 rounded-lg text-xs sm:text-sm transition-all text-center cursor-pointer ${
                currentMode === 'pausa_longa'
                  ? 'text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
              }`}
              style={currentMode === 'pausa_longa' ? {
                backgroundColor: palette.primary,
                boxShadow: isDarkMode ? `0 0 16px ${themeToken.subtleGlow}` : `0 2px 8px ${palette.primary}40`,
              } : undefined}
            >
              Pausa longa
            </button>
          </div>

          {/* Display Central Neon / Card do Timer */}
          <div className="bg-slate-100/70 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 text-center relative overflow-hidden shadow-inner flex flex-col items-center">
            <div 
              className="absolute inset-0 pointer-events-none transition-all duration-500"
              style={{
                background: isDarkMode 
                  ? `radial-gradient(circle at center, ${themeToken.subtleGlow} 0%, transparent 70%)`
                  : `radial-gradient(circle at center, ${palette.primary}0a 0%, transparent 70%)`
              }} 
            />

            {/* Círculo SVG de Progresso */}
            <div className="relative w-52 h-52 sm:w-56 sm:h-56 flex items-center justify-center my-2">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 180 180">
                <circle
                  cx="90"
                  cy="90"
                  r="78"
                  className="stroke-slate-300 dark:stroke-slate-800/80"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="90"
                  cy="90"
                  r="78"
                  stroke={palette.primary}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-300"
                  style={{
                    filter: isDarkMode ? `drop-shadow(0 0 8px ${themeToken.glow})` : undefined,
                  }}
                />
                {progressRatio > 0 && (
                  <circle
                    cx={handleX}
                    cy={handleY}
                    r="5"
                    fill={isDarkMode ? "#ffffff" : palette.primary}
                    stroke={palette.primary}
                    strokeWidth="2.5"
                    className="transition-all duration-300"
                    style={{
                      filter: isDarkMode ? `drop-shadow(0 0 8px ${themeToken.glow})` : undefined,
                    }}
                  />
                )}
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span 
                  className="text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-1 transition-colors"
                  style={{ color: palette.primary }}
                >
                  {currentMode === 'foco' ? 'Tempo de Foco' : currentMode === 'pausa_curta' ? 'Pausa Curta' : 'Pausa Longa'}
                </span>

                <div 
                  className="text-4xl sm:text-5xl font-mono font-black tracking-widest select-none transition-all duration-300 text-white"
                  style={isDarkMode ? {
                    color: '#ffffff',
                    textShadow: `0 0 10px ${themeToken.glow}, 0 0 20px ${themeToken.glow}, 0 0 40px ${themeToken.glow}`,
                  } : {
                    color: '#FFFFFF',
                    filter: `drop-shadow(0 0 2px ${palette.primary}) drop-shadow(0 0 6px ${palette.primary}80)`,
                    textShadow: `0 0 1px ${palette.primary}, 0 0 4px ${palette.primary}aa`,
                  }}
                >
                  {formatTime(secondsRemaining)}
                </div>

                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <span 
                    className={`w-2 h-2 rounded-full transition-all ${
                      isRunning ? 'animate-ping' : ''
                    }`}
                    style={{ 
                      backgroundColor: isRunning ? palette.primary : '#64748b',
                      boxShadow: isRunning ? `0 0 6px ${palette.primary}` : undefined,
                    }} 
                  />
                  <span>{isRunning ? 'Em andamento' : secondsRemaining < currentTotalSeconds ? 'Pausado' : 'Pronto'}</span>
                </div>
              </div>
            </div>

            {/* Barra Linear de Meta */}
            <div className="w-full max-w-xs mx-auto space-y-1.5 mt-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <span>Meta: {currentMode === 'foco' ? `${focoMinutes} min` : currentMode === 'pausa_curta' ? '5 min' : '15 min'}</span>
                <span style={{ color: palette.primary }} className="font-bold">
                  {Math.round(progressRatio * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-300 dark:border-slate-700/60">
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.round(progressRatio * 100)}%`, 
                    backgroundColor: palette.primary,
                    boxShadow: isDarkMode ? `0 0 8px ${themeToken.glow}` : undefined,
                  }} 
                />
              </div>
            </div>

            {/* Controles Principais + Botão Stop Retrátil */}
            <div className="flex items-center justify-center gap-2.5 sm:gap-3 mt-4 w-full max-w-md">
              {/* Botão Reiniciar Bloco */}
              <button
                type="button"
                onClick={() => {
                  if (secondsRemaining < currentTotalSeconds || totalFocusSeconds > 0) {
                    setShowResetConfirm(true);
                  } else {
                    handleResetTimer();
                  }
                }}
                className="p-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-200 hover:bg-slate-300 dark:bg-slate-900/80 dark:hover:bg-slate-800 text-slate-700 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                title="Reiniciar tempo do bloco"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Botão Play / Pause */}
              <button
                type="button"
                onClick={() => handleToggleTimer()}
                className="flex-1 text-white font-semibold py-3 px-5 rounded-xl flex items-center justify-center gap-2 transition-all text-xs sm:text-sm active:scale-95 cursor-pointer shadow-md hover:opacity-95 whitespace-nowrap"
                style={{
                  backgroundColor: palette.primary,
                  boxShadow: `0 4px 14px ${palette.primary}40`,
                }}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 fill-current shrink-0" />
                    <span>Pausar</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current shrink-0" />
                    <span>{secondsRemaining < currentTotalSeconds ? 'Retomar' : currentMode === 'foco' ? 'Iniciar Foco' : 'Iniciar Pausa'}</span>
                  </>
                )}
              </button>

              {/* Botão Pular Bloco */}
              <button
                type="button"
                onClick={() => handleSkipNext()}
                className="p-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-200 hover:bg-slate-300 dark:bg-slate-900/80 dark:hover:bg-slate-800 text-slate-700 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                title="Pular para a próxima etapa"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {/* BOTÃO DE ENCERRAMENTO (STOP RETRÁTIL VERDE ESMERALDA) */}
              <button
                type="button"
                onClick={handleStopAndSave}
                className="group flex items-center bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white p-3 hover:px-4 rounded-full transition-all duration-300 shadow-md hover:shadow-emerald-500/40 cursor-pointer overflow-hidden shrink-0 border border-emerald-400/40"
                title="Parar e salvar"
                aria-label="Parar e salvar"
              >
                <Square className="w-4 h-4 fill-white shrink-0 transition-transform group-hover:scale-110" />
                <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 font-bold text-xs text-white">
                  Parar e salvar
                </span>
              </button>
            </div>

            {/* Confirmação de Zerar */}
            {showResetConfirm && (
              <div className="mt-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between w-full max-w-md animate-in fade-in">
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  Deseja reiniciar este bloco?
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleResetTimer()}
                    className="bg-amber-600 hover:bg-amber-500 text-white px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer"
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-md text-[11px] cursor-pointer"
                  >
                    Não
                  </button>
                </div>
              </div>
            )}

            {/* Seletor de Metas / Presets de Minutos de Foco */}
            {currentMode === 'foco' && !isRunning && (
              <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap sm:flex-nowrap whitespace-nowrap justify-center w-full">
                <span className="mr-0.5 font-semibold shrink-0">Meta de Foco:</span>
                {[25, 30, 45, 50, 60, 90].map(mins => {
                  const isSelected = focoMinutes === mins && customMinutesInput === '';
                  return (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        setCustomMinutesInput('');
                        handleChangeFocoMinutes(mins);
                      }}
                      className={`px-2 py-1 rounded-md border text-[11px] transition-all cursor-pointer font-medium shrink-0 whitespace-nowrap ${
                        isSelected 
                          ? 'text-white font-bold shadow-xs' 
                          : 'border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400 bg-white dark:bg-slate-900'
                      }`}
                      style={isSelected ? {
                        backgroundColor: palette.primary,
                        borderColor: palette.primary,
                      } : undefined}
                    >
                      {mins >= 60 ? `${Math.floor(mins / 60)}h${mins % 60 > 0 ? ` ${mins % 60}m` : ''}` : `${mins}m`}
                    </button>
                  );
                })}

                {/* Campo para tempo personalizado */}
                <div
                  className={`inline-flex items-center rounded-md border pl-2 pr-1 py-0.5 text-[11px] transition-all bg-white dark:bg-slate-900 shrink-0 whitespace-nowrap ${
                    customMinutesInput !== ''
                      ? 'font-bold shadow-xs'
                      : 'border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                  }`}
                  style={
                    customMinutesInput !== ''
                      ? {
                          borderColor: palette.primary,
                          boxShadow: `0 0 0 1px ${palette.primary}30`,
                        }
                      : undefined
                  }
                  title="Definir tempo personalizado em minutos"
                >
                  <input
                    type="number"
                    min={1}
                    max={480}
                    value={customMinutesInput}
                    placeholder="Outro"
                    aria-label="Tempo personalizado em minutos"
                    onChange={(e) => {
                      const raw = e.target.value;
                      setCustomMinutesInput(raw);
                      const parsed = parseInt(raw, 10);
                      if (!isNaN(parsed) && parsed > 0) {
                        const clamped = Math.min(480, Math.max(1, parsed));
                        handleChangeFocoMinutes(clamped);
                      }
                    }}
                    onBlur={() => {
                      const parsed = parseInt(customMinutesInput, 10);
                      if (isNaN(parsed) || parsed <= 0) {
                        setCustomMinutesInput('');
                      } else {
                        const clamped = Math.min(480, Math.max(1, parsed));
                        setCustomMinutesInput(String(clamped));
                        handleChangeFocoMinutes(clamped);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    className="w-9 bg-transparent text-center font-mono text-[11px] leading-none text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    style={
                      customMinutesInput !== ''
                        ? { color: isDarkMode ? '#ffffff' : palette.primary }
                        : undefined
                    }
                  />
                  <span
                    className="ml-0.5 mr-1 text-[10px] leading-none font-medium select-none text-slate-400 dark:text-slate-500"
                    style={
                      customMinutesInput !== ''
                        ? { color: palette.primary }
                        : undefined
                    }
                  >
                    min
                  </span>
                  <div className="flex flex-col items-center justify-center border-l border-slate-200 dark:border-slate-800 pl-0.5 -my-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        const currentVal = parseInt(customMinutesInput, 10);
                        const base = !isNaN(currentVal) && currentVal > 0 ? currentVal : focoMinutes;
                        const nextVal = Math.min(480, base + 1);
                        setCustomMinutesInput(String(nextVal));
                        handleChangeFocoMinutes(nextVal);
                      }}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer leading-none p-0.5"
                      title="Aumentar 1 minuto"
                      aria-label="Aumentar 1 minuto"
                    >
                      <ChevronUp className="w-2.5 h-2.5 stroke-[2.5]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const currentVal = parseInt(customMinutesInput, 10);
                        const base = !isNaN(currentVal) && currentVal > 0 ? currentVal : focoMinutes;
                        const nextVal = Math.max(1, base - 1);
                        setCustomMinutesInput(String(nextVal));
                        handleChangeFocoMinutes(nextVal);
                      }}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer leading-none p-0.5"
                      title="Diminuir 1 minuto"
                      aria-label="Diminuir 1 minuto"
                    >
                      <ChevronDown className="w-2.5 h-2.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Rodapé Informativo Limpo */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>Foco líquido atual: <strong className="text-slate-900 dark:text-white font-mono">{Math.floor(totalFocusSeconds / 60)}m {totalFocusSeconds % 60}s</strong></span>
          </div>

          <button
            type="button"
            onClick={handleStopAndSave}
            className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>Concluir sessão</span>
            <Square className="w-3.5 h-3.5 fill-current shrink-0" />
          </button>
        </div>

      </div>
    </div>
  );
};
