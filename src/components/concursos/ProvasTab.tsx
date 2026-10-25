import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Search, 
  Plus, 
  Clock, 
  Layers, 
  FileText, 
  Building2, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Edit2, 
  Trash2, 
  Sparkles, 
  ChevronRight,
  Filter,
  CheckCircle,
  HelpCircle,
  CalendarPlus,
  BookOpen
} from 'lucide-react';
import { Prova, ProvaStatus } from '../../types';
import { Button } from '../../design-system/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { NovaProvaModal } from './NovaProvaModal';
import { DetalhesProvaModal } from './DetalhesProvaModal';

// Banners da aba "Provas" (mantidos separados para substituição futura)
export const PROVAS_BANNER_THEMES: Record<string, string> = {
  verde: 'https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Concursos%20&%20Provas/Banner_Provas_verde.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBDb25jdXJzb3MgJiBQcm92YXMvQmFubmVyX1Byb3Zhc192ZXJkZS5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzkyNjMwMTA2LCJleHAiOjQ5NDYyMzAxMDZ9.nMfAxpFABLSoTDilKmCS3CFAhQdmTztPeefM0cPjUNaiLiFZmp_LYHg5Ay6m2s7ArH236qjS4SzEoBf82bsC3A',
  azul: 'https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Concursos%20&%20Provas/Banner_Provas_azul.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBDb25jdXJzb3MgJiBQcm92YXMvQmFubmVyX1Byb3Zhc19henVsLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3OTI2MzAyNjgsImV4cCI6NDk0NjIzMDI2OH0.JdSC4HjEmt65EFNk3Ik1zje4a05KslYMNwS2Jq7ilyEn67Qij7MiegF5pymNZAPKAEGpCRKmVGsAUPTznrPQqg',
  rosa: 'https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Concursos%20&%20Provas/Banner_Provas_rosa.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBDb25jdXJzb3MgJiBQcm92YXMvQmFubmVyX1Byb3Zhc19yb3NhLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3OTI2MzAyOTIsImV4cCI6NDk0NjIzMDI5Mn0.VbmliPF2RvgipiAJQz9YTmYoKvZ51lcR7yiYFENRrld9woBjbNOuCiWYbvYA7tL7cVdXZGQ-6PhrTVdkT62EFw',
  roxo: 'https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Concursos%20&%20Provas/Banner_Provas_roxo.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBDb25jdXJzb3MgJiBQcm92YXMvQmFubmVyX1Byb3Zhc19yb3hvLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3OTI2MzAzMDUsImV4cCI6NDk0NjIzMDMwNX0.Ie07YWa8burkSUhulRug5znwdg3nXT_ofsDLrYXCABXT_qHKuwbVOPzduqBDXZtzun8aZFQgc-dLnae7Nlkayw',
  laranja: 'https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Concursos%20&%20Provas/Banner_Provas_laranja.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBDb25jdXJzb3MgJiBQcm92YXMvQmFubmVyX1Byb3Zhc19sYXJhbmphLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3OTI2MzAzMjEsImV4cCI6NDk0NjIzMDMyMX0.cBxUKMjT-sAUKEOcv3PIS3EQdc2kOVvGI9Zpaa97qwN5lrV6AUTxvqPkzeF4kQoJP9HhFzAgQzxIA1cSO9BP9A',
};
export interface ProvasTabProps {
  provas: Prova[];
  onAddProva: (prova: Omit<Prova, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateProva: (id: string, partial: Partial<Prova>) => Promise<void>;
  onDeleteProva: (id: string) => Promise<void>;
  showFeedback: (type: 'success' | 'error', message: string) => void;
}

export const ProvasTab: React.FC<ProvasTabProps> = ({
  provas,
  onAddProva,
  onUpdateProva,
  onDeleteProva,
  showFeedback
}) => {
  const { colorSkin } = useTheme();

  // Banner Dinâmico baseado no Tema Ativo
  const normalizedSkin = (colorSkin === 'purple' ? 'roxo' : colorSkin === 'orange' ? 'laranja' : colorSkin || 'verde').toLowerCase();
  const currentBannerSrc = PROVAS_BANNER_THEMES[normalizedSkin] || PROVAS_BANNER_THEMES.verde;

  // Efeito Neon Dinâmico conforme o Tema Ativo (destaque para Roxo e Laranja)
  const getNeonTextStyle = useMemo(() => {
    switch (normalizedSkin) {
      case 'roxo':
        return {
          color: '#FFFFFF',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(167, 139, 250, 0.95), 0 0 18px rgba(139, 92, 246, 0.85), 0 0 32px rgba(124, 58, 237, 0.65)',
        };
      case 'laranja':
        return {
          color: '#FFFFFF',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(251, 146, 60, 0.95), 0 0 18px rgba(249, 115, 22, 0.85), 0 0 32px rgba(234, 88, 12, 0.65)',
        };
      case 'verde':
        return {
          color: '#FFFFFF',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(52, 211, 153, 0.95), 0 0 18px rgba(16, 185, 129, 0.8), 0 0 32px rgba(5, 150, 105, 0.6)',
        };
      case 'azul':
        return {
          color: '#FFFFFF',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(96, 165, 250, 0.95), 0 0 18px rgba(37, 99, 235, 0.8), 0 0 32px rgba(29, 78, 216, 0.6)',
        };
      case 'rosa':
        return {
          color: '#FFFFFF',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(244, 114, 182, 0.95), 0 0 18px rgba(219, 39, 119, 0.8), 0 0 32px rgba(190, 24, 93, 0.6)',
        };
      default:
        return {
          color: '#FFFFFF',
          textShadow: '0 2px 6px rgba(0, 0, 0, 0.7)',
        };
    }
  }, [normalizedSkin]);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBanca, setSelectedBanca] = useState<string>('todas');
  const [selectedYear, setSelectedYear] = useState<string>('todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');

