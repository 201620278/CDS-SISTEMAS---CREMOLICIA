/**
 * Drawer de Workflow — Sprint O-11.
 *
 * @module frontend/modules/motor-comercial/pages/WorkflowCenter/WorkflowDrawer
 */

const Button = require('../../components/base/Button');
const Badge = require('../../components/base/Badge');
const Timeline = require('../../components/special/Timeline');
const Loading = require('../../components/base/Loading');
const EmptyState = require('../../components/base/EmptyState');
const { colunaLabel, formatTempo, slaVariant, loadHistory } = require('./workflowMappers');
const { navigate } = require('../../utils/operacional');

class WorkflowDrawer {
  constructor(page, workflow) {
    this.page = page;
    this.wf = workflow;
    this.timeline = [];
    this.pendencias = [];
    this.recomendacoes = [];
    this.playbooks = [];
    this.contaCorrente = null;
    this.resumoPrestacao = null;
  }

  async mount(container) {
    container.innerHTML = '';
    container.appendChild(Loading.create({ message: 'Carregando processo...' }));

    try {
      const params = {};
      if (this.wf.clienteId) params.clienteId = this.wf.clienteId;
      if (this.wf.consignacaoId) params.consignacaoId = this.wf.consignacaoId;

      const requests = [
        this.page.projectionApi.listarTimeline({ ...params, limite: 12 }),
        this.page.projectionApi.obterProjecaoPendencias(params).catch(() => ({})),
        this.page.projectionApi.obterProjecaoRecomendacoes(params).catch(() => ({})),
        this.page.projectionApi.obterProjecaoPlaybooks(params).catch(() => ({}))
      ];

      if (params.clienteId) {
        requests.push(this.page.projectionApi.obterProjecaoContaCorrente(params).catch(() => null));
      }
      if (params.consignacaoId) {
        requests.push(this.page.projectionApi.obterResumoPrestacao(params).catch(() => null));
      }

      const results = await Promise.all(requests);
      const timeline = results[0];
      const pends = results[1];
      const recs = results[2];
      const pbs = results[3];

      this.timeline = timeline?.eventos || timeline || [];
      this.pendencias = (pends.alertas || []).filter((p) =>
        !this.wf.pendenciasRelacionadas?.length || this.wf.pendenciasRelacionadas.includes(p.id)
      ).slice(0, 8);
      if (!this.pendencias.length) this.pendencias = (pends.alertas || []).slice(0, 5);

      this.recomendacoes = (recs.recomendacoes || []).filter((r) =>
        !this.wf.recomendacoesRelacionadas?.length || this.wf.recomendacoesRelacionadas.includes(r.id)
      ).slice(0, 8);
      if (!this.recomendacoes.length) this.recomendacoes = (recs.recomendacoes || []).slice(0, 5);

      this.playbooks = (pbs.playbooks || pbs.sugeridos || []).filter((pb) =>
        !this.wf.playbooksRelacionados?.length || this.wf.playbooksRelacionados.includes(pb.id)
      ).slice(0, 5);

      this.contaCorrente = results[4] || null;
      this.resumoPrestacao = results[5] || null;

      this._render(container);
    } catch (error) {
      container.innerHTML = '';
      container.appendChild(EmptyState.create({ title: 'Erro', description: error.message }));
    }
  }

  _render(container) {
    container.innerHTML = '';
    container.className = 'cds-workflow-drawer';

    container.appendChild(this._sec('Resumo', this._summary()));
    container.appendChild(this._sec('Cliente', this._cliente()));
    container.appendChild(this._sec('Linha do Tempo', Timeline.create({
      events: this.timeline,
      emptyTitle: 'Sem eventos',
      emptyDescription: ''
    })));
    container.appendChild(this._sec('Guia Operacional', this._playbook()));
    container.appendChild(this._sec('Lista de verificação', this._checklist()));
    container.appendChild(this._sec('Pendências', this._list(this.pendencias, (p) => p.descricao || p.mensagem)));
    container.appendChild(this._sec('Recomendações', this._list(this.recomendacoes, (r) => r.titulo)));
    container.appendChild(this._sec('Conta Corrente', this._contaCorrente()));
    container.appendChild(this._sec('Fechamento', this._prestacao()));
    container.appendChild(this._sec('Consignações', this._consignacoes()));
    container.appendChild(this._sec('Histórico', this._historico()));
    container.appendChild(this._sec('Links rápidos', this._links()));
  }

  _sec(title, content) {
    const w = document.createElement('div');
    w.className = 'cds-workflow-drawer__section';
    const h = document.createElement('h3');
    h.textContent = title;
    w.appendChild(h);
    w.appendChild(content);
    return w;
  }

  _summary() {
    const el = document.createElement('div');
    el.className = 'cds-workflow-drawer__summary';
    const sla = this.wf.sla || {};
    el.innerHTML = `
      <p><strong>${this.wf.titulo}</strong></p>
      <p>Origem: ${this.wf.origemTipo || '—'} · ${colunaLabel(this.wf.coluna)}</p>
      <p>Responsável: ${this.wf.responsavel || 'Não atribuído'}</p>
      <p>Tempo decorrido: ${formatTempo(this.wf.tempoDecorridoMinutos)}</p>
    `;
    el.appendChild(Badge.create({
      text: `SLA: ${sla.status || '—'}`,
      variant: slaVariant(sla.indicador)
    }));
    if (sla.restanteMinutos != null && sla.status !== 'VENCIDO') {
      el.appendChild(document.createElement('br'));
      el.appendChild(Badge.create({ text: `Restante: ${formatTempo(sla.restanteMinutos)}`, variant: 'info' }));
    }
    if (sla.excedidoMinutos > 0) {
      el.appendChild(Badge.create({ text: `Excedido: ${formatTempo(sla.excedidoMinutos)}`, variant: 'error' }));
    }
    return el;
  }

