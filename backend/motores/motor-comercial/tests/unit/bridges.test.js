/**
 * Unit Tests for Bridges
 *
 * Sprint 2.6: Bridges Oficiais — testes unitários com mocks.
 *
 * @module motores/motor-comercial/tests/unit/bridges.test
 */

const BridgeContext = require('../../bridges/BridgeContext');
const BridgeRegistry = require('../../bridges/BridgeRegistry');
const BridgeFactory = require('../../bridges/BridgeFactory');
const ClienteBridge = require('../../bridges/ClienteBridge');
const ProdutoBridge = require('../../bridges/ProdutoBridge');
const EstoqueBridge = require('../../bridges/EstoqueBridge');
const FinanceiroBridge = require('../../bridges/FinanceiroBridge');
const UsuarioBridge = require('../../bridges/UsuarioBridge');
const { RetryPolicy, CircuitBreaker, TimeoutPolicy, FallbackPolicy, ResilienceChain } = require('../../bridges/resilience');
const { EventPublisher, EventTypes } = require('../../bridges/events');

describe('BridgeContext', () => {
  describe('create', () => {
    it('should create context with all fields', () => {
      const context = BridgeContext.create({
        requestId: 'req-123',
        correlationId: 'corr-123',
        usuarioId: 'user-123',
        usuarioNome: 'Test User',
        empresaId: 'emp-123',
        filialId: 'fil-123',
        data: new Date('2024-01-01'),
        operacao: 'TEST',
        metadata: { key: 'value' }
      });

      expect(context.requestId).toBe('req-123');
      expect(context.correlationId).toBe('corr-123');
      expect(context.usuarioId).toBe('user-123');
      expect(context.usuarioNome).toBe('Test User');
      expect(context.empresaId).toBe('emp-123');
      expect(context.filialId).toBe('fil-123');
      expect(context.data).toEqual(new Date('2024-01-01'));
      expect(context.operacao).toBe('TEST');
      expect(context.metadata).toEqual({ key: 'value' });
    });

    it('should create context with defaults', () => {
      const context = BridgeContext.create({
        correlationId: 'corr-123',
        usuarioId: 'user-123'
      });

      expect(context.requestId).toBeNull();
      expect(context.correlationId).toBe('corr-123');
      expect(context.usuarioId).toBe('user-123');
      expect(context.data).toBeInstanceOf(Date);
      expect(context.operacao).toBeNull();
      expect(context.metadata).toEqual({});
    });
  });

  describe('with', () => {
    it('should create new context with updated values', () => {
      const context = BridgeContext.create({
        correlationId: 'corr-123',
        usuarioId: 'user-123'
      });

      const updated = context.with({ operacao: 'NEW_OP' });

      expect(context.operacao).toBeNull();
      expect(updated.operacao).toBe('NEW_OP');
      expect(updated.correlationId).toBe('corr-123');
    });
  });

  describe('toJSON', () => {
    it('should convert to JSON', () => {
      const context = BridgeContext.create({
        correlationId: 'corr-123',
        usuarioId: 'user-123'
      });

      const json = context.toJSON();

      expect(json.correlationId).toBe('corr-123');
      expect(json.usuarioId).toBe('user-123');
      expect(json.data).toBeDefined();
    });
  });

  describe('fromJSON', () => {
    it('should create context from JSON', () => {
      const json = {
        correlationId: 'corr-123',
        usuarioId: 'user-123',
        data: '2024-01-01T00:00:00.000Z'
      };

      const context = BridgeContext.fromJSON(json);

      expect(context.correlationId).toBe('corr-123');
      expect(context.usuarioId).toBe('user-123');
      expect(context.data).toEqual(new Date('2024-01-01T00:00:00.000Z'));
    });
  });

  describe('isValid', () => {
    it('should return true for valid context', () => {
      const context = BridgeContext.create({
        correlationId: 'corr-123',
        usuarioId: 'user-123'
      });

      expect(context.isValid()).toBe(true);
    });

    it('should return false for invalid context', () => {
      const context = BridgeContext.create({
        correlationId: null,
        usuarioId: null
      });

      expect(context.isValid()).toBe(false);
    });
  });

  describe('getValidationErrors', () => {
    it('should return errors for missing fields', () => {
      const context = BridgeContext.create({
        correlationId: null,
        usuarioId: null
      });

      const errors = context.getValidationErrors();

      expect(errors).toContain('correlationId é obrigatório');
      expect(errors).toContain('usuarioId é obrigatório');
    });
  });
});

