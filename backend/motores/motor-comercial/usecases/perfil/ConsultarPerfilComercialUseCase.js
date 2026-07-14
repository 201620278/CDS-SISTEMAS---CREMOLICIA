/**
 * UC-008 — ConsultarPerfilComercialUseCase
 *
 * @class ConsultarPerfilComercialUseCase
 */

const PerfilReadUseCase = require('./PerfilReadUseCase');
const { PerfilInvalidoError } = require('../../domain/errors');

class ConsultarPerfilComercialUseCase extends PerfilReadUseCase {
  async validar(entrada) {
    if (!entrada?.perfilComercialId && !(entrada?.clienteId && entrada?.perfilTipo)) {
      throw new PerfilInvalidoError('Informe perfilComercialId ou clienteId + perfilTipo');
    }
  }

  async processar(entrada) {
    if (entrada.perfilComercialId) {
      return this._obterPerfilOuFalhar(entrada.perfilComercialId);
    }

    const perfis = await this._perfilRepository.listar({
      clienteId: entrada.clienteId,
      perfilTipo: entrada.perfilTipo,
      limite: 1
    });

    if (!perfis.length) {
      const { PerfilNaoEncontradoError } = require('../../domain/errors');
      throw new PerfilNaoEncontradoError();
    }

    return perfis[0];
  }
}

module.exports = ConsultarPerfilComercialUseCase;
