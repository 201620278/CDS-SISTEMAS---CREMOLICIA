# Auditoria Comercial — Busca de Produtos e Inconsistências

**Data:** 2026-07-09  
**Escopo:** Motor Comercial — Nova Consignação e utilitários operacionais  
**Sintoma reportado:** Produtos não eram encontrados ao inserir na consignação

---

## Resumo executivo

A busca de produtos estava **completamente inoperante** por dois bugs estruturais no frontend. A correção restaura o fluxo e alinha a busca ao mesmo endpoint usado pelo PDV.

| Severidade | Problema | Status |
|------------|----------|--------|
| **P0** | `Input.create` ignorava `id` — `getElementById('product-search')` retornava `null` | Corrigido |
| **P0** | Busca de cliente/produto lia `.value` do container `div`, não do `<input>` | Corrigido |
| **P1** | `buscarProdutosErp` carregava todos os produtos e filtrava no cliente | Corrigido — usa `/produtos/consulta-pdv/buscar` |
| **P2** | Sem feedback visual de resultados de produtos | Corrigido — painel de resultados + `choiceDialog` |
| **P2** | Produto duplicado podia ser adicionado duas vezes | Corrigido — validação antes de inserir |
| **P2** | Enter não funcionava na busca de cliente | Corrigido |

---

## Causa raiz (P0)

### 1. Componente Input sem suporte a `id`

`NovaConsignacao` passava `id: 'product-search'`, mas `Input.create` não aplicava o atributo no elemento `<input>`. O método `_addProduct` usava:

```javascript
document.getElementById('product-search') // sempre null
```

Resultado: clique em **Adicionar** saía silenciosamente sem ação.

### 2. Leitura incorreta do valor do campo

Tanto cliente quanto produto usavam o **container** retornado por `Input.create` (um `div.cds-input-group`) e liam `.value`, que em elementos `div` é sempre `undefined`.

Isso quebrava:
- Botão **Buscar** de clientes (exceto quando vinham do Cliente 360°)
- Tecla **Enter** nos campos de busca
- Botão **Adicionar** de produtos

---

## Correções aplicadas

### `Input.js`
- Suporte a `id` e `name` no elemento `<input>` interno

### `operacional.js`
- `extrairValorInput(field)` — lê valor do input real dentro do container
- `buscarProdutoPorIdErp(id)` — busca por ID numérico
- `buscarProdutosErp(termo)` — prioriza `/produtos/consulta-pdv/buscar` (mesmo do PDV), com fallback para listagem local
- `normalizarProdutoBusca` — padroniza `nome` e `preco_venda`

### `NovaConsignacao/index.js`
- Busca de cliente corrigida com `extrairValorInput`
- Etapa de itens: botões **Buscar** e **Adicionar**, Enter funcional
- Painel de resultados com ação por produto
- `choiceDialog` quando há múltiplos resultados
- Bloqueio de produto duplicado na mesma consignação

---

## Homologação sugerida

1. Reiniciar app ou recarregar após `npm run build:motor-comercial`
2. Nova Consignação → etapa **Itens**
3. Buscar por nome parcial → ver lista de resultados
4. Adicionar produto → confirmar na tabela
5. Buscar por ID ou código de barras → adicionar
6. Tentar adicionar o mesmo produto → mensagem de duplicidade
7. (Menu) Nova Consignação sem 360° → buscar cliente por nome → confirmar funcionamento

---

## Testes

```bash
npm run test:motor-comercial-frontend
npm run build:motor-comercial
```

Novos testes: `buscarProdutosErp.test.js`
