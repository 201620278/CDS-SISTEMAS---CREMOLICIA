# HOTFIX — Recuperação de Consignação Interrompida

**Data:** 12/07/2026  
**Tipo:** Hotfix genérico (não específico de um ID)  
**Caso:** Homologação — Preparar Entrega → Entrega → fechar ERP → reabrir → operação não concluía

---

## Diagnóstico (perguntas obrigatórias)

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | Existe no banco? | **Sim** (fluxo homologado persistiu cabeçalho + itens via POST) |
| 2 | Status? | **`RASCUNHO`** (entrega não confirmada) |
| 3 | Checkpoint Recovery? | **Parcial / frágil** — podia existir, mas não era necessário e às vezes era destruído |
| 4 | Draft associado? | **Não** após o primeiro persist (rebind `draft-*` → id real) |
| 5 | Documento parcial? | **Sim** — número `CONS-…` gerado; consignação em rascunho |
| 6 | Autorização pendente? | **Independente** — se houvesse, RFC-03 já cobre; não era o bloqueio típico |
| 7 | Etapa que impede conclusão? | **Checklist da Entrega:** `itensCadastrados = false` porque a UI recebia `itens = []` |

---

## Causa raiz

A consignação e os itens **estavam no banco**. O Recovery Framework **não era o dono dos dados** e tentava complementar a UI.

Porém:

1. `GET /consignacoes/:id` (**`ConsignacaoResponse.toJSON`**) **não devolvia `itens`**.
2. **Não havia** `GET /consignacoes/:id/itens` exposto (UC-009 existia, sem rota).
3. Após fechar o ERP, `sessionStorage` some.
4. Se o checkpoint local também faltasse / estivesse vazio / fosse **sobrescrito** por `saveEntrega({ itens: [] })` após um load parcial, a tela de Entrega abria **sem itens**.
5. Checklist bloqueava **Entregar** → operador não concluía sem recriar a operação.

```
Banco: consignação RASCUNHO + linhas em consignacoes_itens  ✅
API:   GET :id sem itens                                    ❌
UI:    itens=[] → checklist falha                           ❌
```

O Recovery **não conseguia reconstruir só pela API** porque a API oficial de leitura omitia exatamente o que a entrega precisa.

---

## Correção (genérica — qualquer operação interrompida)

### 1. Backend — expor itens na leitura oficial

| Arquivo | Mudança |
|---------|---------|
| `controllers/ConsignacaoController.js` | `consultarPorId` passa a incluir `itens`; novo `consultarItens` |
| `routes/comercial.routes.js` | `GET /consignacoes/:id/itens` |
| `infrastructure/di/bootstrapUseCases.js` | wiring `consultarItensConsignacaoUseCase` |

Sem mudança de regra comercial: apenas **lê** o que já estava persistido.

### 2. Frontend — consumir API como fonte de verdade

| Arquivo | Mudança |
|---------|---------|
| `api/MotorComercialApi.js` | `listarItensConsignacao()` |
| `utils/operacional.js` | `carregarConsignacaoCompleta` usa itens do GET / fallback `listarItens` |
| `recovery/loaders.js` | mesma ordem API-first |
| `recovery/index.js` | `saveEntrega` **não sobrescreve** itens válidos com `[]` |
| `pages/NovaConsignacao/index.js` | autosave também em observação/documento (P2 auditoria) |

### 3. Testes

`tests/recovery/HOTFIX.recuperacao.consignacao.test.js`

---

## Por que o Recovery não reconstruía

| Camada | Comportamento anterior |
|--------|------------------------|
| API | Sem itens no GET |
| Provider/projeção | Resumo de prestação costuma **não** ter itens em `RASCUNHO` pré-entrega |
| Checkpoint | Opcional; podia estar ausente após troca de browser/perfil/limpeza |
| Cache sessionStorage | Apagado ao fechar ERP |
| `saveEntrega` | Podia **gravar itens vazios** e apagar o único fallback local |

Sem dados em nenhuma camada da ordem oficial → UI sem itens → entrega travada.

---

## Como evita recorrência

1. **API oficial devolve itens** → qualquer cliente (com ou sem checkpoint) reconstrói.
2. **GET `/itens`** como endpoint dedicado (UC-009).
3. **Checkpoint deixa de ser obrigatório** para concluir entrega após reboot.
4. **Merge defensivo** no `saveEntrega` impede auto-sabotagem do checkpoint.
5. Funciona para **qualquer** consignação `RASCUNHO` interrompida na Entrega — não há hardcode de ID.

---

## Como o operador conclui agora

1. Abrir ERP → Motor Comercial → Consignações (ou rota `/consignacoes/{id}/entrega`).
2. Abrir a consignação em **Rascunho** → **Entregar**.
3. Recovery faz `resume` + load; API traz itens/documento/status.
4. Checklist libera → confirmar Entrega → impressão → Fechar Atendimento.

**Não é necessário** recriar a consignação nem manipular o banco.

---

## Validação

```text
npm run test:motor-comercial-frontend -- --testPathPatterns="HOTFIX.recuperacao|recovery"
```

Reiniciar o backend para carregar a nova rota/DI antes de testar no browser.
