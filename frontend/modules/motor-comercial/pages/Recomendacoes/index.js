/**
 * Central de Recomendações Comerciais — Motor de Recomendações
 *
 * Sprint O-9.
 *
 * @module frontend/modules/motor-comercial/pages/Recomendacoes
 */

const DashboardLayout = require('../../components/layouts/DashboardLayout');
const Button = require('../../components/base/Button');
const StatCard = require('../../components/data/StatCard');
const Table = require('../../components/data/Table');
const Loading = require('../../components/base/Loading');
const EmptyState = require('../../components/base/EmptyState');
const Alert = require('../../components/base/Alert');
const Badge = require('../../components/base/Badge');
const Drawer = require('../../components/special/Drawer');
const ProjectionApi = require('../../api/ProjectionApi');
const RecomendacoesDrawer = require('./RecomendacoesDrawer');
const {
  buildViewFromPayload,
  buildFilterParams,
  applyFilters,
  saveRecomendacaoAction,
  toggleFavorite,
  loadHistory,
  priorityVariant,
  categoriaLabel
} = require('./recomendacoesMappers');
const { notify, navigate, confirmDialog, promptDialog } = require('../../utils/operacional');
const {
  parseCliente360Context,
  resolveBackPath,
  routeWithActiveContext,
  getBackButtonLabel
} = require('../../utils/cliente360Context');

const REFRESH_INTERVAL_MS = 60000;

function getOperadorNome() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.nome || user?.username || 'Operador';
  } catch {
    return 'Operador';
  }
}

class RecomendacoesPage {
  constructor(routeParams = {}, routeQuery = {}) {
    this.routeParams = routeParams;
    this.routeQuery = routeQuery;
    this.navigationContext = parseCliente360Context(routeQuery);
    this.projectionApi = new ProjectionApi();
    this.payload = {};
    this.view = {};
    this.filteredView = {};
    this.lastUpdated = null;
    this.refreshTimer = null;
    this.activeDrawer = null;
    this.searchTimeout = null;

    this.filters = {
      categoria: routeQuery.categoria || '',
      prioridade: routeQuery.prioridade || '',
      status: routeQuery.status || '',
      clienteId: routeQuery.clienteId || '',
      periodo: routeQuery.periodo || 'week',
      search: routeQuery.q || '',
      favoritos: routeQuery.favoritos === '1'
    };
  }

  static create(params = {}, query = {}) {
    return new RecomendacoesPage(params, query).render();
  }

  render() {
    const layout = DashboardLayout.create({
      header: this._createHeader(),
      sidebar: this._createSidebar(),
      content: this._createContent(),
      footer: this._createFooter()
    });

    setTimeout(() => {
      this._loadData();
      this._startAutoRefresh();
    }, 0);

    return layout;
  }

  _createHeader() {
    const container = document.createElement('div');
    container.className = 'cds-recomendacoes-header';
    container.innerHTML = `
      <div class="cds-recomendacoes-header__left">
        <h1>Motor de Recomendações Comerciais</h1>
        <p>Apoio à decisão — sugestões derivadas de análises e projeções</p>
        <span id="recomendacoes-updated">Atualizando...</span>
      </div>
    `;
    const actions = document.createElement('div');
    actions.className = 'cds-recomendacoes-header__actions';
    if (this.navigationContext.locked) {
      actions.appendChild(Button.create({
        text: getBackButtonLabel(this.navigationContext, 'Voltar'),
        variant: 'ghost',
        onClick: () => navigate(resolveBackPath(this.navigationContext, '/clientes'))
      }));
    }
    actions.appendChild(Button.create({ text: 'Atualizar', variant: 'secondary', icon: '🔄', onClick: () => this._loadData() }));
    actions.appendChild(Button.create({ text: 'PDF', variant: 'ghost', onClick: () => this._export('pdf') }));
    actions.appendChild(Button.create({ text: 'Excel', variant: 'ghost', onClick: () => this._export('excel') }));
    actions.appendChild(Button.create({ text: 'Planilha', variant: 'ghost', onClick: () => this._export('csv') }));
    actions.appendChild(Button.create({
      text: 'Iniciar Guia Operacional',
      variant: 'primary',
      icon: '📋',
      onClick: () => navigate(routeWithActiveContext('/playbooks', this.navigationContext))
    }));
    container.appendChild(actions);
    return container;
  }

