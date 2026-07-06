/**
 * CentralNotificacoesService — Notificações internas do ERP.
 *
 * @class CentralNotificacoesService
 */

const CentralNotificacoesRepository = require('../repositories/CentralNotificacoesRepository');

const TIPOS_NOTIFICACAO = Object.freeze({
  NOVAS_NOTAS: 'NOVAS_NOTAS',
  SYNC_CONCLUIDA: 'SYNC_CONCLUIDA',
  SYNC_ERRO: 'SYNC_ERRO',
  PRONTA_COMPRA: 'PRONTA_COMPRA',
  COMPRA_GRAVADA: 'COMPRA_GRAVADA',
  ERRO: 'ERRO'
});

class CentralNotificacoesService {
  /**
   * @param {Object} [deps]
   */
  constructor(deps = {}) {
    /** @private */
    this._repository = deps.notificacoesRepository ?? new CentralNotificacoesRepository();
  }

  /**
   * @param {Object} dados
   * @returns {Promise<Object>}
   */
  async criar(dados) {
    return this._repository.inserir(dados);
  }

  /**
   * @param {Object} [filtros]
   * @returns {Promise<Object[]>}
   */
  async listar(filtros = {}) {
    return this._repository.listar(filtros);
  }

  /**
   * @returns {Promise<number>}
   */
  async contarNaoLidas() {
    return this._repository.contarNaoLidas();
  }

  /**
   * @param {number|string} id
   * @returns {Promise<boolean>}
   */
  async marcarLida(id) {
    return this._repository.marcarLida(id);
  }

  /**
   * @returns {Promise<number>}
   */
  async marcarTodasLidas() {
    return this._repository.marcarTodasLidas();
  }

  /**
   * @param {Object} opcoes
   * @returns {Promise<Object|null>}
   */
  async notificarSyncConcluida(opcoes = {}) {
    const { notasNovas = 0, sucesso = true, mensagem, origem } = opcoes;

    if (sucesso && notasNovas > 0 && opcoes.notificarNovas !== false) {
      await this.criar({
        tipo: TIPOS_NOTIFICACAO.NOVAS_NOTAS,
        titulo: `${notasNovas} nova(s) nota(s) na Central`,
        mensagem: mensagem || 'Novas notas encontradas na sincronização SEFAZ.'
      });
    }

    return this.criar({
      tipo: sucesso ? TIPOS_NOTIFICACAO.SYNC_CONCLUIDA : TIPOS_NOTIFICACAO.SYNC_ERRO,
      titulo: sucesso ? 'Sincronização concluída' : 'Erro na sincronização',
      mensagem: mensagem || (sucesso
        ? `Sincronização ${origem || ''} finalizada.`.trim()
        : 'Falha na sincronização SEFAZ.')
    });
  }
}

CentralNotificacoesService.TIPOS = TIPOS_NOTIFICACAO;

module.exports = CentralNotificacoesService;
