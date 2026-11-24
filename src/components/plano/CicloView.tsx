import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  RotateCcw, 
  Play, 
  CheckCircle2, 
  Clock, 
  Check, 
  Trash2,
  AlertTriangle,
  Edit3,
  Calendar,
  MoreVertical,
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  Sliders,
  Scale,
  BookOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { StudyCycle, CycleBlock, Disciplina, Assunto, StudyMethod, Concurso } from '../../types';
import { Button } from '../../design-system/Button';
import { Modal } from '../../design-system/Modal';
import { DatabaseService } from '../../services/db';
import { CriarCicloModal } from './CriarCicloModal';
import { useTheme } from '../../contexts/ThemeContext';
import { SubjectIcon } from '../common/SubjectIcon';

const PLAY_THEME_CONFIG: Record<string, { bg: string; hover: string; text: string; border: string; glow: string }> = {
  verde: {
    bg: 'bg-emerald-600',
    hover: 'hover:bg-emerald-500',
    text: 'text-white',
    border: 'border-emerald-500/40',
    glow: 'shadow-emerald-950/20',
  },
  azul: {
    bg: 'bg-blue-600',
    hover: 'hover:bg-blue-500',
    text: 'text-white',
    border: 'border-blue-500/40',
    glow: 'shadow-blue-950/20',
  },
  rosa: {
    bg: 'bg-pink-600',
    hover: 'hover:bg-pink-500',
    text: 'text-white',
    border: 'border-pink-500/40',
    glow: 'shadow-pink-950/20',
  },
  roxo: {
    bg: 'bg-purple-600',
    hover: 'hover:bg-purple-500',
    text: 'text-white',
    border: 'border-purple-500/40',
    glow: 'shadow-purple-950/20',
  },
  laranja: {
    bg: 'bg-orange-600',
    hover: 'hover:bg-orange-500',
    text: 'text-white',
    border: 'border-orange-500/40',
    glow: 'shadow-orange-950/20',
  },
};

interface CicloViewProps {
  cycle: StudyCycle;
  disciplinas: Disciplina[];
  assuntos?: Assunto[];
  activeConcursoId?: string;
  concursos?: Concurso[];
  onAdvanceCycle: (minutesStudied?: number) => Promise<void>;
  onRewindCycle: () => Promise<void>;
  onRecordCycleProgress: (additionalMinutes: number) => Promise<void>;
  onResetCycleLap: () => Promise<void>;
  onUpdateCycleBlock: (blockId: string, partial: Partial<CycleBlock>) => Promise<void>;
  onOpenStudyTimer: (disciplinaId?: string, assuntoId?: string, durationMinutes?: number | string) => void;
  onSaveNewCycle?: (newCycle: StudyCycle) => Promise<void>;
  onSwitchMethod?: (method: StudyMethod) => Promise<void> | void;
  onRemoveCycle?: () => Promise<void>;
  onReplan?: () => void;
}

