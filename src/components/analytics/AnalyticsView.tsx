import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Clock, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Download, 
  FileSpreadsheet, 
  Award, 
  Flame, 
  Repeat 
} from 'lucide-react';
import { 
  Disciplina, 
  Assunto, 
  SessaoEstudo, 
  RegistroBlocoQuestoes, 
  Revisao, 
  Simulado, 
  EstatisticasProgressoReal 
} from '../../types';
import { Card, CardHeader, CardBody } from '../../design-system/Card';
import { Button } from '../../design-system/Button';
import { Badge } from '../../design-system/Badge';
import { MenuBannerFrame } from '../common/MenuBannerFrame';
import { useTheme } from '../../contexts/ThemeContext';

export const ESTATISTICAS_BANNER_THEMES: Record<string, string> = {
  verde: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Estatisticas/Banner-Estatistica-verde.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBFc3RhdGlzdGljYXMvQmFubmVyLUVzdGF0aXN0aWNhLXZlcmRlLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3OTI5NzEzNDcsImV4cCI6NDk0NjU3MTM0N30.rFoGrGMktMmw4s-k7CZnZdTSutCEfzpePxkkhoWOu65yIweXzmoWEbXRT-TlTk61XDmnnLV1L7gtp5riUnDwNw",
  azul: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Estatisticas/Banner-Estatistica-azul.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBFc3RhdGlzdGljYXMvQmFubmVyLUVzdGF0aXN0aWNhLWF6dWwucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5Mjk3MTM2NCwiZXhwIjo0OTQ2NTcxMzY0fQ.aV5m8u6wJO4hyhKY2qRKxfd75G_VJpIqZg5s9452J9hnWw1HQMtF9LO-0vZrsyyvbvNw2GXkFDumjWfNvpHlrg",
  rosa: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Estatisticas/Banner-Estatistica-rosa.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBFc3RhdGlzdGljYXMvQmFubmVyLUVzdGF0aXN0aWNhLXJvc2EucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5Mjk3MTM3NywiZXhwIjo0OTQ2NTcxMzc3fQ.S1XB9peeeMvhA13xwturIoBYcSUyp-ThM-fnBNXaHuQtmK6cxika5U7QRiFIWkOqn4K2rgZPe-4sBR_1hoS0LA",
  roxo: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Estatisticas/Banner-Estatistica-roxo.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBFc3RhdGlzdGljYXMvQmFubmVyLUVzdGF0aXN0aWNhLXJveG8ucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5Mjk3MTM5MCwiZXhwIjo0OTQ2NTcxMzkwfQ.QZY3f5K9dXlTZBV-L5FeuynMDmwxTaF6IIfeNef9NGWco4jrw17NpDK8mRu_SxdworXS5ISC-MFlFGf31g0eoA",
  laranja: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Estatisticas/Banner-Estatistica-laranja.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBFc3RhdGlzdGljYXMvQmFubmVyLUVzdGF0aXN0aWNhLWxhcmFuamEucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5Mjk3MTQwNiwiZXhwIjo0OTQ2NTcxNDA2fQ.BVRQ-GLvvNjpLeY-Gq4r0oPqpFxRFZypZCBKdxVg1nquRmX9JS2k_Ar45jQEcM8ZUqosMPP-CCfKjoRz7fJyAg"
};

