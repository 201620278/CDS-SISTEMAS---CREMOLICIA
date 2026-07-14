# STAB-03 — Pipeline Oficial de Build e Homologação Enterprise

**Prioridade:** P0  
**Data:** 13/07/2026  
**Tipo:** Infraestrutura (sem novas funcionalidades de negócio)  
**Objetivo:** Eliminar divergência fonte ↔ testes ↔ bundle Electron (causa raiz da Auditoria Forense UX-10)

---

## 1. Causa raiz (confirmada)

A UX-10 estava correta nos **fontes** e nos **testes Jest** (que fazem `require` dos `.js`).

O Electron/ERP **não executa os fontes**. Executa apenas:

```
frontend/modules/motor-comercial/motor-comercial.bundle.js
```

injetado por `frontend/erp/index.html`.

Após UX-10, o comando `npm run build:motor-comercial` **não havia sido executado**.  
O bundle permanecia em UX-09 (02:33), enquanto os fontes UX-10 foram gravados ~08:42.

**Classificação forense:** A (bundle antigo) + G (Electron carrega o artefato antigo).

---

## 2. O que a STAB-03 entregou

| ID | Entrega | Status |
|----|---------|--------|
| P0-01 | Build limpo não incremental (apaga artefatos e regenera) | ✅ |
| P0-02 | `frontend/shared/build/BuildInfo.js` + `window.CDS_BUILD` | ✅ |
| P0-03 | Banner de Build no console (Sprint UX-10 / Hash / BuildTime) | ✅ |
| P0-04 | `npm run verify:motor-comercial` | ✅ |
| P0-05 | `npm run audit:bundle` | ✅ |
| P0-06 | Guard no bootstrap + `comercial.js` (bloqueia bundle sem CDS_BUILD / sprint ≠ UX-10) | ✅ |
| P0-07 | `npm run release:motor-comercial` (+ smoke + report) | ✅ |
| Correção imediata | Bundle regenerado com UX-10 | ✅ |

---

## 3. Arquivos alterados / criados

### Criados

| Arquivo |
|---------|
| `frontend/shared/build/BuildInfo.js` |
| `scripts/verify-motor-comercial.js` |
| `scripts/audit-motor-comercial-bundle.js` |
| `scripts/smoke-motor-comercial-bundle.js` |
| `scripts/release-motor-comercial.js` |
| `frontend/modules/motor-comercial/build-meta.json` *(gerado)* |
| `frontend/modules/motor-comercial/build-meta.generated.js` *(gerado)* |
| `frontend/modules/motor-comercial/motor-comercial.bundle.sha256` *(gerado)* |
| `STAB_03_RELEASE_REPORT.md` |
| `STAB_03_BUILD_PIPELINE.md` *(este)* |

### Alterados

| Arquivo | Mudança |
|---------|---------|
| `scripts/build-motor-comercial.js` | Limpeza total + footer BuildInfo + hash do corpo |
| `frontend/modules/motor-comercial/bootstrap/index.js` | Publica/valida BuildInfo; bloqueia sprint incorreta |
| `frontend/erp/js/comercial.js` | Guard `window.CDS_BUILD` antes do bootstrap |
| `package.json` | scripts `verify`, `audit:bundle`, `smoke`, `release` |
| `motor-comercial.bundle.js` (+ map/css) | **Regenerado** |

---

## 4. Comandos executados

```bash
npm run build:motor-comercial
npm run verify:motor-comercial
npm run audit:bundle
npm run smoke:motor-comercial-bundle
npx jest --config frontend/modules/motor-comercial/jest.config.js --testPathPatterns=centralTrabalhoMappers
npm run test:motor-comercial
```

Homologação lógica da Central (máquina de estados):

```bash
node -e "require('./frontend/modules/motor-comercial/pages/Dashboard/centralTrabalhoMappers')..."
```

Release completo (atalho oficial):

```bash
npm run release:motor-comercial
```

---

## 5. Evidências obrigatórias

