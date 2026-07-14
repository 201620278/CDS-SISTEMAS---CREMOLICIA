/**
 * Fechar Consignação — interface operacional UX-05.
 *
 * @module frontend/modules/motor-comercial/pages/PrestacaoContas/FecharConsignacaoView
 */

const Button = require('../../components/base/Button');
const Input = require('../../components/form/Input');
const Select = require('../../components/form/Select');
const Textarea = require('../../components/form/Textarea');
const Loading = require('../../components/base/Loading');
const EmptyState = require('../../components/base/EmptyState');
const Alert = require('../../components/base/Alert');
const {
  buildPainelLateral,
  buildResumoEntrega,
  buildCentralEncerramento,
  buildValidacoesFinais,
  buildResumoFinalOficial,
  consignacaoElegivelParaPrestacao,
  CAMPOS_RETORNO_ORDEM,
  calcularSaldoItem,
  formatCurrency,
  formatDate
} = require('./fecharConsignacaoMappers');

class FecharConsignacaoView {
  static renderMomento(momento, state, ctx) {
    switch (momento) {
      case 'conferir': return FecharConsignacaoView.renderConferir(state, ctx);
      case 'retornos': return FecharConsignacaoView.renderRetornos(state, ctx);
      case 'pagamento': return FecharConsignacaoView.renderPagamento(state, ctx);
      case 'conferencia': return FecharConsignacaoView.renderConferenciaFinal(state, ctx);
      case 'encerramento': return FecharConsignacaoView.renderEncerramento(state, ctx);
      default: return document.createElement('div');
    }
  }

  static renderConferir(state, ctx) {
    const wrap = document.createElement('div');
    wrap.className = 'cds-fechar-consignacao__momento';

    const title = document.createElement('h2');
    title.className = 'cds-fechar-consignacao__titulo';
    title.textContent = 'O que falta para concluir este atendimento?';
    wrap.appendChild(title);

    const hint = document.createElement('p');
    hint.className = 'cds-fechar-consignacao__hint';
    hint.textContent = 'Confira os produtos entregues antes de registrar retornos.';
    wrap.appendChild(hint);

    if (!consignacaoElegivelParaPrestacao(state.consignacao || {})) {
      wrap.appendChild(Alert.create({
        message: 'Esta consignação ainda não foi entregue. Conclua a entrega antes de iniciar o fechamento.',
        variant: 'warning',
        dismissible: false
      }));
    }

    const resumo = buildResumoEntrega(state.consignacao, state.resumoPrestacao);
    const info = document.createElement('div');
    info.className = 'cds-fechar-consignacao__info-grid';
    [
      { label: 'Cliente', value: resumo.cliente },
      { label: 'Documento', value: resumo.documento },
      { label: 'Data da Entrega', value: resumo.dataEntrega },
      { label: 'Valor Entregue', value: formatCurrency(resumo.valorEntregue) },
      { label: 'Itens', value: String(resumo.quantidadeItens) }
    ].forEach((f) => {
      const cell = document.createElement('div');
      cell.innerHTML = `<label>${f.label}</label><strong>${f.value}</strong>`;
      info.appendChild(cell);
    });
    wrap.appendChild(info);

    const lista = document.createElement('div');
    lista.className = 'cds-fechar-consignacao__lista-produtos';

    const itens = state.resumoPrestacao?.itens || [];
    if (!itens.length) {
      lista.appendChild(EmptyState.create({
        title: 'Sem produtos',
        description: 'Nenhum item encontrado nesta consignação'
      }));
    } else {
      const head = document.createElement('div');
      head.className = 'cds-fechar-consignacao__grade-head';
      head.innerHTML = '<span>Produto</span><span>Entregue</span><span>Registrado</span><span>Pendente</span>';
      lista.appendChild(head);

      itens.forEach((item) => {
        const registrado = Number(item.vendido || 0) + Number(item.devolvido || 0)
          + Number(item.perdido || 0) + Number(item.cortesia || 0);
        const row = document.createElement('div');
        row.className = 'cds-fechar-consignacao__grade-row';
        row.innerHTML = `
          <span><strong>${item.produto}</strong></span>
          <span>${item.enviado ?? item.quantidade ?? 0}</span>
          <span>${registrado}</span>
          <span>${item.saldo ?? 0}</span>
        `;
        lista.appendChild(row);
      });
    }

    wrap.appendChild(lista);
    return wrap;
  }

