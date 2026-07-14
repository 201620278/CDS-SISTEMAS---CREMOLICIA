/**
 * ClientePlatformGateway — Integração real com cadastro de clientes CDS.
 *
 * Sprint O-13 — consome SQLite / rotas clientes + contas a receber.
 *
 * @module motores/motor-comercial/bridges/platform/ClientePlatformGateway
 */

const { dbGet, dbAll } = require('./dbHelpers');
const { assegurarBancoNoGateway } = require('./platformGatewayGuards');

class ClientePlatformGateway {
  /**
   * @param {Object} deps
   * @param {Object} deps.db
   */
  constructor(deps = {}) {
    this._db = deps.db;
  }

  /**
   * @param {string|number} clienteId
   * @returns {Promise<Object|null>}
   */
  async buscarPorId(clienteId) {
    assegurarBancoNoGateway(this, 'buscarPorId');
    if (clienteId == null) return null;

    const row = await dbGet(this._db, 'SELECT * FROM clientes WHERE id = ?', [clienteId]);
    if (!row) return null;

    return {
      id: row.id,
      nome: row.nome,
      documento: row.cpf_cnpj,
      telefone: row.telefone,
      email: row.email ?? null,
      limiteCredito: Number(row.limite_credito ?? 0),
      creditoAtual: Number(row.credito_atual ?? 0),
      endereco: {
        rua: row.rua ?? null,
        logradouro: row.rua ?? null,
        numero: row.numero ?? null,
        bairro: row.bairro ?? null,
        cidade: row.cidade ?? null,
        uf: row.uf ?? null,
        estado: row.uf ?? null,
        cep: row.cep ?? null
      },
      ativo: true,
      bloqueado: false,
      origem: 'platform:clientes'
    };
  }

  /**
   * @param {string|number} clienteId
   * @returns {Promise<boolean>}
   */
  async estaAtivo(clienteId) {
    const cliente = await this.buscarPorId(clienteId);
    if (!cliente) return false;

    const recebiveis = await this._consultarRecebiveis(clienteId);
    if (recebiveis.parcelasVencidas > 0) {
      return false;
    }

    return cliente.ativo !== false;
  }

  /**
   * @param {string|number} clienteId
   * @returns {Promise<Object>}
   */
  async consultarSituacao(clienteId) {
    const cliente = await this.buscarPorId(clienteId);
    if (!cliente) {
      throw new Error('Cliente não encontrado');
    }

    const recebiveis = await this._consultarRecebiveis(clienteId);
    const bloqueado = recebiveis.parcelasVencidas > 0;

    return {
      clienteId,
      situacao: bloqueado ? 'BLOQUEADO' : 'ATIVO',
      saldoEmAberto: recebiveis.totalEmAberto,
      parcelasVencidas: recebiveis.parcelasVencidas,
      limiteCredito: cliente.limiteCredito,
      creditoAtual: cliente.creditoAtual,
      nivelRisco: recebiveis.parcelasVencidas > 0 ? 'ALTO' : 'BAIXO',
      dataAtualizacao: new Date().toISOString()
    };
  }

  /**
   * @param {string|number} clienteId
   * @returns {Promise<Array>}
   */
  async consultarBloqueios(clienteId) {
    const recebiveis = await this._consultarRecebiveis(clienteId);
    if (recebiveis.parcelasVencidas <= 0) return [];

    return [{
      tipo: 'FINANCEIRO',
      motivo: 'Parcelas vencidas em aberto',
      parcelasVencidas: recebiveis.parcelasVencidas,
      totalEmAberto: recebiveis.totalEmAberto
    }];
  }

  /**
   * @private
   * @param {string|number} clienteId
   */
  async _consultarRecebiveis(clienteId) {
    const rows = await dbAll(this._db, `
      SELECT status, valor_restante, data_vencimento
      FROM contas_receber
      WHERE cliente_id = ? AND status = 'aberto'
    `, [clienteId]);

    const hoje = new Date().toISOString().slice(0, 10);
    let totalEmAberto = 0;
    let parcelasVencidas = 0;

    for (const row of rows) {
      totalEmAberto += Number(row.valor_restante ?? 0);
      if (row.data_vencimento && String(row.data_vencimento).slice(0, 10) < hoje) {
        parcelasVencidas += 1;
      }
    }

    return { totalEmAberto, parcelasVencidas };
  }
}

module.exports = ClientePlatformGateway;
