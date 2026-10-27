import { StudyCycle, CycleBlock, Disciplina, Assunto } from '../types';

export interface CycleDistributionItem {
  disciplina: Disciplina;
  importancia?: number;
  conhecimento?: number;
  percentage: number;
  score?: number;
}

export class CycleService {
  /**
   * Algoritmo de Intercalação sem Repetição Sequencial (Strict Interleaving)
   * Regras mandatórias:
   * 1. Nenhum bloco consecutivo pode ser da mesma disciplina (bloco_i.disciplinaId !== bloco_{i-1}.disciplinaId).
   * 2. Se uma disciplina tiver mais blocos que as outras, distribui-a espaçada de maneira uniforme
   *    (Weighted Stride / Bresenham) entre as outras matérias.
   * 3. Nunca empilha blocos repetidos no final da lista.
   */
  static strictInterleaveBlocks(blocks: CycleBlock[]): CycleBlock[] {
    if (blocks.length <= 1) {
      return blocks.map((b, idx) => ({
        ...b,
        order: idx + 1,
        status: idx === 0 ? 'em_andamento' : 'aguardando',
        elapsedMinutes: 0,
      }));
    }

    // Agrupa os blocos por disciplina preservando a ordem interna de tópicos
    const byDisc = new Map<string, CycleBlock[]>();
    blocks.forEach(b => {
      const list = byDisc.get(b.disciplinaId) || [];
      list.push(b);
      byDisc.set(b.disciplinaId, list);
    });

    // Se existe apenas 1 disciplina no ciclo
    if (byDisc.size <= 1) {
      return blocks.map((b, idx) => ({
        ...b,
        order: idx + 1,
        status: idx === 0 ? 'em_andamento' : 'aguardando',
        elapsedMinutes: 0,
      }));
    }

    // Identifica se há uma disciplina dominante cujo total de blocos supera a soma das demais + 1
    let domDiscId: string | null = null;
    let domCount = 0;
    let othersCount = 0;

    byDisc.forEach((list, discId) => {
      if (list.length > domCount) {
        domCount = list.length;
        domDiscId = discId;
      }
    });

    othersCount = blocks.length - domCount;

    // Se a disciplina dominante tiver mais blocos que a capacidade teórica de intercalação sem repetição (domCount > othersCount + 1),
    // aplicamos a distribuição uniforme particionada (Bresenham Partitioning) para espaçá-la uniformemente entre as demais matérias,
    // garantindo que nunca haja blocos empilhados no final.
    if (domDiscId && domCount > othersCount + 1 && othersCount > 0) {
      const domBlocks = [...(byDisc.get(domDiscId) || [])];
      const otherBlocks: CycleBlock[] = [];
      byDisc.forEach((list, discId) => {
        if (discId !== domDiscId) {
          otherBlocks.push(...list);
        }
      });

      // Intercala recursivamente as demais matérias entre si
      const interleavedOthers = this.strictInterleaveBlocks(otherBlocks);
      const M = interleavedOthers.length;
      // Há M + 1 posições/divisores ao redor das outras matérias
      const numSlots = M + 1;
      const slots: CycleBlock[][] = Array.from({ length: numSlots }, () => []);

      // Distribui os blocos da matéria dominante uniformemente pelos slots usando Bresenham Stride
      for (let k = 0; k < domBlocks.length; k++) {
        const slotIdx = Math.min(numSlots - 1, Math.floor((k * numSlots) / domBlocks.length));
        slots[slotIdx].push(domBlocks[k]);
      }

      // Monta o resultado intercalando slots e blocos das outras matérias
      const result: CycleBlock[] = [];
      for (let i = 0; i < M; i++) {
        if (slots[i].length > 0) {
          result.push(...slots[i]);
        }
        result.push(interleavedOthers[i]);
      }
      if (slots[M].length > 0) {
        result.push(...slots[M]);
      }

      return result.map((blk, idx) => ({
        ...blk,
        order: idx + 1,
        status: idx === 0 ? 'em_andamento' : 'aguardando',
        elapsedMinutes: 0,
      }));
    }

    // Caso padrão (domCount <= othersCount + 1): Intercalação gulosa ponderada com Stride Spacing
    const initialTotals = new Map<string, number>();
    byDisc.forEach((list, discId) => {
      initialTotals.set(discId, list.length);
    });

    const totalBlocks = blocks.length;
    const result: CycleBlock[] = [];
    let lastDiscId: string | null = null;

    const queues = new Map<string, CycleBlock[]>();
    byDisc.forEach((list, discId) => {
      queues.set(discId, [...list]);
    });

    for (let s = 0; s < totalBlocks; s++) {
      const remainingTotal = totalBlocks - s;
      const activeEntries = Array.from(queues.entries()).filter(([_, q]) => q.length > 0);
      if (activeEntries.length === 0) break;

      const validCandidates = activeEntries.filter(([discId]) => discId !== lastDiscId);

      if (validCandidates.length > 0) {
        // Disciplina crítica: se remaining * 2 >= remainingTotal, deve ser consumida imediatamente
        const critical = validCandidates.find(([_, q]) => q.length * 2 >= remainingTotal);

        let chosenDiscId: string;

        if (critical) {
          chosenDiscId = critical[0];
        } else {
          let bestDiscId = validCandidates[0][0];
          let bestScore = -Infinity;

          for (const [discId, q] of validCandidates) {
            const rem = q.length;
            const initTotal = initialTotals.get(discId) || 1;
            const placed = initTotal - rem;

            const idealPos = (placed + 0.5) * (totalBlocks / initTotal);
            const overdue = s - idealPos;

            const score = rem * 1000 + overdue;
            if (score > bestScore) {
              bestScore = score;
              bestDiscId = discId;
            }
          }

          chosenDiscId = bestDiscId;
        }

        const pickedBlock = queues.get(chosenDiscId)!.shift()!;
        result.push(pickedBlock);
        lastDiscId = chosenDiscId;
      } else {
        // Fallback defensivo: se apenas uma matéria sobrou e ela coincide com lastDiscId,
        // NUNCA empilha no final. Insere retroativamente no melhor vão seguro.
        const [remainingDiscId, q] = activeEntries[0];
        const block = q.shift()!;
        let inserted = false;

        const safeSlots: number[] = [];
        if (result.length > 0 && result[0].disciplinaId !== block.disciplinaId) {
          safeSlots.push(0);
        }
        for (let i = 1; i < result.length; i++) {
          if (
            result[i - 1].disciplinaId !== block.disciplinaId &&
            result[i].disciplinaId !== block.disciplinaId
          ) {
            safeSlots.push(i);
          }
        }

        if (safeSlots.length > 0) {
          const chosenSlot = safeSlots[Math.floor(safeSlots.length / 2)];
          result.splice(chosenSlot, 0, block);
          inserted = true;
        }

        if (!inserted) {
          for (let i = 1; i < result.length - 1; i++) {
            if (
              result[i].disciplinaId !== block.disciplinaId &&
              result[i - 1].disciplinaId !== block.disciplinaId &&
              result[i + 1].disciplinaId !== block.disciplinaId
            ) {
              const displaced = result[i];
              result[i] = block;
              result.push(displaced);
              inserted = true;
              break;
            }
          }
        }

        if (!inserted) {
          result.push(block);
        }

        lastDiscId = result[result.length - 1]?.disciplinaId || null;
      }
    }

    // Segunda passagem de blindagem: varre qualquer duplicata adjacente remanescente e corrige por swap
    for (let i = 1; i < result.length; i++) {
      if (result[i].disciplinaId === result[i - 1].disciplinaId) {
        for (let j = 0; j < result.length; j++) {
          if (Math.abs(j - i) <= 1) continue;
          const candidate = result[j];
          if (candidate.disciplinaId !== result[i].disciplinaId) {
            const fitsAtI =
              candidate.disciplinaId !== result[i - 1].disciplinaId &&
              (i + 1 >= result.length || candidate.disciplinaId !== result[i + 1].disciplinaId);
            const fitsAtJ =
              (j === 0 || result[i].disciplinaId !== result[j - 1].disciplinaId) &&
              (j + 1 >= result.length || result[i].disciplinaId !== result[j + 1].disciplinaId);

            if (fitsAtI && fitsAtJ) {
              const temp = result[i];
              result[i] = result[j];
              result[j] = temp;
              break;
            }
          }
        }
      }
    }

    return result.map((blk, idx) => ({
      ...blk,
      order: idx + 1,
      status: idx === 0 ? 'em_andamento' : 'aguardando',
      elapsedMinutes: 0,
    }));
  }