  static renderRetornos(state, ctx) {
    const wrap = document.createElement('div');
    wrap.className = 'cds-fechar-consignacao__momento cds-fechar-consignacao__momento--grade-fill';

    const title = document.createElement('h2');
    title.className = 'cds-fechar-consignacao__titulo cds-fechar-consignacao__titulo--compact';
    title.textContent = 'Registrar Retornos';
    wrap.appendChild(title);

    wrap.appendChild(FecharConsignacaoView._renderAtalhos());

    const alerta = document.createElement('div');
    alerta.id = 'fechar-conferencia-alerta';
    alerta.className = 'cds-fechar-consignacao__conferencia-alerta';
    alerta.hidden = !state.conferenciaAlerta;
    if (state.conferenciaAlerta) {
      alerta.innerHTML = `<strong>${state.conferenciaAlerta}</strong>`;
    }
    wrap.appendChild(alerta);

    const itens = state.resumoPrestacao?.itens || [];
    if (!itens.length) {
      wrap.appendChild(EmptyState.create({
        title: 'Sem produtos',
        description: 'Não há itens para registrar'
      }));
      return wrap;
    }

    const gradeHost = document.createElement('div');
    gradeHost.className = 'cds-fechar-consignacao__grade-scroll';

    const table = document.createElement('div');
    table.className = 'cds-fechar-consignacao__grade-retornos';
    table.id = 'fechar-retornos-grade';

    const head = document.createElement('div');
    head.className = 'cds-fechar-consignacao__grade-head cds-fechar-consignacao__grade-head--retornos';
    head.innerHTML = `
      <span>Produto</span><span>Entregue</span><span>Devolvido</span><span>Vendido</span>
      <span>Perda</span><span>Cortesia</span><span>Saldo</span><span>Obs.</span><span>Status</span>
    `;
    table.appendChild(head);

    itens.forEach((item, index) => {
      table.appendChild(FecharConsignacaoView._renderLinhaRetorno(item, index, state, ctx));
    });

    gradeHost.appendChild(table);
    wrap.appendChild(gradeHost);
    return wrap;
  }

  static _renderLinhaRetorno(item, index, state, ctx) {
    const editing = state.editing?.rowIndex === index;
    const linhaErro = state.linhasComErro?.[index];
    const row = document.createElement('div');
    row.className = `cds-fechar-consignacao__grade-row cds-fechar-consignacao__grade-row--retornos${editing ? ' cds-fechar-consignacao__grade-row--editando' : ''}${linhaErro ? ' cds-fechar-consignacao__grade-row--erro' : ''}`;
    row.dataset.rowIndex = String(index);

    const prod = document.createElement('span');
    prod.innerHTML = `<strong>${item.produto}</strong>`;
    row.appendChild(prod);

    const entregue = document.createElement('span');
    entregue.textContent = String(item.enviado ?? 0);
    row.appendChild(entregue);

    ['devolvido', 'vendido', 'perdido', 'cortesia'].forEach((campo) => {
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.step = '1';
      input.value = String(item[campo] || 0);
      input.className = 'cds-fechar-consignacao__qty-input';
      input.dataset.campo = campo;
      input.disabled = Boolean(state.loading?.operation && state.lineStatus?.[`${index}-${campo}`]?.state === 'saving');
      if (state.focus?.rowIndex === index && state.focus?.campo === campo) {
        input.dataset.autofocus = 'true';
      }

      const emitDraft = () => ctx.onItemDraft(index, campo, input.value);
      input.addEventListener('focus', () => ctx.onItemFocus(index, campo));
      input.addEventListener('input', emitDraft);
      input.addEventListener('change', emitDraft);
      input.addEventListener('keydown', (e) => ctx.onItemKeydown(e, index, campo, input));
      input.addEventListener('blur', () => ctx.onItemBlur(index, campo, input.value));
      row.appendChild(input);
    });

    const saldo = document.createElement('span');
    saldo.className = 'cds-fechar-consignacao__saldo-cell';
    saldo.dataset.saldoIndex = String(index);
    saldo.textContent = String(item.saldo ?? calcularSaldoItem(item));
    row.appendChild(saldo);

    const obs = document.createElement('input');
    obs.type = 'text';
    obs.placeholder = 'Obs.';
    obs.value = item.observacao || '';
    obs.className = 'cds-fechar-consignacao__obs-input';
    obs.dataset.campo = 'observacao';
    if (state.focus?.rowIndex === index && state.focus?.campo === 'observacao') {
      obs.dataset.autofocus = 'true';
    }
    obs.addEventListener('focus', () => ctx.onItemFocus(index, 'observacao'));
    obs.addEventListener('input', () => ctx.onItemDraft(index, 'observacao', obs.value));
    obs.addEventListener('keydown', (e) => ctx.onItemKeydown(e, index, 'observacao', obs));
    obs.addEventListener('blur', () => ctx.onItemObsChange(index, obs.value));
    row.appendChild(obs);

    const status = document.createElement('span');
    status.className = 'cds-fechar-consignacao__linha-status';
    status.dataset.statusRow = String(index);
    const lineKey = state.lineStatus?.[`${index}-active`] || state.lineStatus?.[`${index}-vendido`];
    if (lineKey?.state) {
      status.dataset.state = lineKey.state;
      status.textContent = lineKey.message || FecharConsignacaoView._statusLabel(lineKey.state);
    } else if (linhaErro?.message) {
      status.dataset.state = 'error';
      status.textContent = linhaErro.message;
    }
    if (linhaErro && ctx.onRetryLinha) {
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'cds-fechar-consignacao__retry-btn';
      retry.textContent = 'Tentar novamente';
      retry.addEventListener('click', () => ctx.onRetryLinha(index));
      status.appendChild(retry);
    }
    row.appendChild(status);

    return row;
  }

