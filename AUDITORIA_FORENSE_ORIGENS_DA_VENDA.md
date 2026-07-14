# AUDITORIA FORENSE — ORIGENS DA VENDA (Plataforma CDS)

**Prioridade:** MÁXIMA  
**Data:** 2026-07-13  
**Escopo:** Somente leitura / diagnóstico. Nenhuma implementação.  
**Objetivo:** Determinar se existem múltiplos fluxos de geração de venda e se todas as origens passam (ou podem passar) por um único Núcleo Transacional.

---

## 1. Veredito executivo

| Pergunta | Resposta |
|----------|----------|
| Existem múltiplos fluxos de “venda”? | **SIM** — dois mundos distintos |
| Existe `VendaApplicationService`? | **NÃO** (ausente no repositório) |
| Existe Núcleo Transacional único da plataforma? | **NÃO** |
| Quem cria linha em `vendas`? | **Somente** `VendaPagamentoService.criarVenda` (PDV) |
| Prestação gera `vendas` / NFC-e? | **NÃO** |
| Prestação gera “venda comercial”? | **SIM** — ledger `VENDA_PRESTACAO` |
| Pedido / Orçamento / E-commerce / App Vendas? | **Ausentes** no código atual |

**Conclusão:** Hoje a plataforma **não** unifica origens no mesmo núcleo. O PDV é um monólito Express+SQL. A Consignação usa Motor Comercial (UoW + Ledger + Outbox) **sem** nascer como venda fiscal/tabela `vendas`.

---

## 2. Inventário do que foi procurado vs. o que existe

| Artefato alvo | Resultado |
|---------------|-----------|
| `VendaApplicationService` | **Ausente** |
| `VendaController` | **Ausente** (router Express) |
| `VendaService` (classe) | **Ausente** (funções em services) |
| UseCases de venda PDV | **Ausente** |
| `VendaRepository` / DTOs / Factories / Builders oficiais | **Ausente** |
| Eventos de domínio PDV / Outbox PDV | **Ausente** |
| Núcleo nomeado “Núcleo Transacional” | **Ausente** |
| PDV create path | **`criarVenda`** em `backend/services/vendas/VendaPagamentoService.js` |
| Rota | `POST /api/vendas` → `backend/rotas/vendas.js` |
| Orquestrador pagamento | `backend/services/OrquestradorPagamento.js` |
| Fiscal | `backend/services/fiscal/emissor.js` → `emitirPorVendaId` |
| Venda comercial (consignação) | `RegistrarVendaPrestacaoUseCase` |
| Ledger comercial | `movimentacoes_comerciais` via `registrarMovimentacaoComercial` |
| Outbox | Somente Motor Comercial (`backend/motores/motor-comercial/.../outbox`) |

---

## 3. Respostas às perguntas da missão

### Onde a venda é criada?

| Definição de “venda” | Ponto de nascimento |
|----------------------|---------------------|
| **Venda de plataforma** (tabela `vendas`, NFC-e possível) | `criarVenda` — `VendaPagamentoService.js` após `POST /api/vendas` |
| **Venda consignada / acerto** | `RegistrarVendaPrestacaoUseCase.processar` — tipo `VENDA_PRESTACAO` no ledger comercial |

### Quem cria?

| Origem | Quem |
|--------|------|
| PDV | UI `frontend/pdv/js/pdv.js` → API → `criarVenda` |
| Prestação | UI PrestacaoContas → `POST .../prestacao/venda` → `RegistrarVendaPrestacaoUseCase` |
| Preparar Entrega / Entrega / Receber | **Não criam venda de plataforma** |

### Quem grava?

| | PDV | Prestação |
|--|-----|-----------|
| Persistência principal | `INSERT INTO vendas`, `vendas_itens`, `venda_pagamentos`, `venda_recebimentos` | `movimentacoes_comerciais` + update item (`quantidadeVendida`) |
| Transação | `BEGIN IMMEDIATE` / `COMMIT` no próprio `criarVenda` | `ConsignacaoWriteUseCase.executarEscrita` (UoW) |

### Quem atualiza estoque?

