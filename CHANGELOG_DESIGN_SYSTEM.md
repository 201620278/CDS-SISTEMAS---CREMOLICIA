# CHANGELOG — Design System / Shared UI

Changelog canônico do Design System operacional da Plataforma CDS.

Espelho operacional: `frontend/shared/ui/CHANGELOG.md`

---

## [UX-21.3] — 2026-07-13

### Centro de Operações — Wallpaper + layout em colunas

Refinamento visual da Central Comercial (somente UX).

#### Hero

- Ilustração como **wallpaper** integrado (opacidade 8–12%)
- Sem quadro/borda/sombra separados; SVG atrás do conteúdo

#### Central

- **Minha Fila** ∥ **Consignados Pendentes** (mesma linha)
- **Próximas Entregas** ∥ **Atividades Recentes**
- EntityCard `compact` densificado (status · nome · doc · resumo · CTA)
- Viewport 1920×1080: Hero → Indicadores → Fila/Consignados → Timeline/Atividades

Ver `AUDITORIA_UX21_3.md`.

---

## [UX-21.2] — 2026-07-13

### Densidade Operacional — Central Comercial

Refinamento de layout (somente UX). Sem alteração de APIs, Ledger, Recovery ou regras.

#### EntityCard

- Variantes oficiais: `compact` · `normal` · `detailed`
- Central Comercial consome exclusivamente `compact` (140–170px, layout horizontal)
- Princípio **Densidade Operacional** documentado no DS-001

#### Hero

- Altura alvo 200–220px (−35–40%)
- Ilustração 28–30% à direita
- Tipografia/espaçamento agrupados (sem “vazios”)

#### Central

- Fila e Consignados em grid 2 colunas (gap 16px)
- Indicadores mais baixos; seções com margin 24px
- Viewport inicial: Hero → Indicadores → Minha Fila → Consignados

Ver `AUDITORIA_UX21_2.md`.

---

## [UX-21.1] — 2026-07-13

### Hero inteligente oficial (`STATUS: ready`)

Componente Shared UI reutilizável para Centrais da Plataforma CDS.

#### Hero (`frontend/shared/ui/Hero/`)

- Saudação automática por período (morning / afternoon / sunset / night)
- Data e hora do sistema com relógio vivo opcional
- Status operacional genérico + mensagem inteligente (dados via props)
- CTAs principais (Nova Entrega / Clientes no consumo Comercial)
- Quatro ilustrações SVG oficiais (sem foto/PNG)
- Layout desktop-first: conteúdo à esquerda · ilustração 35–40% à direita
- Microanimações discretas (fade + transição de período)

#### Política

Proibido criar Hero (ou forks) dentro de qualquer motor. Consumir exclusivamente `frontend/shared/ui/Hero`.

#### Consumo inicial

Central de Trabalho Comercial (UX-21 / UX-21.1).

---

## [UX-20] — 2026-07-13

### Operação Primeiro

Quatro estações principais do Motor Comercial sobre Workspace Shared UI (Prestação, Conta Corrente, Preparar, Entrega).

Ver `AUDITORIA_UX20.md`.

---

## [FOUNDATION F3] / [UX-12] — 2026-07-13

### Prestação V2 consome Shared UI oficial

- Localizador `/prestacao`: Workspace + SmartSearch + EntityCard
- Estação de Prestação: Workspace (primeira Estação de Trabalho completa da plataforma)

Ver `AUDITORIA_UX12_PRESTACAO.md`.

---

## [FOUNDATION F3] — 2026-07-13

### SmartSearch + EntityCard oficiais (`STATUS: ready`)

Homologados como componentes compartilhados. **Nenhuma tela migrada nesta sprint.**

#### SmartSearch (`frontend/shared/ui/SmartSearch/`)

- Campo único omnisearch
- Provider genérico (sem domínio de motor)
- Debounce configurável; Enter / Esc / ↑↓; Ctrl+F
- Estados: idle · searching · loading · results · empty · error · disabled
- Resultados opcionais via EntityCard

#### EntityCard (`frontend/shared/ui/EntityCard/`)

- Composição: title · subtitle · description · metadata · status · badges · actions
- Estados: normal · selected · disabled · loading · error
- Acessível por teclado; foco visível; ARIA

#### Política

Proibido criar SmartSearch/EntityCard (ou forks) dentro de qualquer motor.

#### Próximo uso

UX-12 — Prestação Locator consome exclusivamente estes componentes.

---

## [UX-11] — 2026-07-13

Conta Corrente = primeira tela oficial sobre Workspace (Shared UI).

## [FOUNDATION F2] — 2026-07-13

Workspace + Header/Body/Footer (`STATUS: ready`).
