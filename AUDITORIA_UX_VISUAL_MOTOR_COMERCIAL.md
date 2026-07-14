# AUDITORIA UX-07 — Legibilidade e Operação do Motor Comercial

**Plataforma:** CDS Sistemas · Motor Comercial  
**Data:** 12/07/2026  
**Escopo:** Frontend exclusivamente (visual, hierarquia, operação, consistência DS)  
**Método:** Revisão estática de rotas, componentes, CSS por página, tokens do Design System, ordem de carregamento no ERP e auditorias anteriores (DS-01.1, UX-05.5)

---

## Resumo executivo

A homologação confirmou um problema crítico em **Relatórios**: cards do catálogo e indicadores praticamente invisíveis. A auditoria identificou que esse sintoma **não é isolado** — existem **3 causas sistêmicas** que afetam várias telas:

| # | Causa sistêmica | Impacto |
|---|-----------------|---------|
| 1 | Token CSS **`--color-neutral-0` inexistente** no Design System, usado em Relatórios | Fundo dos cards = transparente; cards se confundem com o fundo |
| 2 | **`styles/ux-enterprise.css` carregado por último** e com seletores `.cds-ux-page-header h1` / `.cds-analytics-header__title` | Títulos principais viram texto minúsculo (12px), cinza e maiúsculo — hierarquia invertida |
| 3 | **Componentes DS com cores fixas** (`StatCard`, `Drawer`, inputs) usando `white` / `#fff` e **sem adaptação a temas** | Quebra em Dark/Alto Contraste; contraste inconsistente |

**Contagem de problemas por prioridade:**

| Prioridade | Qtd. | Descrição |
|------------|------|-----------|
| **P0** | 8 | Comprometem operação (ilegibilidade, ação principal oculta, cards invisíveis) |
| **P1** | 14 | Dificultam operação (excesso de informação, CSS ausente, fluxo confuso) |
| **P2** | 12 | Melhoria visual (espaço vazio, tipografia pequena, inconsistência) |
| **P3** | 6 | Refatoração futura (legado wizard, placeholders, consolidar CSS) |

**Recomendação imediata (Sprint UX-07.1):** corrigir P0 em Relatórios + tokens + `ux-enterprise.css` + `StatCard`/`Drawer`. Estimativa: 1 sprint focada, sem alteração de backend.

---

## Telas auditadas

### Rotas principais (`frontend/modules/motor-comercial/routes/index.js`)

| # | Tela | Rota | CSS dedicado | Classe layout |
|---|------|------|--------------|---------------|
| 1 | Central de Trabalho | `/` | `Dashboard/styles.css` ✅ | `DashboardLayout` |
| 2 | Consignações | `/consignacoes` | `Consignacoes/styles.css` ✅ | `DashboardLayout` |
| 3 | Preparar Entrega | `/consignacoes/nova` | `NovaConsignacao/styles.css` ✅ | `CDSPage` |
| 4 | Detalhes da Consignação | `/consignacoes/:id` | ❌ (reusa Consignações) | `DashboardLayout` |
| 5 | Entrega de Consignação | `/consignacoes/:id/entrega` | `EntregaConsignacao/styles.css` ✅ | `WizardLayout` ⚠️ |
| 6 | Fechar Consignação | `/consignacoes/:id/prestacao` | `PrestacaoContas/styles.css` ✅ | `WizardLayout` ⚠️ |
| 7 | Conta Corrente (fluxo) | `/consignacoes/:id/prestacao/conta-corrente` | `ContaCorrente/styles.css` ✅ | `DashboardLayout` |
| 8 | Histórico do Atendimento | `/consignacoes/:id/prestacao/historico` | ❌ | `DashboardLayout` |
| 9 | Central de Clientes | `/clientes` | `PerfilComercial/styles.css` ✅ | `ConsultaLayout` |
| 10 | Novo Cliente | `/clientes/novo` | `PerfilComercial/styles.css` ✅ | `CadastroLayout` |
| 11 | Editar Cliente | `/clientes/:id/editar` | `PerfilComercial/styles.css` ✅ | `CadastroLayout` |
| 12 | Central de Operações do Cliente | `/clientes/:id` | `PerfilComercial/styles.css` ✅ | Ficha operacional |
| 13 | Conta Corrente Comercial | `/conta-corrente` | `ContaCorrente/styles.css` ✅ | `DashboardLayout` |
| 14 | Relatórios | `/relatorios` | `Relatorios/styles.css` ✅ | `DashboardLayout` |
| 15 | Indicadores | `/indicadores` | Alias → Relatórios | `DashboardLayout` |
| 16 | Central de Pendências | `/pendencias` | `Pendencias/styles.css` ✅ | `DashboardLayout` |
| 17 | Recomendações Comerciais | `/recomendacoes` | `Recomendacoes/styles.css` ✅ | `DashboardLayout` |
| 18 | Guias Operacionais | `/playbooks` | `Playbooks/styles.css` ⚠️ **não linkado no ERP** | `DashboardLayout` |
| 19 | Central de Processos | `/workflow` | `WorkflowCenter/styles.css` ⚠️ **não linkado no ERP** | `DashboardLayout` |
| 20 | Perdas | ERP placeholder | ❌ | Empty state |
| 21 | Cortesias | ERP placeholder | ❌ | Empty state |
| 22 | Configurações | `/configuracoes` | ❌ | `CadastroLayout` |
| 23 | Auditoria | `/auditoria` | ❌ | `DashboardLayout` |
| 24 | CDS Design System (showcase) | `/design-system` | `DesignSystem/styles.css` ✅ | — |

