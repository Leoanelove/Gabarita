import React, { useState, useMemo, useEffect } from 'react';
import { 
  Repeat, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Sliders, 
  BookOpen, 
  Clock, 
  Layers,
  AlertCircle,
  HelpCircle,
  BarChart2,
  Lightbulb,
  Minus,
  Plus,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { Disciplina, Assunto, StudyCycle, CycleBlock, Concurso, DayOfWeek } from '../../types';
import { Modal } from '../../design-system/Modal';
import { Button } from '../../design-system/Button';
import { Badge } from '../../design-system/Badge';
import { DatabaseService } from '../../services/db';
import { CycleService } from '../../services/cycleService';
import { useTheme } from '../../contexts/ThemeContext';

const WEEKDAYS: [DayOfWeek, string, string][] = [
  ['dom', 'Dom', 'Domingo'],
  ['seg', 'Seg', 'Segunda-feira'],
  ['ter', 'Ter', 'Terça-feira'],
  ['qua', 'Qua', 'Quarta-feira'],
  ['qui', 'Qui', 'Quinta-feira'],
  ['sex', 'Sex', 'Sexta-feira'],
  ['sab', 'Sáb', 'Sábado'],
];
const ALL_STUDY_DAYS = WEEKDAYS.map(([day]) => day);

export interface CriarCicloModalProps {
  isOpen: boolean;
  onClose: () => void;
  disciplinas: Disciplina[];
  currentCycle?: StudyCycle | null;
  assuntos?: Assunto[];
  activeConcursoId?: string;
  concursos?: Concurso[];
  onCycleCreated: (newCycle: StudyCycle) => Promise<void>;
}

export const CriarCicloModal: React.FC<CriarCicloModalProps> = ({
  isOpen,
  onClose,
  disciplinas,
  currentCycle,
  assuntos = [],
  activeConcursoId,
  concursos = [],
  onCycleCreated,
}) => {
  // Concurso ativo resolvido
  const resolvedActiveConcursoId = useMemo(() => {
    if (activeConcursoId) return activeConcursoId;
    if (concursos && concursos.length > 0) {
      const active = concursos.find(c => c.active);
      if (active) return active.id;
      return concursos[0].id;
    }
    if (currentCycle?.concursoId) return currentCycle.concursoId;
    return disciplinas[0]?.concursoId || '';
  }, [activeConcursoId, concursos, currentCycle, disciplinas]);

  // Filtro estrito de disciplinas pelo concurso ativo
  const materiasDoConcursoAtivo = useMemo(() => {
    if (!resolvedActiveConcursoId) {
      const firstConcursoId = disciplinas.find(d => d.concursoId)?.concursoId;
      if (firstConcursoId) {
        return disciplinas.filter(d => d.concursoId === firstConcursoId);
      }
      return disciplinas;
    }
    return disciplinas.filter(d => d.concursoId === resolvedActiveConcursoId);
  }, [disciplinas, resolvedActiveConcursoId]);

  // Stepper: Inicia DIRETAMENTE no Passo 1 (Seleção de Disciplinas), pulando Organização
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Passo 1: Disciplinas Selecionadas (apenas do concurso ativo)
  const [selectedDisciplinaIds, setSelectedDisciplinaIds] = useState<string[]>(() => {
    if (currentCycle?.blocks && currentCycle.blocks.length > 0 && currentCycle.concursoId === resolvedActiveConcursoId) {
      const existingIds = Array.from(new Set(currentCycle.blocks.map(b => b.disciplinaId)));
      const valid = existingIds.filter(id => materiasDoConcursoAtivo.some(m => m.id === id));
      if (valid.length > 0) return valid;
    }
    return materiasDoConcursoAtivo.map(d => d.id);
  });

  // Passo 2: Controles Deslizantes Reais de Importância (1 a 5) e Conhecimento (1 a 5)
  const [relevancias, setRelevancias] = useState<Record<string, { importancia: number; conhecimento: number }>>(() => {
    const initial: Record<string, { importancia: number; conhecimento: number }> = {};
    materiasDoConcursoAtivo.forEach((d) => {
      initial[d.id] = {
        importancia: Math.min(5, Math.max(1, Math.round(d.weight || 3))),
        conhecimento: 3, // Padrão intermediário
      };
    });
    return initial;
  });

  // Passo 3: Horários e Intervalos dos Blocos
  const [weeklyHours, setWeeklyHours] = useState(20);
  const [studyDays, setStudyDays] = useState<DayOfWeek[]>(ALL_STUDY_DAYS);
  const existingStudyDays = currentCycle?.concursoId === resolvedActiveConcursoId ? currentCycle?.studyDays : undefined;
  const [minBlockMinutes, setMinBlockMinutes] = useState(50);
  const [maxBlockMinutes, setMaxBlockMinutes] = useState(90);

  const { palette } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [savingPhase, setSavingPhase] = useState<'idle' | 'optimizing' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setErrorMessage(null);
      setIsSaving(false);
      setSavingPhase('idle');
      if (currentCycle?.blocks && currentCycle.blocks.length > 0 && currentCycle.concursoId === resolvedActiveConcursoId) {
        const existingIds = Array.from(new Set(currentCycle.blocks.map(b => b.disciplinaId)));
        const valid = existingIds.filter(id => materiasDoConcursoAtivo.some(m => m.id === id));
        if (valid.length > 0) {
          setSelectedDisciplinaIds(valid);
        } else {
          setSelectedDisciplinaIds(materiasDoConcursoAtivo.map(d => d.id));
        }
      } else {
        setSelectedDisciplinaIds(materiasDoConcursoAtivo.map(d => d.id));
      }
    }
  }, [isOpen, currentCycle, resolvedActiveConcursoId, materiasDoConcursoAtivo]);

  // Alternar seleção de disciplina
  const toggleDisciplina = (discId: string) => {
    setSelectedDisciplinaIds(prev => {
      if (prev.includes(discId)) {
        return prev.filter(id => id !== discId);
      }
      return [...prev, discId];
    });
  };

  const selectAllDisciplinas = () => {
    setSelectedDisciplinaIds(materiasDoConcursoAtivo.map(d => d.id));
  };

  const clearSelection = () => {
    setSelectedDisciplinaIds([]);
  };

  // Atualizar controle deslizante de importância ou conhecimento
  const handleUpdateRelevancia = (
    discId: string, 
    field: 'importancia' | 'conhecimento', 
    value: number
  ) => {
    setRelevancias(prev => ({
      ...prev,
      [discId]: {
        ...(prev[discId] || { importancia: 3, conhecimento: 3 }),
        [field]: value,
      },
    }));
  };

  // Lógica Matemática do Passo 2 (Relevância):
  // Calcula o peso e percentual garantindo que a soma feche SEMPRE em exatos 100.0%
  const calculatedDistribution = useMemo(() => {
    const selected = materiasDoConcursoAtivo.filter(d => selectedDisciplinaIds.includes(d.id));
    if (selected.length === 0) return [];

    // Fator de Necessidade: menor conhecimento = maior necessidade de estudo (6 - conhecimento)
    // Pontuação: Importância * Necessidade
    const items = selected.map(d => {
      const rel = relevancias[d.id] || { importancia: 3, conhecimento: 3 };
      const imp = rel.importancia;
      const con = rel.conhecimento;
      const necessidade = 6 - con; // varia de 1 a 5
      const rawScore = imp * necessidade; // varia de 1 a 25
      return {
        disciplina: d,
        importancia: imp,
        conhecimento: con,
        score: rawScore,
        percentage: 0,
      };
    });

    const totalScore = items.reduce((acc, curr) => acc + curr.score, 0) || 1;

    // Cálculo preliminar com 1 casa decimal
    let accumulatedSum = 0;
    const withPercentages = items.map(item => {
      const rawPct = (item.score / totalScore) * 100;
      const pct = Math.round(rawPct * 10) / 10;
      accumulatedSum += pct;
      return {
        ...item,
        percentage: pct,
      };
    });

    // Compensação matemática exata para fechar em 100.0%
    const diff = Number((100.0 - accumulatedSum).toFixed(1));
    if (diff !== 0 && withPercentages.length > 0) {
      let maxIdx = 0;
      for (let i = 1; i < withPercentages.length; i++) {
        if (withPercentages[i].score > withPercentages[maxIdx].score) {
          maxIdx = i;
        }
      }
      withPercentages[maxIdx].percentage = Number(
        (withPercentages[maxIdx].percentage + diff).toFixed(1)
      );
    }

    return withPercentages;
  }, [disciplinas, selectedDisciplinaIds, relevancias]);

  // Avançar nos passos
  const handleNext = () => {
    setErrorMessage(null);
    if (step === 1) {
      if (selectedDisciplinaIds.length === 0) {
        setErrorMessage('Selecione pelo menos uma disciplina para compor seu ciclo.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3);
    }
  };

  useEffect(() => {
    if (isOpen) setStudyDays(existingStudyDays?.length ? existingStudyDays : ALL_STUDY_DAYS);
  }, [isOpen, existingStudyDays]);

  // Salvamento e Integração Final (Passo 3 -> Concluir)
  const handleSaveAndGenerateCycle = async () => {
    if (isSaving || savingPhase !== 'idle' || studyDays.length === 0) return;
    setErrorMessage(null);

    try {
      if (calculatedDistribution.length === 0) {
        throw new Error('Nenhuma disciplina selecionada para o ciclo.');
      }

      setIsSaving(true);
      setSavingPhase('optimizing');

      const targetConcursoId = resolvedActiveConcursoId || activeConcursoId || currentCycle?.concursoId || '';

      // Montagem dos blocos com Proporção Real por Matéria e Intercalação Estrita sem Repetição Sequencial
      const interleaved = CycleService.createStudyBlocks({
        calculatedDistribution,
        assuntos,
        weeklyHours,
        minBlockMinutes,
        maxBlockMinutes,
        cycleId: targetConcursoId ? `cycle_${targetConcursoId}` : (currentCycle?.id || `cycle_${Date.now()}`),
      });

      const totalCalculatedMinutes = interleaved.reduce((acc, b) => acc + b.durationMinutes, 0);

      const activeMatch = concursos.find(c => c.id === resolvedActiveConcursoId);
      const resolvedTitle = activeMatch
        ? `${activeMatch.organ || activeMatch.orgao || activeMatch.title} - ${activeMatch.role}`
        : currentCycle?.concursoTitle || 'Plano Personalizado';

      const newCycle: StudyCycle = {
        id: `cycle_${targetConcursoId || Date.now()}`,
        userId: currentCycle?.userId || 'current_user',
        concursoId: targetConcursoId,
        concursoTitle: resolvedTitle,
        currentBlockIndex: 0,
        completedCyclesCount: 0,
        totalCycleMinutes: totalCalculatedMinutes,
        blocks: interleaved,
        studyDays,
        createdAt: (existingStudyDays && currentCycle?.createdAt) || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const savedCycle = await DatabaseService.saveStudyCycle(newCycle);
      window.dispatchEvent(new CustomEvent('gabarita_cycle_updated', { detail: savedCycle }));
      await onCycleCreated(savedCycle);

      // Etapa 1 - Carregando (aprox. 1.25 segundos)
      await new Promise(resolve => setTimeout(resolve, 1250));

      // Etapa 2 - Conclusão / Sucesso (aprox. 1 segundo)
      setSavingPhase('success');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Etapa 3 - Fechamento e Exibição
      onClose();
      setTimeout(() => {
        setSavingPhase('idle');
        setIsSaving(false);
      }, 300);
    } catch (err: any) {
      console.error('Erro ao gerar novo ciclo:', err);
      setErrorMessage(err.message || 'Ocorreu um erro ao processar o novo ciclo.');
      setSavingPhase('idle');
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (savingPhase === 'idle') onClose();
      }}
      title={
        savingPhase === 'optimizing'
          ? 'Configurando seu Ciclo'
          : savingPhase === 'success'
          ? 'Ciclo Concluído!'
          : 'Criar Novo Ciclo de Estudos'
      }
      description={
        savingPhase === 'optimizing'
          ? 'Processando balanceamento e distribuição das disciplinas...'
          : savingPhase === 'success'
          ? 'Sua esteira de matérias foi gerada com sucesso'
          : 'Configure as disciplinas, relevância e parâmetros do seu ciclo contínuo.'
      }
      maxWidth={savingPhase !== 'idle' ? 'md' : '2xl'}
    >
      <div className="space-y-4">
        {savingPhase !== 'idle' ? (
          <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-200 min-h-[300px]">
            {savingPhase === 'optimizing' ? (
              <>
                {/* Ícone e Animação Moderna de Processamento */}
                <div className="relative flex items-center justify-center my-2">
                  <div
                    className="w-20 h-20 rounded-full animate-ping opacity-20 pointer-events-none"
                    style={{ backgroundColor: palette.primary }}
                  />
                  <div
                    className="absolute w-20 h-20 rounded-full border-4 border-t-transparent animate-spin"
                    style={{ borderColor: `${palette.primary}25`, borderTopColor: palette.primary }}
                  />
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{
                      backgroundColor: `${palette.primary}18`,
                      color: palette.primary,
                      border: `1px solid ${palette.primary}40`,
                    }}
                  >
                    <Sparkles className="w-7 h-7 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-2 max-w-sm">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    Otimizando seu ciclo e distribuindo os blocos de matérias...
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Aplicando alternância contínua, pesos proporcionais e tempos equilibrados.
                  </p>
                </div>

                {/* Barra de Progresso Suave com a Cor de Destaque */}
                <div className="w-full max-w-xs space-y-2 pt-2">
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700/60">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out animate-pulse"
                      style={{
                        backgroundColor: palette.primary,
                        width: '88%',
                        boxShadow: `0 0 12px ${palette.glowColor || `${palette.primary}60`}`,
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 font-mono">
                    Construindo blocos de estudos...
                  </span>
                </div>
              </>
            ) : (
              <>
                {/* Ícone de Confirmação (Check Verde / Sucesso) */}
                <div className="relative flex items-center justify-center my-2 animate-in zoom-in-75 duration-300">
                  <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/10">
                    <CheckCircle2 className="w-10 h-10 stroke-[2.5] text-emerald-500" />
                  </div>
                </div>

                <div className="space-y-2 max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    Ciclo Gerado com Sucesso!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Distribuímos suas matérias de forma proporcional e equilibrada.
                  </p>
                </div>

                {/* Badge Informativo */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Renderizando sua esteira de matérias...</span>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Barra de Progresso / Stepper Visual (3 Passos) */}
        <div className="relative">
          <div className="flex items-center justify-between">
            {/* Passo 1 */}
            <div className="flex flex-col items-center z-10">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  step === 1
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20 ring-4 ring-emerald-500/20'
                    : step > 1
                    ? 'bg-emerald-500 text-white cursor-pointer'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {step > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
              </button>
              <span className={`text-[11px] font-bold mt-1.5 ${step === 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                Disciplinas
              </span>
            </div>

            {/* Passo 2 */}
            <div className="flex flex-col items-center z-10">
              <button
                type="button"
                onClick={() => { if (selectedDisciplinaIds.length > 0) setStep(2); }}
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  step === 2
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20 ring-4 ring-emerald-500/20'
                    : step > 2
                    ? 'bg-emerald-500 text-white cursor-pointer'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {step > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : '2'}
              </button>
              <span className={`text-[11px] font-bold mt-1.5 ${step === 2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                Relevância (100%)
              </span>
            </div>

            {/* Passo 3 */}
            <div className="flex flex-col items-center z-10">
              <button
                type="button"
                onClick={() => { if (selectedDisciplinaIds.length > 0) setStep(3); }}
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  step === 3
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20 ring-4 ring-emerald-500/20'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                3
              </button>
              <span className={`text-[11px] font-bold mt-1.5 ${step === 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                Horários & Blocos
              </span>
            </div>
          </div>

          {/* Linha de Conexão do Stepper */}
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 dark:bg-slate-800 -z-0">
            <div 
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
            />
          </div>
        </div>

        {/* Mensagem de Erro / Alerta */}
        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* CONTEÚDO DOS PASSOS */}

        {/* PASSO 1: Seleção Real de Disciplinas */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-500" />
                  Selecione as Matérias para o Ciclo
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Escolha as disciplinas do seu edital que farão parte da rotação.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllDisciplinas}
                  className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                >
                  Selecionar Todas
                </button>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium cursor-pointer"
                >
                  Limpar
                </button>
              </div>
            </div>

            {/* Grid de Cards de Disciplinas */}
            {materiasDoConcursoAtivo.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 bg-slate-50/50 dark:bg-slate-900/40">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="max-w-sm mx-auto space-y-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Nenhuma matéria encontrada para o concurso ativo.
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cadastre ou ative um concurso primeiro no menu "Concursos & Provas" para gerar o seu ciclo.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto p-1 pr-2">
                {materiasDoConcursoAtivo.map((disc) => {
                  const isSelected = selectedDisciplinaIds.includes(disc.id);
                  const discAssuntosCount = assuntos.filter(a => a.disciplinaId === disc.id).length;
                  return (
                    <button
                      key={disc.id}
                      type="button"
                      onClick={() => toggleDisciplina(disc.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-start justify-between cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0 pr-2">
                        <span 
                          className="w-3.5 h-3.5 rounded-full mt-0.5 shrink-0" 
                          style={{ backgroundColor: disc.color || '#10b981' }} 
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate">
                            {disc.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {discAssuntosCount} tópicos • Peso base: {(disc.weight || 2.0).toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-emerald-500 text-white' : 'border border-slate-300 dark:border-slate-700'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">Matérias selecionadas:</span>
              <Badge variant="emerald" size="sm">
                {selectedDisciplinaIds.length} de {materiasDoConcursoAtivo.length} disciplinas
              </Badge>
            </div>
          </div>
        )}

        {/* PASSO 2: Relevância com Cálculo Matemático em Tempo Real (100% Exato) */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-500" />
                  Importância & Nível de Conhecimento
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ajuste os fatores de cada matéria. O algoritmo equilibra o tempo em exatamente 100%.
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-600 dark:text-emerald-400 text-xs font-mono font-black">
                <BarChart2 className="w-3.5 h-3.5" />
                <span>100.0% Fechado</span>
              </div>
            </div>

            {/* Barra de Distribuição Visual Proporcional Empilhada */}
            <div className="space-y-1.5">
              <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-800 flex overflow-hidden shadow-inner">
                {calculatedDistribution.map((item) => (
                  <div
                    key={item.disciplina.id}
                    title={`${item.disciplina.name}: ${item.percentage}%`}
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.disciplina.color || '#10b981',
                    }}
                    className="h-full transition-all duration-300 hover:brightness-110"
                  />
                ))}
              </div>
            </div>

            {/* Lista de Controles Deslizantes Reais */}
            <div className="space-y-3 max-h-72 overflow-y-auto p-1 pr-2">
              {calculatedDistribution.map((item) => {
                const disc = item.disciplina;
                const rel = relevancias[disc.id] || { importancia: 3, conhecimento: 3 };

                return (
                  <div 
                    key={disc.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-3 h-3 rounded-full shrink-0" 
                          style={{ backgroundColor: disc.color || '#10b981' }} 
                        />
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {disc.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          {item.percentage}% do ciclo
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      {/* Slider 1: Importância no Edital (1 a 5) */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Importância no Edital:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {rel.importancia === 1 ? '1 - Baixa' :
                             rel.importancia === 2 ? '2 - Moderada' :
                             rel.importancia === 3 ? '3 - Importante' :
                             rel.importancia === 4 ? '4 - Alta' : '5 - Crítica'}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="1"
                          value={rel.importancia}
                          onChange={(e) => handleUpdateRelevancia(disc.id, 'importancia', parseInt(e.target.value, 10))}
                          className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>

                      {/* Slider 2: Domínio Atual (1 a 5) */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Seu Nível / Domínio:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {rel.conhecimento === 1 ? '1 - Básico' :
                             rel.conhecimento === 2 ? '2 - Iniciante' :
                             rel.conhecimento === 3 ? '3 - Intermediário' :
                             rel.conhecimento === 4 ? '4 - Avançado' : '5 - Dominado'}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="1"
                          value={rel.conhecimento}
                          onChange={(e) => handleUpdateRelevancia(disc.id, 'conhecimento', parseInt(e.target.value, 10))}
                          className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PASSO 3: Horários, Duração dos Blocos e Conclusão */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                Carga Horária & Intervalos dos Blocos
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Defina o ritmo e a duração dos blocos para o cálculo automático da volta do ciclo.
              </p>
            </div>

            <div className="space-y-4">
              {/* Horas Semanais */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                        Horas de estudo por semana
                      </span>
                      <span
                        className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"
                        title="Insira manualmente ou use os botões para definir sua carga horária semanal"
                      >
                        <Lightbulb className="w-4 h-4" />
                      </span>
                    </div>

                    {/* Controle Manual [ -   28h   + ] */}
                    <div className="inline-flex items-center justify-between w-56 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setWeeklyHours((prev) => Math.max(1, prev - 1))}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        aria-label="Diminuir horas"
                      >
                        <Minus className="w-4 h-4 stroke-[2.5]" />
                      </button>

                      <div className="flex items-baseline justify-center">
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={weeklyHours}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) {
                              setWeeklyHours(Math.max(1, Math.min(100, val)));
                            } else if (e.target.value === '') {
                              setWeeklyHours(1);
                            }
                          }}
                          className="w-14 text-right font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-slate-100 bg-transparent focus:outline-hidden [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          aria-label="Horas de estudo por semana"
                        />
                        <span className="font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-slate-100 select-none">
                          h
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setWeeklyHours((prev) => Math.min(100, prev + 1))}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        aria-label="Aumentar horas"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>

                    {/* Botões Rápidos: 10h, 15h, 20h, 30h, 40h */}
                    <div className="flex flex-wrap items-center gap-2">
                      {[10, 15, 20, 30, 40].map((preset) => {
                        const isSelected = weeklyHours === preset;
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setWeeklyHours(preset)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500/50'
                            }`}
                          >
                            {preset}h
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Controle Deslizante Complementar */}
                  <div className="flex-1 sm:max-w-xs space-y-2 pt-2 sm:pt-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">Ajuste rápido na barra:</span>
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {weeklyHours} horas / semana
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="60"
                      step="1"
                      value={Math.min(60, weeklyHours)}
                      onChange={(e) => setWeeklyHours(parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>5h (Leve)</span>
                      <span>20h (Padrão)</span>
                      <span>40h (Intensivo)</span>
                      <span>60h (Dedicado)</span>
                    </div>
                  </div>
                </div>
              </div>

              <fieldset className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <legend className="px-1 text-xs font-bold">Dias de estudo na semana</legend>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Marque os dias em que pretende estudar. Os outros dias são de descanso e preservam sua constância.
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {WEEKDAYS.map(([day, label, name]) => (
                    <label key={day} className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-2 text-xs font-semibold cursor-pointer has-checked:border-primary/45 has-checked:bg-primary/10">
                      <input
                        type="checkbox"
                        aria-label={name}
                        checked={studyDays.includes(day)}
                        className="accent-primary"
                        onChange={event => {
                          const checked = event.currentTarget.checked;
                          setStudyDays(days => checked ? [...days, day] : days.filter(value => value !== day));
                        }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                {studyDays.length === 0 && (
                  <p className="text-xs text-rose-700 dark:text-rose-300">Selecione pelo menos um dia de estudo.</p>
                )}
              </fieldset>

              {/* Duração Mínima e Máxima dos Blocos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Duração Mínima do Bloco
                  </label>
                  <select
                    value={minBlockMinutes}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setMinBlockMinutes(val);
                      if (maxBlockMinutes < val) {
                        setMaxBlockMinutes(val);
                      }
                    }}
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value={15}>15 minutos</option>
                    <option value={20}>20 minutos</option>
                    <option value={25}>25 minutos (Pomodoro curto)</option>
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={50}>50 minutos (Pomodoro)</option>
                    <option value={60}>60 minutos (1 hora)</option>
                  </select>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Duração Máxima do Bloco
                  </label>
                  <select
                    value={maxBlockMinutes}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setMaxBlockMinutes(val);
                      if (minBlockMinutes > val) {
                        setMinBlockMinutes(val);
                      }
                    }}
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value={15}>15 minutos</option>
                    <option value={20}>20 minutos</option>
                    <option value={25}>25 minutos</option>
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>60 minutos</option>
                    <option value={75}>75 minutos</option>
                    <option value={90}>90 minutos (Recomendado)</option>
                    <option value={120}>120 minutos (2 horas)</option>
                  </select>
                </div>
              </div>

              {/* Resumo da Volta Calculada */}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>Resumo do Novo Ciclo Calculado:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 dark:text-slate-300 pt-1">
                  <div>
                    <span className="block text-slate-400">Total da Volta:</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-slate-100">{weeklyHours} horas</span>
                  </div>
                  <div>
                    <span className="block text-slate-400">Blocos Estimados:</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-slate-100">
                      ~{Math.round((weeklyHours * 60) / ((minBlockMinutes + maxBlockMinutes) / 2))} blocos
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400">Disciplinas:</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-slate-100">
                      {selectedDisciplinaIds.length} matérias
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BOTÕES DE NAVEGAÇÃO DO MODAL */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            {step > 1 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                disabled={isSaving}
              >
                Voltar
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancelar
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 3 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleNext}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Próximo Passo
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveAndGenerateCycle}
                disabled={studyDays.length === 0}
                isLoading={isSaving}
                leftIcon={<Check className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Concluir & Criar Ciclo
              </Button>
            )}
          </div>
        </div>
          </>
        )}
      </div>
    </Modal>
  );
};
