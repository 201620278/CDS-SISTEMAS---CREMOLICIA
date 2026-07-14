/**
 * Mapeadores do fluxo Fechar Consignação — Sprint UX-05.
 *
 * @module frontend/modules/motor-comercial/pages/PrestacaoContas/fecharConsignacaoMappers
 */

const { formatDocumento } = require('../../api/helpers');

const MOMENTOS_FECHAMENTO = [
  { key: 'conferir', label: 'Conferir Produtos' },
  { key: 'retornos', label: 'Registrar Retornos' },
  { key: 'pagamento', label: 'Pagamento' },
  { key: 'conferencia', label: 'Conferência Final' },
  { key: 'encerramento', label: 'Encerramento' }
];

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value) || 0);
}

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('pt-BR');
}

function formatDateTime(date) {
  if (!date) return '—';
  return new Date(date).toLocaleString('pt-BR');
}

function calcularTotaisItens(itens = []) {
  return itens.reduce((acc, item) => {
    acc.vendidos += Number(item.vendido || 0);
    acc.devolvidos += Number(item.devolvido || 0);
    acc.perdas += Number(item.perdido || 0);
    acc.cortesias += Number(item.cortesia || 0);
    acc.pendentes += Number(item.saldo || 0);
    return acc;
  }, { vendidos: 0, devolvidos: 0, perdas: 0, cortesias: 0, pendentes: 0 });
}

function calcularValorVendidoItens(itens = []) {
  return itens.reduce(
    (sum, item) => sum + Number(item.vendido || 0) * Number(item.preco || 0),
    0
  );
}

const LINHA_RETORNO_SELECTOR = '.cds-fechar-consignacao__grade-row--retornos';

function seletorLinhaRetorno(index, rootSelector = '#fechar-retornos-grade') {
  return `${rootSelector} ${LINHA_RETORNO_SELECTOR}[data-row-index="${index}"]`;
}

function coletarItensComRascunho(itens = [], rootSelector = '#fechar-retornos-grade') {
  if (typeof document === 'undefined') return itens;

  return itens.map((item, index) => {
    const row = document.querySelector(seletorLinhaRetorno(index, rootSelector));
    if (!row) return { ...item, saldo: calcularSaldoItem(item) };

    const draft = { ...item };
    ['vendido', 'devolvido', 'perdido', 'cortesia'].forEach((campo) => {
      const input = row.querySelector(`input[data-campo="${campo}"]`);
      if (input) draft[campo] = Math.max(0, Number(input.value) || 0);
    });
    draft.saldo = calcularSaldoItem(draft);
    return draft;
  });
}

function buildPainelLateralPreview(resumo = {}, itens = []) {
  const totais = calcularTotaisItens(itens);
  const valorVendido = calcularValorVendidoItens(itens);
  const valorRecebido = Number(resumo.valorRecebido ?? resumo.recebimentos ?? 0);
  const saldoFinal = valorVendido - valorRecebido;

  return {
    produtosVendidos: totais.vendidos,
    produtosDevolvidos: totais.devolvidos,
    perdas: totais.perdas,
    cortesias: totais.cortesias,
    valorTotal: valorVendido,
    valorRecebido,
    saldoFinal,
    saldoDevedor: saldoFinal > 0 ? saldoFinal : 0,
    saldoCredor: saldoFinal < 0 ? Math.abs(saldoFinal) : 0,
    pendentes: totais.pendentes,
    preview: true
  };
}

function buildPainelLateral(resumo = {}, itens = []) {
  const totais = calcularTotaisItens(itens);
  const valorVendidoItens = calcularValorVendidoItens(itens);
  const valorVendidoResumo = Number(resumo.valorVendido ?? resumo.totalVendido ?? resumo.valorTotal ?? 0);
  const valorVendido = valorVendidoResumo > 0 ? valorVendidoResumo : valorVendidoItens;
  const valorRecebido = Number(resumo.valorRecebido ?? resumo.totalPago ?? resumo.recebimentos ?? 0);
  const saldoResumo = Number(resumo.saldoAtual ?? resumo.saldo);
  const saldoCalculado = valorVendido - valorRecebido;
  // Com venda/recebimento conhecidos, prioriza o cálculo local (evita saldo 0 “fantasma” da projeção)
  const saldoFinal = (valorVendido > 0 || valorRecebido > 0)
    ? saldoCalculado
    : (Number.isFinite(saldoResumo) ? saldoResumo : saldoCalculado);

  return {
    produtosVendidos: totais.vendidos,
    produtosDevolvidos: totais.devolvidos,
    perdas: totais.perdas,
    cortesias: totais.cortesias,
    valorTotal: valorVendido,
    valorRecebido,
    saldoFinal,
    valorAPagar: saldoFinal > 0 ? saldoFinal : 0,
    saldoDevedor: saldoFinal > 0 ? saldoFinal : 0,
    saldoCredor: saldoFinal < 0 ? Math.abs(saldoFinal) : 0,
    pendentes: totais.pendentes
  };
}

