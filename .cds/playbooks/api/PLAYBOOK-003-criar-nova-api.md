# PLAYBOOK-003 - Criar Nova API

## Objetivo
Orientar a criação de uma nova API seguindo o padrão da plataforma CDS.

## Quando utilizar
Sempre que for adicionar um novo endpoint ou serviço de API.

## Pré-requisitos
- Arquitetura de API REST definida.
- Skills e ADRs relacionados disponíveis.

## Entradas
- Requisitos do endpoint.
- Contexto do módulo.

## Saídas Esperadas
- Endpoint inicial documentado.
- Estrutura mínima de integração.

## Passo a Passo
1. Definir o contrato da API.
2. Criar a rota e o controller inicial.
3. Implementar a camada de serviço.
4. Adicionar documentação mínima.
5. Validar com testes básicos.

## Checklist
- [ ] Contrato definido.
- [ ] Rota criada.
- [ ] Teste básico validado.

## Critérios de Aceite
- A API segue o padrão de integração da plataforma.
- Há documentação e validação básica.

## Testes Obrigatórios
- Teste de integração básico.
- Validação de resposta e erro.

## Documentação
- README da API.
- Descrição do endpoint.

## ADRs Relacionados
- ADR-005

## Skills Relacionadas
- Skill: HTTP Compartilhado

## RFCs Relacionadas
- RFC-001

## Anti-padrões
- Criar endpoint sem contrato.
- Expor regra sem camada de serviço.

## Observações
Este playbook cobre a criação estrutural da API, não a definição de nova regra de negócio.

## Roadmap Futuro
- Expandir para versionamento e versionamento de contratos.

---

## Metadados
- Versão: 1.0.0
- Autor: Plataforma CDS
- Data: 2026-07-07
- Status: Ativo
- Dependências: API REST, HTTP Compartilhado
- Motores relacionados: Todos
- Skills relacionadas: HTTP Compartilhado
- ADRs relacionadas: ADR-005
- RFCs relacionadas: RFC-001
- Última revisão: 2026-07-07
