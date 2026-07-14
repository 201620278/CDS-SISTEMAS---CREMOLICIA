# AUDITORIA UX-10 FIX FINAL — Central Comercial

**Data:** 13/07/2026  
**Prioridade:** P0 / P1  
**Escopo:** Correção final da Central após inconsistência UI × API  
**Bundle regenerado:** SIM (STAB-03)

---

## Resumo

Três bugs corrigidos. A Central volta a usar **somente** a máquina de estados E1–E6; recebimento pós-encerramento é **Conta Corrente Comercial** sem senha gerencial; cliente **QUITADA** some da fila.

---

## Causas raiz

### BUG 1 — QUITADA ainda em Consignados Pendentes

`resolveEstadoOperacionalCliente` tratava `QUITADA` como “encerrada” e ainda aceitava **saldo stale do perfil** (`saldoUtilizado > 0`) para forçar E5, mesmo com consignação `QUITADA` / saldo 0.

Resultado: card “Receber” na UI + API respondendo `status QUITADA` → erro ao clicar.

### BUG 2 — Senha administrativa no recebimento

`_garantirPrestacaoParaRecebimento` abria `autorizacaoGerencialDialog` + `autenticarAdministrador` para `ACERTADA`.

Receber dívida da Conta Corrente é operação diária do operador — não reabertura gerencial excepcional.

### BUG 3 — Nomenclatura de consignação aberta

Modal/handlers ainda falavam em recebimento “da consignação”, embora o ciclo já estivesse encerrado.

---

## Correções

### BUG 1 (P0)

- `isElegivelE5`: apenas `ACERTADA` | `ENCERRADA` com `saldo > 0` — **nunca** `QUITADA`
- Removido atalho E5 por perfil stale
- `QUITADA` / encerrada sem saldo → **E6** (some da Central)
- Filtro extra em `buildConsignadosPendentes` + auditoria
- Após pagamento: `_loadData()` atualiza fila e KPIs; se API disser QUITADA, recarrega e remove

### BUG 2 (P0)

- Removidos `autorizacaoGerencialDialog` / `autenticarAdministrador` do fluxo da Central
- `_prepararRecebimentoContaCorrente`: reabre (quando necessário) com auditoria do **operador logado**, sem senha admin
- Mantidos: operador, data/hora, valor, forma, documento (payload + UI)

### BUG 3 (P1)

- Modal: **“Recebimento da Conta Corrente Comercial”**
- Texto de contexto: dívida pós-encerramento
- Handlers: `_abrirRecebimentoContaCorrente` / `_prepararRecebimentoContaCorrente`
- ViewModel: `acaoTipo: 'receber-conta-corrente'`, `origemRecebimento: 'conta-corrente-comercial'`

---

## Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `pages/Dashboard/centralTrabalhoMappers.js` | E5 estrito; E6 para QUITADA; filtros |
| `pages/Dashboard/index.js` | Recebimento CC sem senha gerencial |
| `pages/Dashboard/RecebimentoRapidoModal.js` | Nomenclatura Conta Corrente |
| `pages/Dashboard/styles.css` | Estilo do texto de contexto |
| `tests/pages/centralTrabalhoMappers.test.js` | Casos QUITADA / perfil stale |
| `motor-comercial.bundle.js` (+ meta/sha256) | Regenerado |

---

## Evidências de testes

### Jest — centralTrabalhoMappers

```
Test Suites: 1 passed
Tests:       27 passed
```

Novos casos:

- `QUITADA nunca entra em Consignados Pendentes (mesmo com perfil stale)` → E6
- `ACERTADA com saldo 0 e perfil stale → E6`

### Homologação lógica

```json
{
  "quitada": "E6",
  "divida": "E5",
  "pendentes": [{ "n": "D", "s": "ACERTADA", "a": "receber-conta-corrente" }]
}
```

Cliente QUITADA **não** aparece em pendentes.

### Bundle (STAB-03)

```
BuildTime: 2026-07-13 10:28:39
Sprint: UX-10
Hash: FD189EE788C0D546B156229CF5B2ACA9A3283F170B91993AF461AF641F3F495B
VERIFY PASSED
```

Strings no artefato: `Recebimento da Conta Corrente Comercial`, `isElegivelE5`, `_prepararRecebimentoContaCorrente`.

---

## Critérios de aceite

| # | Critério | Status |
|---|----------|--------|
| 1 | Cliente quitado some automaticamente | ✅ E6 + reload pós-pagamento |
| 2 | Sem card inconsistente UI × API | ✅ E5 ≠ QUITADA |
| 3 | Sem autorização gerencial para receber | ✅ |
| 4 | Central só com máquina de estados | ✅ `isElegivelE5` |
| 5 | Modal = Conta Corrente Comercial | ✅ |
| 6 | KPIs/lista atualizam após pagamento | ✅ `_loadData()` |
| 7 | Relatório entregue | ✅ este arquivo |

---

## Observação operacional

Reinicie o Electron (ou hard-refresh) para carregar o bundle `10:28:39`. Confirme no console o banner STAB-03 com o hash acima.
