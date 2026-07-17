# RC2.3.3 — Auditoria Forense Autenticação Mobile

**Versão:** `2.3.3-rc2.3.3` · Build `20260717rc233`

---

## Sintoma

Após RC2.3.2, Home exibia:

- «Falha ao carregar a Home»
- «Sem permissão»
- «Token inválido ou expirado»
- HTTP **403**

Usuário permanecia logado na shell sem redirect para login.

---

## Causa raiz (confirmada)

### Divergência Desktop × Mobile no tratamento HTTP

| Cenário | Backend (`middleware/auth.js`) | ERP Desktop (`shared/js/core.js`) | Mobile RC2.3.1–2.3.2 (`shared/api/client.js`) |
|---------|-------------------------------|-----------------------------------|-----------------------------------------------|
| Sem token | **401** | Redirect login | Redirect login ✔ |
| JWT inválido/expirado | **403** «Token inválido ou expirado» | Redirect login (`isErroSessaoExpirada`) ✔ | **Ignorado** — tratava como erro genérico ✖ |
| Permissão negada (token válido) | **403** «Acesso restrito…» | Permanece na tela | Permanece na tela ✔ |

O token **não necessariamente “sumiu”** — o Mobile:

1. `requireAuth()` — passava se existisse qualquer string em `localStorage.token`
2. `verifySession()` — em 403 JWT retornava **`true`** («rede instável, segue»)
3. `CDSApi.request()` — só fazia logout em **401**
4. Dashboard — exibia erro 403 na Home em vez de redirecionar

### Fatores agravantes (secundários)

- **Service Worker RC1** — cache-first em `index.html` podia servir shell antigo após cache bust (corrigido: network-first para HTML/JS)
- **Authorization: Bearer** com token vazio/corrupto (`"null"`) — sanitizado em `getToken()`

### O que NÃO era a causa

- RC2.3.2 Comercial (CSS/layout) — não altera auth
- Headers `X-CDS-Client` / `X-Terminal-Id` — enviados corretamente via `terminal.js`
- APIs novas — nenhuma criada

---

## Correções RC2.3.3

### `shared/api/client.js`

- `isSessionExpiredError()` — paridade `core.js isErroSessaoExpirada`
- 401 **ou** 403-sessão → `clearSessionAndRedirectLogin()`
- `getToken()` — rejeita `null`/`undefined`/vazio
- Não envia header `Authorization` sem token

### `apps/mobile/js/app.js`

- `verifySession()` — falha em 403-sessão (não continua com token inválido)
- `requireAuth()` — usa `CDSApi.getToken()`
- `renderRoute` — não pinta erro se redirect de sessão em curso

### `apps/mobile/js/pages/dashboard.js`

- Não exibe «Falha Home» se erro for sessão expirada

### `apps/mobile/sw.js`

- Cache `cds-mobile-2.3.3-rc233`
- Network-first para HTML/JS/CSS do shell

---

## Fluxo validado (pós-correção)

| Etapa | Comportamento |
|-------|---------------|
| Login | Token + user em `localStorage` ✔ |
| Redirect pós-login | `obterDestinoPosLogin` → `/apps/mobile/` ✔ |
| Boot | `auth/verificar` com Bearer + headers mobile ✔ |
| Token inválido | Redirect `/login?client=mobile` — **nunca fica na Home com 403** ✔ |
| Token válido sem permissão | Home parcial + banner (403 permissão isolada) ✔ |
| Módulos | Comercial, Financeiro, PDV, Estoque, Cadastros — Bearer em todas as chamadas ✔ |

---

## Arquivos alterados

- `frontend/shared/api/client.js`
- `frontend/apps/mobile/js/app.js`
- `frontend/apps/mobile/js/pages/dashboard.js`
- `frontend/apps/mobile/sw.js`
- `frontend/apps/mobile/js/version.js`
- `frontend/apps/mobile/index.html`
- `frontend/apps/mobile/manifest.webmanifest`
- `frontend/apps/mobile/RC2_3_3_AUTH_AUDIT.md`

---

*CDS Sistemas · RC2.3.3 · Hotfix auth · 2026-07-17*
