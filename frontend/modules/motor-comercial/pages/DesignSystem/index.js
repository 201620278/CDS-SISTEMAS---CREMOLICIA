/**
 * CDS Design System — Showcase / Catálogo Oficial
 *
 * Rota: /design-system
 *
 * @module frontend/modules/motor-comercial/pages/DesignSystem
 */

const DS = require('../../../../shared/design-system');
const {
  CDSPage,
  CDSPageHeader,
  CDSSection,
  CDSSidebar,
  CDSFooter
} = DS.layouts;
const {
  CDSPrimaryButton,
  CDSSecondaryButton,
  CDSSuccessButton,
  CDSDangerButton,
  CDSIconButton
} = DS.buttons;
const {
  CDSAlert,
  CDSEmptyState,
  CDSLoading,
  CDSProgress,
  CDSToast
} = DS.feedback;
const {
  CDSTextField,
  CDSCurrencyField,
  CDSSelect,
  CDSCheckbox,
  CDSSwitch,
  CDSRadioGroup,
  CDSFormSection
} = DS.forms;
const {
  CDSSearchBar,
  CDSFilterBar,
  CDSSearchResult
} = DS.search;
const {
  CDSOperationalCard,
  CDSSummaryCard,
  CDSCard
} = DS.cards;
const {
  CDSTable,
  CDSBadge,
  CDSTag,
  CDSStatusIndicator,
  CDSTimeline
} = DS.data;
const {
  CDSBreadcrumb,
  CDSBackButton,
  CDSStepper,
  CDSPagination
} = DS.navigation;

const SHOWCASE_SECTIONS = [
  'visao-geral', 'botoes', 'formularios', 'feedback', 'cards',
  'busca', 'dados', 'navegacao', 'layouts', 'estados', 'linguagem'
];

class DesignSystemPage {
  constructor() {
    this.activeSection = 'visao-geral';
  }

  static create() {
    return new DesignSystemPage().render();
  }

  render() {
    const content = document.createElement('div');
    content.className = 'cds-design-system-page motor-comercial-page';
    content.id = 'cds-design-system-showcase';

    const main = document.createElement('div');
    main.className = 'cds-design-system-page__main';
    main.appendChild(this._renderPreview());
    main.appendChild(this._renderCode());
    content.appendChild(main);

    const page = CDSPage.create({
      header: CDSPageHeader.create({
        title: 'CDS Design System',
        subtitle: 'Catálogo oficial de componentes da plataforma CDS Sistemas',
        actions: [
          CDSPrimaryButton.create({
            text: 'Ver tokens',
            onClick: () => this._scrollTo('visao-geral')
          })
        ]
      }),
      sidebar: this._renderSidebar(),
      content,
      footer: CDSFooter.create({
        left: 'CDS Design System — Sprint DS-01',
        right: 'Referência: Motor Comercial'
      })
    });

    return page;
  }

  _renderSidebar() {
    const labels = {
      'visao-geral': 'Visão Geral',
      botoes: 'Botões',
      formularios: 'Formulários',
      feedback: 'Feedback',
      cards: 'Cards',
      busca: 'Busca',
      dados: 'Dados',
      navegacao: 'Navegação',
      layouts: 'Layouts',
      estados: 'Estados',
      linguagem: 'Linguagem'
    };

    return CDSSidebar.create({
      title: 'Componentes',
      items: SHOWCASE_SECTIONS.map((id) => ({
        label: labels[id],
        active: id === this.activeSection,
        onClick: () => this._selectSection(id)
      }))
    });
  }

  _selectSection(id) {
    this.activeSection = id;
    const root = document.getElementById('cds-design-system-showcase');
    if (!root) return;
    const preview = root.querySelector('.cds-design-system-page__preview');
    const code = root.querySelector('.cds-design-system-page__code');
    if (preview) {
      preview.innerHTML = '';
      preview.appendChild(this._renderSectionContent(id));
    }
    if (code) code.textContent = this._codeSample(id);
    root.closest('.cds-page')?.querySelectorAll('.cds-sidebar__item').forEach((btn, idx) => {
      btn.classList.toggle('cds-sidebar__item--active', SHOWCASE_SECTIONS[idx] === id);
    });
  }

  _scrollTo(id) {
    this._selectSection(id);
  }

  _renderPreview() {
    const wrap = document.createElement('div');
    wrap.className = 'cds-design-system-page__preview';
    wrap.appendChild(this._renderSectionContent(this.activeSection));
    return wrap;
  }

