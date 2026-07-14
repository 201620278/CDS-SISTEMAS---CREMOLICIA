/**
 * Central de Inteligência Analítica — Hub de Relatórios Inteligentes
 *
 * Sprint O-7.
 *
 * @module frontend/modules/motor-comercial/pages/Relatorios
 */

const DashboardLayout = require('../../components/layouts/DashboardLayout');
const Button = require('../../components/base/Button');
const StatCard = require('../../components/data/StatCard');
const Table = require('../../components/data/Table');
const Pagination = require('../../components/data/Pagination');
const Loading = require('../../components/base/Loading');
const EmptyState = require('../../components/base/EmptyState');
const Alert = require('../../components/base/Alert');
const Badge = require('../../components/base/Badge');
const GraphContainer = require('../../components/special/GraphContainer');
const Drawer = require('../../components/special/Drawer');
const Timeline = require('../../components/special/Timeline');
const ProjectionApi = require('../../api/ProjectionApi');
const IndicadorDrawer = require('./IndicadorDrawer');
const {
  REPORT_CATALOG,
  findReport,
  buildExtendedFilterParams,
  buildViewFromPayload,
  resolveReportData,
  buildInsightGroups,
  applySearchFilter,
  saveFavorite,
  loadFavorites,
  removeFavorite,
  saveLayout,
  loadLayouts,
  appendHistory,
  loadHistory
} = require('./relatorioMappers');
const { notify, navigate, confirmDialog, promptDialog, choiceDialog } = require('../../utils/operacional');
const { exportToXlsx, exportToPdf } = require('../../utils/exportacao');

const REFRESH_INTERVAL_MS = 60000;

const PROJECTION_LOADERS = {
  dashboard: (api, params) => api.obterProjecaoDashboard(params),
  indicadores: (api, params) => api.obterProjecaoIndicadores(params),
  insights: (api, params) => api.obterProjecaoInsights(params),
  timeline: (api, params) => api.listarTimeline({ ...params, limite: 30 }),
  historico: (api, params) => api.listarMovimentacoes({ ...params, limite: 100 }),
  saldos: (api, params) => api.obterProjecaoSaldos(params),
  contaCorrente: (api, params) => api.obterProjecaoContaCorrente(params),
  situacaoCliente: (api, params) => api.obterSituacaoCliente(params),
  resumoPrestacao: (api, params) => api.obterResumoPrestacao(params)
};

function getOperadorNome() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.nome || user?.username || 'Gestor';
  } catch {
    return 'Gestor';
  }
}

function periodLabel(period) {
  const map = {
    today: 'Hoje',
    week: 'Esta Semana',
    month: 'Este Mês',
    quarter: 'Este Trimestre',
    year: 'Este Ano'
  };
  return map[period] || period;
}

class RelatoriosPage {
  constructor(routeParams = {}, routeQuery = {}) {
    this.routeParams = routeParams;
    this.routeQuery = routeQuery;
    this.projectionApi = new ProjectionApi();

    this.filters = {
      empresa: routeQuery.empresa || '',
      filial: routeQuery.filial || '',
      clienteId: routeQuery.clienteId || '',
      produtoId: routeQuery.produtoId || '',
      consignacaoId: routeQuery.consignacaoId || '',
      operador: routeQuery.operador || '',
      situacao: routeQuery.situacao || '',
      periodo: routeQuery.periodo || 'month',
      tipo: routeQuery.tipo || '',
      categoria: routeQuery.categoria || '',
      search: ''
    };

    const defaultReport = routeQuery.relatorio || routeQuery.report || (routeQuery.grupo === 'executivos' ? 'kpis' : 'consignacoes');
    this.activeReport = findReport(defaultReport);
    this.activeGroup = routeQuery.grupo || this.activeReport.groupId;

    this.payload = {};
    this.view = {};
    this.reportView = { type: 'empty', data: [] };
    this.pagination = { page: 1, pageSize: 25, total: 0 };
    this.lastUpdated = null;
    this.lastExecutionMs = null;
    this.refreshTimer = null;
    this.activeDrawer = null;
    this.searchTimeout = null;
    this.catalogSearch = routeQuery.q || '';
    this.activeCategory = this.activeGroup;
    this.showAdvancedFilters = false;
    this.step = routeQuery.gerado === '1' && (routeQuery.relatorio || routeQuery.report)
      ? 'results'
      : (routeQuery.relatorio || routeQuery.report ? 'configure' : 'browse');
  }

  static create(params = {}, query = {}) {
    return new RelatoriosPage(params, query).render();
  }

  render() {
    const layout = DashboardLayout.create({
      header: this._createHeader(),
      sidebar: this._createSidebar(),
      content: this._createContent(),
      footer: this._createFooter()
    });

    setTimeout(() => {
      this._renderStep();
      if (this.step === 'results') {
        this._executeReport();
        this._startAutoRefresh();
      }
    }, 0);

    return layout;
  }

  _createHeader() {
    const el = document.createElement('header');
    el.className = 'cds-relatorios-header cds-page-header';
    el.id = 'analytics-header';

    const row = document.createElement('div');
    row.className = 'cds-relatorios-header__row';

    const left = document.createElement('div');
    left.innerHTML = `
      <p class="cds-eyebrow">Motor Comercial</p>
      <h1 class="cds-title">Central de Relatórios</h1>
      <p class="cds-description">Escolha um relatório, configure o período e gere a análise.</p>
      <p id="analytics-updated" class="cds-caption"></p>
    `;
    row.appendChild(left);

    const actions = document.createElement('div');
    actions.className = 'cds-relatorios-header__actions';
    actions.id = 'relatorios-header-actions';
    row.appendChild(actions);

    el.appendChild(row);
    return el;
  }