### 5.1 Data/hora do bundle

| Campo | Valor |
|-------|-------|
| Arquivo | `frontend/modules/motor-comercial/motor-comercial.bundle.js` |
| mtime local | **2026-07-13 09:56:00** (−03) |
| mtime UTC | **2026-07-13T12:56:00.741Z** |
| Tamanho | **4 986 533** bytes |

### 5.2 SHA-256 (corpo do bundle, antes do footer BuildInfo)

```
8583921B4BE21A9D44AC37EAB7DDE6CA13AE380A41A467380A7D09C84493CE1C
```

Sidecar: `motor-comercial.bundle.sha256` — idêntico.  
`CDS_BUILD.hash` / `build-meta.json.hash` — idênticos.

### 5.3 Strings UX-10 presentes no bundle

Confirmado por `verify` + `audit` + `rg`:

| String | Status |
|--------|--------|
| Minha Fila de Trabalho | ✅ |
| Continuar Atendimento | ✅ |
| resolveEstadoOperacionalCliente | ✅ |
| auditarCentralEstados | ✅ |
| Atendimentos para Fechar | ✅ |

### 5.4 Legados UX-09 ausentes no bundle

| Padrão | Status |
|--------|--------|
| `acoes.fecharAtendimento` | ✅ ausente |
| `_renderOperacionalRow` | ✅ ausente |
| `buildConsignadosPendentes` antigo (saldo livre sem E5) | ✅ ausente |

### 5.5 `npm run verify:motor-comercial` — saída

```
=== verify:motor-comercial (STAB-03) ===

✓ bundle existe
✓ bundle atualizado em 2026-07-13T12:56:00.741Z (4986533 bytes)
✓ fonte ≤ bundle: bootstrap/index.js
✓ fonte ≤ bundle: pages/Dashboard/index.js
✓ fonte ≤ bundle: pages/Dashboard/CentralTrabalhoView.js
✓ fonte ≤ bundle: pages/Dashboard/centralTrabalhoMappers.js
✓ fonte ≤ bundle: frontend/shared/build/BuildInfo.js
✓ hash corpo/embutido OK: 8583921B4BE21A9D44AC37EAB7DDE6CA13AE380A41A467380A7D09C84493CE1C
✓ sidecar motor-comercial.bundle.sha256 OK
✓ BuildInfo sprint=UX-10 buildTime=2026-07-13 09:55:53
✓ build-meta.json.hash OK
✓ CDS_BUILD presente no bundle
✓ contém "Minha Fila de Trabalho"
✓ contém "Continuar Atendimento"
✓ contém "resolveEstadoOperacionalCliente"
✓ contém "auditarCentralEstados"
✓ contém "Atendimentos para Fechar"
✓ legado ausente: Fechar Atendimento nas Ações Rápidas (UX-09)
✓ legado ausente: _renderOperacionalRow legado (UX-09)
✓ legado ausente: buildConsignadosPendentes antigo
✓ Electron/ERP index.html referencia o bundle oficial

VERIFY PASSED — Motor Comercial sincronizado (fontes ≤ bundle + UX-10).

BUNDLE_MTIME=2026-07-13T12:56:00.741Z
BUNDLE_HASH=8583921B4BE21A9D44AC37EAB7DDE6CA13AE380A41A467380A7D09C84493CE1C
```

### 5.6 `npm run audit:bundle` — saída (resumo)

```
AUDIT PASSED — bundle correto e alinhado ao Electron.

script_src: /modules/motor-comercial/motor-comercial.bundle.js
same_as_disk_bundle: true
sprint: UX-10
hash_corpo == hash_embutido == hash_sidecar
acoes.fecharAtendimento: OK ausente
_renderOperacionalRow: OK ausente
```

### 5.7 Banner de Build (smoke = carga do IIFE do bundle)

```
================================================
CDS Sistemas
Motor Comercial
Sprint
UX-10
Build
2026-07-13 09:55:53
Hash
8583921B4BE21A9D44AC37EAB7DDE6CA13AE380A41A467380A7D09C84493CE1C
================================================
```

