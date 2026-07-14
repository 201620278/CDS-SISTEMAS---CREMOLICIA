/**
 * WorkflowService — Orquestração operacional derivada (sem persistência).
 *
 * Sprint O-11: combina Pendências + Recomendações + Playbooks em filas de workflow.
 *
 * @module motores/motor-comercial/services/workflow/WorkflowService
 */

const SLA_HORAS = Object.freeze({
  URGENT: 4,
  CRITICAL: 4,
  HIGH: 24,
  NORMAL: 72,
  MEDIUM: 48,
  LOW: 168,
  INFO: 168
});

const COLUNAS = Object.freeze({
  NOVO: 'novo',
  EM_ANDAMENTO: 'emAndamento',
  AGUARDANDO: 'aguardando',
  BLOQUEADO: 'bloqueado',
  CONCLUIDO: 'concluido'
});

function normalizarPrioridade(prioridade, severidade) {
  const pri = String(prioridade || 'NORMAL').toUpperCase();
  const sev = String(severidade || '').toUpperCase();
  if (pri === 'URGENT' || sev === 'CRITICAL') return 'URGENT';
  if (pri === 'HIGH' || sev === 'HIGH') return 'HIGH';
  if (pri === 'LOW' || sev === 'INFO' || sev === 'LOW') return 'LOW';
  return 'NORMAL';
}

function horasSla(prioridade, severidade) {
  const pri = normalizarPrioridade(prioridade, severidade);
  if (String(severidade || '').toUpperCase() === 'CRITICAL') return SLA_HORAS.CRITICAL;
  return SLA_HORAS[pri] || SLA_HORAS.NORMAL;
}

function calcularSla(prioridade, severidade, dataInicio) {
  const horas = horasSla(prioridade, severidade);
  const inicio = new Date(dataInicio || Date.now());
  const prazo = new Date(inicio.getTime() + horas * 3600000);
  const agora = Date.now();
  const restanteMs = prazo.getTime() - agora;
  const limiteAlerta = horas * 0.2 * 3600000;

  let indicador = 'verde';
  let status = 'DENTRO';
  if (restanteMs < 0) {
    indicador = 'vermelho';
    status = 'VENCIDO';
  } else if (restanteMs <= limiteAlerta) {
    indicador = 'amarelo';
    status = 'PROXIMO';
  }

  return {
    horasSla: horas,
    prazo: prazo.toISOString(),
    restanteMinutos: Math.max(0, Math.round(restanteMs / 60000)),
    excedidoMinutos: restanteMs < 0 ? Math.round(Math.abs(restanteMs) / 60000) : 0,
    status,
    indicador
  };
}

function buildWorkflowId(origem, origemId, clienteId, consignacaoId) {
  const base = [
    String(origem || 'WF'),
    String(origemId || '0'),
    String(clienteId || '0'),
    String(consignacaoId || '0')
  ].join('-');
  return `WF-${base.replace(/[^a-zA-Z0-9-_]/g, '')}`;
}

function inferirColuna(item) {
  if (item.bloqueado || item.tipoOrigem === 'BLOQUEIO') return COLUNAS.BLOQUEADO;
  if (item.statusOperacional === 'CONCLUIDO') return COLUNAS.CONCLUIDO;
  if (item.statusOperacional === 'EM_ANDAMENTO') return COLUNAS.EM_ANDAMENTO;
  if (item.statusOperacional === 'AGUARDANDO') return COLUNAS.AGUARDANDO;
  if (['CLIENTE_BLOQUEADO', 'BLOQUEIO'].includes(String(item.tipo || '').toUpperCase())) {
    return COLUNAS.BLOQUEADO;
  }
  return COLUNAS.NOVO;
}

