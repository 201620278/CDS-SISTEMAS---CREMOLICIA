# Checklist Enterprise — Motor Comercial

**Sprint:** O-12 — Certificação Enterprise  
**Versão do motor:** `O-12-enterprise`  
**Data:** 2026-07-08  
**Escopo:** Homologação e estabilização (sem novas funcionalidades)

---

## Legenda

| Símbolo | Significado |
|---------|-------------|
| ✅ | Atendido / verificado |
| ⚠️ | Atendido com ressalvas documentadas |
| ❌ | Pendente (não bloqueia homologação controlada) |
| N/A | Fora do escopo desta sprint |

---

## 1. Arquitetura

| Item | Status | Evidência |
|------|--------|-----------|
| Separação HTTP → Controller → UseCase → Domain | ✅ | `backend/motores/motor-comercial/` |
| Bootstrap via `inicializar()` / `encerrar()` | ✅ | `index.js`, `server.js` |
| DI container centralizado | ✅ | `infrastructure/di/bootstrapComercial.js` |
| Rotas versionadas `/api/v1/comercial` | ✅ | `routes/comercial.routes.js` |
| Frontend modular com bundle IIFE | ✅ | `frontend/modules/motor-comercial/bootstrap/` |
| Integração ERP via `MotorComercialBundle` | ✅ | `scripts/build-motor-comercial.js` |
| Arquivos órfãos identificados | ⚠️ | `AcertoController.js`, `ContaCorrenteController.js` (stubs); `http/middlewares/*` local duplicado e não referenciado |
| Imports circulares críticos | ✅ | Nenhum ciclo bloqueante detectado na auditoria |
| Duplicações estruturais | ⚠️ | Middlewares HTTP locais vs `shared/http/middlewares` (rotas usam shared) |

---

## 2. DDD / Domínio

| Item | Status | Evidência |
|------|--------|-----------|
| Use Cases Perfil (UC-001–011) | ✅ | 18 testes passando |
| Use Cases Consignação Fase 1 (UC-001–010) | ✅ | 16 testes passando |
| Use Cases Consignação Fase 2 (UC-011–018) | ✅ | 10 testes passando |
| Use Cases Consignação Fase 3 (UC-019–027) | ✅ | 16 testes passando |
| Ledger como fonte de verdade | ✅ | Movimentações comerciais + perfil |
| Projection Services read-only | ✅ | 12 testes passando |
| Catálogo de erros de domínio | ✅ | `domain/errors/ErrorCatalog.js` |
| Bridges com contratos | ✅ | `domain/contracts/bridges/` |
| Bridges HTTP reais | ⚠️ | 23 TODOs com fallback mock (homologação com dados simulados) |
| Novos Use Cases nesta sprint | ✅ | Nenhum (conforme escopo O-12) |

---

## 3. Performance

| Área | Meta operacional | Status | Observações |
|------|------------------|--------|-------------|
| Dashboard | Projeções paralelas, refresh ~60s | ⚠️ | Baseline documentado; medição em runtime depende de ambiente cliente |
| Workflow Center | Agregação de 3 projeções | ⚠️ | Endpoint único `GET /projections/workflow` |
| Cliente 360° (Perfil Comercial) | Múltiplas projeções sob demanda | ⚠️ | Drawer carrega contexto incremental |
| Conta Corrente | Ledger + filtros | ✅ | Projection dedicada testada |
| Central (Pendências/Recomendações/Playbooks) | Read-only projections | ✅ | Sem escrita no domínio |
| Workflow Drawer | Lazy load de contexto | ✅ | Timeline, pendências, CC sob demanda |
| Timeline | Ordenação cronológica | ✅ | Teste unitário de ordem |
| Filtros | Client-side + query params | ✅ | Mappers em cada página |
| Bundle frontend | < 1 MB (esbuild) | ✅ | **764,6 KB** (`motor-comercial.bundle.js`) |
| Lazy loading de rotas ERP | N/A | ⚠️ | Bundle único; code-splitting futuro |

---

## 4. UX