### Drawers auditados

| Drawer | Página origem | Problemas |
|--------|---------------|-----------|
| `CockpitDrawer` | Consignações, Detalhes | Herda estilos cockpit; footer denso |
| `PendenciasDrawer` | Pendências | KPIs em grid 2 col estreito |
| `RecomendacoesDrawer` | Recomendações | Badges ok; links secundários discretos |
| `PlaybooksDrawer` | Playbooks | CSS inline mínimo; sem tokens DS |
| `WorkflowDrawer` | Workflow | CSS da página pode não carregar |
| `IndicadorDrawer` | Relatórios | Labels 12px cinza; grid 2 col |
| `MovimentoDrawer` | Conta Corrente | Ok estruturalmente |
| `ExecutiveDrawer` | Dashboard (legado) | Possível duplicidade com Central Trabalho |

### Modais e wizards

| Componente | Onde | Status visual |
|------------|------|---------------|
| `Modal` | Confirmações globais | DS oficial ✅ |
| `WizardLayout` | Entrega, Fechar Consignação | Aparência wizard legado ⚠️ |
| `Stepper` | Fechar Consignação | Etapas pequenas em 1366px |

### Carregamento CSS no ERP (`frontend/erp/index.html`)

```
comercial.css
→ Dashboard, Consignacoes, NovaConsignacao, Entrega, PrestacaoContas,
  PerfilComercial, ContaCorrente, Relatorios, Pendencias, Recomendacoes
→ ux-enterprise.css  ← sobrescreve títulos (carregado DEPOIS das páginas)
→ DesignSystem/styles.css
→ shared/design-system/index.css
→ charts/charts.css

AUSENTES: Playbooks/styles.css, WorkflowCenter/styles.css
```

---

## Problemas encontrados

### P0 — Compromete operação

#### P0-01 · Relatórios — cards transparentes (causa raiz da homologação)

| Item | Detalhe |
|------|---------|
| **Tela** | Relatórios / Indicadores |
| **Sintoma** | Cards do catálogo, indicadores e heatmap sem fundo visível; ícones emoji “somem”; bordas quase imperceptíveis |
| **Causa provável** | `Relatorios/styles.css` usa `background: var(--color-neutral-0)` em `.cds-analytics-catalog__card`, `.cds-analytics-indicator`, `.cds-analytics-heatmap__cell` — token **não definido** em `shared/design-system/tokens/colors.css` |
| **Efeito** | Background computado = transparente; cards se confundem com `--color-neutral-50` da área de filtros e fundo da página |
| **Correção sugerida** | Substituir `--color-neutral-0` por `--color-surface` ou `#ffffff` + garantir `color: var(--color-text)` nos labels; adicionar `--color-neutral-0: #ffffff` ao DS se for token oficial |
| **Arquivos** | `pages/Relatorios/styles.css` (L128, L215, L294) |

**Referência visual (sem print):**
```
Antes: [░░░░] Catálogo   ← card sem preenchimento, só borda 1px #e2e8f0
Depois: [████] Catálogo   ← fundo --color-surface, texto --color-neutral-900
```

---

#### P0-02 · Conflito global de hierarquia — `ux-enterprise.css` vs títulos de página

