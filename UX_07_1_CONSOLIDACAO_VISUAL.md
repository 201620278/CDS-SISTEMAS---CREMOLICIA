# UX-07.1 — Consolidação Visual do Motor Comercial

**Plataforma:** CDS Sistemas · Motor Comercial  
**Data:** 12/07/2026  
**Sprint:** UX-07.1 (pós DS-02)  
**Escopo:** Consolidação visual exclusiva — sem novas funcionalidades de negócio  
**Referências:** `AUDITORIA_UX_VISUAL_MOTOR_COMERCIAL.md`, `DESIGN_SYSTEM_AUDIT.md`, `CDS_DESIGN_SYSTEM.md`

---

## Resumo executivo

A sprint UX-07.1 conclui a consolidação visual do Motor Comercial sobre a fundação DS-02. O foco principal foi a **Central de Relatórios** (fluxo progressivo em 3 etapas), a correção de **Playbooks** e **Workflow** (CSS ausente + tokens), e a eliminação de **hardcodes `white` / `#fff`** em todos os CSS de páginas.

| Métrica | Antes (UX-07) | Depois (UX-07.1) |
|---------|---------------|------------------|
| Token inválido `--color-neutral-0` em Relatórios | Sim | Não |
| Playbooks/Workflow CSS no ERP | Ausente | Linkado |
| Hardcodes `white`/`#fff` em páginas MC | ~40 ocorrências | 0 |
| Relatórios — tudo visível de uma vez | Sim (7 seções) | Não (browse → configure → results) |
| Exportação antes de gerar | Sim | Não |
| Auditoria DS (`audit:design-system`) | — | 0 violações |
| Testes frontend MC | 184 passando | 184 passando |
| Build MC | — | OK |

---

## Telas revisadas

| # | Tela | Etapa | Status |
|---|------|-------|--------|
| 1 | **Central de Relatórios** (`/relatorios`, `/indicadores`) | 1 | Redesenhada — fluxo progressivo |
| 2 | **Guias Operacionais** (`/playbooks`) | 2 | CSS DS + tipografia oficial |
| 3 | **Central de Processos** (`/workflow`) | 3 | CSS DS + tipografia oficial |
| 4 | Central de Trabalho (`/`) | 4–7 | Tokens + contraste botão primário |
| 5 | Consignações (`/consignacoes`) | 5 | `.cds-page-header` + tipografia DS |
| 6 | Preparar Entrega (`/consignacoes/nova`) | 4–5 | Tokens + header DS |
| 7 | Fechar Consignação (`/prestacao`) | 4 | Tokens warning |
| 8 | Conta Corrente | 4–5 | Tokens + header DS |
| 9 | Central de Clientes / Ficha | 4–5 | Tokens + gradientes semânticos |
| 10 | Central de Pendências | 4–7 | Migração `--cds-color-*` → tokens DS |
| 11 | Histórico do Atendimento | 5 | Header DS |
| 12 | Entrega, Recomendações, Nova Consignação CSS | 4 | Tokens de superfície |

---

## Arquivos alterados

### ETAPA 1 — Central de Relatórios

| Arquivo | Alteração |
|---------|-----------|
| `frontend/modules/motor-comercial/pages/Relatorios/index.js` | Fluxo `browse` → `configure` → `results`; pesquisa, categorias, favoritos, recentes; filtros avançados colapsáveis; exportação só após gerar |
| `frontend/modules/motor-comercial/pages/Relatorios/styles.css` | Reescrito (sprint anterior + refinamentos): classes `.cds-relatorios-*`, tokens DS |

### ETAPA 2–3 — Playbooks e Workflow

