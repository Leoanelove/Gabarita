# PROJECT_CONTEXT.md — Contexto Geral e Regras de Negócio do GABARITA

## 1. Visão Geral do Projeto

O **GABARITA** (`gabarita-concursos`) é uma plataforma web de planejamento de estudos, controle de edital verticalizado, sessões de estudo cronometradas, revisões espaçadas, flashcards, caderno de erros, simulados e análise de desempenho voltada para preparação em **concursos públicos**.

| Atributo | Especificação Real no Projeto |
| :--- | :--- |
| **Nome Oficial** | Gabarita - Estudos para Concursos (`gabarita-concursos` v1.0.0) |
| **Arquitetura** | SPA em React 19 + TypeScript + Vite 8 com servidor backend Node.js/Express (`server.ts`) e BaaS Supabase |
| **Persistência** | Híbrida: **Supabase PostgreSQL** (quando autenticado no Supabase Auth) + cache/fallback local em `localStorage` (`gabarita_*`) para modo offline/convidado (`user_demo_01`) |
| **Identidade Visual** | Design System próprio (`src/design-system/`) com 5 paletas de cores (`verde` padrão, `azul`, `rosa`, `roxo`, `laranja`) e suporte a modo claro/escuro (`dark`) |

## 2. Módulos e Domínios Funcionais

1. **Autenticação e Perfil (`AuthPage.tsx`, `PerfilView.tsx`, `AuthContext.tsx`)**:
   - Login e cadastro via e-mail/senha no **Supabase Auth**, Login com **Google OAuth** (`@react-oauth/google`), proteção opcional com **Cloudflare Turnstile** (`@marsidev/react-turnstile`), modo convidado/demonstração (`user_demo_01`) e exclusão de conta.
   - Gerenciamento de perfil, foto, concurso-alvo, horas diárias de estudo, XP, nível e sequência de dias (`streakDays`).
2. **Painel Principal / Dashboard (`DashboardView.tsx`, `StudyCharts.tsx`, `StreakCalendarModal.tsx`)**:
   - Visão consolidada do concurso ativo (`activeConcursoId`), progresso real do edital, gráficos de horas estudadas, calendário de ofensiva (`streak`) e atalhos para iniciar sessão de estudo.
3. **Concursos, Provas e Editais (`ConcursosView.tsx`, `ProvasTab.tsx`, `NovoConcursoModal.tsx`, `NovaProvaModal.tsx`)**:
   - Gestão de concursos (esfera federal/estadual/municipal, banca, cargo, remuneração, vagas, data da prova, arquivamento e seleção de concurso ativo único por usuário).
   - Cadastro e agendamento automático de provas (`autoScheduleProvaForConcurso`) vinculadas aos concursos.
   - Importação inteligente de editais (PDF ou texto) via `/api/edital/parse` (Gemini AI no servidor com fallback heurístico local em `editalParser.ts`) ou catálogo do Supabase (`editais` via `supabaseEditais.ts`).
4. **Disciplinas e Edital Verticalizado (`DisciplinasView.tsx`, `EditalImportModal.tsx`, `NovaMateriaModal.tsx`)**:
   - Estrutura hierárquica **Concurso $\rightarrow$ Disciplina (com peso e sigla) $\rightarrow$ Assunto (importância, dificuldade, status, % de domínio, questões) $\rightarrow$ Subtópico**.
   - Reordenação, duplicação e importação em árvore (`importEditalTree`). A seleção de um edital cadastrado usa seu ID. A mesclagem no concurso de destino grava disciplinas e tópicos no Supabase para usuários autenticados e preserva os registros existentes.
5. **Planejamento de Estudos: Ciclo vs. Cronograma (`PlanoView.tsx`, `CicloView.tsx`, `CalendarView.tsx`, `MetodoEstudoModal.tsx`)**:
   - Alternância explícita de método de estudo (`studyMethod`: `'ciclo'` ou `'cronograma'`).
   - **Ciclo de Estudos (`cycleService.ts`)**: Algoritmo de intercalação estrita (`strictInterleaveBlocks`) com distribuição uniforme (Bresenham/Weighted Stride) que impede blocos consecutivos da mesma disciplina, controle de volta (`resetCycleCurrentLap`), avanço/retrocesso e recálculo.
   - **Cronograma Semanal (`plannerService.ts`)**: Alocação baseada em disponibilidade semanal (`WeeklyAvailability`), detecção de conflitos, reagendamento em lote de sessões atrasadas (`batchRescheduleOverdue`) e marcação de sessões estudadas.
