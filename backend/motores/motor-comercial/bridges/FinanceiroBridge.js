/**
 * FinanceiroBridge — Integração real com plataforma CDS (Sprint O-13).
 *
 * @module motores/motor-comercial/bridges/FinanceiroBridge
 */

const Result = require('../infrastructure/result/Result');

class FinanceiroBridge {
  constructor(dependencies) {
    this._logger = dependencies.logger;
    this._eventPublisher = dependencies.eventPublisher;
    this._platform = dependencies.platform ?? null;
  }

  async registrarReceita(dados, context) {
    try {
      if (!this._platform) throw new Error('FinanceiroPlatformGateway não configurado');
      const resultado = await this._platform.registrarReceitaConsignacao({
        consignacaoId: dados.consignacaoId,
        valor: dados.valor,
        correlationId: context?.correlationId
      });
      await this._eventPublisher.publish('FinanceiroLancado', resultado);
      return Result.ok(resultado);
    } catch (error) {
      return Result.fail(error);
    }
  }

  async registrarPagamento(dados, context) {
    try {
      const resultado = await this._platform.registrarRecebimento({
        consignacaoId: dados.consignacaoId,
        valor: dados.valor,
        correlationId: context?.correlationId
      });
      await this._eventPublisher.publish('PagamentoRegistrado', resultado);
      return Result.ok(resultado);
    } catch (error) {
      return Result.fail(error);
    }
  }

  async registrarPerda(dados, context) {
    try {
      const resultado = await this._platform.registrarPerda({
        consignacaoId: dados.consignacaoId,
        valor: dados.valor,
        correlationId: context?.correlationId
      });
      await this._eventPublisher.publish('PerdaRegistrada', resultado);
      return Result.ok(resultado);
    } catch (error) {
      return Result.fail(error);
    }
  }

  async consultarSaldo(clienteId, context) {
    try {
      const saldo = await this._platform.consultarSaldo(clienteId);
      return Result.ok(saldo);
    } catch (error) {
      return Result.fail(error);
    }
  }
}

module.exports = FinanceiroBridge;
