/**
 * CDS Mobile RC2.1 — Fluxo Venda Completa (PDV)
 * Caixa + venda + fiscal + histórico. Regras apenas no backend.
 */
import {
  escapeHtml,
  asText,
  formatMoney,
  formatNumber,
  formatDateTime,
  loadingHtml,
  emptyHtml,
  errorHtml,
  searchBarHtml,
  sectionTitleHtml,
  debounce,
  icon,
  listCardHtml,
  bindGo
} from '../ui.js';
import { showToast } from '../toast.js';
import {
  fieldHtml,
  tabsHtml,
  promptSheet,
  confirmSheet,
  openBottomSheet,
  closeBottomSheet
} from '../forms.js';
import { canDoAction } from '../permissions.js';
import {
  isTerminalRegistered,
  getStoredTerminal,
  getSuggestedTerminalName,
  registerTerminal,
  startHeartbeat,
  getTerminalRequestBody
} from '../terminal.js';
import { shareTextAsFile } from '../native.js';
import {
  fetchDanfeHtml as fetchDanfeHtmlCupom,
  montarHtmlCupomNaoFiscal,
  mostrarCupomNoCelular,
  mostrarCupomAposEmissao
} from '../cupom.js';

const CART_KEY = 'cds-mobile-pdv-cart';
const META_KEY = 'cds-mobile-pdv-meta';

