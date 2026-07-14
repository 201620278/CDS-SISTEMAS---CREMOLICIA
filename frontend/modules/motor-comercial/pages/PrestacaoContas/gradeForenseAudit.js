/**
 * Logger STAB-04 — Grade Prestação.
 * Ativar: window.__CDS_PRESTACAO_DEBUG__ = true
 *      ou localStorage CDS_PRESTACAO_DEBUG=1
 *      ou legado CDS_FORENSE_GRADE / __CDS_FORENSE_GRADE__
 *
 * @module frontend/modules/motor-comercial/pages/PrestacaoContas/gradeForenseAudit
 */

function isEnabled() {
  if (typeof window === 'undefined') return false;
  if (window.__CDS_PRESTACAO_DEBUG__ === true) return true;
  if (window.__CDS_FORENSE_GRADE__ === true) return true;
  try {
    if (window.localStorage?.getItem('CDS_PRESTACAO_DEBUG') === '1') return true;
    if (window.localStorage?.getItem('CDS_FORENSE_GRADE') === '1') return true;
  } catch (_e) {
    /* ignore */
  }
  return false;
}

function snapshotItem(item = {}) {
  return {
    itemId: item.itemId ?? item.id ?? null,
    produtoId: item.produtoId ?? null,
    enviado: Number(item.enviado ?? 0),
    vendido: Number(item.vendido ?? 0),
    devolvido: Number(item.devolvido ?? 0),
    perdido: Number(item.perdido ?? 0),
    cortesia: Number(item.cortesia ?? 0),
    saldo: Number(item.saldo ?? 0),
    dirty: Boolean(item.dirty),
    dirtyCampos: item.dirtyCampos || {}
  };
}

function log(fase, payload = {}) {
  if (!isEnabled()) return;
  const entry = {
    ts: new Date().toISOString(),
    canal: 'CDS_PRESTACAO_DEBUG',
    fase,
    ...payload
  };
  // eslint-disable-next-line no-console
  console.log('[CDS_PRESTACAO_DEBUG]', JSON.stringify(entry));
  if (!window.__CDS_PRESTACAO_DEBUG_LOGS__) window.__CDS_PRESTACAO_DEBUG_LOGS__ = [];
  window.__CDS_PRESTACAO_DEBUG_LOGS__.push(entry);
  if (!window.__CDS_FORENSE_GRADE_LOGS__) window.__CDS_FORENSE_GRADE_LOGS__ = [];
  window.__CDS_FORENSE_GRADE_LOGS__.push(entry);
}

module.exports = {
  isEnabled,
  snapshotItem,
  log
};
