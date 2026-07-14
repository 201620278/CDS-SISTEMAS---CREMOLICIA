# Components — Motor Comercial

**Sprint 2.7** — Catálogo Oficial de Componentes

---

## Objetivo

Documentar todos os componentes oficiais do Design System, suas APIs, estados e exemplos de uso.

---

## Componentes Base

### Button

Botão reutilizável com múltiplas variantes.

**API:**
```javascript
Button.create({
  text: 'Salvar',
  variant: 'primary',      // primary, secondary, danger, success, ghost
  size: 'md',              // sm, md, lg
  disabled: false,
  loading: false,
  fullWidth: false,
  icon: null,
  onClick: () => {}
})
```

**Variantes:**
- **primary**: Ação principal (azul)
- **secondary**: Ação secundária (cinza)
- **danger**: Ação destrutiva (vermelho)
- **success**: Ação de sucesso (verde)
- **ghost**: Ação sutil (transparente com borda)

**Estados:**
- `disabled`: Desabilitado
- `loading`: Com spinner de carregamento

**Exemplo:**
```javascript
const button = Button.create({
  text: 'Salvar',
  variant: 'primary',
  onClick: () => console.log('Clicado')
});
```

---

### Card

Container com header, body e footer.

**API:**
```javascript
Card.create({
  header: headerElement,
  body: bodyElement,
  footer: footerElement,
  elevated: false,
  bordered: true,
  className: ''
})
```

**Métodos Auxiliares:**
```javascript
Card.createHeader({ title: '', subtitle: '', actions: null })
Card.createBody(contentElement)
Card.createFooter(contentElement)
```

**Exemplo:**
```javascript
const header = Card.createHeader({ title: 'Título' });
const body = Card.createBody(document.createTextNode('Conteúdo'));
const card = Card.create({ header, body });
```

---

### Badge

Badge de status ou tag.

**API:**
```javascript
Badge.create({
  text: 'Ativo',
  variant: 'default',      // default, success, warning, error, info
  size: 'md',              // sm, md, lg
  dot: false               // Exibe apenas um ponto
})
```

**Método Auxiliar:**
```javascript
Badge.createStatus('active')  // active, inactive, pending, blocked, etc.
```

**Exemplo:**
```javascript
const badge = Badge.createStatus('active');
```

---

### Alert

Alerta de informação.

**API:**
```javascript
Alert.create({
  message: 'Operação realizada com sucesso',
  variant: 'info',          // info, success, warning, error
  dismissible: false,
  onDismiss: () => {}
})
```

**Exemplo:**
```javascript
const alert = Alert.create({
  message: 'Erro ao processar',
  variant: 'error',
  dismissible: true
});
```

---

### Loading

Indicador de carregamento.

**API:**
```javascript
Loading.create({
  size: 'md',              // sm, md, lg
  message: 'Carregando...',
  fullScreen: false
})
```

**Exemplo:**
```javascript
const loading = Loading.create({
  size: 'lg',
  message: 'Processando...'
});
```

---

### EmptyState

Estado vazio com ícone e mensagem.

**API:**
```javascript
EmptyState.create({
  title: 'Nenhum item encontrado',
  description: 'Tente ajustar os filtros',
  icon: '📭',
  action: buttonElement
})
```

**Exemplo:**
```javascript
const empty = EmptyState.create({
  title: 'Sem dados',
  description: 'Não há itens para exibir'
});
```

---

### Avatar

Avatar com iniciais ou imagem.

**API:**
```javascript
Avatar.create({
  name: 'João Silva',
  src: null,               // URL da imagem
  alt: '',
  size: 'md',              // xs, sm, md, lg, xl
  variant: 'circle'        // circle, square
})
```

**Exemplo:**
```javascript
const avatar = Avatar.create({
  name: 'João Silva',
  size: 'lg'
});
```

---

### Skeleton

Skeleton para loading de conteúdo.

**API:**
```javascript
Skeleton.create({
  variant: 'text',         // text, circle, rect
  width: null,
  height: null,
  animate: true
})
```

**Exemplo:**
```javascript
const skeleton = Skeleton.create({
  variant: 'text',
  width: '200px',
  height: '20px'
});
```