  _renderCode() {
    const pre = document.createElement('pre');
    pre.className = 'cds-design-system-page__code';
    pre.textContent = this._codeSample(this.activeSection);
    return pre;
  }

  _renderSectionContent(id) {
    const fragment = document.createDocumentFragment();

    switch (id) {
      case 'visao-geral':
        fragment.appendChild(CDSSection.create({
          title: 'Princípios',
          description: 'Componentes reutilizáveis, tokens centralizados, linguagem operacional.',
          content: this._grid([
            CDSSummaryCard.create({ title: 'Tokens', value: '12 categorias', icon: '🎨' }),
            CDSSummaryCard.create({ title: 'Componentes', value: '40+', icon: '🧩' }),
            CDSSummaryCard.create({ title: 'Estados', value: '6 oficiais', icon: '⚡' })
          ])
        }));
        break;

      case 'botoes':
        fragment.appendChild(this._demoRow([
          CDSPrimaryButton.create({ text: 'Primário' }),
          CDSSecondaryButton.create({ text: 'Secundário' }),
          CDSSuccessButton.create({ text: 'Sucesso' }),
          CDSDangerButton.create({ text: 'Perigo' }),
          CDSIconButton.create({ icon: '🔍', ariaLabel: 'Buscar' })
        ]));
        break;

      case 'formularios':
        fragment.appendChild(CDSFormSection.create({
          title: 'Dados do Cliente',
          description: 'Exemplo de seção de formulário',
          fields: [
            CDSTextField.create({ label: 'Nome', placeholder: 'Nome do cliente' }),
            CDSCurrencyField.create({ label: 'Limite', value: 0 }),
            CDSSelect.create({ label: 'Situação', options: [{ value: 'ativo', label: 'Ativo' }] }),
            CDSCheckbox.create({ label: 'Habilitado para consignação', checked: true }),
            CDSSwitch.create({ label: 'Bloqueado', checked: false }),
            CDSRadioGroup.create({ label: 'Tipo', options: [{ value: 'c', label: 'Consignado' }], value: 'c' })
          ]
        }));
        break;

      case 'feedback':
        fragment.appendChild(CDSAlert.create({ message: 'Consignação criada com sucesso.', variant: 'success' }));
        fragment.appendChild(CDSAlert.create({ message: 'Verifique o limite do cliente.', variant: 'warning' }));
        fragment.appendChild(CDSEmptyState.create({ title: 'Sem dados', description: 'Nenhum registro encontrado' }));
        fragment.appendChild(CDSLoading.create({ message: 'Carregando...' }));
        fragment.appendChild(CDSProgress.create({ value: 65, max: 100 }));
        fragment.appendChild(CDSPrimaryButton.create({
          text: 'Exibir Toast',
          onClick: () => CDSToast.show('Operação realizada com sucesso.', 'success')
        }));
        break;

      case 'cards':
        fragment.appendChild(this._grid([
          CDSOperationalCard.create({
            icon: '📦', title: 'Preparar Entrega', description: 'Inicie uma nova consignação',
            actionLabel: 'Acessar', onAction: () => {}
          }),
          CDSCard.create({
            header: CDSCard.createHeader({ title: 'Card padrão' }),
            body: CDSCard.createBody(document.createTextNode('Conteúdo informativo'))
          }),
          CDSSummaryCard.create({ title: 'Saldo', value: 'R$ 1.250,00', icon: '💰' })
        ]));
        break;

      case 'busca':
        fragment.appendChild(CDSSearchBar.create({ placeholder: 'Buscar cliente...' }));
        fragment.appendChild(CDSFilterBar.create({
          filters: [{ key: 'status', label: 'Status', options: [{ value: '', label: 'Todos' }, { value: 'aberto', label: 'Em aberto' }] }]
        }));
        fragment.appendChild(CDSSearchResult.create({ title: 'Mercantil São José', subtitle: 'Cliente consignado', meta: 'Limite disponível: R$ 500' }));
        break;

      case 'dados':
        fragment.appendChild(CDSTable.create({
          columns: [{ key: 'doc', label: 'Documento' }, { key: 'valor', label: 'Valor' }],
          data: [{ doc: 'C-001', valor: 'R$ 500' }]
        }));
        fragment.appendChild(this._demoRow([
          CDSBadge.create({ text: 'Entregue', variant: 'info' }),
          CDSTag.create({ text: 'Urgente' }),
          CDSStatusIndicator.create({ status: 'success', label: 'Regular' })
        ]));
        fragment.appendChild(CDSPagination.create({ page: 1, totalPages: 5, onPageChange: () => {} }));
        break;

      case 'navegacao':
        fragment.appendChild(CDSBreadcrumb.create({
          items: [{ label: 'Central de Trabalho', onClick: () => {} }, { label: 'Clientes' }]
        }));
        fragment.appendChild(CDSBackButton.create({ label: 'Voltar ao Cliente' }));
        fragment.appendChild(CDSStepper.create({
          steps: [{ label: 'Cliente' }, { label: 'Produtos' }, { label: 'Conferência' }],
          currentStep: 1
        }));
        break;

      case 'layouts':
        fragment.appendChild(CDSSection.create({
          title: 'CDSPage',
          description: 'Esta página utiliza CDSPage, CDSPageHeader, CDSSidebar e CDSFooter.',
          content: document.createTextNode('Layout operacional padrão da plataforma.')
        }));
        break;

      case 'estados':
        fragment.appendChild(this._stateGrid());
        break;

      case 'linguagem':
        fragment.appendChild(CDSSection.create({
          title: 'Linguagem Operacional',
          description: 'Use termos do dia a dia do operador. Evite jargão técnico.',
          content: (() => {
            const ul = document.createElement('ul');
            ['Cliente', 'Consignação', 'Entrega', 'Fechamento', 'Conta Corrente', 'Relatórios'].forEach((t) => {
              const li = document.createElement('li');
              li.textContent = `✓ ${t}`;
              ul.appendChild(li);
            });
            return ul;
          })()
        }));
        break;

      default:
        break;
    }

    const container = document.createElement('div');
    container.appendChild(fragment);
    return container;
  }

