# CDS Design System — Documentação Oficial

**Sprint DS-01 · Fundação da Plataforma CDS Sistemas**

O CDS Design System é a referência obrigatória de interface para todos os motores da plataforma. Nasce do Motor Comercial, módulo de referência de UX da empresa.

**Contratos oficiais de plataforma:**
- [ADR-UX-001 — Filosofia Oficial de UX](../../../../.cds/adr/ADR-UX-001.md)
- [DS-001 — Design System Operacional](../../../../.cds/DS-001.md) (componentes, comportamento, teclado — **sem** branding)
- [UX-FOUNDATION-001](../../../../.cds/UX_FOUNDATION_001.md) · código [`frontend/shared/ui/`](../../ui/)

Este arquivo documenta a **implementação em código do Design System**.  
O DS-001 documenta o **contrato operacional**.  
O Shared UI é a **fachada obrigatória** consumida pelos motores.

---

## Princípios

1. **Reutilização** — Nenhum módulo cria componente próprio quando existe equivalente oficial.
2. **Tokens centralizados** — Espaçamento, cores, tipografia e sombras vêm de `tokens/`. Nunca use valores fixos espalhados.
3. **Linguagem operacional** — O operador vê termos do dia a dia, nunca jargão técnico. Ver [LANGUAGE.md](./docs/LANGUAGE.md).
4. **Estados padronizados** — Loading, Vazio, Erro, Sucesso, Aviso e Desabilitado em todos os componentes.
5. **Consistência visual** — Cabeçalhos, cards, formulários e tabelas seguem o mesmo padrão em todos os motores.

---

## Estrutura

```
frontend/shared/design-system/
├── components/     # Componentes oficiais CDS*
├── primitives/     # Implementações base (origem Motor Comercial)
├── tokens/         # Design tokens
├── theme/          # Tema e defaults de componentes
├── styles/         # Injeção de CSS
├── typography/     # Escala tipográfica
├── icons/          # Ícones operacionais
├── docs/           # Documentação
└── examples/       # Exemplos de uso
```

---

## Componentes oficiais

### Layout

| Componente | Uso |
|------------|-----|
| `CDSPage` | Estrutura de página com header, sidebar, conteúdo e footer |
| `CDSPageHeader` | Título, subtítulo, ações e botão voltar |
| `CDSSection` | Bloco de conteúdo com título e descrição |
| `CDSCard` | Container de informação |
| `CDSActionPanel` | Painel lateral de ações rápidas |
| `CDSSidebar` | Navegação lateral |
| `CDSFooter` | Rodapé de página |

### Busca

| Componente | Uso |
|------------|-----|
| `CDSSearchBar` | Campo de busca com ação |
| `CDSFilterBar` | Filtros em linha |
| `CDSSearchResult` | Item de resultado clicável |

### Cards

| Componente | Uso |
|------------|-----|
| `CDSOperationalCard` | Card com ação principal (prioridade operacional) |
| `CDSSummaryCard` | Indicador numérico resumido |
| `CDSFinanceCard` | Valores financeiros |
| `CDSStatusCard` | Status com destaque visual |
| `CDSTimelineCard` | Eventos em linha do tempo |

### Botões

| Componente | Variante |
|------------|----------|
| `CDSPrimaryButton` | Ação principal |
| `CDSSecondaryButton` | Ação secundária |
| `CDSSuccessButton` | Confirmação positiva |
| `CDSDangerButton` | Ação destrutiva |
| `CDSIconButton` | Apenas ícone |

### Formulários

`CDSTextField`, `CDSNumberField`, `CDSCurrencyField`, `CDSDateField`, `CDSSelect`, `CDSAutocomplete`, `CDSTextArea`, `CDSCheckbox`, `CDSSwitch`, `CDSRadioGroup`, `CDSFormSection`

### Feedback

`CDSAlert`, `CDSToast`, `CDSEmptyState`, `CDSLoading`, `CDSProgress`, `CDSConfirmDialog`

### Navegação

`CDSBreadcrumb`, `CDSTabBar`, `CDSStepper`, `CDSPagination`, `CDSBackButton`

### Dados

