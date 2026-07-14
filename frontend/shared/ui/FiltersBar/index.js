const CDSFilterBar = require('../../design-system/components/search/CDSFilterBar');
const { createBridgeComponent } = require('../_status');

const factory = typeof CDSFilterBar.create === 'function'
  ? CDSFilterBar.create.bind(CDSFilterBar)
  : (opts) => CDSFilterBar(opts);

module.exports = createBridgeComponent('FiltersBar', factory, {
  responsibility: 'Filtros avançados recolhíveis',
  bridgeFrom: 'design-system/components/search/CDSFilterBar'
});
