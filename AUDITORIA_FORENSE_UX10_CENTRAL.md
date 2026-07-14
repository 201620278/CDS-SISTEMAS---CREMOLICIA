# AUDITORIA FORENSE — UX-10 NÃO REFLETIDA NA CENTRAL DE TRABALHO

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