`CDSTable`, `CDSResponsiveTable`, `CDSTimeline`, `CDSBadge`, `CDSTag`, `CDSStatusIndicator`

---

## Design Tokens

Importação:

```javascript
const { tokens, theme, setTheme, initTheme } = require('frontend/shared/design-system');
```

Categorias: `spacing`, `typography`, `colors`, `radius`, `shadow`, `breakpoints`, `zindex`, `animations`, `borders`, `grid`, `icons`

Variáveis CSS injetadas automaticamente: `--spacing-*`, `--font-size-*`, `--color-primary-*`, etc.

### Gráficos (Sprint UX/UI 2.1)

Tema Chart.js e estilos CSS em `charts/`:

- Script: `/shared/design-system/charts/cdsChartTheme.js` → `window.CDSChartTheme`
- CSS: `/shared/design-system/charts/charts.css`
- Paleta: receita grafite, hover dourado, comparativo/volume cinza
- KPI strip (`.cds-chart-kpi`) acima do gráfico
- Tooltips claros, grid mínimo, linhas 2–2.5px, área ≤10% opacidade

---

### Fundação Visual (Sprint UX/UI 2.0.1)

Camada CSS oficial em `index.css` — tokens, temas dinâmicos, componentes base (`.cds-*`) e animações.

```
design-system/
├── tokens/*.css
├── themes/          # classic | dark | high-contrast + ThemeManager
├── components/*.css # buttons, cards, inputs, tables, alerts, badges…
├── animations/      # fade, slide, scale, pulse, shimmer
└── index.css
```

Troca de tema sem reload:

```javascript
setTheme('dark');           // classic | dark | high-contrast
document.documentElement.setAttribute('data-theme', 'high-contrast');
```

Novas UIs devem usar tokens semânticos (`var(--color-surface)`, `var(--spacing-md)`) e classes `.cds-btn`, `.cds-input`, `.cds-card`, etc. Telas existentes não foram migradas nesta sprint.

---

## Quando utilizar

- Toda nova tela de qualquer motor CDS
- Refatoração de telas existentes
- Modais, drawers, formulários e listagens
- Mensagens ao operador

## Quando NÃO utilizar

- Não crie `<button>` ou `<input>` estilizados manualmente se existe componente CDS
- Não duplique tokens com valores hardcoded (`padding: 13px`, `#3367d6`)
- Não exponha termos técnicos na UI

---

## Boas práticas

1. Importe do pacote oficial: `require('frontend/shared/design-system')`
2. Chame `injectDesignSystemStyles()` no bootstrap do módulo
3. Use `CDSPage` + `CDSPageHeader` para novas páginas
4. Prefira `CDSOperationalCard` para ações; cards apenas informativos são secundários
5. Feedback específico: "Consignação criada" em vez de "Sucesso"

---

## Anti-padrões

| ❌ Evitar | ✅ Preferir |
|-----------|-------------|
| Botão HTML cru com CSS local | `CDSPrimaryButton` |
| Cores hexadecimais inline | Tokens `theme.colors` |
| "Prestação de Contas" | "Fechar Consignação" |
| "Ledger" / "Projection" | "Movimentações" / "Extrato" |
| Componente copiado entre motores | Primitivo compartilhado em `design-system/` |

---

## Showcase

Acesse **`/design-system`** no Motor Comercial para ver todos os componentes com:

- Visualização ao vivo
- Código de uso
- Variações e estados
- Layout responsivo

---

## Migração Motor Comercial

O Motor Comercial foi migrado na DS-01:

- `frontend/modules/motor-comercial/components/*` → reexportam `design-system/primitives/*`
- `theme/` e `tokens/` → reexportam o Design System
- `styles/inject.js` → delega a `injectDesignSystemStyles()`

Imports legados (`require('../components/base/Button')`) continuam funcionando sem alteração nas páginas.

---

## Checklist para novos componentes

Antes de adicionar qualquer componente ao sistema, responda:

- [ ] Pode ser reutilizado por outro módulo?
- [ ] Segue os tokens oficiais?
- [ ] Possui estados: loading, vazio, erro, sucesso, aviso, desabilitado?
- [ ] Usa linguagem operacional nos textos padrão?
- [ ] Foi documentado no showcase?

