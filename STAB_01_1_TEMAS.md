# STAB-01.1 — Correção da Aplicação de Temas

**Data:** 12/07/2026  
**Escopo:** Apenas aplicação de temas (sem backend/APIs/negócio)

## Causa raiz

1. O **login** gravava o tema em `localStorage['cds-ui-theme']` — a **mesma chave** do ERP.
2. Ao escolher “Escuro” no login (mesmo só para a tela de autenticação), o Motor Comercial / ERP abria em Dark.
3. O `erp/index.html` **não declarava** Classic no primeiro paint.

## Correções

| Item | Alteração |
|------|-----------|
| Login | Chave isolada `cds-login-ui-theme` |
| ERP HTML | `data-theme="classic"` + boot script antes do CSS |
| ThemeManager | Default Classic + migração one-shot que remove Dark legado da chave do ERP |
| tokens/colors.css | Semânticos padrão alinhados ao Classic (surface branca) |
| inject.js | `initTheme({ defaultTheme: 'classic' })` |

## Comportamento esperado

- Ao iniciar o ERP → **Classic**
- Dark / High Contrast → somente após `setTheme(...)` explícito
- Login pode usar Escuro sem afetar o ERP

## Verificação

- Testes: **191/191** (inclui 7 novos do ThemeManager)
- Build Motor Comercial: OK
- Auditoria DS: 0 violações
