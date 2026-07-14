# P0-03 — Auditoria do Cálculo de Crédito Comercial

**Data:** 2026-07-12  
**Escopo:** Central de Operações do Cliente (frontend)  
**Backend / banco / APIs:** sem alteração

---

## Sintoma reportado

| Campo | Valor exibido |
|-------|---------------|
| Limite Comercial | R$ 100,00 |
| Crédito Utilizado | R$ 0,00 |
| Consignações em Aberto | 0 |
| **Crédito Disponível** | **R$ 0,00** (incorreto) |
| Alerta | **Limite Comercial Excedido** (incorreto) |

---

## Causa raiz

O mapper da Central de Operações **não aplicava a regra oficial** `Disponível = Limite − Utilizado`.

Em vez disso, lia campos que a projeção `SituacaoCliente` **não entrega**:

| Campo esperado pelo mapper | Campo real da projeção |
|----------------------------|-------------------------|
| `situacao.limiteDisponivel` | **não existe** |
| `situacao.limiteUtilizado` | **não existe** (usa `situacao.saldo`) |
| `situacao.limite` | existe ✓ |
| `perfil.limiteComercial` | existe ✓ |

Fluxo do bug:

1. `buildResumoComercial` fazia  
   `saldoDisponivel = Number(situacao.limiteDisponivel ?? score.limiteDisponivel ?? 0)`  
   → caía no default **`0`**.
2. `metricasLimite` aceitava esse `0` como disponível “oficial”.
3. `limiteExcedido` avaliava `limite > 0 && disponivel <= 0`  
   → com Limite R$ 100 e Disponível R$ 0, disparava o alerta **mesmo com Utilizado = 0**.

Não havia inversão de sinal no backend. A divergência estava no **frontend mapper**, que sobrescrevia o disponível com um default zerado de projeção incompleta.

---

## Regra oficial adotada

```
Crédito Disponível = Limite Comercial − Crédito Utilizado
```

### Origens

| Métrica | Fonte (ordem) |
|---------|----------------|
| Limite Comercial | `perfil.limiteComercial` → `situacao.limite` → `resumo.limiteComercial` |
| Crédito Utilizado | `situacao.limiteUtilizado` → `situacao.saldoConsumido` → **`situacao.saldo`** → `resumo.saldoUtilizado` → `perfil.saldoAberto` |
| Crédito Disponível | **sempre** `limite − utilizado` (pode ser negativo se acima do limite) |

### Alerta “Limite Comercial Excedido”

Somente quando:

- `Limite > 0` **e**
- (`Utilizado >= Limite` **ou** `Disponível <= 0`)

com `Disponível` derivado da fórmula oficial.

Cliente com **Utilizado = 0** **nunca** recebe esse alerta.

---

## Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `frontend/modules/motor-comercial/pages/PerfilComercial/centralOperacoesMappers.js` | `metricasLimite` / `limiteExcedido` pela regra oficial; usa `situacao.saldo` |
| `frontend/modules/motor-comercial/pages/PerfilComercial/cliente360Mappers.js` | `buildResumoComercial` deriva `saldoDisponivel` |
| `frontend/modules/motor-comercial/tests/pages/centralOperacoesMappers.test.js` | Cenários P0-03 |
| `frontend/modules/motor-comercial/motor-comercial.bundle.js` | Regenerado |

**Não alterados:** backend, APIs, banco, usecases de consignação (já usam `limite − saldoAberto`).

---

## Cenários testados

| Caso | Limite | Utilizado | Disponível | Alerta |
|------|--------|-----------|------------|--------|
| Sem consignações / sem uso | 100 | 0 | **100** | Não |
| Projeção com `limiteDisponivel: 0` falso | 100 | 0 | **100** | Não |
| Uso parcial | 100 | 30 | **70** | Não |
| No limite | 100 | 100 | **0** | Sim |
| Acima do limite | 100 | 130 | **-30** | Sim |

---

## Conclusão

- Causa: mapper confiava em `limiteDisponivel` ausente (default 0) e disparava alerta por `disponivel <= 0`.
- Correção: cálculo local obrigatório `Limite − Utilizado`; alerta só com consumo real ≥ limite.
- Backend alinhado à regra; ajuste exclusivo de frontend.
