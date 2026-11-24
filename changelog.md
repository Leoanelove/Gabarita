# CHANGELOG.md — Histórico de Evolução do Projeto GABARITA

Todos os registros abaixo refletem o estado real inspecionado no código-fonte da versão `1.0.0` (`gabarita-v3---estudo-para-concursos`).

## [2026-11-23] — Novo seletor de método de estudo

- A criação e o replanejamento usam um seletor responsivo com opções empilhadas e uma área ilustrada que acompanha os cinco temas do Gabarita.

## [2026-11-23] — Banner temático no painel do concurso

- O painel do concurso usa o banner do Painel Geral, com os mesmos assets dos cinco temas. O banner exibe a cobertura e a data da prova do concurso aberto. Disciplinas, tópicos e tempo de estudo aparecem nos indicadores abaixo.

## [2026-11-23] — Importação de edital no painel do concurso

- O painel de um concurso sem disciplinas oferece **Importar por IA** ao lado do cadastro manual. O importador permite usar o catálogo do Supabase, inserir texto ou enviar um arquivo e grava as matérias no concurso aberto.

## [2026-11-23] — Sincronização das matérias de editais

- A seleção no catálogo carrega o conteúdo pelo ID do edital e informa quando a grade está indisponível.
- O cadastro de concurso com matérias e a importação por mesclagem gravam disciplinas e tópicos no Supabase, na ordem dos vínculos. Repetir uma gravação interrompida reaproveita o concurso e os registros já gravados.
- O Edital Verticalizado permite mesclar o conteúdo de um edital cadastrado em um concurso existente.
- A carga inicial lê concursos, disciplinas e tópicos em sequência. A limpeza de órfãos é local.

## [2026-11-20] — Botões de Recordação de Flashcards em Linha Única no Mobile

### Alterado
- **`src/components/flashcards/FlashcardPlayer.tsx`**: Ajustada a grade do rodapé de recordação SRS (`Errei`, `Difícil`, `Bom`, `Fácil`) de `grid-cols-2 md:grid-cols-4` para `grid-cols-4` com espaçamento, preenchimento, altura mínima (`min-h-[112px] h-full sm:h-36 md:h-44`), ícones e tipografia responsivos no modo mobile, garantindo que os 4 botões sejam exibidos lado a lado na mesma linha sem alterar o visual em desktop (`md:`) nem os estilos/temas do restante do sistema.

## [2026-11-19] — Ajuste de Legibilidade e Reorganização Interna do Card "TÓPICO ATUAL"

