# Bridges Oficiais do Motor Comercial

**Sprint 2.6** — Integração Oficial do Motor Comercial com os demais Motores do CDS

---

## Objetivo

Implementar as Bridges concretas do Motor Comercial, estabelecendo a comunicação oficial entre Motores através de uma arquitetura desacoplada e resiliente.

---

## Princípio Fundamental

**Nenhum Motor poderá acessar outro Motor diretamente.**

Toda comunicação ocorrerá exclusivamente através de Bridges.

```
❌ PROIBIDO:
MotorComercial → MotorFinanceiro (diretamente)

✅ CORRETO:
MotorComercial → Bridge → MotorFinanceiro
```

---

## Arquitetura

### Componentes Principais

```
bridges/
├── BridgeContext.js          # Contexto compartilhado
├── BridgeRegistry.js        # Registro de Bridges
├── BridgeFactory.js         # Factory de Bridges
├── ClienteBridge.js         # Bridge Cliente
├── ProdutoBridge.js         # Bridge Produto
├── EstoqueBridge.js         # Bridge Estoque
├── FinanceiroBridge.js      # Bridge Financeiro
├── UsuarioBridge.js         # Bridge Usuario
├── resilience/              # Infraestrutura de Resiliência
│   ├── RetryPolicy.js
│   ├── CircuitBreaker.js
│   ├── TimeoutPolicy.js
│   ├── FallbackPolicy.js
│   ├── ResilienceChain.js
│   └── index.js
└── events/                  # Infraestrutura de Eventos
    ├── EventPublisher.js
    ├── EventTypes.js
    └── index.js
```

---

## BridgeContext

### Propósito

Compartilhar contexto entre todas as chamadas de Bridge, garantindo rastreabilidade e consistência.

### Campos

- **requestId**: ID da requisição HTTP
- **correlationId**: ID de correlação (obrigatório)
- **usuarioId**: ID do usuário (obrigatório)
- **usuarioNome**: Nome do usuário
- **empresaId**: ID da empresa
- **filialId**: ID da filial
- **data**: Data da operação
- **operacao**: Tipo de operação
- **metadata**: Metadados adicionais

### Exemplo de Uso

```javascript
const BridgeContext = require('./bridges/BridgeContext');

const context = BridgeContext.create({
  requestId: 'req-123',
  correlationId: 'corr-123',
  usuarioId: 'user-123',
  usuarioNome: 'João Silva',
  empresaId: 'emp-001',
  filialId: 'fil-001',
  data: new Date(),
  operacao: 'CRIAR_CONSIGNACAO',
  metadata: { origem: 'API' }
});

// Atualizar contexto
const updatedContext = context.with({ operacao: 'ATUALIZAR_CONSIGNACAO' });

// Validar contexto
if (!context.isValid()) {
  const errors = context.getValidationErrors();
  // Tratar erros
}
```

---

## BridgeRegistry

### Propósito

Registrar todas as Bridges disponíveis, preparando para futuras integrações.

### Métodos

- **register(name, factory, metadata)**: Registra uma Bridge
- **get(name)**: Obtém a factory de uma Bridge
- **has(name)**: Verifica se uma Bridge está registrada
- **unregister(name)**: Remove uma Bridge do registro
- **list()**: Lista todas as Bridges registradas
- **listWithMetadata()**: Lista Bridges com metadados

### Exemplo de Uso

```javascript
const registry = require('./bridges/BridgeRegistry');

// Registrar Bridge
registry.register('ClienteBridge', (deps) => new ClienteBridge(deps), {
  version: '1.0',
  targetMotor: 'motor-cliente'
});

// Verificar disponibilidade
if (registry.has('ClienteBridge')) {
  const factory = registry.get('ClienteBridge');
  const bridge = factory({ httpClient, logger });
}
```

---

## BridgeFactory

### Propósito

Resolver Bridges de forma centralizada, impedindo que UseCases instanciem Bridges diretamente.

### Métodos

- **create(name, dependencies)**: Cria instância de Bridge
- **isAvailable(name)**: Verifica disponibilidade
- **listAvailable()**: Lista Bridges disponíveis
- **getMetadata(name)**: Obtém metadados

### Exemplo de Uso

