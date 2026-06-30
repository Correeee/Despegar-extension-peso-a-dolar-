const toggleButton = document.getElementById('toggle');
const toggleTexto  = document.getElementById('toggle-texto');
const CACHE_TTL    = 15 * 60 * 1000; // 15 minutos

// ── Badge del ícono ──────────────────────────────────────────────
function actualizarBadge(activo) {
    chrome.action.setBadgeText({ text: activo ? 'ON' : '' });
    chrome.action.setBadgeBackgroundColor({ color: activo ? '#28a745' : '#ff4444' });
}

// ── Botón toggle ─────────────────────────────────────────────────
function actualizarBoton(activo) {
    toggleTexto.textContent = activo ? 'Apagar' : 'Encender';
    toggleButton.classList.toggle('activo', activo);
}

// ── Fecha y "hace X min" ─────────────────────────────────────────
function actualizarFecha(ts) {
    const d   = ts ? new Date(ts) : new Date();
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const yr  = String(d.getFullYear()).slice(-2);
    document.getElementById('fecha').textContent = `${dia}/${mes}/${yr}`;
}

function actualizarTiempoActualizacion(ts) {
    const el   = document.getElementById('ultimaActualizacion');
    if (!ts) { el.textContent = ''; return; }
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1)      el.textContent = 'Actualizado hace un momento';
    else if (mins < 2) el.textContent = 'Actualizado hace 1 min';
    else               el.textContent = `Actualizado hace ${mins} min`;
}

// ── Mostrar valores ──────────────────────────────────────────────
function mostrarValores(data, tipo) {
    if (!data) return;
    const src = tipo === 'blue' ? data.blue : data.oficial;
    if (!src)  return;
    document.getElementById('valorVenta').textContent  = src.value_sell.toFixed(2);
    document.getElementById('valorCompra').textContent = src.value_buy.toFixed(2);
}

// ── Fetch con caché TTL ──────────────────────────────────────────
function cargarValores() {
    chrome.storage.local.get(['dolarData', 'dolarTimestamp', 'tipoDolar'], (stored) => {
        const tipo  = stored.tipoDolar || 'oficial';
        const ahora = Date.now();
        const vigente = stored.dolarData &&
                        stored.dolarTimestamp &&
                        (ahora - stored.dolarTimestamp) < CACHE_TTL;

        if (vigente) {
            mostrarValores(stored.dolarData, tipo);
            actualizarFecha(stored.dolarTimestamp);
            actualizarTiempoActualizacion(stored.dolarTimestamp);
            return;
        }

        fetch('https://api.bluelytics.com.ar/v2/latest')
            .then(r => r.json())
            .then(data => {
                chrome.storage.local.set({ dolarData: data, dolarTimestamp: ahora });
                mostrarValores(data, tipo);
                actualizarFecha(ahora);
                actualizarTiempoActualizacion(ahora);
            })
            .catch(() => {
                document.getElementById('valorVenta').textContent  = 'Error';
                document.getElementById('valorCompra').textContent = 'Error';
            });
    });
}

// ── Selector Oficial / Blue ──────────────────────────────────────
document.querySelectorAll('.dolar-tipo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tipo = btn.dataset.tipo;
        document.querySelectorAll('.dolar-tipo-btn').forEach(b => b.classList.remove('activo'));
        btn.classList.add('activo');
        chrome.storage.local.set({ tipoDolar: tipo });
        chrome.storage.local.get('dolarData', (d) => {
            if (d.dolarData) mostrarValores(d.dolarData, tipo);
        });
    });
});

// ── Toggle ON/OFF ────────────────────────────────────────────────
toggleButton.addEventListener('click', () => {
    chrome.storage.local.get('activo', (data) => {
        const nuevo = !(data.activo ?? false);
        chrome.storage.local.set({ activo: nuevo }, () => {
            actualizarBoton(nuevo);
            actualizarBadge(nuevo);
        });
    });
});

// ── Estado inicial ───────────────────────────────────────────────
chrome.storage.local.get(['activo', 'tipoDolar'], (data) => {
    const activo = data.activo ?? false;
    actualizarBoton(activo);
    actualizarBadge(activo);

    const tipo = data.tipoDolar || 'oficial';
    const btn  = document.querySelector(`.dolar-tipo-btn[data-tipo="${tipo}"]`);
    if (btn) {
        document.querySelectorAll('.dolar-tipo-btn').forEach(b => b.classList.remove('activo'));
        btn.classList.add('activo');
    }
});

cargarValores();
