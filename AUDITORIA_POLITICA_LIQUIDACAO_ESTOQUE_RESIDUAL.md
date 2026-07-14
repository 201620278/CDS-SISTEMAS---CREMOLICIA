# AUDITORIA DE POLÍTICA — Liquidação do Estoque Residual na Prestação

**Prioridade:** P0  
**Tipo:** Auditoria arquitetural + regra de negócio (**sem implementação**)  
**Data:** 2026-07-13  
**Base:** `AUDITORIA_FORENSE_CREDITO_POS_QUITACAO.md`, `CREDITO_COMERCIAL_OFICIAL.md`, `AUDITORIA_CREDITO_COMERCIAL_ENTERPRISE.md`, UX-10, catálogo de movimentações, use cases de prestação  

---

## Veredito executivo

A regra oficial mais coerente para a Plataforma CDS é:

> **Não permitir declarar a consignação como quitada/encerrada em sentido operacional completo enquanto existir estoque consignado residual.**  
> Residual deve ser liquidado explicitamente por **Devolução**, **Venda**, **Perda** ou **Cortesia** (e, se o produto evoluir, **Compra definitiva** como movimento oficial — hoje inexistente).  
> Só então o Crédito Comercial deve voltar ao Limite (salvo Conta Corrente remanescente).

Em outras palavras: **Alternativa A** é a política oficial recomendada.  
**Alternativa B** é válida apenas como evolução futura de produto (ADR/RFC), não como “padrão implícito”.  
**Alternativa C** (manter como está) é **incoerente operacionalmente** e cria residual órfão.

---

## 1. Quem é o proprietário da mercadoria residual após QUITADA?

### Resposta com base na arquitetura atual

**A — continua consignada (exposição comercial).**

Evidências:

| Fonte | O que implica |
|-------|----------------|
| `CreditoComercialService` / `CREDITO_COMERCIAL_OFICIAL.md` | Residual entra em `estoqueConsignado` até `DEVOLUCAO` / `VENDA` / `PERDA` / `CORTESIA` |
| Exemplo oficial de crédito | Sempre liquida residual com **Devolvido** antes do resultado “correto” |
| Catálogo de tipos | Não existe `COMPRA_DEFINITIVA` / `VENDA_RESIDUAL` oficial |
| Status `QUITADA` | Derivado de `VENDA − PAGAMENTO ≤ 0` — **não** de estoque zerado |

**B — comprada automaticamente:** **não.** Pagamento não gera venda residual no ledger.

**C — deveria impedir a quitação:** **não é o que o sistema faz hoje**, mas é o que a política oficial **deveria** impor (ver recomendação).

**D — outro fluxo oficial:** **não há** fluxo oficial de “pagamento da entrega completa = transferência de propriedade do residual”.

### Interpretação de negócio (CDS)

Enquanto o item residual estiver no ledger como consignado:

- continua sob **risco/exposição da empresa** (crédito comprometido);
- **não** há transferência automática de titularidade comercial para o cliente;
- o status `QUITADA` hoje significa apenas **quitação financeira da Conta Corrente (AR)**, não liquidação patrimonial do consignado.

---

## 2. A palavra QUITADA está correta?

### Resposta

**Não, para o operador.**  
Está semanticamente correta apenas se o glossário oficial for:

> `QUITADA` = Conta Corrente (AR) ≤ 0.

Ela **não** comunica:

- “ciclo de consignação concluído”;
- “mercadoria toda liquidada”;
- “crédito integralmente liberado”.

### Estados intermediários recomendados (glossário)

| Conceito | Significado oficial proposto |
|----------|------------------------------|
| `ACERTADA` | Prestação fechada com **AR > 0** (dívida financeira) |
| `QUITADA_FINANCEIRAMENTE` *(ou manter `QUITADA` com glossário explícito)* | AR ≤ 0 |
| `PENDENTE_ESTOQUE` / `AGUARDANDO_LIQUIDACAO` | AR ≤ 0 **e** `estoqueConsignado > 0` |
| `ENCERRADA` / `LIQUIDADA` | AR ≤ 0 **e** estoque consignado = 0 |

