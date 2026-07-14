# DS-01.1 — Auditoria de Regressões Pós Design System

**Data:** 09/07/2026  
**Escopo:** Frontend Motor Comercial — correção de regressões após DS-01  
**Sem alterações em:** backend, banco, APIs, regras de negócio

---

## Resumo

Após a migração para o CDS Design System, foram identificadas regressões em layout, utilitários e rótulos de navegação. Todas foram corrigidas na causa raiz. **158/158 testes passando.** Bundle reconstruído.

---

## Regressões encontradas

### P0-01 — Nova Consignação com aparência de wizard legado

| Item | Detalhe |
|------|---------|
| **Sintoma** | Tela com classes `cds-wizard-layout`, sensação de wizard antigo de 5 etapas |
| **Causa raiz** | `NovaConsignacao` ainda usava `WizardLayout` (primitivo legado) em vez de `CDSPage` do Design System; estilos antigos de wizard coexistiam com UX-04 |
| **Impacto** | Painel lateral e footer não atualizavam corretamente (seletor `.cds-wizard-layout__sidebar` inexistente no DOM) |

### P0-02 — `ReferenceError: extrairValorInput is not defined`

| Item | Detalhe |
|------|---------|
| **Sintoma** | Erro no console ao usar cadastro de cliente |
| **Causa raiz** | `extrairValorInput` vivia dentro de `operacional.js`, que importa `Button`, `Input` e `Modal` — cadeia circular com componentes reexportados do Design System; em alguns momentos de carga o binding falhava |
| **Impacto** | `ClienteCadastroView._getFieldValue()` quebrava ao salvar/editar cliente |

### P0-03 — WizardLayout sem slot de sidebar

| Item | Detalhe |
|------|---------|
| **Sintoma** | Painel lateral de Preparar Entrega e Fechar Consignação não atualizava após mudança de etapa |
| **Causa raiz** | `WizardLayout.create()` inseria sidebar direto no body sem classe `.cds-wizard-layout__sidebar`, mas `_updateWizard()` buscava esse seletor |
| **Impacto** | UX degradada — parecia fluxo antigo/travado |

### P0-04 — Rótulo ERP desatualizado

| Item | Detalhe |
|------|---------|
| **Sintoma** | Menu lateral ERP exibia "Nova Consignação" |
| **Causa raiz** | `frontend/erp/index.html` não atualizado na UX-04 |
| **Impacto** | Operador via terminologia antiga antes mesmo de abrir a tela |

---

## Arquivos corrigidos

| Arquivo | Correção |
|---------|----------|
| `pages/NovaConsignacao/index.js` | Migrado de `WizardLayout` para `CDSPage`; IDs `preparar-entrega-*`; seletores de atualização alinhados ao layout oficial |
| `pages/NovaConsignacao/styles.css` | Estilos para `cds-preparar-entrega-page` com `CDSPage` |
| `shared/design-system/primitives/layouts/WizardLayout.js` | Sidebar encapsulada em `<aside class="cds-wizard-layout__sidebar">` (Fechar Consignação e demais fluxos wizard) |
| `utils/formField.js` | **Novo** — `extrairValorInput` isolado, sem dependências de componentes |
| `utils/operacional.js` | Reexporta `extrairValorInput` de `formField`; removida duplicação |
| `pages/PerfilComercial/ClienteCadastroView.js` | Import direto de `formField` |
| `frontend/erp/index.html` | Menu: "Preparar Entrega" |
| `tests/pages/NovaConsignacao.test.js` | Assertiva `cds-page` e ausência de "Nova Consignação" |
| `tests/utils/buscarProdutosErp.test.js` | Cobertura de `formField` + reexport em `operacional` |

---

## Componentes substituídos

| Antes | Depois |
|-------|--------|
| `WizardLayout` em Preparar Entrega | `CDSPage` (Design System) |
| `extrairValorInput` em `operacional.js` | `utils/formField.js` (módulo independente) |
| Sidebar solta no wizard body | `<aside class="cds-wizard-layout__sidebar">` |

---

## Componentes removidos / consolidados

- Import morto `extrairValorInput` em `NovaConsignacao/index.js`
- Referências a `#wizard-content` → `#preparar-entrega-content`
- Duplicata de `require('./formField')` em `operacional.js`

**Não removidos (órfãos documentados):** `Cliente360View.js`, docs legados (`WIZARD_CONSIGNACAO.md`) — sem uso em runtime, adiados para sprint de limpeza.

---

## Auditoria de rotas (P0-03)

| Rota | Componente | Status |
|------|------------|--------|
| `/consignacoes/nova` | `NovaConsignacao` → UX-04 Preparar Entrega | ✅ |
| `/consignacoes/:id/prestacao` | `PrestacaoContas` → UX-05 Fechar Consignação | ✅ |
| `/` | `Dashboard` → Central de Trabalho | ✅ |
| `/clientes` | `PerfilComercial` → Central de Clientes | ✅ |
| `/clientes/:id` | Central de Operações do Cliente | ✅ |
| `/design-system` | Showcase DS-01 | ✅ |

Bootstrap `PAGE_COMPONENTS` e `ERP_ROUTE_MAP` consistentes.

---

## Auditoria de imports (P0-05)

- Componentes `motor-comercial/components/*` → reexportam `design-system/primitives/*` ✅
- `theme/` e `tokens/` → reexportam Design System ✅
- `styles/inject.js` → delega `injectDesignSystemStyles()` ✅
- `extrairValorInput` → módulo `formField.js` sem dependência circular ✅

---

## Auditoria do bundle (P0-06)

```
npm run build:motor-comercial  → OK (4.5mb)
```

Bundle contém:
- `CDSPage`, `preparar-entrega-content`, `cds-preparar-entrega-page`
- `PrepararEntregaView`, `FLUXO_MOMENTOS` (4 momentos UX-04)
- `FecharConsignacaoView`, `MOMENTOS_FECHAMENTO` (UX-05)
- `CentralTrabalhoView` (UX-03)
- `CentralOperacoesView` (UX-02)
- Primitivos do Design System

**Não contém:** strings "Nova Consignação", "Dados Gerais" (wizard 5 etapas), `wizard-content`.

---

## Validação final

| Critério | Status |
|----------|--------|
| Nenhum erro JavaScript (extrairValorInput) | ✅ |
| Nova Consignação = UX-04 Preparar Entrega | ✅ |
| Layout oficial CDSPage | ✅ |
| WizardLayout corrigido para Fechar Consignação | ✅ |
| Rotas consistentes | ✅ |
| Imports consistentes | ✅ |
| Build sem erros | ✅ |
| 158 testes passando | ✅ |
| Compatível com CDS Design System | ✅ |

---

## Itens adiados

- Migração de `PrestacaoContas` (Fechar Consignação) de `WizardLayout` para `CDSPage` — sidebar já funciona com correção do primitivo
- Remoção de arquivos órfãos (`Cliente360View.js`, docs wizard legado)
- Atualização de documentação interna em `docs/WIZARD_CONSIGNACAO.md`

---

*Sprint DS-01.1 concluída. Motor Comercial restaurado e alinhado à arquitetura oficial do CDS Design System.*
