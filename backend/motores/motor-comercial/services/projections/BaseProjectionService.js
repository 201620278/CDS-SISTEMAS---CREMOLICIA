/**
 * BaseProjectionService — Padronização dos Projection Services.
 *
 * Sprint 2.4.4: leitura/projeção — sem escrita, sem regras comerciais.
 *
 * @abstract
 * @class BaseProjectionService
 */

const ProjectionContext = require('./ProjectionContext');
const ProjectionResult = require('./ProjectionResult');

class BaseProjectionService {
  /**
   * @param {Object} [deps]
   */
  constructor(deps = {}) {
    if (new.target === BaseProjectionService) {
      throw new Error('BaseProjectionService é abstrata e não pode ser instanciada diretamente');
    }

    this._deps = deps;
    this._movimentacaoComercialRepository = deps.movimentacaoComercialRepository ?? null;
    this._movimentacaoPerfilRepository = deps.movimentacaoPerfilRepository ?? null;
    this._consignacaoRepository = deps.consignacaoRepository ?? null;
    this._perfilComercialRepository = deps.perfilComercialRepository ?? null;
    this._projectionCache = deps.projectionCache ?? null;
  }

  /**
   * @param {Object|ProjectionContext} entrada
   * @returns {Promise<ProjectionResult>}
   */
  async executar(entrada) {
    const contexto = entrada instanceof ProjectionContext
      ? entrada
      : ProjectionContext.create(entrada);

    await this.validar(contexto);
    const dadosBrutos = await this.consultar(contexto);
    const projetado = await this.projetar(dadosBrutos, contexto);
    return this.retornar(projetado, contexto);
  }

  /**
   * @param {ProjectionContext} _contexto
   * @returns {Promise<void>}
   */
  async validar(_contexto) {
    // subclasses implementam validações mínimas de contexto
  }

  /**
   * @abstract
   * @param {ProjectionContext} _contexto
   * @returns {Promise<*>}
   */
  async consultar(_contexto) {
    throw new Error(`${this.constructor.name} deve implementar consultar()`);
  }

  /**
   * @abstract
   * @param {*} _dadosBrutos
   * @param {ProjectionContext} _contexto
   * @returns {Promise<*>}
   */
  async projetar(_dadosBrutos, _contexto) {
    throw new Error(`${this.constructor.name} deve implementar projetar()`);
  }

  /**
   * @param {Object} projetado
   * @param {ProjectionContext} contexto
   * @returns {ProjectionResult}
   */
  retornar(projetado, contexto) {
    return ProjectionResult.create({
      dados: projetado.dados ?? projetado,
      totais: projetado.totais ?? {},
      indicadores: projetado.indicadores ?? {},
      paginacao: projetado.paginacao ?? {},
      metadata: {
        derivadoDoLedger: true,
        servico: this.constructor.name,
        contexto: contexto.toJSON(),
        ...(projetado.metadata ?? {})
      }
    });
  }
}

module.exports = BaseProjectionService;