| Item | Detalhe |
|------|---------|
| **Telas** | Relatórios, Consignações, Conta Corrente, Preparar Entrega, Fechar Consignação, Histórico |
| **Sintoma** | Título principal (`h1`) aparece em **12px**, **maiúsculo**, **cinza 500** — parece rótulo secundário, não título |
| **Causa provável** | `styles/ux-enterprise.css` define `.cds-ux-page-header h1` e `.cds-analytics-header__title` com `font-size: var(--font-size-xs)` e `color: var(--color-neutral-500)`. Carregado **depois** dos CSS de página no `index.html` → vence em especificidade igual ou superior |
| **Impacto operacional** | Operador não responde rapidamente “Onde estou?” — hierarquia invertida (meta-info compete com título) |
| **Correção sugerida** | Inverter hierarquia: título = `--font-size-2xl`, `--color-neutral-900`; meta/eyebrow = xs uppercase cinza. Remover `h1` genérico de `ux-enterprise.css` e usar classe `.cds-ux-page-eyebrow` apenas onde desejado |
| **Arquivos** | `styles/ux-enterprise.css` (L8–21), `erp/index.html` (ordem dos links) |

**Telas com classe `cds-ux-page-header` confirmada:**
- `Consignacoes/index.js` L146
- `Relatorios/index.js` L133
- `ContaCorrente/index.js` L104
- `NovaConsignacao/index.js` L146
- `HistoricoPrestacao/index.js` L54

---

#### P0-03 · StatCard — fundo branco fixo e ícones esmaecidos

| Item | Detalhe |
|------|---------|
| **Telas** | Relatórios, Consignações, Dashboard (KPIs), Pendências, Recomendações, Workflow |
| **Sintoma** | Cards KPI ok no tema claro; ícones com aparência “lavada”; em tema escuro fundo branco destoa |
| **Causa provável** | `StatCard.getStyles()` usa `background-color: white` hardcoded e `.cds-stat-card__icon { opacity: 0.7 }` |
| **Correção sugerida** | `background: var(--color-surface)`; ícone `opacity: 1` ou `color: var(--color-text-secondary)`; borda `var(--color-border)` |
| **Arquivos** | `shared/design-system/primitives/data/StatCard.js` (L78–112) |

---

#### P0-04 · Drawer — painel branco fixo

| Item | Detalhe |
|------|---------|
| **Telas** | Todos os drawers (Consignação, Pendência, Relatório, etc.) |
| **Sintoma** | Drawer sempre branco; texto escuro; quebra total no tema Dark |
| **Causa provável** | `Drawer.getStyles()` → `background-color: white` |
| **Correção sugerida** | Usar `--color-surface`, `--color-text`, `--color-border` |
| **Arquivos** | `shared/design-system/primitives/special/Drawer.js` (L136) |

---

#### P0-05 · Cadastro de Cliente — contraste forçado com `!important` (sintoma de regressão)

| Item | Detalhe |
|------|---------|
| **Tela** | Editar/Novo Cliente |
| **Sintoma** | Texto ilegível reportado anteriormente; corrigido parcialmente com overrides agressivos |
| **Causa provável** | Conflito entre tokens de tema, autofill WebKit e `Input.js` com cores fixas `#ffffff` / `#0f172a` |
| **Correção sugerida** | Padronizar inputs no DS com `--color-surface` + `--color-text`; remover `!important` do escopo cadastro após correção na raiz |
| **Arquivos** | `PerfilComercial/styles.css` (L564–586), `shared/design-system/components/inputs.css`, `primitives/form/Input.js` |

---

#### P0-06 · Guias Operacionais e Central de Processos — CSS não carregado

| Item | Detalhe |
|------|---------|
| **Telas** | `/playbooks`, `/workflow` |
| **Sintoma** | Layout quebrado, cards sem estilo, sidebar sem hover, kanban sem formatação |
| **Causa provável** | `Playbooks/styles.css` e `WorkflowCenter/styles.css` existem mas **não estão linkados** em `frontend/erp/index.html` |
| **Correção sugerida** | Adicionar os dois `<link>` no index.html na ordem correta (antes de `ux-enterprise.css`) |
| **Arquivos** | `frontend/erp/index.html` |

---

#### P0-07 · Relatórios — sobrecarga cognitiva na mesma viewport

