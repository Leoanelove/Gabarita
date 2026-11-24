import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Briefcase, 
  Star, 
  Edit2, 
  Trash2, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink,
  CheckCircle,
  Sparkles,
  Target,
  Calendar,
  Layers,
  Zap,
  ArrowLeft,
  ChevronRight,
  BookOpen,
  Play,
  Clock,
  Circle,
  Check,
  X,
  Lock,
  ChevronDown,
  ChevronUp,
  BarChart2,
  FolderPlus,
  Archive,
  ArchiveRestore
} from 'lucide-react';
import { 
  Concurso, 
  ConcursoSphere,
  EditalAiImportPayload,
  ConcursoStatus, 
  Prova, 
  UserProfile, 
  Disciplina, 
  Assunto, 
  TopicStatus 
} from '../../types';
import { Card, CardHeader, CardBody, CardFooter } from '../../design-system/Card';
import { Button } from '../../design-system/Button';
import { Input } from '../../design-system/Input';
import { Badge } from '../../design-system/Badge';
import { Modal } from '../../design-system/Modal';
import { NovoConcursoModal } from './NovoConcursoModal';
import { SubjectIcon } from '../common/SubjectIcon';
import { EditalImportModal } from '../disciplinas/EditalImportModal';
import { NovaMateriaModal } from '../disciplinas/NovaMateriaModal';
import { ProvasTab } from './ProvasTab';
import { useTheme } from '../../contexts/ThemeContext';
import { MenuBannerFrame } from '../common/MenuBannerFrame';
import { DatabaseService } from '../../services/db';

const MAX_CONCURSOS = 3;

// Banners da aba "Concursos" (desacoplados de PROVAS_BANNER_THEMES)
export const CONCURSOS_BANNER_THEMES: Record<string, string> = {
  verde: '/assets/bannerconcursos/Banner_Concursos_verde1.webp',
  azul: '/assets/bannerconcursos/Banner_Concursos_azul1.webp',
  rosa: '/assets/bannerconcursos/Banner_Concursos_rosa1.webp',
  roxo: '/assets/bannerconcursos/Banner_Concursos_roxo1.webp',
  laranja: '/assets/bannerconcursos/Banner_Concursos_laranja1.webp',
};

const PALETTE_COLORS = [
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#f97316', // Orange
  '#14b8a6', // Teal
];

