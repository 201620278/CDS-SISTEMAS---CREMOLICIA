/**
 * Módulo Comercial — Sprint O-1 (integração operacional ERP).
 * Conecta o menu do ERP às telas reais do Motor Comercial.
 */

function ensureMotorComercial() {
    if (typeof window.MotorComercial === 'undefined') {
        $('#page-content').html(
            '<div class="alert alert-danger">Motor Comercial não carregado. Verifique o bundle do módulo.</div>'
        );
        return false;
    }

    // STAB-03 — nunca iniciar silenciosamente com bundle antigo
    if (!window.CDS_BUILD || !window.CDS_BUILD.sprint || !window.CDS_BUILD.hash) {
        $('#page-content').html(
            '<div class="alert alert-danger" role="alert" style="white-space:pre-wrap;font-family:monospace;">'
            + '[CDS STAB-03] window.CDS_BUILD ausente.\n'
            + 'O Electron está com motor-comercial.bundle.js desatualizado ou incompleto.\n'
            + 'Execute: npm run build:motor-comercial && npm run verify:motor-comercial'
            + '</div>'
        );
        console.error('[CDS STAB-03] CDS_BUILD ausente — bundle inválido');
        return false;
    }

    if (window.CDS_BUILD.sprint !== 'UX-10') {
        $('#page-content').html(
            '<div class="alert alert-danger" role="alert" style="white-space:pre-wrap;font-family:monospace;">'
            + '[CDS STAB-03] Bundle desatualizado.\n'
            + 'Sprint esperada: UX-10\n'
            + 'Sprint do bundle: ' + String(window.CDS_BUILD.sprint) + '\n'
            + 'Hash: ' + String(window.CDS_BUILD.hash) + '\n'
            + 'Execute: npm run release:motor-comercial'
            + '</div>'
        );
        console.error('[CDS STAB-03] Sprint divergente', window.CDS_BUILD);
        return false;
    }

    if (!window.MotorComercial.isInitialized()) {
        window.MotorComercial.bootstrap({
            mountTarget: '#page-content',
            apiBaseURL: typeof API_URL === 'string' ? `${API_URL}/comercial` : undefined
        });
    }

    return true;
}

function loadComercial(page) {
    if (!ensureMotorComercial()) return;

    window.MotorComercial.abrirTela(page).catch(function () {
        // O router já monta ErrorState; este catch evita rejeição não tratada.
    });
}

function loadComercialDashboard() {
    loadComercial('comercial-dashboard');
}

function loadComercialClientes() {
    loadComercial('comercial-clientes');
}

function loadComercialConsignacaoNova() {
    loadComercial('comercial-consignacao-nova');
}

function loadComercialConsignacaoLista() {
    loadComercial('comercial-consignacao-lista');
}

function loadComercialAcertos() {
    loadComercial('comercial-acertos');
}

function loadComercialContaCorrente() {
    loadComercial('comercial-conta-corrente');
}

function loadComercialPerdas() {
    loadComercial('comercial-perdas');
}

function loadComercialCortesias() {
    loadComercial('comercial-cortesias');
}

function loadComercialRelatorios() {
    loadComercial('comercial-relatorios');
}

function loadComercialPendencias() {
    loadComercial('comercial-pendencias');
}

if (typeof window !== 'undefined') {
    window.addEventListener('motor-comercial:pendencias-updated', function (event) {
        var badge = document.getElementById('comercial-pendencias-badge');
        if (!badge) return;
        var count = Number(event.detail && event.detail.count) || 0;
        badge.textContent = String(count);
        badge.classList.toggle('d-none', count <= 0);
    });
}

// Navegação interna exposta para telas do motor
function abrirTelaComercial(target, options) {
    if (!ensureMotorComercial()) return Promise.resolve(null);
    return window.MotorComercial.abrirTela(target, options || {});
}

function voltarComercial() {
    if (!ensureMotorComercial()) return Promise.resolve(null);
    return window.MotorComercial.voltar();
}

function avancarComercial() {
    if (!ensureMotorComercial()) return Promise.resolve(null);
    return window.MotorComercial.avancar();
}

function refreshComercial() {
    if (!ensureMotorComercial()) return Promise.resolve(null);
    return window.MotorComercial.refresh();
}

function navigateComercial(path, options) {
    if (!ensureMotorComercial()) return Promise.resolve(null);
    return window.MotorComercial.navigate(path, options || {});
}
