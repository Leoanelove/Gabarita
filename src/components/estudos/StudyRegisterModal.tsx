import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Layers, 
  Plus, 
  Trash2, 
  CalendarClock, 
  FileText, 
  Video, 
  HelpCircle,
  FileCheck2,
  ChevronDown,
  GraduationCap,
  CalendarCheck,
  Calendar,
  Lock,
  Search,
  Layers3
} from 'lucide-react';
import { 
  Disciplina, 
  Assunto, 
  StudySessionType,
  SessaoEstudo,
  PageInterval, 
  VideoaulaRecord 
} from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { DatabaseService } from '../../services/db';

// Máscara Estrita de Tempo (HH:MM:SS) com limite de 2 dígitos por bloco
export const handleTimeMask = (value: string): string => {
  // Remove tudo que não for dígito e limita a 6 dígitos (HHMMSS)
  const digits = value.replace(/\D/g, '').slice(0, 6);

  let hh = digits.slice(0, 2);
  let mm = digits.slice(2, 4);
  let ss = digits.slice(4, 6);

  // Validação de limites de minutos e segundos (00 a 59)
  if (mm && parseInt(mm, 10) > 59) mm = '59';
  if (ss && parseInt(ss, 10) > 59) ss = '59';

  if (digits.length <= 2) return hh;
  if (digits.length <= 4) return `${hh}:${mm}`;
  return `${hh}:${mm}:${ss}`;
};

export const normalizeTimeOnBlur = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 6);
  if (!digits) return '00:00:00';
  let hh = '00';
  let mm = '00';
  let ss = '00';
  if (digits.length <= 2) {
    hh = digits.padStart(2, '0');
  } else if (digits.length <= 4) {
    hh = digits.slice(0, 2).padStart(2, '0');
    mm = digits.slice(2, 4).padStart(2, '0');
  } else {
    hh = digits.slice(0, 2).padStart(2, '0');
    mm = digits.slice(2, 4).padStart(2, '0');
    ss = digits.slice(4, 6).padStart(2, '0');
  }
  if (parseInt(mm, 10) > 59) mm = '59';
  if (parseInt(ss, 10) > 59) ss = '59';
  return `${hh}:${mm}:${ss}`;
};

