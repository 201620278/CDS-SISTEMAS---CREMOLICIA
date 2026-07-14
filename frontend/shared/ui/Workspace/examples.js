/**
 * Exemplos de uso — Workspace (FOUNDATION F2)
 *
 * Não executa no runtime dos motores. Uso em Story/docs/testes.
 *
 * @module frontend/shared/ui/Workspace/examples
 */

const Workspace = require('./index');

/**
 * Exemplo mínimo: Estação com header, body rolável e footer fixo.
 * @returns {HTMLElement}
 */
function exemploEstacaoBasica() {
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.textContent = 'Cancelar';

  const primary = document.createElement('button');
  primary.type = 'button';
  primary.textContent = 'Continuar';

  const longContent = document.createElement('div');
  for (let i = 1; i <= 40; i += 1) {
    const p = document.createElement('p');
    p.textContent = `Linha operacional ${i} — apenas o Body deve rolar.`;
    longContent.appendChild(p);
  }

  return Workspace.create({
    variant: 'station',
    header: Workspace.Header.create({
      title: 'Prestar Contas',
      subtitle: 'Conferência de retornos',
      context: 'Cliente: Maria Silva · Doc C-004',
      status: '● Alterações pendentes',
      operator: 'Operador: Tester'
    }),
    body: Workspace.Body.create({ children: longContent }),
    footer: Workspace.Footer.create({
      left: cancel,
      right: primary
    })
  });
}

/**
 * Composição explícita (equivalente a Workspace.Header / Body / Footer).
 * @returns {HTMLElement}
 */
function exemploComposicao() {
  return Workspace.create({
    variant: 'central',
    header: {
      title: 'Central de Trabalho',
      subtitle: 'O que preciso fazer agora?'
    },
    body: {
      children: 'Fila de trabalho…'
    },
    footer: {
      right: (() => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = 'Nova Entrega';
        return btn;
      })()
    }
  });
}

module.exports = {
  exemploEstacaoBasica,
  exemploComposicao
};
