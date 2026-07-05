/**
 * AttributeParser — Localiza e extrai atributos de CanonicalProduct.
 *
 * Sprint 8 — sem banco, XML ou comparação entre produtos.
 *
 * @module motores/miip/utils/AttributeParser
 */

const path = require('path');
const fs = require('fs');
const CanonicalToken = require('../core/CanonicalToken');
const SemanticAttribute = require('../core/SemanticAttribute');
const SemanticAttributeType = require('../core/SemanticAttributeType');
const TokenType = require('../core/TokenType');

const DEFAULT_CONFIG_DIR = path.join(__dirname, '../config/attribute-dictionaries');

const ORIGEM = Object.freeze({
  TOKEN_TIPO: 'token_tipo',
  DICIONARIO: 'dicionario',
  PADRAO_MEDIDA: 'padrao_medida',
  INFERENCIA: 'inferencia'
});

const CONFIANCA = Object.freeze({
  TOKEN_DIRETO: 100,
  DICIONARIO: 95,
  PADRAO: 90,
  INFERENCIA: 85
});

/** @type {string[]} */
const CAMPOS_ALVO = [
  'marca', 'modelo', 'tipo', 'tecnologia', 'potencia', 'tensao', 'corrente',
  'cor', 'material', 'acabamento', 'bitola', 'diametro', 'comprimento',
  'largura', 'altura', 'espessura', 'peso', 'volume', 'capacidade',
  'quantidadeEmbalagem', 'unidadeMedida', 'embalagem'
];

/** @type {Object|null} */
let _configCache = null;

/**
 * @param {string} arquivo
 * @returns {Object}
 */
function lerJsonSeguro(arquivo) {
  try {
    return JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  } catch {
    return {};
  }
}

/**
 * @param {string} [caminhoDir]
 * @returns {Object}
 */
function carregarConfig(caminhoDir = DEFAULT_CONFIG_DIR) {
  if (_configCache && caminhoDir === DEFAULT_CONFIG_DIR) {
    return _configCache;
  }

  const brands = lerJsonSeguro(path.join(caminhoDir, 'brands.json'));
  const technologies = lerJsonSeguro(path.join(caminhoDir, 'technologies.json'));
  const packages = lerJsonSeguro(path.join(caminhoDir, 'package-types.json'));
  const units = lerJsonSeguro(path.join(caminhoDir, 'units.json'));
  const colors = lerJsonSeguro(path.join(caminhoDir, 'colors.json'));
  const materials = lerJsonSeguro(path.join(caminhoDir, 'materials.json'));

  const config = {
    marcas: new Set((brands.marcas ?? []).map((m) => m.toUpperCase())),
    tecnologias: new Set((technologies.tecnologias ?? []).map((t) => t.toUpperCase())),
    tipos: new Set((technologies.tipos ?? []).map((t) => t.toUpperCase())),
    embalagens: new Set((packages.embalagens ?? []).map((e) => e.toUpperCase())),
    unidades: new Set((units.unidades ?? []).map((u) => u.toUpperCase())),
    cores: new Set((colors.cores ?? []).map((c) => c.toUpperCase())),
    materiais: new Set((materials.materiais ?? []).map((m) => m.toUpperCase())),
    acabamentos: new Set((materials.acabamentos ?? []).map((a) => a.toUpperCase()))
  };

  if (caminhoDir === DEFAULT_CONFIG_DIR) {
    _configCache = config;
  }

  return config;
}

/**
 * @returns {void}
 */
function reiniciarCacheConfig() {
  _configCache = null;
}

/**
 * @param {string} campo
 * @param {string|number} valor
 * @param {number} confianca
 * @param {string} origem
 * @param {string} [tipoAtributo]
 * @returns {SemanticAttribute}
 */
function criarAtributo(campo, valor, confianca, origem, tipoAtributo) {
  const tipo = tipoAtributo ?? mapearCampoParaTipo(campo);
  const valorStr = String(valor).toUpperCase();

  return SemanticAttribute.create({
    tipo,
    valor,
    confianca,
    origem,
    normalizado: valorStr,
    metadata: { campo }
  });
}

