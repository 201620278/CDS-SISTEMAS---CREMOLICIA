/**
 * MiipService — Fachada oficial e única porta de entrada do MIIP.
 *
 * Toda operação de identificação de produtos no CDS Sistemas DEVE passar
 * por este serviço. Rotas e outros módulos não devem chamar
 * MiipOrchestrator, engines ou repositories diretamente.
 *
 * Sprint 5 Integração: feature flag `usarMiip` + logs detalhados.
 *
 * @class MiipService
 */

const MiipOrchestratorMod = require('./MiipOrchestrator');
const MiipContext = require('./core/MiipContext');
const { inicializarMiip } = require('./MiipBootstrap');
const { mapearItemCompraParaIdentificavel } = require('./utils/mapearItemCompra');
const miipFeatureFlags = require('./config/miipFeatureFlags');
const integracaoLogService = require('./logs/MiipIntegracaoLogService');
const MiipConfiguracoesRepositoryMod = require('./repositories/MiipConfiguracoesRepository');
const { MiipDecisoesRepository } = require('./repositories/MiipDecisoesRepository');
const MiipLearningService = require('./services/MiipLearningService');
const MiipImportacaoXmlService = require('./services/MiipImportacaoXmlService');

class MiipService {
  /**
   * @param {Object} [deps]
   * @param {import('./MiipOrchestrator')} [deps.orchestrator]
   * @param {Object|null} [deps.db]
   * @param {Function} [deps.inicializar]
   * @param {import('./config/miipFeatureFlags')} [deps.featureFlags]
   * @param {import('./logs/MiipIntegracaoLogService')} [deps.integracaoLog]
   * @param {import('./repositories/MiipConfiguracoesRepository')} [deps.configuracoesRepository]
   * @param {import('./services/MiipLearningService')} [deps.learningService]
   * @param {import('./services/MiipImportacaoXmlService')} [deps.importacaoXmlService]
   */
  constructor(deps = {}) {
    /** @private */
    this._db = deps.db ?? null;
    /** @private */
    this._orchestrator = deps.orchestrator ?? new MiipOrchestratorMod.MiipOrchestrator({
      db: deps.db ?? null,
      configuracoesRepository: deps.configuracoesRepository
        ?? new MiipConfiguracoesRepositoryMod.MiipConfiguracoesRepository({ db: deps.db ?? null })
    });
    /** @private */
    this._inicializar = deps.inicializar ?? inicializarMiip;
    /** @private */
    this._featureFlags = deps.featureFlags ?? miipFeatureFlags;
    /** @private */
    this._integracaoLog = deps.integracaoLog ?? integracaoLogService;
    /** @private */
    this._configuracoesRepository = deps.configuracoesRepository
      ?? new MiipConfiguracoesRepositoryMod.MiipConfiguracoesRepository({ db: deps.db ?? null });
    /** @private */
    this._decisoesRepository = deps.decisoesRepository
      ?? new MiipDecisoesRepository({ db: deps.db ?? null });
    /** @private */
    this._learningService = deps.learningService
      ?? new MiipLearningService({ db: deps.db ?? null });
    /** @private */
    this._importacaoXmlService = deps.importacaoXmlService ?? new MiipImportacaoXmlService({
      integracaoLog: deps.integracaoLog ?? integracaoLogService
    });
    this._importacaoXmlService.definirMiipService(this);
    /** @private */
    this._flagSincronizada = false;
  }

  /**
   * Indica se a integração MIIP está habilitada (`usarMiip`).
   *
   * @returns {boolean}
   */
  estaHabilitado() {
    return this._featureFlags.estaHabilitado();
  }

  /**
   * Indica se a importação XML deve usar MIIP (Sprint 6A).
   *
   * @returns {boolean}
   */
  estaImportacaoXmlHabilitada() {
    return this._featureFlags.estaImportacaoXmlHabilitada();
  }

  /**
   * @returns {{ usarMiip: boolean, sincronizadoBanco: boolean }}
   */
  obterFeatureFlags() {
    return this._featureFlags.obterEstado();
  }

  /**
   * Garante bootstrap dos motores e sincroniza feature flag do banco (uma vez).
   *
   * @private
   */
  async _garantirInicializado() {
    this._inicializar({ db: this._db });

    if (!this._flagSincronizada) {
      await this._featureFlags.sincronizarDoBanco(this._configuracoesRepository);
      this._flagSincronizada = true;
    }
  }

