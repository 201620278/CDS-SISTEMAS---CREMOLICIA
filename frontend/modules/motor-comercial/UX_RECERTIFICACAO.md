# UX-05.5 — Recertificação da Experiência do Usuário

**Motor Comercial · CDS Sistemas**  
**Data:** 09/07/2026  
**Escopo:** Frontend exclusivamente (sem alterações em backend, APIs, banco ou regras de negócio)

---

## Resumo executivo

Após as sprints UX-01 a UX-05, esta sprint consolidou o Motor Comercial em um produto visual e linguisticamente coerente. O trabalho focou em padronizar linguagem operacional, navegação, cabeçalhos, sidebars, rodapés e estados — sem adicionar funcionalidades.

**Resultado:** 158 testes frontend passando. Nenhuma alteração fora do frontend.

---

## Problemas encontrados

### Linguagem técnica visível ao operador

| Termo técnico | Onde aparecia |
|---------------|---------------|
| Prestação / Prestação de Contas | Consignações, Central do Cliente, Central de Trabalho, drawers, badges, extrato |
| Ledger / Projection | Conta Corrente (rodapé), Histórico, extrato (`origem: LEDGER`) |
| Central de Inteligência Analítica | Relatórios (título, sidebar, rodapé) |
| Clientes 360° | Relatórios (sidebar) |
| Central Operacional / Cockpit | Consignações, Pendências, Recomendações, drawers |
| Correlation | Histórico (coluna da tabela) |
| Painel (genérico) | Sidebars em várias telas |

### Navegação inconsistente

- Sidebars com rótulos diferentes para a mesma destinação (`Painel` vs `Central de Trabalho`, `Central Operacional` vs `Consignações`).
- Botão voltar em Histórico dizia "Voltar à Prestação" em vez de linguagem de fechamento.
- Conta Corrente usava `parseCliente360Context` sem suporte a `origem=central`.

### Hierarquia visual fragmentada

- Cabeçalhos com estilos distintos entre Consignações, Relatórios, Conta Corrente e Histórico.
- Rodapés com mensagens técnicas ou de produto interno.

### Botões redundantes ou ambíguos

- "Nova Prestação" e "Prestação" coexistiam com "Fechar Consignação" (UX-05).
- "Abrir Prestação" no drawer de consignação duplicava ação já nomeada no fluxo principal.

---

## Problemas corrigidos

### Central de Trabalho (`pages/Dashboard/`)

- Resumo do dia: "Prestações pendentes" → **Fechamentos pendentes**
- Botão na tabela: "Iniciar Prestação" → **Fechar Atendimento**
- Timeline: eventos humanizados como **Atendimento encerrado** / **Fechamento iniciado**
- Empty state de fechamentos padronizado

### Central de Clientes / Operações (`pages/PerfilComercial/`)

- Ações: **Fechar Atendimento**, **Fechar Consignação**, **Preparar Entrega**
- Labels: **Último Fechamento** (antes "Última Prestação")
- Cadastro: **Prazo para Fechamento (dias)**
- Indicadores do perfil: **Fechamento em Aberto / Atrasado**, **Tempo Médio de Fechamento**

### Consignações (`pages/Consignacoes/`)

- Título: **Consignações** (antes "Central de Operações Comerciais")
- Atalhos: **Preparar Entrega**, **Fechar Atendimento**, **Central de Trabalho**
- Filtros, colunas, badges e KPIs: linguagem de **Fechamento**
- Cabeçalho com classe `cds-ux-page-header`

### Preparar Entrega / Fechar Consignação

- Mantidos os fluxos UX-04 e UX-05; fase legada `Ledger` renomeada para **Movimentações** em mappers internos ainda referenciados

### Conta Corrente (`pages/ContaCorrente/`)

- **UX-11:** shell Shared UI `Workspace` (Header / Body / Footer)
- Viewport: cliente · documento · período · saldo · extrato · Receber
- Análise (KPIs/gráficos/timeline) recolhida — fora do default
- Título: **Conta Corrente**
- Sem DashboardLayout / sidebar operacional
- `parseNavigationContext` para retorno correto com `origem=central`
- Tipos de movimento: **Fechamento iniciado/concluído/reaberto**
- Origem padrão: **Sistema** (antes `LEDGER`)

