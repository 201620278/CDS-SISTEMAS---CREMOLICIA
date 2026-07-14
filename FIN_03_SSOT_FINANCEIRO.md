# FIN-03 — Motor Financeiro como Single Source of Truth (SSOT)

**Código:** FIN-03  
**Status:** ARQUITETURA OFICIAL (to-be)  
**Data:** 2026-07-13  
**Dependências:** FIN-01, FIN-02, ADR_FINANCEIRO_SSOT

---

## 1. Declaração SSOT

O **Motor Financeiro** é a **única fonte da verdade** da Plataforma CDS para:

| Domínio | SSOT |
|---------|------|
| Caixa operacional | Motor Financeiro |
| Contas bancárias / saldos bancários | Motor Financeiro |
| Fluxo de caixa | Motor Financeiro |
| Contas a Receber (empresa) | Motor Financeiro |
| Contas a Pagar (empresa) | Motor Financeiro |
| Conciliação | Motor Financeiro |
| Indicadores financeiros / DRE operacional | Motor Financeiro |
| Saldos financeiros consolidados | Motor Financeiro |

**Fora do SSOT Financeiro (permanecem nos seus motores):**

| Domínio | SSOT |
|---------|------|
| Crédito Comercial / consignação | Motor Comercial (`CreditoComercialService` + ledger) |
| Conta Corrente Comercial (dívida consignada) | Motor Comercial (projeção do ledger) |
| Estoque | Motor Estoque / ERP estoque |
| Documento fiscal | Motor Fiscal (NFC-e / NF-e) |
| Autorização TEF/PIX | Adaptadores de pagamento |

---

## 2. Arquitetura oficial proposta

```
┌─────────────────────────────────────────────────────────────┐
│                    MÓDULOS DE DOMÍNIO                        │
│  Comercial │ PDV │ NFC-e │ NF-e │ Compras │ TEF │ PIX │ …   │
└───────────────────────────┬─────────────────────────────────┘
                            │ publica Evento Financeiro
                            │ (Outbox / Event Bus)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              MOTOR FINANCEIRO (SSOT)                         │
│  Ingestão → Validação → Idempotência → Ledger Financeiro     │
└───────┬───────────┬───────────┬───────────┬─────────────────┘
        │           │           │           │
        ▼           ▼           ▼           ▼
   Fluxo Caixa   Caixa      Banco      AR / AP
        │           │           │           │
        └───────────┴───────────┴───────────┘
                            │
                            ▼
                 Conciliação → DRE → Dashboard
```

### Regra de ouro

Nenhum módulo poderá gravar diretamente:

- `caixa` / `caixa_movimentacoes` (exceto via API do Motor Financeiro)  
- `financeiro` / futuros `contas_pagar` / saldos bancários  
- qualquer saldo financeiro da empresa  

---

## 3. Responsabilidades por módulo

### Motor Comercial

**Responsável por:** Entrega, Prestação, Conta Corrente Comercial, Crédito Comercial, Consignação, Ledger comercial append-only.

**Nunca:** caixa da empresa, banco, AR/AP empresa (apenas publica eventos).

### PDV

**Responsável por:** Venda, cupom, itens, orquestração de meios de pagamento (chama TEF/PIX).

**Nunca:** INSERT em `financeiro` / `contas_receber` / caixa — publica `RECEBIMENTO_PDV` / `TITULO_AR_CRIADO`.

### NFC-e / NF-e

**Responsável por:** Documento fiscal, XML, autorização SEFAZ.

**Nunca:** caixa — correlaciona `origemDocumento` nos eventos do PDV/Comercial.

### Compras

**Responsável por:** Pedidos, entradas, fornecedores, vínculo com XML.

**Nunca:** caixa — publica `TITULO_AP_CRIADO` / `PAGAMENTO_FORNECEDOR`.

### TEF / PIX

**Responsável por:** Autorização, NSU, status de cobrança.

**Nunca:** ledger financeiro — publicam `TEF_AUTORIZADO` / `PIX_COBRANCA_PAGA` que **causam** recebimentos.

### Conta Corrente Comercial (UI)

**Responsável por:** Exibir dívida consignada e orientar recebimento.

**Nunca:** baixar caixa — aciona evento `RECEBIMENTO_COMERCIAL` / `RECEBIMENTO_CONTA_CORRENTE`.

---

## 4. Separação Conta Corrente Comercial × Financeiro Empresa

| | Conta Corrente Comercial | Financeiro Empresa |
|--|--------------------------|--------------------|
| Pergunta | Quanto o consignatário deve na operação comercial? | Quanto entrou/saiu do caixa/banco da empresa? |
| Fonte | `movimentacoes_comerciais` | Ledger do Motor Financeiro |
| Crédito | Limite − Saldo Devedor (SSOT Comercial) | Não substitui crédito comercial |
| Pagamento | Evento → Financeiro liquida caixa + reduz AR empresa | Materializa o dinheiro |

---

## 5. Componentes internos do Motor Financeiro (alvo)

1. **FinancialEventIngestor** — consome Outbox/Bus  
2. **FinancialLedger** — append-only de lançamentos financeiros  
3. **AccountsReceivableService** — títulos AR  
4. **AccountsPayableService** — títulos AP  
5. **CashSessionService** — abertura/sangria/suprimento/fechamento  
6. **BankAccountService** — contas e saldos bancários  
7. **CashFlowProjection** — fluxo de caixa  
8. **ReconciliationService** — conciliação  
9. **FinancialReporting** — DRE / dashboard  

---

## 6. Estado atual vs alvo

| Capacidade | As-is | To-be |
|------------|-------|-------|
| Módulo SSOT | Fragmentado | `motor-financeiro` |
| Eventos | Só Comercial (3 tipos Outbox) | Catálogo FIN-02 completo |
| PDV → financeiro | SQL direto | Evento |
| Compras → financeiro | SQL direto | Evento |
| Caixa | Rota isolada | Serviço do Motor Financeiro |
| Banco | Inexistente | Serviço dedicado |
| AP | `financeiro.despesa` | Entidade AP formal |
| Conciliação bancária | Ausente / TEF parcial | Conciliação unificada |

---

## 7. Critérios de conformidade SSOT

Um PR/módulo está **conforme** se:

1. Não contém SQL de escrita em tabelas financeiras da empresa.  
2. Publica evento do catálogo FIN-02 com `idempotencyKey`.  
3. Trata falha financeira via retry Outbox, sem rollback indevido do domínio.  
4. Não recalcula saldo de caixa/banco localmente.

---

*FIN-03 — SSOT Financeiro CDS.*
