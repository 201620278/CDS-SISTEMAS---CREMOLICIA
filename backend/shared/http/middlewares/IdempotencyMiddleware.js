/**
 * IdempotencyMiddleware — Middleware para idempotência de requisições.
 *
 * Sprint 2.5.5: Hardening da API — idempotência.
 *
 * @module backend/shared/http/middlewares/IdempotencyMiddleware
 */

const StandardResponse = require('../responses/StandardResponse');
const InMemoryIdempotencyStore = require('../idempotency/InMemoryIdempotencyStore');

class IdempotencyMiddleware {
  /**
   * Cria middleware de idempotência.
   * @param {Object} [options]
   * @param {IIdempotencyStore} [options.store] - Armazenamento de idempotência
   * @param {number} [options.ttl] - Time to live em segundos (padrão: 3600)
   * @param {Array<string>} [options.methods] - Métodos HTTP suportados (padrão: ['POST', 'PUT', 'PATCH', 'DELETE'])
   * @returns {Function}
   */
  static create(options = {}) {
    const store = options.store || new InMemoryIdempotencyStore();
    const ttl = options.ttl || 3600;
    const methods = options.methods || ['POST', 'PUT', 'PATCH', 'DELETE'];

    return async (req, res, next) => {
      // Verifica se o método suporta idempotência
      if (!methods.includes(req.method)) {
        return next();
      }

      // Obtém a chave de idempotência do header
      const idempotencyKey = req.headers['idempotency-key'];

      if (!idempotencyKey) {
        return next();
      }

      // Cria chave única combinando método, path e idempotency-key
      const key = `${req.method}:${req.path}:${idempotencyKey}`;

      // Verifica se já existe um resultado armazenado
      const existingResult = await store.retrieve(key);

      if (existingResult) {
        // Retorna o resultado armazenado
        const enriched = StandardResponse.enrich(existingResult, req);
        return res.status(StandardResponse.getStatusCode(existingResult)).json(enriched);
      }

      // Intercepta o envio da resposta para armazenar o resultado
      const originalJson = res.json;
      res.json = function(data) {
        // Armazena o resultado apenas para respostas de sucesso
        if (data && data.success !== false) {
          store.store(key, data, ttl).catch(err => {
            console.error('Erro ao armazenar resultado idempotente:', err);
          });
        }
        return originalJson.call(this, data);
      };

      next();
    };
  }
}

module.exports = IdempotencyMiddleware;
