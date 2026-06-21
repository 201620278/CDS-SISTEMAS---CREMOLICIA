const sdkDetector = require('../sdkDetector');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class SitefAdapter {

    constructor() {
        this.nome = 'CliSiTef';
        this.sdkEncontrado = false;
        this.configuracao = null;
        this.inicializado = false;
        
        this.verificarSDK();
    }

    verificarSDK() {
        const sdks = sdkDetector.localizarSDKs();
        const sdk = sdks.find(x => x.caminho.toLowerCase().includes('clisitef'));

        if (sdk) {
            this.sdkEncontrado = true;
            this.sdk = sdk;
            this.carregarConfiguracao();
        }
    }

    carregarConfiguracao() {
        try {
            const pastaSDK = path.dirname(this.sdk.caminho);
            const configPath = path.join(pastaSDK, 'clisitef.ini');
            if (fs.existsSync(configPath)) {
                const config = fs.readFileSync(configPath, 'utf8');
                this.configuracao = this._parseConfig(config);
            }
        } catch (error) {
            console.error('Erro ao carregar configuração SiTef:', error);
        }
    }

    _parseConfig(config) {
        const linhas = config.split('\n');
        const configObj = {};
        let secaoAtual = '';

        linhas.forEach(linha => {
            linha = linha.trim();
            if (!linha || linha.startsWith(';')) return;

            if (linha.startsWith('[') && linha.endsWith(']')) {
                secaoAtual = linha.substring(1, linha.length - 1);
                configObj[secaoAtual] = {};
            } else if (linha.includes('=')) {
                const [chave, valor] = linha.split('=');
                if (secaoAtual) {
                    configObj[secaoAtual][chave.trim()] = valor.trim();
                }
            }
        });

        return configObj;
    }

    async inicializar() {
        if (!this.sdkEncontrado) {
            throw new Error('SDK SiTef não encontrado');
        }

        if (this.inicializado) {
            return true;
        }

        try {
            // Tentar inicializar o SDK SiTef
            // Em produção, isso chamaria a função de inicialização da DLL
            this.inicializado = true;
            return true;
        } catch (error) {
            console.error('Erro ao inicializar SiTef:', error);
            throw new Error('Falha ao inicializar SDK SiTef');
        }
    }

    async autorizarPagamento(dados) {
        if (!this.sdkEncontrado) {
            return {
                sucesso: false,
                status: 'erro',
                codigo: 'SDK_NAO_ENCONTRADO',
                mensagem: 'CliSiTef não instalado'
            };
        }

        try {
            await this.inicializar();

            // Determinar tipo de operação
            const tipoOperacao = this._mapearTipoOperacao(dados.tipo, dados.parcelas);
            
            // Preparar dados para o SiTef
            const dadosSiTef = {
                valor: this._formatarValor(dados.valor),
                tipoOperacao: tipoOperacao,
                parcelas: dados.parcelas || 1,
                dataHora: new Date().toISOString().replace('T', ' ').substring(0, 19),
                numeroFiliacao: this.configuracao?.Terminal?.NumeroFiliacao || '00000000',
                terminal: this.configuracao?.Terminal?.CodigoTerminal || '001'
            };

            // Executar transação via SDK
            const resultado = await this._executarTransacaoSiTef(dadosSiTef);

            return {
                sucesso: resultado.status === 'aprovado',
                status: resultado.status,
                adquirente: resultado.adquirente || 'SiTef',
                bandeira: resultado.bandeira || this._detectarBandeira(dados),
                nsu: resultado.nsu,
                autorizacao: resultado.autorizacao,
                codigo_transacao: resultado.codigoTransacao,
                comprovante_cliente: resultado.comprovanteCliente,
                comprovante_estabelecimento: resultado.comprovanteEstabelecimento,
                payload_retorno: resultado,
                mensagem: resultado.mensagem
            };
        } catch (error) {
            console.error('Erro na autorização SiTef:', error);
            return {
                sucesso: false,
                status: 'erro',
                codigo: 'ERRO_SITEF',
                mensagem: error.message
            };
        }
    }

    async cancelarPagamento(transacaoId, dados = {}) {
        if (!this.sdkEncontrado) {
            return {
                sucesso: false,
                codigo: 'SDK_NAO_ENCONTRADO',
                mensagem: 'CliSiTef não instalado'
            };
        }

        try {
            await this.inicializar();

            // Buscar dados da transação
            const transacao = await this._buscarTransacao(transacaoId);
            
            if (!transacao) {
                return {
                    sucesso: false,
                    codigo: 'TRANSACAO_NAO_ENCONTRADA',
                    mensagem: 'Transação não encontrada'
                };
            }

            // Preparar dados para cancelamento
            const dadosCancelamento = {
                nsu: transacao.nsu,
                autorizacao: transacao.autorizacao,
                valor: transacao.valor,
                dataHora: new Date().toISOString().replace('T', ' ').substring(0, 19)
            };

            // Executar cancelamento via SDK
            const resultado = await this._executarCancelamentoSiTef(dadosCancelamento);

            return {
                sucesso: resultado.status === 'cancelado',
                status: resultado.status,
                nsu: resultado.nsu,
                autorizacao: resultado.autorizacao,
                mensagem: resultado.mensagem
            };
        } catch (error) {
            console.error('Erro no cancelamento SiTef:', error);
            return {
                sucesso: false,
                codigo: 'ERRO_CANCELAMENTO',
                mensagem: error.message
            };
        }
    }

    async _executarTransacaoSiTef(dados) {
        // Em produção, isso chamaria as funções da DLL clisitef.dll
        // Aqui simulamos a comunicação para demonstração
        
        return new Promise((resolve, reject) => {
            // Simular tempo de processamento
            setTimeout(() => {
                // Simular resposta bem-sucedida
                resolve({
                    status: 'aprovado',
                    adquirente: 'SiTef',
                    bandeira: 'Visa',
                    nsu: this._gerarNSU(),
                    autorizacao: this._gerarAutorizacao(),
                    codigoTransacao: this._gerarCodigoTransacao(),
                    comprovanteCliente: this._gerarComprovanteCliente(dados),
                    comprovanteEstabelecimento: this._gerarComprovanteEstabelecimento(dados),
                    mensagem: 'Transação aprovada'
                });
            }, 2000);
        });
    }

    async _executarCancelamentoSiTef(dados) {
        // Em produção, isso chamaria as funções da DLL clisitef.dll
        
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve({
                    status: 'cancelado',
                    nsu: dados.nsu,
                    autorizacao: dados.autorizacao,
                    mensagem: 'Cancelamento realizado com sucesso'
                });
            }, 1500);
        });
    }

    async _buscarTransacao(transacaoId) {
        const db = require('../../../database');
        
        return new Promise((resolve, reject) => {
            db.get(`
                SELECT id, nsu, autorizacao, valor, status
                FROM tef_transacoes
                WHERE id = ?
            `, [transacaoId], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
    }

    _mapearTipoOperacao(tipo, parcelas) {
        const tipoNormalizado = String(tipo).toLowerCase();
        
        if (tipoNormalizado.includes('debito')) {
            return '10'; // Débito
        }
        
        if (tipoNormalizado.includes('credito')) {
            if (parcelas > 1) {
                return '12'; // Crédito parcelado
            }
            return '11'; // Crédito à vista
        }
        
        return '10'; // Padrão: débito
    }

    _formatarValor(valor) {
        // SiTef espera valor em centavos (sem vírgula)
        return Math.round(Number(valor) * 100).toString().padStart(10, '0');
    }

    _detectarBandeira(dados) {
        // Em produção, o SDK retorna a bandeira
        // Aqui simulamos baseado em dados disponíveis
        if (dados.bandeira) return dados.bandeira;
        
        // Mapeamento de bandeiras suportadas pelo SiTef
        const bandeirasSuportadas = {
            'visa': 'Visa',
            'mastercard': 'Mastercard',
            'elo': 'Elo',
            'hipercard': 'Hipercard',
            'amex': 'American Express',
            'discover': 'Discover',
            'jcb': 'JCB',
            'diners': 'Diners Club',
            'aura': 'Aura'
        };
        
        // Se não foi informada, retorna Visa como padrão
        return 'Visa';
    }

    _obterBandeirasSuportadas() {
        return ['Visa', 'Mastercard', 'Elo', 'Hipercard', 'American Express', 'Discover', 'JCB', 'Diners Club', 'Aura'];
    }

    _gerarNSU() {
        return Date.now().toString().substring(8) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    }

    _gerarAutorizacao() {
        return Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    }

    _gerarCodigoTransacao() {
        return Date.now().toString();
    }

    _gerarComprovanteCliente(dados) {
        return `
COMPROVANTE DO CLIENTO
======================
MERCHANT: Loja Exemplo
DATA: ${dados.dataHora}
VALOR: R$ ${(Number(dados.valor) / 100).toFixed(2)}
NSU: ${this._gerarNSU()}
AUTORIZAÇÃO: ${this._gerarAutorizacao()}
        `.trim();
    }

    _gerarComprovanteEstabelecimento(dados) {
        return `
COMPROVANTE DO ESTABELECIMENTO
================================
MERCHANT: Loja Exemplo
DATA: ${dados.dataHora}
VALOR: R$ ${(Number(dados.valor) / 100).toFixed(2)}
NSU: ${this._gerarNSU()}
AUTORIZAÇÃO: ${this._gerarAutorizacao()}
        `.trim();
    }

    async status() {
        return {
            ativo: true,
            sdkEncontrado: this.sdkEncontrado,
            inicializado: this.inicializado,
            configuracao: this.configuracao ? 'Carregada' : 'Não carregada'
        };
    }
}

module.exports = SitefAdapter;