  /**
   * Cálculo de Proporção Real por Matéria e Montagem dos Blocos do Ciclo
   * - A porcentagem de relevância calculada define o tempo total em minutos da matéria na volta do ciclo,
   *   com base nas horas de estudo por semana escolhidas (ex.: 30h = 1800 min).
   * - Divide o tempo total da matéria pela duração média configurada para gerar o número de blocos proporcional.
   *   Matérias de maior relevância recebem mais blocos, e não apenas minutos maiores.
   * - Cada bloco respeita estritamente a faixa [minBlockMinutes, maxBlockMinutes]
   *   com arredondamentos em múltiplos limpos de 5 ou 10 minutos.
   */
  static createStudyBlocks(params: {
    calculatedDistribution: CycleDistributionItem[];
    assuntos: Assunto[];
    weeklyHours: number;
    minBlockMinutes: number;
    maxBlockMinutes: number;
    cycleId?: string;
  }): CycleBlock[] {
    const {
      calculatedDistribution,
      assuntos,
      weeklyHours,
      minBlockMinutes,
      maxBlockMinutes,
      cycleId = `cycle_${Date.now()}`,
    } = params;

    if (!calculatedDistribution || calculatedDistribution.length === 0) {
      return [];
    }

    // Horas semanais convertidas em minutos para o ciclo (mínimo de 6 horas / 360 min)
    const totalLapMinutes = Math.max(360, Math.round(weeklyHours * 60));

    // Normaliza limites de duração configurados
    const minDur = Math.max(10, Math.min(minBlockMinutes, maxBlockMinutes));
    const maxDur = Math.max(minDur, Math.max(minBlockMinutes, maxBlockMinutes));

    // Duração média de referência para os blocos, arredondada em múltiplos de 5 min
    const targetBlockDuration = Math.max(
      minDur,
      Math.min(maxDur, Math.round(((minDur + maxDur) / 2) / 5) * 5)
    );

    // Passo 1: Calcula minutos alocados e número preliminar de blocos por matéria
    interface SubjectPlan {
      item: CycleDistributionItem;
      allocatedMinutes: number;
      numBlocks: number;
      blockDurations: number[];
    }

    const plans: SubjectPlan[] = calculatedDistribution.map(item => {
      const pct = Math.max(0, item.percentage || 0);
      const allocatedMinutes = Math.round((pct / 100) * totalLapMinutes);

      if (allocatedMinutes <= minDur) {
        return {
          item,
          allocatedMinutes,
          numBlocks: 1,
          blockDurations: [minDur],
        };
      }

      // Proporção de blocos: matérias de maior relevância ganham mais blocos
      let numBlocks = Math.max(1, Math.round(allocatedMinutes / targetBlockDuration));

      if (allocatedMinutes / numBlocks > maxDur) {
        numBlocks = Math.ceil(allocatedMinutes / maxDur);
      } else if (allocatedMinutes / numBlocks < minDur) {
        numBlocks = Math.max(1, Math.floor(allocatedMinutes / minDur));
      }

      return {
        item,
        allocatedMinutes,
        numBlocks,
        blockDurations: [],
      };
    });

    // Passo 2: Otimização de intercalabilidade para múltiplos de 2 ou mais matérias
    // Se uma matéria tiver numBlocks > soma(outras) + 1, ajustamos a densidade de blocos
    // dentro de [minDur, maxDur] para assegurar a intercalação estrita sem repetição
    if (plans.length >= 2) {
      let maxPlanIdx = 0;
      for (let i = 1; i < plans.length; i++) {
        if (plans[i].numBlocks > plans[maxPlanIdx].numBlocks) {
          maxPlanIdx = i;
        }
      }

      let othersTotalBlocks = plans.reduce((acc, p, idx) => idx === maxPlanIdx ? acc : acc + p.numBlocks, 0);

      if (plans[maxPlanIdx].numBlocks > othersTotalBlocks + 1) {
        // Tenta expandir o número de blocos das outras disciplinas reduzindo a duração média delas em direção a minDur
        for (let i = 0; i < plans.length; i++) {
          if (i === maxPlanIdx) continue;
          const maxPossible = Math.floor(plans[i].allocatedMinutes / minDur);
          if (maxPossible > plans[i].numBlocks) {
            const needed = (plans[maxPlanIdx].numBlocks - 1) - othersTotalBlocks;
            const toAdd = Math.min(needed, maxPossible - plans[i].numBlocks);
            plans[i].numBlocks += toAdd;
            othersTotalBlocks += toAdd;
            if (othersTotalBlocks + 1 >= plans[maxPlanIdx].numBlocks) break;
          }
        }

        // Se ainda exceder, tenta aumentar a duração dos blocos da dominante em direção a maxDur
        if (plans[maxPlanIdx].numBlocks > othersTotalBlocks + 1) {
          const minPossibleForDom = Math.ceil(plans[maxPlanIdx].allocatedMinutes / maxDur);
          const targetDomBlocks = Math.max(minPossibleForDom, othersTotalBlocks + 1);
          plans[maxPlanIdx].numBlocks = targetDomBlocks;
        }
      }
    }

    // Passo 3: Atribui durações individuais para cada bloco em múltiplos de 5 min
    plans.forEach(plan => {
      const numBlocks = plan.numBlocks;
      const allocated = plan.allocatedMinutes;

      if (numBlocks <= 1 && plan.blockDurations.length > 0) {
        return;
      }

      const avgMinutes = allocated / numBlocks;
      const baseDuration = Math.max(minDur, Math.min(maxDur, Math.round(avgMinutes / 5) * 5));
      const durations = new Array(numBlocks).fill(baseDuration);

      let currentSum = numBlocks * baseDuration;
      let diff = allocated - currentSum;

      while (diff >= 5) {
        let updated = false;
        for (let i = 0; i < numBlocks; i++) {
          if (durations[i] + 5 <= maxDur && diff >= 5) {
            durations[i] += 5;
            diff -= 5;
            updated = true;
          }
        }
        if (!updated) break;
      }

      while (diff <= -5) {
        let updated = false;
        for (let i = 0; i < numBlocks; i++) {
          if (durations[i] - 5 >= minDur && diff <= -5) {
            durations[i] -= 5;
            diff += 5;
            updated = true;
          }
        }
        if (!updated) break;
      }

      plan.blockDurations = durations;
    });

    // Passo 4: Gera a lista de CycleBlock associando tópicos e metadados
    const generatedBlocks: CycleBlock[] = [];
    let blockCounter = 1;

    plans.forEach(plan => {
      const disc = plan.item.disciplina;
      const discAssuntos = assuntos.filter(a => a.disciplinaId === disc.id);
      const unstudiedTopics = discAssuntos.filter(a => a.status === 'nao_iniciado');

      for (let b = 0; b < plan.numBlocks; b++) {
        const duration = plan.blockDurations[b] || targetBlockDuration;
        const suggestedTopic = unstudiedTopics[b] || discAssuntos[b % (discAssuntos.length || 1)];
        const topicName =
          suggestedTopic?.name ||
          (b === 0
            ? 'Estudo Teórico Dirigido'
            : b === 1
            ? 'Resolução de Questões de Fixação'
            : b === 2
            ? 'Revisão Tática & Lei Seca'
            : 'Exercícios & Aprofundamento');

        generatedBlocks.push({
          id: `blk_${Date.now()}_${blockCounter++}`,
          cycleId,
          disciplinaId: disc.id,
          disciplinaName: disc.name,
          disciplinaColor: disc.color || '#10b981',
          order: 0,
          durationMinutes: duration,
          weight: plan.item.importancia ?? disc.weight ?? 3,
          assuntoSugeridoId: suggestedTopic?.id,
          assuntoSugeridoName: topicName,
          status: 'aguardando',
          elapsedMinutes: 0,
        });
      }
    });

    // Aplica a intercalação estrita garantindo que nenhum bloco consecutivo seja da mesma disciplina
    return this.strictInterleaveBlocks(generatedBlocks);
  }

