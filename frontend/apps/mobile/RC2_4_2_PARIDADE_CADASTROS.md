# RC2.4.2 — Auditoria Geral de Paridade dos Cadastros

**Versão:** `2.4.2-rc2.4.2` · Build `20260717rc242`  
**Objetivo:** Homologar Clientes, Fornecedores, Produtos, Usuários, Categorias e Subcategorias como **Cliente Oficial** da Plataforma CDS — mesmos modelos do ERP Desktop.  
**Restrições:** Sem novas APIs · Sem alteração de banco · Sem alteração de Motores · Sem regras novas · Sem campos exclusivos Mobile.

---

## 1. Veredicto

Os cadastros do CDS Mobile foram auditados e alinhados ao ERP Desktop. Removidas features exclusivas (foto em clientes), payloads explicitamente espelhados, validações/máscaras/ViaCEP alinhados, usuários e subcategorias completados.

**Paridade geral dos Cadastros: ≈ 97%**  
(detalhe por módulo em `CADASTROS_PARITY_MATRIX.md`)

**Status:** Homologação de cadastros apta para smoke cruzado físico.

---

## 2. Divergências encontradas → correções

### Clientes
| # | Divergência | Correção |
|---|-------------|---------|
| C1 | Foto local / câmera | **Removida** (Desktop não tem) |
| C2 | `limite_credito` string | `parseFloat` via `buildClientePayload` |
| C3 | Sem ViaCEP / máscara CPF | `bindCadastroCep` + `bindCpfCnpjMask` |
| C4 | Ordem campos (limite antes do endereço) | Alinhada ao Desktop |

### Fornecedores
| # | Divergência | Correção |
|---|-------------|---------|
| F1 | Sem `inscricao_estadual` | Campo + payload |
| F2 | UF sem upper | `.toUpperCase()` no payload |
| F3 | Sem ViaCEP / máscara | Helpers compartilhados |

### Produtos
| # | Divergência | Correção |
|---|-------------|---------|
| P1 | Revalidação RC2.4.1 | Mantida; ações de form padronizadas |
| P2 | Foto | Já removida na RC2.4.1 — sem regressão |

### Usuários
| # | Divergência | Correção |
|---|-------------|---------|
| U1 | Sem `pode_alterar_senhas` | Checkbox + payload `0/1` |
| U2 | Permissões hardcoded incompletas | `GET auth/permissoes-disponiveis` |
| U3 | Perms visíveis para admin | Ocultas quando `role=admin` |
| U4 | Inativo = “não encontrado” | Busca ativos + inativos |
| U5 | Ativar/excluir sem gate | SUPER_ADMIN + bloqueio self |
| U6 | Lista misturada | Seções Ativos / Desativados |

### Categorias / Subcategorias
| # | Divergência | Correção |
|---|-------------|---------|
| K1 | Sub em categoria despesa | Bloqueado (paridade Desktop) |
| K2 | Sem editar/excluir sub | PUT + DELETE via sheet |
| K3 | Form sem Cancelar | `formSubmitActionsHtml` |

---

## 3. Campos removidos (exclusivos Mobile)

| Módulo | Removido |
|--------|----------|
| Clientes | Foto / câmera / mídia local |
| Produtos | (já na RC2.4.1) foto, `ativo`, `estoque_atual` isolado |
| — | Nenhum campo de negócio Desktop foi removido |

---

## 4. Payloads comparados (resumo)

| Módulo | Builder Mobile | Espelho Desktop |
|--------|----------------|-----------------|
| Clientes | `buildClientePayload` | `saveCliente` |
| Fornecedores | `buildFornecedorPayload` | `saveFornecedor` |
| Produtos | `buildProdutoPayload` | `saveProduto` |
| Usuários | `buildUsuarioPayload` | `salvarNovoUsuario` |
| Categorias | `buildCategoriaPayload` | `criarCategoria` / `salvarCategoria` |
| Subcategorias | `{ nome, categoria_id }` | `criarOuSalvarSubcategoria` |

---

## 5. Padronização de formulários

- Seções: `cadastroSectionHtml`
- Ações: Salvar/Atualizar + Cancelar (`formSubmitActionsHtml`)
- CEP: ViaCEP oficial (`viacep.com.br`)
- Documento: máscara Desktop
- Toasts + bottom sheets (confirm/prompt) em todos os fluxos destrutivos

---

## 6. Limpeza

- Removidos imports/handlers de foto em clientes
- Payloads explícitos (não mais `collectForm` cru nos saves críticos)
- Catálogo de permissões alinhado ao backend
- Fallbacks de listagem de usuário inativo corrigidos

---

## 7. Evidências / smoke

Checklist físico (Mobile → Desktop → Mobile):

- [ ] Cliente
- [ ] Fornecedor
- [ ] Produto
- [ ] Usuário
- [ ] Categoria
- [ ] Subcategoria

Critério: dados idênticos nos dois clientes da plataforma.

---

## 8. Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `js/pages/clientes.js` | Paridade + remoção foto |
| `js/pages/fornecedores.js` | IE + payload Desktop |
| `js/pages/usuarios.js` | Senhas / perms / inativos |
| `js/pages/categorias.js` | Sub CRUD + gate despesa |
| `js/pages/produtos.js` | Ações padronizadas (RC2.4.1 ok) |
| `js/forms.js` | CEP, CPF, seções, actions |
| `js/version.js` + manifest + sw + index | `2.4.2-rc2.4.2` |
| `CADASTROS_PARITY_MATRIX.md` | Matriz |
| `RC2_4_2_PARIDADE_CADASTROS.md` | Este relatório |
| `CHANGELOG.md` / `RELEASE_NOTES.md` | Release |

---

*CDS Sistemas · RC2.4.2 · Paridade Cadastros · 2026-07-17*
