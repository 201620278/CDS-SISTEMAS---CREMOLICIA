/**
 * Organização comercial — empresas e filiais (Sprint S-6)
 *
 * @module frontend/modules/motor-comercial/config/comercialOrganizacao
 */

const EMPRESAS = Object.freeze([
  { value: 'cremolicia', label: 'Cremolicia' }
]);

const FILIAIS = Object.freeze([
  { value: 'matriz', label: 'Matriz' }
]);

/**
 * @returns {{ empresas: Array, filiais: Array, empresaLocked: boolean, filialLocked: boolean, empresaDefault: string, filialDefault: string }}
 */
function obterOpcoesOrganizacao() {
  const empresaDefault = EMPRESAS[0]?.value || '';
  const filialDefault = FILIAIS[0]?.value || '';
  return {
    empresas: EMPRESAS,
    filiais: FILIAIS,
    empresaLocked: EMPRESAS.length <= 1,
    filialLocked: FILIAIS.length <= 1,
    empresaDefault,
    filialDefault
  };
}

module.exports = {
  EMPRESAS,
  FILIAIS,
  obterOpcoesOrganizacao
};
