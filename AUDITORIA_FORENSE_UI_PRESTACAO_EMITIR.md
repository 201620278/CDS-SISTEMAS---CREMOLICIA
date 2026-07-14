# AUDITORIA FORENSE — Fluxo da UI da Prestação (Frontend only)

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