**Recomendação de nomenclatura:**

- Manter `QUITADA` **somente** se a plataforma passar a **bloquear** o rótulo enquanto houver residual; **ou**
- Introduzir estado explícito de pendência de estoque para a Central (E5-estoque), evitando sumiço operacional.

UX-10 hoje trata `QUITADA` + saldo AR 0 como **E6 (some da Central)** — isso reforça a leitura errada de “tudo resolvido”.

---

## 3. Existe fluxo oficial para liquidar o residual?

### Fluxos que liquidam estoque consignado (SSOT)

| Fluxo | Existe? | Quando |
|-------|---------|--------|
| Venda (`VENDA_PRESTACAO`) | Sim | Prestação **aberta** |
| Devolução (`DEVOLUCAO`) | Sim | Status `ENTREGUE`, **sem** prestação aberta |
| Perda (`PERDA`) | Sim | Prestação **aberta** |
| Cortesia (`CORTESIA`) | Sim | Prestação **aberta** |
| Compra definitiva / Venda residual automática | **Não** | — |
| Ajuste genérico de estoque consignado | **Não** no SSOT de crédito | — |
| Pagamento | Não liquida estoque | Só AR |
| Fechamento / Quitação | Não liquida estoque | Status/AR |

### Lacuna crítica pós-QUITADA

Após `QUITADA`:

| Operação | Permitida? |
|----------|------------|
| Reabrir prestação | **Não** — só `ACERTADA` (`ReabrirPrestacaoUseCase`) |
| Perda / Cortesia / Venda | **Não** — exigem prestação aberta |
| Devolução “antes da prestação” | **Não** — exige status `ENTREGUE` |

**Conclusão factual:** no caminho auditado (QUITADA com residual), o estoque **fica sem destino operacional oficial**. Continua no ledger, consome crédito, e o operador perde a fila da Central.

Isso sozinho **desqualifica a Alternativa C** como política de plataforma.

---

## 4. O Crédito Comercial deve continuar considerando esse estoque após QUITADA + AR 0 + sem pendências na Central?

### Resposta de coerência operacional

**Não deve, se a plataforma permitir chegar nesse estado.**  
Há duas formas coerentes — não uma terceira “meio termo”:

1. **Impedir o estado** (A): enquanto houver residual, não há “quitação total” nem sumiço da Central → crédito continuar contando estoque é coerente.  
2. **Liquidar o estoque no ato** (B): ao quitar integralmente com política de compra do residual → crédito libera porque o ledger mudou.

O que **não** é coerente:

- Central diz “sem pendência”;
- Prestação diz “QUITADA”;
- Crédito ainda retém limite por mercadoria sem fluxo para resolver.

Portanto: **manter o estoque no crédito após QUITADA só é defensável se a quitação for bloqueada ou houver estado/fila de liquidação de estoque.**  
Hoje a combinação “some da Central + consome crédito” é **incoerente com a operação**.

---

## 5. Impacto operacional

### Cenário do operador

| Expectativa humana | Realidade atual |
|--------------------|-----------------|
| Entregou 40, vendeu 32, “pagou 40”, status QUITADA | Achou que “fechou tudo” |
| Central remove o cliente | Confirma a sensação de conclusão |
| Nova entrega mostra crédito 42 | Interpreta como **bug** |

**Resposta direta:** o operador **não** entenderia esse comportamento como regra de negócio sofisticada. A leitura dominante é erro de sistema — exatamente o que ocorreu no incidente P0.

Fatores que agravam:

1. Pagamento pode ser feito pelo **valor da entrega**, não pelo AR (overpay), reforçando “paguei tudo”.  
2. Residual físico (ex.: 4 un. × R$ 2) não é destacado na narrativa de quitação.  
3. Não há próximo passo óbvio na Central para liquidar o residual.

---

## 6. Comparativo das alternativas A, B e C

### Alternativa A — Bloquear quitação enquanto houver estoque residual

```
Residual > 0
  → obrigar Devolução | Perda | Cortesia | Venda (ou Compra definitiva futura)
  → só então permitir QUITADA / ENCERRADA total
  → crédito libera conforme SSOT atual
```

