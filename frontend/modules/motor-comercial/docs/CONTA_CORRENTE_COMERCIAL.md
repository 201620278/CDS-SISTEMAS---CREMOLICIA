# Conta Corrente Comercial — Extrato Operacional

**UX-11** — Extrato bancário moderno sobre Shared UI Workspace  
**Sprint O-6** (dados / projeções) — mantido

**Referência oficial:** primeira tela de produção da Plataforma CDS construída sobre `frontend/shared/ui/Workspace`.

---

## Objetivo

Transformar a Conta Corrente Comercial em um **extrato operacional** que responde em ≤ 5 s: *quem é o cliente, quanto deve, histórico, Receber*.

Toda informação financeira continua reconstruída exclusivamente a partir do **Ledger** via **Projection Services**. Nenhum saldo é calculado ou persistido no Frontend.

---

## Princípio Arquitetural

```
Frontend (Workspace Shared UI)
    ↓
Projection Services
    ↓
Ledger Comercial + Ledger Perfil Comercial
```

**Proibido:** cálculo financeiro, somatórios ou persistência de saldo no Frontend.  
**Proibido (UX):** shell próprio / DashboardLayout nesta tela — usar apenas Workspace.

---

## Estrutura

```
pages/ContaCorrente/
├── index.js              # Extrato no Workspace (UX-11)
├── extratoMappers.js     # Mapeamento API → view (sem cálculo)
├── MovimentoDrawer.js    # Drawer de detalhe da movimentação
├── styles.js             # CSS injetável da página
└── styles.css            # Espelho documental
```

---

## Rotas

| Rota | Contexto |
|------|----------|
| `/conta-corrente?clienteId=` | Extrato do cliente |
| `/consignacoes/:id/prestacao/conta-corrente` | Extrato da consignação |
| ERP `comercial-conta-corrente` | `/conta-corrente` |

---

## Layout (UX-11)

```
Workspace (station)
├── Header fixo
│   Cliente · Documento · Período · Saldo atual · Status
│   Ação secundária: Atualizar
├── Body (único scroll)
│   Toolbar compacta (busca · período · tipo)
│   Extrato: Data · Tipo · Descrição · Valor · Saldo
│   Análise (recolhida): KPIs · Timeline · Indicadores · Gráficos · Alertas · Pendências
└── Footer fixo
    [ Voltar ]  [ n lançamentos ]     [ Exportar ] [ Receber ]
```

**Removido do viewport padrão:** sidebar, muro de 11 cards, gráficos, KPIs, timeline gerencial.

---

## Resumo Financeiro

Fonte: `ContaCorrenteProjectionService` + `SaldoProjectionService` + `SituacaoCliente`.

Exibido no **header** (saldo atual) e, sob demanda, na seção **Análise** (cards completos).

| Campo | Origem API |
|-------|------------|
| Saldo Inicial | `saldoInicial` |
| Entradas | `entradas` / `vendas` |
| Saídas | `saidas` |
| Recebimentos | `pagamentos` |
| Perdas | `perdas` |
| Cortesias | `cortesias` |
| Devoluções | `devolucoes` / `saldoDevolvido` |
| Saldo Atual | `saldoAtual` / `saldoEmAberto` |
| Limite Comercial/Utilizado/Disponível | situação + saldos |

---

## Extrato Cronológico

Colunas no viewport operacional:

- Data, Tipo, Descrição, Valor, Saldo

Detalhe completo (documento, operador, correlation, ledger bruto) permanece no **drawer** ao clicar na linha.

Prioridade de fonte:
1. `conta-corrente.lancamentos` (quando `consignacaoId`)
2. `historico.movimentacoes` (ledger unificado)

---

## Tipos de Movimentação

Catálogo oficial (`comercialTiposMovimentacao`):

ENTREGA, VENDA, DEVOLUÇÃO, PERDA, CORTESIA, PAGAMENTO, ABERTURA_PRESTAÇÃO, FECHAMENTO_PRESTAÇÃO, TRANSFERÊNCIA, LIBERAÇÃO_GERENCIAL, ALTERAÇÃO_LIMITE

Badges visuais por tipo no extrato.

---

## Drawer de Movimentação

Ao clicar em linha do extrato:

- Dados da movimentação
- Ledger bruto (JSON)
- Timeline relacionada
- Links: Consignação, Conta Corrente, Central 360°

---

## Filtros

Viewport: Período, Tipo, Pesquisa global (debounce 300ms).  
Filtros aplicados client-side sobre dados já carregados do Ledger.

---

## Projection Services Utilizados

```
GET /projections/conta-corrente?consignacaoId=&dataInicio=&dataFim=
GET /projections/historico?clienteId=&consignacaoId=&limite=
GET /projections/saldos?clienteId=&consignacaoId=
GET /projections/indicadores?clienteId=&dataInicio=&dataFim=
GET /projections/dashboard?clienteId=
GET /projections/insights?clienteId=
GET /projections/timeline?clienteId=&consignacaoId=
GET /projections/situacao-cliente?clienteId=
```

---

## Alertas e Insights

Disponíveis na seção **Análise** (não no primeiro viewport):

- `dashboard.alertas`
- `situacao.alertas`
- `insights` (Insight Engine via `/projections/insights`)

---

## Exportação

Footer → Exportar: PDF, Excel, CSV, Imprimir — dados do extrato filtrado.

---

## Refresh

Automático: 60 segundos | Manual: Atualizar (header)

---

## Performance

- Requisições paralelas (`Promise.all`)
- Paginação client-side (preparada para servidor via `limite`/`offset`)
- Cache em memória (`payload`, `view`)
- Refresh parcial sem reload
- Análise renderizada sob demanda (lazy ao abrir `<details>`)

---

## Fluxo Financeiro

```
1. Usuário acessa extrato (cliente ou consignação)
2. Projection Services consultam Ledger
3. Header mostra cliente + saldo atual
4. Extrato cronológico renderizado
5. Filtros refinam visualização (sem recalcular saldos)
6. Clique → Drawer com ledger bruto e links
7. Receber / Exportação
```

---

## Critérios de Aceitação

### O-6 (dados)
✅ Extrato operacional funcionando  
✅ Dados derivados exclusivamente do Ledger  
✅ Nenhum cálculo financeiro no Frontend  
✅ Drawer operacional  
✅ Exportação PDF/Excel/CSV  
✅ Refresh automático 60s  

### UX-11 (shell)
✅ Workspace Shared UI (Header / Body / Footer)  
✅ Header e footer fixos; scroll só no body  
✅ Viewport sem gráficos/KPIs  
✅ Análise fora do default  
✅ Sem DashboardLayout / sidebar operacional  

---

## Referência

Esta implementação é o **modelo de migração** para futuras estações do Motor Comercial e demais motores da Plataforma CDS.
