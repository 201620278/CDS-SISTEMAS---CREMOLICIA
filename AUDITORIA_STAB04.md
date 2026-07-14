# AUDITORIA STAB-04 — Grade Consistente

**Data:** 2026-07-13  
**Referência:** `AUDITORIA_FORENSE_GRADE_PRESTACAO.md` (Opção B) → correção implementada  

---

## Problema de origem

Cenários em que o operador via valor na grade e o backend não recebia (DOM ≠ State ≠ Payload).

## Correção aplicada

| Item | Status |
|------|--------|
| State único | ✔ |
| `flushPendingChanges` oficial | ✔ |
| Dirty bloqueia Encerrar / Continuar / Voltar (com flush) | ✔ |
| Reload preserva dirty | ✔ |
| Indicador visual pendente/salvo | ✔ |
| `CDS_PRESTACAO_DEBUG` | ✔ |
| Testes automatizados | ✔ 9 novos + regressão mappers/forense |
| Crédito / Ledger / APIs inalterados | ✔ |

## Testes

```
npx jest --config frontend/modules/motor-comercial/jest.config.js \
  tests/pages/stab04GradeConsistencia.test.js \
  tests/pages/gradePrestacaoForense.test.js \
  tests/pages/fecharConsignacaoMappers.test.js
```

**Resultado:** 36 passed.

## Riscos residuais

- Bloqueio de devolução **após** venda permanece (regra de negócio existente) — se falhar, dirty permanece e Continuar/Encerrar não avançam (correto).  
- STAB-05 ainda deve tornar saldo item = 0 bloqueante.

## Veredito

**STAB-04 ATENDE** o princípio: o que está no State (e refletido na Grade) é o que o flush envia. Não há caminho Encerrar sem flush.