```javascript
const BridgeFactory = require('./bridges/BridgeFactory');

// Criar Bridge
const clienteBridge = BridgeFactory.create('ClienteBridge', {
  httpClient,
  logger,
  eventPublisher
});

// Verificar disponibilidade
if (BridgeFactory.isAvailable('ProdutoBridge')) {
  const produtoBridge = BridgeFactory.create('ProdutoBridge', { httpClient, logger });
}
```

---

## ClienteBridge

### Responsabilidades

- **validarCliente**: Valida se cliente existe e está ativo
- **consultarCliente**: Consulta dados completos do cliente
- **consultarSituacao**: Consulta situação atual do cliente
- **consultarBloqueios**: Consulta bloqueios ativos
- **consultarDadosCadastrais**: Consulta dados cadastrais

### Métodos

```javascript
// Validar cliente
const result = await clienteBridge.validarCliente(clienteId, context);

// Consultar cliente
const result = await clienteBridge.consultarCliente(clienteId, context);

// Consultar situação
const result = await clienteBridge.consultarSituacao(clienteId, context);

// Consultar bloqueios
const result = await clienteBridge.consultarBloqueios(clienteId, context);

// Consultar dados cadastrais
const result = await clienteBridge.consultarDadosCadastrais(clienteId, context);
```

### Contrato

Todos os métodos retornam `Result`:
- **Sucesso**: `Result.ok(dados)`
- **Falha**: `Result.fail(erro)`

---

## ProdutoBridge

### Responsabilidades

- **validarProduto**: Valida se produto existe e está ativo
- **consultarProduto**: Consulta dados completos do produto
- **consultarUnidade**: Consulta unidade de medida
- **consultarPreco**: Consulta preço do produto
- **consultarGTIN**: Consulta GTIN do produto
- **consultarEstoqueDisponivel**: Consulta estoque disponível

### Métodos

```javascript
// Validar produto
const result = await produtoBridge.validarProduto(produtoId, context);

// Consultar produto
const result = await produtoBridge.consultarProduto(produtoId, context);

// Consultar preço
const result = await produtoBridge.consultarPreco(produtoId, tabelaPreco, context);

// Consultar estoque disponível
const result = await produtoBridge.consultarEstoqueDisponivel(produtoId, filialId, context);
```

---

## EstoqueBridge

### Responsabilidades

- **registrarSaidaConsignacao**: Registra saída por consignação
- **registrarEntradaDevolucao**: Registra entrada por devolução
- **registrarTransferencia**: Registra transferência
- **consultarSaldo**: Consulta saldo de estoque

### Métodos

```javascript
// Registrar saída por consignação
const result = await estoqueBridge.registrarSaidaConsignacao({
  produtoId: 'prod-123',
  quantidade: 10,
  consignacaoId: 'cons-123',
  filialId: 'fil-123'
}, context);

// Registrar entrada por devolução
const result = await estoqueBridge.registrarEntradaDevolucao({
  produtoId: 'prod-123',
  quantidade: 5,
  consignacaoId: 'cons-123',
  filialId: 'fil-123'
}, context);

// Registrar transferência
const result = await estoqueBridge.registrarTransferencia({
  produtoId: 'prod-123',
  quantidade: 10,
  consignacaoOrigemId: 'cons-123',
  consignacaoDestinoId: 'cons-456',
  filialId: 'fil-123'
}, context);

// Consultar saldo
const result = await estoqueBridge.consultarSaldo(produtoId, filialId, context);
```

### Eventos Publicados

- **EstoqueAtualizado**: Quando estoque é atualizado (entrada/saída)
- **EstoqueTransferido**: Quando estoque é transferido

---

## FinanceiroBridge

### Responsabilidades

- **registrarReceita**: Registra receita financeira
- **registrarPagamento**: Registra pagamento
- **registrarPerda**: Registra perda financeira
- **consultarSaldo**: Consulta saldo financeiro

### Métodos

```javascript
// Registrar receita
const result = await financeiroBridge.registrarReceita({
  clienteId: 'cli-123',
  valor: 100.00,
  consignacaoId: 'cons-123',
  tipo: 'V'
}, context);

// Registrar pagamento
const result = await financeiroBridge.registrarPagamento({
  clienteId: 'cli-123',
  valor: 50.00,
  consignacaoId: 'cons-123',
  formaPagamento: 'DINHEIRO'
}, context);

// Registrar perda
const result = await financeiroBridge.registrarPerda({
  clienteId: 'cli-123',
  valor: 25.00,
  consignacaoId: 'cons-123',
  motivo: 'Avaria'
}, context);

// Consultar saldo
const result = await financeiroBridge.consultarSaldo(clienteId, context);
```

