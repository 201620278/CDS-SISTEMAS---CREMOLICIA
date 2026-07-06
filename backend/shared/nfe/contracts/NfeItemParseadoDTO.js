/**
 * NfeItemParseadoDTO — Item de NF-e parseado (contrato estável do ERP).
 *
 * @class NfeItemParseadoDTO
 */

class NfeItemParseadoDTO {
  /**
   * @param {Object} [dados]
   */
  constructor(dados = {}) {
    this.produtoNome = dados.produtoNome ?? dados.produto_nome ?? '';
    this.codigoFornecedor = dados.codigoFornecedor ?? dados.codigo_fornecedor ?? '';
    this.codigoBarras = dados.codigoBarras ?? dados.codigo_barras ?? '';
    this.ncm = dados.ncm ?? '';
    this.unidade = dados.unidade ?? 'UN';
    this.quantidade = Number(dados.quantidade ?? 0);
    this.precoUnitario = Number(dados.precoUnitario ?? dados.preco_unitario ?? 0);
    this.subtotal = Number(dados.subtotal ?? 0);
    this.margemLucro = Number(dados.margemLucro ?? dados.margem_lucro ?? 30);
    this.precoVendaSugerido = Number(
      dados.precoVendaSugerido
      ?? dados.preco_venda_sugerido
      ?? (Number(dados.precoUnitario ?? dados.preco_unitario ?? 0) * 1.3)
    );
    this.produtoId = dados.produtoId ?? dados.produto_id ?? undefined;
    this.miipResultado = dados.miipResultado ?? dados.miip_resultado ?? undefined;
    this.miipSugestao = dados.miipSugestao ?? dados.miip_sugestao ?? undefined;
  }

  /**
   * @param {Object|null|undefined} plain
   * @returns {NfeItemParseadoDTO}
   */
  static create(plain) {
    return new NfeItemParseadoDTO(plain || {});
  }

  /**
   * Formato JSON compatível com POST /api/compras/parse-xml.
   *
   * @returns {Object}
   */
  toJSON() {
    const json = {
      produto_nome: this.produtoNome,
      codigo_fornecedor: this.codigoFornecedor,
      codigo_barras: this.codigoBarras,
      ncm: this.ncm,
      unidade: this.unidade,
      quantidade: this.quantidade,
      preco_unitario: this.precoUnitario,
      subtotal: this.subtotal,
      margem_lucro: this.margemLucro,
      preco_venda_sugerido: this.precoVendaSugerido
    };

    if (this.produtoId != null) json.produto_id = this.produtoId;
    if (this.miipResultado != null) json.miip_resultado = this.miipResultado;
    if (this.miipSugestao != null) json.miip_sugestao = this.miipSugestao;

    return json;
  }
}

module.exports = NfeItemParseadoDTO;