function loadCart() {
  try {
    return JSON.parse(sessionStorage.getItem(CART_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function saveCart(items) {
  try {
    sessionStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch (e) { /* ignore */ }
}

function loadMeta() {
  try {
    return JSON.parse(sessionStorage.getItem(META_KEY) || '{}') || {};
  } catch (e) {
    return {};
  }
}

function saveMeta(meta) {
  try {
    sessionStorage.setItem(META_KEY, JSON.stringify(meta || {}));
  } catch (e) { /* ignore */ }
}

function cartSubtotal(items) {
  return items.reduce((sum, i) => sum + Number(i.preco || 0) * Number(i.qtd || 0), 0);
}

function cartTotals(items, meta = loadMeta()) {
  const sub = cartSubtotal(items);
  const desconto = Math.max(0, Number(meta.desconto || 0));
  const acrescimo = Math.max(0, Number(meta.acrescimo || 0));
  const total = Math.max(0, sub - desconto + acrescimo);
  return { sub, desconto, acrescimo, total };
}

function unwrapItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.produtos)) return payload.produtos;
  return [];
}

function isCaixaAberto(caixa) {
  if (!caixa || typeof caixa !== 'object') return false;
  return !!(caixa.id || caixa.caixa_id || caixa.status === 'aberto' || caixa.aberto === true);
}

function parseTab(parts) {
  const t = parts?.[1];
  if (t === 'vendas' || t === 'caixa' || t === 'vender') return t;
  return 'vender';
}

async function askAdminPassword(titulo) {
  const data = await promptSheet({
    title: titulo || 'Senha do administrador',
    confirmLabel: 'Continuar',
    fieldsHtml: fieldHtml({
      name: 'senha_admin',
      label: 'Senha',
      type: 'password',
      required: true,
      autocomplete: 'current-password'
    })
  });
  return data?.senha_admin ? String(data.senha_admin) : null;
}

async function postCaixa(path, body, needsPerm) {
  let payload = getTerminalRequestBody(body || {});
  try {
    return await window.CDSApi.post(path, payload);
  } catch (err) {
    const needsPwd = err?.body?.requer_senha_admin || /senha/i.test(String(err?.message || ''));
    if (!needsPwd && canDoAction(needsPerm)) throw err;
    const senha = await askAdminPassword('Autorização necessária');
    if (!senha) throw new Error('Operação cancelada.');
    payload = getTerminalRequestBody({ ...(body || {}), senha_admin: senha });
    return window.CDSApi.post(path, payload);
  }
}

function renderRegisterTerminal(root) {
  const suggested = getSuggestedTerminalName();
  root.innerHTML = `
    <section class="cds-home-hero cds-m-enter" style="padding-bottom:10px">
      <p class="cds-home-hero__greet">PDV Mobile</p>
      <h1 class="cds-home-hero__name" style="font-size:1.35rem">Registrar Terminal</h1>
      <p class="cds-home-hero__company">Este dispositivo precisa ser registrado na Plataforma CDS.</p>
    </section>
    <article class="cds-card">
      ${fieldHtml({ name: 'nome', label: 'Nome do terminal', value: suggested })}
      <button type="button" class="cds-mobile-btn" id="pdv-term-reg" style="margin-top:14px;width:100%">
        ${icon('check')} Registrar Terminal
      </button>
    </article>
  `;
  root.querySelector('#pdv-term-reg')?.addEventListener('click', async () => {
    const nome = String(root.querySelector('[name="nome"]')?.value || '').trim();
    if (!nome) {
      showToast('Informe um nome para o terminal.', 'warning');
      return;
    }
    try {
      await registerTerminal(nome);
      showToast('Terminal registrado.', 'success');
      window.CDSMobile?.navigate?.('pdv', { replace: true });
    } catch (err) {
      showToast(err.message || 'Falha ao registrar terminal.', 'error');
    }
  });
}

async function fetchCaixa() {
  try {
    return await window.CDSApi.get('caixa/aberto', getTerminalRequestBody());
  } catch (err) {
    return { __error: err };
  }
}

async function renderCaixaTab(root, caixa) {
  const aberto = isCaixaAberto(caixa) && !caixa.__error;
  const term = getStoredTerminal();

  root.innerHTML = `
    ${tabsHtml([
      { id: 'caixa', go: 'pdv/caixa', label: 'Caixa' },
      { id: 'vender', go: 'pdv', label: 'Vender' },
      { id: 'vendas', go: 'pdv/vendas', label: 'Vendas' }
    ], 'caixa')}
    <article class="cds-card" style="margin-top:12px">
      <div class="cds-row"><span>Terminal</span><strong>${escapeHtml(asText(term.nome, '—'))}</strong></div>
      <div class="cds-row"><span>Status</span><strong>${aberto ? 'Aberto' : 'Fechado'}</strong></div>
      ${aberto ? `
        <div class="cds-row"><span>Sessão</span><strong>${escapeHtml(asText(caixa.id || caixa.caixa_id))}</strong></div>
        <div class="cds-row"><span>Operador</span><strong>${escapeHtml(asText(caixa.usuario_nome || caixa.operador || '—'))}</strong></div>
        <div class="cds-row"><span>Esperado</span><strong>${escapeHtml(formatMoney(caixa.dinheiro?.dinheiro_esperado ?? caixa.saldo_geral ?? 0))}</strong></div>
      ` : `
        <p class="cds-muted">${escapeHtml(caixa?.__error?.message || 'Abra o caixa para vender.')}</p>
      `}
    </article>
    <div class="cds-stack" style="margin-top:12px;gap:8px">
      ${!aberto ? `
        <button type="button" class="cds-mobile-btn" id="pdv-abrir" ${canDoAction('abrir_caixa') ? '' : 'disabled'}>
          ${icon('coins')} Abrir caixa
        </button>
      ` : `
        <button type="button" class="cds-mobile-btn cds-mobile-btn--secondary" id="pdv-sangria" ${canDoAction('sangria_caixa') ? '' : 'disabled'}>Sangria</button>
        <button type="button" class="cds-mobile-btn cds-mobile-btn--secondary" id="pdv-suprimento" ${canDoAction('suprimento_caixa') ? '' : 'disabled'}>Suprimento</button>
        <button type="button" class="cds-mobile-btn cds-mobile-btn--danger" id="pdv-fechar" ${canDoAction('fechar_caixa') ? '' : 'disabled'}>Fechar caixa</button>
      `}
    </div>
  `;
  bindGo(root);

  root.querySelector('#pdv-abrir')?.addEventListener('click', async () => {
    try {
      let valorInicial = 0;
      try {
        const sug = await window.CDSApi.get('caixa/saldo-inicial-sugerido', getTerminalRequestBody());
        valorInicial = Number(sug?.valor_sugerido || 0);
      } catch (e) { /* 0 */ }
      const data = await promptSheet({
        title: 'Abrir caixa',
        confirmLabel: 'Abrir',
        fieldsHtml: fieldHtml({
          name: 'valor_inicial',
          label: 'Valor inicial',
          value: valorInicial.toFixed(2).replace('.', ','),
          inputmode: 'decimal'
        })
      });
      if (!data) return;
      const valor = Number(String(data.valor_inicial || '0').replace(/\./g, '').replace(',', '.')) || 0;
      await postCaixa('caixa/abrir', { valor_inicial: valor }, 'abrir_caixa');
      showToast('Caixa aberto.', 'success');
      window.CDSMobile?.navigate?.('pdv/caixa', { replace: true });
    } catch (err) {
      showToast(err.message || 'Falha ao abrir caixa.', 'error');
    }
  });

  root.querySelector('#pdv-sangria')?.addEventListener('click', async () => {
    try {
      const data = await promptSheet({
        title: 'Sangria',
        confirmLabel: 'Registrar',
        fieldsHtml: [
          fieldHtml({ name: 'valor', label: 'Valor', inputmode: 'decimal', required: true }),
          fieldHtml({ name: 'motivo', label: 'Motivo', required: true })
        ].join('')
      });
      if (!data) return;
      const valor = Number(String(data.valor || '0').replace(/\./g, '').replace(',', '.')) || 0;
      await postCaixa('caixa/sangria', { valor, motivo: data.motivo }, 'sangria_caixa');
      showToast('Sangria registrada.', 'success');
      window.CDSMobile?.navigate?.('pdv/caixa', { replace: true });
    } catch (err) {
      showToast(err.message || 'Falha na sangria.', 'error');
    }
  });

  root.querySelector('#pdv-suprimento')?.addEventListener('click', async () => {
    try {
      const data = await promptSheet({
        title: 'Suprimento',
        confirmLabel: 'Registrar',
        fieldsHtml: [
          fieldHtml({ name: 'valor', label: 'Valor', inputmode: 'decimal', required: true }),
          fieldHtml({ name: 'motivo', label: 'Motivo', required: true })
        ].join('')
      });
      if (!data) return;
      const valor = Number(String(data.valor || '0').replace(/\./g, '').replace(',', '.')) || 0;
      await postCaixa('caixa/suprimento', { valor, motivo: data.motivo }, 'suprimento_caixa');
      showToast('Suprimento registrado.', 'success');
      window.CDSMobile?.navigate?.('pdv/caixa', { replace: true });
    } catch (err) {
      showToast(err.message || 'Falha no suprimento.', 'error');
    }
  });

  root.querySelector('#pdv-fechar')?.addEventListener('click', async () => {
    try {
      const data = await promptSheet({
        title: 'Fechar caixa',
        confirmLabel: 'Fechar',
        fieldsHtml: [
          fieldHtml({ name: 'valor_informado', label: 'Dinheiro contado', inputmode: 'decimal', required: true }),
          fieldHtml({ name: 'observacao', label: 'Observação', type: 'textarea' })
        ].join('')
      });
      if (!data) return;
      const ok = await confirmSheet({
        title: 'Confirmar fechamento',
        message: 'Tem certeza que deseja fechar o caixa?',
        confirmLabel: 'Fechar caixa',
        danger: true
      });
      if (!ok) return;
      const valor = Number(String(data.valor_informado || '0').replace(/\./g, '').replace(',', '.')) || 0;
      await window.CDSApi.post('caixa/fechar', getTerminalRequestBody({
        valor_informado: valor,
        observacao: data.observacao || ''
      }));
      showToast('Caixa fechado.', 'success');
      window.CDSMobile?.navigate?.('pdv/caixa', { replace: true });
    } catch (err) {
      showToast(err.message || 'Falha ao fechar caixa.', 'error');
    }
  });
}

function paintCart(root, aberto) {
  const cart = loadCart();
  const meta = loadMeta();
  const { sub, desconto, acrescimo, total } = cartTotals(cart, meta);
  const host = root.querySelector('#pdv-cart');
  const sticky = root.querySelector('#pdv-sticky');
  if (!host) return;

  host.innerHTML = cart.length
    ? cart.map((i, idx) => `
        <article class="cds-list-card cds-list-card--static">
          <div class="cds-list-card__main">
            <h3 class="cds-list-card__title">${escapeHtml(asText(i.nome, 'Item'))}</h3>
            <p class="cds-list-card__subtitle">${escapeHtml(formatMoney(i.preco))} · ${escapeHtml(asText(i.codigo))}</p>
            <div class="cds-qty" data-idx="${idx}">
              <button type="button" data-qty="-1" aria-label="Menos">−</button>
              <strong>${escapeHtml(formatNumber(i.qtd, 2))}</strong>
              <button type="button" data-qty="1" aria-label="Mais">+</button>
            </div>
          </div>
          <div class="cds-list-card__side">
            <strong class="cds-list-card__value">${escapeHtml(formatMoney(Number(i.preco) * Number(i.qtd)))}</strong>
            <button type="button" class="cds-icon-action" data-remove="${idx}" aria-label="Remover">${icon('trash')}</button>
          </div>
        </article>
      `).join('')
    : emptyHtml('Carrinho vazio');

  if (sticky) {
    sticky.innerHTML = `
      <div class="cds-row"><span>Subtotal</span><strong>${escapeHtml(formatMoney(sub))}</strong></div>
      <div class="cds-row"><span>Desconto</span><strong>- ${escapeHtml(formatMoney(desconto))}</strong></div>
      <div class="cds-row"><span>Acréscimo</span><strong>+ ${escapeHtml(formatMoney(acrescimo))}</strong></div>
      <div class="cds-row"><span>Total</span><strong>${escapeHtml(formatMoney(total))}</strong></div>
      <div class="cds-action-bar" style="margin-top:10px">
        <button type="button" class="cds-mobile-btn cds-mobile-btn--secondary" id="pdv-desc" ${!cart.length ? 'disabled' : ''}>Desc/Acr</button>
        <button type="button" class="cds-mobile-btn" id="pdv-pay" ${!cart.length || !aberto ? 'disabled' : ''}>
          ${icon('cart')} Finalizar
        </button>
      </div>
    `;
  }

  host.querySelectorAll('[data-qty]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const wrap = btn.closest('[data-idx]');
      const idx = Number(wrap?.getAttribute('data-idx'));
      const delta = Number(btn.getAttribute('data-qty'));
      const next = loadCart();
      if (!next[idx]) return;
      const nova = Number(next[idx].qtd) + delta;
      if (nova <= 0) next.splice(idx, 1);
      else next[idx].qtd = nova;
      saveCart(next);
      paintCart(root, aberto);
    });
  });

  host.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-remove'));
      const next = loadCart();
      next.splice(idx, 1);
      saveCart(next);
      paintCart(root, aberto);
    });
  });

  sticky?.querySelector('#pdv-desc')?.addEventListener('click', async () => {
    const cur = loadMeta();
    const data = await promptSheet({
      title: 'Desconto / Acréscimo',
      confirmLabel: 'Aplicar',
      fieldsHtml: [
        fieldHtml({ name: 'desconto', label: 'Desconto (R$)', value: cur.desconto || 0, inputmode: 'decimal' }),
        fieldHtml({ name: 'acrescimo', label: 'Acréscimo (R$)', value: cur.acrescimo || 0, inputmode: 'decimal' })
      ].join('')
    });
    if (!data) return;
    saveMeta({
      desconto: Number(String(data.desconto || '0').replace(/\./g, '').replace(',', '.')) || 0,
      acrescimo: Number(String(data.acrescimo || '0').replace(/\./g, '').replace(',', '.')) || 0
    });
    paintCart(root, aberto);
  });

  sticky?.querySelector('#pdv-pay')?.addEventListener('click', () => iniciarPagamento(root, aberto));
}

