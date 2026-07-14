/**
 * InsightService — API interna para orquestração da engine de insights.
 */
const InsightEngine = require('../engine/InsightEngine');
const InsightRegistry = require('../registry/InsightRegistry');
const InsightConfiguration = require('../config/InsightConfiguration');

class InsightService {
  constructor({ registry = null, configuration = null, engine = null } = {}) {
    this.registry = registry || new InsightRegistry();
    this.configuration = configuration || new InsightConfiguration();
    this.engine = engine || new InsightEngine({ registry: this.registry, configuration: this.configuration });
  }

  async executar(context) {
    return this.engine.executar(context);
  }

  registrarRegra(regra) {
    return this.registry.registrar(regra);
  }

  removerRegra(codigo) {
    this.registry.remover(codigo);
  }

  async executarCategoria(context, categoria) {
    const regras = this.registry.listar().filter(regra => regra.categoria() === categoria);
    const registroTemporario = new InsightRegistry();
    regras.forEach(regra => registroTemporario.registrar(regra));
    const engine = new InsightEngine({ registry: registroTemporario, configuration: this.configuration });
    return engine.executar(context);
  }

  async executarTodas(context) {
    return this.engine.executar(context);
  }
}

module.exports = InsightService;