function mergeItensRetornos(servidor = [], rascunho = []) {
  if (!rascunho.length) return servidor;
  if (!servidor.length) return rascunho;

  return servidor.map((item, index) => {
    const draft = rascunho[index];
    if (!draft) return { ...item, saldo: calcularSaldoItem(item) };

    const merged = {
      ...item,
      vendido: Math.max(Number(item.vendido || 0), Number(draft.vendido || 0)),
      devolvido: Math.max(Number(item.devolvido || 0), Number(draft.devolvido || 0)),
      perdido: Math.max(Number(item.perdido || 0), Number(draft.perdido || 0)),
      cortesia: Math.max(Number(item.cortesia || 0), Number(draft.cortesia || 0)),
      preco: Number(item.preco || draft.preco || 0),
      observacao: draft.observacao || item.observacao || ''
    };
    merged.saldo = calcularSaldoItem(merged);
    return merged;
  });
}

function normalizarMovimentacoes(historico) {
  if (!historico) return [];
  if (Array.isArray(historico)) return historico;
  return historico.movimentacoes || historico.items || historico.registros || [];
}

function buildItensFromMovimentacoes(movimentacoes = [], grupoPrestacaoId = null) {
  const porItem = new Map();

  movimentacoes.forEach((mov) => {
    const tipo = String(mov.tipoMovimentacao || mov.tipo || '').toUpperCase();
    if (grupoPrestacaoId && tipo !== 'ENTREGA') {
      const grupo = mov.grupoPrestacaoContasId;
      if (grupo && String(grupo) !== String(grupoPrestacaoId)) return;
    }

    const snap = mov.snapshot || {};
    const itemSnap = snap.item || {};
    const key = mov.consignacaoItemId || itemSnap.id || itemSnap.produtoId || `mov-${mov.id}`;

    if (!porItem.has(key)) {
      porItem.set(key, {
        itemId: mov.consignacaoItemId || itemSnap.id || null,
        produtoId: itemSnap.produtoId || null,
        produto: snap.produtoNome || itemSnap.produtoNome || snap.produto
          || (itemSnap.produtoId ? `Produto #${itemSnap.produtoId}` : `Item #${key}`),
        enviado: 0,
        vendido: 0,
        devolvido: 0,
        perdido: 0,
        cortesia: 0,
        preco: 0,
        saldo: 0,
        observacao: ''
      });
    }

    const item = porItem.get(key);
    const qtd = Number(mov.quantidade || 0);
    const valor = Number(mov.valor || 0);

    switch (tipo) {
      case 'ENTREGA':
        item.enviado += qtd;
        item.produtoId = item.produtoId || itemSnap.produtoId || null;
        if (qtd > 0 && valor > 0) item.preco = valor / qtd;
        break;
      case 'VENDA_PRESTACAO':
      case 'VENDA':
        item.vendido += qtd;
        break;
      case 'DEVOLUCAO':
        item.devolvido += qtd;
        break;
      case 'PERDA':
        item.perdido += qtd;
        break;
      case 'CORTESIA':
        item.cortesia += qtd;
        break;
      default:
        break;
    }
  });

  return [...porItem.values()]
    .map((item) => ({
      ...item,
      saldo: Math.max(0, item.enviado - item.vendido - item.devolvido - item.perdido - item.cortesia)
    }))
    .filter((item) => item.enviado > 0 || item.vendido > 0 || item.devolvido > 0 || item.perdido > 0 || item.cortesia > 0);
}

