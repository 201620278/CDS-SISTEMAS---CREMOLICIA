# Resilience Enterprise — Motor Comercial

**Sprint:** P-3  
**Versão:** 1.0  
**Status:** Implementado

---

## Objetivo

Integrar definitivamente o pipeline oficial de resiliência da Plataforma CDS em **todas** as chamadas externas via Bridges, sem alterar regras de negócio, domínio, APIs públicas ou UX.

---

## Arquitetura

```
Use Case / Outbox Handler
        ↓
   Bridge (Proxy)
        ↓
 ResilienceChain
        ↓
   Fallback (opcional)
        ↓
      Retry
        ↓
 Circuit Breaker
        ↓
     Timeout
        ↓
 Platform Gateway
        ↓
    Resultado
```

Componentes existentes (Sprint 2.6) agora conectados ao pipeline oficial via `wrapBridgeWithResilience`.

---

## Componentes

| Componente | Responsabilidade |
|------------|------------------|
| `ResilienceConfiguration` | Configuração central (`maxRetries`, `timeout`, etc.) |
| `ResilienceRegistry` | Chain + Executor por Bridge |
| `ResilienceBridgeExecutor` | Executa com observabilidade |
| `ResilienceDiagnosticService` | Métricas e histórico |
| `wrapBridgeWithResilience` | Proxy em todas as Bridges |
| `RetryPolicy` | Retry exponencial |
| `CircuitBreaker` | Proteção contra falhas em cascata |
| `TimeoutPolicy` | Limite de tempo por chamada |
| `FallbackPolicy` | Resposta degradada (opcional) |
| `ResilienceChain` | Orquestra o pipeline |

---

## Bridges Integradas

Todas passam pelo `ResilienceChain` em `criarBridgeAdapters()`:

| Bridge | Operações |
|--------|-----------|
| `ClienteBridge` | `buscarPorId`, `estaAtivo` |
| `ProdutoBridge` | `buscarPorId`, `estaAtivo` |
| `FinanceiroBridge` | `registrarReceitaConsignacao`, `registrarRecebimento`, `registrarPerda`, etc. |
| `EstoqueBridge` | `registrarSaidaConsignacao`, `registrarEntradaConsignacao`, `registrarTransferencia` |
| `UsuarioBridge` | `possuiPermissao`, etc. |

Side effects via Outbox também utilizam Bridges já envolvidas com resiliência.

---

## Configuração

`ResilienceConfiguration` — valores padrão:

| Parâmetro | Padrão | Descrição |
|-----------|--------|-----------|
| `maxRetries` | 3 | Tentativas de retry |
| `retryDelay` | 1000 ms | Delay inicial |
| `maxRetryDelay` | 10000 ms | Delay máximo |
| `backoffMultiplier` | 2 | Backoff exponencial |
| `timeout` | 30000 ms | Timeout por chamada |
| `breakerThreshold` | 5 | Falhas para abrir circuit |
| `cooldown` | 60000 ms | Cooldown do circuit breaker |
| `fallbackEnabled` | **false** | Fallback desabilitado por padrão (compatibilidade) |

Configuração global e por bridge:

```javascript
criarResilienceConfiguration({
  global: { maxRetries: 3, timeout: 30000 },
  bridges: {
    Financeiro: { maxRetries: 5, fallbackEnabled: true }
  }
});
```

---

## Observabilidade

Cada chamada registra em `ResilienceDiagnosticService`:

- `correlationId`, `requestId`
- `bridge`, `operacao`
- `tentativas`, `durationMs`
- `circuitState`, `circuitOpen`, `timeout`
- `fallback`, `erro`

---

## Diagnóstico (somente leitura)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/v1/comercial/resilience/status` | Status geral do pipeline |
| GET | `/api/v1/comercial/resilience/statistics` | Estatísticas por bridge |
| GET | `/api/v1/comercial/resilience/circuit-breakers` | Estado dos circuit breakers |

---

## Retry

`RetryPolicy` retenta em erros de rede/timeout (`ECONNRESET`, `ETIMEDOUT`, etc.) com backoff exponencial configurável.

---

## Circuit Breaker

Estados: `CLOSED` → `OPEN` → `HALF_OPEN` → `CLOSED`

Após `breakerThreshold` falhas, o circuit abre e rejeita chamadas até `cooldown`.

---

## Timeout

`TimeoutPolicy` cancela operações que excedem `timeout` configurado.

---

## Fallback

Quando `fallbackEnabled: true`, erros são capturados e retorna envelope:

```json
{
  "_resilienceFallback": true,
  "bridge": "Financeiro",
  "operation": "unknown",
  "motivo": "...",
  "deferred": true
}
```

**Padrão desabilitado** para preservar comportamento funcional existente.

---

## Compatibilidade

- APIs públicas inalteradas
- Contratos de Bridge inalterados
- Fallback desabilitado por padrão
- Fluxo Outbox + Bridges mantido
- Testes existentes compatíveis

---

## Auditoria Final (Sprint P-3)

| Pergunta | Resposta |
|----------|----------|
| Bridge sem ResilienceChain? | **Não** — `criarBridgeAdapters` envolve todas com `wrapBridgeWithResilience` |
| Chamada externa sem Retry? | **Não** — `RetryPolicy` em toda chain |
| Chamada sem Timeout? | **Não** — `TimeoutPolicy` em toda chain |
| Chamada sem Circuit Breaker? | **Não** — `CircuitBreaker` em toda chain |
| Chamada sem Fallback configurável? | **Não** — `fallbackEnabled` configurável (padrão: off) |

---

## Evolução

O pipeline está preparado para integrações remotas, microsserviços e ambientes distribuídos, com diagnóstico centralizado e configuração por bridge.
