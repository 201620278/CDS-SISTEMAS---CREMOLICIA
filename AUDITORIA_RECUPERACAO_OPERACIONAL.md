# AUDITORIA ENTERPRISE — Persistência e Recuperação de Fluxos Operacionais

**Plataforma:** CDS Sistemas · Motor Comercial  
**Data:** 12/07/2026  
**Tipo:** Auditoria técnica (somente identificação — sem correções)  
**Pergunta-chave:** *O operador consegue interromper o trabalho e continuar exatamente do ponto onde parou?*  
**Resposta curta:** **Não de forma confiável.** Vários fluxos críticos dependem de estado em memória / `sessionStorage`. O caso homologado (Preparar → Entrega → fechar ERP) é **P0**.

---

## Resumo Executivo

O Motor Comercial **persiste bem o que já foi gravado via API** (cabeçalho de consignação, itens no banco, entregas confirmadas, movimentações de prestação, cadastros salvos). Porém a **reconstrução da UI após reinício** falha em pontos críticos porque:

1. Itens da consignação são **gravados no banco**, mas o frontend **não os relê** via API — usa `sessionStorage` (`motor-comercial:itens:{id}`).
2. `GET /consignacoes/:id` **não devolve `itens`**.
3. **Não existe** rota `GET /consignacoes/:id/itens`.
4. Após fechar o ERP, o `sessionStorage` some → tela de Entrega reabre com **indicadores zerados** e checklist bloqueado, embora o rascunho exista no banco.

| Indicador | Resultado |
|-----------|-----------|
| Fluxos seguros (retomáveis a partir do banco) | Parcial — pós-entrega / pós-gravação |
| Fluxos inseguros (perda de trabalho ou contexto) | Preparar Entrega, Entrega pendente, cadastro rascunho, wizard em andamento |
| Dependência de frontend/memória | Alta nos fluxos operacionais ativos |
| Mecanismo oficial de “Retomar operação” | **Inexistente** |
| P0 | **3** |
| P1 | **4** |
| P2 | **6** |
| P3 | **5** |

---

## Caso homologado (causa raiz)

```
Preparar Entrega → Conferência → Conclusão ("Consignação criada")
  → Abrir Entrega (antes de confirmar / imprimir termo)
  → Fechar ERP
  → Abrir ERP
  → Indicadores zerados / não conclui entrega
```

| Camada | O que acontece |
|--------|----------------|
| Banco | Consignação permanece `RASCUNHO`; itens existem em `consignacoes_itens` |
| Frontend ao reabrir | `carregarConsignacaoCompleta` lê itens de **sessionStorage** |
| Após kill/reboot | sessionStorage vazio → `itens = []` |
| API | `GET /consignacoes/:id` sem itens; sem GET de itens |
| UI | StatCards 0; checklist `itensCadastrados = false`; Entregar bloqueado |

**Evidências:**

- Cache: `frontend/modules/motor-comercial/utils/operacional.js` (`cacheItensConsignacao` / `obterItensCacheConsignacao` / `carregarConsignacaoCompleta`)
- DTO sem itens: `backend/.../http/dto/ConsignacaoDTO.js` → `ConsignacaoResponse.toJSON`
- Rotas: `comercial.routes.js` — POST/PUT/DELETE itens; **sem GET**
- Entrega: `EntregaConsignacao/index.js` — checklist e totais a partir de `itens` vazios

**Conclusão do caso:** a operação **está salva no banco**, mas o **contexto operacional da tela não é reconstruível** com as APIs atuais. O operador **não consegue continuar**.

---

## Fluxos auditados

### Matriz resumida

| Fluxo | Persistido? | Depende frontend? | Reconstruível do banco? | Risco |
|-------|-------------|-------------------|-------------------------|-------|
| Clientes — Novo/Editar (salvo) | SIM | NÃO | SIM | P3 |
| Clientes — cadastro interrompido / rascunho | PARCIAL (sessionStorage) | SIM | NÃO | P2 |
| Preparar Entrega — antes de salvar | NÃO | SIM | NÃO | **P0** |
| Preparar Entrega — rascunho/concluir (DB) | SIM (header+itens) | SIM (leitura UI) | PARCIAL* | **P0** |
| Preparar — impressão/PDF termo | NÃO (evento opcional) | SIM | NÃO necessário | P3 |
| Entrega — pendente (RASCUNHO) | SIM no DB / NÃO na UI | SIM | PARCIAL* | **P0** |
| Entrega — confirmada | SIM | NÃO | SIM | P3 |
| Fechar Atendimento — writes gravados | SIM | NÃO | SIM | P3 |
| Fechar — formulário/grade não gravados | NÃO | SIM | NÃO | P1 |
| Conta Corrente — dados | SIM (projeção) | NÃO | SIM | P3 |
| Conta Corrente — filtros da sessão | NÃO | SIM | NÃO | P3 |
| Histórico | SIM | NÃO | SIM | P3 |
| Relatórios — execução | NÃO (recalculável) | PARCIAL | SIM (dados) | P2 |
| Relatórios — favoritos/histórico | localStorage | SIM | NÃO | P2 |
| Workflow — progresso | localStorage | SIM | NÃO | P2 |
| Playbooks — progresso | localStorage | SIM | NÃO | P2 |
| Contexto navegação 360 | query string | SIM | NÃO | P1 |

