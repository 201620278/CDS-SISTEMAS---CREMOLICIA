/**
 * PdfExportService — testes de integração jsPDF + jspdf-autotable.
 */

const PdfExportService = require('../../../../shared/services/PdfExportService');

describe('PdfExportService', () => {
  test('isAvailable retorna true com dependências instaladas', () => {
    expect(PdfExportService.isAvailable()).toBe(true);
  });

  test('exportTable gera PDF sem erro de autoTable', () => {
    const originalCreateElement = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreateElement(tag);
      if (tag === 'a') {
        el.click = jest.fn();
      }
      return el;
    });

    const result = PdfExportService.exportTable({
      title: 'Relatório de teste',
      headers: ['Campo', 'Valor'],
      rows: [['Total', '100'], ['Clientes', '5']],
      filename: 'teste-exportacao.pdf',
      subtitle: 'CDS ERP'
    });

    expect(result.ok).toBe(true);
    document.createElement.mockRestore();
  });

  test('exportKeyValue delega para exportTable', () => {
    const result = PdfExportService.exportKeyValue({
      title: 'Painel Executivo',
      pairs: [['Faturamento', 'R$ 1.000,00']],
      filename: 'painel.pdf'
    });

    expect(result.ok).toBe(true);
  });

  test('retorna mensagem amigável sem colunas', () => {
    const result = PdfExportService.exportTable({
      title: 'Vazio',
      headers: [],
      rows: [],
      filename: 'vazio.pdf'
    });

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/colunas/i);
  });
});
