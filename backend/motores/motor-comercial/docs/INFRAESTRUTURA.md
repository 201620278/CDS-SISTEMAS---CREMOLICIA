# Infraestrutura — Motor Comercial v2.2.5

Base: Constituição v2.1.3 + Persistência v2.2

## Objetivo

Camada de infraestrutura desacoplada que sustenta Use Cases, sem regras de negócio.

## Estrutura

```
domain/
  contracts/
    repositories/     ← interfaces I*Repository
    bridges/          ← interfaces I*Bridge
  errors/             ← DomainError + especializações
  events/             ← DomainEvent

infrastructure/
  base/               ← BaseRepository
  result/             ← Result
  transactions/       ← TransactionManager, UnitOfWork
  factories/          ← RepositoryFactory
  events/             ← EventDispatcher, EventPublisher
  di/                 ← ComercialDependencyContainer
  repositories/       ← re-export dos concretos

usecases/
  base/               ← BaseUseCase
```

## Padrão oficial de execução

```
Controller → UseCase → UnitOfWork → Repositories → Bridges → Commit → Eventos → Result
```

## Dependency Injection

```javascript
const { criarContainerPadrao, TOKENS } = require('./infrastructure/di');

const container = criarContainerPadrao({ db });
const unitOfWork = container.resolver(TOKENS.UNIT_OF_WORK);
const eventPublisher = container.resolver(TOKENS.EVENT_PUBLISHER);
```

## Unit of Work

```javascript
await unitOfWork.executar(async (uow) => {
  await uow.consignacao.inserir(dados);
  await uow.movimentacaoComercial.inserir(mov);
});
```

## Result Pattern

Todo Use Case futuro retorna `Result`:

```javascript
const Result = require('./infrastructure/result/Result');
return Result.ok(dados);
return Result.fail(new ConsignacaoNaoEncontradaError(id));
```

## Contratos

Use Cases dependem apenas de interfaces em `domain/contracts/`, nunca de implementações concretas.

Implementações concretas:
- Repositories → `repositories/` (herdam `BaseRepository`)
- Bridges → `bridges/` (próximas sprints)