interface ConcursosViewProps {
  concursos: Concurso[];
  provas: Prova[];
  user: UserProfile;
  activeConcursoId?: string;
  disciplinas?: Disciplina[];
  assuntos?: Assunto[];
  onAddConcursoWithDisciplinas: (
    concurso: Omit<Concurso, 'id' | 'createdAt' | 'updatedAt'>,
    disciplinas: EditalAiImportPayload['disciplinas'],
    draftId: string
  ) => Promise<void>;
  onImportEditalTree: (payload: EditalAiImportPayload, concursoId: string, mode: 'merge') => Promise<void>;
  onUpdateConcurso: (id: string, partial: Partial<Concurso>) => Promise<void>;
  onDeleteConcurso: (id: string) => Promise<void>;
  onSetActiveConcurso: (id: string) => Promise<void>;
  onArchiveConcurso?: (id: string) => Promise<void>;
  onUnarchiveConcurso?: (id: string) => Promise<void>;
  onAddProva: (prova: Omit<Prova, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateProva: (id: string, partial: Partial<Prova>) => Promise<void>;
  onDeleteProva: (id: string) => Promise<void>;
  onAddDisciplina?: (disciplina: Omit<Disciplina, 'id' | 'createdAt' | 'topicsCount' | 'completedTopicsCount' | 'totalStudyMinutes'>) => Promise<void>;
  onAddDisciplinaWithTopics?: (
    disciplina: Omit<Disciplina, 'id' | 'createdAt' | 'topicsCount' | 'completedTopicsCount' | 'totalStudyMinutes'>,
    topics: string[]
  ) => Promise<void>;
  onUpdateDisciplina?: (id: string, partial: Partial<Disciplina>) => Promise<void>;
  onDeleteDisciplina?: (id: string) => Promise<void>;
  onAddAssunto?: (assunto: Omit<Assunto, 'id' | 'createdAt' | 'masteryLevel' | 'totalQuestionsSolved' | 'correctQuestionsSolved' | 'accuracyRate'>) => Promise<void>;
  onUpdateAssunto?: (id: string, partial: Partial<Assunto>) => Promise<void>;
  onDeleteAssunto?: (id: string) => Promise<void>;
  onUpdateAssuntoStatus?: (id: string, status: TopicStatus) => Promise<void>;
  onOpenStudyTimer?: (disciplinaId?: string, assuntoId?: string) => void;
  onNavigateTab?: (tab: any) => void;
  initialTab?: 'concursos' | 'provas';
  initialTabTrigger?: number;
}

export const ConcursosView: React.FC<ConcursosViewProps> = ({
  concursos,
  provas,
  user,
  activeConcursoId,
  disciplinas = [],
  assuntos = [],
  onAddConcursoWithDisciplinas,
  onImportEditalTree,
  onUpdateConcurso,
  onDeleteConcurso,
  onSetActiveConcurso,
  onArchiveConcurso,
  onUnarchiveConcurso,
  onAddProva,
  onUpdateProva,
  onDeleteProva,
  onAddDisciplina,
  onAddDisciplinaWithTopics,
  onUpdateDisciplina,
  onDeleteDisciplina,
  onAddAssunto,
  onUpdateAssunto,
  onDeleteAssunto,
  onUpdateAssuntoStatus,
  onOpenStudyTimer,
  onNavigateTab,
  initialTab = 'concursos',
  initialTabTrigger = 0,
}) => {
  const { colorSkin, palette } = useTheme();
  const currentTheme = (
    colorSkin === 'purple' ? 'roxo' :
    colorSkin === 'orange' || colorSkin === 'dbz' ? 'laranja' :
    colorSkin || palette?.id || 'verde'
  ).toLowerCase();

  // Seletor dinâmico por tema para a aba Concursos
  const activeBanner = CONCURSOS_BANNER_THEMES[currentTheme.toLowerCase()] || CONCURSOS_BANNER_THEMES.verde;

  // Cores e Glow dinâmicos do tema ativo para os botões e banner fallback
  const themeGlowStyles = useMemo(() => {
    switch (currentTheme) {
      case 'roxo':
        return {
          color: '#8B5CF6',
          glow: 'rgba(139, 92, 246, 0.7)',
          glowSoft: 'rgba(139, 92, 246, 0.32)',
          fallbackGradient: 'radial-gradient(ellipse at 82% 40%, rgba(139, 92, 246, 0.38) 0%, rgba(76, 29, 149, 0.25) 45%, transparent 75%), linear-gradient(135deg, #090d16 0%, #1e103c 55%, #2e1065 100%)',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(167, 139, 250, 0.95), 0 0 18px rgba(139, 92, 246, 0.85), 0 0 32px rgba(124, 58, 237, 0.65)',
        };
      case 'laranja':
        return {
          color: '#FF6B00',
          glow: 'rgba(255, 107, 0, 0.7)',
          glowSoft: 'rgba(255, 107, 0, 0.32)',
          fallbackGradient: 'radial-gradient(ellipse at 82% 40%, rgba(255, 107, 0, 0.38) 0%, rgba(154, 52, 18, 0.25) 45%, transparent 75%), linear-gradient(135deg, #090d16 0%, #2a1205 55%, #431407 100%)',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(251, 146, 60, 0.95), 0 0 18px rgba(249, 115, 22, 0.85), 0 0 32px rgba(234, 88, 12, 0.65)',
        };
      case 'azul':
        return {
          color: '#3b82f6',
          glow: 'rgba(59, 130, 246, 0.65)',
          glowSoft: 'rgba(59, 130, 246, 0.28)',
          fallbackGradient: 'radial-gradient(ellipse at 82% 40%, rgba(59, 130, 246, 0.38) 0%, rgba(30, 58, 138, 0.25) 45%, transparent 75%), linear-gradient(135deg, #090d16 0%, #0f1f44 55%, #172554 100%)',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(96, 165, 250, 0.95), 0 0 18px rgba(37, 99, 235, 0.8), 0 0 32px rgba(29, 78, 216, 0.6)',
        };
      case 'rosa':
        return {
          color: '#ec4899',
          glow: 'rgba(236, 72, 153, 0.65)',
          glowSoft: 'rgba(236, 72, 153, 0.28)',
          fallbackGradient: 'radial-gradient(ellipse at 82% 40%, rgba(236, 72, 153, 0.38) 0%, rgba(131, 24, 67, 0.25) 45%, transparent 75%), linear-gradient(135deg, #090d16 0%, #2d0c20 55%, #500724 100%)',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(244, 114, 182, 0.95), 0 0 18px rgba(219, 39, 119, 0.8), 0 0 32px rgba(190, 24, 93, 0.6)',
        };
      case 'verde':
      default:
        return {
          color: '#10b981',
          glow: 'rgba(16, 185, 129, 0.65)',
          glowSoft: 'rgba(16, 185, 129, 0.28)',
          fallbackGradient: 'radial-gradient(ellipse at 82% 40%, rgba(16, 185, 129, 0.35) 0%, rgba(6, 78, 59, 0.25) 45%, transparent 75%), linear-gradient(135deg, #090d16 0%, #052e24 55%, #064e3b 100%)',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(52, 211, 153, 0.95), 0 0 18px rgba(16, 185, 129, 0.8), 0 0 32px rgba(5, 150, 105, 0.6)',
        };
    }
  }, [currentTheme]);

  // Identificação unificada do concurso com Foco Ativo (Single Source of Truth)
  const currentActiveConcursoId = useMemo(() => {
    return activeConcursoId || 
      (typeof window !== 'undefined' ? localStorage.getItem('gabarita_active_concurso_id') : '') ||
      user?.targetConcursoId || 
      concursos.find(c => (c.active || c.isAtivo || c.isFocoAtivo) && c.status !== 'arquivado' && !c.isArquivado)?.id || 
      '';
  }, [activeConcursoId, user?.targetConcursoId, concursos]);

  // Navigation: Hub vs Drill-Down (Painel do Concurso)
  const [selectedConcursoId, setSelectedConcursoId] = useState<string | null>(null);
  const [importConcursoId, setImportConcursoId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'concursos' | 'provas'>(initialTab);

  useEffect(() => {
    setSelectedConcursoId(null);
    setImportConcursoId(null);
    setActiveTab(initialTab);
  }, [initialTab, initialTabTrigger]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sphereFilter, setSphereFilter] = useState<'todas' | ConcursoSphere>('todas');
  
  // Modals state
  const [isNovoConcursoWizardOpen, setIsNovoConcursoWizardOpen] = useState(false);
  const [novoConcursoInstanceKey, setNovoConcursoInstanceKey] = useState(0);
  const [editingConcurso, setEditingConcurso] = useState<Concurso | null>(null);
  const [deletingConcursoId, setDeletingConcursoId] = useState<string | null>(null);
  const [archivingConcurso, setArchivingConcurso] = useState<Concurso | null>(null);
  const [isLimitAlertModalOpen, setIsLimitAlertModalOpen] = useState(false);
  const [isArchivedSectionExpanded, setIsArchivedSectionExpanded] = useState(true);
  const [isAddProvaModalOpen, setIsAddProvaModalOpen] = useState(false);
  const [deletingProvaId, setDeletingProvaId] = useState<string | null>(null);

  const handleOpenNovoConcurso = () => {
    if (isLimitReached) return;
    setNovoConcursoInstanceKey(prev => prev + 1);
    setIsNovoConcursoWizardOpen(true);
  };

  // Drill-down Disciplinas & Tópicos states
  const [expandedDisciplinas, setExpandedDisciplinas] = useState<Record<string, boolean>>({});
  const [isAddDisciplinaModalOpen, setIsAddDisciplinaModalOpen] = useState(false);
  const [editingDisciplina, setEditingDisciplina] = useState<Disciplina | null>(null);
  const [deletingDisciplinaId, setDeletingDisciplinaId] = useState<string | null>(null);
  const [newDiscName, setNewDiscName] = useState('');
  const [newDiscWeight, setNewDiscWeight] = useState('2.0');
  const [newDiscColor, setNewDiscColor] = useState('#10b981');
  const [newTopicInputs, setNewTopicInputs] = useState<Record<string, string>>({});
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingTopicName, setEditingTopicName] = useState('');

  // Form Edit Concurso state
  const [title, setTitle] = useState('');
  const [organ, setOrgan] = useState('');
  const [banca, setBanca] = useState('');
  const [role, setRole] = useState('');
  const [sphere, setSphere] = useState<ConcursoSphere>('federal');
  const [remuneration, setRemuneration] = useState('');
  const [vacantPositions, setVacantPositions] = useState('1');
  const [examDate, setExamDate] = useState('');
  const [status, setStatus] = useState<ConcursoStatus>('previsto');

  // Form Prova state
  const [provaConcursoId, setProvaConcursoId] = useState('');
  const [provaOrgan, setProvaOrgan] = useState('');
  const [provaBanca, setProvaBanca] = useState('');
  const [provaRole, setProvaRole] = useState('');
  const [provaYear, setProvaYear] = useState(new Date().getFullYear().toString());
  const [provaQuestionsCount, setProvaQuestionsCount] = useState('100');
  const [provaDurationMinutes, setProvaDurationMinutes] = useState('240');

  // Loading & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

 // Separação estrita entre concursos ativos (máx 3) e arquivados
  const concursosAtivos = useMemo(() => {
    return concursos
      .filter(c => c.status !== 'arquivado' && !c.isArquivado)
      .slice(0, MAX_CONCURSOS); // Garante que nunca renderize mais de 3 cards ativos na tela
  }, [concursos]);

  const concursosArquivados = useMemo(() => {
    return concursos.filter(c => c.status === 'arquivado' || c.isArquivado);
  }, [concursos]);

  const totalAtivos = concursosAtivos.length;
  const isLimitReached = totalAtivos >= MAX_CONCURSOS;

  // Selected Concurso
  const selectedConcurso = useMemo(() => {
    if (!selectedConcursoId) return null;
    return concursos.find(c => c.id === selectedConcursoId) || null;
  }, [concursos, selectedConcursoId]);

  // Disciplinas for Selected Concurso
  const selectedConcursoDisciplinas = useMemo(() => {
    if (!selectedConcurso) return [];
    return disciplinas.filter(d => d.concursoId === selectedConcurso.id);
  }, [disciplinas, selectedConcurso]);

  // Assuntos for Selected Concurso
  const selectedConcursoAssuntos = useMemo(() => {
    if (!selectedConcursoDisciplinas.length) return [];
    const discIds = new Set(selectedConcursoDisciplinas.map(d => d.id));
    return assuntos.filter(a => discIds.has(a.disciplinaId));
  }, [assuntos, selectedConcursoDisciplinas]);

  // Overall Contest Progress
  const contestMetrics = useMemo(() => {
    if (!selectedConcurso) return { progressPercent: 0, totalTopicos: 0, dominadosCount: 0, totalMinutes: 0 };
    const totalTopicos = selectedConcursoAssuntos.length;
    const dominadosCount = selectedConcursoAssuntos.filter(
      a => a.completed || a.status === 'dominado' || a.status === 'revisado'
    ).length;
    const progressPercent = totalTopicos > 0 ? Math.round((dominadosCount / totalTopicos) * 100) : 0;
    const totalMinutes = selectedConcursoDisciplinas.reduce((acc, d) => acc + (d.totalStudyMinutes || 0), 0);
    return { progressPercent, totalTopicos, dominadosCount, totalMinutes };
  }, [selectedConcurso, selectedConcursoDisciplinas, selectedConcursoAssuntos]);

  // Handle Edit Concurso
  const handleOpenEditConcurso = (c: Concurso) => {
    setEditingConcurso(c);
    const resolvedTitle = c.titulo || (c.title && c.title.length > 1 ? c.title : '') || c.orgao || c.organ || c.title;
    const resolvedOrgan = c.orgao || c.organ || c.nome || '';
    setTitle(resolvedTitle);
    setOrgan(resolvedOrgan);
    setBanca(c.banca);
    setRole(c.role);
    setSphere(c.sphere);
    setRemuneration(c.remuneration ? c.remuneration.toString() : '');
    setVacantPositions(c.vacantPositions.toString());
    setExamDate(c.examDate ? c.examDate.split('T')[0] : '');
    setStatus(c.status);
  };

  const handleSaveEditConcurso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConcurso) return;
    setIsSubmitting(true);
    try {
      const cleanOrgan = organ.trim();
      const cleanRole = role.trim();
      const cleanTitle = title.trim() || (cleanRole ? `${cleanOrgan} - ${cleanRole}` : cleanOrgan);
      await onUpdateConcurso(editingConcurso.id, {
        title: cleanTitle,
        titulo: cleanTitle,
        organ: cleanOrgan,
        orgao: cleanOrgan,
        nome: cleanOrgan,
        banca: banca.trim(),
        role: cleanRole,
        sphere,
        remuneration: parseFloat(remuneration) || 0,
        vacantPositions: parseInt(vacantPositions, 10) || 1,
        examDate: examDate || undefined,
        status,
      });
      setEditingConcurso(null);
      showFeedback('success', 'Concurso atualizado com sucesso!');
    } catch {
      showFeedback('error', 'Falha ao atualizar dados do concurso.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveNewConcursoWithDisciplinas = async (
    concursoData: Omit<Concurso, 'id' | 'createdAt' | 'updatedAt'>,
    disciplinasData: EditalAiImportPayload['disciplinas'],
    draftId: string
  ) => {
    await onAddConcursoWithDisciplinas(concursoData, disciplinasData, draftId);
    showFeedback('success', `Concurso "${concursoData.title}" e ${disciplinasData.length} disciplinas cadastrados com sucesso!`);
  };

  const handleConfirmDeleteConcurso = async () => {
    if (!deletingConcursoId) return;
    setIsSubmitting(true);
    try {
      await onDeleteConcurso(deletingConcursoId);
      if (selectedConcursoId === deletingConcursoId) {
        setSelectedConcursoId(null);
      }
      setDeletingConcursoId(null);
      showFeedback('success', 'Concurso removido com sucesso.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivate = async (concursoId: string, concursoTitle: string) => {
    try {
      await onSetActiveConcurso(concursoId);
      showFeedback('success', `"${concursoTitle}" agora é o seu concurso ativo principal!`);
    } catch {
      showFeedback('error', 'Falha ao ativar concurso.');
    }
  };

  const handleConfirmArchiveConcurso = async () => {
    if (!archivingConcurso) return;
    setIsSubmitting(true);
    try {
      const targetId = archivingConcurso.id;
      const targetTitle = archivingConcurso.organ || archivingConcurso.title || 'Concurso';
      if (onArchiveConcurso) {
        await onArchiveConcurso(targetId);
      } else {
        await DatabaseService.archiveConcurso(targetId);
      }
      if (selectedConcursoId === targetId) {
        setSelectedConcursoId(null);
      }
      setArchivingConcurso(null);
      showFeedback('success', `Concurso "${targetTitle}" arquivado com sucesso! Vaga liberada.`);
    } catch {
      showFeedback('error', 'Falha ao arquivar concurso.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnarchiveConcursoAction = async (concursoId: string, concursoTitle: string) => {
    if (totalAtivos >= MAX_CONCURSOS) {
      setIsLimitAlertModalOpen(true);
      return;
    }
    setIsSubmitting(true);
    try {
      if (onUnarchiveConcurso) {
        await onUnarchiveConcurso(concursoId);
      } else {
        await DatabaseService.unarchiveConcurso(concursoId);
      }
      showFeedback('success', `Concurso "${concursoTitle}" desarquivado com sucesso! Você já pode retomar seus estudos e edições.`);
    } catch (e: any) {
      if (e?.message === 'LIMIT_REACHED') {
        setIsLimitAlertModalOpen(true);
      } else {
        showFeedback('error', 'Falha ao desarquivar concurso.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Accordion
  const toggleDisciplinaExpanded = (discId: string) => {
    setExpandedDisciplinas(prev => ({
      ...prev,
      [discId]: !prev[discId]
    }));
  };

  // Handle Add Disciplina
  const handleSaveDisciplina = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConcurso || !newDiscName.trim()) return;
    setIsSubmitting(true);
    try {
      if (editingDisciplina && onUpdateDisciplina) {
        await onUpdateDisciplina(editingDisciplina.id, {
          name: newDiscName.trim(),
          weight: parseFloat(newDiscWeight) || 2.0,
          color: newDiscColor,
        });
        showFeedback('success', `Disciplina "${newDiscName.trim()}" atualizada!`);
        setEditingDisciplina(null);
      } else if (onAddDisciplina) {
        await onAddDisciplina({
          concursoId: selectedConcurso.id,
          name: newDiscName.trim(),
          weight: parseFloat(newDiscWeight) || 2.0,
          color: newDiscColor,
          order: selectedConcursoDisciplinas.length + 1,
        });
        showFeedback('success', `Disciplina "${newDiscName.trim()}" adicionada ao concurso!`);
      }
      setIsAddDisciplinaModalOpen(false);
      setNewDiscName('');
      setNewDiscWeight('2.0');
    } catch {
      showFeedback('error', 'Erro ao salvar disciplina.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteDisciplina = async () => {
    if (!deletingDisciplinaId || !onDeleteDisciplina) return;
    setIsSubmitting(true);
    try {
      await onDeleteDisciplina(deletingDisciplinaId);
      setDeletingDisciplinaId(null);
      showFeedback('success', 'Disciplina removida com sucesso!');
    } catch {
      showFeedback('error', 'Erro ao remover disciplina.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Add Topic
  const handleAddTopicToDisciplina = async (disciplinaId: string) => {
    const text = (newTopicInputs[disciplinaId] || '').trim();
    if (!text || !onAddAssunto) return;

    try {
      const currentTopics = assuntos.filter(a => a.disciplinaId === disciplinaId);
      await onAddAssunto({
        disciplinaId,
        name: text,
        order: currentTopics.length + 1,
        importance: 'media',
        completed: false,
        status: 'nao_iniciado',
      });
      setNewTopicInputs(prev => ({ ...prev, [disciplinaId]: '' }));
      showFeedback('success', `Tópico "${text}" adicionado com sucesso!`);
    } catch {
      showFeedback('error', 'Erro ao adicionar tópico.');
    }
  };

  // Handle Inline Topic Edit
  const handleStartEditTopic = (topico: Assunto) => {
    setEditingTopicId(topico.id);
    setEditingTopicName(topico.name);
  };

  const handleSaveEditTopic = async (topicoId: string) => {
    const clean = editingTopicName.trim();
    if (!clean || !onUpdateAssunto) {
      setEditingTopicId(null);
      return;
    }
    try {
      await onUpdateAssunto(topicoId, { name: clean });
      setEditingTopicId(null);
      showFeedback('success', 'Tópico atualizado!');
    } catch {
      showFeedback('error', 'Erro ao atualizar tópico.');
    }
  };

  // Handle Topic Delete (Directly without window.confirm)
  const handleDeleteTopic = async (topicoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDeleteAssunto) return;
    try {
      await onDeleteAssunto(topicoId);
      showFeedback('success', 'Tópico removido com sucesso.');
    } catch {
      showFeedback('error', 'Erro ao remover tópico.');
    }
  };

  // Handle Topic Status Toggle
  const handleToggleTopicStatus = async (topico: Assunto, e: React.MouseEvent) => {
    e.stopPropagation();
    const cycle: Record<TopicStatus, TopicStatus> = {
      nao_iniciado: 'em_estudo',
      em_estudo: 'dominado',
      dominado: 'nao_iniciado',
      revisado: 'dominado'
    };
    const current = topico.status || (topico.completed ? 'dominado' : 'nao_iniciado');
    const nextStatus = cycle[current] || 'em_estudo';
    const isCompleted = nextStatus === 'dominado';

    try {
      if (onUpdateAssuntoStatus) {
        await onUpdateAssuntoStatus(topico.id, nextStatus);
      } else if (onUpdateAssunto) {
        await onUpdateAssunto(topico.id, { status: nextStatus, completed: isCompleted });
      }
    } catch {
      showFeedback('error', 'Erro ao alterar status do tópico.');
    }
  };

  // Handle Prova
  const handleSaveProva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provaOrgan.trim() || !provaBanca.trim() || !provaRole.trim()) {
      showFeedback('error', 'Preencha os campos obrigatórios da prova.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onAddProva({
        concursoId: provaConcursoId || undefined,
        organ: provaOrgan.trim(),
        banca: provaBanca.trim(),
        year: parseInt(provaYear, 10) || new Date().getFullYear(),
        role: provaRole.trim(),
        questionsCount: parseInt(provaQuestionsCount, 10) || 100,
        durationMinutes: parseInt(provaDurationMinutes, 10) || 240,
      });
      setIsAddProvaModalOpen(false);
      setProvaOrgan('');
      setProvaRole('');
      showFeedback('success', 'Prova anterior cadastrada com sucesso!');
    } catch {
      showFeedback('error', 'Falha ao cadastrar prova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (st: ConcursoStatus | string) => {
    const map: Record<string, { label: string; variant: any }> = {
      previsto: { label: 'Previsto', variant: 'slate' },
      autorizado: { label: 'Autorizado', variant: 'sky' },
      comissao_formada: { label: 'Comissão', variant: 'amber' },
      escolha_banca: { label: 'Banca', variant: 'purple' },
      edital_publicado: { label: 'Edital', variant: 'emerald' },
      inscricoes_abertas: { label: 'Inscrições Abertas', variant: 'emerald' },
      encerrado: { label: 'Encerrado', variant: 'slate' },
      ativo: { label: 'Ativo', variant: 'emerald' },
      arquivado: { label: 'Arquivado', variant: 'amber' },
    };
    const item = map[st] || { label: String(st), variant: 'slate' };
    return <Badge variant={item.variant} size="sm">{item.label}</Badge>;
  };

  const filteredConcursosAtivos = useMemo(() => {
    return concursosAtivos.filter(c => {
      const title = (c.title || c.titulo || c.organ || '').toLowerCase();
      const organ = (c.organ || c.orgao || c.nome || '').toLowerCase();
      const banca = (c.banca || '').toLowerCase();
      const role = (c.role || c.cargo || '').toLowerCase();
      const term = searchTerm.toLowerCase();
      const matchesSearch = title.includes(term) || organ.includes(term) || banca.includes(term) || role.includes(term);
      const matchesSphere = sphereFilter === 'todas' || c.sphere === sphereFilter;
      return matchesSearch && matchesSphere;
    });
  }, [concursosAtivos, searchTerm, sphereFilter]);

  const filteredConcursosArquivados = useMemo(() => {
    return concursosArquivados.filter(c => {
      const title = (c.title || c.titulo || c.organ || '').toLowerCase();
      const organ = (c.organ || c.orgao || c.nome || '').toLowerCase();
      const banca = (c.banca || '').toLowerCase();
      const role = (c.role || c.cargo || '').toLowerCase();
      const term = searchTerm.toLowerCase();
      const matchesSearch = title.includes(term) || organ.includes(term) || banca.includes(term) || role.includes(term);
      const matchesSphere = sphereFilter === 'todas' || c.sphere === sphereFilter;
      return matchesSearch && matchesSphere;
    });
  }, [concursosArquivados, searchTerm, sphereFilter]);

  const filteredProvas = provas.filter(p => {
    return p.organ.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.banca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.role.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // =========================================================================
  // VIEW: DRILL-DOWN / PAINEL DO CONCURSO (ESTILO ESTUDEI)
  // =========================================================================
  if (selectedConcurso) {
    const isArchived = selectedConcurso.status === 'arquivado' || Boolean(selectedConcurso.isArquivado);
    const isSelectedActive = !isArchived && String(selectedConcurso.id) === String(currentActiveConcursoId);
    const diffDays = selectedConcurso.examDate 
      ? Math.ceil((new Date(selectedConcurso.examDate).getTime() - new Date().getTime()) / 86400000)
      : null;

    const fullTitle = selectedConcurso.orgao || selectedConcurso.nome || selectedConcurso.titulo || 
      (selectedConcurso.organ && selectedConcurso.title && selectedConcurso.title.length === 1 ? selectedConcurso.organ : selectedConcurso.title) || 
      selectedConcurso.organ;

    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
        {feedback && (
          <div className={`p-4 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2 ${
            feedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Banner de Aviso de Concurso Arquivado (Modo Somente Leitura) */}
        {isArchived && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <span>
                Este concurso está arquivado. Todos os dados estão disponíveis para consulta, mas bloqueados para edição. Desarquive o concurso para fazer alterações.
              </span>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleUnarchiveConcursoAction(selectedConcurso.id, fullTitle)}
              leftIcon={<ArchiveRestore className="w-4 h-4" />}
              className="shrink-0 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white border-amber-600 cursor-pointer shadow-sm"
            >
              Desarquivar Concurso
            </Button>
          </div>
        )}

        {/* Top Header / Breadcrumb */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <button
            onClick={() => setSelectedConcursoId(null)}
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-400 hover:text-white transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Voltar para Concursos</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {isArchived ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleUnarchiveConcursoAction(selectedConcurso.id, fullTitle)}
                leftIcon={<ArchiveRestore className="w-3.5 h-3.5" />}
                className="bg-amber-600 hover:bg-amber-700 text-white border-amber-600 font-bold"
              >
                Desarquivar
              </Button>
            ) : (
              <>
                {!isSelectedActive ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleActivate(selectedConcurso.id, fullTitle)}
                    leftIcon={<Star className="w-3.5 h-3.5 text-amber-400" />}
                  >
                    Ativar Foco
                  </Button>
                ) : (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Foco Ativo
                  </span>
                )}
              </>
            )}

            {onNavigateTab && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!isArchived) handleActivate(selectedConcurso.id, fullTitle);
                  onNavigateTab('estudos');
                }}
                leftIcon={<BookOpen className="w-3.5 h-3.5 text-emerald-400" />}
              >
                Edital Verticalizado
              </Button>
            )}

            {!isArchived && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setEditingDisciplina(null);
                    setNewDiscName('');
                    setNewDiscWeight('2.0');
                    setNewDiscColor('#10b981');
                    setIsAddDisciplinaModalOpen(true);
                  }}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  className="shadow-md shadow-emerald-500/20"
                >
                  Nova Matéria
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenEditConcurso(selectedConcurso)}
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                >
                  Editar
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeletingConcursoId(selectedConcurso.id)}
              className="text-rose-500 hover:bg-rose-500/10"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Excluir
            </Button>
          </div>
        </div>

        {/* Contest Banner Card */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                {getStatusBadge(selectedConcurso.status)}
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  {selectedConcurso.sphere}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  Banca: <strong className="text-slate-200">{selectedConcurso.banca}</strong>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {fullTitle}
              </h1>
              <p className="text-sm font-semibold text-emerald-500 dark:text-emerald-400">
                Cargo: {selectedConcurso.role}
              </p>
            </div>

            {/* Exam Countdown & Summary */}
            <div className="flex items-center gap-4 bg-slate-100/70 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 w-full lg:w-auto justify-around lg:justify-start">
              <div className="text-center px-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Data da Prova</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {selectedConcurso.examDate ? new Date(selectedConcurso.examDate).toLocaleDateString('pt-BR') : 'A definir'}
                </span>
              </div>
              <div className="h-8 w-px bg-slate-300 dark:bg-slate-700" />
              <div className="text-center px-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Tempo Restante</span>
                <span className={`text-base font-black ${diffDays !== null && diffDays <= 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {diffDays !== null ? (diffDays >= 0 ? `${diffDays} dias` : 'Realizada') : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics (Estilo Estudei) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800/80">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Progresso Geral</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-black text-emerald-500">{contestMetrics.progressPercent}%</span>
                <span className="text-xs text-slate-400 font-semibold">concluído</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${contestMetrics.progressPercent}%` }} 
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Disciplinas</span>
              <span className="text-xl font-black text-slate-900 dark:text-slate-100 block mt-1">
                {selectedConcursoDisciplinas.length}
              </span>
              <span className="text-[11px] text-slate-400">matérias cadastradas</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Tópicos do Edital</span>
              <span className="text-xl font-black text-slate-900 dark:text-slate-100 block mt-1">
                {contestMetrics.dominadosCount} <span className="text-xs font-normal text-slate-400">/ {contestMetrics.totalTopicos}</span>
              </span>
              <span className="text-[11px] text-slate-400">tópicos dominados</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Tempo Dedicado</span>
              <span className="text-xl font-black text-slate-900 dark:text-slate-100 block mt-1">
                {Math.floor(contestMetrics.totalMinutes / 60)}h {contestMetrics.totalMinutes % 60}m
              </span>
              <span className="text-[11px] text-slate-400">estudo acumulado</span>
            </div>
          </div>
        </div>

        {/* Disciplinas Panel Section (Estilo Estudei) */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-500" />
                Painel de Disciplinas ({selectedConcursoDisciplinas.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Acompanhe o domínio por matéria, inicie sessões de estudo e gerencie tópicos diretamente.
              </p>
            </div>

            {!isArchived && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingDisciplina(null);
                  setNewDiscName('');
                  setNewDiscWeight('2.0');
                  setNewDiscColor('#10b981');
                  setIsAddDisciplinaModalOpen(true);
                }}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Adicionar Matéria
              </Button>
            )}
          </div>

          {selectedConcursoDisciplinas.length === 0 ? (
            <div className="p-8 sm:p-12 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-4 bg-white/50 dark:bg-slate-900/40">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <FolderPlus className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Nenhuma disciplina cadastrada neste concurso
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isArchived
                    ? 'Este concurso está arquivado e não possui disciplinas cadastradas.'
                    : 'Importe as matérias e os tópicos do edital ou cadastre a primeira matéria manualmente.'}
                </p>
              </div>
              {!isArchived && (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button
                    variant="primary"
                    onClick={() => setImportConcursoId(selectedConcurso.id)}
                    leftIcon={<Sparkles className="w-4 h-4" />}
                  >
                    Importar por IA
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingDisciplina(null);
                      setNewDiscName('');
                      setNewDiscWeight('2.0');
                      setNewDiscColor('#10b981');
                      setIsAddDisciplinaModalOpen(true);
                    }}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Cadastrar Primeira Matéria
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedConcursoDisciplinas.map(disc => {
                const discTopics = assuntos.filter(a => a.disciplinaId === disc.id);
                const dominados = discTopics.filter(a => a.completed || a.status === 'dominado' || a.status === 'revisado').length;
                const percent = discTopics.length > 0 ? Math.round((dominados / discTopics.length) * 100) : 0;
                const isExpanded = !!expandedDisciplinas[disc.id];

                return (
                  <div 
                    key={disc.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  >
                    {/* Header do Card da Matéria */}
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <SubjectIcon subjectName={disc.name} />
                          <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                              {disc.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] font-semibold text-slate-400">
                                Peso {disc.weight || 1}
                              </span>
                              <span className="text-slate-600 dark:text-slate-700">•</span>
                              <span className="text-[11px] font-semibold text-slate-400">
                                {disc.totalStudyMinutes ? `${Math.floor(disc.totalStudyMinutes / 60)}h ${disc.totalStudyMinutes % 60}m` : '0h estudadas'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {!isArchived && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingDisciplina(disc);
                                setNewDiscName(disc.name);
                                setNewDiscWeight(disc.weight.toString());
                                setNewDiscColor(disc.color || '#10b981');
                                setIsAddDisciplinaModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Editar Matéria"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingDisciplinaId(disc.id)}
                              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Excluir Matéria"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Progresso da Disciplina */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-400">
                            {dominados} de {discTopics.length} tópicos dominados
                          </span>
                          <span className="text-emerald-500 font-bold">{percent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-300"
                            style={{ 
                              width: `${percent}%`,
                              backgroundColor: disc.color || '#10b981'
                            }}
                          />
                        </div>
                      </div>

                      {/* Ações da Disciplina */}
                      <div className="flex items-center justify-between pt-1 gap-2">
                        {!isArchived && onOpenStudyTimer && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onOpenStudyTimer(disc.id)}
                            leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
                            className="text-xs font-bold"
                          >
                            Estudar Agora
                          </Button>
                        )}

                        <button
                          onClick={() => toggleDisciplinaExpanded(disc.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800/80 transition-colors ml-auto cursor-pointer"
                        >
                          <span>{isExpanded ? 'Recolher Tópicos' : `Ver Tópicos (${discTopics.length})`}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Gaveta Expandida de Tópicos */}
                    {isExpanded && (
                      <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 space-y-3 border-t border-slate-100 dark:border-slate-800">
                        {discTopics.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-2">
                            Nenhum tópico cadastrado nesta matéria.
                          </p>
                        ) : (
                          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                            {discTopics.map(topic => {
                              const isCompleted = topic.completed || topic.status === 'dominado';
                              const isEmEstudo = topic.status === 'em_estudo';
                              const isEditing = editingTopicId === topic.id;

                              return (
                                <div
                                  key={topic.id}
                                  className="group flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 text-xs transition-colors"
                                >
                                  {/* Status Circle */}
                                  <button
                                    disabled={isArchived}
                                    onClick={(e) => !isArchived && handleToggleTopicStatus(topic, e)}
                                    className={`shrink-0 p-0.5 rounded-md ${isArchived ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-800'}`}
                                    title={isArchived ? 'Concurso arquivado (somente leitura)' : 'Alternar Status (Não Iniciado -> Em Estudo -> Dominado)'}
                                  >
                                    {isCompleted ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/10" />
                                    ) : isEmEstudo ? (
                                      <Circle className="w-4 h-4 text-sky-400 fill-sky-400/20" />
                                    ) : (
                                      <Circle className="w-4 h-4 text-slate-500 hover:text-slate-300" />
                                    )}
                                  </button>

                                  {/* Topic Name / Inline Edit */}
                                  <div className="flex-1 min-w-0">
                                    {isEditing ? (
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="text"
                                          value={editingTopicName}
                                          onChange={(e) => setEditingTopicName(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveEditTopic(topic.id);
                                            if (e.key === 'Escape') setEditingTopicId(null);
                                          }}
                                          autoFocus
                                          className="w-full bg-slate-800 text-slate-100 px-2 py-1 rounded text-xs border border-emerald-500 focus:outline-hidden"
                                        />
                                        <button
                                          onClick={() => handleSaveEditTopic(topic.id)}
                                          className="p-1 text-emerald-400 hover:bg-slate-800 rounded"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => setEditingTopicId(null)}
                                          className="p-1 text-slate-400 hover:bg-slate-800 rounded"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <span className={`font-medium truncate block ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                                        {topic.name}
                                      </span>
                                    )}
                                  </div>

                                  {/* Actions on Topic */}
                                  {!isEditing && !isArchived && (
                                    <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                                      {onOpenStudyTimer && (
                                        <button
                                          onClick={() => onOpenStudyTimer(disc.id, topic.id)}
                                          className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                                          title="Estudar Tópico"
                                        >
                                          <Play className="w-3 h-3" />
                                        </button>
                                      )}
                                      <button
                                        onClick={() => handleStartEditTopic(topic)}
                                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                        title="Editar Tópico"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={(e) => handleDeleteTopic(topic.id, e)}
                                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                        title="Excluir Tópico"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Quick Add Topic Input */}
                        {!isArchived && (
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="text"
                              placeholder="Adicionar novo tópico nesta matéria..."
                              value={newTopicInputs[disc.id] || ''}
                              onChange={(e) => setNewTopicInputs(prev => ({ ...prev, [disc.id]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddTopicToDisciplina(disc.id);
                              }}
                              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 px-3 py-1.5 rounded-xl text-xs placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-500"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddTopicToDisciplina(disc.id)}
                              leftIcon={<Plus className="w-3 h-3" />}
                              className="text-xs py-1.5 px-3 shrink-0"
                            >
                              Adicionar
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {!isArchived && importConcursoId === selectedConcurso.id && (
          <EditalImportModal
            isOpen
            onClose={() => setImportConcursoId(null)}
            concursos={[selectedConcurso]}
            selectedConcursoId={selectedConcurso.id}
            hasExistingDisciplinas={false}
            onConfirmImport={async (payload) => {
              await onImportEditalTree(payload, selectedConcurso.id, 'merge');
              showFeedback('success', 'Matérias do edital importadas com sucesso!');
            }}
          />
        )}

        {/* Modal: Adicionar / Editar Matéria (Com fluxo de Assuntos Automático / Manual + Conferência) */}
        <NovaMateriaModal
          isOpen={isAddDisciplinaModalOpen}
          onClose={() => {
            setIsAddDisciplinaModalOpen(false);
            setEditingDisciplina(null);
          }}
          editingDisciplina={editingDisciplina}
          concursoId={selectedConcurso.id}
          concursoTitle={fullTitle}
          cargoRole={selectedConcurso.role}
          nextOrder={selectedConcursoDisciplinas.length + 1}
          onSaveNewDisciplinaWithTopics={async (discData, topics) => {
            if (onAddDisciplinaWithTopics) {
              await onAddDisciplinaWithTopics(discData, topics);
            } else if (onAddDisciplina) {
              await onAddDisciplina(discData);
            }
            showFeedback(
              'success',
              topics.length > 0
                ? `Matéria "${discData.name}" e ${topics.length} tópicos adicionados com sucesso!`
                : `Matéria "${discData.name}" adicionada ao concurso!`
            );
          }}
          onUpdateDisciplina={async (id, partial) => {
            if (onUpdateDisciplina) {
              await onUpdateDisciplina(id, partial);
              showFeedback('success', `Matéria "${partial.name || ''}" atualizada!`);
            }
          }}
        />

        {/* Modal: Confirmar Exclusão de Matéria */}
        <Modal
          isOpen={deletingDisciplinaId !== null}
          onClose={() => setDeletingDisciplinaId(null)}
          title="Excluir Matéria"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-300">
              Tem certeza de que deseja remover esta disciplina? Todos os tópicos vinculados a ela serão excluídos.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setDeletingDisciplinaId(null)}>Cancelar</Button>
              <Button type="button" variant="danger" onClick={handleConfirmDeleteDisciplina} isLoading={isSubmitting}>
                Confirmar Exclusão
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal: Editar Concurso Existente */}
        <Modal
          isOpen={editingConcurso !== null}
          onClose={() => setEditingConcurso(null)}
          title="Editar Dados do Concurso"
          maxWidth="lg"
        >
          <form onSubmit={handleSaveEditConcurso} className="space-y-4 text-xs">
            <Input
              label="Título do Concurso *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Órgão *" value={organ} onChange={(e) => setOrgan(e.target.value)} required />
              <Input label="Banca *" value={banca} onChange={(e) => setBanca(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Cargo *" value={role} onChange={(e) => setRole(e.target.value)} required />
              <Input label="Remuneração (R$)" type="number" value={remuneration} onChange={(e) => setRemuneration(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Data da Prova" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
              <Input label="Vagas" type="number" value={vacantPositions} onChange={(e) => setVacantPositions(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setEditingConcurso(null)}>Cancelar</Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>Salvar Alterações</Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Confirmar Exclusão de Concurso */}
        <Modal
          isOpen={deletingConcursoId !== null}
          onClose={() => setDeletingConcursoId(null)}
          title="Excluir Concurso"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-300">
              Tem certeza de que deseja remover este concurso? As matérias, tópicos e provas associadas a ele também serão excluídos.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setDeletingConcursoId(null)}>Cancelar</Button>
              <Button type="button" variant="danger" onClick={handleConfirmDeleteConcurso} isLoading={isSubmitting}>
                Confirmar Exclusão
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // =========================================================================
  // VIEW: HUB DE CONCURSOS (MEUS CONCURSOS COM TRAVA DE 3 PLANOS)
  // =========================================================================
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {feedback && (
        <div className={`p-4 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2 ${
          feedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-emerald-500" />
            Concursos & Provas
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Hub de concursos foco (máx. 3), painel de matérias e gerenciamento de provas anteriores.
          </p>
        </div>

        {/* Botões de Alternância de Aba com Destaque e Efeito Glow / Neon Dinâmico */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('concursos')}
            style={
              activeTab === 'concursos'
                ? {
                    backgroundColor: themeGlowStyles.color,
                    boxShadow: `0 0 15px ${themeGlowStyles.glow}, 0 0 30px ${themeGlowStyles.glowSoft}`,
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#ffffff',
                  }
                : {
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: `1.5px solid ${themeGlowStyles.color}`,
                    boxShadow: `inset 0 0 8px ${themeGlowStyles.glowSoft}, 0 0 10px ${themeGlowStyles.glowSoft}`,
                    color: themeGlowStyles.color,
                  }
            }
            className={`px-6 py-2.5 rounded-full text-sm sm:text-base font-bold cursor-pointer select-none ${
              activeTab === 'concursos' ? 'concursos-tab-btn-active' : 'concursos-tab-btn-inactive'
            }`}
          >
            Concursos ({totalAtivos}/{MAX_CONCURSOS})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('provas')}
            style={
              activeTab === 'provas'
                ? {
                    backgroundColor: themeGlowStyles.color,
                    boxShadow: `0 0 15px ${themeGlowStyles.glow}, 0 0 30px ${themeGlowStyles.glowSoft}`,
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#ffffff',
                  }
                : {
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: `1.5px solid ${themeGlowStyles.color}`,
                    boxShadow: `inset 0 0 8px ${themeGlowStyles.glowSoft}, 0 0 10px ${themeGlowStyles.glowSoft}`,
                    color: themeGlowStyles.color,
                  }
            }
            className={`px-6 py-2.5 rounded-full text-sm sm:text-base font-bold cursor-pointer select-none ${
              activeTab === 'provas' ? 'concursos-tab-btn-active' : 'concursos-tab-btn-inactive'
            }`}
          >
            Provas ({provas.length})
          </button>
        </div>
      </div>

      {/* Tab: Concursos (Banner Principal + Busca + Hub de Cards) */}
      {activeTab === 'concursos' && (
        <div className="space-y-6">
          {/* =========================================================================
              1. BANNER PRINCIPAL DE DESTAQUE (TOPO DA ABA CONCURSOS)
              ========================================================================= */}
          <MenuBannerFrame
            bannerThemes={CONCURSOS_BANNER_THEMES}
            alt="Banner Concursos"
            minHeight="min-h-[190px] md:min-h-[220px]"
            className="concursos-main-banner w-full border border-slate-200/20 dark:border-slate-800 shadow-xl flex items-center bg-slate-950"
            bgWrapperClassName="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0"
            imgClassName="concursos-banner-bg-img absolute -left-[7%] -top-[24%] w-[114%] h-[148%] max-w-none object-cover object-[78%_center] md:object-[74%_center] pointer-events-none select-none transition-transform duration-300"
            overlayClassName="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent pointer-events-none z-[1]"
            contentClassName="p-6 md:p-8 flex flex-col justify-center max-w-2xl h-full gap-4"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1
                  className="provas-banner-title text-2xl md:text-3xl font-extrabold !text-white tracking-tight leading-tight select-none drop-shadow-md"
                  style={{
                    color: '#FFFFFF',
                    textShadow: themeGlowStyles.textShadow,
                  }}
                >
                  Central de Concursos e Editais
                </h1>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-black/50 text-white/95 border border-white/20 backdrop-blur-md shadow-xs shrink-0">
                  {totalAtivos}/{MAX_CONCURSOS} Cadastrados
                </span>
              </div>

              <p className="text-white/90 text-xs md:text-sm leading-relaxed max-w-lg">
                Gerencie até 3 concursos simultâneos, estruture matérias verticalizadas e acompanhe seu foco principal.
              </p>
            </div>

            <div className="pt-1 flex items-center gap-3 flex-wrap">
              <Button
                variant={isLimitReached ? 'outline' : 'primary'}
                size="md"
                disabled={isLimitReached}
                onClick={handleOpenNovoConcurso}
                leftIcon={isLimitReached ? <Lock className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                className={`font-bold shadow-lg shadow-black/25 text-xs md:text-sm px-5 py-2.5 ${
                  !isLimitReached ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed !text-white border-white/30'
                }`}
              >
                {isLimitReached ? 'Limite de 3 Concursos Atingido' : 'Novo Concurso'}
              </Button>
            </div>
          </MenuBannerFrame>

          {/* =========================================================================
              2. BARRA DE PESQUISA E AÇÕES RÁPIDAS
              ========================================================================= */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Buscar por cargo, órgão ou banca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <div className="flex items-center gap-2">
              {isLimitReached && (
                <span className="text-[11px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Limite de 3 concursos atingido
                </span>
              )}
              <Button
                variant={isLimitReached ? 'outline' : 'primary'}
                disabled={isLimitReached}
                onClick={handleOpenNovoConcurso}
                leftIcon={<Plus className="w-4 h-4" />}
                className={!isLimitReached ? 'shadow-md shadow-emerald-500/20' : 'opacity-60 cursor-not-allowed'}
              >
                Novo Concurso
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Cards dos Concursos Cadastrados */}
            {filteredConcursosAtivos.map(concurso => {
              const isActive = String(concurso.id) === String(currentActiveConcursoId);
              const diffDays = concurso.examDate 
                ? Math.ceil((new Date(concurso.examDate).getTime() - new Date().getTime()) / 86400000)
                : null;

              // Contagem de disciplinas e tópicos vinculados
              const discCount = disciplinas.filter(d => d.concursoId === concurso.id).length;
              const discIds = new Set(disciplinas.filter(d => d.concursoId === concurso.id).map(d => d.id));
              const topicosCount = assuntos.filter(a => discIds.has(a.disciplinaId)).length;

              const fullTitle = concurso.orgao || concurso.nome || concurso.titulo || 
                (concurso.organ && concurso.title && concurso.title.length === 1 ? concurso.organ : concurso.title) || 
                concurso.organ;

              return (
                <Card 
                  key={concurso.id} 
                  hoverEffect 
                  className={`relative overflow-hidden flex flex-col justify-between transition-all ${
                    isActive ? 'ring-2 ring-emerald-500 border-emerald-500 shadow-emerald-500/10' : ''
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-bl-lg flex items-center gap-1 shadow-xs">
                      <Star className="w-3 h-3 fill-current" /> Foco Ativo
                    </div>
                  )}

                  <CardBody className="p-5 space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(concurso.status)}
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {concurso.sphere}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        {fullTitle}
                      </h3>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        Cargo: {concurso.role}
                      </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Matérias</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {discCount} disciplinas
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Tópicos</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {topicosCount} tópicos
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Dias Prova</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {diffDays !== null ? (diffDays >= 0 ? `${diffDays} dias` : 'Realizada') : '-'}
                        </span>
                      </div>
                    </div>
                  </CardBody>

                  <CardFooter className="flex flex-col gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={() => setSelectedConcursoId(concurso.id)}
                      className="w-full justify-center font-bold text-xs"
                      rightIcon={<ChevronRight className="w-4 h-4" />}
                    >
                      Abrir Painel do Concurso
                    </Button>

                    <div className="flex items-center justify-between w-full pt-1">
                      {!isActive ? (
                        <button
                          type="button"
                          onClick={() => handleActivate(concurso.id, fullTitle)}
                          className="text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Star className="w-3.5 h-3.5" /> Ativar Foco
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="text-xs font-bold text-emerald-400 flex items-center gap-1 cursor-default opacity-100"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Foco Ativo
                        </button>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setArchivingConcurso(concurso)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                          title="Arquivar Concurso"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditConcurso(concurso)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Editar Concurso"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingConcursoId(concurso.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Excluir Concurso"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}

            {/* Card de Ação Rápida: Cadastrar Novo Concurso com Trava de 3 Concursos */}
            {!isLimitReached ? (
              <div
                onClick={handleOpenNovoConcurso}
                className="group relative rounded-2xl border-2 border-dashed border-emerald-500/30 hover:border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[220px]"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 flex items-center justify-center mb-3 transition-transform shadow-inner">
                  <Plus className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-400 transition-colors">
                  + Cadastrar Novo Concurso
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                  Importe disciplinas e tópicos do edital via Inteligência Artificial.
                </p>
                <span className="mt-3 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  {totalAtivos} de {MAX_CONCURSOS} cadastrados
                </span>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-900/30 p-6 flex flex-col items-center justify-center text-center min-h-[220px] opacity-75">
                <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                  Limite de 3 Concursos Atingido
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                  Você já atingiu a cota máxima de 3 concursos cadastrados. Para adicionar um novo certame, arquive ou exclua um concurso existente.
                </p>
                <span className="mt-3 text-[11px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                  3/3 Planos Utilizados
                </span>
              </div>
            )}
          </div>

          {/* =========================================================================
              3. SEÇÃO: CONCURSOS ARQUIVADOS (PRESERVAÇÃO TOTAL & LIBERAÇÃO DE VAGA)
              ========================================================================= */}
          {concursosArquivados.length > 0 && (
            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-4">
              <button
                type="button"
                onClick={() => setIsArchivedSectionExpanded(prev => !prev)}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 hover:bg-slate-200/70 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 transition-all cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Archive className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      Concursos Arquivados ({concursosArquivados.length})
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Certames arquivados preservam todos os dados e não ocupam sua cota de 3 concursos ativos.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="text-xs font-semibold hidden sm:inline">
                    {isArchivedSectionExpanded ? 'Recolher' : 'Expandir'}
                  </span>
                  {isArchivedSectionExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isArchivedSectionExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
                  {filteredConcursosArquivados.map(concurso => {
                    const discCount = disciplinas.filter(d => d.concursoId === concurso.id).length;
                    const discIds = new Set(disciplinas.filter(d => d.concursoId === concurso.id).map(d => d.id));
                    const topicos = assuntos.filter(a => discIds.has(a.disciplinaId));
                    const dominadosCount = topicos.filter(a => a.completed || a.status === 'dominado' || a.status === 'revisado').length;
                    const totalStudyMinutes = disciplinas
                      .filter(d => d.concursoId === concurso.id)
                      .reduce((acc, d) => acc + (d.totalStudyMinutes || 0), 0);

                    const fullTitle = concurso.orgao || concurso.nome || concurso.titulo || 
                      (concurso.organ && concurso.title && concurso.title.length === 1 ? concurso.organ : concurso.title) || 
                      concurso.organ;

                    return (
                      <Card
                        key={concurso.id}
                        className="relative overflow-hidden flex flex-col justify-between opacity-90 hover:opacity-100 transition-all border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 hover:border-slate-400 dark:hover:border-slate-700"
                      >
                        <div className="absolute top-0 right-0 bg-amber-500/15 border-b border-l border-amber-500/30 text-amber-500 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-bl-lg flex items-center gap-1 shadow-xs">
                          <Archive className="w-3 h-3" /> Arquivado
                        </div>

                        <CardBody className="p-5 space-y-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="amber" size="sm">Arquivado</Badge>
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                {concurso.sphere}
                              </span>
                            </div>

                            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                              {fullTitle}
                            </h3>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                              Cargo: {concurso.role}
                            </p>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Matérias</span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                {discCount} disciplinas
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Tópicos</span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                {dominadosCount}/{topicos.length}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Estudo</span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                {totalStudyMinutes ? `${Math.floor(totalStudyMinutes / 60)}h ${totalStudyMinutes % 60}m` : '0h'}
                              </span>
                            </div>
                          </div>
                        </CardBody>

                        <CardFooter className="flex flex-col gap-2 pt-3 border-t border-slate-200 dark:border-slate-800 bg-slate-100/40 dark:bg-slate-900/40">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedConcursoId(concurso.id)}
                            className="w-full justify-center font-bold text-xs"
                            rightIcon={<ChevronRight className="w-4 h-4" />}
                          >
                            Visualizar Painel / Edital
                          </Button>

                          <div className="flex items-center justify-between w-full pt-1">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleUnarchiveConcursoAction(concurso.id, fullTitle)}
                              leftIcon={<ArchiveRestore className="w-3.5 h-3.5" />}
                              className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white border-amber-600 cursor-pointer shadow-xs"
                            >
                              Desarquivar
                            </Button>

                            <button
                              onClick={() => setDeletingConcursoId(concurso.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Excluir Concurso"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: Provas & Simulados (Layout Rico com Banner, Filtros e Grid Independente) */}
      {activeTab === 'provas' && (
        <ProvasTab
          provas={provas}
          onAddProva={onAddProva}
          onUpdateProva={onUpdateProva}
          onDeleteProva={onDeleteProva}
          showFeedback={showFeedback}
        />
      )}

      {/* Wizard Modal: Novo Concurso + Extração IA */}
      {isNovoConcursoWizardOpen && (
        <NovoConcursoModal
          key={novoConcursoInstanceKey}
          isOpen={isNovoConcursoWizardOpen}
          onClose={() => setIsNovoConcursoWizardOpen(false)}
          onSaveConcursoWithDisciplinas={handleSaveNewConcursoWithDisciplinas}
        />
      )}

      {/* Modal: Editar Concurso Existente */}
      <Modal
        isOpen={editingConcurso !== null}
        onClose={() => setEditingConcurso(null)}
        title="Editar Dados do Concurso"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveEditConcurso} className="space-y-4 text-xs">
          <Input
            label="Título do Concurso *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Órgão *" value={organ} onChange={(e) => setOrgan(e.target.value)} required />
            <Input label="Banca *" value={banca} onChange={(e) => setBanca(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Cargo *" value={role} onChange={(e) => setRole(e.target.value)} required />
            <Input label="Remuneração (R$)" type="number" value={remuneration} onChange={(e) => setRemuneration(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Data da Prova" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
            <Input label="Vagas" type="number" value={vacantPositions} onChange={(e) => setVacantPositions(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setEditingConcurso(null)}>Cancelar</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>Salvar Alterações</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Nova Prova Anterior */}
      <Modal
        isOpen={isAddProvaModalOpen}
        onClose={() => setIsAddProvaModalOpen(false)}
        title="Cadastrar Prova Anterior"
        maxWidth="md"
      >
        <form onSubmit={handleSaveProva} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Órgão *" placeholder="Ex: TJ-SP" value={provaOrgan} onChange={(e) => setProvaOrgan(e.target.value)} required />
            <Input label="Banca *" placeholder="Ex: Vunesp" value={provaBanca} onChange={(e) => setProvaBanca(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Cargo *" placeholder="Ex: Escrevente" value={provaRole} onChange={(e) => setProvaRole(e.target.value)} required />
            <Input label="Ano" type="number" value={provaYear} onChange={(e) => setProvaYear(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Qtd. Questões" type="number" value={provaQuestionsCount} onChange={(e) => setProvaQuestionsCount(e.target.value)} />
            <Input label="Duração (min)" type="number" value={provaDurationMinutes} onChange={(e) => setProvaDurationMinutes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsAddProvaModalOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>Salvar Prova</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirmação de Exclusão de Concurso */}
      <Modal
        isOpen={deletingConcursoId !== null}
        onClose={() => setDeletingConcursoId(null)}
        title="Excluir Concurso"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            Tem certeza de que deseja remover este concurso? As matérias, tópicos e provas associadas a ele também serão excluídos.
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setDeletingConcursoId(null)}>Cancelar</Button>
            <Button type="button" variant="danger" onClick={handleConfirmDeleteConcurso} isLoading={isSubmitting}>
              Confirmar Exclusão
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Confirmação de Exclusão de Prova */}
      <Modal
        isOpen={deletingProvaId !== null}
        onClose={() => setDeletingProvaId(null)}
        title="Excluir Prova Anterior"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            Tem certeza de que deseja remover esta prova anterior?
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setDeletingProvaId(null)}>Cancelar</Button>
            <Button 
              type="button" 
              variant="danger" 
              onClick={async () => {
                if (deletingProvaId) {
                  await onDeleteProva(deletingProvaId);
                  setDeletingProvaId(null);
                  showFeedback('success', 'Prova anterior removida.');
                }
              }}
            >
              Confirmar Exclusão
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Confirmação de Arquivamento de Concurso */}
      <Modal
        isOpen={archivingConcurso !== null}
        onClose={() => setArchivingConcurso(null)}
        title="Arquivar Concurso"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200">
            <Archive className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Deseja arquivar o concurso "{archivingConcurso?.organ || archivingConcurso?.title}"?
              </p>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                Todos os seus dados (disciplinas, tópicos, edital verticalizado, histórico de estudos, questões e revisões) serão <strong>100% preservados</strong>.
              </p>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                O certame será movido para <em>"Concursos Arquivados"</em> e <strong>liberará 1 vaga</strong> na sua cota para cadastrar um novo concurso ativo.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setArchivingConcurso(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleConfirmArchiveConcurso}
              isLoading={isSubmitting}
              leftIcon={<Archive className="w-4 h-4" />}
              className="bg-amber-600 hover:bg-amber-700 text-white border-amber-600"
            >
              Confirmar Arquivamento
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Alerta de Limite de Concursos Ativos Atingido ao tentar Desarquivar */}
      <Modal
        isOpen={isLimitAlertModalOpen}
        onClose={() => setIsLimitAlertModalOpen(false)}
        title="Limite de Concursos Ativos Atingido"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200">
            <Lock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Você já possui 3 concursos ativos no momento.
              </p>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                O limite máximo é de 3 concursos simultâneos em andamento. Para desarquivar este certame, primeiro arquive ou exclua um dos seus 3 concursos ativos.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="primary"
              onClick={() => setIsLimitAlertModalOpen(false)}
              className="px-5 font-bold"
            >
              Entendido
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
