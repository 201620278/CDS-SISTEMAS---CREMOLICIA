/**
 * InfrastructureError — Erros de infraestrutura (não confundir com domínio).
 *
 * Sprint S-4.1: Hardening da inicialização do Motor Comercial.
 *
 * @module motores/motor-comercial/infrastructure/errors/InfrastructureError
 */

class InfrastructureError extends Error {
  static CODIGO = 'INFRASTRUCTURE_ERROR';

  /**
   * @param {string} message
   * @param {Object} [detalhes]
   */
  constructor(message, detalhes = null) {
    super(message);
    this.name = 'InfrastructureError';
    this.codigo = InfrastructureError.CODIGO;
    this.detalhes = detalhes;
    this.isInfrastructure = true;
  }
}

module.exports = InfrastructureError;