\*Itens existem no banco, mas a UI **não os recupera** após reinício.

---

## Detalhamento por fluxo

### 1. Clientes

| Pergunta | Novo/Editar salvos | Cadastro interrompido |
|----------|--------------------|------------------------|
| Operação fica salva? | SIM (API ERP/perfil) | SÓ se “Salvar rascunho” → `sessionStorage` |
| Contexto fica salvo? | SIM | NÃO após fechar ERP |
| Operador continua? | SIM | NÃO após kill/reboot |
| Perda de trabalho? | NÃO (se salvou) | SIM |
| Depende memória UI? | NÃO | SIM |
| Só banco? | SIM | NÃO |

**Estado:** rascunho em `motor-comercial:cliente-cadastro-rascunho` (`ClienteCadastroView.js`).  
**Risco:** P2 (rascunho); P3 (cadastro concluído).

---

### 2. Preparar Entrega

| Etapa | Persistido? | Depende FE? | Reconstruível? | Risco |
|-------|-------------|-------------|----------------|-------|
| Cliente | Memória até persistir | SIM | NÃO | P0 se não salvou |
| Produtos | Memória / DB após salvar | SIM | PARCIAL* | **P0** |
| Conferência | Memória + DirtyState | SIM | NÃO (passo) | **P0** |
| Conclusão | DB RASCUNHO; UI step memória | SIM | PARCIAL* | **P0** |
| Impressão termo | Opcional (API emissão) | SIM | NÃO crítico | P3 |

**Fatos técnicos:**

- Persistência só em **Salvar Rascunho** ou **Concluir** (`_persistConsignacao`).
- Rota permanece `/consignacoes/nova` — **sem `:id` na URL** durante o wizard.
- `DirtyState` é **somente memória** (+ `beforeunload` se sujo).
- Após concluir: status ainda **`RASCUNHO`** no banco.
- Itens vão para DB **e** para `sessionStorage`.

**Experimentos:**

| Experimento | Antes de salvar | Depois de concluir (antes Entrega) |
|-------------|-----------------|-------------------------------------|
| Fechar ERP | Perde tudo | Cabeçalho no banco; UI sem itens |
| Kill processo | Perde tudo | Idem |
| Reinício PC | Perde tudo | Idem |

**Risco:** **P0**.

---

### 3. Entrega

| Etapa | Persistido? | Depende FE? | Reconstruível? | Risco |
|-------|-------------|-------------|----------------|-------|
| Documento (RASCUNHO) | SIM no DB | SIM (itens) | PARCIAL* | **P0** |
| Impressão termo (pré-confirmação) | NÃO obrigatória | SIM | — | P3 |
| Confirmação (POST entrega) | SIM → ENTREGUE | NÃO | SIM | P3 |
| Entrega pendente pós-restart | DB sim / UI quebrada | SIM | PARCIAL* | **P0** |

**Checklist** recalculado em memória a cada load — depende de `itens` não vazios.  
**Liberação gerencial** em `sessionStorage` (`cds-mc-liberacao-limite:`) — **perdida** no restart.

**Risco dominante:** **P0** (entrega pendente).

---

### 4. Fechar Atendimento

| Etapa | Persistido? | Depende FE? | Reconstruível? | Risco |
|-------|-------------|-------------|----------------|-------|
| Produtos/retornos gravados | SIM (API) | NÃO | SIM (ledger) | P3 |
| Grade não salva | NÃO | SIM | NÃO | P1 |
| Pagamentos registrados | SIM | NÃO | SIM | P3 |
| Form pagamento aberto | NÃO | SIM | NÃO | P1 |
| Conferência / Encerramento | SIM após fechar | NÃO | SIM | P3 |

Abertura da prestação ocorre no **primeiro write** (`_garantirPrestacaoAberta`), não só ao abrir a tela.  
Rota com `:id` permite reabrir após restart **se** consignação já ENTREGUE e há movimentações.

**Risco:** P1 (dados não commitados); P3 (já gravados).

---

### 5. Conta Corrente

