# events/

Sistema de eventos de domínio do Motor Comercial.

**Sprint 1.1:** pasta reservada — eventos reais não implementados.

## Eventos de domínio previstos

| Evento | Quando dispara futuramente |
|--------|-----------------------------|
| `ConsignacaoCriada` | Consignação criada |
| `ConsignacaoEntregue` | Entrega confirmada |
| `AcertoRealizado` | Prestação de contas concluída |
| `PagamentoRegistrado` | Pagamento registrado |
| `LimiteCreditoAlterado` | Limite comercial alterado |
| `ClienteBloqueado` | Bloqueio comercial aplicado |
| `ClienteDesbloqueado` | Bloqueio comercial removido |
| `ConsignacaoEncerrada` | Consignação encerrada |

## Princípios

- Eventos são nomes de domínio, não nomes de handlers HTTP.
- Publicação futura deve ser assíncrona e não bloquear casos de uso.
- Persistência futura deverá ser feita por infraestrutura própria do motor.

## Arquivos

- `comercialEventosTipos.js` — constantes dos eventos de domínio.
- `comercialEventosEmitter.js` — estrutura de publicação futura.
