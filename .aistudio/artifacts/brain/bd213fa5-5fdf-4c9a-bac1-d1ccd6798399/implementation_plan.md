# Filtro por Tipo de Revisão (Intervalos de Dias) e Período

Adiciona ao painel de filtros de Revisões Espaçadas uma seção dedicada para filtrar revisões pelo seu **Tipo de Revisão / Intervalo de Dias** (`1d`, `7d`, `15d`, `21d`, etc., até `365d` e intervalos personalizados), permitindo seleção múltipla, ao mesmo tempo em que preserva integralmente o filtro de **Período (De / Até e atalhos de janela de tempo)** e o filtro por **Disciplina**.

## User Review & Critical Decisions

> [!IMPORTANT]
> As decisões abaixo foram confirmadas e orientam o comportamento exato do filtro de revisões:

- **Seleção Múltipla de Intervalos**: O usuário pode selecionar um ou mais tipos de revisão simultaneamente (ex.: clicar em `1d` e `7d` para visualizar apenas revisões de 1 dia e de 7 dias). Clicar novamente em um intervalo ativo o desmarca.
- **Cobertura Completa de Intervalos (Padrão + Personalizados)**: A seção de tipos de revisão exibe todos os 14 intervalos padrão (`1d`, `7d`, `15d`, `21d`, `30d`, `45d`, `60d`, `90d`, `120d`, `180d`, `215d`, `265d`, `315d`, `365d`) combinados em ordem crescente com quaisquer intervalos personalizados configurados ou presentes nas revisões do usuário.
- **Separação Clara entre Período e Tipo de Revisão**:
  - **Seção "PERÍODO"**: Mantém exatamente o comportamento atual — campos de data (`De` / `Até`) acompanhados de seus atalhos rápidos de janela temporal, listando as revisões agendadas dentro daquele intervalo de datas.
  - **Nova Seção "TIPO DE REVISÃO (INTERVALO)"**: Exibe uma grade de botões interativos (`1d`, `7d`, `15d`, `21d`, `30d`, `45d`, `60d`, `90d`, `120d`, `180d`, `215d`, `265d`, `315d`, `365d` + personalizados) que filtram diretamente pelo ciclo/intervalo da revisão (`intervalDays` ou `method` correspondente).

---

## 1. Overview & Core Concept

- **O Que Faz**: Permite ao estudante isolar rapidamente revisões de ciclos específicos (por exemplo, focar apenas nas revisões de `1d` e `7d` de maior urgência na curva de esquecimento, ou auditar revisões longas de `180d` e `365d`), podendo combinar esse filtro com um intervalo de datas (`De` / `Até`) e com uma disciplina específica.
- **Público-Alvo / Contexto**: Estudantes de concursos que gerenciam dezenas de revisões agendadas nas abas *Hoje*, *Atrasadas*, *Próximas*, *Ignoradas* e *Concluídas*.
- **Valor Principal**: Oferece controle granular sobre a fila de repetição espaçada sem perder a capacidade de filtrar por janela de calendário.

---

## 2. User Experience & Visual Design

- **Fluxo do Usuário**:
  1. Na tela de **Revisões**, o usuário clica no botão **Filtros** na barra de ferramentas superior.
  2. O popover abre exibindo três seções estruturadas verticalmente:
     - **PERÍODO**: Campos de data `De` e `Até` + pílulas rápidas de janela de tempo (mantendo o funcionamento atual de preenchimento das datas inicial e final).
     - **TIPO DE REVISÃO**: Lista de botões selecionáveis representando cada intervalo de revisão (`1d`, `7d`, `15d`, `21d`, `30d`, `45d`, `60d`, `90d`, `120d`, `180d`, `215d`, `265d`, `315d`, `365d` e eventuais prazos customizados). O usuário pode ativar um ou vários intervalos ao mesmo tempo.
     - **DISCIPLINA**: Seletor dropdown com todas as disciplinas do concurso ativo.
  3. Os contadores das abas (*Hoje*, *Atrasadas*, *Próximas*, *Ignoradas*, *Concluídas*) e a listagem agrupada por data refletem imediatamente os filtros combinados.
  4. Clicar em **Limpar** restaura o período, desmarca todos os tipos de revisão selecionados e volta a disciplina para *Todas*.
- **Identidade Visual & Tema**:
  - *Direção Estética*: Utilitária limpa de alta densidade (SaaS Dashboard), mantendo total consistência com o sistema de temas claro/escuro (`dark:bg-slate-900`, `bg-white`).
  - *Tipografia e Alinhamento Numérico*: Uso de `tabular-nums` nos rótulos numéricos de dias (`1d`, `7d`, `15d`...) para estabilidade visual e leitura rápida, com botões de linha única (`whitespace-nowrap shrink-0`).
  - *Estados Visuais dos Botões de Intervalo*:
    - **Inativo**: Fundo neutro suave (`bg-slate-100 dark:bg-slate-800`), texto secundário (`text-slate-600 dark:text-slate-300`) e borda sutil (`border-slate-200 dark:border-slate-700`).
    - **Ativo (Selecionado)**: Destaque em roxo/violeta consistente com o módulo de revisões (`bg-purple-600 text-white border-purple-600 shadow-xs`), com indicação visual clara de seleção e contador de quantos intervalos estão ativos.