| Aspecto | Persistido? | Depende FE? | Reconstruível? | Risco |
|---------|-------------|-------------|----------------|-------|
| Extrato/saldos | SIM (projeções) | NÃO | SIM | P3 |
| Filtros da sessão | NÃO (exceto query inicial) | SIM | NÃO | P3 |
| Favoritos de filtro | localStorage | SIM | NÃO | P2 |

---

### 6. Histórico

| Aspecto | Resultado |
|---------|-----------|
| Persistido | SIM (API timeline/movimentações) |
| Depende FE | NÃO |
| Reconstruível | SIM via `/consignacoes/:id/prestacao/historico` |
| Risco | P3 |

---

### 7. Relatórios

| Aspecto | Persistido? | Depende FE? | Reconstruível? | Risco |
|---------|-------------|-------------|----------------|-------|
| Dados do relatório | Recalculáveis | NÃO | SIM | P3 |
| Etapa browse/configure/results | Query parcial | SIM | PARCIAL | P2 |
| Favoritos / histórico / layouts | localStorage | SIM | NÃO | P2 |

---

### 8. Workflow

| Aspecto | Resultado |
|---------|-----------|
| Progresso / status | **localStorage** (`motor-comercial:workflow-*`) |
| Banco | Não é fonte do progresso UI |
| Após reboot (mesmo perfil) | localStorage **pode** sobreviver |
| Outro PC / limpeza storage | Perde |
| Risco | P2 |

---

### 9. Playbooks

| Aspecto | Resultado |
|---------|-----------|
| Instâncias / progresso | **localStorage** (`motor-comercial:playbooks-*`) |
| Reconstruível do banco | NÃO |
| Risco | P2 |

---

## Fluxos seguros

Operações em que o operador **pode retomar** após fechar/reiniciar, desde que o identificador esteja acessível (lista/URL):

1. Cliente **já salvo**
2. Consignação **já ENTREGUE** (seguir para prestação)
3. Prestação com **movimentações já gravadas**
4. Conta corrente / histórico (leitura)
5. Relatório (reexecução)

---

## Fluxos inseguros

1. **Preparar Entrega em andamento** sem salvar — perda total (**P0**)
2. **Preparar/Entrega com RASCUNHO no banco** — dados no DB, UI não reconstrói itens (**P0**)
3. **Entrega aberta sem confirmar** — mesmo sintoma dos zeros (**P0**)
4. Cadastro cliente com rascunho só em sessionStorage (**P2**)
5. Wizard Prestação com alterações não enviadas (**P1**)
6. Progresso Playbooks/Workflow só local (**P2**)
7. Contexto Cliente 360 só na query string (**P1**)

---

## Dependências de frontend

| Tipo | Onde | Sobrevida a kill/reboot |
|------|------|-------------------------|
| Memória JS (`this.data`, steps, DirtyState, checklist) | NovaConsignacao, Entrega, Prestacao | **Morre** |
| `sessionStorage` itens | `motor-comercial:itens:{id}` | **Morre** |
| `sessionStorage` liberação limite | `cds-mc-liberacao-limite:{id}` | **Morre** |
| `sessionStorage` rascunho cliente | `motor-comercial:cliente-cadastro-rascunho` | **Morre** |
| Query params navegação | `origem`, `clienteId` | Só se URL for reaberta igual |
| `localStorage` favoritos/progresso | relatórios, playbooks, workflow, pendências | **Sobrevive** no mesmo perfil |

---

## Dependências de banco

| Entidade | Persistência | Usada na retomada UI? |
|----------|--------------|------------------------|
| `consignacoes` (header) | SIM | SIM (GET por id) |
| `consignacoes_itens` | SIM | **NÃO** (falta leitura na UI) |
| Movimentações / prestação | SIM | SIM (após entrega) |
| Perfis / clientes | SIM | SIM |
| Progresso playbook/workflow | NÃO (só local) | — |

---

## Riscos encontrados

### P0 — Perda operacional / bloqueio

| ID | Risco | Impacto |
|----|-------|---------|
| REC-P0-01 | Itens só no sessionStorage para a UI; GET consignação sem itens | Entrega/Preparar reabrem com zeros; não conclui |
| REC-P0-02 | Sem rota GET de itens | Impossível reconstruir grade só pelo contrato HTTP atual |
| REC-P0-03 | Wizard Preparar sem `:id` na URL e sem autosave | Kill antes de salvar = trabalho perdido |

### P1 — Atrito grave

| ID | Risco |
|----|-------|
| REC-P1-01 | Prestação: alterações de grade/pagamento não commitadas se perdem |
| REC-P1-02 | Contexto 360/Central só em query — refresh sem params perde “voltar” |
| REC-P1-03 | Liberação gerencial (STAB-01.3) some no restart (sessionStorage) |
| REC-P1-04 | Não há “Central de operações interrompidas” / retomar oficial |

