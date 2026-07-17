/**
 * Preparar Entrega — fluxo operacional de Nova Consignação (UX-20).
 *
 * Shell: Shared UI Workspace. Sem sidebar / assistente duplicado.
 *
 * @module frontend/modules/motor-comercial/pages/NovaConsignacao
 */

const Workspace = require('../../../../shared/ui/Workspace');
const Stepper = require('../../components/navigation/Stepper');
const Button = require('../../components/base/Button');
const Alert = require('../../components/base/Alert');
const MotorComercialApi = require('../../api/MotorComercialApi');
const ProjectionApi = require('../../api/ProjectionApi');
const { DirtyState } = require('../../form');
const {
  notify,
  navigate,
  confirmDialog,
  buscarClientesErp,
  buscarClientePorIdErp,
  cacheItensConsignacao,
  carregarConsignacaoCompleta,
  withLoading,
  getUsuarioId
} = require('../../utils/operacional');
const {
  solicitarLiberacaoLimite,
  buildFingerprintLimite,
  liberacaoCompativel,
  salvarLiberacaoSessao
} = require('../../utils/autorizacaoGerencial');
const { obterOpcoesOrganizacao } = require('../../config/comercialOrganizacao');
const LIP = require('../../../../shared/components/LIP');
const {
  visualizarTermo,
  imprimirTermo
} = require('../../services/TermoEntregaConsignacaoService');
const {
  parseNavigationContext,
  buildRouteWithCliente360Context,
  buildRouteWithCentralTrabalhoContext,
  resolveBackPath,
  getBackButtonLabel,
  ORIGEM_CENTRAL_TRABALHO,
  ORIGEM_CLIENTE_360
} = require('../../utils/cliente360Context');
const { extrairCapacidadesDosPerfis } = require('../PerfilComercial/capacidadesComerciais');
const PrepararEntregaView = require('./PrepararEntregaView');
const {
  FLUXO_MOMENTOS,
  inicializarSteps,
  buildValidacoesConferencia,
  buildPainelResumo,
  simularInclusaoProduto,
  formatCurrency,
  formatDate
} = require('./prepararEntregaMappers');
const {
  ensureRegistered,
  RecoveryStatus,
  Operations,
  savePrepararEntrega,
  autosavePrepararEntrega,
  rebindPrepararEntrega,
  saveEntrega,
  saveAuthorization,
  loadAuthorization,
  resumePrepararEntrega,
  listPendingMotorComercial,
  operationalMessage,
  resolveEntityId,
  RecoveryManager
} = require('../../recovery');

const REFRESH_CLIENTE_DEBOUNCE = 320;

class NovaConsignacaoPage {
  constructor(routeParams = {}, routeQuery = {}) {
    this.routeParams = routeParams;
    this.routeQuery = routeQuery;
    this.navigationContext = parseNavigationContext(routeQuery);
    this.clienteLocked = this.navigationContext.locked;
    this.skipClienteStep = this.navigationContext.skipClienteSelection;
    this.api = new MotorComercialApi();
    this.projectionApi = new ProjectionApi();
    const org = obterOpcoesOrganizacao();
    this.orgOptions = org;

    this.steps = inicializarSteps(this.skipClienteStep);
    this.currentStep = this.skipClienteStep ? 1 : 0;
    this.concluido = false;
    this.documentoCriado = null;
    this.consignacaoId = null;

    this.data = {
      cliente: null,
      clienteId: null,
      perfilComercialId: null,
      documentoPreview: 'Será gerado ao salvar',
      documentoNumero: null,
      documentoExterno: '',
      empresa: org.empresaDefault,
      filial: org.filialDefault,
      empresaLocked: org.empresaLocked,
      filialLocked: org.filialLocked,
      data: new Date().toISOString().split('T')[0],
      dataPrevista: '',
      observacoes: '',
      itens: []
    };

    this.clienteProfile = null;
    this.clienteBusca = '';
    this.clienteResultados = [];
    this.clienteSearchTimeout = null;
    this.dirtyState = DirtyState.create(this.data);
    this.loading = { profile: false, saving: false };
    this.lipInstance = null;
    this.lipSimulacao = null;
    this.focusedItemIndex = -1;
    /** @type {Object|null} Liberação gerencial válida apenas para a operação atual */
    this.liberacaoLimiteSessao = null;
    /** @type {string|null} entityId draft Recovery antes do primeiro POST */
    this._recoveryDraftId = null;
    this._autosaveTimer = null;
    this._keyboardHandler = null;
  }

  static create(params = {}, query = {}) {
    const page = new NovaConsignacaoPage(params, query);
    const layout = page.render();
    setTimeout(() => page._bootstrapRecovery(query), 0);
    setTimeout(() => page._loadProximoDocumentoPreview(), 0);
    return layout;
  }

  /**
   * Recovery Framework: load/resume ao abrir Preparar Entrega.
   * @private
   */
  async _bootstrapRecovery(query = {}) {
    ensureRegistered();

    if (query.consignacaoId) {
      await this._resumeFromRecovery(query.consignacaoId, { notifyResume: true });
      return;
    }

    if (query.clienteId) {
      await this._loadClienteFromContext();
      this._scheduleAutosave();
      return;
    }

    // Sem auto-resume silencioso: evita reabrir operação no Electron ao cair em /nova.
    // Retomada ocorre só com consignacaoId explícito (query) ou ação do operador.
    const pending = listPendingMotorComercial().filter(
      (row) => row.operation === Operations.PREPARAR_ENTREGA && row.entityId != null
    );
    if (pending.length && (query.retomar === '1' || query.resume === '1')) {
      await this._resumeFromRecovery(pending[0].entityId, { notifyResume: true });
    }
  }

