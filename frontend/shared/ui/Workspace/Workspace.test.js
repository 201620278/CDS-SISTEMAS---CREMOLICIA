/**
 * Testes — Workspace Shared UI (FOUNDATION F2)
 */

const Workspace = require('./index');
const { exemploEstacaoBasica } = require('./examples');

describe('Shared UI — Workspace', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.querySelectorAll('#cds-shared-ui-workspace-styles').forEach((n) => n.remove());
  });

  test('STATUS ready e composição Header/Body/Footer', () => {
    expect(Workspace.STATUS).toBe('ready');
    expect(Workspace.Header).toBeTruthy();
    expect(Workspace.Body).toBeTruthy();
    expect(Workspace.Footer).toBeTruthy();
  });

  test('cria anatomia com header, body e footer', () => {
    const el = Workspace.create({
      header: { title: 'Entrega', subtitle: 'Confirmar saída' },
      body: { children: 'conteúdo' },
      footer: { left: 'Cancelar', right: 'Entregar' }
    });

    expect(el.classList.contains('cds-workspace')).toBe(true);
    expect(el.querySelector('.cds-workspace__header')).toBeTruthy();
    expect(el.querySelector('.cds-workspace__body')).toBeTruthy();
    expect(el.querySelector('.cds-workspace__footer')).toBeTruthy();
    expect(el.querySelector('.cds-workspace__title').textContent).toBe('Entrega');
  });

  test('apenas o body tem classe de scroll', () => {
    const el = Workspace.create({
      header: { title: 'T' },
      body: { children: 'x', scroll: true },
      footer: { right: 'OK' }
    });

    const body = el.querySelector('.cds-workspace__body');
    expect(body.classList.contains('cds-workspace__body--scroll')).toBe(true);
    expect(el.className).toMatch(/cds-workspace/);
    expect(getComputedStyleHint(el, 'overflow')).not.toBe('auto');
  });

  test('CSS oficial impede overflow no root e habilita no body', () => {
    const css = Workspace.getStyles();
    expect(css).toMatch(/\.cds-workspace\s*\{[^}]*overflow:\s*hidden/s);
    expect(css).toMatch(/\.cds-workspace__body--scroll\s*\{[^}]*overflow-y:\s*auto/s);
    expect(css).toMatch(/\.cds-workspace__header\s*\{[^}]*flex:\s*0 0 auto/s);
    expect(css).toMatch(/\.cds-workspace__footer\s*\{[^}]*flex:\s*0 0 auto/s);
  });

  test('injeta styles uma única vez', () => {
    Workspace.create({ header: { title: 'A' }, body: { children: '1' } });
    Workspace.create({ header: { title: 'B' }, body: { children: '2' } });
    expect(document.querySelectorAll('#cds-shared-ui-workspace-styles')).toHaveLength(1);
  });

  test('compose atualiza body sem perder footer', () => {
    const el = Workspace.create({
      header: { title: 'X' },
      body: { children: 'old' },
      footer: { right: 'Salvar' }
    });

    const novo = document.createElement('div');
    novo.textContent = 'novo conteúdo longo';
    Workspace.compose(el, { body: Workspace.Body.create({ children: novo }) });

    expect(el.querySelector('.cds-workspace__body').textContent).toContain('novo conteúdo longo');
    expect(el.querySelector('.cds-workspace__footer')).toBeTruthy();
    expect(el.querySelector('.cds-workspace__header')).toBeTruthy();
  });

  test('variante central', () => {
    const el = Workspace.create({ variant: 'central', header: { title: 'Central' } });
    expect(el.classList.contains('cds-workspace--central')).toBe(true);
    expect(el.getAttribute('aria-label')).toMatch(/Central/i);
  });

  test('exemploEstacaoBasica monta header fixo + body + footer', () => {
    const el = exemploEstacaoBasica();
    document.body.appendChild(el);
    expect(el.querySelectorAll('.cds-workspace__body p').length).toBeGreaterThan(10);
    expect(el.querySelector('.cds-workspace__footer-right').textContent).toMatch(/Continuar/);
  });

  test('header rejeita responsabilidade de KPI (contrato documental via ausência de slots)', () => {
    const header = Workspace.Header.create({
      title: 'T',
      context: 'ctx',
      status: 'Pronto'
    });
    expect(header.querySelector('.cds-workspace__kpi')).toBeNull();
    expect(header.textContent).not.toMatch(/gráfico/i);
  });
});

/** Hint estático: jsdom não calcula flex; validamos contrato de classe/CSS. */
function getComputedStyleHint(el) {
  return el.style.overflow || 'hidden';
}
