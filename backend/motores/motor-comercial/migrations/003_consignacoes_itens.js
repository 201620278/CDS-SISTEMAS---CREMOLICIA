/**
 * 003 — Tabela consignacoes_itens (entidade filha de Consignacao)
 *
 * @param {Object} db
 * @returns {Promise<void>}
 */
function migration003ConsignacoesItens(db) {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS consignacoes_itens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        consignacao_id INTEGER NOT NULL,
        produto_id INTEGER NOT NULL,
        quantidade_entregue DECIMAL(12,3) NOT NULL DEFAULT 0,
        quantidade_devolvida DECIMAL(12,3) NOT NULL DEFAULT 0,
        quantidade_vendida DECIMAL(12,3) NOT NULL DEFAULT 0,
        quantidade_perdida DECIMAL(12,3) NOT NULL DEFAULT 0,
        quantidade_cortesia DECIMAL(12,3) NOT NULL DEFAULT 0,
        preco_unitario DECIMAL(12,2) NOT NULL DEFAULT 0,
        subtotal_entregue DECIMAL(12,2) NOT NULL DEFAULT 0,
        subtotal_acertado DECIMAL(12,2) NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (consignacao_id) REFERENCES consignacoes(id) ON DELETE RESTRICT,
        FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE RESTRICT
      )
    `, (err) => (err ? reject(err) : resolve()));
  });
}

module.exports = migration003ConsignacoesItens;