describe('BridgeRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = new BridgeRegistry();
  });

  afterEach(() => {
    registry.clear();
  });

  describe('register', () => {
    it('should register a bridge', () => {
      const factory = () => ({ name: 'test' });
      registry.register('TestBridge', factory, { version: '1.0' });

      expect(registry.has('TestBridge')).toBe(true);
      expect(registry.getMetadata('TestBridge')).toEqual({ version: '1.0' });
    });

    it('should throw when registering duplicate', () => {
      const factory = () => ({ name: 'test' });
      registry.register('TestBridge', factory);

      expect(() => {
        registry.register('TestBridge', factory);
      }).toThrow('Bridge TestBridge já registrada');
    });
  });

  describe('get', () => {
    it('should return factory for registered bridge', () => {
      const factory = () => ({ name: 'test' });
      registry.register('TestBridge', factory);

      expect(registry.get('TestBridge')).toBe(factory);
    });

    it('should return null for unregistered bridge', () => {
      expect(registry.get('NonExistent')).toBeNull();
    });
  });

  describe('has', () => {
    it('should return true for registered bridge', () => {
      const factory = () => ({ name: 'test' });
      registry.register('TestBridge', factory);

      expect(registry.has('TestBridge')).toBe(true);
    });

    it('should return false for unregistered bridge', () => {
      expect(registry.has('NonExistent')).toBe(false);
    });
  });

  describe('unregister', () => {
    it('should remove registered bridge', () => {
      const factory = () => ({ name: 'test' });
      registry.register('TestBridge', factory);

      const result = registry.unregister('TestBridge');

      expect(result).toBe(true);
      expect(registry.has('TestBridge')).toBe(false);
    });

    it('should return false for unregistered bridge', () => {
      const result = registry.unregister('NonExistent');

      expect(result).toBe(false);
    });
  });

  describe('list', () => {
    it('should list all registered bridges', () => {
      registry.register('Bridge1', () => ({}));
      registry.register('Bridge2', () => ({}));

      const bridges = registry.list();

      expect(bridges).toContain('Bridge1');
      expect(bridges).toContain('Bridge2');
    });
  });

  describe('listWithMetadata', () => {
    it('should list bridges with metadata', () => {
      registry.register('Bridge1', () => ({}), { version: '1.0' });
      registry.register('Bridge2', () => ({}), { version: '2.0' });

      const bridges = registry.listWithMetadata();

      expect(bridges).toHaveLength(2);
      expect(bridges[0].name).toBe('Bridge1');
      expect(bridges[0].metadata).toEqual({ version: '1.0' });
    });
  });
});

describe('BridgeFactory', () => {
  beforeEach(() => {
    const registry = require('../../bridges/BridgeRegistry');
    registry.clear();
  });

  describe('create', () => {
    it('should create bridge instance', () => {
      const registry = require('../../bridges/BridgeRegistry');
      registry.register('TestBridge', (deps) => ({ ...deps, name: 'TestBridge' }));

      const bridge = BridgeFactory.create('TestBridge', { httpClient: {} });

      expect(bridge.name).toBe('TestBridge');
      expect(bridge.httpClient).toBeDefined();
    });

    it('should throw for unregistered bridge', () => {
      expect(() => {
        BridgeFactory.create('NonExistent');
      }).toThrow('Bridge NonExistent não encontrada no registro');
    });
  });

  describe('isAvailable', () => {
    it('should return true for available bridge', () => {
      const registry = require('../../bridges/BridgeRegistry');
      registry.register('TestBridge', () => ({}));

      expect(BridgeFactory.isAvailable('TestBridge')).toBe(true);
    });

    it('should return false for unavailable bridge', () => {
      expect(BridgeFactory.isAvailable('NonExistent')).toBe(false);
    });
  });
});

