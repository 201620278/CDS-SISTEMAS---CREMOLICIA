# AUDITORIA — STAB-07.5 Redesign oficial "Registrar Retornos"

**Data:** 2026-07-14  
**Escopo:** Frontend Prestação de Contas — tela Registrar Retornos (UX/UI)  
**Status:** Implementado

## Objetivo

Substituir cards de produto por **grade operacional profissional** com busca, filtros, colunas, paginação e sidebar financeira fixa — adequada a prestações com 50–100+ itens. Sem alterar regras de negócio.

## Arquivos alterados

- `frontend/modules/motor-comercial/pages/PrestacaoContas/FecharConsignacaoView.js`
- `frontend/modules/motor-comercial/pages/PrestacaoContas/index.js` (estado UI `retornosUi` + refresh parcial)
- `frontend/modules/motor-comercial/pages/PrestacaoContas/styles.css`
- `scripts/verify-motor-comercial.js` (markers)
- Testes: `stab075GradeOperacional.test.js`, ajuste `stab074RedesignOficial.test.js`

## Interface

| Área | Mudança |
|------|---------|
| Cards de produto | Removidos |
| Grade | Tabela CDS (`cds-table`) — 1 linha por produto |
| Toolbar | Busca em tempo real · Filtros · Colunas |
| Paginação | 10 / 20 / 50 / 100 + páginas |
| Resumo Rápido | Mantido (mesmos cálculos/layout) |
| Sidebar 340px | Resumo Financeiro + Resumo por natureza (sticky) |
| Rodapé | Voltar + Continuar para o fechamento (comportamento intacto) |

## Preservado (não alterado)

Selectors/legado da grade: `#fechar-retornos-grade`, `data-row-index`, `LINHA_RETORNO_SELECTOR` — dirty / blur / patch / autosave / flush permanecem.

Não houve alteração em: Motor Comercial, Ledger, Snapshot SSOT, Venda Oficial, Fiscal, APIs, DB, DTOs, UseCases, Repositories, Persistência.

## Validação

- Jest `stab07*`: **5 suites / 22 testes OK**
- `npm run build:motor-comercial` — OK
- `npm run verify:motor-comercial` — **VERIFY PASSED**

## Critério de aceite

- Cards removidos; grade profissional 1 linha/produto
- Nome real do produto; busca; filtros; paginação
- Sidebar financeira sticky; totais em tempo real (preview UI)
- Sem alteração de regra de negócio / persistência / APIs
- Fiel ao mockup aprovado
