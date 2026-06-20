const express = require('express');
const db = require('../database');
const { consultarNotasRecebidas, distribuirDocumentosRecebidos, consultarNotaPorChave } = require('../services/fiscal/distribuicaoDFe');

console.log('Imported functions:', { consultarNotasRecebidas, distribuirDocumentosRecebidos });

const router = express.Router();

router.get('/consultar-notas', async (req, res) => {
    try {
        const resultado = await consultarNotasRecebidas();
        return res.json(resultado);
    } catch (err) {
        return res.status(500).json({
            erro: err.message
        });
    }
});

router.get('/distribuir-documentos', async(req,res)=>{
    try{
        const notas = await distribuirDocumentosRecebidos();
        res.json({
            sucesso:true,
            notas
        });
    }catch(error){
        res.status(500).json({
            sucesso:false,
            mensagem:error.message
        });
    }
});

router.get('/consultar-chave', async(req,res)=>{
    try{
        const notas = await consultarNotaPorChave(req.query.chave);
        res.json({
            sucesso:true,
            notas
        });
    }catch(error){
        res.status(500).json({
            sucesso:false,
            mensagem:error.message
        });
    }
});

router.post('/importar-nota', async(req,res)=>{
    try{
        const { chave } = req.body;
        
        if (!chave) {
            return res.status(400).json({
                sucesso:false,
                mensagem:'Chave não fornecida'
            });
        }
        
        // Get the note from notas_recebidas_dfe table
        db.get('SELECT * FROM notas_recebidas_dfe WHERE chave = ?', [chave], async (err, nota) => {
            if (err) {
                return res.status(500).json({ sucesso:false, mensagem: err.message });
            }

            if (!nota) {
                return res.status(404).json({ sucesso:false, mensagem: 'Nota não encontrada' });
            }

            if (nota.importada) {
                return res.status(400).json({ sucesso:false, mensagem: 'Nota já importada' });
            }

            // Full import flow: XML DF-e → Fornecedor → Produtos → Itens Compra → Salvar Compra → Atualizar Estoque → Gerar Financeiro
            try {
                // 1. Parse XML to extract data
                const xmlData = parseNotaXML(nota.xml);
                
                // 2. Create or update supplier
                const fornecedorId = await criarOuAtualizarFornecedor(xmlData);
                
                // 3. Create compra record
                const compraId = await criarCompra(xmlData, fornecedorId);
                
                // 4. Create compra_itens records and update stock
                await criarCompraItens(xmlData, compraId);
                
                // 5. Create financeiro records
                await criarFinanceiro(xmlData, compraId);
                
                // 6. Mark nota as imported
                db.run('UPDATE notas_recebidas_dfe SET importada = 1 WHERE chave = ?', [chave], (updateErr) => {
                    if (updateErr) {
                        return res.status(500).json({ sucesso:false, mensagem: updateErr.message });
                    }

                    return res.json({
                        sucesso: true,
                        mensagem: 'Nota importada com sucesso',
                        compraId: compraId
                    });
                });
            } catch (importError) {
                console.error('Erro ao importar nota:', importError);
                return res.status(500).json({ sucesso:false, mensagem: importError.message });
            }
        });
    }catch(error){
        res.status(500).json({
            sucesso:false,
            mensagem:error.message
        });
    }
});

