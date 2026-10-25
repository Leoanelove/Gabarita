# Plano de Migração e Persistência Real no Supabase (Sem Regressão Visual ou Funcional)

Plano arquitetural e operacional para substituir 100% dos dados simulados, arrays estáticos e mocks do Gabarita por persistência real no banco de dados Supabase, preservando rigorosamente a identidade visual, banners, paleta de temas, microinterações e lógica de negócio.

---

### Decisões Críticas Confirmadas com o Usuário

> [!IMPORTANT]
> As seguintes diretrizes foram alinhadas e confirmadas na Fase 1 de planejamento:
> 1. **Autenticação Real com Supabase Auth**: Integração completa com `supabase.auth.signUp`, `signInWithPassword`, `signOut` e recuperação de senha, mantendo uma camada de resiliência e fallback seguro.
> 2. **Base Limpa Inicial no Supabase**: Ao conectar com a conta real no Supabase, dados legados/fictícios de demonstração anteriores em cache são ignorados, garantindo que o concurseiro inicie com sua base limpa, personalizada e isolada.
> 3. **Cache Local Transparente e Tolerância a Falhas**: Consultas e mutações realizam cache inteligente em memória/armazenamento local seguro, garantindo que oscilações temporárias de conexão ou instabilidades de rede nunca quebrem a interface nem causem telas brancas ("zero-crash resilience").

---

## 1. Mapeamento de Dados Atuais & Mocks no Projeto

Varredura completa dos arquivos do projeto contendo dados estáticos, mocks e simuladores locais:

| Arquivo Fonte | Entidades Simuladas / Dados Hardcoded | Descrição da Dependência Atual |
| :--- | :--- | :--- |
| `src/services/seedData.ts` | `INITIAL_USER`, `INITIAL_PROVAS`, `INITIAL_REVISION_SETTINGS`, `INITIAL_STUDY_PLAN`, `INITIAL_STUDY_CYCLE` | Define objetos pré-moldados e listas de provas pré-carregadas (TCE-GO, PF, INSS) e usuário demo (`user_demo_01`). |
| `src/services/auth.ts` | Sessão simulada (`gabarita_auth_session_v2`), login sem senha real | Simula autenticação persistindo objeto estático no `localStorage` sem chamar o endpoint de Auth do Supabase. |
| `src/services/db.ts` | Concursos, Disciplinas, Assuntos, Sessões, Revisões, Questões, Blocos, Caderno de Erros, Metas, Conquistas, Simulados, Planos e Ciclos | Centraliza todas as leituras e gravações via `localStorage` com IDs manuais baseados em timestamp (`conc_...`, `disc_...`, `ass_...`). |
| `src/components/flashcards/Flashcards.tsx` | Decks e Flashcards (`@gabarita:decks`, `@gabarita:flashcards`) | Armazena baralhos e cartões criados pelo usuário apenas no `localStorage` do navegador. |
| `src/components/concursos/ConcursosView.tsx` | Provas anteriores e status de editais | Carrega provas a partir de `DatabaseService.getProvas()` (inicializadas com dados de exemplo). |
| `src/components/plano/PlanoView.tsx` & `CicloView.tsx` | Cronogramas (`gabarita_study_plan`) e Ciclos (`gabarita_study_cycle`) | Armazenamento local do cronograma semanal e dos blocos do ciclo de estudos. |
| `src/components/simulados/SimuladosView.tsx` | Histórico e realização de simulados | Persistência local de simulados, pontuações e gabaritos respondidos. |
| `src/components/questoes/QuestoesView.tsx` & `CadernoErrosView.tsx` | Histórico de blocos resolvidos e erros catalogados | Resoluções e motivos de erro gravados em chaves locais do navegador. |

---

## 2. Modelagem no Supabase & Script SQL Completo

Abaixo está o script DDL SQL completo pronto para ser executado no **Supabase SQL Editor**. Ele cria as tabelas com integridade relacional, tipos nativos, gatilhos de `updated_at`, índices de performance e políticas RLS (Row Level Security) que garantem que cada usuário acesse apenas seus próprios dados.

