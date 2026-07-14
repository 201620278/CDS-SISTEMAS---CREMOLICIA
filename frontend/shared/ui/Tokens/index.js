/**
 * Tokens — re-export do Design System
 * STATUS: bridge
 */

const tokens = require('../../design-system/tokens');

module.exports = {
  STATUS: 'bridge',
  NAME: 'Tokens',
  bridgeFrom: 'design-system/tokens',
  ...tokens
};
