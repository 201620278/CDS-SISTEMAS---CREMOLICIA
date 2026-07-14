/**
 * Logging HTTP — Index (versão corporativa).
 *
 * Sprint 2.5.5: Hardening da API — infraestrutura compartilhada.
 *
 * @module backend/shared/http/logging
 */

const RequestLog = require('./RequestLog');
const BusinessLog = require('./BusinessLog');
const PerformanceLog = require('./PerformanceLog');
const SecurityLog = require('./SecurityLog');
const ErrorLog = require('./ErrorLog');

module.exports = {
  RequestLog,
  BusinessLog,
  PerformanceLog,
  SecurityLog,
  ErrorLog
};
