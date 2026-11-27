import type { DayOfWeek, RegistroBlocoQuestoes, SessaoEstudo } from '../../types';
import { PlannerService } from '../../services/plannerService';

export interface StreakSchedule {
  studyDays: readonly DayOfWeek[];
  startsOn?: string;
  endsOn?: string;
}

export type StreakDayStatus = 'studied' | 'rest' | 'missed' | 'pending' | 'neutral';

function studyDay(raw?: string): string {
  if (!raw) return '';
  const value = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : PlannerService.formatLocalDate(date);
}

const DAY_MS = 86_400_000;

function dayNumber(value: string): number {
  return Date.parse(`${value}T00:00:00Z`) / DAY_MS;
}

function dateForDayNumber(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

export function summarizeStudyStreak(
  sessoes: readonly SessaoEstudo[],
  blocosQuestoes: readonly RegistroBlocoQuestoes[],
  concursoId: string | undefined,
  disciplinaIds: ReadonlySet<string>,
  schedule?: StreakSchedule,
  today = new Date(),
) {
  const todayStr = PlannerService.formatLocalDate(today);
  const studiedDatesSet = new Set<string>();

  const addDay = (day: string) => {
    if (day && day <= todayStr && Number.isFinite(dayNumber(day))) studiedDatesSet.add(day);
  };

  for (const session of sessoes) {
    if (concursoId && (session.concursoId
      ? session.concursoId !== concursoId
      : !disciplinaIds.has(session.disciplinaId))) continue;
    if (session.durationMinutes > 0 || (session.durationSeconds ?? 0) > 0 || (session.questionsAttempted ?? 0) > 0) {
      addDay(studyDay(session.completedAt) || studyDay(session.createdAt));
    }
  }

  for (const bloco of blocosQuestoes) {
    if (concursoId && !disciplinaIds.has(bloco.disciplinaId)) continue;
    if (bloco.totalQuestions > 0) addDay(studyDay(bloco.date) || studyDay(bloco.createdAt));
  }

  const dates = [...studiedDatesSet].sort();
  const scheduleStart = studyDay(schedule?.startsOn);
  const scheduleEnd = studyDay(schedule?.endsOn);
  const isScheduled = (date: string) => Boolean(
    schedule?.studyDays.length && (!scheduleStart || date >= scheduleStart) && (!scheduleEnd || date <= scheduleEnd)
  );
  const isRestDay = (date: string) => schedule && isScheduled(date) &&
    !schedule.studyDays.includes(PlannerService.getDayOfWeekFromDate(PlannerService.parseLocalDate(date)));

  const getDayStatus = (date: string): StreakDayStatus => {
    if (date > todayStr) return 'neutral';
    if (studiedDatesSet.has(date)) return 'studied';
    if (isRestDay(date)) return 'rest';
    if (date === todayStr) return 'pending';
    return isScheduled(date) || (dates.length > 0 && date >= dates[0]) ? 'missed' : 'neutral';
  };

  const hasUninterruptedGap = (lastStudy: number, nextStudy: number) => {
    if (!Number.isFinite(lastStudy)) return false;
    for (let day = lastStudy + 1; day < nextStudy; day++) {
      if (!isRestDay(dateForDayNumber(day))) return false;
    }
    return true;
  };

  let bestStreak = 0;
  let run = 0;
  let previousDay = -Infinity;
  for (const date of dates) {
    const day = dayNumber(date);
    run = hasUninterruptedGap(previousDay, day) ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    previousDay = day;
  }

  // Um dia de estudo só vira falta depois de terminar.
  const todayNumber = dayNumber(todayStr);
  const currentStreak = hasUninterruptedGap(previousDay, todayNumber) ? run : 0;
  const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
    const date = dateForDayNumber(todayNumber - 6 + index);
    return { date, status: getDayStatus(date) };
  });

  return { todayStr, studiedDatesSet, getDayStatus, lastSevenDays, currentStreak, bestStreak };
}

export type StudyStreak = ReturnType<typeof summarizeStudyStreak>;
