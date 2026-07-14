/**
 * UC-017 — ConsultarConsignacoesEmTransitoUseCase
 *
 * @class ConsultarConsignacoesEmTransitoUseCase
 */

const ConsignacaoReadUseCase = require('./ConsignacaoReadUseCase');
const { STATUS_ENTREGUE } = require('./consignacaoUseCaseHelpers');
const { prestacaoEstaAberta } = require('./consignacaoOperacaoHelpers');

class ConsultarConsignacoesEmTransitoUseCase extends ConsignacaoReadUseCase {
  async processar(entrada = {}) {
    const filtros = {
      clienteId: entrada.clienteId,
      status: STATUS_ENTREGUE,
      limite: entrada.limite,
      offset: entrada.offset
    };

    let consignacoes = await this._consignacaoRepository.listar(filtros);
    consignacoes = consignacoes.filter((c) => !prestacaoEstaAberta(c));

    if (entrada.perfilComercialId != null) {
      consignacoes = consignacoes.filter(
        (c) => c.perfilComercialId === entrada.perfilComercialId
      );
    }

    return {
      consignacoes,
      total: consignacoes.length
    };
  }
}

module.exports = ConsultarConsignacoesEmTransitoUseCase;
