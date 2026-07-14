/**
 * EntityCard — Shared UI barrel (FOUNDATION F3)
 *
 * @module frontend/shared/ui/EntityCard
 */

const EntityCard = require('./EntityCard');

module.exports = EntityCard;
module.exports.EntityCard = EntityCard;
module.exports.STATUS = EntityCard.STATUS;
module.exports.create = EntityCard.create.bind(EntityCard);
module.exports.getStyles = EntityCard.getStyles.bind(EntityCard);
module.exports.ensureStyles = EntityCard.ensureStyles.bind(EntityCard);
module.exports.STATES = EntityCard.STATES;