| Item | Detalhe |
|------|---------|
| **Tela** | Relatórios |
| **Sintoma** | Catálogo + 12 filtros + busca + 7 seções simultâneas (viz, indicadores, análises, rankings, comparativos, favoritos, histórico) |
| **Causa provável** | `_createContent()` monta todas as seções de uma vez (`Relatorios/index.js` L196–204) |
| **Impacto operacional** | Operador não sabe o que olhar primeiro; scroll excessivo; sensação “dashboard antigo” |
| **Correção sugerida** | Modo foco: exibir só catálogo + relatório ativo; demais seções em abas ou accordion; filtros colapsáveis |
| **Arquivos** | `pages/Relatorios/index.js` |

---

#### P0-08 · Filtros técnicos expostos ao operador (Relatórios)

| Item | Detalhe |
|------|---------|
| **Tela** | Relatórios |
| **Sintoma** | Campos “Cliente ID”, “Produto ID”, “Consignação ID” visíveis no filtro principal |
| **Causa provável** | `_createFilters()` expõe IDs crus (L282–284) |
| **Impacto operacional** | Linguagem de desenvolvedor; operador de loja não sabe preencher |
| **Correção sugerida** | Ocultar filtros avançados atrás de “Mais filtros”; substituir por busca de cliente/produto com autocomplete |
| **Arquivos** | `pages/Relatorios/index.js` |

---

### P1 — Dificulta operação

#### P1-01 · Pendências — tokens legados `--cds-color-*`

| Tela | Pendências |
|------|------------|
| **Sintoma** | Estilos inconsistentes com demais telas; fallbacks hardcoded |
| **Causa** | `Pendencias/styles.css` usa `--cds-color-text-muted`, `--cds-color-border` (não existem no DS 2.0.1) |
| **Correção** | Migrar para `--color-text-muted`, `--color-border`, `--color-surface` |
| **Arquivo** | `pages/Pendencias/styles.css` |

---

#### P1-02 · Recomendações e Playbooks — CSS minimalista fora do DS

| Tela | Recomendações, Playbooks |
|------|--------------------------|
| **Sintoma** | Cards categoria sem fundo definido (Recomendações); valores fixos `#64748b`, `#e2e8f0`, `#fff` |
| **Causa** | CSS escrito em sprint O-8/O-9 sem tokens |
| **Correção** | Reescrever com tokens; usar `StatCard`/`Card` oficiais |
| **Arquivos** | `Recomendacoes/styles.css`, `Playbooks/styles.css` |

---

#### P1-03 · Fechar Consignação e Entrega — wizard legado

| Tela | Fechar Consignação, Entrega |
|------|----------------------------|
| **Sintoma** | Aparência de wizard antigo; stepper lateral; classes `cds-wizard-*` extensas |
| **Causa** | Ainda usam `WizardLayout` (Preparar Entrega já migrou para `CDSPage`) |
| **Correção** | Migrar Fechar Consignação para `CDSPage` como Preparar Entrega (já previsto em DS-01.1) |
| **Arquivos** | `PrestacaoContas/index.js`, `EntregaConsignacao/index.js`, `NovaConsignacao/styles.css` (legado wizard) |

---

#### P1-04 · Sidebar oculta em mobile/tablet (Dashboard executivo legado)

| Tela | Dashboard (estilos `.cds-executive-*` ainda presentes) |
|------|----------------------------------------------------------|
| **Sintoma** | `@media (max-width: 768px) { .cds-executive-sidebar { display: none } }` |
| **Impacto** | Navegação lateral some em tablet 768px |
| **Correção** | Drawer de navegação ou tabs horizontais |
| **Arquivo** | `Dashboard/styles.css` (L419–421) |

---

#### P1-05 · Central de Trabalho — largura máxima restritiva

| Tela | Central de Trabalho |
|------|---------------------|
| **Sintoma** | `max-width: 1100px` centra conteúdo; muito espaço vazio em 1920px |
| **Causa** | `.cds-central-trabalho-host` |
| **Correção** | `max-width: 1400px` ou layout 2 colunas (trabalho + timeline) |
| **Arquivo** | `Dashboard/styles.css` (L425–428) |

---

#### P1-06 · Consignações — botões de ação competindo com primário

| Tela | Consignações |
|------|--------------|
| **Sintoma** | Header com Atualizar (secondary) + Preparar Entrega (primary) + outros; tabela com muitas ações por linha |
| **Correção** | Uma ação primária por contexto; demais em menu “⋯” |
| **Arquivo** | `Consignacoes/index.js` |

