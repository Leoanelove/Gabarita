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
  PlanSessionType,
  SessaoEstudo
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

  /**
   * Determina se uma sessão planejada foi efetivamente estudada pelo estudante
   * (seja por marcação direta no plano ou por registro de estudo em `sessoes`).
   */
  static isSessionStudied(session: PlannedSession, sessoes: SessaoEstudo[] = []): boolean {
    if (session.status === 'concluida') return true;
    if (!sessoes || sessoes.length === 0) return false;

    const sessionDate = session.date;
    return sessoes.some(st => {
      if (st.disciplinaId !== session.disciplinaId) return false;
      const studyDate = st.completedAt
        ? (st.completedAt.includes('T') ? st.completedAt.split('T')[0] : st.completedAt)
        : (st.createdAt ? (st.createdAt.includes('T') ? st.createdAt.split('T')[0] : st.createdAt) : '');

      // Se estudou na data planejada do bloco
      if (studyDate === sessionDate) {
        if (session.assuntoId && st.assuntoId) {
          return st.assuntoId === session.assuntoId;
        }
        return true;
      }

      // Se estudou o mesmo tópico em data posterior à planejada
      if (session.assuntoId && st.assuntoId && st.assuntoId === session.assuntoId && studyDate >= sessionDate) {
        return true;
      }

      return false;
    });
  }

  /**
   * Uma sessão só pode ser considerada atrasada se:
   * 1. A sua data já passou estritamente (session.date < todayStr) — ou seja,
   *    a notificação só deve aparecer NO DIA SEGUINTE ao dos blocos (nunca no próprio dia ou futuro).
   * 2. O estudante NÃO tiver estudado a sessão (nem marcada como concluída nem registrada em sessoes).
   */
  static isSessionOverdue(
    session: PlannedSession,
    todayStr: string,
    sessoes: SessaoEstudo[] = []
  ): boolean {
    // REGRA FUNDAMENTAL: Blocos do dia de hoje (ou de datas futuras) NUNCA são considerados atrasados.
    // A notificação de atraso só pode aparecer no dia seguinte ao dos blocos.
    if (!session.date || session.date >= todayStr) {
      return false;
    }

    // Se já estiver marcada como concluída
    if (session.status === 'concluida') {
      return false;
    }

    // Verifica se o usuário estudou a sessão no histórico
    if (this.isSessionStudied(session, sessoes)) {
      return false;
    }

    return true;
  }

  /**
   * Retorna apenas as sessões de dias anteriores que o usuário NÃO tiver estudado.
   */
  static getOverdueSessions(
    sessions: PlannedSession[],
    todayStr: string,
    sessoes: SessaoEstudo[] = []
  ): PlannedSession[] {
    if (!sessions || sessions.length === 0) return [];

    const usedSessaoIds = new Set<string>();

    return sessions.filter(session => {
      // Bloqueia qualquer sessão de hoje ou de datas futuras
      if (!session.date || session.date >= todayStr) return false;
      if (session.status === 'concluida') return false;

      // Procura correspondência no histórico de estudos
      const matchedSessao = (sessoes || []).find(st => {
        if (usedSessaoIds.has(st.id)) return false;
        if (st.disciplinaId !== session.disciplinaId) return false;
        const studyDate = st.completedAt
          ? (st.completedAt.includes('T') ? st.completedAt.split('T')[0] : st.completedAt)
          : (st.createdAt ? (st.createdAt.includes('T') ? st.createdAt.split('T')[0] : st.createdAt) : '');

        if (studyDate === session.date) {
          if (session.assuntoId && st.assuntoId) {
            return st.assuntoId === session.assuntoId;
          }
          return true;
        }

        if (session.assuntoId && st.assuntoId && st.assuntoId === session.assuntoId && studyDate >= session.date) {
          return true;
        }

        return false;
      });

      if (matchedSessao) {
        usedSessaoIds.add(matchedSessao.id);
        return false; // Estudada! Não está atrasada.
      }

      return true; // Não estudada e data passada -> atrasada!
    });
  }

  /**
   * Retorna os tópicos de uma disciplina ordenados rigorosamente pela ordem do edital verticalizado (1, 2, 3...).
   * Suporta correspondência por disciplinaId, por nome da disciplina, tópicos embutidos na disciplina ou no bundle ativo.
   */
  static getOrderedTopicsForDisciplina(
    disciplinaId: string,
    disciplinaName: string,
    allAssuntos: Assunto[] = [],
    allDisciplinas: Disciplina[] = []
  ): Assunto[] {
    const cleanDiscId = String(disciplinaId || '').trim();
    const cleanDiscName = String(disciplinaName || '').trim().toLowerCase();

    const matchedMap = new Map<string, Assunto>();

    // 1. Tópicos da lista geral de assuntos (por ID ou nome de disciplina)
    allAssuntos.forEach(a => {
      const aDiscId = String(a.disciplinaId || '').trim();
      const aDiscName = String((a as any).disciplinaName || '').trim().toLowerCase();

      if ((cleanDiscId && aDiscId === cleanDiscId) || (cleanDiscName && aDiscName && aDiscName === cleanDiscName)) {
        if (!matchedMap.has(a.id)) {
          matchedMap.set(a.id, a);
        }
      }
    });

    // 2. Tópicos embutidos na própria disciplina
    const foundDisc = allDisciplinas.find(d => 
      String(d.id).trim() === cleanDiscId || (d.name && d.name.trim().toLowerCase() === cleanDiscName)
    );
    if (foundDisc) {
      if ((foundDisc as any).assuntos && Array.isArray((foundDisc as any).assuntos)) {
        (foundDisc as any).assuntos.forEach((emb: any, idx: number) => {
          const embId = emb.id || `ass_emb_${foundDisc.id}_${idx}`;
          if (!matchedMap.has(embId)) {
            matchedMap.set(embId, {
              id: embId,
              disciplinaId: foundDisc.id,
              name: emb.name || 'Tópico',
              order: typeof emb.order === 'number' ? emb.order : idx + 1,
              importance: emb.importance || 'alta',
              difficulty: emb.difficulty || 'media',
              status: emb.status || 'nao_iniciado',
              completed: Boolean(emb.completed),
              masteryLevel: emb.masteryLevel || 0,
              totalQuestionsSolved: emb.totalQuestionsSolved || 0,
              correctQuestionsSolved: emb.correctQuestionsSolved || 0,
              accuracyRate: emb.accuracyRate || 0,
              createdAt: emb.createdAt || new Date().toISOString(),
            });
          }
        });
      } else if ((foundDisc as any).topicos && Array.isArray((foundDisc as any).topicos)) {
        (foundDisc as any).topicos.forEach((top: any, idx: number) => {
          const topName = typeof top === 'string' ? top : top.name;
          const topId = (typeof top === 'object' && top.id) ? top.id : `ass_top_${foundDisc.id}_${idx}`;
          if (!matchedMap.has(topId)) {
            matchedMap.set(topId, {
              id: topId,
              disciplinaId: foundDisc.id,
              name: topName || `Tópico ${idx + 1}`,
              order: typeof top.order === 'number' ? top.order : idx + 1,
              importance: top.importance || 'alta',
              difficulty: top.difficulty || 'media',
              status: top.status || 'nao_iniciado',
              completed: Boolean(top.completed),
              masteryLevel: 0,
              totalQuestionsSolved: 0,
              correctQuestionsSolved: 0,
              accuracyRate: 0,
              createdAt: new Date().toISOString(),
            });
          }
        });
      }
    }

    // 3. Verifica se há tópicos salvos no gabarita_active_contest em localStorage
    if (matchedMap.size === 0 && typeof window !== 'undefined') {
      try {
        const rawActive = localStorage.getItem('gabarita_active_contest');
        if (rawActive) {
          const bundle = JSON.parse(rawActive);
          const bundleDisc = (bundle?.disciplinas || []).find((d: any) =>
            String(d.id).trim() === cleanDiscId || (d.name && d.name.trim().toLowerCase() === cleanDiscName)
          );
          if (bundleDisc?.assuntos && Array.isArray(bundleDisc.assuntos)) {
            bundleDisc.assuntos.forEach((a: any, idx: number) => {
              const aId = a.id || `ass_bundle_${bundleDisc.id}_${idx}`;
              if (!matchedMap.has(aId)) {
                matchedMap.set(aId, a);
              }
            });
          }
        }
      } catch {}
    }

    const result = Array.from(matchedMap.values());

    // 4. Ordenação rigorosa pelo edital verticalizado: crescente pelo campo order (1, 2, 3...)
    result.sort((a, b) => {
      const orderA = typeof a.order === 'number' ? a.order : 9999;
      const orderB = typeof b.order === 'number' ? b.order : 9999;
      if (orderA !== orderB) return orderA - orderB;
      return (a.createdAt || '').localeCompare(b.createdAt || '');
    });

    return result;
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
    const todayStr = this.formatLocalDate(today);
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

    // Mapeamento e índices sequenciais de tópicos por disciplina seguindo rigorosamente o edital verticalizado
    const discTopicsMap: Record<string, Assunto[]> = {};
    const topicIndices: Record<string, number> = {};

    distribution.forEach(d => {
      const key = d.disciplinaId || d.disciplinaName;
      const topics = this.getOrderedTopicsForDisciplina(d.disciplinaId, d.disciplinaName, assuntos, disciplinas);
      discTopicsMap[key] = topics;
      // Dá continuidade com base em blocos concluídos prévios para não reiniciar do início se já houver progresso
      const completedCount = finalSessions.filter(
        s => (s.disciplinaId === d.disciplinaId || s.disciplinaName === d.disciplinaName) && s.status === 'concluida'
      ).length;
      topicIndices[key] = completedCount;
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
            const isPast = currentDateStr < todayStr;
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

        const discKey = block.alloc.disciplinaId || block.alloc.disciplinaName;
        let discTopics = discTopicsMap[discKey];
        if (!discTopics || discTopics.length === 0) {
          discTopics = this.getOrderedTopicsForDisciplina(
            block.alloc.disciplinaId,
            block.alloc.disciplinaName,
            assuntos,
            disciplinas
          );
          discTopicsMap[discKey] = discTopics;
        }

        let unstudiedTopic: Assunto | undefined;
        if (discTopics.length > 0) {
          const currentIdx = topicIndices[discKey] ?? 0;
          const topicIndex = currentIdx % discTopics.length;
          unstudiedTopic = discTopics[topicIndex];
          topicIndices[discKey] = currentIdx + 1;
        }

        let sessionType: PlanSessionType = 'teoria';
        if (dayOfWeek === 'sab' || dayOfWeek === 'dom') {
          sessionType = 'questoes';
        } else if (unstudiedTopic && unstudiedTopic.status === 'em_estudo') {
          sessionType = 'questoes';
        }

        const isPast = currentDateStr < todayStr;
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

  static movePlannedSession(
    sessions: PlannedSession[],
    sessionId: string,
    destinationDate: string,
    beforeSessionId: string | undefined,
    studySessions: SessaoEstudo[] = [],
  ): PlannedSession[] {
    const session = sessions.find(item => item.id === sessionId);
    if (!session) throw new Error('Bloco indisponível no cronograma.');
    if (beforeSessionId === sessionId) return sessions;

    const dateChanged = destinationDate !== session.date;
    if (dateChanged && this.isSessionStudied(session, studySessions)) {
      throw new Error('Um bloco concluído só pode ser reordenado no próprio dia.');
    }

    const getDay = (date: string) => sessions
      .filter(item => item.date === date)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const origin = getDay(session.date);
    const destination = (dateChanged ? getDay(destinationDate) : origin).filter(item => item.id !== sessionId);
    const position = beforeSessionId ? destination.findIndex(item => item.id === beforeSessionId) : destination.length;
    if (position < 0) throw new Error('A posição mudou. Tente mover o bloco novamente.');
    if (!dateChanged && origin[position]?.id === sessionId) return sessions;

    const moved: PlannedSession = dateChanged ? {
      ...session,
      date: destinationDate,
      dayOfWeek: this.getDayOfWeekFromDate(this.parseLocalDate(destinationDate)),
      originalDate: session.originalDate || session.date,
      status: 'reagendada',
      rescheduledReason: 'Movido no cronograma semanal.',
    } : session;

    destination.splice(position, 0, moved);
    const reordered = new Map<string, PlannedSession>();
    if (dateChanged) {
      origin.filter(item => item.id !== sessionId).forEach((item, index) => {
        reordered.set(item.id, { ...item, order: index + 1 });
      });
    }
    destination.forEach((item, index) => {
      reordered.set(item.id, { ...item, order: index + 1 });
    });
    return sessions.map(item => reordered.get(item.id) ?? item);
  }

  static detectConflicts(
    sessions: PlannedSession[],
    availability: WeeklyAvailability,
    examDateStr: string,
    assuntos: Assunto[],
    sessoes: SessaoEstudo[] = []
  ): PlanConflict[] {
    const conflicts: PlanConflict[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = this.formatLocalDate(today);

    const overdueSessions = this.getOverdueSessions(sessions, todayStr, sessoes);
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
    targetDateStr?: string,
    sessoes: SessaoEstudo[] = []
  ): { updatedSessions: PlannedSession[]; count: number } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = this.formatLocalDate(today);
    const destinationDate = targetDateStr || todayStr;

    const overdueSessions = this.getOverdueSessions(plan.sessions, todayStr, sessoes);
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
