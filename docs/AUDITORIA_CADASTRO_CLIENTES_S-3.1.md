# Sprint S-3.1 — Relatório de Auditoria Enterprise: Cadastro de Clientes

**Data:** 2026-07-08  
**Escopo:** Ciclo completo Cadastro → Validação → Persistência → Relacionamentos → Projeções → Listagens → Edição → Exclusão  
**Modo:** Auditoria somente leitura — **nenhuma correção aplicada**

---

## 1. Resumo executivo

O cadastro mestre de clientes existe **apenas no ERP** (`/api/clientes`), implementado como rota monolítica sem camada de domínio. O Motor Comercial **não cadastra clientes** — apenas cria **Perfis Comerciais** vinculados a clientes ERP existentes e consome projeções.

Os problemas de persistência e exibição têm **causa raiz estrutural**: dois domínios de crédito/limite independentes, ausência de enriquecimento da API de perfil com dados do cadastro ERP, stubs de atualização no backend comercial, e mapeamentos incorretos no gateway de plataforma.

| Área | Status |
|------|--------|
| Persistência ERP (campos do formulário) | ✅ Grava corretamente (exceto coluna legada `endereco`) |
| Persistência Perfil Comercial | ⚠️ Parcial — `observacoes` no PUT não persiste |
| Relacionamentos | ⚠️ Integridade parcial — DELETE ERP não valida vínculos comerciais |
| APIs | ⚠️ Inconsistências POST vs PUT, DTOs informais |
| Frontend ERP | ✅ Funcional com bugs menores de UX |
| Frontend Comercial | ❌ Listagem/360° com dados incompletos |
| Projeções | ⚠️ Conta Corrente incompatível com Cliente 360 |
| Listagens vs consulta | ❌ Informações divergentes entre ERP e Comercial |

---

## 2. Arquitetura auditada

