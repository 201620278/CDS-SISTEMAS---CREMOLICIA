/**
 * MiipResultadoImportacaoMapper — Mapeia decisão do Pipeline para importação XML.
 *
 * Sprint RC1: sem lógica de decisão — apenas traduz saída do DecisionEngine.
 *
 * @module motores/miip/utils/MiipResultadoImportacaoMapper
 */

const MiipAction = require('../core/MiipAction');
const MiipConfidence = require('../core/MiipConfidence');

const MOTORES_AUTO_VINCULO = Object.freeze([
  'motor_gtin',
  'motor_associacao_fornecedor'
]);

/**
 * @param {Object|null} melhor
 * @returns {string|null}
 */
function extrairMotor(melhor) {
  if (!melhor) return null;
  const motores = melhor.motoresQueVotaram || [];
  const permitido = motores.find((m) => MOTORES_AUTO_VINCULO.includes(m));
  return permitido || melhor.motorOrigem || motores[0] || null;
}

/**
 * @param {Object|null} melhor
 * @returns {Object|null}
 */
function montarProdutoEncontrado(melhor) {
  if (!melhor) return null;

  const produtoId = Number(melhor.produtoId ?? melhor.produto_id);
  if (!Number.isFinite(produtoId) || produtoId <= 0) return null;

  const produto = melhor.produto || melhor.snapshot || {};

  return {
    id: produtoId,
    nome: produto.nome || melhor.produtoNome || melhor.nome || '',
    codigo: produto.codigo || melhor.codigo || '',
    codigoBarras: produto.codigoBarras || melhor.codigoBarras || null
  };
}

/**
 * @param {Object|null} miipResp
 * @param {Object|null} resultado
 * @returns {Object}
 */
function mapearDecisaoPipelineParaImportacao(miipResp, resultado) {
  const decisao = resultado?.decisao ?? {};
  const melhor = decisao.melhorCandidato ?? resultado?.candidatos?.[0] ?? null;
  const produtoEncontrado = montarProdutoEncontrado(melhor);
  const acao = decisao.acao ?? MiipAction.CRIAR_NOVO;

  const motivos = Array.isArray(decisao.motivos) && decisao.motivos.length > 0
    ? [...decisao.motivos]
    : (decisao.motivo ? [decisao.motivo] : []);

  const precisaConfirmacao = decisao.precisaConfirmacao !== undefined
    ? Boolean(decisao.precisaConfirmacao)
    : (acao === MiipAction.SUGERIR || acao === MiipAction.REVISAR_MANUAL);

  const precisaCadastro = decisao.precisaCadastro !== undefined
    ? Boolean(decisao.precisaCadastro)
    : (acao === MiipAction.CRIAR_NOVO);

  if (!miipResp?.encontrado || !melhor || !produtoEncontrado) {
    return {
      produtoEncontrado: null,
      nivelCerteza: MiipConfidence.NENHUMA,
      acao: MiipAction.CRIAR_NOVO,
      motivos: motivos.length > 0 ? motivos : ['nenhum_candidato_confiavel'],
      candidatoSelecionado: null,
      precisaConfirmacao: false,
      precisaCadastro: true,
      associadoAutomaticamente: false,
      score: Number(decisao.score ?? resultado?.score?.valor ?? 0),
      motor: null
    };
  }

  return {
    produtoEncontrado,
    nivelCerteza: decisao.confianca ?? MiipConfidence.NENHUMA,
    acao,
    motivos,
    candidatoSelecionado: melhor,
    precisaConfirmacao,
    precisaCadastro,
    associadoAutomaticamente: acao === MiipAction.AUTO_VINCULAR,
    score: Number(decisao.score ?? resultado?.score?.valor ?? melhor?.scoreTotal ?? 0),
    motor: extrairMotor(melhor)
  };
}

module.exports = {
  MOTORES_AUTO_VINCULO,
  extrairMotor,
  montarProdutoEncontrado,
  mapearDecisaoPipelineParaImportacao
};