class WorkflowService {
  /**
   * @param {Object} input
   * @param {Object} [input.pendencias]
   * @param {Object} [input.recomendacoes]
   * @param {Object} [input.playbooks]
   * @param {string} [input.clienteId]
   * @returns {Object}
   */
  executar(input = {}) {
    const pendencias = input.pendencias || {};
    const recomendacoes = input.recomendacoes || {};
    const playbooks = input.playbooks || {};
    const items = [];

    (pendencias.alertas || []).forEach((alerta) => {
      const prioridade = normalizarPrioridade(alerta.prioridade, alerta.severidade);
      const sla = calcularSla(alerta.prioridade, alerta.severidade, alerta.data);
      const workflowId = buildWorkflowId('PEND', alerta.id, alerta.clienteId, alerta.consignacaoId);

      items.push({
        id: workflowId,
        origemId: alerta.id,
        origemTipo: 'PENDENCIA',
        titulo: alerta.descricao || alerta.tipo,
        cliente: alerta.cliente || (alerta.clienteId ? `Cliente #${alerta.clienteId}` : '—'),
        clienteId: alerta.clienteId || null,
        consignacaoId: alerta.consignacaoId || null,
        documento: alerta.documento || null,
        playbook: null,
        playbookId: null,
        categoria: alerta.categoria || 'OPERACIONAL',
        prioridade,
        responsavel: alerta.responsavel || 'Não atribuído',
        status: alerta.status || 'PENDENTE',
        statusOperacional: 'NOVO',
        coluna: COLUNAS.NOVO,
        bloqueado: ['CLIENTE_BLOQUEADO', 'BLOQUEIO'].includes(String(alerta.tipo || '').toUpperCase()),
        tipo: alerta.tipo,
        link: alerta.link,
        dataInicio: alerta.data || new Date().toISOString(),
        sla,
        pendenciasRelacionadas: [alerta.id],
        recomendacoesRelacionadas: [],
        playbooksRelacionados: [],
        tempoDecorridoMinutos: this._minutosDesde(alerta.data),
        progressoPercentual: 0
      });
    });

    (recomendacoes.recomendacoes || []).forEach((rec) => {
      const prioridade = normalizarPrioridade(rec.prioridade, rec.severidade);
      const sla = calcularSla(rec.prioridade, rec.severidade, rec.data);
      const workflowId = buildWorkflowId('REC', rec.id, rec.clienteId, rec.consignacaoId);
      const statusOp = String(rec.status || 'NOVA').toUpperCase() === 'NOVA' ? 'AGUARDANDO' : 'EM_ANDAMENTO';

      items.push({
        id: workflowId,
        origemId: rec.id,
        origemTipo: 'RECOMENDACAO',
        titulo: rec.titulo,
        cliente: rec.cliente || (rec.clienteId ? `Cliente #${rec.clienteId}` : '—'),
        clienteId: rec.clienteId || null,
        consignacaoId: rec.consignacaoId || null,
        documento: rec.documento || null,
        playbook: null,
        playbookId: null,
        categoria: rec.categoria || 'COMERCIAL',
        prioridade,
        responsavel: rec.responsavel || 'Não atribuído',
        status: rec.status || 'NOVA',
        statusOperacional: statusOp,
        coluna: statusOp === 'AGUARDANDO' ? COLUNAS.AGUARDANDO : COLUNAS.EM_ANDAMENTO,
        bloqueado: false,
        tipo: rec.tipo,
        link: rec.link,
        dataInicio: rec.data || new Date().toISOString(),
        sla,
        pendenciasRelacionadas: rec.insightRelacionado ? [rec.insightRelacionado] : [],
        recomendacoesRelacionadas: [rec.id],
        playbooksRelacionados: [],
        tempoDecorridoMinutos: this._minutosDesde(rec.data),
        progressoPercentual: 0
      });
    });

    (playbooks.sugeridos || playbooks.playbooks || [])
      .filter((pb) => (pb.score ?? 0) > 0 || pb.aplicavel !== false)
      .slice(0, 20)
      .forEach((pb) => {
        const prioridade = pb.score >= 80 ? 'HIGH' : 'NORMAL';
        const sla = calcularSla(prioridade, null, new Date().toISOString());
        const workflowId = buildWorkflowId('PB', pb.id, pb.clienteId, null);

        items.push({
          id: workflowId,
          origemId: pb.id,
          origemTipo: 'PLAYBOOK',
          titulo: pb.nome,
          cliente: pb.clienteId ? `Cliente #${pb.clienteId}` : '—',
          clienteId: pb.clienteId || null,
          consignacaoId: null,
          documento: pb.codigo || null,
          playbook: pb.nome,
          playbookId: pb.id,
          categoria: pb.categoria || 'OPERACIONAL',
          prioridade,
          responsavel: 'Não atribuído',
          status: 'DISPONIVEL',
          statusOperacional: 'NOVO',
          coluna: COLUNAS.NOVO,
          bloqueado: false,
          tipo: pb.categoria,
          link: `/playbooks?playbookId=${encodeURIComponent(pb.id)}`,
          dataInicio: new Date().toISOString(),
          sla,
          pendenciasRelacionadas: pb.insightsRelacionados || [],
          recomendacoesRelacionadas: pb.recomendacoesRelacionadas || [],
          playbooksRelacionados: [pb.id],
          tempoDecorridoMinutos: 0,
          tempoPrevistoMinutos: pb.tempoEstimadoMinutos || null,
          progressoPercentual: 0
        });
      });

    const dedup = this._deduplicarPorCliente(items);
    dedup.forEach((item) => {
      item.coluna = inferirColuna(item);
    });

    const kanban = {
      novo: [],
      emAndamento: [],
      aguardando: [],
      bloqueado: [],
      concluido: []
    };

    dedup.forEach((item) => {
      const key = item.coluna || COLUNAS.NOVO;
      if (kanban[key]) kanban[key].push(item);
      else kanban.novo.push(item);
    });

    const fila = [...dedup].sort((a, b) => {
      const pri = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };
      const pa = pri[a.prioridade] || 0;
      const pb = pri[b.prioridade] || 0;
      if (pb !== pa) return pb - pa;
      return (a.sla.restanteMinutos || 0) - (b.sla.restanteMinutos || 0);
    });

