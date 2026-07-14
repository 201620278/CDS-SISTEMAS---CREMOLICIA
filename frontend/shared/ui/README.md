# Shared UI — Plataforma CDS

Infraestrutura oficial de componentes operacionais.

| Documento | Papel |
|-----------|--------|
| [ADR-UX-001](../../../.cds/adr/ADR-UX-001.md) | Constituição UX |
| [DS-001](../../../.cds/DS-001.md) | Contratos |
| [UX-FOUNDATION-001](../../../.cds/UX_FOUNDATION_001.md) | Esta pasta |

## Política

**Nenhum motor** cria versão própria destes componentes.  
Evolução → aqui. Duplicação → proibida.

## Uso

```js
const { Workspace, ActionBar, SmartSearch } = require('../../shared/ui');
```

## Status

Ver `STATUS` em cada `*/index.js` e o mapa em UX-FOUNDATION-001.

### FOUNDATION F2 (pronto)
- **Workspace** (+ Header / Body / Footer) — `STATUS: ready`
- Testes: `npx jest --config frontend/shared/ui/jest.config.js`
- Exemplos: `frontend/shared/ui/Workspace/examples.js`

### FOUNDATION F3 (pronto)
- **SmartSearch** — `STATUS: ready` · `SmartSearch/examples.js`
- **EntityCard** — `STATUS: ready` · `EntityCard/examples.js`
- Auditoria: `AUDITORIA_SMARTSEARCH_ENTITYCARD.md`
- Changelog DS: `CHANGELOG_DESIGN_SYSTEM.md`

### Primeira tela oficial (UX-11)
- **Conta Corrente Comercial** — `frontend/modules/motor-comercial/pages/ContaCorrente/`
- Ver [CHANGELOG.md](./CHANGELOG.md)
