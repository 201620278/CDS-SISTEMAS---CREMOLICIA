# Arquivo — Auditorias UX

> Compilado gerado na limpeza RC1 (unificação). Fontes originais preservadas no histórico git.

## Sumário

- [AUDITORIA_ELECTRON_DIVERGENCIA.md](#auditoria-electron-divergencia)
- [AUDITORIA_FORENSE_UX10_CENTRAL.md](#auditoria-forense-ux10-central)
- [AUDITORIA_SMARTSEARCH_ENTITYCARD.md](#auditoria-smartsearch-entitycard)
- [AUDITORIA_UX_MOTOR_COMERCIAL.md](#auditoria-ux-motor-comercial)
- [AUDITORIA_UX_OPERACIONAL_CENTRAL_TRABALHO.md](#auditoria-ux-operacional-central-trabalho)
- [AUDITORIA_UX_VISUAL_MOTOR_COMERCIAL.md](#auditoria-ux-visual-motor-comercial)
- [AUDITORIA_UX10_FIX_FINAL.md](#auditoria-ux10-fix-final)
- [AUDITORIA_UX12_PRESTACAO.md](#auditoria-ux12-prestacao)
- [AUDITORIA_UX20.md](#auditoria-ux20)
- [AUDITORIA_UX21_2.md](#auditoria-ux21-2)
- [AUDITORIA_UX21_3.md](#auditoria-ux21-3)

---

<a id="auditoria-electron-divergencia"></a>

## Fonte: `AUDITORIA_ELECTRON_DIVERGENCIA.md`

## AUDITORIA — Divergência Electron × Navegador

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


---

<a id="auditoria-forense-ux10-central"></a>

## Fonte: `AUDITORIA_FORENSE_UX10_CENTRAL.md`

## AUDITORIA FORENSE — UX-10 NÃO REFLETIDA NA CENTRAL DE TRABALHO

**Status:** P0  
**Data:** 13/07/2026  
**Tipo:** Auditoria forense (somente diagnóstico — sem correção)  
**Pergunta:** Por que a UX-10 está no código-fonte, mas a Central continua com o comportamento antigo?

---

## Veredito objetivo

A UX-10 **não aparece na interface** porque o Electron/ERP **não executa os fontes** `pages/Dashboard/*.js`.

Executa:

```
frontend/modules/motor-comercial/motor-comercial.bundle.js
```

Esse bundle está **congelado em UX-09** (gerado às **02:33** do dia 13/07/2026).  
Os fontes UX-10 foram gravados às **08:42** do mesmo dia — **~6h depois** — e **nunca foram reempacotados**.

### Classificação (critério §8)

| Opção | Aplica? |
|-------|---------|
| **A) bundle antigo** | **SIM — causa raiz** |
| **B) view antiga** | SIM, *dentro do bundle* (não no disco-fonte) |
| **C) dashboard usando mapper antigo** | SIM, *dentro do bundle* |
| **D) duas fontes de dados** | Parcial (listas paralelas existem, mas não são a causa do “não mudou nada”) |
| **E) renderização duplicada** | Não como causa raiz |
| **F) cache** | Possível reforço (browser/Electron), secundário |
| **G) Electron carregando assets antigos** | **SIM — mecanismo** (injeta o bundle A) |
| **H) outro** | Assimetria CSS fonte vs JS bundle (agrava confusão) |

**Resposta curta:** **A + G**.  
O código UX-10 no disco é real; a UI do operador roda o **artefato antigo**.

---

## 1. Cadeia completa de renderização

### Cadeia pretendida (fontes UX-10 no disco)

```
routes/index.js  →  component: 'Dashboard'
        ↓
bootstrap/index.js  →  Dashboard: () => DashboardPage.create()
        ↓
pages/Dashboard/index.js
        ↓  _loadData()
ProjectionApi + MotorComercialApi  (dashboard, indicadores, timeline,
                                    historico, pendencias, consignacoes, perfis)
        ↓
buildCentralTrabalhoViewModel()     ← centralTrabalhoMappers.js (UX-10)
        ↓  resolveEstadoOperacionalCliente / buildFilaOperacional
this.viewModel
        ↓  _renderView()
CentralTrabalhoView.render(viewModel, ctx)
        ↓
DOM em .cds-central-trabalho-host
```

### Cadeia real em runtime (Electron / ERP)

```
frontend/erp/index.html
  <script src="/modules/motor-comercial/motor-comercial.bundle.js">
        ↓
IIFE MotorComercialBundle (esbuild)
  → contém cópia congelada de:
       Dashboard/index.js          (pré-UX-10)
       CentralTrabalhoView.js      (UX-09: _renderOperacionalRow)
       centralTrabalhoMappers.js   (UX-09: saldo>0 + Fechar nas Ações Rápidas)
        ↓
UI do operador
```

**Jest** testa os **fontes** (`require('../../pages/Dashboard/...')`) → por isso os testes UX-10 passam.  
**Electron** carrega o **bundle** → por isso a UI não muda.

---

## 2. Origem real dos dados

| Camada | Origem em runtime | Conteúdo |
|--------|-------------------|----------|
| HTML inject | `frontend/erp/index.html` L371 | script do bundle |
| CSS Central | `index.html` L41 → `pages/Dashboard/styles.css` | **fonte ao vivo** (pode já ter classes UX-10) |
| JS Central | `motor-comercial.bundle.js` | **UX-09 congelado** |
| Dados API | Projection + MotorComercialApi (iguais) | não são o bloqueio |
| ViewModel | função **dentro do bundle** | mapper antigo |

### Evidência de timestamp / hash

| Artefato | LastWriteTime | Observação |
|----------|---------------|------------|
| `motor-comercial.bundle.js` | **2026-07-13 02:33:09** (−03) | Pré-UX-10 |
| `centralTrabalhoMappers.js` | **2026-07-13 08:42:23** | UX-10 |
| `CentralTrabalhoView.js` | **2026-07-13 08:42:48** | UX-10 |
| `Dashboard/index.js` | **2026-07-13 08:42:29** | UX-10 |

**SHA256 do bundle atual:**

```
985675980CE0870334A9954DB75786427CDDA1C1E4919F9F94311E69466DAF7B
```

### Evidência de conteúdo do bundle (sem strings UX-10)

Ausentes no bundle:

- `Minha Fila de Trabalho`
- `resolveEstadoOperacionalCliente`
- `auditarCentralEstados`
- `Continuar Atendimento`
- `Atendimentos para Fechar`
- `UX-10`

Presentes no bundle (UX-09):

- comentário `UX-09 — Trabalho Prioritário + Consignados Pendentes lado a lado` (~L7754)
- `_renderOperacionalRow` (~L7755)
- `acoes.fecharAtendimento` + botão **Fechar Atendimento** nas Ações Rápidas (~L7768–7773)
- `buildAcoesRapidas` com `fecharAtendimento: { label: "Fechar Atendimento" }` (~L79524–79533)
- `buildConsignadosPendentes` por `saldoUtilizado > 0` (~L79577–79590)
- `buildAcaoPrincipal` força `Fechar Atendimento` para qualquer `acaoTipo === "prestacao"` (~L79509)

Build oficial:

```
npm run build:motor-comercial
→ scripts/build-motor-comercial.js (esbuild)
→ frontend/modules/motor-comercial/motor-comercial.bundle.js
```

**Este comando não foi executado após a UX-10.**

---

## 3. Listas / coleções paralelas

### No ViewModel (fonte e bundle)

| Coleção | Decide ação do cliente? | Concorre com máquina de estados? |
|---------|-------------------------|----------------------------------|
| `trabalhoPrioritario` | Sim (primária) | É o bloco oficial E2–E4 |
| `consignadosPendentes` | Sim (Receber) | Deveria ser só E5; no bundle = qualquer saldo > 0 |
| `proximasEntregas` | CTA Continuar Entrega | Paralela (lista auxiliar) |
| `proximasPrestacoes` / `proximosFechamentos` | CTA Fechar/Continuar | Paralela (lista auxiliar) |
| `resumoDia` (KPIs) | Não (contadores) | Não |
| `acoesRapidas` | No bundle: **sim** (Fechar) | **Concorre** com prioritário no bundle |
| `ultimasOperacoes` | Não | Não |
| `pendencias` (API) | Alimenta mapper no bundle antigo | Fonte paralela de alertas |
| `dashboard` / `indicadores` | Só KPIs | Não |

### Fora da Central (não montam a home, mas criam “Fechar Atendimento”)

Central de Clientes (`centralOperacoesMappers`), Consignações, drawers, etc. — ver §4.

**Conclusão §2:** há listas paralelas, mas o sintoma “Central igual à de antes” é explicado **pelo bundle antigo**, não por uma segunda tela renderizando por cima.

---

## 4. Onde “Fechar Atendimento” é criado

### Dentro do caminho da Central (fonte UX-10 — disco)

| Arquivo | Função / contexto | Linha |
|---------|-------------------|-------|
| `pages/Dashboard/centralTrabalhoMappers.js` | `itemFromEstado` → E3 | **275** |
| `pages/Dashboard/centralTrabalhoMappers.js` | `buildProximasPrestacoes` (label E3) | **587** |
| `pages/Dashboard/centralTrabalhoMappers.js` | `auditarCentralEstados` (asserts) | **674–675, 690** |
| `pages/Dashboard/CentralTrabalhoView.js` | `_renderProximosFechamentos` fallback | **304** |
| `pages/Dashboard/index.js` | mensagem de erro recebimento | **270** |

### Dentro do bundle (o que o operador vê)

| Trecho bundle | Comportamento |
|---------------|---------------|
| ~L7773 `_renderAcoesRapidas` | Botão principal **Fechar Atendimento** |
| ~L7927 `_renderProximasPrestacoes` | `Continuar` / `Fechar Atendimento` |
| ~L79509 `buildAcaoPrincipal` | Sempre Fechar se `prestacao` |
| ~L79531–79533 `buildAcoesRapidas` | Slot `fecharAtendimento` |

### Fora da Central (outras telas — também no bundle)

| Arquivo | Função / contexto | Linha |
|---------|-------------------|-------|
| `pages/PerfilComercial/centralOperacoesMappers.js` | `buildProximaAcao` (emPrestacao) | **249** |
| `pages/PerfilComercial/centralOperacoesMappers.js` | `buildProximaAcao` (prestacaoPendente) | **266** |
| `pages/PerfilComercial/centralOperacoesMappers.js` | pendência operacional | **280** |
| `pages/PerfilComercial/centralOperacoesMappers.js` | `buildAcoesPrincipais` | **327, 337** |
| `pages/PerfilComercial/Cliente360Drawer.js` | botões drawer | **76, 106** |
| `pages/Consignacoes/index.js` | atalho / row / detalhes | **211, 495, 825** |
| `pages/Consignacoes/CockpitDrawer.js` | ação | **275** |
| `pages/DetalhesConsignacao/index.js` | botão | **97** |
| `pages/EntregaConsignacao/index.js` | diálogo pós-entrega | **696** |
| `pages/Pendencias/PendenciasDrawer.js` | link | **159** |
| `pages/Recomendacoes/RecomendacoesDrawer.js` | link | **149** |

---

## 5. Onde “Consignados Pendentes” é criado

| Local | Função | Linha | Critério |
|-------|--------|-------|----------|
| **Fonte UX-10** `centralTrabalhoMappers.js` | `buildFilaOperacional` → lista E5 | **454+** | `estado === E5` (ENCERRADA + saldo > 0) |
| **Fonte UX-10** `centralTrabalhoMappers.js` | `buildConsignadosPendentes` | **478** | delega à fila |
| **Fonte UX-10** `CentralTrabalhoView.js` | `_renderConsignadosPendentes` | **209** | só se `itens.length` (via `_renderFilaOperacional`) |
| **Bundle UX-09** | `buildConsignadosPendentes` | ~**79577** | `saldoUtilizado > 0` **sem** exigir encerramento |
| **Bundle UX-09** | `_renderConsignadosPendentes` | ~**7838** | sempre renderiza seção (empty state se vazio) |

Não há outro módulo fora de `pages/Dashboard/` que monte o bloco “Consignados Pendentes”.

---

## 6. View — componentes legados ainda ativos?

### Fonte no disco (UX-10)

| Método | Status |
|--------|--------|
| `_renderFilaOperacional` | Ativo (novo) |
| `_renderProximosFechamentos` | Ativo (renomeado) |
| `_renderOperacionalRow` | **Removido** do fonte |
| `_renderAtalhos` | **Removido** do fonte |
| `_renderPendencias` / `_renderWorkflow` / `_renderAlertas` / `_renderCards` | **Não existem** |

### Bundle em runtime (UX-09) — o que importa

| Método | Status no bundle |
|--------|------------------|
| `_renderOperacionalRow` | **Ativo** (~L7755) |
| `_renderAcoesRapidas` com Fechar | **Ativo** |
| `_renderProximasPrestacoes` | **Ativo** (título antigo) |
| `_renderAtalhos` | **Ativo** no bundle UX-09 |
| `_renderFilaOperacional` | **Ausente** |
| `_renderProximosFechamentos` | **Ausente** |

Não há renderização duplicada de duas Centrais. Há **uma** Central — a do **bundle legado**.

---

## 7. Quem realmente decide o estado operacional

| Ambiente | Decisor | Observação |
|----------|---------|------------|
| **Jest / fontes** | `centralTrabalhoMappers.resolveEstadoOperacionalCliente` + `buildFilaOperacional` | UX-10 OK |
| **Electron / ERP** | Cópia antiga de `buildTrabalhoPrioritario` + `buildConsignadosPendentes` + (indireto) `centralOperacoesMappers.buildProximaAcao` | Sem E1–E6 |

No bundle, a “próxima ação” de consignações ainda passa por lógica pré-máquina-de-estados (pendências + `buildProximaAcao` com label **Fechar Atendimento** mesmo em fechamento em andamento).

**Resposta §7:** no disco deveria ser só `centralTrabalhoMappers`. Em runtime há **outro lugar efetivo**: o **código embutido no bundle**, mais `centralOperacoesMappers` legado dentro desse mesmo artefato.

---

## 8. Assimetria CSS × JS (agravante)

`index.html`:

- CSS: `/modules/motor-comercial/pages/Dashboard/styles.css` → **arquivo-fonte** (pode incluir `.cds-central-trabalho__fila` UX-10)
- JS: `/modules/motor-comercial/motor-comercial.bundle.js` → **artefato antigo**

Isso não faz a UX-10 “funcionar pela metade”: as classes novas só existem se o JS as criar. O JS antigo não cria `Minha Fila` / labels novos. Resultado: **comportamento 100% UX-09**.

---

## Causa raiz (síntese)

```
UX-10 implementada nos fontes
        ↓
npm run build:motor-comercial  NÃO executado
        ↓
motor-comercial.bundle.js permanece UX-09 (02:33)
        ↓
index.html injeta o bundle
        ↓
Electron mostra Central antiga
        ↓
Jest (fontes) passa → falsa sensação de “já está em produção”
```

---

## Plano mínimo de correção (NÃO executar nesta auditoria)

1. Rodar `npm run build:motor-comercial` após UX-10.  
2. Confirmar no bundle as strings: `Minha Fila de Trabalho`, `Continuar Atendimento`, `resolveEstadoOperacionalCliente` (ou ausência de `fecharAtendimento` em Ações Rápidas).  
3. Comparar `LastWriteTime` / SHA256 do bundle pós-build.  
4. Reiniciar Electron / hard-refresh (descartar cache de script se houver).  
5. Homologar na Central: E4 sem Receber; E4 com Continuar Atendimento; Ações Rápidas sem Fechar.  
6. (Opcional process) checklist: toda sprint UX do Motor Comercial termina com rebuild do bundle.

**Fora do mínimo (dívida, não bloqueia o “aparecer”):** alinhar labels “Fechar Atendimento” em `centralOperacoesMappers` / outras telas para o mesmo vocabulário E3/E4 — isso **não** explica a Central congelada.

---

## Checklist forense

| Item | Resultado |
|------|-----------|
| ViewModel montado por `Dashboard/index` → mappers → View? | Sim no fonte; no runtime via bundle |
| Bundle contém UX-10? | **Não** |
| Fonte contém UX-10? | **Sim** |
| Timestamps fonte > bundle? | **Sim (~6h)** |
| Electron injeta bundle? | **Sim** (`index.html` L371) |
| CSS fonte vs JS bundle? | **Assimetria confirmada** |
| Testes enganam? | **Sim** — testam fonte, não o artefato servido |

---

*Auditoria forense apenas. Nenhuma correção foi aplicada.*


---

<a id="auditoria-smartsearch-entitycard"></a>

## Fonte: `AUDITORIA_SMARTSEARCH_ENTITYCARD.md`

## AUDITORIA — SmartSearch & EntityCard (FOUNDATION F3)

**Data:** 2026-07-13  
**Escopo:** `frontend/shared/ui/SmartSearch/` · `frontend/shared/ui/EntityCard/`  
**Referências:** ADR-UX-001 · DS-001 §5.8–5.9 · UX-FOUNDATION-001  

---

## 1. Entrega

| Componente | Path | STATUS |
|------------|------|--------|
| SmartSearch | `frontend/shared/ui/SmartSearch/` | **ready** |
| EntityCard | `frontend/shared/ui/EntityCard/` | **ready** |
| Utils (debounce/announce) | `frontend/shared/ui/Utils/` | **ready** |

**Testes:** 26/26 Shared UI (Workspace + SmartSearch + EntityCard).  
**Migração de telas:** não realizada (conforme escopo F3).

---

## 2. Respostas obrigatórias

### A API é suficientemente genérica?

**Sim.**

- SmartSearch expõe `provider(query, { signal, filters, keys })` — contrato de dados opaco.
- Resultados usam `title` / `subtitle` / `description` / `metadata` / `data` — sem campos de domínio.
- EntityCard usa composição (`title`, `subtitle`, `metadata`, `status`, `badges`, `actions`) — serve qualquer entidade.
- `kind` em EntityCard é string livre apenas para hook CSS, **não** é enum de negócio.

### Existe qualquer acoplamento ao Motor Comercial?

**Não.**

- Nenhum `require` de `modules/motor-comercial`.
- Nenhuma menção a Cliente, Consignado, Prestação, Ledger, Crédito.
- Testes assertam ausência de termos `consignad` / `MotorComercial` / enums de fornecedor na API.

### Pode ser utilizado imediatamente por Comercial, Financeiro, Fiscal, Compras e Estoque?

**Sim.**

Cada motor implementa apenas o `provider` (e o mapeamento do resultado para `title`/`subtitle`/…).  
Exemplo documental em `SmartSearch/examples.js` (catálogo multi-domínio fictício).

### Há responsabilidades indevidas?

**Não** (após revisão).

| Responsabilidade | Dono |
|------------------|------|
| Digitar, debounced search, teclado, lista, atalhos | SmartSearch |
| Layout do cartão, CTAs, estados visuais | EntityCard |
| Fonte de dados / regras de busca / entidades | **Provider do consumidor** |

SmartSearch **não** calcula saldo, não chama API de consignação, não conhece SKU/CPF semanticamente — apenas encaminha a query e `keys` ao provider.

### Existem propriedades redundantes?

**Mínimas e intencionais (aliases):**

| Alias | Canônico | Motivo |
|-------|----------|--------|
| `primaryAction` / `secondaryAction` | `actions.primary` / `actions.secondary` | ergonomia DS |
| `label` em resultado | `title` | compatibilidade de providers |

Não há `clienteId`, `consignacaoId`, `entityType` obrigatório nem props de motor.

**Correção aplicada na auditoria:** remoção de `onSelect` no EntityCard embutido nos resultados do SmartSearch (evitava `role="button"` competindo com `role="option"`).

---

## 3. Checklist anti-fork

- [x] Implementação somente em `frontend/shared/ui/`
- [x] Barrel `shared/ui/index.js` já exportava os módulos (stubs → ready)
- [x] Documentação DS-001 / UX-FOUNDATION-001 / CHANGELOG_DESIGN_SYSTEM atualizados
- [x] Exemplos completos
- [x] Testes: debounce, seleção, atalhos, estados, a11y, eventos
- [x] Nenhuma tela do Motor Comercial alterada nesta sprint

---

## 4. Homologação

| Critério | Status |
|----------|--------|
| Componentes oficiais Shared UI | **Homologado** |
| API genérica multi-motor | **OK** |
| Sem acoplamento Comercial | **OK** |
| Sem migração de tela nesta sprint | **OK** |

**Próximo passo autorizado:** UX-12 (Prestação Locator) consumindo exclusivamente `SmartSearch` + `EntityCard` (+ `Workspace`).

> Nota: UX-11 (Conta Corrente → Workspace) já foi entregue anteriormente; não faz parte desta sprint F3.

---

## 5. Uso rápido

```js
const { SmartSearch, EntityCard } = require('../../../../shared/ui');

const search = SmartSearch.create({
  placeholder: 'Nome, documento, código…',
  debounce: 250,
  keys: ['barcode', 'codigo'],
  provider: async (query, { signal, filters, keys }) => {
    // motor implementa a busca
    return { items: [/* { id, title, subtitle, data } */] };
  },
  onSelect: (item) => { /* navegar / preencher */ }
});

const card = EntityCard.create({
  title: 'Registro',
  subtitle: 'DOC-1',
  status: 'Ativo',
  metadata: [{ label: 'Cidade', value: 'SP' }],
  actions: { primary: { label: 'Abrir' } },
  onPrimaryAction: () => {}
});
```


---

<a id="auditoria-ux-motor-comercial"></a>

## Fonte: `AUDITORIA_UX_MOTOR_COMERCIAL.md`

## AUDITORIA UX — Motor Comercial (Plataforma CDS)

**Tipo:** Auditoria de experiência do operador (não cosmética visual)  
**Data:** 2026-07-13  
**Escopo:** Telas do Motor Comercial (`frontend/modules/motor-comercial`)  
**Restrição absoluta:** NÃO alterar Ledger, Recovery, CreditoComercialService, Conta Corrente (domínio), Outbox, APIs, banco, eventos, regras de negócio, STAB-03, STAB-04 ou arquitetura oficial.

---

## 1. Veredito executivo

O Motor Comercial tem espinha operacional correta (**Central → Preparar → Entregar → Prestar → Conta Corrente**), mas várias telas ainda se comportam como **cockpit analítico**.

O operador de 8h sofre com:

1. **Prestação sem localizador** — exige `consignacaoId`; não há “achar consignado e prestar contas”.
2. **Fechar Consignação em 5 momentos** para um trabalho físico (grade + opcional pagamento).
3. **Conta Corrente sobrecarregada** — 11 cards + gráficos + indicadores; não parece extrato.
4. **Consignações como segunda Central** — 6 KPIs + 10 ações por linha.
5. **Informação duplicada** (crédito/saldo/totais) em Preparar, Entregar e Fechar.

**Pergunta-guia desta auditoria:** *“Isso realmente ajuda o operador?”*  
Onde a resposta for não, a proposta é remover, simplificar ou mover para a Central / Relatórios.

---

## 2. Inventário de telas

| Rota | Tela | Papel hoje | Papel ideal |
|------|------|------------|-------------|
| `/` | Central de Trabalho Comercial | Fila E1–E6 + CTAs + KPIs | Única casa de KPIs/gestão do dia |
| `/consignacoes/nova` | Preparar Entrega | Wizard 4 passos + assistente | Selecionar → produtos → confirmar → imprimir |
| `/consignacoes/:id/entrega` | Entrega de Consignação | Checklist técnico + cards | Confirmar saída física |
| `/consignacoes/:id/prestacao` | Fechar Consignação | 5 passos + sidebar | Localizar → grade → fechar |
| `/conta-corrente` | Conta Corrente Comercial | Extrato + analytics | Extrato bancário |
| `/consignacoes` | Consignações | Cockpit + drawer 9 abas | Arquivo avançado (não dia a dia) |
| `/clientes`, `/perfis` | Central de Clientes | Busca + cards | Identidade + próximo passo |
| `/clientes/:id` | Central de Operações do Cliente | Situação + ações | Hub por cliente |
| `/pendencias` | Central de Pendências | Inbox de alertas | Exceção (secundário) |
| `/relatorios`, `/indicadores` | Inteligência Analítica | Catálogo gerencial | Só gestão |
| `/recomendacoes`, `/playbooks`, `/workflow` | Coaching / processos | Centrais paralelas | Secundário |
| `/auditoria`, `/configuracoes`, `/design-system` | Admin / DS | Suporte | Fora do fluxo diário |

**Não existe tela dedicada de Produtos** — produtos vivem no LIP de Preparar Entrega e em Relatórios.

---

## 3. Diagnóstico por tela

### 3.1 Central de Trabalho — P1

**O que ajuda:** Minha Fila + CTAs por estado (UX-10): `Continuar Entrega`, `Fechar Atendimento`, `Receber`.

**O que atrapalha:**

| Severidade | Problema | Impacto operacional |
|------------|----------|---------------------|
| P1 | Filas duplicadas (Prioritário × Próximas Entregas × Atendimentos para Fechar) | Mesmo trabalho em layouts diferentes |
| P1 | 5 chips de resumo repetem contagens das seções | Ruído antes da ação |
| P2 | Últimas Operações passivas | Não respondem “o que faço agora?” |
| P2 | Relatórios em Ações Rápidas | Mistura operação com gestão |

### 3.2 Prestação / Fechar Consignação — P0

Momentos atuais: `Conferir Produtos` → `Registrar Retornos` → `Pagamento` → `Conferência Final` → `Encerramento`.

| Severidade | Problema | Impacto operacional |
|------------|----------|---------------------|
| **P0** | Sem busca por consignado (só `/consignacoes/:id/prestacao`) | Operador não encontra quem prestar contas |
| **P0** | 5 passos para um trabalho | 15–25+ interações por atendimento |
| P1 | Grade densa (9 colunas + legenda + status) + sidebar “Resumo do Atendimento” | Totais duplicados 3–4 vezes |
| P1 | Step 0 “O que falta…” antes da grade | Clique extra antes do trabalho real |
| P2 | Encerramento com bloco cliente + operacional + financeiro + muitas saídas | Indecisão pós-fecho |

**Foco incorreto hoje:** stepper e painéis.  
**Foco correto:** localizar consignado → digitar retornos (STAB-04) → encerrar.

### 3.3 Preparar Entrega — P1

Fluxo desejado: selecionar consignado → produtos → confirmar → imprimir → finalizar.

| Severidade | Problema | Impacto operacional |
|------------|----------|---------------------|
| P1 | Crédito triplicado (barra cliente + faixa da grade + Assistente Operacional) | Hesitação e leitura excessiva |
| P1 | Conferência repete totais já vistos | Passo “falso” |
| P2 | Simulação LIP + barra de atalhos de teclado sempre visíveis | Carga cognitiva |
| P2 | Conclusão com 4 saídas (`Imprimir Termo`, `PDF`, `Abrir Entrega`, `Voltar`) | Primário ambíguo |

### 3.4 Entrega — P1

| Severidade | Problema | Impacto operacional |
|------------|----------|---------------------|
| P1 | Checklist técnico (RASCUNHO, operador autorizado…) | Linguagem de sistema, não de operação |
| P1 | Cards de resumo duplicam cabeçalho | Scroll antes do botão Entregar |
| P2 | Painel “Impacto da Operação” didático | Ensina plataforma em vez de confirmar mercadoria |
| P2 | Empresa / Filial / Usuário no momento da confirmação | Pouco uso diário |

*(Rodapé “Processando…” longo e botão fora da tela foram tratados em hotfix separado — fora do escopo desta auditoria de IA, mas relevantes para UX operacional.)*

### 3.5 Conta Corrente — P0

| Severidade | Problema | Impacto operacional |
|------------|----------|---------------------|
| **P0** | 11 cards + Extrato + Timeline + Indicadores + ~6 gráficos + Alertas + Pendências | Não parece extrato bancário |
| P1 | Filtros + 4 exports na barra diária | Operação misturada com BI |
| P1 | Extrato com ~11 colunas (ex.: código de rastreio) | Baixa legibilidade |
| P2 | Atalhos para Fechar / Consignações no sidebar | Mistura razão financeira com operação |

### 3.6 Consignações — P0 (como caminho diário)

| Severidade | Problema | Impacto operacional |
|------------|----------|---------------------|
| **P0** | Segunda Central: KPIs + atalhos + menu com 10 ações | Escolha excessiva |
| P1 | Filtros: busca + empresa + filial + status + fechamento + favoritos | Localizar consignado fica lento |
| P1 | Drawer com 9 abas (até Auditoria) | Análise dentro da lista operacional |
| P2 | Atalho “Fechar Atendimento” sem linha clara | Ambiguidade |

### 3.7 Clientes / Operações do Cliente — P1

| Severidade | Problema | Impacto |
|------------|----------|---------|
| P1 | Situação com 8 métricas em toda visita | Gestão dentro de operação |
| P2 | Sempre mostra Preparar e Fechar (mesmo com destaque) | Duas perguntas ao mesmo tempo |

### 3.8 Centrais paralelas — P1/P2

Pendências, Workflow, Playbooks, Recomendações e Relatórios competem com a Central de Trabalho pela atenção diária. São válidos como **camada secundária**, não como default do turno.

---

## 4. Jornada do operador (fricção)

### Fluxo feliz mínimo (hoje)

| Etapa | Interações aproximadas | Dor |
|-------|------------------------|-----|
| Preparar | 6–8+ | Assistente + Conferência |
| Entregar | 3–5 + diálogos | Checklist técnico |
| Prestar | **5 passos** + grade por linha | Grade é o trabalho; o resto é chrome |
| Conta Corrente | 1 (modal Receber) ou muitos (página cheia) | Página cheia = analytics |

**Cheiro de cliques:** fechar um atendimento pode passar de **15–25 interações**.

### Regra de ouro violada

> Cada tela deve responder **uma** pergunta.  
> Nunca misturar operação com gestão.

Várias telas respondem 3–5 perguntas ao mesmo tempo.

---

## 5. Pesquisa (estado atual)

| Tela | Busca | Campos |
|------|-------|--------|
| Preparar Entrega | Sim | nome, telefone, CPF, código, documento |
| Central Clientes | Sim | Nome, CPF/CNPJ, telefone, código, documento |
| Consignações | Sim + filtros | documento, cliente, consignado, produto… |
| Conta Corrente | Sim + filtros | documento, descrição, operador… |
| **Prestação** | **Não** | — |
| **Entrega** | **Não** | ID na rota |

**Gap P0:** Prestação precisa de pesquisa inteligente (Nome, CPF, CNPJ, Telefone) com resultado mínimo e CTA **Prestar Contas**.

---

## 6. Duplicações transversais

| Informação | Onde se repete |
|------------|----------------|
| Limite / Saldo / Crédito | Central, Cliente, Preparar (×3), Entrega, Conta Corrente, Fechar |
| Vendidos / Devolvidos / Perdas / Cortesias | Sidebar Fechar, Conferência Final, Encerramento |
| Valor a pagar / Recebido / Saldo | Pagamento, sidebar, Conferência, Encerramento |
| Cliente + Documento | Quase todas as telas do fluxo |

---

## 7. O que pertence só à Central Comercial

**Manter na Central:**

- Próxima ação por estado (E2–E5)
- Pulso do dia (no máximo 1–3 números)
- Receber (E5) via modal leve
- Entrada para Nova Entrega / Clientes

**Remover das telas operacionais:**

- Muros de KPI
- Gráficos / rankings
- Timeline gerencial
- Checklists de infraestrutura
- Sidebars que só espelham o painel principal

---

## 8. Restrições técnicas a preservar (não negociáveis)

### STAB-04 — Grade

- State é SSOT; DOM não monta payload
- Persistência única: `flushPendingChanges`
- Dirty preservado em reload
- Encerrar bloqueado com alterações pendentes

### STAB-03 — Bundle

- Operador usa `motor-comercial.bundle.js`
- Toda mudança UX exige build + `verify:motor-comercial`

### UX-10 — Central

- Um cliente → um estado → um CTA
- Não reintroduzir `Fechar Atendimento` em Ações Rápidas

### Domínio

- Sem alterar crédito, ledger, recovery, outbox, APIs ou banco

---

## 9. Classificação consolidada (top 10)

| # | Item | Sev | Tela |
|---|------|-----|------|
| 1 | Sem localizador de consignado na Prestação | P0 | Prestação |
| 2 | Wizard Fechar com 5 momentos | P0 | Prestação |
| 3 | Conta Corrente como dashboard analítico | P0 | Conta Corrente |
| 4 | Consignações como hub diário | P0 | Consignações |
| 5 | Filas/KPIs duplicados na Central | P1 | Central |
| 6 | Crédito triplicado no Preparar | P1 | Preparar |
| 7 | Checklist técnico na Entrega | P1 | Entrega |
| 8 | Totais duplicados no Fechar | P1 | Prestação |
| 9 | Centrais paralelas no dia a dia | P1 | Várias |
| 10 | Léxico inconsistente (Fechar × Encerrar × Prestação) | P2 | Global |

---

## 10. Oportunidades (resumo)

1. **Prestação = localizar → grade STAB-04 → fechar**
2. **Preparar = 4 batidas limpas** (sem assistente redundante)
3. **Entrega = confirmar itens + Entregar**
4. **Conta Corrente = saldo + extrato + receber**
5. **Central = única casa de gestão do turno**
6. **Nav primária com ~5 destinos**
7. **Pesquisa inteligente padronizada** nas telas operacionais
8. **Um léxico oficial** para o operador

---

## 11. Artefatos relacionados

- **`.cds/adr/ADR-UX-001.md`** — Filosofia Oficial de UX da Plataforma CDS (constituição)
- `PLANO_REESTRUTURACAO_UX.md` — reorganização e componentes
- `MOCKUPS_UX_COMERCIAL.md` — wireframes conceituais
- `ROADMAP_UX_COMERCIAL.md` — sprints graduais

---

*Auditoria baseada no código atual do Motor Comercial (rotas, views e mappers). Sem alteração de arquitetura.*


---

<a id="auditoria-ux-operacional-central-trabalho"></a>

## Fonte: `AUDITORIA_UX_OPERACIONAL_CENTRAL_TRABALHO.md`

## AUDITORIA UX OPERACIONAL — Central de Trabalho Comercial

**Plataforma:** CDS Sistemas · Motor Comercial  
**Data:** 13/07/2026  
**Tela:** Central de Trabalho Comercial (`/`)  
**Escopo:** Experiência do operador apenas (sem arquitetura, código, banco ou performance)  
**Premissa:** Não alterar regras de negócio — validar somente a jornada operacional apresentada na Central

---

## Resumo executivo

A Central de Trabalho **mistura dois momentos operacionais distintos** na mesma tela:

1. **Atendimento em curso** (entrega / fechamento / pagamento parcial dentro do ciclo)
2. **Cobrança pós-ciclo** (saldo remanescente após encerramento oficial)

Isso gera **duplicidade de caminhos**, **nomenclatura que antecipa o fim do workflow** e **ações inválidas para a etapa** — especialmente “Fechar Atendimento” enquanto o atendimento ainda está aberto, e “Receber” enquanto a prestação ainda não foi encerrada.

| Severidade | Qtd. | Síntese |
|------------|------|---------|
| **P0** | 2 | Duplo caminho no mesmo atendimento; “Receber” competindo com fechamento aberto |
| **P1** | 3 | Nomenclatura “Fechar” em trabalho em andamento; bloco Consignados fora de hora; CTA inconsistente entre seções |
| **P2** | 2 | Três entradas para a mesma prestação; “Próximas Prestações” ainda com jargão |
| **P3** | 1 | Ações Rápidas com slots mortos (Nova Entrega / Novo Cliente desabilitados) |

---

## 1. Trabalho Prioritário — “Fechar Atendimento”

### Situação observada

No card de Trabalho Prioritário (e na Ação Rápida correspondente), o botão dominante para fechamento é:

> **Fechar Atendimento**

Isso ocorre também quando a situação descrita é de **fechamento em andamento** (atendimento já iniciado, não concluído).

Na mesma Central, a tabela **Próximas Prestações** já diferencia:

| Estado interno | Botão na tabela |
|----------------|-----------------|
| Fechamento em andamento | **Continuar** |
| Fechamento ainda não iniciado | **Fechar Atendimento** |

Ou seja: a Central **já sabe** que há diferença entre “continuar” e “iniciar/fechar”, mas o Trabalho Prioritário e as Ações Rápidas **não aplicam** essa distinção de forma consistente.

### Respostas

| Pergunta | Resposta |
|----------|----------|
| Deveria ser **Continuar Atendimento**? | **Sim**, quando o atendimento/fechamento **já está em andamento**. |
| **Fechar Atendimento** só no final do workflow? | **Parcialmente.** O rótulo “Fechar” é adequado para **convidar a iniciar o fechamento** (após entrega) ou para a **ação final dentro do wizard**. Na Central, para trabalho já aberto, o verbo correto é **Continuar**. |

### Critério operacional de nomenclatura

| Momento do operador | Verbo correto na Central |
|---------------------|--------------------------|
| Entrega incompleta | **Continuar Entrega** |
| Entrega concluída, fechamento ainda não iniciado | **Fechar Atendimento** (entrar no workflow) |
| Fechamento já aberto / em andamento | **Continuar Atendimento** (ou **Continuar**) |
| Dentro do wizard, passo de encerramento | **Encerrar Atendimento** / **Fechar Atendimento** (ação final) |
| Após encerramento com saldo | **Receber** (cobrança remanescente) |

**Veredito:** o botão “Fechar Atendimento” no Trabalho Prioritário **não representa corretamente** um atendimento ainda em andamento. Antecipa o fim e induz o operador a achar que o clique **encerra** o ciclo, quando na prática só **retoma** o wizard.

**Severidade:** **P1**

---

## 2. Consignados Pendentes — quando deve aparecer

### Situação observada

O bloco **Consignados Pendentes** aparece sempre que existe **saldo em aberto** (perfil ou consignação), **mesmo com prestação aberta / atendimento em curso**.

Na prática, o operador vê, para o mesmo cliente:

```
Trabalho Prioritário  →  Fechar Atendimento
Consignados Pendentes →  Receber
```

Dois convites concorrentes para o mesmo saldo / mesmo ciclo.

### Resposta

O bloco **Consignados Pendentes** deve aparecer:

### **B) somente depois da prestação ser oficialmente encerrada**

(com saldo remanescente a cobrar)

**Não** assim que existir saldo devedor (alternativa A).

### Justificativa operacional

| Momento | Saldo existe? | Ação correta do operador |
|---------|---------------|--------------------------|
| Durante o fechamento (prestação aberta) | Sim | Trabalhar **dentro** do atendimento: conferir itens, registrar venda/devolução, receber parcial/total, **encerrar** |
| Após encerramento oficial com saldo | Sim | Cobrança **fora** do ciclo de fechamento: **Receber** (dias depois, parcial, etc.) |
| Após quitação total | Não | Nenhum dos dois blocos |

Enquanto o atendimento está aberto, “Receber” na Central:

- **compete** com o fluxo oficial de fechamento;
- sugere um atalho de cobrança **sem** comunicar que o ciclo ainda não fechou;
- pode levar o operador a “pagar e sair” sem completar o ritual operacional (conferência → encerramento).

Saldo durante o fechamento **não é “pendência de cobrança pós-ciclo”** — é **parte do atendimento em curso**. Por isso o bloco certo nessa etapa é Trabalho Prioritário / Continuar, não Consignados Pendentes.

**Severidade:** **P0** (quebra o fluxo operacional por concorrência de caminhos)

---

## 3. Duplicidade de ações

### Caminhos atuais para o mesmo atendimento

```
Trabalho Prioritário  →  Fechar Atendimento / Continuar
         ↓
Ações Rápidas         →  Fechar Atendimento
         ↓
Próximas Prestações   →  Continuar / Fechar Atendimento
         ↓
Consignados Pendentes →  Receber   ← caminho paralelo indevido se prestação aberta
```

### Avaliação

| Tipo de duplicidade | Existe? | Avaliação |
|---------------------|---------|-----------|
| Várias entradas para **o mesmo fechamento** | Sim | Aceitável se forem **o mesmo verbo e o mesmo destino** (atalho + lista). Hoje os rótulos divergem. |
| Dois caminhos para **o mesmo saldo** (Fechar vs Receber) | Sim | **Indevido** enquanto o atendimento não foi encerrado. |
| Trabalho Prioritário + Ações Rápidas | Sim | Redundante, mas de baixa gravidade se o rótulo for o mesmo. |

**Veredito:** há **duplicidade prejudicial** entre “Fechar Atendimento” e “Receber” no mesmo ciclo aberto. A redundância entre Trabalho Prioritário / Ações Rápidas / Próximas Prestações é secundária (P2), desde que unificada.

**Severidade:** **P0** (Fechar × Receber) · **P2** (múltiplas entradas para prestação)

---

## 4. Jornada do operador — simulação etapa a etapa

Simulação pedida:

```
Entrega → Prestação → Pagamento parcial → Encerramento → Saldo devedor → Novo recebimento dias depois
```

### Fluxo ideal (o que a Central deveria mostrar)

| Etapa | Estado operacional | Cards / blocos visíveis | Botões válidos | Botões que devem sumir |
|-------|--------------------|-------------------------|----------------|------------------------|
| 1. Entrega em andamento | Entrega aberta | Trabalho Prioritário; Próximas Entregas | **Continuar Entrega** | Fechar Atendimento; Receber |
| 2. Entrega concluída → iniciar fechamento | Pronto para fechar | Trabalho Prioritário; (opcional) lista de fechamentos | **Fechar Atendimento** | Continuar Entrega; Receber |
| 3. Prestação / fechamento em andamento | Atendimento aberto | Trabalho Prioritário; lista de fechamentos | **Continuar Atendimento** | Receber; Fechar (como se encerrasse) |
| 4. Pagamento parcial (dentro do ciclo) | Atendimento ainda aberto | Mesmo da etapa 3 | **Continuar Atendimento** | Receber (ainda não) |
| 5. Encerramento oficial | Ciclo fechado | — (sai do Trabalho Prioritário de fechamento) | — | Fechar / Continuar deste ciclo |
| 6. Saldo remanescente | Cobrança pós-ciclo | **Consignados Pendentes** | **Receber** | Fechar Atendimento deste ciclo (salvo reabertura gerencial, fora da Central do dia a dia) |
| 7. Novo recebimento dias depois | Idem etapa 6 | Consignados Pendentes | **Receber** | Continuar Atendimento (não há atendimento aberto) |

### Fluxo atual (o que a Central apresenta)

| Etapa | O que o operador vê hoje | Problema |
|-------|--------------------------|----------|
| 1. Entrega | Trabalho Prioritário + Continuar Entrega (ok em geral) | Baixo risco |
| 2–4. Prestação aberta + pagamento parcial | **Fechar Atendimento** no prioritário/rápido **e** **Receber** em Consignados Pendentes | Duplo caminho; verbo “Fechar” engana |
| 5. Encerramento | Item pode sair do prioritário | Ok se saldo zerar |
| 6–7. Saldo após encerramento | Consignados Pendentes + Receber | **Correto** — mas o mesmo bloco já aparecia antes, então o operador não distingue “durante” de “depois” |

**Veredito:** a Central **não** apresenta somente as ações válidas por etapa. Na fase crítica (prestação aberta + pagamento parcial), oferece ações de **dois mundos** ao mesmo tempo.

---

## 5. Critérios — estados, cards, botões e nomenclatura

### Estados operacionais que devem existir na Central

| Código | Nome operacional | Significado para o operador |
|--------|------------------|-----------------------------|
| `E1` | Sem pendência | Nada urgente |
| `E2` | Entrega em andamento | Consignação preparada / aguardando conclusão da entrega |
| `E3` | Pronto para fechar | Entregue; fechamento ainda não iniciado |
| `E4` | Atendimento em andamento | Fechamento aberto (inclui pagamento parcial dentro do ciclo) |
| `E5` | Saldo pós-encerramento | Atendimento encerrado com valor ainda a receber |
| `E6` | Bloqueio / limite | Exige Conta Corrente / regularização (prioridade de risco) |

### Matriz de estados × cards × botões

| Estado | Trabalho Prioritário | Consignados Pendentes | Próximas Entregas | Lista de fechamentos | Ação rápida principal |
|--------|----------------------|-----------------------|-------------------|----------------------|------------------------|
| `E1` | Empty / “em dia” | Oculto ou vazio | — | — | Preparar Entrega (atalho) |
| `E2` | Visível | **Oculto** | Visível | Oculto | Continuar Entrega |
| `E3` | Visível | **Oculto** | — | Visível | **Fechar Atendimento** |
| `E4` | Visível | **Oculto** | — | Visível | **Continuar Atendimento** |
| `E5` | Opcional (só se cobrança for prioridade do dia) | **Visível** | — | Oculto p/ este ciclo | **Receber** |
| `E6` | Visível (risco) | Conforme regra de saldo pós-ciclo | — | — | Consultar Conta Corrente |

### Botões que devem existir (por contexto)

- Continuar Entrega  
- Fechar Atendimento *(só para iniciar o fechamento ou como ação final no wizard)*  
- Continuar Atendimento *(fechamento já aberto)*  
- Receber *(somente pós-encerramento com saldo)*  
- Consultar Conta Corrente *(bloqueio/limite)*  
- Preparar Entrega / Novo Cliente *(atalhos de criação, não concorrentes ao ciclo aberto)*

### Botões / blocos que devem desaparecer

| Em | Remover / ocultar |
|----|-------------------|
| `E2`, `E3`, `E4` | Bloco **Consignados Pendentes** (ou o botão **Receber** para aquele cliente) |
| `E4` | Rótulo **Fechar Atendimento** no prioritário/rápido (substituir por Continuar) |
| `E5` | **Fechar Atendimento** / **Continuar** do ciclo já encerrado (salvo fluxo gerencial explícito) |
| `E1` | Qualquer CTA de fechamento/recebimento sem alvo |

### Nomenclaturas a alterar

| Atual | Recomendado | Onde |
|-------|-------------|------|
| Fechar Atendimento *(em andamento)* | **Continuar Atendimento** | Trabalho Prioritário, Ações Rápidas |
| Continuar *(tabela, ok)* | Manter ou alinhar para **Continuar Atendimento** | Próximas Prestações |
| Próximas Prestações | **Próximos Fechamentos** ou **Atendimentos a fechar** | Título de seção |
| Consignados Pendentes *(durante ciclo)* | Reservar o bloco ao pós-ciclo; opcional: **A receber** / **Saldo a receber** | Bloco UX-09 |
| Fechamentos pendentes *(resumo)* | Manter | Resumo do dia |

---

## Fluxo ideal (visão sintética)

```
Preparar Entrega
      ↓
Continuar Entrega          ← só entrega
      ↓
Fechar Atendimento         ← entra no fechamento
      ↓
Continuar Atendimento      ← pagamento parcial / conferência (Central NÃO oferece Receber)
      ↓
Encerrar Atendimento       ← fim oficial do ciclo (dentro do wizard)
      ↓
[se houver saldo]
Receber                    ← Consignados Pendentes (dias depois inclusive)
```

**Regra de ouro:** um cliente, um momento, **uma ação primária** na Central.

---

## Fluxo atual (visão sintética)

```
Trabalho Prioritário ──► Fechar Atendimento ──┐
                                              ├──► mesmo fechamento / mesmo saldo
Ações Rápidas ─────────► Fechar Atendimento ──┤
                                              │
Próximas Prestações ───► Continuar / Fechar ──┘
                                              ✕ conflito
Consignados Pendentes ─► Receber ─────────────┘  (aparece com prestação ainda aberta)
```

---

## Inconsistências encontradas

| ID | Inconsistência | Impacto no operador | Sev. |
|----|----------------|---------------------|------|
| **UX-OP-01** | “Fechar Atendimento” no prioritário/rápido para atendimento **já em andamento** | Sugere encerramento; o clique só retoma o fluxo | **P1** |
| **UX-OP-02** | Consignados Pendentes + Receber **durante** prestação aberta | Dois caminhos para o mesmo ciclo; risco de “pular” o ritual de fechamento | **P0** |
| **UX-OP-03** | Mesmo cliente em Trabalho Prioritário e Consignados Pendentes | Duplicidade cognitiva; dúvida “qual botão é o certo?” | **P0** |
| **UX-OP-04** | Tabela de prestações diz “Continuar”; prioritário diz “Fechar” | Linguagem inconsistente na mesma tela | **P1** |
| **UX-OP-05** | Três seções levam ao mesmo fechamento com rótulos diferentes | Ruído; aprendizado lento | **P2** |
| **UX-OP-06** | Título “Próximas Prestações” vs vocabulário “Fechamento / Atendimento” | Jargão interno na home operacional | **P2** |
| **UX-OP-07** | Ações Rápidas com Nova Entrega / Novo Cliente sempre inativos | Parece produto quebrado ou “em construção” | **P3** |
| **UX-OP-08** | Pós-encerramento com saldo: “Receber” é o certo, mas o bloco não muda de significado visual | Operador não distingue “ciclo aberto” de “cobrança depois” | **P1** |

---

## Recomendações (somente UX operacional — sem mudar regra de negócio)

### R1 — Um verbo por estado do atendimento (P1)

- Em andamento → **Continuar Atendimento**
- Ainda não iniciado (pós-entrega) → **Fechar Atendimento**
- Alinhar Trabalho Prioritário, Ações Rápidas e lista de fechamentos

### R2 — Separar “ciclo aberto” de “cobrança pós-ciclo” (P0)

- **Ocultar** Consignados Pendentes / Receber para clientes com atendimento/fechamento **aberto**
- **Exibir** Consignados Pendentes apenas quando o atendimento estiver **oficialmente encerrado** e ainda houver saldo (resposta **B** da seção 2)

### R3 — Uma ação primária por cliente na Central (P0)

- Se o cliente está em `E2`–`E4`, a única CTA primária é Continuar/Fechar
- Se está em `E5`, a única CTA primária é Receber
- Evitar os dois cards lado a lado para o mesmo cliente

### R4 — Renomear seção de prestações (P2)

- “Próximas Prestações” → linguagem de **Fechamento / Atendimento**, alinhada ao restante do módulo

### R5 — Ações Rápidas honestas (P3)

- Ou ativar Nova Entrega / Novo Cliente como atalhos reais
- Ou removê-los / substituí-los por atalhos que existam (ex.: Central de Clientes), para não exibir botões mortos

### R6 — Matriz de estados como contrato de UI (P1)

- Tratar a matriz da seção 5 como checklist de homologação operacional da Central (sem alterar APIs nem regras de pagamento/encerramento)

---

## Severidade consolidada

| ID | Tema | Severidade |
|----|------|------------|
| UX-OP-02 / UX-OP-03 / R2 / R3 | Receber vs Fechar no mesmo ciclo; duplicidade | **P0** |
| UX-OP-01 / UX-OP-04 / UX-OP-08 / R1 / R6 | Nomenclatura e estados | **P1** |
| UX-OP-05 / UX-OP-06 / R4 | Redundância e jargão | **P2** |
| UX-OP-07 / R5 | Slots inativos | **P3** |

---

## Conclusão

A Central de Trabalho **funciona como painel**, mas **falha como roteiro operacional**: antecipa o fim (“Fechar”), oferece cobrança (“Receber”) cedo demais e multiplica entradas para o mesmo atendimento.

Para o operador, o fluxo saudável é linear:

**Continuar Entrega → Fechar Atendimento → Continuar Atendimento → Encerrar → (depois) Receber.**

Hoje, na fase intermediária, a tela sugere **Fechar** e **Receber** ao mesmo tempo. Isso **quebra a jornada**, não a regra de negócio — e deve ser corrigido **só na experiência** (visibilidade e nomenclatura por estado), preservando os mesmos destinos e endpoints já existentes.

---

*Documento de auditoria UX operacional. Não implica alteração de regras de negócio, APIs ou persistência.*


---

<a id="auditoria-ux-visual-motor-comercial"></a>

## Fonte: `AUDITORIA_UX_VISUAL_MOTOR_COMERCIAL.md`

## AUDITORIA UX-07 — Legibilidade e Operação do Motor Comercial

**Plataforma:** CDS Sistemas · Motor Comercial  
**Data:** 12/07/2026  
**Escopo:** Frontend exclusivamente (visual, hierarquia, operação, consistência DS)  
**Método:** Revisão estática de rotas, componentes, CSS por página, tokens do Design System, ordem de carregamento no ERP e auditorias anteriores (DS-01.1, UX-05.5)

---

## Resumo executivo

A homologação confirmou um problema crítico em **Relatórios**: cards do catálogo e indicadores praticamente invisíveis. A auditoria identificou que esse sintoma **não é isolado** — existem **3 causas sistêmicas** que afetam várias telas:

| # | Causa sistêmica | Impacto |
|---|-----------------|---------|
| 1 | Token CSS **`--color-neutral-0` inexistente** no Design System, usado em Relatórios | Fundo dos cards = transparente; cards se confundem com o fundo |
| 2 | **`styles/ux-enterprise.css` carregado por último** e com seletores `.cds-ux-page-header h1` / `.cds-analytics-header__title` | Títulos principais viram texto minúsculo (12px), cinza e maiúsculo — hierarquia invertida |
| 3 | **Componentes DS com cores fixas** (`StatCard`, `Drawer`, inputs) usando `white` / `#fff` e **sem adaptação a temas** | Quebra em Dark/Alto Contraste; contraste inconsistente |

**Contagem de problemas por prioridade:**

| Prioridade | Qtd. | Descrição |
|------------|------|-----------|
| **P0** | 8 | Comprometem operação (ilegibilidade, ação principal oculta, cards invisíveis) |
| **P1** | 14 | Dificultam operação (excesso de informação, CSS ausente, fluxo confuso) |
| **P2** | 12 | Melhoria visual (espaço vazio, tipografia pequena, inconsistência) |
| **P3** | 6 | Refatoração futura (legado wizard, placeholders, consolidar CSS) |

**Recomendação imediata (Sprint UX-07.1):** corrigir P0 em Relatórios + tokens + `ux-enterprise.css` + `StatCard`/`Drawer`. Estimativa: 1 sprint focada, sem alteração de backend.

---

## Telas auditadas

### Rotas principais (`frontend/modules/motor-comercial/routes/index.js`)

| # | Tela | Rota | CSS dedicado | Classe layout |
|---|------|------|--------------|---------------|
| 1 | Central de Trabalho | `/` | `Dashboard/styles.css` ✅ | `DashboardLayout` |
| 2 | Consignações | `/consignacoes` | `Consignacoes/styles.css` ✅ | `DashboardLayout` |
| 3 | Preparar Entrega | `/consignacoes/nova` | `NovaConsignacao/styles.css` ✅ | `CDSPage` |
| 4 | Detalhes da Consignação | `/consignacoes/:id` | ❌ (reusa Consignações) | `DashboardLayout` |
| 5 | Entrega de Consignação | `/consignacoes/:id/entrega` | `EntregaConsignacao/styles.css` ✅ | `WizardLayout` ⚠️ |
| 6 | Fechar Consignação | `/consignacoes/:id/prestacao` | `PrestacaoContas/styles.css` ✅ | `WizardLayout` ⚠️ |
| 7 | Conta Corrente (fluxo) | `/consignacoes/:id/prestacao/conta-corrente` | `ContaCorrente/styles.css` ✅ | `DashboardLayout` |
| 8 | Histórico do Atendimento | `/consignacoes/:id/prestacao/historico` | ❌ | `DashboardLayout` |
| 9 | Central de Clientes | `/clientes` | `PerfilComercial/styles.css` ✅ | `ConsultaLayout` |
| 10 | Novo Cliente | `/clientes/novo` | `PerfilComercial/styles.css` ✅ | `CadastroLayout` |
| 11 | Editar Cliente | `/clientes/:id/editar` | `PerfilComercial/styles.css` ✅ | `CadastroLayout` |
| 12 | Central de Operações do Cliente | `/clientes/:id` | `PerfilComercial/styles.css` ✅ | Ficha operacional |
| 13 | Conta Corrente Comercial | `/conta-corrente` | `ContaCorrente/styles.css` ✅ | `DashboardLayout` |
| 14 | Relatórios | `/relatorios` | `Relatorios/styles.css` ✅ | `DashboardLayout` |
| 15 | Indicadores | `/indicadores` | Alias → Relatórios | `DashboardLayout` |
| 16 | Central de Pendências | `/pendencias` | `Pendencias/styles.css` ✅ | `DashboardLayout` |
| 17 | Recomendações Comerciais | `/recomendacoes` | `Recomendacoes/styles.css` ✅ | `DashboardLayout` |
| 18 | Guias Operacionais | `/playbooks` | `Playbooks/styles.css` ⚠️ **não linkado no ERP** | `DashboardLayout` |
| 19 | Central de Processos | `/workflow` | `WorkflowCenter/styles.css` ⚠️ **não linkado no ERP** | `DashboardLayout` |
| 20 | Perdas | ERP placeholder | ❌ | Empty state |
| 21 | Cortesias | ERP placeholder | ❌ | Empty state |
| 22 | Configurações | `/configuracoes` | ❌ | `CadastroLayout` |
| 23 | Auditoria | `/auditoria` | ❌ | `DashboardLayout` |
| 24 | CDS Design System (showcase) | `/design-system` | `DesignSystem/styles.css` ✅ | — |

### Drawers auditados

| Drawer | Página origem | Problemas |
|--------|---------------|-----------|
| `CockpitDrawer` | Consignações, Detalhes | Herda estilos cockpit; footer denso |
| `PendenciasDrawer` | Pendências | KPIs em grid 2 col estreito |
| `RecomendacoesDrawer` | Recomendações | Badges ok; links secundários discretos |
| `PlaybooksDrawer` | Playbooks | CSS inline mínimo; sem tokens DS |
| `WorkflowDrawer` | Workflow | CSS da página pode não carregar |
| `IndicadorDrawer` | Relatórios | Labels 12px cinza; grid 2 col |
| `MovimentoDrawer` | Conta Corrente | Ok estruturalmente |
| `ExecutiveDrawer` | Dashboard (legado) | Possível duplicidade com Central Trabalho |

### Modais e wizards

| Componente | Onde | Status visual |
|------------|------|---------------|
| `Modal` | Confirmações globais | DS oficial ✅ |
| `WizardLayout` | Entrega, Fechar Consignação | Aparência wizard legado ⚠️ |
| `Stepper` | Fechar Consignação | Etapas pequenas em 1366px |

### Carregamento CSS no ERP (`frontend/erp/index.html`)

```
comercial.css
→ Dashboard, Consignacoes, NovaConsignacao, Entrega, PrestacaoContas,
  PerfilComercial, ContaCorrente, Relatorios, Pendencias, Recomendacoes
→ ux-enterprise.css  ← sobrescreve títulos (carregado DEPOIS das páginas)
→ DesignSystem/styles.css
→ shared/design-system/index.css
→ charts/charts.css

AUSENTES: Playbooks/styles.css, WorkflowCenter/styles.css
```

---

## Problemas encontrados

### P0 — Compromete operação

#### P0-01 · Relatórios — cards transparentes (causa raiz da homologação)

| Item | Detalhe |
|------|---------|
| **Tela** | Relatórios / Indicadores |
| **Sintoma** | Cards do catálogo, indicadores e heatmap sem fundo visível; ícones emoji “somem”; bordas quase imperceptíveis |
| **Causa provável** | `Relatorios/styles.css` usa `background: var(--color-neutral-0)` em `.cds-analytics-catalog__card`, `.cds-analytics-indicator`, `.cds-analytics-heatmap__cell` — token **não definido** em `shared/design-system/tokens/colors.css` |
| **Efeito** | Background computado = transparente; cards se confundem com `--color-neutral-50` da área de filtros e fundo da página |
| **Correção sugerida** | Substituir `--color-neutral-0` por `--color-surface` ou `#ffffff` + garantir `color: var(--color-text)` nos labels; adicionar `--color-neutral-0: #ffffff` ao DS se for token oficial |
| **Arquivos** | `pages/Relatorios/styles.css` (L128, L215, L294) |

**Referência visual (sem print):**
```
Antes: [░░░░] Catálogo   ← card sem preenchimento, só borda 1px #e2e8f0
Depois: [████] Catálogo   ← fundo --color-surface, texto --color-neutral-900
```

---

#### P0-02 · Conflito global de hierarquia — `ux-enterprise.css` vs títulos de página

| Item | Detalhe |
|------|---------|
| **Telas** | Relatórios, Consignações, Conta Corrente, Preparar Entrega, Fechar Consignação, Histórico |
| **Sintoma** | Título principal (`h1`) aparece em **12px**, **maiúsculo**, **cinza 500** — parece rótulo secundário, não título |
| **Causa provável** | `styles/ux-enterprise.css` define `.cds-ux-page-header h1` e `.cds-analytics-header__title` com `font-size: var(--font-size-xs)` e `color: var(--color-neutral-500)`. Carregado **depois** dos CSS de página no `index.html` → vence em especificidade igual ou superior |
| **Impacto operacional** | Operador não responde rapidamente “Onde estou?” — hierarquia invertida (meta-info compete com título) |
| **Correção sugerida** | Inverter hierarquia: título = `--font-size-2xl`, `--color-neutral-900`; meta/eyebrow = xs uppercase cinza. Remover `h1` genérico de `ux-enterprise.css` e usar classe `.cds-ux-page-eyebrow` apenas onde desejado |
| **Arquivos** | `styles/ux-enterprise.css` (L8–21), `erp/index.html` (ordem dos links) |

**Telas com classe `cds-ux-page-header` confirmada:**
- `Consignacoes/index.js` L146
- `Relatorios/index.js` L133
- `ContaCorrente/index.js` L104
- `NovaConsignacao/index.js` L146
- `HistoricoPrestacao/index.js` L54

---

#### P0-03 · StatCard — fundo branco fixo e ícones esmaecidos

| Item | Detalhe |
|------|---------|
| **Telas** | Relatórios, Consignações, Dashboard (KPIs), Pendências, Recomendações, Workflow |
| **Sintoma** | Cards KPI ok no tema claro; ícones com aparência “lavada”; em tema escuro fundo branco destoa |
| **Causa provável** | `StatCard.getStyles()` usa `background-color: white` hardcoded e `.cds-stat-card__icon { opacity: 0.7 }` |
| **Correção sugerida** | `background: var(--color-surface)`; ícone `opacity: 1` ou `color: var(--color-text-secondary)`; borda `var(--color-border)` |
| **Arquivos** | `shared/design-system/primitives/data/StatCard.js` (L78–112) |

---

#### P0-04 · Drawer — painel branco fixo

| Item | Detalhe |
|------|---------|
| **Telas** | Todos os drawers (Consignação, Pendência, Relatório, etc.) |
| **Sintoma** | Drawer sempre branco; texto escuro; quebra total no tema Dark |
| **Causa provável** | `Drawer.getStyles()` → `background-color: white` |
| **Correção sugerida** | Usar `--color-surface`, `--color-text`, `--color-border` |
| **Arquivos** | `shared/design-system/primitives/special/Drawer.js` (L136) |

---

#### P0-05 · Cadastro de Cliente — contraste forçado com `!important` (sintoma de regressão)

| Item | Detalhe |
|------|---------|
| **Tela** | Editar/Novo Cliente |
| **Sintoma** | Texto ilegível reportado anteriormente; corrigido parcialmente com overrides agressivos |
| **Causa provável** | Conflito entre tokens de tema, autofill WebKit e `Input.js` com cores fixas `#ffffff` / `#0f172a` |
| **Correção sugerida** | Padronizar inputs no DS com `--color-surface` + `--color-text`; remover `!important` do escopo cadastro após correção na raiz |
| **Arquivos** | `PerfilComercial/styles.css` (L564–586), `shared/design-system/components/inputs.css`, `primitives/form/Input.js` |

---

#### P0-06 · Guias Operacionais e Central de Processos — CSS não carregado

| Item | Detalhe |
|------|---------|
| **Telas** | `/playbooks`, `/workflow` |
| **Sintoma** | Layout quebrado, cards sem estilo, sidebar sem hover, kanban sem formatação |
| **Causa provável** | `Playbooks/styles.css` e `WorkflowCenter/styles.css` existem mas **não estão linkados** em `frontend/erp/index.html` |
| **Correção sugerida** | Adicionar os dois `<link>` no index.html na ordem correta (antes de `ux-enterprise.css`) |
| **Arquivos** | `frontend/erp/index.html` |

---

#### P0-07 · Relatórios — sobrecarga cognitiva na mesma viewport

| Item | Detalhe |
|------|---------|
| **Tela** | Relatórios |
| **Sintoma** | Catálogo + 12 filtros + busca + 7 seções simultâneas (viz, indicadores, análises, rankings, comparativos, favoritos, histórico) |
| **Causa provável** | `_createContent()` monta todas as seções de uma vez (`Relatorios/index.js` L196–204) |
| **Impacto operacional** | Operador não sabe o que olhar primeiro; scroll excessivo; sensação “dashboard antigo” |
| **Correção sugerida** | Modo foco: exibir só catálogo + relatório ativo; demais seções em abas ou accordion; filtros colapsáveis |
| **Arquivos** | `pages/Relatorios/index.js` |

---

#### P0-08 · Filtros técnicos expostos ao operador (Relatórios)

| Item | Detalhe |
|------|---------|
| **Tela** | Relatórios |
| **Sintoma** | Campos “Cliente ID”, “Produto ID”, “Consignação ID” visíveis no filtro principal |
| **Causa provável** | `_createFilters()` expõe IDs crus (L282–284) |
| **Impacto operacional** | Linguagem de desenvolvedor; operador de loja não sabe preencher |
| **Correção sugerida** | Ocultar filtros avançados atrás de “Mais filtros”; substituir por busca de cliente/produto com autocomplete |
| **Arquivos** | `pages/Relatorios/index.js` |

---

### P1 — Dificulta operação

#### P1-01 · Pendências — tokens legados `--cds-color-*`

| Tela | Pendências |
|------|------------|
| **Sintoma** | Estilos inconsistentes com demais telas; fallbacks hardcoded |
| **Causa** | `Pendencias/styles.css` usa `--cds-color-text-muted`, `--cds-color-border` (não existem no DS 2.0.1) |
| **Correção** | Migrar para `--color-text-muted`, `--color-border`, `--color-surface` |
| **Arquivo** | `pages/Pendencias/styles.css` |

---

#### P1-02 · Recomendações e Playbooks — CSS minimalista fora do DS

| Tela | Recomendações, Playbooks |
|------|--------------------------|
| **Sintoma** | Cards categoria sem fundo definido (Recomendações); valores fixos `#64748b`, `#e2e8f0`, `#fff` |
| **Causa** | CSS escrito em sprint O-8/O-9 sem tokens |
| **Correção** | Reescrever com tokens; usar `StatCard`/`Card` oficiais |
| **Arquivos** | `Recomendacoes/styles.css`, `Playbooks/styles.css` |

---

#### P1-03 · Fechar Consignação e Entrega — wizard legado

| Tela | Fechar Consignação, Entrega |
|------|----------------------------|
| **Sintoma** | Aparência de wizard antigo; stepper lateral; classes `cds-wizard-*` extensas |
| **Causa** | Ainda usam `WizardLayout` (Preparar Entrega já migrou para `CDSPage`) |
| **Correção** | Migrar Fechar Consignação para `CDSPage` como Preparar Entrega (já previsto em DS-01.1) |
| **Arquivos** | `PrestacaoContas/index.js`, `EntregaConsignacao/index.js`, `NovaConsignacao/styles.css` (legado wizard) |

---

#### P1-04 · Sidebar oculta em mobile/tablet (Dashboard executivo legado)

| Tela | Dashboard (estilos `.cds-executive-*` ainda presentes) |
|------|----------------------------------------------------------|
| **Sintoma** | `@media (max-width: 768px) { .cds-executive-sidebar { display: none } }` |
| **Impacto** | Navegação lateral some em tablet 768px |
| **Correção** | Drawer de navegação ou tabs horizontais |
| **Arquivo** | `Dashboard/styles.css` (L419–421) |

---

#### P1-05 · Central de Trabalho — largura máxima restritiva

| Tela | Central de Trabalho |
|------|---------------------|
| **Sintoma** | `max-width: 1100px` centra conteúdo; muito espaço vazio em 1920px |
| **Causa** | `.cds-central-trabalho-host` |
| **Correção** | `max-width: 1400px` ou layout 2 colunas (trabalho + timeline) |
| **Arquivo** | `Dashboard/styles.css` (L425–428) |

---

#### P1-06 · Consignações — botões de ação competindo com primário

| Tela | Consignações |
|------|--------------|
| **Sintoma** | Header com Atualizar (secondary) + Preparar Entrega (primary) + outros; tabela com muitas ações por linha |
| **Correção** | Uma ação primária por contexto; demais em menu “⋯” |
| **Arquivo** | `Consignacoes/index.js` |

---

#### P1-07 · Auditoria — linguagem técnica visível

| Tela | Auditoria |
|------|-----------|
| **Sintoma** | Subtítulo “Movimentações derivadas do ledger”; coluna “Correlation ID” |
| **Correção** | “Histórico de movimentações”; coluna “Referência” ou ocultar em modo operador |
| **Arquivo** | `Auditoria/index.js` (L44, L79) |

---

#### P1-08 · Detalhes Consignação / Histórico — sem CSS dedicado

| Tela | Detalhes, Histórico |
|------|---------------------|
| **Sintoma** | Toolbar e header genéricos; botão voltar sem destaque |
| **Correção** | Criar `DetalhesConsignacao/styles.css`; aplicar `cds-ux-page-header` corrigido |
| **Arquivos** | `DetalhesConsignacao/index.js`, `HistoricoPrestacao/index.js` |

---

#### P1-09 · Conta Corrente — filtros com fundo branco fixo

| Tela | Conta Corrente |
|------|----------------|
| **Sintoma** | `.cds-extrato-filters { background: white }` |
| **Correção** | `var(--color-surface)` |
| **Arquivo** | `ContaCorrente/styles.css` (L76) |

---

#### P1-10 · Fechar Consignação — tipografia 10–11px em status de linha

| Tela | Fechar Consignação |
|------|-------------------|
| **Sintoma** | Labels de edição/status ilegíveis em monitor 1366×768 |
| **Correção** | Mínimo `--font-size-xs` (12px) em todo texto operacional |
| **Arquivo** | `PrestacaoContas/styles.css` (L451, L459, L520) |

---

#### P1-11 · Ficha Cliente — timeline com texto 10px

| Tela | Central de Operações do Cliente |
|------|--------------------------------|
| **Sintoma** | `.cds-ficha-cliente__timeline-*` usa `font-size: 10px` |
| **Correção** | 12px mínimo; `--color-text-secondary` |
| **Arquivo** | `PerfilComercial/styles.css` (L840) |

---

#### P1-12 · Inputs nativos nos filtros (Relatórios, Workflow)

| Telas | Relatórios, Workflow |
|-------|---------------------|
| **Sintoma** | `<select>` e `<input>` HTML nativos em vez de `cds-input` / `cds-select` |
| **Correção** | Usar componentes DS ou classe `.cds-analytics-filters__input` com tokens semânticos + tema escuro |
| **Arquivos** | `Relatorios/index.js`, `WorkflowCenter/index.js` |

---

#### P1-13 · Perdas e Cortesias — placeholder sem identidade

| Tela | ERP empty state |
|------|-----------------|
| **Sintoma** | Mensagem genérica “será disponibilizado em breve” |
| **Correção** | Empty state DS com ícone, CTA de volta e mesma identidade visual |
| **Arquivo** | `bootstrap/index.js` ERP_ROUTE_MAP |

---

#### P1-14 · Global loading overlay branco fixo

| Tela | Todas |
|------|-------|
| **Sintoma** | `#motor-comercial-loading` com `background: rgba(255,255,255,0.85)` |
| **Correção** | `var(--color-overlay)` |
| **Arquivo** | `styles/inject.js` (L20) |

---

### P2 — Melhoria visual

| ID | Tela | Problema | Correção |
|----|------|----------|----------|
| P2-01 | Central Trabalho | Cards trabalho `#fff` fixo | `--color-surface` |
| P2-02 | Dashboard executivo | Seções `.cds-executive-section { background: white }` duplicam estilo | Unificar com `.cds-card` |
| P2-03 | Consignações | Cockpit cards grid 4 col estreito em 1366px | `auto-fill, minmax(160px, 1fr)` |
| P2-04 | Preparar Entrega | Arquivo CSS 980+ linhas com classes wizard legadas | Limpar classes não usadas pós-migração CDSPage |
| P2-05 | Ficha Cliente | Separadores meta `color: neutral-300` — baixo contraste | `neutral-400` mínimo |
| P2-06 | Relatórios | Ícones emoji no catálogo — renderização inconsistente | Migrar para ícones DS / FontAwesome |
| P2-07 | Todas sidebars | Itens `background: transparent` — área clicável pequena | `min-height: 40px` |
| P2-08 | Recomendações | Grid 3 col panel quebra mal entre 768–1024px | Breakpoint intermediário |
| P2-09 | Configurações | Sem estilo; cards DS puros | Adicionar `Configuracoes/styles.css` mínimo |
| P2-10 | Gráficos MC | Barras CSS 4px — corretas pós UX 2.1, mas labels 12px cinza | `--color-text` nos labels |
| P2-11 | Tema Dark | ~40 regras `white`/`#fff` no módulo | Passar para tokens semânticos |
| P2-12 | Tipografia | Mistura `rem`, `px` e `var(--font-size-*)` | Normalizar em tokens |

---

### P3 — Refatoração futura

| ID | Item | Descrição |
|----|------|-----------|
| P3-01 | Consolidar CSS | 16 arquivos `styles.css` → import único `motor-comercial.css` buildado |
| P3-02 | Remover `.cds-executive-*` | Estilos do dashboard antigo coexistem com `.cds-central-trabalho-*` |
| P3-03 | `Cliente360View` legado | Verificar se ainda renderizado ou só `CentralOperacoesView` |
| P3-04 | Bootstrap no shell ERP | `bootstrap.min.css` + `style.css` podem vazar estilos em `#page-content` |
| P3-05 | Storybook | `.storybook` desatualizado vs DS 2.0.1 |
| P3-06 | Bundle CSS | `motor-comercial.bundle.css` contém só buttons+cards — páginas não incluídas |

---

## Matriz por tela — respostas operacionais

Legenda: ✅ OK · ⚠️ Parcial · ❌ Problemático

| Tela | Quem é? | Onde está? | O que fazer? | Contraste | DS |
|------|---------|------------|--------------|-----------|-----|
| Central Trabalho | ✅ | ⚠️ título pequeno | ✅ ação principal | ⚠️ | ⚠️ |
| Consignações | ✅ | ❌ título ux-enterprise | ⚠️ muitas ações | ⚠️ | ⚠️ |
| Preparar Entrega | ✅ | ⚠️ | ✅ | ✅ | ✅ |
| Fechar Consignação | ✅ | ⚠️ wizard | ⚠️ steps | ⚠️ 10px | ⚠️ |
| Entrega | ✅ | ⚠️ wizard | ✅ | ⚠️ | ⚠️ |
| Ficha Cliente | ✅ | ✅ | ✅ ações destacadas | ✅ pós-fix | ✅ |
| Cadastro Cliente | ✅ | ✅ | ✅ | ✅ pós-fix | ⚠️ !important |
| Conta Corrente | ✅ | ❌ título | ✅ | ⚠️ | ⚠️ |
| Relatórios | ⚠️ | ❌ | ❌ overload | ❌ cards | ❌ |
| Pendências | ✅ | ⚠️ | ✅ | ⚠️ tokens | ⚠️ |
| Recomendações | ✅ | ⚠️ | ✅ | ⚠️ | ⚠️ |
| Playbooks | ✅ | ❌ CSS ausente | ⚠️ | ❌ | ❌ |
| Workflow | ✅ | ❌ CSS ausente | ⚠️ | ❌ | ❌ |
| Pendências/Drawers | ✅ | — | ✅ | ⚠️ | ⚠️ |

---

## Consistência com CDS Design System

| Critério | Status | Observação |
|----------|--------|------------|
| Tokens `--color-*`, `--spacing-*` | ⚠️ Parcial | `--color-neutral-0`, `--cds-color-*` inválidos |
| Temas Classic / Dark / High Contrast | ❌ | Páginas MC ignoram `--color-surface` / `--color-text` |
| Componentes base (Button, Input, Card) | ✅ | Reexport do DS |
| Componentes dados (StatCard, Table) | ⚠️ | StatCard com cores fixas |
| Layouts (DashboardLayout, CDSPage) | ✅ | Oficiais |
| Tipografia enterprise | ⚠️ | `ux-enterprise.css` conflita com hierarquia das páginas |
| Animações / performance | ✅ | transform/opacity apenas |
| Charts CDS 2.1 | ✅ | Integrado em barras MC |

---

## Responsividade

| Resolução | Problemas identificados |
|-----------|-------------------------|
| **1366×768** | Fechar Consignação: tabela + sidebar wizard apertados; Relatórios: 7 seções empilhadas; filtros 4 col quebram |
| **1600×900** | Central Trabalho: faixas vazias laterais (max-width 1100px) |
| **1920×1080** | Mesmo espaço vazio; ficha cliente ok (max 1280px) |
| **Tablet ~768px** | Sidebar executive oculta; catálogo relatórios 2 col ok; wizard footer empilha |

---

## Plano de correção sugerido (priorizado)

### Sprint UX-07.1 — P0 (obrigatório)

1. Corrigir `--color-neutral-0` → `--color-surface` em Relatórios  
2. Reescrever regras de título em `ux-enterprise.css` (não aplicar xs uppercase em `h1`)  
3. StatCard + Drawer → tokens semânticos  
4. Linkar Playbooks + Workflow CSS no ERP  
5. Relatórios: colapsar seções; ocultar filtros por ID  

### Sprint UX-07.2 — P1

6. Migrar Pendências/Recomendações/Playbooks para tokens DS  
7. Inputs de filtros → componentes DS  
8. Fechar Consignação → CDSPage  
9. Auditoria/Histórico/Detalhes → CSS + linguagem operacional  
10. Loading overlay + extrato filters → tokens  

### Sprint UX-07.3 — P2/P3

11. Tema Dark completo no Motor Comercial  
12. Consolidar CSS; remover executive legado  
13. Empty states Perdas/Cortesias  

---

## Checklist final de aceite

Use este checklist após correções:

### Legibilidade e contraste
- [ ] Nenhum card com fundo transparente ou token CSS inválido
- [ ] Texto principal ≥ 12px em todas as telas operacionais
- [ ] Contraste mínimo WCAG AA (4.5:1) em texto normal — validar Relatórios, Filtros, Timeline
- [ ] Inputs legíveis em Classic, Dark e High Contrast sem `!important`

### Hierarquia
- [ ] Título da página é o elemento tipográfico dominante (≥ 1.25rem, peso bold)
- [ ] Operador responde “Quem/Onde/O quê” em < 5s na Ficha Cliente e Central Trabalho
- [ ] Meta-informação (empresa, filial, período) visualmente subordinada ao título

### Componentes
- [ ] StatCard, Drawer, Card usam `--color-surface` e `--color-text`
- [ ] Botão primário único e evidente por contexto
- [ ] Sidebars com área clicável ≥ 40px de altura
- [ ] Drawers legíveis em 1366px de largura

### Consistência DS
- [ ] Zero referências a `--cds-color-*` ou `--color-neutral-0`
- [ ] Zero `background: white` / `#fff` sem fallback semântico
- [ ] Todas as páginas com CSS carregado no ERP
- [ ] Filtros usam componentes ou classes DS oficiais

### Operação
- [ ] Relatórios: uma seção principal visível por vez
- [ ] Filtros técnicos (IDs) ocultos por padrão
- [ ] Playbooks e Workflow renderizam com estilo completo
- [ ] Fechar Consignação sem aparência de wizard legado
- [ ] Perdas/Cortesias com empty state profissional

### Responsividade
- [ ] 1366×768: sem scroll horizontal; ações acessíveis
- [ ] Tablet: navegação lateral acessível (não `display: none` sem alternativa)
- [ ] 1920×1080: aproveitamento horizontal razoável (sem faixas vazias excessivas)

---

## Arquivos analisados (referência)

```
frontend/erp/index.html
frontend/modules/motor-comercial/routes/index.js
frontend/modules/motor-comercial/styles/inject.js
frontend/modules/motor-comercial/styles/ux-enterprise.css
frontend/modules/motor-comercial/pages/*/styles.css (16 arquivos)
frontend/shared/design-system/tokens/colors.css
frontend/shared/design-system/primitives/data/StatCard.js
frontend/shared/design-system/primitives/special/Drawer.js
frontend/shared/design-system/styles/inject.js
```

---

## Confirmações

- ✅ Nenhuma alteração de backend, API ou banco foi necessária para esta auditoria  
- ✅ Problemas são reproduzíveis por inspeção de CSS e ordem de carregamento  
- ✅ Causa raiz dos cards invisíveis em Relatórios: **`--color-neutral-0` indefinido** + conflito **`ux-enterprise.css`**  
- ⚠️ Prints de homologação devem ser anexados pelo QA após abrir `/relatorios` em 1366×768 — sintoma esperado: cards do catálogo sem preenchimento visível

---

*Documento gerado na Sprint UX-07 — Auditoria Visual e Operacional do Motor Comercial.*


---

<a id="auditoria-ux10-fix-final"></a>

## Fonte: `AUDITORIA_UX10_FIX_FINAL.md`

## AUDITORIA UX-10 FIX FINAL — Central Comercial

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


---

<a id="auditoria-ux12-prestacao"></a>

## Fonte: `AUDITORIA_UX12_PRESTACAO.md`

## AUDITORIA UX-12 — Prestação de Contas V2 (Estação de Trabalho)

**Data:** 2026-07-13  
**Sprint:** UX-12  
**Referências:** ADR-UX-001 · DS-001 · UX-FOUNDATION-001 · STAB-03 · STAB-04  

---

## 1. Entrega

| Peça | Rota / path | Shared UI |
|------|-------------|-----------|
| Localizador | `/prestacao` · `pages/PrestacaoLocator/` | Workspace + SmartSearch + EntityCard |
| Estação | `/consignacoes/:id/prestacao` · `pages/PrestacaoContas/` | Workspace (Header/Body/Footer) |
| Grade | momento `retornos` | **STAB-04 intacto** (`gradeConsistencia` / flush) |

**Não alterado:** APIs, Ledger, Recovery, banco, regras de negócio, contratos STAB-04 de persistência.

---

## 2. Fluxo oficial

```
Central → /prestacao (SmartSearch) → EntityCard “Prestar Contas”
  → /consignacoes/:id/prestacao (Estação)
  → Registrar retornos (grade)
  → Continuar → Pagamento (se aplicável) → Encerrar Atendimento
  → Sucesso: Receber Agora | Voltar para Central
```

Voltar da Estação → `/prestacao` (não lista de consignações).  
Sucesso → Central `/`.

---

## 3. Respostas obrigatórias

### A Estação pode servir de modelo para o Motor Financeiro?

**Sim.** Anatomia Workspace (header contextual + body com superfície principal + footer de ações) é genérica. O Financeiro troca o body (extrato/lançamentos) e o provider de busca.

### Pode servir para Compras?

**Sim.** Localizador (SmartSearch + EntityCard) + Estação (grade/documento + ActionBar no footer) mapeia pedidos/recebimentos.

### Pode servir para Produção?

**Sim.** Mesmo padrão: localizar ordem/OP → estação com grade operacional → footer Continuar/Encerrar.

### Pode servir para Assistência Técnica?

**Sim.** Localizar OS/cliente → estação de atendimento → conclusão com próximo passo único (Receber / Voltar).

### Existem componentes que ainda pertencem ao Motor Comercial mas deveriam migrar para Shared UI?

**Sim — candidatos (não bloqueantes do UX-12):**

| Atual no Comercial | Destino Shared UI sugerido |
|--------------------|----------------------------|
| Grade STAB-04 (`#fechar-retornos-grade`) | `OperationalGrid` (FOUNDATION F5 / UX-13) |
| Stepper residual / momentos | `Wizard` / `Stepper` shared |
| Botões base locais | `ActionBar` shared |
| `FecharConsignacaoView` painéis | reduzir; totais via `SummaryCard` ≤3 |

A grade **não** foi movida nesta sprint de propósito (STAB-04).

### Existe qualquer duplicação visual?

**Reduzida.** Sidebar de resumo removida do shell; sucesso sem muro de KPIs; conferência final enxuta (Total / Recebido / Saldo).  
Painel lateral ainda existe no código (`renderPainelLateral`) para preview interno da grade, mas **não** é montado no Workspace shell.

### Existe qualquer scroll de página?

**Não no shell.** Workspace força overflow hidden no root; apenas `WorkspaceBody` rola. A grade continua com scroll interno próprio (STAB-04).

### Existe informação que obrigue o operador a procurar o próximo passo?

**Não no caminho feliz.** Footer fixo com Continuar / Encerrar; sucesso com no máximo 2 CTAs (Receber Agora / Voltar para Central).

---

## 4. Conformidade

| Norma | Status |
|-------|--------|
| ADR-UX-001 | OK — Estação, sem dashboard no default |
| DS-001 | OK — Workspace / SmartSearch / EntityCard |
| UX-FOUNDATION-001 | OK — sem fork Shared UI |
| STAB-03 | Bundle + verify UX-12 |
| STAB-04 | Grade / dirty / flush preservados |

---

## 5. Homologação

A Prestação de Contas V2 é a **primeira Estação de Trabalho oficial** da Plataforma CDS (localizar + operar + concluir).

Conta Corrente (UX-11) permanece referência de extrato financeiro sobre Workspace; a Prestação é o modelo de **atendimento operacional**.


---

<a id="auditoria-ux20"></a>

## Fonte: `AUDITORIA_UX20.md`

## AUDITORIA UX-20 — Operação Primeiro

**Data:** 2026-07-13  
**Sprint:** UX-20  
**Escopo:** Prestação · Conta Corrente · Preparar Entrega · Entrega  

**Não alterado:** Banco, APIs, Ledger, Recovery, Crédito Comercial, Outbox, Eventos, STAB-03/04 (persistência).

---

## 1. Entregas

| Tela | Rota | Shared UI | Estado |
|------|------|-----------|--------|
| Prestação Locator | `/prestacao` | Workspace + SmartSearch + EntityCard | Homologado |
| Prestação Estação | `/consignacoes/:id/prestacao` | Workspace; grade fill + scroll interno | Homologado |
| Conta Corrente | `/conta-corrente` | Workspace; Extrato + Análise recolhida | Homologado |
| Preparar Entrega | `/consignacoes/nova` | Workspace; 1 faixa de crédito | Homologado |
| Entrega | `/consignacoes/:id/entrega` | Workspace; confirmação fina + Entregar fixo | Homologado |

Antes × Depois (ilustrações):

![Estação Antes×Depois](docs/ux20/ux20-antes-depois-estacao.png)

![Conta Corrente Antes×Depois](docs/ux20/ux20-antes-depois-conta-corrente.png)

---

## 2. Respostas obrigatórias

### O operador executa mais rápido?

**Sim.** Fluxos principais abrem direto na tarefa (localizar / extrato / produtos / confirmar), sem muro de KPIs nem sidebars de “assistente”.

### Houve redução de cliques?

**Sim.**
- Prestação: Central → `/prestacao` → 1 clique Prestar Contas (sem filtros de lista).
- Conta Corrente: Receber no footer (sem caçar CTA).
- Preparar: sem navegar assistente lateral.
- Entrega: Entregar sempre no footer; sem ler checklist de 8 itens.

### Existe scroll de página?

**Não** nos shells Workspace (`overflow: hidden` no root).  
Scroll apenas em: body Workspace (listas/extrato) ou grade de retornos (container dedicado).

### Existe informação duplicada?

**Reduzida ao mínimo operacional.** Removidos: sidebar Prestação, assistente Preparar, StatCards/checklist/impacto Entrega, KPIs Conta no viewport.  
Totais ainda aparecem uma vez por etapa quando necessários (pagamento/encerrar).

### O próximo passo está evidente?

**Sim.** Footer fixo com uma ação primária por etapa (Continuar / Encerrar / Receber / Entregar / Concluir).

### O Shared UI foi utilizado corretamente?

**Sim.** Workspace (+ Header/Body/Footer) em todas as quatro estações; SmartSearch + EntityCard no Locator. Sem forks locais desses componentes.

### Componentes do Motor Comercial que devem migrar ao Shared UI?

| Atual | Destino sugerido |
|-------|------------------|
| Grade STAB-04 Prestação | `OperationalGrid` |
| Stepper Preparar | `Stepper` / `Wizard` shared |
| Faixa de crédito Preparar | `CreditStrip` |
| Botões de rodapé | `ActionBar` |
| Banner Pronto/Bloqueado Entrega | `StateIndicator` |

---

## 3. Validação

- `CDS_BUILD_SPRINT=UX-20 npm run build:motor-comercial`
- `npm run verify:motor-comercial` → PASSED
- Jest telas Workspace + STAB-04 relevantes

---

## 4. Homologação

UX-20 conclui a identidade operacional das **quatro telas principais** do Motor Comercial sobre Shared UI: localizar, extratar, preparar e entregar — com foco em rapidez, clareza e zero scroll de página.


---

<a id="auditoria-ux21-2"></a>

## Fonte: `AUDITORIA_UX21_2.md`

## AUDITORIA UX-21.2 — Densidade Operacional (Central Comercial)

**Data:** 2026-07-13  
**Sprint:** UX-21.2  
**Escopo:** Refinamento visual/layout da Central de Trabalho Comercial + EntityCard Shared UI  

**Não alterado:** Backend, APIs, Banco, Ledger, Recovery, Crédito Comercial, Outbox, Eventos, regras de negócio.

---

## 1. Entregas

| Item | Destino | Estado |
|------|---------|--------|
| EntityCard variantes `compact` / `normal` / `detailed` | `frontend/shared/ui/EntityCard/` | Homologado |
| Hero densificado (200–220px, ilustração 28–30%) | `frontend/shared/ui/Hero/` | Homologado |
| Central: grid 2 colunas + spacing canônico | `pages/Dashboard/` | Homologado |
| Princípio Densidade Operacional | `.cds/DS-001.md` | Documentado |
| Changelog DS | `CHANGELOG_DESIGN_SYSTEM.md` | Atualizado |

---

## 2. Respostas obrigatórias

### Existe scroll desnecessário?

**Reduzido.** O viewport inicial (1366×768+) passa a caber Hero + Indicadores + Minha Fila + Consignados na maior parte dos turnos típicos (≤ 2–4 cards por seção). Scroll permanece no `WorkspaceBody` apenas quando a fila cresce — não há scroll de página/shell.

### Existe espaço desperdiçado?

**Não como regra.** Hero perdeu ~35–40% de altura; KPIs baixaram; gap entre seções padronizado em 24px; cards compactos eliminam “área vazia” vertical típica de 1 card/linha.

### A Central transmite produtividade?

**Sim.** Layout de centro operacional denso: o operador vê o que fazer (Hero), o pulso do dia (indicadores) e a fila acionável (cards compactos em 2 colunas) sem varrer a tela.

### A leitura ficou mais rápida?

**Sim.** Metadados essenciais no card (`Status`, `Documento`, `Valor`, `Itens`, `Aguardando`) em bloco único; CTA lateral integrada; tipografia do Hero agrupada (saudação → data → status → mensagem → ações).

### Os cards compactos podem ser reutilizados em outros motores?

**Sim.** `EntityCard` `variant: 'compact'` é Shared UI oficial, sem domínio Comercial. Qualquer Central (Financeira, Fiscal, Compras, Estoque, CRM, Executivo) pode consumir o mesmo contrato.

---

## 3. Densidade (DS-001)

| Contexto | Densidade |
|----------|-----------|
| Centrais | Alta |
| Estações | Foco na tarefa |
| Cadastros | Média |
| Relatórios | Baixa |

Central Comercial = referência oficial de **Centro de Operações**.

---

## 4. Validação executada

| Comando | Resultado |
|---------|-----------|
| Jest Shared UI (EntityCard + Hero) | Ver seção 5 |
| Jest Central (Dashboard + mappers) | Ver seção 5 |
| `verify:motor-comercial` | Ver seção 5 |
| `audit:bundle` / `audit:design-system` | Ver seção 5 |
| `smoke:motor-comercial-bundle` | Ver seção 5 |

---

## 5. Evidência de testes

| Suite / Script | Resultado |
|----------------|-----------|
| Jest EntityCard + Hero | **14/14** passed |
| Jest Central (Dashboard + mappers) | **31/31** passed |
| `verify:motor-comercial` | **PASSED** (sprint UX-21.2) |
| `audit:bundle` | **PASSED** |
| `smoke:motor-comercial-bundle` | **PASSED** |
| `audit:design-system` | **PASSED** (0 tokens inválidos / 0 hardcoded) |

Bundle hash: `517AA00D2548FA84C93C4DD0D691D3BFAB444E8800FDA240472D786E36225D38`


---

<a id="auditoria-ux21-3"></a>

## Fonte: `AUDITORIA_UX21_3.md`

## AUDITORIA UX-21.3 — Centro de Operações (Wallpaper + Colunas)

**Data:** 2026-07-13  
**Sprint:** UX-21.3  
**Escopo:** Refinamento da Central Comercial como Centro de Operações oficial  

**Não alterado:** Backend, APIs, Banco, Ledger, Recovery, Crédito Comercial, Outbox, Eventos, regras de negócio.

---

## 1. Entregas

| Item | Destino | Estado |
|------|---------|--------|
| Hero wallpaper (8–12% opacity) | `frontend/shared/ui/Hero/` | Homologado |
| EntityCard compact densificado | `frontend/shared/ui/EntityCard/` | Homologado |
| Fila ∥ Consignados | `CentralTrabalhoView` + styles | Homologado |
| Entregas ∥ Atividades | idem | Homologado |
| DS-001 Hero + Densidade | `.cds/DS-001.md` | Atualizado |
| Changelog | `CHANGELOG_DESIGN_SYSTEM.md` | Atualizado |

---

## 2. Checklist visual

| Critério | Resultado |
|----------|-----------|
| Ilustração sem quadro separado | Sim — `.cds-hero__wallpaper` absoluto |
| Textos legíveis sobre fundo | Sim — opacidade ~10% |
| Fila e Consignados na mesma linha | Sim — `.cds-central-ops__split` |
| Timeline e Atividades na mesma linha | Sim |
| Cards compactos (status · nome · doc · resumo · CTA) | Sim |
| Densidade Operacional documentada | Sim (DS-001) |

---

## 3. Evidência de testes

| Suite / Script | Resultado |
|----------------|-----------|
| Jest Hero + EntityCard | **14/14** |
| Jest Central | **31/31** |
| `verify:motor-comercial` | **PASSED** (UX-21.3) |
| `audit:bundle` | **PASSED** |
| `smoke:motor-comercial-bundle` | **PASSED** |

Bundle hash: `7B9086B920C39938B2A7CE2B96B995193FBFDCF5F2ABFA017369A59356CE6111`


