# CDS Mobile RC1 — Resumo técnico

| Campo | Valor |
|-------|--------|
| Nome | CDS Mobile RC1 |
| Versão semântica | `1.0.0-rc1` |
| Build | `20260716rc1` |
| Status | **Congelada** |
| Caminho | `frontend/apps/mobile/` |
| Entrada | `/apps/mobile/` |
| Copyright | © 2026 CDS Sistemas |

## Stack

- Vanilla ES modules (lazy-load por página)
- CSS próprio + Design System (`/shared/design-system/`)
- HTTP via `window.CDSApi` (`frontend/shared/api/client.js`)
- Auth/permissões via `access-control.js` + JWT em `localStorage`
- PWA: `manifest.webmanifest` + `sw.js`

## Superfície

- Shell: `index.html`, `js/app.js`, `css/mobile.css`
- Núcleo: `version.js`, `permissions.js`, `formatters.js`, `ui.js`, `forms.js`, `icons.js`, `toast.js`
- Páginas: `dashboard`, `cadastros`, `clientes`, `fornecedores`, `produtos`(+estoque), `usuarios`, `comercial`, `financeiro`, `fiscal`, `pdv`, `perfil`, `configuracoes`

## Contrato com a plataforma

- Consome apenas `/api/*` existentes
- Não altera backend, banco, controllers, services, models
- Não altera ERP Desktop nem PDV Desktop
- Não introduz regras de negócio no frontend

## Qualidade RC1

- Formatters obrigatórios para exibição
- Estados de UI padronizados
- Touch mínimo ~48px
- Overflow horizontal contido no shell
- Logs de diagnóstico apenas com `?debug=1` (removidos do fluxo padrão)

## Congelamento

Esta release **não deve receber novas funcionalidades**.  
Alterações permitidas apenas: correção crítica de segurança/regressão, após processo explícito de hotfix.
