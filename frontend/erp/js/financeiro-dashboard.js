// Dashboard Financeiro
function renderDashboardFinanceiro(periodo) {
  const conteudo = document.getElementById('financeiroConteudo');

  conteudo.innerHTML = `
    <div class="dashboard-cards">
      <div class="dashboard-card recebido">
        <h3>Total Recebido</h3>
        <p class="valor" id="totalRecebido">R$ 0,00</p>
      </div>
      <div class="dashboard-card pagar">
        <h3>Total Pago</h3>
        <p class="valor" id="totalPago">R$ 0,00</p>
      </div>
      <div class="dashboard-card receber">
        <h3>Total a Receber</h3>
        <p class="valor" id="totalReceber">R$ 0,00</p>
      </div>
      <div class="dashboard-card saldo">
        <h3>Saldo do Período</h3>
        <p class="valor" id="saldoPeriodo">R$ 0,00</p>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="dashboard-box">
        <div class="dashboard-box-header">
          <h4>Próximos Recebimentos</h4>
          <button class="btn btn-sm btn-outline-primary" onclick="abrirAbaFinanceiro('receber')">Ver Todos</button>
        </div>
        <div id="proximosRecebimentos" class="dashboard-lista">
          <div class="text-center text-muted">Carregando...</div>
        </div>
      </div>

      <div class="dashboard-box">
        <div class="dashboard-box-header">
          <h4>Próximos Pagamentos</h4>
          <button class="btn btn-sm btn-outline-primary" onclick="abrirAbaFinanceiro('pagar')">Ver Todos</button>
        </div>
        <div id="proximosPagamentos" class="dashboard-lista">
          <div class="text-center text-muted">Carregando...</div>
        </div>
      </div>
    </div>

    <div id="alertasFinanceiros" class="dashboard-box">
      <div class="dashboard-box-header">
        <h4>Alertas Financeiros</h4>
      </div>
      <div id="listaAlertas" class="dashboard-lista">
        <div class="text-center text-muted">Carregando...</div>
      </div>
    </div>

    <div class="dashboard-box cds-chart-panel">
      <div class="dashboard-box-header">
        <h4 class="cds-chart-panel__title">Visão gerencial</h4>
      </div>
      <div id="financeiroGraficoKpis"></div>
      <div id="graficoFinanceiro" class="cds-chart-panel__canvas">
        <canvas id="chartFinanceiro"></canvas>
      </div>
    </div>

    <div class="dashboard-acoes">
      <button class="btn btn-primary" onclick="abrirAbaFinanceiro('receber')">
        <i class="fas fa-plus"></i> Contas a Receber
      </button>
      <button class="btn btn-danger" onclick="abrirAbaFinanceiro('pagar')">
        <i class="fas fa-minus"></i> Contas a Pagar
      </button>
      <button class="btn btn-info" onclick="abrirAbaFinanceiro('relatorios')">
        <i class="fas fa-chart-bar"></i> Relatórios
      </button>
    </div>
  `;

  carregarDashboardFinanceiro(periodo);
}

async function carregarDashboardFinanceiro(periodo) {
  try {
    const response = await fetch(`/api/financeiro/dashboard?dataInicio=${periodo.dataInicio}&dataFim=${periodo.dataFim}`, {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    });

    const dados = await response.json();

    if (dados.success) {
      preencherCardsDashboard(dados.resumo || {});
      preencherProximosRecebimentos(dados.proximos_recebimentos || []);
      preencherProximosPagamentos(dados.proximos_pagamentos || []);
      preencherAlertasFinanceiros(dados.alertas || []);
      renderGraficoFinanceiro(dados.grafico || {});
    } else {
      mostrarErro('Erro ao carregar dados do dashboard');
    }
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
    mostrarErro('Erro ao carregar dados do dashboard');
  }
}

function preencherCardsDashboard(resumo) {
  const totalRecebido = Number(resumo.totalRecebido || 0);
  const totalPago = Number(resumo.totalPago || 0);
  const totalReceber = Number(resumo.totalReceber || 0);
  const saldoPeriodo = totalRecebido - totalPago;

  const elTotalRecebido = document.getElementById('totalRecebido');
  const elTotalPago = document.getElementById('totalPago');
  const elTotalReceber = document.getElementById('totalReceber');
  const elSaldoPeriodo = document.getElementById('saldoPeriodo');

  if (elTotalRecebido) elTotalRecebido.textContent = formatarMoeda(totalRecebido);
  if (elTotalPago) elTotalPago.textContent = formatarMoeda(totalPago);
  if (elTotalReceber) elTotalReceber.textContent = formatarMoeda(totalReceber);
  if (elSaldoPeriodo) elSaldoPeriodo.textContent = formatarMoeda(saldoPeriodo);
}

function preencherProximosRecebimentos(lista) {
  const container = document.getElementById('proximosRecebimentos');
  if (!container) return;

  if (lista.length > 0) {
    container.innerHTML = lista.map(item => {
      const diasRestantes = calcularDiasRestantes(item.dataVencimento);
      return `
        <div class="dashboard-item">
          <div>
            <strong>${escapeHtmlDashboard(item.descricao || '-')}</strong><br>
            <small class="text-muted">${escapeHtmlDashboard(item.cliente || '-')}</small>
          </div>
          <div class="text-right">
            <div class="alerta ${getClasseAlerta(diasRestantes)}">
              ${formatarData(item.dataVencimento)}
            </div>
            <div class="font-weight-bold">${formatarMoeda(item.valor || 0)}</div>
          </div>
        </div>
      `;
    }).join('');
  } else {
    container.innerHTML = '<div class="text-center text-muted">Nenhum recebimento próximo</div>';
  }
}

