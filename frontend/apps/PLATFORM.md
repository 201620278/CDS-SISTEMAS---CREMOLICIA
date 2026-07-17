# CDS Platform — Fundação

A CDS Sistemas é uma plataforma multi-cliente. Todos os clientes compartilham o mesmo Backend, API, Banco e regras de negócio.

## Clientes

| Cliente | Caminho | Status |
|---------|---------|--------|
| ERP Desktop | `frontend/erp/` (legado Electron) | Produção |
| PDV Desktop | `frontend/pdv/` (legado Electron) | Produção |
| CDS Mobile | `frontend/apps/mobile/` | **RC2.3 Homologado Cremolia (`2.3.0-rc2.3`)** |
| Portal do Contador | `frontend/apps/portal-contador/` | Previsto |
| Portal do Cliente | `frontend/apps/portal-cliente/` | Previsto |
| Portal do Vendedor | `frontend/apps/portal-vendedor/` | Previsto |
| Portal da Indústria | `frontend/apps/portal-industria/` | Previsto |

## Shared (fonte única)

- `frontend/shared/design-system/` — Design System
- `frontend/shared/ui/` — Shared UI
- `frontend/shared/js/` — Auth, access-control, core
- `frontend/shared/api/` — Cliente HTTP da plataforma
- `frontend/shared/platform/` — Detecção de cliente e rotas

## Regras

1. Nenhuma regra de negócio no frontend.
2. Todo cliente consome `/api/*` existente.
3. ERP/PDV permanecem onde estão por compatibilidade Electron — não mover sem migração planejada.
4. Novos clientes nascem em `frontend/apps/<nome>/`.
5. Auth, sessões e terminais são centralizados no motor existente (`/api/auth`, `/api/terminais`) — sem “Platform Client Manager” paralelo.
6. Clientes oficiais enviam metadados: Client ID/tipo, versão, plataforma, heartbeat e `terminal_id` quando aplicável.
