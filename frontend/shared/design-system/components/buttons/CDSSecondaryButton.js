/**
 * CDSSecondaryButton — Botão secundário oficial
 *
 * @module frontend/shared/design-system/components/buttons/CDSSecondaryButton
 */

const { createVariant } = require('../../utils/createVariant');
const CDSButton = require('./CDSButton');

module.exports = createVariant(CDSButton, { variant: 'secondary' });