  async _resumeFromRecovery(consignacaoId, options = {}) {
    try {
      const helpers = {
        api: this.api,
        projectionApi: this.projectionApi,
        getCacheItens: (id) => {
          try {
            const { obterItensCacheConsignacao } = require('../../utils/operacional');
            return obterItensCacheConsignacao(id);
          } catch (_e) {
            return [];
          }
        }
      };
      const loaded = await resumePrepararEntrega(consignacaoId, helpers);

      if (loaded.error && !loaded.state?.entity && !loaded.state?.checkpoint?.itens?.length) {
        notify(loaded.error.operationalMessage || operationalMessage(loaded.error), 'warning');
        return;
      }

      if (loaded.exists && (loaded.state?.entity || loaded.state?.checkpoint)) {
        const entity = loaded.state.entity || {
          id: consignacaoId,
          status: 'RASCUNHO',
          itens: loaded.state.checkpoint?.itens || []
        };
        await this._applyRecoveredConsignacao(entity, loaded.state.checkpoint || {});

        const auth = loadAuthorization(Operations.PREPARAR_ENTREGA, this.consignacaoId || consignacaoId)
          || (loaded.context && typeof loaded.context.toLiberacaoCompat === 'function'
            ? loaded.context.toLiberacaoCompat()
            : null);
        if (auth) {
          this.liberacaoLimiteSessao = auth;
        }

        if (options.notifyResume) {
          notify('Operação retomada automaticamente.', 'info');
        }
        return;
      }
    } catch (error) {
      notify(operationalMessage(error), 'warning');
      return;
    }

    if (RecoveryManager.isDraftEntityId(consignacaoId)) {
      notify(operationalMessage('A operação não pode mais ser retomada.'), 'warning');
      return;
    }

    try {
      await this._loadConsignacaoRascunho(consignacaoId);
    } catch (error) {
      notify(operationalMessage(error), 'warning');
    }
  }

  _scheduleAutosave() {
    if (this._autosaveTimer) clearTimeout(this._autosaveTimer);
    this._autosaveTimer = setTimeout(() => {
      this._autosaveTimer = null;
      try {
        autosavePrepararEntrega(this, this.concluido
          ? RecoveryStatus.AGUARDANDO_CONFIRMACAO
          : RecoveryStatus.EM_ANDAMENTO);
      } catch (_e) {
        /* autosave nunca interrompe o operador */
      }
    }, 280);
  }

  async _applyRecoveredConsignacao(entity, checkpoint = {}) {
    if (String(entity.status || '').toUpperCase() !== 'RASCUNHO') {
      notify('Somente rascunhos podem ser editados.', 'warning');
      return;
    }

    if (entity._draft || RecoveryManager.isDraftEntityId(entity.id)) {
      this._recoveryDraftId = entity.id;
      this.consignacaoId = null;
    } else {
      this.consignacaoId = entity.id;
      this._recoveryDraftId = null;
    }

    const itensSource = (entity.itens && entity.itens.length)
      ? entity.itens
      : (checkpoint.itens || []);

    this.data.documentoNumero = entity.documento?.numero || entity.documento || this.data.documentoNumero;
    this.data.documentoExterno = checkpoint.documentoExterno || entity.documentoExterno || '';
    this.data.observacoes = checkpoint.observacoes != null
      ? checkpoint.observacoes
      : (entity.observacao || '');
    this.data.data = checkpoint.data || entity.dataAbertura || this.data.data;
    this.data.dataPrevista = checkpoint.dataPrevista || entity.dataEntregaPrevista || '';
    this.data.itens = itensSource.map((item) => ({
      itemId: item.id || item.itemId,
      produtoId: item.produtoId,
      produto: item.produtoNome || item.produto,
      codigo: item.codigo || '',
      quantidade: Number(item.quantidade || 1),
      preco: Number(item.precoUnitario || item.preco || 0),
      observacao: item.observacao || '',
      persistido: Boolean(item.persistido || item.itemId || item.id) && !entity._draft
    }));

    const clienteId = checkpoint.clienteId || entity.clienteId;
    if (clienteId) {
      const cliente = await buscarClientePorIdErp(clienteId);
      if (cliente) {
        await this._applyClientePerfil(
          cliente,
          checkpoint.perfilComercialId || entity.perfilComercialId
        );
      }
    }

    const stepFromCheckpoint = Number.isInteger(checkpoint.step) ? checkpoint.step : null;
    this.currentStep = stepFromCheckpoint != null
      ? Math.min(Math.max(stepFromCheckpoint, 0), 2)
      : (this.data.itens.length ? 1 : 0);
    if (checkpoint.concluido) {
      this.concluido = true;
      this.documentoCriado = this.data.documentoNumero || this.data.documentoPreview;
      this.currentStep = 3;
    }

    this.steps = inicializarSteps(this.skipClienteStep && this.currentStep >= 1);
    this.steps.forEach((step, index) => {
      if (index < this.currentStep) step.state = 'completed';
      else if (index === this.currentStep) step.state = 'current';
      else step.state = 'pending';
    });

    this.dirtyState.setInitialValues({ ...this.data });
    autosavePrepararEntrega(this, this.concluido
      ? RecoveryStatus.AGUARDANDO_CONFIRMACAO
      : RecoveryStatus.EM_ANDAMENTO);
    this._updateWizard();
  }

