# ADR-UX-001 — Filosofia Oficial de UX da Plataforma CDS

## Status
- Status: Proposed

## Data
- Data: 2026-07-13

## Autor
- Autor: Plataforma CDS

## Identidade
- Tipo: Architecture Decision Record — UX Architecture
- Escopo: **Todos os motores e superfícies** da Plataforma CDS
- Precedência: Constituição de experiência do usuário; obrigatória para telas novas e refactors de UX
- Não trata de: paleta de cores, tipografia de marca, identidade visual gráfica

---

## Contexto

A Plataforma CDS deixou de ser um ERP tradicional.

Ela é oficialmente uma:

> **PLATAFORMA INTELIGENTE DE GESTÃO**

**Slogan oficial:**  
*"Inteligência para gerir, tecnologia para crescer."*

A arquitetura técnica (motores, ledger, bridges, recovery, projeções, governança) está consolidada.  
Falta consolidar a **arquitetura de experiência (UX Architecture)** com a mesma força normativa.

O operador passa horas no sistema. Cada clique desnecessário é perda de produtividade. Cada informação desnecessária é carga cognitiva.

Este ADR define **como o operador trabalha** — não como a tela “parece”.

### Escopo de aplicação (obrigatório)

| Superfície | Aplica? |
|------------|---------|
| Motor Comercial | Sim |
| Motor Financeiro | Sim |
| Motor Fiscal | Sim |
| Motor Compras | Sim |
| Motor Estoque | Sim |
| Motor Produção | Sim |
| Motor CRM | Sim |
| Portal do Contador | Sim |
| Portal Web | Sim |
| Aplicativo Mobile | Sim (mesmos princípios; adaptação de densidade) |
| Qualquer módulo futuro | Sim |

**Nenhuma tela nova** pode ser desenvolvida sem respeitar este ADR.

### Relacionados
- `CDS_PLATFORM_MANIFESTO.md`
- [DS-001 — Design System Operacional](../DS-001.md)
- `AUDITORIA_UX_MOTOR_COMERCIAL.md`
- `PLANO_REESTRUTURACAO_UX.md`
- `ROADMAP_UX_COMERCIAL.md`
- STAB-03 / STAB-04 (contratos técnicos a preservar quando aplicáveis)
- UX-10 (Central orientada por estados — Motor Comercial)

---

## Problema

Sem uma constituição de UX:

1. Cada motor inventa padrões próprios (menus, KPIs, drawers, wizards).
2. Telas operacionais viram dashboards analíticos.
3. O operador procura o próximo passo em vez de ser conduzido.
4. Há scroll de página, ações escondidas e sobrecarga cognitiva.
5. “Criatividade” local quebra consistência e treinamento cruzado entre motores.

A plataforma precisa de **uma linguagem operacional única**, do Comercial ao Fiscal.

---

## Alternativas

| Alternativa | Avaliação |
|-------------|-----------|
| A. Continuar UX ad hoc por motor | Rejeitada — fragmenta a plataforma |
| B. Guia visual (cores/componentes) sem filosofia operacional | Rejeitada — trata aparência, não trabalho |
| C. **Constituição UX (este ADR) + Design System como implementação** | **Adotada** |
| D. Copiar padrões de ERP clássico (menus densos, formulários longos) | Rejeitada — contradiz a identidade de plataforma |

---

## Decisão

Adotar oficialmente a **Filosofia de UX da Plataforma CDS** descrita neste ADR como:

1. **Constituição de experiência** para todos os motores e portais.
2. Contrato obrigatório de **Estações de Trabalho** vs **Centrais**.
3. Conjunto de **princípios, regras, padrões, anti-padrões e checklist** para aceite de qualquer tela.

O Design System CDS **implementa** este ADR; não o substitui.

Contrato de componentes: **[DS-001 — Design System Operacional](../DS-001.md)**.

---

## Justificativa

