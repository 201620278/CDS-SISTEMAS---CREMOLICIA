/**
 * Exemplos — SmartSearch (FOUNDATION F3)
 *
 * Demonstra provider genérico sem domínio de motor.
 *
 * @module frontend/shared/ui/SmartSearch/examples
 */

const SmartSearch = require('./index');

/**
 * Provider in-memory genérico (qualquer entidade).
 * @param {Array<{id:string,title:string,subtitle?:string,tokens?:string[]}>} catalog
 */
function createCatalogProvider(catalog) {
  return async function provider(query, ctx = {}) {
    const q = String(query || '').toLowerCase();
    const digits = String(query || '').replace(/\D/g, '');
    const keys = Array.isArray(ctx.keys) ? ctx.keys : [];

    const items = catalog.filter((row) => {
      const hay = [
        row.title,
        row.subtitle,
        row.description,
        ...(row.tokens || []),
        ...keys.map((k) => row[k]).filter(Boolean)
      ].join(' ').toLowerCase();

      if (hay.includes(q)) return true;
      if (digits && hay.replace(/\D/g, '').includes(digits)) return true;
      return false;
    }).map((row) => ({
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      description: row.description,
      status: row.status,
      badges: row.badges,
      metadata: row.metadata,
      data: row
    }));

    return { items };
  };
}

/**
 * Exemplo mínimo com catálogo fictício multi-domínio.
 * @returns {HTMLElement}
 */
function exemploBasico() {
  const catalog = [
    { id: '1', title: 'Maria Silva', subtitle: '123.456.789-00', tokens: ['11999990000'], status: 'Ativo' },
    { id: '2', title: 'Empresa Alfa Ltda', subtitle: '12.345.678/0001-90', tokens: ['DOC-90'], badges: ['PJ'] },
    { id: '3', title: 'Produto X', subtitle: 'SKU-7788', tokens: ['7891000100010'], metadata: { Código: 'SKU-7788' } }
  ];

  return SmartSearch.create({
    placeholder: 'Nome, documento, código ou telefone…',
    debounce: 200,
    keys: ['sku', 'barcode'],
    provider: createCatalogProvider(catalog),
    onSelect: (item) => {
      // consumidor decide o que fazer com item.data
      console.info('selecionado', item.id, item.title);
    }
  });
}

/**
 * Exemplo sem EntityCard (lista simples).
 * @returns {HTMLElement}
 */
function exemploListaSimples() {
  return SmartSearch.create({
    useEntityCard: false,
    placeholder: 'Pesquisar…',
    provider: async (query) => ([
      { id: 'a', title: `Resultado para "${query}"`, subtitle: 'Descrição genérica' }
    ]),
    onSelect: () => {}
  });
}

module.exports = {
  createCatalogProvider,
  exemploBasico,
  exemploListaSimples
};