export const CicloView: React.FC<CicloViewProps> = ({
  cycle,
  disciplinas,
  assuntos = [],
  activeConcursoId,
  concursos = [],
  onAdvanceCycle,
  onRewindCycle,
  onRecordCycleProgress,
  onResetCycleLap,
  onUpdateCycleBlock,
  onOpenStudyTimer,
  onSaveNewCycle,
  onSwitchMethod,
  onRemoveCycle,
  onReplan,
}) => {
  // Função auxiliar para carregar ciclo específico do concurso ativo no localStorage
  const getStoredCycleForActiveConcurso = (): StudyCycle => {
    // 1. Se a prop cycle já possui blocos válidos estritamente para o concurso ativo, use-a
    if (cycle && cycle.blocks && cycle.blocks.length > 0 && (!activeConcursoId || cycle.concursoId === activeConcursoId)) {
      return cycle;
    }

    // 2. Tenta leitura síncrona do localStorage para o activeConcursoId
    if (activeConcursoId) {
      try {
        const raw = localStorage.getItem(`gabarita_ciclo_estudos_${activeConcursoId}`) ||
                    localStorage.getItem(`gabarita_ciclo_${activeConcursoId}`) ||
                    localStorage.getItem(`gabarita_study_cycle_${activeConcursoId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.blocks) && parsed.blocks.length > 0 && (!parsed.concursoId || parsed.concursoId === activeConcursoId)) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Erro ao ler ciclo do concurso ativo no localStorage:', e);
      }
    }

    // 3. Se a prop cycle é do concurso ativo mesmo vazia
    if (cycle && (!activeConcursoId || cycle.concursoId === activeConcursoId)) {
      return cycle;
    }

    // 4. Retorna ciclo vazio estritamente isolado para o concurso ativo - JAMAIS dados de outro concurso
    return {
      id: `cycle_${activeConcursoId || 'empty'}`,
      userId: 'user',
      concursoId: activeConcursoId || '',
      concursoTitle: '',
      currentBlockIndex: 0,
      completedCyclesCount: 0,
      totalCycleMinutes: 0,
      blocks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const [activeCycle, setActiveCycle] = useState<StudyCycle>(getStoredCycleForActiveConcurso);
  const [internalAssuntos, setInternalAssuntos] = useState<Assunto[]>(assuntos);

  // Tema ativo e tokens de cor para ações dinâmicas
  const { colorSkin, palette } = useTheme();
  const normalizedSkin = 
    (colorSkin === 'purple' ? 'roxo' : colorSkin === 'orange' || colorSkin === 'dbz' ? 'laranja' : colorSkin) || 'verde';
  const themeCfg = PLAY_THEME_CONFIG[normalizedSkin] || PLAY_THEME_CONFIG.verde;

  // Leitura reativa ao montar ou sempre que activeConcursoId mudar
  useEffect(() => {
    if (!activeConcursoId) return;

    try {
      const raw = localStorage.getItem(`gabarita_ciclo_estudos_${activeConcursoId}`) ||
                  localStorage.getItem(`gabarita_ciclo_${activeConcursoId}`) ||
                  localStorage.getItem(`gabarita_study_cycle_${activeConcursoId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.blocks) && parsed.blocks.length > 0 && (!parsed.concursoId || parsed.concursoId === activeConcursoId)) {
          setActiveCycle(parsed);
          return;
        }
      }
      if (cycle && cycle.blocks && cycle.blocks.length > 0 && cycle.concursoId === activeConcursoId) {
        setActiveCycle(cycle);
        return;
      }
      // Se não há ciclo configurado para o concurso ativo, mantém o estado limpo
      setActiveCycle({
        id: `cycle_${activeConcursoId}`,
        userId: 'user',
        concursoId: activeConcursoId,
        concursoTitle: '',
        currentBlockIndex: 0,
        completedCyclesCount: 0,
        totalCycleMinutes: 0,
        blocks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Erro na leitura reativa do ciclo:', e);
    }
  }, [activeConcursoId]);

  // Sincroniza instantaneamente quando a prop cycle externa for atualizada (apenas se for do concurso ativo)
  useEffect(() => {
    if (cycle) {
      if (!activeConcursoId || cycle.concursoId === activeConcursoId) {
        setActiveCycle(cycle);
      }
    }
  }, [cycle, activeConcursoId]);

  // Listener global para sincronização reativa imediata de ciclos gerados
  useEffect(() => {
    const handleGlobalCycleUpdated = (e: Event) => {
      const customEvt = e as CustomEvent<StudyCycle>;
      if (customEvt.detail && (!activeConcursoId || customEvt.detail.concursoId === activeConcursoId)) {
        setActiveCycle(customEvt.detail);
      }
    };
    window.addEventListener('gabarita_cycle_updated', handleGlobalCycleUpdated);
    return () => {
      window.removeEventListener('gabarita_cycle_updated', handleGlobalCycleUpdated);
    };
  }, [activeConcursoId]);

  useEffect(() => {
    if (assuntos && assuntos.length > 0) {
      setInternalAssuntos(assuntos);
    }
  }, [assuntos]);

  // Modais de Controle
  const [isResetLapModalOpen, setIsResetLapModalOpen] = useState(false);
  const [isRemoveCycleModalOpen, setIsRemoveCycleModalOpen] = useState(false);
  const [isEditBlockModalOpen, setIsEditBlockModalOpen] = useState(false);
  const [isCreateCycleModalOpen, setIsCreateCycleModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(true);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  const [selectedBlock, setSelectedBlock] = useState<CycleBlock | null>(null);
  const [editDuration, setEditDuration] = useState(60);
  const [editTopicName, setEditTopicName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Fechar menu de ações contextuais ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setIsActionsMenuOpen(false);
      }
    };
    if (isActionsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isActionsMenuOpen]);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  const hasBlocks = Boolean(activeCycle && Array.isArray(activeCycle.blocks) && activeCycle.blocks.length > 0);
  const currentBlockIndex = activeCycle?.currentBlockIndex || 0;

  // Separação Reativa dos Blocos: Pendentes (a concluir) vs Concluídos
  const { pendingBlocks, completedBlocks } = useMemo(() => {
    if (!activeCycle || !Array.isArray(activeCycle.blocks)) {
      return { pendingBlocks: [], completedBlocks: [] };
    }

    const pending: Array<{ block: CycleBlock; originalIndex: number; percent: number }> = [];
    const completed: Array<{ block: CycleBlock; originalIndex: number; percent: number }> = [];

    activeCycle.blocks.forEach((block, idx) => {
      const elapsed = block.elapsedMinutes || 0;
      const calculatedPercent =
        typeof block.progressPercent === 'number'
          ? Math.min(100, Math.round(block.progressPercent))
          : block.durationMinutes > 0 && elapsed > 0
          ? Math.min(100, Math.round((elapsed / block.durationMinutes) * 100))
          : 0;

      // Critério de conclusão: status 'concluido', flag completed, progresso >= 100% ou índice anterior ao ponteiro atual da volta
      const isDone = Boolean(
        block.completed === true ||
        block.status === 'concluido' ||
        calculatedPercent >= 100 ||
        idx < (activeCycle.currentBlockIndex || 0)
      );

      if (isDone) {
        completed.push({ block, originalIndex: idx, percent: 100 });
      } else {
        pending.push({ block, originalIndex: idx, percent: calculatedPercent });
      }
    });

    return { pendingBlocks: pending, completedBlocks: completed };
  }, [activeCycle]);

  const currentBlock = useMemo(() => {
    if (!hasBlocks) return null;
    if (pendingBlocks.length > 0) {
      const activeMatch = pendingBlocks.find(item => item.originalIndex === currentBlockIndex);
      return activeMatch ? activeMatch.block : pendingBlocks[0].block;
    }
    return activeCycle.blocks[currentBlockIndex] || activeCycle.blocks[0] || null;
  }, [hasBlocks, activeCycle, currentBlockIndex, pendingBlocks]);

  // Cálculos de Métricas
  const totalBlocks = hasBlocks ? activeCycle.blocks.length : 0;
  const completedBlocksCount = completedBlocks.length;
  const progressPercent = totalBlocks > 0 
    ? Math.round((completedBlocksCount / totalBlocks) * 100) 
    : 0;

  // Tempo total planejado do ciclo
  const totalPlannedMinutes = hasBlocks 
    ? activeCycle.blocks.reduce((acc, b) => acc + (b.durationMinutes || 0), 0) 
    : 0;

  // Tempo total estudado (acumulado nos blocos + voltas já concluídas)
  const totalElapsedInCurrentLap = hasBlocks
    ? activeCycle.blocks.reduce((acc, b, idx) => {
        const isBlockDone =
          b.completed === true ||
          b.status === 'concluido' ||
          (typeof b.progressPercent === 'number' && b.progressPercent >= 100) ||
          idx < (activeCycle.currentBlockIndex || 0);
        return acc + (b.elapsedMinutes || (isBlockDone ? b.durationMinutes : 0));
      }, 0)
    : 0;
  const totalAccumulatedMinutes = totalElapsedInCurrentLap + ((activeCycle?.completedCyclesCount || 0) * totalPlannedMinutes);

  const formatHoursAndMins = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}h ${String(mins).padStart(2, '0')}min`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
    if (hours > 0) return `${hours}h`;
    return `${mins}min`;
  };

  // Horário sugerido formatado para o próximo bloco
  const suggestedTime = useMemo(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(Math.floor(now.getMinutes() / 15) * 15).padStart(2, '0');
    return `${hours}:${mins}`;
  }, []);

  // Lista de blocos pendentes a serem exibidos (com opção de ver mais se > 8)
  const displayPendingBlocks = useMemo(() => {
    if (isExpanded || pendingBlocks.length <= 8) {
      return pendingBlocks;
    }
    return pendingBlocks.slice(0, 8);
  }, [pendingBlocks, isExpanded]);

  // Ação: Concluir bloco individual
  const handleCompleteBlock = async (blockId: string, durationMinutes: number) => {
    await onUpdateCycleBlock(blockId, { status: 'concluido' });
    await onAdvanceCycle(durationMinutes);
    const updated = await DatabaseService.getStudyCycle(activeConcursoId);
    setActiveCycle(updated);
    showFeedback('Bloco concluído com sucesso!');
  };

  // Ação: Abrir modal de edição de bloco
  const handleOpenEditBlock = (block: CycleBlock) => {
    setSelectedBlock(block);
    setEditDuration(block.durationMinutes);
    setEditTopicName(block.assuntoSugeridoName || '');
    setIsEditBlockModalOpen(true);
  };

  const handleSaveBlockEdit = async () => {
    if (!selectedBlock) return;
    setIsSubmitting(true);
    try {
      await onUpdateCycleBlock(selectedBlock.id, {
        durationMinutes: Number(editDuration),
        assuntoSugeridoName: editTopicName.trim() || undefined,
      });

      setActiveCycle(prev => ({
        ...prev,
        blocks: prev.blocks.map(b => b.id === selectedBlock.id ? {
          ...b,
          durationMinutes: Number(editDuration),
          assuntoSugeridoName: editTopicName.trim() || undefined,
        } : b),
        totalCycleMinutes: prev.blocks.reduce((acc, b) => acc + (b.id === selectedBlock.id ? Number(editDuration) : b.durationMinutes), 0)
      }));

      setIsEditBlockModalOpen(false);
      showFeedback('Bloco atualizado com sucesso!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ação: Mover bloco no modal de reordenação
  const handleMoveBlock = async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= activeCycle.blocks.length) return;
    const newBlocks = [...activeCycle.blocks];
    const [moved] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, moved);

    const updatedCycle: StudyCycle = {
      ...activeCycle,
      blocks: newBlocks,
      updatedAt: new Date().toISOString(),
    };

    setActiveCycle(updatedCycle);
    await DatabaseService.saveStudyCycle(updatedCycle);
    if (onSaveNewCycle) {
      await onSaveNewCycle(updatedCycle);
    }
    showFeedback('Sequência do ciclo reordenada!');
  };

  // Ação: Recomeçar Ciclo
  const handleConfirmResetCycle = async () => {
    setIsSubmitting(true);
    try {
      const reset = await DatabaseService.resetStudyCycle(false);
      setActiveCycle(reset);
      setIsResetLapModalOpen(false);
      setIsActionsMenuOpen(false);
      showFeedback('Ciclo reiniciado com sucesso! Ponteiro reposicionado no Bloco 1.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ação: Remover Ciclo
  const handleConfirmRemoveCycle = async () => {
    setIsSubmitting(true);
    try {
      const targetCid = activeConcursoId || activeCycle?.concursoId;
      if (targetCid) {
        try {
          localStorage.removeItem(`gabarita_ciclo_estudos_${targetCid}`);
          localStorage.removeItem(`gabarita_ciclo_${targetCid}`);
          localStorage.removeItem(`gabarita_study_cycle_${targetCid}`);
        } catch (e) {
          console.warn('Erro ao limpar localStorage do ciclo:', e);
        }
      }

      const cleared = await DatabaseService.removeStudyCycle();

      const emptyCycle: StudyCycle = {
        ...cleared,
        blocks: [],
        currentBlockIndex: 0,
        completedCyclesCount: 0,
        totalCycleMinutes: 0,
        concursoId: targetCid,
        updatedAt: new Date().toISOString(),
      };

      setActiveCycle(emptyCycle);

      if (onRemoveCycle) {
        await onRemoveCycle();
      }
      if (onSaveNewCycle) {
        await onSaveNewCycle(emptyCycle);
      }

      window.dispatchEvent(new CustomEvent('gabarita_cycle_updated', { detail: emptyCycle }));

      setIsRemoveCycleModalOpen(false);
      setIsActionsMenuOpen(false);
      showFeedback('Ciclo de estudos excluído com sucesso.');
    } catch (err) {
      console.error('Erro ao excluir ciclo:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCycleCreated = async (newCycle: StudyCycle) => {
    setActiveCycle(newCycle);
    if (onSaveNewCycle) {
      await onSaveNewCycle(newCycle);
    }
    showFeedback('Novo Ciclo de Estudos gerado e ativo com sucesso!');
  };

  // =========================================================================
  // ESTADO VAZIO: Nenhum ciclo configurado para o concurso ativo
  // =========================================================================
  if (!hasBlocks) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {feedback && (
          <div className="p-3.5 rounded-xl text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-in fade-in flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Migalha de pão no estado vazio */}
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
          <span>Plano de Estudos</span>
          <span>&gt;</span>
          <span className="text-slate-800 dark:text-slate-200 font-semibold">Ciclo de Estudos</span>
        </div>

        <div className="p-12 sm:p-16 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm text-center max-w-xl mx-auto my-8 space-y-5">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border"
            style={{
              backgroundColor: `${palette.primary}18`,
              borderColor: `${palette.primary}40`,
              color: palette.primary,
            }}
          >
            <RotateCcw className="w-8 h-8 opacity-80" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Nenhum ciclo criado
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Crie seu primeiro ciclo e organize seus estudos do seu jeito.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setIsCreateCycleModalOpen(true)}
              style={{ backgroundColor: palette.primary }}
              className="text-white rounded-lg px-6 py-2.5 font-semibold inline-flex items-center gap-2 cursor-pointer shadow-md hover:brightness-110 active:scale-95 transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Criar novo ciclo</span>
            </button>
          </div>
        </div>

        {/* Modal: Criar Novo Ciclo */}
        <CriarCicloModal
          isOpen={isCreateCycleModalOpen}
          onClose={() => setIsCreateCycleModalOpen(false)}
          disciplinas={disciplinas}
          currentCycle={activeCycle}
          assuntos={internalAssuntos}
          activeConcursoId={activeConcursoId || activeCycle?.concursoId}
          concursos={concursos}
          onCycleCreated={handleCycleCreated}
        />
      </div>
    );
  }

  // =========================================================================
  // VIEW PRINCIPAL DO CICLO DE ESTUDOS (ESTRUTURA FIEL AO MOCKUP)
  // =========================================================================
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Feedback */}
      {feedback && (
        <div className="p-3.5 rounded-xl text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 animate-in fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* =========================================================================
          1. MIGALHA DE PÃO E CABEÇALHO DA PÁGINA
          ========================================================================= */}
      <div className="space-y-3">
        {/* Breadcrumb */}
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
          <span>Plano de Estudos</span>
          <span>&gt;</span>
          <span className="text-slate-800 dark:text-slate-200 font-semibold">Ciclo de Estudos</span>
        </div>

        {/* Título, Badge e Botões do Topo Direito */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Ciclo de Estudos
              </h1>
              <div 
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-xs"
                style={{
                  backgroundColor: `${palette.primary}18`,
                  borderColor: `${palette.primary}45`,
                  borderWidth: '1px',
                  color: palette.primary,
                }}
              >
                <span 
                  className="w-1.5 h-1.5 rounded-full animate-pulse" 
                  style={{ backgroundColor: palette.primary }}
                />
                <span>Ativo</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Painel gerencial de rotação contínua proporcional por disciplina e peso.
            </p>
          </div>

          {/* Botões no Canto Superior Direito */}
          <div className="flex items-center gap-2 relative" ref={actionsMenuRef}>
            <button
              onClick={() => {
                if (currentBlock) {
                  const assuntoId = currentBlock.assuntoSugeridoId || internalAssuntos.find(a => a.disciplinaId === currentBlock.disciplinaId)?.id;
                  onOpenStudyTimer(currentBlock.disciplinaId, assuntoId, currentBlock.durationMinutes);
                }
              }}
              style={{ backgroundColor: palette.primary }}
              className="text-white rounded-lg px-4 py-2 font-semibold flex items-center gap-2 cursor-pointer shadow-sm hover:brightness-110 active:scale-95 transition-all text-sm"
            >
              <Play className="w-4 h-4 fill-current text-white" />
              <span className="text-white font-semibold">Iniciar próxima sessão</span>
            </button>

            {/* Botão Secundário de Menu '•••' */}
            <button
              type="button"
              onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
              className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm cursor-pointer"
              title="Mais opções do Ciclo"
              aria-label="Mais opções do Ciclo"
            >
              <MoreHorizontal className="w-4 h-4 text-slate-700 dark:text-slate-200" />
            </button>

            {/* Menu Popover */}
            {isActionsMenuOpen && (
              <div className="absolute right-0 top-12 w-56 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsActionsMenuOpen(false);
                    setIsCreateCycleModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2.5 cursor-pointer font-medium rounded-xl transition-colors"
                >
                  <Sliders className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Editar Parâmetros do Ciclo</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsActionsMenuOpen(false);
                    setIsReorderModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2.5 cursor-pointer font-medium rounded-xl transition-colors"
                >
                  <ArrowUpDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Reordenar Disciplinas</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsActionsMenuOpen(false);
                    setIsResetLapModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2.5 cursor-pointer font-medium rounded-xl transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Recomeçar Volta Atual</span>
                </button>
                <div className="my-1 border-t border-slate-200 dark:border-slate-800" />
                <button
                  type="button"
                  onClick={() => {
                    setIsActionsMenuOpen(false);
                    setIsRemoveCycleModalOpen(true);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors w-full text-left cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span>Excluir este Ciclo</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. BARRA DE CARDS DE MÉTRICAS (GRID COM 4 CARDS HORIZONTAIS)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Progresso do ciclo */}
        <div className="gabarita-card-hover-theme p-4 rounded-xl border border-l-4 border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 flex items-center gap-3.5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div 
            className="w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0"
            style={{
              borderColor: `${palette.primary}cc`,
              backgroundColor: `${palette.primary}18`,
            }}
          >
            <span 
              className="text-xs font-extrabold font-mono"
              style={{ color: palette.primary }}
            >
              {progressPercent}%
            </span>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {formatHoursAndMins(totalAccumulatedMinutes)} estudados
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              de {formatHoursAndMins(totalPlannedMinutes)} previstas
            </div>
          </div>
        </div>

        {/* Card 2: Tempo estudado */}
        <div className="gabarita-card-hover-theme p-4 rounded-xl border border-l-4 border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 flex items-center gap-3.5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {formatHoursAndMins(totalAccumulatedMinutes)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              de {formatHoursAndMins(totalPlannedMinutes)} previstas
            </div>
          </div>
        </div>

        {/* Card 3: Blocos concluídos */}
        <div className="gabarita-card-hover-theme p-4 rounded-xl border border-l-4 border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 flex items-center gap-3.5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: `${palette.primary}18`,
              borderColor: `${palette.primary}40`,
              color: palette.primary,
            }}
          >
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {completedBlocksCount} de {totalBlocks}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {progressPercent}% do ciclo
            </div>
          </div>
        </div>

        {/* Card 4: Próximo bloco */}
        <div className="gabarita-card-hover-theme p-4 rounded-xl border border-l-4 border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 flex items-center gap-3.5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              Hoje, {suggestedTime}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              em {currentBlock?.durationMinutes || 45} min
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. CARD BANNER "PRÓXIMA SESSÃO" (DESTAQUE CENTRAL)
          ========================================================================= */}
      {currentBlock && pendingBlocks.length > 0 && (
        <div className="flashcards-daily-review-card relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/25 dark:border-primary/20 shadow-sm p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">

          {/* Lado Esquerdo */}
          <div className="flex items-start gap-4 relative z-10">
            {/* Bloco com cantos arredondados preenchido com o gradiente do tema ativo */}
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-transform"
              style={{
                background: `linear-gradient(135deg, ${palette.primaryHover || palette.primary}, ${palette.primary})`,
                boxShadow: `0 4px 14px ${palette.primary}35`
              }}
            >
              <BookOpen className="w-6 h-6 text-white" />
            </div>

            <div className="space-y-0.5 min-w-0">
              <span 
                className="text-[11px] font-bold tracking-wider uppercase block"
                style={{ color: palette.primary }}
              >
                PRÓXIMA SESSÃO
              </span>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {currentBlock.disciplinaName}
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-1 leading-snug line-clamp-2">
                {currentBlock.assuntoSugeridoName || 'Princípios Fundamentais'}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-2 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDuration(currentBlock.durationMinutes)}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Hoje, {suggestedTime}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Lado Direito: Ações */}
          <div className="flex flex-col sm:items-end w-full md:w-auto relative z-10 shrink-0">
            <button
              onClick={() => onOpenStudyTimer(currentBlock.disciplinaId, currentBlock.assuntoSugeridoId, currentBlock.durationMinutes)}
              style={{
                background: `linear-gradient(135deg, ${palette.primaryHover || palette.primary}, ${palette.primary})`,
                boxShadow: `0 4px 14px ${palette.primary}40`
              }}
              className="bg-gradient-to-r from-primary to-primary-600 hover:opacity-95 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer w-full sm:w-auto"
            >
              <Play className="w-4 h-4 fill-current text-white" />
              <span className="text-white font-semibold">Iniciar agora</span>
            </button>

            <button
              type="button"
              onClick={() => setIsReorderModalOpen(true)}
              style={{ color: palette.primary }}
              className="text-xs font-semibold hover:underline flex items-center gap-1.5 justify-center mt-2.5 cursor-pointer transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Reordenar ciclo</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. SEÇÃO PRINCIPAL: BLOCOS A CONCLUIR (PENDENTES) & BLOCOS CONCLUÍDOS
          ========================================================================= */}
      <div className="space-y-6">
        {/* SEÇÃO 4.1: BLOCOS PENDENTES / A CONCLUIR */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5">
          {/* Cabeçalho da Seção */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Disciplinas do ciclo</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/80 font-mono">
                {pendingBlocks.length}
              </span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsReorderModalOpen(true)}
                className="text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-xs hover:border-slate-400 dark:hover:border-slate-600"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Reordenar ciclo</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCreateCycleModalOpen(true)}
                className="text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-xs hover:border-slate-400 dark:hover:border-slate-600"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Editar ciclo</span>
              </button>
              <button
                type="button"
                onClick={() => setIsRemoveCycleModalOpen(true)}
                className="text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-xs hover:border-slate-400 dark:hover:border-slate-600 group"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors" />
                <span>Excluir ciclo</span>
              </button>
            </div>
          </div>

          {/* Lista de Blocos Pendentes ou Estado de Volta Concluída */}
          {pendingBlocks.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/20">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-slate-800 dark:text-white">
                Parabéns! Você completou todos os blocos desta volta do ciclo.
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Reinicie a volta para recomeçar o ciclo com suas disciplinas organizadas.
              </p>
              <Button
                size="sm"
                variant="primary"
                onClick={async () => {
                  await onResetCycleLap();
                  const reset = await DatabaseService.resetStudyCycle(false);
                  setActiveCycle(reset);
                  showFeedback('Nova volta iniciada com sucesso!');
                }}
                className="mt-3 cursor-pointer font-semibold"
              >
                Iniciar Próxima Volta
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {displayPendingBlocks.map(({ block, originalIndex, percent }, listIdx) => {
                const isCurrent = originalIndex === currentBlockIndex || (listIdx === 0 && !pendingBlocks.some(p => p.originalIndex === currentBlockIndex));

                return (
                  <div
                    key={block.id || `pending_${originalIndex}`}
                    style={
                      isCurrent
                        ? {
                            borderColor: `${palette.primary}66`,
                            boxShadow: `0 2px 12px ${palette.primary}14`,
                          }
                        : undefined
                    }
                    className={`flashcards-daily-review-card relative overflow-hidden bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/25 dark:border-primary/20 rounded-xl p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 transition-all shadow-xs ${
                      isCurrent
                        ? 'ring-1 ring-primary/20'
                        : 'hover:brightness-[0.99] dark:hover:brightness-105'
                    }`}
                  >
                    {/* Coluna 1 & Coluna 2 */}
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      {/* Coluna 1: Marcador circular da ordem original */}
                      {isCurrent ? (
                        <div 
                          className="w-8 h-8 rounded-full border font-bold font-mono text-xs flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${palette.primary}18`,
                            borderColor: `${palette.primary}55`,
                            color: palette.primary,
                          }}
                        >
                          {originalIndex + 1}
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-700 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                          {originalIndex + 1}
                        </div>
                      )}

                      {/* Coluna 2: Ícone colorido da disciplina + Nome + Assunto */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <SubjectIcon subjectName={block.disciplinaName} />
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 dark:text-white truncate flex items-center gap-2">
                            <span>{block.disciplinaName}</span>
                            {isCurrent && (
                              <span 
                                className="text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 shadow-2xs"
                                style={{
                                  backgroundColor: `${palette.primary}20`,
                                  color: palette.primary,
                                }}
                              >
                                Atual
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {block.assuntoSugeridoName || 'Princípios Fundamentais'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Coluna 3: Duração do bloco em texto médio centralizado */}
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 min-w-[75px] text-left lg:text-center shrink-0">
                      {formatDuration(block.durationMinutes)}
                    </div>

                    {/* Coluna 4: Barra de progresso com a porcentagem ao lado */}
                    <div className="flex items-center gap-2.5 min-w-[130px] max-w-xs flex-1 shrink-0">
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: isCurrent || percent > 0 ? palette.primary : '#94a3b8',
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 shrink-0 w-9 text-right">
                        {percent}%
                      </span>
                    </div>

                    {/* Coluna 5: Ações alinhadas à direita */}
                    <div className="flex items-center justify-end gap-2 shrink-0 self-end lg:self-center lg:ml-auto">
                      {/* Botão Editar */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditBlock(block)}
                        className="text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs hover:border-slate-400 dark:hover:border-slate-600"
                      >
                        <Edit3 className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                        <span>Editar</span>
                      </button>

                      {/* Botão Play (Estudar Bloco) com Cor do Tema Ativo */}
                      <button
                        type="button"
                        onClick={() => {
                          const assuntoId = block.assuntoSugeridoId || internalAssuntos.find(a => a.disciplinaId === block.disciplinaId)?.id;
                          onOpenStudyTimer(block.disciplinaId, assuntoId, block.durationMinutes);
                        }}
                        style={{ backgroundColor: palette.primary }}
                        className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all duration-200 cursor-pointer shadow-sm hover:brightness-110 active:scale-95"
                        title={`Iniciar Sessão de Estudo: ${block.disciplinaName}${block.assuntoSugeridoName ? ` - ${block.assuntoSugeridoName}` : ''} (${formatDuration(block.durationMinutes)})`}
                        aria-label={`Iniciar estudo de ${block.disciplinaName}`}
                      >
                        <Play className="w-3 h-3 fill-current text-white" />
                        <span className="text-white font-semibold">Estudar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rodapé da lista de pendentes: Ver mais disciplinas */}
          {pendingBlocks.length > 8 && (
            <div className="text-center pt-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                <span>{isExpanded ? 'Ver menos disciplinas ∧' : `Ver mais disciplinas (${pendingBlocks.length - 8}) ∨`}</span>
              </button>
            </div>
          )}
        </div>

        {/* SEÇÃO 4.2: BLOCOS CONCLUÍDOS (SEPARADOS E RETRÁTEIS) */}
        {completedBlocks.length > 0 && (
          <div className="pt-5 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCompletedExpanded(prev => !prev)}
              className="w-full flex items-center justify-between cursor-pointer py-2 px-1 select-none group rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-extrabold tracking-wider text-slate-700 dark:text-slate-300 uppercase">
                  Concluídos ({completedBlocks.length})
                </span>
              </div>
              <span className="text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                {isCompletedExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </span>
            </button>

            {isCompletedExpanded && (
              <div className="space-y-2.5 mt-3">
                {completedBlocks.map(({ block, originalIndex }) => (
                  <div
                    key={block.id || `completed_${originalIndex}`}
                    className="border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-slate-100/60 dark:hover:bg-slate-900/60 rounded-xl p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 transition-all opacity-90"
                  >
                    {/* Coluna 1 & Coluna 2 */}
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      {/* Ícone de Check Verde no lugar do número do bloco */}
                      <div
                        className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0"
                        title={`Bloco #${originalIndex + 1} concluído`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>

                      {/* Ícone da disciplina + Nome + Badge CONCLUÍDO + Tópico */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <SubjectIcon subjectName={block.disciplinaName} />
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate flex items-center gap-2">
                            <span>{block.disciplinaName}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
                              Concluído
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            #{originalIndex + 1} • {block.assuntoSugeridoName || 'Princípios Fundamentais'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Coluna 3: Duração do bloco */}
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 min-w-[75px] text-left lg:text-center shrink-0">
                      {formatDuration(block.durationMinutes)}
                    </div>

                    {/* Coluna 4: Barra de progresso em verde preenchida em 100% */}
                    <div className="flex items-center gap-2.5 min-w-[130px] max-w-xs flex-1 shrink-0">
                      <div className="w-full h-1.5 rounded-full bg-slate-200/70 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full w-full rounded-full bg-emerald-500 transition-all duration-300" />
                      </div>
                      <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 shrink-0 w-9 text-right">
                        100%
                      </span>
                    </div>

                    {/* Coluna 5: Ações alinhadas à direita (Editar e Revisar/Estudar novamente) */}
                    <div className="flex items-center justify-end gap-2 shrink-0 self-end lg:self-center lg:ml-auto">
                      <button
                        type="button"
                        onClick={() => handleOpenEditBlock(block)}
                        className="text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <Edit3 className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const assuntoId = block.assuntoSugeridoId || internalAssuntos.find(a => a.disciplinaId === block.disciplinaId)?.id;
                          onOpenStudyTimer(block.disciplinaId, assuntoId, block.durationMinutes);
                        }}
                        className="text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        title={`Revisar / Estudar novamente: ${block.disciplinaName}`}
                      >
                        <RotateCcw className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Revisar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAIS: 'Recomeçar Ciclo', 'Remover', 'Ajustar Bloco', 'Reordenar' e 'Criar Ciclo'
          ========================================================================= */}

      {/* Modal: Reordenar Ciclo */}
      <Modal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        title="Reordenar Sequência do Ciclo"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            Ajuste a ordem de execução dos blocos no ciclo usando as setas para subir ou descer.
          </p>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {activeCycle.blocks.map((block, idx) => (
              <div
                key={block.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold flex items-center justify-center text-xs shrink-0">
                    {idx + 1}
                  </span>
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: block.disciplinaColor || palette.primary }}
                  />
                  <div className="min-w-0">
                    <h5 className="font-bold text-slate-900 dark:text-white truncate">
                      {block.disciplinaName}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {block.assuntoSugeridoName || 'Tópico Dirigido'} • {formatDuration(block.durationMinutes)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveBlock(idx, idx - 1)}
                    className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-xs"
                    title="Mover para cima"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === activeCycle.blocks.length - 1}
                    onClick={() => handleMoveBlock(idx, idx + 1)}
                    className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-xs"
                    title="Mover para baixo"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsReorderModalOpen(false)}
              className="font-bold cursor-pointer"
            >
              Concluir Reordenação
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Recomeçar Ciclo */}
      <Modal
        isOpen={isResetLapModalOpen}
        onClose={() => setIsResetLapModalOpen(false)}
        title="Recomeçar Ciclo de Estudos"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Deseja reiniciar a volta atual do ciclo? O ponteiro será reposicionado no <strong>Bloco #1</strong> com todos os blocos reiniciados para nova execução. O número total de voltas completadas será preservado.
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsResetLapModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmResetCycle}
              isLoading={isSubmitting}
              className="font-bold cursor-pointer"
            >
              Confirmar Reinício
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Excluir Ciclo de Estudos */}
      <Modal
        isOpen={isRemoveCycleModalOpen}
        onClose={() => setIsRemoveCycleModalOpen(false)}
        title="Excluir Ciclo de Estudos?"
        description="Esta ação removerá o planejamento cíclico atual e reiniciará as métricas de rotação deste concurso. O edital e as matérias cadastradas serão preservados."
        maxWidth="md"
      >
        <div className="space-y-4 pt-2 text-xs sm:text-sm">
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-red-800 dark:text-red-200">
                Tem certeza que deseja apagar este ciclo?
              </p>
              <p className="text-xs text-red-700 dark:text-red-400">
                Esta ação removerá o planejamento cíclico atual e reiniciará as métricas de rotação deste concurso. O edital e as matérias cadastradas serão preservados.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsRemoveCycleModalOpen(false)}
              className="cursor-pointer border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmRemoveCycle}
              isLoading={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer shadow-sm border border-red-700"
            >
              Sim, Excluir Ciclo
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Ajustar Bloco Individual */}
      <Modal
        isOpen={isEditBlockModalOpen}
        onClose={() => setIsEditBlockModalOpen(false)}
        title="Ajustar Bloco do Ciclo"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold mb-1 text-slate-700 dark:text-slate-200">
              Duração (minutos)
            </label>
            <input
              type="number"
              value={editDuration}
              onChange={(e) => setEditDuration(parseInt(e.target.value, 10) || 60)}
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block font-bold mb-1 text-slate-700 dark:text-slate-200">
              Tópico Sugerido
            </label>
            <input
              type="text"
              value={editTopicName}
              onChange={(e) => setEditTopicName(e.target.value)}
              placeholder="Ex: Princípios Fundamentais, Controle de Constitucionalidade..."
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsEditBlockModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveBlockEdit}
              isLoading={isSubmitting}
              className="font-bold cursor-pointer"
            >
              Salvar Alterações
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Criar Novo Ciclo */}
      <CriarCicloModal
        isOpen={isCreateCycleModalOpen}
        onClose={() => setIsCreateCycleModalOpen(false)}
        disciplinas={disciplinas}
        currentCycle={activeCycle}
        assuntos={internalAssuntos}
        activeConcursoId={activeConcursoId || activeCycle?.concursoId}
        concursos={concursos}
        onCycleCreated={handleCycleCreated}
      />
    </div>
  );
};
