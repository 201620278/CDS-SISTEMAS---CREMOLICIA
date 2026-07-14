# AUDITORIA UX — Motor Comercial (Plataforma CDS)

**Tipo:** Auditoria de experiência do operador (não cosmética visual)  
**Data:** 2026-07-13  
**Escopo:** Telas do Motor Comercial (`frontend/modules/motor-comercial`)  
**Restrição absoluta:** NÃO alterar Ledger, Recovery, CreditoComercialService, Conta Corrente (domínio), Outbox, APIs, banco, eventos, regras de negócio, STAB-03, STAB-04 ou arquitetura oficial.

---

## 1. Veredito executivo

O Motor Comercial tem espinha operacional correta (**Central → Preparar → Entregar → Prestar → Conta Corrente**), mas várias telas ainda se comportam como **cockpit analítico**.

O operador de 8h sofre com:

1. **Prestação sem localizador** — exige `consignacaoId`; não há “achar consignado e prestar contas”.
2. **Fechar Consignação em 5 momentos** para um trabalho físico (grade + opcional pagamento).
3. **Conta Corrente sobrecarregada** — 11 cards + gráficos + indicadores; não parece extrato.
4. **Consignações como segunda Central** — 6 KPIs + 10 ações por linha.
5. **Informação duplicada** (crédito/saldo/totais) em Preparar, Entregar e Fechar.

**Pergunta-guia desta auditoria:** *“Isso realmente ajuda o operador?”*  
Onde a resposta for não, a proposta é remover, simplificar ou mover para a Central / Relatórios.

---

## 2. Inventário de telas

| Rota | Tela | Papel hoje | Papel ideal |
|------|------|------------|-------------|
| `/` | Central de Trabalho Comercial | Fila E1–E6 + CTAs + KPIs | Única casa de KPIs/gestão do dia |
| `/consignacoes/nova` | Preparar Entrega | Wizard 4 passos + assistente | Selecionar → produtos → confirmar → imprimir |
| `/consignacoes/:id/entrega` | Entrega de Consignação | Checklist técnico + cards | Confirmar saída física |
| `/consignacoes/:id/prestacao` | Fechar Consignação | 5 passos + sidebar | Localizar → grade → fechar |
| `/conta-corrente` | Conta Corrente Comercial | Extrato + analytics | Extrato bancário |
| `/consignacoes` | Consignações | Cockpit + drawer 9 abas | Arquivo avançado (não dia a dia) |
| `/clientes`, `/perfis` | Central de Clientes | Busca + cards | Identidade + próximo passo |
| `/clientes/:id` | Central de Operações do Cliente | Situação + ações | Hub por cliente |
| `/pendencias` | Central de Pendências | Inbox de alertas | Exceção (secundário) |
| `/relatorios`, `/indicadores` | Inteligência Analítica | Catálogo gerencial | Só gestão |
| `/recomendacoes`, `/playbooks`, `/workflow` | Coaching / processos | Centrais paralelas | Secundário |
| `/auditoria`, `/configuracoes`, `/design-system` | Admin / DS | Suporte | Fora do fluxo diário |

**Não existe tela dedicada de Produtos** — produtos vivem no LIP de Preparar Entrega e em Relatórios.

---

## 3. Diagnóstico por tela

### 3.1 Central de Trabalho — P1

**O que ajuda:** Minha Fila + CTAs por estado (UX-10): `Continuar Entrega`, `Fechar Atendimento`, `Receber`.

**O que atrapalha:**

| Severidade | Problema | Impacto operacional |
|------------|----------|---------------------|
| P1 | Filas duplicadas (Prioritário × Próximas Entregas × Atendimentos para Fechar) | Mesmo trabalho em layouts diferentes |
| P1 | 5 chips de resumo repetem contagens das seções | Ruído antes da ação |
| P2 | Últimas Operações passivas | Não respondem “o que faço agora?” |
| P2 | Relatórios em Ações Rápidas | Mistura operação com gestão |

### 3.2 Prestação / Fechar Consignação — P0

Momentos atuais: `Conferir Produtos` → `Registrar Retornos` → `Pagamento` → `Conferência Final` → `Encerramento`.

