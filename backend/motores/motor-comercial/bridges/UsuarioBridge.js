/**
 * UsuarioBridge — Integração real com plataforma CDS (Sprint O-13).
 *
 * @module motores/motor-comercial/bridges/UsuarioBridge
 */

const Result = require('../infrastructure/result/Result');

class UsuarioBridge {
  constructor(dependencies) {
    this._logger = dependencies.logger;
    this._platform = dependencies.platform ?? null;
  }

  async validarUsuario(usuarioId, context) {
    try {
      if (!this._platform) throw new Error('UsuarioPlatformGateway não configurado');
      const usuario = await this._platform.buscarPorId(usuarioId);
      if (!usuario || !usuario.ativo) throw new Error('Usuário não encontrado ou inativo');
      return Result.ok({ id: usuario.id, ativo: true });
    } catch (error) {
      return Result.fail(error);
    }
  }

  async validarPermissao(usuarioId, permissao, context) {
    try {
      const temPermissao = await this._platform.possuiPermissao(usuarioId, permissao);
      return Result.ok({ usuarioId, permissao, permitido: temPermissao });
    } catch (error) {
      return Result.fail(error);
    }
  }

  async validarAutorizacaoGerencial(usuarioId, operacao, context) {
    try {
      const autorizado = await this._platform.isSupervisor(usuarioId);
      return Result.ok({ usuarioId, operacao, autorizado });
    } catch (error) {
      return Result.fail(error);
    }
  }

  async consultarOperador(usuarioId, context) {
    try {
      const usuario = await this._platform.buscarPorId(usuarioId);
      if (!usuario) throw new Error('Usuário não encontrado');
      return Result.ok(usuario);
    } catch (error) {
      return Result.fail(error);
    }
  }
}

module.exports = UsuarioBridge;
