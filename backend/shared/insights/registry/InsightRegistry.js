/**
 * InsightRegistry — registra regras de insights.
 */
class InsightRegistry {
  constructor() {
    this._regras = [];
    this._habilitadas = new Map();
  }

  registrar(regra) {
    if (!regra || typeof regra.executar !== 'function') {
      throw new Error('Regra inválida');
    }

    const codigo = regra.codigo();
    const existente = this._regras.find(item => item.codigo() === codigo);
    if (existente) {
      return existente;
    }

    this._regras.push(regra);
    this._habilitadas.set(codigo, true);
    return regra;
  }

  remover(codigo) {
    this._regras = this._regras.filter(item => item.codigo() !== codigo);
    this._habilitadas.delete(codigo);
  }

  consultar(codigo) {
    return this._regras.find(item => item.codigo() === codigo) || null;
  }

  listar() {
    return [...this._regras];
  }

  habilitar(codigo) {
    this._habilitadas.set(codigo, true);
  }

  desabilitar(codigo) {
    this._habilitadas.set(codigo, false);
  }

  isHabilitada(codigo) {
    return this._habilitadas.get(codigo) !== false;
  }
}

module.exports = InsightRegistry;
