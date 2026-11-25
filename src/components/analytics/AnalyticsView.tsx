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
  Play,
  FileText,
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
import './analyticsNotebook.css';

export const ESTATISTICAS_BANNER_THEMES: Record<string, string> = {
  verde: '/assets/bannersestatisticas/Banner-Estatistica-verde.webp',
  azul: '/assets/bannersestatisticas/Banner-Estatistica-azul.webp',
  rosa: '/assets/bannersestatisticas/Banner-Estatistica-rosa.webp',
  roxo: '/assets/bannersestatisticas/Banner-Estatistica-roxo.webp',
  laranja: '/assets/bannersestatisticas/Banner-Estatistica-laranja.webp',
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

interface NotebookMetricProps {
  tone: 'amber' | 'violet' | 'mint' | 'blue' | 'rose' | 'peach';
  icon: typeof Clock;
  label: string;
  value: React.ReactNode;
  detail: string;
  description?: string;
  footer?: string;
}

function NotebookMetric({ tone, icon: Icon, label, value, detail, description, footer }: NotebookMetricProps) {
  return (
    <article className="stats-note" data-tone={tone}>
      <header className="stats-note-heading">
        <span className="stats-note-icon"><Icon aria-hidden="true" size={20} /></span>
        <div>
          <h3>{label}</h3>
          {description && <p>{description}</p>}
        </div>
      </header>
      <div className="stats-note-reading">
        <p className="stats-note-value">{value}</p>
        <p className="stats-note-detail"><span>{detail}</span></p>
        {footer && <p className="stats-note-footer">{footer}</p>}
      </div>
    </article>
  );
}

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

  // 6. Tempo por categoria
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

  const activeCategories = categoryData.list.filter(category => category.minutes > 0);
  const emptyCategories = categoryData.list.filter(category => category.minutes <= 0);


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

      <div className="stats-notebook">
        <div className="stats-notes stats-notes-featured">
          <NotebookMetric
            tone="amber" icon={BookOpen} label="Páginas lidas" description="Leitura, Teoria e Lei Seca"
            value={<>{filteredData.totalPaginasLidas} <small>{filteredData.totalPaginasLidas === 1 ? 'página' : 'páginas'}</small></>}
            detail={`${filteredData.ritmoPaginasPorHora.toFixed(1).replace('.', ',')} páginas por hora`}
          />
          <NotebookMetric
            tone="violet" icon={Play} label="Videoaulas" description="Tempo e aulas concluídas"
            value={formatDurationFriendly(filteredData.totalVideoMinutes)}
            detail={`${filteredData.totalVideosAssistidos} ${filteredData.totalVideosAssistidos === 1 ? 'aula concluída' : 'aulas concluídas'}`}
          />
          <NotebookMetric
            tone="mint" icon={CalendarCheck} label="Constância" description="Dias com e sem estudo"
            value={<>{filteredData.diasEstudados} <small>{filteredData.diasEstudados === 1 ? 'dia' : 'dias'}</small></>}
            detail={`${filteredData.constanciaPercentual}% de constância`}
            footer={`${filteredData.diasSemEstudo} ${filteredData.diasSemEstudo === 1 ? 'dia' : 'dias'} sem estudo desde o início`}
          />
        </div>

        <div className="stats-notes stats-notes-summary">
          <NotebookMetric
            tone="blue" icon={Clock} label="Horas líquidas"
            value={formatDurationFriendly(filteredData.totalMinutes)}
            detail={`${filteredData.sessoesCount} ${filteredData.sessoesCount === 1 ? 'sessão registrada' : 'sessões registradas'}`}
          />
          <NotebookMetric
            tone="mint" icon={Target} label="Taxa de acerto"
            value={`${filteredData.taxaAcerto}%`} detail={`${filteredData.acertos} certas de ${filteredData.questoes}`}
          />
          <NotebookMetric
            tone="rose" icon={FileText} label="Erros registrados"
            value={filteredData.erros} detail="No período selecionado"
          />
          <NotebookMetric
            tone="peach" icon={Calendar} label="Revisões concluídas"
            value={filteredData.filteredRevisoes.length} detail="No período selecionado"
          />
        </div>

        <section className="stats-category-sheet" aria-labelledby="stats-category-title">
          <header className="stats-category-heading">
            <div>
              <h3 id="stats-category-title"><BarChart3 aria-hidden="true" size={22} /> Tempo por categoria</h3>
              <p>Distribuição do tempo líquido de estudo por método e material</p>
            </div>
            <p className="stats-category-total">
              <Clock aria-hidden="true" size={15} />
              <span><strong>{formatDurationFriendly(categoryData.totalCategoryMinutes)}</strong> no período</span>
            </p>
          </header>

          {activeCategories.length > 0 ? (
            <ul className="stats-category-bars">
              {activeCategories.map(cat => (
                <li className="stats-category-row" key={cat.id}>
                  <span className="stats-category-label">
                    <span className="stats-category-dot" aria-hidden="true" style={{ backgroundColor: cat.color }} />
                    {cat.label}
                  </span>
                  <span className="stats-category-track" aria-hidden="true">
                    <span
                      className="stats-category-fill"
                      style={{ width: `${cat.minutes / categoryData.totalCategoryMinutes * 100}%`, backgroundColor: cat.color }}
                    />
                  </span>
                  <span className="stats-category-values">
                    <strong>{formatDurationFriendly(cat.minutes)}</strong>
                    <span>{cat.percentage.toLocaleString('pt-BR')}%</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="stats-category-empty">Nenhum tempo registrado no período selecionado.</p>
          )}

          {emptyCategories.length > 0 && (
            <ul className="stats-category-zero" aria-label="Categorias sem tempo registrado">
              {emptyCategories.map(cat => (
                <li key={cat.id}>
                  <span className="stats-category-dot" aria-hidden="true" style={{ backgroundColor: cat.color }} />
                  <span>{cat.label}</span>
                  <strong>0 min</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ABAS DETALHADAS DE DESEMPENHO E EVOLUÇÃO */}
      <div className="flashcards-daily-review-card bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/25 dark:border-primary/20 rounded-2xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs shadow-xs">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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
