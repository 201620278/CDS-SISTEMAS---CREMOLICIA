/**
 * Renderização das seções do Cliente 360° Enterprise — Sprint S-5.
 *
 * @module frontend/modules/motor-comercial/pages/PerfilComercial/Cliente360View
 */

const Button = require('../../components/base/Button');
const Table = require('../../components/data/Table');
const EmptyState = require('../../components/base/EmptyState');
const Alert = require('../../components/base/Alert');
const Badge = require('../../components/base/Badge');
const StatCard = require('../../components/data/StatCard');
const Timeline = require('../../components/special/Timeline');
const Loading = require('../../components/base/Loading');

class Cliente360View {
  static sectionShell(section) {
    const el = document.createElement('section');
    el.className = 'cds-cliente360-section';
    el.id = `sec-${section.id}`;

    const header = document.createElement('header');
    header.className = 'cds-cliente360-section__header';

    const titleWrap = document.createElement('div');
    const h = document.createElement('h2');
    h.className = 'cds-cliente360-section__title';
    h.textContent = section.title;
    titleWrap.appendChild(h);

    if (section.description) {
      const p = document.createElement('p');
      p.className = 'cds-cliente360-section__desc';
      p.textContent = section.description;
      titleWrap.appendChild(p);
    }
    header.appendChild(titleWrap);

    const body = document.createElement('div');
    body.className = 'cds-cliente360-section__body';
    body.id = `sec-body-${section.id}`;
    body.appendChild(Loading.create({ message: `Carregando ${section.title.toLowerCase()}...` }));

    el.appendChild(header);
    el.appendChild(body);
    return el;
  }

  static sectionError(message) {
    return Alert.create({
      message: message || 'Não foi possível carregar esta seção.',
      variant: 'warning',
      dismissible: false
    });
  }

  static renderResumo(data, ctx) {
    const grid = document.createElement('div');
    grid.className = 'cds-cliente360-resumo';

    const cards = [
      { title: 'Limite Comercial', value: ctx.formatCurrency(data.limiteComercial), color: 'primary' },
      { title: 'Saldo Utilizado', value: ctx.formatCurrency(data.saldoUtilizado), color: 'warning' },
      { title: 'Saldo Disponível', value: ctx.formatCurrency(data.saldoDisponivel), color: 'success' },
      { title: 'Consignações Ativas', value: data.consignacoesAtivas, color: 'info' },
      { title: 'Pendências', value: data.pendencias, color: data.pendencias ? 'error' : 'default' },
      {
        title: 'Última Movimentação',
        value: data.ultimaMovimentacao ? ctx.formatDate(data.ultimaMovimentacao) : '—',
        format: 'text'
      }
    ];

    cards.forEach((card) => grid.appendChild(StatCard.create(card)));
    return grid;
  }

  static renderTimeline(events) {
    return Timeline.create({
      events,
      emptyTitle: 'Sem eventos',
      emptyDescription: 'Nenhum evento na linha do tempo deste cliente'
    });
  }

  static renderContaCorrente(data, ctx) {
    const wrap = document.createElement('div');
    wrap.className = 'cds-cliente360-conta';

    const summary = document.createElement('div');
    summary.className = 'cds-cliente360-conta__summary';
    summary.innerHTML = `
      <div class="cds-cliente360-conta__saldo">
        <label>Saldo Atual</label>
        <strong>${ctx.formatCurrency(data.saldoAtual)}</strong>
      </div>
      <div><label>Débitos</label><span>${data.debitos.length} lançamento(s)</span></div>
      <div><label>Créditos</label><span>${data.creditos.length} lançamento(s)</span></div>
    `;
    wrap.appendChild(summary);

    const actions = document.createElement('div');
    actions.className = 'cds-cliente360-section__actions';
    actions.appendChild(Button.create({
      text: 'Ver extrato completo',
      variant: 'secondary',
      onClick: () => ctx.onNavigateExtrato()
    }));
    actions.appendChild(Button.create({
      text: 'Central de Prestação de Contas',
      variant: 'ghost',
      onClick: () => ctx.onNavigatePrestacao()
    }));
    wrap.appendChild(actions);

    if (!data.lancamentos.length) {
      wrap.appendChild(EmptyState.create({
        title: 'Sem lançamentos',
        description: 'Nenhum lançamento recente na conta corrente'
      }));
      return wrap;
    }

    wrap.appendChild(Table.create({
      columns: [
        { key: 'data', label: 'Data' },
        { key: 'tipo', label: 'Tipo' },
        { key: 'valor', label: 'Valor' }
      ],
      data: data.lancamentos.map((m) => ({
        data: ctx.formatDate(m.data || m.dataMovimentacao),
        tipo: m.tipo || m.tipoMovimentacao || '-',
        valor: ctx.formatCurrency(m.valor),
        _raw: m
      })),
      onRowClick: (row) => ctx.onOpenDrawer('recebimento', row._raw || row)
    }));

    return wrap;
  }

  static renderConsignacoes(items, ctx) {
    if (!items.length) {
      return EmptyState.create({
        title: 'Sem consignações',
        description: 'Nenhuma consignação registrada para este cliente'
      });
    }

    return Table.create({
      columns: [
        { key: 'numero', label: 'Número' },
        { key: 'data', label: 'Data' },
        { key: 'situacao', label: 'Situação' },
        { key: 'valor', label: 'Valor' },
        { key: 'saldo', label: 'Saldo' },
        { key: 'acoes', label: '' }
      ],
      data: items.map((c) => ({
        numero: c.documento || c.id,
        data: ctx.formatDate(c.dataEntrega || c.createdAt),
        situacao: Badge.create({ text: c.status, variant: 'info' }),
        valor: ctx.formatCurrency(c.valor),
        saldo: ctx.formatCurrency(c.saldo),
        acoes: Button.create({ text: 'Abrir', variant: 'ghost', onClick: () => ctx.onOpenConsignacao(c) }),
        _raw: c
      })),
      onRowClick: (row) => ctx.onOpenConsignacao(row._raw || row)
    });
  }