  static _statusLabel(state) {
    if (state === 'saving') return 'Salvando...';
    if (state === 'saved') return 'Salvo';
    if (state === 'error') return 'Erro';
    return '';
  }

  static patchLinhaRetorno(rowEl, item, index, state) {
    if (!rowEl || !item) return;

    rowEl.classList.toggle(
      'cds-fechar-consignacao__grade-row--editando',
      state.editing?.rowIndex === index
    );
    rowEl.classList.toggle(
      'cds-fechar-consignacao__grade-row--erro',
      Boolean(state.linhasComErro?.[index])
    );
    rowEl.classList.toggle(
      'cds-fechar-consignacao__grade-row--dirty',
      Boolean(item.dirty)
    );

    // STAB-04: DOM espelha State. Nunca sobrescrever campo dirty com valor "fantasma".
    ['vendido', 'devolvido', 'perdido', 'cortesia'].forEach((campo) => {
      const input = rowEl.querySelector(`input[data-campo="${campo}"]`);
      if (!input || document.activeElement === input) return;
      if (item.dirty && item.dirtyCampos?.[campo] && Number(input.value) === Number(item[campo] || 0)) {
        return;
      }
      input.value = String(item[campo] || 0);
    });

    const saldoEl = rowEl.querySelector('[data-saldo-index]');
    if (saldoEl) saldoEl.textContent = String(item.saldo ?? calcularSaldoItem(item));

    const obs = rowEl.querySelector('input[data-campo="observacao"]');
    if (obs && document.activeElement !== obs) obs.value = item.observacao || '';

    const statusEl = rowEl.querySelector('[data-status-row]');
    const statusInfo = state.lineStatus?.[`${index}-active`];
    if (statusEl && statusInfo) {
      statusEl.dataset.state = statusInfo.state || '';
      statusEl.textContent = statusInfo.message || FecharConsignacaoView._statusLabel(statusInfo.state);
    }
  }

  static patchPainelLateral(asideEl, painel, state = {}) {
    if (!asideEl || !painel) return;
    const fields = {
      vendidos: String(painel.produtosVendidos),
      devolvidos: String(painel.produtosDevolvidos),
      perdas: String(painel.perdas),
      cortesias: String(painel.cortesias),
      valorTotal: formatCurrency(painel.valorTotal),
      valorAPagar: formatCurrency(painel.valorAPagar || painel.saldoDevedor || 0),
      valorRecebido: formatCurrency(painel.valorRecebido),
      saldoFinal: formatCurrency(painel.saldoFinal)
    };
    Object.entries(fields).forEach(([key, value]) => {
      const el = asideEl.querySelector(`[data-painel="${key}"]`);
      if (el) el.textContent = value;
    });

    let statusEl = asideEl.querySelector('#fechar-persistencia-status');
    if (!statusEl) {
      statusEl = document.createElement('div');
      statusEl.id = 'fechar-persistencia-status';
      statusEl.className = 'cds-fechar-consignacao__persistencia';
      asideEl.appendChild(statusEl);
    }
    statusEl.dataset.status = state.persistenciaStatus || 'saved';
    statusEl.textContent = state.persistenciaLabel
      || (state.persistenciaStatus === 'pending' ? '● Alterações pendentes' : '✓ Alterações salvas');
  }