### Alterado
- **`src/components/dashboard/DashboardView.tsx`**: Reestruturado exclusivamente o card destacado de **"PRÓXIMO"** dentro do bloco **"TÓPICO ATUAL"** para exibir o nome da disciplina e o tópico ocupando toda a largura superior disponível sem cortes (`whitespace-normal break-words`, sem `truncate`/`line-clamp`), com tipografia equilibrada (`text-base sm:text-lg` e `text-xs sm:text-sm`) e linha inferior alinhando o badge de duração (`30min`) à esquerda com o botão **"Iniciar Estudo"** e o menu de opções à direita, preservando os 5 temas e os modos claro/escuro.
- **`src/components/dashboard/DashboardView.tsx`**: Removida a seção **"Sugestões do Ciclo"** (3 tópicos sugeridos) e a badge **"Sugerido"** do modal **"Selecionar Tópico"**, exibindo apenas a lista completa com todos os tópicos da matéria no edital.
- **`src/components/plano/CicloView.tsx`**: Removido o fundo gradiente temático do container externo **"Disciplinas do ciclo"**, passando a utilizar fundo branco sólido no modo claro e superfície neutra escura no modo escuro (`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800`), mantendo o efeito de gradiente suave dinâmico do tema (`flashcards-daily-review-card bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/25 dark:border-primary/20`) exclusivamente em cada bloco individual da lista de disciplinas.
- **`src/types/index.ts`, `src/services/db.ts`, `src/App.tsx`, `src/components/cadernoerros/CadernoErrosView.tsx`, `src/components/cadernoerros/QuestoesView.tsx`**: Adicionado vínculo explícito de `concursoId` em `ItemCadernoErros` (persistido em `localStorage` e enviado como `concurso_id` ao Supabase com fallback seguro de schema + hidratação retroativa via `disciplina.concursoId`) e aplicada filtragem rigorosa por concurso ativo em todos os KPIs, gráficos de Causa Raiz, abas de Status, dropdown de disciplinas, lista/tabela e estado vazio do **Caderno de Erros**.
- **`src/components/layout/MobileNav.tsx`**: Ajustada a barra de navegação inferior móvel para exibir exclusivamente 5 itens em `grid-cols-5`, na ordem **Início**, **Edital**, **Estudar** (centralizado em destaque), **Resumos** e **Perfil**, mantendo intactos o estilo das 5 skins de tema, modo claro/escuro e demais rotas do aplicativo.
- **`src/components/disciplinas/DisciplinasView.tsx`**: Ajustado o posicionamento responsivo do banner principal do **Edital Verticalizado** nos modos **mobile e tablet (`< lg`)** (contenção `w-full min-w-0`, truncamento do seletor de concurso com `max-w-full truncate`, grade 2 colunas no mobile com **"Novo Tópico"** em largura total acima de **"Nova Matéria"** e **"Importar por IA"**, e `flex-wrap` no tablet), garantindo visibilidade completa de todos os botões sem alterar o layout em **desktop (`lg:`)**.
- **`src/index.css`, `src/App.tsx`, `src/components/layout/Navbar.tsx`, `src/components/disciplinas/DisciplinasView.tsx`, `src/components/revisoes/RevisoesView.tsx`, `src/components/analytics/AnalyticsView.tsx`, `src/components/cadernoerros/QuestoesView.tsx`, `src/components/estudos/SessaoEstudoView.tsx`, `src/components/cadernoerros/CadernoErrosView.tsx`, `src/components/historico/HistoricoView.tsx`, `src/components/plano/CalendarView.tsx`**: Eliminado o overflow horizontal e a barra de arrastar no modo **mobile (`< 768px`)** — contendo viewport global com `overflow-x: clip`, ocultando barras de rolagem visuais em mobile mantendo o scroll vertical fluido, compactando a `Navbar` com `min-w-0` e título truncado, convertendo barras de abas horizontais para `flex-wrap`, ajustando o calendário mensal de 7 colunas para caber sem estourar a tela e exibindo cartões empilhados no mobile para as tabelas de **Caderno de Erros** e **Histórico**, preservando intactos os layouts de desktop, os 5 temas e os modos claro/escuro.
- **`src/components/dashboard/DashboardView.tsx`, `src/App.tsx`, `src/components/concursos/ConcursosView.tsx`**: Adicionado o bloco horizontal de largura total **"Provas Agendadas"** no **Painel Geral** entre a seção intermediária ("Tópico Atual" / "Metas de Estudo Semanal") e a seção inferior ("Rendimento & Histórico" / "Fila de Revisões"), estruturado com `Card` e `CardHeader` usando `dashboard-themed-header` (efeito gradiente dinâmico na cor do tema aplicado, idêntico ao cabeçalho de **"Rendimento & Histórico de Estudos"**), 3 áreas responsivas (informações do concurso/prova selecionado com data completa formatada e seletor vertical `1 / N` priorizando o concurso ativo; bloco central de contagem regressiva suavemente tingido pela cor primária do tema e ícone de engrenagem; botão em formato pílula **"Visualizar Provas"**), estado vazio amigável e navegação direta para a subaba **`Provas`** em `ConcursosView`.
- **`src/components/estudos/StudyRegisterModal.tsx`, `src/index.css`**: Removido o badge de estimativa de XP (`+{xpEstimate} XP`) do rodapé da tela de **Registro de Estudo**, posicionando o componente **"Duração"** no canto inferior esquerdo, e aplicado ao bloco superior de seleção (**Disciplina**, **Assunto / Tópico**, **Tempo de Estudo** e **Tipo de Estudo**) o efeito glassmorphism translúcido com gradiente radial, borda luminosa, sombra suave e marca d'água decorativa (`Layers3`) idêntico ao card **"Selecionar Edital Cadastrado"**, com alternância automática nas 5 cores de tema (`verde`, `azul`, `rosa`, `roxo`, `laranja`) e modos claro/escuro.

