# PROPOSTA DE UNIFICAÇÃO DA VENDA — Plataforma CDS

**Data:** 2026-07-13  
**Status:** Proposta somente — **NÃO IMPLEMENTAR** neste documento  
**Base:** `AUDITORIA_FORENSE_ORIGENS_DA_VENDA.md` + `MAPA_COMPLETO_DA_VENDA.md`

---

## 1. Objetivo da unificação

Garantir que **toda origem** (PDV, Prestação/Consignação, Pedido, Orçamento, E-commerce, App) produza venda **somente** via:

```
Origem → VendaDTO Oficial → VendaApplicationService → Núcleo Transacional
         → Motor Fiscal × Não Fiscal | Financeiro | Ledger | Outbox | Recovery
```

Regras duras (to-be):

- Nenhuma origem emite NFC-e diretamente.
- Nenhuma origem escreve Ledger de venda diretamente (exceto o núcleo).
- Nenhuma origem publica Outbox de efeitos de venda diretamente (exceto o núcleo).
- Prestação deixa de ser “venda paralela” financeira/fiscal; passa a **orquestrar origem** que pede a venda oficial.

---

## 2. Resposta explícita (as-is vs to-be)

### As-is — `VendaApplicationService` do PDV?

# NÃO

Motivo: o serviço **não existe**; PDV usa `criarVenda(req,res)`; Prestação usa ledger `VENDA_PRESTACAO`.

### To-be — Prestação poderá gerar venda pelo **mesmo** ApplicationService do PDV?

**SIM**, desde que primeiro:

1. Extrair o núcleo de `criarVenda` para um `VendaApplicationService` puro (sem Express).
2. Introduzir `VendaDTO Oficial` + metadata de origem.
3. Prestação mapear itens acertados → DTO → chamar o **mesmo** serviço.
4. Reconciliar o significado atual de `VENDA_PRESTACAO` (ledger comercial) com a venda plataforma (evitar dupla contagem financeira).

---

## 3. Estratégia de menor risco (fases)

Princípio: **não quebrar PDV nem Motor Comercial**; introduzir adapter fino; cortar bypasses em etapas.

### Fase 0 — Congelar contratos (sem comportamento novo)

- Documentar contrato canônico do DTO (este plano).
- Congelar: Prestação **não** passa a emitir NFC-e “por conta própria”.
- Congelar: rotas novas só atrás de feature flag / ambiente de laboratório.

### Fase 1 — Extrair `VendaApplicationService` sem mudar comportamento PDV

**Reutilizar o que já funciona:**

| Reutilizar | Path |
|------------|------|
| Lógica de persistência / estoque / pagamentos | Extrair de `VendaPagamentoService.criarVenda` |
| Split fiscal × não fiscal | `distribuidorEstoqueVenda.js`, `OrquestradorPagamento.js` |
| Emissão | `VendaFiscalService` + `fiscal/emissor.emitirPorVendaId` |
| Cancelamento / devolução | Services existentes (adaptar depois) |

**Alterar:**

| Arquivo | Mudança proposta |
|---------|------------------|
| Novo: `backend/services/vendas/VendaApplicationService.js` (ou `backend/motores/motor-venda/…`) | API: `criarVenda(VendaDTO, ctx)` retornando resultado |
| Novo: `backend/services/vendas/dto/VendaDTO.js` (+ builders) | Contrato oficial |
| `VendaPagamentoService.js` | `criarVenda` vira adapter HTTP → DTO → ApplicationService |
| `backend/rotas/vendas.js` | Permanece; só passa a não conter regra |

**Risco baixo:** mesma SQL, mesmos efeitos; só extrai fachada.

**Critério de aceite:** PDV bit-a-bit equivalente (hash de testes de venda / smoke existente).

### Fase 2 — Fechar bypass fiscal óbvio

| Arquivo | Mudança |
|---------|---------|
| `backend/rotas/fiscal.js` | Emissão de venda só autorizada se chamada pelo ApplicationService / política interna (ou deprecada com audit log) |
| Front PDV `emitirNFCeVenda` | Passa a pedir “completar venda” via ApplicationService, não SOAP solto |

**Risco médio:** fluxos manuais de reemissão precisam de endpoint de **recuperação fiscal** explícito no núcleo (não delete da capacidade).

### Fase 3 — Introduzir Outbox + efeitos financeiros no núcleo (PDV)

Alinhar PDV ao padrão já usado pelo Motor Comercial:

| Reutilizar | `backend/shared/outbox` (ou infraestrutura comercial compartilhada) |
| Evitar | Continuar `INSERT INTO financeiro` dentro do create |

Passos:

1. ApplicationService grava venda + estoque na mesma UoW.
2. Enfileira `FinanceiroRegistrarReceitaVenda` / AR.
3. Workers/bridges existentes (ou novos) consomem — convergindo com FIN_01 / Motor Financeiro SSOT.

