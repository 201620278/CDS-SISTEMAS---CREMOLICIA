# Auditoria Forense — Append-Only do Ledger Comercial

**Status:** Concluída  
**Severidade:** P0  
**Data:** 2026-07-13  
**Sintoma:** `SQLITE_CONSTRAINT` / `movimentacoes_comerciais é append-only` durante  
`POST /api/comercial/consignacoes/:id/prestacao/pagamento`

---

## Resumo Executivo

| Pergunta | Resposta |
|----------|----------|
| **Quem tentou alterar a tabela?** | `MovimentacaoComercialRepository.atualizarGrupoPrestacaoContasId` |
| **Por quê?** | Heal de “movimentações órfãs” introduzido na correção do 400 de pagamento (reancoragem de `grupo_prestacao_contas_id`) |
| **Qual operação?** | `UPDATE movimentacoes_comerciais SET grupo_prestacao_contas_id = ? WHERE id = ?` |
| **Deveria existir?** | **Não.** Violação arquitetural P0 |
| **Erro arquitetural?** | **Sim.** Ledger Comercial é oficialmente append-only |

O trigger SQLite `trg_mov_comerciais_no_update` abortou corretamente a mutação.  
A falha em cascata gerava HTTP 400 no pagamento.

---

## Fluxo SQL (ordem do incidente)

```
BEGIN (UnitOfWork)
  SELECT consignacao ...
  SELECT movimentacoes_comerciais WHERE consignacao_id = ? AND grupo_prestacao_contas_id = <grupo_ativo>
  SELECT movimentacoes_comerciais WHERE consignacao_id = ?   -- ledger completo
  UPDATE movimentacoes_comerciais                            -- ❌ ABORT
    SET grupo_prestacao_contas_id = <grupo_ativo>
    WHERE id = <venda_orfa>
  → RAISE(ABORT, 'movimentacoes_comerciais é append-only')
ROLLBACK
→ PersistenciaError → HTTP 400
```

**Nenhum INSERT de PAGAMENTO chegou a ocorrer** nesse caminho.

---

## Auditoria do Banco

### Triggers em `movimentacoes_comerciais`

| Trigger | Evento | Efeito |
|---------|--------|--------|
| `trg_mov_comerciais_origem_check` | BEFORE INSERT | Valida `origem` |
| **`trg_mov_comerciais_no_update`** | **BEFORE UPDATE** | **`RAISE(ABORT, 'movimentacoes_comerciais é append-only')`** |
| **`trg_mov_comerciais_no_delete`** | **BEFORE DELETE** | **`RAISE(ABORT, 'movimentacoes_comerciais é append-only')`** |

Fonte: `backend/motores/motor-comercial/migrations/007_constraints.js` (linhas ~88–103).

### Constraints / CHECK

- FK: `consignacao_id`, `consignacao_item_id`, `usuario_id`
- Sem CHECK de negócio além dos triggers de origem/status
- **Append-only garantido por trigger, não por remoção da API**

### Quem dispara / quando / por qual operação

| Campo | Valor |
|-------|-------|
| Dispara | Qualquer `UPDATE`/`DELETE` na tabela |
| Quando | Antes da mutação física |
| Operação que acionou | `atualizarGrupoPrestacaoContasId` no fluxo de pagamento |

---

## Stack completa (responsável)

```
POST /prestacao/pagamento
  ConsignacaoController.registrarPagamento
    RegistrarPagamentoPrestacaoUseCase.processar
      resolverTotaisParaPagamento
        reancorarMovimentacoesOrfasAoGrupo          ← origem lógica
          MovimentacaoComercialRepository
            .atualizarGrupoPrestacaoContasId        ← origem SQL
              UPDATE movimentacoes_comerciais ...
                trg_mov_comerciais_no_update        ← abort correto
```

| Camada | Arquivo | Linha / símbolo |
|--------|---------|-----------------|
| Controller | `controllers/ConsignacaoController.js` | `registrarPagamento` |
| Use Case | `usecases/consignacao/RegistrarPagamentoPrestacaoUseCase.js` | `processar` |
| Helper | `usecases/consignacao/prestacaoOperacaoHelpers.js` | `reancorarMovimentacoesOrfasAoGrupo` |
| Repository | `repositories/MovimentacaoComercialRepository.js` | `atualizarGrupoPrestacaoContasId` |
| SQL | `UPDATE ... SET grupo_prestacao_contas_id = ? WHERE id = ?` | — |
| Trigger | `migrations/007_constraints.js` | `trg_mov_comerciais_no_update` |

