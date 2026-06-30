// =====================================================================
// Estado local (evita llamar a chrome.storage en cada mousemove)
// =====================================================================
let activo     = false;
let tipoDolar  = 'oficial';
let dolarData  = null;
let tooltip    = null;

// RAF throttle
let rafPending = false;
let lastEvent  = null;

const PRICE_SELECTORS = [
    '.main-value', '.amount', '.price-amount', '.price-number',
    '.item-price', '.offer-card-pricebox-price-amount',
    '.-eva-3-ml-xsm', '.wizard-price-amount', '.-eva-3-bold',
    '.pricebox-big-text', '.eva-3-h4', '.pricebox-sticky-price'
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

    crearTooltip();
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
            if (tooltip) tooltip.style.display = 'none';
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
// Tooltip flotante
// =====================================================================
function crearTooltip() {
    const existing = document.getElementById('despegar-usd-tooltip');
    if (existing) { tooltip = existing; return; }

    tooltip = document.createElement('div');
    tooltip.id = 'despegar-usd-tooltip';
    tooltip.style.cssText = `
        position: fixed;
        padding: 10px 14px;
        background: rgba(255,255,255,0.98);
        color: #333;
        border-radius: 8px;
        font-size: 14px;
        z-index: 2147483647;
        display: none;
        pointer-events: none;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        border: 1.5px solid #4300d2;
        font-family: sans-serif;
        line-height: 1.3;
        font-weight: bold;
    `;
    document.body.appendChild(tooltip);
}

// =====================================================================
// mousemove con throttle via requestAnimationFrame
// =====================================================================
document.addEventListener('mousemove', (e) => {
    lastEvent = e;
    if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(procesarMouse);
    }
});

function procesarMouse() {
    rafPending = false;
    const e = lastEvent;
    if (!e) return;

    try {
        if (!activo || !getCotizacion() || !tooltip) {
            if (tooltip) tooltip.style.display = 'none';
            return;
        }

        const target = e.target.closest(PRICE_SELECTORS);
        if (target) {
            const pesos = parsearPesos(target.innerText);
            if (pesos) {
                const cotiz = getCotizacion();
                const usd   = formatUSD(pesos / cotiz);
                const label = tipoDolar === 'blue' ? 'Blue' : 'Oficial';

                tooltip.innerHTML = `
                    <div style="color:#4300d2;font-size:10px;text-transform:uppercase;margin-bottom:2px;">
                        Despegar · Dólar ${label}
                    </div>
                    <div style="font-size:18px;color:#111;">U$D ${usd}</div>
                    <div style="color:#888;font-size:9px;font-weight:normal;margin-top:4px;">
                        Cotización venta: $${cotiz}
                    </div>`;

                tooltip.style.display = 'block';
                tooltip.style.left    = (e.clientX + 15) + 'px';
                tooltip.style.top     = (e.clientY + 15) + 'px';

                // Ajustar si se sale de pantalla
                const b = tooltip.getBoundingClientRect();
                if (e.clientX + b.width + 20 > window.innerWidth) {
                    tooltip.style.left = (e.clientX - b.width - 15) + 'px';
                }
                if (e.clientY + b.height + 20 > window.innerHeight) {
                    tooltip.style.top = (e.clientY - b.height - 15) + 'px';
                }
                return;
            }
        }
        tooltip.style.display = 'none';
    } catch (_) {
        if (tooltip) tooltip.style.display = 'none';
    }
}

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