function mapItensCacheParaPrestacao(itens = []) {
  return itens.map((item) => ({
    itemId: item.itemId || item.id || null,
    produtoId: item.produtoId,
    produto: item.produto || item.produtoNome || `Produto #${item.produtoId || '—'}`,
    enviado: Number(item.quantidade || item.enviado || 0),
    vendido: Number(item.vendido || 0),
    devolvido: Number(item.devolvido || 0),
    perdido: Number(item.perdido || 0),
    cortesia: Number(item.cortesia || 0),
    saldo: Number(item.saldo ?? item.quantidade ?? 0),
    preco: Number(item.preco || item.precoUnitario || 0),
    observacao: item.observacao || ''
  }));
}

function consignacaoElegivelParaPrestacao(consignacao = {}) {
  const status = String(consignacao.status || '').toUpperCase();
  if (['EM_PRESTACAO', 'ENTREGUE', 'ACERTADA'].includes(status)) return true;
  const prest = consignacao.prestacaoContasAtiva;
  return Boolean(prest && String(prest.status || '').toUpperCase() === 'ABERTA');
}

function resolveClienteNome(consignacao = {}, clienteDetalhe = null) {
  const fromObj = (c) => {
    if (!c || typeof c !== 'object') return null;
    return c.nome || c.razaoSocial || c.nomeFantasia || null;
  };

  const candidatos = [
    clienteDetalhe?.nome,
    fromObj(clienteDetalhe),
    consignacao.clienteNome,
    fromObj(consignacao.cliente),
    typeof consignacao.cliente === 'string' && !/^\d+$/.test(consignacao.cliente.trim())
      ? consignacao.cliente
      : null
  ].filter((n) => n != null && String(n).trim() !== '' && !/^\d+$/.test(String(n).trim()));

  if (candidatos.length) return String(candidatos[0]).trim();

  const id = consignacao.clienteId || clienteDetalhe?.id;
  return id ? `Cliente #${id}` : '—';
}

function calcularValorEntregue(consignacao = {}, resumo = {}, itens = []) {
  const fromResumo = Number(resumo.valorConsignado ?? resumo.valorEntregue ?? resumo.valorTotal ?? 0);
  if (fromResumo > 0) return fromResumo;

  const fromConsignacao = Number(
    consignacao.valorTotalEntregue ?? consignacao.valor ?? 0
  );
  if (fromConsignacao > 0) return fromConsignacao;

  return itens.reduce((sum, item) => {
    const qtd = Number(item.enviado ?? item.quantidade ?? 0);
    const preco = Number(item.preco ?? item.precoUnitario ?? 0);
    return sum + qtd * preco;
  }, 0);
}

function buildResumoEntrega(consignacao = {}, resumo = {}, clienteDetalhe = null) {
  const itens = (Array.isArray(resumo.itens) && resumo.itens.length)
    ? resumo.itens
    : (consignacao.itens || []);

  return {
    cliente: resolveClienteNome(consignacao, clienteDetalhe),
    documento: formatDocumento(consignacao.documento, consignacao.id),
    dataEntrega: formatDate(consignacao.dataEntrega || consignacao.dataAbertura || consignacao.data),
    valorEntregue: calcularValorEntregue(consignacao, resumo, itens),
    quantidadeItens: itens.length
  };
}

function getOperadorNomeLocal() {
  if (typeof localStorage === 'undefined') return '—';
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.nome || user?.username || user?.name || '—';
  } catch (_error) {
    return '—';
  }
}

/**
 * View-model da Central de Encerramento da Prestação (UX-08).
 * Apenas montagem de apresentação — sem regra comercial.
 */
