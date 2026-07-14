# Playbooks Comerciais — Sprint O-10

Documento oficial da **Central de Playbooks Operacionais** — GPS Operacional do Motor Comercial.

---

## Objetivo

Transformar recomendações em **fluxos guiados passo a passo**. O sistema conduz o operador; **nenhuma ação é executada automaticamente**.

---

## Arquitetura

```
Ledger
  ↓
Projection Services
  ↓
Shared Insight Engine
  ↓
RecommendationService
  ↓
PlaybookService (catálogo + sugestões)
  ↓
PlaybooksProjectionService
  ↓
GET /api/comercial/projections/playbooks
  ↓
Central /playbooks (Frontend)
```

### Componentes Backend

| Componente | Caminho |
|------------|---------|
| PlaybookCatalog | `backend/motores/motor-comercial/playbooks/PlaybookCatalog.js` |
| PlaybookService | `backend/motores/motor-comercial/playbooks/PlaybookService.js` |
| PlaybooksProjectionService | `backend/motores/motor-comercial/services/projections/PlaybooksProjectionService.js` |
| DTO | `backend/motores/motor-comercial/dto/PlaybooksDTO.js` |

### Componentes Frontend

| Componente | Caminho |
|------------|---------|
| Página | `frontend/modules/motor-comercial/pages/Playbooks/index.js` |
| Mapeadores | `playbooksMappers.js` |
| Drawer | `PlaybooksDrawer.js` |

---

## Fluxo

1. `PlaybooksProjectionService` consulta recomendações, insights, pendências e indicadores.
2. `PlaybookService` cruza o catálogo (12 playbooks) com recomendações/insights ativos.
3. Playbooks **aplicáveis** e **sugeridos** são retornados com score de relevância.
4. Frontend gerencia instâncias, checklist e histórico em **localStorage** — operador confirma cada passo manualmente.

---

## Categorias

| Categoria | Playbooks |
|-----------|-----------|
| **Cobrança** | PB-001 |
| **Renegociação** | PB-003 |
| **Entrega** | PB-011 |
| **Prestação** | PB-004, PB-005 |
| **Recuperação** | PB-002, PB-010 |
| **Visita Comercial** | PB-006 |
| **Atualização Cadastral** | PB-007 |
| **Bloqueio** | PB-009 |
| **Liberação** | PB-008 |
| **Cliente VIP** | PB-012 |

---

## Catálogo Inicial (001–012)

| ID | Nome |
|----|------|
| PB-001 | Cobrar Cliente Inadimplente |
| PB-002 | Recuperar Cliente Inativo |
| PB-003 | Revisar Limite Comercial |
| PB-004 | Encerrar Prestação |
| PB-005 | Regularizar Pendências |
| PB-006 | Agendar Visita Comercial |
| PB-007 | Atualizar Cadastro |
| PB-008 | Liberar Crédito |
| PB-009 | Bloquear Cliente |
| PB-010 | Reativar Cliente |
| PB-011 | Revisar Consignação |
| PB-012 | Cliente VIP |

Cada playbook possui: ID, nome, descrição, objetivo, categoria, pré-requisitos, passos, tempo estimado, resultado esperado, documentos/KPIs/insights/recomendações relacionados.

---

## Checklist (status por passo)

| Status | Descrição |
|--------|-----------|
| PENDENTE | Aguardando início |
| EM_ANDAMENTO | Passo atual |
| CONCLUIDO | Operador confirmou conclusão |
| IGNORADO | Passo dispensado |
| BLOQUEADO | Impedimento registrado |

---

## Fluxo Guiado

A tela de fluxo exibe:

- Passo atual e próximo passo
- Tempo estimado do playbook
- Observações do operador
- Links rápidos para telas relacionadas (conta corrente, pendências, cliente 360°, etc.)

---

## Drawer

Contexto operacional sem executar ações:

- Cliente, timeline, conta corrente
- Consignações, prestação
- Insights e recomendações relacionadas
- Histórico de instâncias

---

## Integração com Recommendation Engine

- `PlaybookService` mapeia `tiposRecomendacao` e `tiposInsight` do catálogo.
- Playbooks com maior score aparecem em **Sugeridos**.
- Central de Recomendações: botão **Iniciar Playbook** → `/playbooks`.
- Dashboard: card **Playbooks em andamento**.
- Cliente 360°: painel **Playbooks Ativos**.

---

## KPIs

| KPI | Fonte |
|-----|-------|
| Iniciados | Instâncias localStorage + API |
| Concluídos | Instâncias concluídas |
| Em andamento | Instâncias ativas |
| Tempo médio | Histórico de conclusões |
| Eficiência / Taxa de conclusão | Concluídos ÷ iniciados |

---

## Histórico

Registrado em localStorage:

- Usuário, playbook, início, fim
- Resultado e observações
- Ações: INICIADO, CONCLUIDO

---

## Exportação

- CSV (implementado na Central)
- PDF / Excel (placeholders via utilitários operacionais)

---

## API

### GET `/api/comercial/projections/playbooks`

Query: `clienteId`, `consignacaoId`, `dataInicio`, `dataFim`

Resposta: `{ resumo, playbooks[], sugeridos[], kpis{} }`

---

## Restrições (Sprint O-10)

- **Não** alterar domínio
- **Não** criar regras comerciais novas
- **Não** executar operações automaticamente
- Consumir exclusivamente: Projection Services, Recommendation Engine, APIs oficiais

---

## Refresh

Atualização automática a cada **60 segundos** na Central, Dashboard e Cliente 360°.
