# RFC-02 — Homologação Oficial do Recovery Framework

**Plataforma:** CDS Sistemas  
**Escopo:** Recovery Framework (Fase 1) + Motor Comercial (Preparar Entrega / Entrega)  
**Data:** 12/07/2026  
**Tipo:** Homologação (sem novas funcionalidades de produto)  
**Evidência automatizada:** `frontend/modules/motor-comercial/tests/recovery/RFC02.homologacao.recovery.test.js` (15/15)  
**Referências:** RFC-01 · `frontend/shared/recovery/docs/RECOVERY_FRAMEWORK.md` · `AUDITORIA_RECUPERACAO_OPERACIONAL.md`

---

## Veredito

### HOMOLOGADO COM RESSALVAS

O Recovery Framework **funciona** para retomar Preparar Entrega e Entrega **após persistência** (checkpoint durável em `localStorage` + APIs oficiais), sem depender obrigatoriamente de `sessionStorage`.

Não atende 100% dos critérios absolutos da RFC-02: há gaps de UX em fluxos negativos, autorização gerencial ainda presa a `sessionStorage`, status `AGUARDANDO_IMPRESSAO` não utilizado no fluxo real, e `FECHAR_ATENDIMENTO` sem integração de tela.

| Critério RFC-02 | Resultado |
|-----------------|-----------|
| Nenhum fluxo perdido | **PARCIAL** — perdido se operador não salvou / liberação gerencial / Fechar Atendimento |
| Nenhum operador precisa reiniciar operação | **PARCIAL** — OK após save; falha nos gaps acima |
| Nenhuma tela depende exclusivamente do frontend | **PARCIAL** — cabeçalho via API; itens ainda complementados pelo checkpoint (API não devolve itens) |
| Recovery Framework homologado | **SIM, com ressalvas** |
| Plataforma preparada para NF-e | **SIM** — API/`Registry` reutilizáveis |

---

## Matriz de cenários obrigatórios

| # | Cenário | Resultado | Evidência |
|---|---------|----------|-----------|
| C1 | Preparar Entrega → fechar ERP → reabrir | **PASS*** | Checkpoint + step + itens retomados após `savePrepararEntrega` |
| C1b | Preparar sem salvar | **FAIL** | Sem checkpoint; trabalho só em memória JS |
| C2 | Entrega (aguardando impressão/confirmação) | **PASS*** | Itens, valores, documento reconstruídos via API+checkpoint |
| C2b | Status `AGUARDANDO_IMPRESSAO` | **PARCIAL** | Fluxo grava `AGUARDANDO_CONFIRMACAO`; enum existe, mas não é setado |
| C3 | Após impressão → reabrir | **PASS** | Permanece pendente; Entrega retomável |
| C4 | Após autorização gerencial → fechar ERP | **FAIL** | Liberação em `sessionStorage`; some ao fechar ERP; fora do checkpoint |
| C5 | Consignação removida | **FAIL (UX)** | Erro técnico; sem *"A operação não pode mais ser retomada."*; checkpoint órfão permanece |
| C6 | Checkpoint corrompido | **PASS** | Itens inválidos ignorados; reconstrói via API; store JSON inválido não quebra |
| C7 | API desligada | **PARCIAL** | Checkpoint **não apagado** + `listPending` OK; UX sem *"não foi possível reconstruir"* |
| C8 | Interrupções (salvar/imprimir/entrega/concluir) | **PASS*** | Pendente até `complete`; após entrega `completeOperacoesEntrega` |
| C8b | Fechar Atendimento | **FAIL** | Operação registrada; **sem loader e sem tela** |

\* Condicionado a haver persistência/`save` prévio do checkpoint.

---

## Detalhamento por cenário

### Preparar Entrega

**Esperado:** continuar exatamente do ponto onde parou.

**Resultado:** **PASS** se o operador salvou rascunho / concluiu preparação (dispara `savePrepararEntrega`). Ao reabrir:

1. `listPending` / `consignacaoId` → `resumePrepararEntrega`
2. Loader chama `obterConsignacao` + projeções
3. Itens vêm do checkpoint quando a API não os devolve
4. `checkpoint.step` restaura o momento do fluxo

**FAIL** se apenas adicionou produtos **sem salvar**: não há `entityId`/checkpoint — trabalho perdido (mesmo gap P0 da auditoria REC, agora mitigado **somente pós-persistência**).

### Entrega

**Esperado:** tela reconstruída (itens, valores, documento, botão), sem reiniciar.

**Resultado:** **PASS** após checkpoint de Entrega/Preparar.

- Documento: API (`mapConsignacaoView`)
- Itens/valores: checkpoint Recovery (API `GET` sem itens)
- Checklist/`Entregar`: desbloqueia se itens recuperados
- Botões de impressão na conclusão do Preparar: estado `concluido` no checkpoint

**PARCIAL** quanto a “Aguardando impressão”: o status oficial `AGUARDANDO_IMPRESSAO` **não é gravado**; usa-se `AGUARDANDO_CONFIRMACAO`.

### Após impressão

**Resultado:** **PASS** — impressão não conclui a operação; recovery permanece ativo; reabrir Entrega continua o fluxo de confirmação.

### Após autorização gerencial

**Resultado:** **FAIL**

| Camada | Comportamento |
|--------|----------------|
| `autorizacaoGerencial.js` | `sessionStorage` (`cds-mc-liberacao-limite:{id}`) |
| Checkpoint Recovery | **não** inclui liberação |
| Fechar ERP | sessionStorage limpo → exige nova autorização |

### Fluxos negativos

**Resultado:** **FAIL (UX)**

- Loader rejeita com erro técnico (`Consignação não encontrada`)
- Telas: `Erro ao carregar rascunho/consignação: …`
- Frase oficial RFC-02 **ausente**
- Checkpoint continua em `listPending` (órfão)

