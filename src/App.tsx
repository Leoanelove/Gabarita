import React, { useState, useEffect, useMemo } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { 
  NavigationTab, 
  Concurso, 
  Disciplina, 
  Assunto, 
  Revisao, 
  Questao, 
  Meta, 
  Simulado, 
  UserProfile,
  StudySessionType,
  Prova,
  SessaoEstudo,
  TopicStatus,
  Subtopico,
  EditalAiImportPayload,
  StudyPlan,
  PlannedSession,
  WeeklyAvailability,
  PlanSessionStatus,
  StudyCycle,
  CycleBlock,
  RegistroBlocoQuestoes,
  ItemCadernoErros,
  ErroStatusRevisao,
  MotivoErro,
  RevisionSettings,
  RevisionRating,
  RevisionMethod,
  Conquista,
  MarcoEstudo,
  EstatisticasProgressoReal,
  UserPlan,
  StudyMethod
} from './types';
import { DatabaseService } from './services/db';
import { AuthPage } from './components/auth/AuthPage';
import { GezinhoLogo } from './components/common/GezinhoLogo';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { MobileNav } from './components/layout/MobileNav';
import { StudySessionModal } from './components/estudos/StudySessionModal';
import { StudyTimerProvider, useStudyTimer } from './contexts/StudyTimerContext';
import { Loader2 } from 'lucide-react';
import { DashboardView } from './components/dashboard/DashboardView';
import { ConcursosView } from './components/concursos/ConcursosView';
import { PlanoView } from './components/plano/PlanoView';
import { DisciplinasView } from './components/disciplinas/DisciplinasView';
import { RevisoesView } from './components/revisoes/RevisoesView';
import { HistoricoView } from './components/historico/HistoricoView';
import { FlashcardsView } from './components/flashcards/FlashcardsView';
import { QuestoesView } from './components/cadernoerros/QuestoesView';
import { CadernoErrosView } from './components/cadernoerros/CadernoErrosView';
import { MetasView } from './components/metas/MetasView';
import { SimuladosView } from './components/simulados/SimuladosView';
import { PerfilView } from './components/perfil/PerfilView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { AIAssistantView } from './components/ai/AIAssistantView';
import { AdminView } from './components/admin/AdminView';
import { PlanosAssinaturaView } from './components/planos/PlanosAssinaturaView';
import { ResumosView } from './components/resumos/ResumosView';

const THEME_LIGHT_BACKGROUNDS: Record<string, string> = {
  verde: 'https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Planos%20de%20Fundo/Plano-de-fundo-verde.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvUGxhbm9zIGRlIEZ1bmRvL1BsYW5vLWRlLWZ1bmRvLXZlcmRlLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3OTI3MDQzMTUsImV4cCI6NDk0NjMwNDMxNX0.IXqoE7lZeJNc1yIkv9v1q9IYyTHIJ0zXcMtRyUsx0vnfnw4syvdRLJxbM5ILlH42zaQ246GJyrP_hef4dO6RhQ',
  azul: 'https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Planos%20de%20Fundo/Plano-de-fundo-azul.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvUGxhbm9zIGRlIEZ1bmRvL1BsYW5vLWRlLWZ1bmRvLWF6dWwucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5MjcwNDM0OSwiZXhwIjo0OTQ2MzA0MzQ5fQ.Q-SnRue0ZcYLrx3thv66RU10t6kZ6-UpVmplBzwDVZA6jWZ-C9Ar1VZaOeZdZhiGE5FkH9OgNZJyURpmWCaFnQ',
  rosa: 'https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Planos%20de%20Fundo/Plano-de-fundo-rosa.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvUGxhbm9zIGRlIEZ1bmRvL1BsYW5vLWRlLWZ1bmRvLXJvc2EucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5MjcwNDM2NywiZXhwIjo0OTQ2MzA0MzY3fQ.ZRu-1GxUJbdhqpGwn9kbtEXSGhfZqDnHsG6DndDmsSyqmsoogE-FJ24BapErUX32nZQmrJGwYGtFGCH_aB7MvA',
  roxo: 'https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Planos%20de%20Fundo/Plano-de-fundo-roxo.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvUGxhbm9zIGRlIEZ1bmRvL1BsYW5vLWRlLWZ1bmRvLXJveG8ucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5MjcwNDM5NCwiZXhwIjo0OTQ2MzA0Mzk0fQ.FyUXXs51r4IPVjUtuqF5HhYOvsTd7R9GMYx9bT6MtGjUn1C48xOKtCVzR-5zwHJFDJm181lv6sC1BCYSnpeDNA',
  laranja: 'https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Planos%20de%20Fundo/Plano-de-fundo-laranja.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvUGxhbm9zIGRlIEZ1bmRvL1BsYW5vLWRlLWZ1bmRvLWxhcmFuamEucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5MjcwNDQwOCwiZXhwIjo0OTQ2MzA0NDA4fQ.kLJJqGFmuP8GOlsamCoOVk8n6rpmTZjjzhmaGI63JGc_h2HfDNUx_ta8NK2c3c_cw7a_tea6El_vwQ8IQbUBlw',
};

// Flags de controle de módulos (Para reativar no futuro, altere para true)
const ENABLE_METAS_MODULE = false; // Para reativar "Metas & Desempenho", altere para true
const ENABLE_AI_ASSISTANT_MODULE = false; // Para reativar "Assistente IA", altere para true