describe('ClienteBridge', () => {
  let bridge;
  let mockLogger;
  let mockHttpClient;
  let mockEventPublisher;
  let context;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn()
    };
    mockHttpClient = {
      get: jest.fn()
    };
    mockEventPublisher = {
      publish: jest.fn()
    };
    context = BridgeContext.create({
      correlationId: 'corr-123',
      usuarioId: 'user-123',
      requestId: 'req-123'
    });

    bridge = new ClienteBridge({
      httpClient: mockHttpClient,
      logger: mockLogger,
      eventPublisher: mockEventPublisher
    });
  });

  describe('validarCliente', () => {
    it('should validate valid client', async () => {
      const result = await bridge.validarCliente('cliente-123', context);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual({ id: 'cliente-123', ativo: true });
      expect(mockLogger.info).toHaveBeenCalledWith('ClienteBridge.validarCliente', expect.any(Object));
      expect(mockLogger.info).toHaveBeenCalledWith('ClienteBridge.validarCliente - Sucesso', expect.any(Object));
    });

    it('should fail for invalid client', async () => {
      const result = await bridge.validarCliente('invalid', context);

      expect(result.isFailure).toBe(true);
      expect(mockLogger.error).toHaveBeenCalledWith('ClienteBridge.validarCliente - Erro', expect.any(Object));
    });
  });

  describe('consultarCliente', () => {
    it('should consult client', async () => {
      const result = await bridge.consultarCliente('cliente-123', context);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().id).toBe('cliente-123');
      expect(result.getValue().nome).toBe('Cliente Mock');
    });
  });

  describe('consultarSituacao', () => {
    it('should consult situation', async () => {
      const result = await bridge.consultarSituacao('cliente-123', context);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().situacao).toBe('ATIVO');
      expect(result.getValue().score).toBe(750);
    });
  });

  describe('consultarBloqueios', () => {
    it('should consult blocks', async () => {
      const result = await bridge.consultarBloqueios('cliente-123', context);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual([]);
    });
  });

  describe('consultarDadosCadastrais', () => {
    it('should consult cadastre', async () => {
      const result = await bridge.consultarDadosCadastrais('cliente-123', context);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().clienteId).toBe('cliente-123');
      expect(result.getValue().nome).toBe('Cliente Mock');
    });
  });
});

describe('ProdutoBridge', () => {
  let bridge;
  let mockLogger;
  let mockEventPublisher;
  let context;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn()
    };
    mockEventPublisher = {
      publish: jest.fn()
    };
    context = BridgeContext.create({
      correlationId: 'corr-123',
      usuarioId: 'user-123',
      requestId: 'req-123'
    });

    bridge = new ProdutoBridge({
      httpClient: {},
      logger: mockLogger,
      eventPublisher: mockEventPublisher
    });
  });

  describe('validarProduto', () => {
    it('should validate valid product', async () => {
      const result = await bridge.validarProduto('produto-123', context);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual({ id: 'produto-123', ativo: true });
    });

    it('should fail for invalid product', async () => {
      const result = await bridge.validarProduto('invalid', context);

      expect(result.isFailure).toBe(true);
    });
  });

  describe('consultarProduto', () => {
    it('should consult product', async () => {
      const result = await bridge.consultarProduto('produto-123', context);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().id).toBe('produto-123');
      expect(result.getValue().nome).toBe('Produto Mock');
    });
  });

  describe('consultarPreco', () => {
    it('should consult price', async () => {
      const result = await bridge.consultarPreco('produto-123', 'PADRAO', context);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().precoVenda).toBe(100.00);
    });
  });
});

