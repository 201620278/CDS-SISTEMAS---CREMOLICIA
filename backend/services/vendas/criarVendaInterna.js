/**
 * criarVendaInterna — ponte STAB-06 para o mesmo fluxo de criarVenda (PDV).
 * Sem HTTP / sem validarCaixaAberto.
 *
 * @module backend/services/vendas/criarVendaInterna
 */

const { criarVenda } = require('./VendaPagamentoService');

/**
 * @param {Object} body — mesmo shape do POST /api/vendas
 * @returns {Promise<Object>}
 */
function criarVendaInterna(body) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const mark = (label) => {
      console.log(`[STAB06-AUDIT] [${Date.now() - t0}ms] criarVendaInterna: ${label}`);
    };
    mark('entrou');
    let settled = false;
    const req = { body: body || {} };
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        if (settled) return this;
        settled = true;
        mark(`res.json status=${this.statusCode || 200} (promise libera aqui)`);
        const code = this.statusCode || 200;
        if (code >= 400) {
          const err = new Error((data && (data.error || data.message)) || `Erro HTTP ${code}`);
          err.status = code;
          err.data = data;
          reject(err);
        } else {
          resolve(data);
        }
        return this;
      }
    };

    try {
      mark('chamou criarVenda(req,res) — aguardando caminho até res.json');
      criarVenda(req, res);
    } catch (error) {
      if (!settled) {
        settled = true;
        mark(`exceção síncrona: ${error.message}`);
        reject(error);
      }
    }
  });
}

module.exports = { criarVendaInterna };