**Risco alto se feito de uma vez** → fazer **dual-write temporário** (só em laboratório) ou feature flag por empresa.

### Fase 4 — Consignação como origem (menor risco operacional)

Não substituir o ledger comercial de imediato. Estratégia dual-track:

#### 4.A — Adapter Prestação → VendaDTO (novo)

Na fechamento/acerto (ponto a decidir: **por item na grade** vs **no Fechar Prestação**):

1. `RegistrarVendaPrestacaoUseCase` (ou UC novo `GerarVendaOficialPrestacaoUseCase`) monta `VendaDTO` com metadata.
2. Chama `VendaApplicationService.criarVenda`.
3. Liga `venda_id` ao grupo de prestação / movimentação.

#### 4.B — Reconciliar `VENDA_PRESTACAO` e financeiro

Problema atual: Outbox já lança receita `consignacao_venda` **sem** venda.

Opções (escolher uma na implementação — não misturar):

| Opção | Descrição | Risco |
|-------|-----------|-------|
| **A (recomendada)** | `VENDA_PRESTACAO` passa a ser **evento comercial interno**; financeiro fiscal/receita vem **somente** do núcleo de venda | Evita dupla receita |
| **B** | Manter receita comercial e venda sem financeiro (venda “fiscal-only”) | Contábil confuso |
| **C** | Compensar/estornar receita espelhada ao criar venda | Complexo, fácil errar |

**Recomendação:** Opção A + flag “Prestação gera venda oficial”.

#### 4.C — Estoque

Estoque **já saiu na Entrega**. Núcleo de venda para consignação **não** deve rebaixar estoque loja:

- Metadata `politicaEstoque: 'JA_BAIXADO_CONSIGNACAO'`  
- ApplicationService **pula** `reduzirEstoqueDistribuido` nesse modo  
- Itens da venda referenciam origem consignação (rastreio)

Isso preserva o Motor Fiscal × Não Fiscal **sem** duplicar saída física.

#### 4.D — Fiscal × Não Fiscal na consignação

Reusar `distribuirItemVenda` / orquestrador com os mesmos campos `quantidade_fiscal` / `quantidade_nao_fiscal` no DTO. Prestação envia linhas já tipadas ou deixa o núcleo calcular como o PDV.

### Fase 5 — Origens futuras (Pedido, Orçamento, E-commerce, App)

Sem código desses módulos hoje: criar **somente** adapters que produzem o mesmo `VendaDTO`. Zero lógica fiscal/estoque/financeiro nestes adapters.

---

## 4. VendaDTO Oficial — necessário?

# SIM

Não existe DTO oficial hoje. O body do PDV é um payload HTTP ad hoc.

### Campos mínimos sugeridos

```text
VendaDTO {
  origem: 'PDV' | 'CONSIGNACAO_PRESTACAO' | 'PEDIDO' | 'ORCAMENTO' | 'ECOMMERCE' | 'APP_VENDAS'
  metadata: {
    consignacaoId?,
    prestacaoId? / grupoPrestacaoContasId?,
    pedidoId?,
    orcamentoId?,
    caixaSessaoId?,
    terminalId?,
    operadorId?,
    correlationId?,
    politicaEstoque?: 'BAIXAR_LOJA' | 'JA_BAIXADO_CONSIGNACAO'
  }
  clienteId?
  itens: [{
    produtoId, quantidade, precoUnitario, descontos...,
    tipoVenda?, quantidadeFiscal?, quantidadeNaoFiscal?
  }]
  pagamentos / recebimentos
  emitirFiscal: boolean
  formaPagamento / prazo
}
```

### Metadata — necessário?

# SIM — para rastreio e política

| Campo | Obrigatório quando |
|-------|--------------------|
| `origem` | Sempre |
| `consignacaoId` | Origem consignação |
| `prestacaoId` / `grupoPrestacaoContasId` | Prestação |
| `pedidoId` | Pedido (futuro) |
| `orcamentoId` | Orçamento (futuro) |

Sem metadata, Recovery/Ledger/Outbox não correlacionam origem e abrem espaço a novas rotas “órfãs”.

---

## 5. Arquivos que serão alterados (plano)

### Criar

| Arquivo | Papel |
|---------|-------|
| `.../VendaApplicationService.js` (path final a decidir) | Núcleo invocável |
| `.../dto/VendaDTO.js` + validações | Contrato |
| `.../mappers/PdvHttpToVendaDTO.js` | Adapter PDV |
| `.../mappers/PrestacaoToVendaDTO.js` | Adapter consignação |
| Testes de contrato ApplicationService | Paridade PDV |

### Alterar (Fases 1–4)

