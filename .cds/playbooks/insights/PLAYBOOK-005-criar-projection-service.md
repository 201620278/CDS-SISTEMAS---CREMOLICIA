# PLAYBOOK-005 - Criar Projection Service

## Objetivo
Orientar a criação de um Projection Service oficial para a plataforma CDS.

## Quando utilizar
Sempre que for adicionar um novo serviço de projeção ou indicador.

## Pré-requisitos
- Projection Services documentado.
- Contexto do domínio conhecido.

## Entradas
- Requisitos de projeção.
- Contexto do módulo.

## Saídas Esperadas
- Projection Service inicial.
- Mapeamento e integração básica.

## Passo a Passo
1. Definir o escopo da projeção.
2. Criar o serviço e o mapper inicial.
3. Vincular ao módulo correspondente.
4. Validar integração com a API.
5. Documentar e registrar na governança.

## Checklist
- [ ] Escopo definido.
- [ ] Serviço criado.
- [ ] Integração validada.

## Critérios de Aceite
- O serviço está alinhado ao padrão oficial.
- A integração é clara e documentada.

## Testes Obrigatórios
- Teste de mapeamento.
- Teste de integração básica.

## Documentação
- README do serviço.
- Skill relacionada.

## ADRs Relacionados
- ADR-004

## Skills Relacionadas
- Skill: Projection Services

## RFCs Relacionadas
- RFC-002

## Anti-padrões
- Lógica espalhada em controller.
- Projeção sem documentação.

## Observações
Este playbook é de execução estrutural e não define regra de negócio nova.

## Roadmap Futuro
- Expandir para novos motores e domínios.

---

## Metadados
- Versão: 1.0.0
- Autor: Plataforma CDS
- Data: 2026-07-07
- Status: Ativo
- Dependências: Projection Services, Shared Insight Engine
- Motores relacionados: Motor Comercial
- Skills relacionadas: Projection Services
- ADRs relacionadas: ADR-004
- RFCs relacionadas: RFC-002
- Última revisão: 2026-07-07
