import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Target, 
  BookOpen, 
  Repeat, 
  Trophy, 
  Award, 
  UserCircle, 
  Flame, 
  LogOut, 
  Sparkles, 
  ChevronRight, 
  ChevronDown,
  Check,
  Plus,
  Database, 
  CalendarClock, 
  Clock, 
  BarChart3, 
  Shield, 
  Crown,
  BookX,
  Layers,
  History,
  NotebookPen
} from 'lucide-react';
import { NavigationTab, StudyMethod, Concurso } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { DatabaseService } from '../../services/db';
import { GezinhoLogo } from '../common/GezinhoLogo';
import { ModalAdminEdital } from '../admin/ModalAdminEdital';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  studyMethod?: StudyMethod;
  concursos?: Concurso[];
  activeConcursoId?: string;
  onSetActiveConcurso?: (id: string) => void | Promise<void>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  studyMethod = 'ciclo',
  concursos = [],
  activeConcursoId,
  onSetActiveConcurso,
}) => {
  const { user, logout } = useAuth();
  const { palette } = useTheme();

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [localConcursos, setLocalConcursos] = useState<Concurso[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Sincroniza lista de concursos do prop ou carrega do cache local / DatabaseService
  useEffect(() => {
    if (concursos && concursos.length > 0) {
      setLocalConcursos(concursos);
    } else {
      try {
        const raw = localStorage.getItem('gabarita_concursos');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLocalConcursos(parsed);
            return;
          }
        }
      } catch {
        // ignora erro de parse
      }
      DatabaseService.getConcursos().then(data => {
        if (data && data.length > 0) {
          setLocalConcursos(data);
        }
      });
    }
  }, [concursos]);

  // Fechamento suave ao clicar fora (click outside)
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Listener reativo imediato para sincronização do concurso ativo
  useEffect(() => {
    const handleActiveChanged = (e: Event) => {
      const customEvt = e as CustomEvent<{ id: string; concurso?: Concurso }>;
      if (customEvt.detail?.id) {
        DatabaseService.getConcursos().then(data => {
          if (data && data.length > 0) setLocalConcursos(data);
        });
      }
    };
    window.addEventListener('gabarita_active_concurso_changed', handleActiveChanged);
    window.addEventListener('storage', handleActiveChanged);
    return () => {
      window.removeEventListener('gabarita_active_concurso_changed', handleActiveChanged);
      window.removeEventListener('storage', handleActiveChanged);
    };
  }, []);

  // Lista efetiva de concursos disponíveis - estritamente ATIVOS para seleção de Foco Atual
  const allConcursos = (concursos && concursos.length > 0) ? concursos : localConcursos;
  const displayConcursos = allConcursos.filter(c => c.status !== 'arquivado' && !c.isArquivado);

  // Identificação segura do concurso ativo (exclui arquivados)
  const currentActiveId = activeConcursoId || 
    (typeof window !== 'undefined' ? localStorage.getItem('gabarita_active_concurso_id') : '') ||
    user?.targetConcursoId ||
    displayConcursos.find(c => c.active || c.isAtivo || c.isFocoAtivo)?.id || 
    displayConcursos[0]?.id || '';

  const activeConcurso = displayConcursos.find(c => String(c.id) === String(currentActiveId)) || displayConcursos[0];
  const activeConcursoTitle = activeConcurso
    ? `${activeConcurso.organ || activeConcurso.title || 'Concurso'} - ${activeConcurso.role || ''}`
    : (user?.targetConcursoTitle || 'TCU - Auditor Federal');

  const handleSelectConcurso = async (concursoId: string) => {
    setIsDropdownOpen(false);
    if (onSetActiveConcurso) {
      await onSetActiveConcurso(concursoId);
    } else {
      const res = await DatabaseService.setActiveConcurso(concursoId);
      setLocalConcursos(res.concursos);
    }
  };

  const navItems: { id: NavigationTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string; visible?: boolean }[] = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'concursos', label: 'Concursos & Provas', icon: Target },
    { id: 'plano', label: 'Plano de Estudos', icon: CalendarClock },
    { id: 'estudos', label: 'Edital Verticalizado', icon: BookOpen },
    { id: 'revisoes', label: 'Revisões', icon: Repeat },
    { id: 'resumos', label: 'Resumos', icon: NotebookPen },
    { id: 'historico', label: 'Histórico', icon: History },
    { id: 'flashcards', label: 'Flashcards', icon: Layers },
    { id: 'caderno_erros', label: 'Caderno de Erros', icon: BookX },
    // Para reativar o menu "Metas & Desempenho", altere visible para true
    { id: 'metas', label: 'Metas & Desempenho', icon: Trophy, visible: false },
    { id: 'analytics', label: 'Estatísticas', icon: BarChart3 },
    // Para reativar o menu "Assistente IA", altere visible para true
    { id: 'ai_assistant', label: 'Assistente IA', icon: Sparkles, badge: 'Gemini', visible: false },
    { id: 'simulados', label: 'Simulados', icon: Award },
    { id: 'planos_assinatura', label: 'Planos & Assinatura', icon: Crown },
    { id: 'perfil', label: 'Perfil & Ajustes', icon: UserCircle },
    ...(user?.role === 'admin' ? [{ id: 'admin' as NavigationTab, label: 'Área Administrativa', icon: Shield, badge: 'Admin' }] : []),
  ];

  const handleNavClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/80 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <GezinhoLogo size={38} withText withBadge className="drop-shadow-xs" />
        </div>

        {/* Widget do Foco Atual (Trigger do Dropdown Switcher) */}
        <div className="px-3 my-3" ref={triggerRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(prev => !prev)}
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
            className="flashcards-daily-review-card w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group cursor-pointer shadow-xs"
          >
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
                Foco Atual
              </span>
              <p 
                className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[130px] mt-0.5"
                title={activeConcursoTitle}
              >
                {activeConcursoTitle}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300/40 dark:border-slate-700">
                Nível {user?.level || 1}
              </span>
              <ChevronDown 
                className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                style={{ color: palette.primary }}
              />
            </div>
          </button>
        </div>

        {/* Popup / Dropdown de Seleção Flutuante */}
        {isDropdownOpen && (
          <>
            <div 
              className="fixed inset-0 z-40 bg-transparent" 
              onClick={() => setIsDropdownOpen(false)} 
            />
            <div 
              ref={dropdownRef}
              className="absolute left-2 top-[110px] w-64 z-50 bg-white dark:bg-slate-950/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-2"
            >
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Meus Concursos / Planos
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                  {displayConcursos.length} {displayConcursos.length === 1 ? 'concurso' : 'concursos'}
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1 py-1 custom-scrollbar">
                {displayConcursos.map((concurso) => {
                  const isCurrentActive = concurso.id === currentActiveId;
                  const itemTitle = `${concurso.organ || concurso.title} - ${concurso.role}`;
                  return (
                    <button
                      key={concurso.id}
                      type="button"
                      onClick={() => handleSelectConcurso(concurso.id)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg transition-all flex items-center justify-between gap-2 group cursor-pointer ${
                        isCurrentActive
                          ? 'bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-white shadow-xs font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold truncate ${
                          isCurrentActive
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white'
                        }`} title={itemTitle}>
                          {concurso.organ || concurso.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {concurso.role || 'Geral'}
                        </p>
                      </div>
                      {isCurrentActive ? (
                        <span 
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1"
                          style={{ 
                            backgroundColor: `${palette.primary}20`, 
                            color: palette.primary,
                            borderColor: `${palette.primary}40`,
                            borderWidth: '1px'
                          }}
                        >
                          <Check className="w-3 h-3" />
                          Ativo
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          Selecionar
                        </span>
                      )}
                    </button>
                  );
                })}

                {displayConcursos.length === 0 && (
                  <div className="py-3 px-2 text-center text-xs text-slate-400 dark:text-slate-500">
                    Nenhum concurso encontrado
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 my-1" />

              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  handleNavClick('concursos');
                }}
                className="w-full flex items-center justify-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-all cursor-pointer group"
              >
                <Plus className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                <span>Gerenciar Concursos</span>
              </button>
            </div>
          </>
        )}

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.filter(item => item.visible !== false).map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id || 
              (item.id === 'plano' && (currentTab === 'plano' || currentTab === 'ciclo' || currentTab === 'cronograma'));
            return (
              <React.Fragment key={item.id}>
                <button
                  onClick={() => handleNavClick(item.id)}
                  className={`sidebar-nav-btn group relative overflow-hidden w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'sidebar-nav-btn-active theme-btn-primary text-white shadow-sm font-semibold'
                      : 'sidebar-nav-btn-inactive text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`sidebar-nav-indicator absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full transition-all duration-200 pointer-events-none ${
                      isActive
                        ? 'opacity-90 translate-x-0 bg-white/85'
                        : 'opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0'
                    }`}
                    style={!isActive ? { backgroundColor: palette.primary } : undefined}
                  />
                  <div className={`flex items-center gap-3 transition-transform duration-200 ${isActive ? '' : 'group-hover:translate-x-1'}`}>
                    <Icon
                      className={`sidebar-nav-icon w-4 h-4 transition-colors duration-200 ${
                        isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`relative z-10 transition-transform duration-200 ${
                        isActive
                          ? 'text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/20 text-white'
                          : item.id === 'ai_assistant'
                          ? 'px-2 py-0.5 text-[11px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          : 'text-[10px] font-bold px-1.5 py-0.5 rounded-full sidebar-badge'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <button
            onClick={() => handleNavClick('perfil')}
            className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img
              src={user?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'}
              alt={user?.name || 'Usuário'}
              className="w-9 h-9 rounded-full object-cover border border-slate-300 dark:border-slate-700"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {user?.name || 'Estudante'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {user?.email || 'aluno@gabarita.com'}
              </p>
            </div>
          </button>
          <button
            onClick={logout}
            title="Sair da Conta"
            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Modal Provisório de Cadastro Manual de Edital (Admin) */}
      <ModalAdminEdital
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onEditalCreated={() => {
          // Dispara eventos para atualizar listas em aberto
          window.dispatchEvent(new CustomEvent('gabarita_edital_created'));
          window.dispatchEvent(new CustomEvent('gabarita_concursos_updated'));
        }}
      />
    </>
  );
};
