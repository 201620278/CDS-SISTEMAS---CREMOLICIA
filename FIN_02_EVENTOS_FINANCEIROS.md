# FIN-02 — Catálogo de Eventos Financeiros da Plataforma CDS

**Código:** FIN-02  
**Status:** CATÁLOGO OFICIAL (proposta)  
**Data:** 2026-07-13  
**Dependência:** FIN-01

---

## 1. Princípio

Todo módulo de domínio publica um **Evento Financeiro**.  
Somente o **Motor Financeiro** consome o evento e materializa:

- Caixa / Banco / Fluxo de Caixa  
- Contas a Receber / Contas a Pagar  
- Conciliação / Indicadores  

Nenhum módulo faz `INSERT`/`UPDATE` em tabelas financeiras da empresa.

---

## 2. Envelope padrão do evento

```json
{
  "eventId": "uuid",
  "eventType": "RECEBIMENTO_PDV",
  "occurredAt": "ISO-8601",
  "correlationId": "string",
  "causationId": "string|null",
  "origemModulo": "pdv|comercial|compras|nfe|nfce|tef|pix|rh|manual",
  "origemDocumento": {
    "tipo": "venda|consignacao|compra|nfe|nfce|manual",
    "id": "string|number",
    "numero": "string|null"
  },
  "parte": {
    "tipo": "cliente|fornecedor|funcionario|outro",
    "id": "number|null",
    "documento": "string|null",
    "nome": "string|null"
  },
  "valores": {
    "bruto": 0,
    "desconto": 0,
    "juros": 0,
    "multa": 0,
    "liquido": 0,
    "moeda": "BRL"
  },
  "meioPagamento": {
    "forma": "dinheiro|pix|cartao_credito|cartao_debito|boleto|transferencia|crediario|outros",
    "parcelas": 1,
    "autorizacao": "string|null",
    "adquirente": "string|null"
  },
  "caixa": {
    "caixaId": "number|null",
    "sessaoId": "string|null",
    "requerCaixaAberto": true
  },
  "contabil": {
    "contaContabil": "string|null",
    "centroCusto": "string|null",
    "categoria": "string|null"
  },
  "idempotencyKey": "string",
  "payload": {}
}
```

**Regra de idempotência:** `(origemModulo, eventType, idempotencyKey)` único no Motor Financeiro.

---

## 3. Catálogo de eventos

### 3.1 Recebimentos

| Código | Descrição | Origem típica | Impacto Financeiro |
|--------|-----------|---------------|--------------------|
| `RECEBIMENTO_PDV` | Recebimento de venda no PDV | PDV | Caixa ↑ / AR ↓ ou receita à vista |
| `RECEBIMENTO_COMERCIAL` | Recebimento de consignação / prestação | Motor Comercial | AR comercial liquidada → caixa/banco |
| `RECEBIMENTO_CONTA_CORRENTE` | Recebimento explícito da dívida comercial | Conta Corrente → Financeiro | Idem |
| `RECEBIMENTO_NFE` | Recebimento vinculado a NF-e de saída | NF-e | Caixa/banco / AR |
| `RECEBIMENTO_NFCE` | Recebimento vinculado a NFC-e | NFC-e/PDV | Idem (pode correlacionar com PDV) |
| `RECEBIMENTO_SERVICO` | Recebimento de serviço | Serviços (futuro) | Caixa/banco |
| `RECEBIMENTO_ECOMMERCE` | Recebimento canal online | E-commerce (futuro) | Banco / gateway |
| `RECEBIMENTO_MANUAL` | Lançamento manual no Financeiro | Financeiro UI | Conforme forma |

### 3.2 Pagamentos

| Código | Descrição | Origem típica | Impacto |
|--------|-----------|---------------|---------|
| `PAGAMENTO_FORNECEDOR` | Pagamento a fornecedor | Compras / Financeiro | Caixa/banco ↓ / AP ↓ |
| `PAGAMENTO_FUNCIONARIO` | Folha / adiantamento | RH (futuro) | Caixa/banco ↓ |
| `PAGAMENTO_DESPESA` | Despesa operacional | Financeiro | Caixa/banco ↓ |
| `PAGAMENTO_IMPOSTO` | Tributos | Fiscal/Financeiro | Banco ↓ |
| `PAGAMENTO_ADQUIRENTE` | Taxas / chargeback | TEF/Conciliação | Banco ↓ |

### 3.3 Contas a Receber / a Pagar (títulos)

| Código | Descrição | Origem | Impacto |
|--------|-----------|--------|---------|
| `TITULO_AR_CRIADO` | Abertura de título a receber | PDV prazo, NF-e, Comercial | AR ↑ (sem caixa) |
| `TITULO_AR_BAIXADO` | Baixa total/parcial de AR | Financeiro / evento recebimento | AR ↓ |
| `TITULO_AR_CANCELADO` | Cancelamento de título | Venda cancelada / estorno | AR ↓ |
| `TITULO_AP_CRIADO` | Abertura de título a pagar | Compras, despesa | AP ↑ |
| `TITULO_AP_BAIXADO` | Baixa de AP | Financeiro | AP ↓ |
| `TITULO_AP_CANCELADO` | Cancelamento de AP | Compra cancelada | AP ↓ |

### 3.4 Caixa operacional

| Código | Descrição | Impacto |
|--------|-----------|---------|
| `ABERTURA_CAIXA` | Abertura de sessão/turno | Registra saldo inicial |
| `FECHAMENTO_CAIXA` | Fechamento de turno | Consolida diferenças |
| `SUPRIMENTO` | Entrada de numerário no caixa | Caixa ↑ |
| `SANGRIA` | Retirada de numerário | Caixa ↓ |
| `TRANSFERENCIA_CAIXA` | Entre caixas | Neutro global / move sessões |
| `QUEBRA_CAIXA` | Diferença apurada | Ajuste / despesa ou receita |

