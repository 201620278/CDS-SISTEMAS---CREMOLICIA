const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');
const { gravarAuditoria } = require('../services/auditoria');

const { getJwtSecret } = require('../config/secrets');
const JWT_SECRET = getJwtSecret();
const HEARTBEAT_ONLINE_MS = 3 * 60 * 1000;

function terminalEstaOnline(ultimaConexao) {
  if (!ultimaConexao) return false;
  const diff = Date.now() - new Date(ultimaConexao).getTime();
  return diff >= 0 && diff < HEARTBEAT_ONLINE_MS;
}

function anexarStatusOnline(rows) {
  return (rows || []).map((row) => ({
    ...row,
    online: terminalEstaOnline(row.ultima_conexao)
  }));
}

function extrairUsuarioHeartbeat(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader) {
    try {
      const token = String(authHeader).split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        return {
          usuario_id: decoded.id || null,
          usuario_nome: String(decoded.nome || decoded.username || '').trim() || null
        };
      }
    } catch (e) { /* ignore token inválido no heartbeat */ }
  }

  const usuarioId = req.query.usuario_id ? Number(req.query.usuario_id) : null;
  const usuarioNome = req.query.usuario_nome ? String(req.query.usuario_nome).trim() : null;
  return {
    usuario_id: Number.isInteger(usuarioId) && usuarioId > 0 ? usuarioId : null,
    usuario_nome: usuarioNome || null
  };
}

const ORIGENS_CLIENTE = new Set(['pdv', 'mobile', 'erp']);

function normalizarOrigemCliente(raw) {
  const origem = String(raw || '').trim().toLowerCase();
  if (ORIGENS_CLIENTE.has(origem)) return origem;
  return '';
}

function extrairMetaCliente(req) {
  const origem = normalizarOrigemCliente(req.query.origem || req.body?.origem);
  const clienteTipo = String(req.query.cliente_tipo || req.body?.cliente_tipo || origem || '').trim().toLowerCase() || null;
  const clienteVersao = String(req.query.versao || req.query.cliente_versao || req.body?.versao || '').trim() || null;
  const plataforma = String(req.query.plataforma || req.body?.plataforma || '').trim() || null;
  const ultimoIp = req.ip || req.headers['x-forwarded-for'] || null;
  return { origem, clienteTipo, clienteVersao, plataforma, ultimoIp };
}