function buildCentralEncerramento({
  consignacao = {},
  resumo = {},
  painel = null,
  clienteDetalhe = null,
  dataEncerramento = new Date()
} = {}) {
  const itens = (Array.isArray(resumo.itens) && resumo.itens.length)
    ? resumo.itens
    : (consignacao.itens || []);
  const painelCalc = painel || buildPainelLateral(resumo, itens);
  const totais = calcularTotaisItens(itens);
  const qtdEntregue = itens.reduce(
    (sum, item) => sum + Number(item.enviado ?? item.quantidade ?? 0),
    0
  );
  const saldoDevedor = Number(painelCalc.saldoDevedor || 0);
  const saldoCredor = Number(painelCalc.saldoCredor || 0);
  const quitado = saldoDevedor <= 0;
  const clienteId = consignacao.clienteId || clienteDetalhe?.id || null;
  const endereco = clienteDetalhe?.endereco || consignacao.cliente?.endereco || {};
  const cidade = clienteDetalhe?.cidade
    || endereco.cidade
    || consignacao.cliente?.cidade
    || null;
  const uf = clienteDetalhe?.uf || endereco.uf || consignacao.cliente?.uf || null;

  return {
    titulo: 'Atendimento concluído',
    subtitulo: quitado
      ? 'Não há saldo em aberto. Você pode voltar para a Central.'
      : 'Há saldo em aberto. Receba agora ou volte para a Central.',
    mensagemOperacional: quitado
      ? 'Atendimento concluído e quitado.'
      : 'Atendimento concluído. Cliente com saldo em aberto.',
    cliente: {
      id: clienteId,
      nome: resolveClienteNome(consignacao, clienteDetalhe),
      codigo: clienteId != null ? `#${clienteId}` : '—',
      telefone: clienteDetalhe?.telefone || consignacao.cliente?.telefone || consignacao.clienteTelefone || '—',
      cidade: cidade ? `${cidade}${uf ? `/${uf}` : ''}` : '—',
      operador: getOperadorNomeLocal(),
      dataHora: formatDateTime(dataEncerramento),
      documento: formatDocumento(consignacao.documento, consignacao.id)
    },
    operacional: {
      mercadoriaEntregue: qtdEntregue,
      mercadoriaDevolvida: totais.devolvidos,
      perdas: totais.perdas,
      cortesias: totais.cortesias,
      quantidadeVendida: totais.vendidos,
      valorVendido: Number(painelCalc.valorTotal || 0)
    },
    financeiro: {
      valorEntrega: calcularValorEntregue(consignacao, resumo, itens),
      valorDevido: Number(painelCalc.valorTotal || 0),
      valorRecebido: Number(painelCalc.valorRecebido || 0),
      saldoDevedor,
      saldoCredor,
      quitado,
      situacaoLabel: quitado ? 'Quitado' : 'Cliente possui saldo devedor',
      situacaoNivel: quitado ? 'success' : 'warning',
      contaCorrenteInfo: quitado
        ? null
        : 'O saldo foi lançado automaticamente na Conta Corrente.'
    },
    acoes: {
      primaria: quitado ? 'voltar-central' : 'recebimento',
      primariaLabel: quitado ? 'Voltar para Central' : 'Receber Agora',
      mostrarContaCorrente: false,
      mostrarRecebimento: !quitado,
      mostrarVoltarCentral: true,
      saldoRecebimento: saldoDevedor
    }
  };
}

