# AUDITORIA UX OPERACIONAL — Central de Trabalho Comercial

**Plataforma:** CDS Sistemas · Motor Comercial  
**Data:** 13/07/2026  
**Tela:** Central de Trabalho Comercial (`/`)  
**Escopo:** Experiência do operador apenas (sem arquitetura, código, banco ou performance)  
**Premissa:** Não alterar regras de negócio — validar somente a jornada operacional apresentada na Central

---

## Resumo executivo

A Central de Trabalho **mistura dois momentos operacionais distintos** na mesma tela:

1. **Atendimento em curso** (entrega / fechamento / pagamento parcial dentro do ciclo)
2. **Cobrança pós-ciclo** (saldo remanescente após encerramento oficial)

Isso gera **duplicidade de caminhos**, **nomenclatura que antecipa o fim do workflow** e **ações inválidas para a etapa** — especialmente “Fechar Atendimento” enquanto o atendimento ainda está aberto, e “Receber” enquanto a prestação ainda não foi encerrada.

| Severidade | Qtd. | Síntese |
|------------|------|---------|
| **P0** | 2 | Duplo caminho no mesmo atendimento; “Receber” competindo com fechamento aberto |
| **P1** | 3 | Nomenclatura “Fechar” em trabalho em andamento; bloco Consignados fora de hora; CTA inconsistente entre seções |
| **P2** | 2 | Três entradas para a mesma prestação; “Próximas Prestações” ainda com jargão |
| **P3** | 1 | Ações Rápidas com slots mortos (Nova Entrega / Novo Cliente desabilitados) |

---

## 1. Trabalho Prioritário — “Fechar Atendimento”

### Situação observada

No card de Trabalho Prioritário (e na Ação Rápida correspondente), o botão dominante para fechamento é:

> **Fechar Atendimento**

Isso ocorre também quando a situação descrita é de **fechamento em andamento** (atendimento já iniciado, não concluído).

Na mesma Central, a tabela **Próximas Prestações** já diferencia:

| Estado interno | Botão na tabela |
|----------------|-----------------|
| Fechamento em andamento | **Continuar** |
| Fechamento ainda não iniciado | **Fechar Atendimento** |

Ou seja: a Central **já sabe** que há diferença entre “continuar” e “iniciar/fechar”, mas o Trabalho Prioritário e as Ações Rápidas **não aplicam** essa distinção de forma consistente.

### Respostas

| Pergunta | Resposta |
|----------|----------|
| Deveria ser **Continuar Atendimento**? | **Sim**, quando o atendimento/fechamento **já está em andamento**. |
| **Fechar Atendimento** só no final do workflow? | **Parcialmente.** O rótulo “Fechar” é adequado para **convidar a iniciar o fechamento** (após entrega) ou para a **ação final dentro do wizard**. Na Central, para trabalho já aberto, o verbo correto é **Continuar**. |

### Critério operacional de nomenclatura

| Momento do operador | Verbo correto na Central |
|---------------------|--------------------------|
| Entrega incompleta | **Continuar Entrega** |
| Entrega concluída, fechamento ainda não iniciado | **Fechar Atendimento** (entrar no workflow) |
| Fechamento já aberto / em andamento | **Continuar Atendimento** (ou **Continuar**) |
| Dentro do wizard, passo de encerramento | **Encerrar Atendimento** / **Fechar Atendimento** (ação final) |
| Após encerramento com saldo | **Receber** (cobrança remanescente) |

**Veredito:** o botão “Fechar Atendimento” no Trabalho Prioritário **não representa corretamente** um atendimento ainda em andamento. Antecipa o fim e induz o operador a achar que o clique **encerra** o ciclo, quando na prática só **retoma** o wizard.

**Severidade:** **P1**

---

## 2. Consignados Pendentes — quando deve aparecer

### Situação observada

O bloco **Consignados Pendentes** aparece sempre que existe **saldo em aberto** (perfil ou consignação), **mesmo com prestação aberta / atendimento em curso**.

Na prática, o operador vê, para o mesmo cliente:

```
Trabalho Prioritário  →  Fechar Atendimento
Consignados Pendentes →  Receber
```

Dois convites concorrentes para o mesmo saldo / mesmo ciclo.

### Resposta

O bloco **Consignados Pendentes** deve aparecer:

### **B) somente depois da prestação ser oficialmente encerrada**

(com saldo remanescente a cobrar)

**Não** assim que existir saldo devedor (alternativa A).

### Justificativa operacional

