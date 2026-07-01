// =====================================================================
// Estado local
// =====================================================================
let activo     = false;
let tipoDolar  = 'oficial';
let dolarData  = null;

const PRICE_SELECTORS = [
    '.main-value', '.amount', '.price-amount', '.price-number',
    '.item-price', '.offer-card-pricebox-price-amount',
    '.-eva-3-ml-xsm', '.wizard-price-amount', '.-eva-3-bold',
    '.pricebox-big-text', '.eva-3-h4', '.pricebox-sticky-price',
    '.favorite-card-pricebox-price-amount'
].join(', ');

const BADGE_CLASS = 'despegar-usd-badge';

// =====================================================================
// Helpers
// =====================================================================
function getCotizacion() {
    if (!dolarData) return null;
    const src = tipoDolar === 'blue' ? dolarData.blue : dolarData.oficial;
    return src ? src.value_sell : null;
}

function parsearPesos(texto) {
    const v = parseFloat(texto.replace(/[^\d]/g, ''));
    return (!isNaN(v) && v > 500) ? v : null;
}

function formatUSD(valor) {
    return valor.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// =====================================================================
// Carga inicial desde storage
// =====================================================================
chrome.storage.local.get(['activo', 'dolarData', 'tipoDolar'], (stored) => {
    activo    = stored.activo    ?? false;
    tipoDolar = stored.tipoDolar || 'oficial';
    dolarData = stored.dolarData || null;

    if (activo && getCotizacion()) {
        inyectarBadges();
        observarDOM();
    }
});

// =====================================================================
// Sincronización con cambios de storage (sin reload de página)
// =====================================================================
chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;

    if (changes.activo !== undefined) {
        activo = changes.activo.newValue;
        if (!activo) {
            eliminarBadges();
        } else if (getCotizacion()) {
            inyectarBadges();
            observarDOM();
        }
    }

    if (changes.dolarData !== undefined) {
        dolarData = changes.dolarData.newValue;
        if (activo && getCotizacion()) { inyectarBadges(); observarDOM(); }
    }

    if (changes.tipoDolar !== undefined) {
        tipoDolar = changes.tipoDolar.newValue;
        eliminarBadges();
        if (activo && getCotizacion()) inyectarBadges();
    }
});

// =====================================================================
// Badges permanentes en cards de precio
// =====================================================================
function inyectarBadges() {
    const cotiz = getCotizacion();
    if (!cotiz) return;

    document.querySelectorAll(PRICE_SELECTORS).forEach(el => {
        // Evitar duplicados y elementos que ya tienen badge hijo
        if (el.querySelector(`.${BADGE_CLASS}`)) return;
        // Evitar inyectar dentro de otro badge
        if (el.classList.contains(BADGE_CLASS)) return;

        // Evitar inyectar si el precio ya está en USD
        const textoMoneda = el.parentElement ? el.parentElement.innerText : el.innerText;
        if (/US\$|USD|U\$D|U\$S/i.test(textoMoneda)) return;

        const pesos = parsearPesos(el.innerText);
        if (!pesos) return;

        const badge = document.createElement('span');
        badge.className  = BADGE_CLASS;
        badge.textContent = `≈ U$D ${formatUSD(pesos / cotiz)}`;
        badge.style.cssText = `
            display: block;
            font-size: 11px;
            color: #28a745;
            font-weight: 600;
            font-family: sans-serif;
            margin-top: 2px;
            letter-spacing: 0.2px;
            line-height: 1.2;
        `;
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
        if (activo && getCotizacion()) inyectarBadges();
    });
    observer.observe(document.body, { childList: true, subtree: true });
}