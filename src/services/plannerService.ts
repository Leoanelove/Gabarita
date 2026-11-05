import { 
  Disciplina, 
  Assunto, 
  Revisao, 
  Questao, 
  StudyPlan, 
  PlannedSession, 
  WeeklyAvailability, 
  DayOfWeek, 
  PlanConflict, 
  DisciplinaAllocation, 
  PlanHistoryLog,
  PlanSessionType 
} from '../types';

export class PlannerService {
  static readonly DAYS_OF_WEEK: DayOfWeek[] = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

  static getDayOfWeekFromDate(date: Date): DayOfWeek {
    const day = date.getDay();
    const map: Record<number, DayOfWeek> = {
      0: 'dom',
      1: 'seg',
      2: 'ter',
      3: 'qua',
      4: 'qui',
      5: 'sex',
      6: 'sab',
    };
    return map[day];
  }

  static parseLocalDate(dateStr: string): Date {
    const parts = dateStr.split('-');
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }

  static formatLocalDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  static calculateDistribution(
    disciplinas: Disciplina[],
    assuntos: Assunto[],
    questoes: Questao[],
    weeklyTotalMinutes: number
  ): DisciplinaAllocation[] {
    if (disciplinas.length === 0) return [];
    interface ScoredDisc {
      disc: Disciplina;
      score: number;
      progressPercent: number;
      accuracyRate: number;
      difficulty: 'facil' | 'media' | 'dificil';
      importance: 'alta' | 'media' | 'baixa';
    }
    const scoredList: ScoredDisc[] = disciplinas.map(disc => {
      const discTopics = assuntos.filter(a => a.disciplinaId === disc.id);
      const totalTopics = discTopics.length || 1;
      const completedTopics = discTopics.filter(a => a.completed || a.status === 'dominado').length;
      const progressPercent = Math.round((completedTopics / totalTopics) * 100);

      const accuracyRate = discTopics.reduce((acc, t) => acc + (t.accuracyRate || 0), 0) / (discTopics.length || 1) || 75;
      const weightFactor = disc.weight || 2.0;

      const hardCount = discTopics.filter(t => t.difficulty === 'dificil').length;
      const easyCount = discTopics.filter(t => t.difficulty === 'facil').length;
      let difficultyFactor = 1.0;
      let avgDifficulty: 'facil' | 'media' | 'dificil' = 'media';
      if (hardCount >= discTopics.length * 0.4) {
        difficultyFactor = 1.35;
        avgDifficulty = 'dificil';
      } else if (easyCount >= discTopics.length * 0.5) {
        difficultyFactor = 0.8;
        avgDifficulty = 'facil';
      }

      const highImpCount = discTopics.filter(t => t.importance === 'alta').length;
      let importanceFactor = 1.0;
      if (highImpCount >= discTopics.length * 0.4) {
        importanceFactor = 1.3;
      } else if (discTopics.some(t => t.importance === 'baixa')) {
        importanceFactor = 0.85;
      }

      const progressFactor = Math.max(0.6, 1.3 - (progressPercent / 100) * 0.6);
      let performanceFactor = 1.0;
      if (accuracyRate < 60) {
        performanceFactor = 1.3;
      } else if (accuracyRate > 85) {
        performanceFactor = 0.85;
      }

      const totalScore = weightFactor * difficultyFactor * importanceFactor * progressFactor * performanceFactor;
      return {
        disc,
        score: totalScore,
        progressPercent,
        accuracyRate: Math.round(accuracyRate),
        difficulty: avgDifficulty,
        importance: 'alta',
      };
    });

    const sumScores = scoredList.reduce((acc, item) => acc + item.score, 0) || 1;
    return scoredList.map(item => {
      const share = item.score / sumScores;
      const allocatedMinutes = Math.round(weeklyTotalMinutes * share);
      return {
        disciplinaId: item.disc.id,
        disciplinaName: item.disc.name,
        color: item.disc.color,
        weight: item.disc.weight,
        difficulty: item.difficulty,
        importance: item.importance,
        progressPercent: item.progressPercent,
        accuracyRate: item.accuracyRate,
        allocatedMinutesPerWeek: allocatedMinutes,
        allocatedPercentage: Math.round(share * 100),
      };
    });
  }

