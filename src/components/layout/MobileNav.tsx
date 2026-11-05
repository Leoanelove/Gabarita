import React from 'react';
import { 
  LayoutDashboard, 
  Target, 
  BookOpen, 
  Repeat, 
  HelpCircle, 
  UserCircle, 
  CalendarClock, 
  PlayCircle,
  History,
  NotebookPen
} from 'lucide-react';
import { NavigationTab, StudyMethod } from '../../types';

import { useTheme } from '../../contexts/ThemeContext';

interface MobileNavProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  studyMethod?: StudyMethod;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, onSelectTab }) => {
  const { palette } = useTheme();

  const tabs: {
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    isCenterFeatured?: boolean;
  }[] = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'estudos', label: 'Edital', icon: BookOpen },
    { id: 'revisoes', label: 'Revisões', icon: Repeat },
    { id: 'plano', label: 'Estudar', icon: PlayCircle, isCenterFeatured: true },
    { id: 'resumos', label: 'Resumos', icon: NotebookPen },
    { id: 'historico', label: 'Histórico', icon: History },
    { id: 'perfil', label: 'Perfil', icon: UserCircle },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-1.5 py-1.5 grid grid-cols-7 items-center">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive =
          currentTab === tab.id ||
          (tab.id === 'plano' &&
            (currentTab === 'ciclo' ||
              currentTab === 'cronograma' ||
              currentTab === 'plano' ||
              currentTab === 'sessao'));

        if (tab.isCenterFeatured) {
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab('plano')}
              className="flex flex-col items-center justify-center -mt-3 py-1.5 px-2.5 mx-auto rounded-2xl theme-btn-primary text-white font-bold shadow-md transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-white dark:ring-slate-900"
              style={{
                backgroundColor: palette.primary,
                boxShadow: isActive
                  ? `0 6px 16px -2px ${palette.primary}66`
                  : `0 4px 12px -2px ${palette.primary}4D`,
              }}
            >
              <Icon className="w-5 h-5 stroke-[2.5] text-white" />
              <span className="text-[10px] mt-0.5 leading-none tracking-tight text-white font-bold">
                {tab.label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors cursor-pointer ${
              isActive
                ? 'theme-primary-text font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
            style={isActive ? { color: palette.primary } : undefined}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-0.5 truncate max-w-full">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

