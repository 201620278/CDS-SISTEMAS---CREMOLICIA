# PLAYBOOK-009 - Criar Dashboard

## Objetivo
Orientar a criação de um dashboard seguindo o padrão operacional da plataforma CDS.

## Quando utilizar
Sempre que for desenvolver um painel analítico ou de gestão.

## Pré-requisitos
- Design System disponível.
- API ou serviço de dados disponível.

## Entradas
- Requisitos do dashboard.
- Dados e filtros esperados.

## Saídas Esperadas
- Dashboard inicial com layout e estados básicos.
- Consumo de dados estruturado.

## Passo a Passo
1. Definir objetivo e estrutura do dashboard.
2. Reaproveitar componentes do Design System.
3. Integrar com a camada de dados apropriada.
4. Implementar filtros e estados básicos.
5. Validar experiência e documentação.

## Checklist
- [ ] Objetivo definido.
- [ ] Estrutura montada.
- [ ] Fluxo de dados validado.

## Critérios de Aceite
- O dashboard segue o padrão visual e operacional da plataforma.
- Os principais estados foram avaliados.

## Testes Obrigatórios
- Teste de renderização.
- Teste de filtros e estados.

## Documentação
- README do módulo.
- Documentação de componentes.

## ADRs Relacionados
- ADR-004

## Skills Relacionadas
- Skill: Dashboard Comercial

## RFCs Relacionadas
- RFC-001

## Anti-padrões
- Implementar cálculo de negócio na tela.
- Criar dashboard sem estrutura de dados.

## Observações
Este playbook é operacional e não substitui a governança de arquitetura.

## Roadmap Futuro
- Expandir para painéis mais complexos e interativos.

---

## Metadados
- Versão: 1.0.0
- Autor: Plataforma CDS
- Data: 2026-07-07
- Status: Ativo
- Dependências: Design System, API REST
- Motores relacionados: Motor Comercial
- Skills relacionadas: Dashboard Comercial
- ADRs relacionadas: ADR-004
- RFCs relacionadas: RFC-001
- Última revisão: 2026-07-07
