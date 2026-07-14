# Auditoria Final — Integridade da Prestação de Contas (P0)

**Status:** Concluída (somente leitura — sem novas funcionalidades)  
**Data:** 2026-07-13  
**Escopo:** Motor Comercial — abertura/encerramento de prestação, Recovery, Ledger  
**Caso analisado:** consignação `#1` (banco oficial)

---

## Veredito

| Pergunta | Resposta |
|----------|----------|
| Como a consignação ficou com grupo diferente das vendas? | O ponteiro `prestacaoContasAtiva` foi **apagado** após a 1ª venda |
| Recovery cria nova prestação? | **Não** |
| Existe fluxo que abre prestação duplicada? | **Sim** — indireto: wipe do ponteiro + novo `AbrirPrestacao` |
| Classificação | **P0 — Integridade** |

**Causa raiz (definitiva):**

`ConsignacaoRepository.atualizar()` sempre expande campos embutidos de documento/prestação.  
Quando chamado só com cache (`saldoAberto`, `valorTotal*`) — tipicamente via `sincronizarCacheConsignacao` após **RegistrarVenda** — grava `prestacao_id` / `prestacao_status` = `NULL`.

Com isso:

1. `prestacaoEstaAberta()` passa a retornar `false`
2. O próximo `AbrirPrestacao` cria **novo** grupo + `INSERT ABERTURA_PRESTACAO`
3. Vendas permanecem no grupo antigo → **órfãs em relação ao ponteiro ativo**

O Ledger **não** foi alterado (append-only respeitado nesse trecho). O bug está na **entidade mutável** `consignacoes`.

---

## Evidência no banco (consignação `#1`)

### Ponteiro atual

| Campo | Valor |
|-------|-------|
| `status` | `ENTREGUE` |
| `prestacao_id` | `prest-1-1783909464250-j1v242` |
| `prestacao_status` | `ABERTA` |

### Ledger (ordem cronológica)

| id | tipo | valor | grupo | horário |
|----|------|-------|-------|---------|
| 3 | ENTREGA | 50 | — | 02:08:00 |
| 5 | ABERTURA_PRESTACAO | — | `…4poz9o` | **02:09:06** |
| 6 | VENDA_PRESTACAO | 45 | `…4poz9o` | **02:09:06** |
| 7 | DEVOLUCAO | 5 | — | 02:24:09 |
| 8 | ABERTURA_PRESTACAO | — | `…j1v242` | **02:24:24** |

- **Não há** `FECHAMENTO_PRESTACAO` no ledger → o 1º grupo **nunca foi fechado**.
- Intervalo venda → 2ª abertura ≈ **15 min**.
- DEVOLUCAO sem grupo é esperada em `RegistrarDevolucaoAntesPrestacao` (fora do ciclo de prestação).

---

## 1. Abertura da Prestação — `AbrirPrestacaoUseCase`

**Arquivo:** `usecases/consignacao/AbrirPrestacaoUseCase.js`

| Condição | Comportamento |
|----------|----------------|
| `prestacaoEstaAberta(consignacao)` | Idempotente — **reutiliza** grupo, sem INSERT |
| Ponteiro ausente + grupo recuperável no ledger (heal recente) | Reaponta `prestacaoContasAtiva` — sem novo grupo |
| Caso contrário + status `ENTREGUE` | **Cria** novo grupo + `INSERT ABERTURA_PRESTACAO` + atualiza ponteiro |

`prestacaoEstaAberta` exige `prestacaoContasAtiva.status === 'ABERTA'`.  
Se o ponteiro foi zerado no banco, a idempotência **não protege**.

### Pontos de criação de grupo

| Origem | Cria grupo? |
|--------|-------------|
| `AbrirPrestacao` (caminho normal) | Sim |
| `AbrirPrestacao` (idempotente / reclaim) | Não |
| `ReabrirPrestacao` | Sim (novo ciclo após FECHADA) |
| Recovery | Não |

---

## 2. Recovery Framework

**Arquivos:** `frontend/shared/recovery/RecoveryManager.js`, `recovery/loaders.js`

| Operação | Abre prestação? | Altera ponteiro? |
|----------|-----------------|------------------|
| `resume()` | Não — só carrega checkpoint/contexto | Não |
| Loaders | Só leem API/checkpoint/cache | Não |
| `complete` / `cancel` | Não | Não |

