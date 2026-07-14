# Motor de Recomendações Comerciais — Sprint O-9

Documento oficial do **Motor de Recomendações Comerciais** — apoio à decisão inteligente.

---

## Objetivo

Transformar Insights em **recomendações de negócio concretas**. O sistema sugere ações; o usuário decide e executa manualmente.

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
RecomendacoesProjectionService
  ↓
GET /api/comercial/projections/recomendacoes
  ↓
Central /recomendacoes (Frontend)
```

### Componentes Backend

| Componente | Caminho |
|------------|---------|
| RecommendationService | `backend/motores/motor-comercial/recommendations/RecommendationService.js` |
| RecommendationMapper | `backend/motores/motor-comercial/recommendations/RecommendationMapper.js` |
| RecomendacoesProjectionService | `backend/motores/motor-comercial/services/projections/RecomendacoesProjectionService.js` |
| DTO | `backend/motores/motor-comercial/dto/RecomendacoesDTO.js` |

### Componentes Frontend

| Componente | Caminho |
|------------|---------|
| Página | `frontend/modules/motor-comercial/pages/Recomendacoes/index.js` |
| Mapeadores | `recomendacoesMappers.js` |
| Drawer | `RecomendacoesDrawer.js` |

---

## Fluxo

1. `RecomendacoesProjectionService` consulta em paralelo: insights, pendências, indicadores, situação-cliente.
2. `RecommendationService` transforma insights/alertas em recomendações via `RecommendationMapper`.
3. Recomendações estratégicas adicionais derivadas de indicadores/situação (VIP, risco, inativo).
4. Frontend aplica estado local (visualizada, aceita, ignorada, adiada, concluída) — **sem execução automática**.

---

## Categorias

| Categoria | Exemplos de tipos |
|-----------|-------------------|
| **CREDITO** | AUMENTAR_LIMITE, REDUZIR_LIMITE, LIBERAR_CREDITO, SOLICITAR_APROVACAO |
| **COMERCIAL** | VISITA_COMERCIAL, NEGOCIACAO, CONTATO_TELEFONICO, NOVA_CONSIGNACAO |
| **FINANCEIRO** | COBRANCA, RENEGOCIACAO |
| **OPERACIONAL** | FECHAR_PRESTACAO, REGISTRAR_PAGAMENTO, REGISTRAR_DEVOLUCAO |
| **ESTRATEGICO** | CLIENTE_VIP, CLIENTE_EM_RISCO, CLIENTE_INATIVO |

---

## Campos da Recomendação

`id`, `titulo`, `descricao`, `categoria`, `prioridade`, `confianca`, `impactoEstimado`, `motivo`, `origem`, `insightRelacionado`, `projectionRelacionada`, `clienteId`, `documento`, `data`, `status`, `link`, `tipo`

---

## Status (Frontend — localStorage)

| Status | Descrição |
|--------|-----------|
| NOVA | Recém-gerada pela API |
| VISUALIZADA | Drawer aberto |
| ACEITA | Operador concordou (sem auto-execução) |
| IGNORADA | Descartada |
| ADIADA | Oculta temporariamente |
| CONCLUIDA | Ação manual concluída |

---

## Origem dos Dados

Toda recomendação deriva de:

- Insights (`shared-insight-engine`)
- Alertas/pendências (`pendencias` projection)
- Indicadores e situação-cliente (recomendações estratégicas)

**Nenhuma regra comercial é calculada no frontend.**

---

## Integrações

| Hub | Integração |
|-----|------------|
| Dashboard | Card "Recomendações Prioritárias" → `/recomendacoes` |
| Cliente 360° | Painel Recomendações |
| Central de Pendências | Botão "Gerar Recomendações" → `/recomendacoes` |
| Menu ERP | Comercial → Recomendações |

---

## API

### GET `/api/comercial/projections/recomendacoes`

Query: `clienteId`, `consignacaoId`, `dataInicio`, `dataFim`

Resposta: `{ resumo, recomendacoes[], prioritarias[], categorias{}, kpis{} }`

---

## KPIs

- Emitidas, Aceitas, Ignoradas, Concluídas
- Taxa de aceitação (%)
- Impacto estimado médio (confiança média)

---

## Exportação

CSV/Excel via download client-side. PDF preparado para sprint futura.

---

## Restrições

- ✅ Nenhuma ação automática
- ✅ Domínio inalterado
- ✅ Sem novas tabelas
- ✅ Confirmação do usuário para aceitar/concluir
