# Auditoria S-5.2 — Fluxos Operacionais do Motor Comercial

**Data:** 2026-07-08  
**Sprint:** S-5.2 — Homologação funcional  
**Escopo:** Frontend Motor Comercial (`frontend/modules/motor-comercial`)

---

## Resumo executivo

Auditoria funcional completa dos fluxos operacionais. **12 problemas** identificados; **9 corrigidos** nesta sprint (P0–P1). **3 itens** permanecem como backlog P2/P3 documentados.

**Evidência de testes:** `npm run test:motor-comercial-frontend` — **106 testes passando** (19 suites).  
**Bundle:** `npm run build:motor-comercial` — reconstruído.

---

## Problemas encontrados e correções

### P0-01 — Wizard sem stepper nem botões de ação (Nova Consignação)

| Campo | Detalhe |
|-------|---------|
| **Arquivos** | `pages/NovaConsignacao/index.js`, `components/layouts/WizardLayout.js` |
| **Causa raiz** | `WizardLayout.create()` esperava `steps`/`actions`; páginas passavam `stepper`/`footer` — props ignoradas no primeiro render |
| **Impacto** | Próximo, Confirmar, Cancelar e Salvar Rascunho **nunca apareciam**; wizard inutilizável |
| **Correção** | `WizardLayout` aceita aliases (`stepper`→`steps`, `footer`→`actions`) + sidebar em body flex; NovaConsignacao usa API oficial |
| **Teste** | `NovaConsignacao.test.js` — assert `.cds-stepper` e `.cds-wizard-footer` presentes |

---

### P0-02 — Mesmo bug em Entrega e Prestação

| Campo | Detalhe |
|-------|---------|
| **Arquivos** | `pages/EntregaConsignacao/index.js`, `pages/PrestacaoContas/index.js`, `WizardLayout.js` |
| **Causa raiz** | Idêntica ao P0-01 |
| **Impacto** | Botões Entregar / Registrar Venda / Fechar invisíveis |
| **Correção** | Alias `footer`→`actions` no WizardLayout |

---

### P0-03 — Prestação ignora contexto Cliente 360°

| Campo | Detalhe |
|-------|---------|
| **Arquivos** | `pages/PrestacaoContas/index.js`, `bootstrap/index.js` |
| **Causa raiz** | `create(consignacaoId)` sem `routeQuery`; cancelar/fechar sempre `navigate('/consignacoes')` |
| **Impacto** | Usuário perde contexto ao sair da prestação iniciada no 360° |
| **Correção** | `create(id, query)`, `parseCliente360Context`, `resolveBackPath`, label dinâmico no Cancelar |
| **Teste** | `cliente360Context.test.js` — `resolveBackPath`, `getBackButtonLabel` |

---

### P0-04 — Conta Corrente: loading infinito sem cliente

| Campo | Detalhe |
|-------|---------|
| **Arquivos** | `pages/ContaCorrente/index.js` |
| **Causa raiz** | `_renderSelectorState` só limpava `extrato-tabela`; demais seções ficavam em "Carregando..." |
| **Impacto** | UI inconsistente ao acessar `/conta-corrente` sem parâmetros |
| **Correção** | EmptyState em **todas** as seções |

---

### P1-01 — Nova Consignação: botão Anterior morto no fluxo 360°

| Campo | Detalhe |
|-------|---------|
| **Arquivos** | `pages/NovaConsignacao/index.js` |
| **Causa raiz** | Footer mostrava Anterior; `_goToPreviousStep` bloqueava silenciosamente na etapa 1 |
| **Impacto** | Botão visível sem efeito — confusão UX |
| **Correção** | Ocultar Anterior quando `skipClienteStep && clienteLocked` na etapa 1 |
| **Teste** | `NovaConsignacao.test.js` — Anterior ausente no contexto 360° |

---

### P1-02 — Resumo avançava sem validação

| Campo | Detalhe |
|-------|---------|
| **Arquivos** | `pages/NovaConsignacao/index.js` |
| **Causa raiz** | `_validateCurrentStep` sem `case 3` |
| **Impacto** | Consignação com limite excedido ou dados incompletos passava para Confirmação |
| **Correção** | `case 3: return this._validateAll()` |

---

### P1-03 — Pós-criação perdia contexto 360°

| Campo | Detalhe |
|-------|---------|
| **Arquivos** | `pages/NovaConsignacao/index.js`, `pages/EntregaConsignacao/index.js` |
| **Causa raiz** | Navegação para entrega/prestação sem `origem=cliente360` |
| **Impacto** | Cadeia 360°→Nova→Entrega→Prestação quebrava |
| **Correção** | `buildRouteWithCliente360Context` / `routeWithActiveContext` nas transições |

---

### P1-04 — Centrais sem retorno ao Cliente 360°

| Campo | Detalhe |
|-------|---------|
| **Arquivos** | `Pendencias/index.js`, `Recomendacoes/index.js`, `Playbooks/index.js`, `ContaCorrente/index.js` |
| **Causa raiz** | `clienteId` filtrava dados mas `origem` ignorado; links cruzados sem contexto |
| **Impacto** | Navegação lateral e ações perdiam escopo do cliente |
| **Correção** | `navigationContext`, botão "Voltar ao Cliente 360°", `routeWithActiveContext` em sidebars e CTAs |

