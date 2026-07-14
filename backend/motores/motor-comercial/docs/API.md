# Motor Comercial API Documentation

**Version:** O-12-enterprise  
**API Version:** v1  
**Base URL:** `/api/v1/comercial`

---

## Overview

The Motor Comercial API provides REST endpoints for managing commercial profiles, consignations, and business projections. All responses follow a standardized format.

---

## Standard Response Format

### Success Response

```json
{
  "success": true,
  "data": { },
  "metadata": { }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": { }
  }
}
```

---

## Headers

### Request Headers

- `X-Request-ID`: Unique request identifier (optional, auto-generated if not provided)
- `X-Correlation-ID`: Correlation identifier for tracking (optional, auto-generated if not provided)

### Response Headers

- `X-Request-ID`: Request identifier
- `X-Correlation-ID`: Correlation identifier

---

## Endpoints

### Health Check

#### GET /api/v1/comercial/health

Check API health status.

**Response:** `200 OK`

```json
{
  "status": "ok",
  "motor": "motor-comercial",
  "versao": "2.5",
  "api": "v1"
}
```

---

## Perfil Comercial

### Listar Perfis

#### GET /api/v1/comercial/perfil-comercial

List all commercial profiles with optional filters.

**Query Parameters:**
- `clienteId` (string, optional): Filter by client ID
- `perfilTipo` (string, optional): Filter by profile type
- `ativo` (boolean, optional): Filter by active status
- `bloqueado` (boolean, optional): Filter by blocked status

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "clienteId": "uuid",
      "perfilTipo": "CONSIGNADO",
      "ativo": true,
      "bloqueado": false,
      "limiteComercial": 10000,
      "saldoAberto": 2500,
      "observacoes": null,
      "dataAtivacao": "2024-01-01T00:00:00Z",
      "dataInativacao": null,
      "dataBloqueio": null,
      "dataDesbloqueio": null,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "metadata": {
    "total": 1
  }
}
```

---

### Consultar Perfil por ID

#### GET /api/v1/comercial/perfil-comercial/:id

Get a specific commercial profile by ID.

**Path Parameters:**
- `id` (string, required): Profile ID

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "clienteId": "uuid",
    "perfilTipo": "CONSIGNADO",
    "ativo": true,
    "bloqueado": false,
    "limiteComercial": 10000,
    "saldoAberto": 2500,
    "observacoes": null,
    "dataAtivacao": "2024-01-01T00:00:00Z",
    "dataInativacao": null,
    "dataBloqueio": null,
    "dataDesbloqueio": null,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Error Response:** `404 Not Found`

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Perfil comercial não encontrado"
  }
}
```

---

### Criar Perfil

#### POST /api/v1/comercial/perfil-comercial

Create a new commercial profile.

**Request Body:**

```json
{
  "clienteId": "uuid",
  "perfilTipo": "CONSIGNADO",
  "ativo": true,
  "limiteComercial": 10000,
  "observacoes": "Observações opcionais",
  "motivo": "Motivo da criação",
  "usuarioId": "uuid"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "perfil": { },
    "correlationId": "uuid"
  }
}
```

**Error Response:** `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos",
    "details": {
      "errors": ["clienteId é obrigatório"]
    }
  }
}
```

---

### Atualizar Perfil

#### PUT /api/v1/comercial/perfil-comercial/:id

Update a commercial profile.

**Path Parameters:**
- `id` (string, required): Profile ID

**Request Body:**

```json
{
  "ativo": true,
  "observacoes": "Novas observações",
  "usuarioId": "uuid"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": { }
}
```

---

### Bloquear Perfil

#### PATCH /api/v1/comercial/perfil-comercial/:id/bloquear

Block a commercial profile.

**Path Parameters:**
- `id` (string, required): Profile ID

**Request Body:**

```json
{
  "motivo": "Motivo do bloqueio",
  "usuarioId": "uuid"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "perfil": { },
    "correlationId": "uuid"
  }
}
```

---

### Desbloquear Perfil

#### PATCH /api/v1/comercial/perfil-comercial/:id/desbloquear

Unblock a commercial profile.

**Path Parameters:**
- `id` (string, required): Profile ID

**Request Body:**

```json
{
  "motivo": "Motivo do desbloqueio",
  "usuarioId": "uuid"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "perfil": { },
    "correlationId": "uuid"
  }
}
```

---

### Alterar Limite

#### PATCH /api/v1/comercial/perfil-comercial/:id/limite

Change the credit limit of a commercial profile.

**Path Parameters:**
- `id` (string, required): Profile ID

