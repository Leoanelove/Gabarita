import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  FileText,
  Edit3,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { Disciplina, Assunto, AssuntoImportance, TopicDifficulty } from '../../types';
import { Modal } from '../../design-system/Modal';
import { Button } from '../../design-system/Button';
import { Input } from '../../design-system/Input';
import {
  sanitizeTopicString,
  preSanitizeEditalText,
  reconstituteBrokenPdfLines,
  stitchBrokenTopics,
  generateSigla,
  isGenericGroupingHeader
} from '../../services/editalParser';

const PALETTE_COLORS = [
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#ef4444', // Red
  '#6366f1', // Indigo
];

export interface NovaMateriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingDisciplina?: Disciplina | null;
  concursoId: string;
  concursoTitle?: string;
  cargoRole?: string;
  nextOrder?: number;
  onSaveNewDisciplinaWithTopics?: (
    disciplina: Omit<Disciplina, 'id' | 'createdAt' | 'topicsCount' | 'completedTopicsCount' | 'totalStudyMinutes'>,
    topics: string[]
  ) => Promise<void>;
  onUpdateDisciplina?: (id: string, partial: Partial<Disciplina>) => Promise<void>;
}

/**
 * Extrai e organiza tópicos de um texto bruto colado do edital para uma matéria específica.
 */
function parseTopicsForSubjectLocally(rawText: string, subjectName: string): string[] {
  if (!rawText || !rawText.trim()) return [];

  const preCleaned = preSanitizeEditalText(rawText);
  const reconstituted = reconstituteBrokenPdfLines(preCleaned);
  if (!reconstituted.trim()) return [];

  // Remove eventual cabeçalho repetido do próprio nome da disciplina no início do texto
  let textBody = reconstituted.trim();
  const cleanSubj = subjectName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (cleanSubj) {
    const subjHeaderRegex = new RegExp(`^(?:\\d+[\\.\\)\\-\\s]+)?${cleanSubj}\\s*[\\:\\-\\–\\—\\.]*\\s*`, 'i');
    textBody = textBody.replace(subjHeaderRegex, '').trim();
  }

  // Função auxiliar para quebrar um bloco de texto em itens de edital
  const splitBlockIntoTopics = (block: string): string[] => {
    if (!block || !block.trim()) return [];

    // 1. Verifica se possui numeração explícita de edital (ex: "1. ", "1.1 ", "2. ", "1 - ", "1 ")
    const hasExplicitNumbering = /(?:^|\n|\s)\d+(?:\.\d+)*(?:[\.\)\-]|\s)\s*[A-ZÁÉÍÓÚÂÊÔÃÕÇa-z]/.test(block);

    if (hasExplicitNumbering) {
      // Quebra antes de cada número de tópico (protegendo números de leis como Lei nº 14.133, art. 5º, etc.)
      const segments = block
        .split(/(?=(?:^|\n|\s)(?<!\b(?:Lei|Leis|Decreto|Portaria|Resolução|IN|EC|LC|nº|no|n\.|art|arts|inc|al|fl|fls|pág|pag)\s*)\d+(?:\.\d+)*[\.\)\-]?\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/g)
        .map(s => s.trim())
        .filter(Boolean);

      if (segments.length > 1) {
        return segments;
      }
    }

    // 2. Caso não tenha numeração clara ou seja um parágrafo corrido separado por ponto/ponto-e-vírgula
    const rawSegments = block.split(
      /(?:;|\.(?!\d)(?<!\b(?:Lei|Leis|Decreto|nº|no|n|art|arts|inc|al|fl|fls|v|vs|p|pág|pag|par|cf|cpc|cpp|clt|ec)))\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇa-z0-9])/
    );
    return stitchBrokenTopics(rawSegments.map(s => s.trim()).filter(Boolean));
  };

  const lines = textBody.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const extractedRaw: string[] = [];

  for (const line of lines) {
    if (isGenericGroupingHeader(line)) continue;
    const parts = splitBlockIntoTopics(line);
    for (const p of parts) {
      extractedRaw.push(p);
    }
  }

  const finalTopics: string[] = [];
  const seen = new Set<string>();

  for (const item of stitchBrokenTopics(extractedRaw)) {
    const sanitized = sanitizeTopicString(item);
    if (sanitized && sanitized.toLowerCase() !== subjectName.trim().toLowerCase()) {
      const key = sanitized.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        finalTopics.push(sanitized);
      }
    }
  }

  return finalTopics;
}