  _cliente() {
    const el = document.createElement('div');
    el.innerHTML = `<p><strong>${this.wf.cliente || '—'}</strong></p>
      <p>Documento: ${this.wf.documento || '—'}</p>`;
    if (this.wf.clienteId) {
      el.appendChild(Button.create({
        text: 'Central do Cliente',
        variant: 'secondary',
        onClick: () => navigate(`/clientes/${this.wf.clienteId}`)
      }));
    }
    return el;
  }

  _playbook() {
    if (!this.wf.playbook) {
      return EmptyState.create({ title: 'Sem guia operacional', description: 'Nenhum guia operacional vinculado' });
    }
    const el = document.createElement('div');
    el.innerHTML = `<p><strong>${this.wf.playbook}</strong></p>
      <p>Progresso: ${this.wf.progressoPercentual ?? 0}%</p>
      <p>Tempo previsto: ${formatTempo(this.wf.tempoPrevistoMinutos)}</p>`;
    if (this.wf.playbookId) {
      el.appendChild(Button.create({
        text: 'Abrir Guia Operacional',
        variant: 'primary',
        onClick: () => navigate(`/playbooks?playbookId=${encodeURIComponent(this.wf.playbookId)}`)
      }));
    }
    return el;
  }

  _checklist() {
    const ul = document.createElement('ul');
    (this.playbooks[0]?.passos || this.playbooks[0]?.checklist || []).forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item.titulo || item;
      ul.appendChild(li);
    });
    return ul.childElementCount
      ? ul
      : EmptyState.create({ title: 'Lista de verificação', description: 'Inicie um guia operacional para ver os passos' });
  }

  _list(items, labelFn) {
    const ul = document.createElement('ul');
    items.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = labelFn(item);
      ul.appendChild(li);
    });
    return ul.childElementCount ? ul : EmptyState.create({ title: 'Vazio', description: '' });
  }

  _contaCorrente() {
    if (!this.contaCorrente) {
      return EmptyState.create({ title: 'Conta corrente', description: 'Sem dados para este escopo' });
    }
    const el = document.createElement('div');
    const saldo = this.contaCorrente.saldo ?? this.contaCorrente.saldoEmAberto;
    el.innerHTML = `<p>Saldo: ${saldo != null ? saldo : '—'}</p>`;
    el.appendChild(Button.create({ text: 'Ver extrato', variant: 'ghost', onClick: () => navigate('/conta-corrente') }));
    return el;
  }

  _prestacao() {
    if (!this.resumoPrestacao) {
      return EmptyState.create({ title: 'Fechamento', description: 'Sem fechamento vinculado' });
    }
    const el = document.createElement('div');
    el.innerHTML = `<p>Status: ${this.resumoPrestacao.status || '—'}</p>`;
    if (this.wf.consignacaoId) {
      el.appendChild(Button.create({
        text: 'Fechar Consignação',
        variant: 'ghost',
        onClick: () => navigate(`/consignacoes/${this.wf.consignacaoId}/prestacao`)
      }));
    }
    return el;
  }

  _consignacoes() {
    const el = document.createElement('div');
    if (this.wf.consignacaoId) {
      el.appendChild(Button.create({
        text: `Consignação #${this.wf.consignacaoId}`,
        variant: 'secondary',
        onClick: () => navigate(`/consignacoes/${this.wf.consignacaoId}`)
      }));
    } else {
      el.appendChild(EmptyState.create({ title: 'Consignações', description: 'Nenhuma consignação vinculada' }));
    }
    return el;
  }

  _historico() {
    const hist = loadHistory().filter((h) => h.workflowId === this.wf.id).slice(0, 10);
    const ul = document.createElement('ul');
    hist.forEach((h) => {
      const li = document.createElement('li');
      li.textContent = `${h.acao} — ${h.usuario || ''} — ${h.quando ? new Date(h.quando).toLocaleString('pt-BR') : ''}`;
      ul.appendChild(li);
    });
    return ul.childElementCount ? ul : EmptyState.create({ title: 'Histórico', description: 'Sem movimentações locais' });
  }

  _links() {
    const w = document.createElement('div');
    w.className = 'cds-workflow-drawer__links';
    [
      { l: 'Central de Processos', p: '/workflow' },
      { l: 'Pendências', p: '/pendencias' },
      { l: 'Recomendações', p: '/recomendacoes' },
      { l: 'Guias Operacionais', p: '/playbooks' },
      ...(this.wf.clienteId ? [{ l: 'Central do Cliente', p: `/clientes/${this.wf.clienteId}` }] : []),
      ...(this.wf.consignacaoId ? [{ l: 'Consignação', p: `/consignacoes/${this.wf.consignacaoId}` }] : [])
    ].forEach((link) => {
      w.appendChild(Button.create({ text: link.l, variant: 'ghost', onClick: () => navigate(link.p) }));
    });
    return w;
  }
}

module.exports = WorkflowDrawer;
