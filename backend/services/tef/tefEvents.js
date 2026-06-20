const EventEmitter = require('events');

class TefEvents extends EventEmitter {
  constructor() {
    super();
    this.estados = {
      AGUARDANDO_CARTAO: 'AGUARDANDO_CARTAO',
      INSIRA_CARTAO: 'INSIRA_CARTAO',
      APROXIME_CARTAO: 'APROXIME_CARTAO',
      DIGITE_SENHA: 'DIGITE_SENHA',
      PROCESSANDO: 'PROCESSANDO',
      REMOVA_CARTAO: 'REMOVA_CARTAO',
      APROVADO: 'APROVADO',
      NEGADO: 'NEGADO',
      CANCELADO: 'CANCELADO',
      ERRO_COMUNICACAO: 'ERRO_COMUNICACAO'
    };
  }

  emitirEstado(estado, dados = {}) {
    this.emit('estado', { estado, ...dados, timestamp: new Date().toISOString() });
  }

  onEstado(callback) {
    this.on('estado', callback);
  }

  emitirErro(erro, dados = {}) {
    this.emit('erro', { erro, ...dados, timestamp: new Date().toISOString() });
  }

  onErro(callback) {
    this.on('erro', callback);
  }

  emitirTransacao(transacao, dados = {}) {
    this.emit('transacao', { transacao, ...dados, timestamp: new Date().toISOString() });
  }

  onTransacao(callback) {
    this.on('transacao', callback);
  }

  emitirPinpadStatus(status, dados = {}) {
    this.emit('pinpad_status', { status, ...dados, timestamp: new Date().toISOString() });
  }

  onPinpadStatus(callback) {
    this.on('pinpad_status', callback);
  }

  emitirServidorStatus(status, dados = {}) {
    this.emit('servidor_status', { status, ...dados, timestamp: new Date().toISOString() });
  }

  onServidorStatus(callback) {
    this.on('servidor_status', callback);
  }

  removerTodosListeners() {
    this.removeAllListeners();
  }
}

const tefEvents = new TefEvents();

module.exports = tefEvents;
