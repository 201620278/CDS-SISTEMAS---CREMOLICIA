# Operacionalização ERP — Motor Comercial

**Sprint O-1** — Integração Operacional ERP ↔ Motor Comercial

---

## Objetivo

Substituir os placeholders do ERP pelas telas reais do Motor Comercial, permitindo navegação operacional pelo menu do sistema sem reload completo.

---

## Arquitetura

```
ERP (index.html + app.js)
  └── comercial.js          → ponte ERP
        └── MotorComercial  → bootstrap + router + API
              └── pages/    → telas reais montadas em #page-content
```

---

## Bootstrap

**Arquivo:** `frontend/modules/motor-comercial/bootstrap/index.js`

Responsabilidades:

1. Injetar tokens CSS e estilos dos componentes (`styles/inject.js`)
2. Inicializar contexts (`Theme`, `Loading`, `Toast`, `Modal`, `User`)
3. Inicializar API clients com `API_URL/comercial` e token do ERP
4. Criar overlay global de loading (`#motor-comercial-loading`)
5. Registrar componentes de página e instanciar o `Router`
6. Expor API global em `window.MotorComercial`

### Uso

```javascript
MotorComercial.bootstrap({
  mountTarget: '#page-content',
  apiBaseURL: `${API_URL}/comercial`
});
```

O ERP chama o bootstrap automaticamente na primeira navegação comercial via `comercial.js`.

---

## Router

**Arquivo:** `frontend/modules/motor-comercial/router/Router.js`

Utiliza a tabela declarativa existente em `routes/index.js`.

### Recursos

| Recurso | Suporte |
|---------|---------|
| Rotas simples | `/consignacoes` |
| Parâmetros | `/consignacoes/:id/entrega` |
| Querystring | `/consignacoes?status=aberta` |
| Navegação programática | `navigate()`, `abrirTela()` |
| Histórico interno | `voltar()`, `avançar()`, `history` |
| Atualização parcial | montagem em `#page-content` sem reload |
| Loading global | overlay durante troca de página |
| Erro | `ErrorState` com retry |
| Tela pendente | `EmptyState` padronizado |

---

## Mapeamento ERP → Motor

| Menu ERP (`data-page`) | Destino |
|------------------------|---------|
| `comercial-dashboard` | Dashboard (`/`) |
| `comercial-clientes` | Perfil Comercial (`/clientes`) |
| `comercial-consignacao-nova` | Nova Consignação |
| `comercial-consignacao-lista` | Central Consignações |
| `comercial-acertos` | EmptyState |
| `comercial-conta-corrente` | EmptyState |
| `comercial-perdas` | EmptyState |
| `comercial-cortesias` | EmptyState |
| `comercial-relatorios` | EmptyState |

Rotas internas adicionais (navegação entre telas):

| Rota | Página |
|------|--------|
| `/consignacoes/:id/entrega` | Entrega |
| `/consignacoes/:id/prestacao` | Prestação |

---

## Fluxo de Montagem

1. Usuário clica no menu Comercial do ERP
2. `app.js` chama `loadComercial(page)`
3. `comercial.js` garante bootstrap e chama `MotorComercial.abrirTela(page)`
4. Router resolve rota ERP → path interno
5. Loading global é exibido
6. Factory da página executa `Page.create()` (ou `create(id)`)
7. Elemento é montado em `#page-content` dentro de `.motor-comercial-page`
8. Loading é removido
9. Em falha, `ErrorState` é exibido (nunca tela branca)

---

## Integração ERP

### Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `frontend/erp/js/comercial.js` | Ponte operacional (sem placeholders) |
| `frontend/erp/index.html` | Bundle + CSS das páginas |
| `frontend/css/comercial.css` | Ajustes de layout responsivo |

### Bundle browser

O módulo é CommonJS; para o browser é gerado:

```bash
npm run build:motor-comercial
```

**Saída:** `frontend/modules/motor-comercial/motor-comercial.bundle.js`

---

## API Client

Inicialização no bootstrap:

- `ApiClient` → base `${API_URL}/comercial`
- `MotorComercialApi`
- `ProjectionApi`
- `HealthApi`
- Token JWT do `localStorage` (mesmo padrão do ERP)

Variável global auxiliar: `window.MOTOR_COMERCIAL_API_BASE`

---

## Navegação exposta

| Função ERP | API Motor |
|------------|-----------|
| `abrirTelaComercial()` | `MotorComercial.abrirTela()` |
| `voltarComercial()` | `MotorComercial.voltar()` |
| `avançarComercial()` | `MotorComercial.avancar()` |
| `refreshComercial()` | `MotorComercial.refresh()` |
| `navigateComercial()` | `MotorComercial.navigate()` |

