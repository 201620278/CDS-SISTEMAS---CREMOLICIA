# PLAYBOOK-013 - Criar Repository

## Objetivo
Orientar a criação de um Repository seguindo o padrão da plataforma CDS.

## Quando utilizar
Sempre que for implementar acesso a persistência de forma padronizada.

## Pré-requisitos
- DDD e arquitetura de repositórios definidos.
- Contexto de persistência claro.

## Entradas
- Entidade ou agregado.
- Regras de persistência.

## Saídas Esperadas
- Repository inicial implementado.
- Contrato de acesso documentado.

## Passo a Passo
1. Definir o contrato do repository.
2. Implementar a abstração inicial.
3. Conectar à camada de persistência.
4. Documentar as operações principais.
5. Validar com testes básicos.

## Checklist
- [ ] Contrato definido.
- [ ] Implementação criada.
- [ ] Teste básico validado.

## Critérios de Aceite
- O repository segue o padrão de arquitetura.
- As operações de persistência são claras.

## Testes Obrigatórios
- Teste de persistência básico.
- Teste de consulta simples.

## Documentação
- README do módulo.
- Referência ao aggregate.

## ADRs Relacionados
- ADR-002

## Skills Relacionadas
- Skill: DDD do Comercial

## RFCs Relacionadas
- RFC-001

## Anti-padrões
- Implementar persistência diretamente no caso de uso.
- Misturar acesso a banco com regras de negócio.

## Observações
Este playbook orienta a criação estrutural do repository.

## Roadmap Futuro
- Expandir para repositórios mais especializados.

---

## Metadados
- Versão: 1.0.0
- Autor: Plataforma CDS
- Data: 2026-07-07
- Status: Ativo
- Dependências: DDD, Persistência
- Motores relacionados: Todos
- Skills relacionadas: DDD do Comercial
- ADRs relacionadas: ADR-002
- RFCs relacionadas: RFC-001
- Última revisão: 2026-07-07
