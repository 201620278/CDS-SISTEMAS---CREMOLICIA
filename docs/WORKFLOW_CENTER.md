# Central de Workflow Operacional — Sprint O-11

Documento de arquitetura e operação da **Central de Workflow** do Motor Comercial.

## Objetivo

Acompanhar a execução operacional (fluxos, responsáveis, prazos, SLA, gargalos) **sem executar regras de negócio**. Toda mutação de domínio continua nos Use Cases existentes.

## Princípios

| Princípio | Descrição |
|-----------|-----------|
| **Somente projeção** | Dados derivados de Pendências + Recomendações + Playbooks |
| **Sem tabelas novas** | Nenhuma persistência de workflow no banco |
| **Sem alteração de domínio** | Use Cases, aggregates e ledger intactos |
| **Estado operacional local** | Atribuição, coluna Kanban e conclusão via `localStorage` (UX) |

## Arquitetura

```
PendenciasProjectionService ──┐
RecomendacoesProjectionService ──┼──► WorkflowProjectionService ──► WorkflowService ──► WorkflowDTO
PlaybooksProjectionService ──┘
```

### Backend

| Componente | Caminho |
|------------|---------|
| `WorkflowService` | `backend/motores/motor-comercial/services/workflow/WorkflowService.js` |
| `WorkflowProjectionService` | `backend/motores/motor-comercial/services/projections/WorkflowProjectionService.js` |
| `WorkflowDTO` | `backend/motores/motor-comercial/dto/WorkflowDTO.js` |

**Endpoint:** `GET /api/v1/comercial/projections/workflow`

Query params: `clienteId`, `consignacaoId`, `dataInicio`, `dataFim`

### Frontend

| Componente | Caminho |
|------------|---------|
| Página | `frontend/modules/motor-comercial/pages/WorkflowCenter/index.js` |
| Mappers | `frontend/modules/motor-comercial/pages/WorkflowCenter/workflowMappers.js` |
| Drawer | `frontend/modules/motor-comercial/pages/WorkflowCenter/WorkflowDrawer.js` |
| Rota SPA | `/workflow` |
| ERP menu key | `comercial-workflow` |

## Fluxo operacional

1. **Projeção backend** agrega alertas, recomendações e playbooks sugeridos em itens de workflow.
2. **WorkflowService** calcula SLA, coluna Kanban, fila prioritária e distribuição por operador.
3. **Frontend** enriquece com estado local (responsável, mudança de coluna, conclusão).
4. **Drawer** carrega contexto adicional (timeline, pendências, recomendações, playbooks, conta corrente, prestação).

## SLA (derivado)

| Prioridade / Severidade | Prazo (horas) |
|-------------------------|---------------|
| URGENT / CRITICAL | 4 |
| HIGH | 24 |
| NORMAL / MEDIUM | 48–72 |
| LOW / INFO | 168 |

**Indicadores visuais:**

| Status | Cor | Condição |
|--------|-----|----------|
| DENTRO | Verde | Tempo restante > 20% do SLA |
| PROXIMO | Amarelo | Restante ≤ 20% do SLA |
| VENCIDO | Vermelho | Prazo ultrapassado |

## Kanban

Colunas: **Novo → Em andamento → Aguardando → Bloqueado → Concluído**

| Origem | Coluna inicial |
|--------|----------------|
| Pendência | Novo (Bloqueado se tipo bloqueio) |
| Recomendação NOVA | Aguardando |
| Recomendação em análise | Em andamento |
| Playbook sugerido | Novo |
| Ação local "Concluir" | Concluído |

## Integrações

| Módulo | Integração |
|--------|------------|
| **Dashboard Executivo** | Card "Workflows Ativos" → `/workflow` |
| **Cliente 360°** | Painel "Workflow Atual" (status, tempo, SLA) |
| **Pendências** | Coluna "Workflow" com link para Workflow Center |
| **Playbooks** | Colunas % concluído, tempo previsto e realizado |
| **Recomendações** | Itens aparecem na projeção de workflow |

## Exportação

- **CSV** — implementado
- **Excel** — placeholder (CSV com extensão `.xls`)
- **PDF** — placeholder (toast informativo)

## Refresh

- Automático: **60 segundos**
- Manual: botão "Atualizar" no header

## Testes

| Arquivo | Escopo |
|---------|--------|
| `frontend/modules/motor-comercial/tests/pages/WorkflowCenter.test.js` | Página, mappers, filtros, SLA |
| `backend/motores/motor-comercial/tests/unit/workflow-service.test.js` | WorkflowService |
| `backend/motores/motor-comercial/tests/integration/api.test.js` | GET `/projections/workflow` |

## Critérios de aceitação (O-11)

- [x] Workflow Center operacional
- [x] Kanban funcionando
- [x] SLA funcionando
- [x] Dashboard integrado
- [x] Cliente 360° integrado
- [x] Playbooks integrados (tempo previsto/realizado)
- [x] Pendências integradas (workflow relacionado)
- [x] Drawer funcionando
- [x] Nenhuma alteração no domínio
- [x] Documentação concluída

---

*Sprint O-11 — Orquestração Operacional. Motor Comercial CDS Platform.*
