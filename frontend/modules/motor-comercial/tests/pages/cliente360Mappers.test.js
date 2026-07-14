/**
 * Cliente 360° Mappers — Sprint S-5
 */

const {
  inferTipoPessoa,
  buildHeaderInfo,
  buildResumoComercial,
  buildPendenciasGrouped,
  buildRecomendacoesRelevantes,
  buildHistoricoUnificado,
  CLIENTE360_SECTIONS
} = require('../../pages/PerfilComercial/cliente360Mappers');

describe('cliente360Mappers', () => {
  test('inferTipoPessoa detects CPF and CNPJ', () => {
    expect(inferTipoPessoa('123.456.789-00')).toBe('Pessoa Física');
    expect(inferTipoPessoa('12.345.678/0001-90')).toBe('Pessoa Jurídica');
  });

  test('buildHeaderInfo uses cliente mestre nested data', () => {
    const info = buildHeaderInfo({
      perfilTipo: 'CONSIGNADO',
      ativo: true,
      clienteNome: 'Maria',
      cpfCnpj: '12345678900',
      telefone: '85999999999',
      cliente: {
        createdAt: '2024-01-01',
        endereco: { cidade: 'Fortaleza', uf: 'CE' }
      }
    });
    expect(info.nome).toBe('Maria');
    expect(info.tipoPessoa).toBe('Pessoa Física');
    expect(info.cidadeUf).toBe('Fortaleza / CE');
    expect(info.perfilComercial).toBe('CONSIGNADO');
  });

  test('buildResumoComercial counts active consignacoes', () => {
    const resumo = buildResumoComercial(
      { limiteComercial: 1000, saldoAberto: 200 },
      { limiteUtilizado: 200, limiteDisponivel: 800 },
      {},
      [{ status: 'ENTREGUE' }, { status: 'CANCELADA' }],
      { resumo: { pendentes: 2 }, alertas: [{}, {}] },
      { eventos: [{ dataMovimentacao: '2026-06-01' }] }
    );
    expect(resumo.consignacoesAtivas).toBe(1);
    expect(resumo.pendencias).toBe(2);
    expect(resumo.saldoDisponivel).toBe(800);
  });

  test('buildPendenciasGrouped splits by domain', () => {
    const groups = buildPendenciasGrouped({
      alertas: [
        { severidade: 'WARNING', categoria: 'FINANCEIRO', descricao: 'A' },
        { severidade: 'INFO', categoria: 'OPERACIONAL', descricao: 'B' },
        { severidade: 'INFO', categoria: 'COMERCIAL', descricao: 'C' }
      ]
    });
    expect(groups.financeiras).toHaveLength(1);
    expect(groups.operacionais).toHaveLength(1);
    expect(groups.comerciais).toHaveLength(1);
  });

  test('buildRecomendacoesRelevantes limits actionable items', () => {
    const items = buildRecomendacoesRelevantes({
      recomendacoes: [
        { id: '1', titulo: 'A', prioridade: 'NORMAL' },
        { id: '2', titulo: 'B', prioridade: 'ALTA', acaoRecomendada: 'Ligar' },
        { id: '3', titulo: 'C', prioridade: 'URGENTE' }
      ]
    }, 2);
    expect(items).toHaveLength(2);
    expect(items[0].id).toBe('2');
  });

  test('buildHistoricoUnificado merges and sorts events', () => {
    const historico = buildHistoricoUnificado(
      [{ tipoMovimentacao: 'VENDA', dataMovimentacao: '2026-01-01' }],
      [{ tipoMovimentacao: 'LIMITE_ALTERADO', dataMovimentacao: '2026-06-01' }]
    );
    expect(historico[0].tipo).toBe('LIMITE_ALTERADO');
    expect(historico).toHaveLength(2);
  });

  test('CLIENTE360_SECTIONS defines enterprise layout', () => {
    expect(CLIENTE360_SECTIONS.map((s) => s.id)).toEqual([
      'resumo', 'timeline', 'conta-corrente', 'consignacoes',
      'pendencias', 'recomendacoes', 'guias', 'historico'
    ]);
  });
});
