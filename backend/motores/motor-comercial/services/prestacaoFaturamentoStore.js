/**
 * Persistência STAB-06.3 — vínculo Prestação ↔ Venda Oficial ↔ NFC-e
 * (fora do Ledger; não altera Recovery/Crédito)
 *
 * @module motores/motor-comercial/services/prestacaoFaturamentoStore
 */

const db = require('../../../database');

const SITUACAO = Object.freeze({
  PENDENTE: 'PENDENTE',
  AUTORIZADA: 'AUTORIZADA',
  REJEITADA: 'REJEITADA',
  NAO_APLICAVEL: 'NAO_APLICAVEL'
});

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

async function ensureTable() {
  await runAsync(`
    CREATE TABLE IF NOT EXISTS prestacao_faturamento (
      consignacao_id INTEGER PRIMARY KEY,
      grupo_prestacao_id INTEGER,
      venda_id INTEGER,
      nfce_nota_id INTEGER,
      situacao_fiscal TEXT NOT NULL DEFAULT 'PENDENTE',
      faturada INTEGER NOT NULL DEFAULT 0,
      nfce_chave TEXT,
      nfce_numero TEXT,
      nfce_protocolo TEXT,
      nfce_status TEXT,
      nfce_motivo TEXT,
      atualizado_em TEXT DEFAULT (datetime('now','localtime'))
    )
  `);
  try {
    await runAsync('ALTER TABLE prestacao_faturamento ADD COLUMN nfce_nota_id INTEGER');
  } catch (_e) {
    /* coluna já existe */
  }
}

async function obterPorConsignacao(consignacaoId) {
  await ensureTable();
  return getAsync(
    'SELECT * FROM prestacao_faturamento WHERE consignacao_id = ?',
    [Number(consignacaoId)]
  );
}

async function salvar(dados = {}) {
  await ensureTable();
  const consignacaoId = Number(dados.consignacaoId);
  const atual = await obterPorConsignacao(consignacaoId);
  const row = {
    consignacao_id: consignacaoId,
    grupo_prestacao_id: dados.grupoPrestacaoId != null
      ? Number(dados.grupoPrestacaoId)
      : (atual?.grupo_prestacao_id ?? null),
    venda_id: dados.vendaId != null
      ? Number(dados.vendaId)
      : (atual?.venda_id ?? null),
    nfce_nota_id: dados.nfceNotaId != null
      ? Number(dados.nfceNotaId)
      : (atual?.nfce_nota_id ?? null),
    situacao_fiscal: dados.situacaoFiscal || atual?.situacao_fiscal || SITUACAO.PENDENTE,
    faturada: dados.faturada != null
      ? (dados.faturada ? 1 : 0)
      : (atual?.faturada ?? 0),
    nfce_chave: dados.nfceChave !== undefined ? dados.nfceChave : (atual?.nfce_chave ?? null),
    nfce_numero: dados.nfceNumero !== undefined ? dados.nfceNumero : (atual?.nfce_numero ?? null),
    nfce_protocolo: dados.nfceProtocolo !== undefined ? dados.nfceProtocolo : (atual?.nfce_protocolo ?? null),
    nfce_status: dados.nfceStatus !== undefined ? dados.nfceStatus : (atual?.nfce_status ?? null),
    nfce_motivo: dados.nfceMotivo !== undefined ? dados.nfceMotivo : (atual?.nfce_motivo ?? null)
  };

  await runAsync(
    `
    INSERT INTO prestacao_faturamento (
      consignacao_id, grupo_prestacao_id, venda_id, nfce_nota_id, situacao_fiscal, faturada,
      nfce_chave, nfce_numero, nfce_protocolo, nfce_status, nfce_motivo, atualizado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now','localtime'))
    ON CONFLICT(consignacao_id) DO UPDATE SET
      grupo_prestacao_id = excluded.grupo_prestacao_id,
      venda_id = excluded.venda_id,
      nfce_nota_id = excluded.nfce_nota_id,
      situacao_fiscal = excluded.situacao_fiscal,
      faturada = excluded.faturada,
      nfce_chave = excluded.nfce_chave,
      nfce_numero = excluded.nfce_numero,
      nfce_protocolo = excluded.nfce_protocolo,
      nfce_status = excluded.nfce_status,
      nfce_motivo = excluded.nfce_motivo,
      atualizado_em = datetime('now','localtime')
    `,
    [
      row.consignacao_id,
      row.grupo_prestacao_id,
      row.venda_id,
      row.nfce_nota_id,
      row.situacao_fiscal,
      row.faturada,
      row.nfce_chave,
      row.nfce_numero,
      row.nfce_protocolo,
      row.nfce_status,
      row.nfce_motivo
    ]
  );

  return obterPorConsignacao(consignacaoId);
}

function toDto(row) {
  if (!row) {
    return {
      vendaId: null,
      nfceNotaId: null,
      situacaoFiscal: SITUACAO.PENDENTE,
      faturada: false,
      nfce: null,
      podeEncerrarFiscal: false,
      podeEmitir: true
    };
  }

  const situacao = String(row.situacao_fiscal || SITUACAO.PENDENTE).toUpperCase();
  const faturada = Number(row.faturada) === 1
    || situacao === SITUACAO.AUTORIZADA
    || situacao === SITUACAO.NAO_APLICAVEL;

  return {
    vendaId: row.venda_id != null ? Number(row.venda_id) : null,
    nfceNotaId: row.nfce_nota_id != null ? Number(row.nfce_nota_id) : null,
    situacaoFiscal: situacao,
    faturada,
    nfce: (row.nfce_numero || row.nfce_chave || row.nfce_motivo || row.nfce_protocolo || row.nfce_nota_id)
      ? {
        id: row.nfce_nota_id != null ? Number(row.nfce_nota_id) : null,
        numero: row.nfce_numero || null,
        chave: row.nfce_chave || null,
        protocolo: row.nfce_protocolo || null,
        status: row.nfce_status || null,
        motivo: row.nfce_motivo || null
      }
      : null,
    podeEncerrarFiscal: faturada,
    podeEmitir: situacao !== SITUACAO.AUTORIZADA && situacao !== SITUACAO.NAO_APLICAVEL
  };
}

module.exports = {
  SITUACAO,
  ensureTable,
  obterPorConsignacao,
  salvar,
  toDto
};
