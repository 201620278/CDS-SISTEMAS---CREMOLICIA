/**
 * CDS Mobile RC2 — Financeiro operacional
 */
import {
  escapeHtml,
  asText,
  formatMoney,
  formatDate,
  formatDateTime,
  loadingHtml,
  emptyHtml,
  errorHtml,
  listCardHtml,
  kpiHtml,
  sectionTitleHtml,
  backBarHtml,
  bindBack,
  bindGo,
  countLabel
} from '../ui.js';
import { confirmSheet, fieldHtml, promptSheet, showTextSheet } from '../forms.js';
import { showToast } from '../toast.js';
import { canDoAction } from '../permissions.js';
import { getTerminalRequestBody } from '../terminal.js';

function pickMoney(obj, keys) {
  for (const key of keys) {
    if (obj && obj[key] != null && obj[key] !== '') return Number(obj[key]);
  }
  return null;
}

function unwrapList(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

function tabsBar(active) {
  const tabs = [
    { id: 'resumo', route: 'financeiro', label: 'Resumo' },
    { id: 'receber', route: 'financeiro/receber', label: 'A receber' },
    { id: 'agrupado', route: 'financeiro/agrupado', label: 'Por cliente' },
    { id: 'pagar', route: 'financeiro/pagar', label: 'A pagar' },
    { id: 'fluxo', route: 'financeiro/fluxo', label: 'Fluxo' },
    { id: 'historico', route: 'financeiro/historico', label: 'Histórico' }
  ];
  return `
    <div class="cds-tabs" role="tablist">
      ${tabs.map((t) => `
        <button type="button" class="cds-tabs__item ${t.id === active ? 'is-active' : ''}"
          data-go="${t.route}">${escapeHtml(t.label)}</button>
      `).join('')}
    </div>
  `;
}

function cardLancamento(item, kind) {
  const id = item.id || item.financeiro_id || item.conta_id;
  const status = String(item.status || item.situacao || '').toLowerCase();
  const baixado = ['recebido', 'pago', 'baixado', 'liquidado'].includes(status);
  return listCardHtml({
    go: id ? `financeiro/lancamento/${id}` : undefined,
    title: asText(
      item.descricao || item.historico || item.cliente_nome || item.fornecedor_nome,
      'Lançamento'
    ),
    value: formatMoney(item.valor ?? item.valor_aberto ?? item.saldo ?? 0),
    status: item.status || item.situacao,
    meta: [
      formatDate(item.vencimento || item.data_vencimento || item.data),
      asText(kind || item.tipo || item.natureza, ''),
      baixado ? 'Baixado' : 'Em aberto'
    ].filter((x) => x && x !== '—')
  });
}

async function renderResumo(root) {
  root.innerHTML = loadingHtml('Carregando financeiro…');
  try {
    const settled = await Promise.allSettled([
      window.CDSApi.get('financeiro/resumo'),
      window.CDSApi.get('financeiro/dashboard'),
      window.CDSApi.get('financeiro/proximos-vencimentos')
    ]);
    const resumo = settled[0].status === 'fulfilled' ? settled[0].value : {};
    const dash = settled[1].status === 'fulfilled' ? settled[1].value : {};
    const venc = settled[2].status === 'fulfilled' ? unwrapList(settled[2].value) : [];
    const src = { ...dash, ...resumo };

    root.innerHTML = `
      ${tabsBar('resumo')}
      <div class="cds-kpi-grid" style="margin-top:12px">
        ${kpiHtml({
          label: 'A receber',
          value: formatMoney(pickMoney(src, ['total_receber', 'a_receber', 'receber', 'contas_receber']) || 0)
        })}
        ${kpiHtml({
          label: 'A pagar',
          value: formatMoney(pickMoney(src, ['total_pagar', 'a_pagar', 'pagar', 'contas_pagar']) || 0)
        })}
        ${kpiHtml({
          label: 'Saldo',
          value: formatMoney(pickMoney(src, ['saldo', 'saldo_caixa', 'fluxo']) || 0)
        })}
      </div>
      ${sectionTitleHtml('Próximos vencimentos')}
      <div>
        ${venc.length
          ? venc.slice(0, 15).map((i) => cardLancamento(i)).join('')
          : emptyHtml('Sem vencimentos próximos')}
      </div>
    `;
    bindGo(root);
  } catch (err) {
    root.innerHTML = errorHtml(err.message, err.status);
  }
}

async function renderLista(root, kind) {
  root.innerHTML = loadingHtml(`Carregando ${kind}…`);
  const path = kind === 'receber' ? 'financeiro/receber' : 'financeiro/pagar';
  try {
    let rows = unwrapList(await window.CDSApi.get(path));
    if (!rows.length) {
      try {
        rows = unwrapList(await window.CDSApi.get(kind === 'receber' ? 'financeiro/contas-receber' : 'financeiro/contas-pagar'));
      } catch (e) { /* ignore */ }
    }
    root.innerHTML = `
      ${tabsBar(kind)}
      ${kind === 'pagar' && canDoAction('financeiro_baixar') ? `
        <div style="margin:12px 0">
          <button type="button" class="cds-mobile-btn cds-mobile-btn--secondary" id="fin-nova-despesa" style="width:100%">Nova despesa</button>
        </div>
      ` : ''}
      <p class="cds-muted" style="margin-top:12px">${escapeHtml(countLabel(rows.length, 'lançamento', 'lançamentos'))}</p>
      <div>
        ${rows.length
          ? rows.slice(0, 50).map((i) => cardLancamento(i, kind)).join('')
          : emptyHtml('Nenhum lançamento')}
      </div>
    `;
    bindGo(root);

    root.querySelector('#fin-nova-despesa')?.addEventListener('click', async () => {
      const data = await promptSheet({
        title: 'Nova despesa',
        confirmLabel: 'Salvar',
        fieldsHtml: [
          fieldHtml({ name: 'descricao', label: 'Descrição', required: true }),
          fieldHtml({ name: 'valor', label: 'Valor', type: 'number', required: true, inputmode: 'decimal' }),
          fieldHtml({ name: 'vencimento', label: 'Vencimento', type: 'date', value: new Date().toISOString().slice(0, 10) }),
          fieldHtml({ name: 'fornecedor', label: 'Fornecedor' })
        ].join('')
      });
      if (!data?.descricao) return;
      try {
        await window.CDSApi.post('financeiro', {
          tipo: 'despesa',
          natureza: 'despesa',
          descricao: data.descricao,
          valor: Number(data.valor),
          vencimento: data.vencimento,
          fornecedor: data.fornecedor || null,
          status: 'aberto'
        });
        showToast('Despesa criada.', 'success');
        window.CDSMobile?.navigate?.('financeiro/pagar', { replace: true });
      } catch (err) {
        showToast(err.message || 'Falha ao criar despesa', 'error');
      }
    });
  } catch (err) {
    root.innerHTML = `${tabsBar(kind)}${errorHtml(err.message, err.status)}`;
    bindGo(root);
  }
}

async function renderAgrupado(root) {
  root.innerHTML = loadingHtml('Carregando dívidas por cliente…');
  try {
    const rows = unwrapList(await window.CDSApi.get('financeiro/receber/agrupado'));
    root.innerHTML = `
      ${tabsBar('agrupado')}
      <p class="cds-muted" style="margin-top:12px">${escapeHtml(countLabel(rows.length, 'cliente', 'clientes'))}</p>
      <div>
        ${rows.length
          ? rows.slice(0, 50).map((r) => listCardHtml({
              go: `financeiro/cliente/${r.cliente_id || r.id}`,
              title: asText(r.cliente_nome || r.nome, 'Cliente'),
              value: formatMoney(r.total_aberto ?? r.saldo ?? r.total ?? 0),
              meta: [asText(r.qtd_titulos || r.quantidade, '')].filter(Boolean)
            })).join('')
          : emptyHtml('Nenhuma dívida agrupada')}
      </div>
    `;
    bindGo(root);
  } catch (err) {
    root.innerHTML = `${tabsBar('agrupado')}${errorHtml(err.message, err.status)}`;
    bindGo(root);
  }
}

async function renderClienteFinanceiro(root, clienteId) {
  root.innerHTML = loadingHtml('Carregando cliente…');
  try {
    const data = await window.CDSApi.get(`financeiro/receber/agrupado/${clienteId}`);
    const titulos = unwrapList(data?.titulos || data?.contas || data);
    root.innerHTML = `
      ${backBarHtml('Financeiro')}
      <article class="cds-card">
        <h3 class="cds-card__title">${escapeHtml(asText(data?.cliente_nome || data?.nome, `Cliente #${clienteId}`))}</h3>
        <div class="cds-row"><span>Em aberto</span><strong>${escapeHtml(formatMoney(data?.total_aberto ?? data?.saldo ?? 0))}</strong></div>
      </article>
      <div class="cds-stack" style="margin:12px 0">
        ${canDoAction('financeiro_baixar') ? `<button type="button" class="cds-mobile-btn" id="fin-parcial">Pagamento parcial</button>` : ''}
        <button type="button" class="cds-mobile-btn cds-mobile-btn--secondary" id="fin-extrato">Ver extrato</button>
      </div>
      <div>
        ${titulos.length
          ? titulos.map((t) => cardLancamento(t, 'receber')).join('')
          : emptyHtml('Sem títulos')}
      </div>
    `;
    bindBack(root);
    bindGo(root);

    root.querySelector('#fin-parcial')?.addEventListener('click', async () => {
      const dataForm = await promptSheet({
        title: 'Pagamento parcial',
        confirmLabel: 'Registrar',
        fieldsHtml: [
          fieldHtml({ name: 'valor', label: 'Valor', type: 'number', required: true, inputmode: 'decimal' }),
          fieldHtml({ name: 'forma_pagamento', label: 'Forma', value: 'dinheiro' })
        ].join('')
      });
      if (!dataForm?.valor) return;
      try {
        await window.CDSApi.post(
          `financeiro/receber/agrupado/${clienteId}/pagamento-parcial`,
          getTerminalRequestBody({
            valor: Number(dataForm.valor),
            forma_pagamento: dataForm.forma_pagamento || 'dinheiro'
          })
        );
        showToast('Pagamento parcial registrado.', 'success');
        window.CDSMobile?.navigate?.(`financeiro/cliente/${clienteId}`, { replace: true });
      } catch (err) {
        showToast(err.message || 'Falha (verifique caixa aberto).', 'error');
      }
    });

    root.querySelector('#fin-extrato')?.addEventListener('click', async () => {
      try {
        const extrato = await window.CDSApi.get(`financeiro/receber/agrupado/${clienteId}/extrato`);
        const txt = typeof extrato === 'string' ? extrato : JSON.stringify(extrato, null, 2);
        showTextSheet({ title: 'Extrato', text: txt.slice(0, 3500) });
      } catch (err) {
        showToast(err.message || 'Extrato indisponível', 'error');
      }
    });
  } catch (err) {
    root.innerHTML = `${backBarHtml('Voltar')}${errorHtml(err.message, err.status)}`;
    bindBack(root);
  }
}

async function renderFluxo(root) {
  root.innerHTML = loadingHtml('Carregando fluxo…');
  try {
    let data = {};
    try {
      data = await window.CDSApi.get('financeiro/relatorios/fluxo');
    } catch (e) {
      data = await window.CDSApi.get('financeiro/resumo');
    }
    const entradas = pickMoney(data, ['entradas', 'receitas', 'total_entradas']) || 0;
    const saidas = pickMoney(data, ['saidas', 'despesas', 'total_saidas']) || 0;
    root.innerHTML = `
      ${tabsBar('fluxo')}
      <div class="cds-kpi-grid" style="margin-top:12px">
        ${kpiHtml({ label: 'Entradas', value: formatMoney(entradas) })}
        ${kpiHtml({ label: 'Saídas', value: formatMoney(saidas) })}
        ${kpiHtml({ label: 'Saldo', value: formatMoney(entradas - saidas) })}
      </div>
      <p class="cds-muted">Fluxo consolidado via APIs existentes do ERP.</p>
    `;
    bindGo(root);
  } catch (err) {
    root.innerHTML = `${tabsBar('fluxo')}${errorHtml(err.message, err.status)}`;
    bindGo(root);
  }
}

async function renderHistorico(root) {
  root.innerHTML = loadingHtml('Carregando histórico…');
  try {
    let rows = [];
    try {
      rows = unwrapList(await window.CDSApi.get('financeiro/ultimas-movimentacoes'));
    } catch (e) {
      rows = unwrapList(await window.CDSApi.get('financeiro', { status: 'recebido' }));
    }
    root.innerHTML = `
      ${tabsBar('historico')}
      <p class="cds-muted" style="margin-top:12px">${escapeHtml(countLabel(rows.length, 'movimento', 'movimentos'))}</p>
      <div>
        ${rows.length
          ? rows.slice(0, 50).map((i) => cardLancamento(i, 'hist')).join('')
          : emptyHtml('Sem histórico')}
      </div>
    `;
    bindGo(root);
  } catch (err) {
    root.innerHTML = `${tabsBar('historico')}${errorHtml(err.message, err.status)}`;
    bindGo(root);
  }
}

async function renderDetalhe(root, id) {
  root.innerHTML = loadingHtml('Carregando lançamento…');
  try {
    let item;
    try {
      item = await window.CDSApi.get(`financeiro/${id}`);
    } catch (e) {
      item = { id, descricao: `Lançamento #${id}` };
    }
    const status = String(item.status || '').toLowerCase();
    const baixado = ['recebido', 'pago', 'baixado', 'liquidado'].includes(status);
    const tipo = String(item.tipo || item.natureza || '').toLowerCase();
    const isReceber = tipo.includes('receit') || tipo.includes('receber') || item.cliente_id;
    const isPagar = tipo.includes('despes') || tipo.includes('pagar') || item.fornecedor_id;

    root.innerHTML = `
      ${backBarHtml('Financeiro')}
      <article class="cds-card">
        <div class="cds-row"><span>ID</span><strong>${escapeHtml(asText(item.id || id))}</strong></div>
        <div class="cds-row"><span>Descrição</span><strong>${escapeHtml(asText(item.descricao || item.historico, '—'))}</strong></div>
        <div class="cds-row"><span>Valor</span><strong>${escapeHtml(formatMoney(item.valor ?? item.valor_aberto ?? 0))}</strong></div>
        <div class="cds-row"><span>Status</span><strong>${escapeHtml(asText(item.status, '—'))}</strong></div>
        <div class="cds-row"><span>Vencimento</span><strong>${escapeHtml(formatDate(item.vencimento || item.data_vencimento))}</strong></div>
        <div class="cds-row"><span>Baixado em</span><strong>${escapeHtml(formatDateTime(item.baixado_em || item.data_baixa) || '—')}</strong></div>
      </article>
      <div class="cds-action-bar">
        ${!baixado && canDoAction('financeiro_baixar') ? `
          <button type="button" class="cds-mobile-btn" id="fin-baixar">Baixar</button>
        ` : ''}
        ${baixado && canDoAction('financeiro_admin') ? `
          <button type="button" class="cds-mobile-btn cds-mobile-btn--danger" id="fin-estorno">Estornar / excluir</button>
        ` : ''}
      </div>
    `;
    bindBack(root);

    root.querySelector('#fin-baixar')?.addEventListener('click', async () => {
      const ok = await confirmSheet({
        title: 'Baixar lançamento',
        message: 'Confirmar baixa financeira?',
        confirmLabel: 'Baixar'
      });
      if (!ok) return;
      try {
        if (isPagar && !isReceber) {
          await window.CDSApi.post(`financeiro/pagar/${id}/baixar`, {
            valor: item.valor,
            forma_pagamento: 'dinheiro'
          });
        } else {
          await window.CDSApi.post(
            `financeiro/receber/${id}/baixar`,
            getTerminalRequestBody({})
          );
        }
        showToast('Baixa realizada.', 'success');
        window.CDSMobile?.navigate?.(`financeiro/lancamento/${id}`, { replace: true });
      } catch (err) {
        showToast(err.message || 'Falha na baixa (verifique caixa aberto).', 'error');
      }
    });

    root.querySelector('#fin-estorno')?.addEventListener('click', async () => {
      const ok = await confirmSheet({
        title: 'Estornar / excluir',
        message: 'Remove o lançamento via API existente. Confirmar?',
        confirmLabel: 'Excluir',
        danger: true
      });
      if (!ok) return;
      try {
        await window.CDSApi.del(`financeiro/${id}`);
        showToast('Lançamento removido.', 'success');
        window.CDSMobile?.navigate?.('financeiro', { replace: true });
      } catch (err) {
        showToast(err.message || 'Falha no estorno', 'error');
      }
    });
  } catch (err) {
    root.innerHTML = `${backBarHtml('Voltar')}${errorHtml(err.message, err.status)}`;
    bindBack(root);
  }
}

export async function render(root, parsed) {
  const parts = parsed?.parts || [];
  if (parts[1] === 'lancamento' && parts[2]) return renderDetalhe(root, parts[2]);
  if (parts[1] === 'cliente' && parts[2]) return renderClienteFinanceiro(root, parts[2]);
  if (parts[1] === 'receber') return renderLista(root, 'receber');
  if (parts[1] === 'pagar') return renderLista(root, 'pagar');
  if (parts[1] === 'agrupado') return renderAgrupado(root);
  if (parts[1] === 'fluxo') return renderFluxo(root);
  if (parts[1] === 'historico') return renderHistorico(root);
  return renderResumo(root);
}

export default { render, title: 'Financeiro', subtitle: 'Operacional' };