**Request Body:**

```json
{
  "novoLimite": 15000,
  "motivo": "Aumento de limite",
  "usuarioId": "uuid"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "perfil": { },
    "limiteAnterior": 10000,
    "limiteNovo": 15000,
    "correlationId": "uuid"
  }
}
```

---

### Consultar Histórico

#### GET /api/v1/comercial/perfil-comercial/:id/historico

Get the history of a commercial profile.

**Path Parameters:**
- `id` (string, required): Profile ID

**Query Parameters:**
- `tipoMovimentacao` (string, optional): Filter by movement type
- `dataInicio` (string, optional): Start date (ISO 8601)
- `dataFim` (string, optional): End date (ISO 8601)
- `limite` (number, optional): Limit number of results
- `offset` (number, optional): Offset for pagination

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "perfilComercialId": "uuid",
    "movimentacoes": [ ],
    "total": 0
  }
}
```

---

### Consultar Score

#### GET /api/v1/comercial/perfil-comercial/:id/score

Get the reliability score of a commercial profile.

**Path Parameters:**
- `id` (string, required): Profile ID

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "score": 850,
    "nivel": "ALTO",
    "fatores": [ ],
    "ultimaAtualizacao": "2024-01-01T00:00:00Z"
  }
}
```

---

### Consultar Limite Disponível

#### GET /api/v1/comercial/perfil-comercial/:id/limite

Get the available credit limit of a commercial profile.

**Path Parameters:**
- `id` (string, required): Profile ID

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "limiteComercial": 10000,
    "saldoAberto": 2500,
    "limiteDisponivel": 7500,
    "percentualUtilizado": 25
  }
}
```

---

## Consignação

### Listar Consignações

#### GET /api/v1/comercial/consignacoes

List all consignations with optional filters.

**Query Parameters:**
- `clienteId` (string, optional): Filter by client ID
- `perfilComercialId` (string, optional): Filter by profile ID
- `status` (string, optional): Filter by status

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "clienteId": "uuid",
      "perfilComercialId": "uuid",
      "status": "ENTREGUE",
      "documento": { },
      "observacao": null,
      "usuarioAberturaId": "uuid",
      "dataAbertura": "2024-01-01T00:00:00Z",
      "dataEntrega": "2024-01-02T00:00:00Z",
      "dataEntregaPrevista": "2024-01-02T00:00:00Z",
      "dataFechamento": null,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-02T00:00:00Z"
    }
  ],
  "metadata": {
    "total": 1
  }
}
```

---

### Consultar Consignação por ID

#### GET /api/v1/comercial/consignacoes/:id

Get a specific consignation by ID.

