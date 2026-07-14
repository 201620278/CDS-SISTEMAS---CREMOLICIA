/**
 * Playbooks — Sprint O-10.
 *
 * @module motores/motor-comercial/playbooks
 */

const PlaybookService = require('./PlaybookService');
const PlaybookCatalog = require('./PlaybookCatalog');

function criarPlaybookService() {
  return new PlaybookService();
}

module.exports = {
  PlaybookService,
  PlaybookCatalog,
  criarPlaybookService
};
