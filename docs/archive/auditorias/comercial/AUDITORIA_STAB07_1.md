# AUDITORIA — STAB-07.1 Consolidação da Prestação (Fase 1)

**Data:** 2026-07-14  
**Escopo:** Frontend Prestação de Contas apenas  
**Status:** Implementado

## Arquivos alterados

- `frontend/modules/motor-comercial/pages/PrestacaoContas/index.js`
- `frontend/modules/motor-comercial/pages/PrestacaoContas/FecharConsignacaoView.js`
- `frontend/modules/motor-comercial/pages/PrestacaoContas/fecharConsignacaoMappers.js`
- `frontend/modules/motor-comercial/pages/PrestacaoContas/prestacaoFinanceiroSnapshot.js`
- `frontend/modules/motor-comercial/pages/PrestacaoContas/prestacaoOperacionalConsolidacao.js` (label Em Aberto)
- `frontend/modules/motor-comercial/pages/PrestacaoContas/styles.css`
- Testes: `fecharConsignacaoMappers.test.js`, `prestacaoContinuarBlur.test.js`, `stab0663…`, `stab071ConsolidacaoPrestacao.test.js`

## Fluxo antigo

```text
Conferir → Registrar Retornos → Pagamento → Resumo Final → Encerramento
```

Problema forense STAB-06.6.5: **Continuar** no step Pagamento podia chamar `_registrarPagamento()` com saldo restante (ou valor sugerido), quitando automaticamente.

## Fluxo novo

```text
Registrar Retornos → Resumo Final → (Encerramento pós-sucesso)
```

Resumo Final concentra:

1. Resumo Financeiro (`snapshot.financeiro`)
2. Bloco Pagamento (rascunho + **Registrar Pagamento**)
3. Situação Fiscal / Venda Oficial / NFC-e / Próximo passo
4. Footer: Voltar · Emitir NFC-e · Encerrar Prestação

## Evidências

| Regra | Evidência |
|-------|-----------|
| Step Pagamento removido | `MOMENTOS_FECHAMENTO` = retornos, conferencia, encerramento |
| Sem pagamento automático | `_goNext` só flush + avança; sem `_registrarPagamento` |
| Sem auto-preencher saldo | `_sugerirValorPagamento` removido |
| Única porta financeira FE | `_registrarPagamento` ← botão no Resumo |
| SSOT | `buildPrestacaoSnapshot` → financeiro/itens/fiscal/vendaOficial/statusOperacional |
| Após pagamento | POST → `_loadData` → `_syncSnapshotFinanceiro` → `_updateUI` |

## Não alterado

Motor Comercial, Fiscal, Venda Oficial, Ledger, Adapter, Recovery, NFC-e, APIs públicas.

## Testes executados

- Jest (stab071 + stab066* + stab04 + fecharConsignacaoMappers + gradePrestacao + prestacaoContinuar): **9 suites / 75 testes OK**
- `npm run build:motor-comercial` — OK
- `npm run verify:motor-comercial` — VERIFY PASSED

## Resultado final

Critérios de aceite STAB-07.1 atendidos na camada operacional FE.
