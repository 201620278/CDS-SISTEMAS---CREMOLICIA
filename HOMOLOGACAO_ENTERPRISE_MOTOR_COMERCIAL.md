# HOM-01 — Homologação Enterprise do Motor Comercial

**Plataforma:** CDS Sistemas  
**Módulo:** Motor Comercial  
**Data:** 12/07/2026  
**Tipo:** Homologação operacional completa (QA Enterprise)  
**Método:** Auditoria estática de rotas, fluxos, navegação, tipografia/tokens, componentes DS, testes automatizados e simulação de perfis de uso  
**Base:** UX-07.1, DS-02, `AUDITORIA_UX_VISUAL_MOTOR_COMERCIAL.md`  
**Escopo:** Apenas auditar / homologar / documentar / classificar — sem novas funcionalidades

---

## Resumo Executivo

O Motor Comercial está **apto para Feature Freeze com ressalvas de estabilização**.

O operador consegue executar o ciclo comercial completo (cliente → preparar entrega → entregar → fechar → conta corrente → histórico → relatórios) sem bloqueio crítico. A consolidação visual UX-07.1 e a fundação DS-02 eliminaram os P0 de legibilidade.

| Indicador | Resultado |
|-----------|-----------|
| Veredito geral | **APROVADO COM RESSALVAS** |
| P0 críticos | **0** |
| P1 (estabilização) | **8** |
| P2 | **9** |
| P3 | **6** |
| Fluxos homologados (PASS) | **11** |
| Fluxos parciais | **4** |
| Fluxos reprovados | **0** |
| Testes frontend | **184/184** passando |
| Auditoria Design System | **0** violações |
| E2E / Playwright | **Ausente** (risco de processo QA) |

**Pergunta-chave:** *“O operador consegue executar todas as tarefas sem dificuldades?”*  
**Resposta:** *Sim para o fluxo principal; com atritos documentados (contexto de navegação, wizards legados, jargão residual, descoberta do Workflow).*

---

## Fluxos Homologados

| # | Fluxo | Veredito | Observação |
|---|-------|----------|------------|
| 1 | Central de Trabalho | **PASS** | Prioridades, CTA, atalhos e EmptyState/Loading OK |
| 2 | Central de Clientes | **PASS** | Novo, editar, pesquisa, filtros, exclusão, desativar |
| 3 | Central de Operações do Cliente | **PASS** | Resumo, crédito, limite, pendências, próxima ação, timeline |
| 4 | Preparar Entrega | **PASS** | LIP, qty, duplicar, limite, teclado, PDF/impressão |
| 5 | Fechar Consignação | **PASS** | Venda/devolução/perda/cortesia/pagamento/encerramento |
| 6 | Conta Corrente | **PASS** | Saldo, extrato, filtros, exportação |
| 7 | Relatórios (3 etapas) | **PASS** | Browse → Configure → Results; export só após gerar |
| 8 | Playbooks | **PASS** | CSS linkado, tipografia DS, EmptyState |
| 9 | Navegação com contexto locked | **PASS** | `cliente360Context` cobre 360 e Central nas ações principais |
| 10 | Design System (tokens/temas) | **PASS** | Classic / Dark / High Contrast via ThemeManager |
| 11 | Console (páginas MC) | **PASS*** | Sem ReferenceError/TypeError conhecidos nas páginas; *sem sessão browser live* |

\*Homologação de console baseada em análise estática + suíte Jest. Validação live em browser permanece recomendada na estabilização.

---

## Fluxos Parciais (não reprovados)

| # | Fluxo | Veredito | Motivo |
|---|-------|----------|--------|
| 5b | Entrega | **PARTIAL** | Confirmar/Cancelar/Documento OK; **sem retorno** nesta tela (retorno está no Fechar); ainda `WizardLayout` |
| 8b | Histórico | **PARTIAL** | Timeline OK; sem filtros/pesquisa; coluna `correlationId` como “Referência”; sem CSS próprio |
| 10b | Workflow | **PARTIAL** | Visual/tokens OK; **ausente do menu ERP** — baixa descoberta |
| 12 | Navegação global | **PARTIAL** | Contexto perdido em alguns atalhos (ex.: Central → ficha cliente sem query) |

---

## Fluxos Reprovados

Nenhum fluxo crítico foi **reprovado**. Não há P0 que impeça Feature Freeze.

---

## Perfis de Homologação

### 1. Operador de Balcão

