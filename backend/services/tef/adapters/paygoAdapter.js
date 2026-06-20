const BaseAdapter = require('./BaseAdapter');

class PayGoAdapter extends BaseAdapter {

  constructor(config) {
    super(config);

    this.nome = 'paygo';

    this.sdkPath = config.sdk_path || null;

    this.exePath = config.exe_path || null;

    this.ip = config.ip || '127.0.0.1';

    this.porta = config.porta || 4096;
  }

  async conectar() {
    if (!this.config.sdk_path) {
      throw new Error(
        'SDK PayGo não configurado'
      );
    }

    return true;
  }

  async autorizarPagamento(dados) {
    throw new Error(
      'Integração PayGo ainda não instalada'
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

module.exports = PayGoAdapter;
