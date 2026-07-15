# Arquivo de auditorias históricas — Motor Comercial RC1

Documentação de sprint / forense / relatórios temporários **preservada e unificada** após a limpeza controlada do RC1.

Os arquivos soltos foram consolidados em **um compilado por área**. O conteúdo integral permanece (sumário + seções por fonte original). Histórico reversível via git.

**Não pertence a este archive:** ADRs (`ADR-*.md`), roadmaps, changelogs, DS-001, arquitetura permanente (`FIN_01_*`, etc.), auditorias runtime de MIIP/bootstrap/migração.

---

## Compilados

| Pasta | Arquivo |
|-------|---------|
| [comercial/](comercial/) | [COMPILADO_COMERCIAL.md](comercial/COMPILADO_COMERCIAL.md) |
| [fiscal/](fiscal/) | [COMPILADO_FISCAL.md](fiscal/COMPILADO_FISCAL.md) |
| [compras/](compras/) | Reservada (vazia no RC1) |
| [ux/](ux/) | [COMPILADO_UX.md](ux/COMPILADO_UX.md) |
| [sprint/](sprint/) | [COMPILADO_SPRINT.md](sprint/COMPILADO_SPRINT.md) |

---

## Conteúdo por área

### Motor Comercial / STAB-04 / STAB-06 / STAB-06.6 / STAB-07.1

→ [comercial/COMPILADO_COMERCIAL.md](comercial/COMPILADO_COMERCIAL.md)  
→ [comercial/AUDITORIA_STAB07_1.md](comercial/AUDITORIA_STAB07_1.md) (fase 1 — consolidação Resumo)  
→ [comercial/AUDITORIA_STAB07_2.md](comercial/AUDITORIA_STAB07_2.md) (fase 2 — Central Operacional)

Inclui Prestação, crédito, ledger, recovery, STAB-04/06/06.3, forense 06.5, pricing, clientes, etc.

### Motor Fiscal

→ [fiscal/COMPILADO_FISCAL.md](fiscal/COMPILADO_FISCAL.md)

NFC-e, timeout SEFAZ, emitir UI forense.

### UX

→ [ux/COMPILADO_UX.md](ux/COMPILADO_UX.md)

UX-10…21, Central, SmartSearch, Electron.

### Sprint / STAB / Relatórios

→ [sprint/COMPILADO_SPRINT.md](sprint/COMPILADO_SPRINT.md)

STAB_01…04 e RELATORIO_*.

### Compras

Pasta [compras/](compras/) reservada — nenhum relatório dedicado no RC1.

---

## Cronologia (síntese)

1. **STAB-01 / STAB-03** — temas, autorização, build pipeline, release  
2. **STAB-04** — grade consistente + forense persistência  
3. **UX-10…20** — Central, Prestação Locator, Workspace  
4. **STAB-06** — Venda Oficial unificada  
5. **STAB-06.3** — Emitir NFC-e na Prestação  
6. **STAB-06.5 / 06.6** — forense → integridade → SSOT → consolidação → hardening RC1  
7. **RC1** — code freeze (`ADR-COMERCIAL-001.md` na raiz)

Cada compilado tem **sumário com âncoras** para a fonte original (nome do `.md` antigo).

---

*Arquivado e unificado em 2026-07-14 — limpeza controlada pós-RC1.*