  /**
   * Constrói o objeto StudyCycle completo pronto para persistência e execução
   */
  static generateStudyCycle(params: {
    userId: string;
    concursoId: string;
    concursoTitle: string;
    calculatedDistribution: CycleDistributionItem[];
    assuntos: Assunto[];
    weeklyHours: number;
    minBlockMinutes: number;
    maxBlockMinutes: number;
  }): StudyCycle {
    const cycleId = `cycle_${params.concursoId || Date.now()}`;
    const blocks = this.createStudyBlocks({
      calculatedDistribution: params.calculatedDistribution,
      assuntos: params.assuntos,
      weeklyHours: params.weeklyHours,
      minBlockMinutes: params.minBlockMinutes,
      maxBlockMinutes: params.maxBlockMinutes,
      cycleId,
    });

    const totalMinutes = blocks.reduce((acc, b) => acc + b.durationMinutes, 0);

    return {
      id: cycleId,
      userId: params.userId,
      concursoId: params.concursoId,
      concursoTitle: params.concursoTitle,
      currentBlockIndex: 0,
      completedCyclesCount: 0,
      totalCycleMinutes: totalMinutes,
      blocks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Helper compatível com chamadas existentes
   */
  static generateCycle(
    userId: string,
    concursoId: string,
    concursoTitle: string,
    disciplinas: Disciplina[],
    assuntos: Assunto[],
    baseSlotDuration: number = 60
  ): StudyCycle {
    if (disciplinas.length === 0) {
      return {
        id: `cycle_${concursoId}_${Date.now()}`,
        userId,
        concursoId,
        concursoTitle,
        currentBlockIndex: 0,
        completedCyclesCount: 0,
        totalCycleMinutes: 0,
        blocks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const totalWeight = disciplinas.reduce((acc, d) => acc + (d.weight || 2), 0) || 1;
    const distribution: CycleDistributionItem[] = disciplinas.map(d => ({
      disciplina: d,
      importancia: d.weight || 2,
      percentage: Number((((d.weight || 2) / totalWeight) * 100).toFixed(1)),
    }));

    return this.generateStudyCycle({
      userId,
      concursoId,
      concursoTitle,
      calculatedDistribution: distribution,
      assuntos,
      weeklyHours: 30,
      minBlockMinutes: Math.max(15, Math.round(baseSlotDuration * 0.5)),
      maxBlockMinutes: Math.round(baseSlotDuration * 1.5),
    });
  }

  static interleaveBlocks(blocks: CycleBlock[]): CycleBlock[] {
    return this.strictInterleaveBlocks(blocks);
  }

  static advanceBlock(cycle: StudyCycle, minutesStudied?: number): StudyCycle {
    if (cycle.blocks.length === 0) return cycle;
    const currIdx = cycle.currentBlockIndex;
    const currentBlock = cycle.blocks[currIdx];
    const updatedBlocks = [...cycle.blocks];

    updatedBlocks[currIdx] = {
      ...currentBlock,
      status: 'concluido',
      elapsedMinutes: minutesStudied || currentBlock.durationMinutes,
      completedAt: new Date().toISOString(),
    };

    const nextIdx = (currIdx + 1) % cycle.blocks.length;
    let completedCycles = cycle.completedCyclesCount;

    if (nextIdx === 0) {
      completedCycles += 1;
      updatedBlocks.forEach((b, idx) => {
        b.status = idx === 0 ? 'em_andamento' : 'aguardando';
        b.elapsedMinutes = 0;
      });
    } else {
      updatedBlocks[nextIdx] = {
        ...updatedBlocks[nextIdx],
        status: 'em_andamento',
      };
    }

    return {
      ...cycle,
      currentBlockIndex: nextIdx,
      completedCyclesCount: completedCycles,
      blocks: updatedBlocks,
      updatedAt: new Date().toISOString(),
    };
  }

  static rewindBlock(cycle: StudyCycle): StudyCycle {
    if (cycle.blocks.length === 0) return cycle;
    const prevIdx = cycle.currentBlockIndex > 0 
      ? cycle.currentBlockIndex - 1 
      : cycle.blocks.length - 1;
    const updatedBlocks = cycle.blocks.map((b, idx) => {
      if (idx === prevIdx) {
        return { ...b, status: 'em_andamento' as const };
      }
      if (idx === cycle.currentBlockIndex) {
        return { ...b, status: 'aguardando' as const };
      }
      return b;
    });
    return {
      ...cycle,
      currentBlockIndex: prevIdx,
      blocks: updatedBlocks,
      updatedAt: new Date().toISOString(),
    };
  }

  static recordBlockProgress(cycle: StudyCycle, additionalMinutes: number): StudyCycle {
    if (cycle.blocks.length === 0) return cycle;
    const currIdx = cycle.currentBlockIndex;
    const currentBlock = cycle.blocks[currIdx];
    const newElapsed = (currentBlock.elapsedMinutes || 0) + additionalMinutes;

    if (newElapsed >= currentBlock.durationMinutes) {
      return this.advanceBlock(cycle, newElapsed);
    }

    const updatedBlocks = [...cycle.blocks];
    updatedBlocks[currIdx] = {
      ...currentBlock,
      elapsedMinutes: newElapsed,
      status: 'em_andamento',
    };

    return {
      ...cycle,
      blocks: updatedBlocks,
      updatedAt: new Date().toISOString(),
    };
  }

  static resetCurrentLap(cycle: StudyCycle): StudyCycle {
    const updatedBlocks = cycle.blocks.map((b, idx) => ({
      ...b,
      status: idx === 0 ? ('em_andamento' as const) : ('aguardando' as const),
      elapsedMinutes: 0,
      completedAt: undefined,
    }));
    return {
      ...cycle,
      currentBlockIndex: 0,
      blocks: updatedBlocks,
      updatedAt: new Date().toISOString(),
    };
  }
}
