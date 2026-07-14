# Wizard Consignação

## Objetivo
Documentar o fluxo do wizard de consignação para padronizar implementação e revisão.

## Quando utilizar
Sempre que houver necessidade de revisar o processo de cadastramento ou acompanhamento de consignação.

## Pré-requisitos
- Motor Comercial funcional.
- Regras de negócio conhecidas.
- API de consignação disponível.

## Estrutura
- Etapas do wizard.
- Dados do cliente e da operação.
- Validação intermediária.

## Fluxo
1. Iniciar o wizard.
2. Coletar dados por etapa.
3. Validar regras.
4. Confirmar e persistir.

## Componentes
- Formulário multi-etapa.
- Validação.
- Etapas e navegação.

## API
- Endpoint de criação e atualização da consignação.

## Eventos
- Avanço de etapa.
- Validação de formulário.
- Finalização.

## Integrações
- Motor Comercial.
- API REST.

## Performance
- Validação incremental.

## Segurança
- Respeitar permissões e contexto do usuário.

## Testes
- Testes de fluxo completo e validações.

## Critérios de Aceite
- O wizard é compreensível e reutilizável.
- As etapas são consistentes.
- A integração com API é correta.

## Anti-padrões
- Acoplar regras diretamente ao componente.
- Falta de validação entre etapas.

## Roadmap
- Evoluir para fluxos mais parametrizados.

---

## Metadados
- Versão: 1.0.0
- Autor: Plataforma CDS
- Data: 2026-07-07
- Dependências: API REST, Motor Comercial
- Motores relacionados: Motor Comercial
- Status: Ativo
- Última revisão: 2026-07-07
