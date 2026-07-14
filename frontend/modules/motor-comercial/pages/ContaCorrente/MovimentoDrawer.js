/**
 * MovimentoDrawer — Detalhe de movimentação do extrato.
 *
 * Sprint O-6.
 *
 * @module frontend/modules/motor-comercial/pages/ContaCorrente/MovimentoDrawer
 */

const Button = require('../../components/base/Button');
const Loading = require('../../components/base/Loading');
const EmptyState = require('../../components/base/EmptyState');
const Timeline = require('../../components/special/Timeline');
const { navigate } = require('../../utils/operacional');

class MovimentoDrawer {
  constructor(page, movimento) {
    this.page = page;
    this.movimento = movimento;
  }

  async mount(container) {
    container.className = 'cds-extrato-drawer';
    container.appendChild(Loading.create({ message: 'Carregando movimentação...' }));

    try {
      const content = await this._render();
      container.innerHTML = '';
      container.appendChild(content);
    } catch (error) {
      container.innerHTML = '';
      container.appendChild(EmptyState.create({ title: 'Erro', description: error.message }));
    }
  }

  async _render() {
    const mov = this.movimento.raw || this.movimento;
    const params = {
      consignacaoId: mov.consignacaoId,
      clienteId: this.page.clienteId,
      limite: 10
    };

    const [timeline, historico] = await Promise.all([
      this.page.projectionApi.listarTimeline(params).catch(() => []),
      this.page.projectionApi.listarMovimentacoes({ ...params, limite: 5 }).catch(() => [])
    ]);

    const wrap = document.createElement('div');
    wrap.className = 'cds-extrato-drawer__content';

    wrap.innerHTML = `
      <section class="cds-extrato-drawer__section">
        <h4>Movimentação</h4>
        <div class="cds-extrato-drawer__grid">
          <div><label>Tipo</label><div>${this.movimento.tipoLabel}</div></div>
          <div><label>Documento</label><div>${this.movimento.documento}</div></div>
          <div><label>Data</label><div>${this.page._formatDateTime(this.movimento.data)}</div></div>
          <div><label>Valor</label><div>${this.page._formatCurrency(mov.valor)}</div></div>
          <div><label>Operador</label><div>${this.movimento.operador}</div></div>
          <div><label>Origem</label><div>${this.movimento.origem}</div></div>
          <div><label>Código de rastreio</label><div>${this.movimento.correlationId}</div></div>
          <div><label>Identificador da operação</label><div>${this.movimento.requestId}</div></div>
        </div>
      </section>
    `;

    const ledger = document.createElement('section');
    ledger.className = 'cds-extrato-drawer__section';
    ledger.innerHTML = '<h4>Registro contábil detalhado</h4>';
    const pre = document.createElement('pre');
    pre.className = 'cds-extrato-drawer__ledger';
    pre.textContent = JSON.stringify(mov, null, 2);
    ledger.appendChild(pre);
    wrap.appendChild(ledger);

    const timelineSection = document.createElement('section');
    timelineSection.className = 'cds-extrato-drawer__section';
    timelineSection.innerHTML = '<h4>Eventos relacionados</h4>';
    timelineSection.appendChild(Timeline.create({
      events: timeline,
      emptyTitle: 'Sem eventos',
      emptyDescription: 'Nenhum evento na linha do tempo'
    }));
    wrap.appendChild(timelineSection);

    const actions = document.createElement('div');
    actions.className = 'cds-extrato-drawer__actions';
    if (mov.consignacaoId) {
      actions.appendChild(Button.create({
        text: 'Abrir Consignação',
        variant: 'primary',
        onClick: () => navigate(`/consignacoes/${mov.consignacaoId}/prestacao`)
      }));
      actions.appendChild(Button.create({
        text: 'Conta Corrente',
        variant: 'secondary',
        onClick: () => navigate(`/consignacoes/${mov.consignacaoId}/prestacao/conta-corrente`)
      }));
    }
    if (this.page.clienteId) {
      actions.appendChild(Button.create({
        text: 'Central do Cliente',
        variant: 'ghost',
        onClick: () => navigate(`/clientes/${this.page.clienteId}`)
      }));
    }
    wrap.appendChild(actions);

    return wrap;
  }
}

module.exports = MovimentoDrawer;
