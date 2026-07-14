# Outbox Pattern — Motor Comercial

**Sprint:** P-2  
**Versão:** 1.0  
**Status:** Implementado

---

## Objetivo

Eliminar side effects externos dentro da transação SQLite. Toda comunicação com Bridges ocorre **somente após o commit**, via Outbox Pattern.

---

## Arquitetura Antiga

```
BEGIN TRANSACTION
  → Movimentações locais
  → Bridge Financeiro / Estoque / Cliente   ← dentro da transação
COMMIT
  → Eventos de domínio
```

**Problema:** se a Bridge falhasse antes do commit, ou o processo caísse após a Bridge e antes do commit, havia risco de inconsistência entre banco local e sistemas externos.

---

## Arquitetura Nova

```
BEGIN TRANSACTION
  → Movimentações locais
  → Registrar evento na tabela outbox_events
COMMIT
  → OutboxProcessor (Dispatcher)
  → Bridge Financeiro / Estoque
  → Marcar evento COMPLETED / FAILED
  → Eventos de domínio
```

---

## Componentes

| Componente | Local | Responsabilidade |
|------------|-------|------------------|
| `OutboxEvent` | `backend/shared/outbox/` | Modelo e status do evento |
| `OutboxRepository` | `backend/shared/outbox/` | Persistência transacional |
| `OutboxDispatcher` | `backend/shared/outbox/` | Executa handler por `eventType` |
| `OutboxProcessor` | `backend/shared/outbox/` | Retry, idempotência, status |
| `OutboxService` | `backend/shared/outbox/` | Fachada enfileirar + processar |
| `ComercialOutboxHandlers` | `motor-comercial/integrations/outbox/` | Mapeamento evento → Bridge |
| `OutboxController` | `motor-comercial/controllers/` | Endpoints de diagnóstico |

---

## Eventos Registrados

| Event Type | Bridge | Use Case |
|------------|--------|----------|
| `FinanceiroLancarReceita` | Financeiro | RegistrarVendaPrestacao |
| `FinanceiroRegistrarPagamento` | Financeiro | RegistrarPagamentoPrestacao |
| `FinanceiroRegistrarPerda` | Financeiro | RegistrarPerda |
| `EstoqueBaixarProduto` | Estoque | RegistrarEntregaConsignacao |
| `EstoqueEntradaDevolucao` | Estoque | RegistrarDevolucaoAntesPrestacao |
| `EstoqueTransferencia` | Estoque | TransferirItensEntreConsignacoes |

**Leituras** em `ClienteBridge` e `ProdutoBridge` permanecem **fora** da transação (validação prévia) — não são side effects.

---

## Fluxo Detalhado

1. Use Case chama `enfileirarBridgeOutbox(outboxEnqueue, evento)` **dentro** de `executarEscrita`.
2. `OutboxService.enfileirar` grava em `outbox_events` usando o **mesmo handle transacional** do UnitOfWork.
3. `UnitOfWork.commit()` confirma movimentações + evento outbox atomicamente.
4. `ConsignacaoWriteUseCase._processarOutboxAposCommit` invoca `OutboxProcessor.processarPorIds`.
5. Dispatcher executa handler registrado → Bridge adapter → plataforma CDS.
6. Repository atualiza status (`COMPLETED`, `FAILED`, `DEAD_LETTER`).

---

## Retry e Backoff

Configuração padrão (`OutboxConfiguration`):

- `maxAttempts`: 5
- `initialDelayMs`: 1000
- `maxDelayMs`: 30000
- `backoffMultiplier`: 2 (exponencial)

O processor reexecuta em modo síncrono imediatamente após o commit (compatibilidade com UX atual). Entre tentativas aplica backoff.

---

## Idempotência

Chave única: `idempotency_key = {eventType}:{correlationId}`

- Evento `COMPLETED` → dispatcher ignora reprocessamento.
- Inserção duplicada com mesma chave → retorna registro existente.

---

## Observabilidade

Cada dispatch registra:

- `correlationId`, `requestId`
- `eventType`, `bridgeName`
- `attempts`, `durationMs`
- `status`, `lastError`

---

## Endpoints de Diagnóstico (somente leitura)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/v1/comercial/outbox/status` | Resumo por status |
| GET | `/api/v1/comercial/outbox/pending` | Eventos pendentes |
| GET | `/api/v1/comercial/outbox/history` | Histórico com filtros |

---

## Modo Compatível (Sync Fallback)

Se `OutboxProcessor` estiver indisponível e `syncFallbackEnabled = true` (padrão), o processamento síncrono pós-commit continua tentando executar handlers registrados.

Sem `outboxService` configurado, os Use Cases **não** enfileiram eventos (ambiente de teste unitário isolado).

---

## Persistência

Migration `008_outbox.js` cria a tabela `outbox_events` com índices em `status`, `correlation_id` e `motor + created_at`.

---

## Auditoria Final (Sprint P-2)

| Pergunta | Resposta |
|----------|----------|
| Existe Bridge sendo chamada antes do commit? | **Não** — side effects Financeiro/Estoque passam pelo Outbox |
| Existe side effect externo dentro da transação? | **Não** — apenas INSERT em `outbox_events` |
| Existe operação de side effect sem Outbox? | **Não** — 6 use cases migrados |
| Leituras em bridges (Cliente/Produto)? | Permanecem fora da transação — não são side effects |

---

## Evolução Futura

A infraestrutura em `backend/shared/outbox/` está preparada para:

- Worker assíncrono em background
- Mensageria distribuída (RabbitMQ, Kafka)
- Microsserviços

Sem alterar contratos HTTP ou regras de negócio existentes.
