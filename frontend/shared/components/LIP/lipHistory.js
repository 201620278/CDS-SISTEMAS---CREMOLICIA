/**
 * LIP — histórico local de produtos utilizados
 *
 * @module frontend/shared/components/LIP/lipHistory
 */

const DEFAULT_KEY = 'cds:lip:recent-products';
const MAX_RECENT = 12;

function readRecent(storageKey = DEFAULT_KEY) {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(storageKey);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (_error) {
    return [];
  }
}

function saveRecent(product, storageKey = DEFAULT_KEY) {
  if (!product?.id || typeof localStorage === 'undefined') return;
  const entry = {
    id: product.id,
    nome: product.nome,
    codigo: product.codigo,
    categoria: product.categoria,
    marca: product.marca,
    estoque: product.estoque,
    preco: product.preco ?? product.preco_venda,
    preco_venda: product.preco_venda ?? product.preco,
    referencia: product.referencia,
    fabricante: product.fabricante,
    usedAt: Date.now()
  };

  const list = readRecent(storageKey).filter((p) => Number(p.id) !== Number(entry.id));
  list.unshift(entry);
  localStorage.setItem(storageKey, JSON.stringify(list.slice(0, MAX_RECENT)));
}

module.exports = {
  DEFAULT_KEY,
  MAX_RECENT,
  readRecent,
  saveRecent
};