| Critério | Avaliação |
|----------|-----------|
| Localiza Preparar Entrega | ✅ Central / atalho / ficha |
| Pesquisa produto + qty | ✅ LIP + atalhos de teclado |
| Confirma entrega | ✅ Checklist |
| Fecha com retornos | ✅ |
| Dificuldade principal | Vocabulário ERP “Prestação de Contas” vs tela “Fechar Atendimento”; wizards Entrega/Fechar ainda parecem “versão antiga” vs Preparar Entrega |

**Tempo médio estimado (ciclo balcão feliz):** 4–8 min  
**Cliques médios (ciclo):** 22–35

### 2. Vendedor Externo

| Critério | Avaliação |
|----------|-----------|
| Abre ficha do cliente | ✅ |
| Vê limite/crédito/próxima ação | ✅ |
| Gera entrega a partir do 360 | ✅ contexto locked |
| Conta corrente | ✅ |
| Dificuldade principal | Conta Corrente exige cliente; exportações densas no header; Playbooks/Workflow pouco óbvios |

**Tempo médio estimado (consulta + 1 entrega):** 6–10 min  
**Cliques médios:** 18–28

### 3. Gestor Comercial

| Critério | Avaliação |
|----------|-----------|
| Relatórios 3 etapas | ✅ |
| Favoritos / recentes | ✅ |
| Pendências / recomendações | ✅ |
| Workflow | ⚠️ rota existe, menu ERP não |
| Dificuldade principal | Drawer analítico expõe “Fonte de dados” / projeções; empty states com termo “Projeção” |

**Tempo médio estimado (relatório → PDF):** 45–90 s  
**Cliques médios:** 4–6

### 4. Supervisor

| Critério | Avaliação |
|----------|-----------|
| Central de Trabalho prioridades | ✅ |
| Auditoria / Configurações | ⚠️ telas secundárias sem CSS dedicado |
| Workflow / Playbooks | ⚠️ / ✅ |
| Dificuldade principal | Itens “Perdas” e “Cortesias” no ERP ainda placeholder; inconsistência de nomenclatura no menu |

### 5. Usuário iniciante (primeiro acesso)

| Critério | Avaliação |
|----------|-----------|
| Entende Central de Trabalho | ✅ boas-vindas + CTA |
| Completa Novo Cliente | ✅ (capacidade obrigatória) |
| Entende Preparar vs Entregar vs Fechar | ⚠️ três etapas com nomes próximos |
| Relatórios | ✅ fluxo guiado |
| Dificuldade principal | Excesso de opções laterais; termos técnicos residuais; ausência de onboarding guiado além de Playbooks |

---

## Problemas encontrados

### P0 — Crítico (bloqueia operação)

| ID | Problema | Status |
|----|----------|--------|
| — | Nenhum P0 identificado nesta homologação | — |

### P1 — Alto (atril operacional / estabilização)

| ID | Problema | Onde | Evidência |
|----|----------|------|-----------|
| HOM-P1-01 | Contexto de navegação perdido ao abrir cliente a partir da Central | Dashboard → Ficha | `Dashboard/index.js` navega `/clientes/${id}` sem `origem=central` |
| HOM-P1-02 | Entrega e Fechar ainda usam `WizardLayout` legado | EntregaConsignacao, PrestacaoContas | Aparência inconsistente vs Preparar Entrega (`CDSPage`) |
| HOM-P1-03 | Workflow sem entrada no menu ERP | `erp/index.html` | Existe `comercial-playbooks`; não há `comercial-workflow` |
| HOM-P1-04 | Nomenclatura divergente: menu “Prestação de Contas” vs produto “Fechar Atendimento” | ERP sidebar | `index.html` ~L126 |
| HOM-P1-05 | Jargão técnico em empty states e drawers (“Projeção”, “Fonte de dados”) | Relatórios, Conta Corrente, IndicadorDrawer | Strings visíveis ao operador |
| HOM-P1-06 | Histórico sem filtros e com `correlationId` | HistoricoPrestacao | Coluna “Referência” = correlationId |
| HOM-P1-07 | Ordem CSS: estilos de página carregam **antes** do Design System | `erp/index.html` | Risco de override imprevisível entre temas |
| HOM-P1-08 | Botões nativos fora do componente oficial em listas/cards | Relatórios, Central Operações, Playbooks, Workflow | Controles `<button>` raw + dualidade `.cds-button` / `.cds-btn` |

### P2 — Médio (UX / consistência)

