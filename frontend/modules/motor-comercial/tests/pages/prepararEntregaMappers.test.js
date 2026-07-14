/**
 * prepararEntregaMappers Tests — Sprint UX-04
 */

const {
  calcularTotaisItens,
  calcularUtilizacaoLimite,
  buildPainelResumo,
  buildValidacoesConferencia,
  buildClienteResumo,
  inicializarSteps,
  buildMensagemInteligente,
  calcularDestaqueSaldoRestante,
  simularInclusaoProduto,
  FLUXO_MOMENTOS
} = require('../../pages/NovaConsignacao/prepararEntregaMappers');

describe('prepararEntregaMappers', () => {
  test('FLUXO_MOMENTOS possui quatro etapas operacionais', () => {
    expect(FLUXO_MOMENTOS).toHaveLength(4);
    expect(FLUXO_MOMENTOS.map((m) => m.label)).toEqual([
      'Cliente', 'Produtos', 'Conferência', 'Conclusão'
    ]);
  });

  test('calcularTotaisItens soma quantidade e valor', () => {
    const totais = calcularTotaisItens([
      { quantidade: 2, preco: 10 },
      { quantidade: 3, preco: 5 }
    ]);
    expect(totais.quantidadeItens).toBe(2);
    expect(totais.quantidadeTotal).toBe(5);
    expect(totais.valorTotal).toBe(35);
  });

  test('buildPainelResumo projeta crédito após entrega sem recalcular SSOT', () => {
    const painel = buildPainelResumo(
      [{ quantidade: 2, preco: 50 }],
      { saldo: 100, saldoDevedor: 100, limiteComercial: 1000, limiteDisponivel: 500, creditoDisponivel: 500 }
    );
    expect(painel.valorTotal).toBe(100);
    expect(painel.saldoAposEntrega).toBe(200);
    expect(painel.creditoDisponivel).toBe(500);
    expect(painel.creditoAposEntrega).toBe(400);
    expect(painel.limiteRestante).toBe(400);
    expect(painel.percentualLimite).toBe(20);
    expect(painel.faixaUtilizacao).toBe('verde');
    expect(painel.excedeLimite).toBe(false);
  });

  test('calcularUtilizacaoLimite classifica faixas de cor', () => {
    expect(calcularUtilizacaoLimite(50, 100).faixa).toBe('verde');
    expect(calcularUtilizacaoLimite(75, 100).faixa).toBe('amarelo');
    expect(calcularUtilizacaoLimite(95, 100).faixa).toBe('laranja');
    expect(calcularUtilizacaoLimite(120, 100).faixa).toBe('vermelho');
  });

  test('buildPainelResumo sinaliza excedente sem alterar crédito SSOT da API', () => {
    const painel = buildPainelResumo(
      [{ quantidade: 10, preco: 100 }],
      { nome: 'Cliente Teste', limiteComercial: 800, limiteDisponivel: 500, creditoDisponivel: 500 }
    );
    expect(painel.excedeLimite).toBe(true);
    expect(painel.valorExcedido).toBe(500);
    expect(painel.creditoDisponivel).toBe(500);
    expect(painel.creditoAposEntrega).toBe(0);
    expect(painel.creditoAposEntregaExibicao).toMatch(/R\$\s*0,00/);
    expect(painel.faixaUtilizacao).toBe('vermelho');
  });

  test('buildValidacoesConferencia detecta limite excedido', () => {
    const avisos = buildValidacoesConferencia(
      { itens: [{ quantidade: 10, preco: 100 }] },
      { limiteDisponivel: 500, situacao: 'ATIVO' }
    );
    expect(avisos.some((a) => a.nivel === 'danger')).toBe(true);
  });

  test('buildClienteResumo usa campos operacionais', () => {
    const campos = buildClienteResumo({
      nome: 'Mercantil São José',
      telefone: '88999999999',
      cidade: 'Fortaleza',
      capacidades: ['Consignação'],
      saldo: 150,
      limiteDisponivel: 800
    });
    expect(campos.find((c) => c.label === 'Cliente').value).toBe('Mercantil São José');
    expect(campos.find((c) => c.label === 'Capacidades').value).toBe('Consignação');
  });

  test('inicializarSteps pula cliente quando solicitado', () => {
    const steps = inicializarSteps(true);
    expect(steps[0].state).toBe('completed');
    expect(steps[1].state).toBe('current');
  });

  test('buildMensagemInteligente interpreta cenários operacionais', () => {
    expect(buildMensagemInteligente({
      limiteDisponivel: 500,
      valorTotal: 100,
      excedeLimite: false,
      faixaUtilizacao: 'verde',
      saldoRestante: 400
    }).texto).toBe('Cliente possui crédito suficiente para esta entrega.');

    expect(buildMensagemInteligente({
      limiteDisponivel: 500,
      valorTotal: 401,
      excedeLimite: false,
      faixaUtilizacao: 'amarelo',
      saldoRestante: 99
    }).texto).toMatch(/Após esta entrega restarão apenas R\$\s*99,00 de crédito\./);

    expect(buildMensagemInteligente({
      limiteDisponivel: 500,
      valorTotal: 380,
      excedeLimite: false,
      faixaUtilizacao: 'amarelo',
      saldoRestante: 120
    }).texto).toBe('Cliente está próximo do limite comercial.');

    expect(buildMensagemInteligente({
      limiteDisponivel: 500,
      valorTotal: 600,
      excedeLimite: true,
      valorExcedido: 100
    }).texto).toMatch(/Esta entrega ultrapassa o limite em R\$\s*100,00\./);

    expect(buildMensagemInteligente({
      limiteDisponivel: 500,
      valorTotal: 460,
      excedeLimite: false,
      faixaUtilizacao: 'verde',
      saldoRestante: 40
    }).texto).toMatch(/Após esta entrega restarão apenas R\$\s*40,00 de crédito\./);
  });

  test('calcularDestaqueSaldoRestante aplica faixas de alerta', () => {
    expect(calcularDestaqueSaldoRestante(100, 500)).toBe('normal');
    expect(calcularDestaqueSaldoRestante(80, 500)).toBe('alerta');
    expect(calcularDestaqueSaldoRestante(30, 500)).toBe('critico');
  });

  test('buildPainelResumo inclui valor médio por item', () => {
    const painel = buildPainelResumo(
      [
        { quantidade: 2, preco: 50 },
        { quantidade: 1, preco: 100 }
      ],
      { limiteDisponivel: 1000 }
    );
    expect(painel.valorMedioItem).toBe(100);
    expect(painel.valorMedioItemExibicao).toMatch(/R\$\s*100,00/);
    expect(painel.percentualUtilizadoTexto).toMatch(/utilizado/);
  });

  test('simularInclusaoProduto projeta inclusão e sinaliza ultrapassagem', () => {
    const perfil = { limiteDisponivel: 500 };
    const itens = [{ produtoId: 1, quantidade: 2, preco: 100 }];
    const sim = simularInclusaoProduto(itens, perfil, { id: 2, nome: 'Leite', preco: 50 }, 4);

    expect(sim.valorInclusao).toBe(200);
    expect(sim.painelProjetado.valorTotal).toBe(400);
    expect(sim.inclusaoUltrapassaLimite).toBe(false);

    const simExcede = simularInclusaoProduto(itens, perfil, { id: 3, nome: 'Queijo', preco: 200 }, 2);
    expect(simExcede.painelProjetado.excedeLimite).toBe(true);
    expect(simExcede.inclusaoUltrapassaLimite).toBe(true);
  });
});
