# FLOW_PARITY_MATRIX — CDS Mobile RC2.1

**Versão:** 2.1.0-rc2.1 · Build `20260716rc21`  
**Critério:** fluxo ✔ somente se executável do início ao fim no Mobile, sem Desktop, reutilizando motores oficiais.

**Legenda:** ✔ Completo · ⚠ Parcial · ✖ Pendente

---

## Fluxo 1 — Venda completa

| Etapa | Status | Motor / API |
|-------|--------|-------------|
| Abrir caixa | ✔ | Motor Caixa `/api/caixa` |
| Consultar produto | ✔ | `/api/produtos/search` |
| Adicionar produto | ✔ | Carrinho local → POST `/api/vendas` |
| Alterar quantidade | ✔ | UI → pré-cálculo/venda |
| Aplicar desconto | ✔ | Motor Vendas |
| Aplicar acréscimo | ✔ | Motor Vendas |
| Selecionar forma de pagamento | ✔ | Dinheiro / PIX / Cartão / TEF ⚠ |
| Receber | ✔ | POST venda + caixa |
| Emitir NFC-e | ✔ | Motor Fiscal |
| Atualizar estoque | ✔ | Backend na venda (motor) |
| Atualizar financeiro | ✔ | Backend na venda (motor) |
| Registrar histórico | ✔ | Lista/detalhe vendas |
| Reimprimir / compartilhar DANFE | ✔ | `/fiscal/danfe/venda/:id` + share |
| Compartilhar XML | ⚠ | Via nota se `xml_*` existir |
| Cancelar quando permitido | ✔ | Cancelar venda + cancelar NFC-e |
| TEF pinpad físico | ⚠ | API; sem periférico mobile |

**Resultado fluxo:** ✔ Completo (exceto TEF físico / impressora local)

---

## Fluxo 2 — Comercial completo

| Etapa | Status | Motor / API |
|-------|--------|-------------|
| Nova consignação | ✔ | Motor Comercial |
| Adicionar produtos | ✔ | `/consignacoes/:id/itens` |
| Salvar | ✔ | POST consignação |
| Entrega | ✔ | `/entrega` |
| Recebimento (venda prestação) | ✔ | `/prestacao/venda` |
| Prestação de contas | ✔ | abrir / resumo |
| Baixa financeira | ✔ | `/prestacao/pagamento` |
| Atualização estoque | ✔ | Via finalizar venda oficial / motores |
| Encerramento | ✔ | `/prestacao/fechar` + oficial |
| Histórico / resumo | ✔ | detalhe + resumo-final |
| Reabertura quando permitido | ✔ | `/prestacao/reabrir` |
| Emitir NFC-e prestação | ✔ | `/prestacao/emitir-nfce` |

**Resultado fluxo:** ✔ Completo (UI mobile; regras no Motor Comercial)

---

## Fluxo 3 — Cadastro de produto

| Etapa | Status | Nota |
|-------|--------|------|
| Criar | ✔ | POST `/api/produtos` |
| Capturar foto (câmera) | ⚠ | Dispositivo local (sem campo foto no backend) |
| Código de barras | ✔ | Input + BarcodeDetector/prompt |
| Dados fiscais | ✔ | NCM / CFOP / CST no formulário |
| Preços | ✔ | compra / venda |
| Ajustar estoque | ✔ | Navega Motor Estoque (`ajustar-estoque`) |
| Histórico | ✔ | `/historico-estoque` |
| Disponibilizar para venda | ⚠ | Flag `ativo` se API aceitar |

**Resultado fluxo:** ⚠ Parcial (foto não sincroniza servidor)

---

## Fluxo 4 — Cliente

| Etapa | Status | Nota |
|-------|--------|------|
| Cadastrar | ✔ | CRUD API clientes |
| Foto | ⚠ | Local no dispositivo |
| Endereço / Contato | ✔ | Campos oficiais |
| WhatsApp / Ligação | ✔ | Capacidades nativas |
| Google Maps | ✔ | Deep link |
| Histórico comercial | ✔ | Vendas filtradas |
| Histórico financeiro | ✔ | `/financeiro/receber/agrupado/:id` |
| Editar / Excluir | ✔ | |

**Resultado fluxo:** ⚠ Parcial (foto local)

---

## Fluxo 5 — Fornecedor

| Etapa | Status | Nota |
|-------|--------|------|
| Cadastro | ✔ | CRUD |
| Produtos | ⚠ | Busca por nome do fornecedor |
| Contato / Endereço | ✔ | |
| Histórico | ⚠ | Campo observações |
| WhatsApp / Maps / Share | ✔ | Nativos |
| Editar / Excluir | ✔ | |

**Resultado fluxo:** ⚠ Parcial (vínculo produto soft)

---

## Fluxo 6 — Financeiro

| Etapa | Status |
|-------|--------|
| Receber / Baixa | ✔ |
| Estorno | ✔ |
| Fluxo | ✔ |
| Histórico | ✔ |
| Detalhes | ✔ |

**Resultado fluxo:** ✔ Completo (relatórios BI densos fora do escopo mobile)

---

## Fluxo 7 — Estoque

| Etapa | Status |
|-------|--------|
| Consulta / Baixo estoque | ✔ |
| Entrada / Saída / Inventário / Ajuste | ✔ | Motor `ajustar-estoque` |
| Histórico | ✔ |
| Transferência | ⚠ | Sem API dedicada (saída+entrada) |

**Resultado fluxo:** ⚠ Parcial (transferência)

---

## Fluxo 8 — Configurações

| Etapa | Status |
|-------|--------|
| Empresa / Servidor / Terminal | ✔ |
| Tema | ✔ |
| Modo fiscal (leitura) | ✔ |
| Sincronização | ✔ | SW/cache refresh |
| Diagnóstico | ✔ |
| Sobre | ✔ |
| Edição avançada empresa/fiscal | ✖ | Desktop / permissões |

**Resultado fluxo:** ⚠ Parcial (leitura + preferências; edição avançada no ERP)

---

## Capacidades nativas

| Capacidade | Status |
|------------|--------|
| Câmera (foto) | ✔ |
| Scanner EAN / QR (BarcodeDetector) | ⚠ |
| Compartilhar DANFE / XML / texto | ✔ |
| WhatsApp / Ligação / Maps | ✔ |
| Notificações push | ✖ |

---

## Resumo de aceite

| Fluxo | Status |
|-------|--------|
| 1 Venda completa | ✔ |
| 2 Comercial completo | ✔ |
| 3 Cadastro produto | ⚠ |
| 4 Cliente | ⚠ |
| 5 Fornecedor | ⚠ |
| 6 Financeiro | ✔ |
| 7 Estoque | ⚠ |
| 8 Configurações | ⚠ |

### Paridade operacional da Plataforma CDS (Mobile)

| Métrica | Valor |
|---------|-------|
| Fluxos totalmente concluídos | **3 / 8** (37,5% dos fluxos) |
| Fluxos parcialmente concluídos | **5 / 8** |
| Fluxos pendentes (✖) | **0 / 8** |
| Cobertura ponderada por etapa (~) | **~78–82%** |
| Paridade operacional geral Mobile × ERP (estimada) | **~72–76%** |

*Antes RC2.1 (Onda 1): ~58–62%. Meta RC2 completa: ~90%+ (exceto limites físicos).*