describe('EstoqueBridge', () => {
  let bridge;
  let mockLogger;
  let mockEventPublisher;
  let context;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn()
    };
    mockEventPublisher = {
      publish: jest.fn()
    };
    context = BridgeContext.create({
      correlationId: 'corr-123',
      usuarioId: 'user-123',
      requestId: 'req-123'
    });

    bridge = new EstoqueBridge({
      httpClient: {},
      logger: mockLogger,
      eventPublisher: mockEventPublisher
    });
  });

  describe('registrarSaidaConsignacao', () => {
    it('should register exit', async () => {
      const dados = {
        produtoId: 'prod-123',
        quantidade: 10,
        consignacaoId: 'cons-123',
        filialId: 'fil-123'
      };

      const result = await bridge.registrarSaidaConsignacao(dados, context);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().tipo).toBe('SAIDA');
      expect(result.getValue().motivo).toBe('CONSIGNACAO');
      expect(mockEventPublisher.publish).toHaveBeenCalledWith('EstoqueAtualizado', expect.any(Object));
    });
  });

  describe('registrarEntradaDevolucao', () => {
    it('should register entry', async () => {
      const dados = {
        produtoId: 'prod-123',
        quantidade: 10,
        consignacaoId: 'cons-123',
        filialId: 'fil-123'
      };

      const result = await bridge.registrarEntradaDevolucao(dados, context);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().tipo).toBe('ENTRADA');
      expect(result.getValue().motivo).toBe('DEVOLUCAO');
    });
  });

  describe('registrarTransferencia', () => {
    it('should register transfer', async () => {
      const dados = {
        produtoId: 'prod-123',
        quantidade: 10,
        consignacaoOrigemId: 'cons-123',
        consignacaoDestinoId: 'cons-456',
        filialId: 'fil-123'
      };

      const result = await bridge.registrarTransferencia(dados, context);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().tipo).toBe('TRANSFERENCIA');
      expect(mockEventPublisher.publish).toHaveBeenCalledWith('EstoqueTransferido', expect.any(Object));
    });
  });

  describe('consultarSaldo', () => {
    it('should consult balance', async () => {
      const result = await bridge.consultarSaldo('prod-123', 'fil-123', context);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().quantidadeDisponivel).toBe(100);
    });
  });
});

describe('FinanceiroBridge', () => {
  let bridge;
  let mockLogger;
  let mockEventPublisher;
  let context;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn()
    };
    mockEventPublisher = {
      publish: jest.fn()
    };
    context = BridgeContext.create({
      correlationId: 'corr-123',
      usuarioId: 'user-123',
      requestId: 'req-123'
    });

    bridge = new FinanceiroBridge({
      httpClient: {},
      logger: mockLogger,
      eventPublisher: mockEventPublisher
    });
  });

  describe('registrarReceita', () => {
    it('should register revenue', async () => {
      const dados = {
        clienteId: 'cli-123',
        valor: 100.00,
        consignacaoId: 'cons-123',
        tipo: 'V'
      };

      const result = await bridge.registrarReceita(dados, context);

      expect(result.isSuccess).toBe(true);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith('FinanceiroLancado', expect.any(Object));
    });
  });

  describe('registrarPagamento', () => {
    it('should register payment', async () => {
      const dados = {
        clienteId: 'cli-123',
        valor: 50.00,
        consignacaoId: 'cons-123',
        formaPagamento: 'DINHEIRO'
      };

      const result = await bridge.registrarPagamento(dados, context);

      expect(result.isSuccess).toBe(true);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith('PagamentoRegistrado', expect.any(Object));
    });
  });

  describe('registrarPerda', () => {
    it('should register loss', async () => {
      const dados = {
        clienteId: 'cli-123',
        valor: 25.00,
        consignacaoId: 'cons-123',
        motivo: 'Avaria'
      };

      const result = await bridge.registrarPerda(dados, context);

      expect(result.isSuccess).toBe(true);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith('PerdaRegistrada', expect.any(Object));
    });
  });

  describe('consultarSaldo', () => {
    it('should consult financial balance', async () => {
      const result = await bridge.consultarSaldo('cli-123', context);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().saldoTotal).toBe(500.00);
    });
  });
});

