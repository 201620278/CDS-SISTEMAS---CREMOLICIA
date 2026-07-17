# Matriz de Paridade ERP Desktop × CDS Mobile

**Versão Mobile:** 2.1.0-rc2.1 (RC2.1 Fluxos)  
**Legenda:** ✔ Implementado · ⚠ Parcial · ✖ Pendente  

> Matriz por fluxo (fonte de verdade RC2.1+): [FLOW_PARITY_MATRIX.md](./FLOW_PARITY_MATRIX.md)

## Visão geral

| Módulo ERP | Mobile | Nota |
|------------|--------|------|
| Dashboard | ✔ | KPIs consulta |
| Clientes | ✔ | CRUD + nativos; foto local ⚠ |
| Fornecedores | ✔ | CRUD + produtos relacionados ⚠ |
| Produtos (cadastro) | ✔ | CRUD + EAN/câmera; foto local ⚠ |
| Categorias | ✖ | |
| Usuários | ✔ | CRUD |
| Comercial (Motor) | ✔ | Fluxo consignação RC2.3.2 — paridade LIP |
| Compras | ✖ | |
| Central Entradas NF | ✖ | |
| Estoque | ✔ | Motor ajuste; transferência ⚠ |
| Transferência estoque | ⚠ | Sem API dedicada |
| Caixa (fechamento) | ✔ | PDV Mobile |
| Gerenciar Caixas | ✖ | ERP Desktop |
| Terminais | ✖ | Gestão no ERP; registro no Mobile |
| PDV / Vendas | ✔ | Fluxo venda + share DANFE/XML |
| TEF pinpad | ⚠ | |
| Financeiro | ✔ | Baixas / fluxo / histórico |
| Fiscal (emissão) | ✔ | Emit/cancel/DANFE/share |
| Relatórios densos | ⚠ | |
| Configurações | ⚠ | Sync + diagnóstico; edição avançada ✖ |

## Paridade operacional estimada

| Escopo | % |
|--------|---|
| Após Onda 1 (RC2.0) | ~58–62% |
| Após RC2.1 (fluxos) | **~72–76%** |
| Meta RC2 completa | ~90%+ (exceto limites físicos) |
