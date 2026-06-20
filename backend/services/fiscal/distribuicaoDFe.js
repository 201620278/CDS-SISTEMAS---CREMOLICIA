const zlib = require('zlib');
const db = require('../../database');
const { getFiscalConfig } = require('./configService');
const { carregarCertificadoPfx } = require('./certificateService');
const { montarSoapDFe, enviarSoapDFe } = require('./soapClient');

async function consultarNotasRecebidas() {
    try {
        const config = await getFiscalConfig();

        if (!config.certificadoPath || !config.certificadoSenha) {
            throw new Error('Certificado não configurado');
        }

        // TODO: Implementar chamada ao serviço de Distribuição DF-e da SEFAZ
        // Este será o coração do módulo que:
        // 1. Carrega o certificado A1
        // 2. Faz a consulta ao serviço de Distribuição DF-e
        // 3. Recebe os XMLs das notas recebidas
        // 4. Salva no banco de dados

        console.log('Iniciando consulta de notas recebidas via Distribuição DF-e...');
        
        // Placeholder para implementação futura
        return {
            sucesso: true,
            mensagem: 'Serviço de Distribuição DF-e ainda não implementado',
            notas: []
        };
    } catch (error) {
        console.error('Erro ao consultar notas recebidas:', error);
        throw error;
    }
}

async function distribuirDocumentosRecebidos() {
    const config = await getFiscalConfig();
    const ambiente = Number(config.fiscal_ambiente || config.ambiente || 2);
    const cnpj = String(config.cnpj).replace(/\D/g, '');

    const xmlConsulta = `
    <distDFeInt
        xmlns="http://www.portalfiscal.inf.br/nfe"
        versao="1.01">

        <tpAmb>${ambiente}</tpAmb>

        <cUFAutor>23</cUFAutor>

        <CNPJ>${cnpj}</CNPJ>

        <distNSU>

            <ultNSU>
                000000000000000
            </ultNSU>

        </distNSU>

    </distDFeInt>`;

    const envelope = montarSoapDFe(xmlConsulta);

    const retorno = await enviarSoapDFe(
        envelope,
        config.certificadoPath,
        config.certificadoSenha,
        getDfeUrl(ambiente)
    );

    console.log('========== RETORNO SEFAZ ==========');
    console.log(retorno);
    console.log('===================================');

    return processarRetorno(retorno);
}

async function consultarNotaPorChave(chave) {
    const config = await getFiscalConfig();
    const ambiente = Number(config.fiscal_ambiente || config.ambiente || 2);
    const cnpj = String(config.cnpj).replace(/\D/g, '');
    const chaveLimpa = String(chave).trim();

    const xmlConsulta = `
<distDFeInt xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.01">
    <tpAmb>${ambiente}</tpAmb>
    <cUFAutor>23</cUFAutor>
    <CNPJ>${cnpj}</CNPJ>
    <consChNFe>
        <chNFe>${chaveLimpa}</chNFe>
    </consChNFe>
</distDFeInt>`;

    const envelope = montarSoapDFe(xmlConsulta);

    const retorno = await enviarSoapDFe(
        envelope,
        config.certificadoPath,
        config.certificadoSenha,
        getDfeUrl(ambiente)
    );

    console.log('========== RETORNO SEFAZ ==========');
    console.log(retorno);
    console.log('===================================');

    return processarRetorno(retorno);
}

function getDfeUrl(ambiente) {
    return ambiente === 1
        ? 'https://www1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx'
        : 'https://hom1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx';
}

function processarRetorno(xmlRetorno) {
    const notas = [];

    const regex = /<docZip[^>]*>(.*?)<\/docZip>/gs;

    let match;

    while ((match = regex.exec(xmlRetorno)) !== null) {
        const xmlCompactado = match[1];

        const xmlDescompactado =
            zlib.gunzipSync(
                Buffer.from(xmlCompactado, 'base64')
            ).toString('utf8');

        // Extract data from XML
        const chave = xmlDescompactado.match(/<chNFe>(.*?)<\/chNFe>/)?.[1] || '';
        const numero = xmlDescompactado.match(/<nNF>(.*?)<\/nNF>/)?.[1] || '';
        const fornecedor = xmlDescompactado.match(/<xNome>(.*?)<\/xNome>/)?.[1] || '';
        const nsu = xmlRetorno.match(/<NSU>(.*?)<\/NSU>/)?.[1] || '';

        // Auto-save with INSERT OR IGNORE
        if (chave) {
            db.run(`
                INSERT OR IGNORE INTO notas_recebidas_dfe
                (chave, numero, fornecedor, xml, nsu)
                VALUES (?, ?, ?, ?, ?)
            `, [chave, numero, fornecedor, xmlDescompactado, nsu], (err) => {
                if (err) {
                    console.error('Erro ao salvar nota DF-e:', err);
                } else {
                    console.log(`Nota DF-e salva: ${chave}`);
                }
            });
        }

        notas.push({
            chave,
            numero,
            fornecedor,
            xml: xmlDescompactado,
            nsu
        });
    }

    return notas;
}

console.log('distribuirDocumentosRecebidos function defined:', typeof distribuirDocumentosRecebidos);

module.exports = {
    consultarNotasRecebidas,
    distribuirDocumentosRecebidos,
    consultarNotaPorChave
};