| Momento | Saldo existe? | Ação correta do operador |
|---------|---------------|--------------------------|
| Durante o fechamento (prestação aberta) | Sim | Trabalhar **dentro** do atendimento: conferir itens, registrar venda/devolução, receber parcial/total, **encerrar** |
| Após encerramento oficial com saldo | Sim | Cobrança **fora** do ciclo de fechamento: **Receber** (dias depois, parcial, etc.) |
| Após quitação total | Não | Nenhum dos dois blocos |

Enquanto o atendimento está aberto, “Receber” na Central:

- **compete** com o fluxo oficial de fechamento;
- sugere um atalho de cobrança **sem** comunicar que o ciclo ainda não fechou;
- pode levar o operador a “pagar e sair” sem completar o ritual operacional (conferência → encerramento).

Saldo durante o fechamento **não é “pendência de cobrança pós-ciclo”** — é **parte do atendimento em curso**. Por isso o bloco certo nessa etapa é Trabalho Prioritário / Continuar, não Consignados Pendentes.

**Severidade:** **P0** (quebra o fluxo operacional por concorrência de caminhos)

---

## 3. Duplicidade de ações

### Caminhos atuais para o mesmo atendimento

```
Trabalho Prioritário  →  Fechar Atendimento / Continuar
         ↓
Ações Rápidas         →  Fechar Atendimento
         ↓
Próximas Prestações   →  Continuar / Fechar Atendimento
         ↓
Consignados Pendentes →  Receber   ← caminho paralelo indevido se prestação aberta
```

### Avaliação

| Tipo de duplicidade | Existe? | Avaliação |
|---------------------|---------|-----------|
| Várias entradas para **o mesmo fechamento** | Sim | Aceitável se forem **o mesmo verbo e o mesmo destino** (atalho + lista). Hoje os rótulos divergem. |
| Dois caminhos para **o mesmo saldo** (Fechar vs Receber) | Sim | **Indevido** enquanto o atendimento não foi encerrado. |
| Trabalho Prioritário + Ações Rápidas | Sim | Redundante, mas de baixa gravidade se o rótulo for o mesmo. |

**Veredito:** há **duplicidade prejudicial** entre “Fechar Atendimento” e “Receber” no mesmo ciclo aberto. A redundância entre Trabalho Prioritário / Ações Rápidas / Próximas Prestações é secundária (P2), desde que unificada.

**Severidade:** **P0** (Fechar × Receber) · **P2** (múltiplas entradas para prestação)

---

## 4. Jornada do operador — simulação etapa a etapa

Simulação pedida:

```
Entrega → Prestação → Pagamento parcial → Encerramento → Saldo devedor → Novo recebimento dias depois
```

### Fluxo ideal (o que a Central deveria mostrar)

| Etapa | Estado operacional | Cards / blocos visíveis | Botões válidos | Botões que devem sumir |
|-------|--------------------|-------------------------|----------------|------------------------|
| 1. Entrega em andamento | Entrega aberta | Trabalho Prioritário; Próximas Entregas | **Continuar Entrega** | Fechar Atendimento; Receber |
| 2. Entrega concluída → iniciar fechamento | Pronto para fechar | Trabalho Prioritário; (opcional) lista de fechamentos | **Fechar Atendimento** | Continuar Entrega; Receber |
| 3. Prestação / fechamento em andamento | Atendimento aberto | Trabalho Prioritário; lista de fechamentos | **Continuar Atendimento** | Receber; Fechar (como se encerrasse) |
| 4. Pagamento parcial (dentro do ciclo) | Atendimento ainda aberto | Mesmo da etapa 3 | **Continuar Atendimento** | Receber (ainda não) |
| 5. Encerramento oficial | Ciclo fechado | — (sai do Trabalho Prioritário de fechamento) | — | Fechar / Continuar deste ciclo |
| 6. Saldo remanescente | Cobrança pós-ciclo | **Consignados Pendentes** | **Receber** | Fechar Atendimento deste ciclo (salvo reabertura gerencial, fora da Central do dia a dia) |
| 7. Novo recebimento dias depois | Idem etapa 6 | Consignados Pendentes | **Receber** | Continuar Atendimento (não há atendimento aberto) |

### Fluxo atual (o que a Central apresenta)

| Etapa | O que o operador vê hoje | Problema |
|-------|--------------------------|----------|
| 1. Entrega | Trabalho Prioritário + Continuar Entrega (ok em geral) | Baixo risco |
| 2–4. Prestação aberta + pagamento parcial | **Fechar Atendimento** no prioritário/rápido **e** **Receber** em Consignados Pendentes | Duplo caminho; verbo “Fechar” engana |
| 5. Encerramento | Item pode sair do prioritário | Ok se saldo zerar |
| 6–7. Saldo após encerramento | Consignados Pendentes + Receber | **Correto** — mas o mesmo bloco já aparecia antes, então o operador não distingue “durante” de “depois” |