**Conclusão:** Recovery **nunca** cria prestação. Apenas recupera estado de UI/operação.

Não há `abrirPrestacao` em `frontend/modules/motor-comercial/recovery` nem em `frontend/shared/recovery`.

---

## 3. Fluxo Entregar → Prestação

```
Preparar Entrega / Entrega
  → RegistrarEntrega (backend)
  → (opcional) Termo
  → Dialog “Fechar Atendimento”
       → api.abrirPrestacao(consignacaoId)   // EntregaConsignacao/index.js ~703
       → navega /prestacao
```

Outros callers de `abrirPrestacao`:

| Tela | Momento |
|------|---------|
| `PrestacaoContas._garantirPrestacaoAberta` | Antes de venda/perda/cortesia/pagamento/fechar |
| `Consignacoes` / `DetalhesConsignacao` | Ação explícita “abrir prestação” |

Se o ponteiro já estiver `ABERTA`, backend é idempotente.  
Se o ponteiro foi **wipado** após a 1ª venda, `_garantirPrestacaoAberta` ou nova chamada cria o **2º grupo**.

---

## 4. Reinício do ERP / Recovery

Simulação lógica (código + evidência):

```
Abrir prestação          → grupo A no ledger + ponteiro A
Registrar venda          → INSERT venda(A) + sincronizarCacheConsignacao
                           → UPDATE consignacoes SET prestacao_* = NULL  ← bug
Fechar ERP / Reabrir
Recovery.resume          → NÃO cria prestação
Continuar / garantirPrestacaoAberta
AbrirPrestacao           → ponteiro null → cria grupo B
```

**Resultado:** nova prestação criada **não pelo Recovery**, e sim pelo **AbrirPrestacao** após ponteiro perdido.

---

## 5. Integridade — duas prestações “abertas”

No modelo atual:

- **Ponteiro DB:** no máximo um `prestacao_id` / `prestacao_status` por consignação.
- **Ledger:** pode haver **vários** `ABERTURA_PRESTACAO` sem `FECHAMENTO` (grupos órfãos no histórico).

Isso **viola** a diretriz:

> Uma consignação poderá possuir apenas uma prestação de contas ativa por vez.  
> Toda movimentação deverá pertencer ao grupo ativo correspondente.

**Classificação: P0.**

Não é “duas linhas ABERTA no ponteiro”, e sim **dois ciclos abertos no ledger** com um único ponteiro apontando para o ciclo vazio.

---

## 6. Banco — pertencimento das movimentações

| Movimentação | Grupo | Pertence ao ativo (`…j1v242`)? | Por quê |
|--------------|-------|--------------------------------|---------|
| VENDA 45 | `…4poz9o` | Não | Grupo antigo; ponteiro migrado após wipe |
| ABERTURA #1 | `…4poz9o` | Não | Idem |
| ABERTURA #2 | `…j1v242` | Sim | Grupo ativo atual |
| DEVOLUCAO 5 | null | N/A | UC antes da prestação (sem grupo) |
| ENTREGA | null | N/A | Fora do ciclo de prestação |

---

## 7. Ledger append-only

| Rotina | UPDATE/DELETE no ledger? |
|--------|---------------------------|
| Triggers `trg_mov_comerciais_no_update/delete` | Bloqueiam (oficiais) |
| `atualizarGrupoPrestacaoContasId` | Removido — agora só guarda/erro |
| Pagamento / Venda / etc. | **INSERT** apenas |
| Cache perfil/consignação | UPDATE em **entidades**, não no ledger |

✓ Ledger permanece append-only após a correção forense anterior.

---

## 8. Recovery vs criação de grupo

