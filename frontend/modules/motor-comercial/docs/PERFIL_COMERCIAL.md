# Central 360° do Cliente Comercial — Motor Comercial

**Sprint O-5** — Central 360° do Cliente

---

## Objetivo

Transformar o Perfil Comercial na **Central 360° do Cliente**, reunindo todas as informações comerciais em um único lugar. O gestor analisa o cliente completo sem trocar de tela.

---

## Princípio

**Nenhuma regra de negócio no Frontend.**

Toda informação vem da API e Projection Services / Insight Engine.

---

## Estrutura

```
pages/PerfilComercial/
├── index.js              # Central 360° + lista de clientes
├── perfilMappers.js      # Mapeamento de campos da API
├── Cliente360Drawer.js   # Drawers contextuais
└── styles.css            # Estilos Central 360°
```

---

## Modos de Operação

### Lista (`/clientes`, `/perfis`)
- Pesquisa dinâmica (nome, documento, telefone, CPF/CNPJ, código)
- Tabela de perfis comerciais
- Clique na linha → navega para `/clientes/:id`

### Visão 360° (`/clientes/:id`, `/perfis/:id`)
- Layout `CadastroLayout` com sidebar de atalhos
- Todas as seções em uma única página com scroll

---

## Layout 360°

```
Header Executivo (ações + alertas)
    ↓
Sidebar (atalhos)
    ↓
Cartão Executivo
    ↓
KPIs Comerciais
    ↓
Indicadores
    ↓
Timeline
    ↓
Consignações
    ↓
Prestações
    ↓
Financeiro
    ↓
Insights
    ↓
Auditoria
```

---

## Header Executivo

- Nome, CPF/CNPJ, Tipo de Perfil
- Empresa, Filial, Operador
- Última atualização
- **Atualizar**, **Editar**, **Bloquear**, **Alterar Limite**, **Nova Consignação**
- Banner de alertas visuais (bloqueado, limite, prestação atrasada, etc.)

---

## Cartão Executivo

Fonte: `obterSituacaoCliente` + `obterPerfil` + `obterScorePerfil` + projeções financeiras.

| Campo | Fonte API |
|-------|-----------|
| Status | `statusGeral` / `perfil.status` |
| Score Comercial | `score` |
| Limite / Utilizado / Disponível | `limiteComercial`, `limiteUtilizado`, `limiteDisponivel` |
| Saldo em Aberto | `saldo` / `saldoEmAberto` |
| Última Compra/Prestação/Recebimento | campos da situação do cliente |
| Dias sem movimentação | `diasSemMovimentacao` |
| Cliente desde | `createdAt` |
| Risco Comercial | `nivelRisco` |
| Próxima ação | `proximaAcao` / `recomendacoes[0]` |

---

## KPIs (11 indicadores)

Mapeados de `situacao` + `indicadores` sem cálculo local:
Consignações abertas/encerradas, Prestação aberta/atrasada, Recebimentos, Perdas, Cortesias, Ticket Médio, Conversão, Tempos médios.

---

## Timeline

`GET /projections/timeline?clienteId=...` — componente oficial `Timeline`.

---

## Consignações

`GET /consignacoes?clienteId=...` — tabela com drawer contextual ao clicar.

---

## Prestações

Consignações entregues/acertadas — drawer com `resumo-prestacao` projection.

---

## Financeiro

- `GET /projections/conta-corrente`
- `GET /projections/saldos`
- Histórico financeiro + gráfico de evolução (quando API fornece `evolucao`)

---

## Insights (Insight Engine)

- `GET /projections/insights?clienteId=...`
- Alertas e recomendações da situação do cliente
- Agrupados: Crítico, Alto, Médio, Baixo
- Ações: Resolver, Ignorar, Detalhe (drawer)

---

## Auditoria

Histórico de movimentações + histórico do perfil com:
Usuário, Operação, Data, Origem, CorrelationId, RequestId.

---

## Drawers Contextuais

| Tipo | Conteúdo |
|------|----------|
| Consignação | Resumo + links entrega/prestação |
| Prestação | Resumo projection + abrir prestação |
| Insight | Detalhe do insight |
| Recebimento | Movimento financeiro |

Nunca troca de tela para visualizar detalhes.

---

## Atalhos (Sidebar)

- Nova Consignação, Nova Prestação
- Conta Corrente (scroll)
- Dashboard, Central Operacional
- Exportar Histórico, Imprimir Cliente
- Voltar à Lista

---

## Refresh

- Automático: 60 segundos
- Manual: botão Atualizar
- Atualização parcial sem reload

---

## API Endpoints

```
GET /perfil-comercial
GET /perfil-comercial/:id
PATCH /perfil-comercial/:id/bloquear
PATCH /perfil-comercial/:id/limite
GET /perfil-comercial/:id/score
GET /perfil-comercial/:id/historico
GET /consignacoes?clienteId=
GET /projections/situacao-cliente?clienteId=
GET /projections/indicadores?clienteId=
GET /projections/insights?clienteId=
GET /projections/dashboard?clienteId=
GET /projections/timeline?clienteId=
GET /projections/historico?clienteId=
GET /projections/conta-corrente?clienteId=
GET /projections/saldos?clienteId=
```

---

## Fluxo de Navegação

```
ERP → Clientes Comerciais (/clientes)
    → Pesquisa e seleção
    → Central 360° (/clientes/:id)
    → Drawers contextuais (sem sair da tela)
    → Atalhos para Consignação/Prestação/Dashboard
```

---

## Critérios de Aceitação (O-5)

✅ Cliente analisado sem trocar de tela  
✅ Cartão Executivo via Projection  
✅ KPIs funcionando  
✅ Timeline completa  
✅ Financeiro integrado  
✅ Consignações e Prestações integradas  
✅ Insight Engine integrada  
✅ Drawers funcionando  
✅ Alertas visuais  
✅ Refresh automático  
✅ Pesquisa dinâmica na lista  
✅ Exportação de histórico  
✅ Sem alert/confirm/prompt nativos  

---

## Resultado Esperado

O Perfil Comercial torna-se a **Central 360° do Cliente Comercial** — referência para futuras Centrais 360° do CDS (Fornecedor, Produto, Funcionário, Parceiro).
