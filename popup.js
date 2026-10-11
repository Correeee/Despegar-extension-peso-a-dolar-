const toggleButton = document.getElementById('toggle');
const toggleTexto = document.getElementById('toggle-texto');
const btnRefrescar = document.getElementById('btnRefrescar');
const avisoEl = document.getElementById('aviso');
const CACHE_TTL = 15 * 60 * 1000; // 15 minutos

let tipoActual = 'oficial';           // preferencia activa (Oficial / Blue)
let decimales = 2;                    // preferencia de formato

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

// ── Aviso (estado offline / datos viejos) ────────────────────────
function mostrarAviso(texto) {
    if (!avisoEl) return;
    avisoEl.textContent = texto;
    avisoEl.hidden = false;
}

function ocultarAviso() {
    if (!avisoEl) return;
    avisoEl.hidden = true;
    avisoEl.textContent = '';
}

// ── Fecha y "hace X min" ─────────────────────────────────────────
function actualizarFecha(ts) {
    const d = ts ? new Date(ts) : new Date();
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const yr = String(d.getFullYear()).slice(-2);
    document.getElementById('fecha').textContent = `${dia}/${mes}/${yr}`;
}

function actualizarTiempoActualizacion(ts, fuente) {
    const el = document.getElementById('ultimaActualizacion');
    if (!ts) { el.textContent = ''; return; }
    const mins = Math.floor((Date.now() - ts) / 60000);
    const base = mins < 1 ? 'Actualizado hace un momento'
        : mins < 2 ? 'Actualizado hace 1 min'
            : `Actualizado hace ${mins} min`;
    el.textContent = fuente ? `${base} · ${fuente}` : base;
}

// ── Mostrar valores ──────────────────────────────────────────────
function mostrarValores(data, tipo) {
    if (!data) return;
    const src = tipo === 'blue' ? data.blue : data.oficial;
    if (!src) return;
    document.getElementById('valorVenta').textContent = formatearUSD(src.value_sell, decimales);
    document.getElementById('valorCompra').textContent = formatearUSD(src.value_buy, decimales);
}

// ── Variación del día ─────────────────────────────────────────────
function mostrarIndicador(elId, hoy, ayer) {
    const el = document.getElementById(elId);
    if (!el) return;
    if (!hoy || !ayer || ayer === 0) { el.textContent = ''; el.className = 'variacion'; return; }
    const diff = hoy - ayer;
    const pct = Math.abs((diff / ayer) * 100).toFixed(2);
    el.textContent = `${diff >= 0 ? '\u2191' : '\u2193'} ${diff >= 0 ? '+' : '-'}${pct}%`;
    el.className = `variacion ${diff > 0 ? 'sube' : diff < 0 ? 'baja' : 'igual'}`;
}

function cargarVariacion(hoyData, tipo) {
    const fechaAyer = fechaAyerISO();
    const src = tipo === 'blue' ? 'blue' : 'oficial';

    chrome.storage.local.get(['dolarAyerData', 'dolarAyerFecha'], (stored) => {
        const usarCache = stored.dolarAyerFecha === fechaAyer && stored.dolarAyerData;
        const aplicar = (ayer) => {
            mostrarIndicador('varVenta', hoyData[src]?.value_sell, ayer[src]?.value_sell);
            mostrarIndicador('varCompra', hoyData[src]?.value_buy, ayer[src]?.value_buy);
        };

        if (usarCache) { aplicar(stored.dolarAyerData); return; }

        // Fallback: el background aún no trajo ayer, lo pedimos acá.
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

// ── Lectura de datos locales (los escribe el service worker) ───────
function cargarValores() {
    chrome.storage.local.get(
        ['dolarData', 'dolarTimestamp', 'dolarFuente', 'dolarError'],
        (s) => {
            const ahora = Date.now();
            const antiguedad = s.dolarTimestamp ? ahora - s.dolarTimestamp : Infinity;

            if (s.dolarData) {
                mostrarValores(s.dolarData, tipoActual);
                cargarVariacion(s.dolarData, tipoActual);
                actualizarFecha(s.dolarTimestamp);
                actualizarTiempoActualizacion(s.dolarTimestamp, s.dolarFuente);

                if (s.dolarError || antiguedad > CACHE_TTL * 2) {
                    mostrarAviso(s.dolarError ||
                        'Mostrando la última cotización guardada (datos desactualizados).');
                } else {
                    ocultarAviso();
                }
                return;
            }

            // Sin datos: pedimos al background que refresque.
            document.getElementById('valorVenta').textContent = '-';
            document.getElementById('valorCompra').textContent = '-';
            pedirRefresco();
        }
    );
}

// ── Refresco manual / bajo demanda ───────────────────────────────
function pedirRefresco() {
    if (btnRefrescar) btnRefrescar.disabled = true;
    chrome.runtime.sendMessage({ tipo: 'refrescarCotizacion' }, (resp) => {
        if (btnRefrescar) btnRefrescar.disabled = false;
        if (chrome.runtime.lastError || !resp) {
            // El service worker no respondió: fallback directo.
            fetchDirecto();
            return;
        }
        cargarValores();
    });
}

function fetchDirecto() {
    fetch('https://api.bluelytics.com.ar/v2/latest')
        .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(data => {
            chrome.storage.local.set({
                dolarData: data,
                dolarTimestamp: Date.now(),
                dolarFuente: 'bluelytics',
                dolarError: null
            }, cargarValores);
        })
        .catch(() => {
            document.getElementById('valorVenta').textContent = 'Error';
            document.getElementById('valorCompra').textContent = 'Error';
            mostrarAviso('No se pudo obtener la cotización. Revisá tu conexión.');
        });
}

// ── Selector Oficial / Blue ──────────────────────────────────────
document.querySelectorAll('.dolar-tipo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        tipoActual = btn.dataset.tipo;
        document.querySelectorAll('.dolar-tipo-btn').forEach(b => b.classList.remove('activo'));
        btn.classList.add('activo');
        guardarPrefs({ tipoDolar: tipoActual });
        chrome.storage.local.get('dolarData', (d) => {
            if (d.dolarData) {
                mostrarValores(d.dolarData, tipoActual);
                cargarVariacion(d.dolarData, tipoActual);
            }
        });
    });
});

// ── Toggle ON/OFF ────────────────────────────────────────────────
toggleButton.addEventListener('click', () => {
    leerPrefs().then((prefs) => {
        const nuevo = !prefs.activo;
        guardarPrefs({ activo: nuevo }).then(() => {
            actualizarBoton(nuevo);
            actualizarBadge(nuevo);
        });
    });
});

// ── Refrescar manual ─────────────────────────────────────────────
if (btnRefrescar) btnRefrescar.addEventListener('click', pedirRefresco);

// ── Estado inicial ───────────────────────────────────────────────
leerPrefs().then((prefs) => {
    actualizarBoton(prefs.activo);
    actualizarBadge(prefs.activo);

    tipoActual = prefs.tipoDolar || 'oficial';
    decimales = Number.isInteger(prefs.decimales) ? prefs.decimales : 2;

    const btn = document.querySelector(`.dolar-tipo-btn[data-tipo="${tipoActual}"]`);
    if (btn) {
        document.querySelectorAll('.dolar-tipo-btn').forEach(b => b.classList.remove('activo'));
        btn.classList.add('activo');
    }
    cargarValores();
});
