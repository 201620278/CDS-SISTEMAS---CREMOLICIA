/**
 * IInsightRule — contrato base para regras de insights.
 */
class IInsightRule {
  codigo() {
    throw new Error('Metodo codigo() deve ser implementado');
  }

  categoria() {
    throw new Error('Metodo categoria() deve ser implementado');
  }

  prioridade() {
    throw new Error('Metodo prioridade() deve ser implementado');
  }

  severidade() {
    throw new Error('Metodo severidade() deve ser implementado');
  }

  async executar() {
    throw new Error('Metodo executar(context) deve ser implementado');
  }
}

module.exports = IInsightRule;