- Alinha experiência à missão da plataforma (inteligência + operação).
- Reduz custo de treinamento e erros operacionais.
- Permite reuso real de componentes entre motores.
- Separação clara: **gestão na Central**, **execução na Estação**.
- Compatível com arquitetura técnica já consolidada (sem exigir mudanças de domínio).

---

## 1. Filosofia Oficial

A Plataforma CDS **não** deve parecer:

- um site de marketing;
- um formulário isolado;
- um ERP dos anos 2000.

Ela deve funcionar como uma **estação de trabalho profissional**.

### Lei fundamental

> **O sistema acompanha o operador.  
> Nunca o operador acompanha o sistema.**

### Corolários

- Fluxo natural > navegação exploratória.
- Uma tarefa por tela.
- Ação principal sempre visível.
- Consistência acima de criatividade local.
- Pouca leitura, pouco movimento, pouco contexto trocado.

---

## 2. Princípios Oficiais (normativos)

| # | Princípio | Regra |
|---|-----------|--------|
| P01 | Uma tela = uma tarefa | Proibido misturar objetivos na mesma superfície |
| P02 | Uma tarefa = um objetivo | Cada fluxo termina em um resultado claro |
| P03 | Uma pergunta por tela | O operador deve responder mentalmente “o que faço aqui?” em ≤ 5 s |
| P04 | Compreensão em 5 segundos | Título + contexto + CTA principal legíveis sem scroll |
| P05 | Separação operação × gestão | Nunca misturar |
| P06 | Gestão nas Centrais | KPIs, filas, monitoramento, indicadores |
| P07 | Operação nas Estações | Execução do trabalho (grades, extratos, wizards) |
| P08 | Sem scroll de página operacional | A página/shell não rola; só áreas de conteúdo autorizadas |
| P09 | Rolagem só em listas/grades/extratos/timelines | Cabeçalho e rodapé fixos |
| P10 | Cabeçalhos padronizados | Mesma anatomia em todas as estações |
| P11 | Rodapé de ação fixo | CTA principal sempre no rodapé (ou equivalente sticky) |
| P12 | Ação principal sempre visível | Nunca atrás de “Mais” / menu de 10 itens |
| P13 | Próximo passo explícito | Proibido obrigar o operador a procurar |
| P14 | Fluxo natural | Entrada → trabalho → confirmação → saída |
| P15 | Teclado primeiro | Atalhos e navegação por teclado nas grades e wizards |
| P16 | Minimizar cliques | Cada clique deve ter valor operacional |
| P17 | Reduzir carga cognitiva | Remover informação que não ajuda a tarefa atual |
| P18 | Consistência > criatividade | Padrões da plataforma vencem layouts “únicos” |
| P19 | Componentes reutilizáveis | Novos padrões exigem promoção ao Design System |
| P20 | Léxico único | Mesmos nomes de ações em todos os motores |

---

## 3. Conceitos Oficiais (UX Architecture)

### 3.1 Estação de Trabalho

**Definição:** Superfície contínua onde o operador **executa** um fluxo completo de trabalho de um domínio.

**Exemplos:** Estação Comercial, Estação Financeira, Estação Fiscal, Estação Compras.

**Características:**
- Representa um **fluxo**, não um amontoado de páginas soltas.
- Contém tarefas sequenciais ou estados (Preparar → Entregar → Prestar).
- Sem muro de KPIs gerenciais no primeiro viewport.
- Cabeçalho + área operacional + rodapé fixo.

### 3.2 Central

**Definição:** Superfície de **orientação e monitoramento** do turno/domínio.

**Concentra:** indicadores, KPIs, filas, pendências, acompanhamento, atalhos gerais.

**Não concentra:** execução operacional pesada (grades longas de lançamento, wizards de fechamento, digitação intensa).

**Regra:** A Central responde *“O que preciso fazer agora?”* e despacha para a Estação.

### 3.3 Fluxo Operacional

Sequência de tarefas que **altera estado do negócio** (criar, entregar, prestar, receber, emitir).  
Prioridade: velocidade, teclado, poucos elementos.

