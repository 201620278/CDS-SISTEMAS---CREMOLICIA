/**
 * Modal de Recebimento da Conta Corrente Comercial — UX-09 / UX-10 fix.
 *
 * Representa recebimento de dívida comercial pós-encerramento (não consignação aberta).
 *
 * @module frontend/modules/motor-comercial/pages/Dashboard/RecebimentoRapidoModal
 */

const Modal = require('../../components/navigation/Modal');
const Button = require('../../components/base/Button');
const Input = require('../../components/form/Input');
const Select = require('../../components/form/Select');

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
}

class RecebimentoRapidoModal {
  /**
   * @param {Object} options
   * @param {Object} options.item - Card E5 Conta Corrente Comercial
   * @param {Function} options.onConfirm - async ({ valor, formaPagamento, observacao }) => void
   * @param {Function} [options.onCancel]
   * @param {Function} [options.formatCurrency]
   * @returns {HTMLElement} backdrop
   */
  static open(options = {}) {
    const {
      item = {},
      onConfirm = null,
      onCancel = null,
      formatCurrency: fmt = formatCurrency
    } = options;

    const state = {
      valor: item.valorEmAberto > 0 ? String(item.valorEmAberto) : '',
      formaPagamento: 'DINHEIRO',
      observacao: '',
      erro: null,
      submitting: false
    };

    let backdrop = null;

    const close = () => {
      if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      if (onCancel) onCancel();
    };

    const content = document.createElement('div');
    content.className = 'cds-recebimento-rapido';

    const docLabel = item.documentoConsignacao || item.documento || '—';
    const agora = new Date();
    const dataHora = agora.toLocaleString('pt-BR');

    const renderBody = () => {
      content.innerHTML = `
        <p class="cds-recebimento-rapido__contexto">
          Registro de recebimento sobre dívida da Conta Corrente Comercial.
          A consignação já foi encerrada; este fluxo quita o saldo remanescente.
        </p>
        <div class="cds-recebimento-rapido__resumo">
          <div><label>Cliente</label><strong>${item.clienteNome || '—'}</strong></div>
          <div><label>Documento</label><span>${docLabel}</span></div>
          <div><label>Saldo em aberto</label><strong>${fmt(item.valorEmAberto)}</strong></div>
          <div><label>Data / hora</label><span>${dataHora}</span></div>
        </div>
        <div class="cds-recebimento-rapido__form"></div>
        <div class="cds-recebimento-rapido__erro"></div>
      `;

      const form = content.querySelector('.cds-recebimento-rapido__form');

      const valorField = document.createElement('div');
      valorField.className = 'cds-recebimento-rapido__campo';
      valorField.innerHTML = '<label>Valor recebido</label>';
      valorField.appendChild(Input.create({
        type: 'number',
        placeholder: '0,00',
        value: state.valor,
        onChange: (v) => { state.valor = v; }
      }));
      form.appendChild(valorField);

      const formaField = document.createElement('div');
      formaField.className = 'cds-recebimento-rapido__campo';
      formaField.innerHTML = '<label>Forma de pagamento</label>';
      formaField.appendChild(Select.create({
        options: [
          { value: 'DINHEIRO', label: 'Dinheiro' },
          { value: 'PIX', label: 'PIX' },
          { value: 'TRANSFERENCIA', label: 'Transferência' },
          { value: 'CHEQUE', label: 'Cheque' },
          { value: 'CARTAO', label: 'Cartão' }
        ],
        value: state.formaPagamento,
        onChange: (v) => { state.formaPagamento = v; }
      }));
      form.appendChild(formaField);

      const obsField = document.createElement('div');
      obsField.className = 'cds-recebimento-rapido__campo';
      obsField.innerHTML = '<label>Observações (auditoria)</label>';
      const obsInput = Input.create({
        type: 'text',
        placeholder: 'Opcional',
        value: state.observacao,
        onChange: (v) => { state.observacao = v; }
      });
      obsField.appendChild(obsInput);
      form.appendChild(obsField);

      const erroEl = content.querySelector('.cds-recebimento-rapido__erro');
      if (state.erro) {
        erroEl.textContent = state.erro;
        erroEl.hidden = false;
      } else {
        erroEl.hidden = true;
      }
    };

    const footer = document.createElement('div');
    footer.className = 'cds-recebimento-rapido__footer';

    const syncFooter = () => {
      footer.innerHTML = '';
      footer.appendChild(Button.create({
        text: 'Cancelar',
        variant: 'secondary',
        onClick: close
      }));
      footer.appendChild(Button.create({
        text: state.submitting ? 'Registrando...' : 'Confirmar recebimento',
        variant: 'primary',
        disabled: state.submitting,
        onClick: async () => {
          const valor = Number(String(state.valor || '').replace(',', '.'));
          if (!valor || valor <= 0) {
            state.erro = 'Informe um valor válido para o recebimento.';
            renderBody();
            return;
          }
          if (!onConfirm) return;
          state.submitting = true;
          state.erro = null;
          syncFooter();
          try {
            await onConfirm({
              valor,
              formaPagamento: state.formaPagamento || 'DINHEIRO',
              observacao: state.observacao || null
            });
            close();
          } catch (error) {
            state.erro = error?.message || 'Não foi possível registrar o recebimento.';
            state.submitting = false;
            renderBody();
            syncFooter();
          }
        }
      }));
    };

    renderBody();
    syncFooter();

    backdrop = Modal.create({
      title: 'Recebimento da Conta Corrente Comercial',
      content,
      footer,
      open: true,
      onClose: close
    });

    document.body.appendChild(backdrop);
    requestAnimationFrame(() => {
      backdrop.classList.add('cds-modal-backdrop--open', 'is-open');
    });

    return backdrop;
  }
}

module.exports = RecebimentoRapidoModal;
