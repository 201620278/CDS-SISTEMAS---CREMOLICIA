# AUDITORIA — STAB-07.4 Redesign oficial da Prestação de Contas

**Data:** 2026-07-14  
**Escopo:** Frontend Prestação de Contas (UX/UI)  
**Status:** Implementado

## Objetivo

Aplicar o layout oficial aprovado: cards em Registrar Retornos e Estação Operacional em duas colunas limpas — baixa carga cognitiva, sem alterar fluxo ou regras.

## Arquivos alterados

- `frontend/modules/motor-comercial/pages/PrestacaoContas/FecharConsignacaoView.js`
- `frontend/modules/motor-comercial/pages/PrestacaoContas/index.js`
- `frontend/modules/motor-comercial/pages/PrestacaoContas/styles.css`
- `frontend/modules/motor-comercial/pages/PrestacaoContas/fecharConsignacaoMappers.js` (ordem visual + export operador)
- `frontend/modules/motor-comercial/pages/PrestacaoContas/prestacaoFinanceiroSnapshot.js` (observação no histórico FE)
- Testes: `stab074RedesignOficial.test.js`, ajuste `stab073EstacaoOperacional.test.js`

## Tela 1 — Registrar Retornos

- Grade/planilha substituída por **cards de produto**
- Campos: nome, qtd entregue, vendido, devolvido, perda, cortesia, observação (+ saldo utilitário)
- **Resumo Rápido** ao final (Vendidos / Devolvidos / Perdas / Saldo)
- Botão **Continuar para Fechamento**
- Selectors legados da grade (`#fechar-retornos-grade`, `data-row-index`) preservados para patch/rascunho

## Tela 2 — Estação Operacional

| Esquerda | Direita |
|----------|---------|
| Resumo Financeiro | Situação Fiscal |
| Pagamento (form + Registrar + Histórico sob demanda) | Informações da Prestação |

**Removido da UI:** Timeline, Log Operacional, histórico aberto.

**Modal Histórico:** Forma · Valor · Data/Hora · Operador · Observação · Fechar

## Rodapé (Resumo)

Voltar `ghost` · Registrar Pagamento `secondary` · Emitir NFC-e `primary` · Encerrar Prestação `success`

## Não alterado

Motor Comercial, Ledger, Venda Oficial, Motor Fiscal, Financeiro, NFC-e, APIs, fluxo operacional.

## Validação

- Jest `stab07*`: **4 suites / 18 testes OK**
- Jest `fecharConsignacaoMappers`: **20 testes OK**
- `npm run build:motor-comercial` — OK
- `npm run verify:motor-comercial` — **VERIFY PASSED**
  - Markers: `cds-retornos-card`, `abrirModalHistoricoPagamentos`

## Critério de aceite

- Sensação de ERP moderno / operação simples
- Sem planilha na tela de retornos
- Estação em 2 colunas sem Timeline/Log/histórico aberto
- Sem alteração de regra de negócio, APIs ou fluxo