6. **Sessão de Estudo e Cronômetro (`SessaoEstudoView.tsx`, `StudyTimerModal.tsx`, `StudyRegisterModal.tsx`, `StudyTimerContext.tsx`)**:
   - Cronômetro persistente (`TimerService` em `localStorage`) nos modos `livre`, `pomodoro` e `regressivo`, com alarmes sonoros customizáveis (`RingtoneSelectorModal.tsx`, `soundEffects.ts`).
   - Registro detalhado de sessões (`SessaoEstudo`) com intervalo de páginas (`PageInterval`), videoaulas (`VideoaulaRecord`), questões resolvidas, origem (`manual`, `cronometro`, `pomodoro`, `edital`, etc.) e agendamento automático de revisões.
7. **Revisões Espaçadas (`RevisoesView.tsx`)**:
   - Ciclo de revisões configurável (`RevisionSettings`: intervalos padrão `24h`, `7d`, `15d`, `30d`, `60d`, modo adaptativo por desempenho `easeMultiplier` / `hardPenaltyDays`) e preservação de metadados da sessão original que gerou a revisão.
8. **Flashcards (`Flashcards.tsx`, `FlashcardPlayer.tsx`, `GmailRichTextEditor.tsx`, `apkgParser.ts`)**:
   - Baralhos (`decks`) e cartões (`flashcards`) com editor rich-text e importador de pacotes **Anki `.apkg`** no navegador (via `jszip` + `sql.js` WebAssembly + descompressão `fzstd`, com suporte a cartões *Cloze* e fallback binário em TypeScript).
9. **Questões, Blocos e Caderno de Erros (`src/components/cadernoerros/QuestoesView.tsx`, `CadernoErrosView.tsx`)**:
   - Registro de blocos de questões (`blocos_questoes`), banco de questões e **Caderno de Erros** (`caderno_erros`) com vínculo explícito ao concurso ativo (`concursoId`), filtragem isolada por concurso foco ativo em métricas/listas, motivo do erro, contador de reincidência (`incrementarReincidenciaErro`) e agendamento de revisão.
10. **Simulados (`SimuladosView.tsx`, `RegisterSimuladoModal.tsx`, `SimuladoDetailModal.tsx`, `SimuladoLineChart.tsx`)**:
    - Cadastro, execução com salvamento de progresso (`saveSimuladoProgress`), finalização (`finishSimulado`), evolução gráfica e envio de questões erradas direto para o Caderno de Erros.
11. **Resumos (`ResumosView.tsx`), Histórico (`HistoricoView.tsx`) e Analytics (`AnalyticsView.tsx`)**:
    - Editor e biblioteca de resumos (`resumos`), linha do tempo completa do histórico de estudos, relatórios analíticos avançados e exportação em PDF/imagem (`jspdf`, `html2canvas`).
12. **Administração e Planos (`AdminView.tsx`, `ModalAdminEdital.tsx`, `PlanosAssinaturaView.tsx`, `featureGate.ts`)**:
    - Painel administrativo para gestão de editais oficiais no Supabase (`POST /api/editais`).
    - Controle de limites por plano (`FeatureGate`: `gratuito`, `teste`, `mensal`, `anual`) e fluxo de checkout em `paymentService.ts` (com fallback simulado caso o endpoint `/api/payment/checkout` não esteja ativo).
    - **Módulos desabilitados por flag em `src/App.tsx`**: `ENABLE_METAS_MODULE = false` (`MetasView`) e `ENABLE_AI_ASSISTANT_MODULE = false` (`AIAssistantView`).

## 3. Regras de Negócio Críticas

### 3.1. Concurso Ativo Único (`activeConcursoId`) e Isolamento de Dados
- Apenas um concurso fica marcado como ativo (`active: true`) por vez. Ao criar ou ativar um concurso, os demais do usuário são desativados (`server.ts` e `db.ts`).
- `DatabaseService.purgeDuplicateGhostSessions()` e `DatabaseService.sanitizeOrphanData()` são executados no carregamento inicial (`loadData` em `src/App.tsx`) para limpar sessões fantasma duplicadas e higienizar órfãos no armazenamento local. As disciplinas e os tópicos são carregados depois de seus respectivos registros pai.

