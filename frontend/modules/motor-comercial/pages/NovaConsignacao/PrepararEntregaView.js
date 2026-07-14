/**
 * Preparar Entrega — interface operacional UX-04.
 *
 * @module frontend/modules/motor-comercial/pages/NovaConsignacao/PrepararEntregaView
 */

const Button = require('../../components/base/Button');
const Input = require('../../components/form/Input');
const Textarea = require('../../components/form/Textarea');
const Loading = require('../../components/base/Loading');
const EmptyState = require('../../components/base/EmptyState');
const Alert = require('../../components/base/Alert');
const {
  buildPainelResumo,
  buildValidacoesConferencia,
  buildClienteResumo,
  buildConferenciaResumo,
  formatCurrency,
  formatDate
} = require('./prepararEntregaMappers');

class PrepararEntregaView {
  static renderMomento(momento, state, ctx) {
    switch (momento) {
      case 'cliente':
        return PrepararEntregaView.renderCliente(state, ctx);
      case 'produtos':
        return PrepararEntregaView.renderProdutos(state, ctx);
      case 'conferencia':
        return PrepararEntregaView.renderConferencia(state, ctx);
      case 'conclusao':
        return PrepararEntregaView.renderConclusao(state, ctx);
      default:
        return document.createElement('div');
    }
  }