export interface StudyRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  modo?: 'cronometro' | 'manual';
  isRevisionContext?: boolean;
  disciplinas: Disciplina[];
  assuntos: Assunto[];
  initialSession?: SessaoEstudo;
  initialDisciplinaId?: string;
  initialDisciplinaName?: string;
  initialAssuntoId?: string;
  initialAssuntoName?: string;
  elapsedSeconds: number; // Tempo líquido capturado do cronômetro
  plannedMinutes?: number;
  contabilizarPlanejamento?: boolean;
  onSaveSuccess: (savedSession: {
    disciplinaId: string;
    assuntoId?: string;
    durationMinutes: number;
    durationSeconds?: number;
    plannedMinutes?: number;
    type: StudySessionType;
    questionsAttempted?: number;
    questionsCorrect?: number;
    notes?: string;
    material?: string;
    teoriaFinalizada?: boolean;
    programarRevisoes?: boolean;
    revisaoDays?: number[];
    contabilizarPlanejamento?: boolean;
    pageIntervals?: PageInterval[];
    videoaulas?: VideoaulaRecord[];
    completedAt?: string;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
  onBackToTimer?: () => void;
}

const DEFAULT_STUDY_TYPES = [
  { id: 'teoria', label: 'Teoria' },
  { id: 'questoes', label: 'Questões' },
  { id: 'revisao', label: 'Revisão' },
  { id: 'lei_seca', label: 'Lei Seca' },
  { id: 'resumo', label: 'Resumo' },
];

const DEFAULT_REVISAO_DAYS = [
  1, 7, 15, 21, 30, 45, 60, 90, 120, 180, 215, 265, 315, 365
];

const STUDY_GLASS_PALETTES: Record<'verde' | 'azul' | 'rosa' | 'roxo' | 'laranja', {
  primary: string;
  secondary: string;
  glow: string;
  soft: string;
}> = {
  verde: {
    primary: '#10B981',
    secondary: '#059669',
    glow: 'rgba(16,185,129,0.20)',
    soft: 'rgba(16,185,129,0.08)',
  },
  azul: {
    primary: '#3B82F6',
    secondary: '#2563EB',
    glow: 'rgba(59,130,246,0.20)',
    soft: 'rgba(59,130,246,0.08)',
  },
  rosa: {
    primary: '#EC4899',
    secondary: '#DB2777',
    glow: 'rgba(236,72,153,0.20)',
    soft: 'rgba(236,72,153,0.08)',
  },
  roxo: {
    primary: '#8B5CF6',
    secondary: '#7C3AED',
    glow: 'rgba(139,92,246,0.20)',
    soft: 'rgba(139,92,246,0.08)',
  },
  laranja: {
    primary: '#F97316',
    secondary: '#EA580C',
    glow: 'rgba(249,115,22,0.20)',
    soft: 'rgba(249,115,22,0.08)',
  },
};

function getStudyGlassThemeKey(context: any): 'verde' | 'azul' | 'rosa' | 'roxo' | 'laranja' {
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

export const StudyRegisterModal: React.FC<StudyRegisterModalProps> = ({
  isOpen,
  onClose,
  modo = 'cronometro',
  isRevisionContext = false,
  disciplinas,
  assuntos,
  initialSession,
  initialDisciplinaId,
  initialDisciplinaName,
  initialAssuntoId,
  initialAssuntoName,
  elapsedSeconds,
  plannedMinutes = 25,
  contabilizarPlanejamento = true,
  onSaveSuccess,
  onDelete,
  onBackToTimer,
}) => {
  const themeContext = useTheme();
  const { palette } = themeContext;
  const glassThemeKey = getStudyGlassThemeKey(themeContext);
  const glassPalette = STUDY_GLASS_PALETTES[glassThemeKey];
  const isDark = themeContext?.effectiveTheme === 'dark';
  const initialStudyType = initialSession?.type;

  // Validação de tempo e Assunto / Tópico
  const [erroTempo, setErroTempo] = useState<boolean>(false);
  const [erroTopico, setErroTopico] = useState<boolean>(false);
  const topicoSelectRef = useRef<HTMLSelectElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const durationContainerRef = useRef<HTMLDivElement>(null);
  const hoursInputRef = useRef<HTMLInputElement>(null);
  const minutesInputRef = useRef<HTMLInputElement>(null);
  const secondsInputRef = useRef<HTMLInputElement>(null);

  // Entradas de Tempo Editáveis (Pré-preenchidas pelo Cronômetro ou Zeradas no Manual)
  const [manualHours, setManualHours] = useState<string>('00');
  const [manualMinutes, setManualMinutes] = useState<string>('00');
  const [manualSeconds, setManualSeconds] = useState<string>('00');

  // Data de Registro do Estudo ('hoje' por padrão)
  const getTodayYMD = (now = new Date()) => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const [dateMode, setDateMode] = useState<'hoje' | 'ontem' | 'outro'>('hoje');
  const [customDate, setCustomDate] = useState<string>(getTodayYMD);

  // Helpers para edição de inputs de tempo (HH:MM:SS) com suporte a adição contínua (auto-avanço)
  const handleTimeInputChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    max: number,
    val: string,
    field?: 'hh' | 'mm' | 'ss'
  ) => {
    if (erroTempo) {
      setErroTempo(false);
      setErroTopico(false);
    }
    const clean = val.replace(/\D/g, '');
    if (clean === '') {
      setter('');
      return;
    }
    const digits = clean.length > 2 ? clean.slice(-2) : clean;
    const num = parseInt(digits, 10);
    const finalVal = num >= max ? String(max - 1).padStart(2, '0') : digits;
    setter(finalVal);

    // Auto-avanço contínuo: quando atinge 2 dígitos, pula para o próximo campo automaticamente
    if (digits.length === 2) {
      if (field === 'hh') {
        minutesInputRef.current?.focus();
        minutesInputRef.current?.select();
      } else if (field === 'mm') {
        secondsInputRef.current?.focus();
        secondsInputRef.current?.select();
      }
    }
  };

  // Navegação contínua pelo teclado (Backspace, Setas e Dois Pontos ':')
  const handleTimeKeyDown = (
    field: 'hh' | 'mm' | 'ss',
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    // Tecla ':' ou ';' avança imediatamente para o próximo campo
    if (e.key === ':' || e.key === ';') {
      e.preventDefault();
      if (field === 'hh') {
        setManualHours((prev) => (prev.length === 1 ? prev.padStart(2, '0') : prev));
        minutesInputRef.current?.focus();
        minutesInputRef.current?.select();
      } else if (field === 'mm') {
        setManualMinutes((prev) => (prev.length === 1 ? prev.padStart(2, '0') : prev));
        secondsInputRef.current?.focus();
        secondsInputRef.current?.select();
      }
      return;
    }

    // Tecla Backspace: se campo estiver vazio ou cursor no início, retorna para o campo anterior
    if (e.key === 'Backspace') {
      const input = e.currentTarget;
      const isAtStart = input.selectionStart === 0 && input.selectionEnd === 0;
      const isEmpty = !input.value;
      if (isAtStart || isEmpty) {
        if (field === 'ss') {
          e.preventDefault();
          minutesInputRef.current?.focus();
          minutesInputRef.current?.select();
        } else if (field === 'mm') {
          e.preventDefault();
          hoursInputRef.current?.focus();
          hoursInputRef.current?.select();
        }
      }
      return;
    }

    // Tecla Seta Direita: se cursor no fim, avança para o próximo campo
    if (e.key === 'ArrowRight') {
      const input = e.currentTarget;
      if (input.selectionStart === input.value.length && input.selectionEnd === input.value.length) {
        if (field === 'hh') {
          e.preventDefault();
          minutesInputRef.current?.focus();
          minutesInputRef.current?.select();
        } else if (field === 'mm') {
          e.preventDefault();
          secondsInputRef.current?.focus();
          secondsInputRef.current?.select();
        }
      }
      return;
    }

    // Tecla Seta Esquerda: se cursor no início, volta para o campo anterior
    if (e.key === 'ArrowLeft') {
      const input = e.currentTarget;
      if (input.selectionStart === 0 && input.selectionEnd === 0) {
        if (field === 'ss') {
          e.preventDefault();
          minutesInputRef.current?.focus();
          minutesInputRef.current?.select();
        } else if (field === 'mm') {
          e.preventDefault();
          hoursInputRef.current?.focus();
          hoursInputRef.current?.select();
        }
      }
      return;
    }
  };

  // Suporte a colar (Paste) contínuo de tempo (ex: "01:30:00", "01:30", "013000")
  const handleTimePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').trim();
    if (text.includes(':')) {
      e.preventDefault();
      const parts = text.split(':').map((p) => p.replace(/\D/g, '').slice(0, 2));
      if (parts.length >= 3) {
        setManualHours(parts[0].padStart(2, '0'));
        setManualMinutes(parts[1].padStart(2, '0'));
        setManualSeconds(parts[2].padStart(2, '0'));
        secondsInputRef.current?.focus();
      } else if (parts.length === 2) {
        setManualHours(parts[0].padStart(2, '0'));
        setManualMinutes(parts[1].padStart(2, '0'));
        setManualSeconds('00');
        secondsInputRef.current?.focus();
      }
    } else {
      const rawDigits = text.replace(/\D/g, '');
      if (rawDigits.length >= 4) {
        e.preventDefault();
        const h = rawDigits.slice(0, 2);
        const m = rawDigits.slice(2, 4);
        const s = rawDigits.slice(4, 6) || '00';
        setManualHours(h.padStart(2, '0'));
        setManualMinutes(m.padStart(2, '0'));
        setManualSeconds(s.padStart(2, '0'));
        secondsInputRef.current?.focus();
      }
    }
  };

  const handleTimeInputBlur = (
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    setter((prev) => {
      if (!prev || prev.trim() === '') return '00';
      return prev.padStart(2, '0');
    });
  };

  // Tempo total calculado em segundos (editável tanto no modo cronômetro quanto manual)
  const manualTotalSeconds = useMemo(() => {
    const h = parseInt(manualHours, 10) || 0;
    const m = parseInt(manualMinutes, 10) || 0;
    const s = parseInt(manualSeconds, 10) || 0;
    return h * 3600 + m * 60 + s;
  }, [manualHours, manualMinutes, manualSeconds]);

  // Duração ativa em minutos para relatórios, XP e persistência
  const activeDurationMinutes = useMemo(() => {
    if (manualTotalSeconds <= 0) return 0;
    return Math.max(1, Math.round(manualTotalSeconds / 60));
  }, [manualTotalSeconds]);

  // Formatação HH:MM:SS do tempo atual editado
  const formattedTimeHHMMSS = useMemo(() => {
    const h = (manualHours || '00').padStart(2, '0');
    const m = (manualMinutes || '00').padStart(2, '0');
    const s = (manualSeconds || '00').padStart(2, '0');
    return `${h}:${m}:${s}`;
  }, [manualHours, manualMinutes, manualSeconds]);

  // Formatação amigável para o rodapé ("Duração: X h Y min")
  const formattedDurationFooter = useMemo(() => {
    const h = parseInt(manualHours, 10) || 0;
    const m = parseInt(manualMinutes, 10) || 0;
    const s = parseInt(manualSeconds, 10) || 0;
    if (h === 0 && m === 0 && s === 0) {
      return '0 min';
    }
    const parts: string[] = [];
    if (h > 0) parts.push(`${h} h`);
    if (m > 0) parts.push(`${m} min`);
    else if (h === 0 && s === 0) parts.push('0 min');
    if (s > 0) parts.push(`${s} s`);
    return parts.join(' ') || '0 min';
  }, [manualHours, manualMinutes, manualSeconds]);

  // Disciplina e Assunto
  const [selectedDisciplinaId, setSelectedDisciplinaId] = useState<string>('');
  const [selectedAssuntoId, setSelectedAssuntoId] = useState<string>('');
  // Dropdown customizado de Assunto / Tópico (evita corte de texto longo)
  const [isTopicoDropdownOpen, setIsTopicoDropdownOpen] = useState(false);
  const [topicoSearchTerm, setTopicoSearchTerm] = useState('');
  const topicoDropdownContainerRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown de tópicos ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        topicoDropdownContainerRef.current &&
        !topicoDropdownContainerRef.current.contains(event.target as Node)
      ) {
        setIsTopicoDropdownOpen(false);
      }
    };
    if (isTopicoDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTopicoDropdownOpen]);

  // Pílulas de Tipo de Estudo
  const [studyType, setStudyType] = useState<StudySessionType>('teoria');
  const [customTypes, setCustomTypes] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('@gabarita:custom-study-types');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isAddingCustomType, setIsAddingCustomType] = useState<boolean>(false);
  const [newCustomTypeName, setNewCustomTypeName] = useState<string>('');

  // Checkboxes de Integração Rápida
  const [teoriaFinalizada, setTeoriaFinalizada] = useState<boolean>(false);
  const [programarRevisoes, setProgramarRevisoes] = useState<boolean>(false);
  const [revisaoDays, setRevisaoDays] = useState<number[]>(DEFAULT_REVISAO_DAYS);
  const [isAddingRevisaoDay, setIsAddingRevisaoDay] = useState<boolean>(false);
  const [newRevisaoDayInput, setNewRevisaoDayInput] = useState<string>('');

  // Card 1: Questões Simplificadas (Apenas Certas e Erradas)
  const [questoesCertas, setQuestoesCertas] = useState<number | ''>('');
  const [questoesErradas, setQuestoesErradas] = useState<number | ''>('');

  // Card 2: Páginas
  const [pageIntervals, setPageIntervals] = useState<PageInterval[]>([
    { id: 'p1', inicio: '', fim: '' }
  ]);

  // Card 3: Videoaulas
  const [videoaulas, setVideoaulas] = useState<VideoaulaRecord[]>([
    { id: 'v1', titulo: '', inicio: '00:00:00', fim: '00:00:00' }
  ]);

  // Anotações & Estado de Salvamento (sempre inicia estritamente vazio "")
  const [material, setMaterial] = useState('');
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !initialSession) return;
    const seconds = Math.max(0, Math.round(initialSession.durationSeconds || initialSession.durationMinutes * 60));
    setManualHours(String(Math.floor(seconds / 3600)).padStart(2, '0'));
    setManualMinutes(String(Math.floor((seconds % 3600) / 60)).padStart(2, '0'));
    setManualSeconds(String(seconds % 60).padStart(2, '0'));
    const originalDate = new Date(initialSession.completedAt || initialSession.createdAt);
    const originalDay = getTodayYMD(originalDate);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setDateMode(originalDay === getTodayYMD() ? 'hoje' : originalDay === getTodayYMD(yesterday) ? 'ontem' : 'outro');
    setCustomDate(originalDay);
    setSelectedDisciplinaId(initialSession.disciplinaId);
    setSelectedAssuntoId(initialSession.assuntoId || '');
    setStudyType(initialSession.type || 'teoria');
    setMaterial(initialSession.material || '');
    setNotes(initialSession.notes || '');
    setTeoriaFinalizada(Boolean(initialSession.teoriaFinalizada));
    setProgramarRevisoes(Boolean(initialSession.programarRevisoes));
    setRevisaoDays(initialSession.revisaoDays ?? DEFAULT_REVISAO_DAYS);
    const attempted = initialSession.questionsAttempted ?? 0;
    const correct = initialSession.questionsCorrect ?? 0;
    setQuestoesCertas(attempted > 0 ? correct : '');
    setQuestoesErradas(attempted > 0 ? Math.max(0, attempted - correct) : '');
    if (initialSession.pageIntervals?.length) setPageIntervals(initialSession.pageIntervals);
    if (initialSession.videoaulas?.length) setVideoaulas(initialSession.videoaulas);
  }, [isOpen, initialSession]);

  // Inicialização ao abrir o modal
  useEffect(() => {
    if (isOpen && !initialSession) {
      setErroTempo(false);
      setErroTopico(false);

      if (modo === 'manual' && (!elapsedSeconds || elapsedSeconds <= 0)) {
        setManualHours('00');
        setManualMinutes('00');
        setManualSeconds('00');
        setSelectedDisciplinaId(initialDisciplinaId || initialDisciplinaName || '');
        setSelectedAssuntoId(initialAssuntoId || initialAssuntoName || '');
      } else {
        // Modo cronômetro (ou tempo líquido vindo do Timer): pré-preenche HH:MM:SS e libera edição manual
        const safeSecs = Math.max(0, Math.round(elapsedSeconds || 0));
        const h = Math.floor(safeSecs / 3600);
        const m = Math.floor((safeSecs % 3600) / 60);
        const s = safeSecs % 60;
        setManualHours(String(h).padStart(2, '0'));
        setManualMinutes(String(m).padStart(2, '0'));
        setManualSeconds(String(s).padStart(2, '0'));
        const defaultDisc = initialDisciplinaId || (disciplinas && disciplinas[0]?.id) || initialDisciplinaName || '';
        setSelectedDisciplinaId(defaultDisc);
        setSelectedAssuntoId(initialAssuntoId || initialAssuntoName || '');
      }

      if (isRevisionContext) {
        setStudyType('revisao');
      } else {
        setStudyType('teoria');
      }

      setTeoriaFinalizada(false);
      setProgramarRevisoes(false);
      setRevisaoDays(DEFAULT_REVISAO_DAYS);
      setQuestoesCertas('');
      setQuestoesErradas('');
      setPageIntervals([{ id: `p_${Date.now()}`, inicio: '', fim: '' }]);
      setVideoaulas([{ id: `v_${Date.now()}`, titulo: '', inicio: '00:00:00', fim: '00:00:00' }]);
      setNotes(''); // OBRIGATÓRIO: iniciar estritamente vazio ("")
      setFormError(null);
      setIsSaving(false);
      setDateMode('hoje');
      setCustomDate(getTodayYMD());
    }
  }, [isOpen, initialSession, elapsedSeconds, initialDisciplinaId, initialAssuntoId, disciplinas, modo, isRevisionContext]);

  // Disciplinas deduplicadas por nome normalizado (evita matérias repetidas na lista de seleção)
  const uniqueDisciplinas = useMemo(() => {
    const seen = new Map<string, Disciplina>();
    for (const d of disciplinas) {
      const normalizedKey = d.name
        .trim()
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      if (!seen.has(normalizedKey)) {
        seen.set(normalizedKey, d);
      } else if (d.id === selectedDisciplinaId || d.id === initialDisciplinaId) {
        seen.set(normalizedKey, d);
      }
    }
    return Array.from(seen.values());
  }, [disciplinas, selectedDisciplinaId, initialDisciplinaId]);

  // Assuntos filtrados pela matéria selecionada (unificando tópicos caso existam registros duplicados da mesma matéria)
  const activeAssuntos = useMemo(() => {
    if (!selectedDisciplinaId) return [];
    const selectedDisc = disciplinas.find(d => d.id === selectedDisciplinaId);
    if (!selectedDisc) {
      return assuntos.filter(a => a.disciplinaId === selectedDisciplinaId);
    }
    const targetNameKey = selectedDisc.name
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const matchingDiscIds = new Set(
      disciplinas
        .filter(
          d =>
            d.name
              .trim()
              .toUpperCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '') === targetNameKey
        )
        .map(d => d.id)
    );
    const seenTopics = new Set<string>();
    const orderedTopics = initialSession?.assuntoId
      ? [...assuntos.filter(a => a.id === initialSession.assuntoId), ...assuntos.filter(a => a.id !== initialSession.assuntoId)]
      : assuntos;
    return orderedTopics.filter(a => {
      if (!matchingDiscIds.has(a.disciplinaId)) return false;
      const topicKey = a.name
        .trim()
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      if (seenTopics.has(topicKey)) return false;
      seenTopics.add(topicKey);
      return true;
    });
  }, [assuntos, disciplinas, selectedDisciplinaId, initialSession?.assuntoId]);

  // Cálculo Automático em Tempo Real de Questões (Certas + Erradas)
  const numCorrect = Number(questoesCertas) || 0;
  const numWrong = Number(questoesErradas) || 0;
  const totalQuestoes = numCorrect + numWrong;
  const taxaAcerto = totalQuestoes > 0 ? Math.round((numCorrect / totalQuestoes) * 100) : 0;

  // Total de Páginas Lidas
  const totalPagesRead = useMemo(() => {
    return pageIntervals.reduce((acc, curr) => {
      const fimNum = typeof curr.fim === 'number' ? curr.fim : NaN;
      const inicioNum = typeof curr.inicio === 'number' ? curr.inicio : (!isNaN(fimNum) && fimNum > 0 ? 1 : NaN);
      if (!isNaN(inicioNum) && !isNaN(fimNum) && fimNum >= inicioNum) {
        return acc + (fimNum - inicioNum + 1);
      }
      return acc;
    }, 0);
  }, [pageIntervals]);

  // Gerenciamento de Tipos de Estudo Customizados
  const handleAddCustomType = () => {
    const trimmed = newCustomTypeName.trim();
    if (!trimmed) return;
    if (!customTypes.includes(trimmed)) {
      const updated = [...customTypes, trimmed];
      setCustomTypes(updated);
      try {
        localStorage.setItem('@gabarita:custom-study-types', JSON.stringify(updated));
      } catch (e) {
        console.warn('Erro ao salvar custom types:', e);
      }
    }
    setStudyType(trimmed);
    setNewCustomTypeName('');
    setIsAddingCustomType(false);
  };

  const handleRemoveCustomType = (typeName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customTypes.filter(t => t !== typeName);
    setCustomTypes(updated);
    try {
      localStorage.setItem('@gabarita:custom-study-types', JSON.stringify(updated));
    } catch (e) {
      console.warn('Erro ao salvar custom types:', e);
    }
    if (studyType === typeName) {
      setStudyType('teoria');
    }
  };

  // Gerenciamento de Chips de Revisão
  const handleRemoveRevisaoDay = (day: number) => {
    setRevisaoDays(prev => prev.filter(d => d !== day));
  };

  const handleAddRevisaoDay = () => {
    const parsed = parseInt(newRevisaoDayInput.trim(), 10);
    if (!isNaN(parsed) && parsed > 0 && !revisaoDays.includes(parsed)) {
      const updated = [...revisaoDays, parsed].sort((a, b) => a - b);
      setRevisaoDays(updated);
    }
    setNewRevisaoDayInput('');
    setIsAddingRevisaoDay(false);
  };

  // Gerenciamento de Páginas
  const handleAddPageInterval = () => {
    setPageIntervals(prev => [
      ...prev,
      { id: `p_${Date.now()}`, inicio: '', fim: '' }
    ]);
  };

  const handleUpdatePageInterval = (id: string, field: 'inicio' | 'fim', value: string) => {
    const num = value === '' ? '' : parseInt(value, 10);
    setPageIntervals(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, [field]: isNaN(num as number) ? '' : num };
      }
      return p;
    }));
  };

  const handleRemovePageInterval = (id: string) => {
    if (pageIntervals.length <= 1) {
      setPageIntervals([{ id: `p_${Date.now()}`, inicio: '', fim: '' }]);
      return;
    }
    setPageIntervals(prev => prev.filter(p => p.id !== id));
  };

  // Gerenciamento de Videoaulas com Máscara Estrita HH:MM:SS
  const handleAddVideoaula = () => {
    setVideoaulas(prev => [
      ...prev,
      { id: `v_${Date.now()}`, titulo: '', inicio: '00:00:00', fim: '00:00:00' }
    ]);
  };

  const handleUpdateVideoaula = (id: string, field: keyof VideoaulaRecord, value: string) => {
    const nextValue = field === 'inicio' || field === 'fim' ? handleTimeMask(value) : value;
    setVideoaulas(prev => prev.map(v => {
      if (v.id === id) {
        return { ...v, [field]: nextValue };
      }
      return v;
    }));
  };

  const handleBlurVideoaulaTime = (id: string, field: 'inicio' | 'fim', value: string) => {
    const normalized = normalizeTimeOnBlur(value);
    setVideoaulas(prev => prev.map(v => {
      if (v.id === id) {
        return { ...v, [field]: normalized };
      }
      return v;
    }));
  };

  const handleRemoveVideoaula = (id: string) => {
    if (videoaulas.length <= 1) {
      setVideoaulas([{ id: `v_${Date.now()}`, titulo: '', inicio: '00:00:00', fim: '00:00:00' }]);
      return;
    }
    setVideoaulas(prev => prev.filter(v => v.id !== id));
  };

  // Validação do Formulário
  const isFormValid = useMemo(() => {
    if (!selectedDisciplinaId) return false;
    return true;
  }, [selectedDisciplinaId]);

  // Finalizar e Salvar Estudo
  const handleFinalSave = async () => {
    if (!selectedDisciplinaId) {
      setFormError('Selecione uma disciplina para registrar o estudo.');
      return;
    }

    // Validação Bloqueante: Assunto / Tópico é estritamente obrigatório
    const isTopicoInvalido = !initialSession && (!selectedAssuntoId ||
      selectedAssuntoId.trim() === '' || 
      selectedAssuntoId === 'Selecione o Tópico' || 
      selectedAssuntoId === 'Selecione o Assunto') && !initialAssuntoName;

    if (isTopicoInvalido) {
      setErroTopico(true);
      setFormError('Por favor, selecione um assunto ou tópico para salvar o estudo.');
      if (topicoSelectRef.current) {
        topicoSelectRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        topicoSelectRef.current.focus();
      }
      return;
    }

    if (manualTotalSeconds <= 0) {
      setErroTempo(true);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (durationContainerRef.current) {
        durationContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      setTimeout(() => {
        if (minutesInputRef.current) {
          minutesInputRef.current.focus();
          minutesInputRef.current.select();
        } else if (hoursInputRef.current) {
          hoursInputRef.current.focus();
          hoursInputRef.current.select();
        }
      }, 100);
      return;
    }

    setFormError(null);
    setIsSaving(true);

    try {
      // 1. Filtragem e normalização de intervalos de páginas válidos (se início vazio e fim preenchido, assume início = 1)
      const validPageIntervals: PageInterval[] = pageIntervals
        .map((p): PageInterval => {
          const fimVal: number | '' = typeof p.fim === 'number' ? p.fim : '';
          const inicioVal: number | '' = typeof p.inicio === 'number' ? p.inicio : (typeof fimVal === 'number' && fimVal > 0 ? 1 : '');
          return { ...p, inicio: inicioVal, fim: fimVal };
        })
        .filter(
          p => typeof p.inicio === 'number' && typeof p.fim === 'number' && p.fim >= p.inicio
        );

      // 2. Filtragem e normalização de videoaulas preenchidas
      const validVideoaulas = videoaulas
        .filter(v => v.titulo.trim().length > 0 || Boolean(initialSession && v.fim && v.fim !== '00:00:00'))
        .map(v => ({
          ...v,
          inicio: normalizeTimeOnBlur(v.inicio),
          fim: normalizeTimeOnBlur(v.fim),
        }));

      // 3. Montagem de anotações enriquecidas preservando texto do usuário
      let enrichedNotes = notes.trim();
      const extraNotesParts: string[] = [];

      if (validPageIntervals.length > 0) {
        const pagesText = validPageIntervals
          .map(p => `pág. ${p.inicio}-${p.fim}`)
          .join(', ');
        extraNotesParts.push(`Páginas lidas: ${pagesText} (${totalPagesRead} pág.)`);
      }

      if (validVideoaulas.length > 0) {
        const videosText = validVideoaulas
          .map(v => `${v.titulo} (${v.inicio} a ${v.fim})`)
          .join('; ');
        extraNotesParts.push(`Videoaulas: ${videosText}`);
      }

      if (extraNotesParts.length > 0) {
        enrichedNotes = enrichedNotes
          ? `${enrichedNotes}\n\n[Recursos]: ${extraNotesParts.join(' | ')}`
          : `[Recursos]: ${extraNotesParts.join(' | ')}`;
      }

      // Calcular data de registro selecionada (Hoje, Ontem ou Outro)
      const now = new Date();
      let selectedSessionDate = new Date();
      if (dateMode === 'ontem') {
        selectedSessionDate.setDate(now.getDate() - 1);
      } else if (dateMode === 'outro' && customDate) {
        const [y, m, d] = customDate.split('-').map(Number);
        if (y && m && d) {
          selectedSessionDate = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());
        }
      }

      const originalDate = initialSession?.completedAt || initialSession?.createdAt;
      if (initialSession && dateMode === 'outro' && !customDate) {
        setFormError('Informe a data do estudo.');
        return;
      }

      // 4. Salvar sessão principal via callback (inclui programação de revisões nos dias selecionados)
      await onSaveSuccess({
        disciplinaId: selectedDisciplinaId,
        assuntoId: selectedAssuntoId || undefined,
        durationMinutes: activeDurationMinutes,
        durationSeconds: manualTotalSeconds,
        plannedMinutes: initialSession ? initialSession.plannedMinutes : modo === 'manual' ? activeDurationMinutes : plannedMinutes,
        type: isRevisionContext ? 'revisao' : studyType,
        questionsAttempted: totalQuestoes > 0 ? totalQuestoes : undefined,
        questionsCorrect: totalQuestoes > 0 ? numCorrect : undefined,
        notes: enrichedNotes,
        ...(initialSession && { material: material.trim() }),
        teoriaFinalizada,
        programarRevisoes,
        revisaoDays: programarRevisoes ? revisaoDays : undefined,
        contabilizarPlanejamento: initialSession ? initialSession.contabilizarPlanejamento : contabilizarPlanejamento !== false,
        pageIntervals: validPageIntervals,
        videoaulas: validVideoaulas,
        completedAt: originalDate && getTodayYMD(new Date(originalDate)) === getTodayYMD(selectedSessionDate)
          ? originalDate
          : selectedSessionDate.toISOString(),
      });

      // 5. Integração Rápida: TEORIA FINALIZADA -> Atualizar no Edital Verticalizado
      if (!initialSession && teoriaFinalizada && selectedAssuntoId) {
        try {
          await DatabaseService.updateAssuntoStatus(selectedAssuntoId, 'dominado');
        } catch (e) {
          console.warn('Erro ao atualizar status do assunto no edital:', e);
        }
      }

      onClose();
    } catch (err) {
      console.error('Erro ao finalizar registro de estudo:', err);
      setFormError('Ocorreu um erro ao gravar o estudo. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={isSaving ? undefined : onClose}
      />

      {/* Caixa do Modal de Registro */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]">
        
        {/* CABEÇALHO */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md shrink-0 space-y-3 sm:space-y-3.5">
          {/* Linha Superior: Ícone, Título, Subtítulo, Seletor de Data no Canto Superior Direito e Botão Fechar (X) */}
          <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full border flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${palette.primary}15`,
                  borderColor: `${palette.primary}30`,
                  color: palette.primary,
                }}
              >
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white tracking-tight leading-tight">
                    {initialSession ? 'Editar Registro de Estudo' : 'Registro de Estudo'}
                  </h2>
                  {modo === 'manual' && !initialSession && (
                    <span className="study-modal-theme-badge px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700/60">
                      Manual
                    </span>
                  )}
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 font-normal">
                  {initialSession ? 'Atualize os dados desta sessão no Histórico' : modo === 'manual' ? 'Preencha os dados e a duração estudada da sessão' : 'Mantenha o ritmo e registre seu progresso'}
                </p>
              </div>
            </div>

            {/* Canto Superior Direito: Seletor de Data de Registro + Botão Fechar (X) */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto sm:ml-0">
              {/* Seletor de Data de Registro: [Hoje | Ontem | Outro] */}
              <div className="flex items-center gap-2 shrink-0">
                <CalendarCheck 
                  className="w-4 h-4 shrink-0 hidden xs:block transition-colors" 
                  style={{ color: palette.primary }} 
                />
                <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 h-9 shadow-xs">
                  {(['hoje', 'ontem', 'outro'] as const).map((opt) => {
                    const isSelected = dateMode === opt;
                    const label = opt === 'hoje' ? 'Hoje' : opt === 'ontem' ? 'Ontem' : 'Outro';
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDateMode(opt)}
                        className={`h-7 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none flex items-center justify-center ${
                          isSelected
                            ? 'text-white font-bold shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                        style={isSelected ? { backgroundColor: palette.primary } : undefined}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {dateMode === 'outro' && (
                  <div className="relative flex items-center animate-in fade-in duration-150">
                    <input
                      type="date"
                      value={customDate}
                      max={getTodayYMD()}
                      onChange={(e) => setCustomDate(e.target.value)}
                      onClick={(e) => {
                        try {
                          (e.target as HTMLInputElement).showPicker?.();
                        } catch {}
                      }}
                      className="themed-date-input h-9 pl-2.5 pr-8 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 shadow-2xs cursor-pointer transition-colors"
                      style={{
                        accentColor: palette.primary,
                        outlineColor: palette.primary,
                      }}
                    />
                    <div 
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center transition-colors"
                      style={{ color: palette.primary }}
                    >
                      <Calendar className="w-4 h-4 stroke-[2.2]" style={{ color: palette.primary }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Botão Fechar (X) */}
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Fechar janela"
                aria-label="Fechar janela"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Segunda Linha (se houver elementos do modo cronômetro): Tempo Líquido / Voltar ao Timer */}
          {modo === 'cronometro' && (
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap w-full pt-1">
              <span 
                className="h-9 px-3.5 rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-2 whitespace-nowrap border shrink-0"
                style={{
                  backgroundColor: `${palette.primary}15`,
                  borderColor: `${palette.primary}40`,
                  color: palette.primary,
                }}
              >
                <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: palette.primary }} />
                <span>Tempo Líquido: {activeDurationMinutes} min ({formattedTimeHHMMSS})</span>
              </span>

              {onBackToTimer && (
                <button
                  type="button"
                  onClick={onBackToTimer}
                  className="h-9 px-3.5 rounded-xl text-xs font-semibold inline-flex items-center gap-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors shadow-xs cursor-pointer whitespace-nowrap active:scale-95 shrink-0"
                  title="Voltar ao Cronômetro"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                  <span>Voltar ao Timer</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Mensagem de Erro de Validação */}
        {formError && (
          <div className="px-5 py-2.5 bg-rose-500/10 border-b border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center justify-between">
            <span>{formError}</span>
            <button type="button" onClick={() => setFormError(null)} className="text-rose-500 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* CONTEÚDO ROLÁVEL */}
        <div ref={scrollContainerRef} className="overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar text-xs sm:text-sm">
          
          {/* SEÇÃO 1: CAMPOS BASE (Disciplina, Assunto, Tempo de Estudo Editável, Tipo de Estudo) */}
          <div
            className="study-register-glass-banner relative rounded-2xl border p-4 sm:p-5 transition-all duration-300"
            style={{
              borderColor: `${glassPalette.primary}66`,
              background: isDark
                ? `radial-gradient(circle at 95% 5%, ${glassPalette.glow}, transparent 45%), linear-gradient(125deg, ${glassPalette.soft}, rgba(15,23,42,0.92) 55%, ${glassPalette.soft})`
                : `radial-gradient(circle at 95% 5%, ${glassPalette.glow}, transparent 45%), linear-gradient(125deg, ${glassPalette.soft}, rgba(255,255,255,0.88) 55%, ${glassPalette.soft})`,
              boxShadow: `0 8px 24px -4px ${glassPalette.glow}, 0 2px 6px -1px rgba(0,0,0,0.06)`,
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
            }}
          >
            {/* Elementos vetoriais decorativos */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
              <div
                className="pointer-events-none absolute -right-8 -top-12 h-36 w-36 rounded-full blur-2xl"
                style={{ background: glassPalette.glow }}
              />
              <div className="pointer-events-none absolute right-8 bottom-0 opacity-10">
                <Layers3
                  className="h-24 w-24"
                  style={{ color: glassPalette.primary }}
                />
              </div>
            </div>

            <div className="relative z-10 space-y-4">
              {/* Selects: Disciplina, Assunto e Tempo de estudo (sempre visível e 100% editável) */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-start">
              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" style={{ color: palette.primary }} />
                    <span>Disciplina *</span>
                  </span>
                  {isRevisionContext && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                </label>
                <div className="relative">
                  <select
                    value={selectedDisciplinaId}
                    disabled={isRevisionContext}
                    onChange={(e) => {
                      if (isRevisionContext) return;
                      setSelectedDisciplinaId(e.target.value);
                      setSelectedAssuntoId('');
                      setErroTopico(false);
                    }}
                    className={`w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/40 appearance-none pr-8 font-medium shadow-xs ${
                      isRevisionContext
                        ? 'bg-slate-100 dark:bg-slate-800/80 cursor-not-allowed opacity-85'
                        : 'bg-white dark:bg-slate-900 cursor-pointer'
                    }`}
                  >
                    <option value="">Selecione a Disciplina</option>
                    {uniqueDisciplinas.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                    {isRevisionContext && selectedDisciplinaId && !uniqueDisciplinas.some(d => d.id === selectedDisciplinaId) && (
                      <option value={selectedDisciplinaId}>{initialDisciplinaName || selectedDisciplinaId}</option>
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="sm:col-span-5" ref={topicoDropdownContainerRef}>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" style={{ color: palette.primary }} />
                    <span>Assunto / Tópico{initialSession ? '' : ' *'}</span>
                  </span>
                  {isRevisionContext && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                </label>
                
                <div className="relative">
                  {/* Botão Gatilho do Dropdown Customizado */}
                  <button
                    type="button"
                    ref={topicoSelectRef as any}
                    disabled={isRevisionContext || !selectedDisciplinaId}
                    onClick={() => {
                      if (isRevisionContext || !selectedDisciplinaId) return;
                      setIsTopicoDropdownOpen(!isTopicoDropdownOpen);
                      setTopicoSearchTerm('');
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs sm:text-sm flex items-center justify-between gap-2 shadow-xs transition-colors cursor-pointer ${
                      isRevisionContext || !selectedDisciplinaId
                        ? 'bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 cursor-not-allowed opacity-85'
                        : erroTopico
                        ? 'bg-white dark:bg-slate-900 border-rose-500 ring-2 ring-rose-500/30'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
                    }`}
                  >
                    <span className="truncate text-slate-900 dark:text-white font-medium">
                      {selectedAssuntoId
                        ? activeAssuntos.find(a => a.id === selectedAssuntoId)?.name || (selectedAssuntoId === initialSession?.assuntoId ? initialSession.assuntoName : initialAssuntoName) || 'Selecione o Tópico'
                        : initialAssuntoName
                        ? initialAssuntoName
                        : !selectedDisciplinaId
                        ? 'Primeiro selecione a Disciplina'
                        : 'Selecione o Tópico'}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                        isTopicoDropdownOpen ? 'rotate-180' : ''
                      } ${erroTopico ? 'text-rose-500' : 'text-slate-400'}`}
                    />
                  </button>

                  {/* Menu Popover Flutuante com Busca e Quebra de Linha Completa */}
                  {isTopicoDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                      {/* Campo de pesquisa rápida */}
                      <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            autoFocus
                            value={topicoSearchTerm}
                            onChange={(e) => setTopicoSearchTerm(e.target.value)}
                            placeholder="Buscar tópico por palavra-chave..."
                            className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Lista rolável que quebra linha sem cortar */}
                      <div className="max-h-64 overflow-y-auto custom-scrollbar p-1 space-y-0.5">
                        {initialSession && selectedAssuntoId && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAssuntoId('');
                              setIsTopicoDropdownOpen(false);
                            }}
                            className="w-full rounded-xl p-2.5 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            Sem tópico
                          </button>
                        )}
                        {activeAssuntos.filter(a =>
                          !topicoSearchTerm.trim() ||
                          a.name.toLowerCase().includes(topicoSearchTerm.toLowerCase())
                        ).length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400">
                            Nenhum tópico encontrado.
                          </div>
                        ) : (
                          activeAssuntos
                            .filter(a =>
                              !topicoSearchTerm.trim() ||
                              a.name.toLowerCase().includes(topicoSearchTerm.toLowerCase())
                            )
                            .map((a) => {
                              const isSelected = selectedAssuntoId === a.id;
                              return (
                                <button
                                  key={a.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedAssuntoId(a.id);
                                    setErroTopico(false);
                                    setIsTopicoDropdownOpen(false);
                                  }}
                                  className={`w-full text-left p-2.5 rounded-xl text-xs sm:text-sm transition-colors flex items-start gap-2 cursor-pointer ${
                                    isSelected
                                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold'
                                      : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
                                  }`}
                                >
                                  <span className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                                    {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                                  </span>
                                  <span className="leading-relaxed whitespace-normal break-words flex-1">
                                    {a.name}
                                  </span>
                                </button>
                              );
                            })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {erroTopico && (
                  <p className="text-xs text-rose-500 mt-1 font-semibold animate-in fade-in duration-200">
                    Por favor, selecione um assunto ou tópico para salvar o estudo.
                  </p>
                )}
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" style={{ color: palette.primary }} />
                  <span>Tempo de estudo *</span>
                </label>
                <div
                  ref={durationContainerRef}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border bg-white dark:bg-slate-900 transition-all duration-300 shadow-xs ${
                    erroTempo
                      ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20 animate-shake-gentle'
                      : 'border-slate-300 dark:border-slate-700 focus-within:ring-2 focus-within:ring-slate-400/40'
                  }`}
                >
                  <Clock className={`w-4 h-4 shrink-0 mr-1.5 transition-colors ${erroTempo ? 'text-rose-500 animate-pulse' : 'text-slate-400 dark:text-slate-500'}`} />
                  <div className="flex items-center justify-center flex-1 font-mono text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                    <input
                      ref={hoursInputRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={3}
                      value={manualHours}
                      onChange={(e) => handleTimeInputChange(setManualHours, 100, e.target.value, 'hh')}
                      onKeyDown={(e) => handleTimeKeyDown('hh', e)}
                      onPaste={handleTimePaste}
                      onBlur={(e) => {
                        if (
                          e.relatedTarget === hoursInputRef.current ||
                          e.relatedTarget === minutesInputRef.current ||
                          e.relatedTarget === secondsInputRef.current
                        ) {
                          return;
                        }
                        handleTimeInputBlur(setManualHours);
                      }}
                      onFocus={(e) => e.target.select()}
                      className="w-7 text-center bg-transparent focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800 rounded px-0.5"
                      placeholder="00"
                      title="Horas estudadas"
                      aria-label="Horas estudadas"
                    />
                    <span className={`mx-0.5 font-bold ${erroTempo ? 'text-rose-400' : 'text-slate-400 dark:text-slate-500'}`}>:</span>
                    <input
                      ref={minutesInputRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={3}
                      value={manualMinutes}
                      onChange={(e) => handleTimeInputChange(setManualMinutes, 60, e.target.value, 'mm')}
                      onKeyDown={(e) => handleTimeKeyDown('mm', e)}
                      onPaste={handleTimePaste}
                      onBlur={(e) => {
                        if (
                          e.relatedTarget === hoursInputRef.current ||
                          e.relatedTarget === minutesInputRef.current ||
                          e.relatedTarget === secondsInputRef.current
                        ) {
                          return;
                        }
                        handleTimeInputBlur(setManualMinutes);
                      }}
                      onFocus={(e) => e.target.select()}
                      className="w-7 text-center bg-transparent focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800 rounded px-0.5"
                      placeholder="00"
                      title="Minutos estudados"
                      aria-label="Minutos estudados"
                    />
                    <span className={`mx-0.5 font-bold ${erroTempo ? 'text-rose-400' : 'text-slate-400 dark:text-slate-500'}`}>:</span>
                    <input
                      ref={secondsInputRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={3}
                      value={manualSeconds}
                      onChange={(e) => handleTimeInputChange(setManualSeconds, 60, e.target.value, 'ss')}
                      onKeyDown={(e) => handleTimeKeyDown('ss', e)}
                      onPaste={handleTimePaste}
                      onBlur={(e) => {
                        if (
                          e.relatedTarget === hoursInputRef.current ||
                          e.relatedTarget === minutesInputRef.current ||
                          e.relatedTarget === secondsInputRef.current
                        ) {
                          return;
                        }
                        handleTimeInputBlur(setManualSeconds);
                      }}
                      onFocus={(e) => e.target.select()}
                      className="w-7 text-center bg-transparent focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800 rounded px-0.5"
                      placeholder="00"
                      title="Segundos estudados"
                      aria-label="Segundos estudados"
                    />
                  </div>
                </div>
                {erroTempo && (
                  <p className="text-xs text-rose-500 mt-1 font-semibold animate-in fade-in duration-200">
                    Preencha o tempo estudado.
                  </p>
                )}
              </div>
            </div>

            {/* Pílulas "Tipo de Estudo" + Botão "+" Customizado */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>Tipo de Estudo</span>
                  {isRevisionContext && <Lock className="w-3 h-3 text-slate-400" />}
                </label>
                <span className="text-[11px] text-slate-400">
                  {isRevisionContext ? 'Fixado em Revisão para este agendamento' : 'Selecione ou adicione um formato customizado'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Pílulas Padrão */}
                {[
                  ...DEFAULT_STUDY_TYPES,
                  ...(initialStudyType && !DEFAULT_STUDY_TYPES.some(item => item.id === initialStudyType)
                    && !customTypes.includes(initialStudyType)
                    ? [{ id: initialStudyType, label: initialStudyType.replace(/_/g, ' ') }]
                    : []),
                ].map(item => {
                  const isSelected = (isRevisionContext ? 'revisao' : studyType) === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={isRevisionContext && item.id !== 'revisao'}
                      onClick={() => {
                        if (!isRevisionContext) setStudyType(item.id as StudySessionType);
                      }}
                      className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all shadow-xs select-none ${
                        isSelected 
                          ? "study-type-pill-active text-white font-bold shadow-sm cursor-pointer" 
                          : isRevisionContext
                          ? "study-type-pill-inactive bg-slate-100 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-60"
                          : "study-type-pill-inactive bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer"
                      }`}
                      style={isSelected ? {
                        backgroundColor: palette.primary,
                        borderColor: palette.primary,
                        color: "#ffffff",
                      } : undefined}
                    >
                      {item.label}
                    </button>
                  );
                })}

                {/* Pílulas Customizadas */}
                {!isRevisionContext && customTypes.map(cType => {
                  const isSelected = studyType === cType;
                  return (
                    <div 
                      key={cType}
                      onClick={() => setStudyType(cType)}
                      className={`group py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs flex items-center gap-1.5 select-none ${
                        isSelected 
                          ? "study-type-pill-active text-white font-bold shadow-sm" 
                          : "study-type-pill-inactive bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                      style={isSelected ? {
                        backgroundColor: palette.primary,
                        borderColor: palette.primary,
                        color: "#ffffff",
                      } : undefined}
                    >
                      <span>{cType}</span>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveCustomType(cType, e)}
                        className="opacity-70 hover:opacity-100 text-white hover:text-rose-200 transition-opacity"
                        title="Remover categoria customizada"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}

                {/* Botão "+" para Cadastrar Categoria Inline */}
                {!isRevisionContext && (!isAddingCustomType ? (
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomType(true)}
                    className="p-1.5 px-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-500 flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer"
                    title="Adicionar nova categoria de estudo"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Novo Tipo</span>
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-1 rounded-xl shadow-xs animate-in fade-in">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Ex: Flashcards, Artigos..."
                      value={newCustomTypeName}
                      onChange={(e) => setNewCustomTypeName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomType();
                        } else if (e.key === 'Escape') {
                          setIsAddingCustomType(false);
                        }
                      }}
                      className="px-2 py-1 text-xs bg-transparent text-slate-900 dark:text-white focus:outline-none w-36"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomType}
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      OK
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingCustomType(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            </div>
          </div>

          {initialSession && (
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Material (opcional)
              <input
                value={material}
                onChange={event => setMaterial(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-900"
              />
            </label>
          )}

          {/* SEÇÃO 2: CARDS DE AUTOMAÇÃO LADO A LADO (Grid 2 Colunas) */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              {/* Coluna Esquerda (Card 1): Teoria Finalizada */}
              <label
                className={`h-full p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                  teoriaFinalizada
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-1 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={teoriaFinalizada}
                  onChange={(e) => setTeoriaFinalizada(e.target.checked)}
                  className="mt-1 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer accent-emerald-600 shrink-0"
                />
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Concluiu Tópico?</span>
                    </span>
                    <span className="study-modal-theme-badge px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60">
                      Edital Verticalizado
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Marca este tópico como concluído e superado no edital verticalizado ao salvar a sessão.
                  </p>
                </div>
              </label>

              {/* Coluna Direita (Card 2): Programar Revisões */}
              <label
                className={`h-full p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                  programarRevisoes
                    ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/20 ring-1 ring-purple-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={programarRevisoes}
                  onChange={(e) => setProgramarRevisoes(e.target.checked)}
                  className="mt-1 rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer accent-purple-600 shrink-0"
                />
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <CalendarClock className="w-4 h-4 text-purple-500 shrink-0" />
                      <span> Programar Revisões</span>
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-300/60 dark:border-purple-700/60">
                      SRS Ativo
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Gera agendamentos espaçados automáticos para este conteúdo nos intervalos selecionados.
                  </p>
                </div>
              </label>
            </div>

            {/* Container Expansível com Chips de Prazos de Revisão */}
            {programarRevisoes && (
              <div className="p-3.5 rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 animate-in fade-in">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-purple-900 dark:text-purple-300">
                    Prazos de retorno ({revisaoDays.length} revisões programadas):
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Clique no &apos;x&apos; para remover ou &apos;+&apos; para novo prazo
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {revisaoDays.map(days => (
                    <span
                      key={days}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700/80 shadow-2xs"
                    >
                      <span>{days}d</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRevisaoDay(days)}
                        className="hover:text-rose-500 transition-colors p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                        title={`Remover revisão de ${days} dias`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  {/* Botão '+' para Inserir Novo Prazo de Dias */}
                  {!isAddingRevisaoDay ? (
                    <button
                      type="button"
                      onClick={() => setIsAddingRevisaoDay(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border border-dashed border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-100/50 dark:hover:bg-purple-950/50 transition-colors cursor-pointer"
                      title="Adicionar novo intervalo de dias"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Novo prazo</span>
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 p-1 rounded-lg shadow-xs">
                      <input
                        type="number"
                        autoFocus
                        min="1"
                        max="999"
                        placeholder="Dias (ex: 14)"
                        value={newRevisaoDayInput}
                        onChange={(e) => setNewRevisaoDayInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddRevisaoDay();
                          } else if (e.key === 'Escape') {
                            setIsAddingRevisaoDay(false);
                          }
                        }}
                        className="px-2 py-0.5 text-xs font-mono bg-transparent text-slate-900 dark:text-white focus:outline-none w-20"
                      />
                      <button
                        type="button"
                        onClick={handleAddRevisaoDay}
                        className="px-2 py-0.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-[11px] font-bold cursor-pointer"
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingRevisaoDay(false)}
                        className="p-1 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SEÇÃO 3: CARDS DE RECURSOS E MATERIAIS (Layout em 3 Colunas) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            
            {/* CARD 1: QUESTÕES (Apenas Certas e Erradas com Cálculo Automático) */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>Questões</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      totalQuestoes === 0
                        ? 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800'
                        : taxaAcerto >= 75
                        ? 'study-reg-badge-verde text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30'
                        : taxaAcerto >= 50
                        ? 'text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30'
                        : 'study-reg-badge-vermelho text-rose-700 dark:text-rose-300 bg-rose-500/15 border border-rose-500/30'
                    }`}
                  >
                    {taxaAcerto}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-0.5 items-end">
                  <div className="flex flex-col justify-end">
                    <label className="study-reg-certas-label block text-[11px] font-bold text-emerald-600 dark:text-emerald-400 min-h-[32px] flex items-end pb-1 leading-tight">
                      Certas (Acertos)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={questoesCertas}
                      onChange={(e) =>
                        setQuestoesCertas(
                          e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10))
                        )
                      }
                      placeholder="Ex: 17"
                      className="study-reg-certas-input w-full h-10 px-2.5 rounded-xl border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100 font-bold text-sm text-center focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="study-reg-erradas-label block text-[11px] font-bold text-rose-600 dark:text-rose-400 min-h-[32px] flex items-end pb-1 leading-tight">
                      Erradas (Erros)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={questoesErradas}
                      onChange={(e) =>
                        setQuestoesErradas(
                          e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10))
                        )
                      }
                      placeholder="Ex: 3"
                      className="study-reg-erradas-input w-full h-10 px-2.5 rounded-xl border border-rose-300 dark:border-rose-500/40 bg-rose-50/60 dark:bg-rose-950/30 text-rose-950 dark:text-rose-100 font-bold text-sm text-center focus:border-rose-500 dark:focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: PÁGINAS */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-amber-500" />
                    <span>Páginas Lidas</span>
                  </span>
                  {totalPagesRead > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60">
                      {totalPagesRead} pág.
                    </span>
                  )}
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {pageIntervals.map((interval) => (
                    <div key={interval.id} className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="flex-1">
                        <span className="block text-[10px] text-slate-400 mb-0.5">Início</span>
                        <input
                          type="number"
                          min="1"
                          placeholder="Ex: 10"
                          value={interval.inicio}
                          onChange={(e) => handleUpdatePageInterval(interval.id, 'inicio', e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono focus:outline-none"
                        />
                      </div>
                      <span className="text-slate-400 font-bold mt-3">a</span>
                      <div className="flex-1">
                        <span className="block text-[10px] text-slate-400 mb-0.5">Fim</span>
                        <input
                          type="number"
                          min="1"
                          placeholder="Ex: 25"
                          value={interval.fim}
                          onChange={(e) => handleUpdatePageInterval(interval.id, 'fim', e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono focus:outline-none"
                        />
                      </div>
                      {pageIntervals.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePageInterval(interval.id)}
                          className="text-slate-400 hover:text-rose-500 mt-3 p-1 rounded-md"
                          title="Remover intervalo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddPageInterval}
                className="mt-3 w-full py-1.5 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar outro intervalo</span>
              </button>
            </div>

            {/* CARD 3: VIDEOAULAS (Máscara Estrita HH:MM:SS de 2 dígitos por bloco) */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-purple-500" />
                    <span>Videoaulas</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {videoaulas.filter(v => v.titulo.trim()).length} assistidas
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {videoaulas.map((item) => (
                    <div key={item.id} className="p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <input
                          type="text"
                          placeholder="Título / Nome do Vídeo"
                          value={item.titulo}
                          onChange={(e) => handleUpdateVideoaula(item.id, 'titulo', e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none"
                        />
                        {videoaulas.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVideoaula(item.id)}
                            className="text-slate-400 hover:text-rose-500 p-1"
                            title="Remover vídeo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="flex-1">
                          <span className="block text-[9px] text-slate-400">Início (HH:MM:SS)</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={8}
                            placeholder="00:00:00"
                            value={item.inicio}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handleUpdateVideoaula(item.id, 'inicio', e.target.value)}
                            onBlur={(e) => handleBlurVideoaulaTime(item.id, 'inicio', e.target.value)}
                            className="w-full p-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-[11px] font-mono text-center focus:outline-none"
                          />
                        </div>
                        <div className="flex-1">
                          <span className="block text-[9px] text-slate-400">Fim (HH:MM:SS)</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={8}
                            placeholder="00:45:00"
                            value={item.fim}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handleUpdateVideoaula(item.id, 'fim', e.target.value)}
                            onBlur={(e) => handleBlurVideoaulaTime(item.id, 'fim', e.target.value)}
                            className="w-full p-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-[11px] font-mono text-center focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddVideoaula}
                className="mt-3 w-full py-1.5 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar videoaula</span>
              </button>
            </div>

          </div>

          {/* SEÇÃO 4: ANOTAÇÕES & OBSERVAÇÕES (Sempre inicia vazio "" com contador 0/500) */}
          <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Anotações & Observações <span className="font-normal text-slate-400">(opcional)</span></span>
              </label>
              <span className="text-[11px] font-semibold text-slate-400">
                {notes.length}/500
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Dúvidas, tópicos que merecem revisão posterior, palavras-chave, macetes..."
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 resize-none shadow-2xs"
            />
          </div>

        </div>

        {/* RODAPÉ E AÇÕES FINAIS */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 text-xs w-full sm:w-auto justify-start">
            <div className="bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-800/80 dark:text-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg text-xs font-medium">
              Duração: <strong className="font-mono text-slate-900 dark:text-white">{formattedDurationFooter}</strong>
            </div>
            {onDelete && (
              <button
                type="button"
                disabled={isSaving}
                onClick={async () => {
                  if (!window.confirm('Excluir este registro de estudo?')) return;
                  setIsSaving(true);
                  try {
                    await onDelete();
                  } catch {
                    setFormError('Não foi possível excluir o registro. Tente novamente.');
                  } finally {
                    setIsSaving(false);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir registro
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Fechar / Cancelar
            </button>

            <button
              type="button"
              onClick={handleFinalSave}
              disabled={isSaving || !isFormValid}
              className="modal-btn-salvar-estudo flex-1 sm:flex-none text-white font-bold px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:opacity-95"
              style={{
                backgroundColor: palette.primary,
                boxShadow: `0 4px 14px ${palette.primary}40`,
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? 'Gravando...' : initialSession ? 'Salvar alterações' : 'Finalizar e Salvar Estudo'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