  static sliceDailyMinutesIntoBlocks(
    totalDayMinutes: number,
    minMinutes: number,
    maxMinutes: number
  ): number[] {
    if (totalDayMinutes <= 0) return [];

    const min = Math.max(15, minMinutes);
    const max = Math.max(min, maxMinutes);

    if (totalDayMinutes <= min) {
      return [totalDayMinutes];
    }

    const targetAvg = (min + max) / 2;
    let count = Math.max(1, Math.round(totalDayMinutes / targetAvg));

    while (count > 1 && totalDayMinutes / count < min) {
      count--;
    }
    while (totalDayMinutes / count > max) {
      count++;
    }

    const rawBase = Math.floor((totalDayMinutes / count) / 5) * 5;
    const baseDuration = Math.max(min, Math.min(max, rawBase));

    const blocks: number[] = new Array(count).fill(baseDuration);
    let remainder = totalDayMinutes - baseDuration * count;

    let idx = 0;
    while (remainder > 0) {
      const step = remainder >= 15 && blocks[idx] + 15 <= max ? 15 : 5;
      if (blocks[idx] + step <= max) {
        blocks[idx] += step;
        remainder -= step;
      } else {
        let placed = false;
        for (let j = 0; j < count; j++) {
          if (blocks[j] + step <= max) {
            blocks[j] += step;
            remainder -= step;
            placed = true;
            break;
          }
        }
        if (!placed) {
          blocks[blocks.length - 1] += remainder;
          remainder = 0;
        }
      }
      idx = (idx + 1) % count;
    }

    return blocks;
  }

  static generateSessions(
    planId: string,
    concursoId: string,
    startDateStr: string,
    targetExamDateStr: string,
    availability: WeeklyAvailability,
    disciplinas: Disciplina[],
    assuntos: Assunto[],
    revisoes: Revisao[],
    distribution: DisciplinaAllocation[],
    preservedSessions: PlannedSession[] = [],
    blockLimits: { minMinutes: number; maxMinutes: number } = { minMinutes: 25, maxMinutes: 45 }
  ): { sessions: PlannedSession[]; conflicts: PlanConflict[] } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = this.parseLocalDate(startDateStr);
    const examDate = this.parseLocalDate(targetExamDateStr);

