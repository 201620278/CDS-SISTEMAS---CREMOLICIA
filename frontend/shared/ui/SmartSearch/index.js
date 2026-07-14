/**
 * SmartSearch — Shared UI barrel (FOUNDATION F3)
 *
 * @module frontend/shared/ui/SmartSearch
 */

const SmartSearch = require('./SmartSearch');

module.exports = SmartSearch;
module.exports.SmartSearch = SmartSearch;
module.exports.STATUS = SmartSearch.STATUS;
module.exports.create = SmartSearch.create.bind(SmartSearch);
module.exports.focus = SmartSearch.focus.bind(SmartSearch);
module.exports.clear = SmartSearch.clear.bind(SmartSearch);
module.exports.destroy = SmartSearch.destroy.bind(SmartSearch);
module.exports.getStyles = SmartSearch.getStyles.bind(SmartSearch);
module.exports.ensureStyles = SmartSearch.ensureStyles.bind(SmartSearch);
module.exports.STATES = SmartSearch.STATES;
