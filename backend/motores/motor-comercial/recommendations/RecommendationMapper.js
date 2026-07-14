/**
 * RecommendationMapper — transforma insights/alertas em recomendações de negócio.
 *
 * Sprint O-9: sem execução automática, sem alteração de domínio.
 *
 * @module motores/motor-comercial/recommendations/RecommendationMapper
 */

const MAPA_INSIGHT_RECOMENDACOES = Object.freeze({
  SALDO_EM_ABERTO: [
    { tipo: 'COBRANCA', categoria: 'FINANCEIRO', titulo: 'Realizar cobrança', descricao: 'Entrar em contato para receber saldo em aberto', impacto: 'Recuperação de receita', confianca: 85 },
    { tipo: 'RENEGOCIACAO', categoria: 'FINANCEIRO', titulo: 'Propor renegociação', descricao: 'Negociar condições de pagamento do saldo pendente', impacto: 'Redução de inadimplência', confianca: 70 }
  ],
  PERDA_ELEVADA: [
    { tipo: 'REGISTRAR_DEVOLUCAO', categoria: 'OPERACIONAL', titulo: 'Registrar devolução', descricao: 'Revisar itens com perda elevada e registrar devoluções pendentes', impacto: 'Controle de estoque', confianca: 75 },
    { tipo: 'FECHAR_PRESTACAO', categoria: 'OPERACIONAL', titulo: 'Fechar prestação', descricao: 'Encerrar prestações abertas para consolidar perdas', impacto: 'Regularização operacional', confianca: 80 }
  ],
  CONVERSAO_BAIXA: [
    { tipo: 'VISITA_COMERCIAL', categoria: 'COMERCIAL', titulo: 'Agendar visita comercial', descricao: 'Visitar cliente para entender baixa conversão', impacto: 'Aumento de vendas', confianca: 72 },
    { tipo: 'NEGOCIACAO', categoria: 'COMERCIAL', titulo: 'Iniciar negociação', descricao: 'Renegociar mix e condições comerciais', impacto: 'Melhoria de conversão', confianca: 68 }
  ],
  CORTESIAS_ELEVADAS: [
    { tipo: 'ATUALIZAR_CADASTRO', categoria: 'OPERACIONAL', titulo: 'Revisar cadastro comercial', descricao: 'Auditar cortesias e atualizar política do cliente', impacto: 'Controle de margem', confianca: 78 }
  ],
  CLIENTE_BLOQUEADO: [
    { tipo: 'LIBERAR_CREDITO', categoria: 'CREDITO', titulo: 'Avaliar liberação de crédito', descricao: 'Analisar desbloqueio após regularização', impacto: 'Retomada comercial', confianca: 65 },
    { tipo: 'SOLICITAR_APROVACAO', categoria: 'CREDITO', titulo: 'Solicitar aprovação gerencial', descricao: 'Encaminhar análise de crédito para aprovação', impacto: 'Gestão de risco', confianca: 90 }
  ],
  PRESTACAO_ATRASADA: [
    { tipo: 'FECHAR_PRESTACAO', categoria: 'OPERACIONAL', titulo: 'Fechar prestação atrasada', descricao: 'Priorizar fechamento da prestação em atraso', impacto: 'Redução de exposição', confianca: 88 },
    { tipo: 'COBRANCA', categoria: 'FINANCEIRO', titulo: 'Cobrar prestação atrasada', descricao: 'Contato financeiro para regularização', impacto: 'Recuperação de valores', confianca: 82 },
    { tipo: 'CONTATO_TELEFONICO', categoria: 'COMERCIAL', titulo: 'Contato telefônico', descricao: 'Ligar ao cliente sobre prestação pendente', impacto: 'Agilização de acerto', confianca: 75 }
  ],
  ENTREGA_PENDENTE: [
    { tipo: 'NOVA_CONSIGNACAO', categoria: 'COMERCIAL', titulo: 'Concluir entrega', descricao: 'Registrar entrega da consignação pendente', impacto: 'Continuidade comercial', confianca: 92 }
  ],
  PRESTACAO_ABERTA: [
    { tipo: 'REGISTRAR_PAGAMENTO', categoria: 'OPERACIONAL', titulo: 'Registrar pagamento', descricao: 'Registrar pagamentos pendentes na prestação aberta', impacto: 'Redução de saldo', confianca: 80 },
    { tipo: 'FECHAR_PRESTACAO', categoria: 'OPERACIONAL', titulo: 'Fechar prestação', descricao: 'Encerrar prestação quando saldo estiver regularizado', impacto: 'Fechamento operacional', confianca: 85 }
  ],
  LIMITE_COMPROMETIDO: [
    { tipo: 'AUMENTAR_LIMITE', categoria: 'CREDITO', titulo: 'Avaliar aumento de limite', descricao: 'Cliente com limite quase esgotado — analisar expansão', impacto: 'Crescimento comercial', confianca: 60 },
    { tipo: 'REDUZIR_LIMITE', categoria: 'CREDITO', titulo: 'Avaliar redução de limite', descricao: 'Revisar limite diante do comprometimento elevado', impacto: 'Mitigação de risco', confianca: 70 },
    { tipo: 'SOLICITAR_APROVACAO', categoria: 'CREDITO', titulo: 'Solicitar aprovação de limite', descricao: 'Encaminhar decisão de limite para gestão', impacto: 'Governança de crédito', confianca: 88 }
  ],
  PERDA_ELEVADA_ALERT: [
    { tipo: 'CLIENTE_EM_RISCO', categoria: 'ESTRATEGICO', titulo: 'Cliente em risco', descricao: 'Monitorar cliente com indicadores deteriorados', impacto: 'Prevenção de perdas', confianca: 78 }
  ]
});

