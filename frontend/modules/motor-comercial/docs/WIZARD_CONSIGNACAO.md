# Wizard de Nova Consignação — Motor Comercial

**Sprint 3.2** — Wizard Oficial de Criação de Consignação

---

## Objetivo

Implementar o Wizard Oficial para criação de uma nova Consignação, a principal tela de cadastro do Motor Comercial.

---

## Princípio

**Um passo → Uma validação → Um objetivo**

Nunca apresentar todos os campos ao mesmo tempo. Operação guiada por etapas.

---

## Estrutura

```
pages/NovaConsignacao/
├── index.js           # Componente principal
└── styles.css         # Estilos específicos
```

---

## Layout

Utiliza `WizardLayout`:

```
Header
    ↓
Stepper
    ↓
Etapa Atual
    ↓
Resumo Lateral
    ↓
Footer (Botões)
```

---

## Etapas

### Etapa 1: Cliente

**Objetivo:** Selecionar o cliente e validar perfil comercial.

**Campos:**
- Busca de cliente (nome ou documento)

**Validações:**
- Cliente deve ser selecionado
- Perfil deve estar ativo
- Limite comercial disponível

**API:**
```
GET /api/v1/comercial/perfil-comercial/:id
```

**Dados exibidos:**
- Documento
- Limite Comercial
- Saldo Atual
- Situação (badge)
- Última Compra

---

### Etapa 2: Dados Gerais

**Objetivo:** Definir informações básicas da consignação.

**Campos:**
- Documento (texto)
- Empresa (select)
- Filial (select)
- Data (date)
- Data Prevista (date)
- Observações (textarea)

**Validações:**
- Documento é obrigatório
- Data é obrigatória

---

### Etapa 3: Itens

**Objetivo:** Adicionar produtos à consignação.

**Campos:**
- Busca de produto (texto)
- Botão Adicionar

**Tabela de itens:**
- Produto
- Quantidade
- Preço
- Total
- Ações (Remover)

**Validações:**
- Pelo menos um item é obrigatório

**Performance:**
- Debounce na busca de produtos (preparado)
- Paginação de produtos (preparado)
- Cache local durante o wizard

---

### Etapa 4: Resumo

**Objetivo:** Revisar todos os dados antes da confirmação.

**Dados exibidos:**
- Cliente
- Documento
- Empresa
- Filial
- Data
- Quantidade de Itens
- Valor Total
- Limite Disponível

**Validações:**
- Cliente selecionado
- Documento informado
- Pelo menos um item
- Valor não excede limite disponível

**Alertas:**
- Erros de validação exibidos visualmente

---

### Etapa 5: Confirmação

**Objetivo:** Confirmar e criar a consignação.

**Mensagem:**
"Ao confirmar, a consignação será criada com status RASCUNHO. Você poderá editar e finalizar posteriormente."

**API:**
```
POST /api/v1/comercial/consignacoes
```

---

## Stepper

Componente oficial com estados:

- **Pendente** - Etapa não iniciada
- **Atual** - Etapa em andamento
- **Concluído** - Etapa completada (✓)
- **Erro** - Erro na etapa (✕)
- **Bloqueado** - Etapa bloqueada (⚠)

---

## Resumo Lateral

Sempre visível, atualizado em tempo real.

**Dados:**
- Cliente
- Itens (quantidade)
- Valor Total

Atualiza automaticamente quando:
- Cliente é selecionado
- Item é adicionado
- Item é removido

---

## Validações

### Por Etapa

Cada etapa valida antes de permitir avanço:

**Etapa 1:**
- Cliente selecionado

**Etapa 2:**
- Documento informado
- Data informada

**Etapa 3:**
- Pelo menos um item

### Global

Validações no resumo:
- Cliente selecionado
- Documento informado
- Pelo menos um item
- Valor não excede limite disponível

**Nunca permitir avanço inválido.**

---

## Salvar Rascunho

Disponível em qualquer etapa.

**API:**
```
POST /api/v1/comercial/consignacoes
Status: RASCUNHO
```

**Comportamento:**
- Salva estado atual
- Permite retomar posteriormente
- Não requer validações completas

---

## UX

### Auto Save

Arquitetura preparada para auto-save:
- DirtyState tracking implementado
- Cache local preparado
- Intervalo configurável (futuro)

### Confirmação ao Saída