---

### Divider

Divisor horizontal ou vertical.

**API:**
```javascript
Divider.create({
  orientation: 'horizontal', // horizontal, vertical
  label: false,
  text: ''
})
```

**Exemplo:**
```javascript
const divider = Divider.create({
  orientation: 'horizontal'
});
```

---

### Tag

Tag removível.

**API:**
```javascript
Tag.create({
  text: 'JavaScript',
  removable: false,
  onRemove: () => {}
})
```

**Exemplo:**
```javascript
const tag = Tag.create({
  text: 'React',
  removable: true,
  onRemove: () => console.log('Removido')
});
```

---

## Componentes de Formulário

### Input

Input de texto genérico.

**API:**
```javascript
Input.create({
  type: 'text',
  placeholder: 'Digite...',
  value: '',
  label: 'Nome',
  required: false,
  disabled: false,
  readOnly: false,
  error: false,
  errorMessage: '',
  onChange: (value) => {}
})
```

**Exemplo:**
```javascript
const input = Input.create({
  label: 'Nome',
  placeholder: 'Digite seu nome',
  onChange: (value) => console.log(value)
});
```

---

### CurrencyInput

Input monetário com formatação.

**API:**
```javascript
CurrencyInput.create({
  value: 0,
  currency: 'BRL',
  label: 'Valor',
  disabled: false,
  readOnly: false,
  onChange: (value) => {}
})
```

**Exemplo:**
```javascript
const currency = CurrencyInput.create({
  label: 'Preço',
  value: 100.50,
  onChange: (value) => console.log(value)
});
```

---

### Select

Select dropdown.

**API:**
```javascript
Select.create({
  options: [
    { value: '1', label: 'Opção 1' },
    { value: '2', label: 'Opção 2' }
  ],
  placeholder: 'Selecione...',
  value: '',
  label: 'Categoria',
  required: false,
  disabled: false,
  error: false,
  errorMessage: '',
  onChange: (value) => {}
})
```

**Exemplo:**
```javascript
const select = Select.create({
  label: 'Status',
  options: [
    { value: 'active', label: 'Ativo' },
    { value: 'inactive', label: 'Inativo' }
  ],
  onChange: (value) => console.log(value)
});
```

---

### Checkbox

Checkbox com label.

**API:**
```javascript
Checkbox.create({
  label: 'Aceitar termos',
  checked: false,
  disabled: false,
  indeterminate: false,
  onChange: (checked) => {}
})
```

**Exemplo:**
```javascript
const checkbox = Checkbox.create({
  label: 'Concordo com os termos',
  onChange: (checked) => console.log(checked)
});
```

---

### Switch

Toggle switch.

**API:**
```javascript
Switch.create({
  label: 'Notificações',
  checked: false,
  disabled: false,
  onChange: (checked) => {}
})
```

**Exemplo:**
```javascript
const switch = Switch.create({
  label: 'Ativar notificações',
  onChange: (checked) => console.log(checked)
});
```

---

### Textarea

Área de texto.

**API:**
```javascript
Textarea.create({
  placeholder: 'Digite...',
  value: '',
  label: 'Descrição',
  rows: 4,
  required: false,
  disabled: false,
  readOnly: false,
  error: false,
  errorMessage: '',
  onChange: (value) => {}
})
```

**Exemplo:**
```javascript
const textarea = Textarea.create({
  label: 'Descrição',
  rows: 5,
  onChange: (value) => console.log(value)
});
```

---

## Componentes de Dados

### Table

Tabela com ordenação e paginação.

**API:**
```javascript
Table.create({
  columns: [
    { key: 'name', label: 'Nome', sortable: true },
    { key: 'email', label: 'Email' }
  ],
  data: [
    { name: 'João', email: 'joao@email.com' }
  ],
  sortable: false,
  selectable: false,
  onSort: (key) => {},
  onRowClick: (row, index) => {}
})
```

**Exemplo:**
```javascript
const table = Table.create({
  columns: [
    { key: 'name', label: 'Nome' },
    { key: 'status', label: 'Status' }
  ],
  data: data,
  sortable: true,
  onSort: (key) => console.log('Sort by:', key)
});
```

