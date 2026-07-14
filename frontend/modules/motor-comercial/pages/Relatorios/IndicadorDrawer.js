/**
 * IndicadorDrawer — detalhe analítico da Central de Inteligência.
 *
 * Sprint O-7.
 *
 * @module frontend/modules/motor-comercial/pages/Relatorios/IndicadorDrawer
 */

const Button = require('../../components/base/Button');
const Loading = require('../../components/base/Loading');
const EmptyState = require('../../components/base/EmptyState');
const Timeline = require('../../components/special/Timeline');
const { navigate } = require('../../utils/operacional');
const { getProjectionNames } = require('./relatorioMappers');

class IndicadorDrawer {
  constructor(page, item, context = {}) {
    this.page = page;
    this.item = item;
    this.context = context;
  }

  async mount(container) {
    container.className = 'cds-analytics-drawer';
    container.appendChild(Loading.create({ message: 'Carregando detalhes...' }));

    try {
      const detail = await this._loadDetail();
      container.innerHTML = '';
      container.appendChild(detail);
    } catch (error) {
      container.innerHTML = '';
      container.appendChild(EmptyState.create({
        title: 'Erro ao carregar detalhe',
        description: error.message
      }));
    }
  }

  async _loadDetail() {
    const params = this.page._getFilterParams();
    const report = this.page.activeReport;
    const [timeline, insights] = await Promise.all([
      this.page.projectionApi.listarTimeline({ ...params, limite: 10 }).catch(() => []),
      this.page.projectionApi.obterProjecaoInsights(params).catch(() => ({}))
    ]);

    const wrap = document.createElement('div');
    wrap.className = 'cds-analytics-drawer__content';

    wrap.appendChild(this._section('Origem', `
      <p>Relatório: <strong>${report?.label || '-'}</strong></p>
      <p>Fonte de dados: <strong>${getProjectionNames(report?.projections || [])}</strong></p>
      <p>Visualização: <strong>${report?.viz || '-'}</strong></p>
    `));

    wrap.appendChild(this._section('Indicador', this._renderItem()));

    const relatedInsights = (insights.insights || insights.itens || []).slice(0, 5);
    if (relatedInsights.length) {
      wrap.appendChild(this._section('Análises Relacionadas', this._renderList(relatedInsights)));
    }

    wrap.appendChild(this._section('Linha do Tempo Relacionada', ''));
    const timelineHost = document.createElement('div');
    timelineHost.appendChild(Timeline.create({
      events: timeline,
      emptyTitle: 'Sem eventos',
      emptyDescription: 'Nenhum evento no período'
    }));
    wrap.lastChild.appendChild(timelineHost);

    const actions = document.createElement('div');
    actions.className = 'cds-analytics-drawer__actions';
    actions.appendChild(Button.create({ text: 'Painel', variant: 'primary', onClick: () => navigate('/') }));
    actions.appendChild(Button.create({ text: 'Consignações', variant: 'secondary', onClick: () => navigate('/consignacoes') }));
    actions.appendChild(Button.create({ text: 'Conta Corrente', variant: 'ghost', onClick: () => navigate('/conta-corrente') }));
    wrap.appendChild(actions);

    return wrap;
  }

  _section(title, content) {
    const section = document.createElement('section');
    section.className = 'cds-analytics-drawer__section';
    section.innerHTML = `<h4>${title}</h4>`;
    const body = document.createElement('div');
    if (typeof content === 'string') body.innerHTML = content;
    else body.appendChild(content);
    section.appendChild(body);
    return section;
  }

  _renderItem() {
    const grid = document.createElement('div');
    grid.className = 'cds-analytics-drawer__grid';
    const item = this.item.raw || this.item;
    const fields = Object.entries(item).filter(([k]) => !['raw'].includes(k)).slice(0, 12);
    if (!fields.length) {
      grid.innerHTML = `<p>${this.item.label || this.item.nome || this.item.titulo || JSON.stringify(this.item)}</p>`;
      return grid;
    }
    fields.forEach(([key, value]) => {
      const el = document.createElement('div');
      el.innerHTML = `<label>${key}</label><div>${typeof value === 'object' ? JSON.stringify(value) : value}</div>`;
      grid.appendChild(el);
    });
    return grid;
  }

  _renderList(items) {
    const ul = document.createElement('ul');
    ul.className = 'cds-analytics-drawer__list';
    items.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item.titulo || item.mensagem || item.message || String(item);
      ul.appendChild(li);
    });
    return ul;
  }
}

module.exports = IndicadorDrawer;
