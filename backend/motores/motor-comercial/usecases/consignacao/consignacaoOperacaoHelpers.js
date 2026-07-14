/**
 * Helpers operacionais da Consignacao — Sprint 2.4.2
 *
 * @module motores/motor-comercial/usecases/consignacao/consignacaoOperacaoHelpers
 */

const { CATALOGO_COMPLETO } = require('../../config/comercialTiposMovimentacao');
const {
  ConsignacaoNaoEncontradaError,
  ConsignacaoNaoEntregueError,
  EntregaJaRealizadaError,
  PrestacaoJaAbertaError,
  MovimentacaoInvalidaError,
  PerfilSemLimiteDisponivelError,
  ClienteBloqueadoError
} = require('../../domain/errors');
const {
  STATUS_RASCUNHO,
  STATUS_ENTREGUE,
  validarPerfilConsignado,
  validarDocumentoUnico
} = require('./consignacaoUseCaseHelpers');

/**
 * @param {Object} consignacao
 * @returns {boolean}
 */
function prestacaoEstaAberta(consignacao) {
  const prestacao = consignacao?.prestacaoContasAtiva;
  return Boolean(prestacao && prestacao.status === 'ABERTA');
}

/**
 * @param {Object|null} consignacao
 * @returns {Object}
 */
function obterConsignacaoEntregue(consignacao) {
  if (!consignacao) {
    throw new ConsignacaoNaoEncontradaError();
  }
  if (consignacao.status !== STATUS_ENTREGUE) {
    throw new ConsignacaoNaoEntregueError(consignacao.id, consignacao.status);
  }
  return consignacao;
}

/**
 * @param {Object[]} itens
 * @returns {number}
 */
function calcularValorTotalItens(itens) {
  return itens.reduce(
    (sum, item) => sum + Number(item.quantidadeEntregue ?? 0) * Number(item.precoUnitario ?? 0),
    0
  );
}

/**
 * @param {Object} item
 * @returns {number}
 */
function calcularSaldoItem(item) {
  return Number(item.quantidadeEntregue ?? 0)
    - Number(item.quantidadeDevolvida ?? 0)
    - Number(item.quantidadeVendida ?? 0)
    - Number(item.quantidadePerdida ?? 0)
    - Number(item.quantidadeCortesia ?? 0);
}

/**
 * @param {Object} consignacao
 * @param {Object} [contexto]
 * @returns {Object}
 */
function criarSnapshotConsignacao(consignacao, contexto = {}) {
  return {
    contexto,
    consignacaoId: consignacao.id,
    clienteId: consignacao.clienteId,
    perfilComercialId: consignacao.perfilComercialId,
    status: consignacao.status,
    documento: consignacao.documento,
    valorTotalEntregue: consignacao.valorTotalEntregue,
    saldoAberto: consignacao.saldoAberto,
    capturadoEm: new Date().toISOString()
  };
}

/**
 * @param {import('../../infrastructure/transactions/UnitOfWork')} uow
 * @param {Object} dados
 * @returns {Promise<Object>}
 */
async function registrarMovimentacaoComercial(uow, dados) {
  const tipo = CATALOGO_COMPLETO[dados.tipoMovimentacao];
  if (!tipo) {
    throw new MovimentacaoInvalidaError(`Tipo de movimentação inválido: ${dados.tipoMovimentacao}`);
  }

  return uow.movimentacaoComercial.inserir({
    consignacaoId: dados.consignacaoId,
    consignacaoItemId: dados.consignacaoItemId ?? null,
    tipoMovimentacao: dados.tipoMovimentacao,
    origem: dados.origem ?? 'USUARIO',
    correlationId: dados.correlationId,
    causationId: dados.causationId ?? null,
    grupoPrestacaoContasId: dados.grupoPrestacaoContasId ?? null,
    snapshot: dados.snapshot ?? null,
    usuarioId: dados.usuarioId ?? null,
    dataMovimentacao: dados.dataMovimentacao ?? new Date().toISOString(),
    valor: dados.valor ?? null,
    quantidade: dados.quantidade ?? null,
    motivo: dados.motivo ?? null,
    detalhes: dados.detalhes ?? null,
    referenciaExterna: dados.referenciaExterna ?? null
  });
}