  render() {
    const bodyInner = document.createElement('div');
    bodyInner.className = 'cds-preparar-entrega__shell';
    bodyInner.id = 'preparar-entrega-shell';

    const credit = document.createElement('div');
    credit.id = 'preparar-entrega-credit-strip';
    credit.className = 'cds-preparar-entrega__credit-strip';
    credit.hidden = true;
    bodyInner.appendChild(credit);

    const stepperHost = document.createElement('div');
    stepperHost.id = 'preparar-entrega-stepper';
    stepperHost.className = 'cds-preparar-entrega__stepper';
    stepperHost.appendChild(this._createStepper());
    bodyInner.appendChild(stepperHost);
    bodyInner.appendChild(this._createContent());

    this.root = Workspace.create({
      variant: 'station',
      className: 'cds-preparar-entrega-workspace cds-preparar-entrega-page motor-comercial-page',
      header: Workspace.Header.create({
        title: 'Preparar Entrega',
        subtitle: this.skipClienteStep
          ? 'Cliente definido — adicione os produtos.'
          : 'Cliente → Produtos → Resumo → Entrega',
        onBack: () => this._handleCancel()
      }),
      body: Workspace.Body.create({
        children: bodyInner,
        scroll: true,
        className: 'cds-preparar-entrega__body'
      }),
      footer: this._buildWorkspaceFooter()
    });
    this.root.dataset.uxSprint = 'UX-20';
    this.root.dataset.sharedUiReference = 'preparar-entrega';
    this.root.dataset.estacaoTrabalho = 'preparar-entrega';

    this._setupExitConfirmation();
    this._bindKeyboardShortcuts();
    this._refreshCreditStrip();

    if (this._isProdutosStep()) {
      setTimeout(() => this._mountLip(), 0);
    }

    return this.root;
  }

  _createHeader() {
    return Workspace.Header.create({
      title: 'Preparar Entrega',
      subtitle: 'Cliente → Produtos → Resumo → Entrega'
    });
  }

  _createStepper() {
    return Stepper.create({
      steps: this.steps.map((s) => ({ label: s.label, state: s.state })),
      currentStep: this.currentStep
    });
  }

  _createContent() {
    const container = document.createElement('div');
    container.className = 'cds-preparar-entrega__conteudo';
    container.id = 'preparar-entrega-content';

    const momento = FLUXO_MOMENTOS[this.currentStep]?.key;
    container.appendChild(PrepararEntregaView.renderMomento(momento, this._viewState(), this._viewCtx()));

    return container;
  }

  _createSidebar() {
    return document.createElement('div');
  }

  _buildWorkspaceFooter() {
    return Workspace.Footer.create({
      left: this._footerLeftNodes(),
      right: this._footerRightNodes()
    });
  }

  _footerLeftNodes() {
    if (this.concluido) return [];
    const nodes = [
      Button.create({
        text: getBackButtonLabel(this.navigationContext, 'Voltar'),
        variant: 'ghost',
        disabled: this.loading.saving,
        onClick: () => this._handleCancel()
      })
    ];
    if (this.currentStep >= 1 && this.currentStep < 3) {
      nodes.push(Button.create({
        text: 'Salvar Rascunho',
        variant: 'secondary',
        disabled: this.loading.saving,
        onClick: () => this._saveDraft()
      }));
    }
    return nodes;
  }

  _footerRightNodes() {
    if (this.concluido) return [];
    const nodes = [];
    const canGoBack = this.currentStep > 0
      && !(this.currentStep === 1 && this.skipClienteStep && this.clienteLocked);

    if (canGoBack) {
      nodes.push(Button.create({
        text: 'Voltar',
        variant: 'ghost',
        disabled: this.loading.saving,
        onClick: () => this._goToPreviousStep()
      }));
    }

    const host = document.createElement('div');
    host.className = 'cds-preparar-entrega__footer-right';
    if (this.currentStep < 2) {
      this._appendPrimaryAction(host, 'Continuar', () => this._goToNextStep());
    } else if (this.currentStep === 2) {
      this._appendPrimaryAction(host, 'Concluir', () => this._createConsignacao());
    }
    Array.from(host.childNodes).forEach((n) => nodes.push(n));
    return nodes;
  }

  _createFooter() {
    return this._buildWorkspaceFooter();
  }

  _refreshCreditStrip() {
    const strip = document.getElementById('preparar-entrega-credit-strip');
    if (!strip) return;
    if (this.concluido || this.currentStep < 1 || !this.data.clienteId) {
      strip.hidden = true;
      strip.innerHTML = '';
      return;
    }
    const painel = this._getPainelLimite();
    strip.hidden = false;
    strip.innerHTML = `
      <span>Crédito disponível: <strong>${painel.creditoDisponivelExibicao || formatCurrency(painel.limiteDisponivel || 0)}</strong></span>
      <span>Valor da entrega: <strong>${formatCurrency(painel.valorTotal || 0)}</strong></span>
      <span>Saldo restante: <strong>${painel.saldoRestanteExibicao || '—'}</strong></span>
    `;
  }

  _getPainelLimite() {
    return buildPainelResumo(this.data.itens, this.clienteProfile || {});
  }

  _getFingerprintLimite() {
    const painel = this._getPainelLimite();
    return buildFingerprintLimite({
      clienteId: this.data.clienteId,
      valorEntrega: painel.valorTotal,
      creditoDisponivel: painel.limiteDisponivel
    });
  }

  _temLiberacaoLimiteValida() {
    return liberacaoCompativel(this.liberacaoLimiteSessao, this._getFingerprintLimite());
  }

  _excedeLimiteSemLiberacao() {
    const painel = this._getPainelLimite();
    return Boolean(painel.excedeLimite && !this._temLiberacaoLimiteValida());
  }

  _invalidateLiberacaoSeNecessario() {
    if (!this.liberacaoLimiteSessao) return;
    if (!liberacaoCompativel(this.liberacaoLimiteSessao, this._getFingerprintLimite())) {
      this.liberacaoLimiteSessao = null;
    }
  }

