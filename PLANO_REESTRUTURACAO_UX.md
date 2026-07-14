# PLANO DE REESTRUTURAÇÃO UX — Motor Comercial

**Base:** `AUDITORIA_UX_MOTOR_COMERCIAL.md`  
**Constituição UX:** `.cds/adr/ADR-UX-001.md`  
**Data:** 2026-07-13  
**Princípio:** Redesign da experiência do operador **sem** alterar arquitetura, APIs, ledger, recovery, crédito, outbox ou STAB-03/04.

---

## 1. Visão alvo

```text
CENTRAL (gestão do turno)
    │
    ├── Preparar Entrega     → seleção → produtos → confirmar → imprimir
    ├── Entregar             → confirmar saída
    ├── Prestação            → localizar → grade → fechar
    ├── Conta Corrente       → saldo + extrato + receber
    └── Clientes             → identidade + próximo passo

Secundário (fora do turno diário):
    Consignações (arquivo) · Pendências · Relatórios · Workflow · Playbooks · Recomendações
```

**Regra:** cada tela responde **uma** pergunta em ≤ 5 segundos.

| Tela | Uma pergunta |
|------|--------------|
| Central | O que preciso fazer agora? |
| Preparar | Para quem e o que sai? |
| Entregar | Confirmo a saída? |
| Prestação | Quem prestou contas e o que retornou? |
| Conta Corrente | Qual o saldo e o histórico? |
| Clientes | Quem é e qual o próximo passo? |

---

## 2. Novo fluxo de navegação

### 2.1 Nav primária do operador (~5 itens)

1. **Central de Trabalho**
2. **Preparar Entrega**
3. **Prestação de Contas** *(nova entrada com localizador)*
4. **Conta Corrente**
5. **Clientes**

### 2.2 Nav secundária

- Consignações (arquivo avançado)
- Pendências
- Relatórios / Indicadores
- Workflow / Playbooks / Recomendações
- Auditoria / Configurações

### 2.3 Léxico oficial (unificar)

| Usar | Evitar no dia a dia |
|------|---------------------|
| Prestar Contas | Fechar Consignação (título técnico ok em rota) |
| Encerrar Atendimento | Múltiplos sinônimos na mesma tela |
| Preparar Entrega | Nova Consignação (manter rota interna) |
| Receber | Registrar Novo Recebimento (texto longo) |

---

## 3. Reorganização por tela

### 3.1 Prestação de Contas (P0)

#### Antes
Rota só com `:id` → 5 momentos → grade no passo 2 → totais em 4 lugares.

#### Depois — 2 superfícies

**A. Localizador** (`/prestacao` ou hub em `/consignacoes` filtrado)

Pesquisa inteligente:

- Nome
- CPF
- CNPJ
- Telefone

Resultado (somente essencial):

| Campo | Exemplo |
|-------|---------|
| Nome | … |
| Documento | … |
| Telefone | … |
| Cidade | … |
| Saldo em aberto | R$ … |
| Última movimentação | data/tipo |
| CTA | **Prestar Contas** |

**B. Atendimento** (`/consignacoes/:id/prestacao`) — Grade STAB-04

Momentos alvo:

1. **Retornos** (grade) — trabalho principal  
2. **Fechar** — totais + pagamento opcional + Encerrar  
3. **Sucesso** — um próximo passo (`Receber` se saldo > 0, senão Central)

#### Remover / demover

- Step “Conferir Produtos” como passo separado → banner de integridade
- “Conferência Final” como passo → fundir em Fechar
- Sidebar “Resumo do Atendimento” espelhando a grade → um resumo só no passo Fechar
- Legenda de teclado permanente → ajuda sob demanda

#### Preservar

- `flushPendingChanges`, State SSOT, dirty, indicador pendente/salvo (STAB-04)
- Colunas operacionais Devolvido / Vendido / Perda / Cortesia (ordem já otimizada)

---

### 3.2 Preparar Entrega (P1)

#### Fluxo alvo

```text
Selecionar consignado
        ↓
Selecionar produtos
        ↓
Confirmar entrega (resumo fino)
        ↓
Imprimir comprovante (quando aplicável)
        ↓
Finalizar / Abrir Entrega
```

#### Remover / unificar

| Remover ou fundir | Destino |
|-------------------|---------|
| Assistente Operacional duplicado | Uma faixa de crédito |
| Valor Médio por Item no fluxo diário | Relatórios |
| Conferência “cheia” | Resumo: cliente + itens + valor + limite |
| 4 CTAs na conclusão | Primário: Imprimir · Secundário: Abrir Entrega |

#### Criar

- CTA único pós-criar quando origem = Central: **Ir para Entrega**

---

### 3.3 Entrega (P1)

#### Manter

- Tabela de itens
- Botão **Entregar** fixo no rodapé
- Diálogos de termo / próximo passo

#### Remover / simplificar

| Item | Ação |
|------|------|
| Checklist de 8 gates técnicos | Resumo: “Pronto” / “Bloqueado: motivo humano” |
| 4 StatCards | Um linha: N itens · Valor total |
| Impacto da Operação | Ocultar em “Saiba mais” ou remover do default |

---

### 3.4 Conta Corrente (P0)

#### Alvo: extrato bancário

