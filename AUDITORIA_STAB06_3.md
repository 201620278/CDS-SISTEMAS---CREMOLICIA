# AUDITORIA STAB-06.3 — Finalização da Emissão Fiscal no Motor Comercial

## Objetivo

Concluir a integração Prestação → Motor Fiscal **sem** segundo emissor.  
O Motor Comercial apenas orquestra: Venda Oficial → `emitirPorVendaId` → vínculo NFC-e na Prestação.

## Fluxo oficial

```
Resumo Final → [Emitir NFC-e] → EmitirNfcePrestacaoUseCase
  → PrestacaoVendaAdapter / criarVendaInterna (se ainda sem venda_id)
  → emitirPorVendaId(vendaId)   ← Motor Fiscal × Não Fiscal (único)
  → prestacao_faturamento (chave, nº, protocolo, faturada)
  → UI libera [Encerrar Prestação]
```

## O que NÃO existe no Motor Comercial

- Montagem de XML
- Chamada SOAP / SEFAZ
- Segundo emissor NFC-e
- Alterações em Adapter, criarVendaInterna, Ledger, Recovery, Crédito, STAB-03/04

## Artefatos

| Camada | Peça |
|--------|------|
| Store | `prestacaoFaturamentoStore` (`prestacao_faturamento`) |
| UC | `EmitirNfcePrestacaoUseCase` |
| UC | `FinalizarPrestacaoComVendaOficialUseCase` (só encerra; exige faturada) |
| API | `POST …/prestacao/emitir-nfce` |
| UI | Resumo Fiscal + Emitir / Encerrar / DANFE |

## Regras

| Situação | Comportamento |
|----------|----------------|
| Sem `venda_id` | Cria venda com `emitir_fiscal:false` e emite |
| Com `venda_id` + rejeitada | Reutiliza a mesma venda |
| Já `AUTORIZADA` | Não reemite; só DANFE |
| `sem_itens_fiscais` | `NAO_APLICAVEL` + libera encerrar |
| Sem itens vendidos | `NAO_APLICAVEL` sem venda |

## Aceite

- Operador conclui tudo no Motor Comercial
- Emissão exclusivamente via Motor Fiscal da plataforma
- Prestação vinculada à Venda Oficial e à NFC-e
- Encerrar desabilitado até autorização (quando há venda fiscal)

## Testes

`node tests/stab06/emitir-nfce-prestacao.test.js`
