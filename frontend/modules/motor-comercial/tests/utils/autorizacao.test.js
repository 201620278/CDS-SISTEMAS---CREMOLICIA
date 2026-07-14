/**
 * Autorização RBAC — testes
 *
 * Sprint H-2
 */

const {
  possuiPermissao,
  isOperadorAutorizado,
  isAutorizacaoGerencial,
  podeAlterarLimiteComercial
} = require('../../utils/autorizacao');

describe('autorizacao RBAC', () => {
  beforeEach(() => {
    localStorage.setItem('user', JSON.stringify({
      id: 10,
      username: 'operador',
      role: 'user',
      perfil: 'USUARIO',
      permissoes: ['COMERCIAL_CONSIGNACAO']
    }));
  });

  test('admin possui qualquer permissão', () => {
    localStorage.setItem('user', JSON.stringify({ id: 1, role: 'admin', permissoes: [] }));
    expect(possuiPermissao('COMERCIAL_LIMITE')).toBe(true);
    expect(isOperadorAutorizado()).toBe(true);
  });

  test('operador com COMERCIAL_CONSIGNACAO é autorizado', () => {
    expect(isOperadorAutorizado()).toBe(true);
  });

  test('usuário sem permissão comercial não é autorizado', () => {
    localStorage.setItem('user', JSON.stringify({
      id: 11,
      role: 'user',
      perfil: 'USUARIO',
      permissoes: ['clientes']
    }));
    expect(isOperadorAutorizado()).toBe(false);
  });

  test('supervisor tem autorização gerencial', () => {
    localStorage.setItem('user', JSON.stringify({
      id: 12,
      role: 'user',
      perfil: 'SUPERVISOR',
      permissoes: []
    }));
    expect(isAutorizacaoGerencial()).toBe(true);
  });

  test('admin pode alterar limite comercial', () => {
    localStorage.setItem('user', JSON.stringify({ id: 1, role: 'admin', permissoes: [] }));
    expect(podeAlterarLimiteComercial()).toBe(true);
  });

  test('usuário com COMERCIAL_LIMITE pode alterar limite', () => {
    localStorage.setItem('user', JSON.stringify({
      id: 13,
      role: 'user',
      perfil: 'USUARIO',
      permissoes: ['COMERCIAL_LIMITE']
    }));
    expect(podeAlterarLimiteComercial()).toBe(true);
  });

  test('operador sem COMERCIAL_LIMITE não altera limite', () => {
    expect(podeAlterarLimiteComercial()).toBe(false);
  });

  test('supervisor sem COMERCIAL_LIMITE não altera limite', () => {
    localStorage.setItem('user', JSON.stringify({
      id: 14,
      role: 'user',
      perfil: 'SUPERVISOR',
      permissoes: []
    }));
    expect(podeAlterarLimiteComercial()).toBe(false);
  });
});
