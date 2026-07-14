/**
 * UsuarioPlatformGateway — Integração real com auth/usuários CDS.
 *
 * Sprint O-13
 *
 * @module motores/motor-comercial/bridges/platform/UsuarioPlatformGateway
 */

const { promisify } = require('util');
const { dbGet } = require('./dbHelpers');
const { assegurarBancoNoGateway } = require('./platformGatewayGuards');
const { buscarPermissoesUsuario } = require('../../../../middleware/auth');

const buscarPermissoesAsync = promisify(buscarPermissoesUsuario);

class UsuarioPlatformGateway {
  /**
   * @param {Object} deps
   * @param {Object} deps.db
   */
  constructor(deps = {}) {
    this._db = deps.db;
  }

  /**
   * @param {string|number} usuarioId
   * @returns {Promise<Object|null>}
   */
  async buscarPorId(usuarioId) {
    assegurarBancoNoGateway(this, 'buscarPorId');
    if (usuarioId == null) return null;

    const row = await dbGet(this._db, `
      SELECT id, username, nome, role, COALESCE(perfil, 'USUARIO') AS perfil,
             COALESCE(ativo, 1) AS ativo
      FROM usuarios WHERE id = ?
    `, [usuarioId]);

    if (!row) return null;

    return {
      id: row.id,
      username: row.username,
      nome: row.nome || row.username,
      role: row.role,
      perfil: row.perfil,
      ativo: Number(row.ativo) === 1,
      origem: 'platform:usuarios'
    };
  }

  /**
   * @param {string|number} usuarioId
   * @param {string} permissao
   * @returns {Promise<boolean>}
   */
  async possuiPermissao(usuarioId, permissao) {
    const usuario = await this.buscarPorId(usuarioId);
    if (!usuario || !usuario.ativo) return false;

    if (usuario.role === 'admin' || usuario.perfil === 'ADMIN' || usuario.perfil === 'SUPER_ADMIN') {
      return true;
    }

    const permissoes = await buscarPermissoesAsync(usuarioId);
    return permissoes.includes(permissao);
  }

  /**
   * @param {string|number} usuarioId
   * @returns {Promise<boolean>}
   */
  async isSupervisor(usuarioId) {
    const usuario = await this.buscarPorId(usuarioId);
    if (!usuario) return false;
    const perfil = String(usuario.perfil || '').toUpperCase();
    return perfil === 'SUPERVISOR' || perfil === 'ADMIN' || perfil === 'SUPER_ADMIN' || usuario.role === 'admin';
  }
}

module.exports = UsuarioPlatformGateway;
