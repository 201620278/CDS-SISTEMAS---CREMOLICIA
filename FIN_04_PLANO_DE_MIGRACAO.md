# FIN-04 — Plano de Migração para o Motor Financeiro SSOT

**Código:** FIN-04  
**Status:** ROADMAP OFICIAL  
**Data:** 2026-07-13  
**Dependências:** FIN-01, FIN-02, FIN-03, ADR_FINANCEIRO_SSOT

---

## 1. Princípios de migração

1. **Strangler Fig:** novos fluxos nascem no Motor Financeiro; legados migram por fatia.  
2. **Dual-write transitório proibido** sem feature flag e reconciliação. Preferir: domínio → Outbox → Financeiro.  
3. **Ledger comercial permanece** (crédito consignação). Só o espelho empresa muda.  
4. **Sem big-bang** no PDV.  
5. Cada fase tem critério de saída mensurável.

---

## 2. Roadmap por fases

### Fase 1 — Eventos Financeiros (fundação)

**Objetivo:** formalizar o contrato de eventos.

| Entrega | Detalhe |
|---------|---------|
| Pacote `financial-events` | Schema + validação do envelope FIN-02 |
| Outbox genérico / extensão | Reuso do padrão Comercial |
| Documentação obrigatória | Catálogo versionado |
| Feature flags | `FIN_EVENTS_ENABLED` |

**Critério de saída:** eventos publicados em homologação com idempotência; zero mudança de UI obrigatória.

**Pré-requisito NF-e/PDV/Compras:** contrato estável.

---

### Fase 2 — Financeiro SSOT (núcleo)

**Objetivo:** criar `backend/motores/motor-financeiro/`.

| Entrega | Detalhe |
|---------|---------|
| Bootstrap DI + rotas `/api/financeiro-v2` (ou evolução controlada) | |
| Ledger financeiro append-only | Triggers no-update/no-delete |
| Ingestor de eventos | Consumer Outbox |
| Migração gradual da API `rotas/financeiro.js` | Facade → motor |
| AR/AP como agregados | Substituir dualidade `financeiro`+`contas_receber` |

**Critério de saída:** baixas manuais do ERP passam pelo motor; relatórios leem do SSOT.

---

### Fase 3 — Integração Comercial

**Objetivo:** alinhar Bridge Comercial ao catálogo oficial.

| Entrega | Detalhe |
|---------|---------|
| Renomear/mapear Outbox atual → FIN-02 | `RECEBIMENTO_COMERCIAL`, etc. |
| Política AR consignação | Recomendado: título no acerto + liquidação no pagamento |
| Remover SQL “semântico” ambíguo no gateway | Gateway chama Motor Financeiro API interna |
| `consultarSaldo` deixa de misturar AR PDV | |

**Critério de saída:** Comercial **zero** `INSERT INTO financeiro` no gateway; apenas eventos.

**Estado de partida favorável:** Outbox já existe.

---

### Fase 4 — PDV

**Objetivo:** eliminar bypass de `VendaPagamentoService`.

| Entrega | Detalhe |
|---------|---------|
| Venda à vista → `RECEBIMENTO_PDV` | |
| Venda a prazo → `TITULO_AR_CRIADO` | |
| Cancelamento/devolução → eventos de estorno | |
| Remover INSERT direto `financeiro`/`contas_receber` | Feature flag por loja |
| TEF/PIX como causation de recebimento | |

**Critério de saída:** 100% vendas novas sem SQL financeiro no serviço de venda; reconciliação PDV×Financeiro = 0 divergência em amostra.

**Risco:** alto (caminho crítico). Migração por forma de pagamento.

---

### Fase 5 — NF-e / NFC-e

**Objetivo:** correlacionar fiscal ↔ financeiro sem misturar responsabilidades.

| Entrega | Detalhe |
|---------|---------|
| NFC-e referencia `correlationId` do recebimento PDV | |
| NF-e saída (futuro) publica eventos próprios | |
| NF-e entrada continua gerando AP via Compras/evento | |
| Nenhum escritor financeiro no emissor | |

**Critério de saída:** auditoria fiscal encontra lançamento financeiro pelo `origemDocumento`.