### 3.4 Fluxo Gerencial

Sequência de consulta/análise (relatórios, rankings, indicadores).  
Prioridade: visão, filtros, exportação.  
Nunca bloqueia o caminho crítico do operador de linha.

### 3.5 Área Operacional

Região central da Estação onde ocorre o trabalho (grade, formulário curto, lista acionável).  
É a única região que pode rolar, quando for lista/grade/extrato/timeline.

### 3.6 Área Analítica

Região ou tela destinada a gráficos, KPIs densos e estatísticas.  
Pertence à Central ou a Relatórios — **não** ao default da Estação.

### 3.7 Painel

Bloco lateral ou inferior com contexto **necessário à tarefa atual** (ex.: uma faixa de crédito).  
Proibido painel que apenas espelha dados já visíveis na área operacional.

### 3.8 Assistente

Ajuda contextual sob demanda (atalhos, dicas, simulação).  
Default: recolhido. Nunca compete com a CTA principal.

### 3.9 Wizard

Sequência de passos com progresso explícito.  
Cada passo = uma subtarefa. Máximo recomendado: **3–4 passos** conscientes.  
Rodapé fixo com Voltar / Primário.

### 3.10 Drawer

Painel lateral para detalhe/consulta sem sair do contexto da listagem.  
Não substituir Estação completa. Abas: poucas no default; demais em “Detalhes”.

### 3.11 Smart Search

Campo único de busca inteligente (Nome, CPF/CNPJ, telefone, documento, código conforme domínio).  
Evitar múltiplos filtros obrigatórios para a tarefa principal.

### 3.12 Linha do Tempo

Histórico cronológico de eventos. Rolável. Uso: consulta, não execução.

### 3.13 Extrato

Listagem financeira/operacional estilo extrato bancário: saldo + lançamentos.  
Colunas mínimas. Analytics fora do default.

### 3.14 Grade Operacional

Tabela editável de trabalho (ex.: retornos de prestação, itens de entrega).  
State como fonte da verdade quando houver persistência incremental. Teclado obrigatório.

### 3.15 Estado da Operação

Condição do trabalho em curso (rascunho, em andamento, pronto, bloqueado, concluído).  
Deve ser legível em ≤ 5 s e orientar a CTA.

---

## 4. Estações vs Centrais (responsabilidades)

```text
                    ┌─────────────────────┐
                    │      CENTRAL        │
                    │  O que faço agora?  │
                    │  Filas · KPIs · CTA │
                    └──────────┬──────────┘
                               │ despacha
                               ▼
                    ┌─────────────────────┐
                    │ ESTAÇÃO DE TRABALHO │
                    │  Executar a tarefa  │
                    │  Grade · Wizard ·   │
                    │  Extrato · Confirmar│
                    └──────────┬──────────┘
                               │ conclui
                               ▼
                    ┌─────────────────────┐
                    │  Sucesso + 1 próximo│
                    │  passo (voltar ou   │
                    │  próxima estação)   │
                    └─────────────────────┘
```

| Responsabilidade | Central | Estação |
|------------------|---------|---------|
| KPIs / gráficos | Sim | Não (default) |
| Filas / pendências | Sim | Não |
| Digitação intensa | Não | Sim |
| Grade / extrato | Não | Sim |
| Encerrar operação | Despacha | Executa |
| Relatórios densos | Link secundário | Não |

---

## 5. Arquitetura Visual (organização — sem cores)

### 5.1 Anatomia obrigatória da Estação

```text
┌──────────────────────────────────────────────┐
│ CABEÇALHO FIXO                               │
│ Onde estou · Contexto · Estado               │
├──────────────────────────────────────────────┤
│ ÁREA OPERACIONAL (rola se lista/grade/…)     │
│                                              │
│                                              │
├──────────────────────────────────────────────┤
│ RODAPÉ FIXO                                  │
│ [Secundário]              [ AÇÃO PRINCIPAL ] │
└──────────────────────────────────────────────┘
```

