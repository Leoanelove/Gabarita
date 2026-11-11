import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  BarChart3, 
  Clock, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Download, 
  FileSpreadsheet, 
  Award, 
  Flame, 
  Repeat,
  BookOpen,
  Video,
  CalendarCheck,
  Calendar,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  Target,
  Check,
  RotateCcw,
  X
} from 'lucide-react';
import { 
  Disciplina, 
  Assunto, 
  SessaoEstudo, 
  RegistroBlocoQuestoes, 
  Revisao, 
  Simulado, 
  EstatisticasProgressoReal,
  Concurso,
  UserProfile
} from '../../types';
import { Card, CardHeader, CardBody } from '../../design-system/Card';
import { Button } from '../../design-system/Button';
import { Badge } from '../../design-system/Badge';
import { MenuBannerFrame } from '../common/MenuBannerFrame';
import { useTheme } from '../../contexts/ThemeContext';

export const ESTATISTICAS_BANNER_THEMES: Record<string, string> = {
  verde: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Estatisticas/Banner-Estatistica-verde.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBFc3RhdGlzdGljYXMvQmFubmVyLUVzdGF0aXN0aWNhLXZlcmRlLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3OTI5NzEzNDcsImV4cCI6NDk0NjU3MTM0N30.rFoGrGMktMmw4s-k7CZnZdTSutCEfzpePxkkhoWOu65yIweXzmoWEbXRT-TlTk61XDmnnLV1L7gtp5riUnDwNw",
  azul: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Estatisticas/Banner-Estatistica-azul.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBFc3RhdGlzdGljYXMvQmFubmVyLUVzdGF0aXN0aWNhLWF6dWwucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5Mjk3MTM2NCwiZXhwIjo0OTQ2NTcxMzY0fQ.aV5m8u6wJO4hyhKY2qRKxfd75G_VJpIqZg5s9452J9hnWw1HQMtF9LO-0vZrsyyvbvNw2GXkFDumjWfNvpHlrg",
  rosa: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Estatisticas/Banner-Estatistica-rosa.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBFc3RhdGlzdGljYXMvQmFubmVyLUVzdGF0aXN0aWNhLXJvc2EucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5Mjk3MTM3NywiZXhwIjo0OTQ2NTcxMzc3fQ.S1XB9peeeMvhA13xwturIoBYcSUyp-ThM-fnBNXaHuQtmK6cxika5U7QRiFIWkOqn4K2rgZPe-4sBR_1hoS0LA",
  roxo: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Estatisticas/Banner-Estatistica-roxo.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBFc3RhdGlzdGljYXMvQmFubmVyLUVzdGF0aXN0aWNhLXJveG8ucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5Mjk3MTM5MCwiZXhwIjo0OTQ2NTcxMzkwfQ.QZY3f5K9dXlTZBV-L5FeuynMDmwxTaF6IIfeNef9NGWco4jrw17NpDK8mRu_SxdworXS5ISC-MFlFGf31g0eoA",
  laranja: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Estatisticas/Banner-Estatistica-laranja.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBFc3RhdGlzdGljYXMvQmFubmVyLUVzdGF0aXN0aWNhLWxhcmFuamEucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5Mjk3MTQwNiwiZXhwIjo0OTQ2NTcxNDA2fQ.BVRQ-GLvvNjpLeY-Gq4r0oPqpFxRFZypZCBKdxVg1nquRmX9JS2k_Ar45jQEcM8ZUqosMPP-CCfKjoRz7fJyAg"
};

type PeriodOption = '7d' | '30d' | '90d' | 'inicio';

interface AnalyticsViewProps {
  disciplinas: Disciplina[];
  assuntos: Assunto[];
  sessoes: SessaoEstudo[];
  blocosQuestoes: RegistroBlocoQuestoes[];
  revisoes: Revisao[];
  simulados: Simulado[];
  stats: EstatisticasProgressoReal;
  concursos?: Concurso[];
  activeConcursoId?: string;
  user?: UserProfile | null;
}

// Paleta base para categorias padrão e customizadas
const STANDARD_CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  teoria: { label: 'Teoria', color: '#3B82F6' },
  questoes: { label: 'Questões', color: '#10B981' },
  revisao: { label: 'Revisão', color: '#F59E0B' },
  lei_seca: { label: 'Lei Seca', color: '#8B5CF6' },
  resumo: { label: 'Resumo', color: '#EC4899' },
  simulado: { label: 'Simulado', color: '#06B6D4' },
  jurisprudencia: { label: 'Jurisprudência', color: '#6366F1' },
  pomodoro: { label: 'Pomodoro', color: '#14B8A6' },
};