```
┌─────────────────────────────────────────────────────────────────┐
│  ERP Frontend (clientes.js / PDV clientes.js)                   │
│  POST/PUT/GET/DELETE → /api/clientes                            │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  backend/rotas/clientes.js  →  SQLite: clientes                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
  contas_receber         vendas          perfil_comercial
  (fiado ERP)                           consignacoes
         │                   │                   │
         └───────────────────┴───────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Motor Comercial: ClientePlatformGateway (read-only)           │
│  Perfil Comercial CRUD + 12 Projection Services               │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Frontend PerfilComercial (Central 360°)                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Persistência

### 3.1 Tabela `clientes` (ERP)

**Arquivo:** `backend/database.js` (linhas 1357–1374)

| Coluna | Gravada no POST/PUT? | Exibida no frontend? |
|--------|----------------------|----------------------|
| `nome` | ✅ Obrigatória | ✅ |
| `cpf_cnpj` | ✅ | ✅ |
| `telefone` | ✅ | ✅ |
| `email` | ✅ | ✅ |
| `cep`, `rua`, `numero`, `bairro`, `cidade`, `uf` | ✅ | ✅ Form + detalhe |
| `limite_credito` | ✅ | ✅ |
| `credito_atual` | INSERT=0; atualizado por vendas/financeiro | ✅ Somente leitura |
| `created_at` | Auto | ✅ Somente detalhe |
| `endereco` (legado TEXT) | ❌ **Nunca escrita** | ❌ |

**Arquivo de rotas:** `backend/rotas/clientes.js`

### 3.2 Perfil Comercial

**Tabela:** `perfil_comercial` — **Arquivo:** `backend/motores/motor-comercial/migrations/001_perfil_comercial.js`

| Campo UI (Novo/Editar Perfil) | API | Persistido? |
|-------------------------------|-----|-------------|
| `clienteId` | POST | ✅ |
| `perfilTipo` | POST | ✅ |
| `limiteComercial` | POST / PATCH limite | ✅ |
| `observacoes` | POST | ✅ |
| `observacoes` | PUT | ❌ **Stub ignora** |
| `ativo` | PUT | ✅ (via ativar/inativar) |
| `motivo` (bloqueio) | PATCH bloquear | ❌ **Frontend não envia** |

**Causa raiz do PUT de perfil:** `bootstrapUseCases.js:81-88` — `atualizarPerfilComercialUseCase` é stub que só alterna `ativo`; não existe `AtualizarPerfilComercialUseCase`.

### 3.3 Campos opcionais ERP

Todos os campos opcionais do formulário ERP são persistidos. Não há campos de classificação, status comercial ou múltiplos contatos/endereços no schema — **fora do escopo atual do banco**.

---

## 4. Relacionamentos

| Relacionamento | FK / vínculo | Integridade na exclusão | Observação |
|----------------|--------------|-------------------------|------------|
| Cliente × Vendas | `vendas.cliente_id` | ✅ Bloqueia DELETE | `clientes.js:203-214` |
| Cliente × Contas a Receber | `contas_receber.cliente_id` | ❌ Não verificado no DELETE | Pode falhar por FK ou órfãos |
| Cliente × Perfil Comercial | `perfil_comercial.cliente_id` | ❌ Não verificado | Unique `(cliente_id, perfil_tipo)` |
| Cliente × Consignação | `consignacoes.cliente_id` | ❌ Não verificado | RESTRICT na migration |
| Cliente × Conta Corrente (comercial) | Via consignações + ledger | N/A | Projeção exige `consignacaoId` |
| Cliente × Histórico | `HistoricoProjectionService` | N/A | Agrega por `clienteId` |
| Cliente × Pendências | `PendenciasProjectionService` | N/A | Links para `/clientes/:id` |
| Cliente × Recomendações | `RecommendationService` | N/A | Filtra por `clienteId` |

**Impacto:** Exclusão de cliente ERP pode falhar silenciosamente (500 SQLite) ou deixar inconsistência se FKs não estiverem ativas.

---

## 5. APIs auditadas

### 5.1 ERP `/api/clientes`

| Método | Entrada | Saída | Problemas |
|--------|---------|-------|-----------|
| GET `/` | — | `SELECT *` raw | Expõe coluna legada `endereco` |
| GET `/:id` | id | Row + endereço normalizado | OK |
| GET `/buscar` | `termo` | id, nome, cpf, telefone | Auth duplicada; carrega todos e filtra em memória |
| POST `/` | 11 campos | `{ id, message }` | CPF normalizado; duplicidade 409 |
| PUT `/:id` | 11 campos | `{ message }` | **CPF sem normalização; sem check duplicidade** |
| DELETE `/:id` | id | `{ message }` | Só checa vendas |

**Inconsistência de erro:** POST duplicado retorna `{ success: false, message }`; demais erros usam `{ error }`. Frontend lê apenas `error` → mensagem genérica (`clientes.js:266`).

### 5.2 Motor Comercial `/api/comercial/perfil-comercial`

| Método | DTO entrada | DTO saída | Problemas |
|--------|-------------|-----------|-----------|
| GET list | Filtros paginação | `PerfilResponse[]` | **Sem join `clientes`** — falta nome/CPF |
| POST | `CriarPerfilRequest` | Perfil | OK |
| PUT | `AtualizarPerfilRequest` | Perfil | **`observacoes` ignorado** |
| PATCH bloquear | `motivo` obrigatório | Perfil | **UI não envia `motivo`** |
| PATCH limite | `novoLimite` | Perfil | OK |

**Arquivos:** `http/dto/PerfilDTO.js`, `controllers/PerfilComercialController.js`, `repositories/PerfilComercialRepository.js`

### 5.3 ClientePlatformGateway (leitura)

**Arquivo:** `bridges/platform/ClientePlatformGateway.js`

| Campo gateway | Origem DB | Bug |
|---------------|-----------|-----|
| `documento` | `cpf_cnpj` | Nomenclatura diferente da API ERP |
| `endereco.logradouro` | `endereco` (legado) | CRUD grava `rua`, não `endereco` |
| `endereco.estado` | `row.estado` | **Coluna é `uf`** → sempre null |
| `bloqueado` | hardcoded `false` | Ignora `perfil_comercial.bloqueado` |
| `ativo` | hardcoded `true` | Parcialmente corrigido por contas vencidas |

---

## 6. Frontend auditado

### 6.1 ERP — `frontend/erp/js/clientes.js` (espelhado em `frontend/pdv/js/clientes.js`)

**Payload create/update:** nome, cpf_cnpj, telefone, email, cep, rua, numero, bairro, cidade, uf, limite_credito.

| Comportamento | Status |
|---------------|--------|
| Grid refresh após save | ✅ `loadClientes()` |
| Erro CPF duplicado | ❌ Lê `error`, API retorna `message` |
| Busca client-side | ⚠️ CPF formatado na carga inicial; **raw após filtro** (linhas 58 vs 98) |
| Endereço no detalhe | ✅ |
| PDV após save | ⚠️ `loadClientes()` injeta lista no `#page-content` — pode quebrar layout PDV |

### 6.2 Motor Comercial — `pages/PerfilComercial/index.js`

