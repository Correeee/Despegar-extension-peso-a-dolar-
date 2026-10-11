// =====================================================================
// content.js — Inyecta badges con el precio convertido a USD.
// Depende de scripts/lib.js (cargado antes en el manifest).
// =====================================================================
let activo = false;
let tipoDolar = 'oficial';
let umbralPesos = 500;
let decimales = 2;
let dolarData = null;

const PRICE_SELECTORS = [
    '.main-value', '.amount', '.price-amount', '.price-number',
    '.item-price', '.offer-card-pricebox-price-amount',
    '.-eva-3-ml-xsm', '.wizard-price-amount', '.-eva-3-bold',
    '.pricebox-big-text', '.eva-3-h4', '.pricebox-sticky-price',
    '.favorite-card-pricebox-price-amount'
].join(', ');

const BADGE_CLASS = 'despegar-usd-badge';

// =====================================================================
// Carga inicial de preferencias y datos
// =====================================================================
function aplicarPrefs(prefs) {
    if (!prefs) return;
    activo = prefs.activo ?? false;
    tipoDolar = prefs.tipoDolar || 'oficial';
    umbralPesos = Number.isFinite(prefs.umbralPesos) ? prefs.umbralPesos : 500;
    decimales = Number.isInteger(prefs.decimales) ? prefs.decimales : 2;
}

function cargarDatosLocales() {
    return new Promise((resolve) => {
        chrome.storage.local.get('dolarData', (stored) => {
            dolarData = stored.dolarData || null;
            resolve();
        });
    });
}

function refrescarBadges() {
    if (!activo || !getCotizacion(dolarData, tipoDolar)) {
        eliminarBadges();
        return;
    }
    inyectarBadges();
    observarDOM();
}

leerPrefs().then((prefs) => {
    aplicarPrefs(prefs);
    cargarDatosLocales().then(refrescarBadges);
});

// =====================================================================
// Sincronización con cambios de storage (sin reload de página)
// =====================================================================
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
        const prefs = {};
        ['activo', 'tipoDolar', 'umbralPesos', 'decimales'].forEach(k => {
            if (changes[k] !== undefined) prefs[k] = changes[k].newValue;
        });
        if (Object.keys(prefs).length) {
            aplicarPrefs({ ...prefs });
            eliminarBadges();
            refrescarBadges();
        }
        return;
    }

    if (area === 'local' && changes.dolarData !== undefined) {
        dolarData = changes.dolarData.newValue;
        eliminarBadges();
        refrescarBadges();
    }
});

// =====================================================================
// Badges en cards de precio
// =====================================================================
function inyectarBadges() {
    const cotiz = getCotizacion(dolarData, tipoDolar);
    if (!cotiz) return;

    document.querySelectorAll(PRICE_SELECTORS).forEach(el => {
        // Evitar duplicados y elementos que ya tienen badge hijo
        if (el.querySelector(`.${BADGE_CLASS}`)) return;
        // Evitar inyectar dentro de otro badge
        if (el.classList.contains(BADGE_CLASS)) return;

        // Evitar inyectar si el precio ya está en USD
        const textoMoneda = el.parentElement ? el.parentElement.innerText : el.innerText;
        if (/US\$|USD|U\$D|U\$S/i.test(textoMoneda)) return;

        const pesos = parsearPesos(el.innerText, umbralPesos);
        if (!pesos) return;

        const badge = document.createElement('span');
        badge.className = BADGE_CLASS;            // estilos en style/style.css
        badge.textContent = `≈ U$D ${formatearUSD(pesos / cotiz, decimales)}`;
        el.appendChild(badge);
    });
}

function eliminarBadges() {
    document.querySelectorAll(`.${BADGE_CLASS}`).forEach(el => el.remove());
}

// =====================================================================
// MutationObserver para contenido dinámico (scroll / SPA navigation)
// =====================================================================
let observer = null;

function observarDOM() {
    if (observer) return;
    observer = new MutationObserver(() => {
        if (activo && getCotizacion(dolarData, tipoDolar)) inyectarBadges();
    });
    observer.observe(document.body, { childList: true, subtree: true });
}