| Arquivo | Por quê |
|---------|---------|
| `backend/services/vendas/VendaPagamentoService.js` | Delegar create |
| `backend/rotas/vendas.js` | Adapter fino |
| `backend/services/vendas/VendaFiscalService.js` | Só via ApplicationService |
| `backend/rotas/fiscal.js` | Restringir bypass |
| `frontend/pdv/js/pdv.js` | Se fechar emissão solta |
| `RegistrarVendaPrestacaoUseCase.js` **ou** UC novo | Chamar núcleo / reconciliar outbox financeiro |
| `FinanceiroPlatformGateway.js` / handlers Outbox | Evitar dupla receita |
| Catálogo `comercialTiposMovimentacao.js` | Metadados se `VENDA_PRESTACAO` mudar semântica |
| Docs motor / FIN | Atualizar SSOT |

### Reutilizar sem reescrever (inicialmente)

- `emitirPorVendaId`
- `OrquestradorPagamento` / `DistribuidorPagamento`
- `distribuidorEstoqueVenda`
- Infra Outbox Motor Comercial (padrão)
- UoW comercial (para escrita ledger **comercial**; venda plataforma UoW próprio ou compartilhado)

### Não misturar

- Não fazer Prestação chamar `POST /api/vendas` HTTP (acoplamento frágil a caixa/TEF).
- Não emitir NFC-e de dentro do Motor Comercial sem passar pelo ApplicationService.
- Não “copiar” SQL de `criarVenda` para um segundo serviço paralelo.

---

## 6. Serviços reaproveitáveis vs a recriar

| Componente | Destino |
|------------|---------|
| `criarVenda` lógica | **Extrair** → ApplicationService |
| `OrquestradorPagamento` | Reutilizar |
| `emitirPorVendaId` | Reutilizar (só chamado pelo núcleo) |
| `RegistrarVendaPrestacaoUseCase` | Evoluir para origem + (opcional) manter ledger de saldo |
| Bridges Outbox | Reutilizar sinks; mudar **quando** disparam |
| `VendaDTO` | **Criar** |
| Motor Financeiro SSOT | **Ainda inexistente** — unificação de venda deve coordenar com FIN_01, não inventar terceiro bypass |

---

## 7. Estratégia final — Consignação no mesmo núcleo (menor risco)

Ordem irreversível recomendada:

1. **Extrair ApplicationService + DTO** com PDV como único cliente (paridade).  
2. **Política de estoque `JA_BAIXADO_CONSIGNACAO`** coberta por teste sem tocar Prestação em produção.  
3. **UC piloto** (feature flag): ao confirmar venda na prestação (ou no fechamento), gerar **uma** venda oficial agregada/por item.  
4. **Desligar** `FinanceiroLancarReceita` espelhado **somente** quando a venda oficial estiver ativa para aquele fluxo (flag).  
5. **Manter** ledger `VENDA_PRESTACAO` como evento de saldo/crédito comercial **ou** reduzir a “marcação de acerto” ligada a `venda_id` — sem segundo lançamento financeiro.  
6. **Fiscal**: emitir apenas pelo núcleo, itens fiscais × não fiscais, Recovery fiscal herdado do PDV.  
7. Só então abrir Pedido/Orçamento/App no mesmo DTO.

Isso **preserva**:

- Motor Fiscal × Não Fiscal (mesmo emissor e mesma distribuição)  
- Outbox (padrão comercial; PDV convergindo)  
- Recovery (correlationId + metadata origem)  
- Ledger comercial (saldo consignação) **distinto** do registro de venda plataforma  
- Caminho futuro do Motor Financeiro (um único produtor de efeitos de venda)

---

## 8. Checklist de riscos

| Risco | Mitigação |
|-------|-----------|
| Dupla receita (venda + consignacao_venda) | Flag + desligar bridge na mesma release do adapter |
| Dupla baixa de estoque | `politicaEstoque` obrigatória no DTO consignação |
| Caixa/TEF exigido na consignação | ApplicationService aceita contexto sem caixa quando origem ≠ PDV (regra explícita) |
| NFC-e com itens já entregues | Validar naturezas fiscais; documentos de referência internas |
| Quebra PDV | Fase 1 somente refatoração + testes de regressão |
| Conta Corrente Receber órfão | Fora do núcleo venda; tratar em trilho financeiro à parte |

---

## 9. Entregáveis desta proposta (próximos passos humanos)

1. ADR: “Única porta de criação de venda = VendaApplicationService”.  
2. Spec do `VendaDTO` oficial (revisão fiscal + comercial + financeiro).  
3. Spike Fase 1 (refatoração PDV) em branch isolada.  
4. Spike Fase 4 com **um** cliente piloto e flag.  

**Nenhuma linha de código desta proposta foi implementada neste trabalho de auditoria.**

---

**Fim da proposta (documento 3/3).**