---

### Pagination

Controles de paginação.

**API:**
```javascript
Pagination.create({
  currentPage: 1,
  totalPages: 10,
  totalItems: 100,
  pageSize: 10,
  onPageChange: (page) => {}
})
```

**Exemplo:**
```javascript
const pagination = Pagination.create({
  currentPage: 1,
  totalPages: 5,
  totalItems: 50,
  onPageChange: (page) => console.log('Page:', page)
});
```

---

### StatCard

Card de métrica com trend.

**API:**
```javascript
StatCard.create({
  title: 'Vendas',
  value: 'R$ 10.000',
  trend: 'up',             // up, down, neutral
  trendValue: 15,
  icon: '💰',
  color: 'primary'         // primary, success, warning, error
})
```

**Exemplo:**
```javascript
const stat = StatCard.create({
  title: 'Receita',
  value: 'R$ 50.000',
  trend: 'up',
  trendValue: 20,
  color: 'success'
});
```

---

### Progress

Barra de progresso.

**API:**
```javascript
Progress.create({
  value: 75,
  label: 'Progresso',
  color: 'primary',       // primary, success, warning, error
  showValue: false
})
```

**Exemplo:**
```javascript
const progress = Progress.create({
  value: 60,
  label: 'Carregando',
  showValue: true
});
```

---

## Layouts

### ComercialLayout

Layout oficial do Motor Comercial.

**API:**
```javascript
ComercialLayout.create({
  header: headerElement,
  sidebar: sidebarElement,
  content: contentElement,
  footer: footerElement
})
```

**Exemplo:**
```javascript
const layout = ComercialLayout.create({
  header: header,
  sidebar: navigation,
  content: pageContent
});
```

---

### DashboardLayout

Layout para dashboards.

**API:**
```javascript
DashboardLayout.create({
  header: headerElement,
  sidebar: sidebarElement,
  content: contentElement,
  footer: footerElement
})
```

---

### CadastroLayout

Layout para formulários de cadastro.

**API:**
```javascript
CadastroLayout.create({
  header: headerElement,
  toolbar: toolbarElement,
  content: formElement,
  sidebar: sidebarElement
})
```

---

### ConsultaLayout

Layout para listas e consultas.

**API:**
```javascript
ConsultaLayout.create({
  header: headerElement,
  filters: filtersElement,
  content: tableElement,
  pagination: paginationElement
})
```

---

### WizardLayout

Layout para wizards/multi-step.

**API:**
```javascript
WizardLayout.create({
  header: headerElement,
  steps: stepperElement,
  content: stepContent,
  actions: actionsElement
})
```

---

### FullscreenLayout

Layout fullscreen.

**API:**
```javascript
FullscreenLayout.create({
  header: headerElement,
  toolbar: toolbarElement,
  content: contentElement
})
```

---

## Componentes de Navegação

### Tabs

Abas para organização de conteúdo.

**API:**
```javascript
Tabs.create({
  tabs: [
    { key: 'tab1', label: 'Aba 1' },
    { key: 'tab2', label: 'Aba 2' }
  ],
  activeTab: 'tab1',
  onTabChange: (key) => {}
})
```

**Exemplo:**
```javascript
const tabs = Tabs.create({
  tabs: [
    { key: 'info', label: 'Informações' },
    { key: 'history', label: 'Histórico' }
  ],
  activeTab: 'info',
  onTabChange: (key) => console.log('Tab:', key)
});
```

---

### Modal

Modal com backdrop.

**API:**
```javascript
Modal.create({
  title: 'Título',
  content: contentElement,
  footer: footerElement,
  open: false,
  onClose: () => {}
})
```

**Exemplo:**
```javascript
const modal = Modal.create({
  title: 'Confirmar',
  content: document.createTextNode('Tem certeza?'),
  open: true,
  onClose: () => console.log('Fechado')
});
```

---

### Stepper

Stepper para wizards.

**API:**
```javascript
Stepper.create({
  steps: [
    { label: 'Passo 1' },
    { label: 'Passo 2' },
    { label: 'Passo 3' }
  ],
  currentStep: 0
})
```

