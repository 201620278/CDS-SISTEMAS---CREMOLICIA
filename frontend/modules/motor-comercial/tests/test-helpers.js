/**
 * Helpers compartilhados nos testes do Motor Comercial.
 */

function normalizeCurrency(value) {
  return String(value).replace(/\u00a0/g, ' ');
}

function formatTestDate(page, method = '_formatDate') {
  return page[method]('2024-01-15');
}

module.exports = {
  normalizeCurrency,
  formatTestDate
};
