/**
 * Integration Tests for API Hardening Features
 *
 * Sprint 2.5.5: Hardening da API — testes de integração.
 *
 * @module motores/motor-comercial/tests/integration/hardening.test
 */

const request = require('supertest');
const express = require('express');

// Shared HTTP Infrastructure
const {
  RequestIdMiddleware,
  CorrelationIdMiddleware,
  ResponseEnricherMiddleware,
  ErrorHandlerMiddleware,
  LoggingMiddleware,
  IdempotencyMiddleware,
  RateLimitMiddleware,
  SecurityMiddleware
} = require('../../../../shared/http/middlewares');

const StandardResponse = require('../../../../shared/http/responses/StandardResponse');
const InMemoryIdempotencyStore = require('../../../../shared/http/idempotency/InMemoryIdempotencyStore');
const InMemoryRateLimitStore = require('../../../../shared/http/rate-limit/InMemoryRateLimitStore');
const ErrorCatalog = require('../../domain/errors/ErrorCatalog');

describe('API Hardening Integration Tests', () => {
  let app;
  let idempotencyStore;
  let rateLimitStore;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    idempotencyStore = new InMemoryIdempotencyStore();
    rateLimitStore = new InMemoryRateLimitStore();

    // Apply middlewares
    app.use(RequestIdMiddleware.create());
    app.use(CorrelationIdMiddleware.create());
    app.use(ResponseEnricherMiddleware.create());
    app.use(LoggingMiddleware.create());
    app.use(IdempotencyMiddleware.create({ store: idempotencyStore }));
    app.use(RateLimitMiddleware.create({ 
      store: rateLimitStore, 
      windowMs: 60000, 
      maxRequests: 100 
    }));

    // Test routes
    app.get('/test', (req, res) => {
      const response = StandardResponse.success({ message: 'test' });
      const enriched = StandardResponse.enrich(response, req);
      res.json(enriched);
    });

    app.post('/test', (req, res) => {
      const response = StandardResponse.success({ message: 'created' });
      const enriched = StandardResponse.enrich(response, req);
      res.status(201).json(enriched);
    });

    app.get('/error', (req, res, next) => {
      next(new Error('Test error'));
    });

    app.use(ErrorHandlerMiddleware.create());
  });

  afterEach(async () => {
    await idempotencyStore.clear();
    await rateLimitStore.clear();
  });

  describe('RequestIdMiddleware', () => {
    it('should generate requestId if not provided', async () => {
      const response = await request(app).get('/test');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.requestId).toBeDefined();
      expect(response.body.requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should use provided requestId', async () => {
      const customRequestId = 'custom-request-id-123';
      const response = await request(app)
        .get('/test')
        .set('X-Request-ID', customRequestId);

      expect(response.status).toBe(200);
      expect(response.body.requestId).toBe(customRequestId);
    });

    it('should return requestId in response header', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['x-request-id']).toBeDefined();
    });
  });

  describe('CorrelationIdMiddleware', () => {
    it('should generate correlationId if not provided', async () => {
      const response = await request(app).get('/test');

      expect(response.status).toBe(200);
      expect(response.body.correlationId).toBeDefined();
      expect(response.body.correlationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should use provided correlationId', async () => {
      const customCorrelationId = 'custom-correlation-id-123';
      const response = await request(app)
        .get('/test')
        .set('X-Correlation-ID', customCorrelationId);

      expect(response.status).toBe(200);
      expect(response.body.correlationId).toBe(customCorrelationId);
    });

    it('should return correlationId in response header', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['x-correlation-id']).toBeDefined();
    });
  });

  describe('StandardResponse', () => {
    it('should include standard response fields', async () => {
      const response = await request(app).get('/test');

      expect(response.body.success).toBe(true);
      expect(response.body.requestId).toBeDefined();
      expect(response.body.correlationId).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.version).toBeDefined();
      expect(response.body.data).toBeDefined();
    });

    it('should include timestamp in ISO format', async () => {
      const response = await request(app).get('/test');

      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('IdempotencyMiddleware', () => {
    it('should store result for POST requests with Idempotency-Key', async () => {
      const idempotencyKey = 'test-idempotency-key-123';
      const payload = { test: 'data' };

      const response1 = await request(app)
        .post('/test')
        .set('Idempotency-Key', idempotencyKey)
        .send(payload);

      expect(response1.status).toBe(201);
      expect(response1.body.data.message).toBe('created');

      const response2 = await request(app)
        .post('/test')
        .set('Idempotency-Key', idempotencyKey)
        .send({ different: 'payload' });

      expect(response2.status).toBe(201);
      expect(response2.body.data.message).toBe('created');
    });

    it('should work without Idempotency-Key', async () => {
      const response = await request(app)
        .post('/test')
        .send({ test: 'data' });

      expect(response.status).toBe(201);
    });
  });

  describe('RateLimitMiddleware', () => {
    it('should include rate limit headers', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });

    it('should decrement remaining requests', async () => {
      const response1 = await request(app).get('/test');
      const remaining1 = parseInt(response1.headers['x-ratelimit-remaining']);

      const response2 = await request(app).get('/test');
      const remaining2 = parseInt(response2.headers['x-ratelimit-remaining']);

      expect(remaining2).toBe(remaining1 - 1);
    });
  });

  describe('ErrorHandlerMiddleware', () => {
    it('should handle errors with standard response', async () => {
      const response = await request(app).get('/error');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBeDefined();
      expect(response.body.error.message).toBeDefined();
    });

    it('should include requestId in error response', async () => {
      const response = await request(app).get('/error');

      expect(response.body.requestId).toBeDefined();
    });

    it('should include correlationId in error response', async () => {
      const response = await request(app).get('/error');

      expect(response.body.correlationId).toBeDefined();
    });
  });

  describe('SecurityMiddleware', () => {
    let securityApp;

    beforeEach(() => {
      securityApp = express();
      securityApp.use(express.json());
      securityApp.use(SecurityMiddleware.cors());
      securityApp.use(SecurityMiddleware.helmet());
      securityApp.get('/test', (req, res) => {
        res.json({ message: 'test' });
      });
    });

    it('should include CORS headers', async () => {
      const response = await request(securityApp).get('/test');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should include security headers', async () => {
      const response = await request(securityApp).get('/test');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });
  });
});