| Caminho | Quem | Quando |
|---------|------|--------|
| PDV | `reduzirEstoqueDistribuido` / FEFO em `VendaPagamentoService` | No create da venda (fiscal e não fiscal) |
| Entrega consignação | Outbox `EstoqueBaixarProduto` → `EstoquePlatformGateway` → `ajusteEstoqueService` | Na **entrega** (não na “venda” prestação) |
| Prestação venda | **Não baixa estoque** (`VENDA_PRESTACAO.afetaEstoque: false`) | Estoque já saiu na entrega |
| Perda / Cortesia | Ledger comercial; perda enqueue financeiro; estoque físico já comprometido na entrega | Sem baixa extra de produto “loja” no ato da perda/cortesia (catálogo: `afetaEstoque: false`) |
| Devolução PDV | `VendaDevolucaoService.devolverEstoqueItensVenda` | Pós-venda |
| Devolução consignação (pré-prestação) | UC devolução + Outbox estoque | Retorno ao estoque |

### Quem movimenta financeiro?

| Caminho | Quem | Como |
|---------|------|------|
| PDV create | **`criarVenda`** | `INSERT INTO financeiro` **direto** (bypass Motor Financeiro SSOT — FIN_01) |
| PDV prazo | **`criarVenda`** | `INSERT INTO contas_receber` |
| Prestação venda | Outbox `FinanceiroLancarReceita` → `FinanceiroPlatformGateway.registrarReceitaConsignacao` | `financeiro` com `referencia_tipo: consignacao_venda`, `status: recebido`, **`venda_id` ausente** |
| Prestação pagamento | Outbox → `registrarRecebimento` | Outra receita `consignacao_pagamento` já `recebido` |
| Prestação perda | Outbox → `registrarPerda` | Despesa `consignacao_perda` |

### Quem chama Motor Fiscal?

| Caller | Callee |
|--------|--------|
| `VendaFiscalService.responderVendaComFiscal` | `emitirPorVendaId` |
| `VendaFiscalService.emitirFiscalSeSolicitado` | `emitirPorVendaId` |
| `POST /api/fiscal/emitir/venda/:vendaId` (`rotas/fiscal.js`) | `emitirPorVendaId` |
| Motor Comercial / Prestação | **Ninguém** |

**Observação:** Não há pacote `motor-fiscal` separado; a emissão real está em `backend/services/fiscal/emissor.js`. Há **bypass** possível: o front PDV/ERP pode chamar a rota fiscal **depois** da venda, fora do create.

### Quem chama Ledger?

| | |
|--|--|
| PDV | **Não escreve** ledger append-only comercial |
| Comercial | `registrarMovimentacaoComercial` (todos os UCs de escrita consignação) |
| “Ledger” financeiro PDV | Tabela `financeiro` (não é o ledger comercial) |

### Quem publica Outbox?

| | |
|--|--|
| PDV | **Não publica** |
| Comercial | `enfileirarBridgeOutbox` dentro dos UCs (entrega, venda, pagamento, perda, devolução, transferência, …) |

---

## 4. PDV — mapeamento forense completo

```
frontend/pdv/js/pdv.js
  executarFinalizacaoVenda / enviarVenda
        │
        ▼
POST /api/vendas  (+ middleware validarCaixaAberto)
  backend/rotas/vendas.js
        │
        ▼
VendaPagamentoService.criarVenda
  ├─ distribuirItemVenda (fiscal × não fiscal)
  ├─ OrquestradorPagamento.processarFluxoPagamentoVenda
  ├─ BEGIN IMMEDIATE
  │    INSERT vendas
  │    gravarRecebimentos / venda_pagamentos
  │    INSERT vendas_itens
  │    reduzirEstoqueDistribuido (FEFO)
  │    [prazo] contas_receber
  │    INSERT financeiro          ← bypass SSOT
  ├─ COMMIT
  └─ VendaFiscalService.responderVendaComFiscal
         └─ emitirPorVendaId     ← pós-commit
                └─ nfce_notas / SEFAZ

[opcional]
POST /api/vendas/:id/pagamento-nao-fiscal → emitirFiscalSeSolicitado
POST /api/fiscal/emitir/venda/:id         ← emissão fora do create
```

**Núcleo informal do PDV:** a própria função `criarVenda` (não é ApplicationService reutilizável; acoplada a `req`/`res`).

Arquivos-chave:

- `frontend/pdv/js/pdv.js`
- `backend/rotas/vendas.js`
- `backend/services/vendas/VendaPagamentoService.js`
- `backend/services/OrquestradorPagamento.js`
- `backend/services/distribuidorEstoqueVenda.js`
- `backend/services/vendas/VendaFiscalService.js`
- `backend/services/fiscal/emissor.js`
- `backend/services/vendas/VendaFinanceiroService.js` (validação/cancelamento — não o INSERT do create)
- `backend/services/vendas/VendaCancelamentoService.js`
- `backend/services/vendas/VendaDevolucaoService.js`

