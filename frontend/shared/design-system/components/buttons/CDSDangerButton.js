/**
 * CDSDangerButton — Botão de ação destrutiva oficial
 *
 * @module frontend/shared/design-system/components/buttons/CDSDangerButton
 */

const { createVariant } = require('../../utils/createVariant');
const CDSButton = require('./CDSButton');

module.exports = createVariant(CDSButton, { variant: 'danger' });