  // Modal States
  const [isNovaProvaModalOpen, setIsNovaProvaModalOpen] = useState(false);
  const [editingProva, setEditingProva] = useState<Prova | null>(null);
  const [viewingProva, setViewingProva] = useState<Prova | null>(null);
  const [deletingProvaId, setDeletingProvaId] = useState<string | null>(null);

  // Extract unique bancas and years for filter dropdowns
  const availableBancas = useMemo(() => {
    const set = new Set<string>();
    provas.forEach(p => {
      if (p.banca) set.add(p.banca);
    });
    return Array.from(set).sort();
  }, [provas]);

  const availableYears = useMemo(() => {
    const set = new Set<string>();
    provas.forEach(p => {
      if (p.year) set.add(p.year.toString());
      if (p.examDate) {
        const y = new Date(p.examDate).getFullYear().toString();
        if (y && !isNaN(Number(y))) set.add(y);
      }
    });
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [provas]);

  // Filtered List
  const filteredProvas = useMemo(() => {
    return provas.filter(p => {
      const matchSearch = 
        !searchTerm.trim() ||
        (p.organ || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.banca || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchBanca = selectedBanca === 'todas' || p.banca === selectedBanca;

      const pYear = p.year?.toString() || (p.examDate ? new Date(p.examDate).getFullYear().toString() : '');
      const matchYear = selectedYear === 'todos' || pYear === selectedYear;

      const pStatus = p.status || 'agendada';
      const matchStatus = selectedStatus === 'todos' || pStatus === selectedStatus;

      return matchSearch && matchBanca && matchYear && matchStatus;
    });
  }, [provas, searchTerm, selectedBanca, selectedYear, selectedStatus]);

  // Handlers
  const handleSaveProva = async (provaData: Omit<Prova, 'id' | 'createdAt'>, id?: string) => {
    try {
      if (id) {
        await onUpdateProva(id, provaData);
        showFeedback('success', `Prova "${provaData.organ}" atualizada com sucesso!`);
      } else {
        await onAddProva(provaData);
        showFeedback('success', `Prova "${provaData.organ}" agendada com sucesso!`);
      }
    } catch {
      showFeedback('error', 'Erro ao salvar os dados da prova.');
      throw new Error('Falha ao salvar');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingProvaId) return;
    try {
      await onDeleteProva(deletingProvaId);
      setDeletingProvaId(null);
      if (viewingProva?.id === deletingProvaId) setViewingProva(null);
      showFeedback('success', 'Lembrete de prova removido com sucesso.');
    } catch {
      showFeedback('error', 'Erro ao remover prova.');
    }
  };

  const handleUpdateStatus = async (id: string, status: ProvaStatus) => {
    try {
      await onUpdateProva(id, { status });
      if (viewingProva?.id === id) {
        setViewingProva(prev => prev ? { ...prev, status } : null);
      }
      showFeedback('success', 'Status da prova atualizado!');
    } catch {
      showFeedback('error', 'Falha ao atualizar status.');
    }
  };

  const getCategoryBadgeClass = (category?: string) => {
    const cat = (category || 'GERAL').toUpperCase();
    if (cat.includes('TRIBUNAL') || cat.includes('JURÍDICO')) {
      return 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30';
    }
    if (cat.includes('POLICIAL')) {
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30';
    }
    if (cat.includes('FISCAL') || cat.includes('CONTROLE')) {
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    }
    if (cat.includes('ADMINISTRATIVO') || cat.includes('BANCÁRIO')) {
      return 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30';
    }
    return 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30';
  };

  return (
    <div className="space-y-6">
      {/* =========================================================================
          1. BANNER PRINCIPAL DE DESTAQUE (TOPO DA ABA PROVAS)
          ========================================================================= */}
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-slate-200/20 dark:border-slate-800 shadow-xl min-h-[190px] md:min-h-[220px] flex items-center bg-slate-950">
        {/* Imagem correspondente cobrindo o container e perfeitamente enquadrada sem bordas brancas */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <img 
            src={currentBannerSrc} 
            alt="Banner Provas" 
            className="w-full h-full object-cover object-center scale-100 transition-transform duration-300" 
          />
        </div>

        {/* Gradiente sutil para garantir legibilidade de alto contraste sobre o fundo */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/45 to-transparent pointer-events-none" />

        {/* Na área esquerda (relative z-10 p-6 md:p-8 flex flex-col justify-center max-w-lg h-full) */}
        <div className="relative z-10 p-6 md:p-8 flex flex-col justify-center max-w-lg h-full gap-4">
          <div className="space-y-2">
            {/* Título: "Próximas Provas" em branco com efeito neon */}
            <h1 
              className="provas-banner-title text-2xl md:text-3xl font-extrabold !text-white tracking-tight leading-tight select-none drop-shadow-md"
              style={getNeonTextStyle}
            >
              Próximas Provas
            </h1>

            {/* Subtítulo: "Cadastre datas, organize cadernos de provas e acompanhe seus simulados agendados." */}
            <p className="text-white/90 text-xs md:text-sm leading-relaxed">
              Cadastre datas, organize cadernos de provas e acompanhe seus simulados agendados.
            </p>
          </div>

          {/* Botão de ação: "Agendar Nova Prova" que abre o modal de cadastro manual de prova */}
          <div className="pt-1 flex items-center">
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setEditingProva(null);
                setIsNovaProvaModalOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
              className="font-bold shadow-lg shadow-black/25 cursor-pointer text-xs md:text-sm px-5 py-2.5"
            >
              Agendar Nova Prova
            </Button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. FILTROS E BARRA DE PESQUISA
          ========================================================================= */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* Barra de Busca */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por órgão, cargo ou banca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Filtros em Dropdown */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Dropdown Banca */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase hidden sm:inline">Banca:</span>
            <select
              value={selectedBanca}
              onChange={(e) => setSelectedBanca(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
            >
              <option value="todas">Todas as Bancas</option>
              {availableBancas.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Dropdown Ano/Data */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase hidden sm:inline">Ano:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
            >
              <option value="todos">Todos os Anos</option>
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Dropdown Status */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase hidden sm:inline">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
            >
              <option value="todos">Todos os Status</option>
              <option value="agendada">Agendada</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluida">Realizada / Concluída</option>
            </select>
          </div>

          {/* Reset Filters button if any active */}
          {(searchTerm || selectedBanca !== 'todas' || selectedYear !== 'todos' || selectedStatus !== 'todos') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedBanca('todas');
                setSelectedYear('todos');
                setSelectedStatus('todos');
              }}
              className="px-2.5 py-2 text-xs font-semibold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          3. SEÇÃO "PRÓXIMAS PROVAS" (GRID DE CARDS MANUAIS)
          ========================================================================= */}
      <div className="space-y-4">
        {/* Cabeçalho da Seção com Contador */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-500" />
              Próximas Provas
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {filteredProvas.length} {filteredProvas.length === 1 ? 'prova' : 'provas'}
            </span>
          </div>
        </div>

        {/* Grid de Cards ou Estado Vazio */}
        {filteredProvas.length === 0 ? (
          /* Estado Vazio Elegante */
          <div 
            onClick={() => {
              setEditingProva(null);
              setIsNovaProvaModalOpen(true);
            }}
            className="group rounded-3xl border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 p-8 sm:p-12 text-center flex flex-col items-center justify-center cursor-pointer transition-all duration-300 space-y-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 flex items-center justify-center transition-transform shadow-xs">
              <CalendarPlus className="w-8 h-8" />
            </div>

            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 group-hover:text-emerald-500 transition-colors">
                Nenhum lembrete de prova cadastrado ainda
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Adicione suas datas de provas futuras ou simulados para calcular a contagem regressiva e gerenciar cadernos de questões.
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              className="font-bold shadow-md shadow-emerald-500/20"
            >
              + Adicionar Primeiro Lembrete de Prova
            </Button>
          </div>
        ) : (
          /* Grid de Cards de Provas */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProvas.map((prova) => {
              const diffDays = prova.examDate 
                ? Math.ceil((new Date(prova.examDate).getTime() - new Date().getTime()) / 86400000)
                : null;

              const isCompleted = prova.status === 'concluida';
              const isEmAndamento = prova.status === 'em_andamento';

              return (
                <div
                  key={prova.id}
                  className="group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden"
                >
                  {/* Top Bar / Category Tag + Quick Actions */}
                  <div className="p-5 pb-3 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase border ${getCategoryBadgeClass(prova.category)}`}>
                        {prova.category || 'CONCURSO'}
                      </span>

                      {/* Quick Actions (Editar / Excluir) */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingProva(prova);
                            setIsNovaProvaModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Editar Prova"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingProvaId(prova.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Excluir Prova"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Corpo do Card: Órgão & Cargo */}
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight line-clamp-1">
                        {prova.organ}
                      </h3>
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 line-clamp-1">
                        {prova.role}
                      </p>
                    </div>

                    {/* Metadados com Ícones */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                      {/* Data & Contagem Regressiva */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {prova.examDate 
                            ? new Date(prova.examDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                            : (prova.year ? `Ano ${prova.year}` : 'A definir')}
                        </span>

                        {diffDays !== null ? (
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            diffDays > 0 
                              ? (diffDays <= 30 ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400')
                              : (diffDays === 0 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 font-black' : 'bg-slate-200 dark:bg-slate-800 text-slate-500')
                          }`}>
                            {diffDays > 0 ? `Em ${diffDays} dias` : diffDays === 0 ? 'Hoje!' : 'Realizada'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Data aberta</span>
                        )}
                      </div>

                      {/* Banca & Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-slate-400" />
                          <strong className="text-slate-700 dark:text-slate-300 font-semibold">{prova.banca || 'Banca a definir'}</strong>
                        </span>

                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          isCompleted
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : isEmAndamento
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/20'
                            : 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/20'
                        }`}>
                          {isCompleted ? 'Concluída' : isEmAndamento ? 'Em Andamento' : 'Agendada'}
                        </span>
                      </div>

                      {/* Questões & Duração */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <HelpCircle className="w-3 h-3 text-slate-400" />
                          {prova.questionsCount || 100} questões
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {Math.floor((prova.durationMinutes || 240) / 60)}h {(prova.durationMinutes || 240) % 60}m
                        </span>
                      </div>

                      {/* Anotações snippet se houver */}
                      {prova.notes && (
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1 flex items-center gap-1.5">
                          <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{prova.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rodapé do Card: Ação Primária alinhada ao tema */}
                  <div className="p-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setViewingProva(prova)}
                      className="flex-1 justify-center text-xs font-bold cursor-pointer"
                      rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                    >
                      Ver Detalhes / Iniciar
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingProva(prova);
                        setIsNovaProvaModalOpen(true);
                      }}
                      className="text-xs px-2.5 cursor-pointer"
                      title="Editar Anotações"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Nova Prova / Editar Prova */}
      <NovaProvaModal
        isOpen={isNovaProvaModalOpen}
        onClose={() => {
          setIsNovaProvaModalOpen(false);
          setEditingProva(null);
        }}
        onSaveProva={handleSaveProva}
        editingProva={editingProva}
      />

      {/* Modal: Detalhes da Prova */}
      <DetalhesProvaModal
        isOpen={viewingProva !== null}
        prova={viewingProva}
        onClose={() => setViewingProva(null)}
        onEdit={(p) => {
          setViewingProva(null);
          setEditingProva(p);
          setIsNovaProvaModalOpen(true);
        }}
        onDelete={(id) => {
          setViewingProva(null);
          setDeletingProvaId(id);
        }}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Modal: Confirmação de Exclusão */}
      {deletingProvaId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Excluir Lembrete de Prova?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Tem certeza de que deseja remover esta prova do seu caderno de lembretes?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingProvaId(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
              >
                Confirmar Exclusão
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
