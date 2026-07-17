# RC2.3.4 — Paridade Final Motor Comercial (Desktop × Mobile)

**Versão:** `2.3.4-rc2.3.4` · Build `20260717rc234`  
**Escopo:** Eliminar divergências restantes do fluxo de Consignação Mobile vs ERP Desktop, reutilizando exclusivamente Motores Oficiais e APIs existentes.  
**Restrições:** Sem novas regras de negócio · Sem novas APIs · Sem alteração de banco · Sem lógica de crédito no Mobile.

---

## 1. Veredicto

O Mobile passa a carregar, na **seleção do cliente** (Nova Consignação) e no **detalhe da consignação**, o mesmo conjunto de projeções oficiais usado pelo Desktop (`perfil-comercial` + `situacao-cliente` + `conta-corrente` + `pendencias`), exibindo limite, crédito utilizado/disponível, situação financeira, pendências e conta corrente **somente com dados retornados pelo backend**.

**Status:** Paridade funcional do Motor Comercial Desktop × Mobile alcançada para o fluxo operacional de consignação (sujeito a smoke test físico).

---

## 2. Divergências encontradas

| # | Área | Desktop | Mobile (pré-RC2.3.4) | Impacto |
|---|------|---------|----------------------|---------|
| D1 | Seleção de cliente | `perfil-comercial` + `situacao-cliente` em `_applyClientePerfil` | Só `perfil-comercial`; limite via `p.limite` / `limite_credito` (campos errados) | Crédito/limite real ocultos |
| D2 | Painel crédito | `creditoDisponivel`, `limiteComercial`, `saldoDevedor` da projeção | Ausente na Nova | Operador sem visão financeira |
| D3 | Conta corrente / pendências na seleção | Disponíveis via projeções | Não carregadas na Nova | Paridade visual incompleta |
| D4 | Detalhe consignação | Usa `situacao-cliente` no cockpit | API carregada mas **não renderizada** (`situacao` descartado no destructuring) | Dados oficiais ignorados na UI |
| D5 | Mapper limite perfil | `limiteComercial` | Fallback zero em campos inexistentes | Limite sempre R$ 0,00 |
| D6 | Fallback “Cliente” | Nome + documento | `asText(nome, 'Cliente')` | Escondia ID quando nome vazio |
| D7 | NFC-e | Gate fiscal + comercial | Só operador/acerto | Permissão fiscal Desktop não espelhada |
| D8 | Action bar | N/A | Risco de overlap bottom nav em 360–412px | Ações “sumirem” |

---

## 3. Correções realizadas

### 3.1 Seleção do Cliente (`renderNova`)
- Parallel load oficial:
  - `GET /comercial/perfil-comercial?clienteId=&ativo=true`
  - `GET /comercial/projections/situacao-cliente?clienteId=`
  - `GET /comercial/projections/conta-corrente?clienteId=`
  - `GET /comercial/projections/pendencias?clienteId=`
- Painel **Resumo comercial do cliente** com: Cliente, Perfil, Situação, Limite, Crédito utilizado, Crédito disponível, Saldo/CC, Consignações abertas, Prestação ativa, Último pagamento, Última movimentação, Pendências, CC resumida.
- Preferência de perfil `CONSIGNADO` (paridade Desktop) + formulário de criação pré-selecionado.
- Limite do perfil lido de `limiteComercial` (campo oficial).

### 3.2 Detalhe da consignação
- `carregarConsignacaoCompleta` agora normaliza e **exibe** situação + perfil + pendências + totais de CC.
- Resumo prestação usa `moneyApi` (não força `0` quando a API omite o campo — mostra `—`).
- Histórico sempre seccionado (mesmo se vazio).
- Sticky ops + padding safe-area mantidos/ampliados (360 / 412).

