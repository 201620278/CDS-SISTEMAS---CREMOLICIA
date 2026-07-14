# P0 — Estabilização do Fluxo "Fechar Consignação"

**Data:** 2026-07-10  
**Escopo:** Frontend exclusivo (sem alteração de backend, banco, APIs ou regras de negócio)

---

## Problemas encontrados

### P0-01 — Erro 400 ao registrar venda

| Sintoma | `POST /api/comercial/consignacoes/{id}/prestacao/venda` retornando 400 |
|---------|------------------------------------------------------------------------|

**Causas raiz identificadas:**

1. **Payload com tipos inconsistentes** — `produtoId`, `quantidade` e `precoVenda` podiam chegar como string ao backend. O DTO `RegistrarVendaRequest.validate` exige `typeof quantidade === 'number'` e `typeof precoVenda === 'number'`.
2. **`produtoId` ausente ou incorreto nas linhas da grade** — itens reconstruídos pelo ledger (`buildItensFromMovimentacoes`) nem sempre traziam `produtoId`/`itemId`, gerando `PRODUTO_NAO_ENCONTRADO_NA_CONSIGNACAO` ou falha de validação.
3. **Race de prestação** — a tela abria prestação automaticamente no carregamento, mas operações podiam disparar antes da confirmação, gerando `PRESTACAO_NAO_ABERTA`.
4. **`precoVenda` ausente** — campo obrigatório no contrato; em alguns itens `preco` vinha zerado por falta de enriquecimento com dados da consignação.

### P0-02 a P0-07 — UX operacional

| Problema | Causa |
|----------|-------|
| TAB perdia fluxo | `_updateUI()` destruía o DOM (`innerHTML = ''`) após cada operação |
| Re-render da tabela inteira | `_loadData(true)` + `_updateContent()` após cada commit |
| Foco voltava ao topo | Sem preservação de `focus` entre renders |
| Sem destaque de linha | Nenhum estado `editing` |
| Tela bloqueada | `withLoading()` global em cada operação de linha |
| Auto-refresh a cada 45s | Interrompia edição e recriava componentes |

### P0-01 — Devolução durante fechamento

| Sintoma | `POST /consignacoes/{id}/devolucao` com prestação aberta → `PRESTACAO_JA_ABERTA` (400) |
|---------|-------------------------------------------------------------------------------------------|

**Causa raiz:** O endpoint `/devolucao` usa `RegistrarDevolucaoAntesPrestacaoUseCase`, que exige **ausência** de prestação aberta. Não existe `POST /prestacao/devolucao` no backend.

**Mitigação frontend (sem alterar backend):**
- Prestação **não é mais aberta automaticamente** ao carregar a tela.
- Devoluções devem ser registradas **antes** da primeira venda/perda/cortesia.
- Mensagem clara quando o operador tenta devolver após prestação já iniciada.

---

## Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `pages/PrestacaoContas/index.js` | Commit por linha, foco, payload validado, reload silencioso, sem refresh total |
| `pages/PrestacaoContas/FecharConsignacaoView.js` | Teclado, status por linha, patch DOM, coluna Status |
| `pages/PrestacaoContas/fecharConsignacaoMappers.js` | `enriquecerItensPrestacao`, `buildPayloadOperacao`, `validarPayloadOperacao` |
| `pages/PrestacaoContas/styles.css` | Destaque de edição, status por linha |
| `api/MotorComercialApi.js` | Normalização numérica nos writes de prestação |
| `tests/pages/fecharConsignacaoMappers.test.js` | Novos testes de payload e enriquecimento |

---

## Fluxos corrigidos

```
Registrar Retornos (grade)
  ├─ Foco em campo → destaque da linha (sem refresh)
  ├─ Digitação → preview de saldo na linha
  ├─ ENTER → commit API → status "Salvando…" → "Salvo" na linha
  ├─ TAB / Shift+TAB → navega entre campos
  ├─ ↑ / ↓ → navega entre linhas (mesmo campo)
  ├─ ESC → cancela edição, restaura valor
  └─ Sucesso → atualiza apenas linha + painel lateral

Ordem operacional recomendada
  1. Devoluções (prestação fechada)
  2. Vendas / Perdas / Cortesias (abre prestação na 1ª operação)
  3. Pagamento
  4. Encerrar atendimento
```

---

## Erros eliminados

- `ReferenceError` / `TypeError` por re-render durante edição
- 400 por `produtoId`/`quantidade`/`precoVenda` com tipo incorreto
- 400 por `produtoId` ausente na grade
- Perda de foco após TAB, ENTER e commit
- Bloqueio global da tela com overlay em cada linha
- Refresh desnecessário da página durante edição

---

## Validação final

| Critério | Status |
|----------|--------|
| Payload de venda normalizado | ✅ |
| TAB / ENTER / ESC / setas | ✅ |
| Foco preservado | ✅ |
| Atualização apenas da linha | ✅ |
| Status por linha (Salvando/Salvo/Erro) | ✅ |
| Painel lateral atualizado sem rebuild | ✅ |
| Devolução antes de vendas | ✅ (com ordem operacional) |
| Devolução após vendas | ⚠️ Mensagem orientativa (limitação de API existente) |
| Testes frontend | ✅ 171 testes |
| Build bundle | ✅ |

### Comandos executados

```bash
npm run test:motor-comercial-frontend
npm run build:motor-comercial
```

---

## Observação para UX-05.2

A **Planilha Operacional Enterprise** poderá migrar sobre esta base estável. A limitação de devolução pós-venda permanece no contrato atual da API e deverá ser tratada em sprint de backend quando a regra de negócio exigir devoluções misturadas com vendas na mesma prestação.