function preencherProximosPagamentos(lista) {
  const container = document.getElementById('proximosPagamentos');
  if (!container) return;

  if (lista.length > 0) {
    container.innerHTML = lista.map(item => {
      const diasRestantes = calcularDiasRestantes(item.dataVencimento);
      return `
        <div class="dashboard-item">
          <div>
            <strong>${escapeHtmlDashboard(item.descricao || '-')}</strong><br>
            <small class="text-muted">${escapeHtmlDashboard(item.fornecedor || '-')}</small>
          </div>
          <div class="text-right">
            <div class="alerta ${getClasseAlerta(diasRestantes)}">
              ${formatarData(item.dataVencimento)}
            </div>
            <div class="font-weight-bold">${formatarMoeda(item.valor || 0)}</div>
          </div>
        </div>
      `;
    }).join('');
  } else {
    container.innerHTML = '<div class="text-center text-muted">Nenhum pagamento próximo</div>';
  }
}

function preencherAlertasFinanceiros(alertas) {
  const container = document.getElementById('listaAlertas');
  if (!container) return;

  if (alertas.length > 0) {
    container.innerHTML = alertas.map(alerta => `
      <div class="alerta ${mapearClasseStatusAlerta(alerta.status)}">
        <strong>${escapeHtmlDashboard(alerta.descricao || 'Alerta financeiro')}</strong><br>
        <small>
          ${escapeHtmlDashboard(alerta.pessoa || 'Sem identificação')}
          • Vencimento: ${formatarData(alerta.dataVencimento)}
          • Valor: ${formatarMoeda(alerta.valor || 0)}
        </small>
      </div>
    `).join('');
  } else {
    container.innerHTML = '<div class="text-center text-muted">Nenhum alerta financeiro</div>';
  }
}

function renderGraficoFinanceiro(dados) {
  const ctx = document.getElementById('chartFinanceiro');
  const kpiHost = document.getElementById('financeiroGraficoKpis');

  const recebido = Number(dados.recebido || 0);
  const pago = Number(dados.pago || 0);
  const receber = Number(dados.receber || 0);
  const pagar = Number(dados.pagar || 0);
  const saldo = recebido - pago;

  if (kpiHost && window.CDSChartTheme) {
    kpiHost.innerHTML = CDSChartTheme.renderKpiStrip([
      {
        label: 'Recebido',
        value: formatarMoeda(recebido),
        hint: 'Entradas no período'
      },
      {
        label: 'Pago',
        value: formatarMoeda(pago),
        hint: 'Saídas no período'
      },
      {
        label: 'Saldo',
        value: formatarMoeda(saldo),
        delta: pago > 0 ? ((recebido - pago) / pago) * 100 : null,
        hint: 'Recebido − Pago'
      }
    ]);
  }

  if (typeof Chart !== 'undefined' && ctx) {
    if (window.chartFinanceiro && typeof window.chartFinanceiro.destroy === 'function') {
      window.chartFinanceiro.destroy();
    }

    const theme = window.CDSChartTheme;
    if (theme) theme.applyDefaults(Chart);

    const p = theme ? theme.palette() : null;
    const barColors = p
      ? [
          theme.hexToRgba(p.receita, 0.5),
          theme.hexToRgba(p.comparativo, 0.55),
          theme.hexToRgba(p.volume, 0.4),
          theme.hexToRgba(p.hover, 0.4)
        ]
      : ['#475569', '#94a3b8', '#64748b', '#c9922e'];

    const dataset = theme
      ? theme.barsDiscrete('Valores (R$)', [recebido, pago, receber, pagar], barColors)
      : {
          label: 'Valores (R$)',
          data: [recebido, pago, receber, pagar],
          backgroundColor: barColors,
          borderWidth: 0,
          maxBarThickness: 28
        };

    const options = theme
      ? theme.baseOptions({
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                title(items) {
                  return items[0] ? items[0].label : '';
                },
                label(ctx) {
                  return ` ${formatarMoeda(ctx.parsed.y)}`;
                }
              }
            }
          },
          scales: {
            y: theme.scaleY({
              ticks: {
                callback: (value) => formatarMoeda(value),
                maxTicksLimit: 5
              }
            })
          }
        })
      : {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { callback: (value) => formatarMoeda(value) }
            }
          }
        };

    window.chartFinanceiro = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Recebido', 'Pago', 'A Receber', 'A Pagar'],
        datasets: [dataset]
      },
      options
    });
  } else {
    if (ctx && ctx.parentElement) {
      ctx.parentElement.innerHTML = `
        <div class="text-center text-muted" style="padding: 50px;">
          <i class="fas fa-chart-bar fa-3x mb-3"></i>
          <p>Gráfico não disponível<br>Chart.js necessário</p>
        </div>
      `;
    }
  }
}

function calcularDiasRestantes(data) {
  if (!data) return 999;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const vencimento = new Date(data);
  vencimento.setHours(0, 0, 0, 0);

  const diff = vencimento.getTime() - hoje.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function mapearClasseStatusAlerta(status) {
  if (status === 'vencido') return 'vencido';
  if (status === 'parcial') return 'proximo';
  if (status === 'aberto') return 'boleto';
  return 'boleto';
}

function getClasseAlerta(dias) {
  if (dias < 0) return 'vencido';
  if (dias === 0) return 'hoje';
  if (dias === 1) return 'amanha';
  if (dias <= 7) return 'proximo';
  return 'boleto';
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(valor || 0));
}

function formatarData(data) {
  if (!data) return '-';
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return data;
  return d.toLocaleDateString('pt-BR');
}

function escapeHtmlDashboard(texto) {
  return String(texto || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function mostrarErro(mensagem) {
  console.error(mensagem);
}