---

## Layouts

Layouts oficiais utilizados pelas páginas montadas:

- `DashboardLayout` → Dashboard
- `ConsultaLayout` → Consignações, Perfil Comercial
- `WizardLayout` → Nova Consignação, Entrega, Prestação
- `FullscreenLayout` → disponível para fluxos futuros

---

## Critérios de aceitação (Sprint O-1)

- [x] Menu Comercial abre telas reais
- [x] Placeholders do ERP eliminados
- [x] Router operacional
- [x] Bootstrap operacional
- [x] Contexts carregados
- [x] API inicializada com ERP
- [x] Navegação (`abrirTela`, `voltar`, `avançar`, `refresh`, `navigate`)
- [x] `ErrorState` em falhas
- [x] Loading global em troca de páginas
- [x] `EmptyState` para telas pendentes
- [x] Documentação criada

---

## Sprint O-2 — Fluxo Operacional da Consignação

### Objetivo

Operacionalizar o fluxo completo:

```
Nova Consignação → Entrega → Prestação → Encerramento → Central
```

### Mapa de navegação

| Etapa | Rota | Ação |
|-------|------|------|
| Central | `/consignacoes` | Listar, drawer, ações |
| Nova | `/consignacoes/nova` | Wizard de criação |
| Entrega | `/consignacoes/:id/entrega` | POST `/consignacoes/:id/entrega` |
| Prestação | `/consignacoes/:id/prestacao` | Operações de prestação |
| Retorno | `/consignacoes` | Após fechamento |

Toda navegação usa `navigate()` / `MotorComercial.navigate()` — sem `location.reload()`.

### Sequência de operações

1. **Nova Consignação** — busca cliente (ERP `/clientes`), perfil (`/perfil-comercial`), produtos (ERP `/produtos`), cria consignação e itens
2. **Entrega** — checklist operacional + `POST /consignacoes/:id/entrega`
3. **Abertura da Prestação** — `POST /consignacoes/:id/prestacao/abrir`
4. **Movimentações** — venda, perda, cortesia, pagamento, devolução
5. **Fechamento** — `POST /consignacoes/:id/prestacao/fechar`
6. **Retorno** — navegação para Central com refresh automático

### API alinhada ao backend

**MotorComercialApi** (`/api/comercial`):

- Perfis: `/perfil-comercial`
- Consignações: `/consignacoes`, itens, entrega, devolução
- Prestação: `/consignacoes/:id/prestacao/*`

**ProjectionApi**:

- `/projections/timeline`
- `/projections/historico`
- `/projections/resumo-prestacao`
- `/projections/situacao-cliente`

Métodos adicionados: `obterPerfil`, `listarPrestacoes`, `registrarDevolucao`, `reabrirPrestacao`, `obterResumoPrestacao`, `obterSituacaoCliente`, `listarMovimentacoes`, `listarTimeline`.

### Tratamento de erros e UX

| Situação | Componente |
|----------|------------|
| Sucesso | `showNotification` / Toast |
| Confirmação | Modal oficial (`confirmDialog`) |
| Entrada de dados | Modal oficial (`promptDialog`) |
| Erro de operação | Toast + Alert na tela |
| Falha de rota | `ErrorState` |
| Lista vazia | `EmptyState` |
| Operações críticas | Loading global (`withLoading`) |

**Proibido no fluxo:** `alert()`, `confirm()`, `prompt()`, `console.log()`, TODOs.

### Utilitários operacionais

**Arquivo:** `frontend/modules/motor-comercial/utils/operacional.js`

- `navigate`, `notify`, `confirmDialog`, `promptDialog`, `choiceDialog`
- `buscarClientesErp`, `buscarProdutosErp`
- `carregarConsignacaoCompleta`, `withLoading`

### Componente Timeline

**Arquivo:** `frontend/modules/motor-comercial/components/special/Timeline.js`

Substitui uso incorreto de `Drawer` como timeline nas telas de Consignação e Prestação.

### Critérios de aceitação (Sprint O-2)

- [x] Fluxo completo conectado
- [x] APIs alinhadas às rotas oficiais
- [x] Sem TODO / console.log / prompt / confirm no fluxo
- [x] Timeline e Drawer funcionais
- [x] Navegação via router
- [x] Refresh automático após operações
- [x] Documentação atualizada

---

## Próximas evoluções

- Implementar telas pendentes (Acertos, Perdas, Cortesias, Relatórios)
- Duplicação e impressão avançada de consignações
- Melhorias de projeção de itens no resumo de prestação
