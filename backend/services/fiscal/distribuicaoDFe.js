/**
 * Distribuição DF-e — SEFAZ → SOAP → Download XML → Central de Entradas.
 *
 * Sprint 4: responsabilidade exclusiva de sincronizar documentos na inbox.
 * NÃO cria compras, NÃO altera estoque/financeiro, NÃO chama MIIP.
 *
 * @module services/fiscal/distribuicaoDFe
 */

const { getFiscalConfig } = require('./configService');
const { montarSoapDFe, enviarSoapDFe } = require('./soapClient');
const CentralDfePersistenciaService = require('../../motores/central-entradas/services/CentralDfePersistenciaService');
const CentralDocumentosRepository = require('../../motores/central-entradas/repositories/CentralDocumentosRepository');
const CentralNsuRepository = require('../../motores/central-entradas/repositories/CentralNsuRepository');
const {
  NSU_ZERADO,
  normalizarNsu,
  nsuMenorQue,
  extrairMetadadosRetorno,
  extrairDocumentosZip,
  retornoDistSucesso
} = require('./dfeRetornoParser');

const MAX_ITERACOES_SYNC = 50;

function getDfeUrl(ambiente) {
  return ambiente === 1
    ? 'https://www.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx'
    : 'https://hom1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx';
}

/**
 * @param {Object} config
 * @returns {string}
 */
function obterCodigoUf(config) {
  const codigo = config.fiscal_codigo_uf || config.codigo_uf || '23';
  return String(codigo).replace(/\D/g, '').padStart(2, '0');
}

/**
 * @param {Object} config
 * @throws {Error}
 */
function validarConfigFiscal(config) {
  if (!config.certificadoPath || !config.certificadoSenha) {
    throw new Error('Certificado não configurado');
  }

  if (!config.cnpj) {
    throw new Error('CNPJ do emitente não configurado');
  }
}

/**
 * @param {Object} params
 * @returns {string}
 */
function montarXmlDistNsu({ ambiente, codigoUf, cnpj, ultNsu }) {
  return `
<distDFeInt xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.01">
  <tpAmb>${ambiente}</tpAmb>
  <cUFAutor>${codigoUf}</cUFAutor>
  <CNPJ>${cnpj}</CNPJ>
  <distNSU>
    <ultNSU>${normalizarNsu(ultNsu)}</ultNSU>
  </distNSU>
</distDFeInt>`;
}

/**
 * @param {Object} params
 * @returns {string}
 */
function montarXmlConsChave({ ambiente, codigoUf, cnpj, chave }) {
  return `
<distDFeInt xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.01">
  <tpAmb>${ambiente}</tpAmb>
  <cUFAutor>${codigoUf}</cUFAutor>
  <CNPJ>${cnpj}</CNPJ>
  <consChNFe>
    <chNFe>${String(chave).replace(/\D/g, '')}</chNFe>
  </consChNFe>
</distDFeInt>`;
}

/**
 * @param {string} xmlConsulta
 * @param {Object} config
 * @param {number} ambiente
 * @returns {Promise<string>}
 */
async function enviarConsultaDfe(xmlConsulta, config, ambiente) {
  const envelope = montarSoapDFe(xmlConsulta);
  return enviarSoapDFe(
    envelope,
    config.certificadoPath,
    config.certificadoSenha,
    getDfeUrl(ambiente)
  );
}

/**
 * @param {string} xmlRetorno
 * @param {CentralDfePersistenciaService} persistencia
 * @param {string} origem
 * @returns {Promise<{ notasNovas: number, notasDuplicadas: number, ignorados: number }>}
 */
async function persistirDocumentosRetorno(xmlRetorno, persistencia, origem) {
  const documentos = extrairDocumentosZip(xmlRetorno);
  let notasNovas = 0;
  let notasDuplicadas = 0;
  let ignorados = 0;

  for (const doc of documentos) {
    const resultado = await persistencia.persistirDocumentoDfe({
      xml: doc.xml,
      nsu: doc.nsu,
      origem
    });

    if (resultado.novo) notasNovas += 1;
    else if (resultado.duplicado) notasDuplicadas += 1;
    else if (resultado.ignorado) ignorados += 1;
  }

  return { notasNovas, notasDuplicadas, ignorados };
}

/**
 * @param {Object} [deps]
 * @returns {Promise<Object>}
 */