| Arquivo | Alteração |
|---------|-----------|
| `frontend/erp/index.html` | Links para `Playbooks/styles.css` e `WorkflowCenter/styles.css` |
| `frontend/modules/motor-comercial/pages/Playbooks/styles.css` | Reescrito com tokens DS |
| `frontend/modules/motor-comercial/pages/Playbooks/index.js` | Header `.cds-page-header` + tipografia oficial |
| `frontend/modules/motor-comercial/pages/WorkflowCenter/styles.css` | Reescrito com tokens DS |
| `frontend/modules/motor-comercial/pages/WorkflowCenter/index.js` | Header `.cds-page-header` + tipografia oficial |

### ETAPA 4–5 — Páginas legadas e tipografia

| Arquivo | Alteração |
|---------|-----------|
| `pages/Dashboard/styles.css` | `white`/`#fff` → tokens |
| `pages/Consignacoes/styles.css` | Superfícies → `var(--color-surface)` |
| `pages/Consignacoes/index.js` | Header DS |
| `pages/NovaConsignacao/styles.css` | Tokens + warning semântico |
| `pages/NovaConsignacao/index.js` | Header DS |
| `pages/PrestacaoContas/styles.css` | Tokens |
| `pages/PerfilComercial/styles.css` | Tokens + gradientes warning |
| `pages/ContaCorrente/styles.css` | Tokens |
| `pages/ContaCorrente/index.js` | Header DS |
| `pages/EntregaConsignacao/styles.css` | Tokens |
| `pages/Pendencias/styles.css` | `--cds-color-*` → tokens DS oficiais |
| `pages/HistoricoPrestacao/index.js` | Header DS |

### Build

| Arquivo | Alteração |
|---------|-----------|
| `frontend/modules/motor-comercial/motor-comercial.bundle.js` | Regenerado |
| `frontend/modules/motor-comercial/motor-comercial.bundle.css` | Regenerado |

---

## Problemas corrigidos (mapeamento UX-07)

| ID UX-07 | Problema | Correção UX-07.1 |
|----------|----------|------------------|
| P0-01 | Cards transparentes em Relatórios (`--color-neutral-0`) | CSS reescrito com `var(--color-surface)` |
| P0-02 | Títulos achatados por `ux-enterprise.css` | Resolvido em DS-02; headers usam `.cds-page-header` |
| P0-03 | StatCard/Drawer/inputs com `white` fixo | Resolvido em DS-02 |
| P1-01 | Relatórios sobrecarregados (catálogo + filtros + 7 seções) | Fluxo em 3 etapas — nunca tudo ao mesmo tempo |
| P1-02 | Ações de exportação visíveis antes de gerar | Toolbar de exportação só na etapa `results` |
| P1-03 | Playbooks CSS não carregado no ERP | Link adicionado em `index.html` |
| P1-04 | Workflow CSS não carregado no ERP | Link adicionado em `index.html` |
| P1-05 | Playbooks/Workflow com hardcodes `#fff`, `#64748b` | CSS migrado para tokens DS |
| P1-06 | Filtros técnicos (Cliente ID, Produto ID) expostos por padrão | Movidos para “Mais filtros” (colapsável) |
| P2-* | Hardcodes `white`/`#fff` em ~16 CSS de páginas | Substituídos por tokens semânticos |
| P2-* | Headers sem tipografia DS | Migrados para `.cds-eyebrow`, `.cds-title`, `.cds-description` |

---

## Comparativo antes / depois

### Central de Relatórios

**Antes:**
```
[Header: Relatórios + Atualizar | Exportar | Agendar | Compartilhar]
[Catálogo completo — todos os grupos]
[Filtros: Empresa, Filial, Período, Cliente ID, Produto ID, ...]
[Visualização | Indicadores | Insights | Rankings | Comparativos | Favoritos | Histórico]
→ Auto-execução no render; baixo contraste; hierarquia confusa
```

