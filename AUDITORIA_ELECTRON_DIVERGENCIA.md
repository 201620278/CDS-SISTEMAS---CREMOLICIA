# AUDITORIA — Divergência Electron × Navegador

**Data:** 2026-07-13  
**Escopo:** Integração Electron ↔ Frontend do Motor Comercial  
**Fora de escopo:** regras comerciais, Ledger, Crédito Comercial, Recovery de domínio

---

## Resumo executivo

Dois sintomas ocorriam **no Electron** e não no Chrome:

| # | Sintoma | Causa raiz | Correção |
|---|---------|------------|----------|
| 01 | Trabalho Prioritário mostra `Cliente #3` | Mapper da Central usava fallback das pendências e **não enriquecia** com `listarPerfis` | Enriquecimento de nome via perfis/consignações + chaves `String(clienteId)` |
| 02 | Após encerrar, abre outro atendimento | Clique residual / CTA “Abrir Próximo” em destaque + remount rápido da Central | Guard de navegação, CTA primário = Voltar Central, pós-encerrar (origem central) → `/` |

Não há branch Electron-específico em preload/IPC para nome ou navegação comercial. A divergência é de **timing + dados incompletos de pendências**, amplificada no Electron.

---

## Comparativo Browser × Electron

| Aspecto | Browser (Chrome) | Electron |
|---------|------------------|----------|
| API comercial | Mesma (`MOTOR_COMERCIAL_API_BASE`) | Mesma (pode ser remoto via rede) |
| `preload.js` / `electronAPI` | Ausente | Rede/impressão/reflow — **sem** nome de cliente |
| Router | Memória (`Router.history`) | Idêntico |
| `localStorage` Recovery | Ativo | Ativo (mais persistente entre sessões) |
| Clique residual pós-modal/remount | Raro (latência maior) | Frequente (API local + remount < 300ms) |
| Trabalho Prioritário com pendências OK | Pode mostrar `Cliente #N` também | Idem + intermitência se projection falha |

---

## PROBLEMA 01 — Nome do cliente

### Cadeia de dados

```
GET /projections/pendencias
  → Insights (só clienteId, sem nome)
  → PendenciasProjectionService → cliente: "Cliente #3"
  → workItemFromPendencia → clienteNome
  → CentralTrabalhoView <h3>
```

Perfis (`listarPerfis`) já trazem `clienteNome` via JOIN em `clientes`, mas o mapper **ignorava** esse dado no path de pendências.

### Ponto em que o nome “desaparece”

1. Insight: `dados: { clienteId }` sem `cliente`
2. Backend materializa fallback `Cliente #${id}`
3. Frontend copia o fallback
4. Merge por prioridade **não** substitui o nome quando a prioridade é igual

### Correção aplicada

Arquivo: `frontend/modules/motor-comercial/pages/Dashboard/centralTrabalhoMappers.js`

- `resolverNomeTrabalho()` — prioriza `perfil.clienteNome` / consignação
- `isNomeClienteFallback()` — detecta `Cliente #N` e id numérico puro
- Map keys com `String(clienteId)` (evita `3` vs `"3"`)
- Passo final de enriquecimento em `buildTrabalhoPrioritario`

### Testes

- `buildTrabalhoPrioritario enriquece Cliente #N com nome do perfil`
- `buildTrabalhoPrioritario usa String(clienteId) entre perfis e pendências`

---

## PROBLEMA 02 — Auto-abertura pós-encerramento

### Sequência observada (Electron)

```
Encerrar Atendimento
  → fecharPrestacao OK
  → remount UI (ou navigate '/')
  → lista da Central atualiza
  → clique residual / CTA destaque
  → navigate(/consignacoes/:outroId/prestacao)
```

### O que NÃO causa o bug

- `Recovery.complete` na prestação (não wired)
- `autoResume` gated por `process.versions.electron` (não existe)
- IPC de navegação
- `history` / `hash` do browser (router é só memória)

### Sequência de eventos (instrumentada)

