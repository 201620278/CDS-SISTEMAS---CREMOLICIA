/**
 * Cliente 360° navigation context — Sprint S-5.1
 */

const {
  ORIGEM_CLIENTE_360,
  ORIGEM_CENTRAL_TRABALHO,
  isFromCliente360,
  isFromCentralTrabalho,
  parseCliente360Context,
  buildCliente360Query,
  buildCentralTrabalhoQuery,
  buildRouteWithCliente360Context,
  buildRouteWithCentralTrabalhoContext,
  getCliente360ReturnPath,
  getCentralTrabalhoReturnPath,
  resolveBackPath,
  routeWithActiveContext,
  getBackButtonLabel
} = require('../../utils/cliente360Context');

describe('cliente360Context', () => {
  test('detecta origem cliente360', () => {
    expect(isFromCliente360({ origem: 'cliente360', clienteId: '10' })).toBe(true);
    expect(isFromCliente360({ clienteId: '10' })).toBe(false);
  });

  test('parse bloqueia seleção quando origem e clienteId válidos', () => {
    const ctx = parseCliente360Context({ origem: ORIGEM_CLIENTE_360, clienteId: '42' });
    expect(ctx.clienteId).toBe(42);
    expect(ctx.locked).toBe(true);
    expect(ctx.skipClienteSelection).toBe(true);
  });

  test('buildRouteWithCliente360Context monta query oficial', () => {
    const route = buildRouteWithCliente360Context('/consignacoes/nova', 7);
    expect(route).toContain('/consignacoes/nova?');
    expect(route).toContain('clienteId=7');
    expect(route).toContain('origem=cliente360');
  });

  test('buildCliente360Query inclui parâmetros extras', () => {
    const q = buildCliente360Query(5, { clienteNome: 'Cliente Teste' });
    expect(q).toContain('clienteId=5');
    expect(q).toContain('clienteNome=Cliente+Teste');
  });

  test('getCliente360ReturnPath', () => {
    expect(getCliente360ReturnPath(99)).toBe('/clientes/99');
  });

  test('resolveBackPath retorna 360, central ou fallback', () => {
    expect(resolveBackPath({ origem: 'cliente360', clienteId: 3 }, '/consignacoes')).toBe('/clientes/3');
    expect(resolveBackPath({ origem: 'central', clienteId: 3 }, '/consignacoes')).toBe('/');
    expect(resolveBackPath({ origem: 'central' }, '/consignacoes')).toBe('/');
    expect(resolveBackPath({}, '/consignacoes')).toBe('/consignacoes');
  });

  test('detecta origem central de trabalho', () => {
    expect(isFromCentralTrabalho({ origem: 'central' })).toBe(true);
    expect(parseCliente360Context({ origem: ORIGEM_CENTRAL_TRABALHO, clienteId: '15' }).origem).toBe('central');
  });

  test('buildRouteWithCentralTrabalhoContext monta query oficial', () => {
    const route = buildRouteWithCentralTrabalhoContext('/consignacoes/nova', 7);
    expect(route).toContain('/consignacoes/nova?');
    expect(route).toContain('clienteId=7');
    expect(route).toContain('origem=central');
  });

  test('buildCentralTrabalhoQuery sem clienteId', () => {
    const q = buildCentralTrabalhoQuery();
    expect(q).toContain('origem=central');
    expect(q).not.toContain('clienteId');
  });

  test('getCentralTrabalhoReturnPath', () => {
    expect(getCentralTrabalhoReturnPath()).toBe('/');
  });

  test('routeWithActiveContext propaga origem quando locked', () => {
    const route360 = routeWithActiveContext('/pendencias', { locked: true, clienteId: 8 });
    expect(route360).toContain('origem=cliente360');
    expect(route360).toContain('clienteId=8');

    const routeCentral = routeWithActiveContext('/pendencias', { locked: true, clienteId: 8, origem: 'central' });
    expect(routeCentral).toContain('origem=central');
    expect(routeCentral).toContain('clienteId=8');
  });

  test('getBackButtonLabel', () => {
    expect(getBackButtonLabel({ locked: true })).toBe('Voltar à Central do Cliente');
    expect(getBackButtonLabel({ origem: 'central' })).toBe('Voltar à Central de Trabalho');
    expect(getBackButtonLabel({ locked: false })).toBe('Cancelar');
  });
});
