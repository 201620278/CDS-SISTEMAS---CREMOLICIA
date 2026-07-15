const UNIDADE_MAX = 20;
const DESCRICAO_MAX = 80;

function normalizarUnidade(valor) {
  return String(valor || '').trim().toUpperCase().slice(0, UNIDADE_MAX);
}

function validarPayloadUnidade(payload = {}, { exigirId = false } = {}) {
  const erros = [];

  if (exigirId && !Number(payload.id)) {
    erros.push('id da unidade comercial é obrigatório.');
  }

  const unidade = normalizarUnidade(payload.unidade);
  if (!unidade) {
    erros.push('unidade é obrigatória.');
  }

  const fator = Number(payload.fator_conversao);
  if (!Number.isFinite(fator) || fator <= 0) {
    erros.push('fator_conversao deve ser um número maior que zero.');
  }

  const preco = payload.preco == null || payload.preco === ''
    ? null
    : Number(payload.preco);
  if (preco != null && (!Number.isFinite(preco) || preco < 0)) {
    erros.push('preco inválido.');
  }

  const ordem = payload.ordem == null || payload.ordem === ''
    ? 0
    : Number(payload.ordem);
  if (!Number.isFinite(ordem) || ordem < 0) {
    erros.push('ordem inválida.');
  }

  return {
    ok: erros.length === 0,
    erros,
    dados: {
      unidade,
      descricao: String(payload.descricao || unidade).trim().slice(0, DESCRICAO_MAX),
      fator_conversao: fator,
      preco: preco == null ? 0 : preco,
      codigo_barras: String(payload.codigo_barras || '').trim() || null,
      codigo_auxiliar: String(payload.codigo_auxiliar || '').trim() || null,
      principal: Number(payload.principal) === 1 ? 1 : 0,
      ativo: payload.ativo === 0 || payload.ativo === false ? 0 : 1,
      ordem
    }
  };
}

module.exports = {
  normalizarUnidade,
  validarPayloadUnidade
};
