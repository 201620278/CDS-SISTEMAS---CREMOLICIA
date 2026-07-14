# Homologação das Bridges — Sprint O-13

**Versão:** O-13-homologacao  
**Objetivo:** Integração real do Motor Comercial com a Plataforma CDS (sem mocks no fluxo principal)

---

## 1. Resumo

A Sprint O-13 substitui implementações mockadas por **gateways de plataforma** que consomem serviços e tabelas oficiais do CDS:

| Bridge | Gateway | Origem CDS |
|--------|---------|------------|
| Cliente | `ClientePlatformGateway` | `clientes`, `contas_receber` |
| Produto | `ProdutoPlatformGateway` | `produtos` |
| Estoque | `EstoquePlatformGateway` | `ajusteEstoqueService`, `lotesService` |
| Financeiro | `FinanceiroPlatformGateway` | `financeiro`, `consignacoes` |
| Usuário | `UsuarioPlatformGateway` | `usuarios`, `usuario_permissoes`, `auth` |

**Adapters** (`I*Bridge`) conectam Use Cases existentes aos gateways — **sem alteração de domínio**.

---

## 2. Arquitetura

```
Use Case (IClienteBridge.buscarPorId)
        ↓
ClienteBridgeAdapter
        ↓
ClientePlatformGateway (+ BridgeDiagnosticService)
        ↓
SQLite CDS (clientes, contas_receber)
```

### Caminhos

| Componente | Caminho |
|------------|---------|
| Platform gateways | `backend/motores/motor-comercial/bridges/platform/` |
| Adapters (contratos) | `backend/motores/motor-comercial/bridges/adapters/` |
| Diagnóstico | `backend/motores/motor-comercial/bridges/diagnostic/` |
| Wiring DI | `backend/motores/motor-comercial/infrastructure/di/bootstrapUseCases.js` |
| Bridges legados (API Result) | `backend/motores/motor-comercial/bridges/*Bridge.js` |

---

## 3. Mapeamento método → plataforma

### ClienteBridge

| Método adapter | Plataforma |
|----------------|------------|
| `buscarPorId` | `SELECT * FROM clientes WHERE id = ?` |
| `estaAtivo` | Cliente existe + sem parcelas vencidas em `contas_receber` |
| `consultarSituacao` | Cadastro + recebíveis |
| `consultarBloqueios` | Parcelas vencidas |

### ProdutoBridge

| Método | Plataforma |
|--------|------------|
| `buscarPorId` | `SELECT * FROM produtos WHERE id = ?` |
| `estaAtivo` | `produtos.ativo = 1` |
| `consultarPreco` | `preco_venda`, `preco_custo` |
| `consultarEstoqueDisponivel` | `estoque_atual`, saldos fiscal/não fiscal |

### EstoqueBridge

| Método | Plataforma |
|--------|------------|
| `registrarSaidaConsignacao` | `aplicarAjusteEstoqueProduto` (ajuste negativo) |
| `registrarEntradaConsignacao` | `aplicarAjusteEstoqueProduto` (ajuste positivo) |
| `registrarTransferencia` | Audit only (sem mov. físico — estoque já baixado na entrega) |

### FinanceiroBridge

| Método | Plataforma |
|--------|------------|
| `registrarReceitaConsignacao` | `INSERT INTO financeiro` (receita) |
| `registrarRecebimento` | `INSERT INTO financeiro` (pagamento prestação) |
| `registrarPerda` | `INSERT INTO financeiro` (despesa) |

### UsuarioBridge

| Método | Plataforma |
|--------|------------|
| `buscarPorId` | `SELECT * FROM usuarios WHERE id = ?` |
| `possuiPermissao` | `buscarPermissoesUsuario` (middleware auth) |
| `validarAutorizacaoGerencial` | Perfil SUPERVISOR/ADMIN |

---

## 4. Fluxo de homologação Cremolia

```
Cadastro cliente/produto (CDS)
        ↓
Perfil Comercial → ClienteBridge.buscarPorId + estaAtivo
        ↓
Nova Consignação → ClienteBridge
        ↓
Adicionar Item → ProdutoBridge.buscarPorId + estaAtivo
        ↓
Entrega → EstoqueBridge.registrarSaidaConsignacao
        ↓
Prestação → (domínio interno)
        ↓
Venda → FinanceiroBridge.registrarReceitaConsignacao
        ↓
Pagamento → FinanceiroBridge.registrarRecebimento
        ↓
Conta Corrente → Projection (ledger — sem bridge)
        ↓
Encerramento → Financeiro + Estoque (devoluções se houver)
```

---

## 5. Modo diagnóstico

### Endpoints

| Endpoint | Descrição |
|----------|-----------|
| `GET /api/v1/comercial/bridges/status` | Status de conexão (mock: false) |
| `GET /api/v1/comercial/bridges/diagnostic?limit=50` | Telemetria auditável |

### Campos registrados

- **Bridge** — Cliente, Produto, Estoque, Financeiro, Usuario
- **Status** — OK | ERROR
- **Tempo** — durationMs
- **Erro** — mensagem quando ERROR
- **Fallback** — false (sem mock no fluxo principal)
- **CorrelationId** — preservado da requisição HTTP

### Exemplo de resposta

```json
{
  "success": true,
  "data": {
    "modo": "diagnostico",
    "integracao": "platform-cds-real",
    "resumo": {
      "total": 12,
      "ok": 11,
      "error": 1,
      "fallback": 0,
      "bridges": {
        "Cliente": { "ok": 5, "error": 0, "avgMs": 3 }
      }
    },
    "entradas": []
  }
}
```

---

## 6. Testes

```bash
npm run test:motor-comercial-bridges   # 5 testes adapters + diagnóstico
npm run test:motor-comercial           # Suite completa (80 testes)
```

---

## 7. Critérios de aceitação O-13

| Critério | Status |
|----------|--------|
| Nenhum mock no fluxo principal | ✅ Adapters usam platform gateways |
| Todos os bridges reais | ✅ 5/5 integrados |
| Use Cases inalterados | ✅ Apenas wiring DI |
| CorrelationId preservado | ✅ Diagnostic + HTTP middleware |
| Logs auditáveis | ✅ BridgeDiagnosticService |
| Documentação | ✅ Este documento |

---

## 8. Limitações conhecidas

1. **Transferência entre consignações** — não altera estoque físico (correto pelo modelo).
2. **Estorno financeiro** — requer operação manual na plataforma CDS.
3. **Reserva de estoque** — não suportada pela plataforma atual.
4. **Motores HTTP separados** — integração in-process (mesmo Node/SQLite); HTTP externo futuro via motores dedicados.

---

## 9. Próximos passos

- Testes E2E com banco SQLite real da Cremolia
- Extração de `inserirMovimentacao` para serviço compartilhado
- Integração HTTP quando motores Cliente/Produto forem modularizados

---

*Sprint O-13 — Integração Real das Bridges e Homologação da Cremolia*