const MainApp: React.FC = () => {
  const { user, isAuthenticated, isLoading, isLoginTransitioning, refreshProfile } = useAuth();
  const { colorSkin, effectiveTheme, reapplyTheme } = useTheme();
  const currentThemeKey = colorSkin || 'verde';
const activeThemeBgUrl = effectiveTheme === 'light' ? THEME_LIGHT_BACKGROUNDS[currentThemeKey] : null;

  useEffect(() => {
    if (isAuthenticated && !isLoginTransitioning) {
      reapplyTheme();
    }
  }, [isAuthenticated, isLoginTransitioning, reapplyTheme]);
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [concursosSubTab, setConcursosSubTab] = useState<'concursos' | 'provas'>('concursos');
  const [concursosSubTabTrigger, setConcursosSubTabTrigger] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavigateTab = (tab: NavigationTab) => {
    if (tab === 'concursos') {
      setConcursosSubTab('concursos');
      setConcursosSubTabTrigger(prev => prev + 1);
    }
    setCurrentTab(tab);
  };

  const handleNavigateToProvas = () => {
    setConcursosSubTab('provas');
    setConcursosSubTabTrigger(prev => prev + 1);
    setCurrentTab('concursos');
  };

  const {
    isStudyTimerOpen,
    timerInitialDisciplinaId,
    timerInitialAssuntoId,
    timerInitialDurationMinutes,
    timerInitialMode,
    timerContabilizarPlanejamento,
    timerCycleStudyTarget,
    openStudyTimer,
    openStudyRegister,
    closeStudyTimer,
  } = useStudyTimer();

  const [concursos, setConcursos] = useState<Concurso[]>([]);
  const [provas, setProvas] = useState<Prova[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [assuntos, setAssuntos] = useState<Assunto[]>([]);
  const [sessoes, setSessoes] = useState<SessaoEstudo[]>([]);
  const [revisoes, setRevisoes] = useState<Revisao[]>([]);
  const [revisionSettings, setRevisionSettings] = useState<RevisionSettings | null>(null);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [blocosQuestoes, setBlocosQuestoes] = useState<RegistroBlocoQuestoes[]>([]);
  const [cadernoErros, setCadernoErros] = useState<ItemCadernoErros[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [conquistas, setConquistas] = useState<Conquista[]>([]);
  const [marcos, setMarcos] = useState<MarcoEstudo[]>([]);
  const [stats, setStats] = useState<EstatisticasProgressoReal | null>(null);
  const [simulados, setSimulados] = useState<Simulado[]>([]);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [cycle, setCycle] = useState<StudyCycle | null>(null);
  const [studyMethod, setStudyMethod] = useState<StudyMethod>('ciclo');

  const [isDataLoading, setIsDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [activeConcursoId, setActiveConcursoId] = useState<string>(() => {
    return (typeof window !== 'undefined' ? localStorage.getItem('gabarita_active_concurso_id') : '') || '';
  });

  const loadData = async () => {
    setIsDataLoading(true);
    setDataError(null);
    try {
      await DatabaseService.sanitizeOrphanData();
      const c = await DatabaseService.getConcursos();
      const d = await DatabaseService.getDisciplinas();
      const a = await DatabaseService.getAssuntos();
      const [p, ses, r, srsSettings, q, bq, errs, m, achs, mrcs, st, s, sm] = await Promise.all([
        DatabaseService.getProvas(),
        DatabaseService.getSessoes(),
        DatabaseService.getRevisoes(),
        DatabaseService.getRevisionSettings(),
        DatabaseService.getQuestoes(),
        DatabaseService.getBlocosQuestoes(),
        DatabaseService.getCadernoErros(),
        ENABLE_METAS_MODULE ? DatabaseService.getMetas() : Promise.resolve([] as Meta[]),
        ENABLE_METAS_MODULE ? DatabaseService.getConquistas() : Promise.resolve([] as Conquista[]),
        ENABLE_METAS_MODULE ? DatabaseService.getMarcos() : Promise.resolve([] as MarcoEstudo[]),
        DatabaseService.getEstatisticasProgressoReal(user?.id || 'user_demo_01'),
        DatabaseService.getSimulados(),
        DatabaseService.getStudyMethod(),
      ]);

      const activeConcursos = c.filter(item => item.status !== 'arquivado' && !item.isArquivado);
      const savedActiveId = (typeof window !== 'undefined' ? localStorage.getItem('gabarita_active_concurso_id') : '') || user?.targetConcursoId || '';
      const resolvedActive = (savedActiveId ? activeConcursos.find(item => item.id === savedActiveId) : null) ||
                             activeConcursos.find(item => item.active || item.isAtivo) ||
                             activeConcursos[0] || null;
      const targetId = resolvedActive?.id || '';

      if (targetId && typeof window !== 'undefined') {
        try {
          localStorage.setItem('gabarita_active_concurso_id', targetId);
        } catch {}
      }
      setActiveConcursoId(targetId);

      const [pl, cy] = await Promise.all([
        targetId ? DatabaseService.getStudyPlan(targetId) : DatabaseService.getStudyPlan(),
        targetId ? DatabaseService.getStudyCycle(targetId) : DatabaseService.getStudyCycle(),
      ]);

      setConcursos(c);
      setProvas(p);
      setDisciplinas(d);
      setAssuntos(a);
      setSessoes(ses);
      setRevisoes(r);
      setRevisionSettings(srsSettings);
      setQuestoes(q);
      setBlocosQuestoes(bq);
      setCadernoErros(errs);
      setMetas(m);
      setConquistas(achs);
      setMarcos(mrcs);
      setStats(st);
      setSimulados(s);
      setPlan(pl && pl.concursoId === targetId && pl.sessions && pl.sessions.length > 0 ? pl : null);
      setCycle(cy && cy.concursoId === targetId && cy.blocks && cy.blocks.length > 0 ? cy : null);
      setStudyMethod(sm || 'ciclo');
      setIsDataLoading(false);
    } catch (err) {
      console.error('Erro ao carregar dados do Gabarita:', err);
      setDataError('Falha na sincronização dos dados locais e em nuvem.');
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadData();
    } else if (!isAuthenticated) {
      setConcursos([]);
      setProvas([]);
      setDisciplinas([]);
      setAssuntos([]);
      setSessoes([]);
      setRevisoes([]);
      setBlocosQuestoes([]);
      setCadernoErros([]);
      setSimulados([]);
      setMetas([]);
    }
  }, [isAuthenticated, user?.id]);

  const activeConcursos = useMemo(() => {
    return concursos.filter((c: Concurso) => c.status !== 'arquivado' && !c.isArquivado);
  }, [concursos]);

  const activeConcurso = useMemo(() => {
    if (activeConcursoId) {
      const match = activeConcursos.find((c: Concurso) => String(c.id) === String(activeConcursoId));
      if (match) return match;
    }
    if (user?.targetConcursoId) {
      const match = activeConcursos.find((c: Concurso) => String(c.id) === String(user.targetConcursoId));
      if (match) return match;
    }
    const marked = activeConcursos.find((c: Concurso) => c.active || c.isAtivo || c.isFocoAtivo);
    if (marked) return marked;
    return activeConcursos[0] || null;
  }, [activeConcursos, activeConcursoId, user?.targetConcursoId]);

  const effectiveActiveConcursoId = activeConcurso?.id || activeConcursoId || '';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <GezinhoLogo size={52} className="mb-4 animate-pulse drop-shadow-2xl" />
        <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          <span>Carregando Gabarita...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || isLoginTransitioning) {
    return <AuthPage />;
  }

  const handleOpenStudyTimer = openStudyTimer;
  const handleOpenStudyRegister = openStudyRegister;

  const handleUpdateSubscription = async (plan: UserPlan) => {
    if (!user) return;
    const expires = new Date();
    if (plan === 'mensal') expires.setMonth(expires.getMonth() + 1);
    else if (plan === 'anual') expires.setFullYear(expires.getFullYear() + 1);
    else if (plan === 'teste') expires.setDate(expires.getDate() + 7);
    else expires.setDate(expires.getDate() + 1);

    const subscription = {
      plan,
      status: plan === 'gratuito' ? ('expirado' as const) : ('ativo' as const),
      startDate: new Date().toISOString(),
      expiresAt: expires.toISOString(),
      gateway: 'stripe' as const,
    };
    await DatabaseService.updateUserProfile({ subscription });
    refreshProfile({ subscription });
  };

  const handleAddConcursoWithDisciplinas = async (
    concursoData: Omit<Concurso, 'id' | 'createdAt' | 'updatedAt'>,
    disciplinasData: EditalAiImportPayload['disciplinas'],
    draftId: string
  ) => {
    const result = await DatabaseService.addConcursoWithDisciplinas(concursoData, disciplinasData, draftId);
    setConcursos(prev => [result.concurso, ...prev.filter(c => String(c.id) !== String(result.concurso.id)).map(c => ({ ...c, active: false, isAtivo: false, is_ativo: false }))]);
    setDisciplinas(prev => [...prev.filter(d => !result.disciplinas.some(imported => imported.id === d.id)), ...result.disciplinas]);
    setAssuntos(prev => [...prev.filter(a => !result.assuntos.some(imported => imported.id === a.id)), ...result.assuntos]);
    refreshProfile({
      targetConcursoId: result.concurso.id,
      targetConcursoTitle: `${result.concurso.organ} - ${result.concurso.role}`,
    });
    const updatedProvas = await DatabaseService.getProvas();
    setProvas(updatedProvas);
    loadData();
  };

  const handleUpdateConcurso = async (id: string, partial: Partial<Concurso>) => {
    const updated = await DatabaseService.updateConcurso(id, partial);
    const isActivating = partial.active === true || partial.isAtivo === true || partial.is_ativo === true;
    if (isActivating) {
      setConcursos(prev => prev.map(c => String(c.id) === String(id) ? updated : { ...c, active: false, isAtivo: false, is_ativo: false }));
      refreshProfile({
        targetConcursoId: updated.id,
        targetConcursoTitle: `${updated.organ} - ${updated.role}`,
      });
    } else {
      setConcursos(prev => prev.map(c => String(c.id) === String(id) ? updated : c));
    }
    const updatedProvas = await DatabaseService.getProvas();
    setProvas(updatedProvas);
  };

  const handleDeleteConcurso = async (id: string) => {
    const updatedList = await DatabaseService.deleteConcurso(id);
    setConcursos(updatedList);
    const nextActive = updatedList.find(c => c.active || c.isAtivo) || updatedList[0];
    refreshProfile({
      targetConcursoId: nextActive?.id,
      targetConcursoTitle: nextActive ? `${nextActive.organ} - ${nextActive.role}` : undefined,
    });
    await loadData();
  };

  const handleSetActiveConcurso = async (id: string) => {
    setActiveConcursoId(id);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('gabarita_active_concurso_id', id);
      } catch {}
    }
    // Limpeza imediata de ciclo e plano em memória do concurso anterior para isolamento estrito
    setCycle(null);
    setPlan(null);

    const { concursos: updatedList, activeConcurso: updatedActive } = await DatabaseService.setActiveConcurso(id);
    setConcursos(updatedList);
    refreshProfile({
      targetConcursoId: updatedActive.id,
      targetConcursoTitle: `${updatedActive.organ} - ${updatedActive.role}`,
    });
    try {
      const [newCycle, newPlan, freshDisciplinas, freshAssuntos] = await Promise.all([
        DatabaseService.getStudyCycle(updatedActive.id),
        DatabaseService.getStudyPlan(updatedActive.id),
        DatabaseService.getDisciplinas(),
        DatabaseService.getAssuntos(),
      ]);
      setCycle(newCycle && newCycle.concursoId === updatedActive.id && newCycle.blocks && newCycle.blocks.length > 0 ? newCycle : null);
      setPlan(newPlan && newPlan.concursoId === updatedActive.id && newPlan.sessions && newPlan.sessions.length > 0 ? newPlan : null);
      setDisciplinas(freshDisciplinas);
      setAssuntos(freshAssuntos);
    } catch (e) {
      console.warn('Erro ao atualizar ciclo e plano do concurso ativo:', e);
    }
  };

  const handleArchiveConcurso = async (concursoId: string) => {
    const result = await DatabaseService.archiveConcurso(concursoId);
    setConcursos(result.concursos);
    if (result.nextActiveConcurso) {
      refreshProfile({
        targetConcursoId: result.nextActiveConcurso.id,
        targetConcursoTitle: `${result.nextActiveConcurso.organ} - ${result.nextActiveConcurso.role}`,
      });
      try {
        const [newCycle, newPlan, freshDisciplinas, freshAssuntos] = await Promise.all([
          DatabaseService.getStudyCycle(result.nextActiveConcurso.id),
          DatabaseService.getStudyPlan(result.nextActiveConcurso.id),
          DatabaseService.getDisciplinas(),
          DatabaseService.getAssuntos(),
        ]);
        setCycle(newCycle);
        setPlan(newPlan);
        setDisciplinas(freshDisciplinas);
        setAssuntos(freshAssuntos);
      } catch (e) {
        console.warn('Erro ao atualizar ciclo e plano após arquivar:', e);
      }
    } else {
      refreshProfile({
        targetConcursoId: '',
        targetConcursoTitle: '',
      });
    }
  };

  const handleUnarchiveConcurso = async (concursoId: string) => {
    const result = await DatabaseService.unarchiveConcurso(concursoId);
    setConcursos(result.concursos);
  };

  const handleAddProva = async (newProva: Omit<Prova, 'id' | 'createdAt'>) => {
    const created = await DatabaseService.addProva(newProva);
    setProvas(prev => [created, ...prev]);
  };

  const handleUpdateProva = async (id: string, partial: Partial<Prova>) => {
    const updated = await DatabaseService.updateProva(id, partial);
    setProvas(prev => prev.map(p => p.id === id ? updated : p));
  };

  const handleDeleteProva = async (id: string) => {
    const updated = await DatabaseService.deleteProva(id);
    setProvas(updated);
  };

  const handleAddDisciplina = async (newDisc: Omit<Disciplina, 'id' | 'createdAt' | 'topicsCount' | 'completedTopicsCount' | 'totalStudyMinutes'>) => {
    const created = await DatabaseService.addDisciplina({
      ...newDisc,
      concursoId: newDisc.concursoId || activeConcursoId,
    });
    setDisciplinas(prev => [...prev, created]);
  };

  const handleAddDisciplinaWithTopics = async (
    newDisc: Omit<Disciplina, 'id' | 'createdAt' | 'topicsCount' | 'completedTopicsCount' | 'totalStudyMinutes'>,
    topics: string[]
  ) => {
    const { disciplina, assuntos: createdAssuntos } = await DatabaseService.addDisciplinaWithTopics(
      {
        ...newDisc,
        concursoId: newDisc.concursoId || activeConcursoId,
      },
      topics
    );
    setDisciplinas(prev => [...prev, disciplina]);
    if (createdAssuntos.length > 0) {
      setAssuntos(prev => [...prev, ...createdAssuntos]);
    }
  };

  const handleUpdateDisciplina = async (id: string, partial: Partial<Disciplina>) => {
    const updated = await DatabaseService.updateDisciplina(id, partial);
    setDisciplinas(prev => prev.map(d => d.id === id ? updated : d));
  };

  const handleDeleteDisciplina = async (id: string) => {
    const updatedList = await DatabaseService.deleteDisciplina(id);
    setDisciplinas(updatedList);
    const [updatedAssuntos, updatedSessoes, updatedRevisoes, updatedBq, updatedErrs, updatedSimulados, updatedStats] = await Promise.all([
      DatabaseService.getAssuntos(),
      DatabaseService.getSessoes(),
      DatabaseService.getRevisoes(),
      DatabaseService.getBlocosQuestoes(),
      DatabaseService.getCadernoErros(),
      DatabaseService.getSimulados(),
      DatabaseService.getEstatisticasProgressoReal(user?.id || 'user_demo_01'),
    ]);
    setAssuntos(updatedAssuntos);
    setSessoes(updatedSessoes);
    setRevisoes(updatedRevisoes);
    setBlocosQuestoes(updatedBq);
    setCadernoErros(updatedErrs);
    setSimulados(updatedSimulados);
    setStats(updatedStats);
  };

  const handleDuplicateDisciplina = async (id: string) => {
    const { disciplina, assuntos: clonedAssuntos } = await DatabaseService.duplicateDisciplina(id);
    setDisciplinas(prev => [...prev, disciplina]);
    setAssuntos(prev => [...prev, ...clonedAssuntos]);
  };

  const handleAddAssunto = async (newAssunto: Omit<Assunto, 'id' | 'createdAt' | 'masteryLevel' | 'totalQuestionsSolved' | 'correctQuestionsSolved' | 'accuracyRate'>) => {
    const created = await DatabaseService.addAssunto(newAssunto);
    setAssuntos(prev => [...prev, created]);
  };

  const handleUpdateAssunto = async (id: string, partial: Partial<Assunto>) => {
    const updated = await DatabaseService.updateAssunto(id, partial);
    setAssuntos(prev => prev.map(a => a.id === id ? updated : a));
  };

  const handleDeleteAssunto = async (id: string) => {
    const updatedList = await DatabaseService.deleteAssunto(id);
    setAssuntos(updatedList);
    const [updatedDisciplinas, updatedSessoes, updatedRevisoes, updatedBq, updatedErrs, updatedStats] = await Promise.all([
      DatabaseService.getDisciplinas(),
      DatabaseService.getSessoes(),
      DatabaseService.getRevisoes(),
      DatabaseService.getBlocosQuestoes(),
      DatabaseService.getCadernoErros(),
      DatabaseService.getEstatisticasProgressoReal(user?.id || 'user_demo_01'),
    ]);
    setDisciplinas(updatedDisciplinas);
    setSessoes(updatedSessoes);
    setRevisoes(updatedRevisoes);
    setBlocosQuestoes(updatedBq);
    setCadernoErros(updatedErrs);
    setStats(updatedStats);
  };

  const handleDuplicateAssunto = async (id: string) => {
    const cloned = await DatabaseService.duplicateAssunto(id);
    setAssuntos(prev => [...prev, cloned]);
  };

  const handleReorderAssuntos = async (orderedIds: string[]) => {
    const updatedList = await DatabaseService.reorderAssuntos(orderedIds);
    setAssuntos(updatedList);
  };

  const handleUpdateAssuntoStatus = async (id: string, status: TopicStatus) => {
    const updated = await DatabaseService.updateAssuntoStatus(id, status);
    setAssuntos(prev => prev.map(a => a.id === id ? updated : a));
  };

  const handleAddSubtopico = async (assuntoId: string, name: string) => {
    const updatedAssunto = await DatabaseService.addSubtopico(assuntoId, name);
    setAssuntos(prev => prev.map(a => a.id === assuntoId ? updatedAssunto : a));
  };

  const handleUpdateSubtopico = async (assuntoId: string, subId: string, partial: Partial<Subtopico>) => {
    const updatedAssunto = await DatabaseService.updateSubtopico(assuntoId, subId, partial);
    setAssuntos(prev => prev.map(a => a.id === assuntoId ? updatedAssunto : a));
  };

  const handleDeleteSubtopico = async (assuntoId: string, subId: string) => {
    const updatedAssunto = await DatabaseService.deleteSubtopico(assuntoId, subId);
    setAssuntos(prev => prev.map(a => a.id === assuntoId ? updatedAssunto : a));
  };

  const handleImportEditalTree = async (
    payload: EditalAiImportPayload, 
    concursoId?: string, 
    mode: 'merge' | 'replace' = 'merge'
  ) => {
    const { disciplinas: updatedDisc, assuntos: updatedAss } = await DatabaseService.importEditalTree(payload, concursoId, mode);
    setDisciplinas(updatedDisc);
    setAssuntos(updatedAss);
  };

  const handleRecalculatePlan = async (customAvailability?: WeeklyAvailability, newExamDate?: string) => {
    const updated = await DatabaseService.recalculateStudyPlan(user.targetConcursoId, customAvailability, newExamDate);
    setPlan(updated);
  };

  const handleAddPlanSession = async (session: Omit<PlannedSession, 'id'>) => {
    const { plan: updated } = await DatabaseService.addPlannedSession(session);
    setPlan(updated);
  };

  const handleUpdatePlanSession = async (sessionId: string, partial: Partial<PlannedSession>) => {
    const updated = await DatabaseService.updatePlannedSession(sessionId, partial);
    setPlan(updated);
  };

  const handleDeletePlanSession = async (sessionId: string) => {
    const updated = await DatabaseService.deletePlannedSession(sessionId);
    setPlan(updated);
  };

  const handleReschedulePlanSession = async (sessionId: string, newDate: string, reason?: string) => {
    const updated = await DatabaseService.reschedulePlannedSession(sessionId, newDate, reason);
    setPlan(updated);
  };

  const handleMovePlanSession = async (concursoId: string, sessionId: string, date: string, beforeSessionId?: string) => {
    const updated = await DatabaseService.movePlannedSession(concursoId, sessionId, date, beforeSessionId);
    setPlan(current => current && current.concursoId !== concursoId ? current : updated);
  };

  const handleBatchRescheduleOverdue = async (targetDate?: string, mode?: 'today' | 'spread') => {
    const updated = await DatabaseService.batchRescheduleOverdue(targetDate, mode);
    setPlan(updated);
  };

  const handleTogglePlanSessionStatus = async (sessionId: string, status: PlanSessionStatus) => {
    const updated = await DatabaseService.togglePlanSessionStatus(sessionId, status);
    setPlan(updated);
    if (status === 'concluida') {
      const updatedSessoes = await DatabaseService.getSessoes();
      setSessoes(updatedSessoes);
    }
  };

  const handleAdvanceCycle = async (minutesStudied?: number) => {
    const updated = await DatabaseService.advanceStudyCycle(minutesStudied);
    setCycle(updated);
  };

  const handleRewindCycle = async () => {
    const updated = await DatabaseService.rewindStudyCycle();
    setCycle(updated);
  };

  const handleRecordCycleProgress = async (additionalMinutes: number) => {
    const updated = await DatabaseService.recordCycleProgress(additionalMinutes);
    setCycle(updated);
  };

  const handleResetCycleLap = async () => {
    const updated = await DatabaseService.resetCycleCurrentLap();
    setCycle(updated);
  };

  const handleUpdateCycleBlock = async (blockId: string, partial: Partial<CycleBlock>) => {
    const updated = await DatabaseService.updateCycleBlock(blockId, partial);
    setCycle(updated);
  };

  const handleCompleteRevisao = async (
    revisaoId: string, 
    rating: RevisionRating, 
    accuracyRate?: number, 
    questionsAttempted?: number, 
    questionsCorrect?: number, 
    notes?: string,
    sessionDetails?: {
      durationMinutes?: number;
      durationSeconds?: number;
      material?: string;
      teoriaFinalizada?: boolean;
      programarRevisoes?: boolean;
      contabilizarPlanejamento?: boolean;
      pageIntervals?: any[];
      videoaulas?: any[];
      completedAt?: string;
    }
  ) => {
    const revTarget = revisoes.find(r => r.id === revisaoId);
    const { allRevisoes } = await DatabaseService.completeRevisaoWithPerformance(
      revisaoId, 
      rating, 
      accuracyRate, 
      questionsAttempted, 
      questionsCorrect, 
      notes
    );
    setRevisoes(allRevisoes);

    if (revTarget) {
      const durationSeconds = sessionDetails?.durationSeconds ?? ((sessionDetails?.durationMinutes || 15) * 60);
      const durationMinutes = sessionDetails?.durationMinutes ?? Math.max(1, Math.round(durationSeconds / 60));
      const recorded = await DatabaseService.recordStudySession({
        userId: user.id,
        concursoId: activeConcursoId || undefined,
        disciplinaId: revTarget.disciplinaId,
        assuntoId: revTarget.assuntoId,
        disciplinaName: revTarget.disciplinaName,
        assuntoName: revTarget.assuntoName,
        durationMinutes,
        durationSeconds,
        type: 'revisao',
        origem: 'revisoes',
        material: sessionDetails?.material,
        questionsAttempted,
        questionsCorrect,
        accuracyRate,
        notes: notes !== undefined ? notes : '',
        teoriaFinalizada: sessionDetails?.teoriaFinalizada,
        programarRevisoes: sessionDetails?.programarRevisoes,
        contabilizarPlanejamento: sessionDetails?.contabilizarPlanejamento,
        pageIntervals: sessionDetails?.pageIntervals,
        videoaulas: sessionDetails?.videoaulas,
        completedAt: sessionDetails?.completedAt || new Date().toISOString(),
      });
      setSessoes(prev => [recorded, ...prev]);

      if (sessionDetails?.teoriaFinalizada && revTarget.assuntoId) {
        try {
          await DatabaseService.updateAssuntoStatus(revTarget.assuntoId, 'dominado');
        } catch (e) {
          console.warn('Erro ao atualizar status do tópico no edital:', e);
        }
      }

      if (sessionDetails?.programarRevisoes && revTarget.assuntoId) {
        try {
          const updatedRevs = await DatabaseService.gerarCicloCompletoRevisao(
            user.id,
            revTarget.disciplinaId,
            revTarget.assuntoId,
            revTarget.assuntoName,
            recorded
          );
          setRevisoes(updatedRevs);
        } catch (e) {
          console.warn('Erro ao programar novo ciclo de revisões:', e);
        }
      }
    }

    const [profile, updatedAss, updatedDiscs, updatedStats] = await Promise.all([
      DatabaseService.getUserProfile(user.id),
      DatabaseService.getAssuntos(),
      DatabaseService.getDisciplinas(),
      DatabaseService.getEstatisticasProgressoReal(user.id),
    ]);
    refreshProfile(profile);
    setAssuntos(updatedAss);
    setDisciplinas(updatedDiscs);
    setStats(updatedStats);
  };

  const handleAddRevisao = async (revData: {
    disciplinaId: string;
    assuntoId?: string;
    assuntoName: string;
    method: RevisionMethod | string;
    scheduledFor: string;
    notes?: string;
    isAutomatic?: boolean;
    stage?: number;
    intervalDays?: number;
  }) => {
    const disc = disciplinas.find(d => d.id === revData.disciplinaId);
    const created = await DatabaseService.addRevisao({
      ...revData,
      disciplinaName: disc?.name || 'Geral',
      userId: user.id,
      status: 'pendente',
    });
    setRevisoes(prev => [created, ...prev]);
  };

  const handleUpdateRevisao = async (id: string, partial: Partial<Revisao>) => {
    const updated = await DatabaseService.updateRevisao(id, partial);
    setRevisoes(prev => prev.map(r => r.id === id ? updated : r));
  };

  const handleDeleteRevisao = async (idOrIds: string | string[]) => {
    const updated = await DatabaseService.deleteRevisao(idOrIds);
    setRevisoes(updated);
  };

  const handleBatchRescheduleOverdueRevisoes = async (targetDateStr?: string) => {
    const updated = await DatabaseService.batchRescheduleOverdueRevisoes(targetDateStr);
    setRevisoes(updated);
  };

  const handleUpdateRevisionSettings = async (settingsPartial: Partial<RevisionSettings>) => {
    const updated = await DatabaseService.updateRevisionSettings(settingsPartial);
    setRevisionSettings(updated);
  };

  const handleAddMeta = async (newMeta: Omit<Meta, 'id' | 'createdAt'>) => {
    await DatabaseService.addMeta({
      ...newMeta,
      userId: user.id,
    });
    const [updatedMetas, updatedStats, updatedAchs, updatedMarcos] = await Promise.all([
      DatabaseService.getMetas(),
      DatabaseService.getEstatisticasProgressoReal(user.id),
      DatabaseService.getConquistas(),
      DatabaseService.getMarcos(),
    ]);
    setMetas(updatedMetas);
    setStats(updatedStats);
    setConquistas(updatedAchs);
    setMarcos(updatedMarcos);
  };

  const handleUpdateMeta = async (id: string, partial: Partial<Meta>) => {
    await DatabaseService.updateMeta(id, partial);
    const updatedMetas = await DatabaseService.getMetas();
    setMetas(updatedMetas);
  };

  const handleDeleteMeta = async (id: string) => {
    const updatedMetas = await DatabaseService.deleteMeta(id);
    setMetas(updatedMetas);
  };

  const handleSaveStudySession = async (session: {
    concursoId?: string;
    disciplinaId: string;
    assuntoId?: string;
    disciplinaName?: string;
    assuntoName?: string;
    durationMinutes: number;
    durationSeconds?: number;
    plannedMinutes?: number;
    type: StudySessionType;
    origem?: string;
    material?: string;
    questionsAttempted?: number;
    questionsCorrect?: number;
    notes?: string;
    teoriaFinalizada?: boolean;
    programarRevisoes?: boolean;
    revisaoDays?: number[];
    contabilizarPlanejamento?: boolean;
    pageIntervals?: any[];
    videoaulas?: any[];
    completedAt?: string;
  }) => {
    const recorded = await DatabaseService.recordStudySession({
      userId: user.id,
      ...session,
      completedAt: session.completedAt || new Date().toISOString(),
    });
    setSessoes(prev => [recorded, ...prev]);

    const shouldScheduleRevision = Boolean(session.programarRevisoes);

    if (session.disciplinaId && shouldScheduleRevision) {
      const top = session.assuntoId ? assuntos.find(a => a.id === session.assuntoId) : undefined;
      const updatedRevisoes = await DatabaseService.gerarCicloCompletoRevisao(
        user.id, 
        session.disciplinaId, 
        session.assuntoId, 
        top?.name || session.assuntoName || 'Estudo Geral',
        recorded,
        session.revisaoDays
      );
      setRevisoes(updatedRevisoes);
    }

   const [updatedDiscs, updatedAss, updatedStats] = await Promise.all([
      DatabaseService.getDisciplinas(),
      DatabaseService.getAssuntos(),
      DatabaseService.getEstatisticasProgressoReal(user.id),
    ]);
    setDisciplinas(updatedDiscs);
    setAssuntos(updatedAss);
    setStats(updatedStats);

    // Dispara evento para forçar atualização imediata do Edital Verticalizado na tela
    window.dispatchEvent(new CustomEvent('gabarita_edital_verticalizado_sync'));

    const profile = await DatabaseService.getUserProfile(user.id);
    refreshProfile(profile);
  };

  const handleSaveTimerSession = async (session: Parameters<typeof handleSaveStudySession>[0]) => {
    await handleSaveStudySession(session);
    if (session.contabilizarPlanejamento === false || (studyMethod !== 'ciclo' && !timerCycleStudyTarget)) return;

    const concursoId = timerCycleStudyTarget?.concursoId || activeConcursoId;
    if (!concursoId) return;
    try {
      const updated = await DatabaseService.recordCycleProgress(
        (session.durationSeconds ?? session.durationMinutes * 60) / 60,
        { concursoId, disciplinaId: session.disciplinaId, assuntoId: session.assuntoId, target: timerCycleStudyTarget },
      );
      if (concursoId === activeConcursoId) {
        setCycle(current => current && current.concursoId !== concursoId ? current : updated);
      }
    } catch (error) {
      console.warn('Erro ao registrar progresso do ciclo:', error);
    }
  };

  const handleUpdateStudySession = async (sessionId: string, partial: Partial<SessaoEstudo>) => {
    const updatedItem = await DatabaseService.updateStudySession(sessionId, partial);
    setSessoes(prev => prev.map(s => (s.id === sessionId ? updatedItem : s)));

    if (partial.programarRevisoes && updatedItem.disciplinaId) {
      const top = updatedItem.assuntoId ? assuntos.find(a => a.id === updatedItem.assuntoId) : undefined;
      const updatedRevisoes = await DatabaseService.gerarCicloCompletoRevisao(
        user.id,
        updatedItem.disciplinaId,
        updatedItem.assuntoId,
        top?.name || updatedItem.assuntoName || 'Estudo Geral',
        updatedItem,
        partial.revisaoDays || updatedItem.revisaoDays
      );
      setRevisoes(updatedRevisoes);
    } else if (partial.programarRevisoes === false) {
      const updatedRevisoes = await DatabaseService.removerCicloRevisaoDaSessao(updatedItem);
      setRevisoes(updatedRevisoes);
    }

    const [updatedDiscs, updatedAss, updatedStats] = await Promise.all([
      DatabaseService.getDisciplinas(),
      DatabaseService.getAssuntos(),
      DatabaseService.getEstatisticasProgressoReal(user.id),
    ]);
    setDisciplinas(updatedDiscs);
    setAssuntos(updatedAss);
    setStats(updatedStats);
  };

  const handleDeleteStudySession = async (sessionId: string) => {
    const updated = await DatabaseService.deleteStudySession(sessionId);
    setSessoes(updated);

    const [updatedDiscs, updatedAss, updatedStats] = await Promise.all([
      DatabaseService.getDisciplinas(),
      DatabaseService.getAssuntos(),
      DatabaseService.getEstatisticasProgressoReal(user.id),
    ]);
    setDisciplinas(updatedDiscs);
    setAssuntos(updatedAss);
    setStats(updatedStats);
  };

  const handleRecordBlocoQuestoes = async (bloco: Omit<RegistroBlocoQuestoes, 'id' | 'createdAt' | 'wrongAnswers' | 'accuracyRate'>) => {
    const recorded = await DatabaseService.recordBlocoQuestoes(bloco);
    setBlocosQuestoes(prev => [recorded, ...prev]);

    const [updatedDiscs, updatedAss] = await Promise.all([
      DatabaseService.getDisciplinas(),
      DatabaseService.getAssuntos(),
    ]);
    setDisciplinas(updatedDiscs);
    setAssuntos(updatedAss);

    const profile = await DatabaseService.getUserProfile(user.id);
    refreshProfile(profile);
  };

  const handleDeleteBlocoQuestoes = async (blocoId: string) => {
    const updated = await DatabaseService.deleteBlocoQuestoes(blocoId);
    setBlocosQuestoes(updated);
  };

  const handleUpdateBlocoQuestoes = async (blocoId: string, partial: Partial<RegistroBlocoQuestoes>) => {
    const updated = await DatabaseService.updateBlocoQuestoes(blocoId, partial);
    setBlocosQuestoes(prev => prev.map(b => b.id === blocoId ? updated : b));
  };

  const handleAddCadernoErro = async (
    item: Omit<ItemCadernoErros, 'id' | 'createdAt' | 'updatedAt' | 'reincidenciaCount'> & { reincidenciaCount?: number }
  ) => {
    const disc = disciplinas.find(d => d.id === item.disciplinaId);
    const resolvedConcursoId = disc?.concursoId || item.concursoId || effectiveActiveConcursoId || undefined;
    const created = await DatabaseService.addCadernoErro({
      ...item,
      userId: user.id,
      concursoId: resolvedConcursoId,
    });
    setCadernoErros(prev => [created, ...prev]);
  };

  const handleUpdateCadernoErro = async (id: string, partial: Partial<ItemCadernoErros>) => {
    const disc = partial.disciplinaId ? disciplinas.find(d => d.id === partial.disciplinaId) : undefined;
    const resolvedConcursoId = partial.concursoId || disc?.concursoId;
    const updated = await DatabaseService.updateCadernoErro(
      id,
      resolvedConcursoId ? { ...partial, concursoId: resolvedConcursoId } : partial
    );
    setCadernoErros(prev => prev.map(e => e.id === id ? updated : e));
  };

  const handleDeleteCadernoErro = async (id: string) => {
    const updated = await DatabaseService.deleteCadernoErro(id);
    setCadernoErros(updated);
  };

  const handleIncrementarReincidencia = async (id: string) => {
    const updated = await DatabaseService.incrementarReincidenciaErro(id);
    setCadernoErros(prev => prev.map(e => e.id === id ? updated : e));
  };

  const handleMarcarStatusRevisao = async (id: string, status: ErroStatusRevisao) => {
    const updated = await DatabaseService.marcarStatusRevisaoErro(id, status);
    setCadernoErros(prev => prev.map(e => e.id === id ? updated : e));
  };

  const handleIniciarRevisaoAssunto = async (disciplinaId: string, assuntoName: string, notes?: string) => {
    const newRev = await DatabaseService.agendarRevisaoDoAssunto(user.id, disciplinaId, assuntoName, '24h', notes);
    setRevisoes(prev => [newRev, ...prev]);
    const top = assuntos.find(a => a.disciplinaId === disciplinaId && a.name === assuntoName);
    handleOpenStudyTimer(disciplinaId, top?.id);
  };

  const handleCreateSimulado = async (data: any) => {
    const created = await DatabaseService.createSimulado({
      ...data,
      userId: user.id,
    });
    setSimulados(prev => [created, ...prev]);
    return created;
  };

  const handleDeleteSimulado = async (id: string) => {
    const updated = await DatabaseService.deleteSimulado(id);
    setSimulados(updated);
  };

  const handlePauseSimulado = async (
    id: string, 
    answers: Record<number, string>, 
    doubting: Record<number, boolean>, 
    timeRemaining: number, 
    elapsedSeconds: number
  ) => {
    const updated = await DatabaseService.saveSimuladoProgress(id, {
      answers,
      doubting,
      timeRemainingSeconds: timeRemaining,
      elapsedSeconds,
      status: 'pausado',
    });
    setSimulados(prev => prev.map(s => s.id === id ? updated : s));
  };

  const handleFinishSimulado = async (
    id: string, 
    answers: Record<number, string>, 
    doubting: Record<number, boolean>, 
    elapsedSeconds: number
  ) => {
    const finished = await DatabaseService.finishSimulado(id, {
      answers,
      doubting,
      elapsedSeconds,
    });
    setSimulados(prev => prev.map(s => s.id === id ? finished : s));

    const [updatedDiscs, updatedAss, updatedProfile] = await Promise.all([
      DatabaseService.getDisciplinas(),
      DatabaseService.getAssuntos(),
      DatabaseService.getUserProfile(user.id),
    ]);
    setDisciplinas(updatedDiscs);
    setAssuntos(updatedAss);
    refreshProfile(updatedProfile);
    return finished;
  };

  const handleAddSimuladoQuestaoToCadernoErros = async (
    simuladoId: string, 
    questaoId: string, 
    motivo: MotivoErro, 
    observation?: string
  ) => {
    const createdErro = await DatabaseService.addSimuladoQuestaoToCadernoErros(
      simuladoId, 
      questaoId, 
      motivo, 
      observation
    );
    setCadernoErros(prev => [createdErro, ...prev]);
    const updatedSims = await DatabaseService.getSimulados();
    setSimulados(updatedSims);
    return createdErro;
  };

  const handleUpdateProfile = async (updated: Partial<UserProfile>) => {
    const res = await DatabaseService.updateUserProfile(updated);
    refreshProfile(res);
  };

  const handleSwitchStudyMethod = async (newMethod: StudyMethod) => {
    setStudyMethod(newMethod);
    setCurrentTab(tab => tab === 'ciclo' || tab === 'cronograma' || tab === 'plano' ? newMethod : tab);
    await DatabaseService.setStudyMethod(newMethod);
  };

  return (
    <div 
      className="min-h-screen w-full max-w-full overflow-x-clip bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex"
      style={{
       backgroundImage: activeThemeBgUrl
          ? `linear-gradient(rgba(255, 255, 255, 0.60), rgba(255, 255, 255, 0.60)), url("${activeThemeBgUrl}")`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleNavigateTab}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        studyMethod={studyMethod}
        concursos={concursos}
        activeConcursoId={activeConcursoId}
        revisoes={revisoes}
        disciplinas={disciplinas}
        onSetActiveConcurso={handleSetActiveConcurso}
      />

      <div 
        className="flex-1 flex flex-col min-w-0 w-full max-w-full overflow-x-clip lg:pl-64"
        
      >
        <Navbar
          currentTab={currentTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenStudyTimer={() => handleNavigateTab('plano')}
          onNavigateTab={handleNavigateTab}
        />

        <main className="flex-1 p-3 sm:p-6 lg:p-8 pb-24 lg:pb-12 max-w-7xl w-full min-w-0 mx-auto">
          {currentTab === 'dashboard' && (
              <DashboardView
                user={user}
                concursos={concursos}
                disciplinas={disciplinas}
                assuntos={assuntos}
                sessoes={sessoes}
                revisoes={revisoes}
                metas={metas}
                plan={plan}
                cycle={cycle}
                studyMethod={studyMethod}
                provas={provas}
                activeConcursoId={effectiveActiveConcursoId}
                isLoading={isDataLoading}
                errorMessage={dataError}
                onNavigateTab={handleNavigateTab}
                onNavigateToProvas={handleNavigateToProvas}
                onOpenStudyTimer={handleOpenStudyTimer}
                onOpenStudyRegister={handleOpenStudyRegister}
                onCompleteRevisao={handleCompleteRevisao}
                onUpdateRevisao={handleUpdateRevisao}
                onDeleteRevisao={handleDeleteRevisao}
                onRetry={loadData}
              />
            )}

          {currentTab === 'concursos' && (
            <ConcursosView
              concursos={concursos}
              provas={provas}
              user={user}
              activeConcursoId={effectiveActiveConcursoId}
              disciplinas={disciplinas}
              assuntos={assuntos}
              initialTab={concursosSubTab}
              initialTabTrigger={concursosSubTabTrigger}
              onAddConcursoWithDisciplinas={handleAddConcursoWithDisciplinas}
              onImportEditalTree={handleImportEditalTree}
              onUpdateConcurso={handleUpdateConcurso}
              onDeleteConcurso={handleDeleteConcurso}
              onSetActiveConcurso={handleSetActiveConcurso}
              onArchiveConcurso={handleArchiveConcurso}
              onUnarchiveConcurso={handleUnarchiveConcurso}
              onAddProva={handleAddProva}
              onUpdateProva={handleUpdateProva}
              onDeleteProva={handleDeleteProva}
              onAddDisciplina={handleAddDisciplina}
              onAddDisciplinaWithTopics={handleAddDisciplinaWithTopics}
              onUpdateDisciplina={handleUpdateDisciplina}
              onDeleteDisciplina={handleDeleteDisciplina}
              onAddAssunto={handleAddAssunto}
              onUpdateAssunto={handleUpdateAssunto}
              onDeleteAssunto={handleDeleteAssunto}
              onUpdateAssuntoStatus={handleUpdateAssuntoStatus}
              onOpenStudyTimer={handleOpenStudyTimer}
              onNavigateTab={handleNavigateTab}
            />
          )}

          {(currentTab === 'plano' || currentTab === 'sessao' || currentTab === 'ciclo' || currentTab === 'cronograma') && (
            <PlanoView
              plan={plan}
              cycle={cycle}
              concursos={concursos}
              disciplinas={disciplinas}
              assuntos={assuntos}
              sessoes={sessoes}
              activeConcursoId={activeConcursoId}
              studyMethod={currentTab === 'ciclo' ? 'ciclo' : currentTab === 'cronograma' ? 'cronograma' : studyMethod}
              onNavigateTab={setCurrentTab}
              onSwitchMethod={handleSwitchStudyMethod}
              onRecalculatePlan={handleRecalculatePlan}
              onAddSession={handleAddPlanSession}
              onUpdateSession={handleUpdatePlanSession}
              onDeleteSession={handleDeletePlanSession}
              onRescheduleSession={handleReschedulePlanSession}
              onMoveSession={handleMovePlanSession}
              onBatchRescheduleOverdue={handleBatchRescheduleOverdue}
              onToggleSessionStatus={handleTogglePlanSessionStatus}
              onOpenStudyTimer={handleOpenStudyTimer}
              onAdvanceCycle={handleAdvanceCycle}
              onRewindCycle={handleRewindCycle}
              onRecordCycleProgress={handleRecordCycleProgress}
              onResetCycleLap={handleResetCycleLap}
              onUpdateCycleBlock={handleUpdateCycleBlock}
              onRemoveCycle={async () => {
                const cleared = await DatabaseService.removeStudyCycle();
                setCycle(cleared);
              }}
              onSaveCycle={setCycle}
              onRemovePlan={async () => {
                const cleared = await DatabaseService.removeStudyPlan(effectiveActiveConcursoId);
                setPlan(cleared);
              }}
              onSavePlan={setPlan}
            />
          )}

          {currentTab === 'estudos' && (
            <DisciplinasView
              concursos={concursos}
              disciplinas={disciplinas}
              assuntos={assuntos}
              activeConcursoId={activeConcursoId}
              onSetActiveConcurso={handleSetActiveConcurso}
              onNavigateTab={setCurrentTab}
              onAddDisciplina={handleAddDisciplina}
              onAddDisciplinaWithTopics={handleAddDisciplinaWithTopics}
              onUpdateDisciplina={handleUpdateDisciplina}
              onDeleteDisciplina={handleDeleteDisciplina}
              onDuplicateDisciplina={handleDuplicateDisciplina}
              onAddAssunto={handleAddAssunto}
              onUpdateAssunto={handleUpdateAssunto}
              onDeleteAssunto={handleDeleteAssunto}
              onDuplicateAssunto={handleDuplicateAssunto}
              onReorderAssuntos={handleReorderAssuntos}
              onUpdateAssuntoStatus={handleUpdateAssuntoStatus}
              onAddSubtopico={handleAddSubtopico}
              onUpdateSubtopico={handleUpdateSubtopico}
              onDeleteSubtopico={handleDeleteSubtopico}
              onImportEditalTree={handleImportEditalTree}
              onOpenStudyTimer={handleOpenStudyTimer}
            />
          )}

          {currentTab === 'revisoes' && (
            <RevisoesView
              revisoes={activeConcursoId ? revisoes.filter(r => {
                const disc = disciplinas.find(d => d.id === r.disciplinaId);
                return disc && disc.concursoId === activeConcursoId;
              }) : revisoes}
              disciplinas={activeConcursoId ? disciplinas.filter(d => d.concursoId === activeConcursoId) : disciplinas}
              assuntos={assuntos}
              settings={revisionSettings || undefined}
              onNavigateTab={setCurrentTab}
              onCompleteRevisao={handleCompleteRevisao}
              onAddRevisao={handleAddRevisao}
              onUpdateRevisao={handleUpdateRevisao}
              onDeleteRevisao={handleDeleteRevisao}
              onBatchRescheduleOverdue={handleBatchRescheduleOverdueRevisoes}
              onUpdateSettings={handleUpdateRevisionSettings}
              onOpenStudyTimer={handleOpenStudyTimer}
            />
          )}

          {currentTab === 'resumos' && (
            <ResumosView
              userId={user.id}
              concursos={concursos}
              disciplinas={disciplinas}
              assuntos={assuntos}
              activeConcursoId={effectiveActiveConcursoId}
              onNavigateTab={setCurrentTab}
              onSaveSession={handleSaveStudySession}
              onUpdateAssuntoStatus={handleUpdateAssuntoStatus}
            />
          )}

          {currentTab === 'historico' && (
            <HistoricoView
              sessoes={sessoes}
              disciplinas={disciplinas}
              assuntos={assuntos}
              concursos={concursos}
              activeConcursoId={activeConcursoId}
              revisoes={revisoes}
              simulados={simulados}
              blocosQuestoes={blocosQuestoes}
              onSaveSession={handleSaveStudySession}
              onUpdateSession={handleUpdateStudySession}
              onDeleteSession={handleDeleteStudySession}
              onUpdateAssunto={handleUpdateAssunto}
              onUpdateAssuntoStatus={handleUpdateAssuntoStatus}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'flashcards' && (
            <FlashcardsView
              disciplinas={disciplinas}
              assuntos={assuntos}
              concursos={concursos}
              activeConcursoId={effectiveActiveConcursoId}
              onSelectConcurso={handleSetActiveConcurso}
              onNavigateTab={setCurrentTab}
              onSaveStudySession={handleSaveStudySession}
            />
          )}

          {currentTab === 'questoes' && (() => {
            const activeDiscs = effectiveActiveConcursoId
              ? disciplinas.filter(d => d.concursoId === effectiveActiveConcursoId)
              : disciplinas;
            const activeDiscIdSet = new Set(activeDiscs.map(d => d.id));
            const filteredErros = effectiveActiveConcursoId
              ? cadernoErros.filter(e => {
                  if (e.concursoId) return e.concursoId === effectiveActiveConcursoId;
                  return Boolean(e.disciplinaId && activeDiscIdSet.has(e.disciplinaId));
                })
              : cadernoErros;
            return (
              <QuestoesView
                questoes={questoes}
                disciplinas={activeDiscs}
                assuntos={assuntos}
                activeConcursoId={effectiveActiveConcursoId}
                blocosQuestoes={blocosQuestoes}
                cadernoErros={filteredErros}
                onNavigateTab={setCurrentTab}
                onRecordBlocoQuestoes={handleRecordBlocoQuestoes}
                onDeleteBlocoQuestoes={handleDeleteBlocoQuestoes}
                onUpdateBlocoQuestoes={handleUpdateBlocoQuestoes}
                onAddCadernoErro={handleAddCadernoErro}
                onUpdateCadernoErro={handleUpdateCadernoErro}
                onDeleteCadernoErro={handleDeleteCadernoErro}
                onIncrementarReincidencia={handleIncrementarReincidencia}
                onMarcarStatusRevisao={handleMarcarStatusRevisao}
                onIniciarRevisaoAssunto={handleIniciarRevisaoAssunto}
                onOpenStudyTimer={handleOpenStudyTimer}
              />
            );
          })()}

          {currentTab === 'caderno_erros' && (() => {
            const activeDiscs = effectiveActiveConcursoId
              ? disciplinas.filter(d => d.concursoId === effectiveActiveConcursoId)
              : disciplinas;
            const activeDiscIdSet = new Set(activeDiscs.map(d => d.id));
            const filteredErros = effectiveActiveConcursoId
              ? cadernoErros.filter(e => {
                  if (e.concursoId) return e.concursoId === effectiveActiveConcursoId;
                  return Boolean(e.disciplinaId && activeDiscIdSet.has(e.disciplinaId));
                })
              : cadernoErros;
            return (
              <div className="max-w-7xl mx-auto pb-12">
                <CadernoErrosView
                  cadernoErros={filteredErros}
                  disciplinas={activeDiscs}
                  assuntos={assuntos}
                  activeConcursoId={effectiveActiveConcursoId}
                  questoes={questoes}
                  blocosQuestoes={blocosQuestoes}
                  onNavigateTab={setCurrentTab}
                  onAddCadernoErro={handleAddCadernoErro}
                  onUpdateCadernoErro={handleUpdateCadernoErro}
                  onDeleteCadernoErro={handleDeleteCadernoErro}
                  onIncrementarReincidencia={handleIncrementarReincidencia}
                  onMarcarStatusRevisao={handleMarcarStatusRevisao}
                  onIniciarRevisaoAssunto={handleIniciarRevisaoAssunto}
                  onOpenStudyTimer={handleOpenStudyTimer}
                />
              </div>
            );
          })()}

          {/* Para reativar a rota "Metas & Desempenho", altere ENABLE_METAS_MODULE para true no topo do arquivo */}
          {ENABLE_METAS_MODULE && currentTab === 'metas' && (
            <MetasView
              metas={metas}
              conquistas={conquistas}
              marcos={marcos}
              stats={stats || {
                horasHoje: 0,
                horasSemana: 0,
                horasMes: 0,
                horasTotal: 0,
                questoesHoje: 0,
                questoesSemana: 0,
                questoesMes: 0,
                questoesTotal: 0,
                acertosTotal: 0,
                taxaAcertoGeral: 0,
                revisoesHoje: 0,
                revisoesSemana: 0,
                revisoesMes: 0,
                revisoesTotal: 0,
                streakDias: user?.streakDays || 0,
                melhorStreakDias: 0,
                diasAtivosUltimaSemana: [
                  { data: '', diaSemana: 'Seg', estudou: false, minutos: 0 },
                  { data: '', diaSemana: 'Ter', estudou: false, minutos: 0 },
                  { data: '', diaSemana: 'Qua', estudou: false, minutos: 0 },
                  { data: '', diaSemana: 'Qui', estudou: false, minutos: 0 },
                  { data: '', diaSemana: 'Sex', estudou: false, minutos: 0 },
                  { data: '', diaSemana: 'Sáb', estudou: false, minutos: 0 },
                  { data: '', diaSemana: 'Dom', estudou: false, minutos: 0 },
                ],
                topicosConcluidos: 0,
                topicosTotal: 0,
                percentualEdital: 0,
                xpTotal: user?.xp || 0,
                nivelAtual: user?.level || 1,
                tituloNivel: 'Iniciante Focado',
                xpProximoNivel: 1000,
                xpNivelAtual: (user?.xp || 0) % 1000,
                percentualNivel: Math.round(((user?.xp || 0) % 1000) / 10),
              }}
              onAddMeta={handleAddMeta}
              onUpdateMeta={handleUpdateMeta}
              onDeleteMeta={handleDeleteMeta}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView
              disciplinas={disciplinas}
              assuntos={assuntos}
              sessoes={sessoes}
              blocosQuestoes={blocosQuestoes}
              revisoes={revisoes}
              simulados={simulados}
              concursos={concursos}
              activeConcursoId={activeConcursoId}
              user={user}
              stats={stats || {
                horasHoje: 0,
                horasSemana: 0,
                horasMes: 0,
                horasTotal: 0,
                questoesHoje: 0,
                questoesSemana: 0,
                questoesMes: 0,
                questoesTotal: 0,
                acertosTotal: 0,
                taxaAcertoGeral: 0,
                revisoesHoje: 0,
                revisoesSemana: 0,
                revisoesMes: 0,
                revisoesTotal: 0,
                streakDias: user?.streakDays || 0,
                melhorStreakDias: 0,
                diasAtivosUltimaSemana: [
                  { data: '', diaSemana: 'Dom', estudou: false, minutos: 0 },
                  { data: '', diaSemana: 'Seg', estudou: false, minutos: 0 },
                  { data: '', diaSemana: 'Ter', estudou: false, minutos: 0 },
                  { data: '', diaSemana: 'Qua', estudou: false, minutos: 0 },
                  { data: '', diaSemana: 'Qui', estudou: false, minutos: 0 },
                  { data: '', diaSemana: 'Sex', estudou: false, minutos: 0 },
                  { data: '', diaSemana: 'Sáb', estudou: false, minutos: 0 },
                ],
                topicosConcluidos: 0,
                topicosTotal: 0,
                percentualEdital: 0,
                xpTotal: user?.xp || 0,
                nivelAtual: user?.level || 1,
                tituloNivel: 'Iniciante Focado',
                xpProximoNivel: 1000,
                xpNivelAtual: (user?.xp || 0) % 1000,
                percentualNivel: Math.round(((user?.xp || 0) % 1000) / 10),
              }}
            />
          )}

          {/* Para reativar a rota "Assistente IA", altere ENABLE_AI_ASSISTANT_MODULE para true no topo do arquivo */}
          {ENABLE_AI_ASSISTANT_MODULE && currentTab === 'ai_assistant' && (
            <AIAssistantView />
          )}

          {currentTab === 'simulados' && (
            <SimuladosView
              simulados={simulados}
              concursos={concursos}
              disciplinas={disciplinas}
              assuntos={assuntos}
              onNavigateTab={setCurrentTab}
              onCreateSimulado={handleCreateSimulado}
              onDeleteSimulado={handleDeleteSimulado}
              onPauseSimulado={handlePauseSimulado}
              onFinishSimulado={handleFinishSimulado}
              onAddToCadernoErros={handleAddSimuladoQuestaoToCadernoErros}
            />
          )}

          {currentTab === 'perfil' && (
            <PerfilView
              user={user}
              concursos={concursos}
              activeConcursoId={activeConcursoId}
              onUpdateProfile={handleUpdateProfile}
              onDataSanitized={loadData}
            />
          )}

          {currentTab === 'admin' && (
            <AdminView
              user={user}
              concursos={concursos}
              disciplinas={disciplinas}
              assuntos={assuntos}
              studyCycles={[]}
            />
          )}

          {currentTab === 'planos_assinatura' && (
            <PlanosAssinaturaView
              user={user}
              onUpdateSubscription={handleUpdateSubscription}
            />
          )}
        </main>

        <MobileNav
          currentTab={currentTab}
          onSelectTab={handleNavigateTab}
          studyMethod={studyMethod}
        />
      </div>

      <StudySessionModal
        isOpen={isStudyTimerOpen}
        onClose={closeStudyTimer}
        disciplinas={activeConcursoId ? disciplinas.filter(d => !d.concursoId || d.concursoId === activeConcursoId) : disciplinas}
        assuntos={assuntos}
        initialDisciplinaId={timerInitialDisciplinaId}
        initialAssuntoId={timerInitialAssuntoId}
        initialDurationMinutes={timerInitialDurationMinutes}
        initialMode={timerInitialMode}
        contabilizarPlanejamento={timerContabilizarPlanejamento}
        onSaveSession={handleSaveTimerSession}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StudyTimerProvider>
          <MainApp />
        </StudyTimerProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