### Histórico (`pages/HistoricoPrestacao/`)

- Título: **Histórico do Atendimento**
- Botão: **Voltar ao Fechamento**
- Seção: **Movimentações Financeiras** (antes "Movimentações (Ledger)")
- Coluna: **Referência** (antes "Correlation")

### Relatórios (`pages/Relatorios/`)

- Título: **Relatórios**
- Sidebar: Central de Trabalho, Consignações, Central de Clientes, Conta Corrente, Relatórios
- Rodapé operacional sem jargão de plataforma
- Catálogo: relatório **Fechamento**

### Entrega (`pages/EntregaConsignacao/`)

- Impactos da entrega em linguagem operacional (sem Ledger)
- Diálogo pós-entrega: **Fechar Atendimento** / **Voltar à Central**
- `parseNavigationContext` aplicado

### Drawers e telas auxiliares

- **CockpitDrawer**, **DetalhesConsignacao**: aba e botão **Fechamento** / **Fechar Atendimento**
- **WorkflowDrawer**, **PendenciasDrawer**, **RecomendacoesDrawer**: links padronizados
- **Pendencias** / **Recomendacoes**: sidebar **Consignações**
- **IndicadorDrawer** / **ExecutiveDrawer**: atalho **Consignações**
- **Playbooks**: tipo **Fechamento**

### Rotas (`routes/index.js`)

- Meta title: **Histórico do Atendimento**

### Estilos compartilhados (`styles/ux-enterprise.css`)

- Tokens para cabeçalhos, sidebars, rodapés e estados — vinculado em `frontend/erp/index.html`

---

## Melhorias realizadas

1. **Vocabulário único** em todo o módulo para o ciclo operacional: Preparar Entrega → Entregar → Fechar Consignação / Fechar Atendimento → Conta Corrente.
2. **Navegação previsível**: mesmos nomes de destino em sidebars de Consignações, Relatórios e Conta Corrente.
3. **Contexto de retorno** unificado via `parseNavigationContext` (suporta `origem=cliente360` e `origem=central`).
4. **Feedback mais claro** em confirmações de entrega e mensagens de timeline.
5. **Classe visual `cds-ux-page-header`** aplicada em telas auditadas para hierarquia tipográfica consistente.

---

## Itens adiados

| Item | Motivo |
|------|--------|
| Remoção física de `Cliente360View.js` e mappers legados | Arquivo não referenciado em runtime; remoção exigiria refactor de imports/tests sem ganho UX imediato |
| Unificação total de sidebars em drawers secundários (Playbooks, Workflow) | Telas de suporte operacional; já receberam ajustes de links, mas layout completo fica para sprint futura |
| Substituição de `WizardLayout` por layout sem nome "wizard" | Componente interno; operador não vê o termo |
| Renomear rotas `/prestacao` na URL | Exigiria alteração de rotas/links em massa; termo não aparece na UI principal |
| Performance visual (re-renders, flicker) | Requer profiling em browser real; fora do escopo de strings/layout desta sprint |
| Responsividade mobile profunda | Tokens aplicados; breakpoints específicos não auditados tela a tela |

---

## Itens removidos (da interface)

- Texto "Ledger — Projection Services" do rodapé da Conta Corrente
- "Central de Inteligência Analítica" como título visível
- "Clientes 360°" na navegação de Relatórios
- "Central Operacional" / "Cockpit Operacional" como rótulos de tela
- "Correlation" como cabeçalho de coluna
- Botões duplicados com rótulo "Prestação" onde já existia "Fechar Atendimento"

---

## Itens padronizados

### Nomenclatura oficial (UI)

