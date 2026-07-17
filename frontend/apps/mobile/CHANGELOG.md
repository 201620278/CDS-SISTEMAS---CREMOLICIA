# CDS Mobile — Changelog

## 2.4.2-rc2.4.2 (2026-07-17)

- Auditoria geral de paridade dos cadastros (ERP Desktop × CDS Mobile).
- Clientes: payload Desktop, ViaCEP, máscara CPF/CNPJ; foto removida.
- Fornecedores: `inscricao_estadual` + payload alinhado.
- Usuários: `pode_alterar_senhas`, permissões via API, ativos/inativos, gates SUPER_ADMIN.
- Categorias/Subcategorias: CRUD de sub; bloqueio em categorias de despesa.
- Produtos: revalidação RC2.4.1 sem regressão.
- Formulários padronizados (`cadastroSectionHtml`, `formSubmitActionsHtml`).
- Relatórios: `CADASTROS_PARITY_MATRIX.md`, `RC2_4_2_PARIDADE_CADASTROS.md`.

## 2.4.1-rc2.4.1 (2026-07-17)

- Paridade oficial do cadastro de produtos (Desktop × Mobile).
- Foto de produto removida; payload `saveProduto`; EAN/scanner.

## 2.3.9-rc2.3.9 (2026-07-17)

- Alta produtividade consignação (qty, Enter, barcode, repetir).

## 1.0.1-rc1.1 (2026-07-16)

- Cliente Oficial da Plataforma CDS.
- Registro persistente de terminal no PDV Mobile.
- Multicaixa: `terminal_id` + heartbeat + headers de cliente.
- Evolução do motor de terminais (`origem=mobile`) e metadados no JWT.
- Central de Terminais no ERP (menu PDV → Terminais).
- Configurações Mobile expandidas (empresa, terminal, fiscal, conexão, logout).

## 1.0.0-rc1 (2026-07-16)

- Freeze RC1: shell, cadastros, comercial, financeiro, fiscal consulta, PDV fundação.