async function tryTef(forma, valor) {
  try {
    await window.CDSApi.get('tef/status');
  } catch (e) {
    showToast('TEF indisponível neste dispositivo. Use PIX, dinheiro ou cartão não-fiscal.', 'warning');
    return null;
  }
  try {
    return await window.CDSApi.post('tef/pagar', getTerminalRequestBody({
      forma_pagamento: forma,
      valor
    }));
  } catch (err) {
    showToast(err.message || 'Falha no TEF.', 'error');
    return null;
  }
}

async function iniciarPagamento(root, aberto) {
  if (!aberto) {
    showToast('Abra o caixa antes de vender.', 'warning');
    return;
  }
  const cart = loadCart();
  if (!cart.length) return;
  const { total, desconto } = cartTotals(cart);

  openBottomSheet({
    title: 'Forma de pagamento',
    bodyHtml: `
      <p class="cds-muted">Total ${escapeHtml(formatMoney(total))}</p>
      <div class="cds-pay-grid">
        <button type="button" class="cds-mobile-btn" data-pay="dinheiro">Dinheiro</button>
        <button type="button" class="cds-mobile-btn" data-pay="pix">PIX</button>
        <button type="button" class="cds-mobile-btn" data-pay="cartao">Cartão</button>
        <button type="button" class="cds-mobile-btn cds-mobile-btn--secondary" data-pay="tef">TEF</button>
      </div>
      <label class="cds-field cds-field--check" style="margin-top:12px">
        <input type="checkbox" id="pdv-emit-nfce" ${canDoAction('emitir_nfce') ? '' : 'disabled'}>
        <span>Emitir NFC-e após a venda</span>
      </label>
    `
  });

  document.querySelectorAll('#cds-mobile-sheet [data-pay]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const forma = btn.getAttribute('data-pay');
      const emitir = !!document.querySelector('#pdv-emit-nfce')?.checked;
      closeBottomSheet();
      await finalizarVenda({ forma, emitir, total, desconto, cart });
    });
  });
}

