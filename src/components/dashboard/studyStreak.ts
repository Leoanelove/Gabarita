import type { RegistroBlocoQuestoes, SessaoEstudo } from '../../types';

function formatLocalDay(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function studyDay(raw?: string): string {
  if (!raw) return '';
  const value = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : formatLocalDay(date);
}

function dayNumber(value: string): number {
  return Date.parse(`${value}T00:00:00Z`) / 86_400_000;
}

export function summarizeStudyStreak(
  sessoes: readonly SessaoEstudo[],
  blocosQuestoes: readonly RegistroBlocoQuestoes[],
  concursoId: string | undefined,
  disciplinaIds: ReadonlySet<string>,
  today = new Date(),
) {
  const todayStr = formatLocalDay(today);
  const studiedDatesSet = new Set<string>();

  const addDay = (day: string) => {
    if (day && day <= todayStr) studiedDatesSet.add(day);
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
  let bestStreak = 0;
  let run = 0;
  let previousDay = -Infinity;

  for (const date of dates) {
    const day = dayNumber(date);
    run = day === previousDay + 1 ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    previousDay = day;
  }

  // O dia atual ainda pode ser concluído, preservando uma sequência até ontem.
  const daysSinceLastStudy = dayNumber(todayStr) - previousDay;
  const currentStreak = daysSinceLastStudy <= 1 ? run : 0;

  return { todayStr, studiedDatesSet, dataInicioEstudo: dates[0] ?? null, currentStreak, bestStreak };
}

export type StudyStreak = ReturnType<typeof summarizeStudyStreak>;
