# CADASTROS — Matriz de Paridade (ERP Desktop × CDS Mobile)

**Versão:** `2.4.2-rc2.4.2` · Build `20260717rc242`  
**Referência oficial:** ERP Desktop  
**Data:** 2026-07-17

---

## Percentual geral

| Módulo | Paridade cadastro | Notas |
|--------|-------------------|-------|
| Clientes | **98%** | Payload 100%; foto removida; ViaCEP + máscara |
| Fornecedores | **97%** | IE no formulário/payload; persistência IE depende do backend atual |
| Produtos | **96%** | RC2.4.1 OK; MUC / faixas atacado CRUD avançado no Desktop |
| Usuários | **96%** | `pode_alterar_senhas` + permissões API + inativos |
| Categorias | **99%** | Campos/payload idênticos |
| Subcategorias | **97%** | CRUD completo; lista aninhada (Desktop flat) |
| **Cadastros (geral)** | **≈ 97%** | Cliente oficial da Plataforma CDS |

---

## 1. Clientes

| Aspecto | Desktop | Mobile RC2.4.2 | Status |
|---------|---------|----------------|--------|
| Campos | nome, cpf_cnpj, telefone, email, cep, rua, numero, bairro, cidade, uf, limite_credito | Idem | ✔ |
| Payload POST/PUT | `parseFloat(limite_credito)` | `buildClientePayload` | ✔ |
| Foto | ✖ | **Removida** | ✔ |
| ViaCEP | ✔ | ✔ | ✔ |
| Máscara CPF/CNPJ | ✔ | ✔ | ✔ |
| Extras UX | — | WhatsApp / Maps / CC (não no payload) | ⚠ UX |

**Removidos Mobile:** foto local, câmera, `setLocalMedia('cliente')`.

---

## 2. Fornecedores

| Aspecto | Desktop | Mobile RC2.4.2 | Status |
|---------|---------|----------------|--------|
| Campos | + `inscricao_estadual` + endereço + observacoes | Idem | ✔ |
| Payload | 14 keys trim + UF upper | `buildFornecedorPayload` | ✔ |
| ViaCEP / máscara | ✔ | ✔ | ✔ |

**Adicionado:** `inscricao_estadual`.

---

## 3. Produtos

| Aspecto | Desktop | Mobile | Status |
|---------|---------|--------|--------|
| Formulário / payload | `saveProduto` | `buildProdutoPayload` (RC2.4.1) | ✔ |
| Foto | ✖ | Removida | ✔ |
| EAN + scanner | ✔ | ✔ | ✔ |
| Cat / sub / fiscal / estoque | ✔ | ✔ | ✔ |
| MUC / faixas atacado editor | ✔ | Flag + leitura faixas | ⚠ avançado Desktop |

---

## 4. Usuários

| Aspecto | Desktop | Mobile RC2.4.2 | Status |
|---------|---------|----------------|--------|
| username, password, role, perfil | ✔ | ✔ | ✔ |
| `pode_alterar_senhas` | ✔ | ✔ | ✔ |
| `permissoes` | API disponiveis | API + fallback | ✔ |
| Ocultar perms se admin | ✔ | ✔ | ✔ |
| Ativos / Desativados | ✔ | ✔ | ✔ |
| Ativar / Desativar / Excluir | SUPER_ADMIN | SUPER_ADMIN + anti-self | ✔ |
| Detalhe inativo | ✔ | Carrega ativos+inativos | ✔ |

---

## 5. Categorias / Subcategorias

| Aspecto | Desktop | Mobile RC2.4.2 | Status |
|---------|---------|----------------|--------|
| Categoria `{nome,descricao,tipo}` | ✔ | ✔ | ✔ |
| Sub POST `{nome,categoria_id}` | ✔ | ✔ | ✔ |
| Sub PUT / DELETE | ✔ | ✔ | ✔ |
| Sub só em tipo produto | ✔ | ✔ | ✔ |
| Hierarquia | Flat | Nested under category | ⚠ UX |

---

## 6. Formulários (padrão visual)

Todos usam: `formCardHtml` + `cadastroSectionHtml` + `formSubmitActionsHtml` (Salvar/Atualizar + Cancelar) + toasts + bottom sheets.

Helpers compartilhados em `js/forms.js`: `bindCadastroCep`, `bindCpfCnpjMask`, `build*Payload` por módulo.

---

## 7. Smoke test cruzado

| Cadastro | Mobile → Desktop | Desktop → Mobile | Status |
|----------|------------------|------------------|--------|
| Cliente | Pendente físico | Pendente físico | ☐ |
| Fornecedor | Pendente físico | Pendente físico | ☐ |
| Produto | Pendente físico | Pendente físico | ☐ |
| Usuário | Pendente físico | Pendente físico | ☐ |
| Categoria | Pendente físico | Pendente físico | ☐ |
| Subcategoria | Pendente físico | Pendente físico | ☐ |

---

*CDS Sistemas · Matriz Cadastros · RC2.4.2*
