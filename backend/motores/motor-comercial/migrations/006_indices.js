/**
 * 006 — Índices do Motor Comercial
 *
 * @param {Object} db
 * @returns {Promise<void>}
 */
function runIndex(db, sql) {
  return new Promise((resolve, reject) => {
    db.run(sql, (err) => (err ? reject(err) : resolve()));
  });
}

async function migration006Indices(db) {
  const indices = [
  // perfil_comercial
    `CREATE INDEX IF NOT EXISTS idx_perfil_comercial_cliente ON perfil_comercial(cliente_id)`,
    `CREATE INDEX IF NOT EXISTS idx_perfil_comercial_tipo ON perfil_comercial(perfil_tipo)`,
    `CREATE INDEX IF NOT EXISTS idx_perfil_comercial_cliente_tipo ON perfil_comercial(cliente_id, perfil_tipo)`,
    `CREATE INDEX IF NOT EXISTS idx_perfil_comercial_ativo ON perfil_comercial(ativo)`,

    // consignacoes
    `CREATE INDEX IF NOT EXISTS idx_consignacoes_cliente ON consignacoes(cliente_id)`,
    `CREATE INDEX IF NOT EXISTS idx_consignacoes_perfil ON consignacoes(perfil_comercial_id)`,
    `CREATE INDEX IF NOT EXISTS idx_consignacoes_status ON consignacoes(status)`,
    `CREATE INDEX IF NOT EXISTS idx_consignacoes_documento_numero ON consignacoes(documento_numero)`,
    `CREATE INDEX IF NOT EXISTS idx_consignacoes_documento_serie_seq ON consignacoes(documento_serie, documento_sequencial)`,
    `CREATE INDEX IF NOT EXISTS idx_consignacoes_prestacao_id ON consignacoes(prestacao_id)`,
    `CREATE INDEX IF NOT EXISTS idx_consignacoes_data_abertura ON consignacoes(data_abertura)`,

    // consignacoes_itens
    `CREATE INDEX IF NOT EXISTS idx_consignacoes_itens_consignacao ON consignacoes_itens(consignacao_id)`,
    `CREATE INDEX IF NOT EXISTS idx_consignacoes_itens_produto ON consignacoes_itens(produto_id)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_consignacoes_itens_consignacao_produto ON consignacoes_itens(consignacao_id, produto_id)`,

    // movimentacoes_comerciais
    `CREATE INDEX IF NOT EXISTS idx_mov_comerciais_consignacao ON movimentacoes_comerciais(consignacao_id)`,
    `CREATE INDEX IF NOT EXISTS idx_mov_comerciais_data ON movimentacoes_comerciais(data_movimentacao)`,
    `CREATE INDEX IF NOT EXISTS idx_mov_comerciais_tipo ON movimentacoes_comerciais(tipo_movimentacao)`,
    `CREATE INDEX IF NOT EXISTS idx_mov_comerciais_correlation ON movimentacoes_comerciais(correlation_id)`,
    `CREATE INDEX IF NOT EXISTS idx_mov_comerciais_grupo_prestacao ON movimentacoes_comerciais(grupo_prestacao_contas_id)`,
    `CREATE INDEX IF NOT EXISTS idx_mov_comerciais_consignacao_data ON movimentacoes_comerciais(consignacao_id, data_movimentacao)`,
    `CREATE INDEX IF NOT EXISTS idx_mov_comerciais_consignacao_tipo ON movimentacoes_comerciais(consignacao_id, tipo_movimentacao)`,

    // movimentacoes_perfil_comercial
    `CREATE INDEX IF NOT EXISTS idx_mov_perfil_perfil ON movimentacoes_perfil_comercial(perfil_comercial_id)`,
    `CREATE INDEX IF NOT EXISTS idx_mov_perfil_cliente ON movimentacoes_perfil_comercial(cliente_id)`,
    `CREATE INDEX IF NOT EXISTS idx_mov_perfil_tipo ON movimentacoes_perfil_comercial(tipo_movimentacao)`,
    `CREATE INDEX IF NOT EXISTS idx_mov_perfil_data ON movimentacoes_perfil_comercial(data_movimentacao)`,
    `CREATE INDEX IF NOT EXISTS idx_mov_perfil_correlation ON movimentacoes_perfil_comercial(correlation_id)`,
    `CREATE INDEX IF NOT EXISTS idx_mov_perfil_perfil_data ON movimentacoes_perfil_comercial(perfil_comercial_id, data_movimentacao)`
  ];

  for (const sql of indices) {
    await runIndex(db, sql);
  }
}

module.exports = migration006Indices;