---

## 3. Key Product Decisions & Trade-Offs

- **Decisão 1: Combinação por Interseção (AND) entre Período, Tipo de Revisão e Disciplina, e União (OR) entre múltiplos Tipos de Revisão**
  - *Abordagem Escolhida*: Se o usuário selecionar os tipos `1d` e `7d` e definir um período de datas, o sistema exibe revisões que sejam (`1d` **OU** `7d`) **E** estejam dentro do período de datas **E** pertençam à disciplina escolhida.
  - *Por quê*: É o padrão mental intuitivo em filtros facetados — múltiplos itens dentro da mesma categoria ampliam a seleção daquela categoria, enquanto categorias diferentes refinam o resultado.
- **Decisão 2: Normalização Resiliente do Intervalo da Revisão**
  - *Abordagem Escolhida*: Para verificar se uma revisão corresponde a um intervalo $N$ (ex.: `1d` ou `15d`), o filtro verifica tanto a propriedade numérica `intervalDays === N` quanto o rótulo `method` normalizado (ex.: `'24h'` ou `'1d'` equivalem a `1`; `'15d'` equivale a `15`).
  - *Por quê*: Garante compatibilidade total tanto com revisões geradas automaticamente pelo ciclo SRS quanto com revisões antigas ou agendadas manualmente.

---

## 4. Technical Architecture & Data Strategy

### Diagrama de Arquitetura e Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       Painel de Revisões (View)                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                     Popover de Filtros                            │  │
│  │                                                                   │  │
│  │  1. PERÍODO (Datas)                                               │  │
│  │     ├── Inputs: [De: YYYY-MM-DD] [Até: YYYY-MM-DD]                │  │
│  │     └── Atalhos de Período: preenchem o intervalo [Hoje .. +Nd]   │  │
│  │                                                                   │  │
│  │  2. TIPO DE REVISÃO (Multi-Select de Intervalos)                  │  │
│  │     ├── Opções: [1d] [7d] [15d] [21d] [30d] [45d] [60d] [90d]     │  │
│  │     │           [120d] [180d] [215d] [265d] [315d] [365d] + Extra │  │
│  │     └── Estado: selectedIntervalTypes: number[]                   │  │
│  │                                                                   │  │
│  │  3. DISCIPLINA                                                    │  │
│  │     └── Select: [Todas | Disciplinas do Concurso Ativo]           │  │
│  │                                                                   │  │
│  │  [ Limpar Filtros ]                              [ Aplicar ]      │  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
│                                    │                                    │
│                                    ▼                                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │              Motor de Categorização e Filtragem                   │  │
│  │                                                                   │  │
│  │  • Filtra por Disciplina (selectedDiscFilter)                     │  │
│  │  • Filtra por Janela de Data (filterStartDate <= data <= EndDate) │  │
│  │  • Filtra por Tipo de Revisão (selectedIntervalTypes inclui dias) │  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
│                                    │                                    │
│                                    ▼                                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │       Abas Cronológicas (Hoje | Atrasadas | Próximas | ...)       │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Mapeamento de Estado e Interações

1. **Lista Dinâmica de Tipos de Revisão (`availableRevisionTypeDays`)**:
   - Combina os 14 intervalos padrão (`[1, 7, 15, 21, 30, 45, 60, 90, 120, 180, 215, 265, 315, 365]`), os intervalos salvos nas configurações (`settings.intervalDays`) e quaisquer valores de `intervalDays` existentes nas revisões carregadas, ordenados de forma crescente e sem duplicatas.
2. **Estado de Seleção (`selectedIntervalTypes: number[]`)**:
   - Inicia vazio (`[]`), significando que todos os tipos de revisão são exibidos.
   - `handleToggleIntervalType(days: number)`: adiciona `days` ao array se não estiver presente, ou remove se já estiver selecionado.
3. **Resolução do Intervalo de Cada Revisão (`resolveRevisionIntervalDays(rev)`)**:
   - Retorna `rev.intervalDays` quando definido e maior que zero; caso contrário, extrai o número de `rev.method` (tratando `'24h'` como `1` e padrões `'Xd'` como `X`).
4. **Integração com Indicador de Filtro Ativo e Limpeza**:
   - `hasActiveFilters` passa a considerar também `selectedIntervalTypes.length > 0`, destacando o botão **Filtros** quando qualquer tipo de revisão estiver filtrado.
   - `handleClearFilters` limpa `filterPeriodPreset`, `filterStartDate`, `filterEndDate`, `selectedDiscFilter` e `selectedIntervalTypes`.