  _appendPrimaryAction(host, continueLabel, onContinue) {
    const needsLiberacao = this.currentStep >= 1 && this._excedeLimiteSemLiberacao();

    if (needsLiberacao) {
      host.appendChild(Button.create({
        text: continueLabel,
        variant: 'primary',
        disabled: true,
        onClick: () => {}
      }));
      host.appendChild(Button.create({
        text: 'Solicitar Liberação',
        variant: 'secondary',
        disabled: this.loading.saving,
        onClick: () => this._solicitarLiberacaoLimite()
      }));
      return;
    }

    host.appendChild(Button.create({
      text: continueLabel,
      variant: 'primary',
      disabled: this.loading.saving,
      onClick: onContinue
    }));
  }

  async _solicitarLiberacaoLimite() {
    const painel = this._getPainelLimite();
    const fingerprint = this._getFingerprintLimite();

    const liberacao = await solicitarLiberacaoLimite({
      clienteId: this.data.clienteId,
      clienteNome: this.clienteProfile?.nome,
      consignacaoId: this.consignacaoId,
      valorEntrega: painel.valorTotal,
      creditoDisponivel: painel.limiteDisponivel,
      valorExcedido: painel.valorExcedido,
      fingerprint
    }, (payload) => this.api.registrarAutorizacaoGerencial(payload));

    if (!liberacao) return;

    this.liberacaoLimiteSessao = liberacao;
    const entityKey = resolveEntityId(this);
    saveAuthorization(Operations.PREPARAR_ENTREGA, entityKey, {
      ...liberacao,
      fingerprint
    });
    if (this.consignacaoId) {
      salvarLiberacaoSessao(this.consignacaoId, liberacao);
    }
    this._scheduleAutosave();
    this._updateWizard();
  }

  _viewState() {
    return {
      skipClienteStep: this.skipClienteStep,
      clienteLocked: this.clienteLocked,
      clienteProfile: this.clienteProfile,
      clienteBusca: this.clienteBusca,
      clienteResultados: this.clienteResultados,
      loading: this.loading,
      data: this.data,
      focusedItemIndex: this.focusedItemIndex,
      documentoCriado: this.documentoCriado,
      voltarLabel: this._getVoltarConclusaoLabel(),
      lipSimulacao: this.lipSimulacao
    };
  }

  _viewCtx() {
    return {
      onClienteBuscaChange: (v) => this._onClienteBuscaChange(v),
      onClienteBuscaSubmit: (v) => this._searchCliente(v),
      onClienteSelecionado: (c) => this._selecionarCliente(c),
      onTrocarCliente: () => this._unlockClienteSelection(),
      onItemFocus: (i) => { this.focusedItemIndex = i; },
      onItemQtyInput: (i, v) => this._updateItemQty(i, v, { refreshGrade: false }),
      onItemQtyChange: (i, v) => this._updateItemQty(i, v, { refreshGrade: true }),
      onItemObsChange: (i, v) => this._updateItemObs(i, v),
      onItemDuplicar: (i) => this._duplicateItem(i),
      onItemRemover: (i) => this._removeItem(i),
      onDocumentoExternoChange: (v) => {
        this.data.documentoExterno = v;
        this.dirtyState.updateValues(this.data);
        this._scheduleAutosave();
      },
      onObservacoesChange: (v) => {
        this.data.observacoes = v;
        this.dirtyState.updateValues(this.data);
        this._scheduleAutosave();
      },
      onConclusaoAcao: (acao) => this._handleConclusaoAcao(acao)
    };
  }

  _getVoltarConclusaoLabel() {
    if (this.navigationContext.origem === ORIGEM_CLIENTE_360 && this.navigationContext.clienteId) {
      return 'Voltar ao Cliente';
    }
    if (this.navigationContext.origem === ORIGEM_CENTRAL_TRABALHO) {
      return 'Voltar à Central de Trabalho';
    }
    return 'Voltar';
  }

  _isProdutosStep() {
    return this.currentStep === 1 && !this.concluido;
  }

  _onClienteBuscaChange(value) {
    this.clienteBusca = value;
    if (this.clienteSearchTimeout) clearTimeout(this.clienteSearchTimeout);
    this.clienteSearchTimeout = setTimeout(() => {
      if (String(value).trim().length >= 2) {
        this._searchCliente(value, { silent: true });
      }
    }, REFRESH_CLIENTE_DEBOUNCE);
  }

  async _searchCliente(query, { silent = false } = {}) {
    if (!String(query || '').trim()) return;

    this.loading.profile = true;
    this._updateContent();

    try {
      this.clienteResultados = await buscarClientesErp(query);
      if (!this.clienteResultados.length && !silent) {
        notify('Nenhum cliente encontrado.', 'warning');
      }
    } catch (error) {
      if (!silent) notify(error.message, 'error');
    } finally {
      this.loading.profile = false;
      this._updateContent();
    }
  }

  async _selecionarCliente(cliente) {
    await this._applyClientePerfil(cliente);
    if (this.clienteProfile) {
      this._avancarParaProdutos();
    }
  }

  _avancarParaProdutos() {
    this.steps[0].state = 'completed';
    this.currentStep = 1;
    this.steps[1].state = 'current';
    this._updateWizard();
  }

  async _loadClienteFromContext() {
    const clienteId = this.navigationContext.clienteId || this.routeQuery.clienteId;
    await this._loadClienteById(clienteId);
  }

