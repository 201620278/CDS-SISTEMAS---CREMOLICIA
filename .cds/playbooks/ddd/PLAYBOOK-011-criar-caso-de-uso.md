# PLAYBOOK-011 - Criar Caso de Uso (Use Case)

## Objetivo
Orientar a criação de um caso de uso seguindo os princípios de DDD da plataforma CDS.

## Quando utilizar
Sempre que houver necessidade de formalizar uma ação de aplicação ou um fluxo de negócio.

## Pré-requisitos
- DDD documentado.
- Domínio e contexto claros.

## Entradas
- Requisito funcional.
- Contexto do domínio.

## Saídas Esperadas
- Caso de uso inicial documentado.
- Separação básica entre domínio e aplicação.

## Passo a Passo
1. Definir o objetivo do caso de uso.
2. Identificar o agregado e o contexto.
3. Escrever a execução e as regras principais.
4. Conectar ao fluxo do módulo correspondente.
5. Validar a documentação e a separação de responsabilidades.

## Checklist
- [ ] Objetivo definido.
- [ ] Contexto identificado.
- [ ] Fluxo documentado.

## Critérios de Aceite
- O caso de uso está alinhado ao DDD.
- A responsabilidade está clara.

## Testes Obrigatórios
- Teste de fluxo principal.
- Validação de regras básicas.

## Documentação
- Documento do caso de uso.
- Referência ao agregado.

## ADRs Relacionados
- ADR-002

## Skills Relacionadas
- Skill: DDD do Comercial

## RFCs Relacionadas
- RFC-001

## Anti-padrões
- Misturar regra de negócio com infraestrutura.
- Criar fluxo sem contexto de domínio.

## Observações
Este playbook orienta a formalização do fluxo, não a implementação funcional completa.

## Roadmap Futuro
- Expandir para casos mais complexos e transacionais.

---

## Metadados
- Versão: 1.0.0
- Autor: Plataforma CDS
- Data: 2026-07-07
- Status: Ativo
- Dependências: DDD, Domain Design
- Motores relacionados: Todos
- Skills relacionadas: DDD do Comercial
- ADRs relacionadas: ADR-002
- RFCs relacionadas: RFC-001
- Última revisão: 2026-07-07