Dirty state tracking:
- Detecta alterações não salvas
- Confirmação antes de sair
- `beforeunload` event listener

### Validação Visual

- Erros exibidos como Alert
- Estados de loading visíveis
- Empty states informativos

### Resumo em Tempo Real

- Sidebar atualizada automaticamente
- Feedback imediato ao usuário
- Visibilidade constante do progresso

---

## Estados

### Loading
- Carregando perfil do cliente
- Carregando produtos
- Salvando rascunho
- Criando consignação

### Error
- Erro ao carregar perfil
- Erro ao buscar produtos
- Erro ao salvar
- Erro ao criar

### No Client
- Cliente não selecionado
- Exibe EmptyState

### No Items
- Nenhum item adicionado
- Exibe EmptyState

### Limit Exceeded
- Valor total excede limite
- Alert de erro

### Profile Blocked
- Perfil bloqueado
- Alert de erro

---

## Componentes do Design System Utilizados

- `WizardLayout` - Layout base
- `Stepper` - Navegação por etapas
- `Button` - Botões de ação
- `Input` - Campos de texto
- `CurrencyInput` - Campos monetários
- `Select` - Seletores
- `Textarea` - Área de texto
- `Loading` - Indicadores de loading
- `EmptyState` - Estados vazios
- `Alert` - Alertas de erro
- `Badge` - Badges de status
- `Card` - Cards de conteúdo
- `Table` - Tabela de itens
- `DirtyState` - Tracking de alterações

---

## Performance

### Debounce na Busca de Produtos

Preparado para implementação:
```javascript
input.addEventListener('input', (e) => {
  clearTimeout(this.productSearchTimeout);
  this.productSearchTimeout = setTimeout(() => {
    this._searchProducts(e.target.value);
  }, 300);
});
```

### Lazy Loading

- Dados carregados sob demanda
- Perfil do cliente apenas ao selecionar
- Itens apenas ao abrir etapa

### Paginação de Produtos

Preparado para implementação:
- Page size configurável
- Server-side pagination
- Cache de resultados

### Cache Local

- Cache durante o wizard
- Evita requisições duplicadas
- Melhora performance

---

## Responsividade

### Desktop (1024px+)
- Layout completo
- Sidebar visível
- 2 colunas em formulários
- Botões horizontais

### Notebook (768px - 1023px)
- Layout adaptado
- Sidebar visível
- 1 coluna em formulários
- Botões empilhados verticalmente

### Tablet (640px - 767px)
- Layout simplificado
- Sidebar oculta
- 1 coluna em formulários
- Botões full-width
- Busca vertical

---

## Fluxo de Dados

```
1. Render inicial com Step 1
2. Usuário busca cliente
3. Carregar perfil (API)
4. Validar perfil
5. Avançar para Step 2
6. Preencher dados gerais
7. Validar campos
8. Avançar para Step 3
9. Adicionar itens
10. Validar itens
11. Avançar para Step 4
12. Revisar resumo
13. Validar tudo
14. Avançar para Step 5
15. Confirmar criação
16. Criar consignação (API)
17. Navegar para lista
```

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

✅ Wizard completo implementado  
✅ Cinco etapas funcionais  
✅ Resumo lateral em tempo real  
✅ Stepper operacional  
✅ Salvar Rascunho funcionando  
✅ Validações por etapa  
✅ Nenhuma regra comercial no Frontend  
✅ Exclusivo consumo da API  
✅ Todos os componentes reutilizados do Design System  
✅ Estados de Loading implementados  
✅ Estados de Error implementados  
✅ Estados de Empty implementados  
✅ Responsividade Desktop/Notebook/Tablet  
✅ Dirty state tracking implementado  
✅ Confirmação ao sair implementada  

---

## Próximos Passos

### Sprint 3.3+

- Implementar busca de produtos com debounce real
- Implementar paginação de produtos
- Implementar auto-save automático
- Implementar edição de consignação existente
- Implementar duplicação de consignação
- Adicionar mais campos customizáveis
- Implementar testes de componentes
- Implementar testes de integração
- Implementar testes E2E

---

## Reutilização

Este Wizard se tornará o padrão oficial do CDS Sistemas para operações complexas, podendo ser reutilizado em:

- Compras
- Produção
- Ordens de Serviço
- Transferências
- Outros módulos

Padrões estabelecidos aqui devem ser seguidos consistentemente.
