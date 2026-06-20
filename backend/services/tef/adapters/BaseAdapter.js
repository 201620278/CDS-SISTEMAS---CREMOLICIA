class BaseAdapter {

  constructor(config = {}) {
    this.config = config;
    this.nome = 'base';
  }

  async conectar() {
    throw new Error('Método conectar não implementado');
  }

  async autorizarPagamento() {
    throw new Error('Método autorizarPagamento não implementado');
  }

  async cancelarPagamento() {
    throw new Error('Método cancelarPagamento não implementado');
  }

  async consultarTransacao() {
    throw new Error('Método consultarTransacao não implementado');
  }

  async reimprimirComprovante() {
    throw new Error('Método reimprimirComprovante não implementado');
  }

  async status() {
    throw new Error('Método status não implementado');
  }
}

module.exports = BaseAdapter;
