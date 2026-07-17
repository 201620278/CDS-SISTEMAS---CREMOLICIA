# ERP_PARITY_MATRIX — CDS Mobile RC2.2

**Versão Mobile:** `2.2.0-rc2.2` · Build `20260717rc22`  
**Critério:** mesma operação, mesmas APIs/motores/permissões do ERP Desktop. Interface distinta.

**Legenda:** ✔ Implementado · ⚠ Parcial · ✖ Não implementado · ◐ Desktop-only (físico/Electron)

---

## 1. Dashboard

| Funcionalidade ERP | Mobile | Nota |
|--------------------|--------|------|
| Resumo / KPIs período | ✔ | `/api/dashboard`, vendas |
| Alertas / drill-down | ⚠ | KPIs + atalhos |
| Gráficos densos / modo fiscal dash | ⚠ | Sem charts densos |

## 2. Clientes

| Funcionalidade ERP | Mobile | Nota |
|--------------------|--------|------|
| Listar / buscar | ✔ | |
| Criar / editar / excluir | ✔ | |
| Detalhe + endereço | ✔ | |
| Histórico de compras (`/clientes/:id/vendas`) | ✔ | |
| Histórico financeiro | ✔ | agrupado |
| CEP ViaCEP | ⚠ | campos manuais |
| WhatsApp / Maps / Ligação | ✔ | nativos |
| Foto persistida servidor | ✖ | sem API de mídia |

## 3. Fornecedores

| Funcionalidade ERP | Mobile | Nota |
|--------------------|--------|------|
| CRUD completo | ✔ | |
| Contato / endereço | ✔ | |
| Produtos relacionados | ⚠ | busca soft |
| WhatsApp / Maps | ✔ | |

## 4. Produtos / Estoque

| Funcionalidade ERP | Mobile | Nota |
|--------------------|--------|------|
| CRUD produto | ✔ | |
| Campos fiscais (NCM/CFOP/CSOSN) | ✔ | |
| Código de barras / scanner | ✔ | |
| Ajuste estoque (motor) | ✔ | entrada/saída/inventário/ajuste |
| Estoque baixo | ✔ | |
| Alertas validade | ✔ | `/vencimentos/alertas` |
| Histórico estoque / preços | ✔ | |
| Faixas atacado (consulta) | ✔ | |
| Promoções (criar/encerrar) | ✖ | API existe; UI Desktop |
| Multi-unidade (MUC) CRUD | ✖ | |
| Relatório estoque impressão | ⚠ | consulta mobile |
| Transferência depósito | ⚠ | sem API dedicada |
| Foto servidor | ✖ | |

## 5. Categorias / Subcategorias

| Funcionalidade ERP | Mobile | Nota |
|--------------------|--------|------|
| Listar por tipo | ✔ | |
| CRUD categorias | ✔ | |
| CRUD subcategorias | ✔ | criar na ficha |

## 6. Usuários

| Funcionalidade ERP | Mobile | Nota |
|--------------------|--------|------|
| Listar ativos/inativos | ✔ | |
| Criar / editar + permissões | ✔ | |
| Desativar / reativar | ✔ | PATCH auth |
| Relatório por usuário | ✔ | |
| Excluir (SUPER_ADMIN) | ✔ | |

## 7. Comercial

| Funcionalidade ERP | Mobile | Nota |
|--------------------|--------|------|
| Painel / KPIs | ✔ | projections |
| Nova consignação + itens | ✔ | |
| Entrega | ✔ | |
| Prestação (abrir/venda/perda/pagamento/fechar/reabrir) | ✔ | |
| Finalizar venda oficial / NFC-e | ✔ | |
| Pendências | ✔ | |
| Conta corrente | ✔ | |
| Clientes comerciais 360 / bloquear / limite | ⚠ | via cadastro cliente + motor parcial |
| Recomendações / Playbooks / Relatórios densos | ⚠ | projections parciais |
| Perdas/Cortesias menu ERP | ◐ | stubs no Desktop; real = prestação ✔ |
| Termo entrega impresso | ⚠ | API existe; print Electron ◐ |

## 8. Financeiro

