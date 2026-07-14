/**
 * ExecutiveDrawer — detalhe de KPI do Dashboard Executivo.
 *
 * Sprint O-4.
 *
 * @module frontend/modules/motor-comercial/pages/Dashboard/ExecutiveDrawer
 */

const Button = require('../../components/base/Button');
const Loading = require('../../components/base/Loading');
const EmptyState = require('../../components/base/EmptyState');
const Timeline = require('../../components/special/Timeline');
const { navigate } = require('../../utils/operacional');

class ExecutiveDrawer {
  constructor(page, card, context = {}) {
    this.page = page;
    this.card = card;
    this.context = context;
    this.cache = null;
  }

  async mount(container) {
    container.className = 'cds-executive-drawer';
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
    const [timeline, indicadores] = await Promise.all([
      this.page.api.listarTimeline({ ...params, limite: 8 }).catch(() => []),
      this.page.api.obterProjecaoIndicadores(params).catch(() => ({}))
    ]);

    this.cache = { timeline, indicadores };

    const wrap = document.createElement('div');
    wrap.className = 'cds-executive-drawer__content';

    wrap.appendChild(this._section('Origem dos Dados', `
      <p>Fonte: <strong>Painel / Indicadores</strong></p>
      <p>Chave: <strong>${this.card.key || '-'}</strong></p>
      <p>Valor: <strong>${this.page._formatCardValue(this.card)}</strong></p>
    `));

    wrap.appendChild(this._section('Indicadores Relacionados', this._renderIndicators(indicadores)));
    wrap.appendChild(this._section('Linha do Tempo Relacionada', ''));
    const timelineHost = document.createElement('div');
    timelineHost.appendChild(Timeline.create({
      events: timeline,
      emptyTitle: 'Sem eventos',
      emptyDescription: 'Nenhum evento no período'
    }));
    wrap.lastChild.appendChild(timelineHost);

    const actions = document.createElement('div');
    actions.className = 'cds-executive-drawer__actions';
    actions.appendChild(Button.create({ text: 'Consignações', variant: 'primary', onClick: () => navigate('/consignacoes') }));
    actions.appendChild(Button.create({ text: 'Indicadores', variant: 'secondary', onClick: () => navigate('/indicadores') }));
    wrap.appendChild(actions);

    return wrap;
  }

  _section(title, html) {
    const section = document.createElement('section');
    section.className = 'cds-executive-drawer__section';
    section.innerHTML = `<h4>${title}</h4>`;
    const body = document.createElement('div');
    if (typeof html === 'string') body.innerHTML = html;
    else body.appendChild(html);
    section.appendChild(body);
    return section;
  }

  _renderIndicators(indicadores) {
    const grid = document.createElement('div');
    grid.className = 'cds-executive-drawer__grid';
    const fields = [
      ['Conversão', `${indicadores.percentualConversao ?? 0}%`],
      ['Perdas', this.page._formatCurrency(indicadores.valorPerdido)],
      ['Ticket Médio', this.page._formatCurrency(indicadores.ticketMedio)],
      ['Consignações', String(indicadores.quantidadeConsignacoes ?? 0)]
    ];
    fields.forEach(([label, value]) => {
      const el = document.createElement('div');
      el.innerHTML = `<label>${label}</label><div>${value}</div>`;
      grid.appendChild(el);
    });
    return grid;
  }
}

module.exports = ExecutiveDrawer;
