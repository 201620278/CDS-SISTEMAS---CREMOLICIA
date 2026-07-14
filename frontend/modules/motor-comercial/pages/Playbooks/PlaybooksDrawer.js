/**
 * Drawer de Playbooks — Sprint O-10.
 *
 * @module frontend/modules/motor-comercial/pages/Playbooks/PlaybooksDrawer
 */

const Button = require('../../components/base/Button');
const Badge = require('../../components/base/Badge');
const Timeline = require('../../components/special/Timeline');
const Loading = require('../../components/base/Loading');
const EmptyState = require('../../components/base/EmptyState');
const { categoriaLabel, statusChecklistVariant } = require('./playbooksMappers');
const { navigate } = require('../../utils/operacional');

class PlaybooksDrawer {
  constructor(page, playbook) {
    this.page = page;
    this.pb = playbook;
    this.timeline = [];
    this.recomendacoes = [];
    this.pendencias = [];
  }

  async mount(container) {
    container.innerHTML = '';
    container.appendChild(Loading.create({ message: 'Carregando contexto...' }));

    try {
      const params = {};
      if (this.pb.clienteId) params.clienteId = this.pb.clienteId;

      const [timeline, recs, pends] = await Promise.all([
        this.page.projectionApi.listarTimeline({ ...params, limite: 10 }),
        this.page.projectionApi.obterProjecaoRecomendacoes(params).catch(() => ({})),
        this.page.projectionApi.obterProjecaoPendencias(params).catch(() => ({}))
      ]);

      this.timeline = timeline?.eventos || timeline || [];
      this.recomendacoes = (recs.recomendacoes || []).slice(0, 5);
      this.pendencias = (pends.alertas || []).slice(0, 5);
      this._render(container);
    } catch (error) {
      container.innerHTML = '';
      container.appendChild(EmptyState.create({ title: 'Erro', description: error.message }));
    }
  }

  _render(container) {
    container.innerHTML = '';
    container.className = 'cds-playbooks-drawer';

    container.appendChild(this._sec('Guia Operacional', this._summary()));
    container.appendChild(this._sec('Lista de verificação', this._checklist()));
    container.appendChild(this._sec('Recomendações Relacionadas', this._recs()));
    container.appendChild(this._sec('Pendências', this._pends()));
    container.appendChild(this._sec('Linha do Tempo', Timeline.create({ events: this.timeline, emptyTitle: 'Vazio', emptyDescription: '' })));
    container.appendChild(this._sec('Links', this._links()));
  }

  _sec(title, content) {
    const w = document.createElement('div');
    w.className = 'cds-playbooks-drawer__section';
    const h = document.createElement('h3');
    h.textContent = title;
    w.appendChild(h);
    w.appendChild(content);
    return w;
  }

  _summary() {
    const el = document.createElement('div');
    el.innerHTML = `
      <p><strong>${this.pb.nome}</strong> (${this.pb.codigo})</p>
      <p>${this.pb.descricao}</p>
      ${Badge.create({ text: categoriaLabel(this.pb.categoria), variant: 'info' }).outerHTML}
      <p>Objetivo: ${this.pb.objetivo}</p>
      <p>Progresso: ${this.pb.progresso}%</p>
    `;
    return el;
  }

  _checklist() {
    const ul = document.createElement('ul');
    (this.pb.checklist || []).forEach((item) => {
      const li = document.createElement('li');
      li.innerHTML = `${Badge.create({ text: item.status, variant: statusChecklistVariant(item.status) }).outerHTML} ${item.titulo}`;
      ul.appendChild(li);
    });
    return ul.childElementCount ? ul : EmptyState.create({ title: 'Sem passos', description: '' });
  }

  _recs() {
    const ul = document.createElement('ul');
    this.recomendacoes.forEach((r) => {
      const li = document.createElement('li');
      li.textContent = r.titulo;
      ul.appendChild(li);
    });
    return ul.childElementCount ? ul : EmptyState.create({ title: 'Sem recomendações', description: '' });
  }

  _pends() {
    const ul = document.createElement('ul');
    this.pendencias.forEach((p) => {
      const li = document.createElement('li');
      li.textContent = p.descricao || p.mensagem;
      ul.appendChild(li);
    });
    return ul.childElementCount ? ul : EmptyState.create({ title: 'Sem pendências', description: '' });
  }

  _links() {
    const w = document.createElement('div');
    w.className = 'cds-playbooks-drawer__links';
    [
      { l: 'Painel', p: '/' },
      { l: 'Pendências', p: '/pendencias' },
      { l: 'Recomendações', p: '/recomendacoes' },
      ...(this.pb.clienteId ? [{ l: 'Central do Cliente', p: `/clientes/${this.pb.clienteId}` }] : []),
      { l: 'Conta Corrente', p: '/conta-corrente' },
      { l: 'Consignações', p: '/consignacoes' }
    ].forEach(({ l, p }) => {
      w.appendChild(Button.create({ text: l, variant: 'ghost', onClick: () => navigate(p) }));
    });
    return w;
  }
}

module.exports = PlaybooksDrawer;