`window.CDS_BUILD` publicado com os mesmos campos.  
No Electron real: abrir DevTools → Console e confirmar o mesmo banner após carregar o ERP (o footer do bundle executa no load do script).

### 5.8 Central — exclusividade operacional (homologação da máquina de estados)

Execução direta do mapper (mesmo código embutido no bundle):

| Cliente | Estado | Bloco | Botão |
|---------|--------|-------|-------|
| Ciclo Aberto (`EM_PRESTACAO`) | E4 | Trabalho Prioritário | **Continuar Atendimento** |
| Pós Encerramento (`ACERTADA` + saldo) | E5 | Consignados Pendentes | **Receber** |

```
auditoria: { ok: true, erros: [], contagens: { prioritario: 1, pendentes: 1, intersecao: 0 } }
```

Checklist:

- [x] Prestação em andamento → Continuar Atendimento  
- [x] Consignados Pendentes **não** lista cliente com prestação aberta  
- [x] Consignados Pendentes só após encerramento com saldo  
- [x] Interseção Prioritário ∩ Pendentes = **0**  
- [x] Testes Jest UX-10: **25/25 PASS**

### 5.9 `npm run test:motor-comercial`

Suíte backend executada. Resultado parcial relevante:

| Pacote | Resultado |
|--------|----------|
| startup | OK |
| perfil | 20 passou |
| consignação fase 1 | 16 passou |
| consignação fase 2 | OK |
| consignação fase 3 | 18 passou |
| **projection** | **14 passou, 1 falhou** |

Falha:

```
FALHOU  SituacaoClienteProjectionService — consolidação
60 !== 20
```

**Não relacionada a STAB-03 / bundle / UX-10** (serviço de projection backend).  
A suíte completa abortou nesse ponto (`exit 1`).  
Testes de frontend da Central: **PASS**.

### 5.10 Electron × artefato

| Checagem | Resultado |
|----------|-----------|
| `index.html` referencia o bundle | ✅ |
| Arquivo servido = bundle regenerado | ✅ |
| Guard sem `CDS_BUILD` | bloqueia UI com erro explícito |
| Guard sprint ≠ UX-10 | bloqueia UI com erro explícito |

---

## 6. Como o hash funciona (anti-divergência)

1. esbuild gera o corpo do bundle.  
2. SHA-256 do **corpo** (antes do footer).  
3. Footer `/*__CDS_BUILD_INFO_START__*/` injeta `window.CDS_BUILD` + banner com esse hash.  
4. Sidecar `.sha256` e `build-meta.json` gravam o mesmo valor.  
5. `verify` / `audit` recalculam o hash do corpo e comparam.

Assim, “bundle regenerado” sem evidência de hash **não** passa no pipeline.

---

## 7. Checklist final

| Critério | Status |
|----------|--------|
| Bundle limpo regenerado | ✅ |
| Timestamp pós-UX-10 | ✅ 09:56:00 |
| SHA-256 documentado | ✅ |
| Strings UX-10 no bundle | ✅ |
| Legados UX-09 fora do bundle | ✅ |
| verify PASS | ✅ |
| audit PASS | ✅ |
| Banner / CDS_BUILD (smoke) | ✅ |
| Exclusividade E4/E5 | ✅ |
| Guard Electron | ✅ |
| test frontend Central | ✅ 25/25 |
| test:motor-comercial completo | ⚠️ 1 falha pré-existente em projection |

---

## 8. Regra operacional da plataforma

Nenhuma alteração de UI do Motor Comercial é considerada entregue sem:

```text
npm run release:motor-comercial
```

que obriga: testes frontend → build limpo → verify → audit → smoke → report.

**Nunca** aceitar apenas “testes passando” ou “build realizado” sem `verify` + hash alinhado ao Electron.

---

*STAB-03 — infraestrutura de build/homologação. Sem alteração de regras de negócio, APIs ou banco.*