| Comportamento | Status |
|---------------|--------|
| Cadastro ERP | ❌ Não existe — só perfil comercial |
| Lista de perfis | ❌ Mostra `clienteId` no lugar do nome |
| CPF/Score na grid | ❌ `'-'` — API não retorna |
| Bloquear perfil | ❌ Falha — sem `motivo` |
| Editar observações | ❌ PUT não persiste |
| Cliente 360° | ⚠️ 12 projeções; Conta Corrente falha com só `clienteId` |
| Paginação | ❌ Importada mas UI não renderizada |
| URL `/clientes/:id` | ⚠️ Ambíguo — perfil id ou cliente id |

**Mapper:** `perfilMappers.js` — espera `clienteNome`, `cpfCnpj`, `telefone`, `score` que a API não fornece.

---

## 7. Banco de dados — consistência enviado × gravado × retornado

### Fluxo ERP (cadastro completo)

```
Formulário → POST/PUT JSON → clientes.* → GET SELECT * → Grid/Modal
```

✅ Consistente para campos do formulário (exceto `endereco` legado).

### Fluxo Perfil Comercial

```
Dialog → POST perfil → perfil_comercial.* → GET perfil (sem join) → Grid (sem nome)
Dialog → PUT observacoes → STUB (só ativo) → observacoes inalterado
```

❌ Quebra na camada de atualização e enriquecimento de listagem.

### Dualidade de limites (causa raiz transversal)

| Conceito | ERP (`clientes`) | Comercial (`perfil_comercial`) |
|----------|------------------|--------------------------------|
| Limite | `limite_credito` | `limite_comercial` |
| Saldo aberto | `credito_atual` (fiado) | `saldo_aberto` (consignação) |
| Uso | PDV, contas a receber | Consignação, projeções, bloqueio |

**Não há sincronização** ao salvar cliente ERP ou criar perfil.

---

## 8. Projeções relacionadas a clientes

| Projeção | Parâmetro | Compatível com Cliente 360? | Observação |
|----------|-----------|-------------------------------|------------|
| `situacao-cliente` | `clienteId` | ✅ | Base do 360° |
| `dashboard` | `clienteId` opcional | ✅ | |
| `saldos` | `clienteId` | ✅ | |
| `historico` | `clienteId` | ✅ | |
| `timeline` | `clienteId` / datas | ✅ | Corrigido em sprint anterior |
| `indicadores` | `clienteId` | ✅ | |
| `insights` | `clienteId` | ✅ | |
| `pendencias` | `clienteId` | ✅ | |
| `recomendacoes` | `clienteId` | ✅ | |
| `playbooks` | `clienteId` | ✅ | |
| `workflow` | `clienteId` | ✅ | |
| **`conta-corrente`** | **`consignacaoId` obrigatório** | ❌ | Frontend envia `clienteId` (`PerfilComercial/index.js:396`) |

**Arquivo:** `ContaCorrenteProjectionService.js:22-24`

Frontend mapper (`perfilMappers.js`) também espera campos não produzidos por `SituacaoClienteDTO` (`limiteUtilizado`, `ultimaCompra`, `diasSemMovimentacao`, etc.) — preenchidos com fallback `-`.

---

## 9. Listagens — consistência

| Contexto | Nome cliente | CPF | Endereço | Limite | Status/Bloqueio |
|----------|--------------|-----|----------|--------|-----------------|
| ERP lista | ✅ | ✅ formatado* | ❌ | `limite_credito` | ❌ |
| ERP detalhe | ✅ | ✅ | ✅ | ✅ | ❌ |
| Comercial lista | ❌ (id) | ❌ | ❌ | `limite_comercial` | ⚠️ duplicado |
| Comercial 360° | ⚠️ parcial | ⚠️ | ❌ | ✅ | ✅ projeção |
| ERP busca `/buscar` | ✅ | ✅ | ❌ | ❌ | ❌ |
| Comercial busca ERP | ✅ | ✅ | ❌ | ❌ | ❌ |

\* Formatação inconsistente após filtro local.

---

## 10. Logs recomendados (próxima fase — não implementados)

Pontos sugeridos para diagnóstico em homologação:

| Ponto | Arquivo | O que logar |
|-------|---------|-------------|
| Entrada POST/PUT | `backend/rotas/clientes.js` | Body recebido vs campos persistidos |
| Saída GET perfil | `PerfilComercialController.js` | Campos retornados vs join esperado |
| PUT perfil stub | `bootstrapUseCases.js:81` | Campos descartados (`observacoes`) |
| Bloquear sem motivo | `BloquearPerfilComercialUseCase.js:25` | Payload recebido |
| Gateway endereço | `ClientePlatformGateway.js:38-44` | `rua` vs `endereco`, `uf` vs `estado` |
| Conta corrente 360 | `ProjectionController.js` | `clienteId` vs `consignacaoId` |
| Frontend save | `clientes.js:255`, `PerfilComercial/index.js:1007` | Payload enviado / resposta |

Prefixo sugerido: `[AUDIT-S3.1][CLIENTES]`.

---

## 11. Código legado — marcar para remoção/consolidação

| Item | Arquivo | Ação recomendada |
|------|---------|------------------|
| Coluna `endereco` | `database.js` | Migrar para `rua` ou remover |
| `ClienteBridge.js` vs `ClienteBridgeAdapter` | `bridges/` | Consolidar em adapter |
| `ContaCorrenteController.js` | controllers | Stub vazio — implementar ou remover |
| `registrarBridgesLegados()` | `bootstrapUseCases.js:126+` | Remover após consolidação |
| `frontend/pdv/js/clientes.js` | PDV | Extrair módulo compartilhado |
| `atualizarPerfilComercialUseCase` stub | `bootstrapUseCases.js:81` | Substituir por use case real |
| Auth duplicada `/buscar` | `clientes.js:27` | Remover `autenticarToken` interno |
| Documentação `/api/v1/comercial` | docs/API.md | Alinhar com `/api/comercial` |

---

## 12. Problemas encontrados — matriz completa

| ID | Problema | Causa raiz | Impacto | Prioridade |
|----|----------|------------|---------|------------|
| **P0-01** | Lista Comercial exibe ID em vez do nome | `PerfilComercialRepository.listar` sem JOIN `clientes`; frontend espera `clienteNome` | Operador não identifica clientes | **P0** |
| **P0-02** | Bloquear perfil falha silenciosamente | UI não envia `motivo`; use case exige (`BloquearPerfilComercialUseCase:25`) | Bloqueio comercial inoperante | **P0** |
| **P0-03** | Editar observações do perfil não persiste | Stub `atualizarPerfilComercialUseCase` ignora `observacoes` | Dados comerciais perdidos | **P0** |
| **P0-04** | Conta Corrente no Cliente 360 falha | `ContaCorrenteProjectionService` exige `consignacaoId`; UI envia `clienteId` | Seção financeira vazia/erro | **P0** |
| **P1-01** | Dois modelos de limite/crédito | ERP `limite_credito` vs comercial `limite_comercial` sem sync | Decisões comerciais com dados divergentes | **P1** |
| **P1-02** | Gateway mapeia endereço errado | `logradouro←endereco` (vazio), `estado←estado` (coluna inexistente) | Bridges/consignação com endereço null | **P1** |
| **P1-03** | PUT cliente sem normalizar/validar CPF | Assimetria POST vs PUT em `clientes.js` | CPF duplicado ou formatado no banco | **P1** |
| **P1-04** | DELETE cliente não valida vínculos comerciais | Só checa `vendas` | Exclusão parcial ou erro SQLite | **P1** |
| **P1-05** | Dois modelos de bloqueio | ERP (contas vencidas) vs `perfil_comercial.bloqueado` vs gateway hardcoded | Status inconsistente entre telas | **P1** |
| **P2-01** | Erro 409 CPF duplicado mal exibido | API `{ message }` vs UI lê `{ error }` | UX confusa no cadastro ERP | **P2** |
| **P2-02** | CPF formatado só na carga inicial | Filtro local não usa `formatarCpfCnpj` | Grid inconsistente após busca | **P2** |
| **P2-03** | POST/PUT retornam só mensagem | Sem entidade atualizada | Frontend depende de reload | **P2** |
| **P2-04** | Paginação perfil não renderizada | `Pagination` importado, UI ausente | Lista truncada em 20 itens | **P2** |
| **P2-05** | URL `/clientes/:id` ambígua | Perfil id vs cliente id | Navegação confusa, bookmarks quebrados | **P2** |
| **P2-06** | PDV save chama `loadClientes()` | Reuso do módulo ERP | Layout PDV corrompido após cadastro | **P2** |
| **P2-07** | SituacaoClienteDTO vs frontend mapper | Campos esperados não projetados | KPIs 360° com `-` | **P2** |
| **P3-01** | Coluna `endereco` legada | Schema antigo | Dados mortos no banco | **P3** |
| **P3-02** | Código duplicado ERP/PDV clientes | Copy-paste | Manutenção dobrada | **P3** |
| **P3-03** | `/perfis` e `/clientes` idênticos | Rotas redundantes | Confusão de nomenclatura | **P3** |
| **P3-04** | Busca Novo Perfil não filtra telefone | `buscarClientesErp` incompleto | UX de busca incompleta | **P3** |