  static renderCliente(state, ctx) {
    const wrap = document.createElement('div');
    wrap.className = 'cds-preparar-entrega__momento';

    if (state.skipClienteStep && state.clienteLocked && state.clienteProfile) {
      wrap.appendChild(PrepararEntregaView._renderClientePainel(state, ctx, { locked: true }));
      return wrap;
    }

    const title = document.createElement('h2');
    title.className = 'cds-preparar-entrega__titulo';
    title.textContent = 'Selecione o Cliente';
    wrap.appendChild(title);

    const hint = document.createElement('p');
    hint.className = 'cds-preparar-entrega__hint';
    hint.textContent = 'Pesquise por nome, telefone, CPF, código ou documento';
    wrap.appendChild(hint);

    const searchRow = document.createElement('div');
    searchRow.className = 'cds-preparar-entrega__busca';

    const searchField = Input.create({
      placeholder: 'Digite para pesquisar...',
      id: 'prep-cliente-busca',
      value: state.clienteBusca || ''
    });
    const input = searchField.querySelector('input');
    if (input) {
      input.autocomplete = 'off';
      input.addEventListener('input', (e) => ctx.onClienteBuscaChange(e.target.value));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          ctx.onClienteBuscaSubmit(e.target.value);
        }
      });
      setTimeout(() => input.focus(), 0);
    }
    searchRow.appendChild(searchField);
    wrap.appendChild(searchRow);

    const resultsHost = document.createElement('div');
    resultsHost.className = 'cds-preparar-entrega__resultados';
    resultsHost.id = 'prep-cliente-resultados';

    if (state.loading.profile) {
      resultsHost.appendChild(Loading.create({ message: 'Buscando clientes...' }));
    } else if (state.clienteResultados?.length) {
      state.clienteResultados.forEach((cliente) => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'cds-preparar-entrega__resultado-item';
        row.innerHTML = `
          <strong>${cliente.nome}</strong>
          <span>${cliente.cpf_cnpj || cliente.documento || '—'}</span>
          <span>${cliente.telefone || '—'}</span>
          <span>${cliente.cidade || cliente.municipio || '—'}</span>
        `;
        row.addEventListener('click', () => ctx.onClienteSelecionado(cliente));
        resultsHost.appendChild(row);
      });
    } else if (state.clienteProfile) {
      resultsHost.appendChild(PrepararEntregaView._renderClientePainel(state, ctx, { locked: false }));
    } else {
      resultsHost.appendChild(EmptyState.create({
        title: 'Nenhum cliente selecionado',
        description: 'Digite na pesquisa para localizar o cliente'
      }));
    }

    wrap.appendChild(resultsHost);
    return wrap;
  }

  static _renderClientePainel(state, ctx, { locked = false } = {}) {
    const panel = document.createElement('div');
    panel.className = 'cds-preparar-entrega__cliente-painel';

    const grid = document.createElement('div');
    grid.className = 'cds-preparar-entrega__cliente-grid';

    buildClienteResumo(state.clienteProfile).forEach((field) => {
      const cell = document.createElement('div');
      cell.className = 'cds-preparar-entrega__cliente-campo';
      cell.innerHTML = `<label>${field.label}</label><strong>${field.value}</strong>`;
      grid.appendChild(cell);
    });

    panel.appendChild(grid);

    if (locked) {
      const actions = document.createElement('div');
      actions.className = 'cds-preparar-entrega__cliente-acoes';
      actions.appendChild(Button.create({
        text: 'Trocar Cliente',
        variant: 'ghost',
        onClick: () => ctx.onTrocarCliente()
      }));
      panel.appendChild(actions);
    }

    return panel;
  }

  static renderProdutos(state, ctx) {
    const wrap = document.createElement('div');
    wrap.className = 'cds-preparar-entrega__momento cds-preparar-entrega__momento--produtos';

    if (state.clienteProfile) {
      if (state.skipClienteStep && state.clienteLocked) {
        wrap.appendChild(PrepararEntregaView._renderClientePainel(state, ctx, { locked: true }));
      } else {
        const clienteBar = document.createElement('div');
        clienteBar.className = 'cds-preparar-entrega__cliente-bar';
        clienteBar.innerHTML = `
          <span><strong>${state.clienteProfile.nome}</strong></span>
          <span>Limite: ${formatCurrency(state.clienteProfile.limiteDisponivel)}</span>
          <span>Saldo: ${formatCurrency(state.clienteProfile.saldo)}</span>
        `;
        wrap.appendChild(clienteBar);
      }
    }

    const lipHost = document.createElement('div');
    lipHost.className = 'cds-preparar-entrega__lip';
    lipHost.id = 'lip-host';
    wrap.appendChild(lipHost);

    const lipSimHost = document.createElement('div');
    lipSimHost.className = 'cds-preparar-entrega__lip-simulacao';
    lipSimHost.id = 'lip-simulacao';
    lipSimHost.hidden = true;
    wrap.appendChild(lipSimHost);

    wrap.appendChild(PrepararEntregaView._renderAtalhosTeclado());

    wrap.appendChild(PrepararEntregaView._renderResumoCompactoGrade(state));

    const gradeHost = document.createElement('div');
    gradeHost.className = 'cds-preparar-entrega__grade';
    gradeHost.id = 'prep-itens-grade';

    if (!state.data.itens.length) {
      gradeHost.appendChild(EmptyState.create({
        title: 'Nenhum produto adicionado',
        description: 'Use a pesquisa acima para incluir produtos na entrega'
      }));
    } else {
      gradeHost.appendChild(PrepararEntregaView._renderGradeItens(state, ctx));
    }

    wrap.appendChild(gradeHost);
    return wrap;
  }

  static _renderAtalhosTeclado() {
    const bar = document.createElement('div');
    bar.className = 'cds-preparar-entrega__atalhos';
    bar.innerHTML = `
      <span><kbd>ENTER</kbd> Confirma produto</span>
      <span><kbd>TAB</kbd> Próximo campo</span>
      <span><kbd>ESC</kbd> Cancela pesquisa</span>
      <span><kbd>Ctrl</kbd>+<kbd>DEL</kbd> Remove item</span>
      <span><kbd>F2</kbd> Editar quantidade</span>
    `;
    return bar;
  }

  static _renderGradeItens(state, ctx) {
    const table = document.createElement('div');
    table.className = 'cds-preparar-entrega__grade-tabela';

    const head = document.createElement('div');
    head.className = 'cds-preparar-entrega__grade-head';
    head.innerHTML = `
      <span>Produto</span>
      <span>Qtd</span>
      <span>Preço</span>
      <span>Total</span>
      <span>Obs.</span>
      <span></span>
    `;
    table.appendChild(head);

    state.data.itens.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = `cds-preparar-entrega__grade-row${state.focusedItemIndex === index ? ' cds-preparar-entrega__grade-row--focus' : ''}`;
      row.dataset.index = String(index);

      const prodCell = document.createElement('div');
      prodCell.className = 'cds-preparar-entrega__grade-produto';
      prodCell.innerHTML = `<strong>${item.produto}</strong>${item.codigo ? `<small>${item.codigo}</small>` : ''}`;
      row.appendChild(prodCell);

      const qtyInput = document.createElement('input');
      qtyInput.type = 'number';
      qtyInput.min = '1';
      qtyInput.step = '1';
      qtyInput.value = String(item.quantidade || 1);
      qtyInput.className = 'cds-preparar-entrega__qty-input';
      qtyInput.dataset.qtyIndex = String(index);
      qtyInput.addEventListener('focus', () => ctx.onItemFocus(index));
      qtyInput.addEventListener('input', () => {
        if (typeof ctx.onItemQtyInput === 'function') {
          ctx.onItemQtyInput(index, qtyInput.value);
        }
      });
      qtyInput.addEventListener('change', () => ctx.onItemQtyChange(index, qtyInput.value));
      row.appendChild(qtyInput);

      const preco = document.createElement('span');
      preco.textContent = formatCurrency(item.preco);
      row.appendChild(preco);

      const total = document.createElement('span');
      total.className = 'cds-preparar-entrega__grade-total';
      total.textContent = formatCurrency((item.quantidade || 0) * (item.preco || 0));
      row.appendChild(total);

      const obsInput = document.createElement('input');
      obsInput.type = 'text';
      obsInput.placeholder = 'Obs.';
      obsInput.value = item.observacao || '';
      obsInput.className = 'cds-preparar-entrega__obs-input';
      obsInput.addEventListener('change', () => ctx.onItemObsChange(index, obsInput.value));
      row.appendChild(obsInput);

      const actions = document.createElement('div');
      actions.className = 'cds-preparar-entrega__grade-acoes';
      const dupBtn = document.createElement('button');
      dupBtn.type = 'button';
      dupBtn.className = 'cds-preparar-entrega__icon-btn';
      dupBtn.title = 'Duplicar';
      dupBtn.textContent = '⧉';
      dupBtn.addEventListener('click', () => ctx.onItemDuplicar(index));
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'cds-preparar-entrega__icon-btn cds-preparar-entrega__icon-btn--danger';
      delBtn.title = 'Remover';
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', () => ctx.onItemRemover(index));
      actions.appendChild(dupBtn);
      actions.appendChild(delBtn);
      row.appendChild(actions);

      table.appendChild(row);
    });

    return table;
  }

  static renderConferencia(state, ctx) {
    const wrap = document.createElement('div');
    wrap.className = 'cds-preparar-entrega__momento';

    const title = document.createElement('h2');
    title.className = 'cds-preparar-entrega__titulo';
    title.textContent = 'Conferência';
    wrap.appendChild(title);

    const painel = buildPainelResumo(state.data.itens, state.clienteProfile);
    const avisos = buildValidacoesConferencia(state.data, state.clienteProfile);

    if (avisos.length) {
      const alertBox = document.createElement('div');
      alertBox.className = 'cds-preparar-entrega__avisos';
      avisos.forEach((aviso) => {
        alertBox.appendChild(Alert.create({
          message: aviso.message,
          variant: aviso.nivel === 'danger' ? 'error' : 'warning',
          dismissible: false
        }));
      });
      wrap.appendChild(alertBox);
    }

    const resumo = document.createElement('div');
    resumo.className = 'cds-preparar-entrega__conferencia-grid';
    buildConferenciaResumo(state.data, state.clienteProfile, painel).forEach((field) => {
      const cell = document.createElement('div');
      cell.className = `cds-preparar-entrega__conferencia-campo${field.highlight ? ' cds-preparar-entrega__conferencia-campo--destaque' : ''}`;
      cell.innerHTML = `<label>${field.label}</label><strong>${field.value}</strong>`;
      resumo.appendChild(cell);
    });
    wrap.appendChild(resumo);

    if (state.data.itens.length) {
      const lista = document.createElement('div');
      lista.className = 'cds-preparar-entrega__conferencia-itens';
      state.data.itens.forEach((item) => {
        const linha = document.createElement('div');
        linha.className = 'cds-preparar-entrega__conferencia-linha';
        linha.innerHTML = `
          <span>${item.produto}</span>
          <span>${item.quantidade} un.</span>
          <span>${formatCurrency(item.quantidade * item.preco)}</span>
        `;
        lista.appendChild(linha);
      });
      wrap.appendChild(lista);
    }

    const extras = document.createElement('div');
    extras.className = 'cds-preparar-entrega__conferencia-extras';

    const docExt = document.createElement('div');
    docExt.className = 'cds-preparar-entrega__campo';
    docExt.innerHTML = '<label>Documento Externo (opcional)</label>';
    const docInput = Input.create({
      placeholder: 'Pedido, OC ou protocolo do cliente',
      value: state.data.documentoExterno || '',
      onChange: (v) => ctx.onDocumentoExternoChange(v)
    });
    docExt.appendChild(docInput);
    extras.appendChild(docExt);

    const obs = document.createElement('div');
    obs.className = 'cds-preparar-entrega__campo';
    obs.innerHTML = '<label>Observações</label>';
    obs.appendChild(Textarea.create({
      placeholder: 'Observações sobre a entrega',
      value: state.data.observacoes || '',
      onChange: (v) => ctx.onObservacoesChange(v)
    }));
    extras.appendChild(obs);

    wrap.appendChild(extras);
    return wrap;
  }

  static renderConclusao(state, ctx) {
    const wrap = document.createElement('div');
    wrap.className = 'cds-preparar-entrega__momento cds-preparar-entrega__momento--conclusao';

    wrap.innerHTML = `
      <div class="cds-preparar-entrega__sucesso-icone">✓</div>
      <h2 class="cds-preparar-entrega__titulo">Consignação criada com sucesso</h2>
      <p class="cds-preparar-entrega__documento-label">Documento</p>
      <p class="cds-preparar-entrega__documento-numero">${state.documentoCriado || '—'}</p>
    `;

    const actions = document.createElement('div');
    actions.className = 'cds-preparar-entrega__conclusao-acoes';

    [
      { icon: '🖨', label: 'Imprimir Termo', acao: 'imprimir-termo' },
      { icon: '📄', label: 'Visualizar PDF', acao: 'visualizar-pdf' },
      { icon: '📦', label: 'Abrir Entrega', acao: 'abrir-entrega', destaque: true },
      { icon: '👤', label: state.voltarLabel || 'Voltar', acao: 'voltar', destaque: false }
    ].forEach((btn) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = `cds-preparar-entrega__conclusao-btn${btn.destaque ? ' cds-preparar-entrega__conclusao-btn--destaque' : ''}`;
      el.innerHTML = `<span>${btn.icon}</span><span>${btn.label}</span>`;
      el.addEventListener('click', () => ctx.onConclusaoAcao(btn.acao));
      actions.appendChild(el);
    });

    wrap.appendChild(actions);
    return wrap;
  }

  static _renderResumoCompactoGrade(state) {
    const painel = state.lipSimulacao?.painelProjetado
      || buildPainelResumo(state.data.itens, state.clienteProfile);
    const bar = document.createElement('div');
    bar.className = 'cds-preparar-entrega__resumo-grade';
    bar.id = 'prep-resumo-grade';
    const saldoCls = PrepararEntregaView._classeDestaqueSaldo(painel.destaqueSaldoRestante);
    bar.innerHTML = `
      <span class="cds-preparar-entrega__resumo-grade-item">
        <label>Itens:</label>
        <strong data-resumo-itens>${painel.quantidadeItens}</strong>
      </span>
      <span class="cds-preparar-entrega__resumo-grade-item">
        <label>Quantidade:</label>
        <strong data-resumo-quantidade>${painel.quantidadeTotal}</strong>
      </span>
      <span class="cds-preparar-entrega__resumo-grade-item cds-preparar-entrega__resumo-grade-item--total">
        <label>Valor Total:</label>
        <strong data-resumo-valor>${formatCurrency(painel.valorTotal)}</strong>
      </span>
      <span class="cds-preparar-entrega__resumo-grade-item cds-preparar-entrega__resumo-grade-item--saldo ${saldoCls}">
        <label>Crédito Restante:</label>
        <strong data-resumo-saldo>${painel.saldoRestanteExibicao}</strong>
      </span>
    `;
    return bar;
  }

  static _classeDestaqueSaldo(destaque) {
    if (destaque === 'critico') return 'cds-preparar-entrega__destaque--critico';
    if (destaque === 'alerta') return 'cds-preparar-entrega__destaque--alerta';
    return '';
  }

  static renderLipSimulacao(simulacao) {
    const host = document.createElement('div');
    host.className = 'cds-preparar-entrega__lip-simulacao-inner';
    if (!simulacao) return host;

    const painel = simulacao.painelProjetado;
    host.innerHTML = `
      <div class="cds-preparar-entrega__lip-sim-titulo">Simulação da inclusão</div>
      <div class="cds-preparar-entrega__lip-sim-grid">
        <div><label>Produto</label><strong>${simulacao.produto}</strong></div>
        <div><label>Quantidade</label><strong>${simulacao.quantidade}</strong></div>
        <div><label>Valor da inclusão</label><strong>${simulacao.valorInclusaoExibicao}</strong></div>
        <div><label>Novo valor da entrega</label><strong>${formatCurrency(painel.valorTotal)}</strong></div>
        <div><label>Crédito após entrega</label><strong>${painel.creditoAposEntregaExibicao || painel.creditoDisponivelExibicao}</strong></div>
        <div><label>Utilização</label><strong>${painel.percentualUtilizadoTexto}</strong></div>
      </div>
    `;
    return host;
  }

  static _renderSecaoPainel(titulo) {
    const sec = document.createElement('div');
    sec.className = 'cds-preparar-entrega__painel-secao';
    if (titulo) {
      const h = document.createElement('div');
      h.className = 'cds-preparar-entrega__painel-secao-titulo';
      h.textContent = titulo;
      sec.appendChild(h);
    }
    return sec;
  }

  static _renderBarraUtilizacao(painel) {
    const wrap = document.createElement('div');
    wrap.className = 'cds-preparar-entrega__utilizacao';

    const faixa = painel.faixaInfo || { emoji: '', label: '' };
    const header = document.createElement('div');
    header.className = 'cds-preparar-entrega__utilizacao-header';
    header.innerHTML = `<span>${faixa.emoji} ${faixa.label}</span>`;
    const pctLabel = document.createElement('strong');
    pctLabel.textContent = painel.percentualUtilizadoTexto || painel.percentualLimiteExibicao;
    header.appendChild(pctLabel);
    wrap.appendChild(header);

    const track = document.createElement('div');
    track.className = 'cds-preparar-entrega__utilizacao-track';
    track.setAttribute('role', 'progressbar');
    track.setAttribute('aria-valuemin', '0');
    track.setAttribute('aria-valuemax', '100');
    track.setAttribute('aria-valuenow', String(Math.min(painel.percentualLimite || 0, 100)));

    const fill = document.createElement('div');
    const larguraBarra = painel.percentualLimite != null
      ? Math.min(Math.max(painel.percentualLimite, 0), 100)
      : 0;
    fill.className = `cds-preparar-entrega__utilizacao-fill cds-preparar-entrega__utilizacao-fill--${painel.faixaUtilizacao}`;
    fill.style.width = `${larguraBarra}%`;
    track.appendChild(fill);
    wrap.appendChild(track);

    return wrap;
  }

  static _renderMensagemInteligente(painel) {
    const box = document.createElement('div');
    box.className = `cds-preparar-entrega__mensagem cds-preparar-entrega__mensagem--${painel.mensagemNivel || 'info'}`;
    box.setAttribute('role', 'status');
    box.textContent = painel.mensagemInteligente || '';
    return box;
  }

  static renderPainelLateral(state) {
    const painel = state.lipSimulacao?.painelProjetado
      || buildPainelResumo(state.data.itens, state.clienteProfile);
    const simulando = Boolean(state.lipSimulacao);
    const container = document.createElement('aside');
    container.className = `cds-preparar-entrega__painel${simulando ? ' cds-preparar-entrega__painel--simulando' : ''}`;
    container.id = 'prep-painel-operacional';

    container.innerHTML = '<h3>Assistente Operacional</h3>';

    const clienteSec = PrepararEntregaView._renderSecaoPainel('Cliente');
    const clienteNome = document.createElement('div');
    clienteNome.className = 'cds-preparar-entrega__painel-cliente-nome';
    clienteNome.textContent = painel.clienteNome;
    clienteSec.appendChild(clienteNome);
    container.appendChild(clienteSec);

    const creditoSec = PrepararEntregaView._renderSecaoPainel('Crédito Disponível');
    const creditoValor = document.createElement('div');
    creditoValor.className = 'cds-preparar-entrega__painel-hero';
    creditoValor.innerHTML = `<strong data-painel-credito>${
      Number(painel.valorTotal) > 0
        ? (painel.creditoAposEntregaExibicao || painel.creditoDisponivelExibicao)
        : painel.creditoDisponivelExibicao
    }</strong>`;
    creditoSec.appendChild(creditoValor);
    if (painel.percentualLimite != null) {
      creditoSec.appendChild(PrepararEntregaView._renderBarraUtilizacao(painel));
    }
    container.appendChild(creditoSec);

    const numsSec = PrepararEntregaView._renderSecaoPainel('');
    const gridNums = document.createElement('div');
    gridNums.className = 'cds-preparar-entrega__painel-grid';
    [
      { label: 'Limite Comercial', value: formatCurrency(painel.limiteComercial), cls: '' },
      {
        label: 'Valor da Entrega',
        value: formatCurrency(painel.valorTotal),
        cls: 'cds-preparar-entrega__painel-campo--destaque'
      },
      {
        label: 'Saldo Restante',
        value: painel.saldoRestanteExibicao,
        cls: `cds-preparar-entrega__painel-campo--saldo ${PrepararEntregaView._classeDestaqueSaldo(painel.destaqueSaldoRestante)}`
      }
    ].forEach((campo) => {
      const cell = document.createElement('div');
      cell.className = `cds-preparar-entrega__painel-campo ${campo.cls}`.trim();
      cell.innerHTML = `<label>${campo.label}</label><strong>${campo.value}</strong>`;
      gridNums.appendChild(cell);
    });
    numsSec.appendChild(gridNums);
    container.appendChild(numsSec);

    const itensSec = PrepararEntregaView._renderSecaoPainel('');
    const gridItens = document.createElement('div');
    gridItens.className = 'cds-preparar-entrega__painel-grid cds-preparar-entrega__painel-grid--compacto';
    [
      { label: 'Itens', value: String(painel.quantidadeItens) },
      { label: 'Quantidade Total', value: String(painel.quantidadeTotal) },
      { label: 'Valor Médio por Item', value: painel.valorMedioItemExibicao }
    ].forEach((campo) => {
      const cell = document.createElement('div');
      cell.className = 'cds-preparar-entrega__painel-campo';
      cell.innerHTML = `<label>${campo.label}</label><strong>${campo.value}</strong>`;
      gridItens.appendChild(cell);
    });
    itensSec.appendChild(gridItens);
    container.appendChild(itensSec);

    const sitSec = PrepararEntregaView._renderSecaoPainel('Situação');
    sitSec.appendChild(PrepararEntregaView._renderMensagemInteligente(painel));
    if (simulando) {
      const simTag = document.createElement('p');
      simTag.className = 'cds-preparar-entrega__painel-sim-tag';
      simTag.textContent = 'Exibindo projeção antes de confirmar a inclusão.';
      sitSec.appendChild(simTag);
    }
    container.appendChild(sitSec);

    return container;
  }
}

module.exports = PrepararEntregaView;