---

#### P1-07 · Auditoria — linguagem técnica visível

| Tela | Auditoria |
|------|-----------|
| **Sintoma** | Subtítulo “Movimentações derivadas do ledger”; coluna “Correlation ID” |
| **Correção** | “Histórico de movimentações”; coluna “Referência” ou ocultar em modo operador |
| **Arquivo** | `Auditoria/index.js` (L44, L79) |

---

#### P1-08 · Detalhes Consignação / Histórico — sem CSS dedicado

| Tela | Detalhes, Histórico |
|------|---------------------|
| **Sintoma** | Toolbar e header genéricos; botão voltar sem destaque |
| **Correção** | Criar `DetalhesConsignacao/styles.css`; aplicar `cds-ux-page-header` corrigido |
| **Arquivos** | `DetalhesConsignacao/index.js`, `HistoricoPrestacao/index.js` |

---

#### P1-09 · Conta Corrente — filtros com fundo branco fixo

| Tela | Conta Corrente |
|------|----------------|
| **Sintoma** | `.cds-extrato-filters { background: white }` |
| **Correção** | `var(--color-surface)` |
| **Arquivo** | `ContaCorrente/styles.css` (L76) |

---

#### P1-10 · Fechar Consignação — tipografia 10–11px em status de linha

| Tela | Fechar Consignação |
|------|-------------------|
| **Sintoma** | Labels de edição/status ilegíveis em monitor 1366×768 |
| **Correção** | Mínimo `--font-size-xs` (12px) em todo texto operacional |
| **Arquivo** | `PrestacaoContas/styles.css` (L451, L459, L520) |

---

#### P1-11 · Ficha Cliente — timeline com texto 10px

| Tela | Central de Operações do Cliente |
|------|--------------------------------|
| **Sintoma** | `.cds-ficha-cliente__timeline-*` usa `font-size: 10px` |
| **Correção** | 12px mínimo; `--color-text-secondary` |
| **Arquivo** | `PerfilComercial/styles.css` (L840) |

---

#### P1-12 · Inputs nativos nos filtros (Relatórios, Workflow)

| Telas | Relatórios, Workflow |
|-------|---------------------|
| **Sintoma** | `<select>` e `<input>` HTML nativos em vez de `cds-input` / `cds-select` |
| **Correção** | Usar componentes DS ou classe `.cds-analytics-filters__input` com tokens semânticos + tema escuro |
| **Arquivos** | `Relatorios/index.js`, `WorkflowCenter/index.js` |

---

#### P1-13 · Perdas e Cortesias — placeholder sem identidade

| Tela | ERP empty state |
|------|-----------------|
| **Sintoma** | Mensagem genérica “será disponibilizado em breve” |
| **Correção** | Empty state DS com ícone, CTA de volta e mesma identidade visual |
| **Arquivo** | `bootstrap/index.js` ERP_ROUTE_MAP |

---

#### P1-14 · Global loading overlay branco fixo

| Tela | Todas |
|------|-------|
| **Sintoma** | `#motor-comercial-loading` com `background: rgba(255,255,255,0.85)` |
| **Correção** | `var(--color-overlay)` |
| **Arquivo** | `styles/inject.js` (L20) |

---

### P2 — Melhoria visual

| ID | Tela | Problema | Correção |
|----|------|----------|----------|
| P2-01 | Central Trabalho | Cards trabalho `#fff` fixo | `--color-surface` |
| P2-02 | Dashboard executivo | Seções `.cds-executive-section { background: white }` duplicam estilo | Unificar com `.cds-card` |
| P2-03 | Consignações | Cockpit cards grid 4 col estreito em 1366px | `auto-fill, minmax(160px, 1fr)` |
| P2-04 | Preparar Entrega | Arquivo CSS 980+ linhas com classes wizard legadas | Limpar classes não usadas pós-migração CDSPage |
| P2-05 | Ficha Cliente | Separadores meta `color: neutral-300` — baixo contraste | `neutral-400` mínimo |
| P2-06 | Relatórios | Ícones emoji no catálogo — renderização inconsistente | Migrar para ícones DS / FontAwesome |
| P2-07 | Todas sidebars | Itens `background: transparent` — área clicável pequena | `min-height: 40px` |
| P2-08 | Recomendações | Grid 3 col panel quebra mal entre 768–1024px | Breakpoint intermediário |
| P2-09 | Configurações | Sem estilo; cards DS puros | Adicionar `Configuracoes/styles.css` mínimo |
| P2-10 | Gráficos MC | Barras CSS 4px — corretas pós UX 2.1, mas labels 12px cinza | `--color-text` nos labels |
| P2-11 | Tema Dark | ~40 regras `white`/`#fff` no módulo | Passar para tokens semânticos |
| P2-12 | Tipografia | Mistura `rem`, `px` e `var(--font-size-*)` | Normalizar em tokens |

