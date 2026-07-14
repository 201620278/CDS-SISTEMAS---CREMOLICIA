/**
 * Testes dos helpers de API do Motor Comercial.
 */

const { unwrapData, unwrapUseCaseData } = require('../../api/helpers');

describe('api/helpers', () => {
  describe('unwrapUseCaseData', () => {
    it('extrai perfil de StandardResponse de criação', () => {
      const response = {
        success: true,
        data: {
          perfil: { id: 5, clienteId: 10, perfilTipo: 'CONSIGNADO' },
          correlationId: 'corr-1'
        }
      };
      const perfil = unwrapUseCaseData(response);
      expect(perfil).toEqual({ id: 5, clienteId: 10, perfilTipo: 'CONSIGNADO' });
    });

    it('extrai consignacao de StandardResponse', () => {
      const response = {
        success: true,
        data: {
          consignacao: { id: 99, clienteId: 10 },
          correlationId: 'corr-2'
        }
      };
      expect(unwrapUseCaseData(response)).toEqual({ id: 99, clienteId: 10 });
    });
  });

  describe('unwrapData', () => {
    it('lança erro quando success é false', () => {
      expect(() => unwrapData({ success: false, error: { message: 'Erro' } })).toThrow('Erro');
    });
  });
});
