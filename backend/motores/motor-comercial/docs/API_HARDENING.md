# API Hardening Documentation

**Versão:** 2.5.5  
**Data:** 2026-07-07  
**Escopo:** Hardening da API do Motor Comercial e Infraestrutura HTTP Compartilhada

---

## Visão Geral

Este documento descreve as melhorias de hardening implementadas na API do Motor Comercial e na infraestrutura HTTP compartilhada do CDS Sistemas.

## Objetivo

Transformar a API funcional em uma API corporativa pronta para produção, estabelecendo uma infraestrutura HTTP reutilizável por todos os motores do CDS Sistemas.

---

## Infraestrutura HTTP Compartilhada

### Localização

`backend/shared/http/`

### Estrutura

```
backend/shared/http/
├── responses/
│   ├── StandardResponse.js
│   └── index.js
├── middlewares/
│   ├── RequestIdMiddleware.js
│   ├── CorrelationIdMiddleware.js
│   ├── ResponseEnricherMiddleware.js
│   ├── ErrorHandlerMiddleware.js
│   ├── ValidationMiddleware.js
│   ├── LoggingMiddleware.js
│   ├── IdempotencyMiddleware.js
│   └── index.js
├── mappers/
│   ├── DomainErrorMapper.js
│   ├── ResultHttpMapper.js
│   ├── ProjectionMapper.js
│   └── index.js
├── logging/
│   ├── RequestLog.js
│   ├── BusinessLog.js
│   ├── PerformanceLog.js
│   ├── SecurityLog.js
│   ├── ErrorLog.js
│   └── index.js
└── idempotency/
    ├── IIdempotencyStore.js
    └── InMemoryIdempotencyStore.js
```

---

## Padrão de Resposta Corporativo

### Estrutura de Sucesso

```json
{
  "success": true,
  "requestId": "uuid",
  "correlationId": "uuid",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0",
  "data": { },
  "metadata": { }
}
```

### Estrutura de Erro

```json
{
  "success": false,
  "requestId": "uuid",
  "correlationId": "uuid",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0",
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensagem de erro",
    "details": { }
  },
  "metadata": { }
}
```

### Componentes

- **success**: Booleano indicando sucesso ou falha
- **requestId**: Identificador único da requisição (auto-gerado se não fornecido)
- **correlationId**: Identificador de correlação para rastreamento distribuído
- **timestamp**: ISO 8601 timestamp da resposta
- **version**: Versão do padrão de resposta
- **data**: Dados da resposta (sucesso)
- **error**: Detalhes do erro (falha)
- **metadata**: Metadados adicionais

---

## Middlewares

### RequestIdMiddleware

**Propósito:** Adiciona um identificador único a cada requisição.

**Comportamento:**
- Lê o header `X-Request-ID`
- Se não existir, gera um UUID v4
- Adiciona ao objeto `req.requestId`
- Retorna no header de resposta

**Uso:**
```javascript
router.use(RequestIdMiddleware.create());
```

---

### CorrelationIdMiddleware

**Propósito:** Adiciona e propaga correlation ID para rastreamento distribuído.

**Comportamento:**
- Lê o header `X-Correlation-ID`
- Se não existir, gera um UUID v4
- Adiciona ao objeto `req.correlationId`
- Adiciona ao `req.app.locals.correlationId` para propagação
- Retorna no header de resposta

**Uso:**
```javascript
router.use(CorrelationIdMiddleware.create());
```

---

### ResponseEnricherMiddleware

**Propósito:** Enriquece respostas com metadados da requisição.

**Comportamento:**
- Intercepta `res.json`
- Adiciona `requestId` e `correlationId` à resposta
- Aplica automaticamente a todas as respostas

**Uso:**
```javascript
router.use(ResponseEnricherMiddleware.create());
```

---

### ErrorHandlerMiddleware

**Propósito:** Tratamento centralizado de erros.

**Comportamento:**
- Captura erros de domínio
- Captura erros de validação
- Captura erros genéricos
- Converte para resposta padronizada
- Log com contexto (requestId, correlationId)

**Uso:**
```javascript
router.use(ErrorHandlerMiddleware.create());
```

---

### ValidationMiddleware

**Propósito:** Validação de requisições HTTP.

**Comportamento:**
- Valida corpo da requisição usando validador fornecido
- Verifica campos obrigatórios
- Retorna erro padronizado em caso de falha

**Uso:**
```javascript
router.post('/endpoint', 
  ValidationMiddleware.create(myValidator),
  controller.handler
);
```

---

### LoggingMiddleware

**Propósito:** Logging padronizado de requisições e respostas.

**Comportamento:**
- Registra início da requisição
- Registra fim da requisição com duração
- Log em formato JSON estruturado
- Inclui requestId e correlationId

**Uso:**
```javascript
router.use(LoggingMiddleware.create());
```

---

### IdempotencyMiddleware

**Propósito:** Evita execução duplicada de operações críticas.

**Comportamento:**
- Lê header `Idempotency-Key`
- Verifica se resultado já existe
- Se existir, retorna resultado armazenado
- Se não existir, executa e armazena resultado
- TTL configurável (padrão: 3600s)

