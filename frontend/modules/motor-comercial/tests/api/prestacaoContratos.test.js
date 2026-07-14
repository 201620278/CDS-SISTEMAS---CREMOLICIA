/**
 * Contratos Prestação — Sprint S-6.4
 */

const {
  AbrirPrestacaoRequest,
  RegistrarPagamentoRequest
} = require('../../../../../backend/motores/motor-comercial/http/dto/ConsignacaoDTO');
const { extractErrorMessage } = require('../../api/helpers');

describe('Contratos Prestação S-6.4', () => {
  test('AbrirPrestacaoRequest valida consignacaoId', () => {
    expect(AbrirPrestacaoRequest.validate({ consignacaoId: '12' })).toBeNull();
    const invalido = AbrirPrestacaoRequest.validate({ consignacaoId: 'abc' });
    expect(invalido.errors[0].field).toBe('consignacaoId');
  });

  test('RegistrarPagamentoRequest aceita valor string numérica', () => {
    expect(RegistrarPagamentoRequest.validate({ valor: '150.50' })).toBeNull();
    const dto = RegistrarPagamentoRequest.fromJSON({ valor: '10,5', formaPagamento: 'PIX' });
    expect(dto.valor).toBe(10.5);
    expect(dto.formaPagamento).toBe('PIX');
  });

  test('RegistrarPagamentoRequest rejeita valor ausente', () => {
    const invalido = RegistrarPagamentoRequest.validate({});
    expect(invalido.errors[0].field).toBe('valor');
  });

  test('extractErrorMessage inclui code e field', () => {
    const msg = extractErrorMessage({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: "Campo 'valor' é obrigatório.",
        details: { fields: [{ field: 'valor', message: "Campo 'valor' é obrigatório." }] }
      }
    });
    expect(msg).toContain('VALIDATION_ERROR');
    expect(msg).toContain('valor');
  });
});
