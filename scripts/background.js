// =====================================================================
// background.js — Service Worker (MV3)
// Responsabilidad: mantener la cotización fresca en storage.local de
// forma independiente de si el usuario abre el popup, con fallback de
// API y estado de error persistido.
// =====================================================================
importScripts('lib.js');

const ALARM_REFRESH = 'dolar-refresh';
const PERIODO_MINUTOS = 15;

const URL_BLUELYTICS_LATEST = 'https://api.bluelytics.com.ar/v2/latest';
const URL_DOLARAPI_LATEST = 'https://dolarapi.com/v1/dolares';
const URL_BLUELYTICS_AYER = 'https://api.bluelytics.com.ar/v2/historical?day=';

// ── Utilidades de red ────────────────────────────────────────────────
async function fetchJson(url) {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
}

// Fuente primaria + fallback. Devuelve { data, fuente } o lanza.
async function obtenerCotizacion() {
    try {
        const data = await fetchJson(URL_BLUELYTICS_LATEST);
        return { data, fuente: 'bluelytics' };
    } catch (errPrimario) {
        const raw = await fetchJson(URL_DOLARAPI_LATEST);
        return { data: normalizarDolarApi(raw), fuente: 'dolarapi' };
    }
}

async function obtenerCotizacionAyer() {
    const fecha = fechaAyerISO();
    try {
        const data = await fetchJson(URL_BLUELYTICS_AYER + fecha);
        return { data, fecha };
    } catch {
        return null; // La variación es opcional: no rompe el refresh
    }
}

// ── Refresco principal ───────────────────────────────────────────────
async function refrescar() {
    try {
        const { data, fuente } = await obtenerCotizacion();
        await chrome.storage.local.set({
            dolarData: data,
            dolarTimestamp: Date.now(),
            dolarFuente: fuente,
            dolarError: null
        });

        const ayer = await obtenerCotizacionAyer();
        if (ayer) {
            await chrome.storage.local.set({
                dolarAyerData: ayer.data,
                dolarAyerFecha: ayer.fecha
            });
        }
        return { ok: true, fuente };
    } catch (e) {
        // No borramos dolarData: conservamos la última cotización válida.
        await chrome.storage.local.set({
            dolarError: 'No se pudo actualizar la cotización'
        });
        return { ok: false, error: String(e) };
    }
}

// ── Alarmas ──────────────────────────────────────────────────────────
function crearAlarma() {
    chrome.alarms.create(ALARM_REFRESH, { periodInMinutes: PERIODO_MINUTOS });
}

chrome.runtime.onInstalled.addListener(() => { crearAlarma(); refrescar(); });
chrome.runtime.onStartup.addListener(() => { crearAlarma(); refrescar(); });
chrome.alarms.onAlarm.addListener(a => {
    if (a.name === ALARM_REFRESH) refrescar();
});

// ── Mensajes desde el popup (refresco manual) ────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && msg.tipo === 'refrescarCotizacion') {
        refrescar().then(sendResponse);
        return true; // respuesta asíncrona
    }
});