**Depois:**
```
ETAPA browse:
  [Pesquisa rápida]
  [Operacionais | Comerciais | Financeiros | Executivos]
  [Lista de relatórios da categoria]
  [Favoritos] [Recentes]

ETAPA configure (após selecionar relatório):
  [Relatório selecionado]
  [Empresa | Filial | Período]
  [Mais filtros ▼] (opcional)
  [Gerar Relatório]

ETAPA results (após gerar):
  [PDF | Excel | Imprimir | Compartilhar]
  [Visualização do relatório + EmptyState quando vazio]
  [Loading oficial durante geração]
```

### Playbooks / Workflow

**Antes:** CSS inline legado, `#fff` / `#64748b`, estilos não carregados no ERP.  
**Depois:** Tokens `var(--color-surface)`, `var(--color-border)`, `var(--color-text)`, headers com tipografia DS.

### Páginas legadas

**Antes:** `background: white`, `background: #fff`, fallbacks `--cds-color-*`.  
**Depois:** `var(--color-surface)`, `var(--color-text)`, `var(--color-border)`, `var(--color-muted)`.

---

## Problemas remanescentes

| Prioridade | Item | Motivo / Próximo passo |
|------------|------|------------------------|
| P2 | Wizards (`EntregaConsignacao`, `PrestacaoContas`) — aparência `WizardLayout` legada | Fora do escopo desta sprint; requer sprint dedicada de wizard DS |
| P2 | Drawers (`IndicadorDrawer`, `CockpitDrawer`) — labels 12px em alguns contextos | Herdam estilos de conteúdo analítico; revisar em UX-08 |
| P3 | Placeholders ERP (Perdas, Cortesias) | Sem página MC dedicada |
| P3 | Configurações / Auditoria sem CSS dedicado | Telas secundárias; backlog |
| P3 | `HistoricoPrestacao` sem `styles.css` próprio | Header DS aplicado; CSS compartilhado suficiente por ora |
| P3 | Botões CTA escuros em PerfilComercial (`#0f172a`) | Contraste adequado; migrar para token de botão escuro em sprint futura |

Nenhum item remanescente é **P0** ou bloqueia homologação visual principal.

---

## Checklist final (critérios de aceite)

| Critério | Status |
|----------|--------|
| Nenhuma tela com baixo contraste (P0) | ✅ |
| Nenhuma tela com `white`/`#fff` hardcoded em CSS de páginas | ✅ |
| CSS legado substituído por tokens DS nas páginas auditadas | ✅ |
| Cards padronizados (Relatórios, Playbooks, Workflow) | ✅ |
| Botões via componente `Button` oficial | ✅ |
| Componentes oficiais (Loading, EmptyState, Button) | ✅ |
| Relatórios reorganizados (fluxo progressivo) | ✅ |
| Playbooks corrigidos | ✅ |
| Workflow corrigido | ✅ |
| Empty States padronizados (Relatórios browse/results) | ✅ |
| Loading padronizado (`Loading.create`) | ✅ |
| Dark Theme funcional (tokens semânticos DS-02) | ✅ |
| Classic Theme funcional | ✅ |
| High Contrast funcional | ✅ |
| Build executado (`npm run build:motor-comercial`) | ✅ |
| Testes passando (`npm run test:motor-comercial-frontend` — 184/184) | ✅ |
| Auditoria DS limpa (`npm run audit:design-system`) | ✅ |

---

## Comandos de verificação

```bash
npm run build:motor-comercial
npm run test:motor-comercial-frontend
npm run audit:design-system
```

---

## Homologação visual recomendada

Validar manualmente nos viewports:

- 1366×768 (notebook)
- 1600×900
- 1920×1080

Temas: **Classic**, **Dark**, **High Contrast** — especialmente Relatórios (3 etapas), Playbooks e Workflow.

---

## Conclusão

O Motor Comercial passa a transmitir identidade visual unificada via CDS Design System. A **Central de Relatórios** deixa de sobrecarregar o operador e segue o princípio operacional: **escolher → configurar → gerar → exportar**.

Esta sprint encerra a consolidação visual planejada (UX-07.1). O módulo entra em **homologação final e feature freeze**, recebendo apenas correções pontuais.
