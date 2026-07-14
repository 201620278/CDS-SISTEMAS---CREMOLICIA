/**
 * STAB-01.3 — Autorização gerencial (liberação de limite)
 */

const {
  buildFingerprintLimite,
  liberacaoCompativel
} = require('../../utils/autorizacaoGerencial');
const {
  buildValidacoesConferencia,
  buildPainelResumo,
  calcularUtilizacaoLimite
} = require('../../pages/NovaConsignacao/prepararEntregaMappers');

describe('STAB-01.3 Autorização Gerencial — limite comercial', () => {
  test('excedeLimite quando valor > crédito disponível', () => {
    const util = calcularUtilizacaoLimite(1500, 1000);
    expect(util.excedeLimite).toBe(true);
    expect(util.valorExcedido).toBe(500);
    expect(util.creditoDisponivel).toBe(0);
  });

  test('buildPainelResumo marca excedeLimite', () => {
    const painel = buildPainelResumo(
      [{ quantidade: 2, preco: 600 }],
      { limiteComercial: 1000, limiteDisponivel: 1000 }
    );
    expect(painel.valorTotal).toBe(1200);
    expect(painel.excedeLimite).toBe(true);
    expect(painel.valorExcedido).toBe(200);
  });

  test('validação de conferência bloqueia sem liberação', () => {
    const avisos = buildValidacoesConferencia(
      { itens: [{ quantidade: 1, preco: 2000 }] },
      { limiteDisponivel: 1000 },
      { liberacaoLimiteAutorizada: false }
    );
    const danger = avisos.filter((a) => a.nivel === 'danger');
    expect(danger.length).toBeGreaterThan(0);
    expect(danger[0].message).toMatch(/liberação gerencial/i);
  });

  test('validação de conferência permite com liberação (warning, não danger)', () => {
    const avisos = buildValidacoesConferencia(
      { itens: [{ quantidade: 1, preco: 2000 }] },
      { limiteDisponivel: 1000 },
      { liberacaoLimiteAutorizada: true }
    );
    expect(avisos.some((a) => a.nivel === 'danger')).toBe(false);
    expect(avisos.some((a) => a.nivel === 'warning' && /liberação gerencial/i.test(a.message))).toBe(true);
  });

  test('fingerprint muda quando valor muda', () => {
    const a = buildFingerprintLimite({ clienteId: 1, valorEntrega: 100, creditoDisponivel: 50 });
    const b = buildFingerprintLimite({ clienteId: 1, valorEntrega: 200, creditoDisponivel: 50 });
    expect(a).not.toBe(b);
  });

  test('liberacaoCompativel exige fingerprint compatível', () => {
    const fp = buildFingerprintLimite({ clienteId: 7, valorEntrega: 100, creditoDisponivel: 50 });
    const liberacao = { autorizado: true, fingerprint: fp, expiresAt: new Date(Date.now() + 60000).toISOString() };
    expect(liberacaoCompativel(liberacao, fp)).toBe(true);
    expect(liberacaoCompativel(liberacao, 'outro')).toBe(false);
    expect(liberacaoCompativel(null, fp)).toBe(false);
  });
});