**Veredito:** a Central **não** apresenta somente as ações válidas por etapa. Na fase crítica (prestação aberta + pagamento parcial), oferece ações de **dois mundos** ao mesmo tempo.

---

## 5. Critérios — estados, cards, botões e nomenclatura

### Estados operacionais que devem existir na Central

| Código | Nome operacional | Significado para o operador |
|--------|------------------|-----------------------------|
| `E1` | Sem pendência | Nada urgente |
| `E2` | Entrega em andamento | Consignação preparada / aguardando conclusão da entrega |
| `E3` | Pronto para fechar | Entregue; fechamento ainda não iniciado |
| `E4` | Atendimento em andamento | Fechamento aberto (inclui pagamento parcial dentro do ciclo) |
| `E5` | Saldo pós-encerramento | Atendimento encerrado com valor ainda a receber |
| `E6` | Bloqueio / limite | Exige Conta Corrente / regularização (prioridade de risco) |

### Matriz de estados × cards × botões

| Estado | Trabalho Prioritário | Consignados Pendentes | Próximas Entregas | Lista de fechamentos | Ação rápida principal |
|--------|----------------------|-----------------------|-------------------|----------------------|------------------------|
| `E1` | Empty / “em dia” | Oculto ou vazio | — | — | Preparar Entrega (atalho) |
| `E2` | Visível | **Oculto** | Visível | Oculto | Continuar Entrega |
| `E3` | Visível | **Oculto** | — | Visível | **Fechar Atendimento** |
| `E4` | Visível | **Oculto** | — | Visível | **Continuar Atendimento** |
| `E5` | Opcional (só se cobrança for prioridade do dia) | **Visível** | — | Oculto p/ este ciclo | **Receber** |
| `E6` | Visível (risco) | Conforme regra de saldo pós-ciclo | — | — | Consultar Conta Corrente |

### Botões que devem existir (por contexto)

- Continuar Entrega  
- Fechar Atendimento *(só para iniciar o fechamento ou como ação final no wizard)*  
- Continuar Atendimento *(fechamento já aberto)*  
- Receber *(somente pós-encerramento com saldo)*  
- Consultar Conta Corrente *(bloqueio/limite)*  
- Preparar Entrega / Novo Cliente *(atalhos de criação, não concorrentes ao ciclo aberto)*

### Botões / blocos que devem desaparecer

| Em | Remover / ocultar |
|----|-------------------|
| `E2`, `E3`, `E4` | Bloco **Consignados Pendentes** (ou o botão **Receber** para aquele cliente) |
| `E4` | Rótulo **Fechar Atendimento** no prioritário/rápido (substituir por Continuar) |
| `E5` | **Fechar Atendimento** / **Continuar** do ciclo já encerrado (salvo fluxo gerencial explícito) |
| `E1` | Qualquer CTA de fechamento/recebimento sem alvo |

### Nomenclaturas a alterar

| Atual | Recomendado | Onde |
|-------|-------------|------|
| Fechar Atendimento *(em andamento)* | **Continuar Atendimento** | Trabalho Prioritário, Ações Rápidas |
| Continuar *(tabela, ok)* | Manter ou alinhar para **Continuar Atendimento** | Próximas Prestações |
| Próximas Prestações | **Próximos Fechamentos** ou **Atendimentos a fechar** | Título de seção |
| Consignados Pendentes *(durante ciclo)* | Reservar o bloco ao pós-ciclo; opcional: **A receber** / **Saldo a receber** | Bloco UX-09 |
| Fechamentos pendentes *(resumo)* | Manter | Resumo do dia |

---

## Fluxo ideal (visão sintética)

```
Preparar Entrega
      ↓
Continuar Entrega          ← só entrega
      ↓
Fechar Atendimento         ← entra no fechamento
      ↓
Continuar Atendimento      ← pagamento parcial / conferência (Central NÃO oferece Receber)
      ↓
Encerrar Atendimento       ← fim oficial do ciclo (dentro do wizard)
      ↓
[se houver saldo]
Receber                    ← Consignados Pendentes (dias depois inclusive)
```

**Regra de ouro:** um cliente, um momento, **uma ação primária** na Central.

---

## Fluxo atual (visão sintética)

```
Trabalho Prioritário ──► Fechar Atendimento ──┐
                                              ├──► mesmo fechamento / mesmo saldo
Ações Rápidas ─────────► Fechar Atendimento ──┤
                                              │
Próximas Prestações ───► Continuar / Fechar ──┘
                                              ✕ conflito
Consignados Pendentes ─► Receber ─────────────┘  (aparece com prestação ainda aberta)
```

