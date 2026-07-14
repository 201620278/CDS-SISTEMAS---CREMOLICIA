/**
 * PerfilComercialController — Camada HTTP do perfil comercial de clientes.
 *
 * Sprint 2.5: API REST — implementação completa dos endpoints.
 *
 * @module motores/motor-comercial/controllers/PerfilComercialController
 */

const { obterContainer } = require('../index');
const { CriarPerfilRequest, AtualizarPerfilRequest, AlterarLimiteRequest, PerfilResponse, LimiteResponse, ScoreResponse } = require('../http/dto');
const ResultHttpMapper = require('../../../shared/http/mappers/ResultHttpMapper');
const StandardResponse = require('../../../shared/http/responses/StandardResponse');

class PerfilComercialController {
  /** @returns {import('../infrastructure/di/ComercialDependencyContainer')} */
  get _container() {
    return obterContainer();
  }

  /**
   * GET /perfil-comercial
   * Lista todos os perfis comerciais.
   */
  async listar(req, res, next) {
    try {
      const { clienteId, perfilTipo, ativo, bloqueado } = req.query;
      
      const perfilRepository = this._container.perfilComercialRepository;
      const perfis = await perfilRepository.listar({
        clienteId: clienteId != null ? Number(clienteId) : undefined,
        perfilTipo,
        ativo: ativo !== undefined ? ativo === 'true' : undefined,
        bloqueado: bloqueado !== undefined ? bloqueado === 'true' : undefined
      });

      const response = StandardResponse.success(
        perfis.map(p => PerfilResponse.toJSON(p)),
        { total: perfis.length }
      );
      
      const enriched = StandardResponse.enrich(response, req);
      return res.status(StandardResponse.getStatusCode(response)).json(enriched);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /perfil-comercial/:id
   * Consulta um perfil comercial por ID.
   */
  async consultarPorId(req, res, next) {
    try {
      const { id } = req.params;
      
      const perfilRepository = this._container.perfilComercialRepository;
      const perfil = await perfilRepository.buscarPorId(id);

      if (!perfil) {
        const response = StandardResponse.notFound('Perfil comercial não encontrado');
        const enriched = StandardResponse.enrich(response, req);
        return res.status(StandardResponse.getStatusCode(response)).json(enriched);
      }

      const response = StandardResponse.success(PerfilResponse.toJSON(perfil));
      const enriched = StandardResponse.enrich(response, req);
      return res.status(StandardResponse.getStatusCode(response)).json(enriched);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /perfil-comercial
   * Cria um novo perfil comercial.
   */
  async criar(req, res, next) {
    try {
      const validation = CriarPerfilRequest.validate(req.body);
      if (validation) {
        const response = StandardResponse.validationError('Dados inválidos', validation.errors);
        const enriched = StandardResponse.enrich(response, req);
        return res.status(StandardResponse.getStatusCode(response)).json(enriched);
      }

      const inputData = CriarPerfilRequest.fromJSON(req.body);
      inputData.correlationId = req.correlationId;

      const useCase = this._container.criarPerfilComercialUseCase;
      const result = await useCase.executar(inputData);

      const response = ResultHttpMapper.mapCreated(result);
      const enriched = StandardResponse.enrich(response, req);
      return res.status(StandardResponse.getStatusCode(response)).json(enriched);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /perfil-comercial/:id
   * Atualiza um perfil comercial.
   */
  async atualizar(req, res, next) {
    try {
      const { id } = req.params;
      const inputData = AtualizarPerfilRequest.fromJSON(req.body);
      inputData.perfilComercialId = id;
      inputData.correlationId = req.correlationId;

      const useCase = this._container.atualizarPerfilComercialUseCase;
      const result = await useCase.executar(inputData);

      const response = ResultHttpMapper.map(result);
      const enriched = StandardResponse.enrich(response, req);
      return res.status(StandardResponse.getStatusCode(response)).json(enriched);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /perfil-comercial/:id/bloquear
   * Bloqueia um perfil comercial.
   */
  async bloquear(req, res, next) {
    try {
      const { id } = req.params;
      const { motivo, usuarioId } = req.body;

      if (!motivo) {
        const response = StandardResponse.validationError('motivo é obrigatório');
        const enriched = StandardResponse.enrich(response, req);
        return res.status(StandardResponse.getStatusCode(response)).json(enriched);
      }

      const inputData = {
        perfilComercialId: id,
        motivo,
        usuarioId,
        correlationId: req.correlationId
      };

      const useCase = this._container.bloquearPerfilComercialUseCase;
      const result = await useCase.executar(inputData);

      const response = ResultHttpMapper.map(result);
      const enriched = StandardResponse.enrich(response, req);
      return res.status(StandardResponse.getStatusCode(response)).json(enriched);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /perfil-comercial/:id/desbloquear
   * Desbloqueia um perfil comercial.
   */
  async desbloquear(req, res, next) {
    try {
      const { id } = req.params;
      const { motivo, usuarioId } = req.body;

      const inputData = {
        perfilComercialId: id,
        motivo,
        usuarioId,
        correlationId: req.correlationId
      };

      const useCase = this._container.desbloquearPerfilComercialUseCase;
      const result = await useCase.executar(inputData);

      const response = ResultHttpMapper.map(result);
      const enriched = StandardResponse.enrich(response, req);
      return res.status(StandardResponse.getStatusCode(response)).json(enriched);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /perfil-comercial/:id/limite
   * Altera o limite de crédito de um perfil comercial.
   */
  async alterarLimite(req, res, next) {
    try {
      const { id } = req.params;
      const validation = AlterarLimiteRequest.validate(req.body);
      if (validation) {
        const response = StandardResponse.validationError('Dados inválidos', validation.errors);
        const enriched = StandardResponse.enrich(response, req);
        return res.status(StandardResponse.getStatusCode(response)).json(enriched);
      }

      const inputData = AlterarLimiteRequest.fromJSON(req.body);
      inputData.perfilComercialId = id;
      inputData.correlationId = req.correlationId;
      inputData.usuarioId = req.user?.id ?? inputData.usuarioId;

      const useCase = this._container.alterarLimiteComercialUseCase;
      const result = await useCase.executar(inputData);

      const response = ResultHttpMapper.map(result);
      const enriched = StandardResponse.enrich(response, req);
      return res.status(StandardResponse.getStatusCode(response)).json(enriched);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /perfil-comercial/:id/historico
   * Consulta o histórico de um perfil comercial.
   */
  async consultarHistorico(req, res, next) {
    try {
      const { id } = req.params;
      const { tipoMovimentacao, dataInicio, dataFim, limite, offset } = req.query;

      const inputData = {
        perfilComercialId: id,
        tipoMovimentacao,
        dataInicio,
        dataFim,
        limite: limite ? parseInt(limite) : undefined,
        offset: offset ? parseInt(offset) : undefined
      };

      const useCase = this._container.consultarHistoricoPerfilUseCase;
      const result = await useCase.executar(inputData);

      const response = StandardResponse.success(result);
      const enriched = StandardResponse.enrich(response, req);
      return res.status(StandardResponse.getStatusCode(response)).json(enriched);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /perfil-comercial/:id/score
   * Consulta o score de confiabilidade de um perfil comercial.
   */
  async consultarScore(req, res, next) {
    try {
      const { id } = req.params;

      const inputData = { perfilComercialId: id };

      const useCase = this._container.consultarScoreConfiabilidadeUseCase;
      const result = await useCase.executar(inputData);

      const response = StandardResponse.success(ScoreResponse.toJSON(result));
      const enriched = StandardResponse.enrich(response, req);
      return res.status(StandardResponse.getStatusCode(response)).json(enriched);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /perfil-comercial/:id/limite
   * Consulta o limite disponível de um perfil comercial.
   */
  async consultarLimite(req, res, next) {
    try {
      const { id } = req.params;

      const inputData = { perfilComercialId: id };

      const useCase = this._container.consultarLimiteDisponivelUseCase;
      const result = await useCase.executar(inputData);

      const response = StandardResponse.success(LimiteResponse.toJSON(result));
      const enriched = StandardResponse.enrich(response, req);
      return res.status(StandardResponse.getStatusCode(response)).json(enriched);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PerfilComercialController;
