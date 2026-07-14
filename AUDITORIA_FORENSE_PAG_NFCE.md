# AUDITORIA FORENSE — Grupo `<pag>` NFC-e (rejeição SEFAZ 866)

**Data:** 2026-07-14  
**Caso:** VNF R$ 1,00 × pagamentos PIX 3,00 + Dinheiro 1,00 = 4,00 (sem troco)

## Causa raiz

O array enviado à NFC-e vinha do **acúmulo bruto** `pagamentosMistos` do PDV (ou espelho em `venda_pagamentos`), **sem rateio fiscal × não fiscal** alinhado ao `totalFiscal` da nota.

### Onde nasce o array

1. UI misto: `pagamentosMistos` (`frontend/pdv/js/pdv.js`)  
2. Em confirmação fiscal **manual** + misto: `dados.pagamentos = normalizarPagamentosSemTef(pagamentosMistos)` — **bruto**.  
3. Backend gravava `venda_pagamentos` a partir de `req.body.pagamentos` (bruto).  
4. Emissor preferia `venda_recebimentos`; se vazio/atrasado, usava `venda_pagamentos` **sem** `tipo_recebimento` → `resolverPagamentosNfce` inclui **todos** (`!tipo_recebimento`).  
5. `resolverPagamentosNfce` só recalcula valor quando há **1** pagamento; com 2+ linhas (PIX+Dinheiro) mantém soma 4,00 > vNF 1,00 → **866**.

### Perguntas

| # | Resposta |
|---|----------|
| 1. Onde nasce | `pagamentosMistos` no PDV → body `pagamentos` → `venda_pagamentos` / recebimentos |
| 2. Antigos no array? | No change de tipo misto o array é zerado (`pagamentosMistos = []`); o bug não é “sujeira” residual, é **não ratear** o misto confirmado |
| 3. Limpa ao alterar forma? | Sim, no `change` do tipo misto e no botão confirmar |
| 4. Duplicação detPag? | Não; duas formas reais com valores **totais da tela**, não tipados à nota |
| 5. Total XML = tela? | Total da **venda** na tela ≠ **vNF fiscal**; pagamentos seguiam a tela (4), nota fiscal (1) |
| 6. Log pré-XML | `[AUDITORIA-PAG-NFCE]` em `resolverPagamentosNfce` |

## Correção (somente origem — sem mudar regras do emissor/Motor Fiscal)

1. **PDV:** `montarPagamentosMistosParaEnvio` rateia mistos (mesma prioridade do `DistribuidorPagamento`) e envia parcelas com `tipo_recebimento`.  
2. **Backend:** `venda_pagamentos` passa a persistir **`recebimentos` do Orquestrador** (rateados), não o body bruto.  
3. **Hardening `resolverPagamentosNfce`:** se a soma dos pagamentos fiscais ainda for > vNF (N linhas), **limita** as linhas ao total fiscal antes de `montarPagamentos` — fecha o gap da regra antiga que só ajustava quando havia 1 pagamento (causa direta do 866 com PIX+Dinheiro).

XML/`montarPagamentos` / Motor Fiscal: **estrutura** mantida; apenas a origem/valores do array que alimenta `<pag>`.
