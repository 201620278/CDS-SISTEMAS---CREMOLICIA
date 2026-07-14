# Dashboard Executivo — Motor Comercial

**Sprint O-4** — Centro de Inteligência Comercial

---

## Objetivo

Transformar o Dashboard Comercial em um **painel executivo** que responde: *"O que exige minha atenção hoje?"*

Cockpit do gestor — não apenas indicadores, mas alertas, insights, rankings e pendências.

---

## Princípio Arquitetural

```
Frontend
    ↓
Projection Services + Insight Engine (via API)
    ↓
Ledger
```

**Proibido:** cálculos de negócio, somatórios ou regras no Frontend.

---

## Estrutura

```
pages/Dashboard/
├── index.js              # Dashboard executivo principal
├── dashboardMappers.js   # Mapeamento de campos da API (sem cálculo)
├── ExecutiveDrawer.js    # Drawer de detalhe de KPI
└── styles.css            # Estilos executivos
```

---

## Layout

```
Header Executivo
    ↓
Sidebar (navegação)
    ↓
Filtros
    ↓
Cards Estratégicos (14 KPIs com tendência)
    ↓
Alertas
    ↓
Top 10 Insights (Crítico / Alto / Médio / Baixo)
    ↓
Indicadores Operacionais
    ↓
Gráficos (7 séries)
    ↓
Timeline (últimas operações)
    ↓
Rankings (8 categorias)
    ↓
Pendências
    ↓
Rodapé
```

---

## Header Executivo

- Empresa, Filial, Período, Operador
- Última atualização
- **Atualizar** — refresh manual
- **PDF** — impressão do navegador
- **Excel** — exportação TSV
- **CSV** — exportação CSV
- **Compartilhar** — copia link

---

## Cards Estratégicos

Consumidos via `GET /projections/dashboard` + `GET /projections/indicadores`.

Campos mapeados diretamente da API (sem cálculo local):

| Card | Fonte API |
|------|-----------|
| Recebimentos do Dia | `recebimentosDia` / `valorRecebidoDia` |
| Saldo Consignado | `saldoConsignado` / `valorConsignado` |
| Saldo em Aberto | `saldoEmAberto` |
| Prestação Aberta | `prestacaoAberta` |
| Prestação Atrasada | `prestacaoAtrasada` |
| Clientes Ativos | `clientesAtivos` |
| Ticket Médio | `ticketMedio` |
| Conversão | `percentualConversao` |
| Perdas | `valorPerdido` |
| Cortesias | `valorCortesia` |
| Recebimentos | `valorRecebido` |
| Receber Hoje/Semana/Mês | campos homônimos da API |

**Tendências:** `tendencias[chave]` ou `card.tendencia` da API (▲ ▼ =).

Clique no card → **ExecutiveDrawer** com origem, timeline e links.

---

## Alertas

Fonte: `dashboard.alertas` (Projection Service).

Cada alerta exibe:
- Severidade e Prioridade
- Mensagem
- Ação recomendada
- Link rápido (quando disponível na API)

---

## Insights (Shared Insight Engine)

Fonte: `GET /projections/insights` + alertas do dashboard.

- Top 10 insights
- Agrupados: Crítico, Alto, Médio, Baixo
- Ações: **Resolver**, **Ignorar**, **Detalhe**
- Estado persistido em `localStorage` (sem alterar backend)

---

## Indicadores

Fonte: `GET /projections/indicadores`.

- Conversão, Perdas, Recebimento
- Prazo médio, Ticket médio
- Tempo médio de prestação e entrega

Valores exibidos como retornados pela API (`-` quando ausente).

---

## Gráficos

Fonte: `indicadores.graficos` ou `dashboard.graficos`.

Séries:
1. Consignações por período
2. Recebimentos
3. Prestação
4. Perdas
5. Conversão
6. Clientes ativos
7. Evolução diária

Barras usam `item.percentual` da API (sem normalização local).

---

## Rankings

Fonte: `dashboard.rankings` ou `indicadores.rankings`.

- Top Clientes, Consignados, Produtos, Operadores
- Maior Conversão, Perda, Recebimento, Ticket

EmptyState quando projeção não disponível.

---

## Pendências

Fonte: `dashboard.pendencias` ou alertas tipados:
- Prestação atrasada
- Entrega pendente
- Consignação parada
- Cliente bloqueado
- Limite excedido

---

## Timeline

Fonte: `GET /projections/timeline` (componente oficial `Timeline`).

---

## Drawer de KPI

Ao clicar em qualquer card:
- Origem dos dados (Projection Service)
- Timeline relacionada
- Indicadores do período
- Links: Central Operacional, Indicadores

---

## Filtros

- Empresa, Filial, Operador, Cliente ID
- Período (hoje, semana, mês, trimestre, ano)
- Situação, Categoria

Parâmetros repassados à API: `dataInicio`, `dataFim`, `clienteId`, `limite`.

---

## Refresh

- Automático: 60 segundos
- Manual: botão Atualizar
- Atualização parcial sem reload

---

## Exportação

| Formato | Implementação |
|---------|---------------|
| CSV | Download dos cards |
| Excel | TSV com BOM |
| PDF | `window.print()` com CSS `@media print` |

---

## API Endpoints

```
GET /api/comercial/projections/dashboard
GET /api/comercial/projections/indicadores
GET /api/comercial/projections/insights
GET /api/comercial/projections/timeline
GET /api/comercial/projections/historico
```

---

## Performance

- Requisições paralelas (`Promise.all`)
- Lazy sections com loading independente
- Cache em memória (`this.payload`, `this.view`)
- Refresh silencioso em background

---

## Responsividade

- **Desktop:** 4 colunas de cards e rankings
- **Notebook:** 2 colunas
- **Tablet:** 1 coluna, sidebar oculta

---

## Critérios de Aceitação (O-4)

✅ Dashboard totalmente executivo  
✅ Projection Services consumidos  
✅ Insight Engine integrada via `/projections/insights`  
✅ Alertas funcionando  
✅ Insights com resolver/ignorar  
✅ Rankings e pendências (quando API fornece)  
✅ Drawer operacional em KPIs  
✅ Atualização automática 60s  
✅ Exportação PDF/Excel/CSV  
✅ Nenhum cálculo de negócio no Frontend  

---

## Resultado Esperado

O gestor abre o Dashboard e identifica imediatamente:
- O que está acontecendo
- O que precisa de atenção
- Onde estão os riscos
- Onde estão as oportunidades

Centro de Inteligência Comercial da Plataforma CDS.
