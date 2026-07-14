/**
 * Cliente360Drawer — Drawers contextuais da Central 360°.
 *
 * Sprint O-5.
 *
 * @module frontend/modules/motor-comercial/pages/PerfilComercial/Cliente360Drawer
 */

const Button = require('../../components/base/Button');
const Loading = require('../../components/base/Loading');
const EmptyState = require('../../components/base/EmptyState');
const Timeline = require('../../components/special/Timeline');
const { navigate } = require('../../utils/operacional');
const { buildRouteWithCliente360Context } = require('../../utils/cliente360Context');

class Cliente360Drawer {
  constructor(page, type, data) {
    this.page = page;
    this.type = type;
    this.data = data;
  }

  async mount(container) {
    container.className = 'cds-cliente360-drawer';
    container.appendChild(Loading.create({ message: 'Carregando...' }));

    try {
      const content = await this._render();
      container.innerHTML = '';
      container.appendChild(content);
    } catch (error) {
      container.innerHTML = '';
      container.appendChild(EmptyState.create({
        title: 'Erro',
        description: error.message
      }));
    }
  }

  async _render() {
    switch (this.type) {
      case 'consignacao':
        return this._consignacao();
      case 'prestacao':
        return this._prestacao();
      case 'insight':
        return this._insight();
      case 'recebimento':
        return this._recebimento();
      default:
        return EmptyState.create({ title: 'Drawer indisponível' });
    }
  }

  _routeFrom360(path) {
    const clienteId = this.page.perfil?.clienteId;
    if (!clienteId) return path;
    return buildRouteWithCliente360Context(path, clienteId);
  }

  async _consignacao() {
    const c = this.data;
    const wrap = document.createElement('div');
    wrap.className = 'cds-cliente360-drawer__grid';
    wrap.innerHTML = `
      <div><label>Documento</label><div>${c.documento || '-'}</div></div>
      <div><label>Status</label><div>${c.status || '-'}</div></div>
      <div><label>Valor</label><div>${this.page._formatCurrency(c.valor)}</div></div>
      <div><label>Saldo</label><div>${this.page._formatCurrency(c.saldo)}</div></div>
      <div><label>Entrega</label><div>${this.page._formatDate(c.dataEntrega || c.data)}</div></div>
    `;

    const actions = document.createElement('div');
    actions.className = 'cds-cliente360-drawer__actions';
    actions.appendChild(Button.create({
      text: 'Fechar Atendimento',
      variant: 'primary',
      onClick: () => navigate(this._routeFrom360(`/consignacoes/${c.id}/prestacao`))
    }));
    actions.appendChild(Button.create({
      text: 'Entrega',
      variant: 'secondary',
      onClick: () => navigate(this._routeFrom360(`/consignacoes/${c.id}/entrega`))
    }));
    wrap.appendChild(actions);
    return wrap;
  }

  async _prestacao() {
    const p = this.data;
    const resumo = await this.page.projectionApi.obterResumoPrestacao({ consignacaoId: p.id }).catch(() => ({}));
    const wrap = document.createElement('div');
    wrap.className = 'cds-cliente360-drawer__grid';
    wrap.innerHTML = `
      <div><label>Número</label><div>${p.documento || p.numero || p.id}</div></div>
      <div><label>Status</label><div>${resumo.status || p.status || '-'}</div></div>
      <div><label>Saldo</label><div>${this.page._formatCurrency(resumo.saldoAtual ?? p.saldo)}</div></div>
      <div><label>Recebido</label><div>${this.page._formatCurrency(resumo.valorRecebido)}</div></div>
      <div><label>Perdas</label><div>${this.page._formatCurrency(resumo.valorPerdido)}</div></div>
      <div><label>Cortesias</label><div>${this.page._formatCurrency(resumo.valorCortesia)}</div></div>
    `;

    const actions = document.createElement('div');
    actions.className = 'cds-cliente360-drawer__actions';
    actions.appendChild(Button.create({
      text: 'Fechar Atendimento',
      variant: 'primary',
      onClick: () => navigate(this._routeFrom360(`/consignacoes/${p.id}/prestacao`))
    }));
    wrap.appendChild(actions);
    return wrap;
  }

  async _insight() {
    const insight = this.data;
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <h4>${insight.titulo}</h4>
      <p>${insight.mensagem}</p>
      <p><strong>Severidade:</strong> ${insight.severidade}</p>
      <p><strong>Prioridade:</strong> ${insight.prioridade}</p>
    `;
    return wrap;
  }

  async _recebimento() {
    const mov = this.data;
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div><label>Data</label><div>${this.page._formatDateTime(mov.data || mov.dataMovimentacao)}</div></div>
      <div><label>Valor</label><div>${this.page._formatCurrency(mov.valor)}</div></div>
      <div><label>Tipo</label><div>${mov.tipo || mov.tipoMovimentacao || '-'}</div></div>
    `;
    return wrap;
  }
}

module.exports = Cliente360Drawer;