| ID | Problema | Onde |
|----|----------|------|
| HOM-P2-01 | Entrega sem ação de “retorno/devolver” na própria tela | EntregaConsignacao (retorno só no Fechar) |
| HOM-P2-02 | Drawers com labels 12px / hierarquia fraca | IndicadorDrawer, CockpitDrawer |
| HOM-P2-03 | Hardcode `#0f172a` em CTAs da ficha do cliente | PerfilComercial/styles.css |
| HOM-P2-04 | Auto-refresh 60s em várias telas pode interromper leitura | Dashboard, Consignações, Relatórios, etc. |
| HOM-P2-05 | `Promise.all` sem cancelamento em cargas paralelas | ContaCorrente, Relatórios, Prestacao |
| HOM-P2-06 | Ausência de testes E2E (Playwright/Cypress) | Repositório |
| HOM-P2-07 | Placeholders ERP: Perdas / Cortesias | Menu ERP |
| HOM-P2-08 | Configurações / Auditoria sem CSS dedicado | Páginas admin |
| HOM-P2-09 | Conta Corrente aberta sem cliente → seletor extra | ContaCorrente |

### P3 — Baixo (backlog)

| ID | Problema |
|----|----------|
| HOM-P3-01 | HistoricoPrestacao sem `styles.css` próprio |
| HOM-P3-02 | DetalhesConsignacao reutiliza CSS de Consignações |
| HOM-P3-03 | `motor-comercial.bundle.css` não linkado no ERP |
| HOM-P3-04 | Atalhos de teclado só nos wizards (não globais) |
| HOM-P3-05 | Auditoria com termos “ledger” / Correlation ID |
| HOM-P3-06 | Sobredeclaração residual no checklist UX-07.1 (“100% Button oficial”) |

---

## Sugestões de UX

1. Propagar sempre `origem` + `clienteId` nas saídas da Central (voltar previsível).
2. Migrar Entrega e Fechar para o mesmo shell de Preparar Entrega (`CDSPage` + tipografia DS).
3. Substituir “Projeção …” por linguagem operacional: “Sem dados no período”, “Indicadores indisponíveis”.
4. Remover ou mascarar `correlationId` no Histórico; exibir documento/data/tipo.
5. Incluir Workflow no menu ERP (Supervisor/Gestor).
6. Unificar menu: “Fechar Atendimento” (ou “Acertos”) — nunca “Prestação de Contas” sozinho.
7. Em Relatórios, manter o fluxo 3 etapas (aprovado) e revisar copy do drawer.
8. Reduzir densidade do header da Conta Corrente em 1366×768 (agrupar exportações).

---

## Sugestões Operacionais

1. Sprint única de **estabilização** (STAB-01) para P1 — sem features.
2. Checklist de homologação live em notebook 1366×768 com Classic/Dark/High Contrast.
3. Introduzir Playwright nos 5 caminhos críticos (ver tempos abaixo).
4. Treinamento iniciante: Playbook “Primeiro dia no balcão” como default no primeiro acesso.
5. Feature Freeze: aceitar apenas correções P0/P1 até fechamento STAB-01.

---

## Tempo médio por operação

Estimativas de uso real (operador treinado, rede local, dados mock/API saudável):

| Operação | Tempo médio | Telas | Cliques médios | TAB médios |
|----------|-------------|-------|----------------|------------|
| Localizar operação na Central | 5–15 s | 1 | 1–2 | 0–2 |
| Novo Cliente → Salvar | 1–2 min | 2 | 4–8 | 8–15 |
| Abrir Ficha + entender situação | 20–40 s | 1 | 1–2 | 0–3 |
| Preparar Entrega (cliente locked, 1–3 itens) | 1–3 min | 1–2 | 5–9 | 10–25 |
| Confirmar Entrega | 30–60 s | 1 | 3–5 | 4–8 |
| Fechar Consignação (fluxo completo) | 2–5 min | 1 | 10–18 | 15–40 |
| Conta Corrente → Exportar PDF | 20–40 s | 1 | 2–3 | 0–2 |
| Histórico (consulta) | 15–30 s | 1 | 1–2 | 0–2 |
| Relatório → Gerar → PDF | 45–90 s | 1 (3 etapas) | 4–6 | 3–8 |
| Abrir Playbook e iniciar guia | 30–60 s | 1 | 3–5 | 2–6 |

**Quantidade média de telas por ciclo comercial completo:** 5–7  
**Quantidade média de cliques por ciclo completo:** 22–35

---

## Auditoria UX (perguntas oficiais)

