/**
 * Utilitários de campos de formulário — sem dependências de componentes.
 *
 * Sprint DS-01.1: evita ReferenceError por cadeia circular em operacional.js.
 *
 * @module frontend/modules/motor-comercial/utils/formField
 */

function extrairValorInput(field) {
  if (!field) return '';
  if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA' || field.tagName === 'SELECT') {
    return String(field.value || '').trim();
  }
  const input = field.querySelector('input, textarea, select');
  return input ? String(input.value || '').trim() : '';
}

module.exports = {
  extrairValorInput
};