  async _loadClienteById(clienteId) {
    if (!clienteId) return;
    this.loading.profile = true;
    this._updateContent();
    try {
      const cliente = await buscarClientePorIdErp(clienteId);
      if (!cliente) {
        notify('Cliente não encontrado.', 'warning');
        return;
      }
      await this._applyClientePerfil(cliente);
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      this.loading.profile = false;
      this._updateWizard();
    }
  }

  async _unlockClienteSelection() {
    const confirmed = await confirmDialog({
      title: 'Trocar cliente',
      message: 'Deseja selecionar outro cliente?'
    });
    if (!confirmed) return;

    this.clienteLocked = false;
    this.skipClienteStep = false;
    this.navigationContext = parseNavigationContext({});
    this.clienteProfile = null;
    this.clienteResultados = [];
    this.clienteBusca = '';
    this.data.clienteId = null;
    this.data.perfilComercialId = null;
    this.data.cliente = null;
    this.currentStep = 0;
    this.steps = inicializarSteps(false);
    this.dirtyState.updateValues(this.data);
    this._scheduleAutosave();
    this._updateWizard();
  }

  async _applyClientePerfil(cliente, preferredPerfilId = null) {
    const perfis = await this.api.listarPerfis({ clienteId: cliente.id, ativo: true });
    const items = Array.isArray(perfis?.items) ? perfis.items : [];
    const preferredId = preferredPerfilId != null ? Number(preferredPerfilId) : null;

    let perfil = null;
    if (preferredId) {
      perfil = items.find((p) => Number(p.id) === preferredId) || null;
    }
    if (!perfil) {
      perfil = items.find((p) => String(p.perfilTipo || '').toUpperCase() === 'CONSIGNADO') || null;
    }
    if (!perfil) {
      perfil = items[0] || null;
    }

    if (!perfil) {
      notify(
        items.length
          ? 'Cliente sem capacidade de Consignação ativa.'
          : 'Cliente sem perfil comercial ativo.',
        'warning'
      );
      this.clienteProfile = null;
      return;
    }

    let situacao = null;
    try {
      situacao = await this.projectionApi.obterSituacaoCliente({ clienteId: cliente.id });
    } catch (_e) {
      situacao = null;
    }

    this.clienteProfile = {
      id: perfil.id,
      nome: perfil.clienteNome || cliente.nome,
      documento: perfil.cpfCnpj || cliente.cpf_cnpj || cliente.documento || '—',
      telefone: cliente.telefone || perfil.telefone || '—',
      cidade: cliente.cidade || cliente.municipio || '—',
      capacidades: extrairCapacidadesDosPerfis(items),
      perfilComercial: perfil.perfilTipo || 'CONSIGNADO',
      limiteComercial: Number(perfil.limiteComercial ?? situacao?.limiteComercial ?? 0),
      // STAB-02: crédito exclusivo da API (CreditoComercialService) — sem fallback local
      limiteDisponivel: Number(situacao?.creditoDisponivel ?? situacao?.limiteDisponivel ?? 0),
      saldo: Number(situacao?.saldoDevedor ?? situacao?.saldoEmAberto ?? situacao?.saldo ?? perfil.saldoAberto ?? 0),
      saldoDevedor: Number(situacao?.saldoDevedor ?? situacao?.saldo ?? 0),
      saldoCredor: Number(situacao?.saldoCredor ?? 0),
      creditoDisponivel: Number(situacao?.creditoDisponivel ?? situacao?.limiteDisponivel ?? 0),
      situacao: situacao?.situacao || (perfil.bloqueado ? 'BLOQUEADO' : 'ATIVO')
    };

    this.data.clienteId = Number(cliente.id);
    this.data.perfilComercialId = Number(perfil.id);
    this.data.cliente = cliente.nome;
    this.dirtyState.updateValues(this.data);
    this._scheduleAutosave();
    this._updateSidebar();
  }

  _mountLip() {
    if (!this._isProdutosStep()) return;

    if (this.lipInstance) {
      this.lipInstance.destroy();
      this.lipInstance = null;
    }

    const host = document.getElementById('lip-host');
    if (!host) return;

    this.lipInstance = LIP.create({
      onSelect: (produto, quantidade) => this._aplicarProdutoItem(produto, quantidade),
      onPreview: (produto, quantidade) => this._atualizarSimulacaoLip(produto, quantidade)
    });
    this.lipInstance.mount(host);
    this.lipInstance.focus();
  }

  _limparSimulacaoLip() {
    this.lipSimulacao = null;
    const simHost = document.getElementById('lip-simulacao');
    if (simHost) {
      simHost.hidden = true;
      simHost.innerHTML = '';
    }
    if (this.lipInstance) this.lipInstance.setInclusionWarning(false);
  }

  _atualizarSimulacaoLip(produto, quantidade) {
    if (!produto?.id) {
      this._limparSimulacaoLip();
      this._refreshPainelFinanceiroDom();
      return;
    }

    this.lipSimulacao = simularInclusaoProduto(
      this.data.itens,
      this.clienteProfile || {},
      produto,
      quantidade
    );

    const simHost = document.getElementById('lip-simulacao');
    if (simHost) {
      simHost.hidden = false;
      simHost.innerHTML = '';
      simHost.appendChild(PrepararEntregaView.renderLipSimulacao(this.lipSimulacao));
    }

    if (this.lipInstance) {
      this.lipInstance.setInclusionWarning(Boolean(this.lipSimulacao.inclusaoUltrapassaLimite));
    }

    this._refreshPainelFinanceiroDom();
  }