**Path Parameters:**
- `id` (string, required): Consignation ID

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "clienteId": "uuid",
    "perfilComercialId": "uuid",
    "status": "ENTREGUE",
    "documento": { },
    "observacao": null,
    "usuarioAberturaId": "uuid",
    "dataAbertura": "2024-01-01T00:00:00Z",
    "dataEntrega": "2024-01-02T00:00:00Z",
    "dataEntregaPrevista": "2024-01-02T00:00:00Z",
    "dataFechamento": null,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-02T00:00:00Z"
  }
}
```

---

### Criar Consignação

#### POST /api/v1/comercial/consignacoes

Create a new consignation.

**Request Body:**

```json
{
  "clienteId": "uuid",
  "perfilComercialId": "uuid",
  "documento": { "situacao": "RASCUNHO" },
  "observacao": "Observações",
  "dataAbertura": "2024-01-01T00:00:00Z",
  "dataEntregaPrevista": "2024-01-02T00:00:00Z",
  "usuarioId": "uuid"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "consignacao": { },
    "correlationId": "uuid"
  }
}
```

---

### Editar Consignação

#### PUT /api/v1/comercial/consignacoes/:id

Edit a consignation.

**Path Parameters:**
- `id` (string, required): Consignation ID

**Request Body:**

```json
{
  "observacao": "Novas observações",
  "dataEntregaPrevista": "2024-01-03T00:00:00Z",
  "usuarioId": "uuid"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": { }
}
```

---

### Cancelar Consignação

#### DELETE /api/v1/comercial/consignacoes/:id

Cancel a draft consignation.

**Path Parameters:**
- `id` (string, required): Consignation ID

**Request Body:**

```json
{
  "usuarioId": "uuid"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": { }
}
```

---

### Adicionar Item

#### POST /api/v1/comercial/consignacoes/:id/itens

Add an item to a consignation.

**Path Parameters:**
- `id` (string, required): Consignation ID

**Request Body:**

```json
{
  "produtoId": "uuid",
  "quantidade": 10,
  "precoUnitario": 50.00,
  "usuarioId": "uuid"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": { }
}
```

---

### Alterar Quantidade de Item

#### PUT /api/v1/comercial/consignacoes/:id/itens/:item

Change the quantity of an item.

**Path Parameters:**
- `id` (string, required): Consignation ID
- `item` (string, required): Item ID

**Request Body:**

```json
{
  "novaQuantidade": 15,
  "usuarioId": "uuid"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": { }
}
```

---

### Remover Item

#### DELETE /api/v1/comercial/consignacoes/:id/itens/:item

Remove an item from a consignation.

**Path Parameters:**
- `id` (string, required): Consignation ID
- `item` (string, required): Item ID

**Request Body:**

```json
{
  "usuarioId": "uuid"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": { }
}
```

---

### Registrar Entrega

#### POST /api/v1/comercial/consignacoes/:id/entrega

Register the delivery of a consignation.

**Path Parameters:**
- `id` (string, required): Consignation ID

**Request Body:**

```json
{
  "observacao": "Observações da entrega",
  "usuarioId": "uuid"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": { }
}
```

---

### Registrar Devolução

#### POST /api/v1/comercial/consignacoes/:id/devolucao

Register the return of a consignation.

**Path Parameters:**
- `id` (string, required): Consignation ID

**Request Body:**

```json
{
  "observacao": "Motivo da devolução",
  "usuarioId": "uuid"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": { }
}
```

---

### Transferir Itens

#### POST /api/v1/comercial/consignacoes/:id/transferencia

Transfer items between consignations.

**Path Parameters:**
- `id` (string, required): Source consignation ID

**Request Body:**

```json
{
  "consignacaoDestinoId": "uuid",
  "itemIds": ["uuid1", "uuid2"],
  "observacao": "Motivo da transferência",
  "usuarioId": "uuid"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": { }
}
```

---

### Abrir Prestação

#### POST /api/v1/comercial/consignacoes/:id/prestacao/abrir

Open a settlement account for a consignation.

**Path Parameters:**
- `id` (string, required): Consignation ID

**Request Body:**

```json
{
  "usuarioId": "uuid"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": { }
}
```

---

### Registrar Venda

#### POST /api/v1/comercial/consignacoes/:id/prestacao/venda

Register a sale in the settlement.

**Path Parameters:**
- `id` (string, required): Consignation ID

**Request Body:**

```json
{
  "produtoId": "uuid",
  "quantidade": 5,
  "precoVenda": 60.00,
  "observacao": "Observações",
  "usuarioId": "uuid"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": { }
}
```

---

### Registrar Perda

#### POST /api/v1/comercial/consignacoes/:id/prestacao/perda

Register a loss in the settlement.

**Path Parameters:**
- `id` (string, required): Consignation ID

**Request Body:**

```json
{
  "produtoId": "uuid",
  "quantidade": 2,
  "motivo": "Motivo da perda",
  "observacao": "Observações",
  "usuarioId": "uuid"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": { }
}
```

---

### Registrar Cortesia

#### POST /api/v1/comercial/consignacoes/:id/prestacao/cortesia

Register a courtesy in the settlement.

**Path Parameters:**
- `id` (string, required): Consignation ID

**Request Body:**

```json
{
  "produtoId": "uuid",
  "quantidade": 1,
  "motivo": "Motivo da cortesia",
  "observacao": "Observações",
  "usuarioId": "uuid"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": { }
}
```

---

### Registrar Pagamento

#### POST /api/v1/comercial/consignacoes/:id/prestacao/pagamento

Register a payment in the settlement.

**Path Parameters:**
- `id` (string, required): Consignation ID

**Request Body:**

```json
{
  "valor": 500.00,
  "formaPagamento": "DINHEIRO",
  "observacao": "Observações",
  "usuarioId": "uuid"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": { }
}
```

---

### Fechar Prestação

#### POST /api/v1/comercial/consignacoes/:id/prestacao/fechar

Close a settlement account.

**Path Parameters:**
- `id` (string, required): Consignation ID

**Request Body:**

```json
{
  "usuarioId": "uuid"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": { }
}
```

---

### Reabrir Prestação

#### POST /api/v1/comercial/consignacoes/:id/prestacao/reabrir

Reopen a closed settlement account.

**Path Parameters:**
- `id` (string, required): Consignation ID

**Request Body:**

```json
{
  "usuarioId": "uuid",
  "motivo": "Motivo da reabertura"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": { }
}
```

---

## Projections

### Dashboard

#### GET /api/v1/comercial/projections/dashboard

Get the commercial dashboard data.

**Query Parameters:**
- `clienteId` (string, optional): Filter by client ID
- `consignacaoId` (string, optional): Filter by consignation ID

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "cards": [
      { "titulo": "Valor Consignado", "valor": 10000 },
      { "titulo": "Valor Vendido", "valor": 7500 },
      { "titulo": "Valor Perdido", "valor": 200 },
      { "titulo": "Saldo em Aberto", "valor": 2500 }
    ],
    "kpis": {
      "valorConsignado": 10000,
      "valorVendido": 7500,
      "valorPerdido": 200,
      "percentualVenda": 75,
      "percentualPerda": 2
    },
    "totais": {
      "saldoEmAberto": 2500
    },
    "alertas": [ ]
  },
  "metadata": {
    "escopo": "GLOBAL"
  }
}
```