---

## Fluxo do Ledger

```
Venda (INSERT VENDA_PRESTACAO)     ✅ append-only
  ↓
Pagamento (INSERT PAGAMENTO)      ✅ esperado
  ↓
[Heal órfãos] UPDATE grupo_id     ❌ P0 — violação
  ↓
Trigger ABORT
```

Pontos que **tentavam** editar histórico:

| Ação | Existia? | Classificação |
|------|----------|---------------|
| Editar lançamento | Sim (`atualizarGrupo…`) | **P0** |
| Atualizar saldo no ledger | Não (saldo é cache em `perfil`/`consignacao`) | OK |
| Corrigir valor | Não | — |
| Mudar grupo via UPDATE | **Sim** | **P0** |
| Alterar data | Não | — |
| Remover lançamento | Não | — |

---

## Fluxo da Conta Corrente

```
Pagamento → registrarMovimentacaoComercial → INSERT ✅
```

Pagamento **não** altera lançamento existente de venda.  
O UPDATE indevido era só o heal de grupo, não o pagamento em si.

Cache `perfil.saldo_aberto` / `consignacao.*` via `UPDATE` em entidades mutáveis: **permitido** (não é ledger).

---

## Fluxo da Consignação / Recovery

| Componente | UPDATE no ledger? |
|------------|-------------------|
| Recovery Framework (FE) | Não |
| `sincronizarCreditoComercial` | Não (atualiza perfil) |
| `AbrirPrestacao` reclaim | Não (atualiza `prestacaoContasAtiva` na consignação) |
| **Reancoragem órfã (P0 pagamento)** | **Sim — causa raiz** |

---

## Arquitetura oficial (confirmada)

> Ledger Comercial = **Append Only**  
> Correção = **novo lançamento compensatório (INSERT)**  
> Nunca UPDATE. Nunca DELETE.

Documentação alinhada: `docs/PERSISTENCIA.md`, `docs/LEDGER_SINGLE_SOURCE_OF_TRUTH.md`, ADR ledger.

---

## Causa raiz

A sprint de correção do HTTP 400 (vendas em grupo órfão) introduziu `atualizarGrupoPrestacaoContasId` para “mover” vendas ao grupo ativo.  
Isso **reescreve histórico** e viola append-only. O trigger oficial da plataforma bloqueou corretamente.

---

## Correção aplicada (origem, sem workaround)

1. **Removido** o `UPDATE` real no repository (método vira guarda que loga `LEDGER` + lança `LEDGER_APPEND_ONLY_VIOLATION`).
2. **`reancorarMovimentacoesOrfasAoGrupo`** não executa mais UPDATE — lança erro se chamado.
3. **Heal correto:** `apontarPrestacaoAtivaParaGrupoRecuperavel`  
   - atualiza apenas o **ponteiro** `consignacoes.prestacaoContasAtiva` (entidade mutável)  
   - ledger permanece intacto  
   - pagamento faz **INSERT** no grupo recuperado.
4. Fallback: totais pela Conta Corrente da consignação (`Σ VENDA − Σ PAGAMENTO`) sem mutar ledger.
5. Instrumentação: log `==================== LEDGER ====================` antes de qualquer tentativa de UPDATE/DELETE no repository.

**Não** desabilitamos trigger.  
**Não** removemos constraint.  
**Não** alteramos histórico.

---

## Impacto

| Antes | Depois |
|-------|--------|
| Pagamento abortava com SQLITE_CONSTRAINT | Pagamento recupera ponteiro / AR e faz INSERT |
| Histórico seria reescrito | Histórico preservado |
| Trigger silencioso para o operador | Log LEDGER + erro tipado se alguém tentar mutar de novo |

---

## Critério final

✓ Nenhuma movimentação comercial sofre UPDATE/DELETE  
✓ Correção operacional via ponteiro de consignação + INSERT de pagamento  
✓ Trigger append-only permanece oficial e ativo  
