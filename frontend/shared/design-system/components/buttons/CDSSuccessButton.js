/**
 * CDSSuccessButton — Botão de sucesso oficial
 *
 * @module frontend/shared/design-system/components/buttons/CDSSuccessButton
 */

const { createVariant } = require('../../utils/createVariant');
const CDSButton = require('./CDSButton');

module.exports = createVariant(CDSButton, { variant: 'success' });