/**
 * @param {import('../../infrastructure/transactions/UnitOfWork')} uow
 * @param {number|string} perfilId
 * @param {number} valor
 * @returns {Promise<Object>}
 */
async function consumirLimitePerfil(uow, perfilId, valor, options = {}) {
  const { obterSaldoAbertoPerfilDerivado } = require('../../services/projections/ledgerCacheSync');
  const perfil = await uow.perfilComercial.buscarPorId(perfilId);
  if (!perfil) {
    throw new PerfilSemLimiteDisponivelError({ perfilId, motivo: 'Perfil não encontrado' });
  }
  if (perfil.bloqueado) {
    throw new ClienteBloqueadoError(perfil.clienteId, perfil.motivoBloqueio);
  }

  const saldoAtual = await obterSaldoAbertoPerfilDerivado(uow, perfilId);
  const limite = Number(perfil.limiteComercial ?? 0);
  const novoSaldo = saldoAtual + valor;

  if (novoSaldo > limite && !options.permitirExcessoAutorizado) {
    throw new PerfilSemLimiteDisponivelError({
      perfilId,
      limiteComercial: limite,
      saldoAberto: saldoAtual,
      valorSolicitado: valor
    });
  }

  return perfil;
}

/**
 * @param {import('../../infrastructure/transactions/UnitOfWork')} uow
 * @param {number|string} perfilId
 * @param {number} valor
 * @returns {Promise<Object>}
 */
async function liberarLimitePerfil(uow, perfilId) {
  const { sincronizarCachePerfil } = require('../../services/projections/ledgerCacheSync');
  const perfil = await uow.perfilComercial.buscarPorId(perfilId);
  if (!perfil) {
    throw new PerfilSemLimiteDisponivelError({ perfilId, motivo: 'Perfil não encontrado' });
  }

  return sincronizarCachePerfil(uow, perfilId);
}

/**
 * @param {Object} deps
 * @param {number|string} consignacaoId
 * @returns {Promise<Object>}
 */
