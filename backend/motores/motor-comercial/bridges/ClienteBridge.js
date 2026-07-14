/**
 * ClienteBridge — Bridge oficial para integração com Motor Cliente.
 *
 * Sprint 2.6: Bridges Oficiais — implementação completa.
 *
 * Responsabilidades:
 * - Validar cliente
 * - Consultar cliente
 * - Consultar situação
 * - Consultar bloqueios
 * - Consultar dados cadastrais
 *
 * @module motores/motor-comercial/bridges/ClienteBridge
 */

const Result = require('../infrastructure/result/Result');

class ClienteBridge {
  /**
   * Cria instância da ClienteBridge.
   * @param {Object} dependencies
   * @param {Object} dependencies.httpClient - Cliente HTTP para chamadas ao Motor Cliente
   * @param {Object} dependencies.logger - Logger para registro de operações
   * @param {Object} dependencies.eventPublisher - Publicador de eventos
   * @returns {ClienteBridge}
   */
  constructor(dependencies) {
    this._httpClient = dependencies.httpClient;
    this._logger = dependencies.logger;
    this._eventPublisher = dependencies.eventPublisher;
    this._platform = dependencies.platform ?? null;
  }

  /**
   * Valida se um cliente existe e está ativo.
   * @param {string} clienteId - ID do cliente
   * @param {BridgeContext} context - Contexto da operação
   * @returns {Promise<Result>}
   */
  async validarCliente(clienteId, context) {
    const startTime = Date.now();
    
    try {
      this._logger.info('ClienteBridge.validarCliente', {
        clienteId,
        correlationId: context.correlationId,
        requestId: context.requestId
      });

      if (!this._platform) {
        throw new Error('ClientePlatformGateway não configurado');
      }

      const cliente = await this._platform.buscarPorId(clienteId);
      if (!cliente) {
        throw new Error('Cliente não encontrado');
      }

      const clienteValido = { id: cliente.id, ativo: await this._platform.estaAtivo(clienteId) };

      this._logger.info('ClienteBridge.validarCliente - Sucesso', {
        clienteId,
        correlationId: context.correlationId,
        duration: Date.now() - startTime
      });

      return Result.ok(clienteValido);
    } catch (error) {
      this._logger.error('ClienteBridge.validarCliente - Erro', {
        clienteId,
        correlationId: context.correlationId,
        error: error.message,
        duration: Date.now() - startTime
      });

      return Result.fail(error);
    }
  }

  /**
   * Consulta dados completos de um cliente.
   * @param {string} clienteId - ID do cliente
   * @param {BridgeContext} context - Contexto da operação
   * @returns {Promise<Result>}
   */
  async consultarCliente(clienteId, context) {
    const startTime = Date.now();
    
    try {
      this._logger.info('ClienteBridge.consultarCliente', {
        clienteId,
        correlationId: context.correlationId,
        requestId: context.requestId
      });

      if (!this._platform) {
        throw new Error('ClientePlatformGateway não configurado');
      }

      const cliente = await this._platform.buscarPorId(clienteId);
      if (!cliente) {
        throw new Error('Cliente não encontrado');
      }

      this._logger.info('ClienteBridge.consultarCliente - Sucesso', {
        clienteId,
        correlationId: context.correlationId,
        duration: Date.now() - startTime
      });

      return Result.ok(cliente);
    } catch (error) {
      this._logger.error('ClienteBridge.consultarCliente - Erro', {
        clienteId,
        correlationId: context.correlationId,
        error: error.message,
        duration: Date.now() - startTime
      });

      return Result.fail(error);
    }
  }

  /**
   * Consulta situação atual do cliente.
   * @param {string} clienteId - ID do cliente
   * @param {BridgeContext} context - Contexto da operação
   * @returns {Promise<Result>}
   */
  async consultarSituacao(clienteId, context) {
    const startTime = Date.now();
    
    try {
      this._logger.info('ClienteBridge.consultarSituacao', {
        clienteId,
        correlationId: context.correlationId,
        requestId: context.requestId
      });

      if (!this._platform) {
        throw new Error('ClientePlatformGateway não configurado');
      }

      const situacao = await this._platform.consultarSituacao(clienteId);

      this._logger.info('ClienteBridge.consultarSituacao - Sucesso', {
        clienteId,
        correlationId: context.correlationId,
        duration: Date.now() - startTime
      });

      return Result.ok(situacao);
    } catch (error) {
      this._logger.error('ClienteBridge.consultarSituacao - Erro', {
        clienteId,
        correlationId: context.correlationId,
        error: error.message,
        duration: Date.now() - startTime
      });

      return Result.fail(error);
    }
  }

  /**
   * Consulta bloqueios ativos do cliente.
   * @param {string} clienteId - ID do cliente
   * @param {BridgeContext} context - Contexto da operação
   * @returns {Promise<Result>}
   */
  async consultarBloqueios(clienteId, context) {
    const startTime = Date.now();
    
    try {
      this._logger.info('ClienteBridge.consultarBloqueios', {
        clienteId,
        correlationId: context.correlationId,
        requestId: context.requestId
      });

      if (!this._platform) {
        throw new Error('ClientePlatformGateway não configurado');
      }

      const bloqueios = await this._platform.consultarBloqueios(clienteId);

      this._logger.info('ClienteBridge.consultarBloqueios - Sucesso', {
        clienteId,
        correlationId: context.correlationId,
        duration: Date.now() - startTime
      });

      return Result.ok(bloqueios);
    } catch (error) {
      this._logger.error('ClienteBridge.consultarBloqueios - Erro', {
        clienteId,
        correlationId: context.correlationId,
        error: error.message,
        duration: Date.now() - startTime
      });

      return Result.fail(error);
    }
  }

  /**
   * Consulta dados cadastrais do cliente.
   * @param {string} clienteId - ID do cliente
   * @param {BridgeContext} context - Contexto da operação
   * @returns {Promise<Result>}
   */
  async consultarDadosCadastrais(clienteId, context) {
    const startTime = Date.now();
    
    try {
      this._logger.info('ClienteBridge.consultarDadosCadastrais', {
        clienteId,
        correlationId: context.correlationId,
        requestId: context.requestId
      });

      const dadosCadastrais = await this._platform.buscarPorId(clienteId);
      if (!dadosCadastrais) {
        throw new Error('Cliente não encontrado');
      }

      this._logger.info('ClienteBridge.consultarDadosCadastrais - Sucesso', {
        clienteId,
        correlationId: context.correlationId,
        duration: Date.now() - startTime
      });

      return Result.ok(dadosCadastrais);
    } catch (error) {
      this._logger.error('ClienteBridge.consultarDadosCadastrais - Erro', {
        clienteId,
        correlationId: context.correlationId,
        error: error.message,
        duration: Date.now() - startTime
      });

      return Result.fail(error);
    }
  }

}

module.exports = ClienteBridge;