---

### Fase 6 — Compras

**Objetivo:** eliminar `criarFinanceiroCompra` SQL direto.

| Entrega | Detalhe |
|---------|---------|
| `TITULO_AP_CRIADO` na efetiva entrada | |
| `PAGAMENTO_FORNECEDOR` na baixa | |
| Cancelamento → `TITULO_AP_CANCELADO` | |
| Devolução compra → evento de crédito/receita conforme política | |

**Critério de saída:** compras novas sem DELETE+INSERT em `financeiro` na rota de compras.

---

### Fase 7 — Portal do Contador

**Objetivo:** visão contábil/fiscal consolidada **somente leitura** do SSOT.

| Entrega | Detalhe |
|---------|---------|
| Exportações SPED/ECD (futuro) a partir do ledger financeiro | |
| DRE / balancetes operacionais | |
| Sem escrita financeira no portal | |

**Critério de saída:** contador consome API read-only do Motor Financeiro.

---

### Fase 8 — Conciliação Bancária

**Objetivo:** fechar o ciclo caixa ↔ banco.

| Entrega | Detalhe |
|---------|---------|
| Contas bancárias + importação de extrato | |
| Matching automático TEF/PIX/boleto | |
| Eventos `CONCILIACAO_*` | |
| Unificar PIX TEF × PIX provedor | |

**Critério de saída:** divergências TEF×extrato visíveis e tratáveis no Motor Financeiro.

---

## 3. Fases transversais (paralelas)

| Tema | Quando | Ação |
|------|--------|------|
| Caixa (`caixa.js`) | Fase 2–4 | Absorver sangria/suprimento/abertura como eventos `SANGRIA`/`SUPRIMENTO`/`ABERTURA_CAIXA` |
| Contas Receber legado | Fase 2–4 | Deprecar `rotas/contas_receber.js` em favor do motor |
| Crédito ERP `clientes.credito_atual` | Fase 4 | Política: unificar ou isolar do crédito comercial (ADR específico) |
| E-commerce | Pós Fase 1 | Já nasce event-driven (`RECEBIMENTO_ECOMMERCE`) |

---

## 4. Cronograma sugerido (relativo)

| Fase | Esforço relativo | Dependências |
|------|------------------|--------------|
| 1 Eventos | P | — |
| 2 SSOT núcleo | G | Fase 1 |
| 3 Comercial | M | Fase 1–2 |
| 4 PDV | GG | Fase 2 |
| 5 NF-e/NFC-e | M | Fase 4 (NFC-e), NF-e saída |
| 6 Compras | M | Fase 2 |
| 7 Portal Contador | M | Fase 2+ |
| 8 Conciliação | G | Fase 2+4 |

*(P=pequeno, M=médio, G=grande, GG=muito grande)*

---

## 5. Estratégia de rollback

1. Feature flag por módulo reverte publicação de eventos e reativa writer legado **somente** se reconciliador marcar divergência.  
2. Ledger financeiro append-only: correções via **estorno**, nunca delete.  
3. Dual-read temporário: dashboards podem comparar legado × SSOT até cutover.

---

## 6. Preparação para NF-e, NFC-e, PDV, Compras e E-commerce

| Canal | Como nasce conforme SSOT |
|-------|--------------------------|
| PDV | Fase 4 — eventos de recebimento/título |
| NFC-e | Fase 5 — correlação documental |
| NF-e | Fase 5 + emissão futura — eventos fiscais ≠ financeiros |
| Compras | Fase 6 — AP por evento |
| E-commerce | Greenfield na Fase 1+ — sem bypass |

---

## 7. Critérios globais de conclusão da migração

- [ ] Zero `INSERT/UPDATE` financeiros fora de `motor-financeiro`  
- [ ] Todos os módulos do catálogo FIN-02 cobertos ou explicitamente N/A  
- [ ] Caixa e banco reconciliáveis  
- [ ] Comercial e PDV sem bypass  
- [ ] ADR aceito e vinculado ao GOVERNANCE CDS  

---

*FIN-04 — Plano de Migração Financeira CDS.*