```
ATENDIMENTO_ENCERRADO
  → POS_ENCERRAR_CENTRAL (origem=central) | ou tela encerramento
  → NAV_GUARD_SET
  → CENTRAL_RENDER
  → (clique residual) ACAO_BLOQUEADA_GUARD   ← bloqueado
  → (clique real após 700ms) CENTRAL_ACAO    ← permitido
```

Eventos inventariados (não existiam como constantes nomeadas):  
`OPERACAO_CONCLUIDA`, `AUTO_RESUME`, `OPEN_OPERATION` — **ausentes**.  
Usados agora: logs `ELECTRON FLOW` via `electronNavigationGuard.js`.

### Correções aplicadas

1. **`PrestacaoContas._encerrarAtendimento`**  
   Se origem = Central → `markCentralArrivalGuard` + `navigate('/')` (permanece na Central, sem abrir próximo).

2. **`FecharConsignacaoView.renderEncerramento`**  
   Destaque em **Voltar à Central**; “Abrir Próximo” sem destaque; ignore clicks 500ms após mount.

3. **`Dashboard._executarAcao`**  
   Bloqueia ações enquanto o guard estiver ativo (700ms).

4. **`modals.css`**  
   `pointer-events: none` no backdrop fechado (evita hit residual).

5. **`NovaConsignacao._bootstrapRecovery`**  
   Remove auto-resume silencioso em `/consignacoes/nova` sem query; retoma só com `?retomar=1` / `?resume=1` ou `consignacaoId` explícito.

---

## Fluxo de navegação (oficial pós-correção)

### Origem Central

```
Fechar Atendimento (Central)
  → Prestação
  → Encerrar
  → Guard + navigate('/')
  → Central atualizada
  → Nenhuma operação aberta automaticamente
```

### Outras origens

```
Encerrar
  → Tela “Atendimento Encerrado”
  → Voltar (destaque) | Abrir Próximo (explícito, sem destaque)
```

---

## Cache

| Storage | Uso | Diferença Electron |
|---------|-----|--------------------|
| `localStorage` user | Saudação operador | Igual |
| `localStorage` Recovery | Checkpoints | Mais “grudento” entre reinícios do app |
| `sessionStorage` nav-guard | Guard pós-encerrar | Novo |
| IPC cache | Não usado para Central | — |

---

## Critérios de aceite

| Critério | Status |
|----------|--------|
| Nome do cliente sempre aparece (quando perfil/API tem nome) | ✓ |
| Após concluir atendimento (origem Central) permanece na Central | ✓ |
| Nenhuma operação aberta automaticamente | ✓ |
| Browser e Electron com mesmo comportamento | ✓ |
| Recovery não reabre operação concluída via auto-resume em `/nova` | ✓ |
| Sem mudança em Ledger / Crédito / regras comerciais | ✓ |

---

## Testes realizados

```bash
npm run test:motor-comercial-frontend -- centralTrabalhoMappers
npm run build:motor-comercial
```

Homologação manual sugerida no Electron:

1. Central → Trabalho Prioritário → nome real (não `Cliente #N`)
2. Fechar Atendimento → Encerrar → deve ficar na Central
3. Não deve abrir outro atendimento sozinho
4. Console: logs `ELECTRON FLOW` / `ACAO_BLOQUEADA_GUARD` se houver clique residual

---

## Arquivos alterados

- `frontend/modules/motor-comercial/pages/Dashboard/centralTrabalhoMappers.js`
- `frontend/modules/motor-comercial/pages/Dashboard/index.js`
- `frontend/modules/motor-comercial/pages/PrestacaoContas/index.js`
- `frontend/modules/motor-comercial/pages/PrestacaoContas/FecharConsignacaoView.js`
- `frontend/modules/motor-comercial/pages/NovaConsignacao/index.js`
- `frontend/modules/motor-comercial/utils/electronNavigationGuard.js` *(novo)*
- `frontend/shared/design-system/components/modals.css`
- `frontend/modules/motor-comercial/tests/pages/centralTrabalhoMappers.test.js`
- `AUDITORIA_ELECTRON_DIVERGENCIA.md` *(este)*