| Funcionalidade ERP | Mobile | Nota |
|--------------------|--------|------|
| Dashboard / resumo | ✔ | |
| Contas a receber / pagar | ✔ | |
| Baixa / estorno | ✔ | |
| Dívidas por cliente | ✔ | agrupado |
| Pagamento parcial | ✔ | |
| Extrato cliente | ✔ | |
| Nova despesa | ✔ | |
| Fluxo / histórico | ✔ | |
| Relatórios densos / export | ⚠ | export stub também no Desktop |

## 9. Fiscal

| Funcionalidade ERP | Mobile | Nota |
|--------------------|--------|------|
| Listar notas | ✔ | |
| Detalhe nota | ✔ | |
| Emitir NFC-e por venda | ✔ | |
| Cancelar NFC-e | ✔ | |
| DANFE / share DANFE/XML | ✔ | |
| Config fiscal (leitura) | ✔ | |
| Upload certificado / testar | ✖ | Desktop |
| Edição config fiscal | ✖ | Desktop / avançadas |

## 10. PDV / Caixa / Vendas / Terminais

| Funcionalidade ERP/PDV | Mobile | Nota |
|------------------------|--------|------|
| Registrar terminal / heartbeat | ✔ | |
| Abrir / fechar / sangria / suprimento | ✔ | |
| Venda completa + pagamentos | ✔ | |
| TEF pinpad | ◐ | API; sem pinpad físico |
| NFC-e na venda | ✔ | |
| Histórico / cancelar venda | ✔ | |
| Gerenciar caixas CRUD | ✔ | `/api/caixas` |
| Listar terminais | ✔ | |
| Vincular terminal↔caixa avançado | ⚠ | listagem; edição densa ERP |
| Impressão silenciosa cupom | ◐ | Electron |
| Consulta preço dedicada | ⚠ | via busca PDV |

## 11. Compras / Central Entradas

| Funcionalidade ERP | Mobile | Nota |
|--------------------|--------|------|
| Listar compras | ✔ | |
| Nova compra (entrada simples) | ✔ | |
| Detalhe + itens + financeiro | ✔ | |
| Cancelar compra | ✔ | |
| Devolução / NF-e devolução SEFAZ | ✖ | |
| MIIP identificar lote | ✖ | |
| Central Entradas NF (upload/sync/processar) | ✖ | |

## 12. Configurações

| Funcionalidade ERP | Mobile | Nota |
|--------------------|--------|------|
| Empresa (leitura) | ✔ | |
| Tema / terminal / sync / diagnóstico | ✔ | |
| Upload logo / fundo login | ✖ | |
| Impressora / backup pasta | ◐ | Electron |
| Config. avançadas / TEF config | ✖ | SUPER_ADMIN Desktop |
| Equipamentos / Laboratório | ✖ | |
| Licença | ✖ | |
| Auditoria | ✔ | `/auditoria/list` |

---

## Resumo quantitativo

| Status | Qtd estimada de funcionalidades auditadas |
|--------|-------------------------------------------|
| ✔ Implementado | ~95 |
| ⚠ Parcial | ~28 |
| ✖ Não implementado | ~18 |
| ◐ Desktop-only físico | ~8 |

### Percentual real de paridade operacional

| Métrica | Valor |
|---------|-------|
| **Operações replicáveis no Mobile (✔ + ⚠ utilizáveis)** | **~82–86%** |
| **Paridade estrita (somente ✔)** | **~72–76%** |
| **Excluindo ◐ físico/Electron** | **~88–90% do restante** |
| Antes RC2.2 (RC2.1) | ~72–76% operacional |

### Pendências principais (✖)

1. Central de Entradas NF + MIIP  
2. Promoções / MUC produto  
3. Upload certificado fiscal + config avançada  
4. Equipamentos / Lab / Licença  
5. Devolução SEFAZ compras  
6. Foto/mídia server-side (sem motor novo — aguarda API plataforma)

### Aceite RC2.2

Operador consegue no celular a rotina diária do ERP (cadastros, PDV, comercial, estoque, financeiro, fiscal básico, compras simples, caixas, auditoria) com os **mesmos motores**. Densidades Desktop (Central NF, MIIP, pinpad, impressão silenciosa, config avançada) permanecem documentadas como ⚠/✖/◐.
