# AUDITORIA UX-21.2 — Densidade Operacional (Central Comercial)

**Data:** 2026-07-13  
**Sprint:** UX-21.2  
**Escopo:** Refinamento visual/layout da Central de Trabalho Comercial + EntityCard Shared UI  

**Não alterado:** Backend, APIs, Banco, Ledger, Recovery, Crédito Comercial, Outbox, Eventos, regras de negócio.

---

## 1. Entregas

| Item | Destino | Estado |
|------|---------|--------|
| EntityCard variantes `compact` / `normal` / `detailed` | `frontend/shared/ui/EntityCard/` | Homologado |
| Hero densificado (200–220px, ilustração 28–30%) | `frontend/shared/ui/Hero/` | Homologado |
| Central: grid 2 colunas + spacing canônico | `pages/Dashboard/` | Homologado |
| Princípio Densidade Operacional | `.cds/DS-001.md` | Documentado |
| Changelog DS | `CHANGELOG_DESIGN_SYSTEM.md` | Atualizado |

---

## 2. Respostas obrigatórias

### Existe scroll desnecessário?

**Reduzido.** O viewport inicial (1366×768+) passa a caber Hero + Indicadores + Minha Fila + Consignados na maior parte dos turnos típicos (≤ 2–4 cards por seção). Scroll permanece no `WorkspaceBody` apenas quando a fila cresce — não há scroll de página/shell.

### Existe espaço desperdiçado?

**Não como regra.** Hero perdeu ~35–40% de altura; KPIs baixaram; gap entre seções padronizado em 24px; cards compactos eliminam “área vazia” vertical típica de 1 card/linha.

### A Central transmite produtividade?

**Sim.** Layout de centro operacional denso: o operador vê o que fazer (Hero), o pulso do dia (indicadores) e a fila acionável (cards compactos em 2 colunas) sem varrer a tela.

### A leitura ficou mais rápida?

**Sim.** Metadados essenciais no card (`Status`, `Documento`, `Valor`, `Itens`, `Aguardando`) em bloco único; CTA lateral integrada; tipografia do Hero agrupada (saudação → data → status → mensagem → ações).

### Os cards compactos podem ser reutilizados em outros motores?

**Sim.** `EntityCard` `variant: 'compact'` é Shared UI oficial, sem domínio Comercial. Qualquer Central (Financeira, Fiscal, Compras, Estoque, CRM, Executivo) pode consumir o mesmo contrato.

---

## 3. Densidade (DS-001)

| Contexto | Densidade |
|----------|-----------|
| Centrais | Alta |
| Estações | Foco na tarefa |
| Cadastros | Média |
| Relatórios | Baixa |

Central Comercial = referência oficial de **Centro de Operações**.

---

## 4. Validação executada

| Comando | Resultado |
|---------|-----------|
| Jest Shared UI (EntityCard + Hero) | Ver seção 5 |
| Jest Central (Dashboard + mappers) | Ver seção 5 |
| `verify:motor-comercial` | Ver seção 5 |
| `audit:bundle` / `audit:design-system` | Ver seção 5 |
| `smoke:motor-comercial-bundle` | Ver seção 5 |

---

## 5. Evidência de testes

| Suite / Script | Resultado |
|----------------|-----------|
| Jest EntityCard + Hero | **14/14** passed |
| Jest Central (Dashboard + mappers) | **31/31** passed |
| `verify:motor-comercial` | **PASSED** (sprint UX-21.2) |
| `audit:bundle` | **PASSED** |
| `smoke:motor-comercial-bundle` | **PASSED** |
| `audit:design-system` | **PASSED** (0 tokens inválidos / 0 hardcoded) |

Bundle hash: `517AA00D2548FA84C93C4DD0D691D3BFAB444E8800FDA240472D786E36225D38`