```sql
-- ====================================================================
-- GABARITA - SCHEMA COMPLETO SUPABASE COM RLS (ROW LEVEL SECURITY)
-- ====================================================================

-- 1. Habilitar extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Perfis de Usuário (vinculada à auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Concurseiro(a)',
  role TEXT NOT NULL DEFAULT 'aluno',
  photo_url TEXT DEFAULT '',
  bio TEXT DEFAULT 'Foco total na aprovação e consistência diária nos estudos.',
  target_concurso_id TEXT DEFAULT '',
  target_concurso_title TEXT DEFAULT '',
  study_hours_per_day NUMERIC(4,2) DEFAULT 4.0,
  streak_days INTEGER DEFAULT 0,
  last_study_date TIMESTAMPTZ,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  preferences JSONB DEFAULT '{
    "theme": "dark",
    "colorSkin": "verde",
    "studyMethod": "ciclo",
    "notificationsEnabled": true,
    "emailAlerts": true,
    "pomodoroWorkMin": 50,
    "pomodoroBreakMin": 10,
    "soundEnabled": true,
    "consentGiven": true
  }'::jsonb,
  subscription JSONB DEFAULT '{
    "plan": "gratuito",
    "status": "ativo",
    "startDate": null,
    "expiresAt": null
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Concursos Cadastrados
CREATE TABLE IF NOT EXISTS public.concursos (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  organ TEXT NOT NULL,
  orgao TEXT,
  role TEXT NOT NULL,
  banca TEXT DEFAULT 'FGV',
  sphere TEXT DEFAULT 'federal',
  remuneration NUMERIC(10,2) DEFAULT 0,
  vacant_positions INTEGER DEFAULT 0,
  status TEXT DEFAULT 'autorizado',
  exam_date DATE,
  registration_start_date DATE,
  registration_end_date DATE,
  edital_url TEXT,
  active BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Provas Anteriores / Simulações Oficiais
CREATE TABLE IF NOT EXISTS public.provas (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concurso_id TEXT REFERENCES public.concursos(id) ON DELETE SET NULL,
  organ TEXT NOT NULL,
  banca TEXT NOT NULL,
  year INTEGER NOT NULL,
  role TEXT NOT NULL,
  questions_count INTEGER DEFAULT 120,
  duration_minutes INTEGER DEFAULT 240,
  exam_date DATE,
  category TEXT DEFAULT 'GERAL',
  status TEXT DEFAULT 'agendada',
  notes TEXT,
  file_url TEXT,
  template_file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Disciplinas
CREATE TABLE IF NOT EXISTS public.disciplinas (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concurso_id TEXT REFERENCES public.concursos(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  color TEXT DEFAULT '#10b981',
  icon TEXT DEFAULT 'BookOpen',
  weight NUMERIC(4,2) DEFAULT 2.0,
  "order" INTEGER DEFAULT 1,
  topics_count INTEGER DEFAULT 0,
  completed_topics_count INTEGER DEFAULT 0,
  total_study_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela de Assuntos / Tópicos do Edital
CREATE TABLE IF NOT EXISTS public.assuntos (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  disciplina_id TEXT NOT NULL REFERENCES public.disciplinas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "order" INTEGER DEFAULT 1,
  importance TEXT DEFAULT 'alta',
  difficulty TEXT DEFAULT 'media',
  status TEXT DEFAULT 'nao_iniciado',
  mastery_level INTEGER DEFAULT 0,
  total_questions_solved INTEGER DEFAULT 0,
  correct_questions_solved INTEGER DEFAULT 0,
  accuracy_rate INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  link TEXT,
  notes TEXT,
  last_studied_at TIMESTAMPTZ,
  subtopicos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabela de Sessões de Estudo Registradas (Pomodoro, Cronômetro, Registro Manual)
CREATE TABLE IF NOT EXISTS public.sessoes_estudo (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  disciplina_id TEXT NOT NULL REFERENCES public.disciplinas(id) ON DELETE CASCADE,
  assunto_id TEXT REFERENCES public.assuntos(id) ON DELETE SET NULL,
  disciplina_name TEXT NOT NULL,
  assunto_name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  planned_minutes INTEGER,
  type TEXT NOT NULL DEFAULT 'teoria',
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  accuracy_rate INTEGER,
  notes TEXT,
  teoria_finalizada BOOLEAN DEFAULT false,
  page_intervals JSONB DEFAULT '[]'::jsonb,
  videoaulas JSONB DEFAULT '[]'::jsonb,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabela de Revisões Espaçadas (SRS)
CREATE TABLE IF NOT EXISTS public.revisoes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  disciplina_id TEXT NOT NULL REFERENCES public.disciplinas(id) ON DELETE CASCADE,
  assunto_id TEXT REFERENCES public.assuntos(id) ON DELETE SET NULL,
  disciplina_name TEXT NOT NULL,
  assunto_name TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'intervalada',
  stage INTEGER DEFAULT 1,
  total_stages INTEGER DEFAULT 5,
  interval_days INTEGER DEFAULT 1,
  scheduled_for DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pendente',
  rating TEXT,
  accuracy_rate INTEGER,
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  notes TEXT,
  is_automatic BOOLEAN DEFAULT false,
  next_revision_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Tabela de Configurações de Revisão Espaçada
CREATE TABLE IF NOT EXISTS public.revision_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  auto_schedule_on_study BOOLEAN DEFAULT true,
  auto_schedule_on_questions BOOLEAN DEFAULT true,
  interval_days INTEGER[] DEFAULT '{1, 7, 15, 30, 60}',
  performance_adaptive BOOLEAN DEFAULT true,
  ease_multiplier NUMERIC(3,2) DEFAULT 1.8,
  hard_penalty_days INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Tabela de Blocos de Resolução de Questões
CREATE TABLE IF NOT EXISTS public.blocos_questoes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  disciplina_id TEXT NOT NULL REFERENCES public.disciplinas(id) ON DELETE CASCADE,
  disciplina_name TEXT NOT NULL,
  assunto_id TEXT REFERENCES public.assuntos(id) ON DELETE SET NULL,
  assunto_name TEXT,
  banca TEXT DEFAULT 'FGV',
  difficulty TEXT DEFAULT 'media',
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  wrong_answers INTEGER NOT NULL,
  doubt_count INTEGER DEFAULT 0,
  accuracy_rate INTEGER NOT NULL,
  date DATE NOT NULL,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Tabela do Caderno de Erros
CREATE TABLE IF NOT EXISTS public.caderno_erros (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bloco_questoes_id TEXT REFERENCES public.blocos_questoes(id) ON DELETE SET NULL,
  statement_or_excerpt TEXT NOT NULL,
  disciplina_id TEXT NOT NULL REFERENCES public.disciplinas(id) ON DELETE CASCADE,
  disciplina_name TEXT NOT NULL,
  assunto_id TEXT REFERENCES public.assuntos(id) ON DELETE SET NULL,
  assunto_name TEXT NOT NULL,
  banca TEXT,
  difficulty TEXT DEFAULT 'media',
  motivo TEXT NOT NULL DEFAULT 'falta_atencao',
  observation TEXT,
  correct_answer TEXT,
  question_url TEXT,
  status_revisao TEXT DEFAULT 'pendente',
  reincidencia_count INTEGER DEFAULT 1,
  last_reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Tabela de Metas
CREATE TABLE IF NOT EXISTS public.metas (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_value NUMERIC(10,2) NOT NULL,
  current_value NUMERIC(10,2) DEFAULT 0,
  unit TEXT NOT NULL,
  deadline DATE NOT NULL,
  period TEXT DEFAULT 'semanal',
  status TEXT DEFAULT 'em_progresso',
  auto_calculate BOOLEAN DEFAULT true,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Tabela de Decks e Flashcards
CREATE TABLE IF NOT EXISTS public.decks (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  disciplina TEXT NOT NULL,
  nome TEXT NOT NULL,
  icone TEXT DEFAULT 'Layers',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.flashcards (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_id TEXT NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  disciplina TEXT NOT NULL,
  topico TEXT,
  frente TEXT NOT NULL,
  verso TEXT NOT NULL,
  dificuldade TEXT,
  intervalo_dias INTEGER DEFAULT 1,
  proxima_revisao DATE NOT NULL,
  revisoes_total INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Tabela de Simulados Completos
CREATE TABLE IF NOT EXISTS public.simulados (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concurso_id TEXT REFERENCES public.concursos(id) ON DELETE SET NULL,
  concurso_name TEXT,
  title TEXT NOT NULL,
  description TEXT,
  banca TEXT DEFAULT 'FGV',
  modalidade TEXT DEFAULT 'multipla_escolha',
  cebraspe_penalty BOOLEAN DEFAULT false,
  questions_count INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  time_remaining_seconds INTEGER,
  elapsed_seconds INTEGER,
  disciplinas_config JSONB DEFAULT '[]'::jsonb,
  questoes JSONB DEFAULT '[]'::jsonb,
  score NUMERIC(6,2),
  max_score NUMERIC(6,2) NOT NULL,
  accuracy_rate INTEGER,
  total_correct INTEGER,
  total_wrong INTEGER,
  total_blank INTEGER,
  status TEXT DEFAULT 'agendado',
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  desempenho_por_disciplina JSONB DEFAULT '[]'::jsonb,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Tabela de Plano de Estudos (Cronograma Semanal)
CREATE TABLE IF NOT EXISTS public.study_plans (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concurso_id TEXT REFERENCES public.concursos(id) ON DELETE CASCADE,
  concurso_title TEXT,
  target_exam_date DATE,
  start_date DATE,
  weekly_availability JSONB NOT NULL,
  daily_average_minutes INTEGER DEFAULT 240,
  total_weeks INTEGER DEFAULT 12,
  total_planned_hours INTEGER DEFAULT 288,
  disciplinas_distribution JSONB DEFAULT '[]'::jsonb,
  sessions JSONB DEFAULT '[]'::jsonb,
  conflicts JSONB DEFAULT '[]'::jsonb,
  history_logs JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Tabela de Ciclos de Estudo
CREATE TABLE IF NOT EXISTS public.study_cycles (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concurso_id TEXT REFERENCES public.concursos(id) ON DELETE CASCADE,
  concurso_title TEXT,
  current_block_index INTEGER DEFAULT 0,
  completed_cycles_count INTEGER DEFAULT 0,
  total_cycle_minutes INTEGER DEFAULT 0,
  blocks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- HABILITAR RLS (ROW LEVEL SECURITY) EM TODAS AS TABELAS
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assuntos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessoes_estudo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revisoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocos_questoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caderno_erros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_cycles ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- POLÍTICAS RLS: O USUÁRIO APENAS VISUALIZA E MODIFICA SEUS PRÓPRIOS REGISTROS
-- ====================================================================

-- profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- concursos
CREATE POLICY "concursos_all_own" ON public.concursos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- provas
CREATE POLICY "provas_all_own" ON public.provas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- disciplinas
CREATE POLICY "disciplinas_all_own" ON public.disciplinas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- assuntos
CREATE POLICY "assuntos_all_own" ON public.assuntos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- sessoes_estudo
CREATE POLICY "sessoes_all_own" ON public.sessoes_estudo FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- revisoes
CREATE POLICY "revisoes_all_own" ON public.revisoes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- revision_settings
CREATE POLICY "rev_settings_all_own" ON public.revision_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- blocos_questoes
CREATE POLICY "blocos_all_own" ON public.blocos_questoes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- caderno_erros
CREATE POLICY "caderno_all_own" ON public.caderno_erros FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- metas
CREATE POLICY "metas_all_own" ON public.metas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- decks & flashcards
CREATE POLICY "decks_all_own" ON public.decks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "flashcards_all_own" ON public.flashcards FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- simulados
CREATE POLICY "simulados_all_own" ON public.simulados FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- study_plans & study_cycles
CREATE POLICY "plans_all_own" ON public.study_plans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cycles_all_own" ON public.study_cycles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trigger automático para criar o registro em public.profiles quando um usuário for criado no auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 3. Estratégia de Serviços & CRUD (Supabase Data Adapter)

### 3.1 Arquitetura de Camada de Persistência Híbrida e Resiliente

Para garantir **zero regressão visual ou quebra funcional**, o `DatabaseService` em `src/services/db.ts` continuará sendo a interface canônica consumida pelo `App.tsx` e pelos componentes. Internamente:

```
┌────────────────────────────────────────────────────────┐
│           Interface do Usuário (React Views)           │
│   Dashboard, Concursos, Disciplinas, Revisões, etc.     │
└───────────────────────────┬────────────────────────────┘
                            │ (Chamadas transparentes aos métodos de serviço)
