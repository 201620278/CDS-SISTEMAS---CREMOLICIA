/**
 * SecurityMiddleware — Middleware de segurança HTTP (versão corporativa).
 *
 * Sprint 2.5.5: Hardening da API — middlewares de segurança.
 *
 * @module backend/shared/http/middlewares/SecurityMiddleware
 */

class SecurityMiddleware {
  /**
   * Cria middleware de CORS.
   * @param {Object} [options]
   * @param {string|Array<string>} [options.origin] - Origens permitidas
   * @param {boolean} [options.credentials] - Permite credenciais
   * @param {string|Array<string>} [options.methods] - Métodos permitidos
   * @param {string|Array<string>} [options.allowedHeaders] - Headers permitidos
   * @returns {Function}
   */
  static cors(options = {}) {
    const origin = options.origin || '*';
    const credentials = options.credentials !== undefined ? options.credentials : false;
    const methods = options.methods || ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
    const allowedHeaders = options.allowedHeaders || ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Correlation-ID', 'Idempotency-Key'];

    return (req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', Array.isArray(origin) ? origin.join(', ') : origin);
      
      if (credentials) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }

      res.setHeader('Access-Control-Allow-Methods', Array.isArray(methods) ? methods.join(', ') : methods);
      res.setHeader('Access-Control-Allow-Headers', Array.isArray(allowedHeaders) ? allowedHeaders.join(', ') : allowedHeaders);
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas

      if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
      }

      next();
    };
  }

  /**
   * Cria middleware de Helmet (headers de segurança).
   * @param {Object} [options]
   * @param {boolean} [options.hsts] - Habilita HSTS
   * @param {boolean} [options.noSniff] - Habilita X-Content-Type-Options
   * @param {boolean} [options.frameguard] - Habilita X-Frame-Options
   * @param {boolean} [options.xssFilter] - Habilita X-XSS-Protection
   * @returns {Function}
   */
  static helmet(options = {}) {
    const hsts = options.hsts !== undefined ? options.hsts : false;
    const noSniff = options.noSniff !== undefined ? options.noSniff : true;
    const frameguard = options.frameguard !== undefined ? options.frameguard : true;
    const xssFilter = options.xssFilter !== undefined ? options.xssFilter : true;

    return (req, res, next) => {
      // X-Content-Type-Options
      if (noSniff) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
      }

      // X-Frame-Options
      if (frameguard) {
        res.setHeader('X-Frame-Options', 'DENY');
      }

      // X-XSS-Protection
      if (xssFilter) {
        res.setHeader('X-XSS-Protection', '1; mode=block');
      }

      // Strict-Transport-Security
      if (hsts) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      }

      // Content-Security-Policy (básico)
      res.setHeader('Content-Security-Policy', "default-src 'self'");

      // Referrer-Policy
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

      // Permissions-Policy
      res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

      next();
    };
  }

  /**
   * Cria middleware de compressão.
   * @param {Object} [options]
   * @param {string} [options.encoding] - Codificação padrão (gzip, deflate, br)
   * @param {number} [options.threshold] - Tamanho mínimo para compressão em bytes
   * @returns {Function}
   */
  static compression(options = {}) {
    const encoding = options.encoding || 'gzip';
    const threshold = options.threshold || 1024;

    return (req, res, next) => {
      const acceptEncoding = req.headers['accept-encoding'] || '';

      if (acceptEncoding.includes(encoding)) {
        res.setHeader('Content-Encoding', encoding);
        // Nota: Implementação real de compressão requer biblioteca como compression ou zlib
        // Este middleware prepara a infraestrutura
      }

      next();
    };
  }

  /**
   * Cria middleware de ETag.
   * @param {Object} [options]
   * @param {boolean} [options.weak] - ETag fraco
   * @returns {Function}
   */
  static etag(options = {}) {
    const weak = options.weak !== undefined ? options.weak : false;

    return (req, res, next) => {
      const originalJson = res.json;
      
      res.json = function(data) {
        // Gera ETag simples baseado em hash do conteúdo
        const etag = weak ? `W/"${Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 16)}"` : `"${Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 16)}"`;
        
        res.setHeader('ETag', etag);

        // Verifica If-None-Match
        const ifNoneMatch = req.headers['if-none-match'];
        if (ifNoneMatch && ifNoneMatch === etag) {
          return res.sendStatus(304);
        }

        return originalJson.call(this, data);
      };

      next();
    };
  }

  /**
   * Cria middleware de Cache-Control.
   * @param {Object} [options]
   * @param {number} [options.maxAge] - Tempo máximo em segundos
   * @param {boolean} [options.private] - Cache privado
   * @param {boolean} [options.noCache] - Sem cache
   * @param {boolean} [options.noStore] - Não armazenar
   * @returns {Function}
   */
  static cacheControl(options = {}) {
    const maxAge = options.maxAge || 0;
    const isPrivate = options.private !== undefined ? options.private : false;
    const noCache = options.noCache !== undefined ? options.noCache : false;
    const noStore = options.noStore !== undefined ? options.noStore : false;

    return (req, res, next) => {
      const directives = [];

      if (noStore) {
        directives.push('no-store');
      } else if (noCache) {
        directives.push('no-cache');
      }

      if (isPrivate) {
        directives.push('private');
      } else {
        directives.push('public');
      }

      if (maxAge > 0 && !noStore) {
        directives.push(`max-age=${maxAge}`);
      }

      if (directives.length > 0) {
        res.setHeader('Cache-Control', directives.join(', '));
      }

      next();
    };
  }

  /**
   * Cria middleware de segurança combinado.
   * @param {Object} [options]
   * @returns {Function}
   */
  static create(options = {}) {
    return [
      this.cors(options.cors),
      this.helmet(options.helmet),
      this.compression(options.compression),
      this.etag(options.etag),
      this.cacheControl(options.cacheControl)
    ];
  }
}

module.exports = SecurityMiddleware;