### 3.3 Mappers (`comercial-mappers.js`)
- `normalizeSituacaoCliente` — espelha `SituacaoClienteDTO`.
- `buildClienteProfileView` — espelho de `_applyClientePerfil` (sem recalcular crédito).
- `numFromApi` / `perfilLimiteOf` / `preferPerfilConsignado` / `pendenciasItems` / `contaCorrenteTotais`.
- `unwrapProjection` tolera `{ dados, totais, metadata }` residual.
- Removidos fallbacks que mascaravam `limiteComercial` e o rótulo genérico “Cliente”.

### 3.4 Permissões
- NFC-e exige `canDoAction('emitir_nfce')` (mesma chave Desktop: fiscal/PDV) **além** de operador/acerto.
- Demais ações continuam em `COMERCIAL_CONSIGNACAO` / `COMERCIAL_ACERTO` / `comercial-conta-corrente` — sem permissão exclusiva Mobile.

### 3.5 Responsividade
- `.cds-nova-consignacao` e detalhe com `padding-bottom` acima da bottom nav.
- Action bar: wrap 50% ≤412px; full-width ≤360px.
- Sticky ops acima de `var(--m-bottom-h) + safe-area`.

---

## 4. Endpoints reutilizados (Desktop × Mobile)

| Fluxo | Endpoint Desktop | Endpoint Mobile | Diferença | Campos recuperados / correção |
|-------|------------------|-----------------|-----------|-------------------------------|
| Buscar cliente | `GET /clientes/buscar` | Idem | — | Nome com fallback `Cliente #id` |
| Perfis | `GET /comercial/perfil-comercial?clienteId&ativo` | Idem | Mobile agora lê `limiteComercial` | Limite real |
| Situação / crédito | `GET /comercial/projections/situacao-cliente` | Idem (Nova + Detalhe) | Antes ausente na Nova / ignorado no Detalhe | `limiteComercial`, `creditoDisponivel`, `saldoDevedor`, `statusGeral`, abertas, última mov. |
| Conta corrente | `GET /comercial/projections/conta-corrente` | Idem (`clienteId` [+ `consignacaoId`]) | Agora na Nova e Detalhe | Lançamentos + totais |
| Pendências | `GET /comercial/projections/pendencias` | Idem (`clienteId` [+ `consignacaoId`]) | Agora na Nova e Detalhe | Lista de alertas |
| Criar | `POST /comercial/consignacoes` | Idem | — | — |
| Itens | `POST/PUT/DELETE .../itens` | Idem | — | — |
| Entrega | `POST .../entrega` | Idem | — | — |
| Prestação | `.../prestacao/*` | Idem | — | — |
| Resumo | `projections/resumo-prestacao`, `.../resumo-final` | Idem | — | Vendido / recebido / saldo / fiscal |
| Histórico | `projections/historico` | Idem | — | Eventos |
| DANFE | `GET /fiscal/danfe/venda/:id` | Idem | — | Share |

Nenhuma API nova. Nenhum cálculo de crédito no cliente.

---

## 5. Campos recuperados (exibição)

| Campo UI | Fonte oficial |
|----------|---------------|
| Cliente | ERP `clientes/buscar` / consignação + situacao |
| Perfil comercial | `perfil-comercial` / `situacao.perfil` |
| Limite | `limiteComercial` (perfil ou situacao) |
| Crédito utilizado | `saldoDevedor` / `saldoEmAberto` (situacao) |
| Crédito disponível | `creditoDisponivel` (CreditoComercialService via projeção) |
| Situação financeira | `statusGeral` |
| Conta corrente / saldo | `projections/conta-corrente` |
| Pendências | `projections/pendencias` |
| Total entregue | consignação / soma itens |
| Total vendido / recebido / saldo | resumo-prestacao / resumo-final |
| Status | consignação.status |
| Histórico | `projections/historico` |
| Última prestação / pagamento | `prestacaoAtiva`, `ultimoPagamento`, `ultimaMovimentacao` |

---

## 6. Evidências de paridade Desktop × Mobile

