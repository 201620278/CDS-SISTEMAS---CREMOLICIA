/**
 * UC-010 — ValidarConsignacaoUseCase
 *
 * Preparação para entrega (Sprint 2.4.2) — somente validação, sem alterações.
 *
 * @class ValidarConsignacaoUseCase
 */

const ConsignacaoReadUseCase = require('./ConsignacaoReadUseCase');
const { DocumentoInvalidoError } = require('../../domain/errors');
const {
  STATUS_RASCUNHO,
  validarPerfilConsignado,
  validarDocumentoUnico
} = require('./consignacaoUseCaseHelpers');

class ValidarConsignacaoUseCase extends ConsignacaoReadUseCase {
  constructor(deps = {}) {
    super(deps);
    this._clienteBridge = deps.clienteBridge ?? null;
    this._perfilComercialRepository = deps.perfilComercialRepository ?? null;
  }

  async validar(entrada) {
    if (!entrada?.consignacaoId) {
      throw new DocumentoInvalidoError('consignacaoId é obrigatório');
    }
  }

  async processar(entrada) {
    const erros = [];
    const avisos = [];

    const consignacao = await this._consignacaoRepository.buscarPorId(entrada.consignacaoId);
    if (!consignacao) {
      erros.push({ codigo: 'CONSIGNACAO_NAO_ENCONTRADA', mensagem: 'Consignação não encontrada' });
      return { valido: false, erros, avisos, consignacaoId: entrada.consignacaoId };
    }

    if (consignacao.status !== STATUS_RASCUNHO) {
      erros.push({
        codigo: 'CONSIGNACAO_NAO_ESTA_EM_RASCUNHO',
        mensagem: `Status atual: ${consignacao.status}`
      });
    }

    if (this._clienteBridge) {
      const cliente = await this._clienteBridge.buscarPorId(consignacao.clienteId);
      if (!cliente) {
        erros.push({ codigo: 'CLIENTE_NAO_ENCONTRADO', mensagem: 'Cliente não encontrado' });
      } else {
        const ativo = await this._clienteBridge.estaAtivo(consignacao.clienteId);
        if (!ativo) {
          erros.push({ codigo: 'CLIENTE_INATIVO', mensagem: 'Cliente inativo' });
        }
      }
    } else {
      avisos.push({ codigo: 'CLIENTE_BRIDGE_AUSENTE', mensagem: 'Validação de cliente não executada' });
    }

    if (this._perfilComercialRepository) {
      try {
        const perfil = await this._perfilComercialRepository.buscarPorId(consignacao.perfilComercialId);
        validarPerfilConsignado(perfil, consignacao.clienteId);
      } catch (err) {
        erros.push({ codigo: err.codigo, mensagem: err.message, detalhes: err.detalhes });
      }
    } else {
      avisos.push({ codigo: 'PERFIL_REPO_AUSENTE', mensagem: 'Validação de perfil não executada' });
    }

    const itens = await this._consignacaoItemRepository.listarPorConsignacao(consignacao.id);
    if (!itens.length) {
      erros.push({ codigo: 'CONSIGNACAO_SEM_ITENS', mensagem: 'Consignação sem itens' });
    }

    const produtosVistos = new Set();
    for (const item of itens) {
      if (!item.produtoId) {
        erros.push({ codigo: 'PRODUTO_INVALIDO', mensagem: 'Item sem produto', itemId: item.id });
        continue;
      }
      if (produtosVistos.has(item.produtoId)) {
        erros.push({
          codigo: 'PRODUTO_DUPLICADO_NA_CONSIGNACAO',
          mensagem: 'Produto duplicado',
          produtoId: item.produtoId
        });
      }
      produtosVistos.add(item.produtoId);

      if (!Number.isFinite(Number(item.quantidadeEntregue)) || Number(item.quantidadeEntregue) <= 0) {
        erros.push({
          codigo: 'QUANTIDADE_INVALIDA',
          mensagem: 'Quantidade inválida no item',
          itemId: item.id
        });
      }
    }

    const documento = consignacao.documento;
    if (!documento?.numero && !documento?.serie) {
      avisos.push({ codigo: 'DOCUMENTO_INCOMPLETO', mensagem: 'Documento comercial incompleto' });
    }

    try {
      await validarDocumentoUnico(this._consignacaoRepository, documento ?? {}, consignacao.id);
    } catch (err) {
      erros.push({ codigo: err.codigo, mensagem: err.message, detalhes: err.detalhes });
    }

    return {
      valido: erros.length === 0,
      erros,
      avisos,
      consignacaoId: consignacao.id,
      status: consignacao.status,
      totalItens: itens.length
    };
  }
}

module.exports = ValidarConsignacaoUseCase;
