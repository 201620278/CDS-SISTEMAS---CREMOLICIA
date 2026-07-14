/**
 * 009 — documento_externo na consignação (Sprint S-6)
 *
 * @param {Object} db
 * @returns {Promise<void>}
 */
function migration009ConsignacaoDocumentoExterno(db) {
  return new Promise((resolve, reject) => {
    db.run('ALTER TABLE consignacoes ADD COLUMN documento_externo TEXT', (err) => {
      if (err && !String(err.message).toLowerCase().includes('duplicate')) {
        return reject(err);
      }
      resolve();
    });
  });
}

module.exports = migration009ConsignacaoDocumentoExterno;
