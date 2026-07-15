/**
 * MotorComercialApi — API Client alinhado às rotas oficiais do backend.
 *
 * Sprint O-2: Fluxo Operacional da Consignação.
 *
 * @module frontend/modules/motor-comercial/api/MotorComercialApi
 */

const ApiClient = require('./client');
const { extractErrorMessage } = require('./helpers');
const { unwrapData, unwrapList, unwrapUseCaseData, getUsuarioId } = require('./helpers');

class MotorComercialApi {
  constructor(options = {}) {
    this.client = new ApiClient(options);
  }

  _withUsuario(data = {}) {
    return {
      ...data,
      usuarioId: data.usuarioId ?? getUsuarioId()
    };
  }

  _normalizePrestacaoWritePayload(data = {}, { requirePreco = false } = {}) {
    const payload = { ...data };
    if (payload.produtoId != null) payload.produtoId = Number(payload.produtoId);
    if (payload.itemId != null) payload.itemId = Number(payload.itemId);
    if (payload.quantidade != null) payload.quantidade = Number(payload.quantidade);
    if (requirePreco || payload.precoVenda != null) {
      payload.precoVenda = Number(payload.precoVenda ?? 0);
    }
    return payload;
  }

  // ============================================================================
  // PERFIS COMERCIAIS  (/perfil-comercial)
  // ============================================================================

  async listarPerfis(filters = {}) {
    const params = { ...filters };
    if (params.clienteId != null) params.clienteId = Number(params.clienteId);
    const response = await this.client.get('/perfil-comercial', { params });
    return unwrapList(response);
  }

  async obterPerfil(id) {
    const response = await this.client.get(`/perfil-comercial/${id}`);
    return unwrapData(response);
  }

  async criarPerfil(data) {
    const response = await this.client.post('/perfil-comercial', this._withUsuario(data));
    return unwrapUseCaseData(response);
  }

  async atualizarPerfil(id, data) {
    const response = await this.client.put(`/perfil-comercial/${id}`, this._withUsuario(data));
    return unwrapUseCaseData(response);
  }

  async alterarLimite(id, data = {}) {
    const response = await this.client.patch(`/perfil-comercial/${id}/limite`, this._withUsuario({
      novoLimite: data.novoLimite ?? data.limiteComercial,
      motivo: data.motivo
    }));
    return unwrapUseCaseData(response);
  }

  async bloquearPerfil(id, data = {}) {
    const response = await this.client.patch(`/perfil-comercial/${id}/bloquear`, this._withUsuario(data));
    return unwrapData(response);
  }

  async desbloquearPerfil(id, data = {}) {
    const response = await this.client.patch(`/perfil-comercial/${id}/desbloquear`, this._withUsuario(data));
    return unwrapData(response);
  }

  async obterHistoricoPerfil(id, params = {}) {
    const response = await this.client.get(`/perfil-comercial/${id}/historico`, { params });
    return unwrapData(response);
  }

  async obterScorePerfil(id) {
    const response = await this.client.get(`/perfil-comercial/${id}/score`);
    return unwrapData(response);
  }

  async obterLimitePerfil(id) {
    const response = await this.client.get(`/perfil-comercial/${id}/limite`);
    return unwrapData(response);
  }

  // ============================================================================
  // CONSIGNAÇÕES  (/consignacoes)
  // ============================================================================

  async listarConsignacoes(filters = {}) {
    const response = await this.client.get('/consignacoes', { params: filters });
    return unwrapList(response);
  }

  async obterConsignacao(id) {
    const response = await this.client.get(`/consignacoes/${id}`);
    return unwrapData(response);
  }

