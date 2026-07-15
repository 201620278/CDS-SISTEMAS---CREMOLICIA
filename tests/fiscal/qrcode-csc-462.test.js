/**
 * Testes unitários — geração QR Code NFC-e / CSC (rejeição 462).
 */
const assert = require('assert');
const crypto = require('crypto');
const {
  gerarQRCodeNFCe,
  normalizarIdCSC
} = require('../../backend/services/fiscal/qrcode');

const CHAVE = '23260765957340000150650010000010231603320932';
const TOKEN = 'F6A577B1-DCA9-4853-9342-0A8CA718BC68';

function hashEsperado(chave, versao, amb, idToken, token) {
  return crypto
    .createHash('sha1')
    .update(`${chave}|${versao}|${amb}|${idToken}${token}`)
    .digest('hex')
    .toUpperCase();
}

function segmentos(url) {
  return String(url).split('p=')[1].split('|');
}

// 000001 → cIdToken=1 (QR v2 sem zeros à esquerda)
{
  const norm = normalizarIdCSC('000001');
  assert.strictEqual(norm.idToken, '1');
  assert.strictEqual(norm.idCSCFormatado, '000001');
}

// Nunca default silencioso para "1" com valor vazio
{
  assert.throws(() => normalizarIdCSC(''), /não configurado/i);
  assert.throws(() => normalizarIdCSC(null), /não configurado/i);
}

// QR com ID 000001 + token oficial
{
  const url = gerarQRCodeNFCe({
    chave: CHAVE,
    ambiente: 2,
    idCSC: '000001',
    CSC: TOKEN
  });

  const segs = segmentos(url);
  assert.strictEqual(segs[1], '2', 'versao QR');
  assert.strictEqual(segs[2], '2', 'tpAmb homologação');
  assert.strictEqual(segs[3], '1', 'cIdToken deve ser 1 (de 000001)');
  assert.notStrictEqual(segs[3], '2', 'cIdToken NÃO pode ser 2');
  assert.notStrictEqual(segs[3], '000002');
  assert.strictEqual(segs[4], hashEsperado(CHAVE, '2', '2', '1', TOKEN));
  assert.ok(url.includes('nfceh.sefaz.ce.gov.br'));
}

// ID numérico "1" também válido
{
  const url = gerarQRCodeNFCe({
    chave: CHAVE,
    ambiente: 2,
    idCSC: '1',
    CSC: TOKEN
  });
  assert.strictEqual(segmentos(url)[3], '1');
}

// Token obrigatório
{
  assert.throws(
    () => gerarQRCodeNFCe({ chave: CHAVE, ambiente: 2, idCSC: '000001', CSC: '' }),
    /Token CSC/i
  );
}

// Hash muda se trocar o token (não pode usar outro CSC)
{
  const urlA = gerarQRCodeNFCe({ chave: CHAVE, ambiente: 2, idCSC: '000001', CSC: TOKEN });
  const urlB = gerarQRCodeNFCe({
    chave: CHAVE,
    ambiente: 2,
    idCSC: '000001',
    CSC: '8E11BF5F-38FF-43CF-A460-7A1E2B4E1F4B'
  });
  assert.notStrictEqual(segmentos(urlA)[4], segmentos(urlB)[4]);
}

// Exemplo oficial do Manual DANFE NFC-e / QR Code v2 (§4.4.1)
{
  const chaveManual = '28170800156225000131650110000151341562040824';
  const url = gerarQRCodeNFCe({
    chave: chaveManual,
    ambiente: 1,
    idCSC: '000001',
    CSC: 'SEU-CODIGO-CSC-CONTRIBUINTE-36-CARACTERES',
    consultaUrl: 'http://www.sefazexemplo.gov.br/nfce/qrcode'
  });
  assert.strictEqual(
    segmentos(url)[4],
    'DC6AE2C2B9A992BE59679AC365E29922DE6B7511',
    'hash deve bater com o exemplo oficial do manual'
  );
}

console.log('OK: QR Code CSC — cIdToken=1 a partir de 000001; sem fallback; hash do token configurado.');
