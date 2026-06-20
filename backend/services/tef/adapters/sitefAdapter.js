const BaseAdapter = require('./BaseAdapter');

class SitefAdapter extends BaseAdapter {

  constructor(config) {
    super(config);

    this.nome = 'sitef';

    this.sdkPath = config.sdk_path;

    this.ip = config.ip;

    this.porta = config.porta;
  }

  async conectar() {
    if (!this.config.sdk_path) {
      throw new Error(
        'SDK CliSiTef não configurado'
      );
    }

    return true;
  }

  async autorizarPagamento(dados) {
    throw new Error(
      'Integração CliSiTef ainda não instalada'
    );
  }

  async cancelarPagamento(dados) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          cancelado: true,
          status: 'cancelado',
          mensagem: 'Transação TEF cancelada com sucesso',
          nsu: dados.nsu,
          autorizacao: dados.autorizacao,
          codigo_cancelamento: `CANC${Date.now()}`,
          payload_retorno: {
            ambiente: 'simulacao',
            transacao_id: dados.transacao_id,
            motivo: dados.motivo || 'Cancelamento da venda'
          }
        });
      }, 1000);
    });
  }
}

module.exports = SitefAdapter;