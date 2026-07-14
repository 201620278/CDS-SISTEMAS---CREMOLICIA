# AUDITORIA UX-12 — Prestação de Contas V2 (Estação de Trabalho)

**Data:** 2026-07-13  
**Sprint:** UX-12  
**Referências:** ADR-UX-001 · DS-001 · UX-FOUNDATION-001 · STAB-03 · STAB-04  

---

## 1. Entrega

| Peça | Rota / path | Shared UI |
|------|-------------|-----------|
| Localizador | `/prestacao` · `pages/PrestacaoLocator/` | Workspace + SmartSearch + EntityCard |
| Estação | `/consignacoes/:id/prestacao` · `pages/PrestacaoContas/` | Workspace (Header/Body/Footer) |
| Grade | momento `retornos` | **STAB-04 intacto** (`gradeConsistencia` / flush) |

**Não alterado:** APIs, Ledger, Recovery, banco, regras de negócio, contratos STAB-04 de persistência.

---

## 2. Fluxo oficial

```
Central → /prestacao (SmartSearch) → EntityCard “Prestar Contas”
  → /consignacoes/:id/prestacao (Estação)
  → Registrar retornos (grade)
  → Continuar → Pagamento (se aplicável) → Encerrar Atendimento
  → Sucesso: Receber Agora | Voltar para Central
```

Voltar da Estação → `/prestacao` (não lista de consignações).  
Sucesso → Central `/`.

---

## 3. Respostas obrigatórias

### A Estação pode servir de modelo para o Motor Financeiro?

**Sim.** Anatomia Workspace (header contextual + body com superfície principal + footer de ações) é genérica. O Financeiro troca o body (extrato/lançamentos) e o provider de busca.

### Pode servir para Compras?

**Sim.** Localizador (SmartSearch + EntityCard) + Estação (grade/documento + ActionBar no footer) mapeia pedidos/recebimentos.

### Pode servir para Produção?

**Sim.** Mesmo padrão: localizar ordem/OP → estação com grade operacional → footer Continuar/Encerrar.

### Pode servir para Assistência Técnica?

**Sim.** Localizar OS/cliente → estação de atendimento → conclusão com próximo passo único (Receber / Voltar).

### Existem componentes que ainda pertencem ao Motor Comercial mas deveriam migrar para Shared UI?

**Sim — candidatos (não bloqueantes do UX-12):**

| Atual no Comercial | Destino Shared UI sugerido |
|--------------------|----------------------------|
| Grade STAB-04 (`#fechar-retornos-grade`) | `OperationalGrid` (FOUNDATION F5 / UX-13) |
| Stepper residual / momentos | `Wizard` / `Stepper` shared |
| Botões base locais | `ActionBar` shared |
| `FecharConsignacaoView` painéis | reduzir; totais via `SummaryCard` ≤3 |

A grade **não** foi movida nesta sprint de propósito (STAB-04).

### Existe qualquer duplicação visual?

**Reduzida.** Sidebar de resumo removida do shell; sucesso sem muro de KPIs; conferência final enxuta (Total / Recebido / Saldo).  
Painel lateral ainda existe no código (`renderPainelLateral`) para preview interno da grade, mas **não** é montado no Workspace shell.

### Existe qualquer scroll de página?

**Não no shell.** Workspace força overflow hidden no root; apenas `WorkspaceBody` rola. A grade continua com scroll interno próprio (STAB-04).

### Existe informação que obrigue o operador a procurar o próximo passo?

**Não no caminho feliz.** Footer fixo com Continuar / Encerrar; sucesso com no máximo 2 CTAs (Receber Agora / Voltar para Central).

---

## 4. Conformidade

| Norma | Status |
|-------|--------|
| ADR-UX-001 | OK — Estação, sem dashboard no default |
| DS-001 | OK — Workspace / SmartSearch / EntityCard |
| UX-FOUNDATION-001 | OK — sem fork Shared UI |
| STAB-03 | Bundle + verify UX-12 |
| STAB-04 | Grade / dirty / flush preservados |

---

## 5. Homologação

A Prestação de Contas V2 é a **primeira Estação de Trabalho oficial** da Plataforma CDS (localizar + operar + concluir).

Conta Corrente (UX-11) permanece referência de extrato financeiro sobre Workspace; a Prestação é o modelo de **atendimento operacional**.