┌───────────────────────────▼────────────────────────────┐
│                    DatabaseService                     │
│               (Adapter Pattern em db.ts)               │
├───────────────────────────┬────────────────────────────┤
│ Se conectado com Supabase:│ Se offline ou erro de rede:│
│ Queries diretas com RLS   │ Fallback transparente com  │
│ (supabase.from('...'))    │ cache local isolado        │
└───────────────────────────┴────────────────────────────┘
```

1. **Transformação Automática de CamelCase $\leftrightarrow$ Snake_Case**:
   - As tabelas Postgres utilizam convenção `snake_case` (`user_id`, `concurso_id`, `duration_minutes`).
   - O adapter converte de forma tipada e segura para as interfaces TypeScript já usadas no app (`userId`, `concursoId`, `durationMinutes`), impedindo qualquer erro em tempo de execução nos componentes visuais.

2. **Tratamento de Estados Assíncronos & Carregamento**:
   - Em `App.tsx`, o hook de inicialização já gerencia `isDataLoading` com tela de splash temático e `Loader2`.
   - Adição de `refreshData()` silencioso para mutações (ao salvar sessão, adicionar matéria ou alterar status de revisão, os estados React são atualizados otimisticamente e sincronizados na nuvem em background).

3. **Tratamento de Estados Vazios (Zero State)**:
   - Quando um usuário cria uma conta nova no Supabase, a base de dados vem sem matérias ou metas cadastradas.
   - O Gabarita já conta com componentes dedicados de Zero State estilizados (`EmptyContestState` com banners e botões de ação amigáveis).
   - O plano preserva e ativa corretamente o `EmptyContestState`, incentivando o usuário a criar seu concurso foco ou importar edital com IA, sem exibir erros de tabela vazia ou renderização nula (`undefined.map`).

---

## 4. Roteiro de Execução Faseado com Testes de Validação

### Fase 1: Autenticação Real Supabase & Perfis de Usuário
- **Objetivo**: Conectar `AuthService` diretamente ao `supabase.auth` (`signUp`, `signInWithPassword`, `signOut`, `onAuthStateChange`).
- **Ações**:
  - Ajustar `src/services/auth.ts` para autenticar credenciais no Supabase.
  - Sincronizar o perfil retornado com a tabela `public.profiles`.
  - Manter sessão persistida via `supabase.auth.getSession()` ao recarregar a página (F5).
- **Validação & Testes**:
  - Testar cadastro de novo usuário com email/senha.
  - Testar login e logout.
  - Garantir que a tela de login respeite 100% o tema visual e banners atuais.

### Fase 2: Concursos, Editais, Provas e Disciplinas
- **Objetivo**: Persistir o cadastro de concursos, matérias (`disciplinas`), tópicos (`assuntos`), subtópicos e importações de editais via IA.
- **Ações**:
  - Implementar métodos CRUD em `DatabaseService` apontando para `concursos`, `provas`, `disciplinas` e `assuntos`.
  - Suportar o fluxo completo de "Importar Edital com IA", gravando em lote com IDs limpos no Supabase.
- **Validação & Testes**:
  - Cadastrar um concurso foco e verificar sua inserção no Supabase.
  - Adicionar matérias e tópicos manualmente e por importação.
  - Confirmar que a visualização na aba `Disciplinas` e no Seletor de Concursos do topo permanece idêntica.

### Fase 3: Sessões de Estudo, Pomodoro e Cronômetro
- **Objetivo**: Gravar sessões completadas (`sessoes_estudo`), cálculo de XP, subida de nível e registro de páginas e videoaulas.
- **Ações**:
  - Conectar `recordStudySession` à tabela `public.sessoes_estudo`.
  - Atualizar `xp`, `level` e `streak_days` do perfil no Supabase a cada sessão concluída.
- **Validação & Testes**:
  - Iniciar e finalizar um Pomodoro/Cronômetro de estudo.
  - Registrar uma sessão com questões resolvidas.
  - Verificar se os gráficos de horas e estatísticas no Dashboard atualizam em tempo real.

### Fase 4: Revisões Espaçadas (SRS) e Blocos de Questões / Caderno de Erros
- **Objetivo**: Migrar o algoritmo de revisão intervalada (1, 7, 15, 30, 60 dias) e o Caderno de Erros para o Supabase.
- **Ações**:
  - Salvar revisões criadas e atualizadas na tabela `public.revisoes`.
  - Gravar blocos de resolução em `public.blocos_questoes` e itens de erro em `public.caderno_erros`.
- **Validação & Testes**:
  - Registrar revisão concluída com avaliação (Fácil, Médio, Difícil, Errei).
  - Adicionar questão com motivo de erro ao Caderno de Erros e verificar sua persistência na nuvem.

### Fase 5: Cronogramas Semanais, Ciclos de Estudo, Flashcards e Simulados
- **Objetivo**: Concluir a persistência das ferramentas avançadas de estudo.
- **Ações**:
  - Conectar `study_plans`, `study_cycles`, `decks`, `flashcards` e `simulados` às respectivas tabelas Supabase.
  - Garantir que a alternância entre modo Ciclo e modo Cronograma mantenha sincronia perfeita.
- **Validação & Testes**:
  - Criar um ciclo de estudos e avançar blocos de matérias.
  - Criar um baralho de Flashcards, virar cartões e salvar resposta.
  - Simular e finalizar um simulado, conferindo gráfico de evolução de pontuação líquida.

---

## 5. Garantia Estrita de Não-Regressão

- **Zero Alteração no CSS / Tailwind**: Nenhuma classe de estilo, arquivo CSS ou componente do Design System (`Button`, `Card`, `Badge`, `Modal`) sofrerá modificações estéticas.
- **Preservação de Todos os Banners**: Os banners de temas dinâmicos (verde, azul, rosa, roxo, laranja) e logos continuam intactos com suas URLs e sombras neon.
- **Zero Quebra de Contratos**: Todas as assinaturas de funções de `DatabaseService` manterão os tipos de retorno TypeScript esperados pelos componentes, assegurando compilação limpa (`compile_applet`) sem advertências.