async function finalizarVenda({ forma, emitir, total, desconto, cart }) {
  try {
    let formaFinal = forma === 'tef' ? 'cartao' : forma;
    let tefPayload = null;
    if (forma === 'tef') {
      tefPayload = await tryTef('credito', total);
      if (!tefPayload) return;
      formaFinal = 'cartao';
    }

    let valorRecebido = total;
    if (formaFinal === 'dinheiro') {
      const data = await promptSheet({
        title: 'Dinheiro',
        confirmLabel: 'Confirmar',
        fieldsHtml: fieldHtml({
          name: 'valor_recebido',
          label: 'Valor recebido',
          value: total.toFixed(2).replace('.', ','),
          inputmode: 'decimal'
        })
      });
      if (!data) return;
      valorRecebido = Number(String(data.valor_recebido || '0').replace(/\./g, '').replace(',', '.')) || 0;
      if (valorRecebido < total) {
        showToast('Valor recebido insuficiente.', 'warning');
        return;
      }
    }

    const itens = cart.map((i) => ({
      produto_id: i.id,
      quantidade: Number(i.qtd),
      preco_unitario: Number(i.preco),
      desconto_percentual: 0
    }));

    const preview = await window.CDSApi.post(
      'vendas/pre-calcular-distribuicao',
      getTerminalRequestBody({ itens, emitir_fiscal: emitir })
    );
    const valorFiscal = Number(preview?.valor_fiscal ?? preview?.total_fiscal ?? (emitir ? total : 0));
    const valorNaoFiscal = Number(preview?.valor_nao_fiscal ?? preview?.total_nao_fiscal ?? (emitir ? 0 : total));
    const itensDist = Array.isArray(preview?.itens) ? preview.itens : itens;

    const payload = getTerminalRequestBody({
      itens: itensDist.map((it) => ({
        produto_id: it.produto_id || it.id,
        quantidade: it.quantidade || it.qtd,
        preco_unitario: it.preco_unitario || it.preco,
        desconto_percentual: it.desconto_percentual || 0,
        item_fiscal: it.item_fiscal,
        quantidade_fiscal: it.quantidade_fiscal,
        quantidade_nao_fiscal: it.quantidade_nao_fiscal,
        valor_fiscal: it.valor_fiscal,
        valor_nao_fiscal: it.valor_nao_fiscal
      })),
      total,
      desconto,
      forma_pagamento: formaFinal,
      valor_recebido: valorRecebido,
      emitir_fiscal: emitir && valorFiscal > 0,
      valor_fiscal: valorFiscal,
      valor_nao_fiscal: valorNaoFiscal,
      pagamentos: [{
        forma_pagamento: formaFinal,
        valor: total,
        tipo_recebimento: valorFiscal > 0 && valorNaoFiscal <= 0 ? 'fiscal' : (valorFiscal > 0 ? 'fiscal' : 'nao_fiscal'),
        ...(tefPayload ? { tef: tefPayload } : {})
      }]
    });

    const resp = await window.CDSApi.post('vendas', payload);
    const vendaId = resp?.venda_id || resp?.id || resp?.vendaId || resp?.venda?.id;

    if (resp?.status_pagamento === 'aguardando_nao_fiscal' && vendaId) {
      await window.CDSApi.post(
        `vendas/${vendaId}/pagamento-nao-fiscal`,
        getTerminalRequestBody({
          forma_pagamento: formaFinal,
          valor: valorNaoFiscal || total,
          valor_recebido: valorRecebido
        })
      );
    }

    if (emitir && vendaId && valorFiscal > 0 && canDoAction('emitir_nfce')) {
      try {
        await window.CDSApi.post(`fiscal/emitir/venda/${vendaId}`, {});
        showToast(`Venda #${vendaId} · NFC-e emitida.`, 'success');
      } catch (nfErr) {
        showToast(`Venda #${vendaId} ok. NFC-e: ${nfErr.message || 'falha'}`, 'warning');
      }
    } else {
      showToast(vendaId ? `Venda #${vendaId} finalizada.` : 'Venda finalizada.', 'success');
    }

    saveCart([]);
    saveMeta({});
    window.CDSMobile?.navigate?.('pdv/vendas', { replace: true });
  } catch (err) {
    showToast(err.message || 'Falha ao finalizar venda.', 'error');
  }
}