describe('UsuarioBridge', () => {
  let bridge;
  let mockLogger;
  let mockEventPublisher;
  let context;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn()
    };
    mockEventPublisher = {
      publish: jest.fn()
    };
    context = BridgeContext.create({
      correlationId: 'corr-123',
      usuarioId: 'user-123',
      requestId: 'req-123'
    });

    bridge = new UsuarioBridge({
      httpClient: {},
      logger: mockLogger,
      eventPublisher: mockEventPublisher
    });
  });

  describe('validarUsuario', () => {
    it('should validate valid user', async () => {
      const result = await bridge.validarUsuario('user-123', context);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual({ id: 'user-123', ativo: true });
    });

    it('should fail for invalid user', async () => {
      const result = await bridge.validarUsuario('invalid', context);

      expect(result.isFailure).toBe(true);
    });
  });

  describe('validarPermissao', () => {
    it('should validate permission', async () => {
      const result = await bridge.validarPermissao('user-123', 'VENDER', context);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().autorizado).toBe(true);
    });

    it('should deny admin permission', async () => {
      const result = await bridge.validarPermissao('user-123', 'ADMIN', context);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().autorizado).toBe(false);
    });
  });

  describe('validarAutorizacaoGerencial', () => {
    it('should validate authorization', async () => {
      const result = await bridge.validarAutorizacaoGerencial('user-123', 'APROVAR_LIMITE', context);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().autorizado).toBe(true);
    });
  });

  describe('consultarOperador', () => {
    it('should consult operator', async () => {
      const result = await bridge.consultarOperador('user-123', context);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().nome).toBe('Operador Mock');
      expect(result.getValue().cargo).toBe('OPERADOR');
    });
  });
});

describe('RetryPolicy', () => {
  describe('execute', () => {
    it('should succeed on first attempt', async () => {
      const policy = RetryPolicy.create({ maxRetries: 3 });
      const fn = jest.fn().mockResolvedValue('success');

      const result = await policy.execute(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const policy = RetryPolicy.create({ maxRetries: 3, initialDelay: 10 });
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValue('success');

      const result = await policy.execute(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      const policy = RetryPolicy.create({ maxRetries: 2, initialDelay: 10 });
      const fn = jest.fn().mockRejectedValue(new Error('network error'));

      await expect(policy.execute(fn)).rejects.toThrow('network error');
      expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
    });
  });
});

describe('CircuitBreaker', () => {
  describe('execute', () => {
    it('should execute when closed', async () => {
      const cb = CircuitBreaker.create({ failureThreshold: 3 });
      const fn = jest.fn().mockResolvedValue('success');

      const result = await cb.execute(fn);

      expect(result).toBe('success');
      expect(cb.getState()).toBe('CLOSED');
    });

    it('should open after threshold failures', async () => {
      const cb = CircuitBreaker.create({ failureThreshold: 2 });
      const fn = jest.fn().mockRejectedValue(new Error('error'));

      await expect(cb.execute(fn)).rejects.toThrow();
      await expect(cb.execute(fn)).rejects.toThrow();

      expect(cb.getState()).toBe('OPEN');
    });

    it('should reject when open', async () => {
      const cb = CircuitBreaker.create({ failureThreshold: 2 });
      const fn = jest.fn().mockRejectedValue(new Error('error'));

      await expect(cb.execute(fn)).rejects.toThrow();
      await expect(cb.execute(fn)).rejects.toThrow();

      await expect(cb.execute(fn)).rejects.toThrow('Circuit breaker is OPEN');
      expect(fn).toHaveBeenCalledTimes(2); // Should not call when open
    });
  });

  describe('getStats', () => {
    it('should return stats', () => {
      const cb = CircuitBreaker.create({ failureThreshold: 3 });
      const stats = cb.getStats();

      expect(stats.state).toBe('CLOSED');
      expect(stats.failureCount).toBe(0);
    });
  });
});

describe('TimeoutPolicy', () => {
  describe('complete', () => {
    it('should complete before timeout', async () => {
      const policy = TimeoutPolicy.create({ timeout: 1000 });
      const fn = jest.fn().mockResolvedValue('success');

      const result = await policy.execute(fn);

      expect(result).toBe('success');
    });

    it('should timeout after delay', async () => {
      const policy = TimeoutPolicy.create({ timeout: 10 });
      const fn = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('success'), 100)));

      await expect(policy.execute(fn)).rejects.toThrow('Operation timed out');
    });
  });
});

