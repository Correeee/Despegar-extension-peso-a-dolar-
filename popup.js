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

// ── Variación del día ─────────────────────────────────────────────
function diaAnteriorStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

function mostrarIndicador(elId, hoy, ayer) {
    const el = document.getElementById(elId);
    if (!el) return;
    if (!hoy || !ayer || ayer === 0) { el.textContent = ''; el.className = 'variacion'; return; }
    const diff = hoy - ayer;
    const pct  = Math.abs((diff / ayer) * 100).toFixed(2);
    el.textContent = `${diff >= 0 ? '\u2191' : '\u2193'} ${diff >= 0 ? '+' : '-'}${pct}%`;
    el.className   = `variacion ${diff > 0 ? 'sube' : diff < 0 ? 'baja' : 'igual'}`;
}

function cargarVariacion(hoyData, tipo) {
    const fechaAyer = diaAnteriorStr();
    const src = tipo === 'blue' ? 'blue' : 'oficial';

    chrome.storage.local.get(['dolarAyerData', 'dolarAyerFecha'], (stored) => {
        const usarCache = stored.dolarAyerFecha === fechaAyer && stored.dolarAyerData;
        const aplicar = (ayer) => {
            mostrarIndicador('varVenta',  hoyData[src]?.value_sell, ayer[src]?.value_sell);
            mostrarIndicador('varCompra', hoyData[src]?.value_buy,  ayer[src]?.value_buy);
        };

        if (usarCache) { aplicar(stored.dolarAyerData); return; }

        fetch(`https://api.bluelytics.com.ar/v2/historical?day=${fechaAyer}`)
            .then(r => r.json())
            .then(ayer => {
                chrome.storage.local.set({ dolarAyerData: ayer, dolarAyerFecha: fechaAyer });
                aplicar(ayer);
            })
            .catch(() => {
                ['varVenta', 'varCompra'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) { el.textContent = ''; el.className = 'variacion'; }
                });
            });
    });
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
            cargarVariacion(stored.dolarData, tipo);
            actualizarFecha(stored.dolarTimestamp);
            actualizarTiempoActualizacion(stored.dolarTimestamp);
            return;
        }

        fetch('https://api.bluelytics.com.ar/v2/latest')
            .then(r => r.json())
            .then(data => {
                chrome.storage.local.set({ dolarData: data, dolarTimestamp: ahora });
                mostrarValores(data, tipo);
                cargarVariacion(data, tipo);
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
            if (d.dolarData) {
                mostrarValores(d.dolarData, tipo);
                cargarVariacion(d.dolarData, tipo);
            }
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
