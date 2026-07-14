/**
 * PdfExportService — exportação PDF padronizada do CDS ERP.
 *
 * Compatível com jsPDF ^4.x e jspdf-autotable ^5.x (API autoTable(doc, options)).
 *
 * @module frontend/shared/services/PdfExportService
 */

const PDF_THEME = {
  primaryColor: [41, 98, 255],
  fontSize: 9,
  titleSize: 14,
  subtitleSize: 10,
  margin: 40,
  cellPadding: 4,
  footFontSize: 8
};

class PdfExportError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PdfExportError';
    this.userMessage = message;
  }
}

function resolveAutoTableFn(autoTablePkg) {
  if (!autoTablePkg) return null;
  if (typeof autoTablePkg.autoTable === 'function') return autoTablePkg.autoTable;
  if (typeof autoTablePkg.default === 'function') return autoTablePkg.default;
  if (typeof autoTablePkg === 'function') return autoTablePkg;
  return null;
}

function loadPdfLibraries() {
  try {
    const { jsPDF } = require('jspdf');
    const autoTablePkg = require('jspdf-autotable');
    return {
      jsPDF,
      autoTableFn: resolveAutoTableFn(autoTablePkg),
      applyPlugin: typeof autoTablePkg.applyPlugin === 'function'
        ? autoTablePkg.applyPlugin
        : null
    };
  } catch (_error) {
    return null;
  }
}

let cachedLibraries = undefined;

function getPdfLibraries() {
  if (cachedLibraries === undefined) {
    cachedLibraries = loadPdfLibraries();
  }
  return cachedLibraries;
}

function unavailableMessage() {
  return 'Exportação PDF indisponível. Verifique se as bibliotecas jsPDF e jspdf-autotable estão instaladas.';
}

class PdfExportService {
  static isAvailable() {
    const lib = getPdfLibraries();
    if (!lib) return false;
    return Boolean(lib.autoTableFn || lib.applyPlugin);
  }

  static createDocument(options = {}) {
    const lib = getPdfLibraries();
    if (!lib) {
      return { ok: false, message: unavailableMessage() };
    }

    const {
      headers = [],
      orientation,
      unit = 'pt',
      format = 'a4'
    } = options;

    const doc = new lib.jsPDF({
      orientation: orientation || (headers.length > 5 ? 'landscape' : 'portrait'),
      unit,
      format
    });

    return { ok: true, doc, lib };
  }

  static applyAutoTable(doc, lib, tableOptions) {
    if (typeof lib.autoTableFn === 'function') {
      lib.autoTableFn(doc, tableOptions);
      return { ok: true };
    }

    if (typeof lib.applyPlugin === 'function') {
      lib.applyPlugin(lib.jsPDF);
      if (typeof doc.autoTable === 'function') {
        doc.autoTable(tableOptions);
        return { ok: true };
      }
    }

    return {
      ok: false,
      message: 'Plugin de tabelas PDF não está disponível. Reinstale jspdf-autotable ou atualize o sistema.'
    };
  }

  static addFooter(doc, subtitle) {
    const pageCount = typeof doc.getNumberOfPages === 'function'
      ? doc.getNumberOfPages()
      : doc.internal.getNumberOfPages();

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const stamp = new Date().toLocaleString('pt-BR');

    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      doc.setFontSize(PDF_THEME.footFontSize);
      doc.setTextColor(120);

      const left = subtitle
        ? `${subtitle} — Página ${page}/${pageCount}`
        : `Página ${page}/${pageCount}`;

      doc.text(left, PDF_THEME.margin, pageHeight - 20);
      doc.text(stamp, pageWidth - PDF_THEME.margin, pageHeight - 20, { align: 'right' });
      doc.setTextColor(0);
    }
  }

  /**
   * @param {Object} options
   * @param {string} options.title
   * @param {string[]} options.headers
   * @param {Array<string[]|Object>} options.rows
   * @param {string} options.filename
   * @param {string} [options.subtitle]
   * @param {'portrait'|'landscape'} [options.orientation]
   * @returns {{ ok: boolean, message?: string }}
   */
  static exportTable({ title, headers, rows, filename, subtitle, orientation }) {
    if (!headers?.length) {
      return { ok: false, message: 'Não há colunas para exportar em PDF.' };
    }

    const created = PdfExportService.createDocument({ headers, orientation });
    if (!created.ok) return created;

    const { doc, lib } = created;

    doc.setFontSize(PDF_THEME.titleSize);
    doc.text(title || 'Relatório', PDF_THEME.margin, 40);

    let startY = 55;
    if (subtitle) {
      doc.setFontSize(PDF_THEME.subtitleSize);
      doc.setTextColor(80);
      doc.text(subtitle, PDF_THEME.margin, 52);
      doc.setTextColor(0);
      startY = 65;
    }

    const applied = PdfExportService.applyAutoTable(doc, lib, {
      head: [headers],
      body: rows,
      startY,
      styles: { fontSize: PDF_THEME.fontSize, cellPadding: PDF_THEME.cellPadding },
      headStyles: { fillColor: PDF_THEME.primaryColor },
      theme: 'striped',
      margin: { left: PDF_THEME.margin, right: PDF_THEME.margin }
    });

    if (!applied.ok) return applied;

    PdfExportService.addFooter(doc, subtitle || title);

    const name = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    doc.save(name);
    return { ok: true };
  }

  /**
   * @param {Object} options
   * @param {string} options.title
   * @param {Array<[string, string]>} options.pairs
   * @param {string} options.filename
   * @param {string} [options.subtitle]
   * @returns {{ ok: boolean, message?: string }}
   */
  static exportKeyValue({ title, pairs, filename, subtitle }) {
    return PdfExportService.exportTable({
      title,
      headers: ['Campo', 'Valor'],
      rows: pairs,
      filename,
      subtitle
    });
  }
}

if (typeof window !== 'undefined') {
  window.PdfExportService = PdfExportService;
}

module.exports = PdfExportService;
module.exports.PdfExportError = PdfExportError;
module.exports.PDF_THEME = PDF_THEME;
