/**
 * DirtyState — Form Dirty State Tracker
 *
 * Sprint 2.7: Arquitetura Frontend — rastreamento de estado sujo.
 *
 * @module frontend/modules/motor-comercial/form/DirtyState
 */

class DirtyState {
  /**
   * Creates a dirty state tracker.
   * @param {Object} initialValues - Initial form values
   * @returns {Object}
   */
  static create(initialValues = {}) {
    let currentValues = { ...initialValues };
    const listeners = new Set();

    const subscribe = (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    };

    const notify = () => {
      listeners.forEach(listener => listener({
        isDirty: this.isDirty(),
        dirtyFields: this.getDirtyFields()
      }));
    };

    const updateValue = (name, value) => {
      currentValues[name] = value;
      notify();
    };

    const updateValues = (newValues) => {
      currentValues = { ...currentValues, ...newValues };
      notify();
    };

    const isDirty = () => {
      return Object.keys(currentValues).some(key => {
        return currentValues[key] !== initialValues[key];
      });
    };

    const getDirtyFields = () => {
      return Object.keys(currentValues).filter(key => {
        return currentValues[key] !== initialValues[key];
      });
    };

    const isFieldDirty = (name) => {
      return currentValues[name] !== initialValues[name];
    };

    const reset = () => {
      currentValues = { ...initialValues };
      notify();
    };

    const setInitialValues = (newInitialValues) => {
      initialValues = { ...newInitialValues };
      currentValues = { ...newInitialValues };
      notify();
    };

    return {
      get currentValues() {
        return { ...currentValues };
      },
      get initialValues() {
        return { ...initialValues };
      },
      updateValue,
      updateValues,
      isDirty,
      getDirtyFields,
      isFieldDirty,
      reset,
      setInitialValues,
      subscribe
    };
  }
}

module.exports = DirtyState;
