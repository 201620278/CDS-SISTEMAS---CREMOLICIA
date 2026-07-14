/**
 * useLoading Hook Tests
 *
 * Sprint 2.7: Arquitetura Frontend — testes do useLoading.
 *
 * @module frontend/modules/motor-comercial/tests/hooks
 */

const useLoading = require('../../hooks/useLoading');

describe('useLoading', () => {
  test('creates with initial state', () => {
    const loading = useLoading.create(false);
    expect(loading.isLoading).toBe(false);
  });

  test('starts loading', () => {
    const loading = useLoading.create(false);
    loading.startLoading();
    expect(loading.isLoading).toBe(true);
  });

  test('stops loading', () => {
    const loading = useLoading.create(true);
    loading.stopLoading();
    expect(loading.isLoading).toBe(false);
  });

  test('notifies subscribers', () => {
    const loading = useLoading.create(false);
    const listener = jest.fn();
    loading.subscribe(listener);
    loading.startLoading();
    expect(listener).toHaveBeenCalledWith(true);
  });

  test('unsubscribes correctly', () => {
    const loading = useLoading.create(false);
    const listener = jest.fn();
    const unsubscribe = loading.subscribe(listener);
    unsubscribe();
    loading.startLoading();
    expect(listener).not.toHaveBeenCalled();
  });
});
