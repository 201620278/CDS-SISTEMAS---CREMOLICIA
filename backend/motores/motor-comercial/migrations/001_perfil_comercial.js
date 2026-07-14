/**
 * 001 — Tabela perfil_comercial (Aggregate Root: PerfilComercial)
 *
 * @param {Object} db
 * @returns {Promise<void>}
 */
function migration001PerfilComercial(db) {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS perfil_comercial (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER NOT NULL,
        perfil_tipo TEXT NOT NULL,
        ativo INTEGER NOT NULL DEFAULT 1,
        limite_comercial DECIMAL(12,2) NOT NULL DEFAULT 0,
        saldo_aberto DECIMAL(12,2) NOT NULL DEFAULT 0,
        bloqueado INTEGER NOT NULL DEFAULT 0,
        motivo_bloqueio TEXT,
        score_confiabilidade DECIMAL(5,2),
        score_calculado_em DATETIME,
        data_ativacao DATETIME,
        data_inativacao DATETIME,
        observacoes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT
      )
    `, (err) => (err ? reject(err) : resolve()));
  });
}

module.exports = migration001PerfilComercial;
