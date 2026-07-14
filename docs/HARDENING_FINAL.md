# Hardening Final do Motor Comercial — Sprint H-2

**Versão:** H-2  
**Tipo:** Estabilização / Correção  
**Data:** 2026-07-08  
**Objetivo:** Eliminar pendências da Homologação H-1 sem evolução arquitetural

---

## Resumo

A Sprint H-2 concluiu o acabamento da versão 1.0 do Motor Comercial para a Cremolia, corrigindo os itens D-01, D-02, D-04, D-05, D-06 e D-07 identificados em `docs/HOMOLOGACAO_CREMOLIA.md`.

Nenhuma alteração foi feita em: Ledger, Outbox, Resilience, Projection Services, APIs públicas, banco de dados ou regras comerciais de domínio.

**Parecer:** Motor Comercial v1.0 estabilizado para operação Cremolia.

---

## Itens Resolvidos

| Item | Descrição | Status |
|------|-----------|--------|
| D-01 | Jest + jsdom + script `test:motor-comercial-frontend` | **RESOLVIDO** |
| D-02 | Rotas órfãs com telas implementadas | **RESOLVIDO** |
| D-04 | RBAC via permissões CDS (`autorizacao.js`) | **RESOLVIDO** |
| D-05 | Atalhos globais da Prestação com seleção de item | **RESOLVIDO** |
| D-06 | Exportações Excel `.xlsx` e PDF via `jspdf` | **RESOLVIDO** |
| D-07 | UI Criar / Editar / Desbloquear Perfil Comercial | **RESOLVIDO** |

> **D-03** (persistência backend de Workflow) permanece no roadmap futuro — fora do escopo H-2 conforme briefing.

---

## Arquivos Alterados

### Infraestrutura / Testes (D-01)

| Arquivo | Alteração |
|---------|-----------|
| `package.json` | Dependências `jest`, `jest-environment-jsdom`, `xlsx`, `jspdf`, `jspdf-autotable`; script `test:motor-comercial-frontend` |
| `frontend/modules/motor-comercial/jest.config.js` | Configuração oficial Jest |
| `frontend/modules/motor-comercial/tests/setup.js` | Setup jsdom, TextEncoder, mock usuário admin |
| `frontend/modules/motor-comercial/tests/test-helpers.js` | Helpers de formatação para testes |
| `frontend/modules/motor-comercial/tests/utils/autorizacao.test.js` | Testes RBAC |
| `frontend/modules/motor-comercial/tests/pages/*.test.js` | Testes alinhados à implementação atual |

### Rotas órfãs (D-02)

| Arquivo | Alteração |
|---------|-----------|
| `frontend/modules/motor-comercial/pages/DetalhesConsignacao/index.js` | Cockpit operacional via `CockpitDrawer` |
| `frontend/modules/motor-comercial/pages/HistoricoPrestacao/index.js` | Timeline + movimentações ledger |
| `frontend/modules/motor-comercial/pages/Configuracoes/index.js` | Visão read-only de permissões e versão |
| `frontend/modules/motor-comercial/pages/Auditoria/index.js` | Extrato de movimentações comerciais |
| `frontend/modules/motor-comercial/bootstrap/index.js` | Registro dos 4 componentes no router |

### RBAC (D-04)

| Arquivo | Alteração |
|---------|-----------|
| `frontend/modules/motor-comercial/utils/autorizacao.js` | **Novo** — espelha `UsuarioPlatformGateway` |
| `frontend/modules/motor-comercial/utils/operacional.js` | `isOperadorAutorizado` delegado ao RBAC |

### Prestação (D-05)

| Arquivo | Alteração |
|---------|-----------|
| `frontend/modules/motor-comercial/pages/PrestacaoContas/index.js` | `_resolveGlobalItemIndex`, seleção por diálogo |

### Exportações (D-06)

| Arquivo | Alteração |
|---------|-----------|
| `frontend/modules/motor-comercial/utils/exportacao.js` | **Novo** — `exportToXlsx`, `exportToPdf` |
| `frontend/modules/motor-comercial/pages/Relatorios/index.js` | PDF/Excel profissionais |
| `frontend/modules/motor-comercial/pages/Dashboard/index.js` | PDF/Excel profissionais |
| `frontend/modules/motor-comercial/pages/ContaCorrente/index.js` | PDF/Excel profissionais |
| `frontend/modules/motor-comercial/pages/WorkflowCenter/workflowMappers.js` | Excel `.xlsx` no workflow |

### Perfil Comercial (D-07)

| Arquivo | Alteração |
|---------|-----------|
| `frontend/modules/motor-comercial/pages/PerfilComercial/index.js` | Criar, editar, desbloquear perfil |
| `frontend/modules/motor-comercial/api/MotorComercialApi.js` | Correção `alterarLimite` → campo `novoLimite` |

---

## Validação

| Verificação | Resultado |
|-------------|-----------|
| `npm run test:motor-comercial` | **103/103 OK** |
| `npm run test:motor-comercial-frontend` | **72/72 OK** (14 suites) |
| `npm run build:motor-comercial` | **OK** (bundle 4.3mb) |
| Alteração arquitetural | **Nenhuma** |
| Novas APIs / tabelas | **Nenhuma** |

---

## Testes

### Backend
```
Perfil .............. 18 OK
Consignação F1 ...... 16 OK
Consignação F2 ...... 10 OK
Consignação F3 ...... 16 OK
Projection .......... 12 OK
Ledger P-1 .......... 10 OK
Workflow ............  3 OK
Bridges .............  5 OK
Outbox P-2 ..........  5 OK
Resilience P-3 ......  8 OK
─────────────────────────
TOTAL ............... 103 OK
```

### Frontend (Jest)
```
Suites: 14 passed
Tests:  72 passed
Inclui: autorizacao RBAC, Dashboard, Consignações, Entrega,
        Nova Consignação, Perfil, Prestação, Pendências,
        Workflow, Playbooks, Recomendações, Button, Validation, useLoading
```

---

## Resultado

O Motor Comercial encontra-se **estabilizado para a versão 1.0** da Cremolia:

- Suíte de testes frontend **oficial e executável**
- **Nenhuma rota órfã** no router
- **RBAC** alinhado às permissões `COMERCIAL_*` da plataforma CDS
- **Prestação** com atalhos globais corrigidos
- **Exportações** profissionais (`.xlsx` / `.pdf`)
- **Perfil Comercial** com CRUD operacional via APIs existentes

> **O Motor Comercial está operacionalmente pronto para uso na Cremolia** — versão 1.0 homologada e endurecida.

---

*Referência: `docs/HOMOLOGACAO_CREMOLIA.md`, `docs/RECERTIFICACAO_ENTERPRISE.md`*
