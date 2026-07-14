# ADR — Architecture Decision Record

## O que é um ADR
Um ADR registra uma decisão arquitetural relevante, seu contexto, alternativas consideradas e as consequências esperadas.

## Quando utilizar
Use ADR sempre que uma decisão impactar arquitetura, integração, padrão de implementação, governança ou evolução da plataforma.

## Fluxo de aprovação
1. Uma mudança relevante nasce como RFC.
2. A RFC é discutida e aprovada.
3. O ADR é criado a partir da decisão final.
4. O ADR pode ser revisado, substituído ou depreciado.

## Índice

### Arquitetura técnica
- [ADR-001](ADR-001.md) … [ADR-010](ADR-010.md) — decisões de plataforma (motores, UoW, etc.)

### Arquitetura de experiência (UX)
- [ADR-UX-001 — Filosofia Oficial de UX da Plataforma CDS](ADR-UX-001.md)  
  Constituição de experiência do usuário. **Obrigatória** para todas as telas e motores.

### Design System Operacional
- [DS-001 — Design System Operacional](../DS-001.md)  
  Catálogo e contratos de componentes reutilizáveis (sem branding). Implementa o ADR-UX-001.

### Infraestrutura Shared UI
- [UX-FOUNDATION-001](../UX_FOUNDATION_001.md) · código `frontend/shared/ui/`  
  Política anti-duplicação, mapa de APIs, ordem de implementação e migração do Motor Comercial.
