/**
 * Loading — Base Loading Component
 * Sprint DS-02 — estilos em components/loading.css
 */

class Loading {
  /**
   * @param {Object} options
   * @param {string} [options.size='md']
   * @param {string} [options.message]
   * @param {boolean} [options.fullScreen=false]
   * @param {number} [options.progress] 0–100 para barra de progresso
   * @param {boolean} [options.overlay=false] overlay local absoluto
   */
  static create(options = {}) {
    const {
      size = 'md',
      message = '',
      fullScreen = false,
      progress = null,
      overlay = false
    } = options;

    const wrapper = document.createElement('div');
    const classes = ['cds-loading', `cds-loading--${size}`];
    if (fullScreen) classes.push('cds-loading--fullscreen');
    wrapper.className = classes.join(' ');
    wrapper.setAttribute('role', 'status');
    wrapper.setAttribute('aria-live', 'polite');
    wrapper.setAttribute('aria-busy', 'true');

    const spinner = document.createElement('div');
    spinner.className = 'cds-loading__spinner';
    spinner.setAttribute('aria-hidden', 'true');
    wrapper.appendChild(spinner);

    if (message) {
      const messageEl = document.createElement('div');
      messageEl.className = 'cds-loading__message';
      messageEl.textContent = message;
      wrapper.appendChild(messageEl);
    }

    if (progress !== null && progress >= 0) {
      const progressWrap = document.createElement('div');
      progressWrap.className = 'cds-loading-progress';
      progressWrap.setAttribute('role', 'progressbar');
      progressWrap.setAttribute('aria-valuemin', '0');
      progressWrap.setAttribute('aria-valuemax', '100');
      progressWrap.setAttribute('aria-valuenow', String(Math.round(progress)));
      const bar = document.createElement('div');
      bar.className = 'cds-loading-progress__bar';
      bar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
      progressWrap.appendChild(bar);
      wrapper.appendChild(progressWrap);
    }

    if (overlay && !fullScreen) {
      const overlayEl = document.createElement('div');
      overlayEl.className = 'cds-loading-overlay';
      overlayEl.appendChild(wrapper);
      return overlayEl;
    }

    return wrapper;
  }

  static getStyles() {
    return '';
  }
}

module.exports = Loading;
