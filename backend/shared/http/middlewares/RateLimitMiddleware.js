/**
 * RateLimitMiddleware — Middleware para rate limiting de requisições.
 *
 * Sprint 2.5.5: Hardening da API — rate limiting.
 *
 * @module backend/shared/http/middlewares/RateLimitMiddleware
 */

const StandardResponse = require('../responses/StandardResponse');
const InMemoryRateLimitStore = require('../rate-limit/InMemoryRateLimitStore');

class RateLimitMiddleware {
  /**
   * Cria middleware de rate limiting.
   * @param {Object} [options]
   * @param {IRateLimitStore} [options.store] - Armazenamento de rate limiting
   * @param {number} [options.windowMs] - Janela de tempo em ms (padrão: 60000 = 1 minuto)
   * @param {number} [options.maxRequests] - Máximo de requisições por janela (padrão: 100)
   * @param {string} [options.keyGenerator] - Função geradora de chave (padrão: por IP)
   * @param {boolean} [options.skipSuccessfulRequests] - Pular requisições bem-sucedidas (padrão: false)
   * @param {number} [options.blockDurationMs] - Duração do bloqueio ao exceder (padrão: 0 = sem bloqueio)
   * @returns {Function}
   */
  static create(options = {}) {
    const store = options.store || new InMemoryRateLimitStore();
    const windowMs = options.windowMs || 60000;
    const maxRequests = options.maxRequests || 100;
    const keyGenerator = options.keyGenerator || this._defaultKeyGenerator;
    const skipSuccessfulRequests = options.skipSuccessfulRequests || false;
    const blockDurationMs = options.blockDurationMs || 0;

    return async (req, res, next) => {
      const key = keyGenerator(req);

      // Verifica se está bloqueado
      const blocked = await store.isBlocked(key);
      if (blocked) {
        const response = StandardResponse.tooManyRequests('Limite de requisições excedido - bloqueado temporariamente');
        const enriched = StandardResponse.enrich(response, req);
        return res.status(StandardResponse.getStatusCode(response)).json(enriched);
      }

      // Incrementa contador
      const current = await store.increment(key, windowMs);

      // Verifica se excedeu o limite
      if (current > maxRequests) {
        if (blockDurationMs > 0) {
          await store.block(key, blockDurationMs);
        }

        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', new Date(Date.now() + windowMs).toISOString());

        const response = StandardResponse.tooManyRequests('Limite de requisições excedido');
        const enriched = StandardResponse.enrich(response, req);
        return res.status(StandardResponse.getStatusCode(response)).json(enriched);
      }

      // Adiciona headers de rate limit
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - current);
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + windowMs).toISOString());

      // Intercepta resposta para decrementar se configurado
      if (skipSuccessfulRequests) {
        const originalSend = res.send;
        res.send = function (data) {
          if (res.statusCode < 400) {
            store.reset(key).catch(err => {
              console.error('Erro ao resetar contador de rate limit:', err);
            });
          }
          return originalSend.call(this, data);
        };
      }

      next();
    };
  }

  /**
   * Gerador de chave padrão (por IP).
   * @private
   */
  static _defaultKeyGenerator(req) {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  /**
   * Gerador de chave por usuário.
   * @param {string} userIdExtractor - Função para extrair userId do req
   * @returns {Function}
   */
  static byUser(userIdExtractor) {
    return (req) => {
      const userId = userIdExtractor(req);
      return userId ? `user:${userId}` : 'unknown';
    };
  }

  /**
   * Gerador de chave por rota.
   * @returns {Function}
   */
  static byRoute() {
    return (req) => {
      return `${req.method}:${req.path}`;
    };
  }

  /**
   * Gerador de chave combinada (IP + rota).
   * @returns {Function}
   */
  static byIpAndRoute() {
    return (req) => {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      return `${ip}:${req.method}:${req.path}`;
    };
  }
}

module.exports = RateLimitMiddleware;