| Item | Status | Evidência |
|------|--------|-----------|
| Loading states | ✅ | `components/base/Loading.js`, `withLoading` |
| Empty states | ✅ | `components/base/EmptyState.js` em páginas principais |
| Skeleton | ⚠️ | Componente existe; uso parcial nas páginas |
| Error feedback | ✅ | Toast + Alert; sem `alert/confirm/prompt` nativos no módulo |
| Responsividade | ⚠️ | Layout dashboard; validação manual recomendada em tablet |
| Navegação ERP | ✅ | `ERP_ROUTE_MAP` em `bootstrap/index.js` |
| Acessibilidade | ⚠️ | Sem auditoria WCAG formal; labels básicos em formulários |
| Workflow Kanban + Drawer | ✅ | Sprint O-11 |
| Feedback operacional | ✅ | ToastContext, LoadingContext |

---

## 5. API

| Item | Status | Evidência |
|------|--------|-----------|
| Endpoints registrados | ✅ | 49 rotas em `comercial.routes.js` |
| StandardResponse | ✅ | Controllers + `shared/http/responses/StandardResponse` |
| RequestId | ✅ | `RequestIdMiddleware` (shared) |
| CorrelationId | ✅ | `CorrelationIdMiddleware` (shared) |
| Idempotência | ✅ | `IdempotencyMiddleware` em rotas mutáveis |
| Paginação | ✅ | `historico`, listagens com `limite`/`offset` |
| DTOs HTTP | ✅ | `http/dto/`, mappers |
| Documentação API.md | ⚠️ | Atualizada com projeções O-8–O-11; ver `docs/API.md` |
| OpenAPI (`openapi.json`) | ⚠️ | Parcialmente sincronizado |
| Rate Limit nas rotas comerciais | ⚠️ | Infra em `shared/http`; não aplicada globalmente nas rotas |
| Autenticação JWT nas rotas | ⚠️ | Middleware global do ERP; documentar por ambiente |
| Testes integração API (Jest) | ❌ | Requer `jest` + `supertest` (não instalados) |

### Endpoints — resumo

| Grupo | Qtd |
|-------|-----|
| Health / version / status | 3 |
| Perfil Comercial | 10 |
| Consignação + itens + operações + prestação | 22 |
| Projections | 14 |

---

## 6. Segurança

| Item | Status | Evidência |
|------|--------|-----------|
| Controllers sem SQL direto | ✅ | Repositories isolados |
| Validação de entrada | ✅ | Use cases + validators |
| Erros de domínio tipados | ✅ | `DomainError` hierarchy |
| Secrets no repositório | ✅ | Nenhum `.env` commitado |
| CORS / Security headers | ⚠️ | Configuração no servidor principal |
| Bridges com circuit breaker | ✅ | `bridges/resilience/` |
| Estado operacional workflow em localStorage | ⚠️ | Apenas UX; não afeta domínio |

---

## 7. Documentação

| Documento | Status | Caminho |
|-----------|--------|---------|
| README backend | ✅ | `backend/motores/motor-comercial/README.md` |
| API REST | ✅ | `backend/motores/motor-comercial/docs/API.md` |
| API Hardening | ✅ | `backend/motores/motor-comercial/docs/API_HARDENING.md` |
| Bridges | ✅ | `backend/motores/motor-comercial/docs/BRIDGES.md` |
| Infraestrutura / Persistência | ✅ | `docs/INFRAESTRUTURA.md`, `PERSISTENCIA.md` |
| Frontend Architecture | ✅ | `frontend/modules/motor-comercial/docs/FRONTEND_ARCHITECTURE.md` |
| Dashboard | ✅ | `frontend/.../docs/DASHBOARD.md` |
| Cliente / Perfil 360° | ✅ | `frontend/.../docs/PERFIL_COMERCIAL.md` |
| Conta Corrente | ✅ | `frontend/.../docs/CONTA_CORRENTE_COMERCIAL.md` |
| Workflow Center | ✅ | `docs/WORKFLOW_CENTER.md` |
| Playbooks / Pendências / Recomendações | ✅ | Docs em `frontend/.../docs/` |
| Relatório Enterprise | ✅ | `docs/MOTOR_COMERCIAL_ENTERPRISE.md` |
| Checklist Enterprise | ✅ | Este documento |

