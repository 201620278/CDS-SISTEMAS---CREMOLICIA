# RC2.3.8 — UX Polimento Final (Consignação)

**Versão:** `2.3.8-rc2.3.8` · Build `20260717rc238`  
**Escopo:** Inclusão sequencial de produtos sem reload · totais ao vivo · foco na busca  
**Restrições:** Somente frontend Mobile · Sem APIs / banco / motores / regras novas

---

## Parecer

**✔ APROVADO** — O operador pode incluir dezenas de produtos em sequência sem perder o foco, sem scroll forçado e sem recarregar cliente/crédito/perfil.

---

## Problemas anteriores

| Problema | Impacto |
|----------|---------|
| `reload()` após cada add/edit/delete | Tela inteira recarregava; scroll voltava ao topo |
| Busca e card do produto permaneciam | Operador precisava limpar e tocar de novo |
| Totais só após refresh | Feedback lento |
| Toast genérico | Pouca clareza da ação |

---

## Comportamento novo

### Inclusão em sequência
1. Buscar produto  
2. Quantidade → Adicionar  
3. Toast verde: **Produto adicionado**  
4. Busca limpa · card oculto · `focus()` + `select()` no campo  
5. Digitar o próximo produto imediatamente  

Sem `navigate` / sem refresh da página.

### Totais ao vivo
Após add / editar / excluir, atualiza apenas:
- Lista `#comercial-itens`
- Contador `Itens (N)`
- `#comercial-qtd-itens`
- `#comercial-total`
- `#comercial-saldo`
- Barra de ops (ex.: aparece **Entregar** quando sai de 0 itens)

Cliente, perfil, crédito e pendências **permanecem** (não são refetch).

### Feedback
| Ação | Toast | Variante |
|------|-------|----------|
| Adicionar | Produto adicionado | `success` (verde) |
| Editar | Quantidade atualizada | `info` (azul) |
| Excluir | Produto removido | `warning` (laranja) |

### Foco / scroll
- `focus({ preventScroll: true })` + `select()` na busca  
- Sem `scrollIntoView` após inclusão  
- Posição da tela preservada  

---

## Implementação

| Peça | Função |
|------|--------|
| `createItensDraftController` | Estado local + paint parcial |
| `fetchItensOnly` | `GET .../itens` somente |
| `resetProdutoBusca` | Limpa UI + foco |
| `itemRowHtml` | Re-render da lista |

Arquivo principal: `frontend/apps/mobile/js/pages/comercial.js`

---

## Aceite

- [x] 20 produtos seguidos sem retocar a busca  
- [x] Sem fechar teclado por reload  
- [x] Sem rolar ao topo  
- [x] Lista / qtd / total / saldo atualizam na hora  
- [x] Sem alteração de backend  

*CDS Sistemas · RC2.3.8 · UX Polimento Final · 2026-07-17*
