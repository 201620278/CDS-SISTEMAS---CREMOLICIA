/**
 * UC-008 — ListarConsignacoesUseCase
 *
 * @class ListarConsignacoesUseCase
 */

const ConsignacaoReadUseCase = require('./ConsignacaoReadUseCase');

class ListarConsignacoesUseCase extends ConsignacaoReadUseCase {
  async processar(entrada = {}) {
    const filtros = {
      clienteId: entrada.clienteId,
      status: entrada.status,
      documentoNumero: entrada.documentoNumero,
      limite: entrada.limite,
      offset: entrada.offset
    };

    let consignacoes = await this._consignacaoRepository.listar(filtros);

    if (entrada.dataInicio || entrada.dataFim) {
      consignacoes = consignacoes.filter((c) => {
        if (!c.dataAbertura) return false;
        const data = new Date(c.dataAbertura).getTime();
        if (entrada.dataInicio && data < new Date(entrada.dataInicio).getTime()) return false;
        if (entrada.dataFim && data > new Date(entrada.dataFim).getTime()) return false;
        return true;
      });
    }

    return {
      consignacoes,
      total: consignacoes.length,
      filtros: entrada
    };
  }
}

module.exports = ListarConsignacoesUseCase;
