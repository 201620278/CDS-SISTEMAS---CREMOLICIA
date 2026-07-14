# AUDITORIA_STAB06.md

**Sprint:** STAB-06  
**Data:** 2026-07-13  
**Tema:** Unificação da venda da consignação com o núcleo transacional do PDV

## O que foi feito

| Entrega | Path |
|---------|------|
| Adapter temporário | `backend/services/vendas/adapters/PrestacaoVendaAdapter.js` |
| Ponte interna | `backend/services/vendas/criarVendaInterna.js` |
| Orquestração | `FinalizarPrestacaoComVendaOficialUseCase.js` |
| Rotas | `POST .../prestacao/finalizar-venda-oficial`, `GET .../prestacao/resumo-final` |
| Hooks mínimos em `criarVenda` | `politicaEstoque JA_BAIXADO_CONSIGNACAO` + financeiro Integridade Comercial |
| Resumo Final UI | `FecharConsignacaoView` + `buildResumoFinalOficial` |
| Vínculo origem | tabela `venda_origem_consignacao` |
| ADR | `ADR-VENDAS-001.md` |

## O que NÃO foi alterado

- Arquitetura profunda do PDV / `VendaApplicationService` (não criado)
- Motor Fiscal interno (`emissor.js` contratos)
- Infra Outbox / Ledger schema / Recovery / STAB-03 / STAB-04
- UI de pagamento TEF do PDV

## Comportamento

1. Grade continua registrando `VENDA_PRESTACAO` no **ledger comercial** (saldo consignado).
2. **Não** enfileira mais `FinanceiroLancarReceita` / pagamento financeiro espelhado na grade (evita venda paralela no `financeiro`).
3. Ao confirmar Resumo Final → `PrestacaoVendaAdapter` → `criarVendaInterna` → mesmo fluxo SQL/fiscal do PDV.
4. Estoque loja **não** é rebaixado (`JA_BAIXADO_CONSIGNACAO`).
5. Pagamento parcial: NFC-e/total da venda = valor integral; `contas_receber` + financeiro pendente = saldo.

## Integridade Comercial

`Valor da Venda = Valor Recebido + Saldo em Aberto` — validado no adapter e refletido no Resumo Final.

## Evidências de teste

- `tests/stab06/prestacao-venda-adapter.test.js` (cenários 1–4)
- Ajuste `tests/motor-comercial/outbox-pattern.test.js` (grade sem bridge financeira)

## Riscos residuais

- `criarVenda` ainda é Express-oriented (ponte via `criarVendaInterna`); extração total do ApplicationService fica para sprint futura.
- DANFE administrativo pós-SEFAZ (bloco consignação) não tipografado nesta sprint — metadata disponível em `venda_origem_consignacao`.