function registrarTerminalAuto(req, res) {
  const meta = extrairMetaCliente(req);
  if (!meta.origem) {
    return res.status(400).json({
      error: 'Heartbeat de terminal exige origem válida (pdv, mobile ou erp).'
    });
  }

  const hostname = String(req.query.hostname || '').trim();
  if (!hostname || hostname === 'web-browser') {
    return res.status(400).json({ error: 'Hostname do terminal inválido.' });
  }

  const nomeSugerido = String(req.query.nome || req.query.nome_sugerido || '').trim();
  const { usuario_id: usuarioId, usuario_nome: usuarioNome } = extrairUsuarioHeartbeat(req);

  db.get(`SELECT * FROM terminais WHERE hostname = ?`, [hostname], (err, terminal) => {
    if (err) return res.status(500).json({ error: err.message });

    const agora = new Date().toISOString();
    if (terminal) {
      db.run(
        `UPDATE terminais
         SET ultima_conexao = ?, usuario_id = ?, usuario_nome = ?,
             cliente_tipo = COALESCE(?, cliente_tipo),
             cliente_versao = COALESCE(?, cliente_versao),
             plataforma = COALESCE(?, plataforma),
             ultimo_ip = COALESCE(?, ultimo_ip),
             updated_at = ?
         WHERE id = ?`,
        [
          agora, usuarioId, usuarioNome,
          meta.clienteTipo, meta.clienteVersao, meta.plataforma, meta.ultimoIp,
          agora, terminal.id
        ],
        (updateErr) => {
          if (updateErr) {
            console.error('Erro ao atualizar terminal:', updateErr);
          }
          db.get(`SELECT * FROM terminais WHERE id = ?`, [terminal.id], (getErr, updated) => {
            if (getErr) return res.status(500).json({ error: getErr.message });
            res.json({ ...updated, online: true });
          });
        }
      );
      return;
    }

    const nomeTerminal = nomeSugerido || hostname;
    db.run(
      `INSERT INTO terminais (
         nome, hostname, usuario_id, usuario_nome, ativo, ultima_conexao,
         cliente_tipo, cliente_versao, plataforma, ultimo_ip, created_at, updated_at
       ) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nomeTerminal, hostname, usuarioId, usuarioNome, agora,
        meta.clienteTipo, meta.clienteVersao, meta.plataforma, meta.ultimoIp,
        agora, agora
      ],
      function(insertErr) {
        if (insertErr) return res.status(500).json({ error: insertErr.message });

        const novoId = this.lastID;
        db.get(`SELECT * FROM terminais WHERE id = ?`, [novoId], (getErr, novoTerminal) => {
          if (getErr) return res.status(500).json({ error: getErr.message });

          gravarAuditoria({
            usuario_id: req.user?.id || null,
            usuario_nome: req.user?.nome || req.user?.username || null,
            modulo: 'terminais',
            acao: 'criar_terminal',
            referencia_tipo: 'terminal',
            referencia_id: novoId,
            detalhes: { nome: nomeTerminal, hostname, origem: meta.origem, cliente_tipo: meta.clienteTipo },
            ip_requisicao: req.ip || null
          }).catch((auditErr) => console.error('Erro ao gravar auditoria de terminal:', auditErr));

          res.json({ ...novoTerminal, online: true });
        });
      }
    );
  });
}

function exigirSuperAdminTerminal(req, res, next) {
  const perfil = String(req.user?.perfil || '').toUpperCase();
  if (perfil !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Apenas SUPER_ADMIN pode nomear este PDV.' });
  }
  next();
}

function atualizarNomeTerminalPdv(req, res) {
  const hostname = String(req.body?.hostname || '').trim();
  const nome = String(req.body?.nome || '').trim();

  if (!hostname || hostname === 'web-browser') {
    return res.status(400).json({ error: 'Hostname do terminal PDV inválido.' });
  }

  if (!nome) {
    return res.status(400).json({ error: 'Informe um nome para identificar este PDV.' });
  }

  if (nome.length > 80) {
    return res.status(400).json({ error: 'Nome muito longo (máximo 80 caracteres).' });
  }

  const agora = new Date().toISOString();

  db.get(`SELECT * FROM terminais WHERE hostname = ?`, [hostname], (err, terminal) => {
    if (err) return res.status(500).json({ error: err.message });

    const salvarNome = (terminalId) => {
      db.run(
        `UPDATE terminais SET nome = ?, updated_at = ? WHERE id = ?`,
        [nome, agora, terminalId],
        (updateErr) => {
          if (updateErr) return res.status(500).json({ error: updateErr.message });

          db.get(`
            SELECT t.*, c.nome AS caixa_nome
            FROM terminais t
            LEFT JOIN caixas c ON c.id = t.caixa_id
            WHERE t.id = ?
          `, [terminalId], (getErr, row) => {
            if (getErr) return res.status(500).json({ error: getErr.message });

            gravarAuditoria({
              usuario_id: req.user?.id || null,
              usuario_nome: req.user?.nome || req.user?.username || null,
              modulo: 'terminais',
              acao: 'nomear_terminal_pdv',
              referencia_tipo: 'terminal',
              referencia_id: terminalId,
              detalhes: { hostname, nome, origem: 'pdv' },
              ip_requisicao: req.ip || null
            }).catch((auditErr) => console.error('Erro ao gravar auditoria de nome do terminal:', auditErr));

            res.json({ ...row, online: terminalEstaOnline(row.ultima_conexao) });
          });
        }
      );
    };

    if (terminal) {
      return salvarNome(terminal.id);
    }

    db.run(
      `INSERT INTO terminais (nome, hostname, ativo, ultima_conexao, created_at, updated_at) VALUES (?, ?, 1, ?, ?, ?)`,
      [nome, hostname, agora, agora, agora],
      function(insertErr) {
        if (insertErr) return res.status(500).json({ error: insertErr.message });
        salvarNome(this.lastID);
      }
    );
  });
}

function registrarTerminalOffline(req, res) {
  const origem = normalizarOrigemCliente(req.query.origem);
  if (!origem) {
    return res.status(400).json({ error: 'Desconexão exige origem válida (pdv, mobile ou erp).' });
  }

  const hostname = String(req.query.hostname || '').trim();
  if (!hostname) {
    return res.status(400).json({ error: 'Hostname do terminal não pode estar vazio.' });
  }

  const agora = new Date().toISOString();
  db.run(
    `UPDATE terminais SET ultima_conexao = NULL, usuario_id = NULL, usuario_nome = NULL, updated_at = ? WHERE hostname = ?`,
    [agora, hostname],
    function(updateErr) {
      if (updateErr) return res.status(500).json({ error: updateErr.message });
      res.json({ ok: true, offline: true, hostname, changes: this.changes });
    }
  );
}

router.get('/', (req, res) => {
  db.all(`
    SELECT t.*, c.nome AS caixa_nome,
      CASE
        WHEN EXISTS (
          SELECT 1 FROM caixa_sessoes cs
          WHERE cs.terminal_id = t.id AND cs.status = 'aberta'
        ) THEN 1 ELSE 0
      END AS caixa_aberto
    FROM terminais t
    LEFT JOIN caixas c ON c.id = t.caixa_id
    ORDER BY COALESCE(t.ativo, 1) DESC, t.ultima_conexao DESC, t.id
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(anexarStatusOnline(rows));
  });
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID inválido.' });

  db.get(`SELECT * FROM terminais WHERE id = ?`, [id], (err, terminal) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!terminal) return res.status(404).json({ error: 'Terminal não encontrado.' });

    db.get(
      `SELECT id FROM caixa_sessoes
       WHERE terminal_id = ? AND LOWER(COALESCE(status,'')) IN ('aberto', 'aberta')
       LIMIT 1`,
      [id],
      (sessErr, sessaoAberta) => {
        if (sessErr) return res.status(500).json({ error: sessErr.message });
        if (sessaoAberta) {
          return res.status(400).json({
            error: 'Não é possível excluir: existe caixa aberto neste terminal. Feche o caixa antes.'
          });
        }

        db.serialize(() => {
          db.run('BEGIN IMMEDIATE');

          const limparRefs = [
            `UPDATE caixa_sessoes SET terminal_id = NULL WHERE terminal_id = ?`,
            `UPDATE caixa_movimentacoes SET terminal_id = NULL WHERE terminal_id = ?`,
            `UPDATE caixa_fechamentos SET terminal_id = NULL WHERE terminal_id = ?`,
            `UPDATE auditoria_caixa SET terminal_id = NULL WHERE terminal_id = ?`,
            `UPDATE caixa SET terminal_id = NULL WHERE terminal_id = ?`,
            `UPDATE vendas SET terminal_id = NULL WHERE terminal_id = ?`,
            `UPDATE equipamentos SET terminal_id = NULL WHERE terminal_id = ?`
          ];

          const runNext = (index) => {
            if (index >= limparRefs.length) {
              db.run(`DELETE FROM terminais WHERE id = ?`, [id], function (delErr) {
                if (delErr) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: delErr.message });
                }
                if (!this.changes) {
                  db.run('ROLLBACK');
                  return res.status(404).json({ error: 'Terminal não encontrado.' });
                }

                db.run('COMMIT', (commitErr) => {
                  if (commitErr) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: commitErr.message });
                  }

                  gravarAuditoria({
                    usuario_id: req.user?.id || null,
                    usuario_nome: req.user?.nome || req.user?.username || null,
                    modulo: 'terminais',
                    acao: 'excluir_terminal',
                    referencia_tipo: 'terminal',
                    referencia_id: id,
                    detalhes: {
                      nome: terminal.nome,
                      hostname: terminal.hostname,
                      cliente_tipo: terminal.cliente_tipo || null
                    },
                    ip_requisicao: req.ip || null
                  }).catch(() => {});

                  res.json({ ok: true, id, excluido: true });
                });
              });
              return;
            }

            db.run(limparRefs[index], [id], (updErr) => {
              // Tabelas opcionais podem não existir em bases antigas — ignora erro de "no such table"
              if (updErr && !/no such table/i.test(String(updErr.message || ''))) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: updErr.message });
              }
              runNext(index + 1);
            });
          };

          runNext(0);
        });
      }
    );
  });
});