async function renderVenderTab(root, caixa) {
  const aberto = isCaixaAberto(caixa) && !caixa.__error;
  const term = getStoredTerminal();

  root.innerHTML = `
    ${tabsHtml([
      { id: 'caixa', go: 'pdv/caixa', label: 'Caixa' },
      { id: 'vender', go: 'pdv', label: 'Vender' },
      { id: 'vendas', go: 'pdv/vendas', label: 'Vendas' }
    ], 'vender')}
    <p class="cds-muted" style="margin:10px 0 0">
      ${aberto ? `Caixa aberto · ${escapeHtml(asText(term.nome))}` : 'Caixa fechado — abra na aba Caixa'}
    </p>
    ${sectionTitleHtml('Buscar / consulta preço')}
    ${searchBarHtml('Código, EAN ou nome', 'pdv-search')}
    <p class="cds-muted" style="margin:4px 0 0">Toque no produto para adicionar · preço exibido na consulta</p>
    <div id="pdv-results">${emptyHtml('Busque um produto')}</div>
    ${sectionTitleHtml('Carrinho')}
    <div id="pdv-cart"></div>
    <div class="cds-pdv-sticky" id="pdv-sticky"></div>
  `;
  bindGo(root);
  paintCart(root, aberto);

  const results = root.querySelector('#pdv-results');
  root.querySelector('#pdv-search')?.addEventListener('input', debounce(async (e) => {
    const q = String(e.target.value || '').trim();
    if (q.length < 1) {
      results.innerHTML = emptyHtml('Busque um produto');
      return;
    }
    results.innerHTML = loadingHtml('Buscando…');
    try {
      let payload;
      try {
        payload = await window.CDSApi.get('produtos/consulta-pdv/buscar', { q, termo: q, busca: q });
      } catch (e1) {
        payload = await window.CDSApi.get('produtos/search', { q, limite: 20 });
      }
      const items = unwrapItems(payload);
      results.innerHTML = items.length
        ? items.map((p) => `
            <button type="button" class="cds-list-card" data-pid="${escapeHtml(p.id)}"
              data-nome="${escapeHtml(asText(p.nome))}"
              data-codigo="${escapeHtml(asText(p.codigo || p.codigo_barras))}"
              data-preco="${escapeHtml(p.preco_venda ?? p.preco ?? 0)}">
              <div class="cds-list-card__main">
                <h3 class="cds-list-card__title">${escapeHtml(asText(p.nome))}</h3>
                <p class="cds-list-card__subtitle">${escapeHtml(asText(p.codigo || p.codigo_barras))} · ${escapeHtml(formatMoney(p.preco_venda ?? p.preco ?? 0))}</p>
              </div>
              <div class="cds-list-card__side">${icon('plus')}</div>
            </button>
          `).join('')
        : emptyHtml('Nenhum produto');

      results.querySelectorAll('[data-pid]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const item = {
            id: btn.getAttribute('data-pid'),
            nome: btn.getAttribute('data-nome'),
            codigo: btn.getAttribute('data-codigo'),
            preco: Number(btn.getAttribute('data-preco') || 0),
            qtd: 1
          };
          const next = loadCart();
          const existing = next.find((x) => String(x.id) === String(item.id));
          if (existing) existing.qtd = Number(existing.qtd) + 1;
          else next.push(item);
          saveCart(next);
          showToast('Item adicionado.', 'success');
          paintCart(root, aberto);
        });
      });
    } catch (err) {
      results.innerHTML = errorHtml(err.message, err.status);
    }
  }, 280));
}

