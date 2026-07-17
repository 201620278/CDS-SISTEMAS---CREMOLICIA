const API_URL = (() => {
  if (typeof window.API_URL === 'string' && window.API_URL.trim() !== '') {
    return window.API_URL;
  }

  const resolved = `${window.location.origin}/api`;
  window.API_URL = resolved;
  return resolved;
})();

(function redirectIfLoggedIn() {
  const token = localStorage.getItem('token');
  if (!token) return;

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (e) {
      return {};
    }
  })();

  const destino = typeof obterDestinoPosLogin === 'function'
    ? obterDestinoPosLogin(user)
    : '/erp';

  window.location.replace(destino);
})();

function setLoginLoading(isLoading) {
  const $btn = $('#btn-entrar');
  $btn.prop('disabled', isLoading);
  $btn.toggleClass('is-loading', isLoading);
  $btn.attr('aria-busy', isLoading ? 'true' : 'false');
}

function showLoginError(message) {
  const $err = $('#login-error');
  $err.addClass('is-visible').text(message);
}

function hideLoginError() {
  $('#login-error').removeClass('is-visible').text('');
}

$('#loginForm').on('submit', function(e) {
  e.preventDefault();
  const username = $('#username').val().trim();
  const password = $('#password').val();

  hideLoginError();
  setLoginLoading(true);

  $.ajax({
    url: `${API_URL}/auth/login`,
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ username, password }),
    success: function(data) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      const destino = typeof obterDestinoPosLogin === 'function'
        ? obterDestinoPosLogin(data.user)
        : '/erp';

      try {
        console.log('[CDS Mobile BOOT]', 'LOGIN OK');
        console.log('[CDS Mobile BOOT]', 'TOKEN RECEBIDO', data.token ? 'sim' : 'não');
        console.log('[CDS Mobile BOOT]', 'TOKEN SALVO');
        console.log('[CDS Mobile BOOT]', 'REDIRECIONANDO', destino);
      } catch (e) { /* ignore */ }

      window.location.replace(destino);
    },
    error: function(xhr) {
      const msg = xhr.responseJSON && xhr.responseJSON.error
        ? xhr.responseJSON.error
        : 'Não foi possível entrar. Verifique o servidor.';
      showLoginError(msg);
    },
    complete: function() {
      setLoginLoading(false);
    }
  });
});

$(document).ready(function() {
  $('.modal-backdrop').remove();
  $('body').removeClass('modal-open').css('overflow', '').css('padding-right', '');
  document.body.classList.remove('pdv-mode', 'menu-open');
  $('*').css('pointer-events', '');
  $('body, html').css('pointer-events', 'auto');

  const campoUsername = $('#username');
  if (campoUsername.length > 0 && !$('#password').is(':focus')) {
    campoUsername[0].focus();
  }

  setTimeout(() => {
    if (window.electronAPI && window.electronAPI.forcarReflow) {
      window.electronAPI.forcarReflow();
    }
  }, 100);
});
