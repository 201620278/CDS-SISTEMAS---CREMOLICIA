# CHANGELOG — Motor Comercial / CDS

## [STAB-07.2] — 2026-07-14 — Central Operacional (Resumo Final)

### Alterado (somente FE Prestação)
- Resumo Final em **duas colunas** (Financeiro+Pagamentos | Fiscal+Timeline+Log)
- Rodapé fixo: Voltar · Registrar Pagamento · Emitir NFC-e · Encerrar
- `PrestacaoSnapshot` com `pagamentos`, `timeline`, `logOperacional`
- Soft refresh após pagamento (histórico atualiza sem sair da estação)
- Relatório: `AUDITORIA_STAB07_2.md`

### Não alterado
Ledger, APIs, Venda Oficial, Motor Fiscal, Recovery

---

## [STAB-07.1] — 2026-07-14 — Consolidação Prestação (Fase 1)

### Alterado (somente FE Prestação)
- Removido step **Pagamento** da navegação
- Fluxo: **Registrar Retornos → Resumo Final**
- Bloco Pagamento incorporado no Resumo Final
- Eliminado pagamento automático / auto-preenchimento de saldo em `_goNext`
- `PrestacaoSnapshot` ampliado (financeiro, itens, fiscal, vendaOficial, statusOperacional)
- Relatório: `AUDITORIA_STAB07_1.md`

### Não alterado
Ledger, APIs, Venda Oficial, Motor Fiscal, Recovery

---

## [STAB-06.6.4] — 2026-07-14 — Motor Comercial RC1

### Hardening operacional (CODE FREEZE após aprovação)

#### Docs (pós-RC1)
- Auditorias/relatórios históricos unificados em `docs/archive/auditorias/*/COMPILADO_*.md` — índice em `docs/archive/auditorias/README.md`
- Runtime Prestação: removidos logs temporários `[AUDITORIA]` / `[EMITIR]` / `[LOG OPERACIONAL]`

#### Adicionado
- `prestacaoHardening.js` — `safeText`/`safeMoney`, humanização de erros, tooltips de botões desabilitados, loading padronizado, retry amigável, `AUDITORIA_FINAL_RC1`, `LOG_OPERACIONAL_RC1`
- `ADR-COMERCIAL-001.md` — Motor Comercial RC1 + code freeze
- Testes `stab0664HardeningOperacional.test.js`

#### Alterado (somente UX / logs)
- Prestação: mensagens de sucesso `✓` e erros sem vazamento técnico
- Footer Emitir/Encerrar/Continuar/Voltar com tooltip do motivo de bloqueio
- Resumo Final: alerta com **Tentar novamente** / **Corrigir Cadastro** / **Fechar**
- Campos obrigatórios sem `Produto #` / `Cliente #` / `undefined`

#### Não alterado
- Ledger, Recovery, Venda Oficial, Motor Fiscal, Motor Financeiro, Crédito, APIs, banco, fluxos

---

## [STAB-06.6.3] — 2026-07-14

### Consolidação operacional da Prestação

#### Adicionado
- Timeline oficial Entrega → Prestação → Venda Oficial → NFC-e → Encerramento
- Estados de UI da prestação + labels financeiros/fiscais
- Painel de fechamento operacional e log de encerramento

#### Não alterado
- Ledger, Recovery, APIs, regras de emissão/encerramento

---

## [STAB-06.6.2] — 2026-07-14

### SSOT financeiro na Prestação

#### Adicionado
- `prestacaoFinanceiroSnapshot.js` — `{ valorVenda, valorRecebido, saldoEmAberto, situacaoFinanceira }`
- Hero / resumo / encerramento leem o snapshot (sem Σ paralelo da grade)

#### Não alterado
- Ledger, Motor Financeiro SSOT global, APIs

---

## [STAB-06.6.1] — 2026-07-14

### Integridade de itens da consignação

#### Adicionado
- JOIN/`produtoNome` no DTO de itens; status operativo; observação por item
- UI sem fallback `Produto #id`

#### Não alterado
- Regras de venda/fiscal/financeiro

---

## [STAB-06.3] — 2026-07-14

### Finalização da emissão fiscal na Prestação

#### Adicionado
- `EmitirNfcePrestacaoUseCase` — `criarVendaInterna` (se necessário) → `emitirPorVendaId` (Motor Fiscal oficial)
- `prestacao_faturamento` — vínculo Prestação ↔ venda_id ↔ NFC-e (chave, número, protocolo)
- Rota `POST …/prestacao/emitir-nfce`
- UI: Situação Fiscal, Emitir NFC-e / Encerrar separados, Visualizar/Reimprimir DANFE
- Testes `tests/stab06/emitir-nfce-prestacao.test.js`, `docs/archive/auditorias/comercial/COMPILADO_COMERCIAL.md` (seção STAB-06.3)

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
- `ADR-VENDAS-001.md`, `docs/archive/auditorias/comercial/COMPILADO_COMERCIAL.md` (seção STAB-06)
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
- `docs/archive/auditorias/ux/COMPILADO_UX.md` (seção UX-20)
- Ilustrações Antes×Depois em `docs/ux20/`

#### Não alterado
APIs, Ledger, Recovery, Crédito, Outbox, STAB-03/04

---

## [UX-12] — 2026-07-13

### Prestação de Contas V2 — primeira Estação de Trabalho oficial

#### Adicionado
- Rota `/prestacao` — Localizador (Workspace + SmartSearch + EntityCard)
- Atalho na Central: **Prestação de Contas**
- `docs/archive/auditorias/ux/COMPILADO_UX.md` (seção UX-12)

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
