/**
 * InsightConfiguration — configuração compartilhada para a engine de insights.
 */
class InsightConfiguration {
  constructor({ ttl = 300, categorias = [], prioridades = [], severidades = [], regrasAtivas = [] } = {}) {
    this.ttl = ttl;
    this.categorias = categorias;
    this.prioridades = prioridades;
    this.severidades = severidades;
    this.regrasAtivas = regrasAtivas;
  }

  ativarRegra(codigo) {
    if (!this.regrasAtivas.includes(codigo)) {
      this.regrasAtivas.push(codigo);
    }
  }

  desativarRegra(codigo) {
    this.regrasAtivas = this.regrasAtivas.filter(item => item !== codigo);
  }

  isRegraAtiva(codigo) {
    return this.regrasAtivas.length === 0 || this.regrasAtivas.includes(codigo);
  }
}

module.exports = InsightConfiguration;
