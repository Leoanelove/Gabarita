import React from 'react';
import { 
  Calendar, 
  Building2, 
  Briefcase, 
  Award, 
  HelpCircle, 
  Clock, 
  FileText, 
  X,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { Prova } from '../../types';
import { Button } from '../../design-system/Button';

export interface DetalhesProvaModalProps {
  prova: Prova | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (prova: Prova) => void;
  onDelete: (id: string) => void;
  onUpdateStatus?: (id: string, status: 'agendada' | 'em_andamento' | 'concluida') => void;
}

export const DetalhesProvaModal: React.FC<DetalhesProvaModalProps> = ({
  prova,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onUpdateStatus
}) => {
  if (!isOpen || !prova) return null;

  const diffDays = prova.examDate 
    ? Math.ceil((new Date(prova.examDate).getTime() - new Date().getTime()) / 86400000)
    : null;

  const getStatusBadge = () => {
    switch (prova.status) {
      case 'concluida':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Concluída / Realizada
          </span>
        );
      case 'em_andamento':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <AlertCircle className="w-3.5 h-3.5" /> Em Andamento
          </span>
        );
      case 'agendada':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30">
            <Calendar className="w-3.5 h-3.5" /> Agendada
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {prova.category || 'CONCURSO'}
              </span>
              {getStatusBadge()}
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
              {prova.organ}
            </h3>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {prova.role}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Grid de Metadados */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Award className="w-3 h-3" /> Banca
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {prova.banca || 'Não informada'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Data da Prova
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {prova.examDate 
                  ? new Date(prova.examDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                  : (prova.year ? `${prova.year}` : 'A definir')}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Contagem
              </span>
              <span className={`text-xs font-bold ${diffDays !== null && diffDays <= 30 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {diffDays !== null ? (diffDays > 0 ? `${diffDays} dias restantes` : diffDays === 0 ? 'Hoje!' : 'Realizada') : '-'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <HelpCircle className="w-3 h-3" /> Questões
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {prova.questionsCount || 100} questões
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Tempo de Prova
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {Math.floor((prova.durationMinutes || 240) / 60)}h {(prova.durationMinutes || 240) % 60}m
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Ano de Referência
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {prova.year || new Date().getFullYear()}
              </span>
            </div>
          </div>

          {/* Anotações e Lembrete */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/80 space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-500" />
              Anotações, Lembretes & Gabarito
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {prova.notes?.trim() || 'Nenhuma anotação registrada ainda para este caderno/lembrete de prova.'}
            </p>
          </div>

          {/* Quick status change */}
          {onUpdateStatus && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400">
                Alterar status rápido:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onUpdateStatus(prova.id, 'agendada')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    prova.status === 'agendada' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Agendada
                </button>
                <button
                  onClick={() => onUpdateStatus(prova.id, 'em_andamento')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    prova.status === 'em_andamento' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Em Andamento
                </button>
                <button
                  onClick={() => onUpdateStatus(prova.id, 'concluida')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    prova.status === 'concluida' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Concluída
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => {
              onClose();
              onDelete(prova.id);
            }}
            className="text-xs font-semibold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Excluir Prova
          </button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(prova);
              }}
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            >
              Editar Informações
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onClose}
            >
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
