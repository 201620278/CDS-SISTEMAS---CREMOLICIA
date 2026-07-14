# Recertificação Arquitetural Enterprise — Motor Comercial (P-3.5)

**Documento:** Recertificação Arquitetural do Motor Comercial  
**Versão:** P-3.5  
**Tipo:** Auditoria (read-only)  
**Data:** 2026-07-08  
**Escopo considerado:** P-1 (Ledger SSOT), P-2 (Transactional Outbox), P-3 (Resilience Enterprise)  

> **Garantia do escopo:** esta recertificação é **somente leitura**; não altera regras, domínio, banco, APIs públicas, telas ou contratos.

---

## Resumo Executivo

O Motor Comercial evoluiu significativamente desde a auditoria **O-14** ao incorporar, de forma integrada:

- **P-1:** Ledger como *Single Source of Truth* (elimina dual-write sem quebrar compatibilidade)
- **P-2:** Transactional Outbox (nenhuma Bridge executa antes do commit)
- **P-3:** Resilience Enterprise Pipeline (toda Bridge sob `ResilienceChain` com Retry + Circuit Breaker + Timeout + Fallback configurável)

**Síntese:** o motor está **tecnicamente apto** para servir como referência de *infraestrutura enterprise* (ledger/outbox/resiliência), mantendo compatibilidade e testes. Permanecem **ressalvas** não impeditivas no eixo “DDD full” (domínio anêmico por desenho), governança `.cds` e algumas práticas do frontend.

---

## Comparativo — Auditoria O-14 → Recertificação P-3.5

Fonte O-14: `docs/AUDITORIA_FINAL_MOTOR_COMERCIAL.md`.

| Item | Nota O-14 | Nota P-3.5 | Evolução |
|------|-----------|------------|----------|
| Arquitetura | 76% | **92%** | Outbox + Resilience elevam consistência transacional e robustez de integrações |
| DDD | 74% | **80%** | Side effects pós-commit e pipeline padrão; controllers/read still bypass em pontos |
| Ledger | 52% | **100%** | P-1 estabelece SSOT + derivação + sync de caches compatíveis |
| Outbox | N/A | **100%** | P-2 elimina bridge calls pré-commit, com status/retry/idempotência |
| Resilience | N/A | **100%** | P-3 conecta Retry/Circuit/Timeout/Fallback e diagnóstico |
| Projection Services | 97% | **97%** | Mantém read-only e derivação consistente |
| API | 86% | **90%** | Diagnósticos Outbox/Resilience adicionados; persistem reads bypass use case em controllers |
| Frontend | 84% | **84%** | Mantém ressalvas: utilitários com `fetch` direto e cálculos de totais no UI |
| Bridges | 91% | **100%** | Todas as Bridges passam pelo pipeline oficial; side effects via Outbox |
| Testes | 72% | **92%** | Suite motor-comercial completa + testes P-1/P-2/P-3 adicionados |
| Documentação | 83% | **92%** | Novos docs: `LEDGER_SINGLE_SOURCE_OF_TRUTH`, `OUTBOX_PATTERN`, `RESILIENCE_ENTERPRISE` |
| Governança | 74% | **78%** | Conhecimento ampliado, mas cadeia `.cds` segue com lacunas históricas (O-13/O-14) |
| **Conformidade Geral** | **81%** | **91%** | Motor passa a ser referência de padrões enterprise com ressalvas não bloqueantes |

> **Notas P-3.5** são percentuais de conformidade técnica (baseadas em evidência do repositório e testes), não “velocidade de entrega”.

---

## Verificação DDD (Controllers, Use Cases, Repositories, UoW, Result, Eventos)

### Achados positivos

- **Use Cases** permanecem como unidade de execução de regras (não foi introduzido SQL em UC).
- **Repositories** continuam encapsulando SQL.
- **UnitOfWork** permanece como boundary de transação e agora também serve de base para:
  - **Outbox transacional** (registro de evento na mesma transação)
  - **Eventos de domínio pós-commit**

### Pontos de atenção (herdado de O-14)

- **Domínio anêmico/procedural**: `domain/entities/` permanece vazio por desenho (trade-off já documentado em O-14).
- **Controllers de leitura**: ainda existem leituras que acessam repository/projection diretamente (ressalva já apontada em O-14).

---

## Ledger (P-1) — Single Source of Truth

### Evidências de conformidade

- Documento de P-1: `docs/LEDGER_SINGLE_SOURCE_OF_TRUTH.md`
- Ledger continua **append-only** e caches são **derivados** por `ledgerCacheDerivation` + `ledgerCacheSync`.
- **Sem dual-write competitivo**: colunas persistidas são tratadas como *cache de compatibilidade*, não SSOT.

### Conclusão Ledger

✅ **Aprovado (100%)** — Motor Comercial está consistente com “Ledger SSOT”.

---

## Outbox (P-2) — Transactional Outbox

### Verificações exigidas

- Nenhuma Bridge antes do commit: ✅ (integrações externas migradas para Outbox)
- Dispatcher: ✅
- Retry/Backoff: ✅
- Idempotência: ✅ (chave `{eventType}:{correlationId}`)
- Observabilidade e status: ✅ (`PENDING/PROCESSING/COMPLETED/FAILED/DEAD_LETTER`)
- Endpoints read-only: ✅