### P2 — Consistência / multi-estação

| ID | Risco |
|----|-------|
| REC-P2-01 | Rascunho cliente em sessionStorage |
| REC-P2-02 | Favoritos/histórico relatórios em localStorage |
| REC-P2-03 | Playbooks progresso só local |
| REC-P2-04 | Workflow progresso só local |
| REC-P2-05 | Pendências/recomendações estado local |
| REC-P2-06 | Etapa de Relatórios parcialmente só em memória |

### P3 — Aceitável / baixo

| ID | Risco |
|----|-------|
| REC-P3-01 | Filtros Conta Corrente da sessão |
| REC-P3-02 | Histórico sem filtros avançados |
| REC-P3-03 | Termo/PDF é visualização, não estado do fluxo |
| REC-P3-04 | Cadastro cliente já salvo |
| REC-P3-05 | Entrega/prestação já confirmadas no ledger |

---

## Recuperação — mecanismo atual

| Pergunta | Resposta |
|----------|----------|
| Existe “Retomar operação interrompida”? | **Não** |
| Existe fila de rascunhos operacionais? | Lista de consignações RASCUNHO sim; **sem** retomada confiável da grade |
| Autosave periódico? | **Não** |
| DirtyState com persistência? | **Não** (só alerta beforeunload) |
| Reconstrução 100% banco → UI (fluxo ativo)? | **Não** para Preparar/Entrega pendente |

---

## Experimentos (resultado esperado pela análise estática)

Aplicável a cada fluxo crítico. Resultado = o que o código permite hoje.

### Experimento 1 — Fechar ERP normalmente

| Fluxo | Resultado |
|-------|-----------|
| Preparar sem salvar | Perde tudo |
| Preparar após concluir / Entrega aberta | Rascunho no banco; UI sem itens / bloqueada |
| Prestação com writes | Retomável |
| Cliente rascunho session | Perde |
| Playbooks/Workflow localStorage | Em geral **mantém** no mesmo browser |

### Experimento 2 — Kill do processo

Igual ao Experimento 1 para `sessionStorage` e memória.  
`localStorage` tipicamente permanece.

### Experimento 3 — Reinício do computador

Igual ao kill.  
Qualquer dependência de `sessionStorage` ou memória JS = **perda**.  
Dados só no banco sem API de leitura completa = **perda efetiva para o operador**.

---

## Recomendações (não implementar nesta sprint)

1. **Expor itens no GET** da consignação **ou** criar `GET /consignacoes/:id/itens` e usar na `carregarConsignacaoCompleta` (elimina P0-01/02).
2. **Não usar `[]` truthy** como cache: só aplicar sessionStorage se `length > 0`; preferir sempre banco.
3. **Autosave** + `:id` na URL ao criar rascunho (Preparar Entrega).
4. **Central “Continuar operação”** na Central de Trabalho (rascunhos + entregas pendentes).
5. Persistir liberação gerencial no banco (já auditada) e reler na Entrega.
6. Migrar progresso Playbooks/Workflow para backend quando forem oficiais multi-estação.
7. Rascunho de cliente no servidor (ou localStorage com TTL), não só sessionStorage.

---

## Plano de estabilização sugerido (futuro)

| Sprint | Escopo | Alvo |
|--------|--------|------|
| **REC-01** | Leitura de itens + reconstrução Entrega/Preparar | P0 |
| **REC-02** | Autosave + URL com id + retomada na Central | P0/P1 |
| **REC-03** | Liberação gerencial retomável; dirty prestação | P1 |
| **REC-04** | Padrão plataforma “Recuperação de Fluxos” (playbooks/workflow/clientes) | P2 |

Este documento é a base para o recurso oficial de **Recuperação de Fluxos Operacionais** da Plataforma CDS.

---

## Checklist de aceite da auditoria

| Critério | Status |
|----------|--------|
| Todos os fluxos auditados | ✅ |
| Riscos classificados P0–P3 | ✅ |
| Dependências de estado identificadas | ✅ |
| Documento técnico completo | ✅ |
| Nenhuma alteração em backend/banco/APIs/regras | ✅ (somente análise) |

---

## Veredito final

> **O operador NÃO consegue, de forma confiável, interromper o trabalho e continuar exatamente do ponto onde parou** nos fluxos de Preparar Entrega e Entrega pendente — inclusive quando o banco já contém o rascunho.  
> A causa não é “falta de save no banco” isolada, e sim **reconstrução da interface dependente de cache de frontend**, em descompasso com a persistência real.
