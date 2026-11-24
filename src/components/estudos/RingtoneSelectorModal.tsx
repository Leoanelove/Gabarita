import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Settings,
  Play,
  Square,
  Check,
  Music,
  X,
  BellOff,
  CheckCircle2,
  Volume2,
  Volume1,
  VolumeX,
  AlarmClock,
} from 'lucide-react';
import { useTimerAlarm } from '../../hooks/useTimerAlarm';
import { useTheme } from '../../contexts/ThemeContext';

interface SoundVolumeControlButtonProps {
  buttonClassName?: string;
  iconClassName?: string;
}

export const SoundVolumeControlButton: React.FC<SoundVolumeControlButtonProps> = ({
  buttonClassName,
  iconClassName,
}) => {
  const { palette, effectiveTheme } = useTheme();
  const isDarkMode = effectiveTheme === 'dark';
  const { isSoundOn, isMuted, volume, toggleSound, setVolume } = useTimerAlarm();
  const [isOpen, setIsOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  const effectiveVolume = isMuted ? 0 : volume;

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const popoverWidth = 256;
    const viewportWidth = window.innerWidth;
    let left = rect.right - popoverWidth;
    if (left < 12) left = 12;
    if (left + popoverWidth > viewportWidth - 12) {
      left = Math.max(12, viewportWidth - popoverWidth - 12);
    }
    const top = Math.min(window.innerHeight - 160, rect.bottom + 8);
    setPopoverPos({ top, left });
  }, []);

  const clearCloseTimer = () => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    clearCloseTimer();
    updatePosition();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    clearCloseTimer();
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 220);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearCloseTimer();
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      toggleSound();
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleResizeOrScroll = () => updatePosition();

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  const renderVolumeIcon = () => {
    const baseIconClass = iconClassName || 'w-4 h-4';
    if (isMuted || volume === 0) {
      return <VolumeX className={`${baseIconClass} text-slate-400`} />;
    }
    if (volume <= 50) {
      return <Volume1 className={baseIconClass} style={{ color: palette.primary }} />;
    }
    return <Volume2 className={baseIconClass} style={{ color: palette.primary }} />;
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={handleButtonClick}
        title={
          isSoundOn
            ? `Som ativo (${volume}%) — clique ou ajuste o volume`
            : 'Som silenciado — clique para ativar ou ajuste o volume'
        }
        aria-label={isSoundOn ? 'Controle de volume e som' : 'Ativar alerta sonoro'}
        className={
          buttonClassName ||
          'p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0'
        }
      >
        {renderVolumeIcon()}
      </button>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => e.stopPropagation()}
            style={{
              top: `${popoverPos.top}px`,
              left: `${popoverPos.left}px`,
              backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
              boxShadow: isDarkMode
                ? `0 20px 45px rgba(0, 0, 0, 0.9), 0 0 18px ${palette.primary}25`
                : '0 20px 45px rgba(15, 23, 42, 0.18)',
            }}
            className={`volume-popover fixed z-[9999] w-64 rounded-2xl border p-3.5 shadow-2xl opacity-100 animate-in fade-in zoom-in-95 duration-150 select-none ${
              isDarkMode
                ? 'bg-[#0f172a] border-slate-800 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <span
                className={`text-xs font-bold tracking-tight ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                Som do Alarme
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSound();
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  isMuted || volume === 0
                    ? 'bg-rose-500/15 text-rose-500 dark:text-rose-400 border-rose-500/35 hover:bg-rose-500/25'
                    : ''
                }`}
                style={
                  !(isMuted || volume === 0)
                    ? {
                        backgroundColor: isDarkMode ? `${palette.primary}26` : `${palette.primary}18`,
                        borderColor: `${palette.primary}55`,
                        color: palette.primary,
                      }
                    : undefined
                }
              >
                {isMuted || volume === 0 ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>Mudo (Ativar)</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Som Ativo</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSound();
                }}
                className={`p-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                  isDarkMode
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={isMuted || volume === 0 ? 'Ativar som' : 'Silenciar (Mudo)'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                ) : volume <= 50 ? (
                  <Volume1 className="w-4 h-4" style={{ color: palette.primary }} />
                ) : (
                  <Volume2 className="w-4 h-4" style={{ color: palette.primary }} />
                )}
              </button>

              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={effectiveVolume}
                aria-label="Volume do alarme"
                onChange={(e) => setVolume(Number(e.target.value))}
                style={{ accentColor: palette.primary }}
                className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                  isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                }`}
              />

              <span
                className="w-10 text-right font-mono text-xs font-bold shrink-0"
                style={{ color: palette.primary }}
              >
                {effectiveVolume}%
              </span>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

interface RingtoneSelectorButtonProps {
  buttonClassName?: string;
  iconClassName?: string;
}

export const RingtoneSelectorButton: React.FC<RingtoneSelectorButtonProps> = ({
  buttonClassName,
  iconClassName,
}) => {
  const { palette, effectiveTheme } = useTheme();
  const isDarkMode = effectiveTheme === 'dark';
  const {
    selectedRingtoneId,
    selectRingtone,
    previewingId,
    togglePreview,
    stopPreview,
    ringtones,
  } = useTimerAlarm();

  const [isOpen, setIsOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const popoverWidth = Math.min(320, window.innerWidth - 24);
    const viewportWidth = window.innerWidth;
    let left = rect.right - popoverWidth;
    if (left < 12) left = 12;
    if (left + popoverWidth > viewportWidth - 12) {
      left = Math.max(12, viewportWidth - popoverWidth - 12);
    }
    const top = Math.min(window.innerHeight - 340, Math.max(12, rect.bottom + 8));
    setPopoverPos({ top, left });
  }, []);

  const handleClose = useCallback(() => {
    stopPreview();
    setIsOpen(false);
  }, [stopPreview]);

  const handleToggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      handleClose();
    } else {
      updatePosition();
      setIsOpen(true);
    }
  };

  // Fecha e para a pré-visualização ao clicar fora
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        stopPreview();
        setIsOpen(false);
      }
    };

    const handleResizeOrScroll = () => updatePosition();

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
    };
  }, [isOpen, stopPreview, updatePosition]);

  // Para qualquer pré-visualização ao desmontar
  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, [stopPreview]);

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggleOpen}
        title="Escolher toque do alarme (Toque 01 a 11)"
        aria-label="Configurar toque do alarme"
        className={
          buttonClassName ||
          'p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0'
        }
      >
        <Settings
          style={{ color: palette.primary }}
          className={
            iconClassName ||
            `w-4 h-4 transition-transform duration-300 ${
              isOpen ? 'rotate-90' : ''
            }`
          }
        />
      </button>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            onClick={(e) => e.stopPropagation()}
            className={`ringtone-popover fixed z-[9999] w-72 sm:w-80 rounded-2xl border shadow-2xl opacity-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
              isDarkMode
                ? 'bg-[#0f172a] border-slate-800 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
            style={{
              top: `${popoverPos.top}px`,
              left: `${popoverPos.left}px`,
              backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
              boxShadow: isDarkMode
                ? `0 20px 50px rgba(0, 0, 0, 0.92), 0 0 24px ${palette.primary}25`
                : '0 20px 50px rgba(15, 23, 42, 0.18)',
            }}
          >
            {/* Cabeçalho do Seletor */}
            <div
              className={`flex items-center justify-between px-4 py-3 border-b ${
                isDarkMode
                  ? 'border-slate-800 bg-[#0f172a]'
                  : 'border-slate-100 bg-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg border flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: isDarkMode ? `${palette.primary}26` : `${palette.primary}1a`,
                    borderColor: `${palette.primary}45`,
                    color: palette.primary,
                  }}
                >
                  <Music className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <h3
                    className={`text-xs font-bold leading-tight ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Toque do Alarme
                  </h3>
                  <p
                    className={`text-[10px] leading-tight mt-0.5 ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Escolha e ouça uma prévia
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                  isDarkMode
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
                title="Fechar seleção de toques"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Lista dos 11 Toques */}
            <div
              className={`max-h-64 overflow-y-auto space-y-1.5 p-2 scrollbar-thin scrollbar-track-transparent ${
                isDarkMode
                  ? 'bg-[#0f172a] scrollbar-thumb-slate-700'
                  : 'bg-white scrollbar-thumb-slate-300'
              }`}
            >
              {ringtones.map((ringtone) => {
                const isSelected = ringtone.id === selectedRingtoneId;
                const isPlayingThis = previewingId === ringtone.id;

                return (
                  <div
                    key={ringtone.id}
                    onClick={() => {
                      selectRingtone(ringtone.id);
                      togglePreview(ringtone.id);
                    }}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all text-xs border ${
                      isSelected
                        ? isDarkMode
                          ? 'text-white font-bold'
                          : 'text-slate-900 font-bold'
                        : isDarkMode
                        ? 'bg-slate-900/70 hover:bg-slate-800/80 border-slate-800/90 text-slate-200 font-medium'
                        : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200/80 text-slate-700 font-medium'
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: isDarkMode
                              ? `${palette.primary}26`
                              : `${palette.primary}1a`,
                            borderColor: palette.primary,
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center border transition-colors shrink-0 ${
                          isSelected
                            ? 'text-white'
                            : isDarkMode
                            ? 'border-slate-600 bg-slate-900'
                            : 'border-slate-300 bg-white'
                        }`}
                        style={
                          isSelected
                            ? {
                                backgroundColor: palette.primary,
                                borderColor: palette.primary,
                              }
                            : undefined
                        }
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3] text-white" />}
                      </span>
                      <span className="truncate">{ringtone.name}</span>
                      {ringtone.id === 'toque-01' && (
                        <span
                          className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold ${
                            isDarkMode
                              ? 'bg-slate-800 text-slate-300'
                              : 'bg-slate-200/80 text-slate-600'
                          }`}
                        >
                          Padrão
                        </span>
                      )}
                    </div>

                    {/* Botão Play / Stop de Pré-visualização */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePreview(ringtone.id);
                      }}
                      title={isPlayingThis ? 'Parar pré-visualização' : `Ouvir ${ringtone.name}`}
                      className={`px-2.5 py-1 rounded-lg flex items-center gap-1 text-[11px] font-bold transition-all cursor-pointer shrink-0 border ${
                        isPlayingThis
                          ? ''
                          : isDarkMode
                          ? 'bg-slate-800/90 hover:bg-slate-700 border-slate-700'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                      style={
                        isPlayingThis
                          ? {
                              backgroundColor: isDarkMode
                                ? `${palette.primary}2e`
                                : `${palette.primary}1a`,
                              borderColor: palette.primary,
                              color: palette.primary,
                            }
                          : {
                              color: palette.primary,
                            }
                      }
                    >
                      {isPlayingThis ? (
                        <>
                          <Square className="w-3 h-3 fill-current" />
                          <span>Parar</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>Ouvir</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

interface ActiveAlarmAlertBannerProps {
  title?: string;
  subtitle?: string;
  onStopAlarm: () => void;
  onSaveAndFinish?: () => void;
  saveLabel?: string;
}

export const ActiveAlarmAlertBanner: React.FC<ActiveAlarmAlertBannerProps> = ({
  title = 'Tempo Finalizado!',
  subtitle = 'Parabéns! Seu tempo de foco foi concluído.',
  onStopAlarm,
  onSaveAndFinish,
  saveLabel = 'Concluir e Salvar',
}) => {
  return (
    <div
      role="alert"
      className="alarm-alert-banner w-full rounded-2xl border-2 border-[#10b981] bg-[#0b1120] px-5 py-5 sm:px-6 sm:py-6 text-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-2"
      style={{
        backgroundColor: '#0b1120',
        borderColor: '#10b981',
        boxShadow: '0 0 28px rgba(16, 185, 129, 0.35), inset 0 0 16px rgba(16, 185, 129, 0.12)',
      }}
    >
      <div className="flex flex-col items-center justify-center gap-5 w-full">
        <div className="flex items-center justify-center gap-4 w-full max-w-md">
          <div
            className="alarm-alert-icon-box w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#064e3b]/55 border border-emerald-500/25 flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'rgba(6, 78, 59, 0.55)',
              borderColor: 'rgba(16, 185, 129, 0.25)',
            }}
          >
            <AlarmClock className="alarm-alert-icon w-7 h-7 sm:w-8 sm:h-8 text-[#10b981]" style={{ color: '#10b981' }} />
          </div>
          <div className="text-left">
            <h4
              className="alarm-alert-title text-xl sm:text-2xl font-black text-white tracking-tight leading-tight"
              style={{ color: '#ffffff' }}
            >
              {title}
            </h4>
            <p
              className="alarm-alert-subtitle text-xs sm:text-sm text-slate-200 font-medium mt-1"
              style={{ color: '#e2e8f0' }}
            >
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-3 w-full max-w-md mx-auto">
          <button
            type="button"
            onClick={onStopAlarm}
            className="alarm-alert-btn-stop flex-1 min-w-[165px] py-2.5 px-4 rounded-xl bg-[#881337] hover:bg-[#9f1239] border border-rose-500/35 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
            style={{
              backgroundColor: '#881337',
              borderColor: 'rgba(244, 63, 94, 0.35)',
              color: '#ffffff',
            }}
          >
            <BellOff className="w-4 h-4 shrink-0 text-white" style={{ color: '#ffffff' }} />
            <span className="text-white" style={{ color: '#ffffff' }}>Desativar Alarme</span>
          </button>

          {onSaveAndFinish && (
            <button
              type="button"
              onClick={() => {
                onStopAlarm();
                onSaveAndFinish();
              }}
              className="alarm-alert-btn-save flex-1 min-w-[190px] py-2.5 px-4 rounded-xl bg-[#059669] hover:bg-[#10b981] border border-emerald-400/35 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
              style={{
                backgroundColor: '#059669',
                borderColor: 'rgba(52, 211, 153, 0.35)',
                color: '#ffffff',
              }}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-white" style={{ color: '#ffffff' }} />
              <span className="text-white" style={{ color: '#ffffff' }}>{saveLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