| | |
|--|--|
| **Benefícios** | Preserva SSOT de crédito; ledger explícito; evita residual órfão; alinhado ao exemplo oficial (sempre com Devolvido); UX previsível |
| **Riscos** | Operador precisa de um passo a mais; resistência se o hábito atual for “pagar a entrega e sair” |
| **Operador** | Entende: “ainda tem mercadoria para acertar” |
| **Crédito** | Continua correto sem mudança de fórmula |
| **Motor Financeiro** | Espelha só o que foi vendido/pago/liquidado — sem receita fantasma |
| **Impacto negativo** | Exige ajuste de UX/Central + validação no fechamento/pagamento |

### Alternativa B — Quitação total gera liquidação automática do residual

```
Pagamento cobre a entrega (ou política equivalente)
  → gera VENDA_RESIDUAL / COMPRA_DEFINITIVA
  → estoque zera
  → crédito volta ao limite (se AR=0)
```

| | |
|--|--|
| **Benefícios** | Casa com expectativa “paguei tudo”; remove sumiço + crédito preso; fecha ciclo em um gesto |
| **Riscos** | Inventa venda/compra sem registro explícito do operador; contamina receita; ambiguidade fiscal/NF-e; overpay vs AR precisa de regra fina |
| **Operador** | Simples no curto prazo; opaco no longo prazo (“o sistema vendeu sozinho”) |
| **Crédito** | Libera, mas **muda o significado** do pagamento |
| **Motor Financeiro** | Precisa espelhar receita residual; risco de divergência com caixa se a regra for implícita |
| **Impacto negativo** | Exige ADR/RFC, novo tipo de movimento, testes fiscais, auditoria forense mais difícil |

### Alternativa C — Manter como está

| | |
|--|--|
| **Benefícios** | Zero mudança; fórmula de crédito tecnicamente “pura” |
| **Riscos** | Residual órfão permanente; crédito preso sem fila; suporte/homologação eternamente “bug”; contradiz exemplo oficial |
| **Operador** | Alta percepção de erro |
| **Crédito** | Tecnicamente consistente, operacionalmente ilegítimo |
| **Motor Financeiro** | Herda inconsistência comercial → financeiro (receita incompleta + exposição fantasma) |
| **Impacto negativo** | **Inaceitável** para plataforma escalável |

### Tabela comparativa

| Critério | A | B | C |
|----------|---|---|---|
| Consistência operacional | ★★★★★ | ★★★★☆ | ★☆☆☆☆ |
| Experiência do operador | ★★★★☆ | ★★★★★ (curto prazo) | ★☆☆☆☆ |
| Integridade do ledger | ★★★★★ | ★★★☆☆ (movimento sintético) | ★★☆☆☆ (estado morto) |
| Compatibilidade Motor Financeiro SSOT | ★★★★★ | ★★★☆☆ | ★★☆☆☆ |
| Escalabilidade / auditoria | ★★★★★ | ★★★☆☆ | ★☆☆☆☆ |
| Mudança no SSOT de crédito | Nenhuma | Necessária (política) | Nenhuma |
| Precisa ADR | Sim (política de fechamento) | Sim (obrigatório) | Não (mas dívida técnica) |

---

## 7. Impacto na Plataforma

| Módulo | Alternativa A | Alternativa B | Alternativa C |
|--------|---------------|---------------|---------------|
| **Motor Comercial** | Validação de encerramento + UX de liquidação residual | Novo tipo de movimento + orquestração no pagamento | Nenhuma; residual órfão permanece |
| **Crédito Comercial** | Mantém SSOT; passa a ser compreensível | Continua fórmula, mas input muda (venda/compra auto) | Continua “certo” e incompreendido |
| **Conta Corrente** | Inalterada (AR) | Pode converter residual em AR no mesmo ato | AR 0 com exposição paralela |
| **Recovery** | Precisa preservar estado de pendência de estoque | Precisa recuperar movimento sintético | Estado inconsistente após reboot |
| **Motor Financeiro** | Espelha vendas reais + pagamentos | Precisa espelhar liquidação automática | Divergência comercial×financeiro |
| **Portal do Contador** | Relatórios de consignado residual claros | Receita residual automática exige trilha | Residual “invisível” operacionalmente |
| **Relatórios / Dashboard** | KPI: “pendente liquidação de estoque” | KPI mais simples, menos auditável | KPI de crédito ≠ fila operacional |
| **NF-e** | Emite conforme venda/perda reais | Risco de documento sem intenção explícita | Sem documento para mercadoria “presa” |

