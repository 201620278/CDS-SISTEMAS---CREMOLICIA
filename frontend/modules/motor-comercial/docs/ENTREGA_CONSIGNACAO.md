# Entrega de Consignação — Motor Comercial

**Sprint 3.3** — Tela de Entrega Oficial da Consignação

---

## Objetivo

Implementar a tela oficial de Entrega da Consignação, o momento mais importante do fluxo comercial. É aqui que nasce oficialmente a operação.

---

## Princípio

**Exclusivo consumo da API:**
```
POST /api/v1/comercial/consignacoes/:id/entrega
```

Nenhuma regra comercial no Frontend. Toda validação e execução via API.

---

## Estrutura

```
pages/EntregaConsignacao/
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
Resumo (StatCards)
    ↓
Checklist Operacional
    ↓
Lista de Itens
    ↓
Painel de Impacto
    ↓
Footer (Botão Entregar)
```

---

## Header

Exibe:
- **Título**: "Entrega de Consignação"
- **Subtítulo**: "Revise os dados e confirme a entrega"

---

## Dados da Consignação

Card com informações principais:
- Documento
- Cliente
- Consignado
- Empresa
- Filial
- Data
- Status (badge)
- Usuário

---

## Resumo

4 StatCards com métricas principais:

1. **Quantidade de Itens** - Número de itens na consignação
2. **Valor Total** - Valor total da consignação
3. **Limite Comercial** - Limite do cliente
4. **Saldo Disponível** - Limite disponível após descontar saldo atual

Dados via Projection Services.

---

## Checklist Operacional

Painel de validação em tempo real com 8 itens:

1. ✓ Cliente válido
2. ✓ Perfil Comercial ativo
3. ✓ Limite suficiente
4. ✓ Documento válido
5. ✓ Itens cadastrados
6. ✓ Quantidades válidas
7. ✓ Consignação em RASCUNHO
8. ✓ Operador autorizado

**Comportamento:**
- Itens válidos: borda verde (✓)
- Itens inválidos: borda vermelha (✗)
- Se algum item falhar: botão "Entregar" bloqueado

---

## Lista de Itens

Tabela read-only (apenas conferência):

Colunas:
- Produto
- Quantidade
- Unidade
- Preço
- Valor
- Observação
- Status (badge)

**Não permite edição.** Apenas conferência visual.

---

## Painel de Impacto

Painel informativo mostrando o que acontecerá após a entrega:

• Será gerada movimentação no Ledger.
• O estoque será baixado.
• O limite comercial será consumido.
• A Consignação passará para ENTREGUE.
• A operação poderá iniciar Prestação de Contas.

**Este painel é puramente informativo.**

---

## Confirmação

Antes da entrega:
1. Usuário clica em "Entregar"
2. Confirmação via `confirm()`: "Deseja confirmar a entrega desta consignação?"
3. Se confirmado, executa entrega

---

## Execução

**API Endpoint:**
```
POST /api/v1/comercial/consignacoes/:id/entrega
```

**Payload:**
```javascript
{
  correlationId: "corr-timestamp-random",
  requestId: "req-timestamp-random",
  usuario: "operador",
  data: "2024-01-15T10:00:00Z"
}
```

---

## Resultado

### Sucesso

Após entrega bem-sucedida:
1. Mensagem: "Entrega realizada com sucesso!"
2. Dialog com opções:
   - Voltar para Central de Consignações
   - Abrir Prestação de Contas
3. Redirecionamento conforme escolha do operador

### Erro

Mensagens amigáveis para cada caso:
- **Perfil bloqueado**: "O perfil do cliente está bloqueado. Entre em contato com o administrador."
- **Limite insuficiente**: "O limite comercial do cliente é insuficiente para esta operação."
- **Cliente bloqueado**: "O cliente está bloqueado. Não é possível realizar a entrega."
- **Consignação inválida**: "A consignação não está em um estado válido para entrega."
- **Falha na integração**: "Ocorreu um erro na integração. Tente novamente."

**Nunca mostrar stack trace.**

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

---

## API