async function executarValidacaoEntrega(deps, consignacaoId, options = {}) {
  const erros = [];
  const avisos = [];

  const consignacao = await deps.consignacaoRepository.buscarPorId(consignacaoId);
  if (!consignacao) {
    erros.push({ codigo: 'CONSIGNACAO_NAO_ENCONTRADA', mensagem: 'Consignação não encontrada' });
    return { valido: false, erros, avisos, consignacaoId };
  }

  if (consignacao.status === STATUS_ENTREGUE) {
    erros.push({ codigo: 'ENTREGA_JA_REALIZADA', mensagem: 'Entrega já realizada' });
  } else if (consignacao.status !== STATUS_RASCUNHO) {
    erros.push({
      codigo: 'CONSIGNACAO_NAO_ESTA_EM_RASCUNHO',
      mensagem: `Status atual: ${consignacao.status}`
    });
  }

  if (deps.clienteBridge) {
    const cliente = await deps.clienteBridge.buscarPorId(consignacao.clienteId);
    if (!cliente) {
      erros.push({ codigo: 'CLIENTE_NAO_ENCONTRADO', mensagem: 'Cliente não encontrado' });
    } else if (!(await deps.clienteBridge.estaAtivo(consignacao.clienteId))) {
      erros.push({ codigo: 'CLIENTE_INATIVO', mensagem: 'Cliente inativo' });
    }
  }

  let perfil = null;
  if (deps.perfilComercialRepository) {
    try {
      perfil = await deps.perfilComercialRepository.buscarPorId(consignacao.perfilComercialId);
      validarPerfilConsignado(perfil, consignacao.clienteId);
      if (perfil.bloqueado) {
        erros.push({ codigo: 'CLIENTE_BLOQUEADO', mensagem: 'Perfil bloqueado' });
      }
    } catch (err) {
      erros.push({ codigo: err.codigo, mensagem: err.message, detalhes: err.detalhes });
    }
  }

  const itens = await deps.consignacaoItemRepository.listarPorConsignacao(consignacao.id);
  if (!itens.length) {
    erros.push({ codigo: 'CONSIGNACAO_SEM_ITENS', mensagem: 'Consignação sem itens' });
  }

  const produtosVistos = new Set();
  for (const item of itens) {
    if (produtosVistos.has(item.produtoId)) {
      erros.push({
        codigo: 'PRODUTO_DUPLICADO_NA_CONSIGNACAO',
        mensagem: 'Produto duplicado',
        produtoId: item.produtoId
      });
    }
    produtosVistos.add(item.produtoId);

    if (!Number.isFinite(Number(item.quantidadeEntregue)) || Number(item.quantidadeEntregue) <= 0) {
      erros.push({ codigo: 'QUANTIDADE_INVALIDA', mensagem: 'Quantidade inválida', itemId: item.id });
    }
  }

  const valorTotal = calcularValorTotalItens(itens);
  if (perfil) {
    let saldoAbertoDerivado = 0;
    if (deps.movimentacaoComercialRepository && deps.consignacaoRepository) {
      const consignacoes = await deps.consignacaoRepository.listar({
        perfilComercialId: perfil.id
      });
      const movimentacoes = [];
      for (const consignacao of consignacoes) {
        const movs = await deps.movimentacaoComercialRepository.listar({
          consignacaoId: consignacao.id
        });
        movimentacoes.push(...movs);
      }
      const { derivarSaldoAbertoPerfil } = require('../../services/projections/ledgerCacheDerivation');
      saldoAbertoDerivado = derivarSaldoAbertoPerfil(movimentacoes);
    } else {
      saldoAbertoDerivado = Number(perfil.saldoAberto ?? 0);
    }

    const limiteDisponivel = Number(perfil.limiteComercial) - saldoAbertoDerivado;
    const { liberacaoGerencialValida } = require('../../services/autorizacaoGerencialService');
    if (valorTotal > limiteDisponivel && !liberacaoGerencialValida(options.liberacaoGerencial)) {
      erros.push({
        codigo: 'PERFIL_SEM_LIMITE_DISPONIVEL',
        mensagem: 'Limite comercial insuficiente. Solicite autorização gerencial.',
        valorTotal,
        limiteDisponivel
      });
    } else if (valorTotal > limiteDisponivel && liberacaoGerencialValida(options.liberacaoGerencial)) {
      avisos.push({
        codigo: 'LIMITE_EXCEDIDO_COM_AUTORIZACAO',
        mensagem: 'Entrega acima do limite autorizada gerencialmente para esta operação'
      });
    }
  }

  try {
    await validarDocumentoUnico(deps.consignacaoRepository, consignacao.documento ?? {}, consignacao.id);
  } catch (err) {
    erros.push({ codigo: err.codigo, mensagem: err.message });
  }

  return {
    valido: erros.length === 0,
    erros,
    avisos,
    consignacaoId: consignacao.id,
    consignacao,
    itens,
    valorTotal
  };
}

/**
 * @param {Object} consignacao
 */
function garantirSemPrestacaoAberta(consignacao) {
  if (prestacaoEstaAberta(consignacao)) {
    throw new PrestacaoJaAbertaError(consignacao.prestacaoContasAtiva?.id);
  }
}

/**
 * @param {Object} consignacao
 */
function garantirEntregaNaoRealizada(consignacao) {
  if (consignacao?.status === STATUS_ENTREGUE) {
    throw new EntregaJaRealizadaError(consignacao.id);
  }
}

module.exports = {
  prestacaoEstaAberta,
  obterConsignacaoEntregue,
  calcularValorTotalItens,
  calcularSaldoItem,
  criarSnapshotConsignacao,
  registrarMovimentacaoComercial,
  consumirLimitePerfil,
  liberarLimitePerfil,
  executarValidacaoEntrega,
  garantirSemPrestacaoAberta,
  garantirEntregaNaoRealizada
};
