/**
 * Capacidades Comerciais — mapeamento UX ↔ perfilTipo (backend).
 *
 * Sprint UX-01: oculta Perfil Comercial do operador.
 *
 * @module frontend/modules/motor-comercial/pages/PerfilComercial/capacidadesComerciais
 */

const CAPACIDADES_DEFINICOES = [
  {
    key: 'consignacao',
    label: 'Consignação',
    perfilTipo: 'CONSIGNADO',
    configFields: ['limiteComercial', 'prazoPrestacao', 'observacoes']
  },
  {
    key: 'atacado',
    label: 'Atacado',
    perfilTipo: 'ATACADISTA',
    configFields: ['limiteComercial', 'observacoes']
  },
  {
    key: 'credito',
    label: 'Crédito',
    perfilTipo: 'CONSUMIDOR',
    configFields: ['limiteCredito', 'observacoes']
  },
  {
    key: 'convenio',
    label: 'Convênio',
    perfilTipo: 'DISTRIBUIDOR',
    configFields: ['limiteComercial', 'observacoes']
  },
  {
    key: 'revenda',
    label: 'Revenda',
    perfilTipo: 'REPRESENTANTE',
    configFields: ['limiteComercial', 'observacoes']
  },
  {
    key: 'entregaProgramada',
    label: 'Entrega Programada',
    perfilTipo: 'REPRESENTANTE',
    configFields: ['observacoes'],
    aliasOf: 'REPRESENTANTE'
  }
];

const PERFIL_TIPO_LABELS = {
  CONSIGNADO: 'Consignação',
  ATACADISTA: 'Atacado',
  CONSUMIDOR: 'Crédito',
  DISTRIBUIDOR: 'Convênio',
  REPRESENTANTE: 'Revenda',
  CONSUMIDOR_CONVENIO: 'Convênio'
};

function getCapacidadeByKey(key) {
  return CAPACIDADES_DEFINICOES.find((c) => c.key === key) || null;
}

function getCapacidadeByPerfilTipo(perfilTipo) {
  return CAPACIDADES_DEFINICOES.find((c) => c.perfilTipo === perfilTipo) || null;
}

function perfilTipoParaLabel(perfilTipo) {
  return PERFIL_TIPO_LABELS[perfilTipo] || perfilTipo;
}

function extrairCapacidadesDosPerfis(perfis = []) {
  const labels = new Set();
  perfis.forEach((p) => {
    const def = getCapacidadeByPerfilTipo(p.perfilTipo || p.tipoPerfil);
    if (def) {
      labels.add(def.label);
    } else if (p.perfilTipo) {
      labels.add(perfilTipoParaLabel(p.perfilTipo));
    }
  });
  return [...labels];
}

function buildObservacoesCapacidade(config = {}, prazoPrestacao) {
  const parts = [];
  if (prazoPrestacao) {
    parts.push(`Prazo para prestação: ${prazoPrestacao} dias`);
  }
  if (config.observacoes) {
    parts.push(String(config.observacoes).trim());
  }
  return parts.length ? parts.join('\n') : null;
}

function resolverPerfilTipoParaCapacidade(key) {
  const def = getCapacidadeByKey(key);
  return def ? def.perfilTipo : null;
}

module.exports = {
  CAPACIDADES_DEFINICOES,
  getCapacidadeByKey,
  getCapacidadeByPerfilTipo,
  perfilTipoParaLabel,
  extrairCapacidadesDosPerfis,
  buildObservacoesCapacidade,
  resolverPerfilTipoParaCapacidade
};
