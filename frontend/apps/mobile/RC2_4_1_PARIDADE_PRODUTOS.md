# RC2.4.1 — Paridade Oficial do Cadastro de Produtos (Desktop × Mobile)

**Versão:** `2.4.1-rc2.4.1` · Build `20260717rc241`  
**Referência oficial:** ERP Desktop (`frontend/erp/js/produtos.js` → `showProdutoModal` / `saveProduto`)  
**Restrições:** Sem novas APIs · Sem alteração de banco · Sem alteração de Motores · Sem campos exclusivos do Mobile

---

## 1. Veredicto

O cadastro de produtos do CDS Mobile passa a espelhar o cadastro oficial do ERP Desktop: mesmos campos de formulário, mesmo payload de `POST /produtos` e `PUT /produtos/:id`, e **sem** funcionalidade de foto (inexistente no Desktop).

**Status:** Paridade oficial do cadastro de produtos Desktop × Mobile alcançada (sujeito a smoke test cruzado).

---

## 2. Funcionalidades removidas

| Item | Onde estava | Motivo |
|------|-------------|--------|
| Botão / fluxo de câmera no detalhe | `renderDetail` (`#prod-foto`) | ERP Desktop não possui foto de produto |
| Preview de imagem (`photoThumbHtml`) | Detalhe do produto | Mídia local exclusiva do Mobile |
| `capturePhoto` / `getLocalMedia` / `setLocalMedia` para produto | Import e handlers | Sem suporte oficial no ERP |
| Limpeza de mídia local no delete | `setLocalMedia('produto', id, '')` | Foto removida do escopo |
| Campo `ativo` / “Disponível para venda” | Formulário Mobile | Não faz parte do `saveProduto` Desktop |
| Campo legado `estoque_atual` isolado | Formulário novo | Desktop usa `saldo_fiscal_inicial` + `saldo_nao_fiscal_inicial` |
| Envio de imagem no payload | N/A (nunca ia ao servidor) | Garantido: payload sem qualquer campo de mídia |

A foto permanece **oficialmente removida** até existir suporte completo no ERP Desktop.

---

## 3. Campos revisados (formulário)

### 3.1 Mantidos / alinhados ao Desktop

| Grupo | Campos |
|-------|--------|
| Identificação | `codigo`, `nome`, `categoria_id`, `subcategoria_id`, `unidade` |
| Código de barras | `codigo_barras` + scanner (BarcodeDetector) + digitação manual |
| Preços | `preco_compra`, `lucro_percentual`, `preco_venda`, `venda_atacado` |
| Estoque | `saldo_fiscal_inicial`, `saldo_nao_fiscal_inicial` (novo / sem movimentação), `estoque_minimo` |
| Fornecedor | `fornecedor` |
| Validade | `controlar_validade`, `data_validade_inicial`, `dias_alerta_validade` |
| Peso | `produto_fracionado`, `permite_venda_unidade`, `peso_medio_unidade`, `preco_unidade` |
| Fiscal | `ncm`, `cfop`, `csosn`, `origem`, `cest`, `aliquota_icms`, `aliquota_pis`, `aliquota_cofins` |

### 3.2 Unidades (paridade Desktop)

`un` · `kg` · `g` · `l` · `ml` · `mt` · `m2` · `m3`

### 3.3 Fora do escopo Mobile (já exclusivos / avançados do Desktop)

- Editor de faixas de atacado (CRUD completo) — flag `venda_atacado` + leitura de faixas no detalhe
- Unidades comerciais MUC
- Painel completo do motor de conversão (valor total pago ÷ quantidade) — flags de peso/fracionado presentes; custo unitário avançado permanece no Desktop

---

## 4. Payload Desktop × Mobile

Função Mobile: `buildProdutoPayload()` em `js/pages/produtos.js`  
Espelho de: `saveProduto()` em `frontend/erp/js/produtos.js`

