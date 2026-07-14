const Loading = require('../../design-system/primitives/base/Loading');
const { createBridgeComponent } = require('../_status');

module.exports = createBridgeComponent('Loading', Loading.create.bind(Loading), {
  responsibility: 'Estado de carregamento da área operacional',
  bridgeFrom: 'design-system/primitives/base/Loading'
});
