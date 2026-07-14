/**
 * BuildInfo oficial — Plataforma CDS.
 *
 * Expõe metadados de build do módulo em execução (bundle Electron/ERP).
 * STAB-03: evita divergência silenciosa entre fontes e artefato servido.
 *
 * @module frontend/shared/build/BuildInfo
 */

const PLACEHOLDER_HASH = '<<CDS_BUNDLE_HASH>>';

/**
 * @typedef {Object} CdsBuildInfo
 * @property {string} module
 * @property {string} version
 * @property {string} sprint
 * @property {string} buildTime
 * @property {string} hash
 * @property {string} ambiente
 */

/**
 * Normaliza e valida payload de build.
 * @param {Partial<CdsBuildInfo>} raw
 * @returns {CdsBuildInfo}
 */
function normalizeBuildInfo(raw = {}) {
  return {
    module: String(raw.module || 'unknown'),
    version: String(raw.version || '0.0.0'),
    sprint: String(raw.sprint || 'unknown'),
    buildTime: String(raw.buildTime || ''),
    hash: String(raw.hash || PLACEHOLDER_HASH),
    ambiente: String(raw.ambiente || 'development')
  };
}

/**
 * Publica window.CDS_BUILD e imprime banner no console.
 * @param {Partial<CdsBuildInfo>} raw
 * @returns {CdsBuildInfo}
 */
function publishBuildInfo(raw = {}) {
  const info = normalizeBuildInfo(raw);

  if (typeof window !== 'undefined') {
    window.CDS_BUILD = info;
  }

  printBuildBanner(info);
  return info;
}

/**
 * Banner oficial no console (Electron / DevTools).
 * @param {CdsBuildInfo} info
 */
function printBuildBanner(info) {
  const lines = [
    '================================================',
    'CDS Sistemas',
    info.module === 'motor-comercial' ? 'Motor Comercial' : String(info.module),
    'Sprint',
    info.sprint,
    'Build',
    info.buildTime,
    'Hash',
    info.hash,
    '================================================'
  ];

  const text = `\n${lines.join('\n')}\n`;

  if (typeof console !== 'undefined' && typeof console.info === 'function') {
    console.info(text);
  }

  return text;
}

/**
 * Valida presença e completude de CDS_BUILD em runtime.
 * @param {Partial<CdsBuildInfo>|null} info
 * @param {{ requiredSprint?: string }} [opts]
 * @returns {{ ok: boolean, errors: string[] }}
 */
function validateBuildInfo(info, opts = {}) {
  const errors = [];
  if (!info || typeof info !== 'object') {
    errors.push('window.CDS_BUILD ausente — bundle possivelmente antigo ou não gerado.');
    return { ok: false, errors };
  }

  ['module', 'version', 'sprint', 'buildTime', 'hash', 'ambiente'].forEach((key) => {
    if (!info[key] || String(info[key]).trim() === '') {
      errors.push(`CDS_BUILD.${key} ausente ou vazio`);
    }
  });

  if (info.hash === PLACEHOLDER_HASH) {
    errors.push('CDS_BUILD.hash ainda é placeholder — build incompleto');
  }

  if (opts.requiredSprint && String(info.sprint) !== String(opts.requiredSprint)) {
    errors.push(
      `Sprint esperada "${opts.requiredSprint}", encontrada "${info.sprint}" — bundle desatualizado`
    );
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Falha de forma visível se o bundle estiver inválido/desatualizado.
 * Nunca inicia silenciosamente com artefato antigo.
 * @param {Partial<CdsBuildInfo>|null} info
 * @param {{ requiredSprint?: string, throwOnError?: boolean }} [opts]
 */
function assertBuildInfoOrBlock(info, opts = {}) {
  const requiredSprint = opts.requiredSprint || 'UX-10';
  const result = validateBuildInfo(info, { requiredSprint });

  if (result.ok) return result;

  const message = [
    '[CDS STAB-03] Bundle do Motor Comercial inválido ou desatualizado.',
    ...result.errors.map((e) => ` - ${e}`),
    'Execute: npm run build:motor-comercial && npm run verify:motor-comercial'
  ].join('\n');

  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    console.error(message);
  }

  if (typeof document !== 'undefined') {
    const host = document.getElementById('page-content') || document.body;
    if (host) {
      const alert = document.createElement('div');
      alert.className = 'alert alert-danger';
      alert.setAttribute('role', 'alert');
      alert.style.cssText = 'margin:16px;padding:16px;white-space:pre-wrap;font-family:monospace;';
      alert.textContent = message;
      host.prepend(alert);
    }
  }

  if (opts.throwOnError !== false) {
    throw new Error(message);
  }

  return result;
}

module.exports = {
  PLACEHOLDER_HASH,
  normalizeBuildInfo,
  publishBuildInfo,
  printBuildBanner,
  validateBuildInfo,
  assertBuildInfoOrBlock
};