  /**
   * Lista itens oficiais da consignação (GET /consignacoes/:id/itens).
   * Fonte de verdade para recovery quando o cabeçalho não trouxer itens.
   */
  async listarItensConsignacao(id, params = {}) {
    const response = await this.client.get(`/consignacoes/${id}/itens`, { params });
    const data = unwrapData(response);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.itens)) return data.itens;
    return [];
  }

  async obterProximoDocumentoConsignacao() {
    const response = await this.client.get('/consignacoes/proximo-documento');
    const data = unwrapData(response);
    return data?.documento || data;
  }

  async criarConsignacao(data) {
    const payload = {
      ...data,
      clienteId: data.clienteId != null ? Number(data.clienteId) : data.clienteId,
      perfilComercialId: data.perfilComercialId != null ? Number(data.perfilComercialId) : data.perfilComercialId
    };
    const response = await this.client.post('/consignacoes', this._withUsuario(payload));
    return unwrapUseCaseData(response);
  }

  async atualizarConsignacao(id, data) {
    const response = await this.client.put(`/consignacoes/${id}`, this._withUsuario(data));
    return unwrapData(response);
  }

  async cancelarConsignacao(id, data = {}) {
    const response = await this.client.delete(`/consignacoes/${id}`, this._withUsuario(data));
    return unwrapData(response);
  }

  async adicionarItem(id, data) {
    const response = await this.client.post(`/consignacoes/${id}/itens`, this._withUsuario(data));
    return unwrapData(response);
  }

  async alterarItem(id, itemId, data) {
    const response = await this.client.put(`/consignacoes/${id}/itens/${itemId}`, this._withUsuario(data));
    return unwrapData(response);
  }

  /**
   * Persiste observação do item (STAB-06.6.1) — não altera quantidades/ledger.
   */
  async atualizarObservacaoItem(id, itemId, data = {}) {
    const response = await this.client.patch(
      `/consignacoes/${id}/itens/${itemId}/observacao`,
      this._withUsuario({ observacao: data.observacao ?? '' })
    );
    return unwrapData(response);
  }

  async removerItem(id, itemId, data = {}) {
    const response = await this.client.delete(`/consignacoes/${id}/itens/${itemId}`, this._withUsuario(data));
    return unwrapData(response);
  }

  async entregarConsignacao(id, data = {}) {
    const response = await this.client.post(`/consignacoes/${id}/entrega`, this._withUsuario(data));
    return unwrapData(response);
  }

  async registrarAutorizacaoGerencial(data = {}) {
    const response = await this.client.post('/autorizacoes/gerenciais', this._withUsuario(data));
    return unwrapData(response);
  }

  async registrarEmissaoTermoEntrega(id, data = {}) {
    const response = await this.client.post(`/consignacoes/${id}/termo-entrega`, this._withUsuario(data));
    return unwrapData(response);
  }

  async registrarDevolucao(id, data = {}) {
    const payload = this._normalizePrestacaoWritePayload({
      ...data,
      itemId: data.itemId,
      produtoId: data.produtoId,
      quantidade: data.quantidade,
      observacao: data.observacao || null
    });
    const response = await this.client.post(`/consignacoes/${id}/devolucao`, this._withUsuario(payload));
    return unwrapData(response);
  }

  async transferirItens(id, data) {
    const response = await this.client.post(`/consignacoes/${id}/transferencia`, this._withUsuario(data));
    return unwrapData(response);
  }

  // ============================================================================
  // PRESTAÇÃO  (/consignacoes/:id/prestacao/*)
  // ============================================================================

  async abrirPrestacao(id, data = {}) {
    const response = await this.client.post(`/consignacoes/${id}/prestacao/abrir`, this._withUsuario(data));
    return unwrapData(response);
  }

  async fecharPrestacao(id, data = {}) {
    const response = await this.client.post(`/consignacoes/${id}/prestacao/fechar`, this._withUsuario(data));
    return unwrapData(response);
  }

  /**
   * STAB-06 — Resumo final (Integridade Comercial), sem persistir.
   */
  async obterResumoFinalPrestacao(id, params = {}) {
    const qs = params.emitirFiscal === false ? '?emitirFiscal=false' : '';
    const response = await this.client.get(`/consignacoes/${id}/prestacao/resumo-final${qs}`);
    return unwrapData(response);
  }

  /**
   * STAB-06 — cria venda oficial e/ou encerra (STAB-06.3: preferir emitir-nfce separado).
   */
  async finalizarVendaOficial(id, data = {}) {
    const response = await this.client.post(
      `/consignacoes/${id}/prestacao/finalizar-venda-oficial`,
      this._withUsuario(data)
    );
    return unwrapData(response);
  }

  /**
   * STAB-06.3 — emitir NFC-e (reutiliza venda oficial; não encerra).
   */
  async emitirNfcePrestacao(id, data = {}) {
    const response = await this.client.post(
      `/consignacoes/${id}/prestacao/emitir-nfce`,
      this._withUsuario(data)
    );
    return unwrapData(response);
  }

  async reabrirPrestacao(id, data = {}) {
    const response = await this.client.post(`/consignacoes/${id}/prestacao/reabrir`, this._withUsuario(data));
    return unwrapData(response);
  }

  async registrarVenda(id, data) {
    const payload = this._normalizePrestacaoWritePayload(data, { requirePreco: true });
    const response = await this.client.post(`/consignacoes/${id}/prestacao/venda`, this._withUsuario(payload));
    return unwrapData(response);
  }

  async registrarPerda(id, data) {
    const payload = this._normalizePrestacaoWritePayload(data);
    const response = await this.client.post(`/consignacoes/${id}/prestacao/perda`, this._withUsuario(payload));
    return unwrapData(response);
  }

  async registrarCortesia(id, data) {
    const payload = this._normalizePrestacaoWritePayload(data);
    const response = await this.client.post(`/consignacoes/${id}/prestacao/cortesia`, this._withUsuario(payload));
    return unwrapData(response);
  }

  async registrarPagamento(id, data = {}) {
    const payload = {
      ...data,
      valor: Number(String(data.valor ?? '').replace(',', '.')),
      formaPagamento: data.formaPagamento || 'DINHEIRO',
      observacao: data.observacao || null
    };
    const response = await this.client.post(`/consignacoes/${id}/prestacao/pagamento`, this._withUsuario(payload));
    return unwrapData(response);
  }

  /**
   * Alias de compatibilidade — lista prestações via consignações filtradas.
   * @param {Object} filters
   * @returns {Promise<Array>}
   */
  async listarPrestacoes(filters = {}) {
    const { items } = await this.listarConsignacoes({
      ...filters,
      status: filters.status || 'ENTREGUE'
    });
    return items;
  }
}

module.exports = MotorComercialApi;