  /**
   * Extrai produtoId do resultado consolidado.
   *
   * @param {import('./core/MiipResult')} resultado
   * @returns {number|null}
   */
  extrairProdutoId(resultado) {
    const melhor = resultado?.candidatos?.[0];
    const produtoId = Number(melhor?.produtoId ?? melhor?.produto_id);
    return Number.isFinite(produtoId) && produtoId > 0 ? produtoId : null;
  }

  /**
   * Registra evento detalhado do fluxo de integração ERP.
   *
   * @param {Object} dados
   * @returns {Object}
   */
  registrarIntegracao(dados) {
    return this._integracaoLog.registrar({
      usarMiip: this.estaHabilitado(),
      ...dados
    });
  }

  /**
   * Identifica o produto correspondente a um item externo.
   *
   * @param {import('./contracts/ItemIdentificavelDTO')|Object} item
   * @param {import('./core/MiipContext')|Object} [contexto]
   * @returns {Promise<{ encontrado: boolean, produtoId: number|null, resultado: import('./core/MiipResult'), desabilitado?: boolean }>}
   */
  async identificar(item, contexto) {
    await this._garantirInicializado();

    const contextoNormalizado = contexto instanceof MiipContext
      ? contexto
      : MiipContext.agora({ origem: 'compra', ...(contexto || {}) });

    if (!this.estaHabilitado()) {
      this.registrarIntegracao({
        evento: 'legado_feature_flag',
        origem: contextoNormalizado.origem,
        ponto: contexto?.ponto ?? 'ensureProductForItem',
        item,
        motivo: 'usarMiip=false'
      });

      return {
        encontrado: false,
        produtoId: null,
        resultado: null,
        desabilitado: true
      };
    }

    const inicio = Date.now();
    const itemNormalizado = mapearItemCompraParaIdentificavel(item);

    this.registrarIntegracao({
      evento: 'miip_inicio',
      origem: contextoNormalizado.origem,
      ponto: contexto?.ponto ?? 'ensureProductForItem',
      item: itemNormalizado
    });

    let resultado;
    let erro = null;

    try {
      resultado = await this._orchestrator.executar(itemNormalizado, contextoNormalizado);
    } catch (error) {
      erro = error?.message || 'Erro desconhecido no MIIP';
      this.registrarIntegracao({
        evento: 'miip_erro',
        origem: contextoNormalizado.origem,
        ponto: contexto?.ponto ?? 'ensureProductForItem',
        item: itemNormalizado,
        erro,
        duracaoMs: Date.now() - inicio
      });
      throw error;
    }

    const produtoId = this.extrairProdutoId(resultado);
    const duracaoMs = Date.now() - inicio;

    if (produtoId) {
      this.registrarIntegracao({
        evento: 'miip_sucesso',
        origem: contextoNormalizado.origem,
        ponto: contexto?.ponto ?? 'ensureProductForItem',
        item: itemNormalizado,
        produtoId,
        resultado,
        duracaoMs
      });
    } else {
      this.registrarIntegracao({
        evento: 'miip_sem_match',
        origem: contextoNormalizado.origem,
        ponto: contexto?.ponto ?? 'ensureProductForItem',
        item: itemNormalizado,
        resultado,
        motivo: 'nenhum candidato confiável',
        duracaoMs
      });
    }

    return {
      encontrado: produtoId != null,
      produtoId,
      resultado
    };
  }

  /**
   * @param {import('./contracts/ItemIdentificavelDTO')[]|Object[]} itens
   * @param {import('./core/MiipContext')|Object} [contexto]
   * @returns {Promise<Object[]>}
   */
  async identificarLote(itens, contexto) {
    if (!Array.isArray(itens) || itens.length === 0) return [];

    const resultados = [];
    for (const item of itens) {
      resultados.push(await this.identificar(item, contexto));
    }
    return resultados;
  }

  /**
   * Processa identificação MIIP de todos os itens de uma NF-e importada.
   * Retorna `null` quando `usarMiipImportacaoXML` está desabilitado (fluxo legado).
   *
   * @param {Object} dadosXml
   * @returns {Promise<Object|null>}
   */
  async processarImportacaoXml(dadosXml) {
    await this._garantirInicializado();

    if (!this.estaImportacaoXmlHabilitada()) {
      this.registrarIntegracao({
        evento: 'importacao_xml_legado',
        origem: 'compra',
        ponto: 'importacao_xml',
        motivo: 'usarMiipImportacaoXML=false'
      });
      return null;
    }

    return this._importacaoXmlService.processar(dadosXml);
  }

