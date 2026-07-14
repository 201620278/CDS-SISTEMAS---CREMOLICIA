# ADR — Motor Financeiro como Single Source of Truth (SSOT)

## Status
- Status: Accepted (diretriz oficial da Plataforma CDS — pós auditoria FIN-01)

## Data
- Data: 2026-07-13

## Autor
- Autor: Plataforma CDS / Auditoria FIN-01

## Contexto
A estabilização do Motor Comercial consolidou a regra: nenhum módulo movimenta dinheiro diretamente no caixa da empresa. Cada módulo cuida do seu domínio; movimentação financeira deve ser registrada exclusivamente pelo Motor Financeiro.

A auditoria FIN-01 mostrou que, no estado atual (as-is):

- Não existe módulo `motor-financeiro/`; o “financeiro” é sobretudo `backend/rotas/financeiro.js` + tabela `financeiro`.
- Há múltiplos escritores: PDV (`VendaPagamentoService`), Compras, Contas a Receber, API Financeiro, Bridge Comercial (`FinanceiroPlatformGateway`).
- Caixa (`caixa_*`) é paralelo e sangria/suprimento não espelham em `financeiro`.
- Existem dualidades (AR comercial vs `contas_receber`; crédito comercial vs `clientes.credito_atual`).
- TEF/PIX autorizam; o dinheiro efetivo entra pelo caminho da venda.

Sem SSOT, há bypass, risco de duplicidade e impossibilidade de preparar com segurança NF-e, NFC-e, PDV unificado, Compras e E-commerce.

## Problema
Quem é a autoridade única para caixa, banco, fluxo de caixa, contas a receber/pagar, conciliação e saldos financeiros — e como os demais motores devem interagir sem gravar diretamente essas estruturas?

## Alternativas
1. **Manter writers dispersos** (status quo): cada módulo INSERT/UPDATE em `financeiro`/`caixa`/`contas_receber`.
2. **Facade única sem domínio** (só rotas): API central, mas sem ledger/eventos/outbox.
3. **Motor Financeiro SSOT event-driven** (escolhida): módulos publicam eventos; o motor materializa caixa, banco, AR, AP, conciliação e indicadores.

## Decisão
Adotar oficialmente o **Motor Financeiro como única fonte da verdade (SSOT)** para:

- Caixa
- Bancos
- Fluxo de caixa
- Contas a receber
- Contas a pagar
- Conciliação
- Saldos financeiros
- Indicadores financeiros (DRE operacional, dashboards financeiros)

**Regra obrigatória da plataforma:**

> Nenhum módulo da Plataforma CDS movimenta dinheiro diretamente no caixa da empresa.  
> Módulos executam regras de negócio e **publicam eventos financeiros**.  
> Somente o Motor Financeiro persiste e altera estado financeiro da empresa.

### Responsabilidades explícitas (não financeiras)

| Módulo | Responsável por | Proibido |
|--------|-----------------|----------|
| Motor Comercial | Entrega, prestação, conta corrente comercial, crédito comercial, consignação | Caixa / saldo empresa |
| PDV | Venda, cupom, itens | Caixa |
| NF-e / NFC-e | Documento fiscal | Caixa |
| Compras | Pedidos, entradas, fornecedores | Caixa |

Conta corrente **comercial** (ledger de consignação) permanece SSOT do Motor Comercial; o espelho no caixa/empresa só via eventos ao Motor Financeiro.

## Justificativa
- Elimina bypass e writers múltiplos identificados na FIN-01.
- Alinha Comercial (já próximo: Outbox → Bridge) ao padrão alvo da plataforma.
- Permite migração strangler (FIN-04) sem big-bang no PDV.
- Prepara canais futuros (NF-e, e-commerce) greenfield event-driven.
- Separa domínio operacional (venda, fiscal, consignação) de domínio financeiro (caixa/banco/AR/AP).

## Consequências Positivas
- Uma autoridade clara para dinheiro da empresa.
- Auditoria e reconciliação possíveis (origem → evento → lançamento).
- Idempotência e estorno append-only no ledger financeiro.
- Contratos estáveis (FIN-02) para todos os motores.

## Consequências Negativas
- Exige criar e operar `motor-financeiro` (hoje ausente como motor).
- Migração longa (especialmente PDV — Fase 4).
- Dual-read / feature flags durante cutover aumentam complexidade temporária.
- Equipes precisam disciplina de “nunca INSERT financeiro fora do motor”.

## Impactos
- **Arquitetura:** pipeline Módulo → Evento Financeiro → Motor Financeiro → Caixa/Banco/AR/AP/Conciliação/DRE.
- **Código:** proibir novos writers; migrar existentes conforme FIN-04.
- **Governança:** esta ADR é obrigatória para motores presentes e futuros.
- **Produto:** Portal do Contador e conciliação bancária consomem apenas o SSOT.

## Dependências
- FIN_01_AUDITORIA_ARQUITETURA_FINANCEIRA.md
- FIN_02_EVENTOS_FINANCEIROS.md
- FIN_03_SSOT_FINANCEIRO.md
- FIN_04_PLANO_DE_MIGRACAO.md
- Padrões já adotados: Outbox (Comercial), UnitOfWork (ADR-010), Bridges

## Skills Relacionadas
- `.cds/skills/shared/shared-insight-engine.md` (quando indicadores financeiros)
- Playbooks de bridge / API / motor (`.cds/playbooks/`)

## Referências
- Diretriz: “Nenhum módulo movimenta dinheiro diretamente no caixa da empresa.”
- Auditoria de código FIN-01 (writers: PDV, Compras, Contas Receber, Financeiro API, FinanceiroPlatformGateway).

## Notas de implementação
- **Não implementar** o motor nesta ADR; a decisão é arquitetural.
- Implementação segue FIN-04 (Fases 1–8).
- Correções financeiras: sempre via **estorno/evento**, nunca DELETE de lançamento.

---

*ADR Financeiro SSOT — Plataforma CDS.*