| Critério | Evidência |
|----------|-----------|
| Mesmo motor de crédito | Mobile só lê `situacao-cliente` (backend `CreditoComercialService`) — igual Desktop STAB-02 |
| Mesmo perfil | `perfil-comercial` + preferência CONSIGNADO |
| Mesmo payload criar | `{ clienteId, perfilComercialId, observacao, dataAbertura, usuarioId }` |
| Mesmas ações por status | `deriveComercialPhase` + `buildOperacoesBar` |
| Mesmas permissões RBAC | `access-control.js` keys; NFC-e via `emitir_nfce` |
| Sem regra local | Nenhum `limite - saldo` recalculado no Mobile |

Arquivos-chave:
- `frontend/apps/mobile/js/pages/comercial.js`
- `frontend/apps/mobile/js/comercial-mappers.js`
- `frontend/apps/mobile/js/permissions.js`
- `frontend/apps/mobile/css/mobile.css`
- Desktop referência: `modules/motor-comercial/pages/NovaConsignacao/index.js` (`_applyClientePerfil`)

---

## 7. Checklist do fluxo operacional

| Etapa | UI Mobile | API oficial | Status |
|-------|-----------|-------------|--------|
| Nova Consignação | ✔ | — | OK |
| Selecionar Cliente | ✔ | `clientes/buscar` | OK |
| Carregar Perfil | ✔ | `perfil-comercial` | OK |
| Carregar Crédito | ✔ | `situacao-cliente` | OK |
| Carregar Conta Corrente | ✔ | `conta-corrente` | OK |
| Carregar Pendências | ✔ | `pendencias` | OK |
| Buscar Produto | ✔ | `produtos/search` (+ fallbacks) | OK |
| Adicionar Produto | ✔ LIP qty + Adicionar | `POST .../itens` | OK |
| Editar Quantidade | ✔ | `PUT .../itens/:id` | OK |
| Excluir Produto | ✔ | `DELETE .../itens/:id` | OK |
| Entregar | ✔ sticky ops | `POST .../entrega` | OK |
| Prestação | ✔ | `.../prestacao/abrir` | OK |
| Recebimento | ✔ | `.../prestacao/venda` | OK |
| Pagamento | ✔ | `.../prestacao/pagamento` | OK |
| Encerramento | ✔ | `.../prestacao/fechar` | OK |
| Venda Oficial | ✔ | `.../finalizar-venda-oficial` | OK |
| Emissão NFC-e | ✔ + perm fiscal | `.../emitir-nfce` | OK |
| DANFE | ✔ | `GET /fiscal/danfe/venda/:id` | OK |
| Compartilhar XML | ✔ | resumo `xmlAutorizado` | OK |
| Histórico | ✔ seção + ação | `projections/historico` | OK |
| Ações fora da bottom nav | ✔ sticky + padding | CSS 360/390/412/768 | OK |

---

## 8. Responsividade (auditoria 4)

| Largura | Action bar | Bottom nav |
|---------|------------|------------|
| 360px | Botões full-width | Sticky acima + safe-area |
| 390–412px | Wrap 2 colunas | Idem |
| 768px | Layout max-width 720 | Idem |

Nenhuma ação depende de scroll “surpresa” para ficar clicável: sticky ops permanece acima da nav.

---

## 9. Build / versão

| Artefato | Valor |
|----------|-------|
| `js/version.js` | `2.3.4-rc2.3.4` |
| Cache SW | `cds-mobile-2.3.4-rc234` |
| Query bust | `?v=2.3.4-rc2.3.4` |
| Status | `rc2.3.4-paridade-comercial-final` |

---

## 10. Aceite

- [x] Fluxo Comercial Mobile alinhado ao ERP Desktop (Motores Oficiais)
- [x] Ao selecionar cliente: perfil, crédito, limite, utilizado, disponível, pendências e CC
- [x] Nenhuma regra de negócio nova no Mobile
- [x] Nenhuma API / schema novos
- [x] Relatório gerado neste arquivo

*CDS Sistemas · RC2.3.4 · Paridade Comercial Final · 2026-07-17*