### 3.5 Banco e conciliação

| Código | Descrição | Impacto |
|--------|-----------|---------|
| `TRANSFERENCIA_BANCARIA` | Entre contas | Neutro / taxas |
| `DEPOSITO_BANCARIO` | Depósito de caixa | Caixa ↓ Banco ↑ |
| `TED_PIX_ENVIADO` | Saída bancária | Banco ↓ |
| `TED_PIX_RECEBIDO` | Entrada bancária | Banco ↑ |
| `CONCILIACAO_ITEM_CONFIRMADO` | Item conciliado | Status |
| `CONCILIACAO_DIVERGENCIA` | Divergência | Alerta / ajuste |

### 3.6 TEF / PIX / Cartão

| Código | Descrição | Impacto |
|--------|-----------|---------|
| `TEF_AUTORIZADO` | Autorização adquirente | Pré-condição de recebimento |
| `TEF_NEGADO` | Negação | Sem movimento financeiro |
| `TEF_CANCELADO` / `TEF_ESTORNADO` | Cancel/estorno TEF | Estorno financeiro correlato |
| `PIX_COBRANCA_CRIADA` | Cobrança gerada | Pendente |
| `PIX_COBRANCA_PAGA` | PIX confirmado | Dispara `RECEBIMENTO_*` |
| `PIX_COBRANCA_EXPIRADA` | Expirada | Sem movimento |

### 3.7 Estornos e ajustes

| Código | Descrição |
|--------|-----------|
| `ESTORNO_FINANCEIRO` | Estorno genérico com referência ao lançamento original |
| `CANCELAMENTO_RECEBIMENTO` | Cancela recebimento já lançado |
| `CANCELAMENTO_PAGAMENTO` | Cancela pagamento já lançado |
| `JUROS_RECEBIDOS` | Juros/mora recebidos |
| `DESCONTO_CONCEDIDO` | Desconto em recebimento |
| `DESCONTO_OBTIDO` | Desconto em pagamento |
| `MULTA` | Multa recebida ou paga (sinal no payload) |
| `TARIFA_BANCARIA` | Tarifas |
| `AJUSTE_MANUAL` | Ajuste controlado (auditoria obrigatória) |

### 3.8 Comerciais (espelho — não confundir com ledger comercial)

| Código | Descrição | Observação |
|--------|-----------|------------|
| `COMERCIAL_RECEITA_CONSIGNACAO` | Espelho de venda prestação | Hoje: Outbox `FinanceiroLancarReceita` |
| `COMERCIAL_RECEBIMENTO_PRESTACAO` | Espelho de pagamento prestação | Hoje: `FinanceiroRegistrarPagamento` |
| `COMERCIAL_PERDA` | Espelho de perda | Hoje: `FinanceiroRegistrarPerda` |
| `COMERCIAL_CORTESIA` | Se houver impacto financeiro futuro | Avaliar política |

---

## 4. Mapeamento as-is → to-be

| Fluxo atual | Writer atual | Evento to-be |
|-------------|--------------|--------------|
| Venda PDV vista → INSERT `financeiro` | `VendaPagamentoService` | `RECEBIMENTO_PDV` (+ `TITULO_AR_*` se prazo) |
| Venda PDV prazo → `contas_receber` | `VendaPagamentoService` | `TITULO_AR_CRIADO` |
| Baixa AR ERP | `financeiro.js` | `TITULO_AR_BAIXADO` / `RECEBIMENTO_MANUAL` |
| Pagamento prestação | Outbox Comercial | `RECEBIMENTO_COMERCIAL` |
| Perda consignação | Outbox Comercial | `COMERCIAL_PERDA` → despesa |
| Compra → despesa | `compras.js` | `TITULO_AP_CRIADO` / `PAGAMENTO_FORNECEDOR` |
| Sangria / suprimento | `caixa.js` | `SANGRIA` / `SUPRIMENTO` |
| TEF autoriza | `TefManager` | `TEF_AUTORIZADO` (depois `RECEBIMENTO_PDV`) |
| PIX pago | `pixService` | `PIX_COBRANCA_PAGA` → `RECEBIMENTO_*` |

---

## 5. Eventos Outbox existentes (Motor Comercial)

| Evento atual | Equivalente catálogo |
|--------------|----------------------|
| `FinanceiroLancarReceita` | `COMERCIAL_RECEITA_CONSIGNACAO` / `TITULO_AR_CRIADO` (política a definir: liquidado vs a receber) |
| `FinanceiroRegistrarPagamento` | `RECEBIMENTO_COMERCIAL` |
| `FinanceiroRegistrarPerda` | `COMERCIAL_PERDA` |

**Decisão pendente (ADR):** receita de consignação deve abrir AR e só liquidar no pagamento, ou continuar espelhando já liquidada? Recomendação SSOT: **abrir AR no acerto/venda e liquidar no recebimento**.

---

## 6. Regras de publicação

1. Evento só após **commit** da transação de domínio (padrão Outbox).  
2. Payload **não** contém SQL; contém fatos de negócio.  
3. Motor Financeiro é **idempotente**.  
4. Falha no Financeiro **não desfaz** o domínio; vai para retry/dead-letter (como Outbox Comercial).  
5. Estorno exige evento compensatório — nunca UPDATE silencioso no ledger financeiro.

---

*FIN-02 — Catálogo de Eventos Financeiros CDS.*
