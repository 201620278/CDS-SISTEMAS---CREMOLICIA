/**
 * MiipPipelineEngineRunner — Executa engines via MotorRegistry no Pipeline.
 *
 * Sprint RC1: pipeline oficial com encadeamento semântico completo.
 *
 * Fluxo: Canonical → Attribute → Synonym → GTIN → Fornecedor → Similarity
 *
 * @module motores/miip/core/MiipPipelineEngineRunner
 */

const MotorRegistry = require('./MotorRegistry');

const ENGINES_IDENTIFICACAO = Object.freeze([
  'motor_gtin',
  'motor_associacao_fornecedor'
]);

const CODIGO_CANONICAL = 'motor_canonical';
const CODIGO_ATTRIBUTE = 'motor_attribute_extractor';
const CODIGO_SYNONYMS = 'motor_synonyms';
const CODIGO_SIMILARITY = 'motor_similarity';

/**
 * @param {import('./MotorRegistry')} [motorRegistry]
 * @returns {Function}
 */
function criarResolverEngines(motorRegistry = MotorRegistry) {
  return (_config, _context) => motorRegistry.listarAtivos().map((motor) => ({
    codigo: motor.codigo,
    prioridade: Number(motor.prioridade ?? 0),
    instancia: motor.instancia
  }));
}

/**
 * @private
 * @param {Object} candidatos
 * @returns {Object|null}
 */
function obterMelhorCandidato(candidatos) {
  if (!Array.isArray(candidatos) || candidatos.length === 0) return null;
  return candidatos.reduce((melhor, atual) => {
    const scoreMelhor = Number(melhor?.scoreTotal ?? melhor?.scorePonderado ?? 0);
    const scoreAtual = Number(atual?.scoreTotal ?? atual?.scorePonderado ?? 0);
    return scoreAtual > scoreMelhor ? atual : melhor;
  }, candidatos[0]);
}

/**
 * @private
 * @param {Object} instancias
 * @param {string} nome
 * @param {import('./MiipContext')|Object} contexto
 * @returns {Promise<Object|null>}
 */
async function construirSemanticDeNome(instancias, nome, contexto) {
  if (!nome) return null;

  const canonical = instancias[CODIGO_CANONICAL];
  const attribute = instancias[CODIGO_ATTRIBUTE];
  const synonyms = instancias[CODIGO_SYNONYMS];

  if (!canonical || !attribute) return null;

  await canonical.identificar({ produtoNome: nome }, contexto);
  const canonicalProduct = canonical.obterUltimoCanonical?.() ?? null;
  if (!canonicalProduct) return null;

  await attribute.identificar(canonicalProduct, contexto);
  let semantic = attribute.obterUltimoSemantic?.() ?? null;

  if (semantic && synonyms) {
    await synonyms.identificar(semantic, contexto);
    semantic = synonyms.obterUltimoSemantic?.() ?? semantic;
  }

  return semantic;
}

/**
 * Executa engines registrados na ordem oficial do pipeline.
 *
 * @param {import('./MotorRegistry')} [motorRegistry]
 * @returns {Function}
 */
function criarEngineExecutor(motorRegistry = MotorRegistry) {
  return async (engines, item, context) => {
    const candidatos = [];
    const produtosPorMotor = [];
    const instancias = {};
    const meta = {
      canonicalProduct: null,
      semanticProduct: null,
      similarityResult: null,
      tempoPorEngine: {}
    };

    for (const engine of engines) {
      const codigo = engine.codigo;
      const instancia = engine.instancia;
      if (!instancia || typeof instancia.identificar !== 'function') continue;

      instancias[codigo] = instancia;
      const inicio = Date.now();

      try {
        if (codigo === CODIGO_CANONICAL) {
          await instancia.identificar(item, context);
          meta.canonicalProduct = instancia.obterUltimoCanonical?.() ?? null;
        } else if (codigo === CODIGO_ATTRIBUTE) {
          const entrada = meta.canonicalProduct ?? item;
          await instancia.identificar(entrada, context);
          meta.semanticProduct = instancia.obterUltimoSemantic?.() ?? null;
        } else if (codigo === CODIGO_SYNONYMS) {
          const entrada = meta.semanticProduct ?? item;
          await instancia.identificar(entrada, context);
          meta.semanticProduct = instancia.obterUltimoSemantic?.() ?? meta.semanticProduct;
        } else if (ENGINES_IDENTIFICACAO.includes(codigo)) {
          const resultado = await instancia.identificar(item, context);
          const lista = Array.isArray(resultado) ? resultado : [];

          produtosPorMotor.push(
            lista.length > 0
              ? Number(lista[0].produtoId ?? lista[0].produto_id) || null
              : null
          );
          candidatos.push(...lista);
        } else if (codigo === CODIGO_SIMILARITY) {
          const melhor = obterMelhorCandidato(candidatos);
          if (meta.semanticProduct && melhor && typeof instancia.comparar === 'function') {
            const nomeCandidato = melhor?.produto?.nome
              ?? melhor?.produtoNome
              ?? melhor?.nome
              ?? melhor?.snapshot?.nome
              ?? '';
            const semanticCandidato = await construirSemanticDeNome(instancias, nomeCandidato, context);
            if (semanticCandidato) {
              meta.similarityResult = instancia.comparar(meta.semanticProduct, semanticCandidato);
            }
          }
        } else {
          const resultado = await instancia.identificar(item, context);
          const lista = Array.isArray(resultado) ? resultado : [];
          candidatos.push(...lista);
        }
      } catch {
        if (ENGINES_IDENTIFICACAO.includes(codigo)) {
          produtosPorMotor.push(null);
        }
      }

      meta.tempoPorEngine[codigo] = Date.now() - inicio;
    }

    candidatos._meta = {
      produtosPorMotor,
      canonicalProduct: meta.canonicalProduct,
      semanticProduct: meta.semanticProduct,
      similarityResult: meta.similarityResult,
      tempoPorEngine: meta.tempoPorEngine
    };

    return candidatos;
  };
}

module.exports = {
  criarResolverEngines,
  criarEngineExecutor,
  ENGINES_IDENTIFICACAO
};
