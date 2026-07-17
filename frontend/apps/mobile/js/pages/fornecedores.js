/**
 * CDS Mobile RC2.4.2 — Cadastro de Fornecedores (paridade ERP Desktop)
 * Referência: frontend/erp/js/fornecedores.js → saveFornecedor
 */
import {
  escapeHtml,
  asText,
  formatMoney,
  loadingHtml,
  emptyHtml,
  errorHtml,
  searchBarHtml,
  listCardHtml,
  backBarHtml,
  bindBack,
  bindGo,
  debounce,
  countLabel,
  sectionTitleHtml
} from '../ui.js';
import {
  fieldHtml,
  formCardHtml,
  collectForm,
  fabHtml,
  actionBarHtml,
  confirmDanger,
  cadastroSectionHtml,
  formSubmitActionsHtml,
  bindCadastroCep,
  bindCpfCnpjMask
} from '../forms.js';
import { showToast } from '../toast.js';
import { openWhatsApp, openCall, openMaps, sharePayload } from '../native.js';

/** Payload idêntico ao Desktop saveFornecedor. */
export function buildFornecedorPayload(raw = {}) {
  return {
    nome: String(raw.nome || '').trim(),
    razao_social: String(raw.razao_social || '').trim(),
    cpf_cnpj: String(raw.cpf_cnpj || '').trim(),
    inscricao_estadual: String(raw.inscricao_estadual || '').trim(),
    telefone: String(raw.telefone || '').trim(),
    email: String(raw.email || '').trim(),
    contato: String(raw.contato || '').trim(),
    cep: String(raw.cep || '').trim(),
    rua: String(raw.rua || '').trim(),
    numero: String(raw.numero || '').trim(),
    bairro: String(raw.bairro || '').trim(),
    cidade: String(raw.cidade || '').trim(),
    uf: String(raw.uf || '').trim().toUpperCase(),
    observacoes: String(raw.observacoes || '').trim()
  };
}

function fieldsFornecedor(f = {}) {
  return `
    ${cadastroSectionHtml('Identificação')}
    ${fieldHtml({ name: 'nome', label: 'Nome', value: f.nome, required: true })}
    ${fieldHtml({ name: 'razao_social', label: 'Razão social', value: f.razao_social })}
    ${fieldHtml({ name: 'cpf_cnpj', label: 'CPF/CNPJ', value: f.cpf_cnpj, inputmode: 'numeric' })}
    ${fieldHtml({ name: 'inscricao_estadual', label: 'Inscrição Estadual', value: f.inscricao_estadual })}
    ${fieldHtml({ name: 'telefone', label: 'Telefone', value: f.telefone, type: 'tel' })}
    ${fieldHtml({ name: 'email', label: 'E-mail', value: f.email, type: 'email' })}
    ${fieldHtml({ name: 'contato', label: 'Contato', value: f.contato })}
    ${cadastroSectionHtml('Endereço')}
    ${fieldHtml({ name: 'cep', label: 'CEP', value: f.cep, inputmode: 'numeric' })}
    ${fieldHtml({ name: 'rua', label: 'Rua', value: f.rua })}
    ${fieldHtml({ name: 'numero', label: 'Número', value: f.numero })}
    ${fieldHtml({ name: 'bairro', label: 'Bairro', value: f.bairro })}
    ${fieldHtml({ name: 'cidade', label: 'Cidade', value: f.cidade })}
    ${fieldHtml({ name: 'uf', label: 'UF', value: f.uf })}
    ${cadastroSectionHtml('Observações')}
    ${fieldHtml({ name: 'observacoes', label: 'Observações', value: f.observacoes, type: 'textarea' })}
  `;
}

function enderecoTexto(f) {
  return [f.rua, f.numero, f.bairro, f.cidade, f.uf].map((x) => asText(x, '')).filter(Boolean).join(', ');
}

function paintList(list, count, rows) {
  count.textContent = countLabel(rows.length, 'fornecedor', 'fornecedores');
  list.innerHTML = rows.length
    ? rows.map((f) => listCardHtml({
        go: `fornecedores/${f.id}`,
        title: asText(f.nome, 'Fornecedor'),
        subtitle: asText(f.cpf_cnpj || f.razao_social),
        meta: [
          asText(f.inscricao_estadual, ''),
          asText(f.telefone, ''),
          asText(f.cidade, '')
        ].filter(Boolean)
      })).join('')
    : emptyHtml('Nenhum fornecedor encontrado');
  bindGo(list);
}