---

## Inconsistências encontradas

| ID | Inconsistência | Impacto no operador | Sev. |
|----|----------------|---------------------|------|
| **UX-OP-01** | “Fechar Atendimento” no prioritário/rápido para atendimento **já em andamento** | Sugere encerramento; o clique só retoma o fluxo | **P1** |
| **UX-OP-02** | Consignados Pendentes + Receber **durante** prestação aberta | Dois caminhos para o mesmo ciclo; risco de “pular” o ritual de fechamento | **P0** |
| **UX-OP-03** | Mesmo cliente em Trabalho Prioritário e Consignados Pendentes | Duplicidade cognitiva; dúvida “qual botão é o certo?” | **P0** |
| **UX-OP-04** | Tabela de prestações diz “Continuar”; prioritário diz “Fechar” | Linguagem inconsistente na mesma tela | **P1** |
| **UX-OP-05** | Três seções levam ao mesmo fechamento com rótulos diferentes | Ruído; aprendizado lento | **P2** |
| **UX-OP-06** | Título “Próximas Prestações” vs vocabulário “Fechamento / Atendimento” | Jargão interno na home operacional | **P2** |
| **UX-OP-07** | Ações Rápidas com Nova Entrega / Novo Cliente sempre inativos | Parece produto quebrado ou “em construção” | **P3** |
| **UX-OP-08** | Pós-encerramento com saldo: “Receber” é o certo, mas o bloco não muda de significado visual | Operador não distingue “ciclo aberto” de “cobrança depois” | **P1** |

---

## Recomendações (somente UX operacional — sem mudar regra de negócio)

### R1 — Um verbo por estado do atendimento (P1)

- Em andamento → **Continuar Atendimento**
- Ainda não iniciado (pós-entrega) → **Fechar Atendimento**
- Alinhar Trabalho Prioritário, Ações Rápidas e lista de fechamentos

### R2 — Separar “ciclo aberto” de “cobrança pós-ciclo” (P0)

- **Ocultar** Consignados Pendentes / Receber para clientes com atendimento/fechamento **aberto**
- **Exibir** Consignados Pendentes apenas quando o atendimento estiver **oficialmente encerrado** e ainda houver saldo (resposta **B** da seção 2)

### R3 — Uma ação primária por cliente na Central (P0)

- Se o cliente está em `E2`–`E4`, a única CTA primária é Continuar/Fechar
- Se está em `E5`, a única CTA primária é Receber
- Evitar os dois cards lado a lado para o mesmo cliente

### R4 — Renomear seção de prestações (P2)

- “Próximas Prestações” → linguagem de **Fechamento / Atendimento**, alinhada ao restante do módulo

### R5 — Ações Rápidas honestas (P3)

- Ou ativar Nova Entrega / Novo Cliente como atalhos reais
- Ou removê-los / substituí-los por atalhos que existam (ex.: Central de Clientes), para não exibir botões mortos

### R6 — Matriz de estados como contrato de UI (P1)

- Tratar a matriz da seção 5 como checklist de homologação operacional da Central (sem alterar APIs nem regras de pagamento/encerramento)

---

## Severidade consolidada

| ID | Tema | Severidade |
|----|------|------------|
| UX-OP-02 / UX-OP-03 / R2 / R3 | Receber vs Fechar no mesmo ciclo; duplicidade | **P0** |
| UX-OP-01 / UX-OP-04 / UX-OP-08 / R1 / R6 | Nomenclatura e estados | **P1** |
| UX-OP-05 / UX-OP-06 / R4 | Redundância e jargão | **P2** |
| UX-OP-07 / R5 | Slots inativos | **P3** |

---

## Conclusão

A Central de Trabalho **funciona como painel**, mas **falha como roteiro operacional**: antecipa o fim (“Fechar”), oferece cobrança (“Receber”) cedo demais e multiplica entradas para o mesmo atendimento.

Para o operador, o fluxo saudável é linear:

**Continuar Entrega → Fechar Atendimento → Continuar Atendimento → Encerrar → (depois) Receber.**

Hoje, na fase intermediária, a tela sugere **Fechar** e **Receber** ao mesmo tempo. Isso **quebra a jornada**, não a regra de negócio — e deve ser corrigido **só na experiência** (visibilidade e nomenclatura por estado), preservando os mesmos destinos e endpoints já existentes.

---

*Documento de auditoria UX operacional. Não implica alteração de regras de negócio, APIs ou persistência.*
