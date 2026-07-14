/**
 * Prestação de Contas — Localizador (UX-12)
 *
 * Primeira Estação de Trabalho da Plataforma CDS (fase Localizar).
 * Shared UI only: Workspace + SmartSearch + EntityCard.
 *
 * @module frontend/modules/motor-comercial/pages/PrestacaoLocator
 */

const Workspace = require('../../../../shared/ui/Workspace');
const SmartSearch = require('../../../../shared/ui/SmartSearch');
const EntityCard = require('../../../../shared/ui/EntityCard');
const Button = require('../../components/base/Button');
const MotorComercialApi = require('../../api/MotorComercialApi');
const ProjectionApi = require('../../api/ProjectionApi');
const { buscarClientesErp, navigate, notify } = require('../../utils/operacional');
const {
  parseNavigationContext,
  buildRouteWithCentralTrabalhoContext,
  resolveBackPath,
  getBackButtonLabel,
  ORIGEM_CENTRAL_TRABALHO
} = require('../../utils/cliente360Context');
const {
  escolherConsignacaoElegivel,
  buildLocatorResult,
  matchesQuery
} = require('./locatorMappers');

class PrestacaoLocatorPage {
  constructor(routeQuery = {}) {
    this.routeQuery = routeQuery;
    this.navigationContext = parseNavigationContext(routeQuery);
    if (!this.navigationContext.origem) {
      this.navigationContext.origem = ORIGEM_CENTRAL_TRABALHO;
    }
    this.api = new MotorComercialApi();
    this.projectionApi = new ProjectionApi();
    this.root = null;
    this.searchEl = null;
    this.resultsHost = null;
  }

  static create(_params = {}, query = {}) {
    return new PrestacaoLocatorPage(query).render();
  }

  render() {
    this.root = Workspace.create({
      variant: 'station',
      className: 'cds-prestacao-locator-workspace',
      header: this._buildHeader(),
      body: this._buildBody(),
      footer: this._buildFooter()
    });
    this.root.id = 'prestacao-locator-root';
    this.root.dataset.uxSprint = 'UX-20';
    this.root.dataset.sharedUiReference = 'prestacao-locator';
    this.root.dataset.estacaoTrabalho = 'prestacao';

    return this.root;
  }

  _buildHeader() {
    return Workspace.Header.create({
      title: 'Prestação de Contas',
      subtitle: 'Localize um consignado para iniciar um atendimento.',
      onBack: () => this._voltar()
    });
  }

  _buildBody() {
    const wrap = document.createElement('div');
    wrap.className = 'cds-prestacao-locator__body';

    this.resultsHost = document.createElement('div');
    this.resultsHost.className = 'cds-prestacao-locator__results';
    this.resultsHost.id = 'prestacao-locator-results';
    this.resultsHost.setAttribute('aria-live', 'polite');

    this.searchEl = SmartSearch.create({
      placeholder: 'Nome, CPF, CNPJ, telefone, documento ou código…',
      debounce: 280,
      minChars: 2,
      useEntityCard: false,
      keys: ['telefone', 'documento', 'codigo', 'cpf', 'cnpj'],
      provider: (query, ctx) => this._provider(query, ctx),
      renderResult: (item) => this._renderResultCard(item),
      onSelect: (item) => this._abrirEstacao(item)
    });

    wrap.appendChild(this.searchEl);
    wrap.appendChild(this.resultsHost);

    return Workspace.Body.create({ children: wrap, scroll: true });
  }

  _buildFooter() {
    const voltar = Button.create({
      text: getBackButtonLabel(this.navigationContext, 'Voltar'),
      variant: 'ghost',
      onClick: () => this._voltar()
    });

    const novoCliente = Button.create({
      text: 'Novo Cliente',
      variant: 'secondary',
      onClick: () => navigate('/clientes/novo?origem=central')
    });

    return Workspace.Footer.create({
      left: [voltar],
      right: [novoCliente]
    });
  }

  _voltar() {
    navigate(resolveBackPath(this.navigationContext, '/'));
  }

  async _provider(query, ctx = {}) {
    const clientes = await buscarClientesErp(query);
    const items = [];

    for (const cliente of clientes.slice(0, 12)) {
      if (ctx.signal && ctx.signal.aborted) break;

      let consignacoes = [];
      try {
        const res = await this.api.listarConsignacoes({
          clienteId: cliente.id,
          pageSize: 30
        });
        consignacoes = res.items || res || [];
        if (!Array.isArray(consignacoes)) consignacoes = [];
      } catch (_e) {
        consignacoes = [];
      }

      const consignacao = escolherConsignacaoElegivel(consignacoes);
      if (!consignacao) continue;
      if (!matchesQuery(cliente, consignacao, query)) continue;

      let situacao = {};
      try {
        situacao = await this.projectionApi.obterSituacaoCliente({ clienteId: cliente.id }) || {};
      } catch (_e) {
        situacao = {};
      }

      const item = buildLocatorResult({ cliente, consignacao, situacao });
      if (item) items.push(item);
    }

    return { items };
  }

  _renderResultCard(item) {
    const card = EntityCard.create({
      title: item.title,
      subtitle: item.subtitle,
      description: item.description,
      status: item.status,
      badges: item.badges,
      metadata: item.metadata,
      actions: {
        primary: { label: 'Prestar Contas' }
      },
      onPrimaryAction: () => this._abrirEstacao(item),
      onSelect: () => this._abrirEstacao(item)
    });
    card.setAttribute('role', 'option');
    card.tabIndex = -1;
    return card;
  }

  _abrirEstacao(item) {
    const data = item?.data || item;
    const consignacaoId = data.consignacaoId || item.id;
    if (!consignacaoId) {
      notify('Consignação não encontrada para este consignado.', 'warning');
      return;
    }
    const clienteId = data.clienteId;
    const path = buildRouteWithCentralTrabalhoContext(
      `/consignacoes/${consignacaoId}/prestacao`,
      clienteId,
      { clienteNome: data.clienteNome || item.title }
    );
    navigate(path);
  }
}

module.exports = PrestacaoLocatorPage;
