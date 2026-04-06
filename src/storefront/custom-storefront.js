/**
 * Checkout Geo Flash for Ecwid storefronts.
 *
 * Static mode reads the app's public config from Ecwid App Storage and avoids
 * any custom Node.js server, database, or cache runtime.
 */

(function () {
  'use strict';

  if (typeof window === 'undefined' || typeof document === 'undefined' || typeof window.Ecwid === 'undefined') {
    return;
  }

  var globalConfig = window.CheckoutGeoFlashEcwid || {};
  var runtime = window.CheckoutGeoFlashEcwidRuntime || {
    stage: 'ecwid-storefront',
    version: '0.1.0',
  };

  var styleId = 'cgf-ecwid-style';
  var containerId = 'cgf-ecwid-toast-container';
  var exitDurationMs = 320;
  var maxToasts = 4;
  var rotationTimer = null;
  var rotationIndex = 0;
  var runtimeConfig = null;

  function clampInteger(value, fallback, min, max) {
    var parsed = Number.parseInt(value, 10);

    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    return Math.min(Math.max(parsed, min), max);
  }

  function normalizeText(value, fallback) {
    if (typeof value !== 'string') {
      return fallback;
    }

    var trimmed = value.trim();
    return trimmed === '' ? fallback : trimmed;
  }

  function normalizeSample(sample, locationMode) {
    var source = sample && typeof sample === 'object' ? sample : {};

    return {
      productName: normalizeText(source.productName, 'Recent order'),
      location: normalizeText(source.location, locationMode === 'country' ? 'Unknown country' : 'Nearby'),
      event: String(source.event).trim() === 'paid' ? 'paid' : 'checkout',
    };
  }

  function normalizeConfig(config) {
    var source = config && typeof config === 'object' ? config : {};
    var locationMode = source.locationMode === 'country' ? 'country' : 'city';
    var samples = Array.isArray(source.samples)
      ? source.samples.map(function (sample) {
          return normalizeSample(sample, locationMode);
        }).slice(0, 12)
      : [];

    if (samples.length === 0) {
      samples = [
        normalizeSample({ productName: 'Weekend Tote', location: 'Austin', event: 'paid' }, locationMode),
        normalizeSample({ productName: 'Desk Lamp', location: 'Berlin', event: 'checkout' }, locationMode),
      ];
    }

    return {
      enabled: source.enabled !== false,
      fallbackLocationLabel: normalizeText(source.fallbackLocationLabel, 'Nearby'),
      locationMode: locationMode,
      mode: source.mode === 'hybrid' || source.mode === 'order-confirmation' ? source.mode : 'sample-loop',
      rotateIntervalMs: clampInteger(source.rotateIntervalMs, 3200, 2000, 15000),
      samples: samples,
      visibleDurationMs: clampInteger(source.visibleDurationMs, 5000, 2500, 12000),
    };
  }

  function parsePublicConfigRecord(record) {
    var candidate = record;

    if (candidate && typeof candidate === 'object' && Object.prototype.hasOwnProperty.call(candidate, 'value')) {
      candidate = candidate.value;
    }

    if (typeof candidate === 'string') {
      try {
        candidate = JSON.parse(candidate);
      } catch (error) {
        candidate = {};
      }
    }

    return normalizeConfig(candidate);
  }

  function injectStyles() {
    if (document.getElementById(styleId)) {
      return;
    }

    var style = document.createElement('style');
    style.id = styleId;
    style.textContent = [
      '#' + containerId + '{position:fixed;right:20px;bottom:20px;z-index:999999;display:flex;flex-direction:column;align-items:flex-end;gap:10px;pointer-events:none;width:min(380px,calc(100vw - 32px));}',
      '.cgf-ecwid-toast{position:relative;width:100%;overflow:hidden;background:#ffffff;color:#1d1e21;border-radius:8px;padding:16px;border:1px solid #e2e8f0;box-shadow:0 10px 24px rgba(29,30,33,.08);font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;opacity:0;transform:translate3d(0,20px,0) scale(.96);filter:blur(4px);transition:opacity .28s ease,transform .38s cubic-bezier(.22,1,.36,1),filter .38s ease;pointer-events:auto;}',
      '.cgf-ecwid-toast.is-visible{opacity:1;transform:translate3d(0,0,0) scale(1);filter:blur(0);}',
      '.cgf-ecwid-toast.is-leaving{opacity:0;transform:translate3d(0,12px,0) scale(.985);filter:blur(2px);}',
      '.cgf-ecwid-toast__eyebrow{color:#6b7280;font-size:11px;font-weight:600;letter-spacing:.05em;line-height:1.35;margin:0 0 6px;text-transform:uppercase;}',
      '.cgf-ecwid-toast__title{color:#1d1e21;font-size:14px;font-weight:600;line-height:1.4;margin:0;}',
      '@media (max-width:640px){#' + containerId + '{left:12px;right:12px;bottom:12px;width:auto;align-items:stretch;}}',
      '@media (prefers-reduced-motion:reduce){.cgf-ecwid-toast{transition:none !important;transform:none !important;filter:none !important;}}',
    ].join('');
    document.head.appendChild(style);
  }

  function getContainer() {
    var container = document.getElementById(containerId);

    if (container) {
      return container;
    }

    container = document.createElement('div');
    container.id = containerId;
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'false');
    document.body.appendChild(container);
    return container;
  }

  function hideToast(toast) {
    if (!toast || toast.dataset.cgfLeaving === '1') {
      return;
    }

    toast.dataset.cgfLeaving = '1';
    toast.classList.remove('is-visible');
    toast.classList.add('is-leaving');

    window.setTimeout(function () {
      if (toast.parentNode) {
        toast.remove();
      }
    }, exitDurationMs);
  }

  function pruneToasts(container) {
    var excessCount = Math.max(container.children.length - maxToasts, 0);
    var index;

    for (index = 0; index < excessCount; index += 1) {
      hideToast(container.children[container.children.length - 1 - index]);
    }
  }

  function renderToast(payload) {
    var container = getContainer();
    var toast = document.createElement('article');
    var eyebrow = normalizeText(payload.eyebrow, 'Checkout Geo Flash');
    var title = normalizeText(payload.title, 'Someone just checked out.');

    toast.className = 'cgf-ecwid-toast';
    toast.innerHTML = '<p class="cgf-ecwid-toast__eyebrow"></p><p class="cgf-ecwid-toast__title"></p>';
    toast.querySelector('.cgf-ecwid-toast__eyebrow').textContent = eyebrow;
    toast.querySelector('.cgf-ecwid-toast__title').textContent = title;

    container.prepend(toast);
    pruneToasts(container);

    window.requestAnimationFrame(function () {
      toast.classList.add('is-visible');
    });

    window.setTimeout(function () {
      hideToast(toast);
    }, runtimeConfig.visibleDurationMs);
  }

  function buildSampleToast(sample) {
    var eventLabel = sample.event === 'paid' ? 'just paid for' : 'just purchased';
    return {
      eyebrow: 'Sample notification',
      title: 'Someone from ' + sample.location + ' ' + eventLabel + ' ' + sample.productName,
    };
  }

  function buildOrderConfirmationToast(order) {
    var firstItem = order && Array.isArray(order.items) && order.items.length > 0 ? order.items[0] : null;
    var productName = firstItem && firstItem.name ? firstItem.name : 'your recent order';
    var orderIdentifier = order && (order.orderNumber || order.id) ? ' #' + String(order.orderNumber || order.id) : '';

    return {
      eyebrow: 'Order confirmed',
      title: 'Thanks for ordering ' + productName + orderIdentifier + '.',
    };
  }

  function startSampleLoop() {
    if (rotationTimer || !runtimeConfig.samples.length) {
      return;
    }

    renderToast(buildSampleToast(runtimeConfig.samples[0]));
    rotationTimer = window.setInterval(function () {
      rotationIndex = (rotationIndex + 1) % runtimeConfig.samples.length;
      renderToast(buildSampleToast(runtimeConfig.samples[rotationIndex]));
    }, runtimeConfig.rotateIntervalMs);
  }

  function loadRuntimeConfig() {
    if (globalConfig && globalConfig.publicConfig) {
      return normalizeConfig(globalConfig.publicConfig);
    }

    if (!globalConfig.appId) {
      return normalizeConfig({});
    }

    if (typeof window.Ecwid.getAppPublicConfig === 'function') {
      return parsePublicConfigRecord(window.Ecwid.getAppPublicConfig(globalConfig.appId));
    }

    if (window.instantsite && typeof window.instantsite.getAppPublicConfig === 'function') {
      return parsePublicConfigRecord(window.instantsite.getAppPublicConfig(globalConfig.appId));
    }

    return normalizeConfig({});
  }

  function boot() {
    if (runtime.initialized) {
      return;
    }

    runtimeConfig = loadRuntimeConfig();
    runtime.config = runtimeConfig;
    runtime.initialized = true;

    if (!runtimeConfig.enabled) {
      return;
    }

    injectStyles();

    if (runtimeConfig.mode === 'sample-loop' || runtimeConfig.mode === 'hybrid') {
      startSampleLoop();
    }

    if (window.Ecwid.OnOrderPlaced && typeof window.Ecwid.OnOrderPlaced.add === 'function') {
      window.Ecwid.OnOrderPlaced.add(function (order) {
        if (runtimeConfig.mode === 'order-confirmation' || runtimeConfig.mode === 'hybrid') {
          renderToast(buildOrderConfirmationToast(order || {}));
        }
      });
    }
  }

  if (window.Ecwid.OnAPILoaded && typeof window.Ecwid.OnAPILoaded.add === 'function') {
    window.Ecwid.OnAPILoaded.add(boot);
  } else {
    boot();
  }

  runtime.renderToast = renderToast;
  window.CheckoutGeoFlashEcwidRuntime = runtime;
})();
