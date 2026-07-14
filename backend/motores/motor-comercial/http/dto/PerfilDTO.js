/**
 * PerfilDTO — DTOs HTTP para Perfil Comercial.
 *
 * Sprint 2.5: API REST — DTOs de perfil.
 *
 * @module motores/motor-comercial/http/dto/PerfilDTO
 */

const ClienteMestreDTO = require('../../dto/ClienteMestreDTO');

class CriarPerfilRequest {
  /**
   * @param {Object} data
   * @param {string} data.clienteId
   * @param {string} data.perfilTipo
   * @param {boolean} [data.ativo]
   * @param {number} [data.limiteComercial]
   * @param {string} [data.observacoes]
   * @param {string} [data.motivo]
   * @param {string} [data.usuarioId]
   * @param {string} [data.correlationId]
   */
  static fromJSON(data) {
    return {
      clienteId: data.clienteId,
      perfilTipo: data.perfilTipo,
      ativo: data.ativo !== undefined ? data.ativo : true,
      limiteComercial: data.limiteComercial || 0,
      observacoes: data.observacoes || null,
      motivo: data.motivo || null,
      usuarioId: data.usuarioId || null,
      correlationId: data.correlationId || null
    };
  }

  /**
   * Valida os dados da requisição.
   * @param {Object} data
   * @returns {Object|null}
   */
  static validate(data) {
    const errors = [];

    if (!data.clienteId) {
      errors.push('clienteId é obrigatório');
    }
    if (!data.perfilTipo) {
      errors.push('perfilTipo é obrigatório');
    }

    return errors.length > 0 ? { errors } : null;
  }
}

class AtualizarPerfilRequest {
  /**
   * @param {Object} data
   * @param {string} [data.ativo]
   * @param {string} [data.observacoes]
   * @param {string} [data.usuarioId]
   */
  static fromJSON(data) {
    return {
      ativo: data.ativo,
      observacoes: data.observacoes,
      usuarioId: data.usuarioId || null
    };
  }
}

class AlterarLimiteRequest {
  /**
   * @param {Object} data
   * @param {number} data.novoLimite
   * @param {string} [data.motivo]
   * @param {string} [data.usuarioId]
   */
  static fromJSON(data) {
    return {
      novoLimite: data.novoLimite,
      motivo: data.motivo || null,
      usuarioId: data.usuarioId || null
    };
  }

  /**
   * Valida os dados da requisição.
   * @param {Object} data
   * @returns {Object|null}
   */
  static validate(data) {
    const errors = [];

    if (data.novoLimite === undefined || data.novoLimite === null) {
      errors.push('novoLimite é obrigatório');
    }
    if (typeof data.novoLimite !== 'number' || data.novoLimite < 0) {
      errors.push('novoLimite deve ser um número positivo');
    }

    return errors.length > 0 ? { errors } : null;
  }
}

class PerfilResponse {
  /**
   * Converte entidade de domínio para DTO de resposta.
   * @param {Object} perfil
   * @returns {Object}
   */
  static toJSON(perfil) {
    if (!perfil) return null;

    const cliente = perfil.cliente
      ? ClienteMestreDTO.create(perfil.cliente).toJSON()
      : null;

    const response = {
      id: perfil.id,
      clienteId: perfil.clienteId,
      perfilTipo: perfil.perfilTipo,
      ativo: perfil.ativo,
      bloqueado: perfil.bloqueado,
      motivoBloqueio: perfil.motivoBloqueio,
      limiteComercial: perfil.limiteComercial,
      saldoAberto: perfil.saldoAberto,
      observacoes: perfil.observacoes,
      dataAtivacao: perfil.dataAtivacao,
      dataInativacao: perfil.dataInativacao,
      dataBloqueio: perfil.dataBloqueio,
      dataDesbloqueio: perfil.dataDesbloqueio,
      createdAt: perfil.createdAt,
      updatedAt: perfil.updatedAt,
      cliente
    };

    if (cliente) {
      response.clienteNome = cliente.nome;
      response.cpfCnpj = cliente.documento;
      response.telefone = cliente.telefone;
    }

    return response;
  }
}

class LimiteResponse {
  /**
   * Converte dados de limite para DTO de resposta.
   * @param {Object} limiteData
   * @returns {Object}
   */
  static toJSON(limiteData) {
    if (!limiteData) return null;

    return {
      limiteComercial: limiteData.limiteComercial || 0,
      saldoAberto: limiteData.saldoAberto || 0,
      limiteDisponivel: limiteData.limiteDisponivel || 0,
      percentualUtilizado: limiteData.percentualUtilizado || 0
    };
  }
}

class ScoreResponse {
  /**
   * Converte dados de score para DTO de resposta.
   * @param {Object} scoreData
   * @returns {Object}
   */
  static toJSON(scoreData) {
    if (!scoreData) return null;

    return {
      score: scoreData.score || 0,
      nivel: scoreData.nivel || 'DESCONHECIDO',
      fatores: scoreData.fatores || [],
      ultimaAtualizacao: scoreData.ultimaAtualizacao || null
    };
  }
}

module.exports = {
  CriarPerfilRequest,
  AtualizarPerfilRequest,
  AlterarLimiteRequest,
  PerfilResponse,
  LimiteResponse,
  ScoreResponse
};
