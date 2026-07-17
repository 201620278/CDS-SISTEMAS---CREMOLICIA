# COMERCIAL_FLOW_AUDIT_RC233 — Paridade Operacional Mobile × ERP Desktop

**Versão:** `2.3.3-rc2.3.3` · Build `20260717rc233`  
**Escopo:** Fluxo completo de consignação — Motor Comercial oficial (sem APIs novas)

---

## 1. Resumo executivo

O Comercial Mobile foi alinhado ao pipeline Desktop `carregarConsignacaoCompleta` + `mapConsignacaoView`, com ações filtradas por **status real** e **permissões RBAC** (`COMERCIAL_CONSIGNACAO`, `COMERCIAL_ACERTO`).

**Veredicto:** Paridade **operacional funcional** para o fluxo consignação ponta-a-ponta via celular, utilizando exclusivamente endpoints existentes do Motor Comercial e Motor Fiscal.

**Pendências de UI (by design mobile):** wizard 3 passos Desktop, simulação crédito LIP lateral, duplicar consignação, termo entrega PDF nativo.

---

## 2. Divergências encontradas (Desktop × Mobile RC2.3.2)

| Etapa | Desktop | Mobile antes | Mobile RC2.3.3 |
|-------|---------|--------------|----------------|
| Cliente no detalhe | `projections/situacao-cliente` | Fallback "Cliente" | ✔ Enriquecido |
| Total / saldo | `valorTotalEntregue`, `saldoAberto`, resumo prestação | Campos crus / zero | ✔ Mappers |
| Prestação ativa | `ENTREGUE` + saldo > 0 | Regex `ENTREGUE` = sempre ativo | ✔ `deriveComercialPhase` |
| Ações por status | Handlers + backend | Todos os botões visíveis | ✔ `buildOperacoesBar` |
| Histórico | `projections/historico` | Ausente | ✔ Card + botão |
| Conta corrente | `projections/conta-corrente` | Só na lista | ✔ Sheet no detalhe |
| DANFE / XML | `GET /fiscal/danfe/venda/:id` | Ausente | ✔ Share nativo |
| Permissões | `isOperadorAutorizado` | Só `canCreateComercial` | ✔ `isOperadorComercial` |
| Inclusão produto | LIP qty bar | Corrigido RC2.3.2 | ✔ Mantido |
| Bottom nav overlap | N/A desktop | Botões ocultos | ✔ Sticky ops + padding |

---

## 3. Fluxos corrigidos

### 3.1 Criação
- Cliente → `GET /clientes/buscar`
- Perfil → `GET /comercial/perfil-comercial?clienteId=&ativo=true`
- Criar → `POST /comercial/consignacoes` (payload Desktop)

### 3.2 RASCUNHO
- Adicionar item → `POST .../itens` / PUT soma duplicado
- Editar qty → `PUT .../itens/:id` `{ novaQuantidade, usuarioId }`
- Excluir → `DELETE .../itens/:id`
- Entregar → `POST .../entrega` (requer operador + itens)
- Cancelar → `DELETE .../consignacoes/:id`

### 3.3 ENTREGUE / Prestação
- Enriquecimento → `projections/resumo-prestacao`, `resumo-final`
- Abrir → `POST .../prestacao/abrir`
- Recebimento → `POST .../prestacao/venda`
- Perda → `POST .../prestacao/perda`
- Pagamento → `POST .../prestacao/pagamento`
- Encerrar → `POST .../prestacao/fechar`
- Venda oficial → `POST .../prestacao/finalizar-venda-oficial`
- NFC-e → `POST .../prestacao/emitir-nfce`

### 3.4 ENCERRADA
- Reabrir → `POST .../prestacao/reabrir` (+ motivo)
- DANFE → `GET /fiscal/danfe/venda/:vendaId`
- XML → campo `xmlAutorizado` do resumo fiscal

### 3.5 Consultas
- Histórico → `GET /comercial/projections/historico?consignacaoId=`
- Conta corrente → `GET /comercial/projections/conta-corrente?clienteId=&consignacaoId=`
- Situação cliente → `GET /comercial/projections/situacao-cliente?clienteId=`

---

## 4. Matriz de ações × status

