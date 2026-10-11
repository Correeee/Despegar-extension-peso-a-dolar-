// =====================================================================
// lib.js — Helpers compartidos (popup, background y content script)
// Cargado como script clásico en popup.html, importScripts() en el
// service worker y como primer allowlist en content_scripts.
// No usa módulos ES: expone funciones/constantes globales.
// =====================================================================

// ── Claves y defaults ────────────────────────────────────────────────
const PREF_DEFS = Object.freeze({
    activo: false,
    tipoDolar: 'oficial',
    umbralPesos: 500,
    decimales: 2
});

// ── Preferencias (chrome.storage.sync, con migración desde local) ────
async function leerPrefs() {
    const claves = Object.keys(PREF_DEFS);
    const sync = await chrome.storage.sync.get(claves);
    const faltan = claves.filter(k => sync[k] === undefined);

    if (!faltan.length) return { ...PREF_DEFS, ...sync };

    // Migración única: si el usuario venía con prefs en storage.local,
    // las promovemos a sync para no perder su configuración.
    const local = await chrome.storage.local.get(faltan);
    const migrar = {};
    faltan.forEach(k => {
        if (local[k] !== undefined) migrar[k] = local[k];
    });
    if (Object.keys(migrar).length) await chrome.storage.sync.set(migrar);

    return { ...PREF_DEFS, ...local, ...sync };
}

function guardarPrefs(obj) {
    return chrome.storage.sync.set(obj);
}

// ── Formato ──────────────────────────────────────────────────────────
function formatearUSD(valor, decimales = 2) {
    const dec = Number.isInteger(decimales) ? decimales : 2;
    return valor.toLocaleString('en-US', {
        minimumFractionDigits: dec,
        maximumFractionDigits: dec
    });
}

// ── Parseo de precios en pesos (robusto a separadores) ───────────────
// Acepta "$12.345", "$12.345,50", "$12,345.50", "12345".
// Devuelve el número o null si no supera el umbral mínimo.
function parsearPesos(texto, minimo = 500) {
    if (typeof texto !== 'string') return null;

    // Dejar sólo dígitos, puntos y comas
    let limpio = texto.replace(/[^\d.,]/g, '');
    if (!limpio) return null;

    const tieneComa = limpio.includes(',');
    const tienePunto = limpio.includes('.');

    if (tieneComa && tienePunto) {
        // El último separador es el decimal
        const ultimo = Math.max(limpio.lastIndexOf(','), limpio.lastIndexOf('.'));
        const decimalSep = limpio[ultimo];
        const milesSep = decimalSep === ',' ? '.' : ',';
        limpio = limpio.split(milesSep).join('');
        limpio = limpio.replace(decimalSep, '.');
    } else if (tieneComa || tienePunto) {
        const sep = tieneComa ? ',' : '.';
        const partes = limpio.split(sep);
        const esMiles = partes.length > 1 &&
            partes[0].length <= 3 &&
            partes.slice(1).every(p => p.length === 3);
        if (esMiles) {
            limpio = partes.join('');
        } else {
            // Separador decimal: unir todo menos el último grupo
            limpio = partes.slice(0, -1).join('') + '.' + partes[partes.length - 1];
        }
    }

    const valor = parseFloat(limpio);
    const min = Number.isFinite(minimo) ? minimo : 500;
    return (!isNaN(valor) && valor > min) ? valor : null;
}

// ── Cotización según tipo ────────────────────────────────────────────
function getCotizacion(dolarData, tipoDolar) {
    if (!dolarData) return null;
    const src = tipoDolar === 'blue' ? dolarData.blue : dolarData.oficial;
    return src ? src.value_sell : null;
}

// ── Normalizadores de API → { oficial, blue } ────────────────────────
// Formato interno: { oficial: { value_sell, value_buy }, blue: {...} }
// bluelytics (/v2/latest) ya devuelve ese formato.

function normalizarDolarApi(json) {
    const lista = Array.isArray(json) ? json : [json];
    const out = {};
    lista.forEach(d => {
        const casa = (d && d.casa ? d.casa : '').toLowerCase();
        if (casa === 'oficial' || casa === 'blue') {
            out[casa] = { value_sell: d.venta, value_buy: d.compra };
        }
    });
    return out;
}

// ── Fecha de ayer (YYYY-MM-DD) ───────────────────────────────────────
function fechaAyerISO() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
}
