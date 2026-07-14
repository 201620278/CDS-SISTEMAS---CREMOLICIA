/**
 * 004 — Tabela movimentacoes_comerciais (Ledger Consignacao — append-only)
 *
 * @param {Object} db
 * @returns {Promise<void>}
 */
function migration004MovimentacoesComerciais(db) {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS movimentacoes_comerciais (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        consignacao_id INTEGER NOT NULL,
        consignacao_item_id INTEGER,
        tipo_movimentacao TEXT NOT NULL,
        origem TEXT NOT NULL,
        correlation_id TEXT NOT NULL,
        causation_id TEXT,
        grupo_prestacao_contas_id TEXT,
        snapshot TEXT,
        usuario_id INTEGER,
        data_movimentacao DATETIME NOT NULL,
        valor DECIMAL(12,2),
        quantidade DECIMAL(12,3),
        motivo TEXT,
        referencia_externa_tipo TEXT,
        referencia_externa_id INTEGER,
        detalhes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (consignacao_id) REFERENCES consignacoes(id) ON DELETE RESTRICT,
        FOREIGN KEY (consignacao_item_id) REFERENCES consignacoes_itens(id) ON DELETE RESTRICT,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
      )
    `, (err) => (err ? reject(err) : resolve()));
  });
}

module.exports = migration004MovimentacoesComerciais;
