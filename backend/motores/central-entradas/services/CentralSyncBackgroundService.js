/**
 * CentralSyncBackgroundService — Sincronização automática em background.
 *
 * Sprint 8: intervalo configurável, mutex via CentralSyncExecucaoService.
 *
 * @class CentralSyncBackgroundService
 */

const centralEntradasFlags = require('../config/centralEntradasFlags');
const CentralConfigService = require('./CentralConfigService');
const centralSyncExecucao = require('./CentralSyncExecucaoService');
const { ORIGENS } = require('../config/centralEventosTipos');

class CentralSyncBackgroundService {
  constructor(deps = {}) {
    /** @private */
    this._config = deps.configService ?? new CentralConfigService();
    /** @private */
    this._execucao = deps.syncExecucao ?? centralSyncExecucao;
    /** @private */
    this._flags = deps.flags ?? centralEntradasFlags;
    /** @private */
    this._timeoutId = null;
    /** @private */
    this._ativo = false;
  }

  estaAtivo() {
    return this._ativo;
  }

  async iniciar() {
    await this._config.hidratarFlags();
    this.parar();

    if (!this._flags.estaHabilitado() || !this._flags.syncAutomaticaHabilitada()) {
      this._ativo = false;
      return;
    }

    this._ativo = true;
    this._agendarCiclo(3000);
    console.log('[Central Entradas] Sync automática iniciada.');
  }

  parar() {
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }
    this._ativo = false;
    this._execucao.definirProximaExecucao(null);
  }

  async reiniciar() {
    this.parar();
    await this.iniciar();
  }

  /** @private */
  _agendarCiclo(delayMs) {
    if (this._timeoutId) clearTimeout(this._timeoutId);

    this._timeoutId = setTimeout(async () => {
      if (!this._ativo) return;

      if (!this._flags.syncAutomaticaHabilitada()) {
        this.parar();
        return;
      }

      const intervalo = await this._config.obterIntervaloMs();
      this._execucao.definirProximaExecucao(new Date(Date.now() + intervalo).toISOString());

      await this._execucao.executar({ origem: ORIGENS.BACKGROUND });

      if (this._ativo) {
        this._agendarCiclo(intervalo);
      }
    }, delayMs);
  }

  obterStatus() {
    const estado = this._execucao.obterEstado();
    return {
      servicoAtivo: this._ativo,
      syncAutomaticaHabilitada: this._flags.syncAutomaticaHabilitada(),
      executando: estado.executando,
      ultimaExecucao: estado.ultimaExecucao,
      proximaExecucao: estado.proximaExecucao,
      ultimoResultado: estado.ultimoResultado
        ? {
          sucesso: estado.ultimoResultado.sucesso,
          notasNovas: estado.ultimoResultado.notasNovas,
          duracaoMs: estado.ultimoResultado.duracaoMs,
          mensagem: estado.ultimoResultado.mensagem
        }
        : null
    };
  }
}

module.exports = new CentralSyncBackgroundService();
