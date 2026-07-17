# RC2.3.2 — Auditoria Forense Comercial Mobile × ERP Desktop

**Versão:** `2.3.2-rc2.3.2` · Build `20260717rc232`  
**Escopo:** Motor Comercial — consignações (lista, nova, detalhe, itens, prestação, fiscal)  
**Regra:** Sem APIs novas · Sem banco · Sem regras de negócio novas — apenas UI Mobile + APIs oficiais existentes.

---

## 1. Causa raiz — botão «Adicionar» invisível

| Hipótese | Resultado |
|----------|-----------|
| Não renderizado no DOM | **Descartado** — `data-add-item` estava no HTML (`produtoPickCardHtml`) |
| `display:none` / `hidden` / CSS | **Descartado** — nenhuma regra ocultava `.cds-mobile-btn` dentro de `.cds-prod-pick` |
| Condição JS interrompendo render | **Descartado** — busca e bind executavam; qty (−/campo/+) vinha do mesmo template |
| Erro JS antes do botão | **Descartado** — sintaxe OK; qty visível prova render completo |
| **Viewport / layout (CAUSA RAIZ)** | **Confirmado** |

### Diagnóstico definitivo

1. **Layout em coluna empilhada:** qty (−/campo/+) ficava visível; botão «Adicionar item» ficava **abaixo** do stepper, na borda inferior do card.
2. **Ordem da página:** seção «Adicionar item» vinha **depois** da lista de itens + barra operacional longa → usuário precisava rolar muito; botão caía **atrás da bottom nav fixa** (`z-index: 40`, `height: ~72px + safe-area`).
3. **Divergência Desktop:** no ERP, o LIP Desktop coloca qty + botão **«Adicionar» na mesma barra** (`cds-lip__qty-bar`), sempre visível após seleção — Mobile RC2.3.1 não seguia esse padrão.

### Correção RC2.3.2

- Qty + botão **«Adicionar» na mesma linha** (paridade LIP).
- Seção «Adicionar item» **acima** da lista de itens (rascunho).
- `padding-bottom` em `#item-produtos` para safe-area + bottom nav.
- `scrollIntoView` ao carregar resultados da busca.
- Botões operacionais **filtrados por status** (não empurram a área de inclusão para baixo).

---

## 2. Matriz de divergências Desktop × Mobile

| Tela / fluxo | Desktop (Motor Comercial) | Mobile RC2.3.1 | Mobile RC2.3.2 | API / motor |
|--------------|---------------------------|----------------|----------------|-------------|
| Lista consignações | Tabela + filtros avançados | Lista + filtro texto + KPIs | ✔ Igual | `GET /comercial/consignacoes` |
| Nova consignação | Wizard 3 passos | Cliente → perfil → criar | ✔ Funcional (UI simplificada) | `POST /comercial/consignacoes` |
| Seleção cliente | Busca + painel | Busca ≥2 chars | ✔ | `GET /clientes/buscar` |
| Perfil comercial | Obrigatório | Obrigatório | ✔ | `GET /comercial/perfil-comercial` |
| Criação | Payload clienteId + perfilComercialId | Idêntico | ✔ | Motor Comercial |
| Detalhe / cabeçalho | Cockpit drawer | Card resumo | ✔ (compacto) | `GET /comercial/consignacoes/:id` |
| Inclusão produtos | LIP + qty bar + Adicionar | Qty visível; Adicionar oculto | **✔ Corrigido** | `POST .../itens` |
| Qty unidade (UN) | step 1 | step 1 | ✔ | — |
| Qty peso (KG/G) | decimal manual | step 1 fixo | **✔ step 0,001** | — |
| Alterar quantidade | Grade inline / F2 | Sheet + stepper | ✔ | `PUT .../itens/:id` |
| Excluir item | Ícone grade | Ícone rascunho | ✔ | `DELETE .../itens/:id` |
| Recalcular totais | Automático backend | Reload detalhe | ✔ | Motor Comercial |
| Conta corrente | Tela dedicada | Top 10 na lista | ⚠ Resumo (sem tela full) | `projections/conta-corrente` |
| Entrega | Fluxo dedicado | Botão (rascunho + itens) | **✔ Gated** | `POST .../entrega` |
| Prestação abrir | Por status ENTREGUE | Sempre visível | **✔ Gated** | `POST .../prestacao/abrir` |
| Recebimento venda | Estação prestação | Sheet item + qty | ✔ | `POST .../prestacao/venda` |
| Perda | Estação | Sheet | ✔ | `POST .../prestacao/perda` |
| Baixa / pagamento | Estação | Sheet valor | ✔ | `POST .../prestacao/pagamento` |
| Encerramento | Fechar prestação | Botão gated | **✔ Gated** | `POST .../prestacao/fechar` |
| Venda oficial | Wizard fechamento | Botão | ✔ | `POST .../finalizar-venda-oficial` |
| Cancelamento rascunho | Menu ações | Botão rascunho | ✔ | `DELETE .../consignacoes/:id` |
| Reabertura | Conforme status | Sempre visível | **✔ Gated** | `POST .../prestacao/reabrir` |
| Emissão NFC-e | Estação fiscal | Botão prestação | ✔ | `POST .../emitir-nfce` |
| Histórico / timeline | Drawer abas | Resumo + share | ⚠ Parcial (sem timeline UI) | `prestacao/resumo-final` |
| Simulação crédito LIP | Painel lateral | — | ⚠ Não replicado (projeção UX Desktop) | — |
| Duplicar consignação | Menu | — | ✖ Fora escopo mobile | — |
| Imprimir termo entrega | PDF | Share texto | ⚠ Nativo share vs PDF | — |

