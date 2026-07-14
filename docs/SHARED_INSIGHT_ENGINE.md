# Shared Insight Engine

## Visão geral

A Shared Insight Engine é a infraestrutura oficial de interpretação e composição de insights da Plataforma CDS.

Ela não executa operações, não altera banco de dados e não publica lançamentos. Sua responsabilidade é transformar contexto e eventos em uma coleção padronizada de insights.

## Arquitetura

- Engine: executa regras registradas.
- Registry: registra, habilita, desabilita e consulta regras.
- Builder: padroniza a construção dos objetos de insight.
- Context: encapsula informações de empresa, filial, período, projeções, repositórios e cache.
- Result: encapsula insights, estatísticas, categorias, severidades e warnings.
- Cache: guarda resultados em memória com TTL.
- Events: prepara eventos de ciclo de vida dos insights.
- Service: fornece uma API interna para uso por motores e módulos.

## Pipeline

Projection Services -> Context -> Rules -> Builder -> Result -> API/Frontend

## Categorias oficiais

- COMERCIAL
- FINANCEIRO
- FISCAL
- ESTOQUE
- CLIENTE
- VENDAS
- PRODUÇÃO
- LOGÍSTICA
- OPERACIONAL
- GERENCIAL

## Prioridades

- LOW
- NORMAL
- HIGH
- URGENT

## Severidades

- INFO
- LOW
- MEDIUM
- HIGH
- CRITICAL

## Roadmap

- Sprint 3.6: infraestrutura compartilhada da engine.
- Sprint 3.7: regras comerciais específicas.
- Sprint 3.8+: integração com API e frontend.
