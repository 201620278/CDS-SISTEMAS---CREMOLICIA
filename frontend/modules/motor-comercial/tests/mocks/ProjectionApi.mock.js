/**
 * Projection API Mock
 *
 * Sprint 3.0: Dashboard Comercial — mocks da Projection API.
 *
 * @module frontend/modules/motor-comercial/tests/mocks
 */

const mockDashboardData = {
  totalConsignado: 1500000,
  saldoAberto: 450000,
  recebimentos: 850000,
  perdas: 200000,
  conversao: 85,
  conversaoTrend: 'up',
  prestacaoAberto: 300000,
  clientesAtivos: 45,
  ticketMedio: 33333.33,
  alertas: [
    {
      mensagem: 'Prestação atrasada: Cliente ABC',
      severidade: 'warning'
    },
    {
      mensagem: 'Limite excedido: Cliente XYZ',
      severidade: 'critical'
    }
  ]
};

const mockTimelineData = [
  {
    data: '2024-01-15T10:00:00Z',
    tipo: 'Entrega',
    descricao: 'Consignação #123 entregue ao cliente ABC'
  },
  {
    data: '2024-01-14T14:30:00Z',
    tipo: 'Pagamento',
    descricao: 'Pagamento recebido da consignação #122'
  },
  {
    data: '2024-01-13T09:15:00Z',
    tipo: 'Prestação',
    descricao: 'Prestação registrada para consignação #121'
  }
];

const mockIndicadoresData = {
  consignacoesPorPeriodo: [
    { periodo: '2024-01-01', valor: 500000 },
    { periodo: '2024-01-08', valor: 600000 },
    { periodo: '2024-01-15', valor: 400000 }
  ],
  statusDasConsignacoes: [
    { status: 'Ativo', quantidade: 25 },
    { status: 'Pendente', quantidade: 15 },
    { status: 'Bloqueado', quantidade: 5 }
  ]
};

const mockHistoricoData = [
  {
    data: '2024-01-15T10:00:00Z',
    tipo: 'Entrega',
    documento: 'CON-123',
    cliente: 'Cliente ABC',
    status: 'active'
  },
  {
    data: '2024-01-14T14:30:00Z',
    tipo: 'Pagamento',
    documento: 'REC-456',
    cliente: 'Cliente XYZ',
    status: 'completed'
  },
  {
    data: '2024-01-13T09:15:00Z',
    tipo: 'Prestação',
    documento: 'PRE-789',
    cliente: 'Cliente DEF',
    status: 'pending'
  }
];

/**
 * Mock ProjectionApi for testing
 */
class MockProjectionApi {
  constructor() {
    this.delay = 100; // Simulate network delay
  }

  async obterProjecaoDashboard(params = {}) {
    await this._simulateDelay();
    return { ...mockDashboardData };
  }

  async obterProjecaoTimeline(params = {}) {
    await this._simulateDelay();
    return [...mockTimelineData];
  }

  async obterProjecaoIndicadores(params = {}) {
    await this._simulateDelay();
    return { ...mockIndicadoresData };
  }

  async obterProjecaoHistorico(params = {}) {
    await this._simulateDelay();
    return [...mockHistoricoData];
  }

  async obterProjecaoVendas(params = {}) {
    await this._simulateDelay();
    return [];
  }

  async obterProjecaoEstoque(params = {}) {
    await this._simulateDelay();
    return [];
  }

  async obterProjecaoFinanceira(params = {}) {
    await this._simulateDelay();
    return [];
  }

  async obterProjecaoConsolidada(params = {}) {
    await this._simulateDelay();
    return [];
  }

  _simulateDelay() {
    return new Promise(resolve => setTimeout(resolve, this.delay));
  }
}

module.exports = {
  MockProjectionApi,
  mockDashboardData,
  mockTimelineData,
  mockIndicadoresData,
  mockHistoricoData
};
