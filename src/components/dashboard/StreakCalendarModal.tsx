import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
} from 'lucide-react';
import type { StudyStreak, StreakDayStatus } from './studyStreak';
import { Modal } from '../../design-system/Modal';
import { Button } from '../../design-system/Button';
import { Badge } from '../../design-system/Badge';

interface StreakCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  streak: StudyStreak;
}

export const StreakCalendarModal: React.FC<StreakCalendarModalProps> = ({
  isOpen,
  onClose,
  streak,
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const { todayStr, studiedDatesSet, getDayStatus, currentStreak, bestStreak } = streak;

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
      status: StreakDayStatus;
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
        status: 'neutral',
      });
    }

    // 2. Dias do mês atual
    for (let dNum = 1; dNum <= totalDaysInMonth; dNum++) {
      const m = String(month + 1).padStart(2, '0');
      const d = String(dNum).padStart(2, '0');
      const dateStr = `${year}-${m}-${d}`;
      const isFuture = dateStr > todayStr;
      const status = getDayStatus(dateStr);

      if (status === 'studied') {
        studiedInMonthCount++;
      }

      grid.push({
        dayNumber: dNum,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isFuture,
        status,
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
        status: 'neutral',
      });
    }

    return {
      monthName: `${monthNames[month]} de ${year}`,
      daysInGrid: grid,
      totalStudiedInMonth: studiedInMonthCount,
    };
  }, [year, month, todayStr, getDayStatus]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Constância dos Estudos"
      description="Histórico visual de frequência, dias ativos e sequência ininterrupta."
      maxWidth="2xl"
    >
      <div className="streak-calendar-modal space-y-3 text-xs">
        {/* Painel de Navegação de Mês + Legenda Integrada */}
        <div className="streak-nav-bar flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
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
            <span className="streak-month-badge hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border">
              {totalStudiedInMonth} dias neste mês
            </span>
          </div>

          {/* Legenda de Cores Semânticas Universais (Independente do Tema Ativo) */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="streak-legend-studied w-4 h-4 rounded-md border flex items-center justify-center">
                <Check className="streak-icon-studied w-2.5 h-2.5 stroke-[3]" />
              </span>
              <span>Estudou</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="streak-legend-missed w-4 h-4 rounded-md border flex items-center justify-center">
                <X className="streak-icon-missed w-2.5 h-2.5 stroke-[3]" />
              </span>
              <span>Não estudou</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="streak-legend-studied w-4 h-4 rounded-md border flex items-center justify-center">
                <span className="dashboard-streak-rest-dot text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
              </span>
              <span>Descanso</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="streak-legend-future w-4 h-4 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
              <span>Futuro</span>
            </div>
          </div>
        </div>

        {/* Grid do Calendário Mais Largo e Compacto na Vertical */}
        <div className="streak-grid-container border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 bg-white dark:bg-slate-900/90 shadow-xs">
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
              const { dayNumber, isCurrentMonth, isToday, isFuture, status } = item;

              const getCalendarCellStyles = () => {
                // 1. Dias fora do mês atual (Padding) ou dias futuros: neutros, sem marcação
                if (!isCurrentMonth || isFuture) {
                  return {
                    container:
                      'streak-cell-neutral border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 dark:text-slate-600',
                    numberText: 'text-slate-400 dark:text-slate-600 font-normal',
                    icon: null as 'check' | 'x' | null,
                  };
                }

                // 2. Dias com estudo registrado (SEMPRE VERDE EM TODOS OS 5 TEMAS E MODOS):
                if (status === 'studied') {
                  const isTodayHighlight = isToday
                    ? 'streak-cell-today-ring ring-2 ring-emerald-500 border-2 border-emerald-500 dark:border-emerald-400 z-10'
                    : 'border border-emerald-400 dark:border-emerald-600/80';

                  return {
                    container: `streak-cell-studied ${isTodayHighlight} bg-emerald-100/90 dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-100 font-bold shadow-xs`,
                    numberText: 'text-emerald-950 dark:text-emerald-100 font-extrabold',
                    icon: 'check' as const,
                  };
                }

                if (status === 'rest') {
                  return {
                    container: 'border border-dashed border-emerald-300 bg-emerald-50/60 dark:border-emerald-700 dark:bg-emerald-950/40',
                    numberText: 'text-emerald-800 dark:text-emerald-300 font-semibold',
                    icon: 'dot' as const,
                  };
                }

                // 3. Dia de hoje ainda sem estudo registrado: pendente/neutro com destaque "Hoje", sem "X" precipitado
                if (status === 'pending') {
                  return {
                    container:
                      'streak-cell-today-pending streak-cell-today-ring ring-2 ring-emerald-500 border-2 border-emerald-500 dark:border-emerald-400 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 font-semibold z-10',
                    numberText: 'text-slate-700 dark:text-slate-200 font-bold',
                    icon: null as 'check' | 'x' | null,
                  };
                }

                // 4. Dias anteriores ao início dos estudos: neutros, sem "X" e sem "check"
                if (status === 'neutral') {
                  return {
                    container:
                      'streak-cell-neutral border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 dark:text-slate-600',
                    numberText: 'text-slate-400 dark:text-slate-600 font-normal',
                    icon: null as 'check' | 'x' | null,
                  };
                }

                // 5. Dias passados no intervalo ativo sem estudo (SEMPRE VERMELHO EM TODOS OS 5 TEMAS E MODOS):
                return {
                  container:
                    'streak-cell-missed border border-rose-300 dark:border-rose-900/70 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 font-bold',
                  numberText: 'text-rose-600 dark:text-rose-400 font-bold',
                  icon: 'x' as const,
                };
              };

              const cellStyle = getCalendarCellStyles();

              return (
                <div
                  key={`${item.dateStr}_${idx}`}
                  className={`streak-day-cell relative px-2.5 py-1.5 h-10 sm:h-11 rounded-xl flex items-center justify-between transition-all select-none ${
                    !isCurrentMonth ? 'opacity-35' : ''
                  } ${cellStyle.container}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`streak-day-number font-mono text-xs ${cellStyle.numberText}`}>
                      {dayNumber}
                    </span>
                    {isToday && (
                      <span className="streak-today-label text-[9px] uppercase font-extrabold text-emerald-700 dark:text-emerald-300">
                        Hoje
                      </span>
                    )}
                  </div>
                  <div className="flex items-center">
                    {cellStyle.icon === 'check' && (
                      <Check className="streak-icon-studied w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3] shrink-0" />
                    )}
                    {cellStyle.icon === 'dot' && (
                      <span className="dashboard-streak-rest-dot text-emerald-700 dark:text-emerald-400" role="img" aria-label="Descanso planejado" />
                    )}
                    {cellStyle.icon === 'x' && (
                      <X className="streak-icon-missed w-3.5 h-3.5 text-rose-500 dark:text-rose-400 stroke-[3] shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rodapé com Cálculo de Dias, Recorde Atual e Botão de Fechar */}
        <div className="streak-footer-bar px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-emerald-500/10 border border-orange-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500 text-white shadow-xs">
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Sequência atual: {currentStreak} {currentStreak === 1 ? 'dia seguido' : 'dias seguidos'}
                </span>
                {currentStreak > 0 && <Badge variant="amber" size="sm">🔥 Ativa</Badge>}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Recorde histórico: <strong>{bestStreak} dias constantes</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                Total de dias estudados
              </span>
              <span className="streak-total-studied-value text-base font-black font-mono">
                {studiedDatesSet.size} dias
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

