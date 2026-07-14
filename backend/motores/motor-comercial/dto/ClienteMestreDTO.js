/**
 * ClienteMestreDTO — Dados cadastrais oficiais do Cliente (entidade raiz).
 *
 * Sprint S-4: origem única = tabela ERP `clientes`.
 * Perfis e projeções referenciam este contrato para dados cadastrais.
 *
 * @module motores/motor-comercial/dto/ClienteMestreDTO
 */

class ClienteMestreDTO {
  /**
   * @param {Object} [dados]
   */
  constructor(dados = {}) {
    this.id = dados.id ?? null;
    this.nome = dados.nome ?? null;
    this.documento = dados.documento ?? dados.cpfCnpj ?? null;
    this.telefone = dados.telefone ?? null;
    this.email = dados.email ?? null;
    this.endereco = dados.endereco ?? null;
    this.limiteCreditoErp = Number(dados.limiteCreditoErp ?? dados.limite_credito ?? 0);
    this.creditoAtualErp = Number(dados.creditoAtualErp ?? dados.credito_atual ?? 0);
    this.createdAt = dados.createdAt ?? dados.created_at ?? null;
  }

  /**
   * @param {Object|null|undefined} plain
   * @returns {ClienteMestreDTO|null}
   */
  static create(plain) {
    if (!plain) return null;
    return new ClienteMestreDTO(plain);
  }

  /**
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      nome: this.nome,
      documento: this.documento,
      telefone: this.telefone,
      email: this.email,
      endereco: this.endereco,
      limiteCreditoErp: this.limiteCreditoErp,
      creditoAtualErp: this.creditoAtualErp,
      createdAt: this.createdAt
    };
  }
}

module.exports = ClienteMestreDTO;