**Legenda:** ✔ Paridade funcional · ⚠ Parcial (UI) · ✖ Não implementado (escopo)

---

## 3. Arquivos alterados (RC2.3.2)

| Arquivo | Alteração |
|---------|-----------|
| `js/pages/comercial.js` | Layout LIP (qty+Adicionar), ordem seções, `buildOperacoesBar`, step peso |
| `js/forms.js` | `qtyControlHtml`, `bindQtyControls`, `parseQty` (RC2.3.1+) |
| `css/mobile.css` | `.cds-prod-pick__row`, safe-area `#item-produtos`, botão add visível |
| `js/version.js` | `2.3.2-rc2.3.2` |
| `index.html` | Cache bust + título |
| `manifest.webmanifest` | Nome/descrição RC2.3.2 |
| `RC2_3_2_COMERCIAL_AUDIT.md` | Este documento |

---

## 4. Checklist homologação Mobile (fluxo completo)

Executar **somente no celular** (PWA ou browser mobile):

1. Comercial → Nova consignação  
2. Buscar cliente → selecionar perfil → Criar  
3. Buscar produtos → ajustar qty (−/+/digitar) → **Adicionar** (10 produtos)  
4. Alterar qty de item existente → Remover 1 item  
5. Voltar lista → reabrir → confirmar persistência  
6. Entrega (com itens)  
7. Abrir prestação → recebimento → pagamento → encerrar  
8. Emitir NFC-e (se ambiente fiscal ativo)  

Persistência e totais devem bater com ERP Desktop para o mesmo `consignacaoId`.

---

## 5. Paridade funcional — conclusão

| Área | Status RC2.3.2 |
|------|----------------|
| CRUD consignação + itens (rascunho) | **✔ Paridade API Desktop** |
| Fluxo operacional (entrega → prestação → fiscal) | **✔ Paridade API** (UI compacta) |
| Inclusão produtos (caso crítico) | **✔ Corrigido — paridade LIP** |
| UI densa Desktop (timeline, simulação crédito, duplicar) | **⚠ Parcial — by design mobile** |

**Veredicto:** O módulo Comercial Mobile possui **paridade funcional com o ERP Desktop** para todas as operações expostas no Mobile, utilizando exclusivamente os Motores Oficiais. Divergências restantes são de **densidade de UI**, não de regra de negócio ou API.

---

*CDS Sistemas · RC2.3.2 · Auditoria forense Comercial · 2026-07-17*
