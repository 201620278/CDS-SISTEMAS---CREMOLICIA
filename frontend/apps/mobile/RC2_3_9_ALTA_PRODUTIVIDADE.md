# RC2.3.9 — Alta Produtividade (Consignação)

**Versão:** `2.3.9-rc2.3.9` · Build `20260717rc239`  
**Escopo:** Menos toques na inclusão de produtos · frontend Mobile apenas  
**Restrições:** Sem backend · Sem APIs novas · Sem banco · Sem Motores · Sem regras comerciais novas

---

## Parecer

**✔ APROVADO** — Fluxo de inclusão otimizado para operação rápida (qty inteligente, Enter, barcode 1:1, repetir último).

---

## Melhorias

### 1. Quantidade inteligente
| Unidade | Qty inicial | Foco |
|---------|-------------|------|
| UN | `1` | campo selecionado (`select`) |
| KG / peso | `0,000` | cursor no campo |

### 2. Enter / Done do teclado
No campo quantidade: **Enter** (ou Done) dispara **Adicionar** automaticamente.

### 3. Código de barras
- Busca com **exatamente 1** produto → seleciona direto (sem lista)
- Enter na busca faz flush imediato (leitor)
- Vários resultados → lista normal

### 4. Adicionar novamente
- Guarda em memória o último produto + qty desta consignação
- Botão **Adicionar novamente** repete só a quantidade (sem nova pesquisa)
- Limpa ao sair da consignação (não persiste em storage)

### 5. Performance
Mantido RC2.3.8: atualiza só lista / totais / ops — não refetch de cliente, perfil, crédito, pendências ou histórico.

---

## Fluxos rápidos

**UN / teclado**
```
Buscar → (1 hit) → Enter (qty=1) → Adicionado → foco busca
```

**KG**
```
Buscar → (1 hit) → digitar peso → Enter → Adicionado
```

**Barcode**
```
Scan → Enter → produto → qty → Enter
```

**Repetir**
```
Adicionar novamente (mesmo produto + qty)
```

---

## Arquivos

| Arquivo | Mudança |
|---------|---------|
| `js/pages/comercial.js` | qty / Enter / barcode / repeat |
| `js/forms.js` | `enterkeyhint` no qty |
| `css/mobile.css` | botão repetir |
| `js/version.js` + cache bust | `2.3.9-rc2.3.9` |

---

## Aceite

- [x] Menor número de toques na inclusão sequencial  
- [x] Enter adiciona  
- [x] 1 código → seleção automática  
- [x] N códigos → lista  
- [x] Repetir último em memória  
- [x] Sem alteração de regras/APIs/motores  

*CDS Sistemas · RC2.3.9 · Alta Produtividade · 2026-07-17*
