/**
 * STAB-01.3 — Autorização gerencial no backend (liberação de limite)
 */

const {
  liberacaoGerencialValida,
  TIPO,
  EVENTO_LIMITE
} = require('../../services/autorizacaoGerencialService');

describe('autorizacaoGerencialService', () => {
  test('constantes oficiais', () => {
    expect(TIPO).toBe('AUTORIZACAO_GERENCIAL');
    expect(EVENTO_LIMITE).toMatch(/limite comercial/i);
  });

  test('liberacaoGerencialValida rejeita payload vazio', () => {
    expect(liberacaoGerencialValida(null)).toBe(false);
    expect(liberacaoGerencialValida({})).toBe(false);
    expect(liberacaoGerencialValida({ autorizado: true })).toBe(false);
  });

  test('liberacaoGerencialValida aceita autorização vigente', () => {
    expect(liberacaoGerencialValida({
      autorizado: true,
      auditoriaId: 12,
      expiresAt: new Date(Date.now() + 60_000).toISOString()
    })).toBe(true);
  });

  test('liberacaoGerencialValida rejeita expirada', () => {
    expect(liberacaoGerencialValida({
      autorizado: true,
      supervisorToken: 'token',
      expiresAt: new Date(Date.now() - 1000).toISOString()
    })).toBe(false);
  });
});
