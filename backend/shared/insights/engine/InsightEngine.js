/**
 * InsightEngine — executa regras registradas e retorna insights padronizados.
 */
const InsightRegistry = require('../registry/InsightRegistry');
const InsightBuilder = require('../builder/InsightBuilder');
const InsightResult = require('../result/InsightResult');
const InsightConfiguration = require('../config/InsightConfiguration');

class InsightEngine {
  constructor({ registry = null, configuration = null } = {}) {
    this.registry = registry || new InsightRegistry();
    this.configuration = configuration || new InsightConfiguration();
  }

  async executar(context) {
    const inicio = Date.now();
    const regras = this.registry.listar();
    const insights = [];
    const warnings = [];

    for (const regra of regras) {
      const codigo = regra.codigo();
      if (!this.registry.isHabilitada(codigo)) {
        warnings.push(`Regra desabilitada: ${codigo}`);
        continue;
      }

      try {
        const resultado = await regra.executar(context);
        if (resultado) {
          insights.push(InsightBuilder.build(regra, resultado));
        }
      } catch (error) {
        warnings.push(error.message || `Falha ao executar regra ${codigo}`);
      }
    }

    const categorias = [...new Set(insights.map(item => item.categoria))];
    const severidades = [...new Set(insights.map(item => item.severidade))];

    return new InsightResult({
      insights,
      estatisticas: {
        regrasProcessadas: regras.length,
        insightsGerados: insights.length
      },
      tempoExecucao: Date.now() - inicio,
      quantidade: insights.length,
      categorias,
      severidades,
      warnings
    });
  }
}

module.exports = InsightEngine;
