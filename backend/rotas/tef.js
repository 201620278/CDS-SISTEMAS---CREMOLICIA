const express = require('express');
const router = express.Router();
const tefService = require('../services/tef');
const tefConfiguracaoRoutes = require('./tefConfiguracao');
const tefConciliacaoRoutes = require('./tefConciliacao');
const db = require('../database');
const sdkDetector = require('../services/tef/sdkDetector');
const tefConciliacaoService = require('../services/tef/tefConciliacaoService');

router.use(tefConfiguracaoRoutes);
router.use(tefConciliacaoRoutes);

router.post('/pagar', async (req, res) => {
  try {
    const {
      venda_id,
      tipo,
      valor,
      parcelas
    } = req.body;

    if (!tipo) {
      return res.status(400).json({ error: 'Tipo de pagamento TEF não informado.' });
    }

    if (!valor || Number(valor) <= 0) {
      return res.status(400).json({ error: 'Valor TEF inválido.' });
    }

    const resultado = await tefService.iniciarPagamento({
      venda_id: venda_id || null,
      tipo,
      valor: Number(valor),
      parcelas: Number(parcelas || 1)
    });

    res.json(resultado);
  } catch (error) {
    console.error('Erro TEF:', error);
    res.status(500).json({
      error: error.message || 'Erro ao processar TEF.'
    });
  }
});

router.get('/transacao/:id', (req, res) => {
  const id = Number(req.params.id);

  db.get(`
    SELECT *
    FROM tef_transacoes
    WHERE id = ?
  `, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.status(404).json({ error: 'Transação TEF não encontrada.' });
    }

    res.json(row);
  });
});

router.get('/venda/:vendaId/comprovantes', (req, res) => {
  const vendaId = Number(req.params.vendaId);

  db.all(`
    SELECT
      id,
      venda_id,
      forma_pagamento,
      valor,
      tef_transacao_id,
      tef_nsu,
      tef_autorizacao,
      tef_bandeira,
      tef_adquirente,
      tef_comprovante_cliente,
      tef_comprovante_estabelecimento
    FROM venda_pagamentos
    WHERE venda_id = ?
      AND tef_transacao_id IS NOT NULL
  `, [vendaId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows || []);
  });
});

router.get('/venda/:vendaId/resumo', (req, res) => {
  const vendaId = Number(req.params.vendaId);

  db.get(`
    SELECT
      v.id AS venda_id,
      v.total AS venda_total,
      v.forma_pagamento AS venda_forma_pagamento,
      v.data_venda,

      n.numero AS nfce_numero,
      n.chave_acesso AS nfce_chave,
      n.status AS nfce_status,
      n.protocolo AS nfce_protocolo,

      vp.tef_transacao_id,
      vp.tef_nsu,
      vp.tef_autorizacao,
      vp.tef_bandeira,
      vp.tef_adquirente

    FROM vendas v

    LEFT JOIN nfce_notas n
      ON n.venda_id = v.id

    LEFT JOIN venda_pagamentos vp
      ON vp.venda_id = v.id
      AND vp.tef_transacao_id IS NOT NULL

    WHERE v.id = ?

    ORDER BY n.id DESC
    LIMIT 1
  `, [vendaId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.status(404).json({ error: 'Venda não encontrada.' });
    }

    res.json(row);
  });
});

router.post('/cancelar', async (req, res) => {
  try {
    const { transacao_id, motivo } = req.body;

    if (!transacao_id) {
      return res.status(400).json({ error: 'transacao_id é obrigatório.' });
    }

    const resultado = await tefService.cancelarPagamento(
      Number(transacao_id),
      motivo || 'Cancelamento da venda'
    );

    res.json(resultado);

  } catch (error) {
    console.error('Erro ao cancelar TEF:', error);
    res.status(500).json({
      error: error.message || 'Erro ao cancelar TEF.'
    });
  }
});

router.get('/transacoes/recentes', (req, res) => {
  const limit = Number(req.query.limit) || 20;

  db.all(`
    SELECT *
    FROM tef_transacoes
    ORDER BY criado_em DESC
    LIMIT ?
  `, [limit], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows || []);
  });
});

