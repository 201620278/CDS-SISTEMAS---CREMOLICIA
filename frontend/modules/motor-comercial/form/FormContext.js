/**
 * FormContext — Form Context Provider
 *
 * Sprint 2.7: Arquitetura Frontend — contexto de formulário.
 *
 * @module frontend/modules/motor-comercial/form/FormContext
 */

class FormContext {
  /**
   * Creates a form context.
   * @param {Object} initialValues - Initial form values
   * @returns {Object}
   */
  static create(initialValues = {}) {
    let values = { ...initialValues };
    let errors = {};
    let touched = {};
    let dirty = false;
    const listeners = new Set();

    const subscribe = (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    };

    const notify = () => {
      listeners.forEach(listener => listener({
        values,
        errors,
        touched,
        dirty
      }));
    };

    const setValue = (name, value) => {
      values[name] = value;
      touched[name] = true;
      dirty = true;
      notify();
    };

    const setValues = (newValues) => {
      values = { ...values, ...newValues };
      Object.keys(newValues).forEach(key => {
        touched[key] = true;
      });
      dirty = true;
      notify();
    };

    const setError = (name, error) => {
      errors[name] = error;
      notify();
    };

    const setErrors = (newErrors) => {
      errors = { ...errors, ...newErrors };
      notify();
    };

    const clearError = (name) => {
      delete errors[name];
      notify();
    };

    const clearErrors = () => {
      errors = {};
      notify();
    };

    const reset = () => {
      values = { ...initialValues };
      errors = {};
      touched = {};
      dirty = false;
      notify();
    };

    const isValid = () => {
      return Object.keys(errors).length === 0;
    };

    const hasError = (name) => {
      return Boolean(errors[name]);
    };

    const isTouched = (name) => {
      return Boolean(touched[name]);
    };

    return {
      get values() {
        return { ...values };
      },
      get errors() {
        return { ...errors };
      },
      get touched() {
        return { ...touched };
      },
      get dirty() {
        return dirty;
      },
      setValue,
      setValues,
      setError,
      setErrors,
      clearError,
      clearErrors,
      reset,
      isValid,
      hasError,
      isTouched,
      subscribe
    };
  }
}

module.exports = FormContext;
