# Regra Oficial — Crédito Comercial (Plataforma CDS)

**Status:** Oficial — Single Source of Truth (SSOT)  
**Sprint:** STAB-02 — Consolidação do SSOT do Crédito Comercial  
**SSOT:** `backend/motores/motor-comercial/services/CreditoComercialService.js`  
**Orquestração:** `backend/motores/motor-comercial/services/sincronizarCreditoComercial.js`

---

## Arquitetura SSOT

```
Ledger Comercial (movimentações)
        ↓
CreditoComercialService.calcular()     ← única fórmula
        ↓
sincronizarCreditoComercial()          ← 1 calc + 1 sync + 1 evento + 1 auditoria
        ↓
┌───────────────────────────────────────┐
│  perfil.saldo_aberto (cache)          │
│  evento CREDITO_COMERCIAL_RECALCULADO │
│  auditoria CREDITO_COMERCIAL_RECALCULADO │
└───────────────────────────────────────┘
        ↓
APIs / Projeções / Situação do Cliente
        ↓
Frontend (apenas apresenta)
```

**Declaração oficial:** `CreditoComercialService` é a única fonte de verdade para:

- Crédito Disponível
- Saldo Devedor
- Saldo Credor
- Limite Comercial (lido do perfil; não recalculado)

Qualquer cálculo paralelo em frontend, mapper, endpoint ou tela é **violação arquitetural**.

---

## Conceitos

| Conceito | Definição |
|----------|-----------|
| **Limite Comercial** | Valor fixo concedido ao cliente. Só muda com usuário autorizado. |
| **Saldo Devedor Atual** | Exposição comercial atual (Conta Corrente + estoque consignado). |
| **Saldo Credor** | Excesso de pagamentos sobre vendas. |
| **Crédito Disponível** | Quanto ainda pode ser utilizado agora. |

### Fórmula obrigatória (imutável nesta sprint)

```
Crédito Disponível = Limite Comercial − Saldo Devedor Atual
```

O Crédito Disponível **nunca** ultrapassa o Limite Comercial.

### Saldo Devedor Atual

```
Saldo Devedor =
  max(0, Σ VENDA_PRESTACAO − Σ PAGAMENTO)                         // Conta Corrente (AR)
+ max(0, Σ ENTREGA − Σ DEVOLUCAO − Σ VENDA − Σ PERDA − Σ CORTESIA) // estoque consignado
```

---

## Fluxo único por operação

Cada operação comercial que altera o ledger deve gerar **exatamente**:

1. **1 cálculo** — `CreditoComercialService.calcular`
2. **1 sincronização** — atualização de `perfil.saldo_aberto`
3. **1 evento** — `CREDITO_COMERCIAL_RECALCULADO`
4. **1 auditoria** — ação `CREDITO_COMERCIAL_RECALCULADO`

Implementação: `sincronizarCreditoComercial(uow, eventos, consignacao, { origem })`.

**Nunca** chamar sync de cache + evento manual + auditoria em sequência paralela na mesma operação.

### Origens padronizadas

| Operação | `origem` do evento |
|----------|-------------------|
| Entrega | `ENTREGA` |
| Devolução | `DEVOLUCAO` |
| Venda na prestação | `VENDA_PRESTACAO` |
| Perda | `PERDA` |
| Cortesia | `CORTESIA` |
| Pagamento | `PAGAMENTO_PRESTACAO` |
| Fechamento da prestação | `FECHAMENTO_PRESTACAO` |

---

## Consumidores

| Consumidor | Como obtém o crédito |
|------------|----------------------|
| Situação do Cliente / Conta Corrente | Projeção / DTO alimentado pelo service |
| Preparar Entrega / Nova Consignação | API (`creditoDisponivel`, `saldoDevedor`, `saldoCredor`) |
| Central de Operações | Campos da API — mappers só apresentam |
| ConsultarLimiteDisponivel | `CreditoComercialService` |
| LimiteCreditoService (facade) | Delega ao service |
| Futuros motores (NF-e, etc.) | Obrigatório consumir o mesmo service |

### Frontend

A UI **apenas apresenta**:

- `creditoDisponivel`
- `saldoDevedor`
- `saldoCredor`
- `limiteComercial`

Projeção de impacto (“após esta entrega”) pode subtrair o valor da entrega do `creditoDisponivel` da API (`creditoAposEntrega`). Isso **não** é recálculo da fórmula SSOT.

---

## Responsabilidades

| Camada | Pode | Não pode |
|--------|------|----------|
| `CreditoComercialService` | Calcular métricas oficiais | — |
| `sincronizarCreditoComercial` | Sync + evento + auditoria | Inventar fórmula |
| Use Cases | Registrar movimentação e chamar o helper | Recalcular crédito ad hoc |
| Repositórios | Agregar movimentações por perfil | Aplicar regra de crédito |
| Frontend / mappers | Exibir e projetar impacto UX | `limite − utilizado`, `saldo + limite` |
| Endpoints | Expor campos do service | Reimplementar a fórmula |

---

## Performance

`calcularParaPerfil` / `carregarMovimentacoesComerciaisPerfil` usam agregação:

```sql
SELECT m.* FROM movimentacoes_comerciais m
INNER JOIN consignacoes c ON c.id = m.consignacao_id
WHERE c.perfil_comercial_id = ?
```

via `MovimentacaoComercialRepository.listarPorPerfilComercialId` — **sem N+1**. Fallback N+1 permanece apenas para mocks legados.

A **fórmula permanece idêntica**.

---

## Pagamento da prestação

`POST /api/comercial/consignacoes/:id/prestacao/pagamento`

| Caso | Comportamento |
|------|----------------|
| Valor Recebido **<** Valor Devido | Permitido → saldo devedor na Conta Corrente |
| Valor Recebido **=** Valor Devido | Permitido → quitação |
| Valor Recebido **>** Valor Devido | Permitido → saldo credor |
| Sem vendas registradas | Bloqueado (não há o que receber) |

**Nunca** retornar HTTP 400 apenas por pagamento parcial.

---

## Exemplo oficial

| Etapa | Valor |
|-------|-------|
| Limite Comercial | R$ 50,00 |
| Entrega | R$ 50,00 |
| Vendido | R$ 45,00 |
| Devolvido | R$ 5,00 |
| Pagamento | R$ 40,00 |

**Resultado**

- Prestação: FECHADA (ou ACERTADA)
- Conta Corrente: débito R$ 5,00
- Crédito Disponível: R$ 45,00
- Próxima entrega: até R$ 45,00 (acima exige Autorização Gerencial)

---

## Anti-padrões (proibidos)

1. Recalcular `limite − utilizado` no frontend ou mapper.
2. Emitir `CREDITO_COMERCIAL_RECALCULADO` e gravar auditoria fora de `sincronizarCreditoComercial`.
3. Chamar `sincronizarCachePerfil` **e** recalcular crédito na mesma operação (duplicidade).
4. Tratar `perfil.saldo_aberto` como fonte oficial (é cache).
5. Inventar fórmula alternativa em outro motor sem passar pelo service.
6. Confiar em `limiteDisponivel` fantasma recalculado localmente quando a API omitir campos — a API deve sempre fornecer os oficiais.

---

## Compatibilidade

- **Motor Comercial:** consumidores atuais migrados para o SSOT.
- **NF-e e demais motores:** devem integrar exclusivamente via `CreditoComercialService` / APIs que o utilizam.