```text
[ Cliente ]  [ Período simples ]  [ Busca rápida ]
Saldo atual: R$ …
[ Receber ]  (se saldo > 0)

Extrato
Data | Tipo | Descrição | Valor | Saldo
…
```

#### Mover para Relatórios / drawer do Cliente

- Muro de 11 cards do Resumo Financeiro
- Indicadores (tempo médio, etc.)
- Gráficos
- Alertas / Pendências embutidos
- Colunas raras (rastreio)

#### Manter na operação

- Saldo atual
- Entradas / saídas do período (opcional, 2 números)
- Extrato cronológico enxuto
- Filtro período + tipo simples
- Receber (modal já existente na Central)

---

### 3.5 Central de Trabalho (P1)

#### Unificar

- Uma **Minha Fila** (Prioritário + Consignados) — demover listas duplicadas ou fundir
- Pulso do dia: **no máximo 3** números
- Ações Rápidas: só gerais (`Nova Entrega`, `Novo Cliente`, `Clientes`) — sem Relatórios no turno

#### Não mexer

- Contratos UX-10 (E2–E5 exclusivos, Receber só em E5)

---

### 3.6 Consignações (P0 como hub diário)

#### Reposicionar

- De “Central 2” → **arquivo / power user**
- Remover KPI wall do default (ou colapsar)
- ActionMenu: **3 ações primárias** (Entregar, Prestar Contas, Conta Corrente); resto em “Mais”
- Drawer 9 abas → Resumo + Movimentos no default; demais sob “Detalhes”

---

### 3.7 Clientes (P1)

- Busca inteligente já boa — padronizar como referência
- Situação: 3 números (Limite, Disponível, Saldo) + resto em “Ver mais”
- Um CTA destacado conforme estado; o outro secundário

---

## 4. Componentes

### 4.1 Remover (da operação diária)

- KPI walls em Consignações / Conta Corrente / Entrega
- Impacto da Operação (default)
- Checklist técnico expandido na Entrega
- Conferência Final como passo isolado
- Gráficos / indicadores embutidos na Conta Corrente
- Sidebars que só espelham totais já visíveis
- Atalho Relatórios nas Ações Rápidas do turno

### 4.2 Unificar

| Componentes hoje | Unificação |
|------------------|------------|
| Barra crédito Preparar × Assistente × Conferência | `CreditStrip` único |
| Pagamento Fechar × RecebimentoRapidoModal | Mesmo formulário visual (já compartilham formas) |
| Totais Fechar (sidebar × pagamento × conferência × encerramento) | Um `TotaisAtendimento` no passo Fechar |
| Buscas divergentes | `SmartSearch` (Nome/CPF/CNPJ/Telefone/Documento) |

### 4.3 Criar

| Componente | Uso |
|------------|-----|
| `PrestacaoLocator` | Tela inicial da Prestação |
| `ResultadoConsignadoCard` | Nome, doc, telefone, cidade, saldo, última mov, CTA |
| `CreditStrip` | Faixa única de crédito no Preparar |
| `EntregaReadyBanner` | Pronto / Bloqueado |
| `ExtratoEnxuto` | Conta Corrente estilo banco |
| `NavOperador` | 5 destinos primários (shell ERP ou header do módulo) |

---

## 5. Pesquisa inteligente (padrão)

Aplicar em: Prestação (novo), Clientes (já), Preparar (já), Conta Corrente (simplificar filtros), Consignações (manter busca, reduzir filtros obrigatórios).

**Entrada única:** campo omnisearch  
**Sem** exigir combinação de filtros para a tarefa principal.

---

## 6. Ordem recomendada de implementação

Ordem = maior alívio ao operador × menor risco arquitetural.

| Ordem | Entrega | Risco arquitetural |
|-------|---------|--------------------|
| 1 | Conta Corrente → extrato (só UI) | Baixo |
| 2 | Prestação Locator + encurtar wizard (STAB-04 intacto) | Médio (rotas FE) |
| 3 | Entrega thin + rodapé já corrigido | Baixo |
| 4 | Preparar: CreditStrip + conclusão clara | Baixo |
| 5 | Central: unificar filas / cortar chips | Médio (UX-10) |
| 6 | Consignações: demote + menu 3 ações | Baixo |
| 7 | Nav primária + léxico | Médio (ERP shell) |
| 8 | SmartSearch compartilhado | Baixo |

Detalhamento em sprints: `ROADMAP_UX_COMERCIAL.md`.

---

## 7. Critérios de aceite (UX)

Para cada tela operacional:

1. Operador identifica **onde está** em ≤ 5 s  
2. Identifica **o que fazer** em ≤ 5 s  
3. Identifica **próximo passo** sem abrir menu de 10 itens  
4. Zero KPIs gerenciais competindo com a tarefa  
5. STAB-04: grade continua persistindo via State + flush  
6. STAB-03: bundle build/verify verdes  
7. Nenhuma mudança de regra de crédito / ledger / recovery  

---

## 8. Fora de escopo (explícito)

- Alterar CreditoComercialService / fórmula de crédito  
- Alterar ledger append-only  
- Alterar Recovery Enterprise  
- Novas APIs ou tabelas  
- STAB-05 (hard-block `ENTREGUE ≠ V+D+P+C`) — separado  
- Redesign visual “bonito” sem ganho operacional  

---

*Plano alinhado à auditoria. Implementação gradual via roadmap.*
