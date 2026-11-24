# ARCHITECTURE.md — Arquitetura Técnica, Componentes e Fluxo de Dados do GABARITA

## 1. Stack Tecnológica Efetivamente Utilizada

Todas as bibliotecas abaixo constam em `package.json` e nos arquivos-fonte inspecionados:

| Camada | Tecnologias e Versões (`package.json`) | Finalidade na Aplicação |
| :--- | :--- | :--- |
| **Frontend UI** | React `^19.0.1`, React DOM `^19.0.1`, TypeScript `~7.0.2` | Interface SPA modularizada por domínio de estudo |
| **Estilização & Ícones** | Tailwind CSS `^4.3.3` (`@tailwindcss/vite`), `lucide-react` `^0.546.0`, `motion` `^12.23.24` | Design system com 5 skins de cor, modo claro/escuro e animações |
| **Bundler & Runtime** | Vite `^8.3.0`, `@vitejs/plugin-react` `^6.1.1`, `tsx` `^4.21.0` | Build de produção (`dist/`) e execução TypeScript no servidor |
| **Backend Node.js** | Express `^4.21.2`, `dotenv` `^17.2.3` | Servidor HTTP (`server.ts`), API de editais, parsing de PDF e assistente IA |
| **Banco & Auth (BaaS)** | `@supabase/supabase-js` `^2.117.3` | Autenticação (Supabase Auth), banco PostgreSQL e Edge Functions (Deno) |
| **Autenticação & Segurança** | `@react-oauth/google` `^0.13.5`, `@marsidev/react-turnstile` `^1.6.3` | Login com Google OAuth e verificação anti-bot Turnstile |
| **IA Generativa** | `@google/genai` `^2.4.0` | Extração estruturada de editais (`/api/edital/parse`), assistente (`/api/ai/assistant`) e Edge Function (`process-edital`) |
| **Importação Anki (`.apkg`)** | `jszip` `^3.10.2`, `sql.js` `^1.15.2`, `fzstd` `^0.1.1` | Leitura client-side de arquivos `.apkg` (SQLite em WebAssembly + Zstd) |
| **Exportação PDF/Imagem** | `jspdf` `^4.2.1`, `html2canvas` `^1.4.1` | Geração de relatórios, resumos e exportações visuais no navegador |

## 2. Estrutura de Diretórios e Responsabilidade dos Arquivos