### Eventos Publicados

- **FinanceiroLancado**: Quando lançamento financeiro é registrado
- **PagamentoRegistrado**: Quando pagamento é registrado
- **PerdaRegistrada**: Quando perda é registrada

---

## UsuarioBridge

### Responsabilidades

- **validarUsuario**: Valida se usuário existe e está ativo
- **validarPermissao**: Valida permissão do usuário
- **validarAutorizacaoGerencial**: Valida autorização gerencial
- **consultarOperador**: Consulta dados do operador

### Métodos

```javascript
// Validar usuário
const result = await usuarioBridge.validarUsuario(usuarioId, context);

// Validar permissão
const result = await usuarioBridge.validarPermissao(usuarioId, 'VENDER', context);

// Validar autorização gerencial
const result = await usuarioBridge.validarAutorizacaoGerencial(usuarioId, 'APROVAR_LIMITE', context);

// Consultar operador
const result = await usuarioBridge.consultarOperador(usuarioId, context);
```

---

## Resiliência

### RetryPolicy

Política de retry com backoff exponencial.

```javascript
const { RetryPolicy } = require('./bridges/resilience');

const retryPolicy = RetryPolicy.create({
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
});

await retryPolicy.execute(async () => {
  // Chamada que pode falhar
  return await httpClient.get('/endpoint');
});
```

### CircuitBreaker

Circuit Breaker para evitar chamadas em cascata.

```javascript
const { CircuitBreaker } = require('./bridges/resilience');

const circuitBreaker = CircuitBreaker.create({
  failureThreshold: 5,
  resetTimeout: 60000,
  monitoringPeriod: 10000
});

await circuitBreaker.execute(async () => {
  // Chamada protegida
  return await httpClient.get('/endpoint');
});

// Verificar estado
const stats = circuitBreaker.getStats();
console.log(stats.state); // CLOSED, OPEN, HALF_OPEN
```

### TimeoutPolicy

Política de timeout para chamadas longas.

```javascript
const { TimeoutPolicy } = require('./bridges/resilience');

const timeoutPolicy = TimeoutPolicy.create({
  timeout: 30000
});

await timeoutPolicy.execute(async () => {
  // Chamada com timeout
  return await httpClient.get('/endpoint');
});
```

### FallbackPolicy

Política de fallback para falhas.

```javascript
const { FallbackPolicy } = require('./bridges/resilience');

const fallbackPolicy = FallbackPolicy.create({
  fallbackFn: async (error) => {
    // Retorno alternativo
    return { cached: true, data: [] };
  }
});

await fallbackPolicy.execute(async () => {
  // Chamada principal
  return await httpClient.get('/endpoint');
});
```

### ResilienceChain

Cadeia combinada de políticas de resiliência.

```javascript
const { ResilienceChain } = require('./bridges/resilience');

const chain = ResilienceChain.create({
  retryPolicy: RetryPolicy.create({ maxRetries: 3 }),
  circuitBreaker: CircuitBreaker.create({ failureThreshold: 5 }),
  timeoutPolicy: TimeoutPolicy.create({ timeout: 30000 }),
  fallbackPolicy: FallbackPolicy.create({ fallbackFn: fallbackHandler })
});

await chain.execute(async () => {
  // Chamada com todas as políticas
  return await httpClient.get('/endpoint');
});
```

---

## Eventos

### EventPublisher

Publicador de eventos para comunicação assíncrona.

```javascript
const { EventPublisher, EventTypes } = require('./bridges/events');

const publisher = EventPublisher.create({ logger });

// Publicar evento
await publisher.publish(EventTypes.ESTOQUE_ATUALIZADO, {
  produtoId: 'prod-123',
  quantidade: 10,
  correlationId: 'corr-123'
});

// Assinar evento
const unsubscribe = publisher.subscribe(EventTypes.ESTOQUE_ATUALIZADO, (event) => {
  console.log('Estoque atualizado:', event.payload);
});

// Cancelar assinatura
unsubscribe();

// Consultar histórico
const history = publisher.getHistory({ correlationId: 'corr-123' });
```

