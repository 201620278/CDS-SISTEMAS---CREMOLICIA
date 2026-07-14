/**
 * Exemplos — Hero (UX-21.1)
 * @module frontend/shared/ui/Hero/examples
 */

const Hero = require('./index');

function exemploCentralComercialManha() {
  return Hero.create({
    operatorName: 'Diego',
    now: new Date('2026-07-13T09:15:00'),
    liveClock: false,
    statusItems: [
      { tone: 'urgent', text: '1 atendimento aguardando fechamento.' },
      { tone: 'ready', text: '1 cliente com saldo para receber.' }
    ],
    message: 'Tudo pronto para começar.',
    actions: [
      { label: 'Nova Entrega', variant: 'primary', onClick: () => {} },
      { label: 'Clientes', variant: 'secondary', onClick: () => {} }
    ]
  });
}

function exemploNoite() {
  return Hero.create({
    operatorName: 'Ana',
    now: new Date('2026-07-13T21:16:00'),
    liveClock: false,
    statusItems: [
      { tone: 'info', text: '2 itens na fila de trabalho.' }
    ],
    message: 'Seu próximo atendimento recomendado é finalizar a prestação de contas.',
    actions: [
      { label: 'Nova Entrega', variant: 'primary' },
      { label: 'Clientes', variant: 'secondary' }
    ]
  });
}

function exemploTodosPeriodos() {
  const hours = [8, 14, 17, 22];
  return hours.map((h) => Hero.create({
    operatorName: 'Operador',
    now: new Date(`2026-07-13T${String(h).padStart(2, '0')}:00:00`),
    liveClock: false,
    message: `Período às ${h}h`,
    actions: [{ label: 'Ação', variant: 'primary' }]
  }));
}

module.exports = {
  exemploCentralComercialManha,
  exemploNoite,
  exemploTodosPeriodos
};