describe('FallbackPolicy', () => {
  describe('execute', () => {
    it('should use fallback on failure', async () => {
      const fallbackFn = jest.fn().mockResolvedValue('fallback');
      const policy = FallbackPolicy.create({ fallbackFn });
      const fn = jest.fn().mockRejectedValue(new Error('error'));

      const result = await policy.execute(fn);

      expect(result).toBe('fallback');
      expect(fallbackFn).toHaveBeenCalled();
    });

    it('should not use fallback on success', async () => {
      const fallbackFn = jest.fn().mockResolvedValue('fallback');
      const policy = FallbackPolicy.create({ fallbackFn });
      const fn = jest.fn().mockResolvedValue('success');

      const result = await policy.execute(fn);

      expect(result).toBe('success');
      expect(fallbackFn).not.toHaveBeenCalled();
    });
  });
});

describe('ResilienceChain', () => {
  describe('execute', () => {
    it('should apply all policies', async () => {
      const chain = ResilienceChain.create({
        timeoutPolicy: TimeoutPolicy.create({ timeout: 1000 }),
        circuitBreaker: CircuitBreaker.create({ failureThreshold: 3 }),
        retryPolicy: RetryPolicy.create({ maxRetries: 2, initialDelay: 10 })
      });

      const fn = jest.fn().mockResolvedValue('success');
      const result = await chain.execute(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});

describe('EventPublisher', () => {
  let publisher;

  beforeEach(() => {
    publisher = EventPublisher.create();
  });

  describe('publish', () => {
    it('should publish event', async () => {
      const handler = jest.fn();
      publisher.subscribe('TestEvent', handler);

      await publisher.publish('TestEvent', { data: 'test', correlationId: 'corr-123' });

      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        eventName: 'TestEvent',
        payload: { data: 'test', correlationId: 'corr-123' }
      }));
    });

    it('should add to history', async () => {
      await publisher.publish('TestEvent', { correlationId: 'corr-123' });

      const history = publisher.getHistory();

      expect(history).toHaveLength(1);
      expect(history[0].eventName).toBe('TestEvent');
    });
  });

  describe('subscribe', () => {
    it('should subscribe to event', async () => {
      const handler = jest.fn();
      publisher.subscribe('TestEvent', handler);

      await publisher.publish('TestEvent', { correlationId: 'corr-123' });

      expect(handler).toHaveBeenCalled();
    });

    it('should return unsubscribe function', () => {
      const handler = jest.fn();
      const unsubscribe = publisher.subscribe('TestEvent', handler);

      unsubscribe();

      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('getHistory', () => {
    it('should filter by event name', async () => {
      await publisher.publish('Event1', { correlationId: 'corr-123' });
      await publisher.publish('Event2', { correlationId: 'corr-123' });
      await publisher.publish('Event1', { correlationId: 'corr-456' });

      const history = publisher.getHistory({ eventName: 'Event1' });

      expect(history).toHaveLength(2);
      expect(history.every(e => e.eventName === 'Event1')).toBe(true);
    });

    it('should filter by correlationId', async () => {
      await publisher.publish('Event1', { correlationId: 'corr-123' });
      await publisher.publish('Event1', { correlationId: 'corr-456' });

      const history = publisher.getHistory({ correlationId: 'corr-123' });

      expect(history).toHaveLength(1);
      expect(history[0].correlationId).toBe('corr-123');
    });
  });
});

describe('EventTypes', () => {
  describe('getAllTypes', () => {
    it('should return all event types', () => {
      const types = EventTypes.getAllTypes();

      expect(types).toContain('EstoqueAtualizado');
      expect(types).toContain('FinanceiroLancado');
      expect(types).toContain('PagamentoRegistrado');
    });
  });

  describe('isValid', () => {
    it('should validate event type', () => {
      expect(EventTypes.isValid('EstoqueAtualizado')).toBe(true);
      expect(EventTypes.isValid('InvalidEvent')).toBe(false);
    });
  });
});