| Regra | Status atual |
|-------|--------------|
| Recovery nunca cria grupo novo | ✓ Cumprida |
| Recovery sempre reutiliza | ✓ N/A (não mexe em prestação) |
| AbrirPrestacao nunca duplica | ✗ Falha se ponteiro wipado |
| FecharPrestacao encerra grupo | ✓ (quando chamado; no caso #1 **não** houve fechamento) |
| Nenhuma movimentação órfã | ✗ Caso #1 prova o contrário |

---

## 9. Máquina de estados da prestação

```
[sem ponteiro]
    │ AbrirPrestacao
    ▼
[ABERTA] ── vendas/pagamentos (grupo G) ──► [FECHADA] ──► consignação ACERTADA/ENCERRADA
    │                                            │
    │ (bug: sync cache zera ponteiro)            │ ReabrirPrestacao (autorizado)
    ▼                                            ▼
[sem ponteiro] ── AbrirPrestacao ──► [ABERTA grupo G2]   [ABERTA grupo G3 novo]
                     ▲
                     │ vendas ficam em G (órfãs p/ G2)
```

---

## Fluxos resumidos

### Prestação

```
Abrir → (ops) → Fechar → (opcional Reabrir)
```

### Recovery

```
checkpoint → resume → carrega UI → NÃO toca prestação backend
```

### Ledger

```
somente INSERT (ABERTURA, VENDA, PAGAMENTO, FECHAMENTO, …)
```

### Consignação (ponteiro)

```
prestacao_* deve refletir o único grupo aberto
hoje: pode ser NULL ou apontar para grupo sem as vendas  ← P0
```

---

## Causa raiz (código)

**Arquivo:** `backend/motores/motor-comercial/repositories/ConsignacaoRepository.js`

```javascript
async atualizar(id, dados) {
  const embedded = this._expandirCamposEmbedded(dados);
  // mapGrupoPrestacaoContasToColumns(undefined) → prestacao_* = null
  Object.entries(embedded).forEach(([col, val]) => {
    if (val !== undefined) { // null PASSA
      sets.push(`${col} = ?`);
    }
  });
}
```

**Disparador frequente:** `sincronizarCacheConsignacao` após venda (e outros UCs).

**Cadeia no caso #1:**

```
RegistrarVendaPrestacao
  → sincronizarCacheConsignacao({ saldoAberto, valorTotal* })
  → consignacao.atualizar SEM prestacaoContasAtiva
  → UPDATE prestacao_id = NULL, prestacao_status = NULL
  → AbrirPrestacao / _garantirPrestacaoAberta
  → novo grupo + ABERTURA #2
```

---

## Recomendações (não implementadas nesta auditoria)

1. **P0 — Corrigir `ConsignacaoRepository.atualizar`**  
   Só escrever colunas embutidas de documento/prestação quando `dados.documento` / `dados.prestacaoContasAtiva` forem **explicitamente** informados. Nunca gravar `null` por omissão.

2. **Teste de regressão**  
   Abrir prestação → registrar venda → `buscarPorId` → assert `prestacao_status === 'ABERTA'` e mesmo `prestacao_id`.

3. **Invariant operacional**  
   Antes de criar nova `ABERTURA`, falhar ou reclaim se já existir `ABERTURA` sem `FECHAMENTO` no ledger (heal já parcial em `AbrirPrestacao`; deve permanecer após o fix do wipe).

4. **ReabrirPrestação**  
   Avaliar se deve reabrir o **mesmo** grupo (status ABERTA) em vez de criar grupo novo — evita órfãos por desenho em ciclos excepcionais.

5. **Homologação**  
   Executar a matriz de testes do briefing **após** o fix do repositório (cenários ERP/Recovery/pagamento).

---

## Critérios de aceite (estado atual)

| Critério | Hoje |
|----------|------|
| No máximo uma prestação aberta por consignação | ✗ Ledger pode ter múltiplas ABERTURAs sem FECHAMENTO |
| Recovery nunca cria prestação | ✓ |
| Recovery apenas recupera | ✓ |
| Movimentações no grupo correto | ✗ Caso #1 |
| Sem órfãs | ✗ |
| Ledger append-only | ✓ |
| Sem UPDATE/DELETE no ledger | ✓ |
| Fluxo homologado | Pendente pós-fix do wipe |

---

## Diretriz Oficial (reafirmada)

> Uma consignação poderá possuir apenas uma prestação de contas ativa por vez.  
> Toda movimentação comercial deverá pertencer ao grupo ativo correspondente.  
> O Recovery Framework nunca poderá criar uma nova prestação; sua única responsabilidade é recuperar e continuar a operação existente.

**Bloqueador atual para cumprimento pleno:** wipe do ponteiro em `ConsignacaoRepository.atualizar` durante sync de cache.