---

### Conta Corrente

#### GET /api/v1/comercial/projections/conta-corrente

Get the current account data.

**Query Parameters:**
- `clienteId` (string, optional): Filter by client ID
- `consignacaoId` (string, optional): Filter by consignation ID
- `dataInicio` (string, optional): Start date (ISO 8601)
- `dataFim` (string, optional): End date (ISO 8601)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "clienteId": "uuid",
    "saldo": 2500,
    "saldoEmAberto": 2500,
    "movimentacoes": [ ],
    "ultimaAtualizacao": "2024-01-01T00:00:00Z"
  }
}
```

---

### Timeline

#### GET /api/v1/comercial/projections/timeline

Get the timeline of events.

**Query Parameters:**
- `clienteId` (string, optional): Filter by client ID
- `consignacaoId` (string, optional): Filter by consignation ID
- `perfilComercialId` (string, optional): Filter by profile ID
- `dataInicio` (string, optional): Start date (ISO 8601)
- `dataFim` (string, optional): End date (ISO 8601)
- `limite` (number, optional): Limit number of results
- `offset` (number, optional): Offset for pagination

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "eventos": [ ],
    "total": 0,
    "pagina": 1,
    "tamanhoPagina": 10
  }
}
```

---

### Resumo de Prestação

#### GET /api/v1/comercial/projections/resumo-prestacao

Get the settlement summary.

**Query Parameters:**
- `consignacaoId` (string, required): Consignation ID

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "consignacaoId": "uuid",
    "prestacaoId": "uuid",
    "status": "ABERTA",
    "valorTotal": 10000,
    "valorVendido": 7500,
    "valorPerdido": 200,
    "valorCortesia": 0,
    "valorPago": 5000,
    "saldoPendente": 2500,
    "itens": [ ],
    "movimentacoes": [ ]
  }
}
```

---

### Saldos

#### GET /api/v1/comercial/projections/saldos

Get balance information.

**Query Parameters:**
- `clienteId` (string, optional): Filter by client ID
- `consignacaoId` (string, optional): Filter by consignation ID

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "clienteId": "uuid",
    "consignacaoId": "uuid",
    "saldoEmAberto": 2500,
    "limiteDisponivel": 7500,
    "totais": { },
    "detalhes": [ ]
  }
}
```

---

### Histórico

#### GET /api/v1/comercial/projections/historico

Get historical data.

**Query Parameters:**
- `clienteId` (string, optional): Filter by client ID
- `perfilComercialId` (string, optional): Filter by profile ID
- `tipoMovimentacao` (string, optional): Filter by movement type
- `dataInicio` (string, optional): Start date (ISO 8601)
- `dataFim` (string, optional): End date (ISO 8601)
- `limite` (number, optional): Limit number of results
- `offset` (number, optional): Offset for pagination

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "clienteId": "uuid",
    "perfilComercialId": "uuid",
    "registros": [ ],
    "total": 0,
    "pagina": 1,
    "tamanhoPagina": 10
  }
}
```

---

### Indicadores

#### GET /api/v1/comercial/projections/indicadores

Get business indicators.

**Query Parameters:**
- `clienteId` (string, optional): Filter by client ID
- `consignacaoId` (string, optional): Filter by consignation ID
- `dataInicio` (string, optional): Start date (ISO 8601)
- `dataFim` (string, optional): End date (ISO 8601)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "valorConsignado": 10000,
    "valorVendido": 7500,
    "valorPerdido": 200,
    "valorCortesia": 0,
    "percentualVenda": 75,
    "percentualPerda": 2,
    "percentualCortesia": 0,
    "totalConsignacoes": 10,
    "totalPrestacoes": 5
  }
}
```