| Severidade | Problema | Impacto operacional |
|------------|----------|---------------------|
| **P0** | Sem busca por consignado (só `/consignacoes/:id/prestacao`) | Operador não encontra quem prestar contas |
| **P0** | 5 passos para um trabalho | 15–25+ interações por atendimento |
| P1 | Grade densa (9 colunas + legenda + status) + sidebar “Resumo do Atendimento” | Totais duplicados 3–4 vezes |
| P1 | Step 0 “O que falta…” antes da grade | Clique extra antes do trabalho real |
| P2 | Encerramento com bloco cliente + operacional + financeiro + muitas saídas | Indecisão pós-fecho |

**Foco incorreto hoje:** stepper e painéis.  
**Foco correto:** localizar consignado → digitar retornos (STAB-04) → encerrar.

### 3.3 Preparar Entrega — P1

Fluxo desejado: selecionar consignado → produtos → confirmar → imprimir → finalizar.

| Severidade | Problema | Impacto operacional |
|------------|----------|---------------------|
| P1 | Crédito triplicado (barra cliente + faixa da grade + Assistente Operacional) | Hesitação e leitura excessiva |
| P1 | Conferência repete totais já vistos | Passo “falso” |
| P2 | Simulação LIP + barra de atalhos de teclado sempre visíveis | Carga cognitiva |
| P2 | Conclusão com 4 saídas (`Imprimir Termo`, `PDF`, `Abrir Entrega`, `Voltar`) | Primário ambíguo |

### 3.4 Entrega — P1

| Severidade | Problema | Impacto operacional |
|------------|----------|---------------------|
| P1 | Checklist técnico (RASCUNHO, operador autorizado…) | Linguagem de sistema, não de operação |
| P1 | Cards de resumo duplicam cabeçalho | Scroll antes do botão Entregar |
| P2 | Painel “Impacto da Operação” didático | Ensina plataforma em vez de confirmar mercadoria |
| P2 | Empresa / Filial / Usuário no momento da confirmação | Pouco uso diário |

*(Rodapé “Processando…” longo e botão fora da tela foram tratados em hotfix separado — fora do escopo desta auditoria de IA, mas relevantes para UX operacional.)*

### 3.5 Conta Corrente — P0

| Severidade | Problema | Impacto operacional |
|------------|----------|---------------------|
| **P0** | 11 cards + Extrato + Timeline + Indicadores + ~6 gráficos + Alertas + Pendências | Não parece extrato bancário |
| P1 | Filtros + 4 exports na barra diária | Operação misturada com BI |
| P1 | Extrato com ~11 colunas (ex.: código de rastreio) | Baixa legibilidade |
| P2 | Atalhos para Fechar / Consignações no sidebar | Mistura razão financeira com operação |

### 3.6 Consignações — P0 (como caminho diário)

| Severidade | Problema | Impacto operacional |
|------------|----------|---------------------|
| **P0** | Segunda Central: KPIs + atalhos + menu com 10 ações | Escolha excessiva |
| P1 | Filtros: busca + empresa + filial + status + fechamento + favoritos | Localizar consignado fica lento |
| P1 | Drawer com 9 abas (até Auditoria) | Análise dentro da lista operacional |
| P2 | Atalho “Fechar Atendimento” sem linha clara | Ambiguidade |

### 3.7 Clientes / Operações do Cliente — P1

| Severidade | Problema | Impacto |
|------------|----------|---------|
| P1 | Situação com 8 métricas em toda visita | Gestão dentro de operação |
| P2 | Sempre mostra Preparar e Fechar (mesmo com destaque) | Duas perguntas ao mesmo tempo |

### 3.8 Centrais paralelas — P1/P2

Pendências, Workflow, Playbooks, Recomendações e Relatórios competem com a Central de Trabalho pela atenção diária. São válidos como **camada secundária**, não como default do turno.

---

## 4. Jornada do operador (fricção)

### Fluxo feliz mínimo (hoje)

| Etapa | Interações aproximadas | Dor |
|-------|------------------------|-----|
| Preparar | 6–8+ | Assistente + Conferência |
| Entregar | 3–5 + diálogos | Checklist técnico |
| Prestar | **5 passos** + grade por linha | Grade é o trabalho; o resto é chrome |
| Conta Corrente | 1 (modal Receber) ou muitos (página cheia) | Página cheia = analytics |

**Cheiro de cliques:** fechar um atendimento pode passar de **15–25 interações**.

### Regra de ouro violada