function buildResumoFinalOficial(resumo = {}, itens = [], painel = null, faturamento = null) {
  const p = painel || buildPainelLateral(resumo, itens);
  const valorVenda = Number(p.valorTotal || 0);
  const valorRecebido = Number(p.valorRecebido || 0);
  const saldo = Math.round((valorVenda - valorRecebido) * 100) / 100;
  const integro = Math.abs(valorVenda - (valorRecebido + Math.max(0, saldo))) <= 0.01;

  let situacaoFinanceira = 'SEM_VENDA';
  let situacaoFinanceiraLabel = 'Sem Venda';
  if (valorVenda > 0.01) {
    if (saldo <= 0.01) {
      situacaoFinanceira = 'QUITADA';
      situacaoFinanceiraLabel = 'Quitada';
    } else if (valorRecebido <= 0.01) {
      situacaoFinanceira = 'EM_ABERTO';
      situacaoFinanceiraLabel = 'Em Aberto';
    } else {
      situacaoFinanceira = 'PARCIALMENTE_RECEBIDA';
      situacaoFinanceiraLabel = 'Parcialmente Recebida';
    }
  }

  const fat = faturamento || {};
  const situacaoFiscal = String(fat.situacaoFiscal || 'PENDENTE').toUpperCase();
  let situacaoFiscalLabel = 'Ainda não emitida';
  if (situacaoFiscal === 'AUTORIZADA') {
    situacaoFiscalLabel = fat.nfce?.numero
      ? `NFC-e nº ${fat.nfce.numero} autorizada`
      : 'NFC-e autorizada';
  } else if (situacaoFiscal === 'REJEITADA') {
    situacaoFiscalLabel = fat.nfce?.motivo || 'NFC-e rejeitada';
  } else if (situacaoFiscal === 'NAO_APLICAVEL') {
    situacaoFiscalLabel = 'Emissão não aplicável (somente não fiscal)';
  }

  const exigeNfce = valorVenda > 0.01 && situacaoFiscal !== 'NAO_APLICAVEL';
  const podeEncerrar = !exigeNfce || fat.podeEncerrarFiscal === true || situacaoFiscal === 'AUTORIZADA';
  const podeEmitir = exigeNfce && fat.podeEmitir !== false && situacaoFiscal !== 'AUTORIZADA';

  return {
    valorVenda,
    valorRecebido,
    saldoEmAberto: Math.max(0, saldo),
    situacaoFinanceira,
    situacaoFinanceiraLabel,
    situacaoFiscal,
    situacaoFiscalLabel,
    faturada: !!fat.faturada,
    vendaId: fat.vendaId || null,
    nfce: fat.nfce || null,
    exigeNfce,
    podeEncerrar,
    podeEmitir,
    integro,
    emitiraNfce: valorVenda > 0.01 && situacaoFiscal !== 'AUTORIZADA' && situacaoFiscal !== 'NAO_APLICAVEL',
    avisos: [
      situacaoFiscal === 'AUTORIZADA'
        ? situacaoFiscalLabel
        : valorVenda > 0.01
          ? (situacaoFiscal === 'NAO_APLICAVEL'
            ? situacaoFiscalLabel
            : `Será emitida NFC-e sobre ${formatCurrency(valorVenda)}`)
          : 'Sem valor de venda consignada nesta prestação',
      Math.max(0, saldo) > 0.01
        ? `Será criado saldo financeiro de ${formatCurrency(Math.max(0, saldo))}`
        : 'Sem saldo financeiro pendente'
    ]
  };
}

function buildValidacoesFinais(resumo = {}, itens = [], painel = {}) {
  const avisos = [];

  if (!itens.length) {
    avisos.push({ message: 'Nenhum produto na consignação', nivel: 'danger' });
  }

  if (painel.pendentes > 0) {
    avisos.push({
      message: `Ainda existem ${painel.pendentes} unidade(s) sem destino (venda, devolução, perda ou cortesia)`,
      nivel: 'warning'
    });
  }

  const saldo = Number(resumo.saldoAtual ?? resumo.saldo ?? 0);
  const recebido = Number(resumo.valorRecebido ?? 0);
  const vendido = Number(resumo.valorVendido ?? 0);

  if (vendido > 0 && recebido === 0 && saldo > 0) {
    avisos.push({
      message: 'Existem vendas registradas sem pagamento correspondente',
      nivel: 'warning'
    });
  }

  if (saldo > 0) {
    avisos.push({
      message: `Saldo devedor de ${formatCurrency(saldo)} — confira o pagamento`,
      nivel: 'warning'
    });
  }

  return avisos;
}

function inicializarMomentos(jaEncerrado = false) {
  if (jaEncerrado) {
    return MOMENTOS_FECHAMENTO.map((m, i) => ({
      ...m,
      state: i < 4 ? 'completed' : 'current'
    }));
  }
  return MOMENTOS_FECHAMENTO.map((m, i) => ({
    ...m,
    state: i === 0 ? 'current' : 'pending'
  }));
}

function campoParaTipo(campo) {
  const map = {
    vendido: 'venda',
    devolvido: 'devolucao',
    perdido: 'perda',
    cortesia: 'cortesia'
  };
  return map[campo] || null;
}

const CAMPOS_MOVIMENTO_RETORNO = ['devolvido', 'vendido', 'perdido', 'cortesia'];