**Uso:**
```javascript
router.use(IdempotencyMiddleware.create({
  ttl: 3600,
  methods: ['POST', 'PUT', 'PATCH', 'DELETE']
}));
```

**Header:**
```
Idempotency-Key: uuid-v4
```

---

## Logging Padronizado

### Tipos de Log

#### RequestLog

Log de requisições HTTP.

**Campos:**
- timestamp
- type: "REQUEST"
- motor
- requestId
- correlationId
- level
- message
- context: { method, path, query, ip, userAgent }

#### BusinessLog

Log de eventos de negócio.

**Campos:**
- timestamp
- type: "BUSINESS"
- motor
- requestId
- correlationId
- level
- message
- context: { event, entity, entityId, usuarioId, data }

#### PerformanceLog

Log de métricas de performance.

**Campos:**
- timestamp
- type: "PERFORMANCE"
- motor
- requestId
- correlationId
- level
- message
- context: { operation, duration, metadata }

#### SecurityLog

Log de eventos de segurança.

**Campos:**
- timestamp
- type: "SECURITY"
- motor
- requestId
- correlationId
- level
- message
- context: { event, ip, userAgent, usuarioId, details }

#### ErrorLog

Log de erros.

**Campos:**
- timestamp
- type: "ERROR"
- motor
- requestId
- correlationId
- level
- message
- context: { error, message, stack, context }

---

## Health Checks

### Endpoints Implementados

#### GET /health

