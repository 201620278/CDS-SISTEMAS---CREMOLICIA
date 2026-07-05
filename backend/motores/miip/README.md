# MIIP — Motor Inteligente de Identificação de Produtos

**Sprint 1.1:** Refinamento arquitetural (evidências, candidatos, cache, metrics, events).

Documentação completa: [`docs/ARQUITETURA_MIIP.md`](../../../docs/ARQUITETURA_MIIP.md)

## Estrutura

```
miip/
├── index.js
├── MiipService.js
├── MiipOrchestrator.js
├── core/                    # Contratos, MiipEvidence, MiipCandidate
├── contracts/               # DTOs de entrada/saída
├── engines/                 # Subpastas por domínio (gtin, fornecedor, …)
├── repositories/            # IRepository + persistência SQLite
├── cache/                   # Cache local (reservado)
├── metrics/                 # Métricas operacionais (reservado)
├── events/                  # Eventos de domínio (reservado)
├── utils/
├── config/
├── logs/
└── tests/
```

## Status

| Sprint | Escopo |
|--------|--------|
| 0 | Arquitetura documentada |
| 1 | Estrutura física |
| 1.1 | MiipEvidence, MiipCandidate, IRepository, MotorRegistry, pastas infra |
| 2+ | Implementação de regras, engines nas subpastas, integração |
