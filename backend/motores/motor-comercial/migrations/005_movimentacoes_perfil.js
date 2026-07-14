/**
 * 005 — Tabela movimentacoes_perfil_comercial (Ledger Perfil — append-only)
 *
 * @param {Object} db
 * @returns {Promise<void>}
 */
function migration005MovimentacoesPerfil(db) {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS movimentacoes_perfil_comercial (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        perfil_comercial_id INTEGER NOT NULL,
        cliente_id INTEGER NOT NULL,
        tipo_movimentacao TEXT NOT NULL,
        origem TEXT NOT NULL,
        correlation_id TEXT NOT NULL,
        causation_id TEXT,
        snapshot TEXT,
        usuario_id INTEGER,
        data_movimentacao DATETIME NOT NULL,
        valor DECIMAL(12,2),
        motivo TEXT,
        referencia_externa_tipo TEXT,
        referencia_externa_id INTEGER,
        detalhes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (perfil_comercial_id) REFERENCES perfil_comercial(id) ON DELETE RESTRICT,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
      )
    `, (err) => (err ? reject(err) : resolve()));
  });
}

module.exports = migration005MovimentacoesPerfil;