async function renderVendasTab(root) {
  root.innerHTML = `
    ${tabsHtml([
      { id: 'caixa', go: 'pdv/caixa', label: 'Caixa' },
      { id: 'vender', go: 'pdv', label: 'Vender' },
      { id: 'vendas', go: 'pdv/vendas', label: 'Vendas' }
    ], 'vendas')}
    <div id="pdv-vendas-list" style="margin-top:12px">${loadingHtml('Carregando vendas…')}</div>
  `;
  bindGo(root);
  const list = root.querySelector('#pdv-vendas-list');
  try {
    let rows = await window.CDSApi.get('vendas', { limite: 40 });
    if (!Array.isArray(rows)) rows = rows?.data || rows?.vendas || [];
    list.innerHTML = rows.length
      ? rows.slice(0, 40).map((v) => listCardHtml({
          go: `pdv/venda/${v.id}`,
          title: `Venda #${asText(v.id)}`,
          value: formatMoney(v.total ?? v.valor_total ?? 0),
          status: v.status || (v.cancelada ? 'cancelada' : 'ok'),
          meta: [formatDateTime(v.data || v.created_at || v.criado_em), asText(v.forma_pagamento, '')].filter(Boolean)
        })).join('')
      : emptyHtml('Nenhuma venda recente');
    bindGo(list);
  } catch (err) {
    list.innerHTML = errorHtml(err.message, err.status);
  }
}