---

### P3 — Refatoração futura

| ID | Item | Descrição |
|----|------|-----------|
| P3-01 | Consolidar CSS | 16 arquivos `styles.css` → import único `motor-comercial.css` buildado |
| P3-02 | Remover `.cds-executive-*` | Estilos do dashboard antigo coexistem com `.cds-central-trabalho-*` |
| P3-03 | `Cliente360View` legado | Verificar se ainda renderizado ou só `CentralOperacoesView` |
| P3-04 | Bootstrap no shell ERP | `bootstrap.min.css` + `style.css` podem vazar estilos em `#page-content` |
| P3-05 | Storybook | `.storybook` desatualizado vs DS 2.0.1 |
| P3-06 | Bundle CSS | `motor-comercial.bundle.css` contém só buttons+cards — páginas não incluídas |

---

## Matriz por tela — respostas operacionais

Legenda: ✅ OK · ⚠️ Parcial · ❌ Problemático

| Tela | Quem é? | Onde está? | O que fazer? | Contraste | DS |
|------|---------|------------|--------------|-----------|-----|
| Central Trabalho | ✅ | ⚠️ título pequeno | ✅ ação principal | ⚠️ | ⚠️ |
| Consignações | ✅ | ❌ título ux-enterprise | ⚠️ muitas ações | ⚠️ | ⚠️ |
| Preparar Entrega | ✅ | ⚠️ | ✅ | ✅ | ✅ |
| Fechar Consignação | ✅ | ⚠️ wizard | ⚠️ steps | ⚠️ 10px | ⚠️ |
| Entrega | ✅ | ⚠️ wizard | ✅ | ⚠️ | ⚠️ |
| Ficha Cliente | ✅ | ✅ | ✅ ações destacadas | ✅ pós-fix | ✅ |
| Cadastro Cliente | ✅ | ✅ | ✅ | ✅ pós-fix | ⚠️ !important |
| Conta Corrente | ✅ | ❌ título | ✅ | ⚠️ | ⚠️ |
| Relatórios | ⚠️ | ❌ | ❌ overload | ❌ cards | ❌ |
| Pendências | ✅ | ⚠️ | ✅ | ⚠️ tokens | ⚠️ |
| Recomendações | ✅ | ⚠️ | ✅ | ⚠️ | ⚠️ |
| Playbooks | ✅ | ❌ CSS ausente | ⚠️ | ❌ | ❌ |
| Workflow | ✅ | ❌ CSS ausente | ⚠️ | ❌ | ❌ |
| Pendências/Drawers | ✅ | — | ✅ | ⚠️ | ⚠️ |

---

## Consistência com CDS Design System

| Critério | Status | Observação |
|----------|--------|------------|
| Tokens `--color-*`, `--spacing-*` | ⚠️ Parcial | `--color-neutral-0`, `--cds-color-*` inválidos |
| Temas Classic / Dark / High Contrast | ❌ | Páginas MC ignoram `--color-surface` / `--color-text` |
| Componentes base (Button, Input, Card) | ✅ | Reexport do DS |
| Componentes dados (StatCard, Table) | ⚠️ | StatCard com cores fixas |
| Layouts (DashboardLayout, CDSPage) | ✅ | Oficiais |
| Tipografia enterprise | ⚠️ | `ux-enterprise.css` conflita com hierarquia das páginas |
| Animações / performance | ✅ | transform/opacity apenas |
| Charts CDS 2.1 | ✅ | Integrado em barras MC |

---

## Responsividade

| Resolução | Problemas identificados |
|-----------|-------------------------|
| **1366×768** | Fechar Consignação: tabela + sidebar wizard apertados; Relatórios: 7 seções empilhadas; filtros 4 col quebram |
| **1600×900** | Central Trabalho: faixas vazias laterais (max-width 1100px) |
| **1920×1080** | Mesmo espaço vazio; ficha cliente ok (max 1280px) |
| **Tablet ~768px** | Sidebar executive oculta; catálogo relatórios 2 col ok; wizard footer empilha |