---

## 13. Correções recomendadas (planejamento — Sprint S-3.2+)

### Fase 1 — P0 (bloqueadores operacionais)

1. **Enriquecer listagem de perfil:** JOIN `clientes` no repository ou camada de aplicação → retornar `clienteNome`, `cpfCnpj`, `telefone`.
2. **Implementar `AtualizarPerfilComercialUseCase`** real com persistência de `observacoes`.
3. **Corrigir bloqueio:** UI solicita `motivo` + envia no PATCH; ou relaxar validação com motivo padrão documentado.
4. **Conta Corrente 360:** Estender projeção para aceitar `clienteId` (agregar consignações) **ou** frontend passa `consignacaoId` da consignação ativa.

### Fase 2 — P1 (integridade estrutural)

5. **Documentar e expor dualidade de limites** na UI (rótulos distintos: "Limite Fiado ERP" vs "Limite Comercial") ou sincronizar via evento de domínio.
6. **Corrigir `ClientePlatformGateway`:** `logradouro ← rua`, `estado ← uf`, `bloqueado ← perfil_comercial`.
7. **Simetria POST/PUT clientes:** normalizar CPF, validar duplicidade no PUT.
8. **DELETE clientes:** validar `perfil_comercial`, `consignacoes`, `contas_receber` antes de excluir.

### Fase 3 — P2/P3 (qualidade e débito técnico)

9. Unificar tratamento de erro 409 no frontend ERP.  
10. Extrair `clientes.js` compartilhado ERP/PDV.  
11. Renderizar paginação na lista comercial.  
12. Padronizar URLs (`/clientes/:clienteId` vs `/perfis/:perfilId`).  
13. Migrar/remover coluna `endereco`.

---

## 14. Arquivos envolvidos (índice)

| Camada | Arquivo |
|--------|---------|
| ERP API | `backend/rotas/clientes.js` |
| Schema | `backend/database.js` |
| Gateway | `backend/motores/motor-comercial/bridges/platform/ClientePlatformGateway.js` |
| Perfil DI | `backend/motores/motor-comercial/infrastructure/di/bootstrapUseCases.js` |
| Perfil DTO | `backend/motores/motor-comercial/http/dto/PerfilDTO.js` |
| Perfil Controller | `backend/motores/motor-comercial/controllers/PerfilComercialController.js` |
| Perfil Repository | `backend/motores/motor-comercial/repositories/PerfilComercialRepository.js` |
| Bloquear UC | `backend/motores/motor-comercial/usecases/perfil/BloquearPerfilComercialUseCase.js` |
| Conta Corrente Proj. | `backend/motores/motor-comercial/services/projections/ContaCorrenteProjectionService.js` |
| Situação Proj. | `backend/motores/motor-comercial/services/projections/SituacaoClienteProjectionService.js` |
| Rotas comercial | `backend/motores/motor-comercial/routes/comercial.routes.js` |
| ERP Frontend | `frontend/erp/js/clientes.js` |
| PDV Frontend | `frontend/pdv/js/clientes.js` |
| Comercial UI | `frontend/modules/motor-comercial/pages/PerfilComercial/index.js` |
| Comercial Mapper | `frontend/modules/motor-comercial/pages/PerfilComercial/perfilMappers.js` |
| Comercial API | `frontend/modules/motor-comercial/api/MotorComercialApi.js` |

---

## 15. Critérios de aceite — checklist

| Critério | Atendido |
|----------|----------|
| Fluxo completamente auditado | ✅ |
| Relacionamentos verificados | ✅ |
| Persistência validada | ✅ |
| APIs auditadas | ✅ |
| Frontend auditado | ✅ |
| Banco auditado | ✅ |
| Relatório técnico gerado | ✅ |
| Correções planejadas por causa raiz | ✅ |
| Nenhuma correção aplicada nesta sprint | ✅ |

---

## 16. Próximo passo sugerido

Abrir **Sprint S-3.2 — Correções Estruturais do Cadastro de Clientes** priorizando itens **P0-01 a P0-04**, com testes de integração cobrindo o ciclo cadastro ERP → perfil comercial → listagem → 360° → bloqueio.
