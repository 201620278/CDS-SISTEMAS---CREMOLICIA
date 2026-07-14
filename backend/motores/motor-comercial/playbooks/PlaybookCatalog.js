/**
 * Catálogo oficial de Playbooks Comerciais — Sprint O-10.
 *
 * @module motores/motor-comercial/playbooks/PlaybookCatalog
 */

const PLAYBOOKS = Object.freeze([
  {
    id: 'PB-001',
    codigo: '001',
    nome: 'Cobrar Cliente Inadimplente',
    descricao: 'Fluxo guiado para cobrança de saldo em aberto',
    objetivo: 'Recuperar valores pendentes com abordagem padronizada',
    categoria: 'COBRANCA',
    tempoEstimadoMinutos: 30,
    resultadoEsperado: 'Saldo regularizado ou acordo registrado',
    preRequisitos: ['Cliente com saldo em aberto', 'Contato do cliente disponível'],
    tiposRecomendacao: ['COBRANCA', 'RENEGOCIACAO'],
    tiposInsight: ['SALDO_EM_ABERTO', 'PRESTACAO_ATRASADA'],
    passos: [
      { id: 's1', titulo: 'Consultar conta corrente', descricao: 'Verificar saldo e histórico de pagamentos', link: '/conta-corrente' },
      { id: 's2', titulo: 'Revisar pendências', descricao: 'Identificar alertas ativos do cliente', link: '/pendencias' },
      { id: 's3', titulo: 'Contato com cliente', descricao: 'Registrar contato telefônico ou visita', link: null },
      { id: 's4', titulo: 'Registrar pagamento ou acordo', descricao: 'Orientar registro manual no sistema', link: '/conta-corrente' },
      { id: 's5', titulo: 'Confirmar regularização', descricao: 'Validar saldo atualizado', link: '/conta-corrente' }
    ],
    kpisRelacionados: ['saldoEmAberto', 'valorRecebido'],
    documentosRelacionados: ['conta-corrente', 'pendencias']
  },
  {
    id: 'PB-002',
    codigo: '002',
    nome: 'Recuperar Cliente Inativo',
    descricao: 'Reativar relacionamento comercial com cliente sem movimentação',
    objetivo: 'Restabelecer operação comercial',
    categoria: 'RECUPERACAO',
    tempoEstimadoMinutos: 45,
    resultadoEsperado: 'Cliente com nova movimentação ou plano de retorno',
    preRequisitos: ['Cliente identificado como inativo'],
    tiposRecomendacao: ['VISITA_COMERCIAL', 'NEGOCIACAO'],
    tiposInsight: ['CLIENTE_SEM_MOVIMENTACAO'],
    passos: [
      { id: 's1', titulo: 'Analisar Cliente 360°', descricao: 'Revisar histórico e última movimentação', link: '/clientes' },
      { id: 's2', titulo: 'Verificar recomendações', descricao: 'Consultar sugestões do motor', link: '/recomendacoes' },
      { id: 's3', titulo: 'Agendar contato', descricao: 'Planejar visita ou ligação', link: null },
      { id: 's4', titulo: 'Propor nova consignação', descricao: 'Orientar criação manual se aplicável', link: '/consignacoes/nova' }
    ],
    kpisRelacionados: ['clientesAtivos', 'percentualConversao'],
    documentosRelacionados: ['cliente-360']
  },
  {
    id: 'PB-003',
    codigo: '003',
    nome: 'Revisar Limite Comercial',
    descricao: 'Análise guiada de limite de crédito do perfil comercial',
    objetivo: 'Ajustar limite conforme exposição e histórico',
    categoria: 'RENEGOCIACAO',
    tempoEstimadoMinutos: 25,
    resultadoEsperado: 'Decisão de limite documentada',
    preRequisitos: ['Perfil comercial ativo'],
    tiposRecomendacao: ['AUMENTAR_LIMITE', 'REDUZIR_LIMITE', 'SOLICITAR_APROVACAO'],
    tiposInsight: ['LIMITE_COMPROMETIDO'],
    passos: [
      { id: 's1', titulo: 'Consultar situação do cliente', descricao: 'Ver limite, saldo e score', link: '/clientes' },
      { id: 's2', titulo: 'Analisar indicadores', descricao: 'Revisar conversão e perdas', link: '/indicadores' },
      { id: 's3', titulo: 'Solicitar aprovação', descricao: 'Encaminhar para gestão se necessário', link: null },
      { id: 's4', titulo: 'Registrar alteração', descricao: 'Orientar alteração manual de limite', link: '/clientes' }
    ],
    kpisRelacionados: ['limiteComercial', 'saldoEmAberto'],
    documentosRelacionados: ['perfil-comercial']
  },
  {
    id: 'PB-004',
    codigo: '004',
    nome: 'Encerrar Prestação',
    descricao: 'Fluxo para fechamento de prestação de contas',
    objetivo: 'Encerrar prestação com saldo regularizado',
    categoria: 'PRESTACAO',
    tempoEstimadoMinutos: 20,
    resultadoEsperado: 'Prestação fechada',
    preRequisitos: ['Consignação com prestação aberta'],
    tiposRecomendacao: ['FECHAR_PRESTACAO'],
    tiposInsight: ['PRESTACAO_ABERTA', 'PRESTACAO_ATRASADA'],
    passos: [
      { id: 's1', titulo: 'Abrir resumo da prestação', descricao: 'Conferir vendas, perdas e pagamentos', link: '/consignacoes' },
      { id: 's2', titulo: 'Verificar saldo', descricao: 'Confirmar saldo em aberto', link: '/conta-corrente' },
      { id: 's3', titulo: 'Registrar pagamentos pendentes', descricao: 'Orientar registro manual', link: null },
      { id: 's4', titulo: 'Fechar prestação', descricao: 'Executar fechamento manual no sistema', link: '/consignacoes' }
    ],
    kpisRelacionados: ['saldoPrestacao'],
    documentosRelacionados: ['prestacao', 'conta-corrente']
  },
  {
    id: 'PB-005',
    codigo: '005',
    nome: 'Regularizar Pendências',
    descricao: 'Resolver pendências críticas do cliente',
    objetivo: 'Zerar pendências operacionais',
    categoria: 'RECUPERACAO',
    tempoEstimadoMinutos: 35,
    resultadoEsperado: 'Pendências resolvidas ou adiadas',
    preRequisitos: ['Pendências ativas identificadas'],
    tiposRecomendacao: [],
    tiposInsight: [],
    passos: [
      { id: 's1', titulo: 'Listar pendências', descricao: 'Abrir central de pendências', link: '/pendencias' },
      { id: 's2', titulo: 'Priorizar críticas', descricao: 'Atuar nas pendências críticas primeiro', link: '/pendencias' },
      { id: 's3', titulo: 'Executar ações', descricao: 'Seguir orientações de cada pendência', link: null },
      { id: 's4', titulo: 'Registrar resolução', descricao: 'Marcar pendências como resolvidas', link: '/pendencias' }
    ],
    kpisRelacionados: ['pendenciasCriticas'],
    documentosRelacionados: ['pendencias']
  },
  {
    id: 'PB-006',
    codigo: '006',
    nome: 'Agendar Visita Comercial',
    descricao: 'Planejamento de visita presencial ao cliente',
    objetivo: 'Visita agendada e registrada',
    categoria: 'VISITA_COMERCIAL',
    tempoEstimadoMinutos: 15,
    resultadoEsperado: 'Visita confirmada com operador',
    preRequisitos: ['Cliente identificado'],
    tiposRecomendacao: ['VISITA_COMERCIAL', 'CONTATO_TELEFONICO'],
    tiposInsight: ['CONVERSAO_BAIXA'],
    passos: [
      { id: 's1', titulo: 'Revisar Cliente 360°', descricao: 'Preparar contexto da visita', link: '/clientes' },
      { id: 's2', titulo: 'Consultar recomendações', descricao: 'Ver sugestões comerciais', link: '/recomendacoes' },
      { id: 's3', titulo: 'Agendar visita', descricao: 'Registrar data e responsável', link: null },
      { id: 's4', titulo: 'Registrar observações', descricao: 'Documentar plano da visita', link: null }
    ],
    kpisRelacionados: ['percentualConversao'],
    documentosRelacionados: ['cliente-360']
  },
  {
    id: 'PB-007',
    codigo: '007',
    nome: 'Atualizar Cadastro',
    descricao: 'Revisão e atualização de dados cadastrais',
    objetivo: 'Cadastro comercial atualizado',
    categoria: 'ATUALIZACAO_CADASTRAL',
    tempoEstimadoMinutos: 20,
    resultadoEsperado: 'Dados cadastrais conferidos',
    preRequisitos: ['Acesso ao perfil comercial'],
    tiposRecomendacao: ['ATUALIZAR_CADASTRO'],
    tiposInsight: ['CORTESIAS_ELEVADAS'],
    passos: [
      { id: 's1', titulo: 'Abrir perfil comercial', descricao: 'Acessar Cliente 360°', link: '/clientes' },
      { id: 's2', titulo: 'Conferir dados', descricao: 'Validar limite, contatos e observações', link: '/clientes' },
      { id: 's3', titulo: 'Atualizar manualmente', descricao: 'Orientar edição no cadastro', link: '/clientes' }
    ],
    kpisRelacionados: [],
    documentosRelacionados: ['perfil-comercial']
  },
  {
    id: 'PB-008',
    codigo: '008',
    nome: 'Liberar Crédito',
    descricao: 'Fluxo para análise e liberação de crédito',
    objetivo: 'Crédito liberado ou mantido bloqueado com justificativa',
    categoria: 'LIBERACAO',
    tempoEstimadoMinutos: 30,
    resultadoEsperado: 'Decisão de crédito registrada',
    preRequisitos: ['Cliente bloqueado ou em análise'],
    tiposRecomendacao: ['LIBERAR_CREDITO', 'SOLICITAR_APROVACAO'],
    tiposInsight: ['CLIENTE_BLOQUEADO'],
    passos: [
      { id: 's1', titulo: 'Verificar motivo do bloqueio', descricao: 'Consultar pendências e situação', link: '/pendencias' },
      { id: 's2', titulo: 'Analisar histórico', descricao: 'Revisar conta corrente e score', link: '/conta-corrente' },
      { id: 's3', titulo: 'Solicitar aprovação', descricao: 'Encaminhar para gestão', link: null },
      { id: 's4', titulo: 'Desbloquear perfil', descricao: 'Orientar desbloqueio manual', link: '/clientes' }
    ],
    kpisRelacionados: ['scoreComercial'],
    documentosRelacionados: ['perfil-comercial']
  },
  {
    id: 'PB-009',
    codigo: '009',
    nome: 'Bloquear Cliente',
    descricao: 'Fluxo para bloqueio comercial preventivo',
    objetivo: 'Cliente bloqueado com registro de motivo',
    categoria: 'BLOQUEIO',
    tempoEstimadoMinutos: 15,
    resultadoEsperado: 'Bloqueio efetivado manualmente',
    preRequisitos: ['Justificativa de bloqueio'],
    tiposRecomendacao: ['SOLICITAR_APROVACAO'],
    tiposInsight: ['PERDA_ELEVADA', 'LIMITE_COMPROMETIDO'],
    passos: [
      { id: 's1', titulo: 'Documentar motivo', descricao: 'Registrar observação do bloqueio', link: null },
      { id: 's2', titulo: 'Revisar exposição', descricao: 'Consultar saldos e consignações', link: '/clientes' },
      { id: 's3', titulo: 'Bloquear perfil', descricao: 'Orientar bloqueio manual', link: '/clientes' }
    ],
    kpisRelacionados: ['saldoEmAberto', 'percentualPerda'],
    documentosRelacionados: ['perfil-comercial']
  },
  {
    id: 'PB-010',
    codigo: '010',
    nome: 'Reativar Cliente',
    descricao: 'Retorno de cliente inativo ou bloqueado',
    objetivo: 'Cliente reativado com plano comercial',
    categoria: 'RECUPERACAO',
    tempoEstimadoMinutos: 40,
    resultadoEsperado: 'Operação comercial retomada',
    preRequisitos: ['Cliente inativo ou bloqueado'],
    tiposRecomendacao: ['LIBERAR_CREDITO', 'NOVA_CONSIGNACAO'],
    tiposInsight: ['CLIENTE_BLOQUEADO'],
    passos: [
      { id: 's1', titulo: 'Avaliar elegibilidade', descricao: 'Revisar situação completa', link: '/clientes' },
      { id: 's2', titulo: 'Liberar crédito se aplicável', descricao: 'Seguir playbook de liberação', link: null },
      { id: 's3', titulo: 'Nova consignação', descricao: 'Orientar nova operação', link: '/consignacoes/nova' }
    ],
    kpisRelacionados: ['clientesAtivos'],
    documentosRelacionados: ['cliente-360']
  },
  {
    id: 'PB-011',
    codigo: '011',
    nome: 'Revisar Consignação',
    descricao: 'Auditoria operacional de consignação',
    objetivo: 'Consignação revisada e regularizada',
    categoria: 'ENTREGA',
    tempoEstimadoMinutos: 25,
    resultadoEsperado: 'Inconsistências identificadas e tratadas',
    preRequisitos: ['Consignação identificada'],
    tiposRecomendacao: ['NOVA_CONSIGNACAO'],
    tiposInsight: ['ENTREGA_PENDENTE', 'CONSIGNACAO_PARADA'],
    passos: [
      { id: 's1', titulo: 'Abrir central operacional', descricao: 'Localizar consignação', link: '/consignacoes' },
      { id: 's2', titulo: 'Revisar itens e status', descricao: 'Conferir entrega e prestação', link: '/consignacoes' },
      { id: 's3', titulo: 'Registrar correções', descricao: 'Orientar ajustes manuais', link: null }
    ],
    kpisRelacionados: ['valorConsignado'],
    documentosRelacionados: ['consignacao']
  },
  {
    id: 'PB-012',
    codigo: '012',
    nome: 'Cliente VIP',
    descricao: 'Tratamento diferenciado para clientes estratégicos',
    objetivo: 'Plano VIP executado',
    categoria: 'CLIENTE_VIP',
    tempoEstimadoMinutos: 30,
    resultadoEsperado: 'Ações VIP concluídas',
    preRequisitos: ['Cliente classificado como VIP'],
    tiposRecomendacao: [],
    tiposInsight: [],
    passos: [
      { id: 's1', titulo: 'Revisar indicadores VIP', descricao: 'Conversão, ticket e histórico', link: '/clientes' },
      { id: 's2', titulo: 'Consultar recomendações', descricao: 'Oportunidades comerciais', link: '/recomendacoes' },
      { id: 's3', titulo: 'Plano de ação VIP', descricao: 'Definir próximas ações', link: null },
      { id: 's4', titulo: 'Registrar follow-up', descricao: 'Documentar contato e resultados', link: null }
    ],
    kpisRelacionados: ['percentualConversao', 'ticketMedio'],
    documentosRelacionados: ['cliente-360', 'indicadores']
  }
]);

const CATEGORIAS = Object.freeze([
  'COBRANCA', 'RENEGOCIACAO', 'ENTREGA', 'PRESTACAO', 'RECUPERACAO',
  'VISITA_COMERCIAL', 'ATUALIZACAO_CADASTRAL', 'BLOQUEIO', 'LIBERACAO', 'CLIENTE_VIP'
]);

function listarTodos() {
  return PLAYBOOKS.map((p) => ({ ...p }));
}

function buscarPorId(id) {
  return PLAYBOOKS.find((p) => p.id === id || p.codigo === id) || null;
}

module.exports = {
  PLAYBOOKS,
  CATEGORIAS,
  listarTodos,
  buscarPorId
};
