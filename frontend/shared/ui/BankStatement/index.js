const { createPlannedComponent } = require('../_status');
module.exports = createPlannedComponent('BankStatement', {
  responsibility: 'Extrato: saldo + lançamentos (Conta Corrente / Financeiro / Fluxo de Caixa)',
  events: ['onFilterPeriod', 'onSearch', 'onPrimaryCashAction', 'onSelectEntry']
});
