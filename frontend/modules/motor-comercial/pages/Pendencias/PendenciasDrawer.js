/**
 * Drawer de detalhes — Central de Pendências.
 *
 * Sprint O-8.
 *
 * @module frontend/modules/motor-comercial/pages/Pendencias/PendenciasDrawer
 */

const Button = require('../../components/base/Button');
const Badge = require('../../components/base/Badge');
const StatCard = require('../../components/data/StatCard');
const Timeline = require('../../components/special/Timeline');
const Loading = require('../../components/base/Loading');
const EmptyState = require('../../components/base/EmptyState');
const { severityVariant } = require('./pendenciasMappers');
const { navigate } = require('../../utils/operacional');

class PendenciasDrawer {
  constructor(page, alerta) {
    this.page = page;
    this.alerta = alerta;
    this.timeline = [];
    this.kpis = null;
    this.loading = true;
  }

  async mount(container) {
    container.innerHTML = '';
    container.appendChild(Loading.create({ message: 'Carregando detalhes...' }));

    try {
      const params = {};
      if (this.alerta.clienteId) params.clienteId = this.alerta.clienteId;
      if (this.alerta.consignacaoId) params.consignacaoId = this.alerta.consignacaoId;

      const requests = [
        this.page.projectionApi.listarTimeline({ ...params, limite: 15 })
      ];
      if (this.alerta.clienteId) {
        requests.push(this.page.projectionApi.obterProjecaoIndicadores(params));
      }
      if (this.alerta.consignacaoId) {
        requests.push(this.page.projectionApi.obterResumoPrestacao({ consignacaoId: this.alerta.consignacaoId }));
      }

      const results = await Promise.all(requests);
      this.timeline = results[0]?.eventos || results[0] || [];
      this.kpis = results[1] || results[2] || null;
      this.loading = false;
      this._render(container);
    } catch (error) {
      container.innerHTML = '';
      container.appendChild(EmptyState.create({
        title: 'Erro ao carregar',
        description: error.message
      }));
    }
  }

  _render(container) {
    container.innerHTML = '';
    container.className = 'cds-pendencias-drawer';

    container.appendChild(this._section('Resumo', this._renderSummary()));
    container.appendChild(this._section('Impacto e Motivo', this._renderMotivo()));
    container.appendChild(this._section('Origem', this._renderOrigem()));
    if (this.kpis) container.appendChild(this._section('KPIs', this._renderKpis()));
    container.appendChild(this._section('Linha do Tempo', this._renderTimeline()));
    container.appendChild(this._section('Links Rápidos', this._renderLinks()));
    container.appendChild(this._section('Ações', this._renderActions()));
  }

  _section(title, content) {
    const wrap = document.createElement('div');
    wrap.className = 'cds-pendencias-drawer__section';
    const h = document.createElement('h3');
    h.textContent = title;
    wrap.appendChild(h);
    wrap.appendChild(content);
    return wrap;
  }

  _renderSummary() {
    const el = document.createElement('div');
    el.className = 'cds-pendencias-drawer__summary';
    el.innerHTML = `
      <p><strong>${this.alerta.descricao}</strong></p>
      <div class="cds-pendencias-drawer__badges">
        ${Badge.create({ text: this.alerta.categoria, variant: 'info' }).outerHTML}
        ${Badge.create({ text: this.alerta.severidade, variant: severityVariant(this.alerta.severidade) }).outerHTML}
        ${Badge.create({ text: this.alerta.prioridade, variant: 'default' }).outerHTML}
      </div>
      ${this.alerta.cliente ? `<p>Cliente: ${this.alerta.cliente}</p>` : ''}
      ${this.alerta.documento ? `<p>Documento: ${this.alerta.documento}</p>` : ''}
      ${this.alerta.data ? `<p>Data: ${new Date(this.alerta.data).toLocaleString('pt-BR')}</p>` : ''}
    `;
    return el;
  }

  _renderMotivo() {
    const el = document.createElement('div');
    el.innerHTML = `
      <p><strong>Motivo:</strong> ${this.alerta.motivo || '-'}</p>
      <p><strong>Impacto:</strong> ${this.alerta.impacto || '-'}</p>
      <p><strong>Ação recomendada:</strong> ${this.alerta.acaoRecomendada || '-'}</p>
    `;
    return el;
  }

  _renderOrigem() {
    const el = document.createElement('div');
    el.innerHTML = `
      <p>Projeção: <code>${this.alerta.origemProjecao || '-'}</code></p>
      <p>Análise de origem: <code>${this.alerta.origemInsight || '—'}</code></p>
    `;
    return el;
  }

  _renderKpis() {
    const grid = document.createElement('div');
    grid.className = 'cds-pendencias-drawer__kpis';
    const k = this.kpis;
    const items = [
      { title: 'Conversão', value: k.percentualConversao, format: 'percent' },
      { title: 'Perdas', value: k.valorPerdido, format: 'currency' },
      { title: 'Vendido', value: k.valorVendido, format: 'currency' },
      { title: 'Saldo', value: k.saldoAtual ?? k.saldo, format: 'currency' }
    ].filter((i) => i.value != null);

    items.forEach((item) => {
      grid.appendChild(StatCard.create(item));
    });

    if (!items.length) {
      return EmptyState.create({ title: 'Sem KPIs', description: 'Indicadores indisponíveis' });
    }
    return grid;
  }

  _renderTimeline() {
    return Timeline.create({
      events: this.timeline,
      emptyTitle: 'Sem eventos',
      emptyDescription: 'Nenhum evento na timeline para este contexto'
    });
  }

  _renderLinks() {
    const actions = document.createElement('div');
    actions.className = 'cds-pendencias-drawer__links';

    const links = [
      { label: 'Painel', path: '/' },
      { label: 'Consignações', path: '/consignacoes' }
    ];
    if (this.alerta.clienteId) links.push({ label: 'Central do Cliente', path: `/clientes/${this.alerta.clienteId}` });
    if (this.alerta.consignacaoId) {
      links.push({ label: 'Consignação', path: `/consignacoes/${this.alerta.consignacaoId}` });
      links.push({ label: 'Fechar Atendimento', path: `/consignacoes/${this.alerta.consignacaoId}/prestacao` });
    }
    links.push({ label: 'Conta Corrente', path: this.alerta.consignacaoId
      ? `/consignacoes/${this.alerta.consignacaoId}/prestacao/conta-corrente`
      : '/conta-corrente' });

    links.forEach((link) => {
      actions.appendChild(Button.create({
        text: link.label,
        variant: 'ghost',
        onClick: () => navigate(link.path)
      }));
    });

    return actions;
  }

  _renderActions() {
    const actions = document.createElement('div');
    actions.className = 'cds-pendencias-drawer__actions';
    actions.appendChild(Button.create({ text: 'Resolver', variant: 'primary', onClick: () => this.page._resolveAlerta(this.alerta) }));
    actions.appendChild(Button.create({ text: 'Ignorar', variant: 'ghost', onClick: () => this.page._ignoreAlerta(this.alerta) }));
    actions.appendChild(Button.create({ text: 'Adiar', variant: 'secondary', onClick: () => this.page._deferAlerta(this.alerta) }));
    actions.appendChild(Button.create({ text: 'Delegar', variant: 'secondary', onClick: () => this.page._delegateAlerta(this.alerta) }));
    actions.appendChild(Button.create({ text: 'Observação', variant: 'ghost', onClick: () => this.page._observeAlerta(this.alerta) }));
    return actions;
  }
}

module.exports = PendenciasDrawer;