export async function renderList(root) {
  root.innerHTML = `
    ${searchBarHtml('Buscar fornecedor', 'fornecedores-search')}
    <p class="cds-muted" id="fornecedores-count">Carregando…</p>
    <div id="fornecedores-list">${loadingHtml()}</div>
    ${fabHtml('Novo fornecedor', 'fornecedores/novo')}
  `;

  const list = root.querySelector('#fornecedores-list');
  const count = root.querySelector('#fornecedores-count');

  const load = async (busca = '') => {
    list.innerHTML = loadingHtml('Consultando…');
    try {
      const rows = await window.CDSApi.get('fornecedores', busca ? { busca } : undefined);
      paintList(list, count, Array.isArray(rows) ? rows.slice(0, 50) : []);
    } catch (err) {
      list.innerHTML = errorHtml(err.message, err.status);
      showToast(err.message || 'Erro em fornecedores', 'error');
    }
  };

  bindGo(root);
  root.querySelector('#fornecedores-search')?.addEventListener(
    'input',
    debounce((e) => load(e.target.value), 280)
  );
  await load();
}

export async function renderForm(root, id) {
  const isNew = !id;
  root.innerHTML = loadingHtml();
  try {
    let f = {};
    if (!isNew) {
      f = await window.CDSApi.get(`fornecedores/${id}`);
    }
    root.innerHTML = `
      ${backBarHtml('Fornecedores')}
      ${formCardHtml(
        isNew ? 'Novo fornecedor' : 'Editar fornecedor',
        fieldsFornecedor(f),
        formSubmitActionsHtml(isNew ? 'Salvar' : 'Atualizar')
      )}
    `;
    bindBack(root);
    bindCpfCnpjMask(root);
    bindCadastroCep(root);

    root.querySelector('#cds-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = buildFornecedorPayload(collectForm(e.target));
      if (!body.nome) {
        showToast('Nome é obrigatório.', 'warning');
        return;
      }
      try {
        if (isNew) {
          const created = await window.CDSApi.post('fornecedores', body);
          showToast('Fornecedor criado.', 'success');
          window.CDSMobile?.navigate?.(`fornecedores/${created.id}`, { replace: true });
        } else {
          await window.CDSApi.put(`fornecedores/${id}`, body);
          showToast('Fornecedor atualizado.', 'success');
          window.CDSMobile?.navigate?.(`fornecedores/${id}`, { replace: true });
        }
      } catch (err) {
        showToast(err.message || 'Falha ao salvar', 'error');
      }
    });
  } catch (err) {
    root.innerHTML = `${backBarHtml('Fornecedores')}${errorHtml(err.message, err.status)}`;
    bindBack(root);
  }
}

