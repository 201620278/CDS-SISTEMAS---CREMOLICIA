/**
 * CDS Mobile RC2.1 — Capacidades nativas do dispositivo
 * Sem regras de negócio: câmera, share, WhatsApp, Maps, mídia local.
 */

import { showToast } from './toast.js';
import { fieldHtml, promptSheet } from './forms.js';

const MEDIA_PREFIX = 'cds-mobile-media:';

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

export function mediaKey(tipo, id) {
  return `${MEDIA_PREFIX}${tipo}:${id}`;
}

export function getLocalMedia(tipo, id) {
  try {
    return localStorage.getItem(mediaKey(tipo, id)) || '';
  } catch (e) {
    return '';
  }
}

export function setLocalMedia(tipo, id, dataUrl) {
  try {
    if (!dataUrl) {
      localStorage.removeItem(mediaKey(tipo, id));
      return true;
    }
    localStorage.setItem(mediaKey(tipo, id), dataUrl);
    return true;
  } catch (e) {
    showToast('Não foi possível salvar a imagem neste dispositivo.', 'warning');
    return false;
  }
}

/**
 * Captura foto via input file (câmera). Retorna data URL ou null.
 */
export function capturePhoto({ facingMode = 'environment', accept = 'image/*' } = {}) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.capture = facingMode === 'user' ? 'user' : 'environment';
    input.style.display = 'none';
    document.body.appendChild(input);

    const cleanup = () => {
      input.remove();
    };

    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) {
        cleanup();
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        cleanup();
        resolve(typeof reader.result === 'string' ? reader.result : null);
      };
      reader.onerror = () => {
        cleanup();
        resolve(null);
      };
      reader.readAsDataURL(file);
    });

    input.addEventListener('cancel', () => {
      cleanup();
      resolve(null);
    });

    input.click();
  });
}

/**
 * Prompt simples para código de barras (scanner hardware = teclado).
 * Se BarcodeDetector existir, oferece captura por câmera.
 */
export async function scanBarcode({ title = 'Código de barras', current = '' } = {}) {
  if (typeof window.BarcodeDetector === 'function') {
    try {
      const detected = await scanWithBarcodeDetector();
      if (detected) return detected;
    } catch (e) {
      /* fallback abaixo */
    }
  }

  const data = await promptSheet({
    title,
    confirmLabel: 'OK',
    fieldsHtml: fieldHtml({
      name: 'codigo',
      label: 'Código',
      value: current || '',
      required: true,
      inputmode: 'numeric',
      autocomplete: 'off'
    })
  });
  return data?.codigo != null ? String(data.codigo).trim() : null;
}

async function scanWithBarcodeDetector() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' }
  });
  const video = document.createElement('video');
  video.srcObject = stream;
  video.setAttribute('playsinline', 'true');
  video.muted = true;
  await video.play();

  const detector = new window.BarcodeDetector({
    formats: ['ean_13', 'ean_8', 'code_128', 'qr_code', 'upc_a', 'upc_e']
  });

  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'cds-scan-overlay';
    overlay.innerHTML = `
      <div class="cds-scan-overlay__panel">
        <p>Aponte para o código</p>
        <button type="button" class="cds-mobile-btn cds-mobile-btn--secondary" data-cancel>Cancelar</button>
      </div>
    `;
    overlay.prepend(video);
    document.body.appendChild(overlay);
    document.body.classList.add('is-overlay-open');

    let stopped = false;
    const stop = (value) => {
      if (stopped) return;
      stopped = true;
      stream.getTracks().forEach((t) => t.stop());
      overlay.remove();
      if (!document.querySelector('.cds-mobile-drawer.is-open') && !document.getElementById('cds-mobile-sheet')) {
        document.body.classList.remove('is-overlay-open');
      }
      resolve(value);
    };

    overlay.querySelector('[data-cancel]')?.addEventListener('click', () => stop(null));

    const tick = async () => {
      if (stopped) return;
      try {
        const codes = await detector.detect(video);
        if (codes && codes[0]?.rawValue) {
          stop(String(codes[0].rawValue));
          return;
        }
      } catch (e) { /* keep scanning */ }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

export async function sharePayload({ title = 'CDS Mobile', text = '', url = '', files = [] } = {}) {
  const payload = { title, text };
  if (url) payload.url = url;
  if (files.length && navigator.canShare && navigator.canShare({ files })) {
    payload.files = files;
  }
  if (navigator.share) {
    try {
      await navigator.share(payload);
      return true;
    } catch (err) {
      if (err?.name === 'AbortError') return false;
    }
  }
  if (text || url) {
    try {
      await navigator.clipboard.writeText([text, url].filter(Boolean).join('\n'));
      showToast('Copiado para a área de transferência.', 'success');
      return true;
    } catch (e) {
      showToast('Compartilhamento indisponível neste dispositivo.', 'warning');
    }
  }
  return false;
}

export async function shareTextAsFile(filename, content, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime });
  const file = new File([blob], filename, { type: mime });
  const shared = await sharePayload({ title: filename, text: filename, files: [file] });
  if (!shared) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Arquivo baixado.', 'info');
  }
  return true;
}

export function openWhatsApp(phone, message = '') {
  const n = digitsOnly(phone);
  if (!n) {
    showToast('Telefone não informado.', 'warning');
    return false;
  }
  const text = encodeURIComponent(message || '');
  const href = `https://wa.me/${n.startsWith('55') ? n : `55${n}`}${text ? `?text=${text}` : ''}`;
  window.open(href, '_blank', 'noopener');
  return true;
}

export function openCall(phone) {
  const n = digitsOnly(phone);
  if (!n) {
    showToast('Telefone não informado.', 'warning');
    return false;
  }
  window.location.href = `tel:${n}`;
  return true;
}

export function openMaps(addressOrQuery) {
  const q = String(addressOrQuery || '').trim();
  if (!q) {
    showToast('Endereço não informado.', 'warning');
    return false;
  }
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`, '_blank', 'noopener');
  return true;
}

export function photoThumbHtml(dataUrl, emptyLabel = 'Sem foto') {
  if (dataUrl) {
    return `<img class="cds-media-thumb" src="${dataUrl}" alt="Foto" />`;
  }
  return `<div class="cds-media-thumb cds-media-thumb--empty">${emptyLabel}</div>`;
}

export default {
  capturePhoto,
  scanBarcode,
  sharePayload,
  shareTextAsFile,
  openWhatsApp,
  openCall,
  openMaps,
  getLocalMedia,
  setLocalMedia,
  photoThumbHtml
};
