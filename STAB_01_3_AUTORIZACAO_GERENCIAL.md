# STAB-01.3 — Autorização Gerencial para Ultrapassar Limite Comercial

**Data:** 12/07/2026  
**Escopo:** Exigir autenticação de administrador para entrega acima do crédito disponível. Sem bypass. Sem alteração permanente de limite.

## Regra

Se `Valor da Entrega > Crédito Disponível`:

- **Continuar / Concluir / Entregar** ficam desabilitados
- Exibe **Solicitar Liberação**
- Modal DS: Usuário Administrador + Senha (obrigatórios) + Motivo (recomendado)
- Autenticação via `POST /api/auth/supervisor/authorize` (mecanismo oficial CDS)
- Auditoria `AUTORIZACAO_GERENCIAL` com cliente, valores, excedente, autorizador, data/hora, motivo
- Liberação válida **somente para a operação atual** (sessão + fingerprint / consignação)

## Arquivos principais

| Camada | Arquivo |
|--------|---------|
| Modal / fluxo FE | `frontend/modules/motor-comercial/utils/autorizacaoGerencial.js` |
| Preparar Entrega | `pages/NovaConsignacao/index.js` |
| Entrega | `pages/EntregaConsignacao/index.js` |
| API FE | `api/MotorComercialApi.js` → `POST /autorizacoes/gerenciais` |
| Backend | `services/autorizacaoGerencialService.js` |
| Controller | `controllers/AutorizacaoGerencialController.js` |
| Entrega UC | `RegistrarEntregaConsignacaoUseCase.js` (aceita `liberacaoGerencial`) |

## Critérios

- Operador não finaliza acima do limite sem liberação
- Apenas admin/supervisor autentica
- Senha obrigatória
- Auditoria registrada
- Limite comercial do cliente **não** é alterado
- UC-007 (aumento permanente de limite) **não** é usado

## Verificação

- Frontend: **197** testes passando
- Build Motor Comercial: OK
