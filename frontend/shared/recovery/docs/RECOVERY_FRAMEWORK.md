# Recovery Framework CDS — Enterprise (RFC-03)

Infraestrutura oficial da Plataforma CDS para recuperação automática de operações interrompidas.

> **Diretriz oficial:** Toda operação iniciada no CDS Sistemas deverá ser recuperável após interrupções inesperadas.

## Princípios

1. **API-first** — reconstrução prioriza APIs oficiais.
2. **Autosave transparente** — não depende do botão Salvar.
3. **Checkpoint durável** — `localStorage` (`cds-recovery:v1`), com checksum/versão.
4. **Autorização no contexto** — liberação gerencial vive no `RecoveryContext.authorization`.
5. **Mensagens operacionais** — nunca erros técnicos ao operador.
6. **Sem dono dos dados** — o framework coordena; regras ficam nos motores.

## Ordem oficial de reconstrução

1. API oficial  
2. Recovery Provider  
3. Checkpoint  
4. Cache auxiliar  

Nunca inverter.

## API RecoveryManager

```js
const { RecoveryManager, RecoveryStatus } = require('../../shared/recovery');

RecoveryManager.open({ module, operation, entityId });
RecoveryManager.autosave({ module, operation, entityId }, checkpoint, status);
RecoveryManager.save(...);
RecoveryManager.setAuthorization({ module, operation, entityId }, {
  authorized: true,
  authorizedBy: 'admin',
  authorizedAt: '...',
  reason: '...',
  expiresOnComplete: true,
  fingerprint: '...',
  expiresAt: '...'
});
RecoveryManager.getAuthorization({ module, operation, entityId });
await RecoveryManager.resume({ module, operation, entityId }, helpers);
RecoveryManager.complete(...); // remove authorization se expiresOnComplete
RecoveryManager.cancel(...);
RecoveryManager.listPending({ module });
RecoveryManager.validate({ module, operation, entityId });
RecoveryManager.createDraftEntityId(); // draft-* antes do POST
```

## RecoveryContext

Campos: `module`, `operation`, `entityId`, `status`, `checkpoint`, `authorization`, `version`, `checksum`, `timestamp`, `integrity`, `meta`.

### authorization

```js
{
  authorized: true,
  authorizedBy: 'supervisor',
  authorizedAt: 'ISO',
  reason: '...',
  expiresOnComplete: true,
  expiresAt: 'ISO',
  fingerprint: '...',
  supervisorToken: '...'
}
```

## Autosave

Disparado em mutações operacionais (itens, cliente, observações, etc.).  
Grava **somente** estado operacional — nunca estoque, financeiro, fiscal ou registros definitivos.

## Validation

`RecoveryValidation.seal` / `validate` — checksum + versão. Inválido → `RECOVERY_DISCARDED`, ignora checkpoint, segue API.

## Eventos de auditoria

`RECOVERY_OPEN` · `SAVE` · `AUTOSAVE` · `LOAD` · `RESUME` · `RECOVERED` · `COMPLETE` · `CANCEL` · `CLEAR` · `VALIDATE` · `DISCARDED` · `EXPIRED` · `AUTH_RESTORED`

## Mensagens operacionais

`RecoveryMessages.toOperationalMessage(error)` — ex.: *"Esta operação foi removida."*, *"Verifique sua conexão e tente novamente."*

## Motor Comercial (integrado)

| Operação | Autosave | Auth | Resume |
|----------|----------|------|--------|
| PREPARAR_ENTREGA | Sim | Sim | Sim |
| ENTREGA | Checkpoint | Sim | Sim |
| FECHAR_ATENDIMENTO | Registrado | — | Sprint futura |

## Arquitetura detalhada

Ver `RECOVERY_FRAMEWORK_ARCHITECTURE.md`.