  static _renderAtalhos() {
    const bar = document.createElement('div');
    bar.className = 'cds-fechar-consignacao__atalhos';
    bar.innerHTML = `
      <span><kbd>TAB</kbd> Próximo campo</span>
      <span><kbd>Shift</kbd>+<kbd>TAB</kbd> Campo anterior</span>
      <span><kbd>ENTER</kbd> Confirmar campo (opcional)</span>
      <span><kbd>ESC</kbd> Cancelar edição</span>
      <span><kbd>↑</kbd><kbd>↓</kbd> Mover entre linhas</span>
    `;
    return bar;
  }

  static renderPagamento(state, ctx) {
    const wrap = document.createElement('div');
    wrap.className = 'cds-fechar-consignacao__momento';

    const title = document.createElement('h2');
    title.className = 'cds-fechar-consignacao__titulo';
    title.textContent = 'Pagamento';
    wrap.appendChild(title);

    // Sempre do servidor — o valor digitado no formulário não antecipa quitação
    const painel = buildPainelLateral(state.resumoPrestacao, state.resumoPrestacao?.itens || []);

    const hero = document.createElement('div');
    hero.className = 'cds-fechar-consignacao__pagamento-hero';
    hero.innerHTML = `
      <div class="cds-fechar-consignacao__pagamento-hero-item">
        <label>Valor a pagar</label>
        <strong>${formatCurrency(painel.valorAPagar || painel.saldoDevedor || 0)}</strong>
      </div>
      <div class="cds-fechar-consignacao__pagamento-hero-item">
        <label>Total vendido</label>
        <strong>${formatCurrency(painel.valorTotal)}</strong>
      </div>
      <div class="cds-fechar-consignacao__pagamento-hero-item">
        <label>Unidades vendidas</label>
        <strong>${painel.produtosVendidos}</strong>
      </div>
    `;
    wrap.appendChild(hero);

    if (painel.saldoDevedor > 0) {
      wrap.appendChild(Alert.create({
        message: `Saldo devedor: ${formatCurrency(painel.saldoDevedor)}`,
        variant: 'warning',
        dismissible: false
      }));
    }
    if (painel.saldoCredor > 0) {
      wrap.appendChild(Alert.create({
        message: `Saldo credor: ${formatCurrency(painel.saldoCredor)}`,
        variant: 'info',
        dismissible: false
      }));
    }

    const form = document.createElement('div');
    form.className = 'cds-fechar-consignacao__pagamento-form';

    const valorField = document.createElement('div');
    valorField.className = 'cds-fechar-consignacao__campo';
    valorField.innerHTML = '<label>Valor Recebido</label>';
    valorField.appendChild(Input.create({
      type: 'number',
      placeholder: '0,00',
      value: state.pagamentoForm.valor,
      onChange: (v) => ctx.onPagamentoChange('valor', v)
    }));
    form.appendChild(valorField);

    const formaField = document.createElement('div');
    formaField.className = 'cds-fechar-consignacao__campo';
    formaField.innerHTML = '<label>Forma de Pagamento</label>';
    formaField.appendChild(Select.create({
      options: [
        { value: 'DINHEIRO', label: 'Dinheiro' },
        { value: 'PIX', label: 'PIX' },
        { value: 'TRANSFERENCIA', label: 'Transferência' },
        { value: 'CHEQUE', label: 'Cheque' },
        { value: 'CARTAO', label: 'Cartão' }
      ],
      value: state.pagamentoForm.formaPagamento,
      onChange: (v) => ctx.onPagamentoChange('formaPagamento', v)
    }));
    form.appendChild(formaField);

    const obsField = document.createElement('div');
    obsField.className = 'cds-fechar-consignacao__campo';
    obsField.innerHTML = '<label>Observações</label>';
    obsField.appendChild(Textarea.create({
      placeholder: 'Observações sobre o pagamento',
      value: state.pagamentoForm.observacoes,
      onChange: (v) => ctx.onPagamentoChange('observacoes', v)
    }));
    form.appendChild(obsField);

    wrap.appendChild(form);

    if (state.pagamentoErro) {
      wrap.appendChild(Alert.create({
        message: state.pagamentoErro,
        variant: 'error',
        dismissible: true
      }));
    }

    const registrarBtn = Button.create({
      text: state.loading.operation ? 'Registrando...' : 'Registrar Pagamento',
      variant: 'primary',
      disabled: state.loading.operation,
      onClick: () => ctx.onRegistrarPagamento()
    });
    wrap.appendChild(registrarBtn);

    return wrap;
  }

