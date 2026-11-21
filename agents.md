# AGENTS.md — Diretrizes Operacionais e Regras de Manutenção para Agentes de IA (GABARITA)

Este documento define o protocolo obrigatório de atuação para qualquer agente de inteligência artificial ou engenheiro de software ao analisar, corrigir ou evoluir o código-fonte do **GABARITA**.

## 1. Papel e Postura Técnica

- Atue sempre como um **Engenheiro de Software Sênior / Arquiteto de Sistemas** responsável pela manutenção evolutiva e corretiva do aplicativo React/TypeScript, do servidor Express (`server.ts`) e da integração com o Supabase.
- Foque na estabilidade da interface, na preservação das regras de estudo/planejamento e na integridade da sincronização entre `localStorage` e Supabase.

## 2. Regras Obrigatórias para Futuras Alterações

1. **Consulta Prévia Obrigatória**:
   - Sempre consulte `PROJECT_CONTEXT.md` e `ARCHITECTURE.md` antes de planejar ou executar qualquer modificação.
2. **Proibição de Reanálise Global Desnecessária**:
   - Não faça uma nova análise completa do projeto para alterações pontuais.
   - Inspecione **somente** os arquivos diretamente relacionados à solicitação e suas dependências diretas (usando o mapa da Seção 3).
3. **Escopo Estrito e Preservação de Visual e Lógica**:
   - Não modifique componentes, estilos, skins de tema, rotas ou estruturas de dados que não estejam diretamente relacionados à solicitação do usuário.
   - Preserve o Design System (`src/design-system/`), o comportamento das 5 skins em `ThemeContext.tsx` e os módulos desativados por flag (`ENABLE_METAS_MODULE`, `ENABLE_AI_ASSISTANT_MODULE`) salvo solicitação expressa.
4. **Código-Fonte como Verdade Definitiva**:
   - Se a documentação estiver desatualizada em algum ponto específico, verifique o código-fonte real do arquivo afetado antes de tomar decisões.
5. **Plano de Execução Prévio**:
   - Antes de modificar qualquer arquivo, apresente um **breve plano de execução** identificando quais arquivos serão criados ou afetados e o que será alterado em cada um.
6. **Registro de Incertezas e Proibição de Alucinação**:
   - Se encontrar alguma informação desconhecida, tabela ou coluna do Supabase não confirmada no código, registre como **pendência de verificação**. Nunca invente funcionalidades, tabelas, endpoints ou integrações.
7. **Segurança da Informação**:
   - Nunca inclua senhas, tokens JWT, chaves de API (`GEMINI_API_KEY`, chaves privadas de Service Account, chaves secretas) nos documentos, logs ou respostas.
8. **Atualização Contínua da Documentação**:
   - Após cada alteração concluída, atualize obrigatoriamente o `CHANGELOG.md` e, caso a mudança altere regras de negócio, tabelas, serviços ou estrutura de componentes, atualize também `PROJECT_CONTEXT.md` e `ARCHITECTURE.md`.

## 3. Mapa Rápido de Impacto por Domínio (Onde Inspecionar)

Para alterações pontuais, inspecione apenas os arquivos do domínio correspondente:

| Domínio / Solicitação | Arquivos Principais a Inspecionar | Dependências Diretas |
| :--- | :--- | :--- |
| **Autenticação, Login, Google OAuth e Turnstile** | `src/components/auth/AuthPage.tsx`, `src/contexts/AuthContext.tsx` | `src/services/auth.ts`, `src/services/supabaseClient.ts` |
| **Tema, Modo Claro/Escuro e 5 Skins de Cor** | `src/contexts/ThemeContext.tsx`, `src/index.css` | `src/App.tsx`, `src/design-system/ThemeToggle.tsx` |
| **Dashboard e Gráficos Iniciais** | `src/components/dashboard/DashboardView.tsx`, `StudyCharts.tsx`, `StreakCalendarModal.tsx` | `src/services/db.ts`, `src/types/index.ts` |
| **Concursos, Provas e Concurso Ativo** | `src/components/concursos/*` | `src/services/db.ts`, `server.ts` (`/api/concursos`) |
| **Disciplinas, Assuntos e Importação de Edital** | `src/components/disciplinas/*`, `src/services/editalParser.ts` | `src/services/supabaseEditais.ts`, `server.ts` (`/api/edital/parse`) |
| **Ciclo de Estudos** | `src/components/plano/CicloView.tsx`, `CriarCicloModal.tsx`, `NovoCicloWizardModal.tsx` | `src/services/cycleService.ts`, `src/services/db.ts` |
| **Cronograma Semanal e Calendário** | `src/components/plano/PlanoView.tsx`, `CalendarView.tsx`, `CriarCronogramaModal.tsx` | `src/services/plannerService.ts`, `src/services/db.ts` |
| **Cronômetro e Registro de Sessão de Estudo** | `src/components/estudos/*`, `src/contexts/StudyTimerContext.tsx` | `src/services/timerService.ts`, `src/hooks/useTimerAlarm.ts`, `src/services/db.ts` |
| **Revisões Espaçadas** | `src/components/revisoes/RevisoesView.tsx` | `src/services/db.ts`, `src/types/index.ts` |
| **Flashcards e Importação `.apkg` (Anki)** | `src/components/flashcards/*`, `src/utils/apkgParser.ts` | `src/services/db.ts` |
| **Questões e Caderno de Erros** | `src/components/questoes/QuestoesView.tsx`, `CadernoErrosView.tsx` | `src/services/db.ts`, `src/types/index.ts` |
| **Simulados** | `src/components/simulados/*` | `src/services/db.ts`, `src/types/index.ts` |
| **Resumos, Histórico e Analytics** | `src/components/resumos/ResumosView.tsx`, `src/components/historico/HistoricoView.tsx`, `src/components/analytics/AnalyticsView.tsx` | `src/services/db.ts` |
| **Administração de Editais e Planos/Assinatura** | `src/components/admin/*`, `src/components/planos/PlanosAssinaturaView.tsx` | `src/utils/featureGate.ts`, `src/services/paymentService.ts`, `server.ts` |

## 4. Invariantes que NUNCA Devem Ser Quebradas

1. **Sanitização de URL do Supabase**: Mantenha `sanitizeSupabaseUrl` (`src/services/supabaseClient.ts` e `vite.config.ts`) e `sanitizeServerUrl` (`server.ts`) intactas para evitar falhas de rota (`/rest/v1` ou `/auth/v1`).
2. **Regra de Atraso do Cronograma (`PlannerService.isSessionOverdue`)**: Sessões com `session.date >= todayStr` (hoje ou futuro) nunca devem ser marcadas como atrasadas.
3. **Intercalação Estrita de Ciclo (`CycleService.strictInterleaveBlocks`)**: Nunca gerar blocos consecutivos da mesma disciplina quando houver mais de uma disciplina no ciclo.
4. **Fallback de Tema por Inatividade (`ThemeContext.tsx`)**: Preservar a regra de retorno para a skin `'verde'` após 7 dias de inatividade e a normalização de skins legadas.
5. **Higienização Inicial em `src/App.tsx`**: Manter `purgeDuplicateGhostSessions()` e `sanitizeOrphanData()` antes do carregamento principal de dados.