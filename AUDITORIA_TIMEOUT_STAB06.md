# AUDITORIA FORENSE — Timeout finalizar-venda-oficial (STAB-06)

**Data:** 2026-07-13  
**Escopo:** Diagnóstico apenas (logs temporários `[STAB06-AUDIT]`). Sem correção.

## Cadeia sincrona relevante

```
POST .../finalizar-venda-oficial
  → FinalizarPrestacaoComVendaOficialUseCase
       → (rápido) carregar prestação + Adapter
       → await criarVendaInterna(payload)   ★ Promise só resolve em res.json
            → criarVenda(...)
                 → OrquestradorPagamento
                 → BEGIN/COMMIT persistência vendas/estoque/financeiro
                 → responderVendaComFiscal
                      → await emitirPorVendaId(vendaId)   ★★ BLOQUEIO
                           → SOAP SEFAZ (timeout default 90_000 ms)
                      → só então res.json(...)
       → fecharPrestação
  → resposta HTTP
```

Frontend (`api/client.js`): **timeout 30_000 ms**.

## Causa raiz

O timeout **não** ocorre na carga da prestação nem no Adapter.

A Promise de `criarVendaInterna` **só libera** quando `criarVenda` chama `res.json`.

Com `emitirFiscal: true` (padrão da UI “Emitir NFC-e / Encerrar”), após o `COMMIT` da venda o fluxo entra em:

`VendaFiscalService.responderVendaComFiscal` → **`await emitirPorVendaId`** → transmissão SOAP SEFAZ.

Enquanto a SEFAZ não responde (ou até esgotar o timeout SOAP de **90s** em `soapClient.js`), **`res.json` não é chamado**, `criarVendaInterna` permanece pendente e o use case não devolve. O cliente HTTP aborta em **30s** → mensagem de timeout no frontend.

### Evidências no código

| Ponto | Arquivo | Comportamento |
|-------|---------|---------------|
| Timeout do cliente | `frontend/.../api/client.js` | `timeout = 30000` |
| Promise interna | `criarVendaInterna.js` | resolve só em `res.json` |
| Bloqueio pós-venda | `VendaFiscalService.responderVendaComFiscal` L187–188 | `await emitirPorVendaId` **antes** de `res.json` |
| Timeout SOAP | `backend/services/fiscal/soapClient.js` | `SEFAZ_TIMEOUT_MS` default **90000** |
| UI | PrestacaoContas | chama com `emitirFiscal: true` |

## O que NÃO é a causa (pelo caminho STAB-06 padrão)

- Adapter / Integridade Comercial (síncronos, ms)
- Deadlock de Ledger/UoW da consignação (leitura termina antes de criarVenda)
- Loop/retry no UseCase comercial
- Promise “esquecida” no UseCase (o await está correto; quem não resolve é o `res.json` enquanto a NFC-e não termina)

## Secundário (só se pagamento for cartão/TEF)

Se o Orquestrador acionar TEF no PIN pad (`tefManager.autorizar`), também pode travar **antes** do COMMIT — logs `[STAB06-AUDIT]` mostrariam parado em “chamou criarVenda” sem chegar a “ANTES await emitirPorVendaId”. No payload típico (dinheiro/prazo) o bloqueio esperado é a NFC-e.

## Como confirmar no console

Reiniciar o backend e repetir a operação. Sequência esperada no timeout:

```
[STAB06-AUDIT] [~0ms] iniciou UseCase
[STAB06-AUDIT] [~XXXms] prestação carregada
[STAB06-AUDIT] [~XXXms] payload ... entrou criarVendaInterna
[STAB06-AUDIT] [~XXXms] criarVendaInterna: chamou criarVenda
[STAB06-AUDIT] [~XXXms] responderVendaComFiscal: ANTES await emitirPorVendaId
… (fica aqui além de 30s) …
(frontend aborta; eventualmente SOAP ou erro depois dos 30s)
```

## Correção (fora desta auditoria)

Responder HTTP **após COMMIT** e emitir NFC-e de forma assíncrona / fase 2, ou aumentar timeout do cliente comercial e/ou não bloquear `criarVendaInterna` na SEFAZ — **não implementado aqui**.