    // Inclui tanto a data inicial quanto a data final do período (limitado a 366 dias / 1 ano)
    const rawDiffDays = Math.round((examDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalDays = Math.max(1, Math.min(rawDiffDays, 366));
    const finalSessions: PlannedSession[] = [
      ...preservedSessions.filter(s => s.status === 'concluida' && s.date >= startDateStr && s.date <= targetExamDateStr)
    ];

    const pendingReviews = revisoes.filter(r => r.status === 'pendente');
    let reviewIdx = 0;

    // Sanidade de limites: minDur e maxDur
    const minDur = Math.max(15, Math.min(blockLimits.minMinutes, blockLimits.maxMinutes));
    const maxDur = Math.max(minDur, blockLimits.maxMinutes);

    // Carga semanal em minutos
    const weeklyTotalMinutes = Object.values(availability).reduce((acc, val) => acc + (val || 0), 0);

    interface SubjectBalance {
      alloc: DisciplinaAllocation;
      remainingMinutes: number;
    }

    const initBalances = (): Record<string, SubjectBalance> => {
      const balances: Record<string, SubjectBalance> = {};
      distribution.forEach(d => {
        const target = d.allocatedMinutesPerWeek || Math.round(weeklyTotalMinutes * (d.allocatedPercentage / 100));
        balances[d.disciplinaId] = { alloc: d, remainingMinutes: target };
      });
      return balances;
    };

    let balances = initBalances();

    const topicIndices: Record<string, number> = {};
    distribution.forEach(d => {
      topicIndices[d.disciplinaId] = 0;
    });

    const planningHorizonDays = totalDays;

    for (let dayOffset = 0; dayOffset < planningHorizonDays; dayOffset++) {
      if (dayOffset > 0 && dayOffset % 7 === 0) {
        balances = initBalances();
      }

      const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + dayOffset);
      const currentDateStr = this.formatLocalDate(currentDate);

      // NUNCA gerar sessão para dias anteriores ao startDate escolhido pelo usuário ou após a data final
      if (currentDateStr < startDateStr || currentDateStr > targetExamDateStr) {
        continue;
      }

      const dayOfWeek = this.getDayOfWeekFromDate(currentDate);
      const dailyMinutes = availability[dayOfWeek] || 0;
      if (dailyMinutes <= 0) continue;

      const existingForDay = finalSessions.filter(s => s.date === currentDateStr);
      const existingMinutesForDay = existingForDay.reduce((acc, s) => acc + s.durationMinutes, 0);
      let dayRemaining = dailyMinutes - existingMinutesForDay;
      let slotOrder = existingForDay.length + 1;

      if (dayRemaining < minDur) continue;

      let lastScheduledDiscId: string | null = existingForDay.length > 0 ? existingForDay[existingForDay.length - 1].disciplinaId : null;

      // Calcula quantidade alvo de blocos para o dia
      const targetAverage = (minDur + maxDur) / 2;
      let targetBlockCount = Math.max(1, Math.round(dayRemaining / targetAverage));

      while (dayRemaining / targetBlockCount > maxDur) {
        targetBlockCount++;
      }
      while (targetBlockCount > 1 && dayRemaining / targetBlockCount < minDur) {
        targetBlockCount--;
      }

      interface DayBlock {
        alloc: DisciplinaAllocation;
        duration: number;
      }

      const dayBlocks: DayBlock[] = [];

      for (let b = 0; b < targetBlockCount; b++) {
        // Encaixa uma revisão no primeiro bloco se houver
        if (b === 0 && reviewIdx < pendingReviews.length) {
          const rev = pendingReviews[reviewIdx];
          const discAlloc = distribution.find(d => d.disciplinaId === rev.disciplinaId) || distribution[0];
          if (discAlloc) {
            const isPast = currentDate < today;
            const revDuration = Math.max(15, Math.min(45, Math.min(dayRemaining, maxDur)));
            const newSession: PlannedSession = {
              id: `plan_ses_rev_${currentDateStr}_${slotOrder}`,
              planId,
              concursoId,
              disciplinaId: discAlloc.disciplinaId,
              disciplinaName: discAlloc.disciplinaName,
              disciplinaColor: discAlloc.color,
              assuntoName: rev.assuntoName,
              date: currentDateStr,
              dayOfWeek,
              startTime: this.getSlotStartTime(slotOrder),
              durationMinutes: revDuration,
              type: 'revisao',
              status: isPast ? 'atrasada' : 'pendente',
              revisaoId: rev.id,
              notes: `Revisão do método ${rev.method} (Curva de Esquecimento)`,
              order: slotOrder++,
            };
            finalSessions.push(newSession);
            dayRemaining -= revDuration;
            reviewIdx++;
            lastScheduledDiscId = discAlloc.disciplinaId;
            if (dayRemaining < minDur) break;
            continue;
          }
        }

        const isLastBlock = b === targetBlockCount - 1;

        // Seleciona candidatos excluindo a última disciplina agendada (se houver mais de 1 disciplina)
        let candidates = Object.values(balances).filter(item => {
          if (distribution.length > 1 && item.alloc.disciplinaId === lastScheduledDiscId) {
            return false;
          }
          return true;
        });

        if (candidates.length === 0) {
          candidates = Object.values(balances);
        }

        candidates.sort((a, b) => b.remainingMinutes - a.remainingMinutes);
        const chosen = candidates[0];
        if (!chosen) break;

        const pct = chosen.alloc.allocatedPercentage || 10;
        const weightRatio = pct / 100;

        let proposedDuration: number;
        if (weightRatio >= 0.35) {
          proposedDuration = maxDur;
        } else if (weightRatio <= 0.15) {
          proposedDuration = minDur;
        } else {
          const mid = (minDur + maxDur) / 2;
          proposedDuration = Math.round(mid / 5) * 5;
        }

        proposedDuration = Math.max(minDur, Math.min(maxDur, proposedDuration));

        if (isLastBlock) {
          let finalDuration = dayRemaining;

          if (finalDuration > maxDur) {
            let excesso = finalDuration - maxDur;
            finalDuration = maxDur;
            for (const prev of dayBlocks) {
              const espaco = maxDur - prev.duration;
              const incremento = Math.min(espaco, excesso);
              prev.duration += incremento;
              excesso -= incremento;
              if (excesso <= 0) break;
            }
          } else if (finalDuration < minDur && dayBlocks.length > 0) {
            const diff = minDur - finalDuration;
            finalDuration = minDur;
            const prev = dayBlocks[dayBlocks.length - 1];
            if (prev.duration - diff >= minDur) {
              prev.duration -= diff;
            }
          }

          finalDuration = Math.max(minDur, Math.min(maxDur, finalDuration));
          dayBlocks.push({ alloc: chosen.alloc, duration: finalDuration });
          chosen.remainingMinutes -= finalDuration;
          dayRemaining = 0;
          lastScheduledDiscId = chosen.alloc.disciplinaId;
        } else {
          const remainingBlocksAfterThis = targetBlockCount - 1 - b;
          const maxAllowedForThisBlock = dayRemaining - (remainingBlocksAfterThis * minDur);

          let blockDuration = Math.min(proposedDuration, maxAllowedForThisBlock);
          blockDuration = Math.max(minDur, Math.min(maxDur, Math.round(blockDuration / 5) * 5));

          dayBlocks.push({ alloc: chosen.alloc, duration: blockDuration });
          dayRemaining -= blockDuration;
          chosen.remainingMinutes -= blockDuration;
          lastScheduledDiscId = chosen.alloc.disciplinaId;
        }
      }

      // Converte os dayBlocks em PlannedSessions garantindo NUNCA estourar o teto
      dayBlocks.forEach((block) => {
        const safeDuration = Math.max(minDur, Math.min(maxDur, block.duration));

        const discTopics = assuntos.filter(a => a.disciplinaId === block.alloc.disciplinaId);
        let unstudiedTopic: Assunto | undefined;
        if (discTopics.length > 0) {
          const idx = (topicIndices[block.alloc.disciplinaId] || 0) % discTopics.length;
          unstudiedTopic = discTopics[idx];
          topicIndices[block.alloc.disciplinaId] = idx + 1;
        }

        let sessionType: PlanSessionType = 'teoria';
        if (dayOfWeek === 'sab' || dayOfWeek === 'dom') {
          sessionType = 'questoes';
        } else if (unstudiedTopic && unstudiedTopic.status === 'em_estudo') {
          sessionType = 'questoes';
        }

        const isPast = currentDate < today;
        const newSession: PlannedSession = {
          id: `plan_ses_${currentDateStr}_${slotOrder}`,
          planId,
          concursoId,
          disciplinaId: block.alloc.disciplinaId,
          disciplinaName: block.alloc.disciplinaName,
          disciplinaColor: block.alloc.color,
          assuntoId: unstudiedTopic?.id,
          assuntoName: unstudiedTopic?.name || 'Estudo Dirigido',
          date: currentDateStr,
          dayOfWeek,
          startTime: this.getSlotStartTime(slotOrder),
          durationMinutes: safeDuration,
          type: sessionType,
          status: isPast ? 'atrasada' : 'pendente',
          notes: unstudiedTopic?.notes || `Meta: avançar em tópicos (${block.alloc.allocatedPercentage}% da carga)`,
          order: slotOrder++,
        };

        finalSessions.push(newSession);
      });
    }

    const validSessions = finalSessions.filter(
      s => s.date >= startDateStr && s.date <= targetExamDateStr
    );
    const conflicts = this.detectConflicts(validSessions, availability, targetExamDateStr, assuntos);
    return { sessions: validSessions, conflicts };
  }

