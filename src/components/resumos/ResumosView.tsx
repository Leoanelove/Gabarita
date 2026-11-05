import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  NotebookPen,
  BookOpen,
  FileText,
  Target,
  Star,
  Clock,
  Search,
  Plus,
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  CheckCircle2,
  FileCheck2,
  FilePlus,
  Sparkles,
  Printer,
  Eye,
  Edit3,
  Maximize2,
  Minimize2,
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  Eraser,
  List,
  ListOrdered,
  CheckSquare,
  AlertTriangle,
  Scale,
  Lightbulb,
  Landmark,
  Table,
  Image as ImageIcon,
  Minus,
  ClipboardList,
  History,
  Trash2,
  Check,
  X,
  Tag,
  Layers,
  Save,
  AlignLeft,
  ChevronDown,
  RotateCcw,
  Download,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import {
  Concurso,
  Disciplina,
  Assunto,
  ResumoEstudo,
  ResumoStatus,
  ResumoVersaoHistorico,
  SessaoEstudo,
  TopicStatus,
  NavigationTab,
  Deck,
  Flashcard,
} from '../../types';
import { DatabaseService } from '../../services/db';
import { useTheme } from '../../contexts/ThemeContext';
import { MenuBannerFrame } from '../common/MenuBannerFrame';
import { SubjectIcon } from '../common/SubjectIcon';
import { EmptyContestState } from '../common/EmptyContestState';
import { Card, CardBody } from '../../design-system/Card';
import { Button } from '../../design-system/Button';
import { Modal } from '../../design-system/Modal';
import {
  GmailRichTextEditor,
  stripHtmlToPlainText,
  sanitizeFlashcardHtml,
} from '../flashcards/GmailRichTextEditor';

const getConcursoDisplayName = (c?: Concurso): string => {
  if (!c) return 'Concurso Selecionado';
  const organ = c.organ || c.orgao || c.nome || c.title || 'Concurso';
  const role = c.role || c.cargo || '';
  if (role && !organ.toLowerCase().includes(role.toLowerCase())) {
    return `${organ} - ${role}`;
  }
  return organ;
};

export const RESUMOS_BANNER_IMAGES: Record<string, string> = {
  verde: 'https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Resumos/Banner-resumos-verde.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBSZXN1bW9zL0Jhbm5lci1yZXN1bW9zLXZlcmRlLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3OTM2NjcwNzgsImV4cCI6NDk0NzI2NzA3OH0.quzfk9QnxPTfDgepL2f_JXderMadoIlj75eDIkVfl90cg6HAGfLM93E-FhExE7JyLcikkaXlwbs2i_CMDecNiQ',
  azul: 'https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Resumos/Banner-resumos-azul.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBSZXN1bW9zL0Jhbm5lci1yZXN1bW9zLWF6dWwucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5MzY2NzA4OSwiZXhwIjo0OTQ3MjY3MDg5fQ.ZDzrN-n0wa5Bx0ycX6_4SUWslCsqZTm-vM6ShQ37EVv9YkInM9gLfpUtegKo1svj-xSfhu9mA9ffLWX9D5AYlw',
  rosa: 'https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Resumos/Banner-resumos-rosa.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBSZXN1bW9zL0Jhbm5lci1yZXN1bW9zLXJvc2EucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5MzY2NzEwMCwiZXhwIjo0OTQ3MjY3MTAwfQ.ONE6Q9MfnIjpT2sNTw_FuBzQ6Eg7i6BN96GRR1ADdGOShX7VxDQKImg5RYBqOc9A_Q5qiFRcPjqU8N7kltb1yA',
  roxo: 'https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Resumos/Banner-resumos-roxo.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBSZXN1bW9zL0Jhbm5lci1yZXN1bW9zLXJveG8ucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5MzY2NzExMSwiZXhwIjo0OTQ3MjY3MTExfQ.be_c-diaa3pBiQTJlqjb-gW2fylnYtAFJvo8BGIXxBNpirQmbV3fc3mytB-3vhXt7Bcy3A2tjA54YtD1fvhz2A',
  laranja: 'https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Resumos/Banner-resumos-laranja.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBSZXN1bW9zL0Jhbm5lci1yZXN1bW9zLWxhcmFuamEucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5MzY2NzEyNSwiZXhwIjo0OTQ3MjY3MTI1fQ.3zjmB_S4PmM9lwVZgteYgs8YnE0dNl-qIjkb8f4OJnvyZH_bw9kcS15IrqNTvIs-_1WVJ3uohdtcdssb4n64lw',
};

RESUMOS_BANNER_IMAGES.green = RESUMOS_BANNER_IMAGES.verde;
RESUMOS_BANNER_IMAGES.emerald = RESUMOS_BANNER_IMAGES.verde;
RESUMOS_BANNER_IMAGES.blue = RESUMOS_BANNER_IMAGES.azul;
RESUMOS_BANNER_IMAGES.sky = RESUMOS_BANNER_IMAGES.azul;
RESUMOS_BANNER_IMAGES.cyan = RESUMOS_BANNER_IMAGES.azul;
RESUMOS_BANNER_IMAGES.pink = RESUMOS_BANNER_IMAGES.rosa;
RESUMOS_BANNER_IMAGES.rose = RESUMOS_BANNER_IMAGES.rosa;
RESUMOS_BANNER_IMAGES.purple = RESUMOS_BANNER_IMAGES.roxo;
RESUMOS_BANNER_IMAGES.violet = RESUMOS_BANNER_IMAGES.roxo;
RESUMOS_BANNER_IMAGES.orange = RESUMOS_BANNER_IMAGES.laranja;
RESUMOS_BANNER_IMAGES.amber = RESUMOS_BANNER_IMAGES.laranja;
RESUMOS_BANNER_IMAGES.dbz = RESUMOS_BANNER_IMAGES.laranja;

interface ResumosViewProps {
  userId: string;
  concursos: Concurso[];
  disciplinas: Disciplina[];
  assuntos: Assunto[];
  activeConcursoId: string;
  onNavigateTab: (tab: NavigationTab) => void;
  onSaveSession: (
    sessionData: Omit<SessaoEstudo, 'id' | 'userId' | 'completedAt' | 'createdAt'> & { completedAt?: string }
  ) => Promise<void>;
  onUpdateAssuntoStatus?: (id: string, status: TopicStatus) => Promise<void>;
}

const HIGHLIGHT_COLORS = [
  {
    id: 'amarelo',
    label: 'Amarelo: Conceito Principal / Base',
    shortLabel: 'Conceito',
    bg: '#FEF08A',
    border: '#EAB308',
    dot: '#FACC15',
  },
  {
    id: 'verde',
    label: 'Verde: Jurisprudência / Entendimento Pacificado',
    shortLabel: 'Jurisprudência',
    bg: '#BBF7D0',
    border: '#22C55E',
    dot: '#4ADE80',
  },
  {
    id: 'rosa',
    label: 'Rosa/Vermelho: Exceção / Pegadinha de Banca / Proibição',
    shortLabel: 'Exceção / Pegadinha',
    bg: '#FECDD3',
    border: '#F43F5E',
    dot: '#FB7185',
  },
  {
    id: 'azul',
    label: 'Azul: Prazos / Quóruns / Artigos de Lei',
    shortLabel: 'Prazo / Lei',
    bg: '#BAE6FD',
    border: '#0EA5E9',
    dot: '#38BDF8',
  },
  {
    id: 'roxo',
    label: 'Roxo: Mnemônico / Bizu / Palavra-Chave',
    shortLabel: 'Bizu / Mnemônico',
    bg: '#E9D5FF',
    border: '#A855F7',
    dot: '#C084FC',
  },
];

const SUGGESTED_TAGS = ['LeiSeca', 'STF', 'STJ', 'Prazo', 'Importante', 'Pegadinha', 'Bizu', 'Véspera'];

const TEMPLATE_PADRAO_TOPICO = `<h2>1. Conceito Geral &amp; Definição</h2>
<p>Descreva aqui a definição nuclear do instituto jurídico ou conceito central cobrado pelas bancas examinadoras.</p>
<div data-callout="bizu" style="border-left: 4px solid #f59e0b; background: rgba(245, 158, 11, 0.1); padding: 12px 16px; border-radius: 8px; margin: 12px 0;">
  <strong>💡 BIZU DE PROVA:</strong> Anote aqui a palavra-chave ou esquema mnemônico para memorização rápida.
</div>
<h2>2. Base Legal &amp; Artigos Essenciais</h2>
<div data-callout="leiseca" style="border-left: 4px solid #3b82f6; background: rgba(59, 130, 246, 0.08); padding: 12px 16px; border-radius: 8px; margin: 12px 0; font-family: Georgia, serif;">
  <strong>⚖️ LEI SECA / DISPOSITIVO LEGAL:</strong><br/>"Transcreva aqui os artigos, incisos e parágrafos de leitura obrigatória..."
</div>
<h2>3. Jurisprudência &amp; Súmulas (STF / STJ)</h2>
<div data-callout="jurisprudencia" style="border-left: 4px solid #10b981; background: rgba(16, 185, 129, 0.08); padding: 12px 16px; border-radius: 8px; margin: 12px 0;">
  <strong>🏛️ ENTENDIMENTO JURISPRUDENCIAL:</strong> Registre súmulas vinculantes, teses de repercussão geral ou recursos repetitivos sobre o tema.
</div>
<h2>4. Exceções &amp; Pegadinhas de Banca</h2>
<div data-callout="pegadinha" style="border-left: 4px solid #f43f5e; background: rgba(244, 63, 94, 0.08); padding: 12px 16px; border-radius: 8px; margin: 12px 0;">
  <strong>⚠️ ATENÇÃO / PEGADINHA DE BANCA:</strong> Cuidado com a inversão de conceitos, prazos e competências!
</div>
<p><br/></p>`;

const TEMPLATE_LEI_SECA = `<h2>Esquema de Dispositivo Legal</h2>
<div data-callout="leiseca" style="border-left: 4px solid #3b82f6; background: rgba(59, 130, 246, 0.08); padding: 12px 16px; border-radius: 8px; margin: 12px 0; font-family: Georgia, serif;">
  <strong>⚖️ ARTIGO / DIPLOMA LEGAL:</strong> Art. ___ da Lei nº ___
</div>
<h3>A. Regra Geral</h3>
<ul>
  <li>Qual é o comando principal da norma?</li>
  <li>Quem é o sujeito ativo / competente?</li>
</ul>
<h3>B. Exceções Expressas</h3>
<div data-callout="pegadinha" style="border-left: 4px solid #f43f5e; background: rgba(244, 63, 94, 0.08); padding: 12px 16px; border-radius: 8px; margin: 12px 0;">
  <strong>⚠️ ATENÇÃO / PEGADINHA DE BANCA:</strong> Salvo disposição em contrário / hipóteses de dispensa ou vedação.
</div>
<h3>C. Quadro de Prazos e Quóruns</h3>
<table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
  <thead>
    <tr style="background: rgba(148, 163, 184, 0.18);">
      <th style="border: 1px solid rgba(148, 163, 184, 0.4); padding: 8px; text-align: left;">Hipótese / Ato</th>
      <th style="border: 1px solid rgba(148, 163, 184, 0.4); padding: 8px; text-align: left;">Prazo / Quórum</th>
      <th style="border: 1px solid rgba(148, 163, 184, 0.4); padding: 8px; text-align: left;">Observação de Prova</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid rgba(148, 163, 184, 0.4); padding: 8px;"> Situação 1 </td>
      <td style="border: 1px solid rgba(148, 163, 184, 0.4); padding: 8px;"> 15 dias </td>
      <td style="border: 1px solid rgba(148, 163, 184, 0.4); padding: 8px;"> Improrrogável </td>
    </tr>
    <tr>
      <td style="border: 1px solid rgba(148, 163, 184, 0.4); padding: 8px;"> Situação 2 </td>
      <td style="border: 1px solid rgba(148, 163, 184, 0.4); padding: 8px;"> 30 dias </td>
      <td style="border: 1px solid rgba(148, 163, 184, 0.4); padding: 8px;"> Prorrogável por igual período </td>
    </tr>
  </tbody>
</table>
<p><br/></p>`;

function extractPlainText(html: string): string {
  if (!html) return '';
  if (typeof document !== 'undefined') {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
  }
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function countWords(text: string): number {
  const cleaned = text.trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

function formatTimerClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatTopicLabel(name: string, fallbackOrder: number): string {
  const trimmed = (name || '').trim();
  if (/^\d+([.\-–—)\]:\s]|$)/.test(trimmed)) {
    return trimmed;
  }
  return `${fallbackOrder}. ${trimmed}`;
}

