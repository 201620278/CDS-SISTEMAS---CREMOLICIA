/**
 * EstoqueBridgeAdapter — Implementa IEstoqueBridge via plataforma CDS.
 *
 * Sprint O-13
 *
 * @module motores/motor-comercial/bridges/adapters/EstoqueBridgeAdapter
 */

const IEstoqueBridge = require('../../domain/contracts/bridges/IEstoqueBridge');

class EstoqueBridgeAdapter extends IEstoqueBridge {
  /**
   * @param {Object} deps
   * @param {import('../platform/EstoquePlatformGateway')} deps.platform
   */
  constructor(deps = {}) {
    super();
    this._platform = deps.platform;
  }

  /** @inheritdoc */
  async reservarEstoque(_dados) {
    return { reservado: false, motivo: 'Reserva não implementada na plataforma CDS' };
  }

  /** @inheritdoc */
  async baixarEstoque(dados) {
    return this.registrarSaidaConsignacao(dados);
  }

  /** @inheritdoc */
  async estornarEstoque(dados) {
    return this.registrarEntradaConsignacao(dados);
  }

  /** @inheritdoc */
  async registrarSaidaConsignacao(dados) {
    const itens = dados.itens ?? [];
    const resultados = [];

    for (const item of itens) {
      const produtoId = item.produtoId ?? item.id;
      const quantidade = item.quantidadeEntregue ?? item.quantidade ?? 0;
      if (!produtoId || Number(quantidade) <= 0) continue;

      resultados.push(await this._platform.registrarSaida({
        produtoId,
        quantidade,
        consignacaoId: dados.consignacaoId,
        correlationId: dados.correlationId,
        usuarioId: dados.usuarioId,
        usuarioNome: dados.usuarioNome
      }));
    }

    return { consignacaoId: dados.consignacaoId, operacoes: resultados, correlationId: dados.correlationId };
  }

  /** @inheritdoc */
  async registrarEntradaConsignacao(dados) {
    const item = dados.item ?? {};
    const produtoId = item.produtoId ?? dados.produtoId;
    const quantidade = dados.quantidade ?? item.quantidadeDevolvida ?? 0;

    const operacao = await this._platform.registrarEntrada({
      produtoId,
      quantidade,
      consignacaoId: dados.consignacaoId,
      correlationId: dados.correlationId,
      usuarioId: dados.usuarioId,
      usuarioNome: dados.usuarioNome
    });

    return { consignacaoId: dados.consignacaoId, operacao, correlationId: dados.correlationId };
  }

  /** @inheritdoc */
  async registrarTransferencia(dados) {
    return this._platform.registrarTransferencia(dados);
  }
}

module.exports = EstoqueBridgeAdapter;
