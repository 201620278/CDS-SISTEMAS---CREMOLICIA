# PLAYBOOK-012 - Criar Aggregate DDD

## Objetivo
Orientar a criação de um Aggregate no padrão DDD da plataforma CDS.

## Quando utilizar
Sempre que houver necessidade de modelar um agregado de domínio.

## Pré-requisitos
- Contexto de domínio claro.
- DDD e regras de consistência definidas.

## Entradas
- Entidade principal.
- Regras e invariantes do agregado.

## Saídas Esperadas
- Aggregate inicial modelado.
- Regras e invariantes documentadas.

## Passo a Passo
1. Identificar a entidade raiz do agregado.
2. Definir fronteiras e invariantes.
3. Estruturar o aggregate com consistência clara.
4. Vincular a repositório e caso de uso quando aplicável.
5. Documentar o modelo.

## Checklist
- [ ] Entidade raiz identificada.
- [ ] Invariantes definidas.
- [ ] Modelo documentado.

## Critérios de Aceite
- O aggregate está bem delimitado.
- As regras de consistência são claras.

## Testes Obrigatórios
- Teste de invariantes.
- Teste de comportamento básico.

## Documentação
- Documento do aggregate.
- Referência ao caso de uso.

## ADRs Relacionados
- ADR-002

## Skills Relacionadas
- Skill: DDD do Comercial

## RFCs Relacionadas
- RFC-001

## Anti-padrões
- Criar agregado sem raiz clara.
- Misturar entidades sem consistência.

## Observações
Este playbook orienta a modelagem estrutural do agregado.

## Roadmap Futuro
- Expandir para agregados mais complexos.

---

## Metadados
- Versão: 1.0.0
- Autor: Plataforma CDS
- Data: 2026-07-07
- Status: Ativo
- Dependências: DDD, Domain Modeling
- Motores relacionados: Todos
- Skills relacionadas: DDD do Comercial
- ADRs relacionadas: ADR-002
- RFCs relacionadas: RFC-001
- Última revisão: 2026-07-07
