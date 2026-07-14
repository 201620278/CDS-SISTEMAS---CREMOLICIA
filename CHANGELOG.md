# CHANGELOG — Motor Comercial / CDS

## [STAB-06.3] — 2026-07-14

### Finalização da emissão fiscal na Prestação

#### Adicionado
- `EmitirNfcePrestacaoUseCase` — `criarVendaInterna` (se necessário) → `emitirPorVendaId` (Motor Fiscal oficial)
- `prestacao_faturamento` — vínculo Prestação ↔ venda_id ↔ NFC-e (chave, número, protocolo)
- Rota `POST …/prestacao/emitir-nfce`
- UI: Situação Fiscal, Emitir NFC-e / Encerrar separados, Visualizar/Reimprimir DANFE
- Testes `tests/stab06/emitir-nfce-prestacao.test.js`, `AUDITORIA_STAB06_3.md`

#### Alterado
- Encerrar só após faturamento (AUTORIZADA / NAO_APLICAVEL)
- Rejeição SEFAZ: prestaçã permanece aberta; mesma venda no retry

#### Não alterado
- PrestacaoVendaAdapter, criarVendaInterna, Motor Fiscal/XML/emissor, Ledger, Recovery, Crédito, STAB-03/04

---

## [STAB-06] — 2026-07-13

### Unificação da venda da consignação com o núcleo do PDV

#### Adicionado
- `PrestacaoVendaAdapter` — payload oficial para `criarVenda` (origem CONSIGNACAO, `JA_BAIXADO_CONSIGNACAO`)
- `criarVendaInterna` — mesma função `criarVenda` sem HTTP/caixa
- `FinalizarPrestacaoComVendaOficialUseCase` + rotas resumo/finalizar
- Resumo Final da Prestação (Integridade Comercial + Situação Financeira)
- `ADR-VENDAS-001.md`, `AUDITORIA_STAB06.md`
- Testes `tests/stab06/prestacao-venda-adapter.test.js`

#### Alterado (ponte mínima)
- `criarVenda`: respeita política de estoque já baixado; financeiro parcial consignação
- Prestação: encerrar/emitir chama venda oficial (não só `fecharPrestacao`)
- Grade `VENDA_PRESTACAO` / pagamento: sem espelho financeiro Outbox (ledger mantido)

#### Não alterado
- Ledger schema, Recovery, Motor Fiscal core, Motor Financeiro SSOT, STAB-03/04, fluxo UX do PDV

---

## [UX-20] — 2026-07-13

### Operação Primeiro — quatro estações Shared UI

#### Prestação
- Grade protagonista (scroll só na grade)
- Locator + Estação com sprint UX-20

#### Conta Corrente
- Extrato operacional mantido; Análise fora do viewport

#### Preparar Entrega
- Migrado de CDSPage → Workspace
- Uma faixa de crédito; sem assistente lateral

#### Entrega
- Migrado de WizardLayout → Workspace
- Confirmação fina; Entregar sempre no footer

#### Docs
- `AUDITORIA_UX20.md`
- Ilustrações Antes×Depois em `docs/ux20/`

#### Não alterado
APIs, Ledger, Recovery, Crédito, Outbox, STAB-03/04

---

## [UX-12] — 2026-07-13

### Prestação de Contas V2 — primeira Estação de Trabalho oficial

#### Adicionado
- Rota `/prestacao` — Localizador (Workspace + SmartSearch + EntityCard)
- Atalho na Central: **Prestação de Contas**
- `AUDITORIA_UX12_PRESTACAO.md`

#### Alterado (somente UX)
- Estação `/consignacoes/:id/prestacao` migrada para Workspace (header/body/footer fixos)
- Início operacional em **Registrar Retornos** (grade STAB-04)
- Sidebar de resumo removida do shell
- Sucesso: **Receber Agora** / **Voltar para Central**
- Conferência final enxuta (Total · Recebido · Saldo)

#### Não alterado
- STAB-04 (dirty/flush/grade), Ledger, Recovery, APIs, banco, regras de negócio

---

## [UX-11] — 2026-07-13

### Conta Corrente no Workspace oficial (primeira tela Shared UI)

A Conta Corrente deixa o shell de dashboard (`DashboardLayout` + sidebar + muro de KPIs) e passa a usar o **Shared UI Workspace** como extrato bancário operacional.

#### Alterado (somente UX)

- Shell: `Workspace` + `WorkspaceHeader` + `WorkspaceBody` + `WorkspaceFooter`
- Viewport: cliente · documento · período · saldo · extrato · **Receber**
- Extrato enxuto: Data, Tipo, Descrição, Valor, Saldo
- Scroll apenas no body; header/footer fixos
- KPIs, gráficos, timeline, alertas e pendências movidos para **Análise** (recolhida)
- Exportação unificada no footer (PDF / Excel / CSV / Imprimir)

#### Documentação

- `frontend/shared/ui/CHANGELOG.md` — Conta Corrente como referência oficial Shared UI
- `frontend/modules/motor-comercial/docs/CONTA_CORRENTE_COMERCIAL.md` atualizado

#### Não alterado

- APIs, Ledger, Recovery, Crédito Comercial, banco, eventos, regras de negócio, fluxo financeiro

---

## [UX-10] — 2026-07-13

### Estabilização operacional — Central orientada por estados

A Central de Trabalho Comercial deixa de se comportar como dashboard genérico e passa a operar como **fila operacional** com máquina de estados **E1–E6**.

#### Adicionado

- Classificação oficial por estado (`resolveEstadoOperacionalCliente`)
- Seção **Minha Fila de Trabalho**
- Auditoria automática `auditarCentralEstados` no view-model
- Documento `UX_10_CENTRAL_ORIENTADA_POR_ESTADOS.md`
- Documento `ARQUITETURA_UX_MOTOR_COMERCIAL.md` (máquina de estados da Central)

#### Alterado

- Trabalho Prioritário: **Continuar Atendimento** quando prestação em andamento; **Fechar Atendimento** só quando pronto para fechar
- Consignados Pendentes: renderizados **somente** em E5 (prestação encerrada + saldo > 0)
- Ações Rápidas: apenas atalhos gerais (Nova Entrega, Novo Cliente, Consultar Clientes, Relatórios)
- “Próximas Prestações” → **Atendimentos para Fechar**
- Ordem da fila: E2 → E3 → E4 (prioritário); E5 em bloco exclusivo

#### Removido (da UI da Central)

- Duplicidade Fechar Atendimento em Trabalho Prioritário + Ações Rápidas
- Exibição de Consignados Pendentes durante ciclo aberto (E2–E4)
- Botões mortos nas Ações Rápidas

#### Não alterado

- Regras de negócio, APIs, banco, Recovery, Crédito Comercial, Ledger, Financeiro

---

## [UX-09] — anterior

Recebimento rápido e bloco Consignados Pendentes (pré-máquina de estados).

## [UX-03] — anterior

Central de Trabalho Comercial como home do módulo.
