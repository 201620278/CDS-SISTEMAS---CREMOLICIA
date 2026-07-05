/**
 * ItemIdentificavelDTO — Contrato de entrada para identificação de produto.
 *
 * @class ItemIdentificavelDTO
 */

class ItemIdentificavelDTO {
  /**
   * @param {Object} [dados]
   */
  constructor(dados = {}) {
    this.produtoNome = dados.produtoNome ?? dados.produto_nome ?? '';
    this.codigoBarras = dados.codigoBarras ?? dados.codigo_barras ?? null;
    this.codigoFornecedor = dados.codigoFornecedor ?? dados.codigo_fornecedor ?? null;
    this.ncm = dados.ncm ?? null;
    this.unidade = dados.unidade ?? null;
    this.fornecedorCnpj = dados.fornecedorCnpj ?? dados.fornecedor_cnpj ?? null;
    this.fornecedorNome = dados.fornecedorNome ?? dados.fornecedor_nome ?? null;
    this.precoUnitario = dados.precoUnitario ?? dados.preco_unitario ?? null;
    this.produtoIdHint = dados.produtoIdHint ?? dados.produto_id_hint ?? null;
  }

  /**
   * @param {Object|null|undefined} plain
   * @returns {ItemIdentificavelDTO}
   */
  static create(plain) {
    return new ItemIdentificavelDTO(plain || {});
  }

  /**
   * @returns {Object}
   */
  toJSON() {
    return {
      produtoNome: this.produtoNome,
      codigoBarras: this.codigoBarras,
      codigoFornecedor: this.codigoFornecedor,
      ncm: this.ncm,
      unidade: this.unidade,
      fornecedorCnpj: this.fornecedorCnpj,
      fornecedorNome: this.fornecedorNome,
      precoUnitario: this.precoUnitario,
      produtoIdHint: this.produtoIdHint
    };
  }
}

module.exports = ItemIdentificavelDTO;
