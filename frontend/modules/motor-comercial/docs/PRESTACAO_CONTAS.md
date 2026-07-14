# Prestação de Contas — Motor Comercial

**Sprint 3.4** — Tela de Prestação de Contas Oficial

---

## Objetivo

Implementar a tela oficial de Prestação de Contas da Consignação, a principal tela operacional do Motor Comercial. Todo o fechamento comercial ocorre através desta interface.

---

## Princípio

**Nenhuma regra de negócio no Frontend.**

Todo cálculo deve ser realizado pelos Projection Services e Use Cases.

---

## Estrutura

```
pages/PrestacaoContas/
├── index.js           # Componente principal
└── styles.css         # Estilos específicos
```

---

## Layout

Utiliza `WizardLayout` (simplificado, sem stepper):

```
Header
    ↓
Dados da Consignação
    ↓
Resumo Geral (StatCards)
    ↓
Tabela de Itens
    ↓
Painel de Movimentações (Timeline)
    ↓
Painel Financeiro
    ↓
Checklist de Fechamento
    ↓
Painel de Impacto
    ↓
Footer (Botões de Operação)
```

---

## Header

Exibe:
- **Título**: "Prestação de Contas"
- **Subtítulo**: "Gerencie vendas, perdas e pagamentos da consignação"

---

## Dados da Consignação

Card com informações principais:
- Documento
- Cliente
- Consignado
- Empresa
- Filial
- Status (badge)
- Data da Entrega
- Prestação Nº
- Grupo

---

## Resumo Geral

7 StatCards com métricas principais (via Projection Services):

1. **Valor Consignado** - Valor total da consignação
2. **Valor Vendido** - Valor total vendido
3. **Valor Devolvido** - Valor total devolvido
4. **Valor Perdido** - Valor total perdido
5. **Valor Cortesia** - Valor total em cortesia
6. **Valor Recebido** - Valor total recebido
7. **Saldo Atual** - Saldo atual da prestação

---

## Tabela de Itens

Colunas:
- Produto
- Enviado
- Vendido
- Devolvido
- Perdido
- Cortesia
- Saldo
- Preço
- Valor
- Status (badge)
- Ações

---

## Ações por Item

Cada item possui ações:
- **Registrar Venda** - POST /prestacao/venda
- **Registrar Perda** - POST /prestacao/perda
- **Registrar Cortesia** - POST /prestacao/cortesia
- **Registrar Devolução** - POST /prestacao/devolucao
- **Visualizar Histórico** - Drawer com histórico do item

Todas chamando a API.

---

## Painel de Movimentações

Timeline da Prestação via `TimelineProjectionService`:

Eventos:
- Abertura
- Vendas
- Perdas
- Cortesias
- Pagamentos
- Reabertura
- Fechamento

---

## Painel Financeiro

Exibe:
- Valor Total
- Recebimentos
- Saldo
- Situação (badge)
- Limite Consumido

Todos via Projection Services.

---

## Checklist de Fechamento

6 validações em tempo real:

1. ✓ Prestação aberta
2. ✓ Todos os itens conferidos
3. ✓ Nenhuma inconsistência
4. ✓ Pagamentos registrados
5. ✓ Saldo calculado
6. ✓ Operador autorizado

**Comportamento:**
- Itens válidos: borda verde (✓)
- Itens inválidos: borda vermelha (✗)
- Botão "Fechar Prestação" bloqueado se inválido

---

## Painel de Impacto

Painel informativo mostrando o que acontecerá após o fechamento:

• Ledger receberá FECHAMENTO_PRESTACAO.
• Prestação ficará ACERTADA ou ENCERRADA.
• Novas vendas serão bloqueadas.
• Histórico será consolidado.

---

## Botões de Operação

### Prestação Aberta

- **Registrar Venda** - Registrar venda global
- **Registrar Perda** - Registrar perda global
- **Registrar Cortesia** - Registrar cortesia global
- **Registrar Pagamento** - Registrar pagamento
- **Fechar Prestação** - Fechar prestação (bloqueado se checklist inválido)
- **Cancelar** - Voltar

### Prestação Fechada

- **Reabrir Prestação** - Reabrir prestação
- **Cancelar** - Voltar

---

## API

Consumo exclusivo de API e Projection Services:

```
GET /api/v1/comercial/projections/resumo-prestacao
    → Resumo financeiro da prestação

GET /api/v1/comercial/projections/timeline
    → Timeline de eventos

GET /api/v1/comercial/projections/historico
    → Histórico completo

POST /api/v1/comercial/prestacao/venda
    → Registrar venda

POST /api/v1/comercial/prestacao/perda
    → Registrar perda

POST /api/v1/comercial/prestacao/cortesia
    → Registrar cortesia

POST /api/v1/comercial/prestacao/pagamento
    → Registrar pagamento

POST /api/v1/comercial/prestacao/fechar
    → Fechar prestação

POST /api/v1/comercial/prestacao/reabrir
    → Reabrir prestação
```

---

## UX

### Nenhum Cálculo no Frontend

Todos os cálculos via Projection Services:
- Valores calculados pelo backend
- Saldo calculado pelo backend
- Situação determinada pelo backend

### Atualização Automática

Após cada operação:
- `_loadData()` é chamado automaticamente
- Todos os widgets são atualizados
- Feedback imediato ao usuário