function listarPendenciasRetornos(servidor = [], rascunho = []) {
  const pendencias = [];

  servidor.forEach((item, index) => {
    const draft = rascunho[index] || item;
    const itemRef = { ...item, ...draft, observacao: draft.observacao || item.observacao || '' };

    CAMPOS_MOVIMENTO_RETORNO.forEach((campo) => {
      const salvo = Number(item[campo] || 0);
      const alvo = Number(draft[campo] || 0);
      const delta = alvo - salvo;

      if (delta === 0) return;

      if (delta < 0) {
        pendencias.push({
          index,
          campo,
          tipo: 'invalido',
          delta,
          target: salvo,
          item: itemRef,
          erro: 'Não é possível reduzir quantidade já registrada.'
        });
        return;
      }

      const tipo = campoParaTipo(campo);
      if (!tipo) return;

      pendencias.push({
        index,
        campo,
        tipo,
        delta,
        target: alvo,
        item: itemRef
      });
    });
  });

  return pendencias.sort((a, b) => {
    const ordemTipo = { devolucao: 0, venda: 1, perda: 2, cortesia: 3, invalido: 4 };
    const ta = ordemTipo[a.tipo] ?? 9;
    const tb = ordemTipo[b.tipo] ?? 9;
    if (ta !== tb) return ta - tb;
    return a.index - b.index;
  });
}

function mensagemErroOperacional(message = '', contexto = '') {
  const texto = String(message || '');
  if (/prestação fechada|reabra a prestação/i.test(texto)) {
    return 'Devolução indisponível com prestação fechada. Reabra a prestação para liquidar residual.';
  }
  if (/PRESTACAO_JA_ABERTA|DEVOLUCAO_APOS_PRESTACAO|devolução após prestação/i.test(texto)) {
    return 'Este produto não pôde ser registrado. Revise o item destacado e tente novamente.';
  }
  if (/PAGAMENTO_MAIOR_QUE_SALDO|pagamento excede|saldo da prestação/i.test(texto)) {
    return 'Não foi possível registrar o pagamento. Confira o valor e o saldo a pagar.';
  }
  if (/venda registrada|não existe venda/i.test(texto)) {
    return 'Não há vendas registradas para quitar. Volte e confirme os retornos.';
  }
  if (/PRODUTO_NAO|produto não/i.test(texto)) {
    return 'Produto não identificado. Revise o item destacado.';
  }
  if (/QUANTIDADE|quantidade/i.test(texto)) {
    return 'Quantidade inválida para este produto. Revise o item destacado.';
  }
  if (/saldo em aberto/i.test(texto)) {
    return 'Existem produtos que ainda não puderam ser registrados. Revise apenas os itens destacados.';
  }
  if (contexto === 'pagamento') {
    return texto || 'Não foi possível registrar o pagamento. Tente novamente.';
  }
  return texto || 'Não foi possível registrar este item. Tente novamente.';
}

function possuiVendasPendentes(pendencias = []) {
  return pendencias.some((p) => ['venda', 'perda', 'cortesia'].includes(p.tipo));
}

const CAMPOS_RETORNO_ORDEM = ['devolvido', 'vendido', 'perdido', 'cortesia', 'observacao'];

function calcularSaldoItem(item = {}) {
  const enviado = Number(item.enviado ?? item.quantidade ?? 0);
  const registrado = Number(item.vendido || 0)
    + Number(item.devolvido || 0)
    + Number(item.perdido || 0)
    + Number(item.cortesia || 0);
  return Math.max(0, enviado - registrado);
}

function enriquecerItensPrestacao(itens = [], consignacaoItens = []) {
  const porProduto = new Map();
  const porItemId = new Map();

  consignacaoItens.forEach((ci) => {
    const produtoId = Number(ci.produtoId);
    const itemId = Number(ci.id ?? ci.itemId);
    if (Number.isFinite(produtoId) && produtoId > 0) porProduto.set(produtoId, ci);
    if (Number.isFinite(itemId) && itemId > 0) porItemId.set(itemId, ci);
  });

  return itens.map((item, index) => {
    const itemId = Number(item.itemId ?? item.id);
    const produtoId = Number(item.produtoId);
    let ref = (Number.isFinite(itemId) && porItemId.get(itemId))
      || (Number.isFinite(produtoId) && porProduto.get(produtoId))
      || null;

    if (!ref && consignacaoItens[index]) {
      ref = consignacaoItens[index];
    }
    if (!ref && consignacaoItens.length === 1) {
      ref = consignacaoItens[0];
    }

    const produtoIdFinal = Number(ref?.produtoId ?? item.produtoId) || null;
    const itemIdFinal = Number(ref?.id ?? ref?.itemId ?? item.itemId ?? item.id) || null;
    const preco = Number(item.preco ?? item.precoUnitario ?? ref?.precoUnitario ?? ref?.preco ?? 0);

    const normalizado = {
      ...item,
      itemId: itemIdFinal,
      produtoId: produtoIdFinal,
      preco,
      enviado: Number(item.enviado ?? item.quantidade ?? ref?.quantidade ?? ref?.enviado ?? 0),
      vendido: Number(item.vendido || 0),
      devolvido: Number(item.devolvido || 0),
      perdido: Number(item.perdido || 0),
      cortesia: Number(item.cortesia || 0),
      observacao: item.observacao || ''
    };
    normalizado.saldo = calcularSaldoItem(normalizado);
    return normalizado;
  });
}

