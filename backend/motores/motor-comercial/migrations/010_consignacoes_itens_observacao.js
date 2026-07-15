/**
 * 010 — observacao por item da consignação (STAB-06.6.1)
 *
 * @param {Object} db
 * @returns {Promise<void>}
 */
function migration010ConsignacoesItensObservacao(db) {
  return new Promise((resolve, reject) => {
    db.run('ALTER TABLE consignacoes_itens ADD COLUMN observacao TEXT', (err) => {
      if (err && !String(err.message).toLowerCase().includes('duplicate')) {
        return reject(err);
      }
      resolve();
    });
  });
}

module.exports = migration010ConsignacoesItensObservacao;