describe('ErrorCatalog', () => {
  describe('Perfil Comercial Errors', () => {
    it('should have PERFIL_NAO_ENCONTRADO code', () => {
      expect(ErrorCatalog.PERFIL_NAO_ENCONTRADO).toBe('COMERCIAL-001');
    });

    it('should return message for PERFIL_NAO_ENCONTRADO', () => {
      const message = ErrorCatalog.getMessage('COMERCIAL-001');
      expect(message).toBe('Perfil comercial não encontrado');
    });

    it('should return 404 for PERFIL_NAO_ENCONTRADO', () => {
      const statusCode = ErrorCatalog.getHttpStatusCode('COMERCIAL-001');
      expect(statusCode).toBe(404);
    });

    it('should return 409 for PERFIL_DUPLICADO', () => {
      const statusCode = ErrorCatalog.getHttpStatusCode('COMERCIAL-002');
      expect(statusCode).toBe(409);
    });

    it('should return 403 for PERFIL_BLOQUEADO', () => {
      const statusCode = ErrorCatalog.getHttpStatusCode('COMERCIAL-003');
      expect(statusCode).toBe(403);
    });
  });

  describe('Consignação Errors', () => {
    it('should have CONSIGNACAO_NAO_ENCONTRADA code', () => {
      expect(ErrorCatalog.CONSIGNACAO_NAO_ENCONTRADA).toBe('COMERCIAL-100');
    });

    it('should return message for CONSIGNACAO_NAO_ENCONTRADA', () => {
      const message = ErrorCatalog.getMessage('COMERCIAL-100');
      expect(message).toBe('Consignação não encontrada');
    });

    it('should return 404 for CONSIGNACAO_NAO_ENCONTRADA', () => {
      const statusCode = ErrorCatalog.getHttpStatusCode('COMERCIAL-100');
      expect(statusCode).toBe(404);
    });
  });

  describe('General Errors', () => {
    it('should return message for unknown code', () => {
      const message = ErrorCatalog.getMessage('UNKNOWN-CODE');
      expect(message).toBe('Erro desconhecido');
    });

    it('should return 400 for unknown code', () => {
      const statusCode = ErrorCatalog.getHttpStatusCode('UNKNOWN-CODE');
      expect(statusCode).toBe(400);
    });

    it('should return all codes', () => {
      const codes = ErrorCatalog.getAllCodes();
      expect(codes.length).toBeGreaterThan(0);
      expect(codes).toContain('COMERCIAL-001');
      expect(codes).toContain('COMERCIAL-100');
    });
  });
});

