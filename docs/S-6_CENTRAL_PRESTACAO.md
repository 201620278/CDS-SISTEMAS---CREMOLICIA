# Sprint S-6 — Central de Prestação de Contas Enterprise (Fase 1)

**Data:** 2026-07-09  
**Status:** Implementado (Fase 1)

---

## Objetivo

Consolidar o fechamento de consignações na **Central de Prestação de Contas** e refinar a **Nova Consignação** com identificador oficial automático.

**Diretriz:** não alterar regras de negócio — apenas UX, geração de documento e consolidação visual.

---

## Parte 1 — Nova Consignação

### Documento oficial (automático)

| Aspecto | Implementação |
|---------|---------------|
| Formato | `CONS-AAAA-000001` |
| Geração | Backend em `CriarConsignacaoUseCase` via `DocumentoConsignacaoSequenciador` |
| Preview | `GET /api/comercial/consignacoes/proximo-documento` |
| Imutabilidade | `EditarConsignacaoUseCase` não permite alterar `documento` |

**Arquivos:**
- `backend/motores/motor-comercial/services/DocumentoConsignacaoSequenciador.js`
- `backend/motores/motor-comercial/repositories/ConsignacaoRepository.js` — `obterMaxSequencialDocumento`, `obterProximoSequencialDocumento`
- `backend/motores/motor-comercial/migrations/009_consignacao_documento_externo.js`

### Documento Externo (opcional)

Campo `documento_externo` / `documentoExterno` para referências do cliente (pedido, OC, protocolo).

### Empresa e Filial

`frontend/modules/motor-comercial/config/comercialOrganizacao.js` — quando há apenas uma opção, preenche e bloqueia edição.

### Cliente 360°

Já entregue na S-5.1 — cliente pré-preenchido, bloqueado, com "Trocar Cliente" mediante confirmação.

---

## Parte 2 — Central de Prestação de Contas

Tela `PrestacaoContas` renomeada visualmente para **Central de Prestação de Contas**, reunindo em fluxo único:

- Dados da consignação (nº oficial + doc. externo)
- Resumo financeiro em tempo real (8 indicadores)
- Itens com ações (venda, devolução, perda, cortesia)
- Timeline / histórico
- Conta corrente (projection API)
- Ledger de movimentações
- Auditoria operacional
- Checklist de fechamento

### Fluxo guiado

Stepper de fases (`prestacaoCentralMappers.js`):

1. Conferir Produtos → 2. Devoluções → 3. Perdas → 4. Cortesias → 5. Resultado → 6. Conta Corrente → 7. Ledger → 8. Finalizar

Fase avança automaticamente conforme movimentações (`_updatePhaseFromData`).

### Atualização automática

- Recarrega dados após cada operação (`_loadData`)
- Timer de refresh a cada 45s (`_startAutoRefresh`) enquanto a tela estiver aberta
- Integração com projeções: resumo, timeline, movimentações, conta corrente

---

## Critérios de aceite

| Critério | Status |
|----------|--------|
| Documento gerado automaticamente | ✓ |
| Formato CONS-AAAA-000001 | ✓ |
| Documento Externo opcional | ✓ |
| Empresa/Filial auto quando únicas | ✓ |
| Cliente do Cliente 360° | ✓ (S-5.1) |
| Central de Prestação implementada | ✓ |
| Conta Corrente integrada | ✓ |
| Ledger integrado | ✓ |
| Fluxo em tela única | ✓ |
| Atualização automática Cliente 360° | Parcial — via projections; refresh ao retornar ao 360° |

---

## Testes

```bash
node tests/motor-comercial/documento-consignacao-sequenciador.test.js
npm run test:motor-comercial-frontend   # 108 testes
npm run build:motor-comercial
```

---

## Homologação manual sugerida

1. Reiniciar `npm start` (migration 009 + novas rotas)
2. Nova Consignação → ver preview `CONS-2026-00000N` → salvar → confirmar número gerado
3. Entregar consignação → abrir Central de Prestação
4. Registrar devolução/perda/cortesia/venda → ver resumo financeiro atualizar
5. Registrar pagamento → fechar prestação → verificar ledger e auditoria
