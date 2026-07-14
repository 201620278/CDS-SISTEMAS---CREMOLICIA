/**
 * InsightBuilder — constrói objetos de insight padronizados.
 */
const InsightDTO = require('../dto/InsightDTO');

class InsightBuilder {
  static build(rule, executionResult) {
    const dto = InsightDTO.fromRule(executionResult, rule);
    return dto;
  }

  static buildMany(ruleResults, rules) {
    return ruleResults.map((result, index) => this.build(rules[index], result));
  }
}

module.exports = InsightBuilder;