  _createSidebar() {
    const nav = document.createElement('nav');
    nav.className = 'cds-recomendacoes-sidebar';
    [
      { label: 'Painel', path: '/' },
      { label: 'Pendências', path: '/pendencias' },
      { label: 'Recomendações', path: '/recomendacoes', active: true },
      { label: 'Guias Operacionais', path: '/playbooks' },
      { label: 'Consignações', path: '/consignacoes' },
      { label: 'Clientes', path: '/clientes' },
      { label: 'Relatórios', path: '/relatorios' }
    ].forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `cds-recomendacoes-sidebar__item${item.active ? ' cds-recomendacoes-sidebar__item--active' : ''}`;
      btn.textContent = item.label;
      btn.addEventListener('click', () => navigate(routeWithActiveContext(item.path, this.navigationContext)));
      nav.appendChild(btn);
    });
    return nav;
  }

  _createFooter() {
    const f = document.createElement('div');
    f.className = 'cds-recomendacoes-footer';
    f.textContent = 'Motor de Recomendações — CDS Platform';
    return f;
  }

  _createContent() {
    const wrap = document.createElement('div');
    wrap.className = 'cds-recomendacoes-content';
    wrap.id = 'recomendacoes-root';
    wrap.appendChild(this._createFilters());
    wrap.appendChild(this._host('rec-resumo', 'Carregando resumo...'));
    wrap.appendChild(this._host('rec-kpis', 'Carregando KPIs...'));
    wrap.appendChild(this._host('rec-categorias', 'Carregando categorias...'));
    wrap.appendChild(this._host('rec-lista', 'Carregando recomendações...'));
    wrap.appendChild(this._host('rec-historico', 'Carregando histórico...'));
    return wrap;
  }

  _host(id, msg) {
    const s = document.createElement('section');
    s.className = 'cds-recomendacoes-section';
    s.id = id;
    s.appendChild(Loading.create({ message: msg }));
    return s;
  }

  _createFilters() {
    const c = document.createElement('div');
    c.className = 'cds-recomendacoes-filters';
    const row = document.createElement('div');
    row.className = 'cds-recomendacoes-filters__row';

    row.appendChild(this._select('categoria', 'Categoria', [
      ['', 'Todas'], ['CREDITO', 'Crédito'], ['COMERCIAL', 'Comercial'],
      ['FINANCEIRO', 'Financeiro'], ['OPERACIONAL', 'Operacional'], ['ESTRATEGICO', 'Estratégico']
    ]));
    row.appendChild(this._select('prioridade', 'Prioridade', [
      ['', 'Todas'], ['URGENT', 'Urgente'], ['HIGH', 'Alta'], ['NORMAL', 'Normal'], ['LOW', 'Baixa']
    ]));
    row.appendChild(this._select('status', 'Status', [
      ['', 'Todos'], ['NOVA', 'Nova'], ['VISUALIZADA', 'Visualizada'], ['ACEITA', 'Aceita']
    ]));

    const search = document.createElement('input');
    search.type = 'search';
    search.placeholder = 'Pesquisar...';
    search.value = this.filters.search;
    search.addEventListener('input', (e) => {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.filters.search = e.target.value;
        this._applyAndRender();
      }, 300);
    });
    row.appendChild(search);

    row.appendChild(Button.create({
      text: this.filters.favoritos ? '★ Favoritos' : '☆ Favoritos',
      variant: this.filters.favoritos ? 'primary' : 'ghost',
      onClick: () => { this.filters.favoritos = !this.filters.favoritos; this._applyAndRender(); }
    }));

    c.appendChild(row);
    return c;
  }

  _select(name, label, options) {
    const f = document.createElement('div');
    f.innerHTML = `<label>${label}</label>`;
    const sel = document.createElement('select');
    options.forEach(([v, t]) => {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = t;
      o.selected = this.filters[name] === v;
      sel.appendChild(o);
    });
    sel.addEventListener('change', (e) => { this.filters[name] = e.target.value; this._applyAndRender(); });
    f.appendChild(sel);
    return f;
  }

  async _loadData(silent = false) {
    try {
      const params = buildFilterParams({
        clienteId: this.filters.clienteId || undefined,
        dataInicio: this._periodStart(),
        dataFim: new Date().toISOString()
      });
      this.payload = await this.projectionApi.obterProjecaoRecomendacoes(params);
      this.view = buildViewFromPayload(this.payload);
      this._applyAndRender();
      this.lastUpdated = new Date();
      const el = document.getElementById('recomendacoes-updated');
      if (el) el.textContent = `Atualizado: ${this.lastUpdated.toLocaleTimeString('pt-BR')}`;
    } catch (error) {
      if (!silent) {
        const s = document.getElementById('rec-resumo');
        if (s) { s.innerHTML = ''; s.appendChild(Alert.create({ message: error.message, variant: 'error' })); }
      }
    }
  }

  _periodStart() {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString();
  }

  _applyAndRender() {
    this.filteredView = applyFilters(this.view, this.filters);
    this._renderResumo();
    this._renderKpis();
    this._renderCategorias();
    this._renderLista();
    this._renderHistorico();
  }

  _renderResumo() {
    const s = document.getElementById('rec-resumo');
    if (!s) return;
    s.innerHTML = '<h2>Resumo</h2>';
    const g = document.createElement('div');
    g.className = 'cds-recomendacoes-resumo';
    const r = this.filteredView.resumo || {};
    [
      { title: 'Total', value: r.total ?? this.filteredView.recomendacoes.length, color: 'primary' },
      { title: 'Prioritárias', value: this.filteredView.prioritarias?.length ?? 0, color: 'warning' }
    ].forEach((c) => g.appendChild(StatCard.create(c)));
    s.appendChild(g);
  }

  _renderKpis() {
    const s = document.getElementById('rec-kpis');
    if (!s) return;
    s.innerHTML = '<h2>KPIs de Recomendações</h2>';
    const k = this.filteredView.kpis || {};
    const g = document.createElement('div');
    g.className = 'cds-recomendacoes-kpis';
    [
      { title: 'Emitidas', value: k.emitidas, format: 'number' },
      { title: 'Aceitas', value: k.aceitas, format: 'number', color: 'success' },
      { title: 'Ignoradas', value: k.ignoradas, format: 'number', color: 'default' },
      { title: 'Concluídas', value: k.concluidas, format: 'number', color: 'info' },
      { title: 'Taxa Aceitação', value: k.taxaAceitacao, format: 'percent' },
      { title: 'Impacto Médio', value: k.impactoEstimadoTotal, format: 'number' }
    ].forEach((c) => g.appendChild(StatCard.create(c)));
    s.appendChild(g);
  }

  _renderCategorias() {
    const s = document.getElementById('rec-categorias');
    if (!s) return;
    s.innerHTML = '<h2>Categorias</h2>';
    const g = document.createElement('div');
    g.className = 'cds-recomendacoes-categorias';
    Object.entries(this.filteredView.categorias || {}).forEach(([cat, items]) => {
      if (!items.length) return;
      const card = document.createElement('div');
      card.className = 'cds-recomendacoes-categoria';
      card.innerHTML = `<strong>${categoriaLabel(cat)}</strong><span>${items.length}</span>`;
      card.addEventListener('click', () => { this.filters.categoria = cat; this._applyAndRender(); });
      g.appendChild(card);
    });
    if (!g.childElementCount) g.appendChild(EmptyState.create({ title: 'Sem categorias', description: 'Nenhuma recomendação' }));
    s.appendChild(g);
  }

  _renderLista() {
    const s = document.getElementById('rec-lista');
    if (!s) return;
    s.innerHTML = '<h2>Recomendações</h2>';
    const list = this.filteredView.recomendacoes || [];
    if (!list.length) {
      s.appendChild(EmptyState.create({ title: 'Sem recomendações', description: 'As análises não geraram sugestões no momento' }));
      return;
    }
    s.appendChild(Table.create({
      columns: [
        { key: 'fav', label: '' },
        { key: 'titulo', label: 'Título' },
        { key: 'categoria', label: 'Categoria' },
        { key: 'prioridade', label: 'Prioridade' },
        { key: 'confianca', label: 'Confiança' },
        { key: 'status', label: 'Status' },
        { key: 'acoes', label: '' }
      ],
      data: list.map((r) => ({
        id: r.id,
        fav: Button.create({ text: r.favorito ? '★' : '☆', variant: 'ghost', onClick: (e) => { e.stopPropagation(); toggleFavorite(r.id); this._applyAndRender(); } }),
        titulo: r.titulo,
        categoria: Badge.create({ text: categoriaLabel(r.categoria), variant: 'info' }),
        prioridade: Badge.create({ text: r.prioridade, variant: priorityVariant(r.prioridade) }),
        confianca: `${r.confianca}%`,
        status: r.status,
        acoes: this._rowActions(r),
        _raw: r
      })),
      onRowClick: (row) => this._openDrawer(row._raw)
    }));
  }

  _rowActions(r) {
    const w = document.createElement('div');
    w.appendChild(Button.create({ text: '✓', variant: 'ghost', title: 'Aceitar', onClick: (e) => { e.stopPropagation(); this._acceptRec(r); } }));
    return w;
  }

  _renderHistorico() {
    const s = document.getElementById('rec-historico');
    if (!s) return;
    s.innerHTML = '<h2>Histórico</h2>';
    const h = loadHistory();
    if (!h.length) {
      s.appendChild(EmptyState.create({ title: 'Sem histórico', description: 'Ações aparecerão aqui' }));
      return;
    }
    s.appendChild(Table.create({
      columns: [
        { key: 'titulo', label: 'Recomendação' },
        { key: 'acao', label: 'Ação' },
        { key: 'responsavel', label: 'Quem' },
        { key: 'quando', label: 'Quando' },
        { key: 'resultado', label: 'Resultado' }
      ],
      data: h.slice(0, 20).map((x) => ({
        titulo: x.titulo,
        acao: x.acao,
        responsavel: x.responsavel || '-',
        quando: x.quando ? new Date(x.quando).toLocaleString('pt-BR') : '-',
        resultado: x.resultado || '-'
      }))
    }));
  }

  async _openDrawer(rec) {
    if (this.activeDrawer) { this.activeDrawer.remove(); this.activeDrawer = null; }
    const content = document.createElement('div');
    await new RecomendacoesDrawer(this, rec).mount(content);
    const drawer = Drawer.create({ title: rec.titulo, content, size: 'lg', open: true, onClose: () => { this.activeDrawer = null; } });
    this.activeDrawer = drawer;
    document.body.appendChild(drawer);
  }

  _markViewed(rec) { saveRecomendacaoAction('viewed', rec); }

  async _acceptRec(rec) {
    const ok = await confirmDialog({ title: 'Aceitar recomendação', message: `Aceitar "${rec.titulo}"? Nenhuma ação será executada automaticamente.` });
    if (!ok) return;
    saveRecomendacaoAction('accepted', rec, { responsavel: getOperadorNome() });
    notify('Recomendação aceita — execute a ação manualmente', 'success');
    this._loadData(true);
  }

  async _ignoreRec(rec) {
    const ok = await confirmDialog({ title: 'Ignorar', message: `Ignorar "${rec.titulo}"?` });
    if (!ok) return;
    saveRecomendacaoAction('ignored', rec);
    notify('Recomendação ignorada', 'info');
    this._loadData(true);
  }

  async _deferRec(rec) {
    const dias = await promptDialog({ title: 'Adiar', message: 'Adiar por quantos dias?', defaultValue: '1' });
    if (dias == null) return;
    const until = new Date();
    until.setDate(until.getDate() + Number(dias || 1));
    saveRecomendacaoAction('deferred', rec, { until: until.toISOString() });
    notify('Recomendação adiada', 'info');
    this._loadData(true);
  }

  async _completeRec(rec) {
    const ok = await confirmDialog({ title: 'Concluir', message: `Marcar "${rec.titulo}" como concluída?` });
    if (!ok) return;
    saveRecomendacaoAction('completed', rec, { responsavel: getOperadorNome() });
    notify('Recomendação concluída', 'success');
    this._loadData(true);
  }

  _export(format) {
    const rows = this.filteredView.recomendacoes || [];
    if (!rows.length) { notify('Nada para exportar', 'warning'); return; }
    const header = ['Título', 'Categoria', 'Prioridade', 'Confiança', 'Status', 'Cliente'];
    const lines = rows.map((r) => [r.titulo, r.categoria, r.prioridade, r.confianca, r.status, r.cliente || ''].join(','));
    const csv = [header.join(','), ...lines].join('\n');
    if (format === 'csv' || format === 'excel') {
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `recomendacoes.${format === 'excel' ? 'csv' : 'csv'}`;
      a.click();
    } else {
      notify('Exportação PDF disponível em sprint futura — use Planilha', 'info');
    }
  }

  _startAutoRefresh() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.refreshTimer = setInterval(() => {
      if (!document.getElementById('recomendacoes-root')) { clearInterval(this.refreshTimer); return; }
      this._loadData(true);
    }, REFRESH_INTERVAL_MS);
  }
}

module.exports = RecomendacoesPage;