  static renderConferenciaFinal(state, ctx) {
    const wrap = document.createElement('div');
    wrap.className = 'cds-fechar-consignacao__momento cds-fechar-consignacao__momento--encerrar';

    const title = document.createElement('h2');
    title.className = 'cds-fechar-consignacao__titulo';
    title.textContent = 'Resumo da Prestação';
    wrap.appendChild(title);

    const painel = buildPainelLateral(state.resumoPrestacao, state.resumoPrestacao?.itens || []);
    const oficial = buildResumoFinalOficial(
      state.resumoPrestacao,
      state.resumoPrestacao?.itens || [],
      painel,
      state.faturamento
    );
    const avisos = buildValidacoesFinais(state.resumoPrestacao, state.resumoPrestacao?.itens || [], painel);

    const card = document.createElement('section');
    card.className = 'cds-prestacao-resumo-oficial';
    const fiscalIcon = oficial.situacaoFiscal === 'AUTORIZADA'
      ? '✓'
      : oficial.situacaoFiscal === 'REJEITADA'
        ? '!'
        : '○';
    card.innerHTML = `
      <div class="cds-prestacao-resumo-oficial__linha">
        <span>Venda Consignada</span>
        <strong>${formatCurrency(oficial.valorVenda)}</strong>
      </div>
      <div class="cds-prestacao-resumo-oficial__linha">
        <span>Recebido nesta prestação</span>
        <strong>${formatCurrency(oficial.valorRecebido)}</strong>
      </div>
      <div class="cds-prestacao-resumo-oficial__linha">
        <span>Saldo pendente</span>
        <strong>${formatCurrency(oficial.saldoEmAberto)}</strong>
      </div>
      <div class="cds-prestacao-resumo-oficial__situacao">
        <span>Situação Financeira</span>
        <strong>${oficial.situacaoFinanceiraLabel}</strong>
      </div>
      <div class="cds-prestacao-resumo-oficial__situacao" data-fiscal="${oficial.situacaoFiscal}">
        <span>Situação Fiscal</span>
        <strong>${fiscalIcon} ${oficial.situacaoFiscalLabel}</strong>
      </div>
      <ul class="cds-prestacao-resumo-oficial__avisos">
        ${oficial.avisos.map((a) => `<li>✓ ${a}</li>`).join('')}
      </ul>
    `;
    wrap.appendChild(card);

    if (oficial.situacaoFiscal === 'AUTORIZADA' && oficial.vendaId) {
      const danfeWrap = document.createElement('div');
      danfeWrap.className = 'cds-prestacao-resumo-oficial__danfe';
      danfeWrap.appendChild(Button.create({
        text: 'Visualizar DANFE',
        variant: 'secondary',
        onClick: () => ctx.onVisualizarDanfe && ctx.onVisualizarDanfe(oficial.vendaId)
      }));
      danfeWrap.appendChild(Button.create({
        text: 'Reimprimir DANFE',
        variant: 'ghost',
        onClick: () => ctx.onReimprimirDanfe && ctx.onReimprimirDanfe(oficial.vendaId)
      }));
      wrap.appendChild(danfeWrap);
    }

    if (avisos.length) {
      const box = document.createElement('div');
      box.className = 'cds-fechar-consignacao__avisos';
      avisos.slice(0, 3).forEach((a) => {
        box.appendChild(Alert.create({
          message: a.message,
          variant: a.nivel === 'danger' ? 'error' : 'warning',
          dismissible: false
        }));
      });
      wrap.appendChild(box);
    }

    return wrap;
  }