async function renderVendaDetalhe(root, id) {
  root.innerHTML = loadingHtml('Carregando venda…');
  try {
    let venda;
    try {
      venda = await window.CDSApi.get(`vendas/${id}/detalhes`);
    } catch (e) {
      venda = await window.CDSApi.get(`vendas/${id}`);
    }
    const v = venda?.venda || venda || {};
    const itens = venda?.itens || v.itens || [];
    root.innerHTML = `
      <button type="button" class="cds-back" data-go="pdv/vendas">${icon('chevronLeft')} Voltar</button>
      <article class="cds-card">
        <div class="cds-row"><span>Venda</span><strong>#${escapeHtml(asText(v.id || id))}</strong></div>
        <div class="cds-row"><span>Total</span><strong>${escapeHtml(formatMoney(v.total ?? v.valor_total ?? 0))}</strong></div>
        <div class="cds-row"><span>Pagamento</span><strong>${escapeHtml(asText(v.forma_pagamento, '—'))}</strong></div>
        <div class="cds-row"><span>Status</span><strong>${escapeHtml(asText(v.status, '—'))}</strong></div>
      </article>
      ${sectionTitleHtml('Itens')}
      <div>
        ${itens.length
          ? itens.map((i) => listCardHtml({
              title: asText(i.produto_nome || i.nome, 'Item'),
              subtitle: `Qtd ${formatNumber(i.quantidade, 2)}`,
              value: formatMoney(i.subtotal ?? (Number(i.preco_unitario) * Number(i.quantidade)))
            })).join('')
          : emptyHtml('Sem itens')}
      </div>
      <div class="cds-action-bar">
        ${canDoAction('emitir_nfce') ? `<button type="button" class="cds-mobile-btn cds-mobile-btn--secondary" id="vd-nfce">Emitir NFC-e</button>` : ''}
        <button type="button" class="cds-mobile-btn cds-mobile-btn--secondary" id="vd-danfe">DANFE</button>
        <button type="button" class="cds-mobile-btn cds-mobile-btn--secondary" id="vd-share-danfe">Compartilhar DANFE</button>
        <button type="button" class="cds-mobile-btn cds-mobile-btn--ghost" id="vd-share-xml">Compartilhar XML</button>
        ${canDoAction('cancelar_nfce') ? `<button type="button" class="cds-mobile-btn cds-mobile-btn--danger" id="vd-cancel-nfce">Cancelar NFC-e</button>` : ''}
        ${canDoAction('cancelar_nfce') ? `<button type="button" class="cds-mobile-btn cds-mobile-btn--danger" id="vd-cancel">Cancelar venda</button>` : ''}
      </div>
    `;
    bindGo(root);

    async function fetchDanfeHtml() {
      return fetchDanfeHtmlCupom(id);
    }

    async function findNotaVenda() {
      try {
        const notas = await window.CDSApi.get('fiscal/notas', { todas: 1 });
        const list = Array.isArray(notas) ? notas : [];
        return list.find((n) => Number(n.venda_id) === Number(id)) || null;
      } catch (e) {
        return null;
      }
    }

    root.querySelector('#vd-nfce')?.addEventListener('click', async () => {
      try {
        const raw = await window.CDSApi.post(`fiscal/emitir/venda/${id}`, {});
        await mostrarCupomAposEmissao(raw, { vendaIdFallback: id });
      } catch (err) {
        // Mesmo com erro de emissão, tenta exibir cupom não fiscal se a venda existir
        try {
          const vendaRaw = await window.CDSApi.get(`vendas/${id}`);
          const venda = vendaRaw?.data?.venda || vendaRaw?.data || vendaRaw;
          if (venda) {
            const html = montarHtmlCupomNaoFiscal(id, venda);
            await mostrarCupomNoCelular(html, {
              title: 'Cupom não fiscal',
              fileName: `cupom-nao-fiscal-${id}.html`
            });
            return;
          }
        } catch (e2) { /* ignore */ }
        showToast(err.message || 'Falha na NFC-e', 'error');
      }
    });

    root.querySelector('#vd-danfe')?.addEventListener('click', async () => {
      try {
        const html = await fetchDanfeHtml();
        await mostrarCupomNoCelular(html, {
          title: 'Cupom fiscal (DANFE)',
          fileName: `danfe-venda-${id}.html`
        });
      } catch (err) {
        try {
          const vendaRaw = await window.CDSApi.get(`vendas/${id}`);
          const venda = vendaRaw?.data?.venda || vendaRaw?.data || vendaRaw;
          if (!venda) throw err;
          const html = montarHtmlCupomNaoFiscal(id, venda);
          await mostrarCupomNoCelular(html, {
            title: 'Cupom não fiscal',
            fileName: `cupom-nao-fiscal-${id}.html`
          });
        } catch (e2) {
          showToast(err.message || 'Falha ao abrir cupom', 'error');
        }
      }
    });

    root.querySelector('#vd-share-danfe')?.addEventListener('click', async () => {
      try {
        const html = await fetchDanfeHtml();
        await shareTextAsFile(`danfe-venda-${id}.html`, html, 'text/html');
      } catch (err) {
        showToast(err.message || 'Falha ao compartilhar DANFE', 'error');
      }
    });

    root.querySelector('#vd-share-xml')?.addEventListener('click', async () => {
      try {
        const nota = await findNotaVenda();
        const xml = nota?.xml_autorizado || nota?.xml || nota?.xml_retorno || '';
        if (!xml) {
          showToast('XML não disponível nesta nota.', 'warning');
          return;
        }
        await shareTextAsFile(`nfce-venda-${id}.xml`, xml, 'application/xml');
      } catch (err) {
        showToast(err.message || 'Falha ao compartilhar XML', 'error');
      }
    });

    root.querySelector('#vd-cancel-nfce')?.addEventListener('click', async () => {
      const nota = await findNotaVenda();
      if (!nota?.id) {
        showToast('NFC-e não encontrada para esta venda.', 'warning');
        return;
      }
      const data = await promptSheet({
        title: 'Cancelar NFC-e',
        confirmLabel: 'Cancelar NFC-e',
        fieldsHtml: fieldHtml({
          name: 'justificativa',
          label: 'Justificativa (mín. 15 caracteres)',
          type: 'textarea',
          required: true
        })
      });
      if (!data?.justificativa) return;
      try {
        await window.CDSApi.post(`fiscal/notas/${nota.id}/cancelar`, {
          justificativa: data.justificativa
        });
        showToast('Cancelamento de NFC-e enviado.', 'success');
      } catch (err) {
        showToast(err.message || 'Falha ao cancelar NFC-e', 'error');
      }
    });

    root.querySelector('#vd-cancel')?.addEventListener('click', async () => {
      const ok = await confirmSheet({
        title: 'Cancelar venda',
        message: `Cancelar a venda #${id}?`,
        confirmLabel: 'Cancelar venda',
        danger: true
      });
      if (!ok) return;
      try {
        try {
          await window.CDSApi.put(`vendas/${id}/cancelar`, getTerminalRequestBody({}));
        } catch (e1) {
          await window.CDSApi.post(`vendas/cancelar/${id}`, getTerminalRequestBody({}));
        }
        showToast('Venda cancelada.', 'success');
        window.CDSMobile?.navigate?.('pdv/vendas', { replace: true });
      } catch (err) {
        showToast(err.message || 'Falha ao cancelar', 'error');
      }
    });
  } catch (err) {
    root.innerHTML = errorHtml(err.message, err.status);
  }
}

export async function renderPdv(root, ctx = {}) {
  root.innerHTML = loadingHtml('Abrindo PDV…');
  try {
    if (!isTerminalRegistered()) {
      renderRegisterTerminal(root);
      return;
    }
    startHeartbeat();

    const parts = ctx.parts || [];
    if (parts[1] === 'venda' && parts[2]) {
      await renderVendaDetalhe(root, parts[2]);
      return;
    }

    const tab = parseTab(parts);
    const caixa = await fetchCaixa();

    if (tab === 'caixa') await renderCaixaTab(root, caixa);
    else if (tab === 'vendas') await renderVendasTab(root);
    else await renderVenderTab(root, caixa);
  } catch (err) {
    root.innerHTML = errorHtml(err.message || 'Erro no PDV Mobile.', err.status);
  }
}

export default { render: renderPdv, title: 'PDV', subtitle: 'Operacional' };
