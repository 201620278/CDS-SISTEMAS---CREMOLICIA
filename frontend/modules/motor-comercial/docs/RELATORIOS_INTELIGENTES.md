# Central de Inteligência Analítica — Relatórios Inteligentes

**Sprint O-7** — Hub Analítico do Motor Comercial

---

## Objetivo

Transformar o módulo de Relatórios em uma **Central de Inteligência Analítica** — um centro de decisão, não um menu de impressão.

O gestor analisa o negócio sob diferentes perspectivas utilizando exclusivamente **Projection Services** e **Shared Insight Engine**.

---

## Princípio Arquitetural

```
Frontend (Hub Analítico)
    ↓
Projection Services + Insight Engine
    ↓
Ledger / Projeções Comerciais
```

**Proibido:** cálculos de negócio, regras financeiras ou persistência de saldos no Frontend.

---

## Estrutura

```
pages/Relatorios/
├── index.js              # Central de Inteligência Analítica
├── relatorioMappers.js   # Catálogo, mapeamentos, favoritos, histórico
├── IndicadorDrawer.js    # Drawer de detalhe analítico
└── styles.css

pages/Indicadores/
└── index.js              # Wrapper → Relatórios (grupo Executivos)
```

---

## Rotas

| Rota | Descrição |
|------|-----------|
| `/relatorios` | Central de Inteligência Analítica |
| `/relatorios?relatorio=kpis&periodo=month` | Relatório específico |
| `/indicadores` | Atalho para grupo Executivos |
| ERP `comercial-relatorios` | `/relatorios` |

---

## Layout

```
Header Executivo (exportar, agendar, compartilhar)
    ↓
Sidebar (navegação)
    ↓
Catálogo de Relatórios (4 grupos)
    ↓
Filtros Globais
    ↓
Área de Visualização (dinâmica por relatório)
    ↓
Indicadores
    ↓
Insights (Shared Insight Engine)
    ↓
Rankings
    ↓
Comparativos
    ↓
Favoritos
    ↓
Histórico de Execuções
```

---

## Catálogo de Relatórios

### Operacionais
Consignações, Prestação, Entregas, Movimentações, Conta Corrente

### Comerciais
Clientes, Produtos, Operadores, Performance, Conversão

### Financeiros
Recebimentos, Perdas, Cortesias, Saldo, Limite

### Executivos
KPIs, Rankings, Comparativos, Indicadores, Insights

---

## Tipos de Visualização

| Tipo | Uso |
|------|-----|
| Tabela | Movimentações, consignações, insights |
| Cards | KPIs, saldos, conta corrente |
| Gráfico | Séries temporais (recebimentos, perdas, conversão) |
| Timeline | Entregas e eventos |
| Mapa de calor | Comparativos |
| Ranking | Top clientes, produtos, operadores |
| Indicadores | Performance e métricas |

---

## Filtros Globais

Empresa, Filial, Cliente, Produto, Consignação, Operador, Situação, Período, Tipo, Categoria, Pesquisa dinâmica.

Favoritos salvos em `localStorage`. Histórico de execuções registrado localmente.

---

## Projection Services Utilizados

```
GET /projections/dashboard
GET /projections/indicadores
GET /projections/insights
GET /projections/timeline
GET /projections/historico
GET /projections/saldos
GET /projections/conta-corrente
GET /projections/situacao-cliente
GET /projections/resumo-prestacao
```

Cada relatório do catálogo declara quais projeções consome. Execução paralela via `Promise.all`.

---

## Insight Engine

Grupos exibidos:
- Alertas
- Riscos
- Oportunidades
- Tendências
- Anomalias
- Recomendações

Fonte: `GET /projections/insights` + alertas do dashboard.

---

## Rankings

Top Clientes, Top Produtos, Top Operadores, Maior Conversão, Maior Recebimento, Maior Perda, Maior Ticket.

Dados de `dashboard.rankings` / `indicadores.rankings` — sem cálculo no Frontend.

---

## Comparativos

Hoje × Ontem, Semana × Semana, Mês × Mês, Ano × Ano, Filial × Filial, Operador × Operador, Cliente × Cliente.

Fonte: `dashboard.comparativos` / `indicadores.comparativos` / `tendencias`.

---

## Exportação

PDF (impressão), Excel (TSV), CSV — dados da visualização ativa.

Compartilhamento via link com query params.

---

## Agendamento

Arquitetura preparada para envio automático (Email, WhatsApp, Portal). UI informativa — implementação futura.

---

## Favoritos e Histórico

| Recurso | Storage Key |
|---------|-------------|
| Favoritos (relatórios + filtros) | `motor-comercial:relatorios-favoritos` |
| Layouts | `motor-comercial:relatorios-layouts` |
| Histórico de execuções | `motor-comercial:relatorios-historico` |

---

## Drawer Analítico

Ao clicar em indicador, linha ou célula comparativa:
- Origem (Projection Service)
- Dados do item
- Insights relacionados
- Timeline
- Links: Dashboard, Central Operacional, Conta Corrente

---

## Refresh

Automático: 60 segundos | Manual: botão Atualizar | Atualização parcial sem reload.

---

## Performance

- Requisições paralelas por relatório
- Cache em memória (`payload`, `view`)
- Paginação client-side (preparada para servidor)
- Lazy loading do drawer

---

## Fluxo de Execução

```
1. Gestor seleciona relatório no catálogo
2. Filtros globais aplicados
3. Projection Services consultados em paralelo
4. Visualização renderizada (sem cálculo)
5. Insights e rankings complementares exibidos
6. Exportação / favoritos / histórico
7. Clique → Drawer com detalhes e links
```

---

## Critérios de Aceitação (O-7)

✅ Catálogo funcionando  
✅ Relatórios consumindo Projection Services  
✅ Nenhum cálculo no Frontend  
✅ Insight Engine integrada  
✅ Rankings funcionando  
✅ Comparativos funcionando  
✅ Exportações funcionando  
✅ Favoritos funcionando  
✅ Histórico funcionando  
✅ Documentação atualizada  

---

## Referência

Esta Central será o padrão para futuros módulos analíticos do CDS Sistemas.
