/**
 * Drawer de Recomendações — Sprint O-9.
 *
 * @module frontend/modules/motor-comercial/pages/Recomendacoes/RecomendacoesDrawer
 */

const Button = require('../../components/base/Button');
const Badge = require('../../components/base/Badge');
const StatCard = require('../../components/data/StatCard');
const Timeline = require('../../components/special/Timeline');
const Loading = require('../../components/base/Loading');
const EmptyState = require('../../components/base/EmptyState');
const { priorityVariant, categoriaLabel } = require('./recomendacoesMappers');
const { navigate } = require('../../utils/operacional');

class RecomendacoesDrawer {
  constructor(page, recomendacao) {
    this.page = page;
    this.rec = recomendacao;
    this.timeline = [];
    this.kpis = null;
    this.pendencias = [];
  }

  async mount(container) {
    container.innerHTML = '';
    container.appendChild(Loading.create({ message: 'Carregando detalhes...' }));

    try {
      const params = {};
      if (this.rec.clienteId) params.clienteId = this.rec.clienteId;
      if (this.rec.consignacaoId) params.consignacaoId = this.rec.consignacaoId;

      const [timeline, indicadores, pendencias] = await Promise.all([
        this.page.projectionApi.listarTimeline({ ...params, limite: 12 }),
        this.rec.clienteId
          ? this.page.projectionApi.obterProjecaoIndicadores(params)
          : Promise.resolve(null),
        this.page.projectionApi.obterProjecaoPendencias(params).catch(() => ({ alertas: [] }))
      ]);

      this.timeline = timeline?.eventos || timeline || [];
      this.kpis = indicadores;
      this.pendencias = (pendencias.alertas || []).filter((a) =>
        a.id === this.rec.pendenciaRelacionada
        || a.clienteId === this.rec.clienteId
        || a.consignacaoId === this.rec.consignacaoId
      ).slice(0, 5);

      this.page._markViewed(this.rec);
      this._render(container);
    } catch (error) {
      container.innerHTML = '';
      container.appendChild(EmptyState.create({ title: 'Erro', description: error.message }));
    }
  }

  _render(container) {
    container.innerHTML = '';
    container.className = 'cds-recomendacoes-drawer';

    container.appendChild(this._section('Recomendação', this._renderSummary()));
    container.appendChild(this._section('Motivo', this._renderMotivo()));
    container.appendChild(this._section('Origem', this._renderOrigem()));
    if (this.kpis) container.appendChild(this._section('KPIs', this._renderKpis()));
    if (this.pendencias.length) container.appendChild(this._section('Pendências Relacionadas', this._renderPendencias()));
    container.appendChild(this._section('Linha do Tempo', this._renderTimeline()));
    container.appendChild(this._section('Links Rápidos', this._renderLinks()));
    container.appendChild(this._section('Ações', this._renderActions()));
  }

  _section(title, content) {
    const wrap = document.createElement('div');
    wrap.className = 'cds-recomendacoes-drawer__section';
    const h = document.createElement('h3');
    h.textContent = title;
    wrap.appendChild(h);
    wrap.appendChild(content);
    return wrap;
  }

  _renderSummary() {
    const el = document.createElement('div');
    el.innerHTML = `
      <p><strong>${this.rec.titulo}</strong></p>
      <p>${this.rec.descricao}</p>
      <div class="cds-recomendacoes-drawer__badges">
        ${Badge.create({ text: categoriaLabel(this.rec.categoria), variant: 'info' }).outerHTML}
        ${Badge.create({ text: this.rec.prioridade, variant: priorityVariant(this.rec.prioridade) }).outerHTML}
        ${Badge.create({ text: `${this.rec.confianca}% confiança`, variant: 'default' }).outerHTML}
      </div>
      <p>Impacto: ${this.rec.impactoEstimado || '—'}</p>
    `;
    return el;
  }

  _renderMotivo() {
    const el = document.createElement('div');
    el.innerHTML = `<p>${this.rec.motivo || '—'}</p>`;
    return el;
  }

  _renderOrigem() {
    const el = document.createElement('div');
    el.innerHTML = `
      <p>Origem: <code>${this.rec.origem || '—'}</code></p>
      <p>Análise: <code>${this.rec.insightRelacionado || '—'}</code></p>
      <p>Projeção: <code>${this.rec.projectionRelacionada || '—'}</code></p>
    `;
    return el;
  }

  _renderKpis() {
    const grid = document.createElement('div');
    grid.className = 'cds-recomendacoes-drawer__kpis';
    const k = this.kpis;
    [
      { title: 'Conversão', value: k.percentualConversao, format: 'percent' },
      { title: 'Perdas', value: k.valorPerdido, format: 'currency' },
      { title: 'Vendido', value: k.valorVendido, format: 'currency' }
    ].filter((i) => i.value != null).forEach((item) => grid.appendChild(StatCard.create(item)));
    return grid.childElementCount ? grid : EmptyState.create({ title: 'Sem KPIs', description: 'Indisponível' });
  }

  _renderPendencias() {
    const list = document.createElement('ul');
    this.pendencias.forEach((p) => {
      const li = document.createElement('li');
      li.textContent = p.descricao || p.mensagem || p.tipo;
      list.appendChild(li);
    });
    return list;
  }

  _renderTimeline() {
    return Timeline.create({ events: this.timeline, emptyTitle: 'Sem eventos', emptyDescription: 'Linha do tempo vazia' });
  }

  _renderLinks() {
    const actions = document.createElement('div');
    actions.className = 'cds-recomendacoes-drawer__links';
    const links = [
      { label: 'Painel', path: '/' },
      { label: 'Pendências', path: '/pendencias' }
    ];
    if (this.rec.clienteId) links.push({ label: 'Central do Cliente', path: `/clientes/${this.rec.clienteId}` });
    if (this.rec.consignacaoId) {
      links.push({ label: 'Consignação', path: `/consignacoes/${this.rec.consignacaoId}` });
      links.push({ label: 'Fechar Atendimento', path: `/consignacoes/${this.rec.consignacaoId}/prestacao` });
    }
    links.push({
      label: 'Conta Corrente',
      path: this.rec.consignacaoId
        ? `/consignacoes/${this.rec.consignacaoId}/prestacao/conta-corrente`
        : '/conta-corrente'
    });
    links.forEach((l) => {
      actions.appendChild(Button.create({ text: l.label, variant: 'ghost', onClick: () => navigate(l.path) }));
    });
    return actions;
  }

  _renderActions() {
    const actions = document.createElement('div');
    actions.className = 'cds-recomendacoes-drawer__actions';
    actions.appendChild(Button.create({ text: 'Aceitar', variant: 'primary', onClick: () => this.page._acceptRec(this.rec) }));
    actions.appendChild(Button.create({ text: 'Ignorar', variant: 'ghost', onClick: () => this.page._ignoreRec(this.rec) }));
    actions.appendChild(Button.create({ text: 'Adiar', variant: 'secondary', onClick: () => this.page._deferRec(this.rec) }));
    actions.appendChild(Button.create({ text: 'Concluir', variant: 'secondary', onClick: () => this.page._completeRec(this.rec) }));
    return actions;
  }
}

module.exports = RecomendacoesDrawer;