| Status | Ações Mobile |
|--------|--------------|
| **RASCUNHO** | Adicionar / editar / excluir itens · Entregar · Cancelar |
| **ENTREGUE** (saldo > 0) | Abrir prestação · Recebimento · Perda · Pagamento · Encerrar · Venda oficial · NFC-e |
| **ENTREGUE** (saldo ≈ 0) | Abrir prestação |
| **ACERTADA / ENCERRADA** | Reabrir · Histórico · Conta corrente · DANFE/XML · Share |
| **CANCELADA** | Histórico |

Botões inválidos para o status **não são renderizados**.

---

## 5. Endpoints utilizados (exclusivamente oficiais)

```
GET  /api/comercial/consignacoes
GET  /api/comercial/consignacoes/:id
GET  /api/comercial/consignacoes/:id/itens
POST /api/comercial/consignacoes
POST /api/comercial/consignacoes/:id/itens
PUT  /api/comercial/consignacoes/:id/itens/:itemId
DEL  /api/comercial/consignacoes/:id/itens/:itemId
DEL  /api/comercial/consignacoes/:id
POST /api/comercial/consignacoes/:id/entrega
POST /api/comercial/consignacoes/:id/prestacao/abrir
POST /api/comercial/consignacoes/:id/prestacao/venda
POST /api/comercial/consignacoes/:id/prestacao/perda
POST /api/comercial/consignacoes/:id/prestacao/pagamento
POST /api/comercial/consignacoes/:id/prestacao/fechar
POST /api/comercial/consignacoes/:id/prestacao/finalizar-venda-oficial
POST /api/comercial/consignacoes/:id/prestacao/emitir-nfce
POST /api/comercial/consignacoes/:id/prestacao/reabrir
GET  /api/comercial/consignacoes/:id/prestacao/resumo-final
GET  /api/comercial/projections/situacao-cliente
GET  /api/comercial/projections/resumo-prestacao
GET  /api/comercial/projections/historico
GET  /api/comercial/projections/conta-corrente
GET  /api/comercial/perfil-comercial
GET  /api/clientes/buscar
GET  /api/produtos/search
GET  /api/fiscal/danfe/venda/:vendaId
```

---

## 6. Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `js/comercial-mappers.js` | **Novo** — mapConsignacaoView, deriveComercialPhase, normalizers |
| `js/pages/comercial.js` | Bundle completo, ações por status, DANFE/XML, histórico, CC |
| `js/permissions.js` | isOperadorComercial, canComercialAcerto, canComercialContaCorrente |
| `css/mobile.css` | Sticky ops, safe-area detalhe comercial |
| `js/version.js` | status `rc2.3.3-comercial-paridade` |
| `COMERCIAL_FLOW_AUDIT_RC233.md` | Este relatório |

---

## 7. Teste operacional (homologação manual)

Executar no celular com operador `COMERCIAL_CONSIGNACAO`:

1. Nova consignação → cliente → perfil → criar  
2. Adicionar 10 produtos (UN + KG decimal)  
3. Editar 3 quantidades · excluir 2  
4. Fechar e reabrir consignação → confirmar persistência  
5. Entregar  
6. Abrir prestação → recebimento → perda → pagamento  
7. Conta corrente (sheet) · histórico  
8. Encerrar / venda oficial  
9. Emitir NFC-e → compartilhar DANFE/XML (se autorizada)  
10. Reabrir (se ACERTADA e permitido)

> Teste automatizado E2E requer servidor + token — checklist acima é o critério de aceite operacional.

---

## 8. Etapas pendentes (escopo consciente)

| Item | Motivo |
|------|--------|
| Wizard 3 passos + simulação crédito LIP | UI Desktop densa — projeção UX, não bloqueia operação |
| Duplicar consignação | Menu Desktop — API existe, não exposta mobile |
| Termo entrega PDF | Client-side Desktop — share texto substitui |
| Cortesia / devolução grade | APIs existem — adicionar sheets se operação exigir |
| Liberação gerencial limite | Requer supervisor token — fluxo ERP modal |

---

## 9. Confirmação de paridade

✔ **Mesmos Motores e APIs** do ERP Desktop  
✔ **Mesmos payloads** (usuarioId, novaQuantidade, precoUnitario, etc.)  
✔ **Mesmas permissões** RBAC comercial  
✔ **Fluxo operacional completo** executável pelo celular  
✔ **Dados de cabeçalho** enriquecidos via projeções oficiais  

**Status:** APROVADO para homologação operacional RC2.3.3 (sujeito a smoke test físico Cremolia).

---

*CDS Sistemas · RC2.3.3 · Comercial Mobile Paridade · 2026-07-17*