### 5.2 Anatomia da Central

```text
┌──────────────────────────────────────────────┐
│ CABEÇALHO · Nome da Central                  │
├──────────────────────────────────────────────┤
│ Pulso do dia (≤ 3 indicadores)               │
├──────────────────────────────────────────────┤
│ FILA PRINCIPAL (próximas ações)              │
├──────────────────────────────────────────────┤
│ Ações rápidas gerais (poucas)                │
└──────────────────────────────────────────────┘
```

### 5.3 Regras de layout

1. **Sem scroll da página/shell** em telas operacionais.
2. Cabeçalho e rodapé **sempre fixos**.
3. Uma **CTA primária** por viewport.
4. Máximo de **informação no primeiro viewport**: o necessário à tarefa.
5. Drawers e modais não cobrem a CTA crítica sem motivo.

---

## 6. Padrões Obrigatórios

### 6.1 Cabeçalho
- Título da tarefa (não do módulo genérico).
- Contexto curto (cliente, documento, período).
- Estado da operação (quando existir).
- Sem KPIs gerenciais.

### 6.2 Rodapé
- Fixo.
- Esquerda: cancelar / voltar.
- Direita: ação principal (+ secundária se indispensável).
- Primário nunca desabilitado sem motivo **humano** visível.

### 6.3 Pesquisa (Smart Search)
- Um campo omnisearch.
- Campos típicos: Nome, CPF, CNPJ, Telefone, Documento, Código.
- Filtros avançados: opcionais, recolhidos.

### 6.4 Stepper / Wizard
- Passos nomeados pela tarefa (“Produtos”, não “Step 2”).
- ≤ 4 passos conscientes no fluxo diário.
- Não usar stepper para tarefas de um único ato.

### 6.5 Cards
- Permitidos quando são **unidade de decisão** (resultado de busca, item de fila).
- Proibidos como decoração ou para empilhar KPIs em Estação.

### 6.6 Grades
- Colunas mínimas para a tarefa.
- Teclado: Enter confirma/salva, Tab navega, setas quando aplicável.
- Status de persistência visível (pendente / salva) quando houver rascunho.

### 6.7 Extratos
- Saldo em destaque.
- Colunas: data, tipo, descrição, valor, saldo (ajustar por domínio sem inchação).
- Analytics em área secundária.

### 6.8 Botões
- Uma primária.
- Secundárias discretas.
- Perigo (excluir/cancelar definitivo) separado e confirmado.
- Labels no léxico oficial (`Receber`, `Entregar`, `Prestar Contas`, `Encerrar`).

### 6.9 Menus
- Nav primária da estação: **≤ 5** destinos principais.
- Menu de linha: **≤ 3** ações primárias; resto em “Mais”.
- Proibido menu de 10 ações no caminho diário.

### 6.10 Drawers
- Detalhe/consulta.
- Default: poucas abas.
- Não esconder a única ação necessária dentro de aba profunda.

### 6.11 Modais
- Confirmação, autorização, recebimento rápido, impressão.
- Uma pergunta por modal.
- Esc fecha; Enter confirma quando seguro.

### 6.12 Alertas e mensagens
- Operacionais: linguagem humana, ação sugerida.
- Técnicos: apenas log / suporte — nunca como único feedback na Estação.
- Severidade visual coerente com o Design System (sem inventar padrões por motor).

### 6.13 Ícones
- Consistentes entre motores.
- Nunca substituir label da CTA principal só por ícone.

### 6.14 Estados
- Pronto / Em andamento / Bloqueado / Concluído — nomes estáveis.
- Bloqueio sempre com motivo compreensível.

### 6.15 Indicadores
- Central: ≤ 3 no pulso do dia (salvo Central analítica explícita).
- Estação: zero KPIs gerenciais no default.

### 6.16 Listagens
- Linha acionável = uma CTA óbvia.
- Densidade alta permitida; poluição visual não.