### Tipos de Eventos

- **EstoqueAtualizado**: Estoque atualizado (entrada/saída)
- **EstoqueTransferido**: Estoque transferido
- **FinanceiroLancado**: Lançamento financeiro
- **PagamentoRegistrado**: Pagamento registrado
- **PerdaRegistrada**: Perda registrada
- **ClienteBloqueado**: Cliente bloqueado
- **ClienteDesbloqueado**: Cliente desbloqueado
- **ClienteSituacaoAlterada**: Situação do cliente alterada
- **UsuarioAutorizado**: Usuário autorizado
- **UsuarioNegado**: Usuário negado
- **BridgeChamadaIniciada**: Chamada de Bridge iniciada
- **BridgeChamadaCompletada**: Chamada de Bridge completada
- **BridgeChamadaFalhou**: Chamada de Bridge falhou

---

## Logging

Todas as chamadas de Bridge registram logs estruturados:

```javascript
// Log de início
logger.info('ClienteBridge.validarCliente', {
  clienteId: 'cli-123',
  correlationId: 'corr-123',
  requestId: 'req-123'
});

// Log de sucesso
logger.info('ClienteBridge.validarCliente - Sucesso', {
  clienteId: 'cli-123',
  correlationId: 'corr-123',
  duration: 150
});

// Log de erro
logger.error('ClienteBridge.validarCliente - Erro', {
  clienteId: 'cli-123',
  correlationId: 'corr-123',
  error: 'Cliente não encontrado',
  duration: 50
});
```

---

## Integração com UseCases

### Exemplo de Integração

```javascript
const BridgeFactory = require('./bridges/BridgeFactory');
const BridgeContext = require('./bridges/BridgeContext');

class CriarConsignacaoUseCase {
  async execute(dados, context) {
    // Criar contexto
    const bridgeContext = BridgeContext.create({
      requestId: context.requestId,
      correlationId: context.correlationId,
      usuarioId: context.usuarioId,
      empresaId: context.empresaId,
      filialId: context.filialId,
      data: new Date(),
      operacao: 'CRIAR_CONSIGNACAO'
    });

    // Obter Bridges via Factory
    const clienteBridge = BridgeFactory.create('ClienteBridge', {
      httpClient: this.httpClient,
      logger: this.logger,
      eventPublisher: this.eventPublisher
    });

    const produtoBridge = BridgeFactory.create('ProdutoBridge', {
      httpClient: this.httpClient,
      logger: this.logger,
      eventPublisher: this.eventPublisher
    });

    // Validar cliente
    const clienteResult = await clienteBridge.validarCliente(dados.clienteId, bridgeContext);
    if (clienteResult.isFailure) {
      return Result.fail(clienteResult.getError());
    }

    // Validar produto
    const produtoResult = await produtoBridge.validarProduto(dados.produtoId, bridgeContext);
    if (produtoResult.isFailure) {
      return Result.fail(produtoResult.getError());
    }

    // Continuar com lógica de negócio...
  }
}
```

---

## Registro de Bridges

### Registro Inicial

```javascript
// bridges/index.js
const registry = require('./BridgeRegistry');
const ClienteBridge = require('./ClienteBridge');
const ProdutoBridge = require('./ProdutoBridge');
const EstoqueBridge = require('./EstoqueBridge');
const FinanceiroBridge = require('./FinanceiroBridge');
const UsuarioBridge = require('./UsuarioBridge');

// Registrar Bridges
registry.register('ClienteBridge', (deps) => new ClienteBridge(deps), {
  version: '1.0',
  targetMotor: 'motor-cliente'
});

registry.register('ProdutoBridge', (deps) => new ProdutoBridge(deps), {
  version: '1.0',
  targetMotor: 'motor-produto'
});

registry.register('EstoqueBridge', (deps) => new EstoqueBridge(deps), {
  version: '1.0',
  targetMotor: 'motor-produto/estoque'
});

registry.register('FinanceiroBridge', (deps) => new FinanceiroBridge(deps), {
  version: '1.0',
  targetMotor: 'motor-financeiro'
});

registry.register('UsuarioBridge', (deps) => new UsuarioBridge(deps), {
  version: '1.0',
  targetMotor: 'motor-usuario'
});

module.exports = { registry };
```

