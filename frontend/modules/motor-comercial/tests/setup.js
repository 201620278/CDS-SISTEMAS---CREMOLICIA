/**
 * Test Setup — Motor Comercial
 *
 * Sprint H-2: Jest + jsdom
 */

const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

global.localStorage = localStorageMock;

localStorage.setItem('user', JSON.stringify({
  id: 1,
  username: 'tester',
  nome: 'Tester',
  role: 'admin',
  perfil: 'ADMIN',
  permissoes: ['COMERCIAL_CONSIGNACAO', 'COMERCIAL_ACERTO', 'COMERCIAL_DASHBOARD']
}));

localStorage.setItem('token', 'test-token');

if (typeof window !== 'undefined') {
  window.API_URL = 'http://localhost:3000/api';
  window.MotorComercial = {
    navigate: jest.fn(() => Promise.resolve()),
    isInitialized: () => true
  };
  window.showNotification = jest.fn();
}