export const ResumosView: React.FC<ResumosViewProps> = ({
  userId,
  concursos,
  disciplinas,
  assuntos,
  activeConcursoId,
  onNavigateTab,
  onSaveSession,
  onUpdateAssuntoStatus,
}) => {
  const { colorSkin, palette } = useTheme();
  const themeKey = useMemo(() => {
    const raw = (
      colorSkin === 'purple'
        ? 'roxo'
        : colorSkin === 'orange' || colorSkin === 'dbz'
        ? 'laranja'
        : colorSkin || palette?.id || 'verde'
    ).toLowerCase();
    return raw;
  }, [colorSkin, palette]);

  const themeGlowStyles = useMemo(() => {
    switch (themeKey) {
      case 'roxo':
        return {
          color: '#8B5CF6',
          textShadow:
            '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(167, 139, 250, 0.95), 0 0 18px rgba(139, 92, 246, 0.85), 0 0 32px rgba(124, 58, 237, 0.65)',
        };
      case 'laranja':
        return {
          color: '#FF6B00',
          textShadow:
            '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(251, 146, 60, 0.95), 0 0 18px rgba(249, 115, 22, 0.85), 0 0 32px rgba(234, 88, 12, 0.65)',
        };
      case 'azul':
        return {
          color: '#3B82F6',
          textShadow:
            '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(96, 165, 250, 0.95), 0 0 18px rgba(37, 99, 235, 0.8), 0 0 32px rgba(29, 78, 216, 0.6)',
        };
      case 'rosa':
        return {
          color: '#EC4899',
          textShadow:
            '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(244, 114, 182, 0.95), 0 0 18px rgba(219, 39, 119, 0.8), 0 0 32px rgba(190, 24, 93, 0.6)',
        };
      case 'verde':
      default:
        return {
          color: '#10B981',
          textShadow:
            '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(52, 211, 153, 0.95), 0 0 18px rgba(16, 185, 129, 0.8), 0 0 32px rgba(5, 150, 105, 0.6)',
        };
    }
  }, [themeKey]);

  // Estado dos resumos
  const [resumos, setResumos] = useState<ResumoEstudo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Visão principal: 'estante' (Visão 1) ou 'workspace' (Visão 2)
  const [viewMode, setViewMode] = useState<'estante' | 'workspace'>('estante');
  const [selectedDisciplinaId, setSelectedDisciplinaId] = useState<string>('');
  const [selectedAssuntoId, setSelectedAssuntoId] = useState<string>(''); // Vazio quando for nota avulsa
  const [activeResumoId, setActiveResumoId] = useState<string>('');

  // Filtros e busca na Visão 1 (Estante)
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [estanteFilter, setEstanteFilter] = useState<
    'todas' | 'com_resumos' | 'sem_resumos' | 'favoritos' | 'finalizados'
  >('todas');

  // Filtros e busca na Coluna Esquerda da Visão 2 (Workspace)
  const [topicSearchQuery, setTopicSearchQuery] = useState<string>('');
  const [topicFilter, setTopicFilter] = useState<'todos' | 'com_resumo' | 'pendentes' | 'favoritos'>('todos');
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [isMobileTopicsOpen, setIsMobileTopicsOpen] = useState<boolean>(false);

  // Estado do Editor Rico (Visão 2)
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<number | null>(null);
  const isInternalChangeRef = useRef<boolean>(false);

  const [docTitle, setDocTitle] = useState<string>('');
  const [docStatus, setDocStatus] = useState<ResumoStatus>('rascunho');
  const [docFavorite, setDocFavorite] = useState<boolean>(false);
  const [docTags, setDocTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [docHtml, setDocHtml] = useState<string>('');
  const [isReadingMode, setIsReadingMode] = useState<boolean>(false);
  const [readingFontSize, setReadingFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('lg');
  const [isLinedPaper, setIsLinedPaper] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showHighlightMenu, setShowHighlightMenu] = useState<boolean>(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState<boolean>(false);

  // Cronômetro integrado de sessão de resumo
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [sessionSavedFeedback, setSessionSavedFeedback] = useState<string>('');

  // Modais de apoio
  const [isNovoResumoModalOpen, setIsNovoResumoModalOpen] = useState<boolean>(false);
  const [modalDiscId, setModalDiscId] = useState<string>('');
  const [modalTopicMode, setModalTopicMode] = useState<'topico' | 'avulsa'>('topico');
  const [modalAssuntoId, setModalAssuntoId] = useState<string>('');
  const [modalCustomTitle, setModalCustomTitle] = useState<string>('');

  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState<boolean>(false);
  const [allDecks, setAllDecks] = useState<Deck[]>([]);
  const [allFlashcards, setAllFlashcards] = useState<Flashcard[]>([]);
  const [fcFormDisciplina, setFcFormDisciplina] = useState<string>('');
  const [fcFormDeckMode, setFcFormDeckMode] = useState<'existente' | 'novo'>('existente');
  const [fcFormDeckId, setFcFormDeckId] = useState<string>('');
  const [fcFormNewDeckName, setFcFormNewDeckName] = useState<string>('');
  const [fcFormTopico, setFcFormTopico] = useState<string>('');
  const [fcFormFrente, setFcFormFrente] = useState<string>('');
  const [fcFormVerso, setFcFormVerso] = useState<string>('');
  const [fcFormErrors, setFcFormErrors] = useState<Record<string, string>>({});

  const [isVersionsModalOpen, setIsVersionsModalOpen] = useState<boolean>(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [isImageUrlModalOpen, setIsImageUrlModalOpen] = useState<boolean>(false);
  const [imageUrlInput, setImageUrlInput] = useState<string>('');

  // Disciplinas e assuntos do concurso ativo
  const activeDisciplinas = useMemo(() => {
    if (!activeConcursoId) return [];
    return disciplinas
      .filter(d => d.concursoId === activeConcursoId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [disciplinas, activeConcursoId]);

  const activeDiscIds = useMemo(() => new Set(activeDisciplinas.map(d => d.id)), [activeDisciplinas]);

  const activeAssuntos = useMemo(() => {
    return assuntos
      .filter(a => activeDiscIds.has(a.disciplinaId))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [assuntos, activeDiscIds]);

  // Carrega resumos ao iniciar ou ao trocar o concurso ativo
  const loadResumos = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await DatabaseService.getResumos(activeConcursoId || undefined);
      setResumos(list.filter(r => !activeConcursoId || r.concursoId === activeConcursoId || activeDiscIds.has(r.disciplinaId)));
    } catch {
      setResumos([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeConcursoId, activeDiscIds]);

  useEffect(() => {
    loadResumos();
  }, [loadResumos]);

  // Quando o concurso ativo muda na Sidebar, volta para a Estante do novo concurso
  useEffect(() => {
    setViewMode('estante');
    setSelectedDisciplinaId('');
    setSelectedAssuntoId('');
    setActiveResumoId('');
  }, [activeConcursoId]);

  // Cronômetro em execução
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = window.setInterval(() => {
      setTimerSeconds(prev => prev + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isTimerRunning]);

  // Fechar Modo Leitura em tela cheia com a tecla ESC
  useEffect(() => {
    if (!isReadingMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isFlashcardModalOpen && !isPrintPreviewOpen) {
        setIsReadingMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReadingMode, isFlashcardModalOpen]);

  // Métricas Globais (KPIs da Visão 1)
  const kpiStats = useMemo(() => {
    const totalResumos = resumos.length;
    const finalizados = resumos.filter(r => r.status === 'finalizado').length;
    const emAndamento = totalResumos - finalizados;
    const favoritosCount = resumos.filter(r => r.isFavorite).length;

    const totalTopicosEdital = activeAssuntos.length;
    const topicosComResumoSet = new Set(
      resumos.filter(r => r.assuntoId && r.plainText.trim().length > 0).map(r => r.assuntoId!)
    );
    const topicosResumidosCount = topicosComResumoSet.size;
    const coberturaPercent =
      totalTopicosEdital > 0 ? Math.min(100, Math.round((topicosResumidosCount / totalTopicosEdital) * 100)) : 0;

    const totalWords = resumos.reduce((acc, r) => acc + (r.wordCount || 0), 0);
    const totalReadingMinutes = Math.max(
      totalWords > 0 ? 1 : 0,
      Math.ceil(totalWords / 200)
    );

    return {
      totalResumos,
      finalizados,
      emAndamento,
      favoritosCount,
      totalTopicosEdital,
      topicosResumidosCount,
      coberturaPercent,
      totalWords,
      totalReadingMinutes,
    };
  }, [resumos, activeAssuntos]);

  // 3 Últimos resumos editados para "Continuar Editando"
  const recentResumos = useMemo(() => {
    return [...resumos]
      .filter(r => r.plainText.trim().length > 0 || r.title.trim().length > 0)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3);
  }, [resumos]);

  // Busca Global Profunda (Full-Text Search)
  const globalSearchResults = useMemo(() => {
    const q = globalSearchQuery.trim().toLowerCase();
    if (!q) return [];
    const cleanTagQuery = q.startsWith('#') ? q.slice(1) : q;

    return resumos
      .filter(r => {
        const inTitle = r.title.toLowerCase().includes(q);
        const inPlain = r.plainText.toLowerCase().includes(q);
        const inDisc = r.disciplinaName.toLowerCase().includes(q);
        const inAssunto = r.assuntoName.toLowerCase().includes(q);
        const inTags = r.tags.some(t => t.toLowerCase().includes(cleanTagQuery));
        return inTitle || inPlain || inDisc || inAssunto || inTags;
      })
      .map(r => {
        // Extrai snippet em torno da palavra buscada
        const text = r.plainText || '';
        const lowerText = text.toLowerCase();
        const idx = lowerText.indexOf(q);
        let snippet = '';
        if (idx >= 0) {
          const start = Math.max(0, idx - 55);
          const end = Math.min(text.length, idx + q.length + 85);
          snippet = (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');
        } else {
          snippet = text.slice(0, 140) + (text.length > 140 ? '...' : '');
        }
        return { resumo: r, snippet };
      });
  }, [resumos, globalSearchQuery]);

  // Cards de Disciplinas na Estante (Visão 1)
  const estanteDisciplinasCards = useMemo(() => {
    return activeDisciplinas
      .map(disc => {
        const discTopicos = activeAssuntos.filter(a => a.disciplinaId === disc.id);
        const discResumos = resumos.filter(r => r.disciplinaId === disc.id);
        const topicosResumidosIds = new Set(
          discResumos.filter(r => r.assuntoId && r.plainText.trim().length > 0).map(r => r.assuntoId!)
        );
        const topicosResumidosCount = discTopicos.filter(t => topicosResumidosIds.has(t.id)).length;
        const totalTopicos = discTopicos.length;
        const progressPct =
          totalTopicos > 0
            ? Math.min(100, Math.round((topicosResumidosCount / totalTopicos) * 100))
            : discResumos.length > 0
            ? 100
            : 0;
        const favoritosCount = discResumos.filter(r => r.isFavorite).length;
        const finalizadosCount = discResumos.filter(r => r.status === 'finalizado').length;
        const avulsasCount = discResumos.filter(r => !r.assuntoId).length;

        const sortedResumos = [...discResumos].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        const lastUpdated = sortedResumos[0]?.updatedAt || null;

        return {
          disciplina: disc,
          totalTopicos,
          topicosResumidosCount,
          totalResumosCount: discResumos.length,
          progressPct,
          favoritosCount,
          finalizadosCount,
          avulsasCount,
          recentTopics: sortedResumos.slice(0, 2),
          lastUpdated,
        };
      })
      .filter(card => {
        if (estanteFilter === 'com_resumos') return card.totalResumosCount > 0;
        if (estanteFilter === 'sem_resumos') return card.totalResumosCount === 0;
        if (estanteFilter === 'favoritos') return card.favoritosCount > 0;
        if (estanteFilter === 'finalizados') return card.finalizadosCount > 0;
        return true;
      });
  }, [activeDisciplinas, activeAssuntos, resumos, estanteFilter]);

  // Disciplina ativa no Workspace (Visão 2)
  const currentDisciplina = useMemo(
    () => activeDisciplinas.find(d => d.id === selectedDisciplinaId) || activeDisciplinas[0] || null,
    [activeDisciplinas, selectedDisciplinaId]
  );

  const currentDisciplinaTopicos = useMemo(() => {
    if (!currentDisciplina) return [];
    return activeAssuntos.filter(a => a.disciplinaId === currentDisciplina.id);
  }, [activeAssuntos, currentDisciplina]);

  const currentDisciplinaResumos = useMemo(() => {
    if (!currentDisciplina) return [];
    return resumos.filter(r => r.disciplinaId === currentDisciplina.id);
  }, [resumos, currentDisciplina]);

  const notasAvulsasDisciplina = useMemo(() => {
    return currentDisciplinaResumos.filter(r => !r.assuntoId);
  }, [currentDisciplinaResumos]);

  // Carregar um resumo ou tópico no editor
  const loadResumoIntoEditor = useCallback(
    (resumo: ResumoEstudo | null, fallbackTitle: string) => {
      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }

      if (resumo) {
        setActiveResumoId(resumo.id);
        setDocTitle(resumo.title);
        setDocStatus(resumo.status);
        setDocFavorite(resumo.isFavorite);
        setDocTags(resumo.tags || []);
        setDocHtml(resumo.contentHtml || '');
        const d = new Date(resumo.updatedAt);
        if (!isNaN(d.getTime())) {
          setLastSavedTime(
            `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
          );
        }
        if (editorRef.current) {
          editorRef.current.innerHTML = resumo.contentHtml || '';
        }
      } else {
        setActiveResumoId('');
        setDocTitle(fallbackTitle);
        setDocStatus('rascunho');
        setDocFavorite(false);
        setDocTags([]);
        setDocHtml('');
        setLastSavedTime('');
        if (editorRef.current) {
          editorRef.current.innerHTML = '';
        }
      }
    },
    []
  );

  // Sincroniza o HTML inicial quando o elemento contentEditable monta ou muda de tópico/resumo
  useEffect(() => {
    if (viewMode === 'workspace' && editorRef.current && !isInternalChangeRef.current) {
      if (editorRef.current.innerHTML !== docHtml) {
        editorRef.current.innerHTML = docHtml || '';
      }
    }
    isInternalChangeRef.current = false;
  }, [viewMode, activeResumoId, selectedAssuntoId, selectedDisciplinaId]);

  // Abrir o Caderno de uma Disciplina (Visão 2)
  const handleOpenDisciplinaWorkspace = (
    discId: string,
    targetAssuntoId?: string,
    targetResumoId?: string
  ) => {
    const disc = activeDisciplinas.find(d => d.id === discId);
    if (!disc) return;

    setSelectedDisciplinaId(disc.id);
    const discTopicos = activeAssuntos.filter(a => a.disciplinaId === disc.id);
    const discResumos = resumos.filter(r => r.disciplinaId === disc.id);

    if (targetResumoId) {
      const foundResumo = discResumos.find(r => r.id === targetResumoId);
      if (foundResumo) {
        setSelectedAssuntoId(foundResumo.assuntoId || '');
        loadResumoIntoEditor(foundResumo, foundResumo.title);
        setViewMode('workspace');
        return;
      }
    }

    if (targetAssuntoId) {
      const topico = discTopicos.find(t => t.id === targetAssuntoId);
      const existing = discResumos.find(r => r.assuntoId === targetAssuntoId) || null;
      setSelectedAssuntoId(targetAssuntoId);
      loadResumoIntoEditor(existing, topico?.name || 'Resumo do Tópico');
      setViewMode('workspace');
      return;
    }

    // Padrão: abre o primeiro tópico com resumo, ou o primeiro tópico do edital, ou nota avulsa
    if (discTopicos.length > 0) {
      const firstWithResumo = discTopicos.find(t => discResumos.some(r => r.assuntoId === t.id));
      const chosenTopic = firstWithResumo || discTopicos[0];
      const existing = discResumos.find(r => r.assuntoId === chosenTopic.id) || null;
      setSelectedAssuntoId(chosenTopic.id);
      loadResumoIntoEditor(existing, chosenTopic.name);
    } else if (discResumos.length > 0) {
      const firstResumo = discResumos[0];
      setSelectedAssuntoId(firstResumo.assuntoId || '');
      loadResumoIntoEditor(firstResumo, firstResumo.title);
    } else {
      setSelectedAssuntoId('');
      loadResumoIntoEditor(null, `Resumo Geral - ${disc.name}`);
    }

    setViewMode('workspace');
  };

  // Selecionar um tópico na Coluna Esquerda da Visão 2
  const handleSelectTopicInSidebar = (assunto: Assunto) => {
    setSelectedAssuntoId(assunto.id);
    const existing = currentDisciplinaResumos.find(r => r.assuntoId === assunto.id) || null;
    loadResumoIntoEditor(existing, assunto.name);
    setIsMobileTopicsOpen(false);
  };

  // Selecionar uma Nota Avulsa na Coluna Esquerda da Visão 2
  const handleSelectNotaAvulsa = (resumo: ResumoEstudo) => {
    setSelectedAssuntoId('');
    loadResumoIntoEditor(resumo, resumo.title);
    setIsMobileTopicsOpen(false);
  };

  // Criar Nova Nota Avulsa diretamente na disciplina atual
  const handleCreateNotaAvulsaInWorkspace = async () => {
    if (!currentDisciplina) return;
    const defaultTitle = `Nota de Estudo #${notasAvulsasDisciplina.length + 1} - ${currentDisciplina.name}`;
    const saved = await DatabaseService.saveResumo({
      userId,
      concursoId: activeConcursoId,
      disciplinaId: currentDisciplina.id,
      disciplinaName: currentDisciplina.name,
      assuntoId: undefined,
      assuntoName: 'Nota Avulsa',
      title: defaultTitle,
      contentHtml: '',
      plainText: '',
      status: 'rascunho',
      isFavorite: false,
      tags: [],
      wordCount: 0,
      readingTimeMinutes: 1,
      totalStudySeconds: 0,
    });
    setResumos(prev => [saved, ...prev.filter(r => r.id !== saved.id)]);
    setSelectedAssuntoId('');
    loadResumoIntoEditor(saved, saved.title);
  };

  // Função central de Persistência do Resumo Atual
  const persistCurrentResumo = useCallback(
    async (overridePartial?: {
      title?: string;
      html?: string;
      status?: ResumoStatus;
      isFavorite?: boolean;
      tags?: string[];
      additionalSeconds?: number;
    }) => {
      if (!currentDisciplina) return null;

      const htmlToSave =
        overridePartial?.html !== undefined
          ? overridePartial.html
          : editorRef.current
          ? editorRef.current.innerHTML
          : docHtml;
      const titleToSave = (overridePartial?.title !== undefined ? overridePartial.title : docTitle).trim() || 'Resumo sem título';
      const statusToSave = overridePartial?.status !== undefined ? overridePartial.status : docStatus;
      const favToSave = overridePartial?.isFavorite !== undefined ? overridePartial.isFavorite : docFavorite;
      const tagsToSave = overridePartial?.tags !== undefined ? overridePartial.tags : docTags;

      const plain = extractPlainText(htmlToSave);
      const words = countWords(plain);
      const readMins = Math.max(1, Math.ceil(words / 200));

      const matchedTopic = currentDisciplinaTopicos.find(t => t.id === selectedAssuntoId);
      const existingResumo = resumos.find(r => r.id === activeResumoId);

      setIsSaving(true);
      try {
        const saved = await DatabaseService.saveResumo({
          id: activeResumoId || undefined,
          userId,
          concursoId: activeConcursoId,
          disciplinaId: currentDisciplina.id,
          disciplinaName: currentDisciplina.name,
          assuntoId: selectedAssuntoId || undefined,
          assuntoName: matchedTopic ? matchedTopic.name : existingResumo?.assuntoName || 'Nota Avulsa',
          title: titleToSave,
          contentHtml: htmlToSave,
          plainText: plain,
          status: statusToSave,
          isFavorite: favToSave,
          tags: tagsToSave,
          wordCount: words,
          readingTimeMinutes: readMins,
          totalStudySeconds:
            (existingResumo?.totalStudySeconds || 0) + (overridePartial?.additionalSeconds || 0),
          lastStudiedAt: new Date().toISOString(),
        });

        setActiveResumoId(saved.id);
        setResumos(prev => {
          const exists = prev.some(r => r.id === saved.id);
          if (exists) {
            return prev.map(r => (r.id === saved.id ? saved : r));
          }
          return [saved, ...prev];
        });

        const now = new Date();
        setLastSavedTime(
          `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        );
        return saved;
      } finally {
        setIsSaving(false);
      }
    },
    [
      currentDisciplina,
      docHtml,
      docTitle,
      docStatus,
      docFavorite,
      docTags,
      currentDisciplinaTopicos,
      selectedAssuntoId,
      resumos,
      activeResumoId,
      userId,
      activeConcursoId,
    ]
  );

  // Dispara Auto-Save com debounce de 800ms
  const triggerDebouncedSave = useCallback(
    (nextHtml?: string, nextTitle?: string) => {
      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = window.setTimeout(() => {
        persistCurrentResumo({
          html: nextHtml,
          title: nextTitle,
        });
      }, 800);
    },
    [persistCurrentResumo]
  );

  // Manipulador de entrada no editor contentEditable
  const handleEditorInput = () => {
    if (!editorRef.current) return;
    isInternalChangeRef.current = true;
    const currentHtml = editorRef.current.innerHTML;
    setDocHtml(currentHtml);
    triggerDebouncedSave(currentHtml, undefined);
  };

  // Suporte a clique em checkboxes interativos dentro do contentEditable
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target && target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
      const inputEl = target as HTMLInputElement;
      if (inputEl.checked) {
        inputEl.setAttribute('checked', 'checked');
      } else {
        inputEl.removeAttribute('checked');
      }
      handleEditorInput();
    }
  };

  // Suporte a colar imagens (Ctrl+V) diretamente no resumo
  const handleEditorPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = ev => {
            const dataUrl = ev.target?.result as string;
            if (dataUrl) {
              insertHtmlAtCursor(
                `<img src="${dataUrl}" alt="Esquema colado" style="max-width: 100%; height: auto; border-radius: 10px; margin: 12px 0; border: 1px solid rgba(148,163,184,0.3);" /><p><br/></p>`
              );
            }
          };
          reader.readAsDataURL(file);
        }
        return;
      }
    }
  };

  // Executar comandos ricos de formatação
  const execFormatCommand = (command: string, value?: string) => {
    if (isReadingMode || !editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    handleEditorInput();
  };

  const insertHtmlAtCursor = (htmlSnippet: string) => {
    if (isReadingMode || !editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('insertHTML', false, htmlSnippet);
    handleEditorInput();
  };

  // Inserir Callout Boxes de Concurseiro
  const handleInsertCallout = (type: 'pegadinha' | 'leiseca' | 'bizu' | 'jurisprudencia') => {
    const configs = {
      pegadinha: {
        border: '#f43f5e',
        bg: 'rgba(244, 63, 94, 0.1)',
        title: '⚠️ ATENÇÃO / PEGADINHA DE BANCA:',
        placeholder: 'Descreva aqui a exceção ou pegadinha clássica cobrada nas provas...',
      },
      leiseca: {
        border: '#3b82f6',
        bg: 'rgba(59, 130, 246, 0.1)',
        title: '⚖️ LEI SECA / ARTIGO:',
        placeholder: '"Art. ___ - Transcreva aqui a literalidade da norma ou inciso importante..."',
      },
      bizu: {
        border: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.12)',
        title: '💡 BIZU DE PROVA:',
        placeholder: 'Anote aqui o macete, mnemônico ou regra de ouro para memorizar...',
      },
      jurisprudencia: {
        border: '#10b981',
        bg: 'rgba(16, 185, 129, 0.1)',
        title: '🏛️ ENTENDIMENTO JURISPRUDENCIAL:',
        placeholder: 'Súmula ou informativo do STF/STJ aplicável a este tópico...',
      },
    };
    const cfg = configs[type];
    const html = `<div data-callout="${type}" style="border-left: 4px solid ${cfg.border}; background: ${cfg.bg}; padding: 12px 16px; border-radius: 8px; margin: 14px 0;"><strong>${cfg.title}</strong><br/>${cfg.placeholder}</div><p><br/></p>`;
    insertHtmlAtCursor(html);
  };

  // Inserir Checklist Interativo
  const handleInsertChecklist = () => {
    const html = `<div style="display: flex; align-items: center; gap: 8px; margin: 6px 0;"><input type="checkbox" style="width: 16px; height: 16px; cursor: pointer;" /><span>Item de verificação / ponto de revisão</span></div><p><br/></p>`;
    insertHtmlAtCursor(html);
  };

  // Inserir Tabela Comparativa 3x3
  const handleInsertTable = () => {
    const html = `<table style="width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 0.92em;">
      <thead>
        <tr style="background: rgba(148, 163, 184, 0.18);">
          <th style="border: 1px solid rgba(148, 163, 184, 0.45); padding: 8px 10px; text-align: left;">Critério / Instituto</th>
          <th style="border: 1px solid rgba(148, 163, 184, 0.45); padding: 8px 10px; text-align: left;">Regra A</th>
          <th style="border: 1px solid rgba(148, 163, 184, 0.45); padding: 8px 10px; text-align: left;">Regra B</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border: 1px solid rgba(148, 163, 184, 0.45); padding: 8px 10px;">Conceito / Prazo</td>
          <td style="border: 1px solid rgba(148, 163, 184, 0.45); padding: 8px 10px;">Preencher...</td>
          <td style="border: 1px solid rgba(148, 163, 184, 0.45); padding: 8px 10px;">Preencher...</td>
        </tr>
        <tr>
          <td style="border: 1px solid rgba(148, 163, 184, 0.45); padding: 8px 10px;">Competência / Exceção</td>
          <td style="border: 1px solid rgba(148, 163, 184, 0.45); padding: 8px 10px;">Preencher...</td>
          <td style="border: 1px solid rgba(148, 163, 184, 0.45); padding: 8px 10px;">Preencher...</td>
        </tr>
      </tbody>
    </table><p><br/></p>`;
    insertHtmlAtCursor(html);
  };

  // Upload local de imagem
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        insertHtmlAtCursor(
          `<img src="${dataUrl}" alt="${file.name}" style="max-width: 100%; height: auto; border-radius: 10px; margin: 12px 0; border: 1px solid rgba(148,163,184,0.3);" /><p><br/></p>`
        );
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Aplicar Modelo (Template)
  const handleApplyTemplate = (templateHtml: string) => {
    if (!editorRef.current) return;
    const currentPlain = extractPlainText(editorRef.current.innerHTML);
    const nextHtml = currentPlain.length > 0 ? `${editorRef.current.innerHTML}<hr style="margin: 16px 0; border-color: rgba(148,163,184,0.3);" />${templateHtml}` : templateHtml;
    editorRef.current.innerHTML = nextHtml;
    setDocHtml(nextHtml);
    setShowTemplateMenu(false);
    persistCurrentResumo({ html: nextHtml });
  };

  // Atualizar Status do Resumo + Sincronizar com Edital Verticalizado
  const handleStatusChange = async (newStatus: ResumoStatus) => {
    setDocStatus(newStatus);
    await persistCurrentResumo({ status: newStatus });
    if (newStatus === 'finalizado' && selectedAssuntoId && onUpdateAssuntoStatus) {
      await onUpdateAssuntoStatus(selectedAssuntoId, 'revisado');
    }
  };

  // Favoritar / Desfavoritar Resumo
  const handleToggleFavorite = async () => {
    const nextFav = !docFavorite;
    setDocFavorite(nextFav);
    await persistCurrentResumo({ isFavorite: nextFav });
  };

  // Gerenciar Tags
  const handleAddTag = async (tagToAdd: string) => {
    const cleaned = tagToAdd.replace(/^#/, '').trim();
    if (!cleaned || docTags.includes(cleaned)) {
      setNewTagInput('');
      return;
    }
    const nextTags = [...docTags, cleaned];
    setDocTags(nextTags);
    setNewTagInput('');
    await persistCurrentResumo({ tags: nextTags });
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const nextTags = docTags.filter(t => t !== tagToRemove);
    setDocTags(nextTags);
    await persistCurrentResumo({ tags: nextTags });
  };

  // Registrar Sessão do Cronômetro no Histórico e Estatísticas
  const handleRegisterTimerSession = async () => {
    if (!currentDisciplina) return;
    const minutes = Math.max(1, Math.round(timerSeconds / 60));
    setIsTimerRunning(false);

    const matchedTopic = currentDisciplinaTopicos.find(t => t.id === selectedAssuntoId);
    await onSaveSession({
      concursoId: activeConcursoId,
      disciplinaId: currentDisciplina.id,
      assuntoId: selectedAssuntoId || undefined,
      disciplinaName: currentDisciplina.name,
      assuntoName: matchedTopic?.name || docTitle || 'Caderno de Resumos',
      durationMinutes: minutes,
      durationSeconds: Math.max(60, timerSeconds),
      type: 'resumo',
      origem: 'resumos',
      notes: `Elaboração e revisão de resumo: ${docTitle || matchedTopic?.name || currentDisciplina.name}`,
    });

    await persistCurrentResumo({ additionalSeconds: timerSeconds });
    setTimerSeconds(0);
    setSessionSavedFeedback(`+${minutes} min registrados no Histórico!`);
    window.setTimeout(() => setSessionSavedFeedback(''), 4000);
  };

  // Dados do Concurso Ativo, Baralhos e Disciplinas para o Modal "Criar Flashcard" (idêntico ao menu Flashcards)
  const currentConcursoObj = useMemo(() => {
    return (
      concursos.find(c => c.id === activeConcursoId) ||
      concursos.find(c => c.active || c.isAtivo) ||
      concursos[0]
    );
  }, [concursos, activeConcursoId]);

  const currentConcursoName = useMemo(
    () => getConcursoDisplayName(currentConcursoObj),
    [currentConcursoObj]
  );

  const concursoDecks = useMemo(() => {
    if (!activeConcursoId) return allDecks;
    return allDecks.filter(d => {
      const cid = d.concursoId || d.concurso_id;
      return cid === activeConcursoId;
    });
  }, [allDecks, activeConcursoId]);

  const concursoDeckIds = useMemo(
    () => new Set(concursoDecks.map(d => d.id)),
    [concursoDecks]
  );

  const concursoFlashcards = useMemo(() => {
    if (!activeConcursoId) return allFlashcards;
    return allFlashcards.filter(c => {
      const cid = c.concursoId || c.concurso_id;
      if (cid) return cid === activeConcursoId;
      return concursoDeckIds.has(c.deckId);
    });
  }, [allFlashcards, activeConcursoId, concursoDeckIds]);

  const availableDisciplinasList = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    activeDisciplinas.forEach(d => {
      const trimmed = d.name?.trim();
      if (trimmed && !seen.has(trimmed.toLowerCase())) {
        seen.add(trimmed.toLowerCase());
        list.push(trimmed);
      }
    });
    concursoDecks.forEach(d => {
      const trimmed = d.disciplina?.trim();
      if (trimmed && !seen.has(trimmed.toLowerCase())) {
        seen.add(trimmed.toLowerCase());
        list.push(trimmed);
      }
    });
    return list;
  }, [activeDisciplinas, concursoDecks]);

  const suggestedTopics = useMemo(() => {
    if (!fcFormDisciplina) return [];
    const discObj = activeDisciplinas.find(
      d => d.name.toLowerCase() === fcFormDisciplina.toLowerCase()
    );
    if (!discObj) return [];
    return activeAssuntos
      .filter(a => a.disciplinaId === discObj.id)
      .map(a => a.name);
  }, [activeDisciplinas, activeAssuntos, fcFormDisciplina]);

  // Abrir Modal "Criar Flashcard" (mesmo modal do menu Flashcards)
  const handleOpenFlashcardGenerator = async () => {
    const sel = window.getSelection()?.toString().trim() || '';
    const [loadedDecks, loadedCards] = await Promise.all([
      DatabaseService.getDecks(),
      DatabaseService.getFlashcards(),
    ]);
    setAllDecks(loadedDecks);
    setAllFlashcards(loadedCards);

    const cDecks = activeConcursoId
      ? loadedDecks.filter(d => (d.concursoId || d.concurso_id) === activeConcursoId)
      : loadedDecks;

    const preselectedDisc =
      currentDisciplina?.name ||
      activeDisciplinas[0]?.name ||
      cDecks[0]?.disciplina ||
      'Geral';

    setFcFormDisciplina(preselectedDisc);

    const matchedTopic = currentDisciplinaTopicos.find(t => t.id === selectedAssuntoId);
    const topicTitle =
      matchedTopic?.name ||
      (docTitle && docTitle !== 'Resumo sem título' ? docTitle : '');

    const discDecks = cDecks.filter(
      d => d.disciplina.toLowerCase() === preselectedDisc.toLowerCase()
    );

    if (discDecks.length > 0) {
      const matchingTopicDeck = topicTitle
        ? discDecks.find(d => d.nome.toLowerCase() === topicTitle.toLowerCase())
        : undefined;
      setFcFormDeckId((matchingTopicDeck || discDecks[0]).id);
      setFcFormDeckMode('existente');
      setFcFormNewDeckName('');
    } else {
      setFcFormDeckMode('novo');
      setFcFormDeckId('');
      setFcFormNewDeckName('');
    }

    setFcFormTopico(topicTitle || '');
    setFcFormFrente('');
    setFcFormVerso(sel ? `<p>${sel}</p>` : '');
    setFcFormErrors({});
    setIsFlashcardModalOpen(true);
  };

  const handleSaveGeneratedFlashcard = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    const plainFrente = stripHtmlToPlainText(fcFormFrente).trim();
    const plainVerso = stripHtmlToPlainText(fcFormVerso).trim();

    if (!fcFormDisciplina.trim()) {
      errors.disciplina = 'Selecione ou informe a disciplina.';
    }
    if (fcFormDeckMode === 'novo' && !fcFormNewDeckName.trim()) {
      errors.deck = 'Informe o nome do novo baralho.';
    }
    if (fcFormDeckMode === 'existente' && !fcFormDeckId) {
      errors.deck = 'Selecione um baralho existente.';
    }
    if (!plainFrente) {
      errors.frente = 'A pergunta/frente do cartão é obrigatória.';
    }
    if (!plainVerso) {
      errors.verso = 'A resposta/verso do cartão é obrigatória.';
    }

    if (Object.keys(errors).length > 0) {
      setFcFormErrors(errors);
      return;
    }

    const [loadedDecks, loadedCards] = await Promise.all([
      DatabaseService.getDecks(),
      DatabaseService.getFlashcards(),
    ]);

    let targetDeckId = fcFormDeckId;
    let targetDeckName = '';
    const targetConcursoId = activeConcursoId || currentConcursoObj?.id || 'default';
    const sanitizedFrente = sanitizeFlashcardHtml(fcFormFrente);
    const sanitizedVerso = sanitizeFlashcardHtml(fcFormVerso);

    let updatedDecks: Deck[] = [];
    if (fcFormDeckMode === 'novo') {
      targetDeckId = `deck-${Date.now()}`;
      targetDeckName = fcFormNewDeckName.trim();
      const newDeck: Deck = {
        id: targetDeckId,
        concursoId: targetConcursoId,
        concurso_id: targetConcursoId,
        nome: targetDeckName,
        disciplina: fcFormDisciplina.trim(),
        totalCards: 1,
        pendentesHoje: 1,
      };
      updatedDecks = [newDeck, ...loadedDecks];
    } else {
      const curDeck = loadedDecks.find(d => d.id === targetDeckId);
      targetDeckName = curDeck ? curDeck.nome : 'Baralho';
      updatedDecks = loadedDecks.map(d => {
        if (d.id === targetDeckId) {
          return {
            ...d,
            concursoId: d.concursoId || d.concurso_id || targetConcursoId,
            concurso_id: d.concurso_id || d.concursoId || targetConcursoId,
            totalCards: (d.totalCards || 0) + 1,
            pendentesHoje: (d.pendentesHoje || 0) + 1,
          };
        }
        return d;
      });
    }

    const newFlashcard: Flashcard = {
      id: `card-${Date.now()}`,
      deckId: targetDeckId,
      concursoId: targetConcursoId,
      concurso_id: targetConcursoId,
      disciplina: fcFormDisciplina.trim(),
      topico: fcFormTopico.trim() || undefined,
      frente: sanitizedFrente,
      verso: sanitizedVerso,
      dificuldade: 'bom',
      intervaloDias: 1,
      proximaRevisao: new Date().toISOString(),
      criadoEm: new Date().toISOString(),
      revisoesTotal: 0,
    };

    const updatedCards = [newFlashcard, ...loadedCards];

    await DatabaseService.saveDecks(updatedDecks);
    await DatabaseService.saveFlashcards(updatedCards);

    setAllDecks(updatedDecks);
    setAllFlashcards(updatedCards);

    setFcFormFrente('');
    setFcFormVerso('');
    setFcFormTopico('');
    setFcFormErrors({});
    setIsFlashcardModalOpen(false);

    setSessionSavedFeedback(`Flashcard adicionado com sucesso ao baralho "${targetDeckName}"!`);
    window.setTimeout(() => setSessionSavedFeedback(''), 4000);
  };

  // Exportar / Imprimir PDF Limpo
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfExportSuccess, setPdfExportSuccess] = useState<string>('');

  const handleExportAndPrintPdf = useCallback(
    async (mode: 'pdf_and_print' | 'print_only' = 'pdf_and_print') => {
      const currentContentHtml =
        (!isReadingMode && editorRef.current ? editorRef.current.innerHTML : docHtml) || '';
      const titleText = (docTitle || 'Resumo_Gabarita').trim();
      const discText = currentDisciplina?.name || 'Disciplina Geral';
      const dateStr = new Date().toLocaleDateString('pt-BR');
      const statusLabel =
        docStatus === 'finalizado'
          ? 'Finalizado / Dominado'
          : docStatus === 'em_revisao'
          ? 'Em Revisão'
          : 'Rascunho';

      // Sanitiza texto para a fonte padrão WinAnsi (Latin-1) do jsPDF,
      // evitando caracteres corrompidos (&-p / &þ) e espaçamento largo que corta o texto na direita
      const sanitizePdfText = (raw: string): string => {
        if (!raw) return '';
        return raw
          .replace(/⚖️|⚖/g, '[LEI SECA] ')
          .replace(/⚠️|⚠/g, '[ATENÇÃO] ')
          .replace(/💡/g, '[BIZU] ')
          .replace(/🏛️|🏛/g, '[JURISPRUDÊNCIA] ')
          .replace(/📌/g, '[DESTAQUE] ')
          .replace(/📝/g, '')
          .replace(/✅/g, '[OK] ')
          .replace(/🔄/g, '')
          .replace(/✨/g, '')
          .replace(/📋/g, '')
          .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
          .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
          .replace(/[\u2013\u2014]/g, '-')
          .replace(/\u2026/g, '...')
          .replace(/\u2022/g, '-')
          .replace(/\u00B7/g, '-')
          .replace(/\u00A0/g, ' ')
          .replace(/[\uFE00-\uFE0F\u200B-\u200D]/g, '')
          // Mantém apenas caracteres suportados pela tabela Latin-1 / WinAnsi e quebras de linha
          .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '')
          .replace(/ {2,}/g, ' ')
          .trim();
      };

      setIsGeneratingPdf(true);
      setPdfExportSuccess('');

      try {
        if (mode === 'pdf_and_print') {
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
          });

          const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
          const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
          const marginX = 20; // Margens simétricas de 20mm (área útil centralizada de 170mm)
          const topMargin = 20;
          const bottomMargin = 20;
          const usableWidth = pageWidth - marginX * 2;
          const centerX = pageWidth / 2;
          let cursorY = topMargin;

          const ensureSpace = (neededMm: number) => {
            if (cursorY + neededMm > pageHeight - bottomMargin) {
              pdf.addPage();
              // Faixa superior discreta nas páginas seguintes
              pdf.setFillColor(16, 185, 129);
              pdf.rect(0, 0, pageWidth, 3, 'F');
              cursorY = topMargin;
            }
          };

          pdf.setCharSpace(0);

          // Faixa superior de destaque na página 1
          pdf.setFillColor(16, 185, 129);
          pdf.rect(0, 0, pageWidth, 4, 'F');

          // Cabeçalho Centralizado do Resumo
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8.5);
          pdf.setTextColor(100, 116, 139);
          pdf.text('GABARITA  -  CADERNO DE RESUMOS ESTRUTURADO', centerX, cursorY, {
            align: 'center',
          });
          cursorY += 6.5;

          // Título Principal Centralizado
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(15);
          pdf.setTextColor(15, 23, 42);
          const cleanTitle = sanitizePdfText(titleText) || 'Resumo sem título';
          const titleLines: string[] = pdf.splitTextToSize(cleanTitle, usableWidth - 8);
          titleLines.forEach((line: string) => {
            ensureSpace(7);
            pdf.text(line, centerX, cursorY, { align: 'center' });
            cursorY += 6.4;
          });
          cursorY += 1.5;

          // Subtítulo Centralizado: Disciplina, Status, Data e Tags
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9.5);
          pdf.setTextColor(71, 85, 105);
          const metaLine = sanitizePdfText(
            `${discText}  |  Status: ${statusLabel}  |  Data: ${dateStr}${
              docTags.length > 0 ? `  |  Tags: ${docTags.map(t => `#${t}`).join(' ')}` : ''
            }`
          );
          const metaLines: string[] = pdf.splitTextToSize(metaLine, usableWidth - 8);
          metaLines.forEach((line: string) => {
            ensureSpace(5);
            pdf.text(line, centerX, cursorY, { align: 'center' });
            cursorY += 4.8;
          });
          cursorY += 2.5;

          // Linha divisória do cabeçalho
          pdf.setDrawColor(15, 23, 42);
          pdf.setLineWidth(0.45);
          pdf.line(marginX, cursorY, pageWidth - marginX, cursorY);
          cursorY += 7;

          // Parsear o HTML em elementos estruturados para renderização vetorial limpa no PDF
          const tempContainer = document.createElement('div');
          tempContainer.innerHTML = currentContentHtml || '<p>Resumo em branco.</p>';

          const renderNodeToPdf = (node: Node) => {
            pdf.setCharSpace(0);

            if (node.nodeType === Node.TEXT_NODE) {
              const rawText = sanitizePdfText((node.textContent || '').replace(/\s+/g, ' '));
              if (!rawText) return;
              pdf.setFont('helvetica', 'normal');
              pdf.setFontSize(10.2);
              pdf.setTextColor(30, 41, 59);
              const lines: string[] = pdf.splitTextToSize(rawText, usableWidth);
              for (const line of lines) {
                ensureSpace(5.5);
                pdf.text(line, marginX, cursorY);
                cursorY += 5.2;
              }
              cursorY += 1.5;
              return;
            }

            if (node.nodeType !== Node.ELEMENT_NODE) return;
            const el = node as HTMLElement;
            const tag = el.tagName.toUpperCase();

            // Linha horizontal
            if (tag === 'HR') {
              ensureSpace(6);
              pdf.setDrawColor(203, 213, 225);
              pdf.setLineWidth(0.3);
              pdf.line(marginX, cursorY, pageWidth - marginX, cursorY);
              cursorY += 5.5;
              return;
            }

            // Imagem embutida (centralizada na área útil)
            if (tag === 'IMG') {
              const src = (el as HTMLImageElement).src;
              if (src && src.startsWith('data:image/')) {
                try {
                  const imgWidth = Math.min(usableWidth, 130);
                  const imgHeight = 55;
                  ensureSpace(imgHeight + 6);
                  const format = src.includes('image/png') ? 'PNG' : 'JPEG';
                  const imgX = marginX + (usableWidth - imgWidth) / 2;
                  pdf.addImage(src, format, imgX, cursorY, imgWidth, imgHeight);
                  cursorY += imgHeight + 5;
                } catch {
                  // Ignora imagem inválida
                }
              }
              return;
            }

            // Callout Boxes Especiais (Pegadinha, Lei Seca, Bizu, Jurisprudência)
            const calloutType = el.getAttribute('data-callout');
            if (calloutType) {
              const rawCallout = (el.innerText || el.textContent || '')
                .replace(/\r/g, '')
                .split('\n')
                .map(part => sanitizePdfText(part))
                .filter(Boolean)
                .join(' ');
              if (!rawCallout) return;

              const calloutPaddingX = 6;
              const calloutPaddingY = 4.5;
              const lineHeight = 5.1;
              const calloutTextWidth = usableWidth - calloutPaddingX * 2;

              pdf.setFont('helvetica', 'bold');
              pdf.setFontSize(9.8);
              pdf.setCharSpace(0);
              const lines: string[] = pdf.splitTextToSize(rawCallout, calloutTextWidth);
              const boxHeight = lines.length * lineHeight + calloutPaddingY * 2;

              ensureSpace(boxHeight + 5);
              const boxTop = cursorY;

              if (calloutType === 'pegadinha') {
                pdf.setFillColor(255, 241, 242);
                pdf.setDrawColor(244, 63, 94);
              } else if (calloutType === 'leiseca') {
                pdf.setFillColor(239, 246, 255);
                pdf.setDrawColor(59, 130, 246);
              } else if (calloutType === 'bizu') {
                pdf.setFillColor(255, 251, 235);
                pdf.setDrawColor(245, 158, 11);
              } else {
                pdf.setFillColor(236, 253, 245);
                pdf.setDrawColor(16, 185, 129);
              }

              // Fundo arredondado + barra lateral de destaque
              pdf.roundedRect(marginX, boxTop, usableWidth, boxHeight, 2, 2, 'F');
              pdf.setLineWidth(1.2);
              pdf.line(marginX + 0.6, boxTop + 0.6, marginX + 0.6, boxTop + boxHeight - 0.6);

              pdf.setTextColor(15, 23, 42);
              let textY = boxTop + calloutPaddingY + 3.6;
              lines.forEach((l: string, idx: number) => {
                pdf.setFont('helvetica', idx === 0 ? 'bold' : 'normal');
                pdf.setFontSize(9.8);
                pdf.setCharSpace(0);
                pdf.text(l, marginX + calloutPaddingX, textY);
                textY += lineHeight;
              });

              // Restaura cor e espessura padrão de linha para não afetar tabelas seguintes
              pdf.setDrawColor(203, 213, 225);
              pdf.setLineWidth(0.25);

              cursorY = boxTop + boxHeight + 5;
              return;
            }

            // Títulos H1, H2, H3
            if (tag === 'H1' || tag === 'H2' || tag === 'H3') {
              const headingText = sanitizePdfText((el.textContent || '').replace(/\s+/g, ' '));
              if (!headingText) return;
              const fontSize = tag === 'H1' ? 13.5 : tag === 'H2' ? 12 : 11;
              const lineStep = tag === 'H1' ? 6.2 : tag === 'H2' ? 5.6 : 5.2;
              ensureSpace(10);
              cursorY += 2;
              pdf.setFont('helvetica', 'bold');
              pdf.setFontSize(fontSize);
              pdf.setTextColor(15, 23, 42);
              pdf.setCharSpace(0);
              const lines: string[] = pdf.splitTextToSize(headingText, usableWidth);
              lines.forEach((line: string) => {
                ensureSpace(lineStep + 1);
                pdf.text(line, marginX, cursorY);
                cursorY += lineStep;
              });
              cursorY += 2;
              return;
            }

            // Listas UL / OL
            if (tag === 'UL' || tag === 'OL') {
              const items = Array.from(el.querySelectorAll(':scope > li'));
              items.forEach((li, idx) => {
                const itemText = sanitizePdfText((li.textContent || '').replace(/\s+/g, ' '));
                if (!itemText) return;
                const prefix = tag === 'OL' ? `${idx + 1}. ` : '- ';
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(10.2);
                pdf.setTextColor(30, 41, 59);
                pdf.setCharSpace(0);
                const lines: string[] = pdf.splitTextToSize(
                  `${prefix}${itemText}`,
                  usableWidth - 6
                );
                for (const line of lines) {
                  ensureSpace(5.5);
                  pdf.text(line, marginX + 3, cursorY);
                  cursorY += 5.1;
                }
              });
              cursorY += 2.5;
              return;
            }

            // Tabelas
            if (tag === 'TABLE') {
              const rows = Array.from(el.querySelectorAll('tr'));
              if (rows.length > 0) {
                rows.forEach((tr, rIdx) => {
                  const cells = Array.from(tr.querySelectorAll('th, td'));
                  if (cells.length === 0) return;
                  const colWidth = usableWidth / cells.length;
                  const cellPaddingX = 3;
                  const cellPaddingY = 2.8;
                  const cellLineHeight = 4.6;

                  pdf.setFontSize(9.2);
                  pdf.setCharSpace(0);

                  const cellLinesList: string[][] = cells.map(cell => {
                    const txt = sanitizePdfText((cell.textContent || '').replace(/\s+/g, ' '));
                    return pdf.splitTextToSize(txt || ' ', colWidth - cellPaddingX * 2);
                  });
                  const maxLines = Math.max(1, ...cellLinesList.map(cl => cl.length));
                  const rowHeight = maxLines * cellLineHeight + cellPaddingY * 2;
                  ensureSpace(rowHeight + 2);

                  const rowTop = cursorY;

                  cells.forEach((cell, cIdx) => {
                    const cellX = marginX + cIdx * colWidth;
                    const isHeader = cell.tagName.toUpperCase() === 'TH' || rIdx === 0;
                    pdf.setDrawColor(203, 213, 225);
                    pdf.setLineWidth(0.25);

                    if (isHeader) {
                      pdf.setFillColor(241, 245, 249);
                      pdf.rect(cellX, rowTop, colWidth, rowHeight, 'FD');
                      pdf.setFont('helvetica', 'bold');
                    } else {
                      pdf.rect(cellX, rowTop, colWidth, rowHeight, 'S');
                      pdf.setFont('helvetica', 'normal');
                    }
                    pdf.setFontSize(9.2);
                    pdf.setTextColor(30, 41, 59);
                    pdf.setCharSpace(0);

                    const linesForCell = cellLinesList[cIdx];
                    let cellTextY = rowTop + cellPaddingY + 3.3;
                    linesForCell.forEach((lineStr: string) => {
                      pdf.text(lineStr, cellX + cellPaddingX, cellTextY);
                      cellTextY += cellLineHeight;
                    });
                  });
                  cursorY = rowTop + rowHeight;
                });
                cursorY += 5;
              }
              return;
            }

            // Checklist interativo
            const checkbox = el.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
            if (checkbox && el.children.length <= 3) {
              const labelTxt = sanitizePdfText((el.textContent || '').replace(/\s+/g, ' '));
              const checkMark =
                checkbox.checked || checkbox.hasAttribute('checked') ? '[X]' : '[ ]';
              pdf.setFont('helvetica', 'normal');
              pdf.setFontSize(10.2);
              pdf.setTextColor(30, 41, 59);
              pdf.setCharSpace(0);
              const lines: string[] = pdf.splitTextToSize(
                `${checkMark} ${labelTxt}`,
                usableWidth - 6
              );
              for (const line of lines) {
                ensureSpace(5.5);
                pdf.text(line, marginX + 3, cursorY);
                cursorY += 5.1;
              }
              cursorY += 1.5;
              return;
            }

            // Se o elemento possui blocos filhos estruturais, percorre recursivamente
            const hasBlockChildren = Array.from(el.children).some(child =>
              ['DIV', 'P', 'H1', 'H2', 'H3', 'UL', 'OL', 'TABLE', 'HR', 'BLOCKQUOTE'].includes(
                child.tagName.toUpperCase()
              )
            );
            if (hasBlockChildren) {
              Array.from(el.childNodes).forEach(renderNodeToPdf);
              return;
            }

            // Parágrafo normal ou bloco simples
            const paragraphText = sanitizePdfText(
              (el.innerText || el.textContent || '').replace(/\s+/g, ' ')
            );
            if (!paragraphText) return;
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10.2);
            pdf.setTextColor(30, 41, 59);
            pdf.setCharSpace(0);
            const lines: string[] = pdf.splitTextToSize(paragraphText, usableWidth);
            for (const line of lines) {
              ensureSpace(5.5);
              pdf.text(line, marginX, cursorY);
              cursorY += 5.1;
            }
            cursorY += 2.4;
          };

          Array.from(tempContainer.childNodes).forEach(renderNodeToPdf);

          // Rodapé centralizado/alinhado às margens com numeração de páginas
          const totalPages = pdf.getNumberOfPages();
          for (let p = 1; p <= totalPages; p++) {
            pdf.setPage(p);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(148, 163, 184);
            pdf.setCharSpace(0);
            pdf.text(
              sanitizePdfText(`Gabarita - Caderno de Resumos - ${discText}`),
              marginX,
              pageHeight - 10
            );
            pdf.text(`Página ${p} de ${totalPages}`, pageWidth - marginX, pageHeight - 10, {
              align: 'right',
            });
          }

          const safeFileName =
            titleText
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-zA-Z0-9_-]+/g, '_')
              .replace(/^_+|_+$/g, '')
              .slice(0, 60) || 'Resumo_Gabarita';

          pdf.save(`${safeFileName}.pdf`);
          setPdfExportSuccess(`PDF "${safeFileName}.pdf" salvo com sucesso!`);
        }

        // Também aciona impressão limpa via iframe isolado quando suportado pelo navegador
        if (mode === 'print_only') {
          const printIframe = document.createElement('iframe');
          printIframe.style.position = 'fixed';
          printIframe.style.right = '0';
          printIframe.style.bottom = '0';
          printIframe.style.width = '0';
          printIframe.style.height = '0';
          printIframe.style.border = '0';
          document.body.appendChild(printIframe);

          const doc = printIframe.contentWindow?.document;
          if (doc) {
            doc.open();
            doc.write(`<!DOCTYPE html>
              <html lang="pt-BR">
              <head>
                <meta charset="utf-8" />
                <title>${titleText}</title>
                <style>
                  @page { size: A4; margin: 20mm; }
                  * { box-sizing: border-box; }
                  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.65; font-size: 13px; margin: 0 auto; padding: 0; max-width: 170mm; overflow-wrap: break-word; word-wrap: break-word; }
                  .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 18px; text-align: center; }
                  .badge { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
                  h1.doc-title { font-size: 20px; font-weight: 900; margin: 6px 0; color: #0f172a; }
                  .meta { font-size: 11px; color: #475569; margin: 0; }
                  .content { width: 100%; overflow-wrap: break-word; }
                  .content h1, .content h2, .content h3 { color: #0f172a; margin-top: 16px; margin-bottom: 8px; }
                  .content table { width: 100%; border-collapse: collapse; margin: 12px 0; table-layout: fixed; }
                  .content th, .content td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; word-break: break-word; }
                  .content img { max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 10px auto; }
                </style>
              </head>
              <body>
                <div class="header">
                  <div class="badge">Gabarita · Caderno de Resumos Estruturado</div>
                  <h1 class="doc-title">${titleText}</h1>
                  <p class="meta">${discText} · Status: ${statusLabel} · Data: ${dateStr}${
              docTags.length > 0 ? ` · Tags: ${docTags.map(t => `#${t}`).join(' ')}` : ''
            }</p>
                </div>
                <div class="content">${currentContentHtml || '<p>Resumo em branco.</p>'}</div>
              </body>
              </html>`);
            doc.close();
            setTimeout(() => {
              try {
                printIframe.contentWindow?.focus();
                printIframe.contentWindow?.print();
              } catch {
                // fallback silencioso caso bloqueado em iframe
              }
              setTimeout(() => {
                if (document.body.contains(printIframe)) {
                  document.body.removeChild(printIframe);
                }
              }, 2000);
            }, 250);
          }
        }
      } finally {
        setIsGeneratingPdf(false);
      }
    },
    [isReadingMode, docHtml, docTitle, currentDisciplina, docStatus, docTags]
  );

  // Restaurar versão anterior do resumo
  const handleRestoreVersion = async (ver: ResumoVersaoHistorico) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = ver.contentHtml;
    }
    setDocHtml(ver.contentHtml);
    await persistCurrentResumo({ html: ver.contentHtml });
    setIsVersionsModalOpen(false);
  };

  // Excluir Resumo Atual
  const handleDeleteCurrentResumo = async () => {
    if (!activeResumoId) {
      if (editorRef.current) editorRef.current.innerHTML = '';
      setDocHtml('');
      setIsDeleteConfirmOpen(false);
      return;
    }
    const remaining = await DatabaseService.deleteResumo(activeResumoId);
    setResumos(remaining.filter(r => !activeConcursoId || r.concursoId === activeConcursoId));
    setActiveResumoId('');
    setDocHtml('');
    if (editorRef.current) editorRef.current.innerHTML = '';
    setIsDeleteConfirmOpen(false);
  };

  // Contadores em tempo real do documento aberto
  const liveMetrics = useMemo(() => {
    const plain = extractPlainText(docHtml);
    const words = countWords(plain);
    const chars = plain.length;
    const readMins = words > 0 ? Math.max(1, Math.ceil(words / 200)) : 0;
    return { words, chars, readMins };
  }, [docHtml]);

  const activeResumoObj = useMemo(
    () => resumos.find(r => r.id === activeResumoId) || null,
    [resumos, activeResumoId]
  );

  // Tópicos filtrados na sidebar esquerda da Visão 2
  const filteredSidebarTopics = useMemo(() => {
    const q = topicSearchQuery.trim().toLowerCase();
    return currentDisciplinaTopicos.filter(t => {
      if (q && !t.name.toLowerCase().includes(q)) return false;
      const resumido = currentDisciplinaResumos.find(r => r.assuntoId === t.id && r.plainText.trim().length > 0);
      if (topicFilter === 'com_resumo') return Boolean(resumido);
      if (topicFilter === 'pendentes') return !resumido;
      if (topicFilter === 'favoritos') return Boolean(resumido?.isFavorite);
      return true;
    });
  }, [currentDisciplinaTopicos, currentDisciplinaResumos, topicSearchQuery, topicFilter]);

  // Estado vazio se não houver concurso ativo ou disciplinas
  if (!activeConcursoId || activeDisciplinas.length === 0) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
        <MenuBannerFrame
          bannerThemes={RESUMOS_BANNER_IMAGES}
          minHeight="min-h-[190px] md:min-h-[220px]"
          className="w-full border border-slate-200/20 dark:border-slate-800 shadow-xl flex items-center bg-slate-950"
          bgWrapperClassName="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0"
          imgClassName="w-full h-full object-cover object-center scale-[1.12] pointer-events-none select-none transition-transform duration-300"
          overlayClassName="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/45 to-transparent pointer-events-none"
          contentClassName="p-6 md:p-8 flex flex-col justify-start items-start max-w-2xl h-full gap-3.5"
          alt="Caderno de Resumos"
          fallbackSkin="verde"
        >
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-3 flex-wrap">
              <div
                className="w-11 h-11 rounded-xl bg-black/50 border border-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-md"
                style={{ color: themeGlowStyles.color }}
              >
                <NotebookPen className="w-6 h-6" />
              </div>
              <h2
                className="provas-banner-title text-xl sm:text-2xl md:text-3xl font-extrabold !text-white tracking-tight leading-tight select-none drop-shadow-md"
                style={{ color: '#FFFFFF', textShadow: themeGlowStyles.textShadow }}
              >
                Caderno de Resumos
              </h2>
            </div>
            <p className="text-xs sm:text-sm !text-white/90 leading-relaxed max-w-xl drop-shadow-xs">
              Construa seus próprios resumos definitivos, destaque artigos, crie esquemas de revisão rápida e concentre os pontos-chave de cada tópico do edital.
            </p>
          </div>
        </MenuBannerFrame>

        <EmptyContestState
          title="Cadastre suas disciplinas para abrir seu Caderno de Resumos"
          description="Seus cadernos inteligentes são organizados automaticamente por matéria e tópico do seu Edital Verticalizado."
          actionText="Ir para Concursos & Edital"
          onAction={() => onNavigateTab('concursos')}
          icon={NotebookPen}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {viewMode === 'estante' ? (
        <>
          {/* VISÃO 1: ESTANTE DE CADERNOS POR DISCIPLINA */}
          <MenuBannerFrame
            bannerThemes={RESUMOS_BANNER_IMAGES}
            minHeight="min-h-[190px] md:min-h-[220px]"
            className="w-full border border-slate-200/20 dark:border-slate-800 shadow-xl flex items-center bg-slate-950"
            bgWrapperClassName="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0"
            imgClassName="w-full h-full object-cover object-center scale-[1.12] pointer-events-none select-none transition-transform duration-300"
            overlayClassName="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/45 to-transparent pointer-events-none"
            contentClassName="p-6 md:p-8 flex flex-col justify-between items-start max-w-2xl h-full gap-3.5"
            alt="Caderno de Resumos"
            fallbackSkin="verde"
          >
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-3 flex-wrap">
                <div
                  className="w-11 h-11 rounded-xl bg-black/50 border border-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-md"
                  style={{ color: themeGlowStyles.color }}
                >
                  <NotebookPen className="w-6 h-6" />
                </div>
                <h2
                  className="provas-banner-title text-xl sm:text-2xl md:text-3xl font-extrabold !text-white tracking-tight leading-tight select-none drop-shadow-md"
                  style={{ color: '#FFFFFF', textShadow: themeGlowStyles.textShadow }}
                >
                  Caderno de Resumos
                </h2>
              </div>
              <p className="text-xs sm:text-sm !text-white/90 leading-relaxed max-w-xl drop-shadow-xs">
                Construa seus próprios resumos definitivos, destaque artigos, crie esquemas de revisão rápida e concentre os pontos-chave de cada tópico do edital.
              </p>
            </div>

            <div className="shrink-0 self-start pt-1">
              <button
                type="button"
                onClick={() => {
                  const firstDisc = activeDisciplinas[0];
                  setModalDiscId(firstDisc?.id || '');
                  const firstTop = activeAssuntos.find(a => a.disciplinaId === firstDisc?.id);
                  setModalAssuntoId(firstTop?.id || '');
                  setModalTopicMode(firstTop ? 'topico' : 'avulsa');
                  setModalCustomTitle('');
                  setIsNovoResumoModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg transition-all cursor-pointer hover:brightness-110"
                style={{
                  backgroundColor: themeGlowStyles.color,
                  boxShadow: `0 8px 24px -4px ${themeGlowStyles.color}66`,
                }}
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span> Novo Resumo</span>
              </button>
            </div>
          </MenuBannerFrame>

          {/* B. 4 CARDS DE RESUMO (KPIs) NO TOPO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Resumos Criados */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase font-extrabold tracking-wider text-slate-500 dark:text-slate-400">
                  Resumos Criados
                </span>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${themeGlowStyles.color}18`,
                    color: themeGlowStyles.color,
                  }}
                >
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {kpiStats.totalResumos} {kpiStats.totalResumos === 1 ? 'resumo' : 'resumos'}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {kpiStats.finalizados} finalizados · {kpiStats.emAndamento} em rascunho/revisão
              </p>
            </div>

            {/* KPI 2: Cobertura do Edital Resumida */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase font-extrabold tracking-wider text-slate-500 dark:text-slate-400">
                  Cobertura do Edital Resumida
                </span>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${themeGlowStyles.color}18`,
                    color: themeGlowStyles.color,
                  }}
                >
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {kpiStats.coberturaPercent}%{' '}
                <span className="text-xs font-semibold text-slate-400">
                  ({kpiStats.topicosResumidosCount} de {kpiStats.totalTopicosEdital} tópicos)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${kpiStats.coberturaPercent}%`,
                    backgroundColor: themeGlowStyles.color,
                  }}
                />
              </div>
            </div>

            {/* KPI 3: Resumos de Véspera (Favoritos) */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase font-extrabold tracking-wider text-slate-500 dark:text-slate-400">
                  Resumos de Véspera
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {kpiStats.favoritosCount} {kpiStats.favoritosCount === 1 ? 'destacado' : 'destacados'}
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                Prontos para revisão acelerada
              </p>
            </div>

            {/* KPI 4: Volume de Síntese */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase font-extrabold tracking-wider text-slate-500 dark:text-slate-400">
                  Volume de Síntese
                </span>
                <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {kpiStats.totalWords.toLocaleString('pt-BR')}{' '}
                <span className="text-sm font-semibold text-slate-400">palavras</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>~{kpiStats.totalReadingMinutes} min de leitura total</span>
              </p>
            </div>
          </div>

          {/* C. BARRA DE BUSCA GLOBAL PROFUNDA E FILTROS RÁPIDOS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={globalSearchQuery}
                onChange={e => setGlobalSearchQuery(e.target.value)}
                placeholder="Pesquisar dentro dos seus resumos por palavra-chave, artigo de lei, tópico, #tag ou disciplina..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': themeGlowStyles.color } as React.CSSProperties}
              />
              {globalSearchQuery && (
                <button
                  type="button"
                  onClick={() => setGlobalSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'todas', label: 'Todas as Matérias' },
                  { id: 'com_resumos', label: 'Com Resumos' },
                  { id: 'sem_resumos', label: 'Sem Resumos' },
                  { id: 'favoritos', label: '⭐ Apenas Favoritos de Véspera' },
                  { id: 'finalizados', label: 'Finalizados' },
                ] as const
              ).map(f => {
                const isActive = estanteFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setEstanteFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                    style={isActive ? { backgroundColor: themeGlowStyles.color } : undefined}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            {/* Resultados Encontrados nos Cadernos (Full-Text Search) */}
            {globalSearchQuery.trim().length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Resultados Encontrados nos Cadernos ({globalSearchResults.length})
                  </span>
                </div>
                {globalSearchResults.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">
                    Nenhum resumo contém o termo &ldquo;{globalSearchQuery}&rdquo;.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                    {globalSearchResults.map(({ resumo, snippet }) => (
                      <div
                        key={resumo.id}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-2 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
                              {resumo.disciplinaName} · {resumo.assuntoName}
                            </span>
                            {resumo.isFavorite && (
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {resumo.title}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                            {snippet || 'Resumo sem texto adicional.'}
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                          <span className="text-[11px] text-slate-400">
                            {resumo.wordCount} palavras · ~{resumo.readingTimeMinutes} min
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenDisciplinaWorkspace(
                                resumo.disciplinaId,
                                resumo.assuntoId,
                                resumo.id
                              )
                            }
                            className="text-xs font-bold flex items-center gap-1 cursor-pointer hover:underline"
                            style={{ color: themeGlowStyles.color }}
                          >
                            <span>Abrir no Caderno</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* D. SEÇÃO ACESSO RÁPIDO: CONTINUAR EDITANDO */}
          {recentResumos.length > 0 && !globalSearchQuery.trim() && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" style={{ color: themeGlowStyles.color }} />
                  <span>Acesso Rápido: Continuar Editando</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {recentResumos.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() =>
                      handleOpenDisciplinaWorkspace(r.disciplinaId, r.assuntoId, r.id)
                    }
                    className="text-left p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <SubjectIcon subjectName={r.disciplinaName} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:underline">
                          {r.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {r.disciplinaName} · {r.wordCount} palavras
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* E. GRADE DE CADERNOS POR DISCIPLINA */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {estanteDisciplinasCards.map(card => {
              const { disciplina: disc } = card;
              const formattedDate = card.lastUpdated
                ? new Date(card.lastUpdated).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                  })
                : null;

              return (
                <Card
                  key={disc.id}
                  className="overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  {/* Faixa superior com a cor da disciplina */}
                  <div
                    className="h-1.5 w-full"
                    style={{ backgroundColor: disc.color || themeGlowStyles.color }}
                  />
                  <CardBody className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <SubjectIcon subjectName={disc.name} className="w-8 h-8" />
                          <div className="min-w-0">
                            <h3
                              className="text-sm font-extrabold text-slate-900 dark:text-white truncate"
                              title={disc.name}
                            >
                              {disc.name}
                            </h3>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {card.topicosResumidosCount} / {card.totalTopicos} tópicos resumidos
                              {card.avulsasCount > 0 ? ` · +${card.avulsasCount} avulsa(s)` : ''}
                            </span>
                          </div>
                        </div>

                        {card.favoritosCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-500 shrink-0">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            {card.favoritosCount}
                          </span>
                        )}
                      </div>

                      {/* Barra de Progresso de Resumos da Matéria */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          <span>Progresso do Caderno</span>
                          <span style={{ color: disc.color || themeGlowStyles.color }}>
                            {card.progressPct}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${card.progressPct}%`,
                              backgroundColor: disc.color || themeGlowStyles.color,
                            }}
                          />
                        </div>
                      </div>

                      {/* Preview dos últimos tópicos resumidos */}
                      <div className="pt-1 space-y-1.5 min-h-[44px]">
                        {card.recentTopics.length > 0 ? (
                          card.recentTopics.map(rt => (
                            <div
                              key={rt.id}
                              onClick={() =>
                                handleOpenDisciplinaWorkspace(disc.id, rt.assuntoId, rt.id)
                              }
                              className="flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer truncate"
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <FileCheck2
                                  className="w-3.5 h-3.5 shrink-0"
                                  style={{ color: disc.color || themeGlowStyles.color }}
                                />
                                <span className="truncate">{rt.title}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {rt.wordCount} pal.
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                            Nenhum resumo iniciado nesta matéria
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Rodapé do Card */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {formattedDate ? `Editado em ${formattedDate}` : 'Caderno pronto'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenDisciplinaWorkspace(disc.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer hover:brightness-110"
                        style={{ backgroundColor: themeGlowStyles.color }}
                      >
                        <span>Abrir Caderno</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        /* VISÃO 2: WORKSPACE DO CADERNO DA DISCIPLINA & EDITOR RICO DE RESUMOS */
        <div className="space-y-4">
          {/* A. BARRA SUPERIOR DO CADERNO (HEADER DO WORKSPACE) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            {/* Esquerda: Voltar + Seletor Rápido de Disciplina */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={async () => {
                  await persistCurrentResumo();
                  setViewMode('estante');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar para Estante</span>
              </button>

              {currentDisciplina && (
                <div className="flex items-center gap-2">
                  <SubjectIcon subjectName={currentDisciplina.name} className="w-7 h-7" />
                  <select
                    value={currentDisciplina.id}
                    onChange={e => handleOpenDisciplinaWorkspace(e.target.value)}
                    className="text-xs sm:text-sm font-extrabold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  >
                    {activeDisciplinas.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsMobileTopicsOpen(prev => !prev)}
                className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Índice de Tópicos</span>
              </button>
            </div>

            {/* Direita: Cronômetro Integrado + Modo Foco + Nota Avulsa */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Cronômetro Integrado de Sessão de Resumo */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <Clock className="w-3.5 h-3.5" style={{ color: themeGlowStyles.color }} />
                <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {formatTimerClock(timerSeconds)}
                </span>
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(prev => !prev)}
                  className="px-2 py-1 rounded-lg text-[11px] font-bold text-white flex items-center gap-1 cursor-pointer"
                  style={{ backgroundColor: isTimerRunning ? '#F59E0B' : themeGlowStyles.color }}
                >
                  {isTimerRunning ? (
                    <>
                      <Pause className="w-3 h-3" />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" />
                      <span>Iniciar</span>
                    </>
                  )}
                </button>
                {timerSeconds > 0 && (
                  <button
                    type="button"
                    onClick={handleRegisterTimerSession}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-950 hover:opacity-90 cursor-pointer"
                  >
                    Registrar no Histórico
                  </button>
                )}
              </div>

              {sessionSavedFeedback && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {sessionSavedFeedback}
                </span>
              )}

              {/* Botão Modo Foco */}
              <button
                type="button"
                onClick={() => setIsFocusMode(prev => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Alternar Modo Foco (Ocultar barra lateral de tópicos)"
              >
                {isFocusMode ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mostrar Índice</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Modo Foco</span>
                  </>
                )}
              </button>

              {/* Botão Nota Avulsa */}
              <button
                type="button"
                onClick={handleCreateNotaAvulsaInWorkspace}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer hover:brightness-110"
                style={{ backgroundColor: themeGlowStyles.color }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nota Avulsa</span>
              </button>
            </div>
          </div>

          {/* CORPO DO WORKSPACE: COLUNA ESQUERDA (ÍNDICE) + COLUNA DIREITA (EDITOR RICO) */}
          <div className="flex flex-col lg:flex-row gap-4 items-start">
            {/* B. COLUNA ESQUERDA: ÍNDICE DE TÓPICOS DA MATÉRIA */}
            {(!isFocusMode || isMobileTopicsOpen) && (
              <aside
                className={`w-full lg:w-[330px] shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3 ${
                  isMobileTopicsOpen ? 'block' : 'hidden lg:block'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Tópicos do Edital ({currentDisciplinaTopicos.length})
                  </span>
                </div>

                {/* Busca interna de tópicos */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={topicSearchQuery}
                    onChange={e => setTopicSearchQuery(e.target.value)}
                    placeholder="Filtrar tópico da matéria..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                {/* Filtro rápido de tópicos */}
                <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
                  {(
                    [
                      { id: 'todos', label: 'Todos' },
                      { id: 'com_resumo', label: 'Resumidos' },
                      { id: 'pendentes', label: 'Pendentes' },
                      { id: 'favoritos', label: '⭐ Véspera' },
                    ] as const
                  ).map(tf => (
                    <button
                      key={tf.id}
                      type="button"
                      onClick={() => setTopicFilter(tf.id)}
                      className={`py-1 px-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer truncate ${
                        topicFilter === tf.id
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>

                {/* Lista de Tópicos do Edital Verticalizado */}
                <div className="max-h-[540px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {filteredSidebarTopics.map((assunto, index) => {
                    const resumoMatch = currentDisciplinaResumos.find(
                      r => r.assuntoId === assunto.id && r.plainText.trim().length > 0
                    );
                    const isSelected = selectedAssuntoId === assunto.id;

                    return (
                      <button
                        key={assunto.id}
                        type="button"
                        onClick={() => handleSelectTopicInSidebar(assunto)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-slate-100 dark:bg-slate-800/90 border-slate-300 dark:border-slate-700 shadow-2xs'
                            : 'bg-slate-50/60 dark:bg-slate-950/40 border-transparent hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                        }`}
                        style={
                          isSelected
                            ? { borderLeftWidth: '4px', borderLeftColor: themeGlowStyles.color }
                            : undefined
                        }
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          {resumoMatch ? (
                            <FileCheck2
                              className="w-4 h-4 shrink-0 mt-0.5"
                              style={{ color: themeGlowStyles.color }}
                            />
                          ) : (
                            <FilePlus className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">
                              {formatTopicLabel(assunto.name, assunto.order || index + 1)}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {resumoMatch
                                ? `${resumoMatch.wordCount} palavras · ${
                                    resumoMatch.status === 'finalizado'
                                      ? 'Finalizado'
                                      : resumoMatch.status === 'em_revisao'
                                      ? 'Em revisão'
                                      : 'Rascunho'
                                  }`
                                : 'Criar resumo'}
                            </p>
                          </div>
                        </div>

                        {resumoMatch?.isFavorite && (
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}

                  {/* Seção de Notas Avulsas da Disciplina */}
                  {notasAvulsasDisciplina.length > 0 && (
                    <div className="pt-3 mt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-1">
                        Notas Avulsas &amp; Esquemas ({notasAvulsasDisciplina.length})
                      </span>
                      {notasAvulsasDisciplina.map(nota => {
                        const isSelected = !selectedAssuntoId && activeResumoId === nota.id;
                        return (
                          <button
                            key={nota.id}
                            type="button"
                            onClick={() => handleSelectNotaAvulsa(nota)}
                            className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                              isSelected
                                ? 'bg-slate-100 dark:bg-slate-800/90 border-slate-300 dark:border-slate-700'
                                : 'bg-slate-50/60 dark:bg-slate-950/40 border-transparent hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                {nota.title}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                {nota.wordCount} palavras · Nota avulsa
                              </p>
                            </div>
                            {nota.isFavorite && (
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </aside>
            )}

            {/* C. COLUNA DIREITA: EDITOR RICO DE CADERNO DE ESTUDOS */}
            <div className="flex-1 min-w-0 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden flex flex-col">
              {/* Cabeçalho do Documento de Resumo */}
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <input
                    type="text"
                    value={docTitle}
                    disabled={isReadingMode}
                    onChange={e => {
                      setDocTitle(e.target.value);
                      triggerDebouncedSave(undefined, e.target.value);
                    }}
                    placeholder="Título do Resumo..."
                    className="flex-1 text-lg sm:text-xl font-black text-slate-900 dark:text-white bg-transparent border-b border-transparent focus:border-slate-300 dark:focus:border-slate-700 focus:outline-none pb-1"
                  />

                  <div className="flex items-center gap-2 shrink-0">
                    {lastSavedTime && (
                      <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Salvo às {lastSavedTime}</span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => persistCurrentResumo()}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs transition-all cursor-pointer hover:brightness-110"
                      style={{ backgroundColor: themeGlowStyles.color }}
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Salvando...' : 'Salvar Resumo'}</span>
                    </button>
                  </div>
                </div>

                {/* Barra de Metadados e Ações do Tópico */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  {/* Seletor de Status + Favorito */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                      {(
                        [
                          { id: 'rascunho', label: '📝 Rascunho' },
                          { id: 'em_revisao', label: '🔄 Em Revisão' },
                          { id: 'finalizado', label: '✅ Finalizado / Dominado' },
                        ] as const
                      ).map(st => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => handleStatusChange(st.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            docStatus === st.id
                              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleFavorite}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        docFavorite
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-400/50'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${docFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
                      <span>Resumo de Véspera</span>
                    </button>
                  </div>

                  {/* Ações Rápidas: Gerar Flashcard, Imprimir PDF, Modo Leitura, Folha Pautada */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleOpenFlashcardGenerator}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span> Gerar Flashcard</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (editorRef.current) {
                          setDocHtml(editorRef.current.innerHTML);
                        }
                        setPdfExportSuccess('');
                        setIsPrintPreviewOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span> Exportar / PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsLinedPaper(prev => !prev)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        isLinedPaper
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                      title="Ativar/Desativar linhas pautadas do caderno"
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Pauta</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!isReadingMode && editorRef.current) {
                          setDocHtml(editorRef.current.innerHTML);
                        }
                        setIsReadingMode(prev => !prev);
                      }}
                      title="Abrir resumo em Modo Leitura de Tela Cheia"
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                        isReadingMode
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {isReadingMode ? (
                        <>
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Modo Edição</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Modo Leitura</span>
                          <Maximize2 className="w-3 h-3 opacity-75 ml-0.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Gerenciador de Tags Rápidas */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400 mr-1" />
                  {docTags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg"
                    >
                      #{tag}
                      {!isReadingMode && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}

                  {!isReadingMode && (
                    <>
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={e => setNewTagInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag(newTagInput);
                          }
                        }}
                        placeholder="+ #tag..."
                        className="text-xs px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 w-24 focus:outline-none"
                      />
                      <div className="flex items-center gap-1 ml-1">
                        {SUGGESTED_TAGS.filter(st => !docTags.includes(st))
                          .slice(0, 4)
                          .map(sug => (
                            <button
                              key={sug}
                              type="button"
                              onClick={() => handleAddTag(sug)}
                              className="text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                            >
                              +#{sug}
                            </button>
                          ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* BARRA DE FERRAMENTAS DE FORMATAÇÃO RICA (STICKY TOOLBAR) */}
              {!isReadingMode && (
                <div className="sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-2.5 flex flex-wrap items-center gap-1.5">
                  {/* Undo / Redo */}
                  <button
                    type="button"
                    onClick={() => execFormatCommand('undo')}
                    title="Desfazer (Ctrl+Z)"
                    className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execFormatCommand('redo')}
                    title="Refazer (Ctrl+Y)"
                    className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Redo2 className="w-4 h-4" />
                  </button>

                  <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

                  {/* Hierarquia de Títulos */}
                  <select
                    onChange={e => {
                      const val = e.target.value;
                      execFormatCommand('formatBlock', val);
                      e.target.value = '';
                    }}
                    defaultValue=""
                    className="text-xs font-bold px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="" disabled>
                      Título / Parágrafo
                    </option>
                    <option value="H1">H1 - Título Principal</option>
                    <option value="H2">H2 - Subtítulo</option>
                    <option value="H3">H3 - Seção</option>
                    <option value="P">Parágrafo Normal</option>
                  </select>

                  {/* Estilos de Fonte */}
                  <button
                    type="button"
                    onClick={() => execFormatCommand('bold')}
                    title="Negrito (Ctrl+B)"
                    className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execFormatCommand('italic')}
                    title="Itálico (Ctrl+I)"
                    className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execFormatCommand('underline')}
                    title="Sublinhado (Ctrl+U)"
                    className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Underline className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execFormatCommand('strikeThrough')}
                    title="Tachado"
                    className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Strikethrough className="w-4 h-4" />
                  </button>

                  <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

                  {/* Marca-Texto Semântico de Concurseiro (5 Cores) */}
                  <div className="relative flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1">
                    <Highlighter className="w-3.5 h-3.5 text-slate-500 mr-0.5" />
                    {HIGHLIGHT_COLORS.map(hc => (
                      <button
                        key={hc.id}
                        type="button"
                        onClick={() => execFormatCommand('hiliteColor', hc.bg)}
                        title={hc.label}
                        className="w-4 h-4 rounded-full border hover:scale-110 transition-transform cursor-pointer"
                        style={{ backgroundColor: hc.dot, borderColor: hc.border }}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        execFormatCommand('hiliteColor', 'transparent');
                        execFormatCommand('removeFormat');
                      }}
                      title="Limpar grifo / formatação"
                      className="p-0.5 text-slate-400 hover:text-rose-500 ml-0.5 cursor-pointer"
                    >
                      <Eraser className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

                  {/* Listas e Checklist */}
                  <button
                    type="button"
                    onClick={() => execFormatCommand('insertUnorderedList')}
                    title="Lista com marcadores"
                    className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execFormatCommand('insertOrderedList')}
                    title="Lista numerada"
                    className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleInsertChecklist}
                    title="Inserir Checklist Interativo"
                    className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <CheckSquare className="w-4 h-4" />
                  </button>

                  <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

                  {/* Blocos Especiais de Concurseiro (Callout Boxes com 1 clique) */}
                  <button
                    type="button"
                    onClick={() => handleInsertCallout('pegadinha')}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 cursor-pointer"
                    title="Inserir bloco Pegadinha de Banca"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    <span>Pegadinha</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertCallout('leiseca')}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 cursor-pointer"
                    title="Inserir bloco Lei Seca / Artigo"
                  >
                    <Scale className="w-3 h-3" />
                    <span>Lei Seca</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertCallout('bizu')}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 cursor-pointer"
                    title="Inserir bloco Bizu / Mnemônico"
                  >
                    <Lightbulb className="w-3 h-3" />
                    <span>Bizu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertCallout('jurisprudencia')}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer"
                    title="Inserir bloco Jurisprudência (STF/STJ)"
                  >
                    <Landmark className="w-3 h-3" />
                    <span>Jurisprudência</span>
                  </button>

                  <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

                  {/* Recursos Visuais: Tabela, Imagem, Linha Divisória, Modelos */}
                  <button
                    type="button"
                    onClick={handleInsertTable}
                    title="Inserir Tabela Comparativa (3x3)"
                    className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Table className="w-4 h-4" />
                  </button>

                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    title="Inserir Imagem / Esquema do computador (ou cole com Ctrl+V)"
                    className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      insertHtmlAtCursor(
                        `<hr style="margin: 18px 0; border: 0; border-top: 1px solid rgba(148,163,184,0.35);" /><p><br/></p>`
                      )
                    }
                    title="Inserir Linha Divisória"
                    className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  {/* Menu Usar Modelo */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowTemplateMenu(prev => !prev)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span> Usar Modelo</span>
                    </button>
                    {showTemplateMenu && (
                      <div className="absolute right-0 mt-1 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1.5 z-30 space-y-1">
                        <button
                          type="button"
                          onClick={() => handleApplyTemplate(TEMPLATE_PADRAO_TOPICO)}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          Modelo Padrão de Tópico (Conceito, Base Legal, Jurisprudência e Pegadinhas)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyTemplate(TEMPLATE_LEI_SECA)}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          Modelo de Lei Seca Esquematizada (Regra, Exceções e Prazos)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Atalhos Rápidos de Modelo quando a folha está em branco */}
              {!isReadingMode && liveMetrics.words === 0 && (
                <div className="px-6 pt-5 pb-2 bg-slate-50/60 dark:bg-slate-950/30 border-b border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Folha em branco — inicie digitando abaixo ou escolha uma estrutura pronta:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplyTemplate(TEMPLATE_PADRAO_TOPICO)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-400 cursor-pointer"
                    >
                      📋 Modelo Padrão de Tópico
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyTemplate(TEMPLATE_LEI_SECA)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-400 cursor-pointer"
                    >
                      ⚖️ Modelo de Lei Seca Esquematizada
                    </button>
                  </div>
                </div>
              )}

              {/* FOLHA DO CADERNO (ÁREA EDITÁVEL) */}
              <div
                className="flex-1 p-6 sm:p-8 min-h-[480px]"
                style={
                  isLinedPaper
                    ? {
                        backgroundImage:
                          'repeating-linear-gradient(transparent, transparent 31px, rgba(148, 163, 184, 0.2) 31px, rgba(148, 163, 184, 0.2) 32px)',
                        lineHeight: '32px',
                      }
                    : undefined
                }
              >
                <div
                  ref={editorRef}
                  contentEditable={!isReadingMode}
                  suppressContentEditableWarning
                  onInput={handleEditorInput}
                  onClick={handleEditorClick}
                  onPaste={handleEditorPaste}
                  data-placeholder="Comece a escrever seu resumo estruturado deste tópico..."
                  className="w-full min-h-[430px] focus:outline-none text-slate-800 dark:text-slate-100 text-sm sm:text-base leading-relaxed prose dark:prose-invert max-w-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400"
                />
              </div>

              {/* BARRA INFERIOR DE STATUS DO CADERNO (FOOTER DO EDITOR) */}
              <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-3 flex-wrap">
                  <span>
                    <strong className="text-slate-700 dark:text-slate-200">{liveMetrics.words}</strong> palavras
                  </span>
                  <span>·</span>
                  <span>{liveMetrics.chars} caracteres</span>
                  <span>·</span>
                  <span>~{liveMetrics.readMins} min de leitura</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsVersionsModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>
                      Histórico de Versões ({activeResumoObj?.versions?.length || 0})
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-rose-500/10 text-rose-500 font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Resumo</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: + NOVO RESUMO RÁPIDO (VISÃO 1) */}
      <Modal
        isOpen={isNovoResumoModalOpen}
        onClose={() => setIsNovoResumoModalOpen(false)}
        title="Novo Resumo no Caderno"
      >
        <form
          onSubmit={async e => {
            e.preventDefault();
            if (!modalDiscId) return;
            const disc = activeDisciplinas.find(d => d.id === modalDiscId);
            if (!disc) return;

            if (modalTopicMode === 'topico' && modalAssuntoId) {
              setIsNovoResumoModalOpen(false);
              handleOpenDisciplinaWorkspace(disc.id, modalAssuntoId);
            } else {
              const title =
                modalCustomTitle.trim() || `Resumo Avulso - ${disc.name}`;
              const created = await DatabaseService.saveResumo({
                userId,
                concursoId: activeConcursoId,
                disciplinaId: disc.id,
                disciplinaName: disc.name,
                assuntoId: undefined,
                assuntoName: 'Nota Avulsa',
                title,
                contentHtml: '',
                plainText: '',
                status: 'rascunho',
                isFavorite: false,
                tags: [],
                wordCount: 0,
                readingTimeMinutes: 1,
                totalStudySeconds: 0,
              });
              setResumos(prev => [created, ...prev.filter(r => r.id !== created.id)]);
              setIsNovoResumoModalOpen(false);
              handleOpenDisciplinaWorkspace(disc.id, undefined, created.id);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Disciplina do Concurso Ativo *
            </label>
            <select
              value={modalDiscId}
              onChange={e => {
                const nextId = e.target.value;
                setModalDiscId(nextId);
                const firstAssunto = activeAssuntos.find(a => a.disciplinaId === nextId);
                setModalAssuntoId(firstAssunto?.id || '');
              }}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white"
              required
            >
              {activeDisciplinas.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setModalTopicMode('topico')}
              className={`py-2 rounded-lg text-xs font-bold cursor-pointer ${
                modalTopicMode === 'topico'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500'
              }`}
            >
              Vincular a Tópico do Edital
            </button>
            <button
              type="button"
              onClick={() => setModalTopicMode('avulsa')}
              className={`py-2 rounded-lg text-xs font-bold cursor-pointer ${
                modalTopicMode === 'avulsa'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500'
              }`}
            >
              Criar Nota Avulsa
            </button>
          </div>

          {modalTopicMode === 'topico' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tópico do Edital Verticalizado
              </label>
              <select
                value={modalAssuntoId}
                onChange={e => setModalAssuntoId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white"
              >
                {activeAssuntos
                  .filter(a => a.disciplinaId === modalDiscId)
                  .map((a, idx) => (
                    <option key={a.id} value={a.id}>
                      {formatTopicLabel(a.name, a.order || idx + 1)}
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Título da Nota Avulsa *
              </label>
              <input
                type="text"
                value={modalCustomTitle}
                onChange={e => setModalCustomTitle(e.target.value)}
                placeholder="Ex: Resumo de Véspera - Súmulas Vinculantes..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white"
                required
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsNovoResumoModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Abrir no Editor →
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CRIAR FLASHCARD (IDÊNTICO AO MENU FLASHCARDS) */}
      <Modal
        isOpen={isFlashcardModalOpen}
        onClose={() => setIsFlashcardModalOpen(false)}
        title={`Criar Flashcard • ${currentConcursoName}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveGeneratedFlashcard} className="space-y-4">
          {/* Seleção de Disciplina */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Disciplina do Edital / Plano *
            </label>
            {availableDisciplinasList.length > 0 ? (
              <select
                value={fcFormDisciplina}
                onChange={e => {
                  const val = e.target.value;
                  setFcFormDisciplina(val);
                  const discDecks = concursoDecks.filter(
                    d => d.disciplina.toLowerCase() === val.toLowerCase()
                  );
                  if (discDecks.length > 0) {
                    setFcFormDeckId(discDecks[0].id);
                    setFcFormDeckMode('existente');
                  } else {
                    setFcFormDeckMode('novo');
                    setFcFormDeckId('');
                  }
                }}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-slate-100"
              >
                {availableDisciplinasList.map(dName => (
                  <option key={dName} value={dName}>
                    {dName}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={fcFormDisciplina}
                onChange={e => setFcFormDisciplina(e.target.value)}
                placeholder="Ex: Direito Constitucional, Língua Portuguesa..."
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-slate-100"
              />
            )}
            {fcFormErrors.disciplina && (
              <span className="text-[11px] text-rose-500 font-semibold mt-1 block">
                {fcFormErrors.disciplina}
              </span>
            )}
          </div>

          {/* Seleção de Baralho (Existente ou Novo) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Baralho (Deck) *
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setFcFormDeckMode('existente')}
                  className={`px-2 py-0.5 rounded cursor-pointer font-semibold ${
                    fcFormDeckMode === 'existente'
                      ? 'bg-primary text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Existente
                </button>
                <button
                  type="button"
                  onClick={() => setFcFormDeckMode('novo')}
                  className={`px-2 py-0.5 rounded cursor-pointer font-semibold ${
                    fcFormDeckMode === 'novo'
                      ? 'bg-primary text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  + Novo Baralho
                </button>
              </div>
            </div>

            {fcFormDeckMode === 'existente' ? (
              <select
                value={fcFormDeckId}
                onChange={e => setFcFormDeckId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-slate-100"
              >
                {concursoDecks
                  .filter(
                    d =>
                      !fcFormDisciplina ||
                      d.disciplina.toLowerCase() === fcFormDisciplina.toLowerCase()
                  )
                  .map(d => (
                    <option key={d.id} value={d.id}>
                      {d.nome} ({concursoFlashcards.filter(c => c.deckId === d.id).length} cards)
                    </option>
                  ))}
                {concursoDecks.filter(
                  d =>
                    !fcFormDisciplina ||
                    d.disciplina.toLowerCase() === fcFormDisciplina.toLowerCase()
                ).length === 0 && (
                  <option value="" disabled>
                    Nenhum baralho cadastrado nesta disciplina
                  </option>
                )}
              </select>
            ) : (
              <input
                type="text"
                value={fcFormNewDeckName}
                onChange={e => setFcFormNewDeckName(e.target.value)}
                placeholder="Ex: Direitos Individuais (Art. 5º)"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-slate-100"
              />
            )}
            {fcFormErrors.deck && (
              <span className="text-[11px] text-rose-500 font-semibold mt-1 block">
                {fcFormErrors.deck}
              </span>
            )}
          </div>

          {/* Campo de Tópico / Assunto (Opcional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tópico / Assunto do Edital (Opcional)
            </label>
            <input
              type="text"
              list="resumos-topicos-sugestoes"
              value={fcFormTopico}
              onChange={e => setFcFormTopico(e.target.value)}
              placeholder="Ex: Habeas Corpus, Crase, Atos Administrativos..."
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100"
            />
            {suggestedTopics.length > 0 && (
              <datalist id="resumos-topicos-sugestoes">
                {suggestedTopics.map(t => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            )}
          </div>

          {/* Pergunta / Conceito (Frente) - Editor de Texto Rico Estilo Gmail */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Pergunta / Conceito (Frente) *
            </label>
            <GmailRichTextEditor
              value={fcFormFrente}
              onChange={html => {
                setFcFormFrente(html);
                if (fcFormErrors.frente) {
                  setFcFormErrors(prev => ({ ...prev, frente: '' }));
                }
              }}
              placeholder="Digite o conceito central, pergunta-chave ou caso prático para recordar..."
              minRows={3}
              hasError={!!fcFormErrors.frente}
            />
            {fcFormErrors.frente && (
              <span className="text-[11px] text-rose-500 font-semibold mt-1 block">
                {fcFormErrors.frente}
              </span>
            )}
          </div>

          {/* Resposta / Explicação (Verso) - Editor de Texto Rico Estilo Gmail */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Resposta / Explicação (Verso) *
            </label>
            <GmailRichTextEditor
              value={fcFormVerso}
              onChange={html => {
                setFcFormVerso(html);
                if (fcFormErrors.verso) {
                  setFcFormErrors(prev => ({ ...prev, verso: '' }));
                }
              }}
              placeholder="Digite a resposta objetiva, fundamentação legal, súmula ou mnemônico..."
              minRows={3}
              hasError={!!fcFormErrors.verso}
            />
            {fcFormErrors.verso && (
              <span className="text-[11px] text-rose-500 font-semibold mt-1 block">
                {fcFormErrors.verso}
              </span>
            )}
          </div>

          {/* Ações do Formulário */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsFlashcardModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              leftIcon={<Check className="w-4 h-4" />}
            >
              Salvar Flashcard
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: HISTÓRICO DE VERSÕES */}
      <Modal
        isOpen={isVersionsModalOpen}
        onClose={() => setIsVersionsModalOpen(false)}
        title="Histórico de Versões do Resumo"
      >
        <div className="space-y-3">
          {!activeResumoObj?.versions || activeResumoObj.versions.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              Nenhuma versão anterior arquivada ainda. Conforme você edita seu resumo, as últimas 5 versões são salvas automaticamente aqui para recuperação segura.
            </p>
          ) : (
            activeResumoObj.versions.map(ver => (
              <div
                key={ver.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Salvo em {new Date(ver.savedAt).toLocaleString('pt-BR')} ({ver.wordCount} palavras)
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {ver.previewText || 'Conteúdo salvo'}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRestoreVersion(ver)}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  Restaurar
                </Button>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO DO RESUMO */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Excluir Resumo"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Tem certeza que deseja excluir o resumo <strong>&ldquo;{docTitle}&rdquo;</strong>? Esta ação limpará o conteúdo deste tópico.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteCurrentResumo}
              className="!bg-rose-600 hover:!bg-rose-700 !text-white"
            >
              Confirmar Exclusão
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: EXPORTAR / IMPRIMIR PDF FORMATADO */}
      <Modal
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        title="Visualização para Impressão / Exportação PDF"
      >
        <div className="space-y-4">
          <div className="p-6 sm:p-8 rounded-2xl bg-white text-slate-900 border border-slate-200 max-h-[65vh] overflow-y-auto overflow-x-hidden">
            <div className="max-w-[680px] mx-auto space-y-5">
              <div className="pb-4 border-b-2 border-slate-900 text-center space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">
                  Gabarita · Caderno de Resumos Estruturado
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug break-words">
                  {docTitle}
                </h2>
                <p className="text-xs text-slate-600">
                  {currentDisciplina?.name} · Data: {new Date().toLocaleDateString('pt-BR')}
                  {docTags.length > 0 ? ` · Tags: ${docTags.map(t => `#${t}`).join(' ')}` : ''}
                </p>
              </div>

              <div
                className="prose max-w-none text-sm text-slate-800 leading-relaxed break-words overflow-x-hidden"
                dangerouslySetInnerHTML={{
                  __html: docHtml || '<p>Resumo em branco.</p>',
                }}
              />
            </div>
          </div>

          {pdfExportSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{pdfExportSuccess}</span>
              </div>
              <button
                type="button"
                onClick={() => handleExportAndPrintPdf('print_only')}
                className="underline hover:opacity-80 cursor-pointer shrink-0"
              >
                Abrir Impressora
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setIsPrintPreviewOpen(false)}>
              Fechar
            </Button>
            <Button
              variant="primary"
              disabled={isGeneratingPdf}
              onClick={() => handleExportAndPrintPdf('pdf_and_print')}
              leftIcon={<Download className="w-4 h-4" />}
            >
              {isGeneratingPdf ? 'Gerando PDF...' : 'Imprimir / Salvar em PDF'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* POP-UP EM TELA CHEIA: MODO LEITURA IMERSIVO */}
      {isReadingMode && viewMode === 'workspace' && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fade-in"
          onClick={e => {
            if (e.target === e.currentTarget) {
              setIsReadingMode(false);
            }
          }}
        >
          <div className="w-[98vw] max-w-none h-[96vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            {/* CABEÇALHO DO POP-UP DE LEITURA */}
            <div className="px-4 sm:px-6 py-3.5 bg-slate-50/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {currentDisciplina && (
                  <SubjectIcon subjectName={currentDisciplina.name} className="w-9 h-9 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 truncate max-w-[260px]"
                      style={{ color: currentDisciplina?.color || themeGlowStyles.color }}
                    >
                      {currentDisciplina?.name || 'Disciplina'}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      <span>Modo Leitura em Tela Cheia</span>
                    </span>
                    {docFavorite && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-400/30">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                        <span>Resumo de Véspera</span>
                      </span>
                    )}
                  </div>
                  <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white truncate mt-0.5">
                    {docTitle || 'Resumo sem título'}
                  </h2>
                </div>
              </div>

              {/* CONTROLES DE LEITURA E AÇÕES NO TOPO DIREITO */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Ajuste de Tamanho da Fonte para Leitura Confortável */}
                <div className="inline-flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 hidden md:inline">
                    Fonte
                  </span>
                  {(
                    [
                      { id: 'sm', label: 'A-' },
                      { id: 'base', label: 'A' },
                      { id: 'lg', label: 'A+' },
                      { id: 'xl', label: 'A++' },
                    ] as const
                  ).map(fs => (
                    <button
                      key={fs.id}
                      type="button"
                      onClick={() => setReadingFontSize(fs.id)}
                      title={`Tamanho do texto: ${fs.label}`}
                      className={`px-2 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                        readingFontSize === fs.id
                          ? 'text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      style={
                        readingFontSize === fs.id
                          ? { backgroundColor: themeGlowStyles.color }
                          : undefined
                      }
                    >
                      {fs.label}
                    </button>
                  ))}
                </div>

                {/* Alternar Pauta na Leitura */}
                <button
                  type="button"
                  onClick={() => setIsLinedPaper(prev => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    isLinedPaper
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="Ativar/Desativar folha pautada"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pauta</span>
                </button>

                {/* Gerar Flashcard Rápido */}
                <button
                  type="button"
                  onClick={handleOpenFlashcardGenerator}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Gerar Flashcard</span>
                </button>

                {/* Exportar / PDF */}
                <button
                  type="button"
                  onClick={() => setIsPrintPreviewOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Imprimir / PDF</span>
                </button>

                {/* Voltar para Modo Edição */}
                <button
                  type="button"
                  onClick={() => setIsReadingMode(false)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all cursor-pointer hover:brightness-110"
                  style={{ backgroundColor: themeGlowStyles.color }}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Resumo</span>
                </button>

                {/* Botão Fechar Tela Cheia */}
                <button
                  type="button"
                  onClick={() => setIsReadingMode(false)}
                  title="Sair da tela cheia (Esc)"
                  className="p-2 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CORPO DE LEITURA DO RESUMO (OCUPANDO TODA A TELA CHEIA) */}
            <div
              className="flex-1 overflow-y-auto w-full bg-white dark:bg-slate-900 custom-scrollbar"
              style={
                isLinedPaper
                  ? {
                      backgroundImage:
                        'repeating-linear-gradient(transparent, transparent 35px, rgba(148, 163, 184, 0.18) 35px, rgba(148, 163, 184, 0.18) 36px)',
                    }
                  : undefined
              }
            >
              <div className="w-full max-w-none px-6 sm:px-10 md:px-14 py-6 sm:py-8 min-h-full">
                {/* Cabeçalho Interno do Documento */}
                <div className="pb-6 mb-6 border-b border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {currentDisciplina?.name}
                      </span>
                      <span>·</span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        ~{liveMetrics.readMins} min de leitura ({liveMetrics.words} palavras)
                      </span>
                    </div>

                    {/* Seletor rápido de Status mesmo durante a leitura */}
                    <div className="inline-flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                      {(
                        [
                          { id: 'rascunho', label: '📝 Rascunho' },
                          { id: 'em_revisao', label: '🔄 Em Revisão' },
                          { id: 'finalizado', label: '✅ Dominado' },
                        ] as const
                      ).map(st => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => handleStatusChange(st.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            docStatus === st.id
                              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                    {docTitle || 'Resumo sem título'}
                  </h1>

                  {docTags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {docTags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Conteúdo Formatado do Resumo */}
                {liveMetrics.words === 0 && !docHtml.trim() ? (
                  <div className="py-16 text-center space-y-3">
                    <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Este tópico ainda não possui conteúdo escrito.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsReadingMode(false)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer"
                      style={{ backgroundColor: themeGlowStyles.color }}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Começar a Escrever Resumo</span>
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={e => {
                      const target = e.target as HTMLElement;
                      if (
                        target &&
                        target.tagName === 'INPUT' &&
                        (target as HTMLInputElement).type === 'checkbox'
                      ) {
                        const inputEl = target as HTMLInputElement;
                        if (inputEl.checked) {
                          inputEl.setAttribute('checked', 'checked');
                        } else {
                          inputEl.removeAttribute('checked');
                        }
                        const containerHtml = (e.currentTarget as HTMLDivElement).innerHTML;
                        setDocHtml(containerHtml);
                        if (editorRef.current) {
                          editorRef.current.innerHTML = containerHtml;
                        }
                        triggerDebouncedSave(containerHtml, undefined);
                      }
                    }}
                    className={`prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-100 leading-relaxed selection:bg-amber-300/60 dark:selection:bg-amber-500/40 ${
                      readingFontSize === 'sm'
                        ? 'text-sm leading-7'
                        : readingFontSize === 'base'
                        ? 'text-base leading-8'
                        : readingFontSize === 'lg'
                        ? 'text-lg leading-9'
                        : 'text-xl leading-10'
                    }`}
                    dangerouslySetInnerHTML={{ __html: docHtml }}
                  />
                )}
              </div>
            </div>

            {/* RODAPÉ DO POP-UP DE LEITURA: NAVEGAÇÃO ENTRE TÓPICOS + CRONÔMETRO DE REVISÃO */}
            <div className="px-4 sm:px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              {/* Navegação Rápida: Tópico Anterior / Próximo Tópico */}
              <div className="flex items-center gap-2">
                {(() => {
                  const currentIdx = currentDisciplinaTopicos.findIndex(
                    t => t.id === selectedAssuntoId
                  );
                  const prevTopic =
                    currentIdx > 0 ? currentDisciplinaTopicos[currentIdx - 1] : null;
                  const nextTopic =
                    currentIdx >= 0 && currentIdx < currentDisciplinaTopicos.length - 1
                      ? currentDisciplinaTopicos[currentIdx + 1]
                      : null;

                  return (
                    <>
                      <button
                        type="button"
                        disabled={!prevTopic}
                        onClick={() => prevTopic && handleSelectTopicInSidebar(prevTopic)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Tópico Anterior</span>
                      </button>
                      <button
                        type="button"
                        disabled={!nextTopic}
                        onClick={() => nextTopic && handleSelectTopicInSidebar(nextTopic)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        <span>Próximo Tópico</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  );
                })()}
              </div>

              {/* Cronômetro de Estudo/Leitura + Botão Sair */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <Clock className="w-3.5 h-3.5" style={{ color: themeGlowStyles.color }} />
                  <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {formatTimerClock(timerSeconds)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsTimerRunning(prev => !prev)}
                    className="px-2 py-1 rounded-lg text-[11px] font-bold text-white flex items-center gap-1 cursor-pointer"
                    style={{
                      backgroundColor: isTimerRunning ? '#F59E0B' : themeGlowStyles.color,
                    }}
                  >
                    {isTimerRunning ? (
                      <>
                        <Pause className="w-3 h-3" />
                        <span>Pausar</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        <span>Iniciar</span>
                      </>
                    )}
                  </button>
                  {timerSeconds > 0 && (
                    <button
                      type="button"
                      onClick={handleRegisterTimerSession}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-950 hover:opacity-90 cursor-pointer"
                    >
                      Registrar no Histórico
                    </button>
                  )}
                </div>

                {sessionSavedFeedback && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {sessionSavedFeedback}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setIsReadingMode(false)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Sair da Tela Cheia (Esc)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