export async function renderDetail(root, id) {
  root.innerHTML = loadingHtml();
  try {
    const f = await window.CDSApi.get(`fornecedores/${id}`);
    const endereco = enderecoTexto(f);
    let produtos = [];
    try {
      const nome = asText(f.nome, '');
      if (nome) {
        const payload = await window.CDSApi.get('produtos/search', { q: nome, limite: 30 });
        const items = Array.isArray(payload) ? payload : payload?.items || payload?.data || [];
        produtos = items.filter((p) =>
          String(p.fornecedor || '').toLowerCase().includes(nome.toLowerCase())
        );
        if (!produtos.length) produtos = items.slice(0, 15);
      }
    } catch (e) {
      produtos = [];
    }

    root.innerHTML = `
      ${backBarHtml('Fornecedores')}
      <article class="cds-card cds-m-enter">
        <h3 class="cds-card__title">${escapeHtml(asText(f.nome, 'Fornecedor'))}</h3>
        <div class="cds-row"><span>Razão social</span><strong>${escapeHtml(asText(f.razao_social))}</strong></div>
        <div class="cds-row"><span>Documento</span><strong>${escapeHtml(asText(f.cpf_cnpj))}</strong></div>
        <div class="cds-row"><span>Inscrição Estadual</span><strong>${escapeHtml(asText(f.inscricao_estadual))}</strong></div>
        <div class="cds-row"><span>Telefone</span><strong>${escapeHtml(asText(f.telefone))}</strong></div>
        <div class="cds-row"><span>E-mail</span><strong>${escapeHtml(asText(f.email))}</strong></div>
        <div class="cds-row"><span>Contato</span><strong>${escapeHtml(asText(f.contato))}</strong></div>
      </article>
      <article class="cds-card">
        <h3 class="cds-card__title">Endereço</h3>
        <p class="cds-mobile-break">${escapeHtml(endereco || 'Não informado')}</p>
        <p class="cds-muted">CEP ${escapeHtml(asText(f.cep))}</p>
      </article>
      ${f.observacoes ? `<article class="cds-card"><h3 class="cds-card__title">Observações</h3><p>${escapeHtml(asText(f.observacoes))}</p></article>` : ''}

      ${sectionTitleHtml('Produtos relacionados')}
      <div>
        ${produtos.length
          ? produtos.map((p) => listCardHtml({
              go: `produtos/${p.id}`,
              title: asText(p.nome, 'Produto'),
              value: formatMoney(p.preco_venda ?? p.preco ?? 0),
              meta: [asText(p.codigo || p.codigo_barras, '')]
            })).join('')
          : emptyHtml('Nenhum produto vinculado pelo nome do fornecedor')}
      </div>

      ${actionBarHtml([
        { action: 'whatsapp', label: 'WhatsApp', icon: 'phone', variant: 'secondary' },
        { action: 'ligar', label: 'Ligar', icon: 'phone', variant: 'ghost' },
        { action: 'maps', label: 'Maps', icon: 'map', variant: 'secondary' },
        { action: 'share', label: 'Compartilhar', icon: 'share', variant: 'ghost' },
        { action: 'edit', label: 'Editar', icon: 'edit', variant: 'secondary' },
        { action: 'delete', label: 'Excluir', icon: 'trash', variant: 'ghost' }
      ])}
    `;
    bindBack(root);
    bindGo(root);

    root.querySelector('[data-action="whatsapp"]')?.addEventListener('click', () => {
      openWhatsApp(f.telefone, `Olá ${asText(f.contato || f.nome)}!`);
    });
    root.querySelector('[data-action="ligar"]')?.addEventListener('click', () => openCall(f.telefone));
    root.querySelector('[data-action="maps"]')?.addEventListener('click', () => {
      openMaps(endereco || [f.cidade, f.uf].filter(Boolean).join(', '));
    });
    root.querySelector('[data-action="share"]')?.addEventListener('click', async () => {
      await sharePayload({
        title: asText(f.nome, 'Fornecedor'),
        text: `${asText(f.nome)}\n${asText(f.cpf_cnpj)}\nIE: ${asText(f.inscricao_estadual)}\n${asText(f.telefone)}\n${endereco}`
      });
    });
    root.querySelector('[data-action="edit"]')?.addEventListener('click', () => {
      window.CDSMobile?.navigate?.(`fornecedores/${id}/editar`);
    });
    root.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
      const ok = await confirmDanger(`Excluir fornecedor "${f.nome}"?`, { title: 'Excluir fornecedor', confirmLabel: 'Excluir' });
      if (!ok) return;
      try {
        await window.CDSApi.del(`fornecedores/${id}`);
        showToast('Fornecedor excluído.', 'success');
        window.CDSMobile?.navigate?.('fornecedores', { replace: true });
      } catch (err) {
        showToast(err.message || 'Não foi possível excluir', 'error');
      }
    });
  } catch (err) {
    root.innerHTML = `${backBarHtml('Fornecedores')}${errorHtml(err.message, err.status)}`;
    bindBack(root);
  }
}

export async function render(root, parsed) {
  const parts = parsed?.parts || [];
  if (parts[1] === 'novo') return renderForm(root, null);
  if (parts[1] && parts[2] === 'editar') return renderForm(root, parts[1]);
  if (parts[1]) return renderDetail(root, parts[1]);
  return renderList(root);
}

export default {
  render,
  renderDetail,
  buildFornecedorPayload,
  title: 'Fornecedores',
  subtitle: 'Cadastros'
};