function parseNotaXML(xml) {
    const chave = xml.match(/<chNFe>(.*?)<\/chNFe>/)?.[1] || '';
    const numero = xml.match(/<nNF>(.*?)<\/nNF>/)?.[1] || '';
    const serie = xml.match(/<serie>(.*?)<\/serie>/)?.[1] || '';
    const fornecedorNome = xml.match(/<xNome>(.*?)<\/xNome>/)?.[1] || '';
    const fornecedorCNPJ = xml.match(/<CNPJ>(.*?)<\/CNPJ>/)?.[1] || '';
    const dataEmissao = xml.match(/<dhEmi>(.*?)<\/dhEmi>/)?.[1] || '';
    const valorTotal = xml.match(/<vNF>(.*?)<\/vNF>/)?.[1] || '0';
    
    // Extract products
    const produtos = [];
    const detRegex = /<det[^>]*>(.*?)<\/det>/gs;
    let detMatch;
    
    while ((detMatch = detRegex.exec(xml)) !== null) {
        const detXml = detMatch[1];
        const produto = {
            codigo: detXml.match(/<cProd>(.*?)<\/cProd>/)?.[1] || '',
            nome: detXml.match(/<xProd>(.*?)<\/xProd>/)?.[1] || '',
            ncm: detXml.match(/<NCM>(.*?)<\/NCM>/)?.[1] || '',
            cfop: detXml.match(/<CFOP>(.*?)<\/CFOP>/)?.[1] || '',
            unidade: detXml.match(/<uCom>(.*?)<\/uCom>/)?.[1] || '',
            quantidade: parseFloat(detXml.match(/<qCom>(.*?)<\/qCom>/)?.[1] || '0'),
            valorUnitario: parseFloat(detXml.match(/<vUnCom>(.*?)<\/vUnCom>/)?.[1] || '0'),
            valorTotal: parseFloat(detXml.match(/<vProd>(.*?)<\/vProd>/)?.[1] || '0')
        };
        produtos.push(produto);
    }
    
    return {
        chave,
        numero,
        serie,
        fornecedorNome,
        fornecedorCNPJ,
        dataEmissao,
        valorTotal: parseFloat(valorTotal),
        produtos
    };
}

async function criarOuAtualizarFornecedor(xmlData) {
    return new Promise((resolve, reject) => {
        db.get('SELECT id FROM fornecedores WHERE cnpj = ?', [xmlData.fornecedorCNPJ], (err, row) => {
            if (err) return reject(err);
            
            if (row) {
                resolve(row.id);
            } else {
                db.run(`
                    INSERT INTO fornecedores (nome, cnpj, created_at)
                    VALUES (?, ?, datetime('now'))
                `, [xmlData.fornecedorNome, xmlData.fornecedorCNPJ], function(err) {
                    if (err) return reject(err);
                    resolve(this.lastID);
                });
            }
        });
    });
}

async function criarCompra(xmlData, fornecedorId) {
    return new Promise((resolve, reject) => {
        const dataCompra = new Date().toISOString().split('T')[0];
        
        db.run(`
            INSERT INTO compras (
                fornecedor_id, numero_nf, serie_nf, modelo_nf, chave_acesso,
                data_compra, data_emissao, condicao_pagamento, forma_pagamento,
                data_vencimento, parcelas, valor_entrada, observacao, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `, [
            fornecedorId,
            xmlData.numero,
            xmlData.serie,
            '55',
            xmlData.chave,
            dataCompra,
            xmlData.dataEmissao.split('T')[0],
            'avista',
            null,
            null,
            1,
            0,
            `Importada via DF-e - Chave: ${xmlData.chave}`
        ], function(err) {
            if (err) return reject(err);
            resolve(this.lastID);
        });
    });
}

async function criarCompraItens(xmlData, compraId) {
    return new Promise((resolve, reject) => {
        const promises = xmlData.produtos.map(produto => {
            return new Promise((resolveItem, rejectItem) => {
                // Get or create product
                db.get('SELECT id FROM produtos WHERE codigo = ?', [produto.codigo], (err, row) => {
                    if (err) return rejectItem(err);
                    
                    const produtoId = row ? row.id : null;
                    
                    // Create compra item
                    db.run(`
                        INSERT INTO compra_itens (
                            compra_id, produto_id, codigo, nome, ncm, cfop,
                            unidade, quantidade, valor_unitario, valor_total
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        compraId,
                        produtoId,
                        produto.codigo,
                        produto.nome,
                        produto.ncm,
                        produto.cfop,
                        produto.unidade,
                        produto.quantidade,
                        produto.valorUnitario,
                        produto.valorTotal
                    ], (err) => {
                        if (err) return rejectItem(err);
                        resolveItem();
                    });
                });
            });
        });
        
        Promise.all(promises).then(() => resolve()).catch(reject);
    });
}

async function criarFinanceiro(xmlData, compraId) {
    return new Promise((resolve, reject) => {
        // Create financeiro record for the purchase
        db.run(`
            INSERT INTO financeiro (
                tipo, descricao, valor, data_vencimento, status,
                referencia_id, referencia_tipo, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `, [
            'pagamento',
            `Pagamento NF ${xmlData.numero} - ${xmlData.fornecedorNome}`,
            xmlData.valorTotal,
            xmlData.dataEmissao.split('T')[0],
            'pendente',
            compraId,
            'compra'
        ], (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

module.exports = router;