---

## 8. Testes

| Suite | Runner | Status | Qtd |
|-------|--------|--------|-----|
| Perfil Use Cases | Node assert | ✅ | 18/18 |
| Consignação Fase 1 | Node assert | ✅ | 16/16 |
| Consignação Fase 2 | Node assert | ✅ | 10/10 |
| Consignação Fase 3 | Node assert | ✅ | 16/16 |
| Projection Services | Node assert | ✅ | 12/12 |
| Workflow Service | Node assert | ✅ | 3/3 |
| **Total Node (certificação)** | `npm run test:motor-comercial` | ✅ | **75/75** |
| Bridges unit | Jest | ❌ | Requer dependências |
| API integration | Jest + supertest | ❌ | Requer dependências |
| Hardening integration | Jest + supertest | ❌ | Requer dependências |
| Frontend pages (14 arquivos) | Jest + jsdom | ❌ | Requer dependências |

**Comando unificado:** `npm run test:motor-comercial`

---

## 9. Build

| Item | Status | Evidência |
|------|--------|-----------|
| Script build | ✅ | `npm run build:motor-comercial` |
| esbuild bundle | ✅ | Exit code 0 |
| Tamanho bundle | ✅ | 764,6 KB (+ sourcemap 1,1 MB) |
| Global export | ✅ | `window.MotorComercial` |
| Source maps | ✅ | `.map` gerado |
| Duplicações no bundle | ⚠️ | Análise manual; aceitável para v1 |

---

## 10. Deploy / Homologação

| Item | Status | Observações |
|------|--------|-------------|
| Migrations 001–007 | ✅ | SQLite via `migrations/index.js` |
| Bootstrap servidor | ✅ | `motorComercial.inicializar()` |
| Bundle no ERP | ✅ | Carregar `motor-comercial.bundle.js` |
| Feature flags | ⚠️ | `config/comercialFlags.js` — revisar por ambiente |
| Bridges mock vs real | ⚠️ | Homologação inicial com mocks; integração HTTP em sprint futura |
| Monitoramento / APM | N/A | Responsabilidade da plataforma CDS |
| Rollback | ✅ | Migrations versionadas; bundle versionado |

---

## Critérios de Aceitação O-12

| Critério | Status |
|----------|--------|
| Nenhum import quebrado | ✅ |
| Nenhum TODO crítico de domínio | ✅ |
| Nenhum `console.log` em produção (frontend + bootstrap backend) | ✅ |
| Testes Node passando | ✅ (75/75) |
| Build funcionando | ✅ |
| Bundle validado | ✅ |
| APIs auditadas | ⚠️ (docs + wiring OK; Jest pendente) |
| UX auditada | ⚠️ (componentes OK; WCAG parcial) |
| Documentação concluída | ✅ |
| Checklist Enterprise concluído | ✅ |

---

## Pendências pós-certificação (não bloqueantes)

1. Instalar `jest`, `supertest`, `jsdom` e habilitar suites de integração/frontend.
2. Implementar chamadas HTTP reais nas Bridges (23 TODOs).
3. Aplicar `RateLimitMiddleware` nas rotas comerciais em produção.
4. Sincronizar `openapi.json` com todos os endpoints.
5. Code-splitting do bundle frontend para reduzir carga inicial.
6. Remover stubs órfãos (`AcertoController`, middlewares locais duplicados).
7. Auditoria WCAG formal nas telas comerciais.

---

## Assinatura de certificação

| Papel | Status |
|-------|--------|
| Arquitetura consolidada | ✅ Apto |
| Homologação controlada (mock bridges) | ✅ Apto |
| Produção cliente real (bridges HTTP) | ⚠️ Após integração externa |

**Resultado:** Motor Comercial **certificado para homologação enterprise controlada** na Plataforma CDS (Sprint O-12).
