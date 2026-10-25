import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Target, 
  Calendar, 
  Plus, 
  CheckCircle2, 
  Flame, 
  Sparkles, 
  Repeat, 
  Award, 
  Lock, 
  Zap, 
  Trash2 
} from 'lucide-react';
import { 
  Meta, 
  TargetType, 
  TargetPeriod, 
  Conquista, 
  MarcoEstudo, 
  EstatisticasProgressoReal 
} from '../../types';
import { Card, CardHeader, CardBody } from '../../design-system/Card';
import { Button } from '../../design-system/Button';
import { Badge } from '../../design-system/Badge';
import { Input } from '../../design-system/Input';
import { Modal } from '../../design-system/Modal';
import { useTheme } from '../../contexts/ThemeContext';

export const METAS_DESEMPENHO_BANNER_THEMES: Record<string, string> = {
  verde: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Metas%20e%20Desempenho/Banner-Metas-Maior-verde.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBNZXRhcyBlIERlc2VtcGVuaG8vQmFubmVyLU1ldGFzLU1haW9yLXZlcmRlLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3OTI2NzUzMDgsImV4cCI6NDk0NjI3NTMwOH0.XxueIXKuR-I0sl_4UIHOMLe0HWZAQnUaOd_edLODUiIs-5B-ymoB7ETcsNCLgRAhGlNZIhGmsYMgi02O_0q-nA",
  azul: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Metas%20e%20Desempenho/Banner-Metas-Maior-azul.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBNZXRhcyBlIERlc2VtcGVuaG8vQmFubmVyLU1ldGFzLU1haW9yLWF6dWwucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5MjY3NTMyMywiZXhwIjo0OTQ2Mjc1MzIzfQ.cNXhmcuws0RPFOGjrkY3o3kSzH41PpU5X20fMlgVQnCBLV67JAumyIoS9TXU3Pnn2dUs0pwJzAOFwtZX-x71SA",
  rosa: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Metas%20e%20Desempenho/Banner-Metas-Maior-rosa.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBNZXRhcyBlIERlc2VtcGVuaG8vQmFubmVyLU1ldGFzLU1haW9yLXJvc2EucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5MjY3NTMzNiwiZXhwIjo0OTQ2Mjc1MzM2fQ.rIqZuDaJ2XI0p04YGFGSRMYuH0e4jcvOjZSMgej5c0aTz5_m0aRYEM86aHV_kFUEkHCt1xf0SzRBIcU5lopxsg",
  roxo: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Metas%20e%20Desempenho/Banner-Metas-Maior-roxo.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBNZXRhcyBlIERlc2VtcGVuaG8vQmFubmVyLU1ldGFzLU1haW9yLXJveG8ucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5MjY3NTM1MywiZXhwIjo0OTQ2Mjc1MzUzfQ.CsE4RAMxz6HICnUQJgJ0mZdApH-_9C9UmkwfH6_7SvVvMjHXxHm7hv5VYm7kbokUaRliI3R4ITmi3POoG4b-IQ",
  laranja: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Metas%20e%20Desempenho/Banner-Metas-Maior-laranja.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBNZXRhcyBlIERlc2VtcGVuaG8vQmFubmVyLU1ldGFzLU1haW9yLWxhcmFuamEucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5MjY3NTM2NiwiZXhwIjo0OTQ2Mjc1MzY2fQ.5n2RQYFM7Cf20H2MqeZrd3MVBBTg0z4oKD30lc_YG6Ugymhi0ptw9WfNZUFe9EF4J35uJgWQ1ZfZN8dQkSCJIg"
};