router.post('/', (req, res) => {
  const { nome, hostname, caixa_id, ativo, cliente_tipo, cliente_versao, plataforma } = req.body;
  const nomeTerminal = String(nome || hostname || '').trim();

  if (!nomeTerminal) {
    return res.status(400).json({ error: 'Nome ou hostname do terminal é obrigatório.' });
  }

  const agora = new Date().toISOString();
  const valores = [
    nomeTerminal,
    String(hostname || nomeTerminal).trim() || null,
    caixa_id || null,
    ativo === 0 ? 0 : 1,
    String(cliente_tipo || '').trim().toLowerCase() || null,
    String(cliente_versao || '').trim() || null,
    String(plataforma || '').trim() || null,
    agora,
    agora
  ];

  db.run(
    `INSERT INTO terminais (
       nome, hostname, caixa_id, ativo, cliente_tipo, cliente_versao, plataforma,
       ultima_conexao, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    valores,
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get(`SELECT * FROM terminais WHERE id = ?`, [this.lastID], (getErr, row) => {
        if (getErr) return res.status(500).json({ error: getErr.message });
        res.status(201).json(row);
      });
    }
  );
});

router.put('/auto/nome', exigirSuperAdminTerminal, atualizarNomeTerminalPdv);
router.post('/auto/nome', exigirSuperAdminTerminal, atualizarNomeTerminalPdv);

router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const { nome, hostname, caixa_id, ativo } = req.body;

  db.get(`SELECT * FROM terminais WHERE id = ?`, [id], (err, terminal) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!terminal) return res.status(404).json({ error: 'Terminal não encontrado.' });

    const updatedNome = nome !== undefined ? String(nome).trim() : terminal.nome;
    if (!updatedNome) {
      return res.status(400).json({ error: 'Nome do terminal é obrigatório.' });
    }

    const updatedHostname = hostname !== undefined ? String(hostname).trim() : terminal.hostname;
    const updatedCaixaId = caixa_id === '' || caixa_id === null || caixa_id === undefined
      ? null
      : Number(caixa_id);
    const updatedAtivo = ativo !== undefined ? (ativo ? 1 : 0) : terminal.ativo;
    const agora = new Date().toISOString();

    const aplicarAtualizacao = () => {
      db.run(
        `UPDATE terminais SET nome = ?, hostname = ?, caixa_id = ?, ativo = ?, updated_at = ? WHERE id = ?`,
        [updatedNome, updatedHostname, updatedCaixaId, updatedAtivo, agora, id],
        (updateErr) => {
          if (updateErr) return res.status(500).json({ error: updateErr.message });
          db.get(`
            SELECT t.*, c.nome AS caixa_nome
            FROM terminais t
            LEFT JOIN caixas c ON c.id = t.caixa_id
            WHERE t.id = ?
          `, [id], (getErr, row) => {
            if (getErr) return res.status(500).json({ error: getErr.message });

            gravarAuditoria({
              usuario_id: req.user?.id || null,
              usuario_nome: req.user?.nome || req.user?.username || null,
              modulo: 'terminais',
              acao: 'atualizar_terminal',
              referencia_tipo: 'terminal',
              referencia_id: id,
              detalhes: { antes: terminal, depois: { nome: updatedNome, hostname: updatedHostname, caixa_id: updatedCaixaId, ativo: updatedAtivo } },
              ip_requisicao: req.ip || null
            }).catch((auditErr) => console.error('Erro ao gravar auditoria de atualização de terminal:', auditErr));

            res.json(row);
          });
        }
      );
    };

    if (updatedCaixaId) {
      db.get(`SELECT id FROM caixas WHERE id = ?`, [updatedCaixaId], (errCaixa, caixa) => {
        if (errCaixa) return res.status(500).json({ error: errCaixa.message });
        if (!caixa) return res.status(400).json({ error: 'Caixa não encontrado.' });

        db.run(
          `UPDATE terminais SET caixa_id = NULL WHERE caixa_id = ? AND id != ?`,
          [updatedCaixaId, id],
          (errDetach) => {
            if (errDetach) return res.status(500).json({ error: errDetach.message });
            aplicarAtualizacao();
          }
        );
      });
      return;
    }

    aplicarAtualizacao();
  });
});

module.exports = router;
module.exports.registrarTerminalAuto = registrarTerminalAuto;
module.exports.registrarTerminalOffline = registrarTerminalOffline;
module.exports.atualizarNomeTerminalPdv = atualizarNomeTerminalPdv;
module.exports.exigirSuperAdminTerminal = exigirSuperAdminTerminal;
module.exports.terminalEstaOnline = terminalEstaOnline;
module.exports.HEARTBEAT_ONLINE_MS = HEARTBEAT_ONLINE_MS;
