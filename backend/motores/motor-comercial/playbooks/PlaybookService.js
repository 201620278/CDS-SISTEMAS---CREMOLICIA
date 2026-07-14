/**
 * PlaybookService — Motor de Playbooks Operacionais.
 *
 * Sprint O-10: deriva playbooks aplicáveis de recomendações e insights.
 *
 * @module motores/motor-comercial/playbooks/PlaybookService
 */

const { listarTodos, CATEGORIAS } = require('./PlaybookCatalog');

class PlaybookService {
  /**
   * @param {Object} input
   * @param {Object[]} [input.recomendacoes]
   * @param {Object[]} [input.insights]
   * @param {Object[]} [input.alertas]
   * @param {string} [input.clienteId]
   * @returns {Object}
   */
  executar(input = {}) {
    const catalogo = listarTodos();
    const recomendacoes = input.recomendacoes || [];
    const insights = input.insights || [];
    const alertas = input.alertas || [];

    const tiposRec = new Set(recomendacoes.map((r) => r.tipo).filter(Boolean));
    const tiposInsight = new Set([
      ...insights.map((i) => i.codigo || i.tipo),
      ...alertas.map((a) => a.tipo || a.codigo)
    ].filter(Boolean));

    const aplicaveis = catalogo.map((pb) => {
      const score = this._scoreAplicabilidade(pb, tiposRec, tiposInsight);
      const recomendacoesRelacionadas = recomendacoes
        .filter((r) => pb.tiposRecomendacao.includes(r.tipo))
        .map((r) => r.id);
      const insightsRelacionados = [...insights, ...alertas]
        .filter((i) => pb.tiposInsight.includes(i.codigo || i.tipo))
        .map((i) => i.id || i.codigo);

      return {
        ...pb,
        checklist: pb.passos.map((p) => ({
          passoId: p.id,
          titulo: p.titulo,
          status: 'PENDENTE'
        })),
        aplicavel: score > 0 || pb.tiposRecomendacao.length === 0,
        score,
        recomendacoesRelacionadas,
        insightsRelacionados,
        clienteId: input.clienteId || null
      };
    });

    const sugeridos = aplicaveis
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score);

    const porCategoria = {};
    CATEGORIAS.forEach((cat) => {
      porCategoria[cat] = aplicaveis.filter((p) => p.categoria === cat);
    });

    const kpis = {
      catalogoTotal: catalogo.length,
      aplicaveis: sugeridos.length,
      iniciados: 0,
      concluidos: 0,
      tempoMedioMinutos: null,
      eficiencia: 0,
      taxaConclusao: 0
    };

    return {
      playbooks: aplicaveis,
      sugeridos: sugeridos.slice(0, 10),
      categorias: porCategoria,
      kpis,
      resumo: {
        total: catalogo.length,
        sugeridos: sugeridos.length,
        categorias: CATEGORIAS.length
      }
    };
  }

  _scoreAplicabilidade(pb, tiposRec, tiposInsight) {
    let score = 0;
    pb.tiposRecomendacao.forEach((t) => { if (tiposRec.has(t)) score += 3; });
    pb.tiposInsight.forEach((t) => { if (tiposInsight.has(t)) score += 2; });
    if (pb.tiposRecomendacao.length === 0 && pb.tiposInsight.length === 0) score = 1;
    return score;
  }
}

module.exports = PlaybookService;