interface AnalyticsViewProps {
  disciplinas: Disciplina[];
  assuntos: Assunto[];
  sessoes: SessaoEstudo[];
  blocosQuestoes: RegistroBlocoQuestoes[];
  revisoes: Revisao[];
  simulados: Simulado[];
  stats: EstatisticasProgressoReal;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  disciplinas,
  assuntos,
  sessoes,
  blocosQuestoes,
  revisoes,
  simulados,
  stats,
}) => {
  const { colorSkin, palette } = useTheme();
  const currentTheme = (
    colorSkin === 'purple' ? 'roxo' :
    colorSkin === 'orange' || colorSkin === 'dbz' ? 'laranja' :
    colorSkin || palette?.id || 'laranja'
  ).toLowerCase();

  const themeKey = (currentTheme || 'laranja').toLowerCase();
  const bannerUrl = ESTATISTICAS_BANNER_THEMES[themeKey] || ESTATISTICAS_BANNER_THEMES.laranja;

  const themeGlowStyles = useMemo(() => {
    switch (themeKey) {
      case 'roxo':
        return {
          color: '#8B5CF6',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(167, 139, 250, 0.95), 0 0 18px rgba(139, 92, 246, 0.85), 0 0 32px rgba(124, 58, 237, 0.65)',
        };
      case 'laranja':
        return {
          color: '#FF6B00',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(251, 146, 60, 0.95), 0 0 18px rgba(249, 115, 22, 0.85), 0 0 32px rgba(234, 88, 12, 0.65)',
        };
      case 'azul':
        return {
          color: '#3b82f6',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(96, 165, 250, 0.95), 0 0 18px rgba(37, 99, 235, 0.8), 0 0 32px rgba(29, 78, 216, 0.6)',
        };
      case 'rosa':
        return {
          color: '#ec4899',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(244, 114, 182, 0.95), 0 0 18px rgba(219, 39, 119, 0.8), 0 0 32px rgba(190, 24, 93, 0.6)',
        };
      case 'verde':
      default:
        return {
          color: '#10b981',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(52, 211, 153, 0.95), 0 0 18px rgba(16, 185, 129, 0.8), 0 0 32px rgba(5, 150, 105, 0.6)',
        };
    }
  }, [themeKey]);

  const [periodFilter, setPeriodFilter] = useState<'hoje' | 'semana' | 'mes' | 'todos'>('todos');
  const [activeTab, setActiveTab] = useState<'geral' | 'disciplinas' | 'assuntos' | 'evolucao'>('geral');

  const filteredData = useMemo(() => {
    let horas = 0;
    sessoes.forEach(s => horas += s.durationMinutes || 0);
    simulados.filter(s => s.status === 'finalizado').forEach(s => {
      horas += Math.round((s.elapsedSeconds || (s.durationMinutes * 60)) / 60);
    });
    const horasTotais = Math.round((horas / 60) * 10) / 10;
    
    let questoes = 0;
    let acertos = 0;
    blocosQuestoes.forEach(b => {
      questoes += b.totalQuestions || 0;
      acertos += b.correctAnswers || 0;
    });
    simulados.filter(s => s.status === 'finalizado').forEach(s => {
      questoes += s.questionsCount || (s.questoes?.length || 0);
      acertos += s.totalCorrect || 0;
    });
    const erros = Math.max(0, questoes - acertos);
    const taxaAcerto = questoes > 0 ? Math.round((acertos / questoes) * 100) : 0;
    const revisoesConcluidas = revisoes.filter(r => r.status === 'concluida').length;

    return {
      horasTotais,
      questoes,
      acertos,
      erros,
      taxaAcerto,
      revisoesConcluidas,
      sessoesCount: sessoes.length,
      mediaHorasPorSessao: sessoes.length > 0 ? Math.round((horasTotais / sessoes.length) * 10) / 10 : 0,
    };
  }, [sessoes, blocosQuestoes, revisoes, simulados]);

  const desempenhoDisciplinas = useMemo(() => {
    return disciplinas.map(disc => {
      const discBlocos = blocosQuestoes.filter(b => b.disciplinaId === disc.id);
      let discQ = 0;
      let discA = 0;
      discBlocos.forEach(b => {
        discQ += b.totalQuestions || 0;
        discA += b.correctAnswers || 0;
      });
      const taxa = discQ > 0 ? Math.round((discA / discQ) * 100) : 0;
      return {
        id: disc.id,
        name: disc.name,
        color: disc.color || '#6366f1',
        questoes: discQ,
        acertos: discA,
        erros: Math.max(0, discQ - discA),
        taxaAcerto: taxa,
      };
    });
  }, [disciplinas, blocosQuestoes]);

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Disciplina;Questoes;Acertos;Erros;TaxaAcerto\n";
    desempenhoDisciplinas.forEach(d => {
      csvContent += `"${d.name}";${d.questoes};${d.acertos};${d.erros};${d.taxaAcerto}%\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `gabarita_analise_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Banner Superior Dinâmico - Estatísticas & Relatórios */}
      <MenuBannerFrame
        bannerThemes={ESTATISTICAS_BANNER_THEMES}
        minHeight="min-h-[190px] md:min-h-[210px]"
        className="estatisticas-banner w-full border border-slate-200/20 dark:border-slate-800 shadow-xl flex items-center bg-slate-950 p-6 md:p-8 card-banner metas-xp-banner"
        contentClassName="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5"
        imgClassName="w-full h-full object-cover object-center scale-[1.14] pointer-events-none select-none transition-transform duration-300"
        alt="Estatísticas & Relatórios"
        fallbackSkin="laranja"
      >
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-3 flex-wrap">
              <div
                className="w-11 h-11 rounded-xl bg-black/50 border border-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-md"
                style={{ color: themeGlowStyles.color }}
              >
                <BarChart3 className="w-6 h-6" />
              </div>
              <h2
                className="provas-banner-title text-xl sm:text-2xl md:text-3xl font-extrabold !text-white tracking-tight leading-tight select-none drop-shadow-md"
                style={{
                  color: '#FFFFFF',
                  textShadow: themeGlowStyles.textShadow,
                }}
              >
                Estatísticas & Relatórios
              </h2>
            </div>
            <p
              className="text-xs sm:text-sm !text-white/90 leading-relaxed max-w-xl drop-shadow-xs"
              style={{ color: 'rgba(255, 255, 255, 0.92)' }}
            >
              Métricas consolidadas e desempenho por matéria.
            </p>
          </div>
      </MenuBannerFrame>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5">
          <CardBody className="p-5">
            <span className="text-xs uppercase font-bold text-indigo-600 block mb-1">Horas Líquidas</span>
            <span className="text-3xl font-black">{filteredData.horasTotais}h</span>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
          <CardBody className="p-5">
            <span className="text-xs uppercase font-bold text-emerald-600 block mb-1">Taxa de Acerto</span>
            <span className="text-3xl font-black">{filteredData.taxaAcerto}%</span>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5">
          <CardBody className="p-5">
            <span className="text-xs uppercase font-bold text-rose-600 block mb-1">Erros Registrados</span>
            <span className="text-3xl font-black">{filteredData.erros}</span>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5">
          <CardBody className="p-5">
            <span className="text-xs uppercase font-bold text-amber-600 block mb-1">Revisões</span>
            <span className="text-3xl font-black">{filteredData.revisoesConcluidas}</span>
          </CardBody>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-2 border-b pb-3 overflow-x-auto text-xs">
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setActiveTab('geral')} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'geral' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>Visão Geral</button>
          <button onClick={() => setActiveTab('disciplinas')} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'disciplinas' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>Por Disciplina</button>
          <button onClick={() => setActiveTab('evolucao')} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'evolucao' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>Evolução Semanal</button>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleExportCSV}
          leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />}
          className="ml-auto shrink-0 font-bold text-xs whitespace-nowrap"
        >
          Exportar CSV
        </Button>
      </div>

      {activeTab === 'geral' && (
        <Card>
          <CardHeader title="Progresso Geral do Edital" />
          <CardBody className="p-6 space-y-4">
            <div className="flex justify-between font-bold text-sm">
              <span>Cobertura do Edital</span>
              <span style={{ color: themeGlowStyles.color }}>{stats.percentualEdital}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-300"
                style={{
                  width: `${stats.percentualEdital}%`,
                  background: 'linear-gradient(90deg, var(--banner-progress-from), var(--banner-progress-to))',
                  backgroundColor: themeGlowStyles.color,
                  boxShadow: '0 0 10px var(--chart-glow)',
                }}
              />
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === 'disciplinas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {desempenhoDisciplinas.map(d => (
            <Card key={d.id}>
              <CardHeader title={d.name} action={<Badge variant="emerald" size="sm">{d.taxaAcerto}%</Badge>} />
              <CardBody className="p-5">
                <p className="text-xs text-slate-500">Acertos: {d.acertos} / {d.questoes}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'evolucao' && (
        <Card>
          <CardHeader title="Ritmo dos Últimos 7 Dias" />
          <CardBody className="p-6">
            <div className="grid grid-cols-7 gap-3 h-48 items-end">
              {stats.diasAtivosUltimaSemana.map((d, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end">
                  <span className="text-[10px] font-bold" style={{ color: themeGlowStyles.color }}>
                    {Math.round(d.minutos / 60)}h
                  </span>
                  <div
                    className="w-full bg-brand rounded-t-lg transition-all duration-300"
                    style={{
                      height: `${Math.max(10, Math.min(100, (d.minutos / 240) * 100))}%`,
                      background: 'linear-gradient(to top, var(--banner-progress-from), var(--banner-progress-to))',
                      backgroundColor: themeGlowStyles.color,
                      boxShadow: '0 0 12px var(--chart-glow)',
                    }}
                  />
                  <span className="text-xs font-semibold">{d.diaSemana}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};