  private static interleaveSubjects(items: DisciplinaAllocation[]): DisciplinaAllocation[] {
    if (items.length <= 1) return items;
    const groups: Record<string, DisciplinaAllocation[]> = {};
    items.forEach(item => {
      if (!groups[item.disciplinaId]) groups[item.disciplinaId] = [];
      groups[item.disciplinaId].push(item);
    });
    const result: DisciplinaAllocation[] = [];
    const keys = Object.keys(groups);
    let hasMore = true;
    let round = 0;
    while (hasMore) {
      hasMore = false;
      for (const k of keys) {
        if (groups[k].length > round) {
          result.push(groups[k][round]);
          hasMore = true;
        }
      }
      round++;
    }
    return result;
  }

  private static getSlotStartTime(slotOrder: number): string {
    const times = ['08:00', '09:15', '10:30', '14:00', '15:15', '19:00', '20:15'];
    return times[(slotOrder - 1) % times.length];
  }

  static detectConflicts(
    sessions: PlannedSession[],
    availability: WeeklyAvailability,
    examDateStr: string,
    assuntos: Assunto[]
  ): PlanConflict[] {
    const conflicts: PlanConflict[] = [];
    const todayStr = this.formatLocalDate(new Date());
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueSessions = sessions.filter(s => s.status === 'atrasada' || (s.date < todayStr && s.status === 'pendente'));
    if (overdueSessions.length > 0) {
      conflicts.push({
        id: 'conf_overdue',
        type: 'data_ultrapassada',
        severity: overdueSessions.length > 3 ? 'alta' : 'media',
        message: `${overdueSessions.length} sessão(ões) está(ão) atrasada(s) em relação ao cronograma previsto.`,
        suggestion: 'Utilize o botão "Reagendar Atrasadas" para redistribuir os blocos nos dias livres.',
        affectedSessionIds: overdueSessions.map(s => s.id),
      });
    }

    const sessionsByDate: Record<string, PlannedSession[]> = {};
    sessions.forEach(s => {
      if (!sessionsByDate[s.date]) sessionsByDate[s.date] = [];
      sessionsByDate[s.date].push(s);
    });

    Object.entries(sessionsByDate).forEach(([dateStr, daySessions]) => {
      const firstSes = daySessions[0];
      const limitMinutes = availability[firstSes.dayOfWeek] || 0;
      const totalPlanned = daySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
      if (totalPlanned > limitMinutes && limitMinutes > 0) {
        conflicts.push({
          id: `conf_excess_${dateStr}`,
          type: 'carga_excessiva',
          severity: 'alta',
          date: dateStr,
          message: `Dia ${dateStr} possui ${totalPlanned} min planejados para um limite de ${limitMinutes} min (${firstSes.dayOfWeek.toUpperCase()}).`,
          suggestion: 'Mova uma das sessões para o final de semana.',
          affectedSessionIds: daySessions.map(s => s.id),
        });
      }
    });

    const examDate = this.parseLocalDate(examDateStr);
    const daysUntilExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const uncompletedTopics = assuntos.filter(a => !a.completed && a.status !== 'dominado').length;
    if (daysUntilExam > 0 && daysUntilExam < 30 && uncompletedTopics > 40) {
      conflicts.push({
        id: 'conf_tight_deadline',
        type: 'prazo_apertado',
        severity: 'alta',
        message: `Faltam apenas ${daysUntilExam} dias para a prova e restam ${uncompletedTopics} tópicos do edital.`,
        suggestion: 'Priorize tópicos de peso e importância "Alta" no edital.',
      });
    }

    return conflicts;
  }