```text
/
├── public/assets/
│   ├── banners/                         # Banners visuais das 5 skins (azul, laranja, rosa, roxo, verde)
│   └── aistudio/                        # Assets visuais e referências do projeto
├── supabase/functions/
│   └── process-edital/index.ts          # Supabase Edge Function (Deno) com integração Google Drive OAuth2 + PDF
├── server.ts                            # Servidor Express (porta 3000): APIs REST, Gemini AI e servir dist/
├── vite.config.ts                       # Configuração Vite 8 (HMR desativado, alias @, injeção de env Supabase/Google)
├── package.json                         # Dependências e scripts (dev, build, preview, start, lint)
└── src/
    ├── main.tsx                         # Ponto de entrada React
    ├── App.tsx                          # Orquestrador principal (providers, carregamento inicial, abas e flags)
    ├── index.css                        # Estilos globais e tokens CSS das skins
    ├── types/index.ts                   # Tipagem completa de domínio (Concurso, Disciplina, Assunto, SessaoEstudo, etc.)
    ├── contexts/
    │   ├── AuthContext.tsx              # Estado de autenticação e sessão do usuário (encapsula AuthService)
    │   ├── StudyTimerContext.tsx        # Estado global de abertura e parâmetros do modal de cronômetro/registro
    │   └── ThemeContext.tsx             # Gerenciamento de dark/light mode, 5 skins de cor e fallback de 7 dias
    ├── design-system/                   # Componentes base reutilizáveis (Badge, Button, Card, Input, Modal, ThemeToggle)
    ├── hooks/useTimerAlarm.ts           # Hook para disparo de alarmes sonoros do cronômetro
    ├── services/
    │   ├── supabaseClient.ts            # Instância única do cliente Supabase e sanitização de URL/Key
    │   ├── supabase.ts                  # Re-exportação do cliente Supabase e tipos auxiliares
    │   ├── auth.ts                      # AuthService (Supabase Auth, Google OAuth, modo convidado, sync de profile)
    │   ├── db.ts                        # DatabaseService (camada unificada de dados: Supabase + cache localStorage)
    │   ├── aiService.ts                 # Cliente HTTP para POST /api/ai/assistant agregando contexto de estudo
    │   ├── editalParser.ts              # Sanitização de nomes, bloqueio de cabeçalhos genéricos e parser heurístico
    │   ├── supabaseEditais.ts           # Normalização e agrupamento universal de grades de editais do Supabase
    │   ├── cycleService.ts              # Algoritmo de ciclo de estudos (strictInterleaveBlocks / Bresenham)
    │   ├── plannerService.ts            # Algoritmo de cronograma semanal, conflitos e cálculo de sessões atrasadas
    │   ├── timerService.ts              # Persistência e cálculo de tempo decorrido do cronômetro em localStorage
    │   ├── paymentService.ts            # Integração de checkout (/api/payment/checkout) com fallback simulado
    │   └── seedData.ts                  # Dados iniciais de demonstração e usuário demo (user_demo_01)
    ├── utils/
    │   ├── apkgParser.ts                # Parser de baralhos Anki (.apkg) com sql.js WASM, fzstd e fallback TS
    │   ├── featureGate.ts               # Regras de limites por plano (gratuito, teste, mensal, anual)
    │   └── soundEffects.ts              # Síntese/reprodução de toques e efeitos sonoros
    └── components/
        ├── auth/                        # AuthPage.tsx (login, cadastro, Google OAuth, Turnstile)
        ├── layout/                      # Sidebar.tsx, Navbar.tsx, MobileNav.tsx
        ├── common/                      # GezinhoLogo, MenuBannerFrame, ConcursoBanner, SubjectIcon, EmptyContestState
        ├── dashboard/                   # DashboardView, StudyCharts, StreakCalendarModal
        ├── concursos/                   # ConcursosView, ProvasTab, NovoConcursoModal, NovaProvaModal, DetalhesProvaModal, EditalSelectorGlassBanner
        ├── disciplinas/                 # DisciplinasView, EditalImportModal, NovaMateriaModal
        ├── plano/                       # PlanoView, CicloView, CalendarView, CriarCicloModal, CriarCronogramaModal, NovoCicloWizardModal, MetodoEstudoModal, SessionActionModal, UltimosEstudosModal
        ├── estudos/                     # SessaoEstudoView, StudyTimerModal, StudyRegisterModal, StudySessionModal, RingtoneSelectorModal
        ├── revisoes/                    # RevisoesView
        ├── flashcards/                  # Flashcards, FlashcardPlayer, GmailRichTextEditor, FlashcardsView
        ├── questoes/                    # QuestoesView, CadernoErrosView, CadernoErros
        ├── simulados/                   # SimuladosView, RegisterSimuladoModal, SimuladoDetailModal, SimuladoLineChart
        ├── resumos/                     # ResumosView
        ├── historico/                   # HistoricoView reutiliza StudyRegisterModal para editar sessões
        ├── analytics/                   # AnalyticsView
        ├── metas/                       # MetasView (desativado por flag ENABLE_METAS_MODULE = false)
        ├── ai/                          # AIAssistantView (desativado por flag ENABLE_AI_ASSISTANT_MODULE = false)
        ├── admin/                       # AdminView, ModalAdminEdital
        ├── planos/                      # PlanosAssinaturaView
        ├── perfil/                      # PerfilView, ProfilePhotoModal
        └── privacy/                     # PrivacyPolicyModal
```

## 3. Integrações Externas, Banco de Dados e APIs

### 3.1. Supabase PostgreSQL (`src/services/db.ts` e `server.ts`)
O `DatabaseService` (`src/services/db.ts`) interage com **17 tabelas** no Supabase:
- **Usuário e Preferências**: `profiles`, `revision_settings`.
- **Estrutura do Edital**: `concursos`, `provas`, `disciplinas`, `assuntos` (e subtópicos), `editais` (consultado e gravado via `server.ts` / `supabaseEditais.ts`).
- **Execução e Desempenho**: `sessoes_estudo`, `revisoes`, `blocos_questoes`, `caderno_erros`, `simulados`, `metas`, `resumos`.
- **Planejamento e Flashcards**: `study_plans`, `study_cycles`, `decks`, `flashcards`.

### 3.2. Backend Express (`server.ts`)
O servidor roda na porta `3000` (com mapeamento explícito de `PORT === 8080` $\rightarrow$ `3000` em `getPort()`):
- `GET /api/health`: Healthcheck da aplicação.
- `GET /api/editais`, `POST /api/editais`, `GET /api/editais/:id`: Leitura e cadastro de editais na tabela `editais` do Supabase.
- `POST /api/concursos`: Criação de concurso garantindo que, ao ativar um novo, os demais do mesmo `user_id` recebam `active: false`.
- `POST /api/edital/parse`: Recebe `rawText` ou `pdfBase64` + `cargo` e `concursoTitle`; utiliza `@google/genai` (`GEMINI_API_KEY`) para extrair disciplinas, pesos e tópicos em JSON estruturado, aplicando sanitização (`sanitizeSyllabusData`) e fallback heurístico local (`parseSyllabusLocally`).
- `POST /api/ai/assistant`: Recebe a dúvida do estudante e um resumo das métricas (`stats`, `revisoes`, `cadernoErros`, `disciplinas`), respondendo via Gemini AI com fallback heurístico.
- `GET *`: Entrega o SPA compilado em `dist/index.html`.