router.get('/diagnostico-sdk', async (req, res) => {
  try {
    const sdks = sdkDetector.localizarSDKs();

    return res.json({
      sucesso: true,
      encontrados: sdks
    });

  } catch (error) {
    return res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
});

router.get('/diagnostico', async (req, res) => {
  try {
    const sdks = sdkDetector.localizarSDKs();

    res.json({
      sucesso: true,
      sdkEncontrado: sdks.length > 0,
      sdks
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
});

router.get('/transacoes-pendentes', async (req, res) => {
  try {
    db.all(`
      SELECT id, venda_id, tipo, valor, status, provedor, criado_em
      FROM tef_transacoes
      WHERE status = 'pendente'
      ORDER BY criado_em DESC
    `, (err, rows) => {
      if (err) {
        return res.status(500).json({
          sucesso: false,
          erro: err.message
        });
      }

      res.json({
        sucesso: true,
        quantidade: rows.length,
        transacoes: rows || []
      });
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
});

router.post('/reconciliar-pendentes', async (req, res) => {
  try {
    const tefManager = require('../services/tef/TefManager');
    
    db.all(`
      SELECT id, venda_id, tipo, valor, status, provedor, criado_em
      FROM tef_transacoes
      WHERE status = 'pendente'
      ORDER BY criado_em DESC
    `, async (err, rows) => {
      if (err) {
        return res.status(500).json({
          sucesso: false,
          erro: err.message
        });
      }

      if (!rows || rows.length === 0) {
        return res.json({
          sucesso: true,
          mensagem: 'Nenhuma transação pendente encontrada',
          reconciliadas: 0
        });
      }

      let reconciliadas = 0;
      let falhas = 0;

      for (const transacao of rows) {
        try {
          // Tentar consultar status da transação no adquirente
          const resultado = await tefManager.consultar(transacao.id);
          
          if (resultado && resultado.status) {
            // Atualizar status da transação
            db.run(`
              UPDATE tef_transacoes
              SET status = ?, atualizado_em = datetime('now')
              WHERE id = ?
            `, [resultado.status, transacao.id], (updateErr) => {
              if (updateErr) {
                console.error(`Erro ao atualizar transação ${transacao.id}:`, updateErr);
                falhas++;
              } else {
                reconciliadas++;
              }
            });
          } else {
            // Se não conseguir consultar, marcar como erro
            db.run(`
              UPDATE tef_transacoes
              SET status = 'erro', atualizado_em = datetime('now')
              WHERE id = ?
            `, [transacao.id], (updateErr) => {
              if (updateErr) {
                console.error(`Erro ao atualizar transação ${transacao.id}:`, updateErr);
              }
              falhas++;
            });
          }
        } catch (error) {
          console.error(`Erro ao reconciliar transação ${transacao.id}:`, error);
          falhas++;
        }
      }

      res.json({
        sucesso: true,
        mensagem: 'Reconciliação concluída',
        total: rows.length,
        reconciliadas,
        falhas
      });
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
});

router.get('/monitor-status', async (req, res) => {
  try {
    const tefMonitorService = require('../services/tef/tefMonitorService');
    
    // Verificar se o monitor está respondendo
    const status = await tefMonitorService.obterStatusMonitor();
    
    res.json({
      sucesso: true,
      monitor_ativo: true,
      status
    });
  } catch (error) {
    console.error('Erro ao verificar status do monitor:', error);
    res.json({
      sucesso: false,
      monitor_ativo: false,
      erro: error.message
    });
  }
});

router.get('/venda-integrada', async (req, res) => {
  try {
    // Verificar se há vínculo entre venda_pagamentos e tef_transacoes
    db.get(`
      SELECT COUNT(*) as total
      FROM venda_pagamentos vp
      INNER JOIN tef_transacoes tt ON vp.tef_transacao_id = tt.id
      WHERE vp.tef_transacao_id IS NOT NULL
    `, [], (err, row) => {
      if (err) {
        return res.status(500).json({
          sucesso: false,
          erro: err.message
        });
      }

      const integrada = (row?.total || 0) > 0;
      
      res.json({
        sucesso: true,
        integrada,
        total_vinculos: row?.total || 0
      });
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
});

router.get('/conciliacao', async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    
    const dataInicio = data_inicio || new Date().toISOString().split('T')[0];
    const dataFim = data_fim || new Date().toISOString().split('T')[0];
    
    const resultado = await tefConciliacaoService.executarConciliacao(dataInicio, dataFim);
    
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao executar conciliação TEF:', error);
    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
});

router.post('/transacao/:id/reimprimir', async (req, res) => {
  try {
    const transacaoId = Number(req.params.id);
    const { tipo } = req.body;

    if (!tipo || !['cliente', 'loja'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo inválido. Use "cliente" ou "loja".' });
    }

    db.get(`
      SELECT *
      FROM tef_transacoes
      WHERE id = ?
    `, [transacaoId], async (err, transacao) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!transacao) {
        return res.status(404).json({ error: 'Transação não encontrada.' });
      }

      const comprovante = tipo === 'cliente' 
        ? transacao.comprovante_cliente 
        : transacao.comprovante_estabelecimento;

      if (!comprovante) {
        return res.status(400).json({ error: 'Comprovante não disponível para esta transação.' });
      }

      // Aqui você pode integrar com o sistema de impressão
      // Por enquanto, retorna o comprovante para ser impresso pelo frontend
      res.json({
        sucesso: true,
        tipo,
        comprovante,
        mensagem: `Comprovante de ${tipo} obtido com sucesso.`
      });
    });

  } catch (error) {
    console.error('Erro ao reimprimir comprovante:', error);
    res.status(500).json({
      error: error.message || 'Erro ao reimprimir comprovante.'
    });
  }
});

module.exports = router;