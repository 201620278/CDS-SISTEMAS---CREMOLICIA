# Arquitetura UX — Motor Comercial

**Plataforma:** CDS Sistemas  
**Atualizado em:** 13/07/2026 (UX-10)

---

## Visão

A experiência do Motor Comercial é organizada em torno de **jornadas operacionais**, não de telas técnicas.

A home do módulo é a **Central de Trabalho Comercial**: uma **fila operacional** que aponta a próxima ação do operador.

---

## Central de Trabalho — Máquina de Estados Operacional

A partir da sprint **UX-10**, a Central segue oficialmente uma **máquina de estados operacional**.

### Princípios

1. **Um cliente = um estado = uma ação primária**
2. Nunca concorrer Trabalho Prioritário × Consignados Pendentes
3. Nomenclatura pelo **próximo passo**, não pelo conceito técnico (prestação/ledger)
4. Sem alteração de regras de negócio, APIs ou persistência — apenas orquestração de UI

### Estados (E1–E6)

```
E1 Sem pendências ───────────────────────────── (nada na fila)
E2 Entrega em andamento ── Continuar Entrega ── Trabalho Prioritário
E3 Pronto para fechar ──── Fechar Atendimento ─ Trabalho Prioritário
E4 Atendimento em curso ── Continuar Atendimento ─ Trabalho Prioritário
E5 Encerrado c/ saldo ──── Receber ──────────── Consignados Pendentes
E6 Encerrado quitado ────────────────────────── (some da Central)
```

### Precedência

Quando o cliente tem várias consignações:

```
E2 > E4 > E3 > E5 > E6/E1
```

### Implementação

| Camada | Arquivo | Papel |
|--------|---------|-------|
| Classificação | `centralTrabalhoMappers.js` | `resolveEstadoOperacionalCliente`, `buildFilaOperacional` |
| Apresentação | `CentralTrabalhoView.js` | Fila, exclusividade de blocos, labels |
| Orquestração | `Dashboard/index.js` | Navegação e Recebimento Rápido |
| Auditoria | `auditarCentralEstados` | Garante exclusividade no view-model |

### Vocabulário oficial (UI)

| Conceito interno | Termo na interface |
|------------------|-------------------|
| Home | Central de Trabalho |
| Prestação aberta | Atendimento / Fechamento em andamento |
| Iniciar fechamento | Fechar Atendimento |
| Retomar fechamento | Continuar Atendimento |
| Cobrança pós-ciclo | Receber / Consignados Pendentes |
| Lista de fechamentos | Atendimentos para Fechar |

---

## Jornada canônica

```
Preparar Entrega
      → Continuar Entrega          (E2)
      → Fechar Atendimento         (E3)
      → Continuar Atendimento      (E4 — conferência / pagamento parcial)
      → Encerrar (no wizard)
      → Receber                    (E5 — se houver saldo)
      → (some da Central)          (E6)
```

---

## Relação com outras sprints UX

| Sprint | Contribuição |
|--------|----------------|
| UX-03 | Central como home |
| UX-05.5 | Vocabulário operacional |
| UX-09 | Recebimento rápido / Consignados Pendentes |
| **UX-10** | **Máquina de estados + exclusividade de fila** |

---

## Referências

- `UX_10_CENTRAL_ORIENTADA_POR_ESTADOS.md`
- `AUDITORIA_UX_OPERACIONAL_CENTRAL_TRABALHO.md`
- `frontend/modules/motor-comercial/UX_RECERTIFICACAO.md`
