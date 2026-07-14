/**
 * Validation Utility Tests
 *
 * Sprint 2.7: Arquitetura Frontend — testes de Validation.
 *
 * @module frontend/modules/motor-comercial/tests/form
 */

const Validation = require('../../form/Validation');

describe('Validation', () => {
  describe('required', () => {
    test('returns error for empty value', () => {
      expect(Validation.required('')).toBe('Campo obrigatório');
    });

    test('returns error for null value', () => {
      expect(Validation.required(null)).toBe('Campo obrigatório');
    });

    test('returns null for valid value', () => {
      expect(Validation.required('test')).toBe(null);
    });
  });

  describe('email', () => {
    test('returns error for invalid email', () => {
      expect(Validation.email('invalid')).toBe('Email inválido');
    });

    test('returns null for valid email', () => {
      expect(Validation.email('test@email.com')).toBe(null);
    });
  });

  describe('minLength', () => {
    test('returns error for short value', () => {
      const validator = Validation.minLength(5);
      expect(validator('abc')).toBe('Mínimo de 5 caracteres');
    });

    test('returns null for valid length', () => {
      const validator = Validation.minLength(5);
      expect(validator('abcdef')).toBe(null);
    });
  });

  describe('validate', () => {
    test('runs multiple validators', () => {
      const error = Validation.validate('', [Validation.required]);
      expect(error).toBe('Campo obrigatório');
    });

    test('returns null if all validators pass', () => {
      const error = Validation.validate('test', [Validation.required]);
      expect(error).toBe(null);
    });
  });

  describe('validateForm', () => {
    test('validates entire form', () => {
      const schema = {
        name: [Validation.required],
        email: [Validation.required, Validation.email]
      };
      const values = { name: '', email: 'invalid' };
      const errors = Validation.validateForm(values, schema);
      expect(errors.name).toBe('Campo obrigatório');
      expect(errors.email).toBe('Email inválido');
    });
  });
});