/**
 * @param {string} campo
 * @returns {string}
 */
function mapearCampoParaTipo(campo) {
  const mapa = {
    marca: SemanticAttributeType.MARCA,
    modelo: SemanticAttributeType.MODELO,
    tipo: SemanticAttributeType.TIPO,
    tecnologia: SemanticAttributeType.TECNOLOGIA,
    potencia: SemanticAttributeType.POTENCIA,
    tensao: SemanticAttributeType.TENSAO,
    cor: SemanticAttributeType.COR,
    material: SemanticAttributeType.MATERIAL,
    bitola: SemanticAttributeType.BITOLA,
    diametro: SemanticAttributeType.DIAMETRO,
    peso: SemanticAttributeType.PESO,
    volume: SemanticAttributeType.VOLUME,
    capacidade: SemanticAttributeType.CAPACIDADE,
    embalagem: SemanticAttributeType.EMBALAGEM,
    unidadeMedida: SemanticAttributeType.UNIDADE,
    quantidadeEmbalagem: SemanticAttributeType.QUANTIDADE
  };

  return mapa[campo] ?? SemanticAttributeType.OUTRO;
}

/**
 * @param {import('../core/CanonicalProduct')} canonical
 * @returns {CanonicalToken[]}
 */
function obterTokens(canonical) {
  if (Array.isArray(canonical.normalizedTokens) && canonical.normalizedTokens.length > 0) {
    return canonical.normalizedTokens;
  }

  if (Array.isArray(canonical.tokens) && canonical.tokens.length > 0) {
    return canonical.tokens.map((texto, posicao) => CanonicalToken.create({
      textoOriginal: texto,
      textoCanonico: texto,
      tipo: TokenType.DESCONHECIDO,
      posicao,
      normalizado: texto
    }));
  }

  if (canonical.canonico) {
    return canonical.canonico.split(/\s+/).filter(Boolean).map((texto, posicao) => (
      CanonicalToken.create({
        textoOriginal: texto,
        textoCanonico: texto,
        tipo: TokenType.DESCONHECIDO,
        posicao,
        normalizado: texto
      })
    ));
  }

  return [];
}

/**
 * @param {string} texto
 * @returns {boolean}
 */
function ehNumeroPuro(texto) {
  return /^\d+(?:\.\d+)?$/.test(String(texto ?? ''));
}

/**
 * @param {CanonicalToken} token
 * @param {Object<string, SemanticAttribute>} resultado
 */
function extrairMedida(token, resultado) {
  const texto = token.textoCanonico.toUpperCase();

  if (/^\d+\/\d+$/.test(texto) && !resultado.bitola) {
    resultado.bitola = criarAtributo('bitola', texto, CONFIANCA.PADRAO, ORIGEM.PADRAO_MEDIDA);
    return;
  }

  const dimensao = texto.match(/^(\d+(?:\.\d+)?)X(\d+(?:\.\d+)?)$/i);
  if (dimensao) {
    if (!resultado.comprimento) {
      resultado.comprimento = criarAtributo('comprimento', dimensao[1], CONFIANCA.PADRAO, ORIGEM.PADRAO_MEDIDA);
    }
    if (!resultado.largura) {
      resultado.largura = criarAtributo('largura', dimensao[2], CONFIANCA.PADRAO, ORIGEM.PADRAO_MEDIDA);
    }
    return;
  }

  const composto = texto.match(/^(\d+(?:\.\d+)?)([A-Z]{1,4})$/);
  if (!composto) return;

  const valorCompleto = texto;
  const unidade = composto[2];

  const regras = [
    { unidades: ['W', 'KW'], campo: 'potencia' },
    { unidades: ['V'], campo: 'tensao' },
    { unidades: ['A'], campo: 'corrente' },
    { unidades: ['KG', 'G', 'MG'], campo: 'peso' },
    { unidades: ['ML', 'L', 'LT'], campo: 'volume' },
    { unidades: ['MM'], campo: 'diametro' },
    { unidades: ['POL'], campo: 'diametro' },
    { unidades: ['CM', 'M'], campo: 'comprimento' },
    { unidades: ['M2'], campo: 'capacidade' },
    { unidades: ['M3'], campo: 'capacidade' }
  ];

  regras.forEach((regra) => {
    if (regra.unidades.includes(unidade) && !resultado[regra.campo]) {
      resultado[regra.campo] = criarAtributo(
        regra.campo,
        valorCompleto,
        CONFIANCA.TOKEN_DIRETO,
        ORIGEM.PADRAO_MEDIDA
      );
    }
  });
}

