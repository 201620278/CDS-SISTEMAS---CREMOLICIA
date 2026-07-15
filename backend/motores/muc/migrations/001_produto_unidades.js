/**
 * 001 — produto_unidades + colunas MUC em vendas_itens
 */

function run(db, sql) {
  return new Promise((resolve, reject) => {
    db.run(sql, (err) => {
      if (err && !String(err.message || '').includes('duplicate column')) {
        return reject(err);
      }
      resolve();
    });
  });
}

async function bootstrapMucSchema(db) {
  await run(
    db,
    `
    CREATE TABLE IF NOT EXISTS produto_unidades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_id INTEGER NOT NULL,
      unidade TEXT NOT NULL,
      descricao TEXT,
      fator_conversao REAL NOT NULL DEFAULT 1,
      preco REAL DEFAULT 0,
      codigo_barras TEXT,
      codigo_auxiliar TEXT,
      principal INTEGER DEFAULT 0,
      ativo INTEGER DEFAULT 1,
      ordem INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
    )
  `
  );

  await run(db, `CREATE INDEX IF NOT EXISTS idx_produto_unidades_produto ON produto_unidades(produto_id)`);
  await run(db, `CREATE INDEX IF NOT EXISTS idx_produto_unidades_barras ON produto_unidades(codigo_barras)`);
  await run(db, `CREATE INDEX IF NOT EXISTS idx_produto_unidades_auxiliar ON produto_unidades(codigo_auxiliar)`);

  const colunasVenda = [
    `ALTER TABLE vendas_itens ADD COLUMN unidade_comercial_id INTEGER`,
    `ALTER TABLE vendas_itens ADD COLUMN unidade_comercial TEXT`,
    `ALTER TABLE vendas_itens ADD COLUMN fator_conversao REAL DEFAULT 1`,
    `ALTER TABLE vendas_itens ADD COLUMN codigo_barras_comercial TEXT`
  ];

  for (const sql of colunasVenda) {
    await run(db, sql);
  }

  await migrarProdutosLegados(db);
}

function migrarProdutosLegados(db) {
  return new Promise((resolve, reject) => {
    db.all(
      `
        SELECT p.id, p.unidade, p.preco_venda, p.codigo_barras, p.codigo
        FROM produtos p
        WHERE NOT EXISTS (
          SELECT 1 FROM produto_unidades pu WHERE pu.produto_id = p.id
        )
      `,
      [],
      async (err, rows) => {
        if (err) return reject(err);

        try {
          for (const produto of rows || []) {
            const unidade = String(produto.unidade || 'UN').trim().toUpperCase() || 'UN';
            await new Promise((res, rej) => {
              db.run(
                `
                  INSERT INTO produto_unidades (
                    produto_id, unidade, descricao, fator_conversao, preco,
                    codigo_barras, codigo_auxiliar, principal, ativo, ordem,
                    created_at, updated_at
                  ) VALUES (?, ?, ?, 1, ?, ?, ?, 1, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                `,
                [
                  produto.id,
                  unidade,
                  unidade,
                  Number(produto.preco_venda || 0),
                  String(produto.codigo_barras || '').trim() || null,
                  String(produto.codigo || '').trim() || null
                ],
                (insErr) => (insErr ? rej(insErr) : res())
              );
            });
          }

          if ((rows || []).length > 0) {
            console.log(`[MUC] Migração legado: ${(rows || []).length} produto(s) com unidade base criada.`);
          }
          resolve({ migrados: (rows || []).length });
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}

module.exports = { bootstrapMucSchema, migrarProdutosLegados };
