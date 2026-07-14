# ADR-VENDAS-001 — Única porta de criação de venda oficial

**Status:** Aceito (diretriz)  
**Data:** 2026-07-13  
**Relacionado:** STAB-06, AUDITORIA_FORENSE_ORIGENS_DA_VENDA.md

## Decisão

Toda **venda oficial** da Plataforma CDS (`tabela vendas` + Motor Fiscal × Não Fiscal) deve passar pelo mesmo fluxo transacional usado pelo PDV (`criarVenda` / futuro `VendaApplicationService`).

Origens (PDV, Consignação/Prestação, Pedido, Orçamento, E-commerce, App) **não** emitem NFC-e, **não** escrevem Ledger de venda plataforma e **não** publicam efeitos financeiros oficiais por conta própria.

## STAB-06 (ponte temporária)

- Adapter: `PrestacaoVendaAdapter` monta payload compatível com `criarVenda`.
- Política de estoque: `JA_BAIXADO_CONSIGNACAO` (saída física já ocorreu na Entrega).
- Integridade Comercial: `Valor da Venda = Valor Recebido + Saldo em Aberto`.
- Motor Comercial continua dono do ledger de consignação; a grade **não** é o nascimento da venda fiscal.

## Fora de escopo deste ADR

Grande refatoração do PDV em `VendaApplicationService` (sprint futura).
