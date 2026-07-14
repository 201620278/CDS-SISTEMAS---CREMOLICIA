module.exports = {
  InsightEngine: require('./engine/InsightEngine'),
  InsightRegistry: require('./registry/InsightRegistry'),
  InsightBuilder: require('./builder/InsightBuilder'),
  InsightContext: require('./context/InsightContext'),
  InsightResult: require('./result/InsightResult'),
  InsightConfiguration: require('./config/InsightConfiguration'),
  InsightCache: require('./cache/InsightCache'),
  InsightService: require('./services/InsightService'),
  IInsightRule: require('./contracts/IInsightRule'),
  InsightDTO: require('./dto/InsightDTO'),
  ResumoInsightDTO: require('./dto/ResumoInsightDTO'),
  CategoriaInsightDTO: require('./dto/CategoriaInsightDTO'),
  InsightGerado: require('./events/InsightGerado'),
  InsightResolvido: require('./events/InsightResolvido'),
  InsightIgnorado: require('./events/InsightIgnorado'),
  InsightExpirado: require('./events/InsightExpirado'),
  InsightAtualizado: require('./events/InsightAtualizado')
};