  _aplicarProdutoItem(produto, quantidade = 1) {
    if (!produto?.id) return;

    this._limparSimulacaoLip();

    const existente = this.data.itens.find((item) => Number(item.produtoId) === Number(produto.id));
    if (existente) {
      existente.quantidade = Number(existente.quantidade || 0) + Math.max(1, Number(quantidade) || 1);
    } else {
      this.data.itens.push({
        produtoId: produto.id,
        produto: produto.nome || produto.descricao,
        codigo: produto.codigo || produto.codigo_barras || '',
        quantidade: Math.max(1, Number(quantidade) || 1),
        preco: Number(produto.preco ?? produto.preco_venda ?? 0),
        observacao: ''
      });
    }

    this.dirtyState.updateValues(this.data);
    this._refreshProdutosView();
    this._scheduleAutosave();
    if (this.lipInstance) this.lipInstance.focus();
  }

  _updateItemQty(index, value, { refreshGrade = true } = {}) {
    const q = Math.max(1, Number(value) || 1);
    if (!this.data.itens[index]) return;
    this.data.itens[index].quantidade = q;
    this.dirtyState.updateValues(this.data);
    this._scheduleAutosave();
    if (refreshGrade) {
      this._refreshProdutosView();
    } else {
      this._refreshResumoFinanceiro();
    }
  }

  _refreshResumoFinanceiro() {
    this._invalidateLiberacaoSeNecessario();
    this._refreshPainelFinanceiroDom();
    this._refreshFooterOnly();

    document.querySelectorAll('.cds-preparar-entrega__grade-row').forEach((row, rowIndex) => {
      const item = this.data.itens[rowIndex];
      if (!item) return;
      const totalCell = row.querySelector('.cds-preparar-entrega__grade-total');
      if (totalCell) {
        totalCell.textContent = formatCurrency((item.quantidade || 0) * (item.preco || 0));
      }
    });
  }

  _refreshFooterOnly() {
    if (this.root) {
      Workspace.compose(this.root, {
        footer: this._buildWorkspaceFooter()
      });
    }
  }

  _refreshPainelFinanceiroDom() {
    this._refreshCreditStrip();

    const painel = this.lipSimulacao?.painelProjetado
      || buildPainelResumo(this.data.itens, this.clienteProfile || {});

    const resumoEl = document.getElementById('prep-resumo-grade');
    if (resumoEl) {
      const itensEl = resumoEl.querySelector('[data-resumo-itens]');
      const qtdEl = resumoEl.querySelector('[data-resumo-quantidade]');
      const valorEl = resumoEl.querySelector('[data-resumo-valor]');
      const saldoEl = resumoEl.querySelector('[data-resumo-saldo]');
      const saldoWrap = resumoEl.querySelector('.cds-preparar-entrega__resumo-grade-item--saldo');
      if (itensEl) itensEl.textContent = String(painel.quantidadeItens);
      if (qtdEl) qtdEl.textContent = String(painel.quantidadeTotal);
      if (valorEl) valorEl.textContent = formatCurrency(painel.valorTotal);
      if (saldoEl) saldoEl.textContent = painel.saldoRestanteExibicao;
      if (saldoWrap) {
        saldoWrap.className = `cds-preparar-entrega__resumo-grade-item cds-preparar-entrega__resumo-grade-item--saldo ${PrepararEntregaView._classeDestaqueSaldo(painel.destaqueSaldoRestante)}`.trim();
      }
    }
  }

  _updateItemObs(index, value) {
    if (!this.data.itens[index]) return;
    this.data.itens[index].observacao = value;
    this.dirtyState.updateValues(this.data);
    this._scheduleAutosave();
  }

  async _duplicateItem(index) {
    const item = this.data.itens[index];
    if (!item) return;
    this.data.itens.splice(index + 1, 0, {
      ...item,
      itemId: undefined,
      persistido: false,
      quantidade: item.quantidade,
      observacao: item.observacao || ''
    });
    this.dirtyState.updateValues(this.data);
    this._refreshProdutosView();
    this._scheduleAutosave();
  }

  async _removeItem(index) {
    const item = this.data.itens[index];
    if (!item) return;

    if (item.persistido && this.consignacaoId && item.itemId) {
      try {
        await withLoading('Removendo item...', () => this.api.removerItem(this.consignacaoId, item.itemId));
      } catch (error) {
        notify('Erro ao remover item: ' + error.message, 'error');
        return;
      }
    }

    this.data.itens.splice(index, 1);
    this.focusedItemIndex = -1;
    this.dirtyState.updateValues(this.data);
    this._refreshProdutosView();
    this._scheduleAutosave();
  }

  _refreshProdutosView() {
    this._limparSimulacaoLip();
    this._invalidateLiberacaoSeNecessario();
    this._updateContent();
    this._updateSidebar();
    this._refreshFooterOnly();
    if (this._isProdutosStep()) {
      setTimeout(() => this._mountLip(), 0);
    }
  }

  _validateCurrentStep() {
    const errors = [];

    switch (this.currentStep) {
      case 0:
        if (!this.clienteProfile) {
          errors.push({ message: 'Selecione um cliente', type: 'error' });
        }
        break;
      case 1:
        if (!this.data.itens.length) {
          errors.push({ message: 'Adicione pelo menos um produto', type: 'error' });
        }
        break;
      case 2:
        return buildValidacoesConferencia(this.data, this.clienteProfile, {
          liberacaoLimiteAutorizada: this._temLiberacaoLimiteValida()
        })
          .filter((a) => a.nivel === 'danger')
          .map((a) => ({ message: a.message, type: 'error' }));
      default:
        break;
    }

    return errors;
  }

  _goToNextStep() {
    if (this.currentStep >= 1 && this._excedeLimiteSemLiberacao()) {
      this._showErrors([{
        message: 'Valor acima do limite comercial. Solicite liberação gerencial para continuar.',
        type: 'error'
      }]);
      return;
    }

    const errors = this._validateCurrentStep();
    if (errors.length) {
      this._showErrors(errors);
      return;
    }

    this.steps[this.currentStep].state = 'completed';
    this.currentStep += 1;
    this.steps[this.currentStep].state = 'current';
    this._updateWizard();
  }