### Corrupção

**Resultado:** **PASS**

- `checkpoint.itens` não-array → ignorado; API prevalece
- JSON do store inválido → store vazio, sem throw
- Tela não quebra no caminho API-first

### APIs desligadas

**Resultado:** **PARCIAL**

| Requisito | Status |
|-----------|--------|
| Mostrar operação pendente (`listPending`) | PASS |
| Não apagar checkpoint | PASS |
| Informar que não foi possível reconstruir | FAIL (copy oficial ausente; erro genérico na UI) |

### Testes de interrupção

| Momento | Recovery | Nota |
|---------|----------|------|
| Salvar | PASS | Checkpoint em `RASCUNHO` / `EM_ANDAMENTO` |
| Imprimir | PASS | Não remove pendência |
| Entrega (antes de confirmar) | PASS | `AGUARDANDO_CONFIRMACAO` |
| Concluir entrega | PASS | `complete` → fora de `listPending` |
| Fechar Atendimento | FAIL | Não integrado |

---

## Auditoria arquitetural

| Pergunta | Resposta |
|----------|----------|
| Recovery depende do banco? | **Parcialmente.** Cabeçalho/status via API (banco). Itens na UI dependem do **checkpoint** porque `GET /consignacoes/:id` não devolve itens (sem alteração de API na Fase 1). |
| Depende apenas do checkpoint? | **Não.** Loader é API-first. |
| Reconstrói somente pela API? | **Não** para itens (gap de contrato REST). Sim para metadados da consignação. |
| Ainda preso a `sessionStorage`? | **Sim, residual:** cache auxiliar de itens + **liberação gerencial** + rascunho de cadastro de cliente (fora do escopo Preparar/Entrega). |
| Ainda preso a estado JS? | **Sim** antes do primeiro `save`/persist. |
| Ainda preso a contexto de navegação? | **Não** para retomar a operação (usa Recovery/`entityId`). Contexto ainda afeta *voltar*/rotas 360. |

### Fontes de verdade (ordem efetiva)

```
API (cabeçalho) → Projeção (itens se houver) → Recovery checkpoint → sessionStorage (auxiliar)
```

---

## Performance

| Indicador | Achado |
|-----------|--------|
| Tempo médio (suite Jest, mocks) | &lt; 2 s por retomada simulada; tipicamente &lt; 50 ms em mock |
| Chamadas | Resume Entrega + `carregarConsignacaoCompleta` → **`obterConsignacao` duplicado** (≥ 2) + perfil/situação/resumo |
| Duplicidade | **Confirmada** no caminho Entrega |
| Memory leak | Buffer de auditoria limitado (200); sem evidência de leak no framework |
| Console | `console.info` intencional em eventos `RECOVERY_*` (não é erro) |

**Produção:** tempo real depende de rede/API; não medido em browser nesta sprint.

---

## Console (caminho feliz homologado)

| Tipo | Resultado |
|------|----------|
| ReferenceError | Não observado na suíte |
| TypeError | Não observado na suíte |
| Promise rejeitada não tratada | Não no caminho feliz; rejeição esperada em C5/C7 no loader |
| Loop | Não observado |
| Warning | `console.info` de auditoria Recovery (ruído esperado) |

---

## Preparação para NF-e

| Item | Status |
|------|--------|
| `RecoveryManager` genérico por `module`/`operation` | OK |
| `RecoveryRegistry.registerModule` / `registerLoader` | OK |
| Status oficiais reutilizáveis | OK |
| Sem acoplamento de storage ao Motor Comercial | OK (`cds-recovery:v1`) |
| Integração NF-e nesta sprint | Fora de escopo (estrutura pronta) |

---

## Gaps priorizados (sprints futuras — não corrigidos nesta homologação)

| Prioridade | Gap | Impacto |
|------------|-----|---------|
| P0 | Liberação gerencial fora do Recovery (`sessionStorage`) | Operador reautoriza após fechar ERP |
| P0 | Trabalho pré-save sem checkpoint | Perda de itens não persistidos |
| P1 | Mensagens oficiais C5/C7 | Erro técnico / checkpoint órfão |
| P1 | `GET` itens / DTO com itens | Eliminar dependência de checkpoint para itens |
| P2 | Status `AGUARDANDO_IMPRESSAO` no fluxo real | Rastreio fino do momento |
| P2 | Deduplicar chamadas no resume Entrega | Performance |
| P2 | Integrar `FECHAR_ATENDIMENTO` | Cobertura operacional completa |

---

## Evidências de teste

```text
npm run test:motor-comercial-frontend -- --testPathPatterns=RFC02.homologacao
# Test Suites: 1 passed
# Tests:       15 passed
```

Arquivo: `frontend/modules/motor-comercial/tests/recovery/RFC02.homologacao.recovery.test.js`

Ajuste técnico mínimo durante homologação (sem feature nova): `register.js` reentra registro se o `RecoveryRegistry` foi resetado (necessário para testes e hot-reload).

---

## Conclusão

O Recovery Framework da **RFC-01 está apto ao uso operacional** em Preparar Entrega e Entrega **depois que a operação foi persistida/checkpointada**, e a plataforma está **estruturalmente pronta para NF-e**.

A homologação **não é plena** enquanto:

1. a autorização gerencial não sobreviver ao fechar o ERP via Recovery;
2. fluxos negativos/API down não tiverem UX oficial;
3. itens continuarem inacessíveis só pela API REST atual.

**Status final:** **HOMOLOGADO COM RESSALVAS** — liberado para operação assistida; gaps P0/P1 devem entrar no backlog de estabilização antes de declarar “zero perda de trabalho” como garantia de produto.