/**
 * @param {CanonicalToken} token
 * @param {Object} config
 * @param {Object<string, SemanticAttribute>} resultado
 * @param {Set<number>} usados
 */
function extrairPorDicionario(token, config, resultado, usados) {
  const texto = token.textoCanonico.toUpperCase();

  if (config.marcas.has(texto) && !resultado.marca) {
    resultado.marca = criarAtributo('marca', texto, CONFIANCA.DICIONARIO, ORIGEM.DICIONARIO);
    usados.add(token.posicao);
    return;
  }

  if (config.tipos.has(texto) && !resultado.tipo) {
    resultado.tipo = criarAtributo('tipo', texto, CONFIANCA.DICIONARIO, ORIGEM.DICIONARIO);
    usados.add(token.posicao);
    return;
  }

  if (config.tecnologias.has(texto) && !resultado.tecnologia) {
    resultado.tecnologia = criarAtributo('tecnologia', texto, CONFIANCA.DICIONARIO, ORIGEM.DICIONARIO);
    usados.add(token.posicao);
    return;
  }

  if (config.materiais.has(texto) && !resultado.material) {
    resultado.material = criarAtributo('material', texto, CONFIANCA.DICIONARIO, ORIGEM.DICIONARIO);
    usados.add(token.posicao);
    return;
  }

  if (config.acabamentos.has(texto) && !resultado.acabamento) {
    resultado.acabamento = criarAtributo('acabamento', texto, CONFIANCA.DICIONARIO, ORIGEM.DICIONARIO);
    usados.add(token.posicao);
    return;
  }

  if (config.cores.has(texto) && !resultado.cor) {
    resultado.cor = criarAtributo('cor', texto, CONFIANCA.DICIONARIO, ORIGEM.DICIONARIO);
    usados.add(token.posicao);
    return;
  }

  if (config.embalagens.has(texto) && !resultado.embalagem) {
    resultado.embalagem = criarAtributo('embalagem', texto, CONFIANCA.DICIONARIO, ORIGEM.DICIONARIO);
    usados.add(token.posicao);
  }
}

/**
 * @param {CanonicalToken[]} tokens
 * @param {Object<string, SemanticAttribute>} resultado
 */
function extrairQuantidadeEmbalagem(tokens, resultado) {
  if (resultado.quantidadeEmbalagem) return;

  const indiceEmbalagem = tokens.findIndex((token) => {
    const campo = resultado.embalagem?.valor;
    return campo && token.textoCanonico.toUpperCase() === String(campo).toUpperCase();
  });

  if (indiceEmbalagem >= 0) {
    for (let i = indiceEmbalagem + 1; i < tokens.length; i += 1) {
      const texto = tokens[i].textoCanonico;
      if (ehNumeroPuro(texto)) {
        resultado.quantidadeEmbalagem = criarAtributo(
          'quantidadeEmbalagem',
          Number(texto),
          CONFIANCA.INFERENCIA,
          ORIGEM.INFERENCIA
        );
        return;
      }
    }
  }

  const ultimo = tokens[tokens.length - 1];
  if (ultimo && ehNumeroPuro(ultimo.textoCanonico) && resultado.embalagem) {
    resultado.quantidadeEmbalagem = criarAtributo(
      'quantidadeEmbalagem',
      Number(ultimo.textoCanonico),
      CONFIANCA.INFERENCIA,
      ORIGEM.INFERENCIA
    );
  }
}

/**
 * @param {CanonicalToken[]} tokens
 * @param {Object<string, SemanticAttribute>} resultado
 * @param {Set<number>} usados
 */
