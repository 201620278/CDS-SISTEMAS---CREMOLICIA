# CDS Mobile RC2.4.2 — Release Notes

**Versão:** 2.4.2-rc2.4.2  
**Build:** 20260717rc242  
**Status:** Homologação de Cadastros — Cliente Oficial da Plataforma CDS

## Objetivo

Concluir a auditoria geral de paridade dos cadastros entre ERP Desktop e CDS Mobile, garantindo que Clientes, Fornecedores, Produtos, Usuários, Categorias e Subcategorias usem os mesmos modelos, payloads e regras oficiais da plataforma — sem implementação paralela.

## O que mudou

### Clientes
- Payload idêntico ao Desktop (`buildClientePayload`).
- ViaCEP + máscara CPF/CNPJ.
- Foto/câmera local **removida** (inexistente no ERP).

### Fornecedores
- Campo e payload `inscricao_estadual`.
- UF em maiúsculas; ViaCEP; máscara de documento.

### Produtos
- Revalidação da RC2.4.1 (sem foto, mesmo formulário/payload).
- Ações de formulário padronizadas.

### Usuários
- `pode_alterar_senhas` no formulário e no POST/PUT.
- Permissões carregadas de `GET /auth/permissoes-disponiveis`.
- Lista Ativos / Desativados; detalhe de inativos funcional.
- Ativar / desativar / excluir apenas para SUPER_ADMIN (sem ação sobre si mesmo).

### Categorias / Subcategorias
- Subcategorias somente em categorias `produto`.
- Editar e excluir subcategoria (PUT/DELETE oficiais).

### UX de formulários
- Seções, Salvar + Cancelar, toasts e sheets padronizados em todos os cadastros.

## Documentação

- `CADASTROS_PARITY_MATRIX.md` — matriz Desktop × Mobile e percentuais
- `RC2_4_2_PARIDADE_CADASTROS.md` — divergências, correções e evidências

## Critério de aceite

- Cadastro no Mobile = mesmo resultado no Desktop.
- Nenhum campo/funcionalidade exclusiva de cadastro no Mobile.
- Paridade geral dos Cadastros ≈ **97%** (smoke cruzado físico pendente).

## Veredito

**RC2.4.2** homologa os Cadastros do CDS Mobile como cliente oficial da Plataforma CDS, alinhado ao ERP Desktop.
