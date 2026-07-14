/**
 * 002 — Tabela consignacoes (Aggregate Root: Consignacao)
 *
 * @param {Object} db
 * @returns {Promise<void>}
 */
function migration002Consignacoes(db) {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS consignacoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER NOT NULL,
        perfil_comercial_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'RASCUNHO',
        documento_numero TEXT,
        documento_serie TEXT,
        documento_sequencial INTEGER,
        documento_data_emissao DATETIME,
        documento_situacao TEXT NOT NULL DEFAULT 'RASCUNHO',
        prestacao_id TEXT,
        prestacao_numero TEXT,
        prestacao_status TEXT,
        prestacao_data_abertura DATETIME,
        prestacao_data_fechamento DATETIME,
        valor_total_entregue DECIMAL(12,2) NOT NULL DEFAULT 0,
        valor_total_acertado DECIMAL(12,2) NOT NULL DEFAULT 0,
        valor_total_pago DECIMAL(12,2) NOT NULL DEFAULT 0,
        saldo_aberto DECIMAL(12,2) NOT NULL DEFAULT 0,
        observacao TEXT,
        usuario_abertura_id INTEGER,
        usuario_encerramento_id INTEGER,
        data_abertura DATETIME,
        data_entrega DATETIME,
        data_encerramento DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT,
        FOREIGN KEY (perfil_comercial_id) REFERENCES perfil_comercial(id) ON DELETE RESTRICT,
        FOREIGN KEY (usuario_abertura_id) REFERENCES usuarios(id) ON DELETE SET NULL,
        FOREIGN KEY (usuario_encerramento_id) REFERENCES usuarios(id) ON DELETE SET NULL
      )
    `, (err) => (err ? reject(err) : resolve()));
  });
}

module.exports = migration002Consignacoes;