  static renderEncerramento(state, ctx) {
    const wrap = document.createElement('div');
    wrap.className = 'cds-fechar-consignacao__momento cds-central-encerramento cds-central-encerramento--ux12';

    const painel = state.painel
      || buildPainelLateral(state.resumoPrestacao, state.resumoPrestacao?.itens || []);
    const vm = buildCentralEncerramento({
      consignacao: state.consignacao,
      resumo: state.resumoPrestacao,
      painel,
      clienteDetalhe: state.clienteDetalhe,
      dataEncerramento: state.dataEncerramento || new Date()
    });

    const { financeiro, acoes } = vm;

    wrap.innerHTML = `
      <header class="cds-central-encerramento__header">
        <div class="cds-central-encerramento__badge">✓</div>
        <h2 class="cds-central-encerramento__titulo">${vm.titulo}</h2>
        <p class="cds-central-encerramento__subtitulo">${vm.subtitulo}</p>
      </header>

      ${!financeiro.quitado ? `
      <section class="cds-central-encerramento__situacao cds-central-encerramento__situacao--warning">
        <p class="cds-central-encerramento__situacao-label">
          Saldo em aberto
          <span class="cds-central-encerramento__situacao-valor">${formatCurrency(financeiro.saldoDevedor)}</span>
        </p>
      </section>
      ` : ''}

      <section class="cds-central-encerramento__bloco cds-central-encerramento__acoes-wrap">
        <div class="cds-central-encerramento__acoes" data-acoes></div>
      </section>
    `;

    const actionsHost = wrap.querySelector('[data-acoes]');
    const botoes = [];

    if (acoes.mostrarRecebimento) {
      botoes.push({
        label: 'Receber Agora',
        acao: 'recebimento',
        destaque: acoes.primaria === 'recebimento'
      });
    }

    botoes.push({
      label: 'Voltar para Central',
      acao: 'voltar-central',
      destaque: acoes.primaria === 'voltar-central' || !acoes.mostrarRecebimento
    });

    const ignoreClicksUntil = Date.now() + 500;
    botoes.forEach((btn) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = `cds-central-encerramento__acao${btn.destaque ? ' cds-central-encerramento__acao--primaria' : ''}`;
      el.textContent = btn.label;
      el.addEventListener('click', (event) => {
        if (Date.now() < ignoreClicksUntil) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        ctx.onEncerramentoAcao(btn.acao);
      });
      actionsHost.appendChild(el);
    });

    return wrap;
  }

  static renderPainelLateral(state) {
    const painel = state.painel || buildPainelLateral(state.resumoPrestacao, state.resumoPrestacao?.itens || []);
    const aside = document.createElement('aside');
    aside.className = 'cds-fechar-consignacao__painel';
    aside.id = 'fechar-painel-lateral';
    aside.innerHTML = '<h3>Resumo do Atendimento</h3>';

    const grid = document.createElement('div');
    grid.className = 'cds-fechar-consignacao__painel-grid';

    const campos = [
      { label: 'Vendidos', key: 'vendidos', value: String(painel.produtosVendidos) },
      { label: 'Devolvidos', key: 'devolvidos', value: String(painel.produtosDevolvidos) },
      { label: 'Perdas', key: 'perdas', value: String(painel.perdas) },
      { label: 'Cortesias', key: 'cortesias', value: String(painel.cortesias) },
      { label: 'Valor Total', key: 'valorTotal', value: formatCurrency(painel.valorTotal) }
    ];

    if ((painel.valorAPagar || painel.saldoDevedor) > 0) {
      campos.push({
        label: 'Valor a Pagar',
        key: 'valorAPagar',
        value: formatCurrency(painel.valorAPagar || painel.saldoDevedor),
        destaque: true
      });
    }

    campos.push(
      { label: 'Valor Recebido', key: 'valorRecebido', value: formatCurrency(painel.valorRecebido), destaque: true },
      { label: 'Saldo Final', key: 'saldoFinal', value: formatCurrency(painel.saldoFinal), destaque: true }
    );

    campos.forEach((c) => {
      const cell = document.createElement('div');
      cell.className = `cds-fechar-consignacao__painel-campo${c.destaque ? ' cds-fechar-consignacao__painel-campo--destaque' : ''}`;
      cell.innerHTML = `<label>${c.label}</label><strong data-painel="${c.key}">${c.value}</strong>`;
      grid.appendChild(cell);
    });

    aside.appendChild(grid);

    const persist = document.createElement('div');
    persist.id = 'fechar-persistencia-status';
    persist.className = 'cds-fechar-consignacao__persistencia';
    persist.dataset.status = state.persistenciaStatus || 'saved';
    persist.textContent = state.persistenciaLabel
      || (state.persistenciaStatus === 'pending' ? '● Alterações pendentes' : '✓ Alterações salvas');
    aside.appendChild(persist);

    return aside;
  }
}

module.exports = FecharConsignacaoView;
