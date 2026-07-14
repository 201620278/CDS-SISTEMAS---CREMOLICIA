# Central de Operações Comerciais — Motor Comercial

**Sprint O-3** — Cockpit Operacional

---

## Objetivo

Transformar a Central de Consignações na **Central de Operações Comerciais**, principal tela utilizada pelo operador durante todo o dia. Não é apenas uma tabela — é o cockpit do Motor Comercial.

---

## Princípio Arquitetural

```
Frontend
    ↓
API (GET /consignacoes)
    ↓
Projection Services
    ↓
Ledger
```

**Nenhuma regra comercial no Frontend.** Todas as informações vêm da API e Projection Services existentes.

---

## Estrutura

```
pages/Consignacoes/
├── index.js           # Cockpit operacional principal
├── CockpitDrawer.js   # Drawer com abas lazy-loaded
├── badges.js          # Badges operacionais padronizados
└── styles.css         # Estilos do cockpit
```

---

## Layout

Utiliza `DashboardLayout`:

```
Header (empresa, filial, operador, atualização)
    ↓
Sidebar (atalhos rápidos)
    ↓
Cards Operacionais (8 KPIs)
    ↓
Filtros Inteligentes
    ↓
Tabela Principal
    ↓
Paginação
    ↓
Drawer Operacional (abas)
    ↓
Rodapé
```

---

## Header

Exibe:
- **Título**: Central de Operações Comerciais
- **Empresa** e **Filial** (contexto operacional)
- **Operador** logado
- **Última atualização** (timestamp)
- **Atualizar** — refresh parcial sem reload
- **Nova Consignação** — navegação interna
- **Exportar** — CSV dos dados filtrados

---

## Cards Operacionais

Consumidos via `ProjectionApi.obterProjecaoDashboard()` com fallback em agregação client-side:

| Card | Fonte |
|------|-------|
| Consignações Abertas | Dashboard / contagem local |
| Entregues | Dashboard / contagem local |
| Prestação Aberta | Dashboard / flags operacionais |
| Prestação Atrasada | Dashboard / flags operacionais |
| Saldo em Aberto | Dashboard / soma de saldos |
| Clientes Ativos | Dashboard / clientes únicos |
| Valor Consignado | Dashboard / soma de valores |
| Recebimentos do Dia | Dashboard projection |

Atualização automática a cada 60 segundos.

---

## Filtros Inteligentes

- Empresa, Filial, Cliente, Consignado, Documento
- Situação (status)
- Prestação (Aberta / Fechada / Atrasada)
- Período (início e fim)
- Operador
- **Pesquisa global** com debounce 300ms (documento, cliente, consignado, produto, observação)
- Pesquisar, Limpar
- **Salvar filtro favorito** (localStorage)
- **Carregar filtro favorito** (choiceDialog)

---

## Tabela Principal

Colunas:
1. **Indicador Visual** — urgência/atraso/prestação aberta
2. **Documento**
3. **Cliente**
4. **Consignado**
5. **Status** — badge operacional
6. **Prestação** — ABERTA / FECHADA / -
7. **Valor**
8. **Saldo**
9. **Entrega**
10. **Última Movimentação**
11. **Operador**
12. **Ações**

Paginação client-side (API não expõe paginação servidor). Preparado para virtualização (`cds-consignacoes-table--virtual-ready`).

---

## Badges Operacionais

| Status | Variant |
|--------|---------|
| RASCUNHO | default |
| ENTREGUE | info |
| PRESTAÇÃO ABERTA | warning |
| ACERTADA | success |
| ENCERRADA | primary |
| CANCELADA | error |
| ATRASADA | error |
| URGENTE | error |

---

## Action Menu

- Visualizar, Editar, Entregar, Prestação
- Perfil Comercial, Conta Corrente, Timeline
- Duplicar, Cancelar, Imprimir

---

## Drawer Operacional

Abas com lazy-load e cache por aba:

| Aba | Conteúdo |
|-----|----------|
| Resumo | Cliente, perfil, documento, datas, valores, limite, saldo, situação, operador |
| Itens | Lista de produtos da consignação |
| Timeline | Timeline oficial via Projection |
| Movimentações | Ledger com filtro local |
| Prestação | Resumo financeiro + atalho |
| Financeiro | Conta corrente via Projection |
| Perfil Comercial | Score, limite, histórico |
| Indicadores | Conversão, perdas, cortesias, ticket médio, recebimento |
| Auditoria | Usuário, data, operação, correlationId, requestId |

Requisições paralelas no bundle inicial do drawer (`Promise.all`).

---

## Atalhos (Sidebar)

- Nova Consignação
- Nova Prestação
- Entregar
- Abrir Perfil
- Conta Corrente
- Dashboard

---

## Refresh Automático

- Intervalo: 60 segundos
- Atualiza: cards, tabela, drawer aberto
- Sem reload da página
- Timer limpo ao sair da tela

---

## UX

- Nunca `alert()`, `confirm()`, `prompt()` — Design System (`confirmDialog`, `promptDialog`, `choiceDialog`, `notify`)
- Nunca nova janela — navegação via `navigate()`
- Drawer lateral para detalhes

---

## Performance

- Paginação client-side com cache local (`allConsignacoes`)
- Lazy drawer (dados por aba)
- Requisições paralelas (dashboard + lista + resumos)
- Refresh parcial (silent mode)
- Virtualização preparada

---

## Responsividade

- **Desktop**: 4 colunas de cards, sidebar visível
- **Notebook**: 2 colunas de cards
- **Tablet**: layout empilhado, filtros em coluna única

---

## API Endpoints

```
GET /api/comercial/consignacoes
GET /api/comercial/projections/dashboard
GET /api/comercial/projections/timeline
GET /api/comercial/projections/resumo-prestacao
GET /api/comercial/projections/historico
GET /api/comercial/projections/conta-corrente
GET /api/comercial/projections/indicadores
GET /api/comercial/projections/situacao-cliente
GET /api/comercial/perfil-comercial/:id
```

---

## Critérios de Aceitação (O-3)

✅ Central como principal tela operacional  
✅ Cards funcionando via Projection  
✅ Drawer enriquecido com 9 abas  
✅ Timeline completa  
✅ Financeiro integrado via Projection  
✅ Perfil Comercial integrado  
✅ Indicadores funcionando  
✅ Pesquisa dinâmica com debounce  
✅ Atualização automática  
✅ UX refinada (sem alert/confirm/prompt)  
✅ Atalhos operacionais  
✅ Filtros favoritos  
✅ Exportação CSV  

---

## Fluxo Operacional

```
1. Operador abre Central de Operações
2. Cards mostram panorama do dia
3. Filtros/pesquisa refinam a tabela
4. Clique na linha → Drawer com abas
5. Ações rápidas via menu ou sidebar
6. Entrega/Prestação via navegação interna
7. Refresh automático mantém dados atualizados
```

---

## Referência

Esta página é o cockpit operacional do Motor Comercial. Padrões estabelecidos aqui devem ser seguidos em todas as telas de consulta operacional.
