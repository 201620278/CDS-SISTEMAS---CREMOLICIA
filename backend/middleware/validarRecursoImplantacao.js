const configService = require('../services/configuracaoService');

function exigirRecurso(nomeRecurso) {
  return (req, res, next) => {
    if (configService.recursoHabilitado(nomeRecurso)) {
      return next();
    }

    return res.status(403).json({
      error: 'Recurso não habilitado para o tipo de implantação configurado.',
      recurso: nomeRecurso
    });
  };
}

module.exports = {
  exigirRecurso
};