Se qualquer resposta for **não**, o componente não deve entrar no Design System.

---

## Critérios de aceite DS-01

| Critério | Status |
|----------|--------|
| Estrutura oficial em `frontend/shared/design-system/` | ✅ |
| Componentes reutilizáveis implementados | ✅ |
| Tokens oficiais | ✅ |
| Documentação | ✅ |
| Showcase `/design-system` | ✅ |
| Motor Comercial usando componentes oficiais | ✅ |
| Duplicatas eliminadas (reexport centralizado) | ✅ |
| Linguagem padronizada | ✅ |
| Estados padronizados | ✅ |

---

## Sprint DS-02 — Consolidação Oficial (12/07/2026)

### Tokens semânticos obrigatórios

| Token | Uso |
|-------|-----|
| `--color-bg` | Fundo da página |
| `--color-surface` | Cards, inputs, modais, drawers |
| `--color-surface-muted` | Sidebars, footers, áreas secundárias |
| `--color-surface-hover` | Hover de superfície |
| `--color-border` / `--color-border-strong` | Bordas |
| `--color-text` / `--color-text-secondary` / `--color-text-muted` | Texto |
| `--color-overlay` | Backdrop de modal/drawer/loading |
| `--color-hover` / `--color-action-*` | Interação |
| `--color-disabled-*` | Estados desabilitados |
| `--color-neutral-000` | Primitivo de superfície máxima (tema claro) |

**Proibido:** `--color-neutral-0`, `--cds-color-*`, cores hardcoded em componentes.

### Hierarquia tipográfica (classes — nunca h1 global)

| Classe | Uso |
|--------|-----|
| `.cds-eyebrow` | Rótulo superior (ex.: seção, contexto) |
| `.cds-title` / `.cds-page-title` | Título principal da página |
| `.cds-subtitle` | Subtítulo ou título de drawer/modal |
| `.cds-description` | Texto de apoio |
| `.cds-label` | Label de campo |
| `.cds-helper` | Texto de ajuda |
| `.cds-caption` | Metadados, timestamps |
| `.cds-page-header` | Bloco composto de cabeçalho |

Arquivo: `components/typography.css`

### Componentes consolidados (CSS canônico)

| Componente | Arquivo CSS |
|------------|-------------|
| StatCard / SummaryCard | `components/stat-cards.css` |
| Drawer | `components/drawers.css` |
| Loading + Overlay + Progress | `components/loading.css` |
| Inputs | `components/inputs.css` |
| Modals | `components/modals.css` |
| Cards | `components/cards.css` |

Primitivos JS (`StatCard`, `Drawer`, `Loading`, `Input`, `Textarea`) delegam estilos ao CSS — `getStyles()` retorna vazio.

### Temas

`classic` · `dark` · `high-contrast` — todos os componentes respondem via tokens semânticos.

### Auditoria automática

```bash
npm run audit:design-system
```

Gera `frontend/shared/design-system/DESIGN_SYSTEM_AUDIT.md`.

### Regras obrigatórias DS-02

1. **Nunca** estilizar `h1`, `h2`, `h3` globalmente fora de `typography.css`
2. **Nunca** usar `white`, `#fff`, `#000` em componentes — apenas tokens
3. **Nunca** usar `!important` em inputs (autofill via `box-shadow` + token)
4. **Sempre** usar `--color-surface` para superfícies elevadas
5. Páginas de módulos **não** criam componentes visuais próprios — consomem o DS

### Checklist para novos módulos

- [ ] `injectDesignSystemStyles()` no bootstrap
- [ ] `<link>` para `/shared/design-system/index.css`
- [ ] Cabeçalhos com `.cds-page-header` + `.cds-title`
- [ ] Zero tokens inexistentes (`npm run audit:design-system` passa)
- [ ] Temas Classic/Dark/High Contrast testados
- [ ] Sem CSS de página sobrescrevendo tokens sem necessidade

---

*CDS Design System — Padrão oficial de interface do CDS Sistemas.*