### 3.2. Regra de Atraso no Cronograma (`PlannerService.isSessionOverdue`)
- Definida em `src/services/plannerService.ts`: **blocos do dia atual (`session.date === todayStr`) ou futuros NUNCA são considerados atrasados**.
- Uma sessão só entra como atrasada no dia seguinte (`session.date < todayStr`) e apenas se não tiver sido marcada como `'concluida'` nem possuir sessão correspondente registrada em `sessoes` (por disciplina/assunto e data).

### 3.3. Regra de Intercalação do Ciclo (`CycleService.strictInterleaveBlocks`)
- Definida em `src/services/cycleService.ts`: dois blocos consecutivos não podem pertencer à mesma disciplina (`bloco_i.disciplinaId !== bloco_{i-1}.disciplinaId`), exceto quando houver apenas 1 disciplina no ciclo. Se uma disciplina for dominante (`domCount > othersCount + 1`), aplica distribuição uniforme por *Bresenham Partitioning* em vez de empilhar blocos repetidos no final.

### 3.4. Regra de Tema com Fallback por Inatividade (`ThemeContext.tsx`)
- Em `resolveInitialSkinWithFallback()`: se não houver `theme_preference` salvo **ou** se a diferença `(Date.now() - last_active_timestamp)` ultrapassar **7 dias** (`INACTIVITY_LIMIT_MS`), o tema visual retorna obrigatoriamente para `'verde'` (`#00A86B`). As chaves legadas `'purple'` e `'orange'`/`'dbz'` são normalizadas para `'roxo'` e `'laranja'`.

### 3.5. Limites de Plano (`FeatureGate` em `src/utils/featureGate.ts`)
- `gratuito`: `maxConcursos: 1` e demais recursos avançados (`unlimitedEditalParser`, `unlimitedAIAssistant`, `advancedAnalytics`, `unlimitedSimulados`) como `false`.
- `teste` (7 dias, se não expirado), `mensal` e `anual`: `maxConcursos: 999` e todos os recursos liberados (`true`).

### 3.6. Higienização de Editais (`editalParser.ts` e `supabaseEditais.ts`)
- `isGenericGroupingHeader()` bloqueia cabeçalhos estruturais genéricos de editais (ex.: `"CONHECIMENTOS BÁSICOS"`, `"CONTEÚDO PROGRAMÁTICO"`, `"DO QUADRO DE PROVAS"`) para que não sejam importados como disciplinas ou tópicos reais.
- `restoreGluedDisciplineNames()` corrige nomes aglutinados vindos de extração de PDF (ex.: `DIREITOCONSTITUCIONAL` $\rightarrow$ `DIREITO CONSTITUCIONAL`).

## 4. Funcionalidades Críticas que Não Devem Ser Alteradas Inadvertidamente

1. **Sanitização de URLs do Supabase (`vite.config.ts`, `server.ts`, `src/services/supabaseClient.ts`)**:
   - A função `sanitizeSupabaseUrl` / `sanitizeServerUrl` remove sufixos `/rest/v1` ou `/auth/v1` e corrige erros comuns de digitação na URL antes de instanciar o cliente Supabase.
2. **Limpeza de Inicialização (`loadData` em `src/App.tsx`)**:
   - A higienização de órfãos ocorre no cache local. A purga de sessões fantasmas usa IDs identificados e limita a operação ao usuário da sessão.
3. **Motor de Timer Persistente (`src/services/timerService.ts` e `src/contexts/StudyTimerContext.tsx`)**:
   - O cálculo de delta por `lastStartTimestamp` (com trava de segurança `< 24h`) evita perda de tempo estudado ao recarregar a página ou trocar de aba.
4. **Parser de Anki `.apkg` (`src/utils/apkgParser.ts`)**:
   - Depende da importação explícita de `sql.js/dist/sql-wasm.wasm?url` via Vite e de `fzstd` para coleções Anki modernas (Zstandard), além de possuir fallback binário.
5. **Regras de `PlannerService` e `CycleService`**:
   - Não alterar as condições de atraso (`session.date >= todayStr` nunca atrasa) nem o algoritmo de intercalação estrita sem validação explícita.
