# Frontend Architecture — Motor Comercial

**Sprint 2.7** — Arquitetura Oficial do Frontend

---

## Objetivo

Criar uma arquitetura frontend oficial para o Motor Comercial, estabelecendo padrões visuais, estruturais e de desenvolvimento que serão seguidos em todas as telas futuras.

---

## Filosofia

O Frontend deve espelhar a arquitetura do Backend:

```
Backend DDD → Frontend Components
Backend UseCases → Frontend Fluxos
Backend Projection → Frontend Views
Backend Result → Frontend Estados
```

---

## Estrutura Oficial

```
frontend/modules/motor-comercial/
├── api/                    # API Client Layer
│   ├── client.js
│   ├── MotorComercialApi.js
│   ├── ProjectionApi.js
│   ├── HealthApi.js
│   └── index.js
├── components/             # Componentes UI
│   ├── base/              # Componentes base
│   │   ├── Button.js
│   │   ├── Card.js
│   │   ├── Badge.js
│   │   ├── Alert.js
│   │   ├── Loading.js
│   │   ├── EmptyState.js
│   │   ├── Avatar.js
│   │   ├── Skeleton.js
│   │   ├── Divider.js
│   │   ├── Tag.js
│   │   └── index.js
│   ├── form/              # Componentes de formulário
│   │   ├── Input.js
│   │   ├── CurrencyInput.js
│   │   ├── Select.js
│   │   ├── Checkbox.js
│   │   ├── Switch.js
│   │   ├── Textarea.js
│   │   └── index.js
│   ├── data/              # Componentes de dados
│   │   ├── Table.js
│   │   ├── Pagination.js
│   │   ├── StatCard.js
│   │   ├── Progress.js
│   │   └── index.js
│   ├── layouts/           # Layouts
│   │   ├── ComercialLayout.js
│   │   ├── DashboardLayout.js
│   │   ├── CadastroLayout.js
│   │   ├── ConsultaLayout.js
│   │   ├── WizardLayout.js
│   │   ├── FullscreenLayout.js
│   │   └── index.js
│   └── navigation/       # Componentes de navegação
│       ├── Tabs.js
│       ├── Modal.js
│       ├── Stepper.js
│       └── index.js
├── contexts/              # Contexts globais
│   ├── ThemeContext.js
│   ├── ToastContext.js
│   ├── ModalContext.js
│   ├── LoadingContext.js
│   ├── UserContext.js
│   └── index.js
├── hooks/                 # Hooks reutilizáveis
│   ├── useLoading.js
│   ├── useRequest.js
│   ├── usePagination.js
│   ├── useFilters.js
│   ├── useToast.js
│   ├── useModal.js
│   ├── useConfirm.js
│   └── index.js
├── form/                  # Infraestrutura de formulário
│   ├── FormContext.js
│   ├── Validation.js
│   ├── DirtyState.js
│   └── index.js
├── pages/                 # Telas comerciais
│   ├── Dashboard/
│   ├── Consignacoes/
│   ├── NovaConsignacao/
│   ├── EntregaConsignacao/
│   ├── PrestacaoContas/
│   ├── PerfilComercial/       # Cliente 360°
│   ├── ContaCorrente/
│   ├── Relatorios/
│   ├── Indicadores/
│   ├── Pendencias/
│   ├── Recomendacoes/
│   ├── Playbooks/
│   └── WorkflowCenter/        # Sprint O-11
├── routes/                # Estrutura de rotas
│   └── index.js
├── theme/                 # Design System
│   ├── tokens.js
│   └── index.js
└── docs/                  # Documentação
    ├── FRONTEND_ARCHITECTURE.md
    ├── DESIGN_SYSTEM.md
    ├── COMPONENTS.md
    ├── DASHBOARD.md
    ├── PERFIL_COMERCIAL.md
    ├── CONTA_CORRENTE_COMERCIAL.md
    └── WORKFLOW_CENTER.md
```

---

## Design System

### Tokens

Todos os valores visuais são centralizados em `theme/tokens.js`:

- **Spacing**: Espaçamentos (xs, sm, md, lg, xl, xxl, xxxl)
- **Typography**: Fontes, tamanhos, pesos, line-height
- **Colors**: Paleta de cores (primary, secondary, success, warning, error, neutral)
- **Radius**: Bordas arredondadas
- **Shadow**: Sombras
- **Breakpoints**: Pontos de quebra responsivos
- **ZIndex**: Camadas
- **Animations**: Durações e easings

**Regra**: Nenhum componente deve ter valores "hardcoded". Sempre usar tokens.

### Theme

O tema oficial (`theme/index.js`) define:

- Cores de componentes (button, card, input, table, badge)
- Cores de status (active, inactive, pending, blocked, etc.)
- Valores padrão para todos os componentes

---

## Componentes

### Componentes Base

Componentes fundamentais reutilizáveis:

- **Button**: Botões com variantes (primary, secondary, danger, success, ghost)
- **Card**: Cards com header, body e footer
- **Badge**: Badges de status
- **Alert**: Alertas de informação (info, success, warning, error)
- **Loading**: Indicadores de loading
- **EmptyState**: Estados vazios com ícone e mensagem
- **Avatar**: Avatares com iniciais ou imagem
- **Skeleton**: Skeletons para loading
- **Divider**: Divisores horizontais e verticais
- **Tag**: Tags removíveis

### Componentes de Formulário

Componentes para entrada de dados:

- **Input**: Input de texto genérico
- **CurrencyInput**: Input monetário com formatação
- **Select**: Select dropdown
- **Checkbox**: Checkbox com label
- **Switch**: Toggle switch
- **Textarea**: Área de texto

### Componentes de Dados

Componentes para exibição de dados:

- **Table**: Tabela com ordenação, paginação, seleção
- **Pagination**: Controles de paginação
- **StatCard**: Cards de métricas com trend
- **Progress**: Barras de progresso

### Layouts

Layouts reutilizáveis:

- **ComercialLayout**: Layout oficial do Motor Comercial
- **DashboardLayout**: Layout para dashboards
- **CadastroLayout**: Layout para formulários de cadastro
- **ConsultaLayout**: Layout para listas e consultas
- **WizardLayout**: Layout para wizards/multi-step
- **FullscreenLayout**: Layout fullscreen

### Componentes de Navegação

Componentes para navegação:

- **Tabs**: Abas para organização de conteúdo
- **Modal**: Modais com backdrop
- **Stepper**: Stepper para wizards

---

## API Client

### ApiClient

Cliente HTTP base com métodos:

- `get(endpoint, options)`
- `post(endpoint, data, options)`
- `put(endpoint, data, options)`
- `patch(endpoint, data, options)`
- `delete(endpoint, options)`

### MotorComercialApi

API específica do Motor Comercial com métodos para:

- Perfis Comerciais
- Consignações
- Prestação
- Projeções

### ProjectionApi

API para Projection Services.

### HealthApi

API para health checks.

**Regra**: Nenhuma página deve usar `fetch` diretamente. Sempre usar o API Client.

---

## Hooks

### useLoading

Gerencia estado de loading:

```javascript
const loading = useLoading.create();
loading.startLoading();
loading.stopLoading();
```

### useRequest

Gerencia requisições API:

```javascript
const request = useRequest.create(apiClient);
await request.execute(() => api.get('/endpoint'));
```

### usePagination

Gerencia paginação:

```javascript
const pagination = usePagination.create({ pageSize: 10 });
pagination.setPage(2);
pagination.nextPage();
```

### useFilters

Gerencia filtros:

```javascript
const filters = useFilters.create();
filters.setFilter('status', 'active');
filters.clearFilters();
```

### useToast

Gerencia notificações toast:

```javascript
const toast = useToast.create();
toast.success('Operação realizada com sucesso');
toast.error('Erro ao processar');
```

### useModal

Gerencia estado de modais:

```javascript
const modal = useModal.create();
modal.openModal({ data: 'value' });
modal.closeModal();
```

### useConfirm

Gerencia diálogos de confirmação:

```javascript
const confirm = useConfirm.create();
const confirmed = await confirm.confirm({
  title: 'Confirmação',
  message: 'Tem certeza?'
});
```

---

## Contexts

Contextos globais singleton:

- **ThemeContext**: Gerencia tema
- **ToastContext**: Gerencia toasts globais
- **ModalContext**: Gerencia modais globais
- **LoadingContext**: Gerencia loading global
- **UserContext**: Gerenciamento de usuário autenticado

---

## Formulários

### FormContext

Gerencia estado de formulário:

```javascript
const form = FormContext.create({ name: '', email: '' });
form.setValue('name', 'John');
form.setError('email', 'Email inválido');
form.reset();
```

### Validation

Validadores reutilizáveis:

```javascript
Validation.required(value);
Validation.email(value);
Validation.minLength(10)(value);
Validation.validate(value, [required, email]);
```

### DirtyState

Rastreamento de alterações:

```javascript
const dirty = DirtyState.create(initialValues);
dirty.isDirty();
dirty.getDirtyFields();
```

---

## Rotas

Estrutura de rotas oficial em `routes/index.js`:

- Dashboard
- Consignações (lista, nova, detalhes, entrega)
- Prestação (conta corrente, histórico)
- Clientes Comerciais
- Indicadores
- Relatórios
- Perfis Comerciais
- Configurações
- Auditoria

---

## Páginas

Cada página segue estrutura padrão:

```
pages/NomePagina/
├── index.js           # Componente da página
├── PageHeader.js      # Header da página
├── Toolbar.js         # Barra de ferramentas
├── Filters.js         # Filtros
├── Table.js           # Tabela
├── Actions.js         # Ações
└── Styles.js          # Estilos específicos
```

---

## Padrões

### Uso de Componentes

**✅ CORRETO:**
```javascript
const button = Button.create({ text: 'Salvar', variant: 'primary' });
```

**❌ INCORRETO:**
```javascript
const button = document.createElement('button');
button.className = 'my-custom-button';
```

### Uso de Tokens

**✅ CORRETO:**
```javascript
padding: theme.spacing.md;
color: theme.colors.primary[600];
```

**❌ INCORRETO:**
```javascript
padding: '16px';
color: '#4285f4';
```

### Uso de API Client

**✅ CORRETO:**
```javascript
const api = new MotorComercialApi();
await api.listarPerfis();
```

**❌ INCORRETO:**
```javascript
fetch('/api/v1/comercial/perfis');
```

---

## Estados Visuais

Todo componente deve suportar:

- **Loading**: Estado de carregamento
- **Success**: Estado de sucesso
- **Warning**: Estado de aviso
- **Error**: Estado de erro
- **Disabled**: Estado desabilitado
- **ReadOnly**: Estado somente leitura
- **Empty**: Estado vazio
- **Offline**: Estado offline

---

## Responsividade

Breakpoints definidos:

- **xs**: 0px
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

Foco: Desktop, Notebook, Tablet (sem Mobile nesta fase).

---

## Acessibilidade

Preparado para:

- ARIA attributes
- Focus management
- Keyboard navigation
- Contraste adequado
- Labels em inputs

---

## Próximos Passos

### Sprint 2.8+

- Implementar telas reais usando componentes oficiais
- Integrar com API real
- Implementar testes de componentes
- Implementar Storybook
- Adicionar componentes especiais (ActionMenu, GraphContainer, Kanban)

---

## Critérios de Aceitação

✅ Estrutura oficial do frontend existe  
✅ Design System criado  
✅ Theme oficial criado  
✅ Componentes base criados  
✅ Layouts oficiais criados  
✅ API Client criado  
✅ Hooks criados  
✅ Contexts criados  
✅ Estrutura de rotas criada  
✅ Tokens centralizados  
✅ Nenhum componente possui valores visuais hardcoded  
✅ Documentação criada  

---

## Conclusão

Ao final desta Sprint, o Motor Comercial possui uma Arquitetura Frontend completa e um Design System oficial. As próximas Sprints serão dedicadas exclusivamente à implementação das telas utilizando esta fundação.