## [2026-11-18] — Migração do Banner Principal de Concursos para Assets Locais

### Alterado
- **`src/components/concursos/ConcursosView.tsx`**: Substituídas exclusivamente as 5 URLs do Supabase Storage em `CONCURSOS_BANNER_THEMES` pelos caminhos locais em `public/assets/bannerconcursos/` (`/assets/bannerconcursos/Banner_Concursos_verde1.png`, `Banner_Concursos_azul1.png`, `Banner_Concursos_rosa1.png`, `Banner_Concursos_roxo1.png` e `Banner_Concursos_laranja1.png`), preservando layout, textos, botões e adaptação aos modos claro e escuro.

## [2026-11-18] — Estilo Temático Suave nos Banners do Ciclo de Estudos

### Alterado
- **`src/components/plano/CicloView.tsx`**: Aplicado o efeito de gradiente suave dinâmico do tema (`flashcards-daily-review-card bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/25 dark:border-primary/20`) no banner **"PRÓXIMA SESSÃO"**, no container da seção **"Disciplinas do ciclo"** e nos cards de blocos pendentes do ciclo, garantindo adaptação automática às 5 skins de cor (`verde`, `azul`, `rosa`, `roxo`, `laranja`) e aos modos claro e escuro sem alterar regras de intercalação ou planejamento.

## [2026-11-18] — Implantação da Documentação Permanente e Governança de Alterações

### Adicionado
- **`PROJECT_CONTEXT.md`**: Documentação do escopo do aplicativo GABARITA, seus 12 domínios funcionais, regras de negócio críticas (concurso ativo único, atraso de cronograma apenas no dia seguinte, intercalação estrita de ciclo, fallback de tema após 7 dias de inatividade, limites de planos `FeatureGate` e higienização de editais) e funcionalidades protegidas.
- **`ARCHITECTURE.md`**: Mapeamento completo da stack tecnológica (React 19, Vite 8, Tailwind CSS 4, Express, Supabase, Gemini AI `@google/genai`, `sql.js`/`fzstd`/`jszip`, `jspdf`/`html2canvas`), responsabilidade de todos os módulos em `src/`, rotas REST de `server.ts`, 17 tabelas integradas no `DatabaseService` (`src/services/db.ts`), Edge Function `process-edital` e pendências técnicas para verificação.
- **`CHANGELOG.md`**: Criação do histórico oficial para rastreamento de todas as futuras manutenções e correções.
- **`AGENTS.md`**: Protocolo operacional obrigatório para agentes de IA e desenvolvedores, incluindo mapa rápido de impacto por domínio e invariantes que não devem ser quebradas.

## [Estado Base Documentado — v1.0.0] — Plataforma Integrada de Estudos para Concursos

### Módulos e Recursos Existentes no Código-Fonte
- Autenticação via Supabase Auth, Google OAuth e modo demonstração (`user_demo_01`), com proteção Turnstile e sincronização de perfil em `profiles`.
- Gestão de Concursos, Provas, Disciplinas, Assuntos e Subtópicos, com importação de editais via IA (`/api/edital/parse`) e parser heurístico local (`editalParser.ts`).
- Planejamento dual por **Ciclo de Estudos** (`cycleService.ts` com intercalação estrita) ou **Cronograma Semanal** (`plannerService.ts` com detecção de conflitos e reagendamento em lote).
- Cronômetro persistente (`timerService.ts`) com modos livre, Pomodoro e regressivo, alarmes sonoros e registro completo de sessões, páginas e videoaulas.
- Revisões espaçadas adaptativas, Flashcards com editor rich-text e importador `.apkg` (Anki), Questões, Caderno de Erros, Simulados com gráfico de evolução, Resumos, Histórico, Analytics e Painel Admin.
- Sistema visual com 5 paletas de cor (`verde`, `azul`, `rosa`, `roxo`, `laranja`), modo claro/escuro e controle de planos (`FeatureGate`).