describe('ValidationPipeline', () => {
  const ValidationPipeline = require('../../../../shared/http/validation/ValidationPipeline');

  describe('required validation', () => {
    it('should fail when required field is missing', () => {
      const pipeline = ValidationPipeline.create().required(['name', 'email']);
      const errors = pipeline.validate({ name: 'test' });

      expect(errors).toBeDefined();
      expect(errors.length).toBe(1);
      expect(errors[0].field).toBe('email');
      expect(errors[0].code).toBe('REQUIRED');
    });

    it('should pass when all required fields are present', () => {
      const pipeline = ValidationPipeline.create().required(['name', 'email']);
      const errors = pipeline.validate({ name: 'test', email: 'test@example.com' });

      expect(errors).toBeNull();
    });
  });

  describe('type validation', () => {
    it('should fail when type is incorrect', () => {
      const pipeline = ValidationPipeline.create().type('age', 'number');
      const errors = pipeline.validate({ age: 'not a number' });

      expect(errors).toBeDefined();
      expect(errors[0].field).toBe('age');
      expect(errors[0].code).toBe('INVALID_TYPE');
    });

    it('should pass when type is correct', () => {
      const pipeline = ValidationPipeline.create().type('age', 'number');
      const errors = pipeline.validate({ age: 25 });

      expect(errors).toBeNull();
    });

    it('should validate email type', () => {
      const pipeline = ValidationPipeline.create().type('email', 'email');
      const errors = pipeline.validate({ email: 'invalid-email' });

      expect(errors). notBeNull();
    });
  });

  describe('length validation', () => {
    it('should fail when string is too short', () => {
      const pipeline = ValidationPipeline.create().length('name', { min: 3 });
      const errors = pipeline.validate({ name: 'ab' });

      expect(errors).toBeDefined();
      expect(errors[0].code).toBe('MIN_LENGTH');
    });

    it('should fail when string is too long', () => {
      const pipeline = ValidationPipeline.create().length('name', { max: 10 });
      const errors = pipeline.validate({ name: 'very long name' });

      expect(errors).toBeDefined();
      expect(errors[0].code).toBe('MAX_LENGTH');
    });
  });

  describe('range validation', () => {
    it('should fail when value is below minimum', () => {
      const pipeline = ValidationPipeline.create().range('age', { min: 18 });
      const errors = pipeline.validate({ age: 15 });

      expect(errors).toBeDefined();
      expect(errors[0].code).toBe('MIN_VALUE');
    });

    it('should fail when value is above maximum', () => {
      const pipeline = ValidationPipeline.create().range('age', { max: 65 });
      const errors = pipeline.validate({ age: 70 });

      expect(errors).toBeDefined();
      expect(errors[0].code).toBe('MAX_VALUE');
    });
  });

  describe('enum validation', () => {
    it('should fail when value is not in enum', () => {
      const pipeline = ValidationPipeline.create().enum('status', ['active', 'inactive']);
      const errors = pipeline.validate({ status: 'pending' });

      expect(errors).toBeDefined();
      expect(errors[0].code).toBe('INVALID_ENUM');
    });

    it('should pass when value is in enum', () => {
      const pipeline = ValidationPipeline.create().enum('status', ['active', 'inactive']);
      const errors = pipeline.validate({ status: 'active' });

      expect(errors).toBeNull();
    });
  });

  describe('chained validations', () => {
    it('should run multiple validations', () => {
      const pipeline = ValidationPipeline.create()
        .required(['name', 'age'])
        .type('age', 'number')
        .range('age', { min: 18, max: 65 });

      const errors = pipeline.validate({ name: 'test', age: 15 });

      expect(errors).toBeDefined();
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});

describe('MetricsService', () => {
  const MetricsService = require('../../../../shared/http/metrics/MetricsService');

  let metrics;

  beforeEach(() => {
    metrics = MetricsService.create({ enabled: true, includeMemory: true });
  });

  afterEach(() => {
    metrics.reset();
  });

  it('should increment counter', () => {
    metrics.increment('test_counter', 1);
    const data = metrics.getMetrics();

    expect(data.counters['test_counter']).toBe(1);
  });

  it('should set gauge', () => {
    metrics.gauge('test_gauge', 42);
    const data = metrics.getMetrics();

    expect(data.gauges['test_gauge']).toBe(42);
  });

  it('should record histogram', () => {
    metrics.histogram('test_histogram', 100);
    metrics.histogram('test_histogram', 200);
    const data = metrics.getMetrics();

    expect(data.histograms['test_histogram']).toBeDefined();
    expect(data.histograms['test_histogram'].count).toBe(2);
    expect(data.histograms['test_histogram'].sum).toBe(300);
  });

  it('should work with timer', () => {
    const stopTimer = metrics.timer('test_timer');
    setTimeout(() => stopTimer(), 10);

    const data = metrics.getMetrics();
    expect(data.histograms['test_timer']).toBeDefined();
  });

  it('should include memory metrics', () => {
    const data = metrics.getMetrics();

    expect(data.memory).toBeDefined();
    expect(data.memory.heapUsed).toBeDefined();
    expect(data.memory.heapTotal).toBeDefined();
  });

  it('should generate prometheus format', () => {
    metrics.increment('test_counter', 1);
    const prometheus = metrics.getPrometheusMetrics();

    expect(prometheus).toContain('# TYPE test_counter counter');
    expect(prometheus).toContain('test_counter');
  });

  it('should reset metrics', () => {
    metrics.increment('test_counter', 1);
    metrics.reset();
    const data = metrics.getMetrics();

    expect(Object.keys(data.counters).length).toBe(0);
  });
});

describe('HttpAuditService', () => {
  const HttpAuditService = require('../../../../shared/http/audit/HttpAuditService');

  let auditService;

  beforeEach(() => {
    auditService = HttpAuditService.create({ enabled: true, logRequestBody: false, logResponseBody: false });
  });

  afterEach(async () => {
    await auditService.clear();
  });

  it('should store audit record', async () => {
    const req = {
      requestId: 'test-req-id',
      correlationId: 'test-corr-id',
      usuarioId: 'user-123',
      method: 'GET',
      path: '/test',
      query: {},
      headers: { 'user-agent': 'test' },
      ip: '127.0.0.1',
      body: {}
    };

    const res = {
      statusCode: 200,
      body: {}
    };

    await auditService.audit(req, res, 100);

    const record = await auditService.findByRequestId('test-req-id');
    expect(record).toBeDefined();
    expect(record.requestId).toBe('test-req-id');
  });

  it('should find by correlationId', async () => {
    const req = {
      requestId: 'test-req-id',
      correlationId: 'test-corr-id',
      usuarioId: 'user-123',
      method: 'GET',
      path: '/test',
      query: {},
      headers: {},
      ip: '127.0.0.1',
      body: {}
    };

    const res = {
      statusCode: 200,
      body: {}
    };

    await auditService.audit(req, res, 100);

    const records = await auditService.findByCorrelationId('test-corr-id');
    expect(records.length).toBeGreaterThan(0);
  });

  it('should find by usuario', async () => {
    const req = {
      requestId: 'test-req-id',
      correlationId: 'test-corr-id',
      usuarioId: 'user-123',
      method: 'GET',
      path: '/test',
      query: {},
      headers: {},
      ip: '127.0.0.1',
      body: {}
    };

    const res = {
      statusCode: 200,
      body: {}
    };

    await auditService.audit(req, res, 100);

    const records = await auditService.findByUsuario('user-123');
    expect(records.length).toBeGreaterThan(0);
  });

  it('should sanitize sensitive headers', async () => {
    const auditService = HttpAuditService.create({ 
      enabled: true, 
      logRequestBody: false, 
      logResponseBody: false,
      sensitiveHeaders: ['authorization']
    });

    const req = {
      requestId: 'test-req-id',
      correlationId: 'test-corr-id',
      usuarioId: 'user-123',
      method: 'GET',
      path: '/test',
      query: {},
      headers: { 'authorization': 'Bearer secret-token' },
      ip: '127.0.0.1',
      body: {}
    };

    const res = {
      statusCode: 200,
      body: {}
    };

    await auditService.audit(req, res, 100);

    const record = await auditService.findByRequestId('test-req-id');
    expect(record.headers.authorization).toBe('***REDACTED***');
  });
});