Health check básico.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "motor": "motor-comercial",
    "version": "2.5.5",
    "uptime": "3600s",
    "timestamp": "2024-01-01T00:00:00Z",
    "database": "connected",
    "repositories": "ok"
  }
}
```

#### GET /version

Informações de versão.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "versao": "2.5.5",
    "api": "v1",
    "build": "development",
    "commit": null,
    "ambiente": "development",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### GET /status

Status detalhado dos componentes.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "motor": "motor-comercial",
    "status": "operational",
    "componentes": {
      "repositories": { },
      "controllers": { },
      "projectionServices": { }
    },
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

---

## OpenAPI/Swagger

### Documentação

Arquivo: `backend/motores/motor-comercial/docs/openapi.json`

### Especificação

- **OpenAPI Version:** 3.0.0
- **Title:** Motor Comercial API
- **Version:** 2.5.5

### Tags

- Health
- Perfil Comercial
- Consignação
- Projections

### Endpoints Documentados

- Health: `/health`, `/version`, `/status`
- Perfil Comercial: `/perfil-comercial`, `/perfil-comercial/{id}`, `/perfil-comercial/{id}/bloquear`, `/perfil-comercial/{id}/desbloquear`, `/perfil-comercial/{id}/limite`
- Consignação: `/consignacoes`, `/consignacoes/{id}`
- Projections: `/projections/dashboard`, `/projections/situacao-cliente`

### Schemas

- StandardResponse
- ErrorResponse
- HealthResponse
- VersionResponse
- StatusResponse
- CriarPerfilRequest
- AtualizarPerfilRequest
- BloquearPerfilRequest
- DesbloquearPerfilRequest
- AlterarLimiteRequest
- PerfilResponse
- CriarConsignacaoRequest
- ConsignacaoResponse
- DashboardResponse
- SituacaoClienteResponse

---

## Idempotência

### Interface

`IIdempotencyStore` - Interface para armazenamento de idempotência.

**Métodos:**
- `store(key, result, ttl)` - Armazena resultado
- `retrieve(key)` - Recupera resultado
- `exists(key)` - Verifica existência
- `delete(key)` - Remove chave

### Implementação

`InMemoryIdempotencyStore` - Implementação em memória.

**Características:**
- Armazenamento em Map
- TTL configurável
- Limpeza automática de entradas expiradas
- Método `clear()` para limpeza manual
- Método `size()` para consulta de tamanho

### Middleware

`IdempotencyMiddleware` - Middleware de idempotência.

**Configuração:**
```javascript
IdempotencyMiddleware.create({
  store: new InMemoryIdempotencyStore(),
  ttl: 3600,
  methods: ['POST', 'PUT', 'PATCH', 'DELETE']
})
```

---

## Mappers

### DomainErrorMapper

Converte erros de domínio em respostas HTTP.

**Mapeamento de Códigos:**
- VALIDATION_ERROR → 400
- NOT_FOUND → 404
- CONFLICT → 409
- UNAUTHORIZED → 401
- FORBIDDEN → 403
- TOO_MANY_REQUESTS → 429

**Códigos Específicos:**
- PERFIL_NAO_ENCONTRADO → 404
- CONSIGNACAO_NAO_ENCONTRADA → 404
- CLIENTE_NAO_ENCONTRADO → 404
- PERFIL_DUPLICADO → 409
- DOCUMENTO_DUPLICADO → 409
- PERFIL_BLOQUEADO → 403
- CLIENTE_BLOQUEADO → 403
- LIMITE_COMERCIAL_INSUFICIENTE → 400
- PRESTACAO_JA_FECHADA → 400
- PRESTACAO_NAO_ABERTA → 400

### ResultHttpMapper

Converte resultados de UseCase em respostas HTTP.

**Métodos:**
- `map(result)` - Converte resultado padrão
- `mapCreated(result)` - Converte resultado de criação (201)
- `mapNoContent()` - Retorna 204 No Content
- `mapPaginated(result)` - Converte resultado paginado

### ProjectionMapper

Converte resultados de Projection Services em respostas HTTP.

**Métodos:**
- `map(projectionResult)` - Converte resultado genérico
- `mapDashboard(dashboardResult)` - Converte dashboard
- `mapContaCorrente(contaCorrenteResult)` - Converte conta corrente
- `mapTimeline(timelineResult)` - Converte timeline
- `mapResumoPrestacao(resumoResult)` - Converte resumo de prestação
- `mapIndicadores(indicadoresResult)` - Converte indicadores
- `mapSaldos(saldosResult)` - Converte saldos
- `mapHistorico(historicoResult)` - Converte histórico
- `mapSituacaoCliente(situacaoResult)` - Converte situação do cliente

---

## Integração com Motor Comercial

### Atualizações Realizadas

1. **Rotas** (`routes/comercial.routes.js`)
   - Importação de middlewares compartilhados
   - Adição de `ResponseEnricherMiddleware`
   - Adição de `IdempotencyMiddleware`
   - Adição de endpoints de health check

2. **Controllers**
   - `PerfilComercialController` - Atualizado para usar `StandardResponse` compartilhado
   - `ConsignacaoController` - Atualizado para usar `StandardResponse` compartilhado
   - `ProjectionController` - Atualizado para usar `StandardResponse` compartilhado
   - `HealthController` - Novo controller para health checks

3. **Mappers**
   - Importação de mappers compartilhados em todos os controllers

---

## Fluxo HTTP

### Sequência de Middlewares

1. **RequestIdMiddleware** - Adiciona requestId
2. **CorrelationIdMiddleware** - Adiciona correlationId
3. **ResponseEnricherMiddleware** - Prepara enriquecimento de resposta
4. **LoggingMiddleware** - Inicia log da requisição
5. **IdempotencyMiddleware** - Verifica idempotência
6. **Controller** - Processa a requisição
7. **ResponseEnricherMiddleware** - Enriquece resposta
8. **LoggingMiddleware** - Finaliza log da requisição
9. **ErrorHandlerMiddleware** - Trata erros (se ocorrerem)

### Propagação de CorrelationId

O `correlationId` é propagado através de:
- `req.correlationId` - Disponível no controller
- `req.app.locals.correlationId` - Disponível globalmente
- Headers de resposta - Retornado ao cliente
- UseCases - Passado via `inputData.correlationId`
- Logs - Incluído em todas as entradas de log

---

## Boas Práticas

### Para Desenvolvedores

1. **Sempre usar a infraestrutura compartilhada**
   - Nunca criar middlewares locais
   - Usar `StandardResponse` do `shared/http`
   - Usar mappers do `shared/http`

2. **Propagar correlationId**
   - Passar para UseCases
   - Passar para serviços externos
   - Incluir em logs

3. **Usar idempotência para operações críticas**
   - Operações de escrita
   - Operações financeiras
   - Operações que não podem ser repetidas

4. **Padrão de resposta**
   - Nunca retornar respostas fora do padrão
   - Usar `StandardResponse.success()` para sucesso
   - Usar `StandardResponse.error()` para erros

### Para Operações

1. **Monitorar health checks**
   - `/health` - Verificação básica
   - `/version` - Informações de versão
   - `/status` - Status detalhado dos componentes

2. **Usar requestId e correlationId**
   - Para rastreamento de requisições
   - Para debugging
   - Para correlação de logs

3. **Consultar OpenAPI**
   - Documentação em `docs/openapi.json`
   - Swagger UI (quando implementado)
   - Especificação completa de endpoints

---

## Próximos Passos

### Pendentes (Média Prioridade)

- [ ] HttpAuditService - Infraestrutura de auditoria HTTP
- [ ] RateLimitMiddleware - Rate limiting com armazenamento em memória
- [ ] Catálogo de Erros - Códigos padronizados (COMERCIAL-001, etc.)
- [ ] ValidationPipeline - Pipeline de validação HTTP
- [ ] MetricsService - Infraestrutura de observabilidade
- [ ] Security Middlewares - CORS, Helmet, Compression, ETag, Cache-Control
- [ ] Testes de Integração - Testes para features de hardening

### Futuras Melhorias

- Integração com Redis para idempotência distribuída
- Integração com Prometheus para métricas
- Integração com ELK/Splunk para logs centralizados
- Implementação de Swagger UI
- Rate limiting distribuído
- Auditoria persistente em banco de dados

---

## Referências

- Documentação da API: `docs/API.md`
- OpenAPI Specification: `docs/openapi.json`
- Infraestrutura HTTP: `backend/shared/http/`
- Motor Comercial: `backend/motores/motor-comercial/`

---

## Suporte

Para dúvidas ou problemas relacionados à infraestrutura HTTP compartilhada, entre em contato com a equipe de arquitetura do CDS Sistemas.
