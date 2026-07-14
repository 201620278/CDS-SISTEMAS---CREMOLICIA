/**
 * Exemplos — EntityCard (FOUNDATION F3 / UX-21.2)
 *
 * @module frontend/shared/ui/EntityCard/examples
 */

const EntityCard = require('./index');

function exemploCompleto() {
  return EntityCard.create({
    variant: 'normal',
    title: 'Registro Alfa',
    subtitle: 'DOC-001',
    description: 'Descrição secundária opcional',
    status: 'Ativo',
    badges: [{ text: 'Prioritário', variant: 'info' }],
    metadata: [
      { label: 'Telefone', value: '(11) 90000-0000' },
      { label: 'Cidade', value: 'São Paulo' }
    ],
    actions: {
      secondary: { label: 'Detalhes' },
      primary: { label: 'Abrir' }
    },
    onSelect: () => {},
    onPrimaryAction: () => {},
    onSecondaryAction: () => {}
  });
}

function exemploCompact() {
  return EntityCard.create({
    variant: 'compact',
    title: '👤 Cicero Diego',
    subtitle: '📄 CONS-2026-000009',
    status: '● Pronto para fechar',
    description: '💰 R$ 50,00 • 📦 0 itens • ⏱ 3h',
    badges: [{ text: 'E3', variant: 'warning' }],
    primaryAction: { label: 'Continuar Atendimento' }
  });
}

function exemploDetailed() {
  return EntityCard.create({
    variant: 'detailed',
    title: 'Cliente Detalhado',
    subtitle: 'Perfil completo',
    description: 'Visão expandida para consulta.',
    status: 'Ativo',
    metadata: [
      { label: 'Documento', value: '12.345.678/0001-90' },
      { label: 'Cidade', value: 'Natal' },
      { label: 'Limite', value: 'R$ 5.000,00' },
      { label: 'Saldo', value: 'R$ 320,00' },
      { label: 'Última compra', value: '10/07/2026' },
      { label: 'Operador', value: 'Ana' }
    ],
    primaryAction: { label: 'Abrir' },
    secondaryAction: { label: 'Histórico' }
  });
}

function exemploEstados() {
  return [
    EntityCard.create({ title: 'Normal', subtitle: 'A', variant: 'normal' }),
    EntityCard.create({ title: 'Selecionado', subtitle: 'B', selected: true }),
    EntityCard.create({ title: 'Desabilitado', subtitle: 'C', disabled: true }),
    EntityCard.create({ title: 'Carregando', loading: true }),
    EntityCard.create({ title: 'Com erro', subtitle: 'D', error: 'Falha ao carregar' })
  ];
}

function exemploVariantes() {
  return [exemploCompact(), exemploCompleto(), exemploDetailed()];
}

module.exports = {
  exemploCompleto,
  exemploCompact,
  exemploDetailed,
  exemploEstados,
  exemploVariantes
};
