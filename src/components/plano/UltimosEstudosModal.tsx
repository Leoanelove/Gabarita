import React, { useState, useMemo } from 'react';
import { Clock, X, ChevronDown, ChevronUp, BookOpen, CheckCircle2, HelpCircle } from 'lucide-react';
import { SessaoEstudo } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface UltimosEstudosModalProps {
  isOpen: boolean;
  onClose: () => void;
  disciplinaId: string;
  disciplinaNome: string;
  concursoId?: string;
  sessoes: SessaoEstudo[];
}

export const UltimosEstudosModal: React.FC<UltimosEstudosModalProps> = ({
  isOpen,
  onClose,
  disciplinaId,
  disciplinaNome,
  concursoId,
  sessoes,
}) => {
  const { palette } = useTheme();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filtra estritamente os dados reais do usuário e disciplina sem mocks (limite de 5)
  const recentRecords = useMemo(() => {
    if (!sessoes || sessoes.length === 0) return [];
    
    return sessoes
      .filter((s) => {
        const matchesDisc = s.disciplinaId === disciplinaId;
        const matchesConc = !concursoId || !s.concursoId || s.concursoId === concursoId;
        return matchesDisc && matchesConc;
      })
      .sort((a, b) => {
        const timeA = new Date(a.completedAt || a.createdAt).getTime();
        const timeB = new Date(b.completedAt || b.createdAt).getTime();
        return timeB - timeA;
      })
      .slice(0, 5);
  }, [sessoes, disciplinaId, concursoId]);

  if (!isOpen) return null;

  // Formatação de data em DD/MM/AA
  const formatDateToDDMMYY = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = String(d.getFullYear()).slice(-2);
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Capitalização da Categoria/Tipo
  const formatCategory = (type?: string) => {
    if (!type) return 'Estudo';
    const lower = type.toLowerCase();
    if (lower === 'teoria') return 'Teoria';
    if (lower === 'questoes' || lower === 'questões') return 'Questões';
    if (lower === 'revisao' || lower === 'revisão') return 'Revisão';
    if (lower === 'resumo') return 'Resumo';
    if (lower === 'simulado') return 'Simulado';
    if (lower === 'lei_seca') return 'Lei Seca';
    if (lower === 'jurisprudencia') return 'Jurisprudência';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Caixa do Modal */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]">
        
        {/* CABEÇALHO */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Últimos estudos
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              <span className="font-bold text-slate-700 dark:text-slate-300">{disciplinaNome}</span> • os 5 mais recentes
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Fechar"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CORPO DO MODAL */}
        <div className="p-4 sm:p-5 space-y-2 overflow-y-auto custom-scrollbar text-xs">
          {recentRecords.length === 0 ? (
            /* Estado Vazio Autêntico (Zero Mock Data) */
            <div className="py-12 px-4 text-center space-y-3">
              <div 
                className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
                style={{
                  backgroundColor: `${palette.primary}15`,
                  color: palette.primary,
                }}
              >
                <Clock className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Nenhum registro de estudo salvo ainda para esta matéria.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Inicie uma sessão pelo cronômetro para começar a registrar sua evolução.
                </p>
              </div>
            </div>
          ) : (
            /* Lista dos 5 Estudos Mais Recentes */
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {recentRecords.map((rec) => {
                const totalQ = rec.questionsAttempted || 0;
                const correctQ = rec.questionsCorrect || 0;
                const taxa = totalQ > 0 
                  ? (rec.accuracyRate !== undefined ? Math.round(rec.accuracyRate) : Math.round((correctQ / totalQ) * 100))
                  : null;
                const isExpanded = expandedId === rec.id;
                const hasDetails = !!(rec.notes || (rec.pageIntervals && rec.pageIntervals.length > 0) || (rec.videoaulas && rec.videoaulas.length > 0));

                return (
                  <div key={rec.id} className="py-3 space-y-2">
                    <div 
                      onClick={() => hasDetails && toggleExpand(rec.id)}
                      className={`flex items-center justify-between gap-2 sm:gap-3 p-2.5 rounded-2xl transition-colors ${
                        hasDetails ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50' : ''
                      }`}
                    >
                      {/* Data */}
                      <span className="font-mono text-slate-500 text-[11px] font-semibold shrink-0">
                        {formatDateToDDMMYY(rec.completedAt || rec.createdAt)}
                      </span>

                      {/* Categoria Real */}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shrink-0 border border-emerald-200 dark:border-emerald-800/50">
                        {formatCategory(rec.type)}
                      </span>

                      {/* Tópico Estudado */}
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate flex-1 min-w-0">
                        {rec.assuntoName || 'Tópico Geral'}
                      </span>

                      {/* Tempo Líquido */}
                      <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold shrink-0">
                        ⏱ {rec.durationMinutes}min
                      </span>

                      {/* Questões & Taxa de Acerto */}
                      <div className="shrink-0 flex items-center gap-1.5 min-w-[70px] justify-end">
                        {totalQ > 0 ? (
                          <span className="flex items-center gap-1">
                            <span className="text-slate-700 dark:text-slate-300 font-bold font-mono text-[11px]">
                              {correctQ}/{totalQ}
                            </span>
                            <span 
                              className={`px-1.5 py-0.5 rounded-md font-extrabold text-[10px] ${
                                taxa! >= 75 
                                  ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50' 
                                  : 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50'
                              }`}
                            >
                              {taxa}%
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">—</span>
                        )}
                      </div>

                      {/* Seta de Expansão */}
                      {hasDetails ? (
                        <button
                          type="button"
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      ) : (
                        <div className="w-6 shrink-0" />
                      )}
                    </div>

                    {/* Detalhes Expandidos (Anotações, Páginas Lidas, Vídeos) */}
                    {isExpanded && hasDetails && (
                      <div className="mx-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 space-y-1.5 animate-in fade-in duration-150">
                        {rec.notes && (
                          <p>
                            <strong className="text-slate-800 dark:text-slate-200 font-bold">Anotações: </strong>
                            {rec.notes}
                          </p>
                        )}
                        {rec.pageIntervals && rec.pageIntervals.length > 0 && (
                          <p>
                            <strong className="text-slate-800 dark:text-slate-200 font-bold">Páginas Lidas: </strong>
                            {rec.pageIntervals.map(p => `${p.inicio} a ${p.fim}`).join(', ')}
                          </p>
                        )}
                        {rec.videoaulas && rec.videoaulas.length > 0 && (
                          <p>
                            <strong className="text-slate-800 dark:text-slate-200 font-bold">Vídeoaulas: </strong>
                            {rec.videoaulas.map(v => v.titulo).join(', ')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RODAPÉ */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">
            Total de {recentRecords.length} registro(s) exibido(s)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
