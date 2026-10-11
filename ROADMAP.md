# Roadmap de Desarrollo — Despegar peso a dólar

## 📋 Estado General del MVP
- Progreso Estimado: 55%
- Objetivo: Mostrar el precio en dólares (según cotización oficial/blue) de los
  productos de Despegar directamente sobre la página, con control desde un popup.

## 🚧 En Progreso / Siguiente
- [ ] `options_page` o sección de preferencias para `umbralPesos` y `decimales`
      (ya persistidos en `storage.sync`, falta la UI de edición).
- [ ] Dólar Tarjeta/Turista y MEP/CCL como nuevos tipos de cotización.
- [ ] Conversor manual ARS ⇄ USD en el popup.
- [ ] Mini historial / sparkline con `/v2/historical`.
- [ ] Coverage multi-país (Despegar opera en más de `.com` y `.com.ar`).
- [ ] Lista de exclusión configurable desde el popup.
- [ ] Manifest hardening: `minimum_chrome_version`, `default_locale` + `_locales/`.
- [ ] Tests + ESLint (funciones puras de `scripts/lib.js`: `parsearPesos`,
      `formatearUSD`, `normalizarDolarApi`).
- [ ] Normalizar `README.md` (está en UTF-16 con mojibake; ver "Notas").

## ✅ Completado
- [x] Inyección de badges con precio convertido a USD en cards de Despegar.
- [x] Selector Oficial / Blue en el popup.
- [x] Variación diaria (flechas + porcentaje) vs. día anterior.
- [x] Exclusión de conversión cuando el precio ya viene en USD.
- [x] Badge ON/OFF en el ícono de la extensión.
- [x] (rama develop) Service worker con `chrome.alarms` que mantiene la
      cotización fresca cada 15 min, independiente de que se abra el popup.
- [x] (rama develop) Fallback de API (bluelytics → dolarapi.com).
- [x] (rama develop) Parseo de precios robusto (separadores de miles/decimales)
      y umbral mínimo configurable.
- [x] (rama develop) Preferencias (`activo`, `tipoDolar`) migradas a
      `chrome.storage.sync` con migración desde `storage.local`.
- [x] (rama develop) Refactor DRY: lógica y helpers compartidos en `scripts/lib.js`.
- [x] (rama develop) Estilos del badge movidos de JS inline a `style/style.css`.
- [x] (rama develop) Estado offline: se conserva la última cotización válida y
      se avisa en el popup; botón de refresco manual.

## 🧱 Arquitectura
- `manifest.json` — MV3. Permisos `storage`, `tabs`, `alarms`. Hosts Despegar + APIs.
- `scripts/background.js` — service worker: alarma de refresco + fallback de API.
- `scripts/lib.js` — helpers compartidos (prefs, formato, parseo, normalizadores).
- `scripts/content.js` — inyecta badges en el DOM de Despegar (usa `lib.js`).
- `popup.html` / `popup.js` — UI de cotización, selector de tipo, toggle y refresco.
- `style/style.css` — estilos inyectados en la página (incluye `.despegar-usd-badge`).

## ⚠️ Notas
- `README.md` contradice el estado real del código: está codificado en UTF-16 con
  mojibake y no documenta la arquitectura (service worker, `lib.js`, prefs en
  `storage.sync`). Pendiente: reescribirlo en UTF-8 y agregar sección de arquitectura.

*Última actualización: 2026-10-10 (rama `develop`: background worker, fallback de API, preferencias en sync, parseo robusto y estado offline).*
