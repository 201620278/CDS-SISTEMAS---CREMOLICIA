# ADR-COMERCIAL-001 — Motor Comercial RC1 (Release Candidate 1)

**Status:** Aceito  
**Data:** 2026-07-14  
**Sprint:** STAB-06.6.4  
**Relacionado:** ADR-VENDAS-001 · ADR-INTEGRIDADE-COMERCIAL · ADR-UX-001 · STAB-04 · STAB-06 · STAB-06.3 · STAB-06.6.1–06.6.3

## Decisão

O **Motor Comercial** da Plataforma CDS atinge o marco **RC1** (Release Candidate 1) e entra em **CODE FREEZE** após a aprovação desta sprint.

A partir deste marco:

1. O ciclo operacional oficial é:
   **Entrega → Prestação → Pagamento → Venda Oficial → NFC-e → Encerramento**
2. Novas funcionalidades no Motor Comercial somente mediante **RFC** formal.
3. Correções de defeitos (hotfix) permanecem permitidas, sem expandir escopo.
4. O foco de desenvolvimento passa a: Motor Indústria, Motor Financeiro SSOT, Portal do Contador.

## O que o RC1 garante (operador)

- Informações obrigatórias sem placeholders técnicos (`Produto #`, `Cliente #`, `undefined`, `null`, `NaN`).
- Mensagens de erro humanizadas: o quê / por quê / próximo passo; sem stack/SQL/HTTP bruto.
- Mensagens de sucesso padronizadas (`✓ …`).
- Botões com motivo claro quando desabilitados (tooltip).
- Loading explícito em operações longas (NFC-e, encerramento, pagamento).
- Retry em falhas temporárias (SEFAZ / timeout / rede) **sem** duplicar venda, financeiro ou ledger.
- Log operacional e auditoria final RC1 **somente em logs** (nunca bloqueantes).

## Fora do escopo do CODE FREEZE

Alterações em módulos adjacentes quando estritamente necessários e com RFC:

- Motor Fiscal (núcleo)
- Motor Financeiro SSOT
- Ledger / Recovery
- Crédito Comercial
- Motor Indústria / Portal do Contador

## Hardening desta sprint (STAB-06.6.4)

Somente apresentação / UX / telemetria operacional na Prestação:

- `prestacaoHardening.js`
- tooltips, loading, retry UI, safe display
- Estruturas `AUDITORIA_FINAL_RC1` + `LOG_OPERACIONAL_RC1` (retorno interno; sem spam de console)
- Histórico de auditorias de sprint: `docs/archive/auditorias/README.md`

**Não alterado:** Ledger, Recovery, Venda Oficial, Motor Fiscal, Motor Financeiro, Crédito, APIs, banco, fluxos de negócio.

## Consequências

- Build e verify do Motor Comercial devem permanecer verdes.
- Regressão dos fluxos Entrega / Prestação / Pagamento / Venda Oficial / NFC-e / Conta Corrente / Encerramento / Produção Própria / Compra / PDV continua obrigatória em releases.
- Qualquer RFC que toque a Prestação deve preservar STAB-04 (grade/dirty/flush) e a cadeia STAB-06 (venda oficial única).
