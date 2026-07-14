/**
 * Hooks — Index (versão oficial)
 *
 * Sprint 2.7: Arquitetura Frontend — hooks reutilizáveis.
 *
 * @module frontend/modules/motor-comercial/hooks
 */

const useLoading = require('./useLoading');
const useRequest = require('./useRequest');
const usePagination = require('./usePagination');
const useFilters = require('./useFilters');
const useToast = require('./useToast');
const useModal = require('./useModal');
const useConfirm = require('./useConfirm');

module.exports = {
  useLoading,
  useRequest,
  usePagination,
  useFilters,
  useToast,
  useModal,
  useConfirm
};
