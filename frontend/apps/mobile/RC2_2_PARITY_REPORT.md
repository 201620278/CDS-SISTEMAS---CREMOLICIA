# CDS Mobile RC2.2 — Paridade ERP Desktop

**Versão:** 2.2.0-rc2.2  
**Build:** 20260717rc22  
**Objetivo:** executar no Mobile as mesmas operações do ERP Desktop, sem novos motores/APIs.

## Arquivos criados

| Arquivo | Função |
|---------|--------|
| `js/pages/categorias.js` | CRUD categorias/subcategorias |
| `js/pages/compras.js` | Listar/criar/detalhe/cancelar compras |
| `js/pages/caixas.js` | Caixas + terminais |
| `js/pages/auditoria.js` | Lista auditoria |
| `ERP_PARITY_MATRIX.md` | Matriz completa ERP × Mobile |
| `RC2_2_PARITY_REPORT.md` | Este relatório |

## Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `js/app.js` | Rotas novas + hub Mais |
| `js/permissions.js` | Chaves categorias/compras/caixas/auditoria |
| `js/pages/cadastros.js` | Link categorias |
| `js/pages/fiscal.js` | Emitir/cancelar/DANFE/share |
| `js/pages/financeiro.js` | Agrupado, parcial, nova despesa |
| `js/pages/usuarios.js` | Ativar/desativar/relatório/inativos |
| `js/pages/clientes.js` | `/clientes/:id/vendas` |
| `js/pages/produtos.js` | Histórico preços + atacado |
| `js/pages/estoque.js` | Alertas validade |
| `js/pages/comercial.js` | Pendências + conta corrente |
| `js/version.js` | 2.2.0-rc2.2 |
| `index.html` | Cache bust RC2.2 |
| `frontend/shared/api/client.js` | Método `patch` (APIs já existentes) |

## APIs reutilizadas (novas no Mobile nesta RC)

- `/api/categorias`, `/api/subcategorias`  
- `/api/compras`, `/compras/:id/cancelar`  
- `/api/caixas`, `/api/terminais`  
- `/api/auditoria/list`  
- `/api/financeiro/receber/agrupado*`  
- `/api/fiscal/emitir`, `/fiscal/notas/:id/cancelar`  
- `/api/auth/usuarios/:id/ativar|desativar|relatorio`  
- `/api/clientes/:id/vendas`  
- `/api/produtos/:id/historico-precos`, `/atacado`, `/vencimentos/alertas`  
- `/api/comercial/projections/conta-corrente`  

## Funcionalidades implementadas nesta RC

Categorias · Compras (ciclo básico) · Caixas/Terminais · Auditoria · Fiscal operacional · Financeiro agrupado/parcial/despesa · Usuários ativar/desativar · Produto preços/atacado · Estoque validade · Comercial pendências/CC

## Funcionalidades pendentes

Central Entradas NF · MIIP · Promoções/MUC · Certificado fiscal · Config avançadas · Equipamentos/Lab/Licença · Devolução SEFAZ · Foto server-side · TEF/impressão física

## Percentual de paridade

Ver `ERP_PARITY_MATRIX.md`: **~82–86% operacional** (✔+⚠) · **~72–76% estrito (somente ✔)**.