### Feedback Imediato

- Loading states visíveis
- Mensagens de erro amigáveis
- Confirmação antes de operações críticas

### Scroll Inteligente

- Scroll automático para áreas relevantes
- Foco em áreas alteradas

---

## Estados

### Loading
- Carregando dados da prestação
- Processando operação

### Error
- Erro ao carregar dados
- Erro ao executar operação

### No Movements
- Nenhuma movimentação registrada
- Exibe EmptyState

### Closed
- Prestação fechada (ACERTADA ou ENCERRADA)
- Botão "Reabrir" visível
- Operações bloqueadas

### Open
- Prestação aberta
- Botões de operação visíveis

### Offline
- Sem conexão com API
- Mensagem de erro

---

## Componentes do Design System Utilizados

- `WizardLayout` - Layout base (simplificado)
- `Button` - Botões de ação
- `Table` - Tabela de itens
- `Loading` - Indicadores de loading
- `EmptyState` - Estados vazios
- `Alert` - Alertas de erro
- `Badge` - Badges de status
- `Card` - Cards de conteúdo
- `StatCard` - Cards de métricas
- `Timeline` - Timeline de eventos

---

## Performance

### Partial Updates

Atualizações apenas de widgets alterados:
- Content atualizado após carregamento
- Footer atualizado após mudança de estado
- Checklist atualizado após validação

### Parallel Requests

Carregamento em paralelo:
```javascript
const [consignacao, prestacao, timeline, historico] = await Promise.all([
  this.api.obterConsignacao(this.consignacaoId),
  this.projectionApi.obterProjecaoResumoPrestacao({ consignacaoId }),
  this.projectionApi.obterProjecaoTimeline({ consignacaoId }),
  this.projectionApi.obterProjecaoHistorico({ consignacaoId })
]);
```

### Selective Refresh

Auto-update após cada operação:
- `_loadData()` recarrega todos os dados
- Apenas widgets alterados são renderizados
- Evita renderizações desnecessárias

---

## Responsividade

### Desktop (1024px+)
- Layout completo
- 3 colunas em detalhes
- 4 colunas em resumo
- 3 colunas em financeiro
- 2 colunas em checklist

### Notebook (768px - 1023px)
- Layout adaptado
- 2 colunas em detalhes
- 2 colunas em resumo
- 2 colunas em financeiro
- 1 coluna em checklist
- Botões empilhados

### Tablet (640px - 767px)
- Layout simplificado
- 1 coluna em detalhes
- 2 colunas em resumo
- 1 coluna em financeiro
- 1 coluna em checklist
- Botões full-width
- Ações de itens verticais

---

## Fluxo de Dados

```
1. Render inicial com loading
2. Carregar dados em paralelo (consignacao, prestacao, timeline, historico)
3. Atualizar checklist com validações
4. Exibir dados e itens
5. Usuário registra venda
6. Executar POST /venda
7. Auto-update (recarregar dados)
8. Atualizar checklist
9. Usuário registra pagamento
10. Executar POST /pagamento
11. Auto-update
12. Usuário clica em Fechar
13. Validar checklist
14. Confirmar ação
15. Executar POST /fechar
16. Atualizar UI para estado fechado
```

---

## Validações

### Checklist de Fechamento

Validações em tempo real:

```javascript
prestacaoAberta = !isClosed
itensConferidos = resumoPrestacao.itensConferidos
semInconsistencia = !resumoPrestacao.inconsistencias || resumoPrestacao.inconsistencias.length === 0
pagamentosRegistrados = resumoPrestacao.pagamentosRegistrados
saldoCalculado = resumoPrestacao.saldoCalculado
operadorAutorizado = true // TODO: Implement authorization
```

### Bloqueio de Botão

Botão "Fechar Prestação" bloqueado se:
- Qualquer item do checklist inválido
- Loading em andamento
- Erro no carregamento

---

## Formatação

### Moeda
```javascript
_formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}
```

### Data
```javascript
_formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
}
```

---

## Critérios de Aceitação

✅ Tela completa de Prestação  
✅ Todos os botões funcionando  
✅ Timeline integrada  
✅ Projection Services utilizados  
✅ Checklist operacional funcionando  
✅ Painel Financeiro funcionando  
✅ Nenhum cálculo no Frontend  
✅ Todos os componentes reutilizados  
✅ Responsividade Desktop/Notebook/Tablet  
✅ Parallel loading implementado  
✅ Auto-update após cada operação  
✅ Estados de Loading/Error implementados  

---

## Próximos Passos

### Sprint 3.5+

- Implementar autorização de operador real
- Implementar dialogs oficiais para operações globais
- Implementar Drawer para histórico de itens
- Implementar Toast notifications
- Adicionar mais validações customizáveis
- Implementar relatórios de prestação
- Implementar exportação de dados
- Implementar assinatura digital
- Implementar testes de componentes
- Implementar testes de integração
- Implementar testes E2E

---

## Reutilização

Esta tela será a principal ferramenta operacional dos clientes que trabalham com consignação e servirá como referência para futuras telas financeiras do CDS Sistemas, como:

- Fechamento de Vendas
- Conciliação Financeira
- Gestão de Estoques
- Outras operações financeiras

Padrões estabelecidos aqui devem ser seguidos consistentemente.