### 3.3. Supabase Edge Function (`supabase/functions/process-edital/index.ts`)
- Função Deno isolada (excluída do `tsconfig.json` principal) preparada para autenticação OAuth2 via Service Account (Web Crypto RS256/PKCS8) e leitura de arquivos PDF no Google Drive.

### 3.4. Outras Integrações
- **Google OAuth (`@react-oauth/google`)**: Autenticação social no `AuthPage.tsx` usando `VITE_GOOGLE_CLIENT_ID`.
- **Cloudflare Turnstile (`@marsidev/react-turnstile`)**: Validação CAPTCHA na troca/segurança de senha.

## 4. Fluxos de Dados Entre Frontend, Backend e Banco

1. **Inicialização e Autenticação**:
   - `AuthService.init()` verifica sessão ativa no Supabase Auth (`supabase.auth.getSession()`). Se não houver, verifica se existe sessão demo (`user_demo_01` em `localStorage`).
   - Em paralelo, `AuthService.syncProfileInBackground()` consulta a tabela `profiles` no Supabase para enriquecer `name`, `role`, `photoURL` e preferências.
2. **Carga e Sincronização de Dados (`loadData` em `src/App.tsx`)**:
   - Carrega concursos, disciplinas e assuntos em sequência para hidratar o cache dos registros pai. A higienização de órfãos usa apenas o cache local. Após essa etapa, carrega em paralelo (`Promise.all`) provas, sessões, revisões, configurações de revisão, questões, blocos, caderno de erros, metas, conquistas, marcos, estatísticas, simulados e método de estudo.
   - `DatabaseService` mantém espelhamento com `localStorage` (`gabarita_*`), permitindo operação imediata na UI mesmo em modo demo/offline e sincronização com o Supabase quando há usuário autenticado.
3. **Importação de Edital via IA**:
   - O usuário envia texto ou PDF no `EditalImportModal` / `NovoConcursoModal` $\rightarrow$ Frontend chama `POST /api/edital/parse` $\rightarrow$ `server.ts` aciona Gemini AI (ou `parseSyllabusLocally` se sem chave/falha) $\rightarrow$ retorna árvore sanitizada $\rightarrow$ Frontend grava via `DatabaseService.importEditalTree()`.

4. **Importação do catálogo Supabase**:
   - O seletor busca o registro por `editais.id` e lê `materias` como JSONB ou texto JSON. A grade é exibida para revisão com o cargo da origem.
   - No cadastro com edital e na mesclagem, as novas disciplinas são gravadas em `disciplinas` com `concurso_id`. Os tópicos são gravados em `assuntos` com `disciplina_id`. A confirmação aguarda as duas gravações. Uma nova tentativa usa o ID do mesmo concurso e reaproveita as disciplinas e os tópicos já gravados.
   - O Edital Verticalizado e o painel de concursos sem disciplinas reutilizam o `EditalImportModal` para importar do catálogo. No painel, o destino é o concurso aberto e a importação usa mesclagem.

## 5. Pendências Técnicas para Verificação

1. **Credenciais de fallback em código-fonte (`server.ts` e `src/services/supabaseClient.ts`)**: Existem valores padrão de URL e chave pública (`anon`) hardcoded como fallback caso as variáveis de ambiente não sejam carregadas. Recomenda-se validar se devem ser removidos em produção mantendo apenas variáveis de ambiente.
2. **Script `"start"` no `package.json`**: O comando `"start"` está definido como `"node server.ts"`. Como `server.ts` possui sintaxe TypeScript e imports `.ts`, em ambientes Node sem loader nativo de TS pode exigir `"tsx server.ts"` (como no script `"dev"`) ou compilação prévia.
3. **Endpoint `/api/payment/checkout` (`src/services/paymentService.ts`)**: O frontend chama `POST /api/payment/checkout`, mas essa rota não está implementada no `server.ts` atual, caindo sempre no modo simulado de fallback.
4. **Módulos desabilitados por flag (`src/App.tsx`)**: `ENABLE_METAS_MODULE = false` e `ENABLE_AI_ASSISTANT_MODULE = false` mantêm `MetasView` e `AIAssistantView` ocultos da navegação principal até serem reativados.