function buildPayloadOperacao(item = {}, delta = 0, tipo = '') {
  const quantidade = Number(delta);
  const produtoIdRaw = item.produtoId ?? item.produto_id;
  const produtoId = Number(produtoIdRaw);
  const payload = {
    quantidade,
    usuarioId: null
  };

  if (Number.isFinite(produtoId) && produtoId > 0) {
    payload.produtoId = produtoId;
  }

  const itemId = Number(item.itemId ?? item.id);
  if (Number.isFinite(itemId) && itemId > 0) {
    payload.itemId = itemId;
  }

  if (tipo === 'venda') {
    const precoVenda = Number(item.preco ?? item.precoUnitario ?? 0);
    payload.precoVenda = Number.isFinite(precoVenda) && precoVenda >= 0 ? precoVenda : 0;
  }

  if (tipo === 'devolucao') {
    payload.observacao = item.observacao || `Devolução — ${item.produto || 'item'}`;
  }

  return payload;
}

function validarPayloadOperacao(payload = {}, tipo = '') {
  const erros = [];
  const temItem = Number.isFinite(payload.itemId) && payload.itemId > 0;
  const temProduto = Number.isFinite(payload.produtoId) && payload.produtoId > 0;
  if (!temItem && !temProduto) {
    erros.push('Produto não identificado na linha. Recarregue a tela ou selecione outro item.');
  }
  if (!Number.isFinite(payload.quantidade) || payload.quantidade <= 0) {
    erros.push('Quantidade inválida para registro.');
  }
  if (tipo === 'venda') {
    if (payload.precoVenda === undefined || payload.precoVenda === null) {
      erros.push('Preço de venda não informado.');
    } else if (typeof payload.precoVenda !== 'number' || payload.precoVenda < 0) {
      erros.push('Preço de venda inválido.');
    }
  }
  return erros;
}

function proximoCampoRetorno(campoAtual, direcao = 1) {
  const idx = CAMPOS_RETORNO_ORDEM.indexOf(campoAtual);
  if (idx < 0) return CAMPOS_RETORNO_ORDEM[0];
  const next = idx + direcao;
  if (next < 0) return CAMPOS_RETORNO_ORDEM[0];
  if (next >= CAMPOS_RETORNO_ORDEM.length) return CAMPOS_RETORNO_ORDEM[CAMPOS_RETORNO_ORDEM.length - 1];
  return CAMPOS_RETORNO_ORDEM[next];
}

module.exports = {
  MOMENTOS_FECHAMENTO,
  formatCurrency,
  formatDate,
  formatDateTime,
  calcularTotaisItens,
  calcularValorVendidoItens,
  coletarItensComRascunho,
  seletorLinhaRetorno,
  LINHA_RETORNO_SELECTOR,
  buildPainelLateralPreview,
  mergeItensRetornos,
  normalizarMovimentacoes,
  buildItensFromMovimentacoes,
  mapItensCacheParaPrestacao,
  consignacaoElegivelParaPrestacao,
  resolveClienteNome,
  calcularValorEntregue,
  buildPainelLateral,
  buildResumoEntrega,
  buildCentralEncerramento,
  buildValidacoesFinais,
  buildResumoFinalOficial,
  inicializarMomentos,
  campoParaTipo,
  CAMPOS_RETORNO_ORDEM,
  CAMPOS_MOVIMENTO_RETORNO,
  listarPendenciasRetornos,
  mensagemErroOperacional,
  possuiVendasPendentes,
  calcularSaldoItem,
  enriquecerItensPrestacao,
  buildPayloadOperacao,
  validarPayloadOperacao,
  proximoCampoRetorno
};
