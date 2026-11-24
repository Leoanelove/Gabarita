import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Clock, 
  Play, 
  Edit2, 
  Trash2, 
  History, 
  MoreVertical, 
  X, 
  ArrowRight, 
  FileEdit, 
  Check, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { PlannedSession, Disciplina, Assunto, SessaoEstudo } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useStudyTimer } from '../../contexts/StudyTimerContext';
import { PlannerService } from '../../services/plannerService';
import { DatabaseService } from '../../services/db';
import { SubjectIcon } from '../common/SubjectIcon';
import { UltimosEstudosModal } from './UltimosEstudosModal';

interface SessionActionModalProps {
  session: PlannedSession | null;
  isOpen: boolean;
  onClose: () => void;
  disciplinas: Disciplina[];
  assuntos: Assunto[];
  sessoes?: SessaoEstudo[];
  onRescheduleSession: (sessionId: string, newDate: string, reason?: string) => Promise<void>;
  onOpenEditSession: (session: PlannedSession) => void;
  onDeleteSession: (sessionId: string) => Promise<void>;
  onUpdateSession?: (sessionId: string, partial: Partial<PlannedSession>) => Promise<void>;
  onNavigateTab?: (tab: any) => void;
  showFeedback?: (msg: string) => void;
}

export const SessionActionModal: React.FC<SessionActionModalProps> = ({
  session,
  isOpen,
  onClose,
  disciplinas,
  assuntos,
  sessoes = [],
  onRescheduleSession,
  onOpenEditSession,
  onDeleteSession,
  onUpdateSession,
  onNavigateTab,
  showFeedback,
}) => {
  const { palette } = useTheme();
  const { openStudyTimer, openStudyRegister } = useStudyTimer();

  // Estados locais do modal
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customPostponeDate, setCustomPostponeDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localHistorySessoes, setLocalHistorySessoes] = useState<SessaoEstudo[]>(sessoes);
  const [isRecentStudiesOpen, setIsRecentStudiesOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha o menu de opções ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Carrega / sincroniza o histórico de sessões se necessário
  useEffect(() => {
    if (isOpen && session) {
      const topics = PlannerService.getOrderedTopicsForDisciplina(
        session.disciplinaId,
        session.disciplinaName,
        assuntos,
        disciplinas
      );
      const matched = topics.find(t => t.id === session.assuntoId || (session.assuntoName && t.name.toLowerCase() === session.assuntoName.toLowerCase()));
      setSelectedTopicId(matched?.id || session.assuntoId || '');
      setIsEditingTopic(false);
      setShowDatePicker(false);
      setIsMenuOpen(false);
      setIsRecentStudiesOpen(false);

      // Define a data padrão para o seletor de adiar (+2 dias como sugestão rápida)
      const nextDay = PlannerService.parseLocalDate(session.date);
      nextDay.setDate(nextDay.getDate() + 2);
      setCustomPostponeDate(PlannerService.formatLocalDate(nextDay));

      if (sessoes && sessoes.length > 0) {
        setLocalHistorySessoes(sessoes);
      } else {
        DatabaseService.getSessoes()
          .then(setLocalHistorySessoes)
          .catch((err) => console.warn('Erro ao buscar histórico no modal de ação:', err));
      }
    }
  }, [isOpen, session, sessoes]);

  // Tópicos filtrados e ordenados rigorosamente pela ordem do edital verticalizado para a disciplina desta sessão
  const availableTopics = useMemo(() => {
    if (!isOpen || !session) return [];
    return PlannerService.getOrderedTopicsForDisciplina(
      session.disciplinaId,
      session.disciplinaName,
      assuntos,
      disciplinas
    );
  }, [isOpen, session, assuntos, disciplinas]);

  if (!isOpen || !session) return null;

  // Formatação de data completa por extenso
  const formatFullDateBR = (dateStr: string) => {
    try {
      const parsed = PlannerService.parseLocalDate(dateStr);
      const formatted = parsed.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch (e) {
      return dateStr;
    }
  };

  // Busca do histórico mais recente desta disciplina
  const lastStudySession = localHistorySessoes
    .filter(s => s.disciplinaId === session.disciplinaId)
    .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())[0] || null;

  // Cálculo de dias decorridos desde o último estudo
  const getDaysAgoText = (completedAtStr?: string) => {
    if (!completedAtStr) return '• primeira sessão desta matéria';
    try {
      const completedDate = new Date(completedAtStr);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - completedDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return '• estudado hoje';
      if (diffDays === 1) return '• há 1 dia';
      return `• há ${diffDays} dias`;
    } catch (e) {
      return '• primeira sessão desta matéria';
    }
  };

  // Ações de Início de Estudo
  const handleStartStudy = () => {
    onClose();
    openStudyTimer(session.disciplinaId, session.assuntoId, session.durationMinutes, 'cronometro');
  };

  // Ação de Registro Manual
  const handleOpenManualRegister = () => {
    setIsMenuOpen(false);
    onClose();
    openStudyRegister({
      modo: 'manual',
      disciplinaId: session.disciplinaId,
      assuntoId: session.assuntoId,
      durationMinutes: session.durationMinutes,
    });
  };

  // Salvar troca rápida de tópico
  const handleSaveTopicChange = async (newTopicId: string) => {
    const topicObj = availableTopics.find(t => t.id === newTopicId);
    const newTopicName = topicObj?.name || 'Tópico Selecionado';
    setSelectedTopicId(newTopicId);
    setIsEditingTopic(false);

    if (onUpdateSession) {
      await onUpdateSession(session.id, {
        assuntoId: newTopicId,
        assuntoName: newTopicName,
      });
      if (showFeedback) showFeedback(`Tópico alterado para "${newTopicName}"!`);
    }
  };

  // Adiar sessão (+X dias)
  const handlePostponeDays = async (daysToAdd: number) => {
    setIsSubmitting(true);
    try {
      const currentDate = PlannerService.parseLocalDate(session.date);
      currentDate.setDate(currentDate.getDate() + daysToAdd);
      const newDateStr = PlannerService.formatLocalDate(currentDate);

      await onRescheduleSession(session.id, newDateStr, 'Adiado pelo aluno');
      onClose();
      if (showFeedback) {
        showFeedback(daysToAdd === 1 ? 'Sessão adiada para amanhã com sucesso!' : `Estudo reagendado para ${newDateStr}!`);
      }
    } catch (error) {
      console.error('Erro ao adiar sessão:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirmar data personalizada de reagendamento
  const handleConfirmCustomDate = async () => {
    if (!customPostponeDate) return;
    setIsSubmitting(true);
    try {
      await onRescheduleSession(session.id, customPostponeDate, 'Reagendado pelo aluno');
      onClose();
      if (showFeedback) showFeedback(`Sessão reagendada para ${customPostponeDate}!`);
    } catch (error) {
      console.error('Erro ao reagendar sessão:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Caixa do Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        
        {/* CABEÇALHO */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              {formatFullDateBR(session.date)}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Grade semanal • {session.durationMinutes} min de meta
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Fechar"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CORPO DO MODAL */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar text-xs sm:text-sm">
          
          {/* 1. CARD PRINCIPAL DE DESTAQUE DA SESSÃO (BANNER TEMÁTICO) */}
          <div 
            className="relative overflow-hidden rounded-2xl border p-4 sm:p-5 space-y-4 shadow-xs transition-all"
            style={{
              backgroundColor: `${palette.primary}08`,
              borderColor: `${palette.primary}35`,
              background: `linear-gradient(135deg, ${palette.primary}12 0%, ${palette.primary}04 100%)`
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                {/* Ícone da Matéria */}
                <div className="shrink-0 pt-0.5">
                  <SubjectIcon subjectName={session.disciplinaName} />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  {/* Nome da Disciplina */}
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white truncate leading-snug">
                    {session.disciplinaName}
                  </h3>

                  {/* Tópico Selecionado & Edição Rápida */}
                  {isEditingTopic ? (
                    <div className="flex items-center gap-1.5 pt-1 animate-in fade-in duration-150">
                      <select
                        value={selectedTopicId}
                        onChange={(e) => handleSaveTopicChange(e.target.value)}
                        className="w-full p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2"
                      >
                        <option value="">Selecione o Tópico</option>
                        {availableTopics.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setIsEditingTopic(false)}
                        className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed group">
                      <span className="line-clamp-2">{session.assuntoName || 'Tópico Geral'}</span>
                      {availableTopics.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsEditingTopic(true)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                          title="Trocar tópico desta sessão"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Pílula de Duração (Apenas tempo - Sem pílulas de tipo TEORIA/REVISAO/QUESTOES) */}
                  <div className="pt-1.5 flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
                      <Clock className="w-3.5 h-3.5" style={{ color: palette.primary }} />
                      <span>{session.durationMinutes} min</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu de 3 Pontinhos */}
              <div className="relative shrink-0" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(prev => !prev)}
                  className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
                  title="Opções da sessão"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 top-10 w-52 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-20 animate-in fade-in zoom-in-95 text-xs">
                    <button
                      type="button"
                      onClick={handleOpenManualRegister}
                      className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2.5 cursor-pointer font-medium rounded-xl transition-colors"
                    >
                      <FileEdit className="w-4 h-4 text-emerald-500" />
                      <span>Registrar Manualmente</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Botão Primário: Iniciar Estudo */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleStartStudy}
                style={{ backgroundColor: palette.primary }}
                className="w-full py-3 px-5 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-md hover:brightness-110 active:scale-98 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current text-white" />
                <span> Iniciar estudo agora</span>
              </button>
            </div>
          </div>

          {/* 2. CARD DE CONTEXTO E HISTÓRICO RECENTE ("Último estudo desta matéria") */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 text-xs text-slate-700 dark:text-slate-300 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <History className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Último estudo desta disciplina</span>
                <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  {getDaysAgoText(lastStudySession?.completedAt || lastStudySession?.createdAt)}
                </span>
              </div>

              {/* Link Ver histórico -> Abre o modal suspenso UltimosEstudosModal sem mudar rota */}
              <button
                type="button"
                onClick={() => setIsRecentStudiesOpen(true)}
                className="text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Ver histórico</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="text-slate-600 dark:text-slate-400 font-medium pl-5">
              {lastStudySession ? (
                <p>
                  <strong className="text-slate-800 dark:text-slate-200 font-bold">
                    {lastStudySession.assuntoName || 'Tópico Estudado'}
                  </strong>
                  <span> ({lastStudySession.durationMinutes} min)</span>
                </p>
              ) : (
                <p className="text-slate-400 dark:text-slate-500 italic">
                  Primeira sessão desta matéria
                </p>
              )}
            </div>
          </div>

          {/* 3. BLOCO DE REAGENDAMENTO RÁPIDO ("Hoje não vai dar?") */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 space-y-3">
            <div>
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <Calendar className="w-4 h-4" style={{ color: palette.primary }} />
                <h4>Adiar Estudo?</h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Mova este estudo para outro dia sem perder o planejamento da sua grade.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              {/* Botão Adiar 1 dia */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handlePostponeDays(1)}
                className="flex-1 py-2.5 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <ArrowRight className="w-4 h-4 text-amber-500" />
                <span> Adiar 1 dia</span>
              </button>

              {/* Botão Escolher outro dia */}
              <button
                type="button"
                onClick={() => setShowDatePicker(prev => !prev)}
                className="flex-1 py-2.5 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Calendar className="w-4 h-4 transition-colors" style={{ color: palette.primary }} />
                <span>Escolher outro dia</span>
              </button>
            </div>

            {/* Seletor rápido de data ao clicar em Escolher outro dia */}
            {showDatePicker && (
              <div className="pt-2 flex items-center gap-2 animate-in fade-in duration-150 border-t border-slate-100 dark:border-slate-800 mt-2">
                <input
                  type="date"
                  value={customPostponeDate}
                  onChange={(e) => setCustomPostponeDate(e.target.value)}
                  className="flex-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2"
                />
                <button
                  type="button"
                  disabled={isSubmitting || !customPostponeDate}
                  onClick={handleConfirmCustomDate}
                  style={{ backgroundColor: palette.primary }}
                  className="py-2 px-3 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Confirmar</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RODAPÉ DO MODAL */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenEditSession(session);
              }}
              className="py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Editar Estudo</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                onClose();
                await onDeleteSession(session.id);
                if (showFeedback) showFeedback('Sessão removida com sucesso!');
              }}
              className="py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/70 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span> Excluir</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Modal Suspenso: Últimos Estudos da Disciplina */}
      <UltimosEstudosModal
        isOpen={isRecentStudiesOpen}
        onClose={() => setIsRecentStudiesOpen(false)}
        disciplinaId={session.disciplinaId}
        disciplinaNome={session.disciplinaName}
        concursoId={session.concursoId}
        sessoes={localHistorySessoes}
      />
    </div>
  );
};