> Cada tela deve responder **uma** pergunta.  
> Nunca misturar operação com gestão.

Várias telas respondem 3–5 perguntas ao mesmo tempo.

---

## 5. Pesquisa (estado atual)

| Tela | Busca | Campos |
|------|-------|--------|
| Preparar Entrega | Sim | nome, telefone, CPF, código, documento |
| Central Clientes | Sim | Nome, CPF/CNPJ, telefone, código, documento |
| Consignações | Sim + filtros | documento, cliente, consignado, produto… |
| Conta Corrente | Sim + filtros | documento, descrição, operador… |
| **Prestação** | **Não** | — |
| **Entrega** | **Não** | ID na rota |

**Gap P0:** Prestação precisa de pesquisa inteligente (Nome, CPF, CNPJ, Telefone) com resultado mínimo e CTA **Prestar Contas**.

---

## 6. Duplicações transversais

| Informação | Onde se repete |
|------------|----------------|
| Limite / Saldo / Crédito | Central, Cliente, Preparar (×3), Entrega, Conta Corrente, Fechar |
| Vendidos / Devolvidos / Perdas / Cortesias | Sidebar Fechar, Conferência Final, Encerramento |
| Valor a pagar / Recebido / Saldo | Pagamento, sidebar, Conferência, Encerramento |
| Cliente + Documento | Quase todas as telas do fluxo |

---

## 7. O que pertence só à Central Comercial

**Manter na Central:**

- Próxima ação por estado (E2–E5)
- Pulso do dia (no máximo 1–3 números)
- Receber (E5) via modal leve
- Entrada para Nova Entrega / Clientes

**Remover das telas operacionais:**

- Muros de KPI
- Gráficos / rankings
- Timeline gerencial
- Checklists de infraestrutura
- Sidebars que só espelham o painel principal

---

## 8. Restrições técnicas a preservar (não negociáveis)

### STAB-04 — Grade

- State é SSOT; DOM não monta payload
- Persistência única: `flushPendingChanges`
- Dirty preservado em reload
- Encerrar bloqueado com alterações pendentes

### STAB-03 — Bundle

- Operador usa `motor-comercial.bundle.js`
- Toda mudança UX exige build + `verify:motor-comercial`

### UX-10 — Central

- Um cliente → um estado → um CTA
- Não reintroduzir `Fechar Atendimento` em Ações Rápidas

### Domínio

- Sem alterar crédito, ledger, recovery, outbox, APIs ou banco

---

## 9. Classificação consolidada (top 10)

| # | Item | Sev | Tela |
|---|------|-----|------|
| 1 | Sem localizador de consignado na Prestação | P0 | Prestação |
| 2 | Wizard Fechar com 5 momentos | P0 | Prestação |
| 3 | Conta Corrente como dashboard analítico | P0 | Conta Corrente |
| 4 | Consignações como hub diário | P0 | Consignações |
| 5 | Filas/KPIs duplicados na Central | P1 | Central |
| 6 | Crédito triplicado no Preparar | P1 | Preparar |
| 7 | Checklist técnico na Entrega | P1 | Entrega |
| 8 | Totais duplicados no Fechar | P1 | Prestação |
| 9 | Centrais paralelas no dia a dia | P1 | Várias |
| 10 | Léxico inconsistente (Fechar × Encerrar × Prestação) | P2 | Global |

---

## 10. Oportunidades (resumo)

1. **Prestação = localizar → grade STAB-04 → fechar**
2. **Preparar = 4 batidas limpas** (sem assistente redundante)
3. **Entrega = confirmar itens + Entregar**
4. **Conta Corrente = saldo + extrato + receber**
5. **Central = única casa de gestão do turno**
6. **Nav primária com ~5 destinos**
7. **Pesquisa inteligente padronizada** nas telas operacionais
8. **Um léxico oficial** para o operador

---

## 11. Artefatos relacionados

- **`.cds/adr/ADR-UX-001.md`** — Filosofia Oficial de UX da Plataforma CDS (constituição)
- `PLANO_REESTRUTURACAO_UX.md` — reorganização e componentes
- `MOCKUPS_UX_COMERCIAL.md` — wireframes conceituais
- `ROADMAP_UX_COMERCIAL.md` — sprints graduais

---

*Auditoria baseada no código atual do Motor Comercial (rotas, views e mappers). Sem alteração de arquitetura.*
