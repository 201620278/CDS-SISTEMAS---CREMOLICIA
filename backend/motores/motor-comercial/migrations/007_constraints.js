/**
 * 007 — Constraints do Motor Comercial
 *
 * @param {Object} db
 * @returns {Promise<void>}
 */
function runSql(db, sql) {
  return new Promise((resolve, reject) => {
    db.run(sql, (err) => (err ? reject(err) : resolve()));
  });
}

async function migration007Constraints(db) {
  const constraints = [
    // perfil_comercial
    `CREATE UNIQUE INDEX IF NOT EXISTS uq_perfil_comercial_cliente_tipo ON perfil_comercial(cliente_id, perfil_tipo)`,

    // consignacoes — documento único por série/sequencial
    `CREATE UNIQUE INDEX IF NOT EXISTS uq_consignacoes_documento_serie_seq
      ON consignacoes(documento_serie, documento_sequencial)
      WHERE documento_serie IS NOT NULL AND documento_sequencial IS NOT NULL`,

    // CHECK constraints (SQLite 3.37+ supports; safe to attempt)
    `CREATE TABLE IF NOT EXISTS _motor_comercial_constraints_applied (id INTEGER PRIMARY KEY)`,
  ];

  for (const sql of constraints.slice(0, -1)) {
    await runSql(db, sql);
  }

  // CHECK via triggers de validação leve (compatível com SQLite antigo)
  await runSql(db, `
    CREATE TRIGGER IF NOT EXISTS trg_perfil_comercial_status_check
    BEFORE INSERT ON perfil_comercial
    BEGIN
      SELECT CASE
        WHEN NEW.perfil_tipo NOT IN ('CONSUMIDOR','ATACADISTA','CONSIGNADO','DISTRIBUIDOR','REPRESENTANTE')
        THEN RAISE(ABORT, 'perfil_tipo inválido')
      END;
      SELECT CASE
        WHEN NEW.limite_comercial < 0 OR NEW.saldo_aberto < 0
        THEN RAISE(ABORT, 'valores monetários do perfil não podem ser negativos')
      END;
    END
  `);

  await runSql(db, `
    CREATE TRIGGER IF NOT EXISTS trg_consignacoes_status_check
    BEFORE INSERT ON consignacoes
    BEGIN
      SELECT CASE
        WHEN NEW.status NOT IN ('RASCUNHO','ENTREGUE','ACERTADA','QUITADA','ENCERRADA','CANCELADA')
        THEN RAISE(ABORT, 'status de consignação inválido')
      END;
      SELECT CASE
        WHEN NEW.documento_situacao NOT IN ('RASCUNHO','ATIVO','CANCELADO','SUBSTITUIDO')
        THEN RAISE(ABORT, 'situação documental inválida')
      END;
      SELECT CASE
        WHEN NEW.prestacao_status IS NOT NULL AND NEW.prestacao_status NOT IN ('ABERTA','FECHADA')
        THEN RAISE(ABORT, 'status de prestação inválido')
      END;
    END
  `);

  await runSql(db, `
    CREATE TRIGGER IF NOT EXISTS trg_mov_comerciais_origem_check
    BEFORE INSERT ON movimentacoes_comerciais
    BEGIN
      SELECT CASE
        WHEN NEW.origem NOT IN ('USUARIO','PDV','API','IMPORTACAO','APP_COMERCIAL','ROTINA','INTEGRACAO','SISTEMA')
        THEN RAISE(ABORT, 'origem de movimentação inválida')
      END;
    END
  `);

  await runSql(db, `
    CREATE TRIGGER IF NOT EXISTS trg_mov_perfil_origem_check
    BEFORE INSERT ON movimentacoes_perfil_comercial
    BEGIN
      SELECT CASE
        WHEN NEW.origem NOT IN ('USUARIO','PDV','API','IMPORTACAO','APP_COMERCIAL','ROTINA','INTEGRACAO','SISTEMA')
        THEN RAISE(ABORT, 'origem de movimentação inválida')
      END;
    END
  `);

  // Impedir UPDATE/DELETE nos ledgers (append-only)
  await runSql(db, `
    CREATE TRIGGER IF NOT EXISTS trg_mov_comerciais_no_update
    BEFORE UPDATE ON movimentacoes_comerciais
    BEGIN
      SELECT RAISE(ABORT, 'movimentacoes_comerciais é append-only');
    END
  `);

  await runSql(db, `
    CREATE TRIGGER IF NOT EXISTS trg_mov_comerciais_no_delete
    BEFORE DELETE ON movimentacoes_comerciais
    BEGIN
      SELECT RAISE(ABORT, 'movimentacoes_comerciais é append-only');
    END
  `);

  await runSql(db, `
    CREATE TRIGGER IF NOT EXISTS trg_mov_perfil_no_update
    BEFORE UPDATE ON movimentacoes_perfil_comercial
    BEGIN
      SELECT RAISE(ABORT, 'movimentacoes_perfil_comercial é append-only');
    END
  `);

  await runSql(db, `
    CREATE TRIGGER IF NOT EXISTS trg_mov_perfil_no_delete
    BEFORE DELETE ON movimentacoes_perfil_comercial
    BEGIN
      SELECT RAISE(ABORT, 'movimentacoes_perfil_comercial é append-only');
    END
  `);
}

module.exports = migration007Constraints;
