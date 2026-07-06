# Central Inteligente de Entradas

**Módulo:** Caixa de Entrada Fiscal (Inbox) do CDS Sistemas — **única porta oficial** de documentos fiscais (RC1)  
**Sprint 9:** Polimento Enterprise — skeleton loading, empty states, gauge de score, timeline, KPIs com tendência, painel executivo (somente frontend)  
**Sprint 8:** Automação — sync em background, configurações, eventos, notificações e log  
**Sprint 7:** Inteligência operacional — alertas, score, pendências, dashboard operacional

## Pipeline oficial (RC1)

```
SEFAZ (DF-e)
    ↓
Central Inteligente de Entradas  (/api/central-entradas/sincronizar | buscar-chave)
    ↓
NFeParserService (Parser Oficial)
    ↓
MIIP RC1 (enriquecerParseComMiip)
    ↓
Central de Revisão (MiipCentralRevisao)
    ↓
Compras (abrir-compra → saveCompra)
    ↓
ERP
```

**Rotas legadas descontinuadas (HTTP 410):** `/api/dfe/*`, `POST /api/compras/parse-xml`.  
Compras não recebe mais upload XML nem sync DF-e direto — use o menu **Central Inteligente de Entradas**.

## Responsabilidade

A Central **não** cria compras, **não** atualiza estoque/financeiro, **não** identifica produtos e **não** possui parser próprio.

Ela apenas: sincroniza, armazena, organiza, monitora e disponibiliza documentos.

## Estrutura

```
motores/central-entradas/
├── CentralEntradasService.js   # Facade
├── config/
├── contracts/
├── core/
├── repositories/
├── services/
└── utils/
```

## API (Sprint 8)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/central-entradas/config` | Configurações da automação |
| PATCH | `/api/central-entradas/config` | Atualizar configurações (reinicia sync background) |
| GET | `/api/central-entradas/servico/status` | Status do serviço de sync |
| GET | `/api/central-entradas/eventos` | Log operacional (filtros: tipo, origem, busca, datas) |
| GET | `/api/central-entradas/notificacoes` | Notificações internas |
| PATCH | `/api/central-entradas/notificacoes/:id/lida` | Marcar notificação como lida |
| PATCH | `/api/central-entradas/notificacoes/marcar-todas-lidas` | Marcar todas como lidas |
| POST | `/api/central-entradas/sincronizar-ao-abrir` | Sync ao abrir a Central (se habilitado) |

`GET /health` estendido: `servicoAtivo`, `ultimaSincronizacao`, `ultimoErro`, `tempoMedioSyncMs`, `proximaExecucao`.

## API (Sprint 7)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/central-entradas/alertas` | Alertas inteligentes (tipo, gravidade, ação sugerida) |
| GET | `/api/central-entradas/pendencias` | Central de pendências operacionais |
| GET | `/api/central-entradas/operacional` | Indicadores operacionais (valor mês, tempos, taxas) |
| GET | `/api/central-entradas/atencao` | Painel "O que requer sua atenção" |
| GET | `/api/central-entradas/:id/score` | Score geral do documento |
| GET | `/api/central-entradas/fornecedor/:cnpj/estatisticas` | Estatísticas do fornecedor |

Filtro rápido na listagem: `filtro_rapido` = `hoje`, `ontem`, `ultimos_7_dias`, `ultimos_30_dias`, `este_mes`, `pendentes`, `prontas`.

### Score geral (documento)

Cálculo isolado em `CentralScoreDocumentoService` — média ponderada:

| Fator | Peso | Fonte |
|-------|------|-------|
| Precisão MIIP | 40% | `calcularPrecisaoImportacao(resumo)` |
| Pendências | 25% | % itens sem confirmação/cadastro |
| Status | 20% | Mapa por estado do documento |
| Erros | 10% | Status ERRO / detalhe de falha |
| Tempo | 5% | Aging em revisão/sync/compra |

## API (Sprint 6)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/central-entradas/:id/parse` | Parse persistido + resumo MIIP (somente leitura) |

O dashboard (`GET /dashboard`) passou a incluir `indicadores`: `totalDocumentos`, `valorTotalDia`, `documentosHoje`.

## API (Sprint 5)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/central-entradas/:id/processar` | Pipeline Parser + MIIP |
| POST | `/api/central-entradas/:id/revisar/concluir` | Conclui Central de Revisão MIIP |
| GET | `/api/central-entradas/:id/payload-compra` | Payload parse-xml para Compras |
| POST | `/api/central-entradas/:id/abrir-compra` | Marca EM_COMPRA + retorna payload |

`POST /api/compras` aceita `central_documento_id` para vincular documento como GRAVADA após saveCompra().

## API (Sprint 4)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/central-entradas/sincronizar` | Sincroniza Distribuição DF-e (SEFAZ → Central) |
| GET | `/api/central-entradas/buscar-chave?chave=` | Consulta NF-e por chave na SEFAZ |
| GET | `/api/central-entradas/:id/xml` | XML bruto armazenado |

## API (Sprint 2)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/central-entradas/health` | Health check do módulo |
| GET | `/api/central-entradas/metadados` | Metadados e estados |
| GET | `/api/central-entradas/dashboard` | KPIs (contadores por status) |
| GET | `/api/central-entradas` | Lista documentos (paginação, filtros, busca, ordenação) |
| GET | `/api/central-entradas/:id` | Detalhe + histórico |
| GET | `/api/central-entradas/:id/historico` | Histórico de transições |
| PATCH | `/api/central-entradas/:id/status` | Altera status (máquina de estados) |

### Query params da listagem

- `busca`, `status`, `origem`, `cnpj_fornecedor`
- `data_emissao_inicio`, `data_emissao_fim`
- `pagina`, `limite`, `offset`
- `ordenar_por` (`created_at`, `data_emissao`, `valor_total`, `fornecedor`, `status`, `numero`)
- `ordenar_direcao` (`asc`, `desc`)

### Testes

```bash
npm run test:central-entradas
npm run test:central-entradas-sprint7
npm run test:dfe-retorno-parser
npm run seed:central-entradas   # dados demo opcionais
```

## Tabelas

- `central_entradas_documentos`
- `central_entradas_historico`
- `central_entradas_nsu` — `ult_nsu`, `max_nsu`, `data_sincronizacao` (incremental, nunca reinicia do zero)

### Tabelas legadas (@deprecated — não remover até migração)

- `notas_recebidas` — schema antigo pré-Central
- `notas_recebidas_dfe` — schema antigo pré-Central; substituído por `central_entradas_documentos`