async function sincronizarDistribuicaoDFe(deps = {}) {
  const config = await getFiscalConfig();
  validarConfigFiscal(config);

  const ambiente = Number(config.fiscal_ambiente || config.ambiente || 2);
  const cnpj = String(config.cnpj).replace(/\D/g, '');
  const codigoUf = obterCodigoUf(config);

  const nsuRepository = deps.nsuRepository ?? new CentralNsuRepository();
  const persistencia = deps.persistenciaService ?? new CentralDfePersistenciaService();

  let controleNsu = await nsuRepository.obterOuCriar(cnpj, ambiente);
  let ultNsuAtual = normalizarNsu(controleNsu.ultNsu);
  let maxNsuAtual = normalizarNsu(controleNsu.maxNsu || NSU_ZERADO);

  let notasNovasTotal = 0;
  let notasDuplicadasTotal = 0;
  let ignoradosTotal = 0;
  let iteracoes = 0;
  let ultimoRetorno = null;

  while (iteracoes < (deps.maxIteracoes ?? MAX_ITERACOES_SYNC)) {
    iteracoes += 1;

    const xmlConsulta = montarXmlDistNsu({
      ambiente,
      codigoUf,
      cnpj,
      ultNsu: ultNsuAtual
    });

    const xmlRetorno = await enviarConsultaDfe(xmlConsulta, config, ambiente);
    ultimoRetorno = extrairMetadadosRetorno(xmlRetorno);

    if (!retornoDistSucesso(ultimoRetorno.cStat)) {
      throw new Error(
        ultimoRetorno.xMotivo
          || `SEFAZ retornou cStat ${ultimoRetorno.cStat || 'desconhecido'}`
      );
    }

    const persistidos = await persistirDocumentosRetorno(xmlRetorno, persistencia, 'dfe');
    notasNovasTotal += persistidos.notasNovas;
    notasDuplicadasTotal += persistidos.notasDuplicadas;
    ignoradosTotal += persistidos.ignorados;

    ultNsuAtual = normalizarNsu(ultimoRetorno.ultNSU);
    maxNsuAtual = normalizarNsu(ultimoRetorno.maxNSU);

    controleNsu = await nsuRepository.atualizarSincronizacao(controleNsu.id, {
      ultNsu: ultNsuAtual,
      maxNsu: maxNsuAtual
    });

    if (!nsuMenorQue(ultNsuAtual, maxNsuAtual)) {
      break;
    }
  }

  return {
    sucesso: true,
    notasNovas: notasNovasTotal,
    notasDuplicadas: notasDuplicadasTotal,
    ignorados: ignoradosTotal,
    ultNsu: ultNsuAtual,
    maxNsu: maxNsuAtual,
    iteracoes,
    cStat: ultimoRetorno?.cStat || '138',
    mensagem: notasNovasTotal > 0
      ? `${notasNovasTotal} nova(s) nota(s) sincronizada(s)`
      : 'Sincronização concluída — nenhuma nota nova',
    ultimaSincronizacao: controleNsu.dataSincronizacao || controleNsu.updatedAt
  };
}

/**
 * Compatibilidade legada — delega à sincronização oficial.
 *
 * @deprecated RC1 — Use POST /api/central-entradas/sincronizar
 * @returns {Promise<Object>}
 */
async function distribuirDocumentosRecebidos() {
  const resultado = await sincronizarDistribuicaoDFe();
  return {
    sucesso: resultado.sucesso,
    notasNovas: resultado.notasNovas,
    mensagem: resultado.mensagem,
    ultNsu: resultado.ultNsu,
    maxNsu: resultado.maxNsu
  };
}

/**
 * @param {string} chave
 * @param {Object} [deps]
 * @returns {Promise<Object>}
 */
async function consultarNotaPorChave(chave, deps = {}) {
  const config = await getFiscalConfig();
  validarConfigFiscal(config);

  const chaveLimpa = String(chave || '').replace(/\D/g, '');
  if (chaveLimpa.length !== 44) {
    throw new Error('Chave deve conter 44 dígitos');
  }

  const ambiente = Number(config.fiscal_ambiente || config.ambiente || 2);
  const cnpj = String(config.cnpj).replace(/\D/g, '');
  const codigoUf = obterCodigoUf(config);
  const persistencia = deps.persistenciaService ?? new CentralDfePersistenciaService();

  const xmlConsulta = montarXmlConsChave({
    ambiente,
    codigoUf,
    cnpj,
    chave: chaveLimpa
  });

  const xmlRetorno = await enviarConsultaDfe(xmlConsulta, config, ambiente);
  const metadados = extrairMetadadosRetorno(xmlRetorno);

  if (!retornoDistSucesso(metadados.cStat) && metadados.cStat !== '138') {
    throw new Error(metadados.xMotivo || `SEFAZ retornou cStat ${metadados.cStat}`);
  }

  const persistidos = await persistirDocumentosRetorno(xmlRetorno, persistencia, 'consulta_chave');

  return {
    sucesso: true,
    chave: chaveLimpa,
    cStat: metadados.cStat,
    mensagem: metadados.xMotivo,
    notasNovas: persistidos.notasNovas,
    notasDuplicadas: persistidos.notasDuplicadas,
    ignorados: persistidos.ignorados
  };
}

/**
 * Lista documentos da Central (compatibilidade legada /api/dfe/consultar-notas).
 *
 * @deprecated RC1 — Use GET /api/central-entradas/documentos
 * @returns {Promise<Object>}
 */
async function consultarNotasRecebidas() {
  const repository = new CentralDocumentosRepository();
  const documentos = await repository.listar({ limite: 200, ordenarPor: 'created_at', ordenarDirecao: 'DESC' });

  return {
    sucesso: true,
    mensagem: 'Notas da Central Inteligente de Entradas',
    notas: documentos.map((doc) => ({
      id: doc.id,
      chave: doc.chave,
      numero: doc.numero,
      serie: doc.serie,
      fornecedor: doc.fornecedor,
      cnpj_fornecedor: doc.cnpjFornecedor,
      data_emissao: doc.dataEmissao,
      valor_total: doc.valorTotal,
      status: doc.status,
      origem: doc.origem,
      nsu: doc.nsu,
      created_at: doc.createdAt
    }))
  };
}

module.exports = {
  sincronizarDistribuicaoDFe,
  distribuirDocumentosRecebidos,
  consultarNotaPorChave,
  consultarNotasRecebidas,
  getDfeUrl,
  montarXmlDistNsu,
  montarXmlConsChave,
  extrairMetadadosRetorno,
  extrairDocumentosZip,
  persistirDocumentosRetorno
};