  _goToPreviousStep() {
    if (this.currentStep === 1 && this.skipClienteStep && this.clienteLocked) return;

    this.steps[this.currentStep].state = 'pending';
    this.currentStep -= 1;
    this.steps[this.currentStep].state = 'current';
    this._updateWizard();
  }

  _updateWizard() {
    const content = document.getElementById('preparar-entrega-content');
    if (content) {
      this._destroyLip();
      content.innerHTML = '';
      content.appendChild(PrepararEntregaView.renderMomento(
        FLUXO_MOMENTOS[this.currentStep]?.key,
        this._viewState(),
        this._viewCtx()
      ));
    }

    const stepperHost = document.getElementById('preparar-entrega-stepper');
    if (stepperHost) {
      stepperHost.innerHTML = '';
      stepperHost.appendChild(this._createStepper());
    }

    if (this.root) {
      Workspace.compose(this.root, {
        footer: this._buildWorkspaceFooter()
      });
    }

    this._refreshCreditStrip();

    if (this._isProdutosStep()) {
      setTimeout(() => this._mountLip(), 0);
    }
  }

  _updateContent() {
    this._destroyLip();
    const content = document.getElementById('preparar-entrega-content');
    if (!content) return;
    const child = PrepararEntregaView.renderMomento(
      FLUXO_MOMENTOS[this.currentStep]?.key,
      this._viewState(),
      this._viewCtx()
    );
    content.innerHTML = '';
    content.appendChild(child);
    this._refreshCreditStrip();
    if (this._isProdutosStep()) {
      setTimeout(() => this._mountLip(), 0);
    }
  }

  _updateSidebar() {
    this._refreshCreditStrip();
  }

  _destroyLip() {
    this._limparSimulacaoLip();
    if (this.lipInstance) {
      this.lipInstance.destroy();
      this.lipInstance = null;
    }
  }

  _showErrors(errors) {
    const content = document.getElementById('preparar-entrega-content');
    if (!content) return;
    errors.forEach((error) => {
      content.insertBefore(Alert.create({
        message: error.message,
        variant: error.type,
        dismissible: true
      }), content.firstChild);
    });
  }

  async _loadConsignacaoRascunho(consignacaoId) {
    try {
      const consignacao = await carregarConsignacaoCompleta(this.api, this.projectionApi, consignacaoId);
      if (String(consignacao.status || '').toUpperCase() !== 'RASCUNHO') {
        notify('Somente rascunhos podem ser editados.', 'warning');
        return;
      }

      this.consignacaoId = consignacao.id;
      this.data.documentoNumero = consignacao.documento;
      this.data.documentoExterno = consignacao.documentoExterno || '';
      this.data.observacoes = consignacao.observacao || '';
      this.data.data = consignacao.dataAbertura || this.data.data;
      this.data.itens = (consignacao.itens || []).map((item) => ({
        itemId: item.id || item.itemId,
        produtoId: item.produtoId,
        produto: item.produtoNome || item.produto,
        codigo: item.codigo || '',
        quantidade: Number(item.quantidade || 1),
        preco: Number(item.precoUnitario || item.preco || 0),
        observacao: item.observacao || '',
        persistido: true
      }));

      if (consignacao.clienteId) {
        const cliente = await buscarClientePorIdErp(consignacao.clienteId);
        if (cliente) {
          await this._applyClientePerfil(cliente, consignacao.perfilComercialId);
        }
      }

      this.currentStep = this.data.itens.length ? 1 : 0;
      this.steps = inicializarSteps(this.skipClienteStep && this.currentStep === 1);
      this.steps.forEach((step, index) => {
        if (index < this.currentStep) step.state = 'completed';
        else if (index === this.currentStep) step.state = 'current';
        else step.state = 'pending';
      });

      this.dirtyState.setInitialValues({ ...this.data });
      this._updateWizard();
    } catch (error) {
      notify(operationalMessage(error), 'error');
    }
  }

  async _loadProximoDocumentoPreview() {
    try {
      const preview = await this.api.obterProximoDocumentoConsignacao();
      this.data.documentoPreview = preview?.numero || preview?.documento?.numero || 'CONS-????-??????';
      this._updateContent();
    } catch (_error) {
      this.data.documentoPreview = 'CONS-(ao salvar)';
    }
  }

