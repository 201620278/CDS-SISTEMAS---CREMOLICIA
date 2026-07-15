const crypto = require('crypto');

/**
 * QR Code NFC-e versão 2 (online) — NT 2015.002 / XSD leiauteNFe.
 *
 * Formato: URL?p=<chave>|2|<tpAmb>|<cIdToken>|<SHA1 hex>
 *
 * cIdToken (QR v2): SEM zeros à esquerda.
 * Ex.: config "000001" → QR "1"  |  Nunca usar versão QR (2) nem tpAmb como idCSC.
 */

const URL_CONSULTA_CE = Object.freeze({
  1: 'https://nfce.sefaz.ce.gov.br/pages/consultaNota.jsf',
  2: 'https://nfceh.sefaz.ce.gov.br/pages/consultaNota.jsf'
});

function onlyDigits(value) {
  return String(value ?? '').replace(/\D/g, '');
}

/**
 * Normaliza o identificador CSC para o 4º parâmetro do QR Code v2.
 * Preserva o valor configurado (ex.: 000001) como origem, mas emite sem zeros à esquerda.
 *
 * @param {string|number} idCSC
 * @returns {{ idToken: string, idCSCOrigem: string, idCSCFormatado: string }}
 */
function normalizarIdCSC(idCSC) {
  const idCSCOrigem = String(idCSC ?? '').trim();
  const digitos = onlyDigits(idCSCOrigem);

  if (!digitos) {
    throw new Error(
      'ID CSC (fiscal_id_csc) não configurado. Informe o identificador cadastrado na SEFAZ (ex.: 000001).'
    );
  }

  // Remove zeros à esquerda — exigência do QR Code v2 (XSD: 0|[1-9][0-9]{0,5})
  const idToken = String(parseInt(digitos, 10));
  if (!/^(0|[1-9]\d{0,5})$/.test(idToken)) {
    throw new Error(`ID CSC inválido para QR Code v2: "${idCSCOrigem}"`);
  }

  const idCSCFormatado = digitos.padStart(6, '0').slice(-6);

  return { idToken, idCSCOrigem, idCSCFormatado };
}

function normalizarTokenCSC(CSC) {
  const token = String(CSC ?? '').trim();
  if (!token) {
    throw new Error(
      'Token CSC (fiscal_token_csc) não configurado. Informe o token cadastrado na SEFAZ.'
    );
  }
  return token;
}

function obterUrlBaseConsulta(tpAmb, consultaUrlConfigurada) {
  const configurada = String(consultaUrlConfigurada || '').trim().replace(/\/+$/, '');
  if (configurada) {
    return configurada.includes('?') ? configurada : `${configurada}?p=`;
  }

  const base = URL_CONSULTA_CE[Number(tpAmb)] || URL_CONSULTA_CE[2];
  return `${base}?p=`;
}

function obterUrlChaveConsulta(tpAmb, consultaUrlConfigurada) {
  const configurada = String(consultaUrlConfigurada || '').trim().replace(/\/+$/, '').replace(/\?p=$/i, '');
  if (configurada) {
    return configurada.split('?')[0];
  }
  return URL_CONSULTA_CE[Number(tpAmb)] || URL_CONSULTA_CE[2];
}

/**
 * @param {{
 *   chave: string,
 *   ambiente: string|number,
 *   idCSC: string|number,
 *   CSC: string,
 *   consultaUrl?: string
 * }} params
 * @returns {string} URL completa do QR Code
 */
function gerarQRCodeNFCe({ chave, ambiente, idCSC, CSC, consultaUrl }) {
  const versaoQR = '2';
  const tpAmb = String(Number(ambiente));
  if (![1, 2].includes(Number(tpAmb))) {
    throw new Error(`Ambiente fiscal inválido para QR Code: ${ambiente}`);
  }

  const chaveDigits = onlyDigits(chave);
  if (chaveDigits.length !== 44) {
    throw new Error(`Chave de acesso inválida para QR Code (${chaveDigits.length} dígitos).`);
  }

  const { idToken, idCSCOrigem, idCSCFormatado } = normalizarIdCSC(idCSC);
  const token = normalizarTokenCSC(CSC);

  // Manual DANFE NFC-e / QR Code v2 (online):
  // 1) chave|versaoQR|tpAmb|cIdToken
  // 2) concatena o CSC (token) SEM separador extra
  // 3) SHA-1 → hexadecimal maiúsculo (40 bytes)
  const dadosParaHash = `${chaveDigits}|${versaoQR}|${tpAmb}|${idToken}`;
  const stringSha1 = dadosParaHash + token;

  console.log('[FISCAL QR][PRE-SHA1] idCSC origem=', idCSCOrigem);
  console.log('[FISCAL QR][PRE-SHA1] idCSC formatado=', idCSCFormatado);
  console.log('[FISCAL QR][PRE-SHA1] cIdToken (QR)=', idToken);
  console.log('[FISCAL QR][PRE-SHA1] CSC utilizado=', token);
  console.log('[FISCAL QR][PRE-SHA1] CSC length=', token.length);
  console.log('[FISCAL QR][PRE-SHA1] string hash (params)=', dadosParaHash);
  console.log('[FISCAL QR][PRE-SHA1] string completa SHA-1=', stringSha1);

  const hashCSC = crypto
    .createHash('sha1')
    .update(stringSha1, 'utf8')
    .digest('hex')
    .toUpperCase();

  console.log('[FISCAL QR][PRE-SHA1] hash final=', hashCSC);
  if (Number(tpAmb) === 2) {
    console.log(
      '[FISCAL QR][AVISO] Ambiente HOMOLOGAÇÃO: o CSC deve ser o cadastrado em ' +
        'https://nfceh.sefaz.ce.gov.br (Consultar CSC). CSC de produção NÃO vale aqui.'
    );
  }

  const urlBase = obterUrlBaseConsulta(tpAmb, consultaUrl);
  const qrUrl = `${urlBase}${chaveDigits}|${versaoQR}|${tpAmb}|${idToken}|${hashCSC}`;

  console.log(
    `[FISCAL QR] cIdToken=${idToken} (origem=${idCSCOrigem}, formatado=${idCSCFormatado}) ` +
      `tpAmb=${tpAmb} versaoQR=${versaoQR} tokenLen=${token.length} hash=${hashCSC}`
  );

  // Guarda-rail: nunca confundir versão/ambiente com idCSC no log de auditoria
  const segmentos = (qrUrl.split('p=')[1] || '').split('|');
  if (segmentos[3] !== idToken) {
    throw new Error(
      `Falha interna na montagem do QR Code: cIdToken esperado=${idToken}, obtido=${segmentos[3]}`
    );
  }
  if (segmentos[3] === '2' && idToken !== '2') {
    throw new Error('Falha interna: cIdToken resultou em 2 indevidamente.');
  }

  return qrUrl;
}

module.exports = {
  gerarQRCodeNFCe,
  normalizarIdCSC,
  normalizarTokenCSC,
  obterUrlChaveConsulta,
  obterUrlBaseConsulta,
  URL_CONSULTA_CE
};