export const NovaMateriaModal: React.FC<NovaMateriaModalProps> = ({
  isOpen,
  onClose,
  editingDisciplina,
  concursoId,
  concursoTitle,
  cargoRole,
  nextOrder = 1,
  onSaveNewDisciplinaWithTopics,
  onUpdateDisciplina,
}) => {
  // Step 1: Nome, Peso e Cor da Matéria
  // Step 2: Inserir Assuntos (Automático Colando do Edital ou Manualmente)
  // Step 3: Conferência / Revisão dos Tópicos Estruturados antes de salvar
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [weight, setWeight] = useState('2.0');
  const [color, setColor] = useState('#10b981');

  // Step 2 states
  const [inputMode, setInputMode] = useState<'auto' | 'manual'>('auto');
  const [pastedEditalText, setPastedEditalText] = useState('');
  const [isProcessingText, setIsProcessingText] = useState(false);

  // Tópicos estruturados (usados tanto no modo manual quanto na conferência do modo automático)
  const [topicsList, setTopicsList] = useState<string[]>([]);
  const [manualTopicInput, setManualTopicInput] = useState('');

  // Edição inline de tópico na conferência ou lista manual
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [newReviewTopicInput, setNewReviewTopicInput] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setIsSaving(false);
      setIsProcessingText(false);
      setEditingIndex(null);

      if (editingDisciplina) {
        setStep(1);
        setName(editingDisciplina.name || '');
        setCode(editingDisciplina.code || '');
        setWeight(String(editingDisciplina.weight || 2.0));
        setColor(editingDisciplina.color || '#10b981');
      } else {
        setStep(1);
        setName('');
        setCode('');
        setWeight('2.0');
        setColor('#10b981');
        setInputMode('auto');
        setPastedEditalText('');
        setTopicsList([]);
        setManualTopicInput('');
        setNewReviewTopicInput('');
      }
    }
  }, [isOpen, editingDisciplina]);

  // Step 1 -> Step 2 (ou Salvar Direto se estiver apenas editando matéria existente)
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Informe o nome da matéria.');
      return;
    }
    setErrorMsg(null);

    if (editingDisciplina && onUpdateDisciplina) {
      setIsSaving(true);
      try {
        await onUpdateDisciplina(editingDisciplina.id, {
          name: name.trim(),
          code: code.trim() || generateSigla(name.trim()),
          weight: parseFloat(weight) || 2.0,
          color,
        });
        onClose();
      } catch {
        setErrorMsg('Não foi possível atualizar a matéria.');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // Avança para a tela 2 (Inserir Assuntos da Matéria)
    setStep(2);
  };

  // Processar texto colado na opção Automática e ir para a tela de Conferência (Step 3)
  const handleOrganizeEditalTopics = async () => {
    if (!pastedEditalText.trim()) {
      setErrorMsg('Cole os assuntos do edital no campo de texto para organizar os tópicos.');
      return;
    }

    setIsProcessingText(true);
    setErrorMsg(null);

    try {
      // 1. Tenta processar primeiro com nosso parser local especialista para resposta imediata e fiel
      let organized = parseTopicsForSubjectLocally(pastedEditalText, name.trim());

      // 2. Se o texto for muito complexo e o parser local extrair apenas 1 bloco grande (> 180 chars), tenta o endpoint de IA se disponível
      if (organized.length <= 1 && pastedEditalText.trim().length > 140) {
        try {
          const response = await fetch('/api/edital/parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rawText: `${name.trim().toUpperCase()}:\n${pastedEditalText}`,
              cargo: cargoRole || 'Cargo',
              concursoTitle: concursoTitle || 'Concurso',
            }),
          });
          if (response.ok) {
            const result = await response.json();
            const rawItems = result.syllabus || result.data?.syllabus || result.disciplinas || [];
            if (Array.isArray(rawItems) && rawItems.length > 0) {
              const allAiTopics: string[] = [];
              for (const item of rawItems) {
                const tops = Array.isArray(item.topicos) ? item.topicos : [];
                for (const t of tops) {
                  const str = typeof t === 'string' ? t : t?.name;
                  if (str && str.trim()) allAiTopics.push(str.trim());
                }
              }
              if (allAiTopics.length > organized.length) {
                organized = allAiTopics;
              }
            }
          }
        } catch {
          // Mantém resultado local silenciosamente
        }
      }

      if (organized.length === 0) {
        // Fallback simples por linhas ou ponto
        const fallback = pastedEditalText
          .split(/\r?\n|;/)
          .map(s => s.trim())
          .filter(Boolean);
        organized = fallback;
      }

      if (organized.length === 0) {
        setErrorMsg('Não foi possível identificar tópicos válidos no texto colado.');
        return;
      }

      setTopicsList(organized);
      setStep(3);
    } finally {
      setIsProcessingText(false);
    }
  };

  // Adicionar tópico no modo manual
  const handleAddManualTopic = () => {
    const raw = manualTopicInput.trim();
    if (!raw) return;

    // Permite colar múltiplas linhas de uma vez também no campo manual se o usuário desejar
    const lines = raw
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);

    setTopicsList(prev => [...prev, ...lines]);
    setManualTopicInput('');
    setErrorMsg(null);
  };

  // Adicionar tópico extra na tela de conferência (Step 3)
  const handleAddReviewTopic = () => {
    const clean = newReviewTopicInput.trim();
    if (!clean) return;
    setTopicsList(prev => [...prev, clean]);
    setNewReviewTopicInput('');
  };

  const handleStartEditTopic = (idx: number) => {
    setEditingIndex(idx);
    setEditingText(topicsList[idx]);
  };

  const handleConfirmEditTopic = (idx: number) => {
    const clean = editingText.trim();
    if (clean) {
      setTopicsList(prev => prev.map((t, i) => (i === idx ? clean : t)));
    }
    setEditingIndex(null);
    setEditingText('');
  };

  const handleRemoveTopic = (idx: number) => {
    setTopicsList(prev => prev.filter((_, i) => i !== idx));
    if (editingIndex === idx) {
      setEditingIndex(null);
    }
  };

  // Finalizar e Salvar Matéria + Tópicos
  const handleFinalSave = async (overrideTopics?: string[]) => {
    if (!name.trim() || !onSaveNewDisciplinaWithTopics) return;
    const finalTopicsToSave = overrideTopics !== undefined ? overrideTopics : topicsList;

    setIsSaving(true);
    setErrorMsg(null);
    try {
      const sigla = code.trim() || generateSigla(name.trim());
      await onSaveNewDisciplinaWithTopics(
        {
          concursoId,
          name: name.trim(),
          code: sigla,
          weight: parseFloat(weight) || 2.0,
          color,
          order: nextOrder,
        },
        finalTopicsToSave
      );
      onClose();
    } catch {
      setErrorMsg('Erro ao salvar a matéria e seus assuntos.');
    } finally {
      setIsSaving(false);
    }
  };

  const getModalTitle = () => {
    if (editingDisciplina) return 'Editar Matéria';
    if (step === 1) return 'Nova Matéria';
    if (step === 2) return 'Inserir Assuntos da Matéria';
    return 'Conferir Tópicos Estruturados';
  };

  const getModalDescription = () => {
    if (editingDisciplina) return 'Atualize o nome, peso e cor de identificação da matéria.';
    if (step === 1) return 'Defina o nome e a cor de identificação da matéria antes de adicionar os assuntos.';
    if (step === 2) return `Escolha como deseja cadastrar os assuntos de "${name.trim()}".`;
    return `Confira, edite ou ajuste os tópicos organizados para "${name.trim()}" antes de salvar.`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getModalTitle()}
      description={getModalDescription()}
      maxWidth={step === 1 ? 'md' : 'lg'}
    >
      <div className="space-y-4 text-xs">
        {/* Indicador de Etapas (apenas para criação de Nova Matéria) */}
        {!editingDisciplina && (
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center transition-colors ${
                  step === 1
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-emerald-500/20 text-emerald-500'
                }`}
              >
                {step > 1 ? <Check className="w-3 h-3 stroke-[3]" /> : '1'}
              </span>
              <span className={`font-bold ${step === 1 ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                Nome e Cor
              </span>
            </div>

            <div className="h-px flex-1 mx-3 bg-slate-300 dark:bg-slate-700" />

            <div className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center transition-colors ${
                  step === 2
                    ? 'bg-emerald-500 text-slate-950'
                    : step > 2
                    ? 'bg-emerald-500/20 text-emerald-500'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}
              >
                {step > 2 ? <Check className="w-3 h-3 stroke-[3]" /> : '2'}
              </span>
              <span className={`font-bold ${step === 2 ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                Assuntos
              </span>
            </div>

            {inputMode === 'auto' && (
              <>
                <div className="h-px flex-1 mx-3 bg-slate-300 dark:bg-slate-700" />
                <div className="flex items-center gap-2">
                  <span
                    className={`w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center transition-colors ${
                      step === 3
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    3
                  </span>
                  <span className={`font-bold ${step === 3 ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                    Conferir
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-300 flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* =========================================================
            ETAPA 1: NOME E COR DA MATÉRIA
           ========================================================= */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <Input
              label="Nome da Matéria *"
              placeholder="Ex: Direito Administrativo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Peso da Matéria"
                type="number"
                step="0.5"
                min="0.5"
                max="10"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
              />
              <Input
                label="Código / Sigla (Opcional)"
                placeholder="Ex: DADM"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">
                Cor da Matéria
              </label>
              <div className="flex items-center gap-2 flex-wrap p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                {PALETTE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full cursor-pointer transition-all flex items-center justify-center ${
                      color.toLowerCase() === c.toLowerCase()
                        ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-emerald-500 scale-110'
                        : 'opacity-75 hover:opacity-100 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                    title={`Selecionar cor ${c}`}
                  >
                    {color.toLowerCase() === c.toLowerCase() && (
                      <Check className="w-3.5 h-3.5 text-white drop-shadow" />
                    )}
                  </button>
                ))}

                <div className="ml-auto flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-700">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border border-slate-300 dark:border-slate-700"
                    title="Cor personalizada"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSaving}
                rightIcon={!editingDisciplina ? <ArrowRight className="w-4 h-4" /> : undefined}
              >
                {editingDisciplina ? 'Salvar Alterações' : 'Continuar'}
              </Button>
            </div>
          </form>
        )}

        {/* =========================================================
            ETAPA 2: INSERIR OS ASSUNTOS DA MATÉRIA (AUTOMÁTICO OU MANUAL)
           ========================================================= */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Resumo da Matéria sendo criada */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: color }}
                />
                <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                  {name}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  Peso {weight}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer shrink-0"
              >
                Alterar nome/cor
              </button>
            </div>

            {/* Seletor de Modo: Colar do Edital (Automático) vs Manualmente */}
            <div className="grid grid-cols-2 gap-2.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <button
                type="button"
                onClick={() => {
                  setInputMode('auto');
                  setErrorMsg(null);
                }}
                className={`py-2.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  inputMode === 'auto'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs border border-emerald-500/30'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Colar do Edital (Automático)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setInputMode('manual');
                  setErrorMsg(null);
                }}
                className={`py-2.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  inputMode === 'manual'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs border border-emerald-500/30'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Edit3 className="w-4 h-4 shrink-0" />
                <span>Inserir Manualmente</span>
              </button>
            </div>

            {/* MODO 1: COLAR ASSUNTOS DO EDITAL (AUTOMÁTICO) */}
            {inputMode === 'auto' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-slate-600 dark:text-slate-300 space-y-1">
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Organização Inteligente de Tópicos</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Cole abaixo o bloco de conteúdos desta matéria direto do seu edital (mesmo que esteja em linha corrida ou numerado). O sistema irá separar e estruturar cada tópico para você conferir antes de salvar.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Assuntos da Matéria no Edital
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setPastedEditalText(
                          `1. Estado, governo e administração pública: conceitos, elementos, poderes e organização. 2. Princípios da administração pública. 3. Organização administrativa da União: administração direta e indireta. 4. Agentes públicos. 5. Poderes administrativos. 6. Atos administrativos: conceitos, requisitos, atributos, classificação e espécies. 7. Licitações e contratos administrativos (Lei nº 14.133/2021). 8. Controle e responsabilização da administração.`
                        )
                      }
                      className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Preencher exemplo
                    </button>
                  </div>
                  <textarea
                    rows={7}
                    value={pastedEditalText}
                    onChange={(e) => setPastedEditalText(e.target.value)}
                    placeholder={`Cole aqui os tópicos de ${name || 'sua matéria'} copiados do edital...\nEx: 1. Compreensão e interpretação de textos. 2. Tipologia textual. 3. Ortografia oficial...`}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-3 text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Voltar
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleFinalSave([])}
                      isLoading={isSaving}
                      className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      Salvar sem Assuntos
                    </Button>

                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleOrganizeEditalTopics}
                      isLoading={isProcessingText}
                      leftIcon={<Sparkles className="w-4 h-4" />}
                    >
                      Organizar e Conferir Tópicos
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* MODO 2: INSERIR ASSUNTOS MANUALMENTE */}
            {inputMode === 'manual' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={manualTopicInput}
                    onChange={(e) => setManualTopicInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddManualTopic();
                      }
                    }}
                    placeholder="Digite o nome do assunto/tópico e pressione Enter..."
                    className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddManualTopic}
                    leftIcon={<Plus className="w-3.5 h-3.5 text-emerald-500" />}
                    className="shrink-0 py-2"
                  >
                    Adicionar
                  </Button>
                </div>

                {/* Lista de Tópicos Adicionados Manualmente */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 p-3 space-y-2 max-h-64 overflow-y-auto">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-200/70 dark:border-slate-800">
                    <span>Tópicos da Matéria ({topicsList.length})</span>
                    {topicsList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setTopicsList([])}
                        className="text-rose-400 hover:underline font-semibold normal-case cursor-pointer"
                      >
                        Limpar todos
                      </button>
                    )}
                  </div>

                  {topicsList.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 dark:text-slate-500 space-y-1">
                      <Layers className="w-6 h-6 mx-auto opacity-50" />
                      <p>Nenhum assunto adicionado ainda.</p>
                      <p className="text-[11px]">Digite acima e clique em "Adicionar" para montar a lista.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {topicsList.map((topic, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-xs group"
                        >
                          <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>

                          {editingIndex === idx ? (
                            <div className="flex items-center gap-1 flex-1">
                              <input
                                type="text"
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleConfirmEditTopic(idx);
                                  if (e.key === 'Escape') setEditingIndex(null);
                                }}
                                autoFocus
                                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-2 py-1 rounded border border-emerald-500 text-xs outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleConfirmEditTopic(idx)}
                                className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingIndex(null)}
                                className="p-1 text-slate-400 hover:bg-slate-800 rounded cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span
                              onClick={() => handleStartEditTopic(idx)}
                              className="flex-1 font-medium text-slate-800 dark:text-slate-200 truncate cursor-pointer hover:text-emerald-500"
                              title="Clique para editar"
                            >
                              {topic}
                            </span>
                          )}

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEditTopic(idx)}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded cursor-pointer"
                              title="Editar tópico"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveTopic(idx)}
                              className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                              title="Remover tópico"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Voltar
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => handleFinalSave(topicsList)}
                    isLoading={isSaving}
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Salvar Matéria {topicsList.length > 0 ? `(${topicsList.length} tópicos)` : ''}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            ETAPA 3: CONFERÊNCIA DOS TÓPICOS ESTRUTURADOS (ANTES DE SALVAR)
           ========================================================= */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Banner de Confirmação / Resumo */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-center gap-2.5 min-w-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    {topicsList.length} {topicsList.length === 1 ? 'tópico estruturado' : 'tópicos estruturados'} em "{name}"
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Confira a lista abaixo. Você pode clicar em qualquer tópico para editar, excluir ou adicionar novos antes de salvar.
                  </p>
                </div>
              </div>
            </div>

            {/* Lista Editável de Tópicos para Conferência */}
            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
              {topicsList.length === 0 ? (
                <p className="text-center py-6 text-slate-400">
                  Todos os tópicos foram removidos. Volte ao texto ou adicione um tópico abaixo.
                </p>
              ) : (
                topicsList.map((topic, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/40 transition-colors group"
                  >
                    <span
                      className="w-5 h-5 rounded-md text-[10px] font-mono font-bold flex items-center justify-center shrink-0 text-white"
                      style={{ backgroundColor: color }}
                    >
                      {idx + 1}
                    </span>

                    {editingIndex === idx ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleConfirmEditTopic(idx);
                            if (e.key === 'Escape') setEditingIndex(null);
                          }}
                          autoFocus
                          className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-2.5 py-1 rounded-lg border border-emerald-500 text-xs outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleConfirmEditTopic(idx)}
                          className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded-lg cursor-pointer"
                          title="Confirmar edição"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingIndex(null)}
                          className="p-1 text-slate-400 hover:bg-slate-800 rounded-lg cursor-pointer"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span
                        onClick={() => handleStartEditTopic(idx)}
                        className="flex-1 font-medium text-slate-800 dark:text-slate-200 text-xs leading-snug cursor-pointer hover:text-emerald-500"
                        title="Clique para editar o nome do tópico"
                      >
                        {topic}
                      </span>
                    )}

                    {editingIndex !== idx && (
                      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => handleStartEditTopic(idx)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="Editar tópico"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveTopic(idx)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                          title="Remover tópico"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Campo rápido para acrescentar mais um tópico na conferência */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newReviewTopicInput}
                onChange={(e) => setNewReviewTopicInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddReviewTopic();
                  }
                }}
                placeholder="Adicionar mais um tópico manualmente à lista..."
                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddReviewTopic}
                leftIcon={<Plus className="w-3.5 h-3.5 text-emerald-500" />}
                className="shrink-0 py-2"
              >
                Incluir
              </Button>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Voltar ao Texto
              </Button>

              <Button
                type="button"
                variant="primary"
                onClick={() => handleFinalSave(topicsList)}
                isLoading={isSaving}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Confirmar e Salvar ({topicsList.length} tópicos)
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