  _createSidebar() {
    const nav = document.createElement('nav');
    nav.className = 'cds-analytics-sidebar';
    nav.innerHTML = '<h3 class="cds-analytics-sidebar__title">Navegação</h3>';

    [
      { label: 'Central de Trabalho', icon: '📊', path: '/' },
      { label: 'Consignações', icon: '📦', path: '/consignacoes' },
      { label: 'Central de Clientes', icon: '👥', path: '/clientes' },
      { label: 'Conta Corrente', icon: '🏦', path: '/conta-corrente' },
      { label: 'Relatórios', icon: '📊', path: '/relatorios', active: true }
    ].forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `cds-analytics-sidebar__item${item.active ? ' cds-analytics-sidebar__item--active' : ''}`;
      btn.innerHTML = `<span>${item.icon}</span> ${item.label}`;
      btn.addEventListener('click', () => navigate(item.path));
      nav.appendChild(btn);
    });

    return nav;
  }

  _createFooter() {
    const footer = document.createElement('div');
    footer.className = 'cds-analytics-footer';
    footer.innerHTML = '<span>Relatórios do Motor Comercial</span><span>CDS Sistemas</span>';
    return footer;
  }

  _createContent() {
    const wrap = document.createElement('div');
    wrap.className = 'cds-relatorios';
    wrap.id = 'relatorios-root';
    return wrap;
  }

  _renderStep() {
    const root = document.getElementById('relatorios-root');
    if (!root) return;
    root.innerHTML = '';
    this._syncHeaderActions();

    if (this.step === 'browse') {
      root.appendChild(this._renderBrowseStep());
    } else if (this.step === 'configure') {
      root.appendChild(this._renderConfigureStep());
    } else {
      root.appendChild(this._renderResultsStep());
    }
  }

  _syncHeaderActions() {
    const host = document.getElementById('relatorios-header-actions');
    if (!host) return;
    host.innerHTML = '';
    if (this.step === 'browse') return;
    if (this.step === 'configure') {
      host.appendChild(Button.create({
        text: 'Voltar à lista',
        variant: 'ghost',
        onClick: () => this._goBrowse()
      }));
      return;
    }
    host.appendChild(Button.create({
      text: 'Alterar filtros',
      variant: 'secondary',
      onClick: () => this._goConfigure()
    }));
    host.appendChild(Button.create({
      text: 'Atualizar',
      variant: 'ghost',
      icon: '🔄',
      onClick: () => this._executeReport()
    }));
  }

  _goBrowse() {
    this.step = 'browse';
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this._renderStep();
  }

  _goConfigure() {
    this.step = 'configure';
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this._renderStep();
  }

  _goResults() {
    this.step = 'results';
    this._renderStep();
  }

  _renderBrowseStep() {
    const wrap = document.createElement('div');
    wrap.className = 'cds-relatorios-browse';

    const searchWrap = document.createElement('div');
    searchWrap.className = 'cds-relatorios-browse__search';
    const search = document.createElement('input');
    search.type = 'search';
    search.className = 'cds-input';
    search.placeholder = 'Pesquisar relatório...';
    search.value = this.catalogSearch;
    search.addEventListener('input', (e) => {
      clearTimeout(this.searchTimeout);
      this.catalogSearch = e.target.value;
      this.searchTimeout = setTimeout(() => this._renderStep(), 200);
    });
    searchWrap.appendChild(search);
    wrap.appendChild(searchWrap);

    const categories = document.createElement('div');
    categories.className = 'cds-relatorios-categories';
    REPORT_CATALOG.forEach((group) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `cds-relatorios-categories__btn${this.activeCategory === group.id ? ' cds-relatorios-categories__btn--active' : ''}`;
      btn.textContent = group.label;
      btn.addEventListener('click', () => {
        this.activeCategory = group.id;
        this._renderStep();
      });
      categories.appendChild(btn);
    });
    wrap.appendChild(categories);

    const list = document.createElement('div');
    list.className = 'cds-relatorios-list';
    const group = REPORT_CATALOG.find((g) => g.id === this.activeCategory) || REPORT_CATALOG[0];
    const term = (this.catalogSearch || '').toLowerCase();
    const reports = group.reports.filter((r) =>
      !term || r.label.toLowerCase().includes(term) || group.label.toLowerCase().includes(term)
    );

    if (!reports.length) {
      list.appendChild(EmptyState.create({
        title: 'Nenhum relatório encontrado',
        description: 'Ajuste a pesquisa ou escolha outra categoria.'
      }));
    } else {
      reports.forEach((report) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'cds-relatorios-list__item';
        item.innerHTML = `
          <span class="cds-relatorios-list__icon">${report.icon}</span>
          <span class="cds-relatorios-list__body">
            <strong>${report.label}</strong>
            <span>${group.label}</span>
          </span>
        `;
        item.addEventListener('click', () => this._selectReport(report, group.id));
        list.appendChild(item);
      });
    }
    wrap.appendChild(list);

    const shortcuts = document.createElement('div');
    shortcuts.className = 'cds-relatorios-shortcuts';

    const favBlock = document.createElement('div');
    favBlock.className = 'cds-relatorios-shortcuts__block';
    favBlock.innerHTML = '<h3>Favoritos</h3>';
    const favorites = loadFavorites();
    if (!favorites.length) {
      favBlock.appendChild(EmptyState.create({
        title: 'Sem favoritos',
        description: 'Salve filtros após gerar um relatório.'
      }));
    } else {
      favorites.slice(0, 5).forEach((fav) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cds-relatorios-shortcut';
        btn.innerHTML = `<span>${fav.nome || fav.reportLabel}</span><small>${fav.reportLabel || ''}</small>`;
        btn.addEventListener('click', () => this._applyFavorite(fav));
        favBlock.appendChild(btn);
      });
    }
    shortcuts.appendChild(favBlock);

    const recentBlock = document.createElement('div');
    recentBlock.className = 'cds-relatorios-shortcuts__block';
    recentBlock.innerHTML = '<h3>Recentes</h3>';
    const history = loadHistory().slice(0, 5);
    if (!history.length) {
      recentBlock.appendChild(EmptyState.create({
        title: 'Sem recentes',
        description: 'Relatórios gerados aparecerão aqui.'
      }));
    } else {
      history.forEach((entry) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cds-relatorios-shortcut';
        btn.innerHTML = `<span>${entry.reportLabel || entry.reportId}</span><small>${entry.executedAt ? new Date(entry.executedAt).toLocaleString('pt-BR') : ''}</small>`;
        btn.addEventListener('click', () => {
          this.activeReport = findReport(entry.reportId);
          this.activeCategory = this.activeReport.groupId || this._findGroupId(entry.reportId);
          if (entry.filtros) Object.assign(this.filters, entry.filtros);
          this.step = 'configure';
          this._renderStep();
        });
        recentBlock.appendChild(btn);
      });
    }
    shortcuts.appendChild(recentBlock);
    wrap.appendChild(shortcuts);

    return wrap;
  }

  _renderConfigureStep() {
    const wrap = document.createElement('div');
    wrap.className = 'cds-relatorios-configure';

    const selected = document.createElement('div');
    selected.className = 'cds-relatorios-configure__selected';
    selected.innerHTML = `
      <span class="cds-relatorios-configure__selected-icon">${this.activeReport.icon || '📊'}</span>
      <div>
        <p class="cds-eyebrow">${this.activeReport.groupLabel || ''}</p>
        <h2 class="cds-subtitle">${this.activeReport.label}</h2>
        <p class="cds-description">Defina empresa, filial e período antes de gerar.</p>
      </div>
    `;
    wrap.appendChild(selected);
    wrap.appendChild(this._createFiltersPanel());
    return wrap;
  }

  _createFiltersPanel() {
    const container = document.createElement('div');
    container.className = 'cds-relatorios-filters';
    container.id = 'analytics-filters';

    const row = document.createElement('div');
    row.className = 'cds-relatorios-filters__row';
    row.appendChild(this._filterSelect('empresa', 'Empresa', [
      { value: '', label: 'Todas' },
      { value: 'cremolicia', label: 'Cremolicia' }
    ]));
    row.appendChild(this._filterSelect('filial', 'Filial', [
      { value: '', label: 'Todas' },
      { value: 'matriz', label: 'Matriz' },
      { value: 'filial1', label: 'Filial 1' }
    ]));
    row.appendChild(this._filterSelect('periodo', 'Período', [
      { value: 'today', label: 'Hoje' },
      { value: 'week', label: 'Esta Semana' },
      { value: 'month', label: 'Este Mês' },
      { value: 'quarter', label: 'Este Trimestre' },
      { value: 'year', label: 'Este Ano' }
    ]));
    container.appendChild(row);

    const advancedToggle = document.createElement('button');
    advancedToggle.type = 'button';
    advancedToggle.className = 'cds-relatorios-advanced__toggle';
    advancedToggle.textContent = this.showAdvancedFilters ? 'Ocultar filtros avançados' : 'Mais filtros';
    advancedToggle.addEventListener('click', () => {
      this.showAdvancedFilters = !this.showAdvancedFilters;
      this._renderStep();
    });
    container.appendChild(advancedToggle);

    if (this.showAdvancedFilters) {
      const advanced = document.createElement('div');
      advanced.className = 'cds-relatorios-advanced';
      const advRow = document.createElement('div');
      advRow.className = 'cds-relatorios-filters__row';
      advRow.appendChild(this._filterSelect('situacao', 'Situação', [
        { value: '', label: 'Todas' },
        { value: 'ATIVO', label: 'Ativo' },
        { value: 'BLOQUEADO', label: 'Bloqueado' },
        { value: 'PENDENTE', label: 'Pendente' }
      ]));
      advRow.appendChild(this._filterSelect('tipo', 'Tipo', [
        { value: '', label: 'Todos' },
        { value: 'ENTREGA', label: 'Entrega' },
        { value: 'VENDA', label: 'Venda' },
        { value: 'PAGAMENTO', label: 'Pagamento' },
        { value: 'PERDA', label: 'Perda' }
      ]));
      advRow.appendChild(this._filterSelect('categoria', 'Categoria', [
        { value: '', label: 'Todas' },
        { value: 'COMERCIAL', label: 'Comercial' },
        { value: 'FINANCEIRO', label: 'Financeiro' },
        { value: 'OPERACIONAL', label: 'Operacional' }
      ]));
      advRow.appendChild(this._filterInput('operador', 'Operador'));
      advanced.appendChild(advRow);

      const searchRow = document.createElement('div');
      searchRow.className = 'cds-relatorios-filters__row';
      const searchField = document.createElement('div');
      searchField.className = 'cds-relatorios-filters__field';
      searchField.innerHTML = '<label>Busca no resultado</label>';
      const searchInput = document.createElement('input');
      searchInput.type = 'search';
      searchInput.className = 'cds-input';
      searchInput.dataset.filter = 'search';
      searchInput.placeholder = 'Documento, descrição, operador...';
      searchInput.value = this.filters.search;
      searchInput.addEventListener('input', (e) => { this.filters.search = e.target.value; });
      searchField.appendChild(searchInput);
      searchRow.appendChild(searchField);
      advanced.appendChild(searchRow);
      container.appendChild(advanced);
    }

    const actions = document.createElement('div');
    actions.className = 'cds-relatorios-filters__actions';
    actions.appendChild(Button.create({
      text: 'Gerar Relatório',
      variant: 'primary',
      onClick: () => this._generateReport()
    }));
    actions.appendChild(Button.create({
      text: 'Salvar Favorito',
      variant: 'secondary',
      onClick: () => this._saveFavorite()
    }));
    actions.appendChild(Button.create({
      text: 'Limpar',
      variant: 'ghost',
      onClick: () => this._clearFilters()
    }));
    container.appendChild(actions);
    return container;
  }

  _renderResultsStep() {
    const wrap = document.createElement('div');
    wrap.className = 'cds-relatorios-results';

    const toolbar = document.createElement('div');
    toolbar.className = 'cds-relatorios-results__toolbar';
    toolbar.innerHTML = `
      <div>
        <p class="cds-eyebrow">${this.activeReport.groupLabel || ''}</p>
        <h2 class="cds-subtitle">${this.activeReport.label}</h2>
        <p class="cds-caption">Empresa: ${this.filters.empresa || 'Todas'} · Filial: ${this.filters.filial || 'Todas'} · ${periodLabel(this.filters.periodo)}</p>
      </div>
    `;
    const exportBar = document.createElement('div');
    exportBar.className = 'cds-relatorios-results__export';
    exportBar.appendChild(Button.create({ text: 'PDF', variant: 'secondary', onClick: () => this._exportPdf() }));
    exportBar.appendChild(Button.create({ text: 'Excel', variant: 'secondary', onClick: () => this._exportExcel() }));
    exportBar.appendChild(Button.create({ text: 'Imprimir', variant: 'ghost', onClick: () => window.print() }));
    exportBar.appendChild(Button.create({ text: 'Compartilhar', variant: 'ghost', onClick: () => this._share() }));
    toolbar.appendChild(exportBar);
    wrap.appendChild(toolbar);

    const panel = document.createElement('div');
    panel.className = 'cds-relatorios-results__panel';
    panel.id = 'analytics-viz';
    panel.appendChild(Loading.create({ message: 'Gerando relatório...' }));
    wrap.appendChild(panel);

    return wrap;
  }

  async _generateReport() {
    this.step = 'results';
    this._renderStep();
    await this._executeReport();
    this._startAutoRefresh();
  }

  _filterSelect(name, label, options) {
    const field = document.createElement('div');
    field.className = 'cds-relatorios-filters__field';
    field.innerHTML = `<label>${label}</label>`;
    const select = document.createElement('select');
    select.className = 'cds-input';
    select.dataset.filter = name;
    options.forEach((opt) => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      option.selected = this.filters[name] === opt.value;
      select.appendChild(option);
    });
    select.addEventListener('change', (e) => {
      this.filters[name] = e.target.value;
    });
    field.appendChild(select);
    return field;
  }

  _filterInput(name, label) {
    const field = document.createElement('div');
    field.className = 'cds-relatorios-filters__field';
    field.innerHTML = `<label>${label}</label>`;
    const input = document.createElement('input');
    input.className = 'cds-input';
    input.dataset.filter = name;
    input.value = this.filters[name] || '';
    input.addEventListener('change', (e) => { this.filters[name] = e.target.value; });
    field.appendChild(input);
    return field;
  }

  _getFilterParams() {
    return buildExtendedFilterParams({
      ...this.filters,
      dataInicio: this._periodToDate('start'),
      dataFim: this._periodToDate('end')
    });
  }

  _periodToDate(edge) {
    const now = new Date();
    const start = new Date(now);
    if (this.filters.periodo === 'today') {
      if (edge === 'start') start.setHours(0, 0, 0, 0);
    } else if (this.filters.periodo === 'week') {
      start.setDate(now.getDate() - 7);
    } else if (this.filters.periodo === 'month') {
      start.setMonth(now.getMonth() - 1);
    } else if (this.filters.periodo === 'quarter') {
      start.setMonth(now.getMonth() - 3);
    } else if (this.filters.periodo === 'year') {
      start.setFullYear(now.getFullYear() - 1);
    }
    return edge === 'start' ? start.toISOString() : now.toISOString();
  }

  _selectReport(report, groupId = null) {
    this.activeReport = {
      ...report,
      groupId: groupId || this._findGroupId(report.id),
      groupLabel: this._findGroupLabel(report.id)
    };
    this.activeCategory = this.activeReport.groupId;
    this.step = 'configure';
    this._renderStep();
  }

  _findGroupId(reportId) {
    for (const g of REPORT_CATALOG) {
      if (g.reports.some((r) => r.id === reportId)) return g.id;
    }
    return 'operacionais';
  }

  _findGroupLabel(reportId) {
    for (const g of REPORT_CATALOG) {
      if (g.reports.some((r) => r.id === reportId)) return g.label;
    }
    return 'Operacionais';
  }

  async _executeReport(silent = false) {
    if (!this.activeReport?.id || this.step !== 'results') return;

    const panel = document.getElementById('analytics-viz');
    if (panel && !silent) {
      panel.innerHTML = '';
      panel.appendChild(Loading.create({ message: 'Gerando relatório...' }));
    }

    const start = performance.now();
    const params = this._getFilterParams();
    const report = this.activeReport;
    const projections = [...new Set([...(report.projections || []), 'dashboard', 'indicadores', 'insights'])];

    try {
      const entries = await Promise.all(
        projections.map(async (key) => {
          const loader = PROJECTION_LOADERS[key];
          if (!loader) return [key, null];
          try {
            const data = await loader(this.projectionApi, params);
            return [key, data];
          } catch {
            return [key, null];
          }
        })
      );

      this.payload = Object.fromEntries(entries);
      this.view = buildViewFromPayload(this.payload);
      this.reportView = resolveReportData(report, this.view);
      this.lastUpdated = new Date();
      this.lastExecutionMs = Math.round(performance.now() - start);

      appendHistory({
        reportId: report.id,
        reportLabel: report.label,
        usuario: getOperadorNome(),
        tempoMs: this.lastExecutionMs,
        filtros: { ...this.filters }
      });

      this._renderAllSections();
      this._updateHeaderMeta();
    } catch (error) {
      if (!silent) {
        this._renderSectionError('analytics-viz', error.message);
      }
    }
  }

  _renderAllSections() {
    this._renderVisualization();
  }

  _renderSectionError(id, message) {
    const section = document.getElementById(id);
    if (!section) return;
    section.innerHTML = '';
    section.appendChild(Alert.create({ message, variant: 'error', dismissible: true }));
  }

  _renderVisualization() {
    const section = document.getElementById('analytics-viz');
    if (!section) return;
    section.innerHTML = '';

    const title = document.createElement('h2');
    title.className = 'cds-analytics-section__title';
    title.textContent = `Visualização — ${this.activeReport.label}`;
    section.appendChild(title);

    const meta = document.createElement('p');
    meta.className = 'cds-analytics-section__meta';
    meta.textContent = `Tipo: ${this.reportView.type} | Fontes de dados | ${this.lastExecutionMs || 0}ms`;
    section.appendChild(meta);

    const viz = this.reportView;
    let data = viz.data || [];

    if (viz.type === 'table' || viz.type === 'ranking') {
      data = applySearchFilter(data, this.filters.search);
      this.pagination.total = data.length;
      const start = (this.pagination.page - 1) * this.pagination.pageSize;
      const pageData = data.slice(start, start + this.pagination.pageSize);

      if (!pageData.length) {
        section.appendChild(EmptyState.create({ title: 'Sem dados', description: 'Nenhum registro para os filtros aplicados' }));
        return;
      }

      section.appendChild(Table.create({
        columns: viz.columns || [],
        data: pageData,
        onRowClick: (row) => this._openDrawer(row)
      }));

      if (data.length > this.pagination.pageSize) {
        section.appendChild(Pagination.create({
          page: this.pagination.page,
          pageSize: this.pagination.pageSize,
          total: this.pagination.total,
          onPageChange: (page) => {
            this.pagination.page = page;
            this._renderVisualization();
          }
        }));
      }
      return;
    }

    if (viz.type === 'cards') {
      const grid = document.createElement('div');
      grid.className = 'cds-analytics-cards';
      (data.length ? data : this.view.cards || []).forEach((card) => {
        const el = StatCard.create({
          title: card.title || card.label,
          value: this._formatValue(card.value, card.format),
          color: card.color || 'primary'
        });
        el.classList.add('cds-analytics-card--clickable');
        el.addEventListener('click', () => this._openDrawer(card));
        grid.appendChild(el);
      });
      if (!grid.children.length) {
        section.appendChild(EmptyState.create({ title: 'Sem dados', description: 'Projeção sem valores no período' }));
        return;
      }
      section.appendChild(grid);
      return;
    }

    if (viz.type === 'chart') {
      section.appendChild(GraphContainer.create({
        title: viz.title || this.activeReport.label,
        content: this._renderBarChart(data)
      }));
      return;
    }

    if (viz.type === 'timeline') {
      section.appendChild(Timeline.create({
        events: data,
        emptyTitle: 'Sem eventos',
        emptyDescription: 'Nenhum evento no período'
      }));
      return;
    }

    if (viz.type === 'indicators') {
      const grid = document.createElement('div');
      grid.className = 'cds-analytics-indicators-grid';
      (data || []).forEach((ind) => {
        const el = document.createElement('div');
        el.className = 'cds-analytics-indicator';
        el.innerHTML = `<label>${ind.label}</label><div>${this._formatValue(ind.value, ind.format)}</div>`;
        el.addEventListener('click', () => this._openDrawer(ind));
        grid.appendChild(el);
      });
      section.appendChild(grid);
      return;
    }

    if (viz.type === 'heatmap' || viz.type === 'ranking-grid') {
      this._renderHeatmapSection(section, viz.type === 'ranking-grid' ? this._rankingGridData() : data);
      return;
    }

    section.appendChild(EmptyState.create({ title: 'Sem visualização', description: 'Selecione outro relatório do catálogo' }));
  }

  _rankingGridData() {
    const r = this.view.rankings || {};
    return [
      { label: 'Top Clientes', items: r.topClientes || [] },
      { label: 'Top Produtos', items: r.topProdutos || [] },
      { label: 'Top Operadores', items: r.topOperadores || [] },
      { label: 'Maior Conversão', items: r.maiorConversao || [] },
      { label: 'Maior Recebimento', items: r.maiorRecebimento || [] },
      { label: 'Maior Perda', items: r.maiorPerda || [] },
      { label: 'Maior Ticket', items: r.maiorTicket || [] }
    ];
  }

  _renderHeatmapSection(section, sections) {
    if (!sections?.length) {
      section.appendChild(EmptyState.create({ title: 'Sem comparativos', description: 'API sem dados comparativos no período' }));
      return;
    }
    sections.forEach((block) => {
      const blockEl = document.createElement('div');
      blockEl.className = 'cds-analytics-heatmap-block';
      const h = document.createElement('h3');
      h.textContent = block.label;
      blockEl.appendChild(h);

      const grid = document.createElement('div');
      grid.className = 'cds-analytics-heatmap';
      (block.items || []).forEach((item) => {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'cds-analytics-heatmap__cell';
        cell.innerHTML = `
          <span class="cds-analytics-heatmap__label">${item.label || item.nome || '-'}</span>
          <span class="cds-analytics-heatmap__atual">${this._formatValue(item.atual ?? item.valor, 'number')}</span>
          <span class="cds-analytics-heatmap__anterior">${this._formatValue(item.anterior, 'number')}</span>
          ${item.variacao != null ? `<span class="cds-analytics-heatmap__var">${item.variacao}%</span>` : ''}
        `;
        cell.addEventListener('click', () => this._openDrawer(item));
        grid.appendChild(cell);
      });
      if (!grid.children.length) {
        const empty = document.createElement('p');
        empty.textContent = 'Sem itens';
        blockEl.appendChild(empty);
      } else {
        blockEl.appendChild(grid);
      }
      section.appendChild(blockEl);
    });
  }

  _renderBarChart(series) {
    const container = document.createElement('div');
    container.className = 'cds-analytics-chart';
    if (!series?.length) {
      container.textContent = 'Sem dados para gráfico';
      return container;
    }
    const max = Math.max(...series.map((s) => Number(s.valor ?? s.total ?? s.quantidade ?? 0)), 1);
    series.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'cds-analytics-chart__row';
      const val = Number(item.valor ?? item.total ?? item.quantidade ?? 0);
      const pct = Math.round((val / max) * 100);
      row.innerHTML = `
        <span class="cds-analytics-chart__label">${item.periodo || item.label || item.data || '-'}</span>
        <div class="cds-analytics-chart__bar"><div style="width:${pct}%"></div></div>
        <span class="cds-analytics-chart__value">${this._formatValue(val, 'currency')}</span>
      `;
      row.addEventListener('click', () => this._openDrawer(item));
      container.appendChild(row);
    });
    return container;
  }

  _renderIndicators() {
    const section = document.getElementById('analytics-indicators');
    if (!section) return;
    section.innerHTML = '';

    const title = document.createElement('h2');
    title.className = 'cds-analytics-section__title';
    title.textContent = 'Indicadores';
    section.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'cds-analytics-indicators-grid';
    (this.view.indicators || []).forEach((ind) => {
      const el = document.createElement('div');
      el.className = 'cds-analytics-indicator cds-analytics-indicator--clickable';
      el.innerHTML = `<label>${ind.label}</label><div>${this._formatValue(ind.value, ind.format)}</div>`;
      el.addEventListener('click', () => this._openDrawer(ind));
      grid.appendChild(el);
    });
    section.appendChild(grid);
  }

  _renderInsights() {
    const section = document.getElementById('analytics-insights');
    if (!section) return;
    section.innerHTML = '';

    const title = document.createElement('h2');
    title.className = 'cds-analytics-section__title';
    title.textContent = 'Análises Comerciais';
    section.appendChild(title);

    const groups = buildInsightGroups(this.payload.dashboard || {}, this.payload.insights || {});
    const labels = {
      alertas: 'Alertas',
      riscos: 'Riscos',
      oportunidades: 'Oportunidades',
      tendencias: 'Tendências',
      anomalias: 'Anomalias',
      recomendacoes: 'Recomendações'
    };

    let hasAny = false;
    Object.entries(groups).forEach(([key, items]) => {
      if (!items.length) return;
      hasAny = true;
      const h = document.createElement('h3');
      h.textContent = labels[key] || key;
      section.appendChild(h);

      items.forEach((ins) => {
        const card = document.createElement('div');
        card.className = 'cds-analytics-insight';
        const header = document.createElement('div');
        header.className = 'cds-analytics-insight__header';
        const strong = document.createElement('strong');
        strong.textContent = ins.titulo || ins.mensagem || ins.tipo;
        header.appendChild(strong);
        header.appendChild(Badge.create({ text: ins.severidade || ins.grupo || 'INFO', variant: 'info' }));
        card.appendChild(header);
        const p = document.createElement('p');
        p.textContent = ins.mensagem || ins.acaoRecomendada || '';
        card.appendChild(p);
        card.addEventListener('click', () => this._openDrawer(ins));
        section.appendChild(card);
      });
    });

    if (!hasAny) {
      section.appendChild(EmptyState.create({ title: 'Sem insights', description: 'Nenhum insight no período' }));
    }
  }

  _renderRankings() {
    const section = document.getElementById('analytics-rankings');
    if (!section) return;
    section.innerHTML = '';

    const title = document.createElement('h2');
    title.className = 'cds-analytics-section__title';
    title.textContent = 'Rankings';
    section.appendChild(title);

    this._renderHeatmapSection(section, this._rankingGridData().filter((b) => b.items?.length));
    if (!section.querySelector('.cds-analytics-heatmap-block')) {
      section.appendChild(EmptyState.create({ title: 'Sem rankings', description: 'Projeção sem rankings no período' }));
    }
  }

  _renderComparativos() {
    const section = document.getElementById('analytics-comparativos');
    if (!section) return;
    section.innerHTML = '';

    const title = document.createElement('h2');
    title.className = 'cds-analytics-section__title';
    title.textContent = 'Comparativos';
    section.appendChild(title);

    const blocks = this.view.comparativos || [];
    if (!blocks.some((b) => b.items?.length)) {
      section.appendChild(EmptyState.create({ title: 'Sem comparativos', description: 'Dados comparativos indisponíveis na projeção' }));
      return;
    }
    this._renderHeatmapSection(section, blocks.filter((b) => b.items?.length));
  }

  _renderFavorites() {
    const section = document.getElementById('analytics-favorites');
    if (!section) return;
    section.innerHTML = '';

    const title = document.createElement('h2');
    title.className = 'cds-analytics-section__title';
    title.textContent = 'Favoritos';
    section.appendChild(title);

    const favorites = loadFavorites();
    if (!favorites.length) {
      section.appendChild(EmptyState.create({ title: 'Sem favoritos', description: 'Salve filtros ou relatórios frequentes' }));
      return;
    }

    favorites.forEach((fav) => {
      const row = document.createElement('div');
      row.className = 'cds-analytics-favorite';
      row.innerHTML = `
        <div>
          <strong>${fav.nome || fav.reportLabel || 'Favorito'}</strong>
          <span>${fav.reportLabel || fav.tipo || ''} — ${new Date(fav.savedAt).toLocaleString('pt-BR')}</span>
        </div>
      `;
      const actions = document.createElement('div');
      actions.className = 'cds-analytics-favorite__actions';
      actions.appendChild(Button.create({ text: 'Aplicar', variant: 'primary', onClick: () => this._applyFavorite(fav) }));
      actions.appendChild(Button.create({ text: 'Remover', variant: 'ghost', onClick: () => { removeFavorite(fav.id); this._renderFavorites(); } }));
      row.appendChild(actions);
      section.appendChild(row);
    });
  }

  _renderHistory() {
    const section = document.getElementById('analytics-history');
    if (!section) return;
    section.innerHTML = '';

    const title = document.createElement('h2');
    title.className = 'cds-analytics-section__title';
    title.textContent = 'Histórico de Execuções';
    section.appendChild(title);

    const history = loadHistory();
    if (!history.length) {
      section.appendChild(EmptyState.create({ title: 'Sem histórico', description: 'Execute relatórios para registrar histórico' }));
      return;
    }

    section.appendChild(Table.create({
      columns: [
        { key: 'executedAt', label: 'Data' },
        { key: 'reportLabel', label: 'Relatório' },
        { key: 'usuario', label: 'Usuário' },
        { key: 'tempoMs', label: 'Tempo (ms)' },
        { key: 'filtrosResumo', label: 'Filtros' }
      ],
      data: history.slice(0, 15).map((h) => ({
        executedAt: new Date(h.executedAt).toLocaleString('pt-BR'),
        reportLabel: h.reportLabel,
        usuario: h.usuario,
        tempoMs: h.tempoMs,
        filtrosResumo: `Período: ${h.filtros?.periodo || '-'} | Cliente: ${h.filtros?.clienteId || 'Todos'}`,
        _raw: h
      })),
      onRowClick: (row) => this._applyFavorite({ filters: row._raw.filtros, reportId: row._raw.reportId })
    }));
  }

  _openDrawer(item) {
    if (this.activeDrawer?.parentNode) {
      this.activeDrawer.remove();
      this.activeDrawer = null;
    }

    const content = document.createElement('div');
    const detail = new IndicadorDrawer(this, item);
    detail.mount(content);

    const drawer = Drawer.create({
      title: 'Detalhe Analítico',
      content,
      size: 'lg',
      open: true,
      onClose: () => { this.activeDrawer = null; }
    });

    this.activeDrawer = drawer;
    document.body.appendChild(drawer);
  }

  _applyFavorite(fav) {
    if (fav.filters) Object.assign(this.filters, fav.filters);
    if (fav.filtros) Object.assign(this.filters, fav.filtros);
    if (fav.reportId) {
      this.activeReport = findReport(fav.reportId);
      this.activeCategory = this.activeReport.groupId || this._findGroupId(fav.reportId);
    }
    this.step = 'configure';
    this._renderStep();
    notify('Favorito aplicado.', 'success');
  }

  _syncFilterInputs() {
    const container = document.getElementById('analytics-filters');
    if (!container) return;
    container.querySelectorAll('select, input').forEach((el) => {
      const key = el.dataset?.filter;
      if (key && this.filters[key] !== undefined) el.value = this.filters[key];
    });
  }

  async _saveFavorite() {
    const nome = await promptDialog({ title: 'Salvar Favorito', label: 'Nome do favorito', placeholder: 'Ex: Recebimentos do mês' });
    if (!nome) return;
    saveFavorite({
      id: `fav-${Date.now()}`,
      nome,
      reportId: this.activeReport.id,
      reportLabel: this.activeReport.label,
      filters: { ...this.filters },
      tipo: 'filtro-relatorio'
    });
    saveLayout({
      reportId: this.activeReport.id,
      viz: this.activeReport.viz,
      periodo: this.filters.periodo
    });
    notify('Favorito salvo.', 'success');
  }

  async _loadFavorite() {
    const favorites = loadFavorites();
    if (!favorites.length) {
      notify('Nenhum favorito salvo.', 'info');
      return;
    }
    const choice = await choiceDialog({
      title: 'Carregar Favorito',
      message: 'Selecione um favorito:',
      options: favorites.map((f) => ({ value: f.id, label: `${f.nome} (${f.reportLabel})` }))
    });
    if (!choice) return;
    const fav = favorites.find((f) => f.id === choice);
    if (fav) this._applyFavorite(fav);
  }

  _clearFilters() {
    this.filters = {
      empresa: '', filial: '', clienteId: '', produtoId: '', consignacaoId: '',
      operador: '', situacao: '', periodo: 'month', tipo: '', categoria: '', search: ''
    };
    this.pagination.page = 1;
    this.showAdvancedFilters = false;
    this._renderStep();
  }

  _updateHeaderMeta() {
    const el = document.getElementById('analytics-updated');
    if (el && this.lastUpdated) {
      el.textContent = `Última execução: ${this.lastUpdated.toLocaleString('pt-BR')} (${this.lastExecutionMs}ms)`;
    }
  }

  _startAutoRefresh() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.refreshTimer = setInterval(() => this._executeReport(true), REFRESH_INTERVAL_MS);
  }

  async _exportMenu() {
    const format = await choiceDialog({
      title: 'Exportar Relatório',
      message: 'Selecione o formato:',
      options: [
        { value: 'csv', label: 'Planilha' },
        { value: 'xlsx', label: 'Excel (.xlsx)' },
        { value: 'pdf', label: 'PDF' }
      ]
    });
    if (!format) return;
    if (format === 'pdf') this._exportPdf();
    else if (format === 'xlsx') this._exportExcel();
    else this._exportCsv();
  }

  _exportPdf() {
    const viz = this.reportView;
    if (viz?.type === 'table' || viz?.type === 'ranking') {
      const cols = viz.columns || [];
      const data = applySearchFilter(viz.data || [], this.filters.search);
      const result = exportToPdf({
        title: `Relatório — ${this.activeReport.label}`,
        headers: cols.map((c) => c.label),
        rows: data.map((row) => cols.map((c) => row[c.key] ?? '')),
        filename: `relatorio-${this.activeReport.id}.pdf`
      });
      notify(result.ok ? 'PDF exportado.' : (result.message || 'Não foi possível exportar o PDF.'), result.ok ? 'success' : 'error');
      return;
    }
    const pairs = (this.view.indicators || []).map((i) => [i.label, i.value]);
    const result = exportToPdf({
      title: `Relatório — ${this.activeReport.label}`,
      headers: ['Indicador', 'Valor'],
      rows: pairs,
      filename: `relatorio-${this.activeReport.id}.pdf`
    });
    notify(result.ok ? 'PDF exportado.' : (result.message || 'Não foi possível exportar o PDF.'), result.ok ? 'success' : 'error');
  }

  _exportExcel() {
    const viz = this.reportView;
    if (viz?.type === 'table' || viz?.type === 'ranking') {
      const cols = viz.columns || [];
      const data = applySearchFilter(viz.data || [], this.filters.search);
      exportToXlsx(
        cols.map((c) => c.label),
        data.map((row) => cols.map((c) => row[c.key] ?? '')),
        `relatorio-${this.activeReport.id}.xlsx`
      );
      notify('Excel exportado.', 'success');
      return;
    }
    const pairs = (this.view.indicators || []).map((i) => [i.label, i.value]);
    exportToXlsx(['Indicador', 'Valor'], pairs, `relatorio-${this.activeReport.id}.xlsx`);
    notify('Excel exportado.', 'success');
  }

  _exportCsv(format = 'csv') {
    const viz = this.reportView;
    let rows = [];
    if (viz.type === 'table' || viz.type === 'ranking') {
      const cols = viz.columns || [];
      rows = applySearchFilter(viz.data || [], this.filters.search).map((row) =>
        cols.map((c) => row[c.key] ?? '').join('\t')
      );
      const header = cols.map((c) => c.label).join('\t');
      const content = `\uFEFF${header}\n${rows.join('\n')}`;
      this._download(content, `relatorio-${this.activeReport.id}.${format === 'xls' ? 'xls' : 'csv'}`, format === 'xls' ? 'application/vnd.ms-excel' : 'text/csv');
      return;
    }
    rows = (this.view.indicators || []).map((i) => `${i.label}\t${i.value}`);
    const content = `\uFEFFIndicador\tValor\n${rows.join('\n')}`;
    this._download(content, `relatorio-${this.activeReport.id}.csv`, 'text/csv');
  }

  _download(content, filename, mime) {
    const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    notify('Exportação concluída.', 'success');
  }

  async _scheduleInfo() {
    await confirmDialog({
      title: 'Agendamento',
      message: 'Arquitetura preparada para envio automático por Email, WhatsApp e Portal. Implementação em sprint futura.',
      confirmLabel: 'Entendi',
      cancelLabel: 'Fechar'
    });
  }

  _share() {
    const url = `${window.location.origin}${window.location.pathname}#/relatorios?relatorio=${this.activeReport.id}&periodo=${this.filters.periodo}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
      notify('Link copiado para a área de transferência.', 'success');
    } else {
      notify(url, 'info');
    }
  }

  _formatValue(value, format) {
    if (value == null || value === '') return '-';
    if (format === 'currency') return this._formatCurrency(value);
    if (format === 'percent') return `${value}%`;
    if (format === 'days') return `${value} dias`;
    return String(value);
  }

  _formatCurrency(value) {
    const num = Number(value);
    if (Number.isNaN(num)) return String(value);
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}

module.exports = RelatoriosPage;
