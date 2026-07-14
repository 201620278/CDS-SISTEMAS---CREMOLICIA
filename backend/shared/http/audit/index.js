/**
 * Audit HTTP — Index (versão corporativa).
 *
 * Sprint 2.5.5: Hardening da API — infraestrutura de auditoria HTTP.
 *
 * @module backend/shared/http/audit
 */

const IHttpAuditStore = require('./IHttpAuditStore');
const InMemoryHttpAuditStore = require('./InMemoryHttpAuditStore');
const HttpAuditService = require('./HttpAuditService');

module.exports = {
  IHttpAuditStore,
  InMemoryHttpAuditStore,
  HttpAuditService
};
