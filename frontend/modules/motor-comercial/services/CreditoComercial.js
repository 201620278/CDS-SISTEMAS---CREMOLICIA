/**
 * CreditoComercial — normalização de campos oficiais no frontend.
 *
 * STAB-02: zero fórmula local. Apenas mapeia campos vindos da API
 * (CreditoComercialService no backend = SSOT).
 *
 * @module frontend/modules/motor-comercial/services/CreditoComercial
 */

/**
 * @param {Object} [fonte]
 * @returns {{
 *   limiteComercial: number,
 *   saldoDevedor: number,
 *   saldoCredor: number,
 *   creditoDisponivel: number|null
 * }}
 */
function normalizarCreditoComercial(fonte = {}) {
  const limiteComercial = Number(fonte.limiteComercial ?? fonte.limite ?? 0);

  const saldoDevedor = Number(
    fonte.saldoDevedor
    ?? fonte.saldoAberto
    ?? fonte.saldo
    ?? fonte.utilizado
    ?? 0
  );

  const saldoCredor = Number(fonte.saldoCredor ?? 0);

  const creditoRaw = fonte.creditoDisponivel ?? fonte.limiteDisponivel;
  const creditoDisponivel = creditoRaw != null ? Number(creditoRaw) : null;

  return {
    limiteComercial,
    saldoDevedor,
    saldoCredor,
    creditoDisponivel: creditoDisponivel != null ? Math.max(0, creditoDisponivel) : null
  };
}

/**
 * @param {number} creditoDisponivel
 * @param {number} valorEntrega
 * @returns {boolean}
 */
function podeEntregar(creditoDisponivel, valorEntrega) {
  const credito = Number(creditoDisponivel) || 0;
  const valor = Number(valorEntrega) || 0;
  if (valor <= 0) return true;
  return valor <= credito;
}

module.exports = {
  normalizarCreditoComercial,
  podeEntregar
};