Consumo exclusivo de API e Projection Services:

```
GET /api/v1/comercial/consignacoes/:id
    → Dados da consignação

GET /api/v1/comercial/projections/resumo-prestacao
    → Resumo de prestação e limite disponível

POST /api/v1/comercial/consignacoes/:id/entrega
    → Executar entrega
```

---

## UX

### Nenhuma Edição

Tela exclusivamente de conferência:
- Todos os campos read-only
- Tabela de itens não editável
- Foco na validação e confirmação

### Botão Entregar

Sempre destacado:
- Variant: primary
- Bloqueado quando checklist inválido
- Texto muda para "Processando..." durante execução

### Checklist Sempre Visível

- Posição fixa na tela
- Atualização em tempo real
- Feedback visual imediato

---

## Performance

### Parallel Loading

Carregamento em paralelo:
```javascript
const [consignacao, prestacao] = await Promise.all([
  this.api.obterConsignacao(this.consignacaoId),
  this.projectionApi.obterProjecaoResumoPrestacao({ consignacaoId })
]);
```

### Selective Updates

Atualizações apenas de widgets alterados:
- Content atualizado após carregamento
- Footer atualizado após mudança de estado
- Checklist atualizado após validação

---

## Responsividade

### Desktop (1024px+)
- Layout completo
- 4 colunas em detalhes
- 4 colunas em resumo
- 2 colunas em checklist

### Notebook (768px - 1023px)
- Layout adaptado
- 2 colunas em detalhes
- 2 colunas em resumo
- 1 coluna em checklist
- Botões empilhados

### Tablet (640px - 767px)
- Layout simplificado
- 1 coluna em detalhes
- 2 colunas em resumo
- 1 coluna em checklist
- Botões full-width

---

## Fluxo de Dados

```
1. Render inicial com loading
2. Carregar consignação e prestação em paralelo
3. Atualizar checklist com validações
4. Exibir dados e itens
5. Usuário revisa checklist
6. Usuário clica em Entregar
7. Confirmar ação
8. Executar POST /entrega
9. Mostrar resultado
10. Redirecionar conforme escolha
```

---

## Validações

### Checklist Operacional

Validações em tempo real:

```javascript
clienteValido = !!consignacao.cliente
perfilAtivo = consignacao.perfilStatus === 'ATIVO'
limiteSuficiente = totalValue <= limiteDisponivel
documentoValido = !!consignacao.documento
itensCadastrados = consignacao.itens.length > 0
quantidadesValidas = itens.every(item => item.quantidade > 0)
consignacaoRascunho = consignacao.status === 'RASCUNHO'
operadorAutorizado = true // TODO: Implement authorization
```

### Bloqueio de Botão

Botão "Entregar" bloqueado se:
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

### IDs
```javascript
_generateCorrelationId() {
  return 'corr-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

_generateRequestId() {
  return 'req-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}
```

---

## Critérios de Aceitação

✅ Tela de Entrega funcional  
✅ Checklist operacional funcionando  
✅ Botão Entregar bloqueado quando houver inconsistências  
✅ Integração exclusiva pela API  
✅ Painel de impacto implementado  
✅ Confirmação antes da entrega  
✅ Mensagens amigáveis  
✅ Componentes do Design System reutilizados  
✅ Responsividade Desktop/Notebook/Tablet  
✅ Parallel loading implementado  
✅ Selective updates implementado  

---

## Próximos Passos

### Sprint 3.4+

- Implementar autorização de operador real
- Implementar ConfirmDialog oficial do Design System
- Implementar Toast notifications
- Adicionar mais validações customizáveis
- Implementar histórico de entregas
- Implementar anexos na entrega
- Implementar assinatura digital
- Implementar testes de componentes
- Implementar testes de integração
- Implementar testes E2E

---

## Reutilização

Esta tela se tornará a principal referência para operações críticas do CDS Sistemas, servindo como modelo para:

- Expedição
- Transferência
- Produção
- Movimentações de Estoque
- Outras operações críticas

Padrões estabelecidos aqui devem ser seguidos consistentemente.
