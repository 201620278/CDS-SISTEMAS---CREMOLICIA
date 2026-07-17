# UX_TOUCH_AUDIT_RC235 — Touch, Scroll e UX Mobile

**Versão:** `2.3.5-rc2.3.5` · Build `20260717rc235`  
**Escopo:** Experiência de toque/rolagem equivalente a app Android nativo  
**Restrições:** Somente frontend Mobile · Sem APIs · Sem banco · Sem regras de negócio · Sem alteração dos Motores Oficiais

---

## 1. Veredicto

O CDS Mobile passa a usar **um único scroll de documento**, com overlays fechados **inertes ao toque**, sticky bars que **não engolem o gesto de pan**, e `touch-action: pan-y` no shell — eliminando travamentos típicos de WebView Android.

---

## 2. Problemas encontrados

| ID | Problema | Causa raiz | Telas afetadas |
|----|----------|------------|----------------|
| T1 | Rolagem “morta” na borda esquerda | Drawer fechado com `translateX(-105%)` **sem** `pointer-events: none` — overlay fantasma | Todas |
| T2 | Backdrop fantasma | Backdrop sem garantia de `display:none` + `pointer-events:none` quando `[hidden]` | Todas (menu) |
| T3 | Sticky Comercial/PDV bloqueando scroll | Container sticky full-width com `pointer-events` padrão captura o pan | Comercial detalhe, PDV |
| T4 | Animação `translateY` residual | `.cds-m-rise` deixava `transform` (fill-mode `both`) — layer que atrapalha sticky/scroll | Listagens / cards |
| T5 | `overscroll-behavior-y: none` no body | Sensação de scroll “preso”; sem bounce/contain nativo | Todas |
| T6 | Falta de `touch-action: pan-y` | Browser podia interpretar gestos como zoom/drag horizontal | Todas |
| T7 | `stopPropagation`/`preventDefault` em botões qty/Adicionar | Desnecessário em `click`; risco de interferência em gestos compostos | Comercial |
| T8 | `scrollIntoView` automático após busca | Forçava salto de viewport e interrompia pan do operador | Comercial itens |
| T9 | Sheet/drawer sem lock de fundo | Scroll do documento “vazava” atrás do modal | Sheets / drawer |
| T10 | Z-index ad hoc | Camadas sem árvore clara; risco de toast/sheet/scan conflitarem | Globais |

**Não encontrado:** listeners `touchstart`/`touchmove`/`pointermove`/`wheel` bloqueando scroll. `preventDefault` restante é só em `submit` de formulários (correto).

---

## 3. Correções realizadas

### 3.1 Touch / overlays
- Drawer fechado: `pointer-events: none` + `visibility: hidden`
- Backdrop `[hidden]`: `display:none !important` + `pointer-events:none`
- Boot `[hidden]`: idem
- Sheet fechado: `visibility: hidden` além de `pointer-events: none`
- Sticky Comercial/PDV: `pointer-events: none` no wrapper; `auto` só em botões/inputs

### 3.2 Scroll único
- Scroll principal = `html` / documento
- `.cds-mobile-main` **sem** `overflow:auto` (evita scroll-dentro-de-scroll)
- Nested scroll **apenas** onde necessário: drawer nav, sheet panel, tabs (pan-x), diag, perm-grid
- `body.is-overlay-open { overflow: hidden }` **somente** com drawer/sheet/scan abertos

### 3.3 CSS Android Chrome
```css
touch-action: pan-y;          /* shell / main */
touch-action: manipulation;   /* botões / chrome */
touch-action: pan-x;          /* tabs */
-webkit-overflow-scrolling: touch;
overscroll-behavior-y: contain;
```

### 3.4 Animações
- Enter/rise: **somente opacity** (sem `translateY`)
- `prefers-reduced-motion: reduce` respeitado
- Keyframe `cds-fade` definido para backdrop

