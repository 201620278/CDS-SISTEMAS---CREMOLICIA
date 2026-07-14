# AUDITORIA — SmartSearch & EntityCard (FOUNDATION F3)

**Data:** 2026-07-13  
**Escopo:** `frontend/shared/ui/SmartSearch/` · `frontend/shared/ui/EntityCard/`  
**Referências:** ADR-UX-001 · DS-001 §5.8–5.9 · UX-FOUNDATION-001  

---

## 1. Entrega

| Componente | Path | STATUS |
|------------|------|--------|
| SmartSearch | `frontend/shared/ui/SmartSearch/` | **ready** |
| EntityCard | `frontend/shared/ui/EntityCard/` | **ready** |
| Utils (debounce/announce) | `frontend/shared/ui/Utils/` | **ready** |

**Testes:** 26/26 Shared UI (Workspace + SmartSearch + EntityCard).  
**Migração de telas:** não realizada (conforme escopo F3).

---

## 2. Respostas obrigatórias

### A API é suficientemente genérica?

**Sim.**

- SmartSearch expõe `provider(query, { signal, filters, keys })` — contrato de dados opaco.
- Resultados usam `title` / `subtitle` / `description` / `metadata` / `data` — sem campos de domínio.
- EntityCard usa composição (`title`, `subtitle`, `metadata`, `status`, `badges`, `actions`) — serve qualquer entidade.
- `kind` em EntityCard é string livre apenas para hook CSS, **não** é enum de negócio.

### Existe qualquer acoplamento ao Motor Comercial?

**Não.**

- Nenhum `require` de `modules/motor-comercial`.
- Nenhuma menção a Cliente, Consignado, Prestação, Ledger, Crédito.
- Testes assertam ausência de termos `consignad` / `MotorComercial` / enums de fornecedor na API.

### Pode ser utilizado imediatamente por Comercial, Financeiro, Fiscal, Compras e Estoque?

**Sim.**

Cada motor implementa apenas o `provider` (e o mapeamento do resultado para `title`/`subtitle`/…).  
Exemplo documental em `SmartSearch/examples.js` (catálogo multi-domínio fictício).

### Há responsabilidades indevidas?

**Não** (após revisão).

| Responsabilidade | Dono |
|------------------|------|
| Digitar, debounced search, teclado, lista, atalhos | SmartSearch |
| Layout do cartão, CTAs, estados visuais | EntityCard |
| Fonte de dados / regras de busca / entidades | **Provider do consumidor** |

SmartSearch **não** calcula saldo, não chama API de consignação, não conhece SKU/CPF semanticamente — apenas encaminha a query e `keys` ao provider.

### Existem propriedades redundantes?

**Mínimas e intencionais (aliases):**

| Alias | Canônico | Motivo |
|-------|----------|--------|
| `primaryAction` / `secondaryAction` | `actions.primary` / `actions.secondary` | ergonomia DS |
| `label` em resultado | `title` | compatibilidade de providers |

Não há `clienteId`, `consignacaoId`, `entityType` obrigatório nem props de motor.

**Correção aplicada na auditoria:** remoção de `onSelect` no EntityCard embutido nos resultados do SmartSearch (evitava `role="button"` competindo com `role="option"`).

---

## 3. Checklist anti-fork

- [x] Implementação somente em `frontend/shared/ui/`
- [x] Barrel `shared/ui/index.js` já exportava os módulos (stubs → ready)
- [x] Documentação DS-001 / UX-FOUNDATION-001 / CHANGELOG_DESIGN_SYSTEM atualizados
- [x] Exemplos completos
- [x] Testes: debounce, seleção, atalhos, estados, a11y, eventos
- [x] Nenhuma tela do Motor Comercial alterada nesta sprint

---

## 4. Homologação

| Critério | Status |
|----------|--------|
| Componentes oficiais Shared UI | **Homologado** |
| API genérica multi-motor | **OK** |
| Sem acoplamento Comercial | **OK** |
| Sem migração de tela nesta sprint | **OK** |

**Próximo passo autorizado:** UX-12 (Prestação Locator) consumindo exclusivamente `SmartSearch` + `EntityCard` (+ `Workspace`).

> Nota: UX-11 (Conta Corrente → Workspace) já foi entregue anteriormente; não faz parte desta sprint F3.

---

## 5. Uso rápido

```js
const { SmartSearch, EntityCard } = require('../../../../shared/ui');

const search = SmartSearch.create({
  placeholder: 'Nome, documento, código…',
  debounce: 250,
  keys: ['barcode', 'codigo'],
  provider: async (query, { signal, filters, keys }) => {
    // motor implementa a busca
    return { items: [/* { id, title, subtitle, data } */] };
  },
  onSelect: (item) => { /* navegar / preencher */ }
});

const card = EntityCard.create({
  title: 'Registro',
  subtitle: 'DOC-1',
  status: 'Ativo',
  metadata: [{ label: 'Cidade', value: 'SP' }],
  actions: { primary: { label: 'Abrir' } },
  onPrimaryAction: () => {}
});
```
