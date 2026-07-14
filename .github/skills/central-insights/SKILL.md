---
name: central-insights
description: "Use when implementing or reviewing the CDS Sprint 3.8 Central de Insights for the motor comercial module: build a dashboard that consumes insights from the API, renders filters/header/list/drawer, preserves UX behavior, and validates docs and tests without frontend-side calculations."
---

# Central de Insights — Sprint 3.8

## Quando usar
- Implementar ou revisar a Central Oficial de Insights do CDS Sistemas.
- Integrar a Shared Insight Engine com a interface operacional do motor comercial.
- Entregar uma tela de gestão com filtros, resumo, lista, drawer de detalhes e ações sem calcular regras no frontend.

## Objetivo
Criar uma tela operacional de leitura e acompanhamento para todos os insights produzidos pela Shared Insight Engine. A interface deve consumir dados exclusivamente pela API e não realizar cálculos de negócio no frontend.

## Fluxo recomendado
1. Confirmar os contratos da API
   - Preferir os endpoints de leitura e ação do módulo comercial.
   - Validar endpoints de resumo, detalhes, resolver e ignorar.

2. Estruturar o layout
   - Usar DashboardLayout como base.
   - Organizar Header, Filtros, Resumo, Lista e Drawer de Detalhes.

3. Implementar a camada de dados
   - Buscar resumo e lista de insights de forma compatível com a API.
   - Aplicar paginação no servidor, busca dinâmica com debounce e atualização parcial.
   - Manter filtros persistentes e evitar navegação extra.

4. Construir a interface
   - Reaproveitar componentes como DashboardLayout, Table, Drawer, Tabs, Timeline, Badge, Alert, StatCard, SearchBar, FilterBar, ActionMenu, Loading, EmptyState, Toast.
   - Padronizar badges e estados para categorias, severidades, prioridades e status.

5. Implementar ações do insight
   - Visualizar: abrir o drawer com o insight completo.
   - Marcar Resolvido: chamar o endpoint apropriado e atualizar a lista.
   - Ignorar: chamar o endpoint correspondente e refletir o novo estado.
   - Encaminhar para cliente, consignação, prestação ou perfil comercial quando estiver disponível.

6. Tratar estados de UX
   - Loading, erro, sem insights, offline e atualizando.
   - Garantir feedback claro com toasts, empty states e mensagens de falha.

7. Adicionar testes
   - Cobrir lista, filtros, drawer, resolver, ignorar, API e estados.

8. Documentar
   - Criar ou atualizar docs/CENTRAL_INSIGHTS.md com fluxo, categorias, severidades, prioridades, status, API e integração com a engine.

9. Validar a entrega
   - Confirmar que os insights são consumidos pela API.
   - Garantir drawer completo, filtros funcionando e ações operando.
   - Verificar que o frontend não calcula regras de negócio.

## Pontos de decisão
- Se a informação for derivada da API, renderizar diretamente do payload e manter o frontend sem lógica de cálculo.
- Se uma ação falhar, exibir toast e preservar o estado atual sem quebrar a tela.
- Se não houver insights, mostrar estado vazio sem perder os filtros aplicados.
- Se o usuário abrir detalhes, carregar o conteúdo no drawer de forma lazy e evitar fetchs desnecessários.

## Critérios de aceite
- Central de Insights funcional.
- Todos os insights consumidos pela API.
- Drawer completo e detalhado.
- Filtros funcionando.
- Resolver e ignorar funcionando.
- Componentes reutilizados e alinhados ao Design System.
- Nenhum cálculo realizado no frontend.
- Testes passando.

## Resultado esperado
Uma Central Oficial de Insights completa, responsiva e reutilizável, pronta para apoiar a operação comercial com visão consolidada dos insights da Shared Insight Engine.