### 6.17 Navegação
- Hierarquia: Plataforma → Central do Motor → Estação → Tarefa.
- Troca de motor consciente (não misturar Fiscal dentro do Comercial sem portal).
- Sempre caminho de volta explícito.

---

## 7. Navegação Oficial

### 7.1 Hierarquia

```text
Plataforma CDS
 └── Motor (ex.: Comercial)
      ├── Central do Motor
      ├── Estação(ões) de Trabalho
      └── Camada secundária (Relatórios, Pendências, Config)
```

### 7.2 Limites

| Elemento | Máximo recomendado |
|----------|--------------------|
| Itens na nav primária do operador | 5 |
| Ações principais por linha/listagem | 3 |
| Passos de wizard diário | 4 |
| Indicadores no pulso da Central | 3 |
| CTAs primárias por viewport | 1 |

### 7.3 Fluxo entre motores
- Cada motor tem sua Central e suas Estações.
- Integrações cross-motor via **bridges/eventos** (arquitetura técnica) — a UX não “pula” regras de domínio.
- Portais (Contador, Web, Mobile) reutilizam os mesmos conceitos com densidade adaptada.

---

## 8. Acessibilidade Operacional

Priorizar uso contínuo de 8h:

| Diretriz | Prática |
|----------|---------|
| Pouco movimento | Cabeçalho/rodapé fixos; conteúdo rola no lugar |
| Pouca leitura | Textos curtos; uma pergunta |
| Áreas clicáveis generosas | CTAs e linhas de lista fáceis de acionar |
| Teclado intenso | Grades e wizards 100% operáveis por teclado |
| Pouca troca de contexto | Drawer/modal em vez de saltar de módulo |
| Feedback imediato | Estado salvo / erro humano / próximo passo |

---

## 9. Boas práticas

1. Começar toda tela nova pelo checklist deste ADR.
2. Escrever a **uma pergunta** da tela no título do PR/RFC de UX.
3. Preferir remover a criar.
4. Promover padrão local a componente de plataforma após 2º uso.
5. Validar com operador real após sprints de UX.
6. Preservar contratos técnicos (ex.: STAB-04 grade) ao simplificar chrome.

---

## 10. Anti-padrões (proibidos)

| Anti-padrão | Por quê |
|-------------|---------|
| KPI wall em tela operacional | Mistura gestão com execução |
| Scroll da página inteira na Estação | Esconde rodapé/CTA |
| Menu com 10 ações no fluxo diário | Esconde o próximo passo |
| Checklist técnico (sistema) como UI principal | Linguagem de desenvolvedor |
| Painel que espelha a grade | Duplicação cognitiva |
| Wizard com 5+ passos para um ato físico | Cliques sem valor |
| Relatórios como atalho do turno | Distrai do trabalho |
| Labels diferentes para a mesma ação entre motores | Quebra treinamento |
| Modal empilhado sem necessidade | Perda de contexto |
| Inventar layout “único” por motor | Quebra a plataforma |

---

## 11. Exemplos (referência)

### Exemplo A — Central Comercial
Pergunta: *O que preciso fazer agora?*  
Fila + ≤ 3 indicadores + atalhos gerais. Despacha para Preparar / Entregar / Prestar / Receber.

### Exemplo B — Estação Prestação
Pergunta: *Quem prestou e o que retornou?*  
Localizador (Smart Search) → Grade Operacional → Fechar com CTA fixa.

### Exemplo C — Conta Corrente (Estação)
Pergunta: *Qual o saldo e o histórico?*  
Saldo + Extrato + Receber. Gráficos fora do default.

### Exemplo D — Anti-exemplo
Listagem de consignações com 6 KPIs + drawer de 9 abas + 10 ações por linha como hub diário → **viola P05, P12, P17**.

---

## 12. Checklist obrigatório (nova tela / refactor UX)

Antes de merge / homologação:

- [ ] A tela responde **uma** pergunta explícita
- [ ] Compreensível em ≤ 5 segundos
- [ ] Operação e gestão não misturadas
- [ ] Se Estação: sem scroll de página; cabeçalho e rodapé fixos
- [ ] CTA principal sempre visível
- [ ] Próximo passo explícito
- [ ] Smart Search quando a tarefa é localizar
- [ ] ≤ 3 ações primárias em listagens
- [ ] Sem KPI wall (exceto Central / Área Analítica)
- [ ] Léxico alinhado à plataforma
- [ ] Teclado viável na área de trabalho principal
- [ ] Componentes reutilizam Design System (ou RFC para novo padrão)
- [ ] Não altera regras de domínio/arquitetura técnica por “atalho de UX”
- [ ] Build/verify do módulo (quando aplicável, ex. Motor Comercial)

---

## 13. Critérios de Aceite (globais)

Uma implementação está **conforme ADR-UX-001** quando:

1. Classificação clara: **Central** ou **Estação** (ou secundária documentada).
2. Anatomia de layout respeitada (P08–P12).
3. Nenhum anti-padrão da seção 10 no caminho crítico.
4. Checklist da seção 12 100% atendido.
5. Revisão de UX/produto (ou playbook de governança) assina conformidade.

**Não conformidade** bloqueia promoção a “oficial” do motor, mesmo com backend correto.

---

## Consequências Positivas

- Experiência única em toda a plataforma.
- Menor tempo de treinamento entre motores.
- Maior produtividade do operador.
- Base clara para Design System e auditorias UX.
- Separação sustentável entre gestão e operação.

## Consequências Negativas / Trade-offs

- Telas legadas precisarão de remodelação gradual (roadmaps por motor).
- Menos liberdade estética local por time.
- Exige disciplina de review (checklist) em PRs de frontend.
- Alguns “painéis ricos” migram para Centrais/Relatórios (pode gerar resistência inicial).

## Impactos

| Área | Impacto |
|------|---------|
| Arquitetura FE | Layouts de Estação/Central padronizados |
| Design System | Componentes alinhados a este ADR |
| Motores | Roadmaps UX por domínio (ex.: UX-11…UX-18 Comercial) |
| Governança | ADR obrigatório em playbooks de nova tela |
| Mobile/Portais | Mesmos princípios; densidade adaptada |

## Dependências

- Design System CDS (implementação visual)
- Playbooks de frontend / governança
- Roadmaps UX por motor
- Manifesto da Plataforma CDS

## Skills Relacionadas
- Skill: design-system
- Skills de motores (comercial, financeiro, etc.) — devem referenciar este ADR
- Playbook: criar nova tela / criar ADR

## RFC Relacionada
- A definir (RFC-UX-001 sugerida para ratificação formal, se o fluxo de governança exigir RFC antes de Accepted)

## Data da Aprovação
- Data da aprovação: *(pendente — Status: Proposed)*

## Última Revisão
- Última revisão: 2026-07-13

---

## Apêndice A — Léxico mínimo sugerido (plataforma)

| Preferir | Evitar no dia a dia |
|----------|---------------------|
| Central de Trabalho | Dashboard (em UI de operador) |
| Estação / Preparar / Entregar / Prestar Contas | Jargão interno de sprint |
| Encerrar Atendimento | Múltiplos sinônimos na mesma tela |
| Receber | Registrar recebimento (texto longo) |
| Conta Corrente | Extrato analítico completo (nome da tela) |

*(Léxico específico de domínio complementa, não contradiz.)*

## Apêndice B — Relação com arquitetura técnica

Este ADR **não autoriza**:

- alterar ledger, recovery, crédito SSOT, outbox, APIs ou banco;
- workarounds de domínio “para facilitar a tela”;
- duplicar lógica de negócio no frontend.

UX simplifica **apresentação e fluxo**; a verdade operacional permanece nos motores e contratos oficiais.

---

*ADR-UX-001 — Constituição de UX da Plataforma CDS. Obrigatório para todos os motores e superfícies.*
