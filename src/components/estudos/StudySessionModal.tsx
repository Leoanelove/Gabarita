import React, { useState, useEffect } from 'react';
import { Disciplina, Assunto, StudySessionType, PageInterval, VideoaulaRecord } from '../../types';
import { StudyTimerModal, THEME_NEON_TOKENS, ThemeNeonToken } from './StudyTimerModal';
import { StudyRegisterModal } from './StudyRegisterModal';

export { StudyTimerModal, StudyRegisterModal, THEME_NEON_TOKENS };
export type { ThemeNeonToken };

export interface StudySessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  disciplinas: Disciplina[];
  assuntos: Assunto[];
  initialDisciplinaId?: string;
  initialAssuntoId?: string;
  initialDurationMinutes?: number;
  initialMode?: 'cronometro' | 'manual';
  onSaveSession: (session: {
    disciplinaId: string;
    assuntoId?: string;
    durationMinutes: number;
    plannedMinutes?: number;
    type: StudySessionType;
    questionsAttempted?: number;
    questionsCorrect?: number;
    notes?: string;
    teoriaFinalizada?: boolean;
    pageIntervals?: PageInterval[];
    videoaulas?: VideoaulaRecord[];
    completedAt?: string;
  }) => Promise<void>;
  onAdvanceCycle?: (minutesStudied?: number) => Promise<void>;
}

/**
 * StudySessionModal
 * Orquestrador sequencial modular de 2 fases:
 * - Fase 1: Cronômetro de Foco Pomodoro (StudyTimerModal)
 * - Fase 2: Registro de Estudo e Recursos (StudyRegisterModal)
 */
export const StudySessionModal: React.FC<StudySessionModalProps> = ({
  isOpen,
  onClose,
  disciplinas,
  assuntos,
  initialDisciplinaId,
  initialAssuntoId,
  initialDurationMinutes,
  initialMode = 'cronometro',
  onSaveSession,
  onAdvanceCycle,
}) => {
  const [activeStep, setActiveStep] = useState<'timer' | 'register'>('timer');
  const [currentModo, setCurrentModo] = useState<'cronometro' | 'manual'>('cronometro');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [savedMetaMinutes, setSavedMetaMinutes] = useState<number>(initialDurationMinutes || 25);

  // Define o fluxo inicial de acordo com o modo requisitado
  useEffect(() => {
    if (isOpen) {
      if (initialMode === 'manual') {
        setActiveStep('register');
        setCurrentModo('manual');
        setElapsedSeconds(0);
        setSavedMetaMinutes(initialDurationMinutes || 0);
      } else {
        setActiveStep('timer');
        setCurrentModo('cronometro');
        setElapsedSeconds(0);
        setSavedMetaMinutes(initialDurationMinutes || 25);
      }
    }
  }, [isOpen, initialDurationMinutes, initialMode]);

  // Transição da Fase 1 para a Fase 2 ao clicar no botão "Parar e salvar"
  const handleStopAndSave = (seconds: number, metaMinutes: number) => {
    setElapsedSeconds(seconds);
    setSavedMetaMinutes(metaMinutes);
    setCurrentModo('cronometro');
    setActiveStep('register');
  };

  // Permite retornar ao cronômetro se o usuário quiser continuar temporizando
  const handleBackToTimer = () => {
    setActiveStep('timer');
    setCurrentModo('cronometro');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* FASE 1: Cronômetro de Foco */}
      <StudyTimerModal
        isOpen={isOpen && activeStep === 'timer'}
        onClose={onClose}
        initialDurationMinutes={initialDurationMinutes}
        onStopAndSave={handleStopAndSave}
      />

      {/* FASE 2: Tela de Registro de Estudo */}
      <StudyRegisterModal
        isOpen={isOpen && activeStep === 'register'}
        onClose={onClose}
        modo={currentModo}
        disciplinas={disciplinas}
        assuntos={assuntos}
        initialDisciplinaId={initialDisciplinaId}
        initialAssuntoId={initialAssuntoId}
        elapsedSeconds={elapsedSeconds}
        plannedMinutes={savedMetaMinutes}
        onSaveSuccess={onSaveSession}
        onAdvanceCycle={onAdvanceCycle}
        onBackToTimer={currentModo === 'manual' ? undefined : handleBackToTimer}
      />
    </>
  );
};
