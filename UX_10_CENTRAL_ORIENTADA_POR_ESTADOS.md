# UX-10 — Central de Trabalho Orientada por Estados

**Tipo:** Sprint de Estabilização Operacional  
**Prioridade:** P0  
**Data:** 13/07/2026  
**Escopo:** Frontend exclusivamente — experiência do operador  
**Fora de escopo:** regras de negócio, APIs, banco, Recovery, Crédito Comercial, Ledger, Financeiro

---

## Objetivo

Transformar a Central de Trabalho Comercial em uma **fila operacional** orientada por estados.

A Central deve sempre indicar **a próxima ação correta**.  
Nunca apresentar duas ações concorrentes para o mesmo atendimento.

---

## Regra oficial

> Um cliente só pode existir em **um** estado operacional por vez.  
> Nunca pode aparecer simultaneamente em **Trabalho Prioritário** e **Consignados Pendentes**.

Violação = inconsistência operacional (bloqueada pela auditoria automática).

---

## Máquina de estados (E1–E6)

| Estado | Condição | Bloco | Botão |
|--------|----------|-------|-------|
| **E1** | Sem pendências | — | — |
| **E2** | Entrega em andamento (`RASCUNHO` / `VALIDADA`) | Trabalho Prioritário | Continuar Entrega |
| **E3** | Entregue, fechamento não iniciado (`ENTREGUE`) | Trabalho Prioritário | Fechar Atendimento |
| **E4** | Prestação em andamento (`EM_PRESTACAO` / prestação `ABERTA`) | Trabalho Prioritário | Continuar Atendimento |
| **E5** | Prestação encerrada + saldo > 0 (`ACERTADA`/`ENCERRADA`) | Consignados Pendentes | Receber |
| **E6** | Prestação encerrada + saldo = 0 | — (some da Central) | — |

### Status UX de prestação

| `prestacaoStatus` | Uso na UI |
|-------------------|-----------|
| `EM_ANDAMENTO` | Continuar Atendimento |
| `PRONTO_PARA_FECHAR` | Fechar Atendimento |
| `ENCERRADA` | Elegível a Consignados Pendentes (se saldo > 0) |

### Precedência (um cliente, várias consignações)

`E2` → `E4` → `E3` → `E5` → `E6`/`E1`

### Ordem da fila (Trabalho Prioritário)

`E2` → `E3` → `E4`

---

## Hierarquia da tela

1. Saudação  
2. KPIs (resumo do dia)  
3. **Minha Fila de Trabalho**  
   - Trabalho Prioritário  
   - Consignados Pendentes *(só se houver E5)*  
4. Próximas Entregas  
5. Ações Rápidas *(atalhos gerais)*  
6. Atendimentos para Fechar  
7. Últimas Operações  

---

## Alterações realizadas

### Mappers (`centralTrabalhoMappers.js`)

- `resolveEstadoOperacionalCliente` — classifica E1–E6  
- `buildFilaOperacional` — monta prioridade e pendentes com exclusividade  
- `buildConsignadosPendentes` — **só E5** (`ENCERRADA` + `saldoDevedor > 0`)  
- Labels E3/E4 corretos (Fechar vs Continuar)  
- `buildAcoesRapidas` — atalhos gerais; **sem** Fechar Atendimento  
- `auditarCentralEstados` — auditoria automática anexada ao view-model  

### View (`CentralTrabalhoView.js`)

- Seção **Minha Fila de Trabalho**  
- Consignados Pendentes **não renderizados** quando vazios  
- “Próximas Prestações” → **Atendimentos para Fechar**  
- Ações Rápidas: Nova Entrega, Novo Cliente, Consultar Clientes, Relatórios  

### Dashboard (`index.js`)

- Atalhos das Ações Rápidas  
- Após **Receber**: reload da fila (cliente some se saldo zero)  

---

## Auditoria automática

Critérios validados em `auditarCentralEstados` / testes:

- [x] Cliente em apenas um bloco  
- [x] Receber só após encerramento oficial (E5)  
- [x] Continuar Atendimento substitui Fechar em E4  
- [x] Trabalho Prioritário nunca concorre com Consignados Pendentes  
- [x] Cliente quitado (E6) desaparece  
- [x] Nenhuma regra comercial / API / tabela alterada  

**Testes:** `npm run test:motor-comercial-frontend -- --testPathPatterns=centralTrabalhoMappers` — 25 passing.

---

## Arquivos tocados

| Arquivo | Mudança |
|---------|---------|
| `pages/Dashboard/centralTrabalhoMappers.js` | Máquina de estados + auditoria |
| `pages/Dashboard/CentralTrabalhoView.js` | Hierarquia e nomenclatura |
| `pages/Dashboard/index.js` | Atalhos / refresh pós-Receber |
| `pages/Dashboard/styles.css` | Fila + slots ativos |
| `tests/pages/centralTrabalhoMappers.test.js` | Cobertura UX-10 |

---

## Princípio final

O operador **não decide** qual botão clicar.  
A Central **indica** a próxima ação conforme o estado operacional da consignação.