  _demoRow(items) {
    const row = document.createElement('div');
    row.className = 'cds-design-system-demo-row';
    row.style.cssText = 'display:flex;flex-wrap:wrap;gap:12px;margin-bottom:16px;align-items:center;';
    items.forEach((el) => row.appendChild(el));
    return row;
  }

  _grid(items) {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;';
    items.forEach((el) => grid.appendChild(el));
    return grid;
  }

  _stateGrid() {
    const states = [
      { label: 'Loading', el: CDSLoading.create({ message: 'Carregando' }) },
      { label: 'Vazio', el: CDSEmptyState.create({ title: 'Vazio', description: 'Sem registros' }) },
      { label: 'Erro', el: CDSAlert.create({ message: 'Não foi possível concluir.', variant: 'error' }) },
      { label: 'Sucesso', el: CDSAlert.create({ message: 'Salvo com sucesso.', variant: 'success' }) },
      { label: 'Aviso', el: CDSAlert.create({ message: 'Atenção necessária.', variant: 'warning' }) },
      { label: 'Desabilitado', el: CDSPrimaryButton.create({ text: 'Indisponível', disabled: true }) }
    ];
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;';
    states.forEach(({ label, el }) => {
      const box = document.createElement('div');
      box.innerHTML = `<strong>${label}</strong>`;
      box.appendChild(el);
      grid.appendChild(box);
    });
    return grid;
  }

  _codeSample(id) {
    const samples = {
      'visao-geral': "const DS = require('frontend/shared/design-system');\nDS.injectDesignSystemStyles();",
      botoes: "CDSPrimaryButton.create({ text: 'Confirmar', onClick: handler });",
      formularios: "CDSTextField.create({ label: 'Cliente', placeholder: 'Nome' });",
      feedback: "CDSToast.show('Consignação criada com sucesso.', 'success');",
      cards: "CDSOperationalCard.create({ title: 'Preparar Entrega', onAction: fn });",
      busca: "CDSSearchBar.create({ placeholder: 'Buscar...', onSearch: fn });",
      dados: "CDSTable.create({ columns, data });",
      navegacao: "CDSBreadcrumb.create({ items: [{ label: 'Clientes' }] });",
      layouts: "CDSPage.create({ header, sidebar, content, footer });",
      estados: '// Loading | Vazio | Erro | Sucesso | Aviso | Desabilitado',
      linguagem: "// Use: Cliente, Consignação, Fechamento\n// Evite: Ledger, DTO, Workflow"
    };
    return samples[id] || '';
  }
}

module.exports = DesignSystemPage;
