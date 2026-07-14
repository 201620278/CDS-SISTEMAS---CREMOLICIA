/**
 * CDSPrimaryButton — Botão primário oficial
 *
 * @module frontend/shared/design-system/components/buttons/CDSPrimaryButton
 */

const { createVariant } = require('../../utils/createVariant');
const CDSButton = require('./CDSButton');

module.exports = createVariant(CDSButton, { variant: 'primary' });