| Pergunta | Resposta |
|----------|----------|
| Existe tela cansativa? | **Sim (parcial):** Fechar Consignação em documentos longos; Conta Corrente com muitos blocos simultâneos |
| Informação repetida? | **Sim:** status/limite aparecem em Central, Ficha e Consignações — útil, mas denso |
| Excesso de espaço vazio? | **Baixo** após UX-07.1; Histórico ainda “magro” |
| Botão escondido? | **Não crítico**; exportações de Relatórios corretamente escondidas até gerar |
| Fluxo confuso? | **Parcial:** Preparar → Entregar → Fechar exige treinamento; retorno só no Fechar |
| Termo técnico visível? | **Sim:** “Projeção”, “Fonte de dados”, correlationId, menu Prestação |
| Algo que o operador não entenderia? | Workflow (se achar); placeholders Perdas/Cortesias; drawer analítico |

---

## Design System e Viewports

| Tema / Viewport | Status homologação estática |
|-----------------|-----------------------------|
| Classic | ✅ tokens semânticos |
| Dark | ✅ com ressalva CTA `#0f172a` na ficha |
| High Contrast | ✅ via ThemeManager |
| 1366×768 | ⚠️ risco de densidade (Fechar, Conta Corrente, headers) — validar live |
| 1600×900 | ✅ esperado OK |
| 1920×1080 | ✅ esperado OK |
| Cards / Botões / Inputs / Loading / EmptyState | ✅ predominante; gaps documentados em P1/P2 |
| Drawers | ⚠️ hierarquia tipográfica residual |

---

## Performance

| Aspecto | Achado |
|---------|--------|
| Abertura de páginas | Aceitável em código (render síncrono + load async) |
| Pesquisa produtos (LIP) | Debounce presente |
| Auto-refresh 60s | Presente em múltiplas telas — pode gerar re-render e ruído |
| Chamadas paralelas | `Promise.all` amplo sem cancel — risco de race ao trocar filtros rápido |
| Re-renderizações | Relatórios `_renderStep()` recria DOM da etapa; Consignações refetch em filtro |

---

## Console / Qualidade automatizada

| Check | Resultado |
|-------|-----------|
| `npm run audit:design-system` | ✅ 0 tokens inválidos, 0 hardcoded, 0 headings globais, 0 `!important` |
| `npm run test:motor-comercial-frontend` | ✅ 184/184 |
| ReferenceError / TypeError conhecidos em páginas | ✅ não encontrados |
| CSS Error / tokens inválidos em páginas MC | ✅ `#fff`/`white` removidos (UX-07.1) |
| E2E browser | ❌ inexistente |

---

## Checklist final

| Critério de aceite HOM-01 | Status |
|---------------------------|--------|
| Todos os fluxos auditados | ✅ |
| Todos os módulos testados (estático + unitário) | ✅ |
| Todos os perfis simulados | ✅ |
| Nenhum erro crítico (P0) pendente | ✅ |
| Relatório completo gerado | ✅ |
| Motor Comercial apto para Feature Freeze | ✅ **com ressalvas P1 → STAB-01** |

---

## Decisão oficial

### Feature Freeze: **AUTORIZADO**

Condições:

1. Nenhuma feature nova até conclusão da sprint de estabilização **STAB-01**.
2. STAB-01 deve endereçar, no mínimo: **HOM-P1-01 a HOM-P1-08**.
3. Homologação live (browser) em 1366×768 Classic/Dark/High Contrast antes do go-live.
4. Introduzir cobertura E2E dos 5 caminhos críticos.

### Próximo passo recomendado

**STAB-01 — Estabilização pós-homologação** (única sprint de correções), sem novas capacidades de negócio.

---

## Apêndice A — Rotas cobertas

`/`, `/consignacoes`, `/consignacoes/nova`, `/consignacoes/:id`, `/consignacoes/:id/entrega`, `/consignacoes/:id/prestacao`, `/consignacoes/:id/prestacao/conta-corrente`, `/consignacoes/:id/prestacao/historico`, `/clientes`, `/clientes/novo`, `/clientes/:id`, `/clientes/:id/editar`, `/conta-corrente`, `/relatorios`, `/indicadores`, `/pendencias`, `/recomendacoes`, `/playbooks`, `/workflow`, `/configuracoes`, `/auditoria`, `/design-system`

## Apêndice B — Referências

- `AUDITORIA_UX_VISUAL_MOTOR_COMERCIAL.md`
- `UX_07_1_CONSOLIDACAO_VISUAL.md`
- `frontend/shared/design-system/DESIGN_SYSTEM_AUDIT.md`
- `frontend/modules/motor-comercial/routes/index.js`
- `frontend/modules/motor-comercial/utils/cliente360Context.js`
- `frontend/erp/index.html`