    const slaIndicadores = {
      dentroPrazo: dedup.filter((i) => i.sla.status === 'DENTRO').length,
      proximoVencimento: dedup.filter((i) => i.sla.status === 'PROXIMO').length,
      vencido: dedup.filter((i) => i.sla.status === 'VENCIDO').length,
      itens: dedup.map((i) => ({
        id: i.id,
        titulo: i.titulo,
        indicador: i.sla.indicador,
        status: i.sla.status,
        restanteMinutos: i.sla.restanteMinutos,
        excedidoMinutos: i.sla.excedidoMinutos,
        prazo: i.sla.prazo
      }))
    };

    const distribuicao = this._distribuirPorOperador(dedup);
    const timeline = dedup
      .slice(0, 30)
      .map((i) => ({
        id: i.id,
        titulo: i.titulo,
        data: i.dataInicio,
        tipo: i.origemTipo,
        prioridade: i.prioridade,
        cliente: i.cliente,
        sla: i.sla.indicador
      }));

    const ativos = dedup.filter((i) => i.coluna !== COLUNAS.CONCLUIDO);
    const concluidos = dedup.filter((i) => i.coluna === COLUNAS.CONCLUIDO);
    const emAtraso = dedup.filter((i) => i.sla.status === 'VENCIDO').length;
    const tempos = dedup.map((i) => i.tempoDecorridoMinutos).filter((t) => t > 0);
    const tempoMedio = tempos.length
      ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length)
      : null;

    const resumo = {
      workflowsAtivos: ativos.length,
      concluidosHoje: concluidos.length,
      bloqueados: kanban.bloqueado.length,
      emAtraso,
      tempoMedioMinutos: tempoMedio,
      slaCumprido: dedup.length
        ? Math.round(((dedup.length - emAtraso) / dedup.length) * 100)
        : 100,
      slaVencido: emAtraso,
      eficiencia: dedup.length
        ? Math.round(((dedup.length - emAtraso) / dedup.length) * 100)
        : 100,
      total: dedup.length
    };

    return {
      resumo,
      fila,
      workflows: dedup,
      kanban,
      sla: slaIndicadores,
      distribuicao,
      timeline,
      historico: timeline.slice(0, 15)
    };
  }

  _minutosDesde(data) {
    if (!data) return 0;
    const diff = Date.now() - new Date(data).getTime();
    return diff > 0 ? Math.round(diff / 60000) : 0;
  }

  _deduplicarPorCliente(items) {
    const map = new Map();
    items.forEach((item) => {
      const key = `${item.clienteId || '0'}:${item.consignacaoId || '0'}:${item.origemTipo}:${item.origemId}`;
      if (!map.has(key)) {
        map.set(key, { ...item });
        return;
      }
      const existing = map.get(key);
      existing.pendenciasRelacionadas = [
        ...new Set([...(existing.pendenciasRelacionadas || []), ...(item.pendenciasRelacionadas || [])])
      ];
      existing.recomendacoesRelacionadas = [
        ...new Set([...(existing.recomendacoesRelacionadas || []), ...(item.recomendacoesRelacionadas || [])])
      ];
      existing.playbooksRelacionados = [
        ...new Set([...(existing.playbooksRelacionados || []), ...(item.playbooksRelacionados || [])])
      ];
    });
    return [...map.values()];
  }

  _distribuirPorOperador(items) {
    const map = new Map();
    items.forEach((item) => {
      const op = item.responsavel || 'Não atribuído';
      if (!map.has(op)) {
        map.set(op, {
          operador: op,
          quantidade: 0,
          tempoMedioMinutos: 0,
          eficiencia: 100,
          slaVencido: 0,
          _tempos: []
        });
      }
      const row = map.get(op);
      row.quantidade += 1;
      if (item.tempoDecorridoMinutos) row._tempos.push(item.tempoDecorridoMinutos);
      if (item.sla.status === 'VENCIDO') row.slaVencido += 1;
    });

    return [...map.values()].map((row) => {
      const tempos = row._tempos;
      const tempoMedio = tempos.length
        ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length)
        : null;
      const eficiencia = row.quantidade
        ? Math.round(((row.quantidade - row.slaVencido) / row.quantidade) * 100)
        : 100;
      return {
        operador: row.operador,
        quantidade: row.quantidade,
        tempoMedioMinutos: tempoMedio,
        eficiencia,
        slaVencido: row.slaVencido
      };
    });
  }
}

module.exports = {
  WorkflowService,
  COLUNAS,
  calcularSla,
  buildWorkflowId,
  horasSla
};