  /**
   * @returns {Object|null}
   */
  obterUltimaImportacaoXml() {
    return this._importacaoXmlService.obterSessaoAtual();
  }

  /**
   * Registra confirmação manual do operador e grava aprendizado em `miip_associacoes`.
   *
   * Exige `confirmado: true` — nunca grava automaticamente.
   *
   * @param {Object} feedback
   * @param {boolean} feedback.confirmado - Confirmação explícita do usuário
   * @param {number} feedback.produtoId - Produto escolhido
   * @param {string} feedback.fornecedorCnpj - CNPJ do fornecedor
   * @param {string} feedback.codigoFornecedor - Código cProd do fornecedor
   * @param {number} [feedback.usuarioId]
   * @param {string} [feedback.operacaoId]
   * @param {Object} [feedback.item]
   * @returns {Promise<{ sucesso: boolean, gravado: boolean, associacaoId: number|null, operacaoId: string, motivo: string|null, substituiu?: boolean }>}
   */
  async registrarFeedback(feedback) {
    await this._garantirInicializado();

    const resultado = await this._learningService.registrarConfirmacao(feedback);

    return {
      sucesso: Boolean(resultado.sucesso),
      gravado: Boolean(resultado.gravado),
      associacaoId: resultado.associacaoId ?? null,
      operacaoId: resultado.operacaoId ?? feedback?.operacaoId ?? '',
      motivo: resultado.motivo ?? null,
      reutilizacao: Boolean(resultado.reutilizacao),
      reativada: Boolean(resultado.reativada),
      substituida: Boolean(resultado.substituida),
      pendenteDecisao: Boolean(resultado.pendenteDecisao),
      estado: resultado.estado ?? null,
      conflito: resultado.conflito ?? null,
      confirmacoes: resultado.confirmacoes ?? null
    };
  }

  /**
   * @param {Object} [filtros]
   * @returns {Promise<Object[]>}
   */
  async obterHistorico(filtros = {}) {
    await this._garantirInicializado();
    const lista = await this._decisoesRepository.listar(filtros);
    return lista.map((decisao) => ({
      id: decisao.id,
      operacaoId: decisao.operacaoId,
      origem: decisao.origem,
      acao: decisao.acaoRecomendada,
      confianca: decisao.confianca,
      score: decisao.scoreFinal,
      produtoSugeridoId: decisao.produtoSugeridoId,
      produtoDecididoId: decisao.produtoDecididoId,
      conflito: decisao.conflito,
      feedbackStatus: decisao.feedbackStatus,
      duracaoMs: decisao.duracaoTotalMs,
      explicacao: decisao.metadados?.explicacao ?? null,
      versaoRegra: decisao.metadados?.versaoRegra ?? null,
      createdAt: decisao.createdAt,
      decidedAt: decisao.decidedAt
    }));
  }

  /**
   * @param {Object} [filtros]
   * @returns {Promise<Object>}
   */
  async obterEstatisticas(filtros = {}) {
    await this._garantirInicializado();
    return this._decisoesRepository.agregarEstatisticas(filtros);
  }

  /**
   * @returns {{ pronto: boolean, versao: string, metodos: string[], usarMiip: boolean }}
   */
  healthCheck() {
    return {
      pronto: true,
      versao: '1.0.0-rc1',
      usarMiip: this.estaHabilitado(),
      usarMiipImportacaoXML: this._featureFlags.obterUsarMiipImportacaoXML(),
      importacaoXmlHabilitada: this.estaImportacaoXmlHabilitada(),
      metodos: [
        'estaHabilitado',
        'estaImportacaoXmlHabilitada',
        'identificar',
        'identificarLote',
        'processarImportacaoXml',
        'obterUltimaImportacaoXml',
        'registrarIntegracao',
        'registrarFeedback',
        'obterHistorico',
        'obterEstatisticas'
      ]
    };
  }
}

const instancia = new MiipService();

module.exports = instancia;
module.exports.MiipService = MiipService;
