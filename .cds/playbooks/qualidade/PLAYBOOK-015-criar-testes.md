# PLAYBOOK-015 - Criar Testes

## Objetivo
Orientar a criação de testes oficiais para componentes, módulos e integrações da plataforma CDS.

## Quando utilizar
Sempre que for validar uma implementação ou garantir confiança em uma alteração.

## Pré-requisitos
- Escopo da mudança definido.
- Ferramentas e ambiente de testes disponíveis.

## Entradas
- Requisitos a validar.
- Cenários de execução.

## Saídas Esperadas
- Testes básicos criados.
- Evidência de validação documentada.

## Passo a Passo
1. Definir o cenário a ser validado.
2. Escolher o tipo de teste apropriado.
3. Criar os testes com foco em comportamento real.
4. Executar e registrar os resultados.
5. Vincular a documentação e à governança.

## Checklist
- [ ] Cenário definido.
- [ ] Teste criado.
- [ ] Resultado validado.

## Critérios de Aceite
- O teste cobre o comportamento principal.
- O resultado é consistente com o escopo.

## Testes Obrigatórios
- Teste de unidade ou integração, conforme o caso.
- Validação de falha e sucesso.

## Documentação
- Relatório de execução.
- Referência ao módulo testado.

## ADRs Relacionados
- ADR-002

## Skills Relacionadas
- Skill: Knowledge Layer

## RFCs Relacionadas
- RFC-001

## Anti-padrões
- Testar apenas mocks sem validar comportamento real.
- Não registrar falhas e resultados.

## Observações
Os testes devem apoiar a confiança do processo, sem substituir a revisão técnica.

## Roadmap Futuro
- Expandir para testes de contrato e ponta a ponta.

---

## Metadados
- Versão: 1.0.0
- Autor: Plataforma CDS
- Data: 2026-07-07
- Status: Ativo
- Dependências: Ambiente de testes
- Motores relacionados: Todos
- Skills relacionadas: Knowledge Layer
- ADRs relacionadas: ADR-002
- RFCs relacionadas: RFC-001
- Última revisão: 2026-07-07
