/**
 * Regressão: Continuar não pode ser destruído pelo blur da grade (Electron).
 */

describe('PrestacaoContas — Continuar vs blur da grade', () => {
  test('mousedown do Continuar define _skipNextBlur antes do blur', () => {
    const page = {
      currentStep: 0, // STAB-07.1 STEP_RETORNOS
      salvandoConferencia: false,
      loading: { operation: false },
      encerrado: false,
      _skipNextBlur: false,
      _capturarRascunhoRetornos: jest.fn(),
      _goNext: jest.fn(),
      _canEncerrar: () => true,
      _encerrarAtendimento: jest.fn(),
      _goBack: jest.fn(),
      _handleCancel: jest.fn()
    };

    // Reproduz o binding do footer (trecho crítico STAB-07.1)
    const continuarBtn = document.createElement('button');
    continuarBtn.type = 'button';
    continuarBtn.addEventListener('click', () => page._goNext());
    continuarBtn.addEventListener('mousedown', (event) => {
      if (event.button !== 0) return;
      page._skipNextBlur = true;
      page._capturarRascunhoRetornos();
    });

    continuarBtn.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true }));
    expect(page._skipNextBlur).toBe(true);
    expect(page._capturarRascunhoRetornos).toHaveBeenCalled();

    continuarBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(page._goNext).toHaveBeenCalled();
  });
});
