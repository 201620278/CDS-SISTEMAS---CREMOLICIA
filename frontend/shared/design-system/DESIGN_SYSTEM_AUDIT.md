# DESIGN SYSTEM AUDIT

**Gerado em:** 2026-07-14  
**Comando:** `npm run audit:design-system`  
**Escopo:** `frontend/shared/design-system` + `ux-enterprise.css`

---

## Resumo

| Categoria | Ocorrências | Status |
|-----------|-------------|--------|
| Tokens inválidos | 0 | ✅ |
| Cores hardcoded (componentes) | 0 | ✅ |
| Seletores globais h1–h6 | 0 | ✅ |
| `!important` | 0 | ✅ |
| `font-size: Npx` (fora tokens) | 5 | ⚠️ |

**Total bloqueante (tokens + headings + hardcoded):** 0

---

## Tokens inválidos

_Nenhum no Design System._

---

## Cores hardcoded em componentes

_Paleta em `tokens/` e definições em `themes/` são permitidas._

_Nenhuma._


---

## Seletores globais perigosos (h1–h6)

_Nenhum — use classes `cds-eyebrow`, `cds-title`, `cds-page-header`._

---

## !important

_Nenhum._

---

## font-size em px (fora typography tokens)

- `frontend/shared/design-system/components/cards/CDSOperationalCard.js:37` — `font-size: 28px`
- `frontend/shared/design-system/components/feedback/CDSToast.js:71` — `font-size: 20px`
- `frontend/shared/design-system/primitives/base/Badge.js:94` — `font-size: 10px`
- `frontend/shared/design-system/primitives/form/Checkbox.js:87` — `font-size: 12px`
- `frontend/shared/design-system/primitives/form/Checkbox.js:97` — `font-size: 14px`

---

## Comparação UX-07 (problemas sistêmicos)

| ID UX-07 | Problema | Status pós DS-02 |
|----------|----------|------------------|
| P0-01 | `--color-neutral-0` inexistente | ✅ Token oficial: `--color-neutral-000` + `--color-surface` nos temas |
| P0-02 | `ux-enterprise.css` sobrescreve h1 | ✅ Regras globais de h1 removidas |
| P0-03 | StatCard fundo branco fixo | ✅ `components/stat-cards.css` + tokens |
| P0-04 | Drawer fundo branco fixo | ✅ `components/drawers.css` + tokens |
| P0-05 | Conflito Input/autofill/!important | ✅ `inputs.css` unificado sem !important |
| P0-14 | Loading overlay branco | ✅ `loading.css` + `inject.js` com `--color-overlay` |

**Nota:** CSS de páginas (`pages/*/styles.css`) não foi alterado nesta sprint. Referências a `--color-neutral-0` em telas devem migrar para `--color-surface` na sprint de correção de telas.

---

## Critérios DS-02

✅ **Fundação DS aprovada** (componentes oficiais).
