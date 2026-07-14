# AUDITORIA STAB-06.3.2 — Pós-autorização NFC-e da Prestação

## Achados

### 1. `emitirPorVendaId()` retorna

| Campo | Presente |
|-------|----------|
| `notaId` | ✓ |
| `status` / `success` | ✓ |
| `chaveAcesso` | ✓ |
| `protocolo` (via soap) | ✓ |
| `danfeHtml` | ✓ |
| `numero` | ✓ |
| `vendaId` | ✗ (é parâmetro de entrada; UC já tem) |

### 2. Root cause — Histórico + DANFE

Vendas da Prestação (ex.: #12, #16) gravavam:

`nfce_status = sem_itens_fiscais` → **sem linha em `nfce_notas`**

Motivo: `criarVenda` com `emitir_fiscal:false` + `JA_BAIXADO_CONSIGNACAO` **sem** `quantidade_fiscal` → todos os itens `quantidade_fiscal=0`.

Histórico Fiscal (`GET /fiscal/notas`) lê `nfce_notas` — sem nota, não lista.

### 3. Persistência `prestacao_faturamento` (antes)

- `venda_id` ✓  
- chave/número/protocolo ✓ (quando havia NFC-e)  
- **`nfce_nota_id` ✗** (faltava coluna)

### 4. DANFE frontend

`_mostrarCupomFiscal(vendaId)` era chamado, mas:
- em `sem_itens_fiscais` não há DANFE;
- não usava `fiscal.danfeHtml` do retorno oficial.

---

## Correções (sem tocar Motor Fiscal / XML / Adapter)

1. **EmitirNfcePrestacaoUseCase** — envia `quantidade_fiscal` nos itens; promove itens legados antes de `emitirPorVendaId`.
2. **prestacaoFaturamentoStore** — coluna `nfce_nota_id` + DTO.
3. **UI** — abre DANFE via `danfeHtml` ou `imprimirDANFEFiscal(vendaId)`.

## Fluxo após correção

```
Emitir NFC-e
  → criarVenda (itens com quantidade_fiscal)
  → emitirPorVendaId → nfce_notas
  → prestacao_faturamento (venda_id + nfce_nota_id + chave/nº/prot)
  → abrir DANFE
  → Encerrar Prestação
  → Histórico Fiscal lista por venda_id (mesmo GET /fiscal/notas)
```