---

## Testes

### Testes Unitários

Todos os Bridges possuem testes unitários com mocks:

```bash
# Executar testes
npm test -- tests/unit/bridges.test.js
```

### Estrutura dos Testes

- **BridgeContext**: Testes de criação, validação e atualização
- **BridgeRegistry**: Testes de registro e consulta
- **BridgeFactory**: Testes de criação e disponibilidade
- **ClienteBridge**: Testes de todos os métodos com mocks
- **ProdutoBridge**: Testes de todos os métodos com mocks
- **EstoqueBridge**: Testes de todos os métodos com mocks
- **FinanceiroBridge**: Testes de todos os métodos com mocks
- **UsuarioBridge**: Testes de todos os métodos com mocks
- **Resiliência**: Testes de Retry, Circuit Breaker, Timeout, Fallback
- **Eventos**: Testes de publicação e assinatura

---

## Boas Práticas

### 1. Sempre Usar BridgeFactory

❌ **INCORRETO:**
```javascript
const bridge = new ClienteBridge(deps);
```

✅ **CORRETO:**
```javascript
const bridge = BridgeFactory.create('ClienteBridge', deps);
```

### 2. Sempre Passar BridgeContext

❌ **INCORRETO:**
```javascript
await bridge.validarCliente(clienteId);
```

✅ **CORRETO:**
```javascript
await bridge.validarCliente(clienteId, context);
```

### 3. Sempre Tratar Result

❌ **INCORRETO:**
```javascript
const cliente = await bridge.validarCliente(clienteId, context);
console.log(cliente.nome);
```

✅ **CORRETO:**
```javascript
const result = await bridge.validarCliente(clienteId, context);
if (result.isFailure) {
  return Result.fail(result.getError());
}
const cliente = result.getValue();
```

### 4. Sempre Usar CorrelationId

O `correlationId` deve ser propagado em todas as chamadas para rastreabilidade.

### 5. Nunca Lançar Exceções

Bridges devem sempre retornar `Result`, nunca lançar exceções para regras de negócio.

---

## Próximos Passos

### Integração Real

Substituir mocks por chamadas HTTP reais aos Motores:

```javascript
// Substituir mock por chamada real
const response = await this._httpClient.get(`/clientes/${clienteId}`, {
  headers: { 'X-Correlation-ID': context.correlationId }
});
```

### Configuração de Resiliência

Ajustar parâmetros de resiliência conforme necessidade:

```javascript
const chain = ResilienceChain.create({
  retryPolicy: RetryPolicy.create({
    maxRetries: 5,           // Aumentar para operações críticas
    initialDelay: 500,       // Reduzir para resposta mais rápida
    backoffMultiplier: 1.5    // Ajustar backoff
  }),
  circuitBreaker: CircuitBreaker.create({
    failureThreshold: 10,     // Aumentar threshold
    resetTimeout: 120000     // Aumentar timeout de reset
  })
});
```

### Eventos Distribuídos

Implementar publicação de eventos em message broker (RabbitMQ, Kafka):

```javascript
class DistributedEventPublisher {
  async publish(eventName, payload) {
    await this.messageBroker.publish('bridges.events', {
      eventName,
      payload,
      timestamp: new Date().toISOString()
    });
  }
}
```

---

## Critérios de Aceitação

✅ Todas as Bridges concretas existem  
✅ Nenhum UseCase acessa outro Motor diretamente  
✅ Toda comunicação ocorre por Bridge  
✅ BridgeFactory implementada  
✅ BridgeRegistry implementado  
✅ BridgeContext implementado  
✅ Result utilizado em todas as Bridges  
✅ Logs implementados  
✅ Testes passando  

---

## Conclusão

Ao final desta Sprint, o Motor Comercial está oficialmente integrado à Plataforma CDS através das Bridges. Todos os acessos a Clientes, Produtos, Estoque, Financeiro e Usuários ocorrem exclusivamente através das Bridges, garantindo:

- **Desacoplamento**: Motores evoluem independentemente
- **Resiliência**: Retry, Circuit Breaker, Timeout, Fallback
- **Rastreabilidade**: CorrelationId em todas as chamadas
- **Observabilidade**: Logs estruturados e eventos
- **Testabilidade**: Mocks facilitam testes unitários
