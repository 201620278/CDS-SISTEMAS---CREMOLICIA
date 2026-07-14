/**
 * Histórico de Prestação — timeline e movimentações da consignação.
 *
 * Sprint H-2: rota /consignacoes/:id/prestacao/historico
 *
 * @module frontend/modules/motor-comercial/pages/HistoricoPrestacao
 */

const DashboardLayout = require('../../components/layouts/DashboardLayout');
const Button = require('../../components/base/Button');
const Loading = require('../../components/base/Loading');
const Alert = require('../../components/base/Alert');
const EmptyState = require('../../components/base/EmptyState');
const Table = require('../../components/data/Table');
const Timeline = require('../../components/special/Timeline');
const MotorComercialApi = require('../../api/MotorComercialApi');
const ProjectionApi = require('../../api/ProjectionApi');
const { navigate } = require('../../utils/operacional');
const {
  parseNavigationContext,
  routeWithActiveContext
} = require('../../utils/cliente360Context');

class HistoricoPrestacaoPage {
  constructor(params = {}, routeQuery = {}) {
    this.consignacaoId = params.id;
    this.routeQuery = routeQuery;
    this.navigationContext = parseNavigationContext(routeQuery);
    this.api = new MotorComercialApi();
    this.projectionApi = new ProjectionApi();
  }

  static create(params = {}, query = {}) {
    const page = new HistoricoPrestacaoPage(params, query);
    return page._render();
  }

  _render() {
    const shell = document.createElement('div');
    shell.id = 'historico-prestacao-root';
    shell.appendChild(Loading.create({ message: 'Carregando histórico...' }));

    const layout = DashboardLayout.create({
      header: this._createHeader(),
      content: shell
    });

    setTimeout(() => this._load(), 0);
    return layout;
  }

  _createHeader() {
    const header = document.createElement('header');
    header.className = 'cds-page-header';
    header.innerHTML = `
      <p class="cds-eyebrow">Motor Comercial</p>
      <h1 class="cds-title">Histórico do Atendimento</h1>
      <p class="cds-description">Consignação #${this.consignacaoId}</p>
    `;
    header.appendChild(Button.create({
      text: 'Voltar ao Fechamento',
      variant: 'secondary',
      onClick: () => navigate(routeWithActiveContext(
        `/consignacoes/${this.consignacaoId}/prestacao`,
        this.navigationContext
      ))
    }));
    return header;
  }

  async _load() {
    const host = document.getElementById('historico-prestacao-root');
    if (!host) return;

    host.innerHTML = '';
    host.appendChild(Loading.create({ message: 'Carregando histórico...' }));

    try {
      const [consignacao, timeline, historico] = await Promise.all([
        this.api.obterConsignacao(this.consignacaoId),
        this.projectionApi.listarTimeline({ consignacaoId: this.consignacaoId, limite: 100 }),
        this.projectionApi.listarMovimentacoes({ consignacaoId: this.consignacaoId, limite: 100 })
      ]);

      host.innerHTML = '';
      const title = document.createElement('h2');
      title.textContent = `Documento ${consignacao.documento?.numero || consignacao.documento || this.consignacaoId}`;
      host.appendChild(title);

      const timelineTitle = document.createElement('h3');
      timelineTitle.textContent = 'Linha do Tempo';
      host.appendChild(timelineTitle);

      const timelineEvents = timeline?.items || timeline || [];
      if (!timelineEvents.length) {
        host.appendChild(EmptyState.create({ title: 'Sem eventos', description: 'Nenhum evento na timeline' }));
      } else {
        host.appendChild(Timeline.create({ events: timelineEvents }));
      }

      const movTitle = document.createElement('h3');
      movTitle.textContent = 'Movimentações Financeiras';
      host.appendChild(movTitle);

      const movs = historico?.items || historico || [];
      if (!movs.length) {
        host.appendChild(EmptyState.create({ title: 'Sem movimentações', description: 'Nenhum registro contábil' }));
      } else {
        host.appendChild(Table.create({
          columns: [
            { key: 'data', label: 'Data' },
            { key: 'tipo', label: 'Tipo' },
            { key: 'valor', label: 'Valor' },
            { key: 'correlationId', label: 'Referência' }
          ],
          data: movs.map((m) => ({
            data: this._formatDateTime(m.data || m.dataMovimentacao),
            tipo: m.tipo || m.tipoMovimentacao,
            valor: m.valor,
            correlationId: m.correlationId || '-'
          }))
        }));
      }
    } catch (error) {
      host.innerHTML = '';
      host.appendChild(Alert.create({ message: error.message, variant: 'error', dismissible: true }));
    }
  }

  _formatDateTime(date) {
    if (!date) return '-';
    return new Date(date).toLocaleString('pt-BR');
  }
}

module.exports = HistoricoPrestacaoPage;
