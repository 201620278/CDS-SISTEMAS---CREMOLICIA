const db = require('../database');

function parsePositiveInteger(value) {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
}

function obterTerminalId(req) {
  const rawId = req.body?.terminal_id || req.query?.terminal_id || req.headers['x-terminal-id'] || req.user?.terminal_id;
  return parsePositiveInteger(rawId);
}

function obterSessaoId(req) {
  const rawId = req.body?.caixa_sessao_id || req.query?.caixa_sessao_id || req.headers['x-caixa-sessao-id'] || req.user?.caixa_sessao_id;
  return parsePositiveInteger(rawId);
}

function validarCaixaAberto(req, res, next) {
  const terminalId = obterTerminalId(req);
  const sessaoId = obterSessaoId(req);

  let sql;
  let params;

  if (sessaoId) {
    sql = `SELECT * FROM caixa_sessoes WHERE id = ? AND status = 'aberto'`;
    params = [sessaoId];
  } else {
    sql = `SELECT * FROM caixa_sessoes WHERE status = 'aberto' ${terminalId ? 'AND terminal_id = ?' : ''} ORDER BY id DESC LIMIT 1`;
    params = terminalId ? [terminalId] : [];
  }

  db.get(sql, params, (err, sessao) => {
    if (err) {
      console.error('Erro ao verificar sessão de caixa:', err);
      return res.status(500).json({ error: 'Erro ao verificar sessão de caixa.' });
    }

    if (!sessao) {
      const mensagem = sessaoId
        ? 'Nenhuma sessão de caixa aberta para esta sessão.'
        : terminalId
          ? 'Nenhum caixa aberto neste terminal.'
          : 'Nenhum caixa aberto.';
      return res.status(400).json({ error: mensagem });
    }

    req.caixaSessaoId = sessao.id;
    req.caixaId = sessao.caixa_id;
    req.terminalId = terminalId || sessao.terminal_id || null;
    req.operadorId = req.user?.id || sessao.operador_id || null;
    req.caixaSessao = sessao;

    next();
  });
}

module.exports = { validarCaixaAberto };
