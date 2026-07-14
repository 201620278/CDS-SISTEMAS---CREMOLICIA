/**
 * Contexts — Index (versão oficial)
 *
 * Sprint 2.7: Arquitetura Frontend — contextos globais.
 *
 * @module frontend/modules/motor-comercial/contexts
 */

const themeContext = require('./ThemeContext');
const toastContext = require('./ToastContext');
const modalContext = require('./ModalContext');
const loadingContext = require('./LoadingContext');
const userContext = require('./UserContext');

module.exports = {
  themeContext,
  toastContext,
  modalContext,
  loadingContext,
  userContext
};
