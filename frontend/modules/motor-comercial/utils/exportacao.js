/**
 * Exportação profissional — Excel (.xlsx) e PDF.
 *
 * Sprint H-2: substitui TSV disfarçado e window.print().
 * PDF delegado ao PdfExportService compartilhado do CDS.
 *
 * @module frontend/modules/motor-comercial/utils/exportacao
 */

const PdfExportService = require('../../../shared/services/PdfExportService');

function normalizeCell(value) {
  if (value == null) return '';
  if (typeof value === 'object' && value.textContent != null) return value.textContent;
  if (typeof value === 'object' && value.innerText != null) return value.innerText;
  return String(value);
}

/**
 * @param {string[]} headers
 * @param {Array<string[]|Object>} rows
 * @param {string} filename
 * @param {string} [sheetName]
 */
function exportToXlsx(headers, rows, filename, sheetName = 'Relatorio') {
  const XLSX = require('xlsx');
  const matrix = [headers];
  rows.forEach((row) => {
    if (Array.isArray(row)) {
      matrix.push(row.map(normalizeCell));
    } else {
      matrix.push(headers.map((h) => normalizeCell(row[h])));
    }
  });

  const worksheet = XLSX.utils.aoa_to_sheet(matrix);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

/**
 * @param {Object} options
 * @param {string} options.title
 * @param {string[]} options.headers
 * @param {Array<string[]|Object>} options.rows
 * @param {string} options.filename
 * @param {string} [options.subtitle]
 * @returns {{ ok: boolean, message?: string }}
 */
function exportToPdf({ title, headers, rows, filename, subtitle }) {
  const body = rows.map((row) => {
    if (Array.isArray(row)) return row.map(normalizeCell);
    return headers.map((h) => normalizeCell(row[h]));
  });

  return PdfExportService.exportTable({
    title,
    headers,
    rows: body,
    filename,
    subtitle
  });
}

/**
 * @param {string} title
 * @param {Array<[string, string]>} pairs
 * @param {string} filename
 * @returns {{ ok: boolean, message?: string }}
 */
function exportKeyValuePdf(title, pairs, filename) {
  return PdfExportService.exportKeyValue({
    title,
    pairs: pairs.map(([k, v]) => [k, normalizeCell(v)]),
    filename
  });
}

function exportKeyValueXlsx(title, pairs, filename) {
  exportToXlsx(['Campo', 'Valor'], pairs, filename, title.slice(0, 31) || 'Relatorio');
}

module.exports = {
  exportToXlsx,
  exportToPdf,
  exportKeyValuePdf,
  exportKeyValueXlsx,
  normalizeCell,
  PdfExportService
};
