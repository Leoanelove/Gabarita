import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Building2, 
  Briefcase, 
  Award, 
  HelpCircle, 
  Clock, 
  FileText, 
  X,
  Layers,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Prova, ProvaStatus } from '../../types';
import { Button } from '../../design-system/Button';
import { useTheme } from '../../contexts/ThemeContext';

export interface NovaProvaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProva: (provaData: Omit<Prova, 'id' | 'createdAt'>, id?: string) => Promise<void>;
  editingProva?: Prova | null;
}

const POPULAR_BANCAS = [
  'Cebraspe',
  'FGV',
  'FCC',
  'Vunesp',
  'Cesgranrio',
  'Idecan',
  'AOCP',
  'IBFC',
  'Quadrix',
  'Outra'
];

const CATEGORIES = [
  { id: 'TRIBUNAL', label: 'Tribunal' },
  { id: 'POLICIAL', label: 'Policial' },
  { id: 'FISCAL', label: 'Fiscal' },
  { id: 'CONTROLE', label: 'Controle / Gestão' },
  { id: 'ADMINISTRATIVO', label: 'Administrativo' },
  { id: 'JURÍDICO', label: 'Jurídico' },
  { id: 'BANCÁRIO', label: 'Bancário' },
  { id: 'SAÚDE', label: 'Saúde' },
  { id: 'EDUCAÇÃO', label: 'Educação' },
  { id: 'GERAL', label: 'Geral / Outros' }
];

export const NovaProvaModal: React.FC<NovaProvaModalProps> = ({
  isOpen,
  onClose,
  onSaveProva,
  editingProva
}) => {
  const { colorSkin } = useTheme();

  const [organ, setOrgan] = useState('');
  const [role, setRole] = useState('');
  const [banca, setBanca] = useState('Cebraspe');
  const [customBanca, setCustomBanca] = useState('');
  const [examDate, setExamDate] = useState('');
  const [category, setCategory] = useState('TRIBUNAL');
  const [questionsCount, setQuestionsCount] = useState('100');
  const [durationMinutes, setDurationMinutes] = useState('240');
  const [status, setStatus] = useState<ProvaStatus>('agendada');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingProva) {
      setOrgan(editingProva.organ || '');
      setRole(editingProva.role || '');
      if (POPULAR_BANCAS.includes(editingProva.banca)) {
        setBanca(editingProva.banca);
        setCustomBanca('');
      } else {
        setBanca('Outra');
        setCustomBanca(editingProva.banca || '');
      }
      setExamDate(editingProva.examDate ? editingProva.examDate.split('T')[0] : '');
      setCategory(editingProva.category || 'TRIBUNAL');
      setQuestionsCount((editingProva.questionsCount || 100).toString());
      setDurationMinutes((editingProva.durationMinutes || 240).toString());
      setStatus(editingProva.status || 'agendada');
      setNotes(editingProva.notes || '');
    } else {
      setOrgan('');
      setRole('');
      setBanca('Cebraspe');
      setCustomBanca('');
      // Sugere uma data daqui a 45 dias
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 45);
      setExamDate(defaultDate.toISOString().split('T')[0]);
      setCategory('TRIBUNAL');
      setQuestionsCount('100');
      setDurationMinutes('240');
      setStatus('agendada');
      setNotes('');
    }
    setErrorMsg('');
  }, [editingProva, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalOrgan = organ.trim();
    const finalRole = role.trim();
    const finalBanca = (banca === 'Outra' ? customBanca : banca).trim();

    if (!finalOrgan || !finalRole || !finalBanca) {
      setErrorMsg('Por favor, preencha os campos obrigatórios (Órgão, Cargo e Banca).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const yearFromDate = examDate ? new Date(examDate).getFullYear() : new Date().getFullYear();
      await onSaveProva(
        {
          organ: finalOrgan,
          role: finalRole,
          banca: finalBanca,
          year: yearFromDate,
          examDate: examDate ? examDate : undefined,
          category,
          status,
          questionsCount: parseInt(questionsCount, 10) || 100,
          durationMinutes: parseInt(durationMinutes, 10) || 240,
          notes: notes.trim(),
        },
        editingProva?.id
      );
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao salvar informações da prova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                {editingProva ? 'Editar Dados da Prova / Simulado' : 'Agendar / Nova Prova'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lembrete independente de prova, simulado ou caderno de questões.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Linha 1: Órgão e Cargo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Órgão / Concurso *
              </label>
              <input
                type="text"
                placeholder="Ex: TCE-GO, PF, INSS, TJ-SP"
                value={organ}
                onChange={(e) => setOrgan(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                Cargo / Especialidade *
              </label>
              <input
                type="text"
                placeholder="Ex: Auditor de Controle Externo, Agente"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Linha 2: Banca Organizadora e Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-slate-400" />
                Banca Organizadora *
              </label>
              <div className="space-y-2">
                <select
                  value={banca}
                  onChange={(e) => setBanca(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all cursor-pointer"
                >
                  {POPULAR_BANCAS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                {banca === 'Outra' && (
                  <input
                    type="text"
                    placeholder="Digite o nome da banca..."
                    value={customBanca}
                    onChange={(e) => setCustomBanca(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                Área / Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Linha 3: Data da Prova e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Data da Prova
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                Status da Prova
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setStatus('agendada')}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    status === 'agendada'
                      ? 'bg-sky-500/15 border-sky-500 text-sky-600 dark:text-sky-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Agendada
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('em_andamento')}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    status === 'em_andamento'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Em Andamento
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('concluida')}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    status === 'concluida'
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Concluída
                </button>
              </div>
            </div>
          </div>

          {/* Linha 4: Questões e Duração */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                Quantidade de Questões
              </label>
              <input
                type="number"
                min="1"
                placeholder="100"
                value={questionsCount}
                onChange={(e) => setQuestionsCount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Duração Estimada (minutos)
              </label>
              <input
                type="number"
                min="10"
                step="10"
                placeholder="240"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {Math.floor((parseInt(durationMinutes, 10) || 0) / 60)}h {(parseInt(durationMinutes, 10) || 0) % 60}m de aplicação
              </span>
            </div>
          </div>

          {/* Linha 5: Anotações / Lembretes / Gabarito */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Anotações, Lembretes & Gabarito
            </label>
            <textarea
              rows={3}
              placeholder="Ex: Local da prova, sala, links úteis, matérias mais cobradas, notas de corte esperadas ou resultado..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              {editingProva ? 'Salvar Alterações' : 'Salvar Prova'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