**Exemplo:**
```javascript
const stepper = Stepper.create({
  steps: [
    { label: 'Dados' },
    { label: 'Confirmação' },
    { label: 'Finalização' }
  ],
  currentStep: 1
});
```

---

## Hooks

### useLoading

Gerencia estado de loading.

```javascript
const loading = useLoading.create();
loading.startLoading();
loading.stopLoading();
loading.subscribe((isLoading) => console.log(isLoading));
```

---

### useRequest

Gerencia requisições API.

```javascript
const request = useRequest.create(apiClient);
await request.execute(() => api.get('/endpoint'));
console.log(request.data);
console.log(request.error);
```

---

### usePagination

Gerencia paginação.

```javascript
const pagination = usePagination.create({ pageSize: 10 });
pagination.setPage(2);
pagination.nextPage();
pagination.prevPage();
```

---

### useFilters

Gerencia filtros.

```javascript
const filters = useFilters.create();
filters.setFilter('status', 'active');
filters.clearFilters();
filters.resetFilters();
```

---

### useToast

Gerencia notificações toast.

```javascript
const toast = useToast.create();
toast.success('Sucesso');
toast.error('Erro');
toast.warning('Aviso');
toast.info('Informação');
```

---

### useModal

Gerencia estado de modais.

```javascript
const modal = useModal.create();
modal.openModal({ data: 'value' });
modal.closeModal();
```

---

### useConfirm

Gerencia diálogos de confirmação.

```javascript
const confirm = useConfirm.create();
const confirmed = await confirm.confirm({
  title: 'Confirmação',
  message: 'Tem certeza?'
});
```

---

## Contexts

### ThemeContext

Gerencia tema global.

```javascript
const theme = themeContext.getTheme();
themeContext.subscribe((newTheme) => console.log(newTheme));
themeContext.updateTheme({ primary: '#new-color' });
```

---

### ToastContext

Gerencia toasts globais.

```javascript
const toasts = toastContext.getToasts();
toastContext.subscribe((toasts) => console.log(toasts));
toastContext.success('Sucesso');
```

---

### ModalContext

Gerencia modais globais.

```javascript
const modals = modalContext.getModals();
modalContext.open('modal-id', { title: 'Modal' });
modalContext.close('modal-id');
```

---

### LoadingContext

Gerencia loading global.

```javascript
const state = loadingContext.getState();
loadingContext.subscribe((state) => console.log(state));
loadingContext.start('Carregando...');
```

---

### UserContext

Gerencia usuário autenticado.

```javascript
const user = userContext.getUser();
userContext.subscribe((user) => console.log(user));
userContext.setUser({ id: '123', name: 'João' });
```

---

## Formulários

### FormContext

Gerencia estado de formulário.

```javascript
const form = FormContext.create({ name: '', email: '' });
form.setValue('name', 'João');
form.setError('email', 'Email inválido');
form.reset();
form.isValid();
```

---

### Validation

Validadores reutilizáveis.

```javascript
Validation.required(value);
Validation.email(value);
Validation.minLength(10)(value);
Validation.validate(value, [required, email]);
```

---

### DirtyState

Rastreamento de alterações.

```javascript
const dirty = DirtyState.create(initialValues);
dirty.isDirty();
dirty.getDirtyFields();
dirty.reset();
```

---

## Padrões de Uso

### Componentes

Sempre usar componentes oficiais:

```javascript
// ✅ CORRETO
const button = Button.create({ text: 'Salvar' });

// ❌ INCORRETO
const button = document.createElement('button');
```

### Tokens

Sempre usar tokens do tema:

```javascript
// ✅ CORRETO
padding: theme.spacing.md;

// ❌ INCORRETO
padding: '16px';
```

### API Client

Sempre usar API Client:

```javascript
// ✅ CORRETO
const api = new MotorComercialApi();
await api.listarPerfis();

// ❌ INCORRETO
fetch('/api/v1/comercial/perfis');
```

---

## Conclusão

Todos os componentes listados acima são oficiais e devem ser utilizados em todas as telas do Motor Comercial. Nenhum componente customizado deve ser criado sem aprovação prévia.