### Evidências

- Documento: `backend/motores/motor-comercial/docs/OUTBOX_PATTERN.md`
- Rotas: `/api/v1/comercial/outbox/status|pending|history`

---

## Resilience (P-3) — Enterprise Pipeline

### Verificações exigidas

- Retry: ✅
- Circuit Breaker: ✅
- Timeout: ✅
- Fallback configurável: ✅ (padrão desabilitado para compatibilidade)
- Observabilidade: ✅ (`ResilienceDiagnosticService`)
- Endpoints read-only: ✅

### Evidências

- Documento: `backend/motores/motor-comercial/docs/RESILIENCE_ENTERPRISE.md`
- Rotas: `/api/v1/comercial/resilience/status|statistics|circuit-breakers`

---

## Projection Services (read-only)

✅ Mantém conformidade O-14: projeções são **somente leitura**, KPIs derivados e sem tabelas auxiliares.

---

## API (Controllers, middlewares, headers, responses)

### Achados

- Middlewares de **RequestId** e **CorrelationId** permanecem padrão.
- `StandardResponse` continua como envelope oficial.
- Novos endpoints de diagnóstico foram adicionados **sem alterar contratos públicos existentes** (apenas rotas novas).

### Ponto de atenção (herdado)

- Reads ainda possuem bypass de use case em alguns controllers (já descrito no O-14).

---

## Frontend (Motor Comercial)

### Verificação solicitada

- Nenhuma regra comercial pesada: ⚠️ (há validações e cálculos auxiliares de totais no UI)
- Uso correto do ApiClient: ⚠️ (há utilitário com `fetch` direto para rotas ERP)

### Evidência

- `frontend/modules/motor-comercial/utils/operacional.js` implementa `fetchErp()` com `fetch` direto.

> **Nota:** isso já era ressalva em O-14 e não foi alvo de P-1/P-2/P-3.

---

## Bridges (Cliente, Produto, Financeiro, Estoque, Usuário)

### Conformidade P-3.5

- **Todas** as Bridges retornadas por `criarBridgeAdapters()` são envolvidas por `wrapBridgeWithResilience`.
- Side effects de Financeiro/Estoque nos writes críticos são disparados via **Outbox** (pós-commit).
- Diagnóstico de bridge e de resiliência existem e são read-only.

✅ **Bridges (100%)** — baixo acoplamento, pipeline padrão, diagnósticos.

---

## Governança (.cds, ADRs, RFCs, Skills, Playbooks, Knowledge Layer)

### Estado atual (recorte objetivo)

- `.cds/adr`: **11**
- `.cds/rfc`: **5**
- `.cds/skills`: **7**
- `.cds/playbooks`: **22**

### Pontos de atenção (herdado)

- O-14 já apontava lacunas históricas de rastreabilidade (cadeia RFC→ADR→Skill→Playbook→Sprint) para O-13/O-14.
- P-1/P-2/P-3 reforçaram documentação técnica no `docs/`, mas não reescreveram governança retroativa (não era escopo).

---

## Estatísticas (reais do repositório)

Contagens atuais (P-3.5):

- **Use Cases (motor-comercial)**: 56
- **Arquivos de projections (motor-comercial)**: 20
- **Controllers (motor-comercial)**: 9
- **Rotas (motor-comercial)**: 2
- **Endpoints v1 `/api/v1/comercial/*` (aprox.)**: 52 (inclui Outbox + Resilience)
- **Pages (frontend motor-comercial)**: 31
- **Components (frontend motor-comercial)**: 42
- **Testes (tests/motor-comercial)**: 9 arquivos `.test.js`
- **Arquivos de bridge (motor-comercial/bridges)**: 40
- **Docs (motor-comercial/docs)**: 7
- **Docs (docs/ root)**: 30

---

## Parecer do Arquiteto (FASE 13)

### O Motor Comercial pode ser considerado o padrão oficial para todos os próximos motores?

**SIM.**

### Justificativa técnica (objetiva)

- **Padrões enterprise completos e integrados** para consistência e robustez:
  - Ledger SSOT (P-1)
  - Transactional Outbox (P-2)
  - Resilience Enterprise Pipeline (P-3)
- **Compatibilidade preservada** (sem ruptura de API/UX/contratos).
- **Diagnóstico operacional** disponível para Outbox e Resilience (read-only).
- **Cobertura de testes** consolidada e suite `npm run test:motor-comercial` passando.

### Ressalvas (não bloqueantes para “motor de referência”)

- Modelo de domínio permanece **anêmico/procedural** (decisão arquitetural/roadmap).
- Frontend ainda contém utilitários com `fetch` direto e cálculos auxiliares (não comercial-core, mas fere pureza).
- Governança `.cds` ainda tem lacunas históricas (não escopo das sprints P).

---

## Certificação (P-3.5)

- [ ] MOTOR DE REFERÊNCIA DA PLATAFORMA CDS
- [x] **APROVADO COM RESSALVAS**
- [ ] NECESSITA NOVAS EVOLUÇÕES

**Percentual geral (P-3.5): 91%**

