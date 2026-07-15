/**
 * Repository — produto_unidades (MUC)
 */

function listarPorProduto(db, produtoId) {
  return new Promise((resolve, reject) => {
    db.all(
      `
        SELECT *
        FROM produto_unidades
        WHERE produto_id = ?
        ORDER BY principal DESC, ordem ASC, id ASC
      `,
      [produtoId],
      (err, rows) => (err ? reject(err) : resolve(rows || []))
    );
  });
}

function listarAtivasPorProduto(db, produtoId) {
  return new Promise((resolve, reject) => {
    db.all(
      `
        SELECT *
        FROM produto_unidades
        WHERE produto_id = ?
          AND COALESCE(ativo, 1) = 1
        ORDER BY principal DESC, ordem ASC, id ASC
      `,
      [produtoId],
      (err, rows) => (err ? reject(err) : resolve(rows || []))
    );
  });
}

function buscarPorId(db, id) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM produto_unidades WHERE id = ?`,
      [id],
      (err, row) => (err ? reject(err) : resolve(row || null))
    );
  });
}

function buscarPrincipal(db, produtoId) {
  return new Promise((resolve, reject) => {
    db.get(
      `
        SELECT *
        FROM produto_unidades
        WHERE produto_id = ?
          AND COALESCE(principal, 0) = 1
          AND COALESCE(ativo, 1) = 1
        ORDER BY id ASC
        LIMIT 1
      `,
      [produtoId],
      (err, row) => (err ? reject(err) : resolve(row || null))
    );
  });
}

function buscarPorCodigoBarras(db, codigoBarras) {
  const codigo = String(codigoBarras || '').trim();
  if (!codigo) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    db.get(
      `
        SELECT pu.*, p.nome AS produto_nome, p.unidade AS unidade_base
        FROM produto_unidades pu
        INNER JOIN produtos p ON p.id = pu.produto_id
        WHERE COALESCE(pu.ativo, 1) = 1
          AND (
            TRIM(COALESCE(pu.codigo_barras, '')) = ?
            OR TRIM(COALESCE(pu.codigo_auxiliar, '')) = ?
          )
        ORDER BY pu.principal DESC, pu.id ASC
        LIMIT 1
      `,
      [codigo, codigo],
      (err, row) => (err ? reject(err) : resolve(row || null))
    );
  });
}

function inserir(db, produtoId, dados) {
  return new Promise((resolve, reject) => {
    db.run(
      `
        INSERT INTO produto_unidades (
          produto_id, unidade, descricao, fator_conversao, preco,
          codigo_barras, codigo_auxiliar, principal, ativo, ordem,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      [
        produtoId,
        dados.unidade,
        dados.descricao,
        dados.fator_conversao,
        dados.preco,
        dados.codigo_barras,
        dados.codigo_auxiliar,
        dados.principal,
        dados.ativo,
        dados.ordem
      ],
      function (err) {
        if (err) return reject(err);
        resolve(this.lastID);
      }
    );
  });
}

function atualizar(db, id, dados) {
  return new Promise((resolve, reject) => {
    db.run(
      `
        UPDATE produto_unidades SET
          unidade = ?,
          descricao = ?,
          fator_conversao = ?,
          preco = ?,
          codigo_barras = ?,
          codigo_auxiliar = ?,
          principal = ?,
          ativo = ?,
          ordem = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [
        dados.unidade,
        dados.descricao,
        dados.fator_conversao,
        dados.preco,
        dados.codigo_barras,
        dados.codigo_auxiliar,
        dados.principal,
        dados.ativo,
        dados.ordem,
        id
      ],
      function (err) {
        if (err) return reject(err);
        resolve(this.changes || 0);
      }
    );
  });
}

function remover(db, id) {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM produto_unidades WHERE id = ?`,
      [id],
      function (err) {
        if (err) return reject(err);
        resolve(this.changes || 0);
      }
    );
  });
}

function limparPrincipalDoProduto(db, produtoId, excetoId = null) {
  return new Promise((resolve, reject) => {
    const params = [produtoId];
    let sql = `UPDATE produto_unidades SET principal = 0, updated_at = CURRENT_TIMESTAMP WHERE produto_id = ?`;
    if (excetoId) {
      sql += ` AND id != ?`;
      params.push(excetoId);
    }
    db.run(sql, params, (err) => (err ? reject(err) : resolve()));
  });
}

function contarAtivas(db, produtoId) {
  return new Promise((resolve, reject) => {
    db.get(
      `
        SELECT COUNT(*) AS total
        FROM produto_unidades
        WHERE produto_id = ?
          AND COALESCE(ativo, 1) = 1
      `,
      [produtoId],
      (err, row) => (err ? reject(err) : resolve(Number(row?.total || 0)))
    );
  });
}

function produtoJaTemUnidades(db, produtoId) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT COUNT(*) AS total FROM produto_unidades WHERE produto_id = ?`,
      [produtoId],
      (err, row) => (err ? reject(err) : resolve(Number(row?.total || 0) > 0))
    );
  });
}

module.exports = {
  listarPorProduto,
  listarAtivasPorProduto,
  buscarPorId,
  buscarPrincipal,
  buscarPorCodigoBarras,
  inserir,
  atualizar,
  remover,
  limparPrincipalDoProduto,
  contarAtivas,
  produtoJaTemUnidades
};
