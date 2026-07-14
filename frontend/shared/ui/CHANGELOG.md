# CHANGELOG — Shared UI (`frontend/shared/ui`)

## [UX-21.3] — 2026-07-13

### Hero wallpaper + EntityCard compact densificado

- Hero: ilustração como fundo (`.cds-hero__wallpaper`, opacity 8–12%)
- EntityCard `compact`: layout vertical enxuto + `description` como resumo
- Central: seções operacionais e feeds lado a lado
- Auditoria: `AUDITORIA_UX21_3.md`

---

## [UX-21.2] — 2026-07-13

### Densidade Operacional

- EntityCard: variantes `compact` / `normal` / `detailed`
- Hero densificado (200–220px; ilustração ~28–30%)
- Central Comercial: grids 2 colunas + spacing canônico
- DS-001: princípio **Densidade Operacional**
- Auditoria: `AUDITORIA_UX21_2.md`

---

## [UX-21.1] — 2026-07-13

### Hero inteligente oficial

- `Hero/` — STATUS **ready**
- Subcomponentes: Greeting · Status · Actions · Illustration
- Períodos: morning / afternoon / sunset / night
- Assets SVG: `Hero/illustrations/*.svg`
- Exemplos: `Hero/examples.js`
- Testes: `Hero/Hero.test.js`
- Barrel: `shared/ui/index.js` → `Hero`
- Changelog DS: `CHANGELOG_DESIGN_SYSTEM.md`

Política: nenhum motor cria Hero próprio.

---

## [FOUNDATION F3] — 2026-07-13

### SmartSearch + EntityCard oficiais

Componentes reutilizáveis da Plataforma CDS — **STATUS: ready**.

- `SmartSearch/` — omnisearch via `provider`; teclado; Ctrl+F; debounce
- `EntityCard/` — cartão universal por composição
- Testes: `npx jest --config frontend/shared/ui/jest.config.js`
- Exemplos: `SmartSearch/examples.js`, `EntityCard/examples.js`
- Auditoria: `AUDITORIA_SMARTSEARCH_ENTITYCARD.md`
- Changelog DS: `CHANGELOG_DESIGN_SYSTEM.md`

**Fora de escopo desta sprint:** migração de telas (UX-12+).

---

## [UX-11] — 2026-07-13

### Conta Corrente = primeira tela oficial sobre Shared UI

A **Conta Corrente Comercial** é a primeira tela de produção da Plataforma CDS construída sobre o Design System Shared UI (`Workspace` / `WorkspaceHeader` / `WorkspaceBody` / `WorkspaceFooter`).

#### Adotado

- Shell obrigatório: `Workspace` variante `station`
- Header fixo: cliente, documento, período, saldo atual, status
- Body com scroll interno: extrato (Data, Tipo, Descrição, Valor, Saldo)
- Footer fixo: Voltar · Exportar · Receber
- Análise (KPIs, gráficos, timeline, alertas, pendências) fora do viewport padrão (`<details>`)

#### Referência de migração

Demais telas do Motor Comercial (e demais motores) devem seguir este padrão — **não** recriar shell próprio.

Código: `frontend/modules/motor-comercial/pages/ContaCorrente/`  
Infra: `frontend/shared/ui/Workspace/` (FOUNDATION F2)

#### Não alterado

APIs, Ledger, Recovery, Crédito Comercial, banco, eventos, regras financeiras.

---

## [FOUNDATION F2] — 2026-07-13

Workspace Shared UI (`STATUS: ready`) — Header/Body/Footer com contrato de scroll.
