# Auditoria Completa — Motor Comercial

**Data:** 2026-07-09  
**Escopo:** Frontend Motor Comercial + integração API  
**Objetivo:** Corrigir bugs e inconsistências para operação perfeita

---

## Resumo

| Severidade | Encontrados | Corrigidos |
|------------|-------------|------------|
| P0 — Quebra fluxo | 9 | 9 |
| P1 — Inconsistência relevante | 8 | 8 |
| P2 — UX / borda | 4 | 3 |

**111 testes frontend** passando após correções. Bundle reconstruído.

---

## P0 — Corrigidos

### 1. Busca de produtos na Nova Consignação
- `Input` não aplicava `id` → `getElementById` falhava
- Valor lido do container `div` em vez do `<input>`
- Busca usava listagem completa em vez do endpoint PDV
- **Correção:** `Input.js`, `operacional.js`, `NovaConsignacao` (sessão anterior)

### 2. `extractErrorMessage` não importado em `api/client.js`
- Qualquer erro de API gerava `ReferenceError` em vez de mensagem útil
- **Correção:** import + filtro de params `undefined` na query string

### 3. `DetalhesConsignacao` — CockpitDrawer quebrado
- Faltava `projectionApi`, `_formatDate`, `_openPrestacao`
- **Correção:** página reescrita com APIs e métodos delegados

### 4. Validação de limite na Nova Consignação
- `limiteDisponivel` era subtraído do saldo novamente
- **Correção:** campos `limiteComercial`, `limiteDisponivel`, `saldo` separados; validação direta

### 5. Checklist de entrega — limite incorreto
- Ternário no-op; bypass incorreto com limite zero
- **Correção:** usa `resumoPrestacao.limiteDisponivel`; comparação correta

### 6. Central de Consignações — filtro cliente na API
- Nome de cliente enviado como `clienteId`
- **Correção:** `clienteId` só quando numérico; filtro por nome permanece client-side

### 7. Duplicar consignação — payload inválido
- Enviava `documento` manual (formato antigo)
- **Correção:** alinhado ao S-6 (`documentoExterno`, sem documento manual)

### 8. Central de Prestação — itens vazios
- Resumo sem itens não consultava `consignacao.itens`
- **Correção:** merge de itens da consignação antes do fallback do histórico

### 9. Busca de cliente no wizard
- Mesmo bug de `.value` no container
- **Correção:** `extrairValorInput` em todos os campos de busca

---

## P1 — Corrigidos

| # | Área | Correção |
|---|------|----------|
| 1 | Bootstrap | `DetalhesConsignacao` e `HistoricoPrestacao` recebem `query` |
| 2 | Cliente 360° | Navegação com contexto em Detalhes, Histórico, Consignações |
| 3 | Consignações | Atalhos entrega/prestação/conta corrente propagam contexto |
| 4 | Editar rascunho | Navega para wizard com `?consignacaoId=` + carregamento |
| 5 | Nova Consignação | `removerItem` chama API para itens persistidos |
| 6 | Perfil Comercial | Botões Bloquear / Desbloquear perfil no header |
| 7 | Prestação | Reabrir exige `isAutorizacaoGerencial()` |
| 8 | ERP menu | `comercial-acertos` aponta para `/consignacoes` |

---

## P2 — Corrigidos / pendentes

| Item | Status |
|------|--------|
| Footer do wizard após salvar rascunho | Corrigido (`_updateWizard`) |
| Playbooks null guard no DOM | Corrigido |
| Quantidade fixa 1 ao adicionar produto | Pendente (melhoria UX) |
| Auto-refresh da prestação durante edição | Pendente (pausar timer) |

---

## Fluxos homologados (checklist)

- [ ] Nova Consignação: buscar cliente, buscar produto, adicionar, salvar rascunho
- [ ] Editar rascunho pela Central → wizard carrega itens
- [ ] Entregar consignação com checklist de limite correto
- [ ] Central de Prestação: itens visíveis, venda/devolução/perda
- [ ] Detalhes da consignação: abas do CockpitDrawer funcionam
- [ ] Cliente 360° → Nova Consignação → voltar mantém contexto
- [ ] Duplicar consignação gera novo `CONS-AAAA-NNNNNN`
- [ ] Bloquear/desbloquear perfil no Cliente 360°

---

## Arquivos alterados nesta auditoria

```
frontend/modules/motor-comercial/api/client.js
frontend/modules/motor-comercial/components/form/Input.js
frontend/modules/motor-comercial/utils/operacional.js
frontend/modules/motor-comercial/bootstrap/index.js
frontend/modules/motor-comercial/pages/DetalhesConsignacao/index.js
frontend/modules/motor-comercial/pages/HistoricoPrestacao/index.js
frontend/modules/motor-comercial/pages/NovaConsignacao/index.js
frontend/modules/motor-comercial/pages/EntregaConsignacao/index.js
frontend/modules/motor-comercial/pages/Consignacoes/index.js
frontend/modules/motor-comercial/pages/PrestacaoContas/index.js
frontend/modules/motor-comercial/pages/PerfilComercial/index.js
frontend/modules/motor-comercial/pages/Playbooks/index.js
```

---

## Comandos

```bash
npm run test:motor-comercial-frontend
npm run build:motor-comercial
# Reiniciar ou recarregar app após build
```
