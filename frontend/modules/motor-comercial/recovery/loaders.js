/**
 * Loaders oficiais — ordem: API → Provider → Checkpoint → Cache
 *
 * @module frontend/modules/motor-comercial/recovery/loaders
 */

const { RecoveryProvider, RecoveryValidation } = require('../../../shared/recovery');

async function loadConsignacaoOperacao(context, helpers = {}) {
  const api = helpers.api;
  const projectionApi = helpers.projectionApi;
  const checkpoint = context.checkpoint || {};
  const cacheItens = typeof helpers.getCacheItens === 'function'
    ? (helpers.getCacheItens(context.entityId) || [])
    : [];

  if (RecoveryValidation.isDraftEntityId(context.entityId) || !context.entityId || !api) {
    const { itens, source } = RecoveryProvider.resolveItens({
      api: { itens: [] },
      provider: null,
      checkpoint,
      cache: { itens: cacheItens }
    });
    return {
      entity: {
        id: context.entityId,
        status: 'RASCUNHO',
        clienteId: checkpoint.clienteId || null,
        perfilComercialId: checkpoint.perfilComercialId || null,
        documento: checkpoint.documentoNumero || null,
        documentoExterno: checkpoint.documentoExterno || '',
        observacao: checkpoint.observacoes || '',
        dataAbertura: checkpoint.data || null,
        dataEntregaPrevista: checkpoint.dataPrevista || null,
        itens,
        _draft: RecoveryValidation.isDraftEntityId(context.entityId)
      },
      checkpoint,
      fromApi: false,
      fromCheckpoint: source === 'checkpoint',
      source: source || 'checkpoint',
      extras: {}
    };
  }

  // 1. API oficial
  const consignacao = await api.obterConsignacao(context.entityId);
  let apiItens = Array.isArray(consignacao.itens) && consignacao.itens.length
    ? consignacao.itens.slice()
    : [];

  if (!apiItens.length && typeof api.listarItensConsignacao === 'function') {
    try {
      const listed = await api.listarItensConsignacao(context.entityId);
      if (Array.isArray(listed) && listed.length) apiItens = listed;
    } catch (_e) {
      /* segue fallback */
    }
  }

  let perfil = null;
  let situacao = null;
  let resumo = null;
  let providerBucket = null;

  // 2. Recovery Provider (projeções / bridges do módulo)
  const providerFn = RecoveryProvider.get(context.module, context.operation);
  if (providerFn) {
    try {
      providerBucket = await providerFn(context, helpers);
    } catch (_e) {
      providerBucket = null;
    }
  }

  if (!providerBucket && projectionApi) {
    providerBucket = { itens: [] };
    try {
      resumo = await projectionApi.obterResumoPrestacao({ consignacaoId: context.entityId });
      if (Array.isArray(resumo?.itens) && resumo.itens.length) {
        providerBucket.itens = resumo.itens;
      }
    } catch (_e) {
      resumo = null;
    }
    try {
      if (consignacao.clienteId) {
        situacao = await projectionApi.obterSituacaoCliente({ clienteId: consignacao.clienteId });
      }
    } catch (_e) {
      situacao = null;
    }
  } else if (projectionApi) {
    try {
      situacao = await projectionApi.obterSituacaoCliente({ clienteId: consignacao.clienteId });
    } catch (_e) {
      situacao = null;
    }
  }

  if (api.obterPerfil && consignacao.perfilComercialId) {
    try {
      perfil = await api.obterPerfil(consignacao.perfilComercialId);
    } catch (_e) {
      perfil = null;
    }
  }

  // 3. Checkpoint + 4. Cache auxiliar — via ordem oficial
  const { itens, source } = RecoveryProvider.resolveItens({
    api: { itens: apiItens },
    provider: providerBucket,
    checkpoint,
    cache: { itens: cacheItens }
  });

  const entity = {
    ...consignacao,
    itens,
    clienteNome: situacao?.clienteNome || checkpoint.clienteNome || null,
    perfilNome: perfil?.perfilTipo || checkpoint.perfilNome || null,
    perfilStatus: perfil
      ? (perfil.ativo && !perfil.bloqueado ? 'ATIVO' : 'INATIVO')
      : (checkpoint.perfilStatus || null),
    limite: situacao?.limiteDisponivel ?? perfil?.limiteComercial ?? checkpoint.limite ?? null,
    saldo: resumo?.saldoAtual ?? situacao?.saldoEmAberto ?? checkpoint.saldo ?? null
  };

  return {
    entity,
    checkpoint,
    fromApi: source === 'api' || Boolean(consignacao),
    fromCheckpoint: source === 'checkpoint',
    source: source === 'api' ? 'api' : (source ? `api+${source}` : 'api'),
    extras: { perfil, situacao, resumo, itensSource: source }
  };
}

module.exports = {
  loadConsignacaoOperacao,
  loadPrepararEntrega: loadConsignacaoOperacao,
  loadEntrega: loadConsignacaoOperacao
};
