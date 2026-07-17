# RC2.3.7 — UX Nova Consignação / Detalhe (Desktop × Mobile)

**Versão:** `2.3.7-rc2.3.7` · Build `20260717rc237`  
**Escopo:** Reorganização visual do fluxo operacional de consignação no CDS Mobile  
**Restrições:** Sem APIs · Sem banco · Sem Motores · Sem regras de negócio novas

---

## Parecer final

**✔ APROVADO** — A tela de consignação Mobile prioriza a operação (cliente → produtos → entregar), alinhada ao fluxo do operador no ERP Desktop, sem informações de consulta na área principal.

---

## 1. Problemas encontrados

| ID | Problema | Impacto |
|----|----------|---------|
| C1 | Histórico comercial na área principal (inclusive vazio) | Interrompia fluxo de inclusão de itens |
| C2 | Conta corrente + última movimentação na Nova/Detalhe | Densidade de consulta; pouco útil na criação |
| C3 | Cabeçalho misturava total, saldo e data de criação | Operador perdia foco no cliente/status |
| C4 | Cards com “Movimentação / — / R$ 0,00” | Ruído visual |
| C5 | Ações inválidas no status (Histórico/CC/Share no RASCUNHO) | Botões que não fazem parte da tarefa |
| C6 | Ordem: resumo pesado → itens → ações | Distante do wizard Desktop (crédito → produtos → conferir) |

---

## 2. Componentes removidos da tela principal

| Componente | Destino |
|------------|---------|
| Histórico comercial (lista inline) | Bottom Sheet via ação **Histórico** (ENCERRADA / CANCELADA) |
| Conta corrente (lançamentos na tela) | Bottom Sheet via ação **Conta corrente** (ENCERRADA) |
| Última movimentação / último pagamento | Removidos da UI principal (dados ainda vêm da API se necessário depois) |
| “Criada em” no cabeçalho | Removido (administrativo) |
| Empty state de histórico | Não renderiza mais |
| Texto longo de introdução na Nova | Encurtado |

---

## 3. Componentes reorganizados

### Fluxo do Detalhe (ordem obrigatória)

1. **Cabeçalho** — Número · Status · Cliente · Perfil comercial  
2. **Resumo financeiro** — Limite · Crédito disponível · Crédito utilizado · Pendências (só se houver)  
3. **Adicionar produto** — só em RASCUNHO  
4. **Lista de itens** — editar/excluir qty no RASCUNHO  
5. **Total da consignação** — card destacado  
6. **Barra de operações** — sticky, filtrada por status  

### Nova consignação

1. Busca cliente  
2. Identificação do cliente  
3. Resumo financeiro compacto  
4. Seleção de perfil  
5. Criar consignação  

---

## 4. Fluxo antes × depois

| Antes | Depois |
|-------|--------|
| Cabeçalho + painel comercial completo + CC + histórico + itens + ações | Cabeçalho → crédito → produtos → itens → total → ações |
| Histórico sempre visível (mesmo vazio) | Sheet sob demanda |
| RASCUNHO com Histórico / CC / Share | Só **Entregar** e **Cancelar** |
| ENTREGUE misturado com consulta | Prestação · Recebimento · Pagamento · Perdas · Encerrar (+ oficial/NFC-e) |
| ENCERRADA competia com operação | Histórico · CC · DANFE · XML · Compartilhar · Reabrir |

```
ANTES:  Header → Painel gordo → Prestação → Produtos → Itens → Histórico → Ações
DEPOIS: Header → Crédito → [Prestação*] → Produtos* → Itens → Total → Ações
        (* só quando aplicável)
```

---

## 5. Evidências da melhoria de UX

- Menos scroll até o primeiro produto no RASCUNHO  
- Nenhum card vazio na área operacional (`rowIf` / `hasText`)  
- Ações coerentes com o status (mesma lógica de negócio, só filtro de UI)  
- Histórico/CC acessíveis sem poluir a criação  
- Paridade operacional com Desktop: crédito oficial da API + LIP de itens + entrega  

Arquivos:
- `frontend/apps/mobile/js/pages/comercial.js`
- `frontend/apps/mobile/css/mobile.css`
- `frontend/apps/mobile/js/version.js` (+ cache bust)

---

## 6. Ações por status (UI)

| Status | Ações na barra |
|--------|----------------|
| **RASCUNHO** | Entregar · Cancelar (+ Alterar/Excluir nos itens) |
| **ENTREGUE** | Prestação · Recebimento · Pagamento · Perdas · Encerrar · Venda oficial · NFC-e* |
| **ENCERRADA** | Reabrir* · Histórico · Conta corrente · DANFE · XML · Compartilhar |
| **CANCELADA** | Histórico |

\* conforme permissões já existentes (`COMERCIAL_*` / fiscal)

---

## 7. Aceite

- [x] Sequência cabeçalho → crédito → produto → itens → total → ações  
- [x] Histórico fora da área principal  
- [x] Sem cards vazios  
- [x] Ações filtradas por status  
- [x] Densidade operacional (não consulta)  
- [x] Sem alteração de APIs / regras / motores  

*CDS Sistemas · RC2.3.7 · UX Consignação · 2026-07-17*