---

## Recomendação arquitetural fundamentada

### Regra oficial proposta para a Plataforma CDS

1. **Mercadoria consignada residual permanece da operação de consignação** até liquidação explícita.  
2. **Liquidação oficial** = um (ou combinação) de: `VENDA_PRESTACAO`, `DEVOLUCAO`, `PERDA`, `CORTESIA` (+ futura `COMPRA_DEFINITIVA` se produto exigir).  
3. **`QUITADA` / encerramento total só é permitido com `estoqueConsignado = 0` da consignação.**  
4. Enquanto residual > 0 e AR ≤ 0, o cliente **permanece em fila operacional** (ex.: “Pendente liquidação de estoque”), não some da Central.  
5. **Crédito Comercial continua** `Limite − (AR + estoque)` — sem UPDATE paliativo.  
6. Pagamento maior que o AR **não** implica compra do residual; no máximo gera **saldo credor**, que não liquida estoque.  
7. Qualquer “compra automática do residual” exige **ADR + tipo de movimento + espelhamento financeiro/fiscal** — nunca implícito.

### Por que A (e não B/C)

- O exemplo oficial de crédito **já pressupõe devolução do residual**.  
- Append-only ledger + Motor Financeiro futuro exigem **intenção explícita** por movimento.  
- Após `QUITADA`, o sistema atual **não oferece caminho** para liquidar — logo permitir esse estado é bug de processo, não feature.  
- Escala da CDS depende de operadores confiarem que “QUITADA” = ciclo fechado.

### Encadeamento sugerido (futuro, sem implementar agora)

```
Prestação
  → registrar vendas / perdas / cortesias / devoluções até estoque = 0
  → receber até AR = 0
  → status QUITADA/ENCERRADA
  → crédito = Limite − 0
  → some da Central
```

Se o negócio quiser atalho “cliente ficou com o restante”:

```
operador escolhe explicitamente "Compra do residual"
  → movimento oficial COMPRA_DEFINITIVA / VENDA_RESIDUAL
  → (opcional) compensa com saldo credor / gera AR
  → aí sim fecha
```

Isso é **produto**, não correção silenciosa.

---

## Recomendação final da auditoria

| Item | Decisão |
|------|---------|
| Política oficial CDS | **Alternativa A** |
| Alternativa B | Adiada — só via ADR/RFC como feature “Compra do residual” |
| Alternativa C | **Rejeitada** |
| SSOT de crédito | **Manter** fórmula atual |
| Semântica de `QUITADA` | Restringir a ciclo com estoque zerado **ou** criar estado `PENDENTE_ESTOQUE` |
| Central | Não ocultar cliente com residual > 0 |
| Próximo artefato | ADR: “Liquidação obrigatória do estoque residual antes da quitação operacional” |

### Frase oficial sugerida para governança

> Na Plataforma CDS, consignação só se considera liquidada quando a Conta Corrente e o estoque consignado estiverem zerados. Pagamento não transfere propriedade do residual. Residual sem destino não pode gerar status de quitação operacional nem sumir da Central de Trabalho.

---

## Entregáveis desta auditoria

1. Este documento: `AUDITORIA_POLITICA_LIQUIDACAO_ESTOQUE_RESIDUAL.md`  
2. Comparativo A/B/C — seção 6  
3. Recomendação arquitetural — seção acima  
4. Impactos positivos/negativos — seções 6 e 7  
5. Recomendação final — **Alternativa A**

**Nenhuma alteração de código, ledger, saldo ou crédito foi realizada.**