  async _persistConsignacao() {
    const payload = {
      clienteId: this.data.clienteId,
      perfilComercialId: this.data.perfilComercialId,
      documentoExterno: this.data.documentoExterno || null,
      observacao: this.data.observacoes || null,
      dataAbertura: this.data.data,
      dataEntregaPrevista: this.data.dataPrevista || null,
      usuarioId: getUsuarioId()
    };

    let consignacaoId = this.consignacaoId;
    if (!consignacaoId) {
      const created = await this.api.criarConsignacao(payload);
      const consignacao = created.consignacao || created;
      consignacaoId = consignacao.id;
      this.consignacaoId = consignacaoId;
      this.data.documentoNumero = consignacao.documento?.numero || consignacao.documento || this.data.documentoPreview;
    } else {
      await this.api.atualizarConsignacao(consignacaoId, {
        observacao: payload.observacao,
        documentoExterno: payload.documentoExterno,
        dataEntregaPrevista: payload.dataEntregaPrevista,
        usuarioId: payload.usuarioId
      });
    }

    for (const item of this.data.itens) {
      if (item.persistido) continue;
      await this.api.adicionarItem(consignacaoId, {
        produtoId: item.produtoId,
        quantidade: Number(item.quantidade),
        precoUnitario: Number(item.preco),
        usuarioId: getUsuarioId()
      });
      const savedItems = await this.api.obterConsignacao(consignacaoId).then((c) => c.itens || []);
      const saved = savedItems.find((i) => Number(i.produtoId) === Number(item.produtoId));
      if (saved) item.itemId = saved.id;
      item.persistido = true;
    }

    cacheItensConsignacao(consignacaoId, this.data.itens);
    if (this._recoveryDraftId) {
      rebindPrepararEntrega(this, consignacaoId);
    }
    savePrepararEntrega(this, RecoveryStatus.RASCUNHO);
    if (this.liberacaoLimiteSessao) {
      const liberacaoPayload = {
        ...this.liberacaoLimiteSessao,
        fingerprint: this._getFingerprintLimite(),
        consignacaoId
      };
      saveAuthorization(Operations.PREPARAR_ENTREGA, consignacaoId, liberacaoPayload);
      saveAuthorization(Operations.ENTREGA, consignacaoId, liberacaoPayload);
      salvarLiberacaoSessao(consignacaoId, liberacaoPayload);
    }
    return consignacaoId;
  }

  async _saveDraft() {
    if (!this.data.clienteId || !this.data.perfilComercialId) {
      notify('Selecione um cliente antes de salvar.', 'warning');
      return;
    }

    this.loading.saving = true;
    try {
      await withLoading('Salvando rascunho...', () => this._persistConsignacao());
      this.dirtyState.setInitialValues({ ...this.data });
      notify('Rascunho salvo.', 'success');
    } catch (error) {
      notify(operationalMessage(error), 'error');
    } finally {
      this.loading.saving = false;
      this._updateWizard();
    }
  }

  async _createConsignacao() {
    const errors = this._validateCurrentStep();
    if (errors.length) {
      this._showErrors(errors);
      return;
    }

    this.loading.saving = true;
    try {
      const consignacaoId = await withLoading('Preparando entrega...', () => this._persistConsignacao());
      this.dirtyState.setInitialValues({ ...this.data });
      this.documentoCriado = this.data.documentoNumero || this.data.documentoPreview;
      this.consignacaoId = consignacaoId;
      this.concluido = true;
      this.currentStep = 3;
      this.steps[2].state = 'completed';
      this.steps[3].state = 'current';
      savePrepararEntrega(this, RecoveryStatus.AGUARDANDO_CONFIRMACAO);
      saveEntrega(consignacaoId, {
        itens: this.data.itens.map((item) => ({ ...item })),
        clienteId: this.data.clienteId,
        from: Operations.PREPARAR_ENTREGA
      }, RecoveryStatus.AGUARDANDO_CONFIRMACAO);
      this._destroyLip();
      this._updateWizard();
    } catch (error) {
      notify(operationalMessage(error), 'error');
    } finally {
      this.loading.saving = false;
    }
  }

  async _handleConclusaoAcao(acao) {
    const extras = { empresa: this.data.empresa, filial: this.data.filial };

    switch (acao) {
      case 'imprimir-termo':
        await imprimirTermo(this.api, this.projectionApi, this.consignacaoId, extras);
        break;
      case 'visualizar-pdf':
        await visualizarTermo(this.api, this.projectionApi, this.consignacaoId, extras);
        break;
      case 'abrir-entrega':
        await navigate(this._buildEntregaPath());
        break;
      case 'voltar':
        await navigate(resolveBackPath(this.navigationContext, '/'));
        break;
      default:
        break;
    }
  }

  _buildEntregaPath() {
    const id = this.consignacaoId;
    const clienteId = this.navigationContext.clienteId || this.data.clienteId;
    if (this.navigationContext.origem === ORIGEM_CENTRAL_TRABALHO) {
      return buildRouteWithCentralTrabalhoContext(`/consignacoes/${id}/entrega`, clienteId);
    }
    if (this.navigationContext.locked && clienteId) {
      return buildRouteWithCliente360Context(`/consignacoes/${id}/entrega`, clienteId);
    }
    return `/consignacoes/${id}/entrega`;
  }

  async _handleCancel() {
    if (this.dirtyState.isDirty()) {
      const confirmed = await confirmDialog({
        title: 'Cancelar',
        message: 'Existem alterações não salvas. Deseja sair?'
      });
      if (!confirmed) return;
    }
    await navigate(resolveBackPath(this.navigationContext, '/consignacoes'));
  }

  _bindKeyboardShortcuts() {
    if (this._keyboardHandler) {
      document.removeEventListener('keydown', this._keyboardHandler);
    }

    this._keyboardHandler = (e) => {
      if (!this._isProdutosStep()) return;

      if (e.key === 'F2' && this.focusedItemIndex >= 0) {
        e.preventDefault();
        const input = document.querySelector(`[data-qty-index="${this.focusedItemIndex}"]`);
        if (input) input.focus();
      }

      if (e.ctrlKey && e.key === 'Delete') {
        e.preventDefault();
        if (this.focusedItemIndex >= 0) {
          this._removeItem(this.focusedItemIndex);
        }
      }

      if (e.key === 'Escape' && this.lipInstance) {
        this.lipInstance.focus();
      }
    };

    document.addEventListener('keydown', this._keyboardHandler);
  }

  _setupExitConfirmation() {
    window.addEventListener('beforeunload', (e) => {
      if (this.dirtyState.isDirty() && !this.concluido) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  _formatCurrency(value) {
    return formatCurrency(value);
  }

  _formatDate(date) {
    return formatDate(date);
  }
}

module.exports = NovaConsignacaoPage;