---

### Insights

#### GET /api/v1/comercial/projections/insights

Projeção de insights comerciais derivados do ledger e contexto do cliente.

**Query Parameters:** `clienteId`, `consignacaoId`, `dataInicio`, `dataFim`

**Response:** `200 OK` — `StandardResponse` com lista de insights.

---

### Pendências

#### GET /api/v1/comercial/projections/pendencias

Alertas operacionais (bloqueios, prazos, inconsistências).

**Query Parameters:** `clienteId`, `consignacaoId`, `tipo`, `severidade`

**Response:** `200 OK`

---

### Recomendações

#### GET /api/v1/comercial/projections/recomendacoes

Sugestões comerciais derivadas de projeções (sem mutação de domínio).

**Query Parameters:** `clienteId`, `consignacaoId`, `status`

**Response:** `200 OK`

---

### Playbooks

#### GET /api/v1/comercial/projections/playbooks

Playbooks sugeridos para fluxos operacionais.

**Query Parameters:** `clienteId`, `consignacaoId`, `categoria`

**Response:** `200 OK`

---

### Workflow (Central Operacional)

#### GET /api/v1/comercial/projections/workflow

Agregação operacional de pendências, recomendações e playbooks com SLA, Kanban e fila prioritária.

**Query Parameters:**
- `clienteId` (string, optional)
- `consignacaoId` (string, optional)
- `dataInicio` (string, optional)
- `dataFim` (string, optional)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "resumo": { "total": 0, "urgentes": 0, "vencidos": 0 },
    "itens": [ ],
    "kanban": { },
    "sla": { },
    "fila": [ ]
  }
}
```

Documentação completa: `docs/WORKFLOW_CENTER.md` (raiz do repositório).

---

### Situação do Cliente

#### GET /api/v1/comercial/projections/situacao-cliente

Get the customer's situation.

**Query Parameters:**
- `clienteId` (string, required): Client ID

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "clienteId": "uuid",
    "situacao": "ATIVO",
    "score": 850,
    "nivelRisco": "BAIXO",
    "saldoEmAberto": 2500,
    "limiteDisponivel": 7500,
    "alertas": [ ],
    "recomendacoes": [ ]
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid request data |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict (duplicate, etc.) |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Access denied |
| INTERNAL_ERROR | 500 | Internal server error |
| PERFIL_NAO_ENCONTRADO | 404 | Profile not found |
| CONSIGNACAO_NAO_ENCONTRADA | 404 | Consignation not found |
| CLIENTE_NAO_ENCONTRADO | 404 | Client not found |
| PERFIL_DUPLICADO | 409 | Duplicate profile |
| DOCUMENTO_DUPLICADO | 409 | Duplicate document |
| PERFIL_BLOQUEADO | 403 | Profile blocked |
| CLIENTE_BLOQUEADO | 403 | Client blocked |
| LIMITE_COMERCIAL_INSUFICIENTE | 400 | Insufficient credit limit |
| MOVIMENTACAO_INVALIDA | 400 | Invalid movement |
| QUANTIDADE_INVALIDA | 400 | Invalid quantity |
| PRESTACAO_JA_FECHADA | 400 | Settlement already closed |
| PRESTACAO_NAO_ABERTA | 400 | Settlement not open |

---

## HTTP Status Codes

| Status | Description |
|--------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 204 | No Content - Request successful, no content returned |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource conflict |
| 500 | Internal Server Error - Server error |

---

## Versioning

The API is versioned using URL path versioning. The current version is `v1`.

Base URL: `/api/v1/comercial`

Future versions will be available at:
- `/api/v2/comercial`
- `/api/v3/comercial`

---

## Authentication

**Note:** Authentication is not yet implemented in this sprint. Future versions will include JWT or OAuth authentication.

---

## Rate Limiting

Rate limiting está disponível via `RateLimitMiddleware` em `shared/http/middlewares`. Aplicação global nas rotas comerciais é configurável no servidor — ver `docs/API_HARDENING.md`.

---

## Pagination

For endpoints that support pagination, use the following query parameters:

- `limite`: Number of items per page (default: 10)
- `offset`: Number of items to skip (default: 0)

Example: `GET /api/v1/comercial/perfil-comercial?limite=20&offset=40`

---

## Filtering

Most list endpoints support filtering via query parameters. Available filters are documented in each endpoint.

---

## Sorting

**Note:** Sorting is not yet implemented in this sprint.

---

## CORS

**Note:** CORS configuration should be set up in the main application server.

---

## Support

For issues or questions, please contact the development team.
