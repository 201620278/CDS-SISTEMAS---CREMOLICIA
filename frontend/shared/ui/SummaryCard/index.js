const StatCard = require('../../design-system/primitives/data/StatCard');
const { createBridgeComponent } = require('../_status');

module.exports = createBridgeComponent('SummaryCard', StatCard.create.bind(StatCard), {
  responsibility: 'Resumo numérico curto (≤ 3 no pulso da Central)',
  bridgeFrom: 'design-system/primitives/data/StatCard'
});