| Campo | Desktop | Mobile RC2.4.1 | Paridade |
|-------|---------|----------------|----------|
| `codigo` | ✔ | ✔ | ✔ |
| `nome` | ✔ | ✔ | ✔ |
| `categoria_id` | ✔ | ✔ | ✔ |
| `subcategoria_id` | ✔ | ✔ | ✔ |
| `unidade` | ✔ | ✔ | ✔ |
| `preco_compra` | ✔ | ✔ | ✔ |
| `preco_venda` | ✔ | ✔ | ✔ |
| `lucro_percentual` | ✔ | ✔ | ✔ |
| `estoque_minimo` | ✔ | ✔ | ✔ |
| `fornecedor` | ✔ | ✔ | ✔ |
| `data_validade` | ✔ | ✔ | ✔ |
| `lote` | ✔ | ✔ | ✔ |
| `dias_alerta_validade` | ✔ | ✔ | ✔ |
| `controlar_validade` | ✔ | ✔ | ✔ |
| `ncm` / `cfop` / `csosn` | ✔ | ✔ | ✔ |
| `origem` / `cest` | ✔ | ✔ | ✔ |
| `codigo_barras` | ✔ | ✔ | ✔ |
| `aliquota_icms` / `pis` / `cofins` | ✔ | ✔ | ✔ |
| `produto_fracionado` / `vendido_por_peso` | ✔ | ✔ | ✔ |
| `permite_venda_unidade` / `peso_medio_unidade` / `preco_unidade` | ✔ | ✔ | ✔ |
| `venda_atacado` | ✔ | ✔ | ✔ |
| `data_validade_inicial` | ✔ | ✔ | ✔ |
| `saldo_fiscal_inicial` / `saldo_nao_fiscal_inicial` | ✔ (quando editáveis) | ✔ (idem) | ✔ |
| `item_fiscal` | ✔ (mesma regra) | ✔ | ✔ |
| `ativo` | ✖ no save | **removido** | ✔ |
| `estoque_atual` (form) | ✖ (legado interno) | **removido** | ✔ |
| `foto` / `imagem` / data URL | ✖ | **removido** | ✔ |

Endpoints (inalterados):

- `POST /produtos`
- `PUT /produtos/:id`
- `GET /produtos/:id`
- `GET /categorias?tipo=produto`
- `GET /subcategorias/categoria/:id`

---

## 5. UX após remoção da foto

- Formulário reorganizado em seções: Identificação → EAN → Preços → Estoque → Fornecedor → Validade → Peso → Fiscal
- Espaços da área de mídia eliminados no detalhe (título + linhas de dados)
- Scanner EAN acoplado ao campo (botão “Escanear”) sem bloco visual órfão
- Painéis condicionais (validade / venda por unidade) ocultos até ativação — sem buracos no layout
- CSS: `.cds-ean-row`, `.cds-form-hint`, `.is-hidden` em `css/mobile.css`

---

## 6. Evidências de paridade

| Cenário | Esperado | Como validar |
|---------|----------|--------------|
| Criar no Mobile → abrir no Desktop | Todos os campos do payload visíveis no modal ERP | Smoke cruzado |
| Editar no Desktop → abrir no Mobile | Mesmos valores no formulário/detalhe Mobile | Smoke cruzado |
| EAN scanner / manual | Campo `codigo_barras` idêntico | Digitar + escanear |
| Sem foto | Nenhuma UI/câmera/upload no cadastro de produtos | Inspeção visual + código |
| Payload | JSON alinhado a `saveProduto` | DevTools Network |

---

## 7. Checklist final do cadastro de produtos

- [x] Foto removida (UI + handlers + mídia local de produto)
- [x] Nenhum campo exclusivo Mobile no formulário
- [x] Payload `POST`/`PUT` alinhado ao Desktop
- [x] Código de barras EAN/GTIN + scanner + manual
- [x] Categoria / subcategoria / unidade Desktop
- [x] Preços, estoque fiscal/não fiscal, validade, peso, fiscal
- [x] Formulário reorganizado sem espaços vazios da foto
- [x] Versão `2.4.1-rc2.4.1` em `version.js`, `manifest`, SW, cache bust
- [ ] Smoke físico: criar Mobile → conferir Desktop
- [ ] Smoke físico: editar Desktop → conferir Mobile

---

## 8. Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `js/pages/produtos.js` | Paridade formulário + `buildProdutoPayload` + remoção foto |
| `css/mobile.css` | Layout EAN / seções / `is-hidden` |
| `js/version.js` | `2.4.1-rc2.4.1` |
| `manifest.webmanifest` | RC2.4.1 |
| `sw.js` | Cache `cds-mobile-2.4.1-rc241` |
| `index.html` | Título + `?v=2.4.1-rc2.4.1` |
| `RC2_4_1_PARIDADE_PRODUTOS.md` | Este relatório |

---

*CDS Sistemas · RC2.4.1 · Paridade Cadastro de Produtos · 2026-07-17*