---

### P1-05 — Drawers e atalhos 360° sem contexto

| Campo | Detalhe |
|-------|---------|
| **Arquivos** | `PerfilComercial/Cliente360Drawer.js`, `PerfilComercial/index.js` |
| **Causa raiz** | Links fixos `/consignacoes/:id` |
| **Impacto** | Subfluxos operacionais não propagavam origem |
| **Correção** | `_routeFrom360()` + `buildRouteWithCliente360Context` em `onOpenConsignacao` |

---

### P2-01 — Prestação sem empty state de itens

| Campo | Detalhe |
|-------|---------|
| **Arquivos** | `pages/PrestacaoContas/index.js` |
| **Correção aplicada** | `EmptyState` quando `itens.length === 0` |

---

### P2-02 — Seções 360° sem ações interativas (pendências, recomendações, guias)

| Campo | Detalhe |
|-------|---------|
| **Arquivos** | `PerfilComercial/Cliente360View.js` |
| **Status** | **Backlog** — cards listam dados mas não abrem drawers/ações |
| **Prioridade** | P2 — não bloqueia homologação dos fluxos principais |

---

### P2-03 — CSS modo embed 360° órfão

| Campo | Detalhe |
|-------|---------|
| **Arquivos** | `Pendencias/styles.css`, `Recomendacoes/styles.css`, `Playbooks/styles.css` |
| **Status** | **Backlog** — classes `.cds-cliente360-*-panel` não usadas no JS |
| **Prioridade** | P3 — remover ou implementar painel compacto |

---

### P3-01 — Export PDF Recomendações placeholder

| Campo | Detalhe |
|-------|---------|
| **Arquivos** | `pages/Recomendacoes/index.js` |
| **Status** | **Backlog** — toast "sprint futura" |
| **Prioridade** | P3 |

---

## Fluxos auditados — status

| Fluxo | Status homologação |
|-------|-------------------|
| Cliente 360° — carregamento, header, atalhos | ✅ OK |
| Cliente 360° — ações em seções (pendências/guias) | ⚠️ P2 backlog |
| Nova Consignação — menu | ✅ OK (P0 corrigido) |
| Nova Consignação — Cliente 360° | ✅ OK |
| Entrega Consignação | ✅ OK (P0 corrigido) |
| Prestação de Contas | ✅ OK |
| Conta Corrente | ✅ OK |
| Pendências | ✅ OK |
| Recomendações | ✅ OK (exceto PDF P3) |
| Guias Operacionais | ✅ OK |
| Histórico 360° (in-page) | ✅ OK — scroll, sem re-seleção |

---

## Componentes revisados

| Componente | Achado | Status |
|------------|--------|--------|
| WizardLayout | API inconsistente | ✅ Corrigido |
| Stepper | OK — usa índice | ✅ |
| Footer wizard | Botões disabled em saving | ✅ Parcial (NovaConsignacao) |
| Modais (confirm/prompt/choice) | OK | ✅ |
| EmptyState | Faltava em cenários | ✅ Corrigido |
| Tabelas / Cards | OK | ✅ |
| Breadcrumbs | Não implementado globalmente | P3 backlog |

---

## Estados da interface — padronização

| Estado | Padrão adotado |
|--------|----------------|
| Carregando | `Loading.create({ message })` em section hosts |
| Sem dados | `EmptyState.create({ title, description })` |
| Erro | `Alert` / `notify(..., 'error')` |
| Sucesso | `notify(..., 'success')` |
| Cancelamento | `confirmDialog` + `resolveBackPath` |
| Confirmação final | Botão **Confirmar e Criar** na última etapa |

---

## Diretriz arquitetural (homologada)

> Toda alteração em fluxo operacional deve preservar ações necessárias à conclusão da operação.  
> Navegação a partir do Cliente 360° deve usar `cliente360Context.js` (`origem=cliente360`, `resolveBackPath`, `routeWithActiveContext`).

**Utilitário central:** `frontend/modules/motor-comercial/utils/cliente360Context.js`

---

## Código legado marcado para remoção

| Item | Arquivo | Motivo |
|------|---------|--------|
| Props mortas `stepper`/`sidebar` sem uso | Docs antigos | Substituídas por API oficial |
| CSS `.cds-cliente360-*-panel` | Pendencias/Recomendacoes/Playbooks styles | Sem referência JS |
| `CurrencyInput` import não usado | NovaConsignacao/index.js | Import morto (P3) |

---

## Checklist de aceite S-5.2

- [x] Todos os fluxos auditados
- [x] Botões presentes nos wizards (P0 corrigido)
- [x] Nenhuma ação crítica desaparecendo por origem
- [x] Navegação consistente com contexto 360°
- [x] Estados padronizados (loading/empty)
- [x] Componentes WizardLayout revisados
- [x] Fluxos menu e Cliente 360° funcionais
- [x] 106 testes frontend passando
- [ ] Itens P2/P3 em backlog documentado

---

## Próximos passos recomendados

1. **S-5.3** — Ações interativas nas seções do Cliente360View (pendências, recomendações, guias)
2. **S-5.3** — Breadcrumbs globais no Motor Comercial
3. Homologação manual no navegador: fluxo completo 360° → Nova → Entrega → Prestação → voltar 360°