const PRIORIDADE_POR_SEVERIDADE = Object.freeze({
  CRITICAL: 'URGENT',
  HIGH: 'HIGH',
  MEDIUM: 'NORMAL',
  LOW: 'LOW',
  INFO: 'LOW'
});

function linkPorContexto(tipo, clienteId, consignacaoId) {
  if (consignacaoId) return `/consignacoes/${consignacaoId}`;
  if (clienteId) return `/clientes/${clienteId}`;
  const rotas = {
    COBRANCA: '/conta-corrente',
    RENEGOCIACAO: '/conta-corrente',
    NOVA_CONSIGNACAO: '/consignacoes/nova',
    FECHAR_PRESTACAO: '/consignacoes',
    REGISTRAR_PAGAMENTO: '/conta-corrente'
  };
  return rotas[tipo] || '/recomendacoes';
}

/**
 * @param {Object} fonte - insight ou alerta normalizado
 * @param {Object} template - template de recomendação
 * @param {number} index
 * @returns {Object}
 */
function buildRecomendacao(fonte, template, index) {
  const tipo = fonte.tipo || fonte.codigo || 'ALERTA';
  const id = `rec-${tipo}-${template.tipo}-${fonte.clienteId || 'g'}-${fonte.consignacaoId || index}`;
  const prioridade = PRIORIDADE_POR_SEVERIDADE[String(fonte.severidade || 'MEDIUM').toUpperCase()] || 'NORMAL';

  return {
    id,
    titulo: template.titulo,
    descricao: template.descricao,
    categoria: template.categoria,
    prioridade,
    confianca: template.confianca,
    impactoEstimado: template.impacto,
    motivo: fonte.motivo || fonte.mensagem || fonte.descricao || '',
    origem: fonte.origemInsight || fonte.origemProjecao || 'shared-insight-engine',
    insightRelacionado: fonte.id || fonte.codigo || tipo,
    projectionRelacionada: fonte.origemProjecao || fonte.dados?.origemProjecao || 'insights',
    clienteId: fonte.clienteId || fonte.dados?.clienteId || null,
    cliente: fonte.cliente || null,
    consignacaoId: fonte.consignacaoId || fonte.dados?.consignacaoId || null,
    documento: fonte.documento || fonte.dados?.documento || null,
    data: new Date().toISOString(),
    status: 'NOVA',
    tipo: template.tipo,
    link: linkPorContexto(template.tipo, fonte.clienteId, fonte.consignacaoId),
    pendenciaRelacionada: fonte.id || null
  };
}

/**
 * @param {Object[]} fontes - insights + alertas
 * @returns {Object[]}
 */
function mapFontesParaRecomendacoes(fontes = []) {
  const recomendacoes = [];
  const seen = new Set();

  fontes.forEach((fonte, fi) => {
    const codigo = fonte.tipo || fonte.codigo || '';
    const templates = MAPA_INSIGHT_RECOMENDACOES[codigo] || [];
    templates.forEach((template, ti) => {
      const rec = buildRecomendacao(fonte, template, `${fi}-${ti}`);
      if (seen.has(rec.id)) return;
      seen.add(rec.id);
      recomendacoes.push(rec);
    });
  });

  return recomendacoes.sort((a, b) => {
    const pri = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };
    const pa = pri[a.prioridade] || 0;
    const pb = pri[b.prioridade] || 0;
    if (pb !== pa) return pb - pa;
    return (b.confianca || 0) - (a.confianca || 0);
  });
}

module.exports = {
  MAPA_INSIGHT_RECOMENDACOES,
  mapFontesParaRecomendacoes,
  buildRecomendacao,
  linkPorContexto
};
