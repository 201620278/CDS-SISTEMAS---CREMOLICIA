/**
 * Auditoria Comercial — movimentações consolidadas.
 *
 * Sprint H-2: rota /auditoria
 *
 * @module frontend/modules/motor-comercial/pages/Auditoria
 */

const DashboardLayout = require('../../components/layouts/DashboardLayout');
const Button = require('../../components/base/Button');
const Loading = require('../../components/base/Loading');
const Alert = require('../../components/base/Alert');
const EmptyState = require('../../components/base/EmptyState');
const Table = require('../../components/data/Table');
const ProjectionApi = require('../../api/ProjectionApi');
const { navigate, withLoading } = require('../../utils/operacional');

class AuditoriaPage {
  constructor() {
    this.projectionApi = new ProjectionApi();
  }

  static create() {
    const page = new AuditoriaPage();
    return page._render();
  }

  _render() {
    const shell = document.createElement('div');
    shell.id = 'auditoria-comercial-root';
    shell.appendChild(Loading.create({ message: 'Carregando auditoria...' }));

    const layout = DashboardLayout.create({
      header: this._createHeader(),
      content: shell
    });

    setTimeout(() => this._load(), 0);
    return layout;
  }

  _createHeader() {
    const header = document.createElement('div');
    header.innerHTML = '<h1>Auditoria Comercial</h1><p>Movimentações derivadas do ledger</p>';
    header.appendChild(Button.create({ text: 'Painel', variant: 'secondary', onClick: () => navigate('/') }));
    return header;
  }

  async _load() {
    const host = document.getElementById('auditoria-comercial-root');
    if (!host) return;

    host.innerHTML = '';
    host.appendChild(Loading.create({ message: 'Carregando auditoria...' }));

    try {
      const historico = await withLoading('Consultando ledger...', () =>
        this.projectionApi.listarMovimentacoes({ limite: 200 })
      );
      const movs = historico?.items || historico || [];

      host.innerHTML = '';
      if (!movs.length) {
        host.appendChild(EmptyState.create({
          title: 'Sem registros',
          description: 'Nenhuma movimentação comercial encontrada'
        }));
        return;
      }

      host.appendChild(Table.create({
        columns: [
          { key: 'data', label: 'Data' },
          { key: 'tipo', label: 'Operação' },
          { key: 'cliente', label: 'Cliente' },
          { key: 'consignacao', label: 'Consignação' },
          { key: 'valor', label: 'Valor' },
          { key: 'correlationId', label: 'Correlation ID' }
        ],
        data: movs.map((m) => ({
          data: this._formatDateTime(m.data || m.dataMovimentacao),
          tipo: m.tipo || m.tipoMovimentacao,
          cliente: m.clienteId || '-',
          consignacao: m.consignacaoId || '-',
          valor: m.valor ?? '-',
          correlationId: m.correlationId || '-'
        }))
      }));
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

module.exports = AuditoriaPage;
