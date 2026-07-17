/**
 * CDS Platform — detecção de cliente e rotas canônicas.
 * Usado pelo login e pelos apps. Sem regras de negócio.
 */
(function (global) {
  'use strict';

  var CLIENT_KEY = 'cds_app_client';
  var MOBILE_PATH = '/apps/mobile/';
  var ERP_PATH = '/erp';
  var PDV_PATH = '/pdv';

  function lerQueryClient() {
    try {
      var params = new URLSearchParams(global.location.search);
      return (params.get('client') || params.get('cliente') || '').toLowerCase();
    } catch (e) {
      return '';
    }
  }

  function isElectronRuntime() {
    return !!(global.electronAPI || (typeof navigator !== 'undefined' && /Electron/i.test(navigator.userAgent || '')));
  }

  function isMobileUserAgent() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
      (typeof navigator !== 'undefined' && navigator.userAgent) || ''
    );
  }

  function isNarrowTouchViewport() {
    try {
      var narrow = global.matchMedia && global.matchMedia('(max-width: 900px)').matches;
      var coarse = global.matchMedia && global.matchMedia('(pointer: coarse)').matches;
      return !!(narrow && (coarse || isMobileUserAgent()));
    } catch (e) {
      return false;
    }
  }

  /**
   * Preferência explícita (?client=mobile|desktop) > localStorage > Electron > UA/viewport.
   */
  function isClienteMobilePreferido() {
    var q = lerQueryClient();
    if (q === 'mobile' || q === 'm') {
      try { localStorage.setItem(CLIENT_KEY, 'mobile'); } catch (e) { /* ignore */ }
      return true;
    }
    if (q === 'desktop' || q === 'erp' || q === 'pdv') {
      try { localStorage.setItem(CLIENT_KEY, 'desktop'); } catch (e) { /* ignore */ }
      return false;
    }

    if (isElectronRuntime()) return false;

    var stored = null;
    try { stored = localStorage.getItem(CLIENT_KEY); } catch (e) { /* ignore */ }
    if (stored === 'mobile') return true;
    if (stored === 'desktop') return false;

    return isMobileUserAgent() || isNarrowTouchViewport();
  }

  function forcarCliente(client) {
    var value = client === 'mobile' ? 'mobile' : 'desktop';
    try { localStorage.setItem(CLIENT_KEY, value); } catch (e) { /* ignore */ }
    return value;
  }

  function obterRotaMobile() {
    return MOBILE_PATH;
  }

  function obterRotaErp() {
    return ERP_PATH;
  }

  function obterRotaPdv() {
    return PDV_PATH;
  }

  global.CDSPlatform = {
    CLIENT_KEY: CLIENT_KEY,
    MOBILE_PATH: MOBILE_PATH,
    ERP_PATH: ERP_PATH,
    PDV_PATH: PDV_PATH,
    isElectronRuntime: isElectronRuntime,
    isClienteMobilePreferido: isClienteMobilePreferido,
    forcarCliente: forcarCliente,
    obterRotaMobile: obterRotaMobile,
    obterRotaErp: obterRotaErp,
    obterRotaPdv: obterRotaPdv
  };

  global.isClienteMobilePreferido = isClienteMobilePreferido;
})(typeof window !== 'undefined' ? window : this);