  static renderPendencias(groups, ctx) {
    if (!groups.total) {
      return EmptyState.create({
        title: 'Sem pendências',
        description: 'Nenhuma pendência aberta para este cliente'
      });
    }

    const wrap = document.createElement('div');
    wrap.className = 'cds-cliente360-pendencias';

    const renderGroup = (title, items) => {
      if (!items.length) return;
      const block = document.createElement('div');
      block.className = 'cds-cliente360-pendencias__group';
      const h = document.createElement('h3');
      h.textContent = title;
      block.appendChild(h);

      items.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'cds-cliente360-pendencias__item';
        row.innerHTML = `
          <div class="cds-cliente360-pendencias__item-main">
            <strong>${item.descricao || item.motivo || item.tipo}</strong>
            <span>${item.acaoRecomendada || ''}</span>
          </div>
        `;
        block.appendChild(row);
      });
      wrap.appendChild(block);
    };

    renderGroup('Financeiras', groups.financeiras);
    renderGroup('Operacionais', groups.operacionais);
    renderGroup('Comerciais', groups.comerciais);

    const actions = document.createElement('div');
    actions.className = 'cds-cliente360-section__actions';
    actions.appendChild(Button.create({
      text: 'Central de Pendências',
      variant: 'secondary',
      onClick: () => ctx.onNavigatePendencias()
    }));
    wrap.appendChild(actions);
    return wrap;
  }

  static renderRecomendacoes(items, ctx) {
    if (!items.length) {
      return EmptyState.create({
        title: 'Sem recomendações prioritárias',
        description: 'Nenhuma recomendação acionável no momento'
      });
    }

    const wrap = document.createElement('div');
    wrap.className = 'cds-cliente360-recomendacoes';

    items.forEach((rec) => {
      const card = document.createElement('article');
      card.className = 'cds-cliente360-recomendacao';
      card.innerHTML = `
        <header>
          <strong>${rec.titulo || 'Recomendação'}</strong>
          <span class="cds-cliente360-recomendacao__prio">${rec.prioridade || 'NORMAL'}</span>
        </header>
        <p>${rec.descricao || rec.mensagem || ''}</p>
      `;
      if (rec.acaoRecomendada) {
        const action = document.createElement('small');
        action.textContent = `Ação: ${rec.acaoRecomendada}`;
        card.appendChild(action);
      }
      wrap.appendChild(card);
    });

    const actions = document.createElement('div');
    actions.className = 'cds-cliente360-section__actions';
    actions.appendChild(Button.create({
      text: 'Ver todas as recomendações',
      variant: 'secondary',
      onClick: () => ctx.onNavigateRecomendacoes()
    }));
    wrap.appendChild(actions);
    return wrap;
  }

  static renderGuias(guias, ctx) {
    if (!guias.total) {
      return EmptyState.create({
        title: 'Sem guias operacionais',
        description: 'Nenhum guia ativo ou sugerido para este cliente'
      });
    }

    const wrap = document.createElement('div');
    wrap.className = 'cds-cliente360-guias';

    const renderList = (title, items) => {
      if (!items.length) return;
      const block = document.createElement('div');
      block.className = 'cds-cliente360-guias__group';
      const h = document.createElement('h3');
      h.textContent = title;
      block.appendChild(h);

      items.forEach((pb) => {
        const row = document.createElement('div');
        row.className = 'cds-cliente360-guias__item';
        row.innerHTML = `<strong>${pb.nome || pb.titulo || 'Guia'}</strong><span>${pb.status || pb.categoria || ''}</span>`;
        block.appendChild(row);
      });
      wrap.appendChild(block);
    };

    renderList('Em andamento', guias.emAndamento);
    renderList('Sugeridos para o contexto', guias.sugeridos);

    const actions = document.createElement('div');
    actions.className = 'cds-cliente360-section__actions';
    actions.appendChild(Button.create({
      text: 'Central de Guias Operacionais',
      variant: 'secondary',
      onClick: () => ctx.onNavigateGuias()
    }));
    wrap.appendChild(actions);
    return wrap;
  }

  static renderHistorico(eventos, ctx) {
    if (!eventos.length) {
      return EmptyState.create({
        title: 'Sem histórico',
        description: 'Nenhum evento registrado para este cliente'
      });
    }

    return Table.create({
      columns: [
        { key: 'data', label: 'Data' },
        { key: 'tipo', label: 'Evento' },
        { key: 'descricao', label: 'Descrição' },
        { key: 'origem', label: 'Origem' },
        { key: 'usuario', label: 'Usuário' }
      ],
      data: eventos.slice(0, 30).map((ev) => ({
        data: ctx.formatDateTime(ev.data),
        tipo: ev.tipo,
        descricao: ev.descricao,
        origem: ev.origem,
        usuario: ev.usuario
      }))
    });
  }

  static renderSectionNav(sections, onNavigate) {
    const nav = document.createElement('nav');
    nav.className = 'cds-cliente360-section-nav';
    nav.setAttribute('aria-label', 'Seções do Cliente 360°');

    sections.forEach((section) => {
      const link = document.createElement('button');
      link.type = 'button';
      link.className = 'cds-cliente360-section-nav__item';
      link.textContent = section.title;
      link.addEventListener('click', () => onNavigate(section.id));
      nav.appendChild(link);
    });

    return nav;
  }
}

module.exports = Cliente360View;
