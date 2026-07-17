# Auditoria forense — Render CDS Mobile RC1

**Data:** 2026-07-16  
**Build hotfix:** `1.0.0-rc1.2`

## Sintoma

Componentes aparecem por ~200–300 ms e depois “somem” (tela em branco / botão some).  
O DOM **não era limpo**: os nós permaneciam com `opacity: 0`.

## Linha do tempo (causa raiz)

```
1. Página chama render() / formCardHtml() / listCardHtml()
2. Markup inclui classe compartilhada: class="… cds-anim-fade"
3. Design System (fade.css L24–27) aplica: .cds-anim-fade { opacity: 0 }
4. Mobile.css aplicava animation cds-fade (0 → 1) ~280ms
   → usuário VÊ o componente
5. Animação termina SEM fill-mode forwards estável / cascade DS vence
6. Opacidade volta a 0 (regra permanente do DS)
   → componente “desaparece”
```

**Quem “removeu” o componente:** o CSS do Design System (`.cds-anim-fade { opacity: 0 }`), não `innerHTML`, não permissões, não Promise vazia.

## Evidência

| Item | Local |
|------|--------|
| Regra oculta permanente | `frontend/shared/design-system/animations/fade.css` L24–27 |
| Semântica DS | `.cds-anim-fade` = oculto até `.is-visible` |
| Uso indevido no Mobile | todas as páginas + `ui.js` + `forms.js` |

## Páginas afetadas (todas que usavam `cds-anim-fade`)

Dashboard, Cadastros, Clientes, Fornecedores, Produtos, Usuários, Comercial (incl. formulário após Perfil Comercial), Financeiro, Fiscal, PDV, Mais, Perfil, estados loading/empty/error, formulários CRUD.

Exemplo Comercial → Perfil:

```
toque no perfil
↓
#nova-form.innerHTML = formCardHtml(… cds-anim-fade …)   // forms.js
↓
botão azul visível durante animação
↓
opacity cascateia para 0 (DS)
↓
botão “some”
```

## O que NÃO era a causa

- `hashchange` duplicado (inexistente)
- `MutationObserver` (inexistente)
- filtro de permissões apagando cards da Mais
- segundo `innerHTML = ''` após o render da Mais

## Correção estrutural (não sintoma)

1. **Namespace de animação Mobile:** `cds-m-enter` / `cds-m-rise`  
   Nunca mais reutilizar `.cds-anim-*` do DS no Mobile.
2. **Router com `navSeq`:** renders async obsoletos não sobrescrevem o DOM da navegação atual.

## Arquivos alterados

- `css/mobile.css` — classes `cds-m-enter` / `cds-m-rise`
- `js/ui.js`, `js/forms.js`, `js/app.js`, todas as `js/pages/*` afetadas
- `index.html` / `sw.js` — cache `1.0.0-rc1.2`
