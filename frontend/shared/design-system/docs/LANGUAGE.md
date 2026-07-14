# Guia de Linguagem Operacional — CDS Design System

## Princípio

O operador nunca deve ver termos de arquitetura interna. A interface fala a língua do dia a dia comercial.

## Use sempre

| Contexto | Termo oficial |
|----------|---------------|
| Pessoa atendida | Cliente |
| Documento em campo | Consignação |
| Saída de produtos | Entrega / Preparar Entrega |
| Encerramento do atendimento | Fechamento / Fechar Consignação |
| Extrato financeiro | Conta Corrente |
| Análises e exportações | Relatórios |
| Tela inicial | Central de Trabalho |
| Lista de clientes | Central de Clientes |
| Painel do cliente | Central de Operações do Cliente |

## Nunca use na interface

- Cliente360, 360°
- Workflow, Playbook (use **Guia Operacional** quando necessário)
- Ledger, Projection, Outbox
- UseCase, DTO, Repository
- Cockpit, Dashboard Executivo
- Correlation, API, Endpoint

## Mensagens de feedback

Prefira mensagens específicas:

- ✅ "Consignação criada com sucesso."
- ❌ "Operação realizada."

Informe: o que aconteceu, por que (se relevante) e o próximo passo sugerido.