---

## 5. Comercial — mapeamento forense

| Etapa | UC / superfície | Gera `vendas`? | Gera o quê? |
|-------|-----------------|----------------|-------------|
| Preparar Entrega | Criar/editar consignação + itens | Não | Rascunho |
| Entrega | `RegistrarEntregaConsignacaoUseCase` | Não | Ledger `ENTREGA` + Outbox estoque |
| Prestação — abrir | `AbrirPrestacaoUseCase` | Não | `ABERTURA_PRESTACAO` |
| Prestação — venda | **`RegistrarVendaPrestacaoUseCase`** | **Não** | **`VENDA_PRESTACAO`** + Outbox receita |
| Prestação — perda | `RegistrarPerdaUseCase` | Não | `PERDA` + Outbox despesa |
| Prestação — cortesia | `RegistrarCortesiaUseCase` | Não | `CORTESIA` |
| Prestação — pagar | `RegistrarPagamentoPrestacaoUseCase` | Não | `PAGAMENTO` + Outbox |
| Prestação — fechar | `FecharPrestacaoUseCase` | Não | `FECHAMENTO_PRESTACAO` |
| Conta Corrente “Receber” | `_abrirRecebimento` → ERP Financeiro | Não | Handoff UI; contexto em sessionStorage **sem consumidor** no repo |

### Em qual ponto a venda “nasce” hoje (comercial)?

**Exatamente em** `RegistrarVendaPrestacaoUseCase` ao registrar quantidade vendida na grade da prestação — movimento `VENDA_PRESTACAO`.

### Existe geração de venda de plataforma?

**Não.**

### Existe apenas movimentação?

**Sim**, no sentido de ledger comercial + projeções/cache; estoque já movido na entrega.

### Existe integração parcial?

**Sim:** Outbox → `financeiro` / estoque gateways. Sem NFC-e, sem `vendas`, sem Motor Financeiro SSOT, sem link `venda_id`.

### Existe duplicação?

**Risco financeiro:** receita em `VENDA_PRESTACAO` **e** outra em `PAGAMENTO`, ambas já `recebido`.  
**Duplicação conceitual:** dois conceitos de “venda” (tabela `vendas` vs ledger `VENDA_PRESTACAO`) sem ponte.

---

## 6. Motor Fiscal — bypasses

| Caminho | Dentro do “núcleo” PDV? | Bypass? |
|---------|-------------------------|---------|
| `responderVendaComFiscal` após `criarVenda` | Pós-commit do create | Emissão acoplada à resposta HTTP |
| `emitirFiscalSeSolicitado` pós pagamento não fiscal | Segunda fase pagamento | OK operacionalmente; ainda fora de ApplicationService |
| `POST /api/fiscal/emitir/venda/:id` | Independente | **SIM — emissão sob demanda pela UI** |
| Comercial | — | Não emite (gap, não bypass) |
| Compra devolução `emitirNFeDevolucaoCompra` | Outro domínio | Não é NFC-e de venda PDV |

**Nenhuma origem comercial emite NFC-e.** O risco atual é o contrário: PDV pode emitir **fora** de um serviço de aplicação único.

---

## 7. Estoque — matriz

| Operação | Responsável | Fiscal / Não fiscal |
|----------|-------------|---------------------|
| Baixa na venda PDV | `reduzirEstoqueDistribuido` | Split `quantidade_fiscal` / `quantidade_nao_fiscal` |
| Baixa na entrega consignação | Bridge estoque | Ajuste plataforma (não via `vendas_itens`) |
| Devolução PDV | `VendaDevolucaoService` | Retorno itens venda |
| Devolução consignação | UC + Outbox | Retorno estoque |
| Perda consignação | Ledger + Outbox financeiro | **Não** rebaixa estoque loja (`afetaEstoque: false`) — consome saldo consignado |
| Cortesia | Ledger | Consome saldo consignado; sem financeiro |
| Prestação “venda” | — | Sem movimento de estoque físico |

---

## 8. Financeiro — matriz

