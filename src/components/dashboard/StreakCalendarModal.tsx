import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
} from 'lucide-react';
import { SessaoEstudo, Concurso, Disciplina } from '../../types';
import { Modal } from '../../design-system/Modal';
import { Button } from '../../design-system/Button';
import { Badge } from '../../design-system/Badge';

interface StreakCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  streakDays: number;
  bestStreakDays?: number;
  sessoes?: SessaoEstudo[];
  activeConcurso?: Concurso | null;
  disciplinas?: Disciplina[];
}

const extractLocalDateStr = (raw?: string): string => {
  if (!raw) return '';
  const clean = String(raw).trim();
  const datePart = clean.split('T')[0].split(' ')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return datePart;
  }
  const parsed = new Date(clean);
  if (isNaN(parsed.getTime())) return '';
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, '0');
  const d = String(parsed.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const StreakCalendarModal: React.FC<StreakCalendarModalProps> = ({
  isOpen,
  onClose,
  streakDays,
  bestStreakDays,
  sessoes = [],
  activeConcurso = null,
  disciplinas = [],
}) => {
  // Controle de navegação de meses
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Data atual de referência para hoje (formato YYYY-MM-DD local)
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  // Conjunto de disciplinas válidas do concurso ativo (quando aplicável)
  const validDisciplinaIds = useMemo(() => {
    if (!activeConcurso || !disciplinas || disciplinas.length === 0) return null;
    const filtered = disciplinas.filter(
      (d) => !d.concursoId || String(d.concursoId) === String(activeConcurso.id)
    );
    if (filtered.length === 0) return null;
    return new Set(filtered.map((d) => String(d.id)));
  }, [activeConcurso, disciplinas]);

  // Mapeamento estrito de dias com estudo efetivo e marco inicial (dataInicioEstudo)
  const { studiedDatesSet, dataInicioEstudo, realBestStreak } = useMemo(() => {
    const set = new Set<string>();

    // 1. Extrai datas das sessões reais cadastradas no concurso ativo
    sessoes.forEach((s) => {
      if (validDisciplinaIds && s.disciplinaId && !validDisciplinaIds.has(String(s.disciplinaId))) {
        return;
      }
      const hasStudy = (s.durationMinutes || 0) > 0 || (s.questionsAttempted || 0) > 0;
      if (!hasStudy) return;
      const d = extractLocalDateStr(s.completedAt) || extractLocalDateStr(s.createdAt);
      if (d && d <= todayStr) {
        set.add(d);
      }
    });

    // 2. Extrai datas dos blocos de questões reais cadastrados no concurso ativo
    try {
      const rawBlocos = localStorage.getItem('gabarita_blocos_questoes');
      if (rawBlocos) {
        const blocos = JSON.parse(rawBlocos);
        if (Array.isArray(blocos)) {
          blocos.forEach((b: any) => {
            if (
              validDisciplinaIds &&
              b.disciplinaId &&
              !validDisciplinaIds.has(String(b.disciplinaId))
            ) {
              return;
            }
            const totalQ = Number(b.totalQuestions) || 0;
            if (totalQ <= 0) return;
            const bDate = extractLocalDateStr(b.date) || extractLocalDateStr(b.createdAt);
            if (bDate && bDate <= todayStr) {
              set.add(bDate);
            }
          });
        }
      }
    } catch {
      // ignore
    }

    const sortedDates = Array.from(set).sort();

    // Se o usuário nunca iniciou nenhum estudo no concurso selecionado, dataInicioEstudo é null
    const startStudyDate: string | null = sortedDates.length > 0 ? sortedDates[0] : null;

    // Cálculo do recorde real de dias consecutivos a partir das datas estudadas
    let maxStreak = 0;
    let currentRun = 0;
    let prevTime: number | null = null;

    sortedDates.forEach((dateStr) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const time = new Date(y, m - 1, d).getTime();
      if (prevTime !== null) {
        const diffDays = Math.round((time - prevTime) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentRun += 1;
        } else if (diffDays > 1) {
          currentRun = 1;
        }
      } else {
        currentRun = 1;
      }
      if (currentRun > maxStreak) {
        maxStreak = currentRun;
      }
      prevTime = time;
    });

    return {
      studiedDatesSet: set,
      dataInicioEstudo: startStudyDate,
      realBestStreak: maxStreak,
    };
  }, [sessoes, validDisciplinaIds, todayStr]);

  // Navegação de mês
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  // Cálculo da matriz do calendário para o mês selecionado
  const { monthName, daysInGrid, totalStudiedInMonth } = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const firstDayWeekIndex = firstDayOfMonth.getDay(); // 0 = Domingo
    const totalDaysInMonth = lastDayOfMonth.getDate();

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    interface DayGridItem {
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isFuture: boolean;
      isBeforeStart: boolean;
      studied: boolean;
    }

    const grid: DayGridItem[] = [];
    let studiedInMonthCount = 0;

    // 1. Espaçamento dos dias do mês anterior (Padding)
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = firstDayWeekIndex - 1; i >= 0; i--) {
      const dNum = prevMonthLastDate - i;
      const prevDate = new Date(year, month - 1, dNum);
      const y = prevDate.getFullYear();
      const m = String(prevDate.getMonth() + 1).padStart(2, '0');
      const d = String(dNum).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      grid.push({
        dayNumber: dNum,
        dateStr,
        isCurrentMonth: false,
        isToday: false,
        isFuture: dateStr > todayStr,
        isBeforeStart: !dataInicioEstudo || dateStr < dataInicioEstudo,
        studied: false,
      });
    }

    // 2. Dias do mês atual
    for (let dNum = 1; dNum <= totalDaysInMonth; dNum++) {
      const m = String(month + 1).padStart(2, '0');
      const d = String(dNum).padStart(2, '0');
      const dateStr = `${year}-${m}-${d}`;
      const isFuture = dateStr > todayStr;
      const isBeforeStart = !dataInicioEstudo || dateStr < dataInicioEstudo;
      const isWithinActiveInterval = !isFuture && !isBeforeStart;
      const studied = isWithinActiveInterval && studiedDatesSet.has(dateStr);

      if (studied) {
        studiedInMonthCount++;
      }

      grid.push({
        dayNumber: dNum,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isFuture,
        isBeforeStart,
        studied,
      });
    }

    // 3. Completar até fechar múltiplos de 7 (próximo mês - Padding)
    const remainingDays = (7 - (grid.length % 7)) % 7;
    for (let dNum = 1; dNum <= remainingDays; dNum++) {
      const nextDate = new Date(year, month + 1, dNum);
      const y = nextDate.getFullYear();
      const m = String(nextDate.getMonth() + 1).padStart(2, '0');
      const d = String(dNum).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      grid.push({
        dayNumber: dNum,
        dateStr,
        isCurrentMonth: false,
        isToday: false,
        isFuture: dateStr > todayStr,
        isBeforeStart: !dataInicioEstudo || dateStr < dataInicioEstudo,
        studied: false,
      });
    }

    return {
      monthName: `${monthNames[month]} de ${year}`,
      daysInGrid: grid,
      totalStudiedInMonth: studiedInMonthCount,
    };
  }, [year, month, todayStr, studiedDatesSet, dataInicioEstudo]);

  // Total geral de dias estudados computados estritamente dentro do intervalo ativo
  const totalDiasEstudados = useMemo(() => {
    if (!dataInicioEstudo) return 0;
    let count = 0;
    studiedDatesSet.forEach((dateStr) => {
      if (dateStr >= dataInicioEstudo && dateStr <= todayStr) {
        count++;
      }
    });
    return count;
  }, [studiedDatesSet, dataInicioEstudo, todayStr]);

  const recordeDias = bestStreakDays !== undefined ? bestStreakDays : Math.max(streakDays, realBestStreak);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Constância dos Estudos"
      description="Histórico visual de frequência, dias ativos e sequência ininterrupta."
      maxWidth="2xl"
    >
      <div className="space-y-3 text-xs">
        {/* Painel de Navegação de Mês + Legenda Integrada */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200 capitalize min-w-36 text-center">
              {monthName}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleCurrentMonth}
              className="ml-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Mês Atual
            </button>
            <Badge variant="emerald" size="sm" className="hidden md:inline-flex">
              {totalStudiedInMonth} dias neste mês
            </Badge>
          </div>

          {/* Legenda de Cores Compacta */}
          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-md bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
              <span>Estudou</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-md bg-rose-500/20 border border-rose-500 flex items-center justify-center text-rose-500">
                <X className="w-2.5 h-2.5 stroke-[3]" />
              </span>
              <span>Não estudou</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
              <span>Futuro</span>
            </div>
          </div>
        </div>

        {/* Grid do Calendário Mais Largo e Compacto na Vertical */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 bg-white dark:bg-slate-900/90 shadow-xs">
          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-7 gap-1.5 text-center font-bold text-[11px] text-slate-400 pb-1.5 border-b border-slate-100 dark:border-slate-800">
            <span>DOM</span>
            <span>SEG</span>
            <span>TER</span>
            <span>QUA</span>
            <span>QUI</span>
            <span>SEX</span>
            <span>SÁB</span>
          </div>

          {/* Células de dias */}
          <div className="grid grid-cols-7 gap-1.5 pt-1.5">
            {daysInGrid.map((item, idx) => {
              const { dayNumber, isCurrentMonth, isToday, isFuture, isBeforeStart, studied } = item;

              let style =
                'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400';
              let icon = null;

              if (!isCurrentMonth) {
                // 1. Dias fora do mês atual (Padding): neutros/esmaecidos, sem ícone ("X" ou "check")
                style =
                  'bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800/50 text-slate-400 dark:text-slate-600';
                icon = null;
              } else if (isFuture) {
                // 2. Dias posteriores a hoje (Futuro): estilo neutro, sem marcação
                style =
                  'bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800/50 text-slate-400 dark:text-slate-600';
                icon = null;
              } else if (studied) {
                // 3. Usuário estudou no dia: indicador de sucesso (Check verde)
                style =
                  'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs';
                icon = (
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                );
              } else if (isToday) {
                // 4. Dia de hoje ainda sem estudo registrado: pendente/neutro com badge "Hoje", sem "X" vermelho precipitado
                style =
                  'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold';
                icon = null;
              } else if (isBeforeStart) {
                // 5. Dias anteriores ao início dos estudos (ou quando nunca iniciou): totalmente neutros, sem "X" e sem "check"
                style =
                  'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400';
                icon = null;
              } else {
                // 6. Intervalo válido (dataInicioEstudo <= diaGrid < dataHoje) em que o usuário NÃO estudou: "X" vermelho
                style =
                  'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 font-medium';
                icon = <X className="w-3.5 h-3.5 text-rose-500 stroke-[3]" />;
              }

              return (
                <div
                  key={`${item.dateStr}_${idx}`}
                  className={`relative px-2.5 py-1.5 h-10 sm:h-11 rounded-xl border flex items-center justify-between transition-all select-none ${
                    !isCurrentMonth ? 'opacity-35' : ''
                  } ${
                    isToday
                      ? 'ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-slate-900 z-10'
                      : ''
                  } ${style}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs">{dayNumber}</span>
                    {isToday && (
                      <span className="text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                        Hoje
                      </span>
                    )}
                  </div>
                  <div className="flex items-center">{icon}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rodapé com Cálculo de Dias, Recorde Atual e Botão de Fechar */}
        <div className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-emerald-500/10 border border-orange-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500 text-white shadow-xs">
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Sequência Atual: {streakDays} Dias Seguidos
                </span>
                <Badge variant="amber" size="sm">
                  🔥 Ativa
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Recorde histórico: <strong>{recordeDias} dias constantes</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                Total de dias estudados
              </span>
              <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                {totalDiasEstudados} dias
              </span>
            </div>
            <Button variant="primary" onClick={onClose} size="sm">
              Fechar Calendário
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