### 3.5 JS
- `forms.js`: removido `preventDefault`/`stopPropagation` dos +/- de qty
- `comercial.js`: Adicionar sem stopPropagation; sem `scrollIntoView` forçado; bind idempotente (`data-bound-add`)
- `app.js` / `forms.js` / `native.js`: sincronizam `is-overlay-open` no `body`

### 3.6 Árvore de camadas (z-index)

```
--z-scan:            9999   Scanner câmera
--z-toast:           1300   Toasts (pointer-events: none no viewport)
--z-sheet:           1200   Bottom sheet
--z-boot:             100   Splash boot
--z-drawer:            60   Drawer
--z-drawer-backdrop:   50   Backdrop drawer
--z-chrome:            40   Topbar + Bottom nav
--z-fab:               30   FAB
--z-sticky:             6   Sticky actions (hit-test só nos botões)
```

---

## 4. Evidências da melhoria

| Antes | Depois |
|-------|--------|
| Drawer off-screen ainda elegível a hit-test | Inerte até `.is-open` |
| Sticky bar engolia pan na base da tela | Pan atravessa o gradiente; botões clicáveis |
| Enter com transform residual | Opacity only |
| Scroll sensação “travada” | `pan-y` + `overscroll-behavior: contain` |
| Sheet com página rolando atrás | Lock temporário `is-overlay-open` |
| Busca produto puxava viewport | Sem auto-scroll |

Arquivos:
- `frontend/apps/mobile/css/mobile.css`
- `frontend/apps/mobile/js/forms.js`
- `frontend/apps/mobile/js/app.js`
- `frontend/apps/mobile/js/pages/comercial.js`
- `frontend/apps/mobile/js/native.js`
- `frontend/apps/mobile/js/version.js`

---

## 5. Responsividade (360 → 1024)

| Largura | Scroll documento | Action bars | Bottom nav |
|---------|------------------|-------------|------------|
| 360px | ✔ | full-width wrap | acima + safe-area |
| 390px | ✔ | 2 colunas | idem |
| 412px | ✔ | 2 colunas | idem |
| 768px | ✔ | max-width 720 | idem |
| 1024px | ✔ | max-width 880 | idem |

Nenhum container de página usa `overflow:auto` além dos casos listados (overlay/diag/tabs).

---

## 6. Checklist de homologação

| Tela | Rolagem por deslize | Toques em botões | Overlay sem fantasma |
|------|---------------------|------------------|----------------------|
| Dashboard | ☐ | ☐ | ☐ |
| Clientes | ☐ | ☐ | ☐ |
| Fornecedores | ☐ | ☐ | ☐ |
| Produtos | ☐ | ☐ | ☐ |
| Comercial (lista / nova / detalhe) | ☐ | ☐ | ☐ |
| Financeiro | ☐ | ☐ | ☐ |
| Compras | ☐ | ☐ | ☐ |
| Fiscal | ☐ | ☐ | ☐ |
| PDV | ☐ | ☐ | ☐ |
| Configurações | ☐ | ☐ | ☐ |
| Drawer + Bottom Sheet | ☐ | ☐ | ☐ |

**Roteiro rápido Android Chrome:**
1. Abrir lista longa (Produtos/Clientes) → pan vertical contínuo sem “grudar”.
2. Abrir e fechar drawer → tocar a área esquerda; conteúdo deve receber o toque.
3. Comercial detalhe → pan através da região sticky; botões de ação ainda respondem.
4. Abrir sheet (ex.: pagamento) → fundo não rola; fechar → scroll volta.
5. FAB e bottom nav → toque imediato (`manipulation`), sem delay de double-tap zoom.

---

## 7. Aceite

- [x] Sem bloqueio desnecessário de scroll por listeners de touch
- [x] Sem overlay fantasma capturando toque
- [x] Um scroll principal de documento
- [x] `touch-action` / overscroll adequados ao Android Chrome
- [x] Z-index documentado e sticky transparente ao pan
- [x] Animações sem impedir gesto
- [x] Relatório gerado neste arquivo

*CDS Sistemas · RC2.3.5 · UX Touch/Scroll · 2026-07-17*