const DYNAMIC_PALETTE_POOL = [
  '#0EA5E9', '#F97316', '#A855F7', '#14B8A6', '#84CC16',
  '#E11D48', '#06B6D4', '#EAB308', '#64748B', '#3B82F6',
  '#D946EF', '#22C55E', '#F43F5E', '#8B5CF6', '#10B981'
];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  disciplinas,
  assuntos,
  sessoes,
  blocosQuestoes,
  revisoes,
  simulados,
  stats,
  concursos = [],
  activeConcursoId = '',
  user = null,
}) => {
  const { colorSkin, palette } = useTheme();
  const currentTheme = (
    colorSkin === 'purple' ? 'roxo' :
    colorSkin === 'orange' || colorSkin === 'dbz' ? 'laranja' :
    colorSkin || palette?.id || 'laranja'
  ).toLowerCase();

  const themeKey = (currentTheme || 'laranja').toLowerCase();

  const themeGlowStyles = useMemo(() => {
    switch (themeKey) {
      case 'roxo':
        return {
          color: '#8B5CF6',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(167, 139, 250, 0.95), 0 0 18px rgba(139, 92, 246, 0.85), 0 0 32px rgba(124, 58, 237, 0.65)',
        };
      case 'laranja':
        return {
          color: '#FF6B00',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(251, 146, 60, 0.95), 0 0 18px rgba(249, 115, 22, 0.85), 0 0 32px rgba(234, 88, 12, 0.65)',
        };
      case 'azul':
        return {
          color: '#3b82f6',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(96, 165, 250, 0.95), 0 0 18px rgba(37, 99, 235, 0.8), 0 0 32px rgba(29, 78, 216, 0.6)',
        };
      case 'rosa':
        return {
          color: '#ec4899',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(244, 114, 182, 0.95), 0 0 18px rgba(219, 39, 119, 0.8), 0 0 32px rgba(190, 24, 93, 0.6)',
        };
      case 'verde':
      default:
        return {
          color: '#10b981',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(52, 211, 153, 0.95), 0 0 18px rgba(16, 185, 129, 0.8), 0 0 32px rgba(5, 150, 105, 0.6)',
        };
    }
  }, [themeKey]);

  // Controles de Período e Filtros Avançados
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('30d');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [selectedDisciplinaId, setSelectedDisciplinaId] = useState<string>('all');
  const [selectedConcursoId, setSelectedConcursoId] = useState<string>(activeConcursoId || 'all');
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Slider de Insights do Ritmo
  const [insightSlide, setInsightSlide] = useState<1 | 2>(1);

  // Categorias Customizadas salvas no localStorage (cadastradas ao adicionar novo estudo)
  const [customTypes] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('@gabarita:custom-study-types');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Abas de visualização
  const [activeTab, setActiveTab] = useState<'geral' | 'disciplinas' | 'assuntos' | 'evolucao'>('geral');

  // Fecha dropdown de filtros ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setFilterMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Marco Inicial de Estudo do Concurso / Usuário
  const dataInicioEstudo = useMemo(() => {
    const sessionTimes = sessoes
      .map(s => new Date(s.completedAt || s.createdAt).getTime())
      .filter(t => !isNaN(t) && t > 0);
    const minSession = sessionTimes.length > 0 ? Math.min(...sessionTimes) : null;

    const currentConcurso = concursos.find(c => c.id === (selectedConcursoId !== 'all' ? selectedConcursoId : activeConcursoId));
    const contestTime = currentConcurso?.createdAt ? new Date(currentConcurso.createdAt).getTime() : null;
    const userTime = user?.createdAt ? new Date(user.createdAt).getTime() : null;

    const validTimes = [minSession, contestTime, userTime].filter((t): t is number => typeof t === 'number' && !isNaN(t) && t > 0);
    if (validTimes.length === 0) {
      const fallback = new Date();
      fallback.setDate(fallback.getDate() - 30);
      return fallback;
    }
    return new Date(Math.min(...validTimes));
  }, [sessoes, concursos, selectedConcursoId, activeConcursoId, user]);

  // Faixa de Datas Calculada com Base no Período Selecionado
  const periodDateRange = useMemo(() => {
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    let startDate: Date;

    if (selectedPeriod === '7d') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    } else if (selectedPeriod === '30d') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
    } else if (selectedPeriod === '90d') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89, 0, 0, 0, 0);
    } else {
      // 'inicio'
      const startCandidate = new Date(dataInicioEstudo);
      startCandidate.setHours(0, 0, 0, 0);
      startDate = startCandidate;
    }

    const formatBR = (d: Date) => {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    return {
      startDate,
      endDate,
      labelFormatted: `${formatBR(startDate)} a ${formatBR(endDate)}`,
    };
  }, [selectedPeriod, dataInicioEstudo]);

  // Filtros aplicados às disciplinas por Concurso
  const availableDisciplinas = useMemo(() => {
    if (selectedConcursoId === 'all') return disciplinas;
    return disciplinas.filter(d => d.concursoId === selectedConcursoId);
  }, [disciplinas, selectedConcursoId]);

  // Filtragem dos Registros Reais no Período e Filtros Avançados
  const filteredData = useMemo(() => {
    const startMs = periodDateRange.startDate.getTime();
    const endMs = periodDateRange.endDate.getTime();

    const validConcursoIds = new Set(concursos.map(c => c.id).filter(Boolean));
    // Map de disciplinas válidas para conferir concursoId rapidamente
    const discMap = new Map<string, Disciplina>();
    disciplinas.forEach(d => {
      if (d.concursoId && validConcursoIds.has(d.concursoId)) {
        discMap.set(d.id, d);
      }
    });

    // Filtrar sessões de estudo (rejeitando qualquer sessão órfã sem disciplina válida)
    const filteredSessoes = sessoes.filter(s => {
      const disc = discMap.get(s.disciplinaId);
      if (!disc) return false;

      const d = new Date(s.completedAt || s.createdAt);
      const timeMs = d.getTime();
      if (isNaN(timeMs) || timeMs < startMs || timeMs > endMs) return false;

      // Filtro de disciplina
      if (selectedDisciplinaId !== 'all' && s.disciplinaId !== selectedDisciplinaId) {
        return false;
      }
      // Filtro de concurso
      if (selectedConcursoId !== 'all') {
        if (disc.concursoId !== selectedConcursoId) return false;
        if (s.concursoId && s.concursoId !== selectedConcursoId) return false;
      }
      return true;
    });

    // Filtrar blocos de questões
    const filteredBlocos = blocosQuestoes.filter(b => {
      const disc = discMap.get(b.disciplinaId);
      if (!disc) return false;

      const d = new Date(b.date || b.createdAt);
      const timeMs = d.getTime();
      if (isNaN(timeMs) || timeMs < startMs || timeMs > endMs) return false;

      if (selectedDisciplinaId !== 'all' && b.disciplinaId !== selectedDisciplinaId) {
        return false;
      }
      if (selectedConcursoId !== 'all' && disc.concursoId !== selectedConcursoId) {
        return false;
      }
      return true;
    });

    // Filtrar simulados finalizados
    const filteredSimulados = simulados.filter(s => {
      if (s.status !== 'finalizado') return false;
      if (validConcursoIds.size === 0) return false;
      if (s.concursoId && !validConcursoIds.has(s.concursoId)) return false;

      const d = new Date(s.finishedAt || s.createdAt);
      const timeMs = d.getTime();
      if (isNaN(timeMs) || timeMs < startMs || timeMs > endMs) return false;

      if (selectedConcursoId !== 'all' && s.concursoId !== selectedConcursoId) {
        return false;
      }
      return true;
    });

    // Filtrar revisões concluídas
    const filteredRevisoes = revisoes.filter(r => {
      if (r.status !== 'concluida') return false;
      const disc = discMap.get(r.disciplinaId);
      if (!disc) return false;

      const d = new Date(r.completedAt || r.updatedAt || r.scheduledFor || r.createdAt);
      const timeMs = d.getTime();
      if (isNaN(timeMs) || timeMs < startMs || timeMs > endMs) return false;

      if (selectedDisciplinaId !== 'all' && r.disciplinaId !== selectedDisciplinaId) {
        return false;
      }
      if (selectedConcursoId !== 'all' && disc.concursoId !== selectedConcursoId) {
        return false;
      }
      return true;
    });

    // 1. Minutos Totais e Horas Líquidas
    let totalMinutes = 0;
    filteredSessoes.forEach(s => totalMinutes += (s.durationMinutes || 0));
    filteredSimulados.forEach(s => {
      totalMinutes += Math.round((s.elapsedSeconds || (s.durationMinutes * 60)) / 60);
    });
    const horasTotais = Math.round((totalMinutes / 60) * 10) / 10;

    // 2. Questões & Acertos
    let questoes = 0;
    let acertos = 0;
    filteredBlocos.forEach(b => {
      questoes += b.totalQuestions || 0;
      acertos += b.correctAnswers || 0;
    });
    filteredSimulados.forEach(s => {
      questoes += s.questionsCount || (s.questoes?.length || 0);
      acertos += s.totalCorrect || 0;
    });
    // Também incluir questões respondidas dentro das próprias sessões
    filteredSessoes.forEach(s => {
      if ((s.questionsAttempted || 0) > 0) {
        questoes += s.questionsAttempted || 0;
        acertos += s.questionsCorrect || 0;
      }
    });

    const erros = Math.max(0, questoes - acertos);
    const taxaAcerto = questoes > 0 ? Math.round((acertos / questoes) * 100) : 0;

    // 3. Páginas Lidas
    let totalPaginasLidas = 0;
    let minutosLeitura = 0;
    filteredSessoes.forEach(s => {
      if (Array.isArray(s.pageIntervals) && s.pageIntervals.length > 0) {
        s.pageIntervals.forEach(p => {
          const ini = Number(p.inicio);
          const fim = Number(p.fim);
          if (!isNaN(ini) && !isNaN(fim) && fim >= ini) {
            totalPaginasLidas += (fim - ini + 1);
          }
        });
      } else if (s.notes) {
        const match = s.notes.match(/\((\d+)\s*pág\.?\)/i);
        if (match && match[1]) {
          totalPaginasLidas += parseInt(match[1], 10);
        }
      }

      const typeStr = (s.type || '').toLowerCase();
      if (
        typeStr.includes('teoria') || 
        typeStr.includes('lei_seca') || 
        typeStr.includes('resumo') || 
        typeStr.includes('leitura')
      ) {
        minutosLeitura += (s.durationMinutes || 0);
      }
    });

    const horasLeitura = minutosLeitura / 60;
    const ritmoPaginasPorHora = horasLeitura > 0 
      ? Math.round((totalPaginasLidas / horasLeitura) * 10) / 10 
      : (horasTotais > 0 ? Math.round((totalPaginasLidas / horasTotais) * 10) / 10 : 0);

    // 4. Videoaulas
    let totalVideoMinutes = 0;
    let totalVideosAssistidos = 0;
    filteredSessoes.forEach(s => {
      const typeStr = (s.type || '').toLowerCase();
      const isVideoType = typeStr.includes('video') || typeStr.includes('aula');

      if (Array.isArray(s.videoaulas) && s.videoaulas.length > 0) {
        s.videoaulas.forEach(v => {
          if (v.titulo && v.titulo.trim().length > 0) {
            totalVideosAssistidos += 1;
            const parseSecs = (str: string) => {
              const parts = str.split(':').map(Number);
              if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
              if (parts.length === 2) return parts[0] * 60 + parts[1];
              return 0;
            };
            const sSec = parseSecs(v.inicio || '00:00:00');
            const eSec = parseSecs(v.fim || '00:00:00');
            if (eSec > sSec) {
              totalVideoMinutes += Math.round((eSec - sSec) / 60);
            } else {
              totalVideoMinutes += Math.round((s.durationMinutes || 0) / s.videoaulas!.length);
            }
          }
        });
      } else if (isVideoType) {
        totalVideosAssistidos += 1;
        totalVideoMinutes += (s.durationMinutes || 0);
      }
    });

    // 5. Constância nos Estudos (Calculado estritamente de dataInicioEstudo até hoje)
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const startLimit = new Date(Math.max(periodDateRange.startDate.getTime(), dataInicioEstudo.getTime()));
    startLimit.setHours(0, 0, 0, 0);

    const endLimit = new Date(Math.min(periodDateRange.endDate.getTime(), today.getTime()));
    endLimit.setHours(23, 59, 59, 999);

    const studyDaysSet = new Set<string>();
    filteredSessoes.forEach(s => {
      if ((s.durationMinutes || 0) > 0) {
        const d = new Date(s.completedAt || s.createdAt);
        if (!isNaN(d.getTime())) {
          studyDaysSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
        }
      }
    });

    let diasEstudados = 0;
    let diasSemEstudo = 0;

    if (startLimit.getTime() <= endLimit.getTime()) {
      const cur = new Date(startLimit);
      while (cur.getTime() <= endLimit.getTime()) {
        const dateKey = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
        if (studyDaysSet.has(dateKey)) {
          diasEstudados++;
        } else {
          diasSemEstudo++;
        }
        cur.setDate(cur.getDate() + 1);
      }
    }

    const totalDiasValidos = diasEstudados + diasSemEstudo;
    const constanciaPercentual = totalDiasValidos > 0 ? Math.round((diasEstudados / totalDiasValidos) * 100) : 0;

    return {
      filteredSessoes,
      filteredBlocos,
      filteredSimulados,
      filteredRevisoes,
      totalMinutes,
      horasTotais,
      questoes,
      acertos,
      erros,
      taxaAcerto,
      totalPaginasLidas,
      ritmoPaginasPorHora,
      totalVideoMinutes,
      totalVideosAssistidos,
      diasEstudados,
      diasSemEstudo,
      constanciaPercentual,
      sessoesCount: filteredSessoes.length,
      mediaHorasPorSessao: filteredSessoes.length > 0 ? Math.round((horasTotais / filteredSessoes.length) * 10) / 10 : 0,
    };
  }, [
    periodDateRange,
    sessoes,
    blocosQuestoes,
    simulados,
    revisoes,
    disciplinas,
    selectedDisciplinaId,
    selectedConcursoId,
    dataInicioEstudo
  ]);

  // Formatação segura de minutos em "Xh Ymin" ou "Xmin"
  const formatDurationFriendly = (totalMins: number): string => {
    if (!totalMins || totalMins <= 0) return '0min';
    const h = Math.floor(totalMins / 60);
    const m = Math.round(totalMins % 60);
    if (h > 0 && m > 0) return `${h}h ${m}min`;
    if (h > 0) return `${h}h`;
    return `${m}min`;
  };

  // 6. Tempo por Categoria (Gráfico de Rosca Dinâmico + Lista Lateral)
  const categoryData = useMemo(() => {
    // Unir categorias padrão conhecidas + categorias customizadas salvas + tipos presentes nas sessões
    const categoryMap = new Map<string, { label: string; minutes: number; color: string }>();

    // Inicializar categorias padrão
    Object.entries(STANDARD_CATEGORY_CONFIG).forEach(([key, conf]) => {
      categoryMap.set(key, { label: conf.label, minutes: 0, color: conf.color });
    });

    // Inicializar categorias customizadas
    customTypes.forEach((cName, idx) => {
      const key = cName.toLowerCase().trim();
      if (!categoryMap.has(key)) {
        const poolColor = DYNAMIC_PALETTE_POOL[idx % DYNAMIC_PALETTE_POOL.length];
        categoryMap.set(key, { label: cName, minutes: 0, color: poolColor });
      }
    });

    // Somar minutos reais das sessões filtradas
    filteredData.filteredSessoes.forEach(s => {
      const rawType = (s.type || 'teoria').toLowerCase().trim();
      const existing = categoryMap.get(rawType);
      if (existing) {
        existing.minutes += (s.durationMinutes || 0);
      } else {
        // Categoria nova encontrada dinamicamente
        const labelFormatted = rawType.charAt(0).toUpperCase() + rawType.slice(1).replace(/_/g, ' ');
        const poolColor = DYNAMIC_PALETTE_POOL[categoryMap.size % DYNAMIC_PALETTE_POOL.length];
        categoryMap.set(rawType, {
          label: labelFormatted,
          minutes: (s.durationMinutes || 0),
          color: poolColor,
        });
      }
    });

    // Simulados também somam na categoria simulado
    filteredData.filteredSimulados.forEach(s => {
      const m = Math.round((s.elapsedSeconds || (s.durationMinutes * 60)) / 60);
      const cur = categoryMap.get('simulado');
      if (cur) cur.minutes += m;
    });

    const totalCategoryMinutes = Array.from(categoryMap.values()).reduce((sum, item) => sum + item.minutes, 0);

    // Converter para array ordenado por minutos decrescentes
    const list = Array.from(categoryMap.entries()).map(([id, data]) => {
      const pct = totalCategoryMinutes > 0 ? (data.minutes / totalCategoryMinutes) * 100 : 0;
      return {
        id,
        label: data.label,
        minutes: data.minutes,
        percentage: Math.round(pct * 10) / 10,
        color: data.color,
      };
    });

    // Ordenar: maiores tempos primeiro, seguidos por tipos criados recentemente
    list.sort((a, b) => b.minutes - a.minutes);

    return {
      list,
      totalCategoryMinutes,
    };
  }, [customTypes, filteredData.filteredSessoes, filteredData.filteredSimulados]);


  // Desempenho por Disciplina (respeitando filtros)
  const desempenhoDisciplinas = useMemo(() => {
    return availableDisciplinas.map(disc => {
      const discBlocos = filteredData.filteredBlocos.filter(b => b.disciplinaId === disc.id);
      let discQ = 0;
      let discA = 0;
      discBlocos.forEach(b => {
        discQ += b.totalQuestions || 0;
        discA += b.correctAnswers || 0;
      });
      // Também contar questões de sessões
      filteredData.filteredSessoes
        .filter(s => s.disciplinaId === disc.id)
        .forEach(s => {
          discQ += s.questionsAttempted || 0;
          discA += s.questionsCorrect || 0;
        });

      const taxa = discQ > 0 ? Math.round((discA / discQ) * 100) : 0;
      return {
        id: disc.id,
        name: disc.name,
        color: disc.color || '#6366f1',
        questoes: discQ,
        acertos: discA,
        erros: Math.max(0, discQ - discA),
        taxaAcerto: taxa,
      };
    });
  }, [availableDisciplinas, filteredData.filteredBlocos, filteredData.filteredSessoes]);

  // Evolução Semanal (Iniciando no Domingo "Dom" até Sábado "Sáb")
  const weeklyEvolutionData = useMemo(() => {
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const now = new Date();
    // Encontrar domingo desta semana
    const currentDayOfWeek = now.getDay(); // 0 = Dom, 1 = Seg, ... 6 = Sáb
    const sundayDate = new Date(now);
    sundayDate.setDate(now.getDate() - currentDayOfWeek);
    sundayDate.setHours(0, 0, 0, 0);

    const validConcursoIds = new Set(concursos.map(c => c.id).filter(Boolean));
    const discMap = new Map<string, Disciplina>();
    disciplinas.forEach(d => {
      if (d.concursoId && validConcursoIds.has(d.concursoId)) {
        discMap.set(d.id, d);
      }
    });

    const days: { data: string; diaSemana: string; minutos: number; estudou: boolean }[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(sundayDate);
      d.setDate(sundayDate.getDate() + i);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      // Somar minutos estudados no dia (respeitando concurso e disciplina válidos/selecionados)
      let mins = 0;
      sessoes.forEach(s => {
        const disc = discMap.get(s.disciplinaId);
        if (!disc) return;
        if (selectedDisciplinaId !== 'all' && s.disciplinaId !== selectedDisciplinaId) return;
        if (selectedConcursoId !== 'all') {
          if (disc.concursoId !== selectedConcursoId) return;
          if (s.concursoId && s.concursoId !== selectedConcursoId) return;
        }

        const sDate = new Date(s.completedAt || s.createdAt);
        if (!isNaN(sDate.getTime())) {
          const sKey = `${sDate.getFullYear()}-${String(sDate.getMonth() + 1).padStart(2, '0')}-${String(sDate.getDate()).padStart(2, '0')}`;
          if (sKey === dateKey) {
            mins += (s.durationMinutes || 0);
          }
        }
      });

      if (selectedDisciplinaId === 'all') {
        simulados.forEach(s => {
          if (s.status !== 'finalizado') return;
          if (validConcursoIds.size === 0) return;
          if (s.concursoId && !validConcursoIds.has(s.concursoId)) return;
          if (selectedConcursoId !== 'all' && s.concursoId !== selectedConcursoId) return;

          const sDate = new Date(s.finishedAt || s.createdAt);
          if (!isNaN(sDate.getTime())) {
            const sKey = `${sDate.getFullYear()}-${String(sDate.getMonth() + 1).padStart(2, '0')}-${String(sDate.getDate()).padStart(2, '0')}`;
            if (sKey === dateKey) {
              mins += Math.round((s.elapsedSeconds || (s.durationMinutes * 60)) / 60);
            }
          }
        });
      }

      days.push({
        data: dateKey,
        diaSemana: dayNames[i],
        minutos: mins,
        estudou: mins > 0,
      });
    }

    return days;
  }, [sessoes, simulados, concursos, disciplinas, selectedDisciplinaId, selectedConcursoId]);

  // Exportação CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Disciplina;Questoes;Acertos;Erros;TaxaAcerto\n";
    desempenhoDisciplinas.forEach(d => {
      csvContent += `"${d.name}";${d.questoes};${d.acertos};${d.erros};${d.taxaAcerto}%\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `gabarita_analise_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Contagem de filtros ativos
  const activeFiltersCount = (selectedDisciplinaId !== 'all' ? 1 : 0) + (selectedConcursoId !== 'all' ? 1 : 0);

  // Projeção do edital baseada na cobertura
  const coberturaEdital = stats?.percentualEdital || 0;
  const topicosConcluidos = stats?.topicosConcluidos || 0;
  const topicosTotal = stats?.topicosTotal || Math.max(1, assuntos.length);
  const topicosRestantes = Math.max(0, topicosTotal - topicosConcluidos);
  const semanasEstimadas = topicosConcluidos > 0 
    ? Math.max(1, Math.ceil(topicosRestantes / Math.max(1, Math.round(topicosConcluidos / 4))))
    : 12;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Banner Superior Dinâmico - Estatísticas & Relatórios */}
      <MenuBannerFrame
        bannerThemes={ESTATISTICAS_BANNER_THEMES}
        minHeight="min-h-[190px] md:min-h-[210px]"
        className="estatisticas-banner w-full border border-slate-200/20 dark:border-slate-800 shadow-xl flex items-center bg-slate-950 p-6 md:p-8 card-banner metas-xp-banner"
        contentClassName="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5"
        imgClassName="w-full h-full object-cover object-center scale-[1.14] pointer-events-none select-none transition-transform duration-300"
        alt="Estatísticas & Relatórios"
        fallbackSkin="laranja"
      >
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-3 flex-wrap">
            <div
              className="w-11 h-11 rounded-xl bg-black/50 border border-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-md"
              style={{ color: themeGlowStyles.color }}
            >
              <BarChart3 className="w-6 h-6" />
            </div>
            <h2
              className="provas-banner-title text-xl sm:text-2xl md:text-3xl font-extrabold !text-white tracking-tight leading-tight select-none drop-shadow-md"
              style={{
                color: '#FFFFFF',
                textShadow: themeGlowStyles.textShadow,
              }}
            >
              Estatísticas & Relatórios
            </h2>
          </div>
          <p
            className="text-xs sm:text-sm !text-white/90 leading-relaxed max-w-xl drop-shadow-xs"
            style={{ color: 'rgba(255, 255, 255, 0.92)' }}
          >
            Métricas consolidadas, ritmo analítico e desempenho por matéria.
          </p>
        </div>
      </MenuBannerFrame>

      {/* 1. BARRA DE CONTROLES E FILTROS SUPERIORES */}
      <div className="flashcards-daily-review-card bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/25 dark:border-primary/20 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Pills de Intervalo de Período */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mr-1 hidden sm:inline">
            Período:
          </span>

          {(
            [
              { id: '7d', label: '7 dias' },
              { id: '30d', label: '30 dias' },
              { id: '90d', label: '90 dias' },
              { id: 'inicio', label: 'Desde o início' },
            ] as const
          ).map(p => {
            const isActive = selectedPeriod === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPeriod(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'text-white shadow-sm ring-2 ring-offset-1 dark:ring-offset-slate-900'
                    : 'bg-white/85 dark:bg-slate-900/80 border border-primary/15 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-primary/10 dark:hover:bg-slate-800'
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: themeGlowStyles.color,
                        boxShadow: `0 0 0 2px ${themeGlowStyles.color}`,
                      }
                    : undefined
                }
              >
                {p.label}
              </button>
            );
          })}

          {/* Tag com a Faixa Real de Datas Selecionada */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-semibold bg-white/85 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border border-primary/20 dark:border-slate-700/60 ml-auto sm:ml-2">
            <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>{periodDateRange.labelFormatted}</span>
          </div>
        </div>

        {/* Lado Direito: Filtros Avançados + Exportar CSV */}
        <div className="flex items-center gap-2 justify-end relative" ref={filterDropdownRef}>
          {/* Botão Filtros ▾ */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterMenuOpen(prev => !prev)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                activeFiltersCount > 0
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white/90 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 border-primary/20 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-primary text-[10px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${filterMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Menu Popover de Filtros Avançados */}
            {filterMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 space-y-3.5 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    Filtros Analíticos
                  </span>
                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDisciplinaId('all');
                        setSelectedConcursoId('all');
                      }}
                      className="text-[11px] font-bold text-rose-500 hover:text-rose-600 transition-colors"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {/* Filtro por Concurso */}
                {concursos.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Concurso
                    </label>
                    <select
                      value={selectedConcursoId}
                      onChange={(e) => {
                        setSelectedConcursoId(e.target.value);
                        setSelectedDisciplinaId('all'); // Reseta disciplina ao trocar concurso
                      }}
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none"
                    >
                      <option value="all">Todos os concursos</option>
                      {concursos.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.title || c.organ || 'Concurso'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Filtro por Disciplina */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Disciplina
                  </label>
                  <select
                    value={selectedDisciplinaId}
                    onChange={(e) => setSelectedDisciplinaId(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none"
                  >
                    <option value="all">Todas as disciplinas</option>
                    {availableDisciplinas.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  size="sm"
                  className="w-full font-bold text-xs"
                  onClick={() => setFilterMenuOpen(false)}
                >
                  Aplicar Filtro
                </Button>
              </div>
            )}
          </div>

          {/* Exportar CSV */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-primary shrink-0" />}
            className="font-bold text-xs whitespace-nowrap bg-white/85 dark:bg-slate-900/80"
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* BANNER DE INSIGHTS COM PAGINADOR / SLIDER (< 1/2 >) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div 
              className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20"
              style={{ color: themeGlowStyles.color }}
            >
              {insightSlide === 1 ? <Sparkles className="w-5 h-5" /> : <Target className="w-5 h-5" />}
            </div>

            <div className="space-y-1 max-w-2xl">
              {insightSlide === 1 ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Ritmo de Estudo & Foco
                    </span>
                    <span className="text-xs text-slate-400">
                      Média: {filteredData.mediaHorasPorSessao > 0 ? `${filteredData.mediaHorasPorSessao}h por sessão` : 'Sem registros'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                    Você acumulou <strong className="text-white">{filteredData.horasTotais}h líquidas</strong> e resolveu <strong className="text-white">{filteredData.questoes} questões</strong> no período filtrado ({selectedPeriod === '7d' ? 'últimos 7 dias' : selectedPeriod === '30d' ? 'últimos 30 dias' : selectedPeriod === '90d' ? 'últimos 90 dias' : 'desde o início'}). Mantendo esse ritmo de foco, você consolida memorização de longo prazo!
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      Projeção de Conclusão do Edital
                    </span>
                    <span className="text-xs text-slate-400">
                      {topicosConcluidos} de {topicosTotal} tópicos dominados
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                    {coberturaEdital > 0 ? (
                      <>
                        Com <strong className="text-white">{coberturaEdital}% do edital coberto</strong>, a projeção calculada indica aproximadamente <strong className="text-white">{semanasEstimadas} semanas</strong> para fechar 100% dos conteúdos no seu ritmo médio atual.
                      </>
                    ) : (
                      <>
                        Complete seus primeiros tópicos de teoria e questões para calibrar a previsão automatizada de conclusão do edital!
                      </>
                    )}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Controles de Navegação < 1/2 > */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center bg-black/40 p-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setInsightSlide(1)}
              disabled={insightSlide === 1}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                insightSlide === 1 ? 'text-slate-600 cursor-not-allowed' : 'text-white hover:bg-white/10'
              }`}
              title="Slide anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold px-2 text-slate-300">
              {insightSlide} / 2
            </span>
            <button
              type="button"
              onClick={() => setInsightSlide(2)}
              disabled={insightSlide === 2}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                insightSlide === 2 ? 'text-slate-600 cursor-not-allowed' : 'text-white hover:bg-white/10'
              }`}
              title="Próximo slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. NOVOS CARDS DE MÉTRICAS ESPECÍFICAS & ANALÍTICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Páginas Lidas */}
        <div className="flashcards-daily-review-card p-5 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/25 dark:border-primary/20 rounded-2xl shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-amber-400/50 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700/60 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-slate-600 dark:text-slate-300 block">
                  Páginas Lidas
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Leitura, Teoria & Lei Seca</span>
              </div>
            </div>
            {filteredData.totalPaginasLidas > 0 && (
              <Badge variant="amber" size="sm">
                Ativo
              </Badge>
            )}
          </div>

          <div className="space-y-1 my-2">
            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {filteredData.totalPaginasLidas} <span className="text-base font-semibold text-slate-500 dark:text-slate-400">pág.</span>
            </div>
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
              {filteredData.ritmoPaginasPorHora.toFixed(1).replace('.', ',')} páginas por hora no período filtrado
            </p>
          </div>
        </div>

        {/* Card 2: Videoaulas */}
        <div className="flashcards-daily-review-card p-5 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/25 dark:border-primary/20 rounded-2xl shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-purple-400/50 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-300 dark:border-purple-700/60 flex items-center justify-center shrink-0">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-slate-600 dark:text-slate-300 block">
                  Videoaulas
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Tempo & aulas concluídas</span>
              </div>
            </div>
            {filteredData.totalVideosAssistidos > 0 && (
              <Badge variant="purple" size="sm">
                {filteredData.totalVideosAssistidos} aulas
              </Badge>
            )}
          </div>

          <div className="space-y-1 my-2">
            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatDurationFriendly(filteredData.totalVideoMinutes)}
            </div>
            <p className="text-xs font-medium text-purple-600 dark:text-purple-400">
              {filteredData.totalVideosAssistidos} videoaula{filteredData.totalVideosAssistidos === 1 ? '' : 's'} concluída{filteredData.totalVideosAssistidos === 1 ? '' : 's'} no período
            </p>
          </div>
        </div>

        {/* Card 3: Constância nos Estudos */}
        <div className="flashcards-daily-review-card p-5 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/25 dark:border-primary/20 rounded-2xl shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-primary/50 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                style={{
                  backgroundColor: `${themeGlowStyles.color}15`,
                  color: themeGlowStyles.color,
                  borderColor: `${themeGlowStyles.color}40`,
                }}
              >
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-slate-600 dark:text-slate-300 block">
                  Constância nos Estudos
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Dias de estudo vs. sem estudo</span>
              </div>
            </div>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: `${themeGlowStyles.color}20`,
                color: themeGlowStyles.color,
                borderColor: `${themeGlowStyles.color}40`,
              }}
            >
              {filteredData.constanciaPercentual}% de constância
            </span>
          </div>

          <div className="space-y-1 my-2">
            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-baseline gap-2">
              <span>{filteredData.diasEstudados} <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">dias estudados</span></span>
            </div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {filteredData.diasSemEstudo} {filteredData.diasSemEstudo === 1 ? 'dia' : 'dias'} sem estudo (desde o início oficial)
            </p>
          </div>
        </div>
      </div>

      {/* CARDS COMPLEMENTARES DE RENDIMENTO */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border-indigo-200/40 dark:border-indigo-900/40">
          <CardBody className="p-5">
            <span className="text-xs uppercase font-extrabold text-indigo-600 dark:text-indigo-400 block mb-1">
              Horas Líquidas
            </span>
            <span className="text-3xl font-black text-slate-900 dark:text-white">{filteredData.horasTotais}h</span>
            <span className="text-[11px] text-slate-400 block mt-1">
              {filteredData.sessoesCount} sessões registradas
            </span>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-200/40 dark:border-emerald-900/40">
          <CardBody className="p-5">
            <span className="text-xs uppercase font-extrabold text-emerald-600 dark:text-emerald-400 block mb-1">
              Taxa de Acerto
            </span>
            <span className="text-3xl font-black text-slate-900 dark:text-white">{filteredData.taxaAcerto}%</span>
            <span className="text-[11px] text-slate-400 block mt-1">
              {filteredData.acertos} certas de {filteredData.questoes}
            </span>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-200/40 dark:border-rose-900/40">
          <CardBody className="p-5">
            <span className="text-xs uppercase font-extrabold text-rose-600 dark:text-rose-400 block mb-1">
              Erros Registrados
            </span>
            <span className="text-3xl font-black text-slate-900 dark:text-white">{filteredData.erros}</span>
            <span className="text-[11px] text-slate-400 block mt-1">
              No período selecionado
            </span>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-200/40 dark:border-amber-900/40">
          <CardBody className="p-5">
            <span className="text-xs uppercase font-extrabold text-amber-600 dark:text-amber-400 block mb-1">
              Revisões Concluídas
            </span>
            <span className="text-3xl font-black text-slate-900 dark:text-white">{filteredData.filteredRevisoes.length}</span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Ciclos de retenção ativos
            </span>
          </CardBody>
        </Card>
      </div>

      {/* 3. QUADRO ANALÍTICO "TEMPO POR CATEGORIA" (DONUT CHART DINÂMICO + LEGENDA) */}
      <div className="flashcards-daily-review-card bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/25 dark:border-primary/20 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-primary/15 dark:border-primary/20">
          <div>
            <h3 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              TEMPO POR CATEGORIA
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Distribuição dinâmica do tempo líquido de estudo por método e material
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Gráfico de Rosca (Donut Chart SVG) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
              {(() => {
                const totalMinutes = categoryData.totalCategoryMinutes;
                const radius = 80;
                const circumference = 2 * Math.PI * radius; // ~502.65
                let accumulatedOffset = 0;

                return (
                  <svg
                    viewBox="0 0 220 220"
                    className="w-full h-full transform -rotate-90 select-none overflow-visible"
                  >
                    {/* Anel de Fundo Neutro */}
                    <circle
                      cx="110"
                      cy="110"
                      r={radius}
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="24"
                      className="text-white/70 dark:text-slate-800/80"
                    />

                    {/* Slices Dinâmicas */}
                    {totalMinutes > 0 && categoryData.list.map((cat) => {
                      if (cat.minutes <= 0) return null;
                      const sliceStroke = (cat.minutes / totalMinutes) * circumference;
                      const strokeDasharray = `${sliceStroke} ${circumference}`;
                      const strokeDashoffset = -accumulatedOffset;
                      accumulatedOffset += sliceStroke;

                      return (
                        <circle
                          key={cat.id}
                          cx="110"
                          cy="110"
                          r={radius}
                          fill="transparent"
                          stroke={cat.color}
                          strokeWidth="24"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-500 ease-out hover:opacity-90 cursor-pointer"
                        >
                          <title>{`${cat.label}: ${formatDurationFriendly(cat.minutes)} (${cat.percentage}%)`}</title>
                        </circle>
                      );
                    })}
                  </svg>
                );
              })()}

              {/* Centro do Gráfico: Tempo Total Acumulado */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {formatDurationFriendly(categoryData.totalCategoryMinutes)}
                </span>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                  no período
                </span>
              </div>
            </div>
          </div>

          {/* Legenda Lateral Dinâmica */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {categoryData.list.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/80 dark:bg-slate-900/75 border border-primary/15 dark:border-slate-800 transition-all hover:border-primary/35 dark:hover:border-slate-700"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {cat.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                      {formatDurationFriendly(cat.minutes)}
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-primary/15 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                      {cat.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ABAS DETALHADAS DE DESEMPENHO E EVOLUÇÃO */}
      <div className="flashcards-daily-review-card bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/25 dark:border-primary/20 rounded-2xl p-2.5 flex items-center justify-between gap-2 overflow-x-auto text-xs shadow-xs">
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('geral')}
            className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer ${
              activeTab === 'geral'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-white/80 dark:bg-slate-900/80 border border-primary/15 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-primary/10 dark:hover:bg-slate-800'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('disciplinas')}
            className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer ${
              activeTab === 'disciplinas'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-white/80 dark:bg-slate-900/80 border border-primary/15 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-primary/10 dark:hover:bg-slate-800'
            }`}
          >
            Por Disciplina
          </button>
          <button
            onClick={() => setActiveTab('evolucao')}
            className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer ${
              activeTab === 'evolucao'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-white/80 dark:bg-slate-900/80 border border-primary/15 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-primary/10 dark:hover:bg-slate-800'
            }`}
          >
            Evolução Semanal
          </button>
        </div>
      </div>

      {activeTab === 'geral' && (
        <Card className="flashcards-daily-review-card bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border-primary/25 dark:border-primary/20 rounded-2xl overflow-hidden">
          <CardHeader title="Progresso Geral do Edital" className="border-primary/15 dark:border-primary/20" />
          <CardBody className="p-6 space-y-4">
            <div className="flex justify-between font-bold text-sm">
              <span>Cobertura do Edital</span>
              <span style={{ color: themeGlowStyles.color }}>{stats.percentualEdital}%</span>
            </div>
            <div className="w-full bg-white/80 dark:bg-slate-800 h-3 rounded-full overflow-hidden border border-primary/15 dark:border-transparent">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${stats.percentualEdital}%`,
                  background: 'linear-gradient(90deg, var(--banner-progress-from), var(--banner-progress-to))',
                  backgroundColor: themeGlowStyles.color,
                  boxShadow: '0 0 10px var(--chart-glow)',
                }}
              />
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === 'disciplinas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {desempenhoDisciplinas.map(d => (
            <Card key={d.id} className="flashcards-daily-review-card bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border-primary/25 dark:border-primary/20 rounded-2xl overflow-hidden">
              <CardHeader title={d.name} action={<Badge variant="emerald" size="sm">{d.taxaAcerto}%</Badge>} className="border-primary/15 dark:border-primary/20" />
              <CardBody className="p-5">
                <p className="text-xs text-slate-600 dark:text-slate-400">Acertos: {d.acertos} / {d.questoes}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'evolucao' && (
        <Card className="flashcards-daily-review-card bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border-primary/25 dark:border-primary/20 rounded-2xl overflow-hidden">
          <CardHeader title="Ritmo dos Últimos 7 Dias (Domingo a Sábado)" className="border-primary/15 dark:border-primary/20" />
          <CardBody className="p-6">
            {(() => {
              const maxWeeklyMinutes = Math.max(...weeklyEvolutionData.map(item => item.minutos), 0);
              return (
                <div className="grid grid-cols-7 gap-3 h-48 items-end">
                  {weeklyEvolutionData.map((d, idx) => {
                    const barHeightPx =
                      d.minutos > 0 && maxWeeklyMinutes > 0
                        ? Math.max(14, Math.round((d.minutos / maxWeeklyMinutes) * 144))
                        : 6;
                    const labelText = d.minutos > 0 ? formatDurationFriendly(d.minutos) : '0h';

                    return (
                      <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end">
                        <span
                          className="text-[10px] sm:text-[11px] font-bold whitespace-nowrap"
                          style={{ color: themeGlowStyles.color }}
                        >
                          {labelText}
                        </span>
                        <div
                          className="w-full rounded-t-lg transition-all duration-300 shrink-0"
                          title={`${d.diaSemana}: ${labelText}`}
                          style={{
                            height: `${barHeightPx}px`,
                            background: 'linear-gradient(to top, var(--banner-progress-from), var(--banner-progress-to))',
                            backgroundColor: themeGlowStyles.color,
                            boxShadow: d.minutos > 0 ? '0 0 12px var(--chart-glow)' : 'none',
                            opacity: d.minutos > 0 ? 1 : 0.35,
                          }}
                        />
                        <span className="text-xs font-semibold">{d.diaSemana}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </CardBody>
        </Card>
      )}
    </div>
  );
};
