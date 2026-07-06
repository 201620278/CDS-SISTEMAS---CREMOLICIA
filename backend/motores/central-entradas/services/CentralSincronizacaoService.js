/**
 * CentralSincronizacaoService — Orquestração da sincronização DF-e na Central.
 *
 * Sprint 4: delega ao pipeline oficial em distribuicaoDFe.js.
 *
 * @class CentralSincronizacaoService
 */

const SincronizacaoResultadoDTO = require('../contracts/SincronizacaoResultadoDTO');
const CentralDocumentosRepository = require('../repositories/CentralDocumentosRepository');
const {
  sincronizarDistribuicaoDFe,
  consultarNotaPorChave
} = require('../../../services/fiscal/distribuicaoDFe');
const { paraInboxDTO } = require('../utils/centralEntradasMapper');

class CentralSincronizacaoService {
  /**
   * @param {Object} [deps]
   * @param {import('../repositories/CentralDocumentosRepository')} [deps.documentosRepository]
   */
  constructor(deps = {}) {
    /** @private */
    this._documentosRepository = deps.documentosRepository ?? new CentralDocumentosRepository();
  }

  /**
   * @returns {Promise<Object>}
   */
  async sincronizar() {
    try {
      const resultado = await sincronizarDistribuicaoDFe();
      return SincronizacaoResultadoDTO.create({
        sucesso: true,
        notasNovas: resultado.notasNovas,
        notasDuplicadas: resultado.notasDuplicadas,
        ignorados: resultado.ignorados,
        ultNsu: resultado.ultNsu,
        maxNsu: resultado.maxNsu,
        iteracoes: resultado.iteracoes,
        cStat: resultado.cStat,
        mensagem: resultado.mensagem,
        ultimaSincronizacao: resultado.ultimaSincronizacao,
        erros: []
      }).toJSON();
    } catch (error) {
      return SincronizacaoResultadoDTO.create({
        sucesso: false,
        notasNovas: 0,
        notasDuplicadas: 0,
        erros: [error.message]
      }).toJSON();
    }
  }

  /**
   * @param {string} chave
   * @returns {Promise<Object>}
   */
  async buscarPorChave(chave) {
    const chaveLimpa = String(chave || '').replace(/\D/g, '');
    const resultado = await consultarNotaPorChave(chaveLimpa);
    const documento = await this._documentosRepository.buscarPorChave(chaveLimpa);

    return {
      ...resultado,
      novo: resultado.notasNovas > 0,
      documento: documento ? paraInboxDTO(documento).toJSON() : null
    };
  }
}

module.exports = CentralSincronizacaoService;