export const METAS_MENOR_BANNER_THEMES: Record<string, string> = {
  verde: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Metas%20e%20Desempenho/Banner-Metas-Menor-verde.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBNZXRhcyBlIERlc2VtcGVuaG8vQmFubmVyLU1ldGFzLU1lbm9yLXZlcmRlLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3OTI2NzUxOTksImV4cCI6NDk0NjI3NTE5OX0.gIKNfcFVFy5SmiDGxZInv9098OoTrTRb0_NSap1OCoTpL4rNpMoTmZYQND4ZU4JdrO-RUFz_hPut2fXsMbFi6Q",
  azul: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Metas%20e%20Desempenho/Banner-Metas-Menor-azul.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBNZXRhcyBlIERlc2VtcGVuaG8vQmFubmVyLU1ldGFzLU1lbm9yLWF6dWwucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5MjY3NTIxMSwiZXhwIjo0OTQ2Mjc1MjExfQ.bB_X6rcf4Nht6H2bGQiGgnC1gXO5ZCtza8mGWpGoKXegqcmvkM8qfLkri2BQ9GuyH-55dIgJzBe9ZEZ8WwINqA",
  rosa: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Metas%20e%20Desempenho/Banner-Metas-Menor-rosa.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBNZXRhcyBlIERlc2VtcGVuaG8vQmFubmVyLU1ldGFzLU1lbm9yLXJvc2EucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5MjY3NTIyNCwiZXhwIjo0OTQ2Mjc1MjI0fQ.diG10GY5Mv_vRDbswP3ti48hFeNf90vM06KF7vCh1DxOUimBiiEkWuT8BHS-QnhoIyNxS4VmVla8VYs_OFb06Q",
  roxo: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Metas%20e%20Desempenho/Banner-Metas-Menor-roxo.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBNZXRhcyBlIERlc2VtcGVuaG8vQmFubmVyLU1ldGFzLU1lbm9yLXJveG8ucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5MjY3NTI0NCwiZXhwIjo0OTQ2Mjc1MjQ0fQ.LWWhZdAULiEC8Gaz-YHi58JtaiqetP1RSnSVBJZI9LkxilSLQMbw-ioaznDS681mxbHUjN6B30YVTPB3hXVQ_A",
  laranja: "https://zuzzoqdytblgswwlevjc.supabase.co/storage/v1/object/sign/icones/Menu%20Metas%20e%20Desempenho/Banner-Metas-Menor-laranja.png?token=eyJraWQiOiIwZWY5NzNhOC1iN2EwLTQ3NTQtODU2MC1lOGNhZDUzZGI2OTAiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpY29uZXMvTWVudSBNZXRhcyBlIERlc2VtcGVuaG8vQmFubmVyLU1ldGFzLU1lbm9yLWxhcmFuamEucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5MjY3NTI2MCwiZXhwIjo0OTQ2Mjc1MjYwfQ.Y1x5m6MFTfn8PHSsesetEmcQiGMmIIv5JSKjoq6LWi8Qew1HOEJSQMY21DLboT--CErmJBc7g_YbIgEW6QKnfw"
};

