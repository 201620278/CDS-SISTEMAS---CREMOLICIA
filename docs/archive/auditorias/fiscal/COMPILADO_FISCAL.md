# Arquivo — Auditorias Fiscais

> Compilado gerado na limpeza RC1 (unificação). Fontes originais preservadas no histórico git.

## Sumário

- [AUDITORIA_FORENSE_PAG_NFCE.md](#auditoria-forense-pag-nfce)
- [AUDITORIA_FORENSE_UI_PRESTACAO_EMITIR.md](#auditoria-forense-ui-prestacao-emitir)
- [AUDITORIA_TIMEOUT_STAB06.md](#auditoria-timeout-stab06)

---

<a id="auditoria-forense-pag-nfce"></a>

## Fonte: `AUDITORIA_FORENSE_PAG_NFCE.md`

## AUDITORIA FORENSE — Grupo `<pag>` NFC-e (rejeição SEFAZ 866)

**Data:** 2026-07-14  
**Caso:** VNF R$ 1,00 × pagamentos PIX 3,00 + Dinheiro 1,00 = 4,00 (sem troco)

## Causa raiz

O array enviado à NFC-e vinha do **acúmulo bruto** `pagamentosMistos` do PDV (ou espelho em `venda_pagamentos`), **sem rateio fiscal × não fiscal** alinhado ao `totalFiscal` da nota.

### Onde nasce o array

1. UI misto: `pagamentosMistos` (`frontend/pdv/js/pdv.js`)  
2. Em confirmação fiscal **manual** + misto: `dados.pagamentos = normalizarPagamentosSemTef(pagamentosMistos)` — **bruto**.  
3. Backend gravava `venda_pagamentos` a partir de `req.body.pagamentos` (bruto).  
4. Emissor preferia `venda_recebimentos`; se vazio/atrasado, usava `venda_pagamentos` **sem** `tipo_recebimento` → `resolverPagamentosNfce` inclui **todos** (`!tipo_recebimento`).  
5. `resolverPagamentosNfce` só recalcula valor quando há **1** pagamento; com 2+ linhas (PIX+Dinheiro) mantém soma 4,00 > vNF 1,00 → **866**.

### Perguntas

| # | Resposta |
|---|----------|
| 1. Onde nasce | `pagamentosMistos` no PDV → body `pagamentos` → `venda_pagamentos` / recebimentos |
| 2. Antigos no array? | No change de tipo misto o array é zerado (`pagamentosMistos = []`); o bug não é “sujeira” residual, é **não ratear** o misto confirmado |
| 3. Limpa ao alterar forma? | Sim, no `change` do tipo misto e no botão confirmar |
| 4. Duplicação detPag? | Não; duas formas reais com valores **totais da tela**, não tipados à nota |
| 5. Total XML = tela? | Total da **venda** na tela ≠ **vNF fiscal**; pagamentos seguiam a tela (4), nota fiscal (1) |
| 6. Log pré-XML | `[AUDITORIA-PAG-NFCE]` em `resolverPagamentosNfce` |

## Correção (somente origem — sem mudar regras do emissor/Motor Fiscal)

1. **PDV:** `montarPagamentosMistosParaEnvio` rateia mistos (mesma prioridade do `DistribuidorPagamento`) e envia parcelas com `tipo_recebimento`.  
2. **Backend:** `venda_pagamentos` passa a persistir **`recebimentos` do Orquestrador** (rateados), não o body bruto.  
3. **Hardening `resolverPagamentosNfce`:** se a soma dos pagamentos fiscais ainda for > vNF (N linhas), **limita** as linhas ao total fiscal antes de `montarPagamentos` — fecha o gap da regra antiga que só ajustava quando havia 1 pagamento (causa direta do 866 com PIX+Dinheiro).

XML/`montarPagamentos` / Motor Fiscal: **estrutura** mantida; apenas a origem/valores do array que alimenta `<pag>`.


---

<a id="auditoria-forense-ui-prestacao-emitir"></a>

## Fonte: `AUDITORIA_FORENSE_UI_PRESTACAO_EMITIR.md`

## AUDITORIA FORENSE — Fluxo da UI da Prestação (Frontend only)

**Escopo:** apenas frontend Motor Comercial / Prestação de Contas  
**Fontes:** `pages/PrestacaoContas/index.js`, `api/MotorComercialApi.js`, `fecharConsignacaoMappers.js`  
**Bundle:** `motor-comercial.bundle.js` (contém `_emitirNfcePrestacao` → `emitirNfcePrestacao`)  
**Sem alteração de regras / backend**

---

## Veredito (5 pontos)

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | Endpoint ao clicar **Emitir NFC-e** | `POST /api/comercial/consignacoes/:id/prestacao/emitir-nfce` |
| 2 | Endpoint ao clicar **Encerrar Prestação** | `POST /api/comercial/consignacoes/:id/prestacao/finalizar-venda-oficial` |
| 3 | Emitir chama `GET …/resumo-final`? | **Não.** Emitir chama só `POST …/emitir-nfce`. |
| 4 | Flag `apenasResumo` no frontend? | **Não enviado.** Frontend nunca manda `apenasResumo`. Esse flag é setado **no backend** ao atender o GET `resumo-final`. |
| 5 | Encerrar só após emissão OK? | **Sim (UI).** Botão desabilitado enquanto `!oficial.podeEncerrar` (exige AUTORIZADA / NAO_APLICAVEL / `podeEncerrarFiscal`). |

---

## Onde aparece o `GET /resumo-final` (e por que a auditoria o viu)

```
Continuar (passo 2 → 3)
  ↓
_goNext() → currentStep === 3
  ↓
_carregarFaturamentoResumo()
  ↓
GET /consignacoes/:id/prestacao/resumo-final
  ↓
Backend: apenasResumo=true → retorno precoce (sem emitir)
  ↓
UI guarda this.faturamento e renderiza Resumo Final
```

Esse GET **não é** o handler do botão Emitir. É só carga de estado fiscal ao entrar no resumo.

---

## Fluxo A — Entrar no Resumo Final

```
Clique: Continuar (step 2)
  ↓
_goNext()
  ↓
GET …/prestacao/resumo-final
  (MotorComercialApi.obterResumoFinalPrestacao)
  Body/query frontend: nenhum `apenasResumo`
  ↓
Resposta: { resumo, integridade, faturamento, … }
  ↓
this.faturamento = data.faturamento
  ↓
_updateUI() → Footer step 3:
  [Emitir NFC-e] se podeEmitir / REJEITADA
  [Encerrar Prestação] disabled se !podeEncerrar
```

---

## Fluxo B — Clique: Emitir NFC-e

```
Clique: Emitir NFC-e (footer step 3)
  ↓
onClick → _emitirNfcePrestacao()
  ↓
Guards locais (sem HTTP fiscal):
  - _emitindoNfce / loading.operation
  - _canEncerrar() (permissão / status consignação)
  - flushPendingChanges() (grade)
  - _garantirPrestacaoAberta()
  ↓
POST …/prestacao/emitir-nfce
  (MotorComercialApi.emitirNfcePrestacao(id, {}))
  Payload: { usuarioId } via _withUsuario
  NÃO envia: apenasResumo, emitirFiscal, fechar
  ↓
Resposta esperada: { faturamento, vendaId, fiscal, mensagem, … }
  ↓
Próxima ação conforme faturamento.situacaoFiscal:

  AUTORIZADA
    → notify sucesso
    → _mostrarCupomFiscal(vendaId)  [GET /api/fiscal/danfe/venda/:id ou imprimirDANFEFiscal]
    → _finalizarComVendaOficial({ emitirFiscal:false, fechar:true, skipConfirm:true })
         → POST …/finalizar-venda-oficial { emitirFiscal:false, fechar:true, usuarioId }
         → step 4 (encerramento)

  NAO_APLICAVEL
    → notify
    → _finalizarComVendaOficial({ emitirFiscal:false, fechar:true, skipConfirm:true })
         → POST …/finalizar-venda-oficial …
         → step 4

  REJEITADA / outro
    → notify erro (motivo)
    → _updateUI() — prestação permanece no step 3
    → Encerrar continua disabled; Emitir vira "Tentar emitir novamente"
```

**Conclusão Fluxo B:** o clique Emitir **não** chama `resumo-final`. Chama `emitir-nfce`. Se o log backend mostra só `apenasResumo` / retorno precoce, a requisição observada **não** é o clique Emitir — é a entrada no step 3 (ou outra tela chamando o GET).

---

## Fluxo C — Clique: Encerrar Prestação

```
Clique: Encerrar Prestação (footer step 3)
  ↓
onClick → _encerrarPrestacaoAposFaturamento()
  ↓
_resumoOficial() — se !podeEncerrar → notify e PARA (sem HTTP)
  ↓
_finalizarComVendaOficial({ emitirFiscal:false, fechar:true })
  ↓
confirmDialog (a menos que skipConfirm — só no pós-emissão automático)
  ↓
POST …/prestacao/finalizar-venda-oficial
  Body: { emitirFiscal: false, fechar: true, usuarioId }
  NÃO envia: apenasResumo
  ↓
Resposta: { fechamento, faturamento, … }
  ↓
encerrado=true → currentStep=4 → tela Central Encerramento
```

---

## Habilitação dos botões (UI)

Fonte: `buildResumoFinalOficial` + `_footerRightNodes`

```
exigeNfce = valorVenda > 0.01 && situacaoFiscal !== 'NAO_APLICAVEL'

podeEmitir = exigeNfce && situacaoFiscal !== 'AUTORIZADA'
             (e fat.podeEmitir !== false)

podeEncerrar = !exigeNfce
            || fat.podeEncerrarFiscal === true
            || situacaoFiscal === 'AUTORIZADA'
```

| Estado | Emitir | Encerrar |
|--------|--------|----------|
| PENDENTE (ainda não emitida) | habilitado* | **desabilitado** |
| REJEITADA | "Tentar emitir novamente" | **desabilitado** |
| AUTORIZADA | oculto | **habilitado** |
| NAO_APLICAVEL | oculto | **habilitado** |
| Sem venda (R$ 0) | oculto | habilitado |

\*também exige `_canEncerrar()` (operador + status da consignação).

Após Emitir com sucesso (AUTORIZADA), a UI **já encerra sozinha** (Fluxo B); o botão Encerrar manual fica para o caso em que a emissão já estava AUTORIZADA e o usuário volta ao resumo.

---

## Mapa Cliente API (contrato HTTP)

| Método FE | HTTP | Path |
|-----------|------|------|
| `obterResumoFinalPrestacao` | GET | `/consignacoes/:id/prestacao/resumo-final` |
| `emitirNfcePrestacao` | POST | `/consignacoes/:id/prestacao/emitir-nfce` |
| `finalizarVendaOficial` | POST | `/consignacoes/:id/prestacao/finalizar-venda-oficial` |

Base: `window.API_URL` + `/comercial` (tipicamente `/api/comercial`).

---

## Diagrama único (UI)

```
[Entrada step 3]
    Continuar
       │
       ▼
 GET resumo-final  ←── único lugar do FE que gera "apenasResumo" no BE
       │
       ▼
 Resumo Final (footer)
       │
       ├──── Emitir NFC-e ──────────────► POST emitir-nfce
       │                                      │
       │                         AUTORIZADA / NAO_APLICAVEL
       │                                      │
       │                                      ▼
       │                         POST finalizar-venda-oficial
       │                         + cupom (se AUTORIZADA)
       │                                      │
       │                                      ▼
       │                                 Step 4 Encerrado
       │
       └──── Encerrar (só se podeEncerrar)
                              │
                              ▼
                 POST finalizar-venda-oficial
                              │
                              ▼
                         Step 4 Encerrado
```

---

## Interpretação do sintoma da auditoria

> `GET /prestacao/resumo-final` → `apenasResumo` → retorno precoce → “nunca chega na emissão”

No **frontend atual**:

1. Esse trecho é o fluxo de **entrada no resumo**, não o de emissão.
2. A emissão só ocorre no **POST emitir-nfce**, disparado pelo botão Emitir.
3. Se em runtime só aparece o GET, causas prováveis **fora** deste wiring:
   - operador não clicou em Emitir (só chegou ao resumo);
   - ERP sem reload do bundle (improvável: bundle já contém `emitirNfcePrestacao`);
   - observar o Network da aba Errada / filtrar só GET;
   - falha antes do POST (guard de grade / permissão / prestação não aberta) — nesse caso **nenhum** endpoint fiscal é chamado.

---

## Evidências de código (âncoras)

- Emitir onClick → `_emitirNfcePrestacao` → `api.emitirNfcePrestacao`  
  `PrestacaoContas/index.js` (footer step 3 + método)
- Encerrar onClick → `_encerrarPrestacaoAposFaturamento` → `api.finalizarVendaOficial`  
  mesmo arquivo
- GET resumo só em `_carregarFaturamentoResumo` chamado por `_goNext` quando `currentStep === 3`  
  mesmo arquivo
- `apenasResumo`: **zero ocorrências** no frontend Motor Comercial


---

<a id="auditoria-timeout-stab06"></a>

## Fonte: `AUDITORIA_TIMEOUT_STAB06.md`

## AUDITORIA FORENSE — Timeout finalizar-venda-oficial (STAB-06)

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