| Conceito | Termo na interface |
|----------|-------------------|
| Home | Central de Trabalho |
| Lista de clientes | Central de Clientes |
| Painel do cliente | Central de Operações do Cliente |
| Nova consignação | Preparar Entrega |
| Prestação de contas | Fechar Consignação / Fechar Atendimento |
| Prestação (status) | Fechamento |
| Extrato | Conta Corrente |
| Analytics hub | Relatórios |
| Lista de documentos | Consignações |

### Termos proibidos na UI

`Cliente360`, `Workflow`, `Ledger`, `Projection`, `Outbox`, `UseCase`, `DTO`, `Repository`, `Cockpit`, `360°`, `Correlation`

*(Continuam existindo apenas em código interno, APIs e comentários de módulo.)*

### Estados da interface

- Loading, EmptyState, Alert e ErrorState já compartilham componentes base (`components/base/`).
- Rodapés e sidebars seguem `ux-enterprise.css`.

---

## Componentes consolidados

| Componente / recurso | Uso |
|---------------------|-----|
| `styles/ux-enterprise.css` | Cabeçalhos, sidebars, rodapés em telas operacionais |
| `utils/cliente360Context.js` → `parseNavigationContext` | Retorno contextual em Conta Corrente, Entrega, Histórico |
| `CentralOperacoesView` | Substitui layout Cliente 360° no painel do cliente |
| `CentralTrabalhoView` | Home operacional |
| `PrepararEntregaView` | Fluxo de entrega (UX-04) |
| `FecharConsignacaoView` | Fluxo de fechamento (UX-05) |
| Badges (`Consignacoes/badges.js`) | Status **Fechamento em Aberto** |
| `extratoMappers.js` | Tipos de lançamento em linguagem operacional |

---

## Checklist final de aceite

| Critério | Status |
|----------|--------|
| Nenhuma inconsistência visual evidente nas telas principais | ✅ |
| Linguagem padronizada (termos técnicos removidos da UI) | ✅ |
| Navegação contínua com retornos contextuais | ✅ |
| Botões redundantes eliminados ou renomeados | ✅ |
| Campos desnecessários | ⏸️ (adiado — sem alteração de formulários nesta sprint) |
| Menus coerentes entre telas | ✅ |
| Feedback consistente em mensagens principais | ✅ |
| Estados padronizados via componentes base + CSS enterprise | ✅ |
| Fluxos contínuos UX-04/05 preservados | ✅ |
| Componentes reutilizados (`ux-enterprise.css`, context utils) | ✅ |
| Nenhuma alteração em backend | ✅ |
| Nenhuma alteração em APIs | ✅ |
| Nenhuma alteração em banco | ✅ |
| Nenhuma alteração em regras de negócio | ✅ |
| Suite de testes frontend | ✅ 158/158 |

---

## Telas auditadas

- [x] Central de Trabalho
- [x] Central de Clientes
- [x] Central de Operações do Cliente
- [x] Preparar Entrega
- [x] Fechar Consignação
- [x] Conta Corrente
- [x] Histórico do Atendimento
- [x] Relatórios
- [x] Consignações (lista)
- [x] Entrega de Consignação
- [x] Menus laterais / cabeçalhos / rodapés das telas acima
- [x] Modais e drawers principais (Cockpit, Pendências, Recomendações, Workflow)
- [~] Playbooks / Central de Processos — links padronizados; layout completo adiado

---

## Referência para futuros motores

O Motor Comercial recertificado define:

1. **Linguagem operacional** — o operador nunca vê arquitetura interna.
2. **`cds-ux-page-header`** — hierarquia de título em maiúsculas discretas + subtítulo contextual.
3. **Sidebars com 4–5 atalhos fixos** — Central de Trabalho, Consignações, Central de Clientes, fluxo atual.
4. **Ações nomeadas pelo próximo passo** — "Fechar Atendimento", não "Abrir Prestação".
5. **Documento de recertificação** — gerar `UX_RECERTIFICACAO.md` ao concluir ciclos UX enterprise.

---

*Sprint UX-05.5 concluída. Motor Comercial aprovado como padrão oficial de UX do CDS Sistemas.*