interface MetasViewProps {
  metas: Meta[];
  conquistas: Conquista[];
  marcos: MarcoEstudo[];
  stats: EstatisticasProgressoReal;
  onAddMeta: (meta: Omit<Meta, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateMeta: (id: string, partial: Partial<Meta>) => Promise<void>;
  onDeleteMeta: (id: string) => Promise<void>;
}

export const MetasView: React.FC<MetasViewProps> = ({
  metas,
  conquistas,
  marcos,
  stats,
  onAddMeta,
  onDeleteMeta
}) => {
  const { colorSkin, palette } = useTheme();
  const currentTheme = (
    colorSkin === 'purple' ? 'roxo' :
    colorSkin === 'orange' || colorSkin === 'dbz' ? 'laranja' :
    colorSkin || palette?.id || 'verde'
  ).toLowerCase();

  const themeKey = (currentTheme || 'verde').toLowerCase();
  const bannerMetasUrl = METAS_DESEMPENHO_BANNER_THEMES[themeKey] || METAS_DESEMPENHO_BANNER_THEMES.verde;
  const bannerMenorUrl = METAS_MENOR_BANNER_THEMES[themeKey] || METAS_MENOR_BANNER_THEMES.verde;

  const [activeTab, setActiveTab] = useState<'metas' | 'streak' | 'conquistas' | 'marcos'>('metas');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'diaria' | 'semanal' | 'mensal'>('all');
  const [filterConquistaCat, setFilterConquistaCat] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [targetType, setTargetType] = useState<TargetType>('horas');
  const [targetValue, setTargetValue] = useState('25');
  const [unit, setUnit] = useState('horas');
  const [period, setPeriod] = useState<TargetPeriod>('semanal');
  const [deadline, setDeadline] = useState(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTypeChange = (type: TargetType) => {
    setTargetType(type);
    if (type === 'horas' || type === 'horas_semanais') setUnit('horas');
    else if (type === 'questoes') setUnit('questões');
    else if (type === 'revisoes') setUnit('revisões');
    else if (type === 'taxa_acerto') setUnit('%');
    else setUnit('tópicos');
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddMeta({
        userId: 'user_demo_01',
        title,
        targetType,
        targetValue: parseFloat(targetValue) || 10,
        currentValue: 0,
        unit,
        period,
        deadline,
        status: 'em_progresso',
        autoCalculate: true,
      });
      setIsAddModalOpen(false);
      setTitle('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMetas = useMemo(() => {
    return metas.filter(m => filterPeriod === 'all' || m.period === filterPeriod);
  }, [metas, filterPeriod]);

  const filteredConquistas = useMemo(() => {
    return conquistas.filter(c => filterConquistaCat === 'all' || c.category === filterConquistaCat);
  }, [conquistas, filterConquistaCat]);

  const unlockedConquistasCount = conquistas.filter(c => c.unlocked).length;
  const completedMarcosCount = marcos.filter(m => m.isCompleted).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            Metas, Sequência & Conquistas
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Acompanhe indicadores calculados a partir das suas horas e questões reais.
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsAddModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Nova Meta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          ref={(el) => {
            if (el) {
              el.style.setProperty('background-image', `url('${bannerMetasUrl}')`, 'important');
              el.style.setProperty('background-size', 'cover', 'important');
              el.style.setProperty('background-position', '74% 24%', 'important');
              el.style.setProperty('background-repeat', 'no-repeat', 'important');
            }
          }}
          className="md:col-span-2 relative overflow-hidden rounded-2xl bg-slate-950 text-white border border-slate-800/60 shadow-md card-banner metas-xp-banner"
          style={{
            backgroundImage: `url('${bannerMetasUrl}')`,
            backgroundSize: 'cover',
            backgroundPosition: '74% 24%',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Imagem enquadrada preenchendo 100% do quadro sem bordas externas */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
            <img
              key={bannerMetasUrl}
              src={bannerMetasUrl}
              alt="Banner Nível e XP"
              className="w-full h-full object-cover object-center scale-100 transition-transform duration-300"
            />
          </div>

          {/* Gradiente sutil para preservar legibilidade total dos elementos internos sobrepostos */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-950/35 to-slate-950/15 pointer-events-none z-[1]" />

          <CardBody className="relative z-10 p-5 sm:p-6 flex flex-col justify-between space-y-4 h-full">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/15 backdrop-blur-md flex items-center justify-center text-amber-400 shadow-inner">
                  <Zap className="w-7 h-7 fill-current" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-extrabold tracking-wider !text-white text-white drop-shadow-xs">Nível {stats.nivelAtual}</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase backdrop-blur-xs">{stats.tituloNivel}</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black !text-white text-white mt-0.5 drop-shadow-sm">{stats.xpTotal.toLocaleString('pt-BR')} XP</h3>
                </div>
              </div>
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="w-full bg-black/45 h-3 rounded-full overflow-hidden p-0.5 border border-white/15 backdrop-blur-xs">
                <div className="bg-gradient-to-r from-amber-400 to-amber-300 h-full rounded-full transition-all duration-700" style={{ width: `${stats.percentualNivel}%` }} />
              </div>
              <div className="flex justify-between text-[11px] !text-slate-100 text-slate-100 font-medium drop-shadow-xs">
                <span className="!text-slate-100 text-slate-100">Faltam {stats.xpProximoNivel - stats.xpNivelAtual} XP para o Nível {stats.nivelAtual + 1}</span>
                <span className="!text-slate-100 text-slate-100">{stats.percentualNivel}% concluído</span>
              </div>
            </div>
          </CardBody>
        </div>

        <div
          ref={(el) => {
            if (el) {
              el.style.setProperty('background-image', `url('${bannerMenorUrl}')`, 'important');
              el.style.setProperty('background-size', '132% 136%', 'important');
              el.style.setProperty('background-position', '58% center', 'important');
              el.style.setProperty('background-repeat', 'no-repeat', 'important');
            }
          }}
          className="relative overflow-hidden rounded-2xl bg-slate-950 text-white border border-slate-800/60 shadow-md card-banner metas-xp-banner"
          style={{
            backgroundImage: `url('${bannerMenorUrl}')`,
            backgroundSize: '132% 136%',
            backgroundPosition: '58% center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
            <img
              key={bannerMenorUrl}
              src={bannerMenorUrl}
              alt="Banner Sequência de Estudos"
              className="w-full h-full object-cover object-center scale-100 transition-transform duration-300"
            />
          </div>

          {/* Gradiente sutil para preservar legibilidade total dos elementos internos sobrepostos */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-950/40 to-slate-950/20 pointer-events-none z-[1]" />

          <CardBody className="relative z-10 p-5 flex flex-col justify-between space-y-3 h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400 drop-shadow-xs">Sequência de Estudos</span>
              <span className="p-1.5 rounded-lg bg-amber-500 text-white shadow-xs"><Flame className="w-4 h-4 fill-current" /></span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black !text-white text-white drop-shadow-sm">{stats.streakDias}</span>
              <span className="text-sm font-bold text-amber-400 drop-shadow-xs">dias seguidos</span>
            </div>
            <div className="pt-2 border-t border-white/15 text-xs !text-slate-200 text-slate-200 drop-shadow-xs">
              <span className="!text-slate-200 text-slate-200">Melhor recorde: <strong className="!text-white text-white">{stats.melhorStreakDias} dias</strong></span>
            </div>
          </CardBody>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto text-xs">
        <button onClick={() => setActiveTab('metas')} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'metas' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>Metas Quantitativas ({metas.length})</button>
        <button onClick={() => setActiveTab('streak')} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'streak' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>Sequência Semanal</button>
        <button onClick={() => setActiveTab('conquistas')} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'conquistas' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>Conquistas ({unlockedConquistasCount}/{conquistas.length})</button>
        <button onClick={() => setActiveTab('marcos')} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'marcos' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>Marcos do Edital ({completedMarcosCount}/{marcos.length})</button>
      </div>

      {activeTab === 'metas' && (
        <div className="space-y-4">
          {filteredMetas.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-500">
              Nenhuma meta quantitativa cadastrada. Clique em "Nova Meta" acima para definir suas metas de horas, questões ou revisões.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMetas.map(meta => {
                const percent = Math.min(100, Math.round((meta.currentValue / meta.targetValue) * 100));
                const isDone = percent >= 100 || meta.status === 'concluida';
                return (
                  <Card key={meta.id} className={`border-2 ${isDone ? 'border-emerald-500/40 bg-emerald-50/10' : 'border-slate-200 dark:border-slate-800'}`}>
                    <CardBody className="p-5 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant="purple" size="sm">Ciclo {meta.period}</Badge>
                          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mt-1">{meta.title}</h3>
                        </div>
                        <Badge variant={isDone ? 'emerald' : 'amber'} size="sm">{percent}%</Badge>
                      </div>
                      <div className="space-y-1.5">
                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                          <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${percent}%` }} />
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 font-medium">
                          <span><strong>{meta.currentValue}</strong> {meta.unit}</span>
                          <span>Alvo: {meta.targetValue} {meta.unit}</span>
                        </div>
                      </div>
                      <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button onClick={() => onDeleteMeta(meta.id)} className="text-slate-400 hover:text-rose-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'streak' && (
        <Card>
          <CardHeader title="Consistência nos Últimos 7 Dias" />
          <CardBody className="p-6">
            <div className="grid grid-cols-7 gap-2 sm:gap-4">
              {stats.diasAtivosUltimaSemana.map((dia, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border text-center space-y-2 ${dia.estudou ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                  <span className="text-[11px] uppercase font-black">{dia.diaSemana}</span>
                  <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${dia.estudou ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    <Flame className="w-4 h-4 fill-current" />
                  </div>
                  <span className="text-[10px] font-semibold">{dia.estudou ? `${dia.minutos} min` : 'Sem registro'}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === 'conquistas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConquistas.map(ach => (
            <Card key={ach.id} className={`border-2 ${ach.unlocked ? 'border-amber-400/50 bg-amber-500/5' : 'border-slate-200 dark:border-slate-800 opacity-75'}`}>
              <CardBody className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ach.unlocked ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <Award className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm">{ach.title}</h3>
                  </div>
                  {ach.unlocked ? <Badge variant="amber" size="sm">Desbloqueada</Badge> : <Lock className="w-4 h-4 text-slate-400" />}
                </div>
                <p className="text-xs text-slate-500">{ach.description}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'marcos' && (
        <div className="space-y-3">
          {marcos.map(marco => (
            <Card key={marco.id} className={`border-2 ${marco.isCompleted ? 'border-emerald-500/40 bg-emerald-50/10' : 'border-slate-200 dark:border-slate-800'}`}>
              <CardBody className="p-5 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm">{marco.title}</h3>
                  <p className="text-xs text-slate-500">{marco.description}</p>
                </div>
                <Badge variant={marco.isCompleted ? 'emerald' : 'slate'} size="sm">
                  {marco.isCompleted ? 'Concluído' : 'Em Andamento'}
                </Badge>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Criar Nova Meta"
        maxWidth="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <Input label="Título da Meta *" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Tipo</label>
              <select value={targetType} onChange={(e) => handleTypeChange(e.target.value as any)} className="w-full p-2.5 rounded border bg-white dark:bg-slate-900">
                <option value="horas">Horas de Estudo</option>
                <option value="questoes">Questões Resolvidas</option>
                <option value="revisoes">Revisões</option>
              </select>
            </div>
            <div>
              <label className="block font-bold mb-1">Periodicidade</label>
              <select value={period} onChange={(e) => setPeriod(e.target.value as any)} className="w-full p-2.5 rounded border bg-white dark:bg-slate-900">
                <option value="diaria">Diária</option>
                <option value="semanal">Semanal</option>
                <option value="mensal">Mensal</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Valor Alvo" type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} required />
            <Input label="Unidade" value={unit} onChange={(e) => setUnit(e.target.value)} required />
          </div>
          <Input label="Prazo Limite" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>Criar Meta</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