  static recalculatePlan(
    currentPlan: StudyPlan,
    disciplinas: Disciplina[],
    assuntos: Assunto[],
    revisoes: Revisao[],
    questoes: Questao[],
    customAvailability?: WeeklyAvailability,
    newExamDate?: string
  ): StudyPlan {
    const now = new Date();
    const todayStr = this.formatLocalDate(now);
    const effectiveStartDate =
      currentPlan.startDate && currentPlan.startDate > todayStr
        ? currentPlan.startDate
        : todayStr;
    const targetExamDate = newExamDate || currentPlan.targetExamDate;
    const availability = customAvailability || currentPlan.weeklyAvailability;
    const weeklyTotalMinutes = Object.values(availability).reduce((a, b) => a + b, 0);
    const dailyAverageMinutes = Math.round(weeklyTotalMinutes / 7);

    const preservedCompletedSessions = currentPlan.sessions.filter(
      s => s.status === 'concluida' && s.date >= effectiveStartDate
    );
    const newDistribution =
      currentPlan.disciplinasDistribution && currentPlan.disciplinasDistribution.length > 0
        ? currentPlan.disciplinasDistribution
        : this.calculateDistribution(
            disciplinas,
            assuntos,
            questoes,
            weeklyTotalMinutes
          );

    const { sessions: newFutureSessions, conflicts } = this.generateSessions(
      currentPlan.id,
      currentPlan.concursoId,
      effectiveStartDate,
      targetExamDate,
      availability,
      disciplinas,
      assuntos,
      revisoes,
      newDistribution,
      preservedCompletedSessions
    );

    const newLog: PlanHistoryLog = {
      id: `log_recalc_${Date.now()}`,
      planId: currentPlan.id,
      action: 'recalculo',
      timestamp: now.toISOString(),
      description: `Plano recalculado com sucesso. ${preservedCompletedSessions.length} sessões concluídas mantidas intactas.`,
      preservedCompletedCount: preservedCompletedSessions.length,
      totalStudyMinutes: preservedCompletedSessions.reduce((acc, s) => acc + s.durationMinutes, 0),
    };

    const startObj = this.parseLocalDate(effectiveStartDate);
    const examDate = this.parseLocalDate(targetExamDate);
    const totalDays = Math.max(1, Math.round((examDate.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const totalWeeks = Math.max(1, Math.ceil(totalDays / 7));

    return {
      ...currentPlan,
      startDate: effectiveStartDate,
      targetExamDate,
      weeklyAvailability: availability,
      dailyAverageMinutes,
      totalWeeks,
      totalPlannedHours: Math.round((newFutureSessions.reduce((acc, s) => acc + s.durationMinutes, 0)) / 60),
      disciplinasDistribution: newDistribution,
      sessions: newFutureSessions,
      conflicts,
      historyLogs: [newLog, ...(currentPlan.historyLogs || [])],
      updatedAt: now.toISOString(),
    };
  }

  static redistributeOverdueSessions(
    plan: StudyPlan,
    mode: 'today' | 'spread' = 'spread',
    targetDateStr?: string
  ): { updatedSessions: PlannedSession[]; count: number } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = this.formatLocalDate(today);
    const destinationDate = targetDateStr || todayStr;

    const overdueSessions = plan.sessions.filter(s => 
      s.status === 'atrasada' || (s.status === 'pendente' && s.date < todayStr)
    );
    if (overdueSessions.length === 0) {
      return { updatedSessions: plan.sessions, count: 0 };
    }

    const overdueIds = new Set(overdueSessions.map(s => s.id));
    const nonOverdueSessions = plan.sessions.filter(s => !overdueIds.has(s.id));
    let rescheduledOverdue: PlannedSession[] = [];

    if (mode === 'today') {
      const parsedDest = this.parseLocalDate(destinationDate);
      const dayOfWeek = this.getDayOfWeekFromDate(parsedDest);
      rescheduledOverdue = overdueSessions.map(s => ({
        ...s,
        originalDate: s.originalDate || s.date,
        date: destinationDate,
        dayOfWeek,
        status: 'reagendada' as const,
        rescheduledReason: `Transferida para hoje (${destinationDate})`,
      }));
    } else {
      const dailyMinutesMap: Record<string, number> = {};
      nonOverdueSessions.forEach(s => {
        dailyMinutesMap[s.date] = (dailyMinutesMap[s.date] || 0) + s.durationMinutes;
      });
      let dayIndex = 0;
      rescheduledOverdue = overdueSessions.map(s => {
        let assignedDate = destinationDate;
        let assignedDayOfWeek = this.getDayOfWeekFromDate(this.parseLocalDate(destinationDate));
        for (let offset = 0; offset < 14; offset++) {
          const candidateDate = new Date(today);
          candidateDate.setDate(today.getDate() + (dayIndex + offset) % 14);
          const candidateStr = this.formatLocalDate(candidateDate);
          const dow = this.getDayOfWeekFromDate(candidateDate);
          const limit = plan.weeklyAvailability[dow] || 0;
          const currentLoad = dailyMinutesMap[candidateStr] || 0;
          if (currentLoad + s.durationMinutes <= limit || limit === 0) {
            assignedDate = candidateStr;
            assignedDayOfWeek = dow;
            dailyMinutesMap[candidateStr] = currentLoad + s.durationMinutes;
            dayIndex = (dayIndex + offset + 1) % 14;
            break;
          }
        }
        return {
          ...s,
          originalDate: s.originalDate || s.date,
          date: assignedDate,
          dayOfWeek: assignedDayOfWeek,
          status: 'reagendada' as const,
          rescheduledReason: `Redistribuída para ${assignedDate}`,
        };
      });
    }

    const mergedSessions = [...nonOverdueSessions, ...rescheduledOverdue].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.startTime || '00:00').localeCompare(b.startTime || '00:00');
    });

    return {
      updatedSessions: mergedSessions,
      count: overdueSessions.length,
    };
  }
}