---

## Plano de correção sugerido (priorizado)

### Sprint UX-07.1 — P0 (obrigatório)

1. Corrigir `--color-neutral-0` → `--color-surface` em Relatórios  
2. Reescrever regras de título em `ux-enterprise.css` (não aplicar xs uppercase em `h1`)  
3. StatCard + Drawer → tokens semânticos  
4. Linkar Playbooks + Workflow CSS no ERP  
5. Relatórios: colapsar seções; ocultar filtros por ID  

### Sprint UX-07.2 — P1

6. Migrar Pendências/Recomendações/Playbooks para tokens DS  
7. Inputs de filtros → componentes DS  
8. Fechar Consignação → CDSPage  
9. Auditoria/Histórico/Detalhes → CSS + linguagem operacional  
10. Loading overlay + extrato filters → tokens  

### Sprint UX-07.3 — P2/P3

11. Tema Dark completo no Motor Comercial  
12. Consolidar CSS; remover executive legado  
13. Empty states Perdas/Cortesias  

---

## Checklist final de aceite

Use este checklist após correções:

### Legibilidade e contraste
- [ ] Nenhum card com fundo transparente ou token CSS inválido
- [ ] Texto principal ≥ 12px em todas as telas operacionais
- [ ] Contraste mínimo WCAG AA (4.5:1) em texto normal — validar Relatórios, Filtros, Timeline
- [ ] Inputs legíveis em Classic, Dark e High Contrast sem `!important`

### Hierarquia
- [ ] Título da página é o elemento tipográfico dominante (≥ 1.25rem, peso bold)
- [ ] Operador responde “Quem/Onde/O quê” em < 5s na Ficha Cliente e Central Trabalho
- [ ] Meta-informação (empresa, filial, período) visualmente subordinada ao título

### Componentes
- [ ] StatCard, Drawer, Card usam `--color-surface` e `--color-text`
- [ ] Botão primário único e evidente por contexto
- [ ] Sidebars com área clicável ≥ 40px de altura
- [ ] Drawers legíveis em 1366px de largura

### Consistência DS
- [ ] Zero referências a `--cds-color-*` ou `--color-neutral-0`
- [ ] Zero `background: white` / `#fff` sem fallback semântico
- [ ] Todas as páginas com CSS carregado no ERP
- [ ] Filtros usam componentes ou classes DS oficiais

### Operação
- [ ] Relatórios: uma seção principal visível por vez
- [ ] Filtros técnicos (IDs) ocultos por padrão
- [ ] Playbooks e Workflow renderizam com estilo completo
- [ ] Fechar Consignação sem aparência de wizard legado
- [ ] Perdas/Cortesias com empty state profissional

### Responsividade
- [ ] 1366×768: sem scroll horizontal; ações acessíveis
- [ ] Tablet: navegação lateral acessível (não `display: none` sem alternativa)
- [ ] 1920×1080: aproveitamento horizontal razoável (sem faixas vazias excessivas)

---

## Arquivos analisados (referência)

```
frontend/erp/index.html
frontend/modules/motor-comercial/routes/index.js
frontend/modules/motor-comercial/styles/inject.js
frontend/modules/motor-comercial/styles/ux-enterprise.css
frontend/modules/motor-comercial/pages/*/styles.css (16 arquivos)
frontend/shared/design-system/tokens/colors.css
frontend/shared/design-system/primitives/data/StatCard.js
frontend/shared/design-system/primitives/special/Drawer.js
frontend/shared/design-system/styles/inject.js
```

---

## Confirmações

- ✅ Nenhuma alteração de backend, API ou banco foi necessária para esta auditoria  
- ✅ Problemas são reproduzíveis por inspeção de CSS e ordem de carregamento  
- ✅ Causa raiz dos cards invisíveis em Relatórios: **`--color-neutral-0` indefinido** + conflito **`ux-enterprise.css`**  
- ⚠️ Prints de homologação devem ser anexados pelo QA após abrir `/relatorios` em 1366×768 — sintoma esperado: cards do catálogo sem preenchimento visível

---

*Documento gerado na Sprint UX-07 — Auditoria Visual e Operacional do Motor Comercial.*
