/**
 * EstoqueBridge — Integração real com plataforma CDS (Sprint O-13).
 *
 * @module motores/motor-comercial/bridges/EstoqueBridge
 */

const Result = require('../infrastructure/result/Result');

class EstoqueBridge {
  constructor(dependencies) {
    this._logger = dependencies.logger;
    this._eventPublisher = dependencies.eventPublisher;
    this._platform = dependencies.platform ?? null;
  }

  async registrarSaidaConsignacao(dados, context) {
    const startTime = Date.now();
    try {
      if (!this._platform) throw new Error('EstoquePlatformGateway não configurado');
      const resultado = await this._platform.registrarSaida({
        produtoId: dados.produtoId,
        quantidade: dados.quantidade,
        consignacaoId: dados.consignacaoId,
        correlationId: context?.correlationId,
        usuarioId: context?.usuarioId,
        usuarioNome: context?.usuarioNome
      });
      await this._eventPublisher.publish('EstoqueAtualizado', { tipo: 'SAIDA', ...resultado });
      return Result.ok(resultado);
    } catch (error) {
      this._logger.error('EstoqueBridge.registrarSaidaConsignacao - Erro', { error: error.message, duration: Date.now() - startTime });
      return Result.fail(error);
    }
  }

  async registrarEntradaDevolucao(dados, context) {
    try {
      if (!this._platform) throw new Error('EstoquePlatformGateway não configurado');
      const resultado = await this._platform.registrarEntrada({
        produtoId: dados.produtoId,
        quantidade: dados.quantidade,
        consignacaoId: dados.consignacaoId,
        correlationId: context?.correlationId,
        usuarioId: context?.usuarioId,
        usuarioNome: context?.usuarioNome
      });
      await this._eventPublisher.publish('EstoqueAtualizado', { tipo: 'ENTRADA', ...resultado });
      return Result.ok(resultado);
    } catch (error) {
      return Result.fail(error);
    }
  }

  async registrarTransferencia(dados, context) {
    try {
      const resultado = await this._platform.registrarTransferencia({
        ...dados,
        correlationId: context?.correlationId
      });
      await this._eventPublisher.publish('EstoqueTransferido', resultado);
      return Result.ok(resultado);
    } catch (error) {
      return Result.fail(error);
    }
  }

  async consultarSaldo(produtoId, filialId, context) {
    try {
      const saldo = await this._platform.consultarSaldo(produtoId);
      return Result.ok({ ...saldo, filialId: filialId ?? null });
    } catch (error) {
      return Result.fail(error);
    }
  }
}

module.exports = EstoqueBridge;
