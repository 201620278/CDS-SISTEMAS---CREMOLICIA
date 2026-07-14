# Central de Pendências e Alertas — Sprint O-8

Documento oficial da **Central de Pendências e Alertas Inteligentes** do Motor Comercial (ERP Proativo).

---

## Objetivo

Transformar o Motor Comercial em um ERP Proativo: identificar automaticamente situações que exigem atenção e orientar ações — sem que o usuário precise procurá-las.

---

## Arquitetura

```
Projection Services (Dashboard, Indicadores, Saldos, Situação Cliente)
        ↓
Shared Insight Engine (regras comerciais IInsightRule)
        ↓
PendenciasProjectionService (agregação e normalização)
        ↓
GET /api/comercial/projections/pendencias
        ↓
Central de Pendências (Frontend — apenas mapeamento)
```

### Componentes Backend

| Componente | Caminho |
|------------|---------|
| Regras de Insight | `backend/motores/motor-comercial/insights/ComercialInsightRules.js` |
| Insight Service | `backend/motores/motor-comercial/insights/index.js` |
| Insights Projection | `backend/motores/motor-comercial/services/projections/InsightsProjectionService.js` |
| Pendências Projection | `backend/motores/motor-comercial/services/projections/PendenciasProjectionService.js` |
| DTO | `backend/motores/motor-comercial/dto/PendenciasDTO.js` |
| Controller | `GET /projections/pendencias`, `GET /projections/insights` |

### Componentes Frontend

| Componente | Caminho |
|------------|---------|
| Página principal | `frontend/modules/motor-comercial/pages/Pendencias/index.js` |
| Mapeadores | `frontend/modules/motor-comercial/pages/Pendencias/pendenciasMappers.js` |
| Drawer | `frontend/modules/motor-comercial/pages/Pendencias/PendenciasDrawer.js` |
| API Client | `ProjectionApi.obterProjecaoPendencias()` |
| Notificações (prep.) | `frontend/modules/motor-comercial/contexts/NotificationContext.js` |

---

## Fluxo dos Alertas

1. **Consulta paralela**: `PendenciasProjectionService` executa `DashboardProjectionService` e `InsightsProjectionService` em paralelo.
2. **Insight Engine**: regras registradas leem projeções existentes (saldo, perdas, conversão, consignações, perfis bloqueados).
3. **Normalização**: alertas do dashboard e insights são unificados com campos padronizados (categoria, severidade, prioridade, ação recomendada, links).
4. **Classificação**: faixas `criticas`, `importantes`, `informativas` conforme severidade/prioridade.
5. **Próximas ações**: top 10 ordenado por score de prioridade (backend).
6. **Frontend**: aplica estado local (resolvido, ignorado, adiado, delegado) via `localStorage` — sem recalcular regras.

---

## Integração com Insight Engine

Regras implementadas (`ComercialInsightRules.js`):

| Código | Categoria | Origem |
|--------|-----------|--------|
| `SALDO_EM_ABERTO` | FINANCEIRO | Dashboard / Saldos |
| `PERDA_ELEVADA` | INTELIGENCIA | Indicadores |
| `CONVERSAO_BAIXA` | INTELIGENCIA | Indicadores |
| `CORTESIAS_ELEVADAS` | INTELIGENCIA | Saldos |
| `CLIENTE_BLOQUEADO` | COMERCIAL | Perfil Comercial |
| `PRESTACAO_ATRASADA` | COMERCIAL | Consignações |
| `ENTREGA_PENDENTE` | OPERACIONAL | Consignações |
| `PRESTACAO_ABERTA` | OPERACIONAL | Consignações |
| `LIMITE_COMPROMETIDO` | FINANCEIRO | Situação Cliente |

Endpoint de insights: `GET /api/comercial/projections/insights` agora executa `InsightsProjectionService` (não mais indicadores crus).

---

## Critérios de Priorização

Score backend (`PendenciasProjectionService.scorePrioridade`):

- Severidade: CRITICAL=4, HIGH=3, MEDIUM=2, LOW/INFO=0-1
- Prioridade: URGENT +5, HIGH +3, demais +1
- Ordenação decrescente para **Próximas Ações**

Faixas:

- **Críticas**: severidade CRITICAL ou prioridade URGENT
- **Importantes**: severidade HIGH ou prioridade HIGH
- **Informativas**: demais

---

## Estados (Frontend)

Persistidos em `localStorage` (sem tabelas):

| Estado | Chave | Ação |
|--------|-------|------|
| Resolvido | `motor-comercial:pendencias-resolvidas` | Remove da lista + histórico |
| Ignorado | `motor-comercial:pendencias-ignoradas` | Remove da lista |
| Adiado | `motor-comercial:pendencias-adiadas` | Oculta até data |
| Delegado | `motor-comercial:pendencias-delegadas` | Metadado |
| Favorito | `motor-comercial:pendencias-favoritos` | Filtro |
| Histórico | `motor-comercial:pendencias-historico` | Auditoria local |
| Observação | `motor-comercial:pendencias-observacoes` | Por alerta |

---

## Integrações

| Hub | Integração |
|-----|------------|
| **Dashboard** | Card "Pendências Críticas" → `/pendencias`; badge global |
| **Central Operacional** | Coluna Pendências com contador por consignação |
| **Cliente 360°** | Painel Alertas Ativos / Pendências Abertas / Última Resolução |
| **Menu ERP** | Item Pendências + badge `#comercial-pendencias-badge` |

---

## API

### GET `/api/comercial/projections/pendencias`

Query: `clienteId`, `consignacaoId`, `dataInicio`, `dataFim`

Resposta:

```json
{
  "resumo": { "total", "criticos", "altos", "medios", "baixos", "pendentes" },
  "criticas": [],
  "importantes": [],
  "informativas": [],
  "alertas": [],
  "proximasAcoes": [],
  "categorias": { "FINANCEIRO": [], "COMERCIAL": [], "OPERACIONAL": [], "INTELIGENCIA": [] }
}
```

Cada alerta inclui: `id`, `categoria`, `severidade`, `prioridade`, `cliente`, `documento`, `descricao`, `motivo`, `impacto`, `acaoRecomendada`, `origemProjecao`, `origemInsight`, `link`.

---

## Performance

- Requisições paralelas (`Promise.all`)
- Refresh automático: 60 segundos
- Drawer: lazy load de timeline e KPIs
- Estado local evita round-trips para resolver/ignorar

---

## Notificações (preparação O-8)

Arquitetura preparada sem push:

- `NotificationContext` — contador e subscribe
- Evento `motor-comercial:pendencias-updated`
- Badge no menu ERP
- Toast via `notify()` nas ações

---

## Rota Frontend

- Path: `/pendencias`
- ERP id: `comercial-pendencias`
- Layout: `DashboardLayout`

---

## Restrições respeitadas

- Domínio não alterado
- Nenhuma tabela criada
- Nenhuma regra comercial calculada no Frontend
- Inteligência via Shared Insight Engine + Projection Services + APIs oficiais