| Quem gera contas / recebimentos | Onde |
|---------------------------------|------|
| PDV á vista | `financeiro` direto + `venda_recebimentos` / `venda_pagamentos` |
| PDV a prazo | `contas_receber` + `financeiro` |
| Consignação venda | `financeiro` via gateway (`consignacao_venda`) |
| Consignação pagamento | `financeiro` via gateway (`consignacao_pagamento`) |
| Cancelamento / devolução PDV | `VendaFinanceiroService` / cancelamento |

**Eventos financeiros de domínio/outbox:** somente Motor Comercial. PDV não publica eventos.

---

## 9. Ledger — matriz

| Escrita | Quem | Duplicada? | Fora do núcleo comercial? |
|---------|------|------------|---------------------------|
| `movimentacoes_comerciais` | UCs via `registrarMovimentacaoComercial` | Não (append-only SSOT comercial documentado) | É o núcleo comercial |
| PDV | — | N/A | PDV **não** usa esse ledger |
| Cache projeções | `sincronizarCacheConsignacao` | Derivado | — |

Não há escrita do ledger comercial pelo PDV. Não há ledger unificado de “venda plataforma”.

---

## 10. Outbox — matriz

| Publicador | Eventos típicos | Duplicação |
|------------|-----------------|------------|
| UCs Motor Comercial | `FinanceiroLancarReceita`, `FinanceiroRegistrarPagamento`, `FinanceiroRegistrarPerda`, `EstoqueBaixarProduto`, … | Um evento por operação; risco de **dupla receita** venda+pagamento no sink financeiro, não de duplo enqueue da mesma operação |
| PDV | Nenhum | — |

---

## 11. Origens futuras (Pedido, Orçamento, E-commerce, App)

Busca por módulos/arquivos `pedido*`, `orcamento*`, ecommerce/app-vendas no backend: **nenhum artefato de geração de venda encontrado**.

Qualquer unificação futura **deve** assumir que essas origens ainda não existem e precisarão mapear para o mesmo DTO/núcleo — hoje só PDV e a “venda” fantasma da prestação são relevantes.

---

## 12. Resposta explícita (validação crítica)

### A Prestação de Contas poderá gerar uma venda utilizando **exatamente o mesmo** `VendaApplicationService` do PDV?

# NÃO

**Motivos exatamente:**

1. **`VendaApplicationService` não existe** na Plataforma CDS. Não há serviço compartilhável com esse nome/contrato.
2. O PDV grava via **`criarVenda(req, res)`**, acoplado a HTTP, caixa aberto, orquestração TEF e INSERT SQL monolítico — **não** é um ApplicationService invocável por outro bounded context.
3. A Prestação hoje cria **`VENDA_PRESTACAO` no ledger comercial**, sem `INSERT INTO vendas`, sem Motor Fiscal, sem o mesmo ciclo fiscal × não fiscal do PDV.
4. Portanto, **no estado atual do código**, a Prestação **não pode** “usar o mesmo VendaApplicationService do PDV”, porque esse contrato/ponto único **não está implementado**.

*(A unificação é desejável e viável como plano to-be — ver `PROPOSTA_UNIFICACAO_VENDA.md`. Isso não muda o NÃO factual do as-is.)*

---

## 13. Evidências de arquivo (âncoras)

| Papel | Path |
|-------|------|
| Único `INSERT INTO vendas` | `backend/services/vendas/VendaPagamentoService.js` |
| Rota create | `backend/rotas/vendas.js` (`POST /`) |
| Emitidor NFC-e | `backend/services/fiscal/emissor.js` |
| Fachada fiscal venda | `backend/services/vendas/VendaFiscalService.js` |
| Rota fiscal bypass/manual | `backend/rotas/fiscal.js` |
| UC venda prestação | `backend/motores/motor-comercial/usecases/consignacao/RegistrarVendaPrestacaoUseCase.js` |
| Tipagem movimento | `backend/motores/motor-comercial/config/comercialTiposMovimentacao.js` |
| Gateway financeiro | `backend/motores/motor-comercial/bridges/platform/FinanceiroPlatformGateway.js` |
| Auditoria financeira prévia | `FIN_01_AUDITORIA_ARQUITETURA_FINANCEIRA.md` |
| Outbox comercial | `backend/motores/motor-comercial/docs/OUTBOX_PATTERN.md` |

---

**Fim da auditoria forense (documento 1/3).**  
Ver também: `MAPA_COMPLETO_DA_VENDA.md`, `PROPOSTA_UNIFICACAO_VENDA.md`.
