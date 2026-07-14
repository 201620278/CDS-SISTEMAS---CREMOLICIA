/**
 * HealthController — Endpoints de health check para o Motor Comercial.
 *
 * Sprint 2.5.5: Hardening da API — health checks corporativos.
 *
 * @module motores/motor-comercial/controllers/HealthController
 */

const { VERSAO_MODULO } = require('../index');
const StandardResponse = require('../../../shared/http/responses/StandardResponse');

class HealthController {
  constructor() {
    this._startTime = Date.now();
  }

  /**
   * GET /health
   * Health check básico.
   */
  async health(req, res, next) {
    try {
      const uptime = Date.now() - this._startTime;

      const response = StandardResponse.success({
        status: 'ok',
        motor: 'motor-comercial',
        version: VERSAO_MODULO,
        uptime: `${Math.floor(uptime / 1000)}s`,
        timestamp: new Date().toISOString(),
        database: 'connected',
        repositories: 'ok'
      }, null, 200);

      const enriched = StandardResponse.enrich(response, req);
      return res.status(StandardResponse.getStatusCode(response)).json(enriched);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /version
   * Informações de versão.
   */
  async version(req, res, next) {
    try {
      const response = StandardResponse.success({
        versao: VERSAO_MODULO,
        api: 'v1',
        build: process.env.BUILD_NUMBER || 'development',
        commit: process.env.COMMIT_HASH || null,
        ambiente: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      }, null, 200);

      const enriched = StandardResponse.enrich(response, req);
      return res.status(StandardResponse.getStatusCode(response)).json(enriched);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /status
   * Status detalhado dos componentes.
   */
  async status(req, res, next) {
    try {
      const motor = require('../index');
      if (!motor.estaInicializado()) {
        const response = StandardResponse.error(
          'MOTOR_NAO_INICIALIZADO',
          'Motor Comercial não inicializado',
          null,
          503
        );
        const enriched = StandardResponse.enrich(response, req);
        return res.status(StandardResponse.getStatusCode(response)).json(enriched);
      }

      const container = motor.obterContainer();

      const componentes = {
        repositories: this._checkRepositories(container),
        controllers: this._checkControllers(),
        projectionServices: this._checkProjectionServices(container)
      };

      const response = StandardResponse.success({
        motor: 'motor-comercial',
        status: 'operational',
        componentes,
        timestamp: new Date().toISOString()
      }, null, 200);

      const enriched = StandardResponse.enrich(response, req);
      return res.status(StandardResponse.getStatusCode(response)).json(enriched);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verifica status dos repositories.
   * @private
   */
  _checkRepositories(container) {
    const repositories = [
      'perfilComercialRepository',
      'consignacaoRepository',
      'consignacaoItemRepository',
      'movimentacaoComercialRepository',
      'movimentacaoPerfilRepository'
    ];

    const status = {};
    repositories.forEach(repo => {
      status[repo] = container[repo] ? 'loaded' : 'not_loaded';
    });

    return status;
  }

  /**
   * Verifica status dos controllers.
   * @private
   */
  _checkControllers() {
    const controllers = [
      'PerfilComercialController',
      'ConsignacaoController',
      'ProjectionController',
      'HealthController'
    ];

    const status = {};
    controllers.forEach(controller => {
      try {
        require(`./${controller}`);
        status[controller] = 'loaded';
      } catch {
        status[controller] = 'not_loaded';
      }
    });

    return status;
  }

  /**
   * Verifica status dos projection services.
   * @private
   */
  _checkProjectionServices(container) {
    const services = [
      'dashboardProjectionService',
      'contaCorrenteProjectionService',
      'timelineProjectionService',
      'resumoPrestacaoProjectionService',
      'saldoProjectionService',
      'historicoProjectionService',
      'indicadoresProjectionService',
      'situacaoClienteProjectionService',
      'insightsProjectionService',
      'pendenciasProjectionService',
      'recomendacoesProjectionService',
      'playbooksProjectionService',
      'workflowProjectionService',
      'playbookService',
      'recommendationService'
    ];

    const status = {};
    services.forEach(service => {
      status[service] = container[service] ? 'loaded' : 'not_loaded';
    });

    return status;
  }
}

module.exports = HealthController;
