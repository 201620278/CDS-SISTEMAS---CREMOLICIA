/**
 * UX-08 — Central de Encerramento da Prestação
 */

const {
  buildCentralEncerramento,
  resolveClienteNome
} = require('../../pages/PrestacaoContas/fecharConsignacaoMappers');

describe('buildCentralEncerramento', () => {
  test('resolveClienteNome não exibe id numérico como nome', () => {
    expect(resolveClienteNome({ clienteId: 3, cliente: 3 }, { nome: 'Cícero Diego' }))
      .toBe('Cícero Diego');
    expect(resolveClienteNome({ clienteId: 3, clienteNome: 'João da Silva' }))
      .toBe('João da Silva');
  });

  test('quitado destaca voltar para central', () => {
    const vm = buildCentralEncerramento({
      consignacao: {
        id: 10,
        clienteId: 3,
        clienteNome: 'Cícero Diego de Souza Machado',
        documento: { numero: 'CONS-10' },
        itens: [
          { enviado: 10, vendido: 10, devolvido: 0, perdido: 0, cortesia: 0, preco: 5 }
        ]
      },
      resumo: {
        valorVendido: 50,
        valorRecebido: 50,
        itens: [
          { enviado: 10, vendido: 10, devolvido: 0, perdido: 0, cortesia: 0, preco: 5 }
        ]
      },
      clienteDetalhe: {
        id: 3,
        nome: 'Cícero Diego de Souza Machado',
        telefone: '84999999999',
        cidade: 'Natal',
        uf: 'RN'
      }
    });

    expect(vm.titulo).toBe('Atendimento concluído');
    expect(vm.cliente.nome).toBe('Cícero Diego de Souza Machado');
    expect(vm.cliente.codigo).toBe('#3');
    expect(vm.financeiro.quitado).toBe(true);
    expect(vm.acoes.primaria).toBe('voltar-central');
    expect(vm.acoes.primariaLabel).toBe('Voltar para Central');
    expect(vm.mensagemOperacional).toMatch(/quitad/i);
  });

  test('saldo devedor destaca conta corrente e recebimento', () => {
    const vm = buildCentralEncerramento({
      consignacao: { id: 1, clienteId: 7, clienteNome: 'Cliente Teste' },
      resumo: {
        valorVendido: 100,
        valorRecebido: 40,
        itens: [
          { enviado: 10, vendido: 8, devolvido: 1, perdido: 1, cortesia: 0, preco: 12.5 }
        ]
      }
    });

    expect(vm.financeiro.quitado).toBe(false);
    expect(vm.financeiro.saldoDevedor).toBe(60);
    expect(vm.acoes.primaria).toBe('recebimento');
    expect(vm.acoes.primariaLabel).toBe('Receber Agora');
    expect(vm.acoes.mostrarRecebimento).toBe(true);
    expect(vm.mensagemOperacional).toMatch(/saldo/i);
  });
});
