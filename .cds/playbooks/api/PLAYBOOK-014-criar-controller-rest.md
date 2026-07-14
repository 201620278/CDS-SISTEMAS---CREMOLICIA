# PLAYBOOK-014 - Criar Controller REST

## Objetivo
Orientar a criação de um controller REST seguindo o padrão da plataforma CDS.

## Quando utilizar
Sempre que for expor um endpoint via API REST.

## Pré-requisitos
- API REST e camada de serviço definidas.
- Contrato e contexto claros.

## Entradas
- Requisitos do endpoint.
- Camada de serviço correspondente.

## Saídas Esperadas
- Controller inicial criado.
- Respostas e erros padronizados.

## Passo a Passo
1. Definir o endpoint e o contrato.
2. Criar o controller com tratamento básico de erro.
3. Conectar à camada de serviço apropriada.
4. Validar retorno e status.
5. Documentar o endpoint.

## Checklist
- [ ] Endpoint definido.
- [ ] Controller criado.
- [ ] Resposta validada.

## Critérios de Aceite
- O controller está alinhado ao padrão da plataforma.
- O tratamento de erro é claro.

## Testes Obrigatórios
- Teste de integração básico.
- Teste de resposta e erro.

## Documentação
- Documentação do endpoint.
- README do módulo.

## ADRs Relacionados
- ADR-005

## Skills Relacionadas
- Skill: HTTP Compartilhado

## RFCs Relacionadas
- RFC-001

## Anti-padrões
- Implementar regra de negócio diretamente no controller.
- Respostas inconsistentes.

## Observações
Este playbook cobre apenas a execução estrutural da camada REST.

## Roadmap Futuro
- Expandir para versões e contratos mais ricos.

---

## Metadados
- Versão: 1.0.0
- Autor: Plataforma CDS
- Data: 2026-07-07
- Status: Ativo
- Dependências: API REST, Controller Pattern
- Motores relacionados: Todos
- Skills relacionadas: HTTP Compartilhado
- ADRs relacionadas: ADR-005
- RFCs relacionadas: RFC-001
- Última revisão: 2026-07-07
