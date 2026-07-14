# Auditoria — POST `/prestacao/pagamento`

**Status:** Concluída  
**Sprint:** P0 — Auditoria do Endpoint de Pagamento  
**Data:** 2026-07-13  
**Endpoint:** `POST /api/comercial/consignacoes/:id/prestacao/pagamento`

---

## Veredito

O HTTP 400 **não** vinha de regra de quitação total (`valorRecebido == valorDevido`).

A rejeição ocorria em:

| Campo | Valor |
|-------|-------|
| **Arquivo** | `backend/motores/motor-comercial/usecases/consignacao/prestacaoOperacaoHelpers.js` |
| **Função** | `validarPagamentoContraSaldo` |
| **Regra** | `PAGAMENTO_EXIGE_VENDA_REGISTRADA` (`totalVendido <= 0`) |
| **Código HTTP** | 400 via `PagamentoMaiorQueSaldoError` / `PAGAMENTO_MAIOR_QUE_SALDO` |

### Por que falhava na consignação `#1`

Ledger real (SQLite oficial):

| id | tipo | valor | grupo |
|----|------|-------|-------|
| 5 | ABERTURA_PRESTACAO | — | `prest-1-…-4poz9o` |
| 6 | VENDA_PRESTACAO | 45 | `prest-1-…-4poz9o` |
| 8 | ABERTURA_PRESTACAO | — | `prest-1-…-j1v242` *(grupo ativo)* |

- Prestação ativa no banco: `prest-1-…-j1v242` (ABERTA, **sem vendas**).
- Venda de R$ 45 ficou no **grupo anterior** (órfão, sem `FECHAMENTO_PRESTACAO`).
- O Use Case lia só o grupo ativo → `totalVendido = 0` → 400.
- A UI ainda mostrava saldo (itens com `quantidade_vendida = 45`), por isso o fluxo chegava no pagamento.

**Não havia** validação do tipo:

- `valorRecebido == valorDevido`
- `valorRecebido >= valorDevido`
- `saldoFinal == 0`
- prestação quitada obrigatória

Essas regras **já estavam alinhadas** à oficial CDS (parcial e maior permitidos).

---

## Payload / DTO / Use Case

### 1. Payload típico (FE)

```json
{
  "valor": 45,
  "formaPagamento": "DINHEIRO",
  "observacao": null,
  "usuarioId": "..."
}
```

Campos esperados:

| Campo | Origem |
|-------|--------|
| `valor` / valorRecebido | body |
| `formaPagamento` | body |
| `observacao` | body |
| `usuarioId` | body (`_withUsuario`) |
| `consignacaoId` | path `:id` |
| `prestacaoId` | derivado de `consignacao.prestacaoContasAtiva.id` |

### 2. DTO — `RegistrarPagamentoRequest`

**Arquivo:** `http/dto/ConsignacaoDTO.js`

- `validate`: exige `valor` numérico `> 0`.
- `fromJSON`: mantém `valor`, `formaPagamento`, `observacao`, `usuarioId`.
- **Não remove** o valor do pagamento; apenas normaliza número.

### 3. Use Case — `RegistrarPagamentoPrestacaoUseCase`

**Arquivo:** `usecases/consignacao/RegistrarPagamentoPrestacaoUseCase.js`

Fluxo anterior (bug):

```
garantirPrestacaoAberta
→ listarMovimentacoesPrestacao(grupoAtivo)
→ calcularTotaisPrestacao(grupoAtivo)   // totalVendido = 0 se órfão
→ validarPagamentoContraSaldo           // 400
```

---

## Correção aplicada

### Regra de negócio (revisada — append-only)

> **Atenção:** a primeira versão desta correção usava `UPDATE` de `grupo_prestacao_contas_id` e violava o ledger append-only (`trg_mov_comerciais_no_update`). Ver `AUDITORIA_APPEND_ONLY_LEDGER.md`.

1. **`resolverTotaisParaPagamento`**:
   - totais do grupo ativo;
   - se sem vendas: **reaponta** `prestacaoContasAtiva` para o grupo recuperável com vendas (só entidade `consignacoes`);
   - fallback: Conta Corrente da consignação (`Σ VENDA − Σ PAGAMENTO`).
2. Pagamento continua sendo **INSERT** no ledger.
3. Instrumentação e resposta 400 estruturada mantidas.

---

## Conta Corrente (antes do pagamento — caso #1)

| Métrica | Valor |
|---------|-------|
| Valor devido (AR) | 45 |
| Valor recebido | 0 |
| Saldo devedor | 45 |
| Saldo credor | 0 |
| Escopo após correção | `GRUPO_RECONCILIADO` |

---

## Testes

- Fase 3 existente (pagamento feliz / parcial / maior): mantidos.
- Novo: `UC-023 RegistrarPagamento — reancora vendas órfãs de grupo anterior`.

---

## Critério atendido

| Critério | Status |
|----------|--------|
| Qual regra falhou | `PAGAMENTO_EXIGE_VENDA_REGISTRADA` / `totalVendido <= 0` no grupo ativo |
| Qual campo | Escopo de totais por `grupoPrestacaoContasId` (não o `valor` em si) |
| Qual arquivo | `prestacaoOperacaoHelpers.js` → `validarPagamentoContraSaldo` |
| Correção na regra (não no FE) | Reancorar órfãos + AR da consignação |
| 400 sem identificação | Eliminado para este fluxo |
