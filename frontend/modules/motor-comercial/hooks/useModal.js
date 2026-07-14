/**
 * useModal — Modal State Hook
 *
 * Sprint 2.7: Arquitetura Frontend — hook de modais.
 *
 * @module frontend/modules/motor-comercial/hooks/useModal
 */

class useModal {
  /**
   * Creates a modal manager.
   * @param {boolean} [initialState=false] - Initial open state
   * @returns {Object}
   */
  static create(initialState = false) {
    let open = initialState;
    let data = null;
    const listeners = new Set();

    const subscribe = (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    };

    const notify = () => {
      listeners.forEach(listener => listener({ open, data }));
    };

    const setOpen = (value) => {
      open = value;
      if (!value) data = null;
      notify();
    };

    const openModal = (modalData = null) => {
      data = modalData;
      open = true;
      notify();
    };

    const closeModal = () => {
      open = false;
      data = null;
      notify();
    };

    const toggle = () => {
      open = !open;
      if (!open) data = null;
      notify();
    };

    return {
      get isOpen() {
        return open;
      },
      get modalData() {
        return data;
      },
      setOpen,
      openModal,
      closeModal,
      toggle,
      subscribe
    };
  }
}

module.exports = useModal;