function extrairTipoInferido(tokens, resultado, usados) {
  if (resultado.tipo) return;

  const candidato = tokens.find((token) => {
    if (usados.has(token.posicao)) return false;
    const texto = token.textoCanonico.toUpperCase();
    if (ehNumeroPuro(texto)) return false;
    if (token.tipo === TokenType.MARCA) return false;
    if (token.tipo === TokenType.EMBALAGEM) return false;
    if (token.tipo === TokenType.MEDIDA) return false;
    if (token.tipo === TokenType.QUANTIDADE) return false;
    return token.tipo === TokenType.PALAVRA || token.tipo === TokenType.DESCONHECIDO;
  });

  if (candidato) {
    resultado.tipo = criarAtributo(
      'tipo',
      candidato.textoCanonico,
      CONFIANCA.INFERENCIA,
      ORIGEM.INFERENCIA
    );
    usados.add(candidato.posicao);
  }
}

/**
 * @param {CanonicalToken[]} tokens
 * @param {Object<string, SemanticAttribute>} resultado
 */
function extrairUnidadeMedida(tokens, resultado) {
  if (resultado.unidadeMedida) return;

  const medida = tokens.find((token) => {
    const texto = token.textoCanonico.toUpperCase();
    return /^\d+(?:\.\d+)?(?:KG|G|ML|L|LT|MM|CM|M|UN)$/i.test(texto);
  });

  if (medida) {
    const match = medida.textoCanonico.toUpperCase().match(/[A-Z]{1,4}$/);
    if (match) {
      resultado.unidadeMedida = criarAtributo(
        'unidadeMedida',
        match[0],
        CONFIANCA.PADRAO,
        ORIGEM.PADRAO_MEDIDA
      );
    }
  }
}

/**
 * Extrai atributos estruturados de um CanonicalProduct.
 *
 * @param {import('../core/CanonicalProduct')} canonicalProduct
 * @param {Object} [opcoes]
 * @param {Object} [opcoes.config]
 * @param {string} [opcoes.configDir]
 * @returns {Object<string, SemanticAttribute>}
 */
function extrairAtributos(canonicalProduct, opcoes = {}) {
  const config = opcoes.config ?? carregarConfig(opcoes.configDir ?? DEFAULT_CONFIG_DIR);
  const tokens = obterTokens(canonicalProduct);
  /** @type {Object<string, SemanticAttribute>} */
  const resultado = {};
  const usados = new Set();

  tokens.forEach((token) => {
    const texto = token.textoCanonico.toUpperCase();

    if (token.tipo === TokenType.MARCA && !resultado.marca) {
      resultado.marca = criarAtributo('marca', texto, CONFIANCA.TOKEN_DIRETO, ORIGEM.TOKEN_TIPO);
      usados.add(token.posicao);
      return;
    }

    if (token.tipo === TokenType.EMBALAGEM && !resultado.embalagem) {
      resultado.embalagem = criarAtributo('embalagem', texto, CONFIANCA.TOKEN_DIRETO, ORIGEM.TOKEN_TIPO);
      usados.add(token.posicao);
      return;
    }

    if (token.tipo === TokenType.MEDIDA || /^\d/.test(texto)) {
      extrairMedida(token, resultado);
      if (Object.values(resultado).some((attr) => attr.normalizado === texto)) {
        usados.add(token.posicao);
      }
    }
  });

  tokens.forEach((token) => {
    if (!usados.has(token.posicao)) {
      extrairPorDicionario(token, config, resultado, usados);
    }
  });

  tokens.forEach((token) => {
    if (!usados.has(token.posicao) && (token.tipo === TokenType.MEDIDA || /^\d/.test(token.textoCanonico))) {
      extrairMedida(token, resultado);
    }
  });

  extrairTipoInferido(tokens, resultado, usados);
  extrairQuantidadeEmbalagem(tokens, resultado);
  extrairUnidadeMedida(tokens, resultado);

  return resultado;
}

module.exports = {
  extrairAtributos,
  carregarConfig,
  reiniciarCacheConfig,
  obterTokens,
  criarAtributo,
  CAMPOS_ALVO,
  CONFIANCA,
  ORIGEM,
  DEFAULT_CONFIG_DIR
};
