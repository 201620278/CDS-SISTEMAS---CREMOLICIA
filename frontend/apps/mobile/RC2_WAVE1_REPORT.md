# CDS Mobile RC2.0 — Relatório Técnico Onda 1

**Versão:** 2.0.0-rc2.0  
**Build:** 20260716rc20  
**Objetivo:** Estação operacional diária (PDV + Estoque + Financeiro) sem duplicar regras.

## Arquivos criados

| Arquivo | Função |
|---------|--------|
| `js/pages/estoque.js` | Estoque operacional (ajuste via motor) |
| `PARITY_MATRIX.md` | Matriz ERP × Mobile |
| `RC2_WAVE1_REPORT.md` | Este relatório |

## Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `js/forms.js` | Bottom sheet, confirmSheet, promptSheet, tabsHtml |
| `js/permissions.js` | `canDoAction` (caixa, fiscal, estoque, financeiro) |
| `js/pages/pdv.js` | PDV operacional completo |
| `js/pages/financeiro.js` | Baixas / fluxo / histórico |
| `js/app.js` | Loader estoque dedicado |
| `js/version.js` | 2.0.0-rc2.0 |
| `css/mobile.css` | Sheets, qty, pay grid, sticky |
| `index.html` | Cache bust RC2 |

## APIs reutilizadas

- `/api/caixa/*` — aberto, abrir, sangria, suprimento, fechar  
- `/api/vendas` — pré-cálculo, criar, cancelar, listar, detalhes, pagamento-não-fiscal  
- `/api/fiscal/emitir/venda/:id`, `/notas/:id/cancelar`, `/danfe/venda/:id`  
- `/api/tef/*` — tentativa graceful  
- `/api/produtos/:id/ajustar-estoque`, search, estoque/baixo, histórico  
- `/api/financeiro/*` — receber/pagar/baixar, fluxo, movimentações  
- `/api/terminais/auto` — heartbeat  

## Motores utilizados

Caixa · Vendas · Estoque (`ajusteEstoqueService`) · Financeiro · Fiscal · MultiCaixa/Terminais  

## Fluxos concluídos

1. Abrir → sangria/suprimento → fechar caixa (Mobile + terminal_id)  
2. Carrinho → pagamento → POST venda → NFC-e opcional  
3. Histórico de vendas + cancelar + DANFE  
4. Entrada/saída/inventário/ajuste estoque (nunca PUT de saldo)  
5. Baixa financeira receber (exige caixa) / pagar  

## Cobertura / paridade

Ver `PARITY_MATRIX.md`. **~58–62%** das operações do ERP Desktop após Onda 1.

## Checklist de validação

- [ ] Abrir / fechar caixa  
- [ ] Sangria / suprimento  
- [ ] Venda dinheiro / PIX / cartão  
- [ ] TEF (ou mensagem indisponível)  
- [ ] NFC-e emit / DANFE / cancelar venda  
- [ ] Ajuste / entrada / saída / inventário  
- [ ] Baixa receber (com caixa) / pagar  
- [ ] Heartbeat / terminal / multicaixa  

## Critério de aceite Onda 1

Operador Cremolia consegue rotina diária no celular com os mesmos motores do Desktop, sem lógica de negócio no Mobile.
