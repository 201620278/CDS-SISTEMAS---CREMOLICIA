/**
 * Detalhes da Consignação — reutiliza CockpitDrawer da Central.
 *
 * Sprint H-2: rota /consignacoes/:id
 *
 * @module frontend/modules/motor-comercial/pages/DetalhesConsignacao
 */

const DashboardLayout = require('../../components/layouts/DashboardLayout');
const Button = require('../../components/base/Button');
const Loading = require('../../components/base/Loading');
const Alert = require('../../components/base/Alert');
const MotorComercialApi = require('../../api/MotorComercialApi');
const ProjectionApi = require('../../api/ProjectionApi');
const { mapConsignacaoView } = require('../../api/helpers');
const CockpitDrawer = require('../Consignacoes/CockpitDrawer');
const {
  imprimirTermo,
  visualizarTermo,
  exportarTermoPdf
} = require('../../services/TermoEntregaConsignacaoService');
const {
  notify,
  navigate,
  withLoading,
  choiceDialog
} = require('../../utils/operacional');
const {
  parseCliente360Context,
  resolveBackPath,
  routeWithActiveContext
} = require('../../utils/cliente360Context');

class DetalhesConsignacaoPage {
  constructor(params = {}, routeQuery = {}) {
    this.consignacaoId = params.id;
    this.routeQuery = routeQuery;
    this.navigationContext = parseCliente360Context(routeQuery);
    this.api = new MotorComercialApi();
    this.projectionApi = new ProjectionApi();
    this.consignacao = null;
    this.error = null;
  }

  static create(params = {}, query = {}) {
    const page = new DetalhesConsignacaoPage(params, query);
    return page._render();
  }

  _render() {
    const shell = document.createElement('div');
    shell.className = 'cds-detalhes-consignacao';
    shell.id = 'detalhes-consignacao-root';
    shell.appendChild(Loading.create({ message: 'Carregando consignação...' }));

    const layout = DashboardLayout.create({
      header: this._createHeader(),
      content: shell
    });

    setTimeout(() => this._load(), 0);
    return layout;
  }

  _createHeader() {
    const container = document.createElement('div');
    container.className = 'cds-detalhes-consignacao__header-wrap';
    const title = document.createElement('h1');
    title.textContent = 'Detalhes da Consignação';
    container.appendChild(title);
    container.appendChild(this._createToolbar());
    return container;
  }

  _createToolbar() {
    const bar = document.createElement('div');
    bar.className = 'cds-detalhes-consignacao__toolbar';
    bar.appendChild(Button.create({
      text: 'Voltar',
      variant: 'secondary',
      onClick: () => navigate(resolveBackPath(this.navigationContext, '/consignacoes'))
    }));
    bar.appendChild(Button.create({
      text: 'Entrega',
      variant: 'ghost',
      onClick: () => navigate(routeWithActiveContext(
        `/consignacoes/${this.consignacaoId}/entrega`,
        this.navigationContext
      ))
    }));
    bar.appendChild(Button.create({
      text: 'Imprimir Termo de Entrega',
      variant: 'ghost',
      onClick: () => this._imprimirTermoEntrega()
    }));
    bar.appendChild(Button.create({
      text: 'Fechar Atendimento',
      variant: 'ghost',
      onClick: () => this._openPrestacao(this.consignacao || { id: this.consignacaoId })
    }));
    bar.appendChild(Button.create({ text: 'Atualizar', variant: 'primary', onClick: () => this._load() }));
    return bar;
  }

  async _imprimirTermoEntrega() {
    const escolha = await choiceDialog({
      title: 'Termo de Entrega',
      message: 'Como deseja emitir o documento?',
      choices: [
        { label: 'Imprimir', value: 'imprimir', variant: 'primary' },
        { label: 'Visualizar', value: 'visualizar', variant: 'secondary' },
        { label: 'Exportar PDF', value: 'pdf', variant: 'secondary' }
      ]
    });
    if (!escolha) return;

    try {
      await withLoading('Gerando termo...', async () => {
        if (escolha === 'visualizar') {
          await visualizarTermo(this.api, this.projectionApi, this.consignacaoId);
        } else if (escolha === 'pdf') {
          await exportarTermoPdf(this.api, this.projectionApi, this.consignacaoId);
        } else {
          await imprimirTermo(this.api, this.projectionApi, this.consignacaoId);
        }
      });
    } catch (error) {
      notify('Erro ao gerar Termo de Entrega: ' + error.message, 'error');
    }
  }

  async _openPrestacao(consignacao) {
    try {
      if (consignacao?.status === 'ENTREGUE') {
        await withLoading('Abrindo prestação...', () => this.api.abrirPrestacao(consignacao.id));
      }
      await navigate(routeWithActiveContext(
        `/consignacoes/${consignacao.id}/prestacao`,
        this.navigationContext
      ));
    } catch (error) {
      notify('Erro ao abrir prestação: ' + error.message, 'error');
    }
  }

  async _load() {
    const host = document.getElementById('detalhes-consignacao-root');
    if (!host) return;

    host.innerHTML = '';
    host.appendChild(Loading.create({ message: 'Carregando consignação...' }));

    try {
      const raw = await withLoading('Carregando...', () => this.api.obterConsignacao(this.consignacaoId));
      this.consignacao = mapConsignacaoView(raw);
      host.innerHTML = '';

      const header = document.createElement('div');
      header.className = 'cds-detalhes-consignacao__header';
      header.innerHTML = `
        <h2>${this.consignacao.documento || `Consignação #${this.consignacaoId}`}</h2>
        <p>${this.consignacao.clienteNome || ''} · ${this.consignacao.status || ''}</p>
      `;
      host.appendChild(header);

      const drawerHost = document.createElement('div');
      host.appendChild(drawerHost);
      const drawer = new CockpitDrawer(this, this.consignacao);
      await drawer.mount(drawerHost);
    } catch (error) {
      host.innerHTML = '';
      host.appendChild(Alert.create({ message: error.message, variant: 'error', dismissible: true }));
    }
  }

  _formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
  }

  _formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  }

  _formatDateTime(date) {
    if (!date) return '-';
    return new Date(date).toLocaleString('pt-BR');
  }
}

module.exports = DetalhesConsignacaoPage;
