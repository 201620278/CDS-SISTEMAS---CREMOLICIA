/**
 * centralOperacoesMappers Tests — Sprint UX-02.2 / P0-03 / STAB-02
 */

const {
  buildProximaAcao,
  buildAcoesPrincipais,
  buildCentralOperacoesViewModel,
  buildSituacaoCliente,
  metricasLimite,
  limiteExcedido,
  findConsignacaoEmEntrega
} = require('../../pages/PerfilComercial/centralOperacoesMappers');

describe('centralOperacoesMappers', () => {
  test('detecta entrega em andamento', () => {
    const consignacao = findConsignacaoEmEntrega([
      { id: 1, status: 'RASCUNHO', documento: 'C-001' }
    ]);
    expect(consignacao.id).toBe(1);
  });

  test('próxima ação urgente sugere continuar entrega', () => {
    const acao = buildProximaAcao({
      perfil: { bloqueado: false },
      consignacoes: [{ id: 5, status: 'RASCUNHO', documento: 'C-005' }]
    });
    expect(acao.urgente).toBe(true);
    expect(acao.acaoLabel).toBe('Continuar Entrega');
    expect(acao.acaoTipo).toBe('entrega');
    expect(acao.consignacaoId).toBe(5);
  });

  test('próxima ação não é urgente quando cliente regular', () => {
    const acao = buildProximaAcao({
      perfil: { bloqueado: false, limiteComercial: 1000 },
      situacao: {
        statusGeral: 'REGULAR',
        saldo: 0,
        saldoDevedor: 0,
        limite: 1000,
        creditoDisponivel: 1000
      },
      consignacoes: []
    });
    expect(acao.urgente).toBe(false);
    expect(acao.acaoTipo).toBe('nova-consignacao');
  });

  test('ações principais incluem as 5 ações da ficha', () => {
    const proxima = buildProximaAcao({
      consignacoes: [{ id: 3, status: 'EM_PRESTACAO', documento: 'C-003' }]
    });
    const acoes = buildAcoesPrincipais(proxima, [{ id: 3, status: 'EM_PRESTACAO' }]);
    expect(acoes).toHaveLength(5);
    expect(acoes.map((a) => a.label)).toEqual([
      'Preparar Entrega',
      'Fechar Atendimento',
      'Conta Corrente',
      'Histórico',
      'Dados do Cliente'
    ]);
    expect(acoes.find((a) => a.label === 'Fechar Atendimento').destaque).toBe(true);
  });

  test('situação do cliente monta métricas operacionais a partir da API', () => {
    const situacao = buildSituacaoCliente({
      perfil: { limiteComercial: 5000 },
      situacao: { saldo: 1200, saldoDevedor: 1200, limite: 5000, creditoDisponivel: 3800 },
      consignacoes: [{ id: 1, status: 'ENTREGUE' }],
      pendencias: { resumo: { pendentes: 2 } },
      identificacao: { consignacoesAbertas: 1, ultimaEntrega: '2026-07-01' }
    });
    expect(situacao.limiteComercial).toBe(5000);
    expect(situacao.creditoUtilizado).toBe(1200);
    expect(situacao.creditoDisponivel).toBe(3800);
    expect(situacao.consignacoesAbertas).toBe(1);
    expect(situacao.pendencias).toBe(2);
  });

  test('viewModel monta ficha operacional', () => {
    const vm = buildCentralOperacoesViewModel({
      perfil: {
        clienteNome: 'Mercantil São José',
        cpfCnpj: '123',
        telefone: '88999999999',
        limiteComercial: 2000,
        createdAt: '2026-07-01T10:00:00.000Z'
      },
      perfis: [{ perfilTipo: 'CONSIGNADO' }],
      situacao: {
        saldo: 100,
        saldoDevedor: 100,
        consignacoesAbertas: [{ id: 1 }],
        limite: 2000,
        creditoDisponivel: 1900
      },
      consignacoes: [{ id: 1, status: 'ENTREGUE', documento: 'C-1', createdAt: '2026-07-05' }],
      contaCorrente: { saldoAtual: 100 },
      pendencias: { alertas: [] },
      historico: [],
      timeline: []
    });

    expect(vm.identificacao.nome).toBe('Mercantil São José');
    expect(vm.identificacao.capacidades).toContain('Consignação');
    expect(vm.acoesPrincipais).toHaveLength(5);
    expect(vm.situacaoCliente.limiteComercial).toBe(2000);
    expect(vm.situacaoCliente.creditoUtilizado).toBe(100);
    expect(vm.situacaoCliente.creditoDisponivel).toBe(1900);
  });
});

describe('STAB-02 crédito comercial SSOT', () => {
  test('consome creditoDisponivel da API sem recalcular', () => {
    const perfil = { limiteComercial: 100 };
    const situacao = { limite: 100, saldoDevedor: 0, creditoDisponivel: 100 };
    const m = metricasLimite(perfil, situacao, {});
    expect(m).toEqual({ limite: 100, utilizado: 0, disponivel: 100 });
    expect(limiteExcedido(perfil, situacao, {})).toBe(false);

    const acao = buildProximaAcao({ perfil, situacao, consignacoes: [] });
    expect(acao.titulo).not.toMatch(/Limite comercial excedido/i);
    expect(acao.urgente).toBe(false);
  });

  test('não inventa crédito quando API omite creditoDisponivel', () => {
    const perfil = { limiteComercial: 100 };
    const situacao = { limite: 100, saldo: 0, limiteDisponivel: 0 };
    const resumo = { saldoDisponivel: 0, saldoUtilizado: 0, limiteComercial: 100 };
    const m = metricasLimite(perfil, situacao, resumo);
    // limiteDisponivel=0 da API é consumido (sem fallback Limite−Utilizado)
    expect(m.disponivel).toBe(0);
  });

  test('cliente com R$ 30 utilizados: disponível vem da API', () => {
    const perfil = { limiteComercial: 100 };
    const situacao = { limite: 100, saldoDevedor: 30, creditoDisponivel: 70 };
    const m = metricasLimite(perfil, situacao, {});
    expect(m).toEqual({ limite: 100, utilizado: 30, disponivel: 70 });
    expect(limiteExcedido(perfil, situacao, {})).toBe(false);
  });

  test('cliente no limite: disponível = 0 e alerta', () => {
    const perfil = { limiteComercial: 100 };
    const situacao = { limite: 100, saldoDevedor: 100, creditoDisponivel: 0 };
    const m = metricasLimite(perfil, situacao, {});
    expect(m).toEqual({ limite: 100, utilizado: 100, disponivel: 0 });
    expect(limiteExcedido(perfil, situacao, {})).toBe(true);

    const acao = buildProximaAcao({ perfil, situacao, consignacoes: [] });
    expect(acao.titulo).toMatch(/Limite comercial excedido/i);
    expect(acao.urgente).toBe(true);
  });

  test('cliente acima do limite: disponível 0 da API e alerta', () => {
    const perfil = { limiteComercial: 100 };
    const situacao = { limite: 100, saldoDevedor: 130, creditoDisponivel: 0 };
    const m = metricasLimite(perfil, situacao, {});
    expect(m).toEqual({ limite: 100, utilizado: 130, disponivel: 0 });
    expect(limiteExcedido(perfil, situacao, {})).toBe(true);
  });
});
