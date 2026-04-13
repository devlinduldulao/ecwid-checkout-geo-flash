/**
 * Admin Dashboard App — Client-Side JavaScript
 *
 * Runs inside the Ecwid admin iframe.
 * Communicates with the Ecwid admin via EcwidApp SDK and
 * with your backend server via fetch().
 */

(function () {
  'use strict';

  var shared = window.CheckoutGeoFlashEcwidShared;
  var previewHelpers = window.CheckoutGeoFlashEcwidPreview;

  if (!shared || !previewHelpers) {
    return;
  }

  var bodyDataset = document.body ? document.body.dataset : {};
  var query = new URLSearchParams(window.location.search);
  var state = {
    accessToken: null,
    appId: (window.CheckoutGeoFlashEcwid && window.CheckoutGeoFlashEcwid.appId) || bodyDataset.appId || query.get('appId') || '',
    isPreviewRunning: false,
    previewIndex: 0,
    previewTimer: null,
    storeId: null,
  };

  var elements = {
    appId: document.getElementById('app-id'),
    connectionState: document.getElementById('connection-state'),
    currentAppId: document.getElementById('current-app-id'),
    currentStoreId: document.getElementById('current-store-id'),
    enabled: document.getElementById('feature-enabled'),
    fallbackLocationLabel: document.getElementById('fallback-location-label'),
    faqList: document.getElementById('faq-list'),
    guideBody: document.getElementById('guide-body'),
    guideToggle: document.getElementById('guide-toggle'),
    guideToggleLabel: document.getElementById('guide-toggle-label'),
    liveDetailDuration: document.getElementById('live-detail-duration'),
    liveDetailMode: document.getElementById('live-detail-mode'),
    liveDetailRotation: document.getElementById('live-detail-rotation'),
    liveDetailSamples: document.getElementById('live-detail-samples'),
    liveStatusBadge: document.getElementById('live-status-badge'),
    liveStatusSummary: document.getElementById('live-status-summary'),
    mode: document.getElementById('feature-mode'),
    previewStage: document.getElementById('preview-stage'),
    previewStatus: document.getElementById('preview-status'),
    previewToggle: document.getElementById('preview-toggle'),
    rotateIntervalMs: document.getElementById('rotate-interval-ms'),
    sampleLines: document.getElementById('sample-lines'),
    saveButton: document.getElementById('save-btn'),
    statusMessage: document.getElementById('status-message'),
    storefrontSnippet: document.getElementById('storefront-snippet'),
    visibleDurationMs: document.getElementById('visible-duration-ms'),
    locationMode: document.getElementById('location-mode'),
  };

  renderForm(shared.DEFAULT_PUBLIC_CONFIG);
  if (elements.appId) {
    elements.appId.value = state.appId;
  }
  updateStoreSummary();
  updateStorefrontSnippet();
  renderPreviewStage();
  updateLiveStatus();
  initGuideToggle();
  initFaqAccordion();

  if (elements.saveButton) {
    elements.saveButton.addEventListener('click', function () {
      saveSettings();
    });
  }

  if (elements.previewToggle) {
    elements.previewToggle.addEventListener('click', function () {
      togglePreview();
    });
  }

  if (elements.appId) {
    elements.appId.addEventListener('input', function () {
      state.appId = elements.appId.value.trim();
      updateStoreSummary();
      updateStorefrontSnippet();
      resizeIframe();
    });
  }

  if (elements.locationMode) {
    elements.locationMode.addEventListener('change', function () {
      var samples = shared.sampleLinesToArray(elements.sampleLines.value, elements.locationMode.value);
      elements.sampleLines.value = shared.samplesToLines(samples);
      refreshPreview();
      resizeIframe();
    });
  }

  [elements.enabled, elements.fallbackLocationLabel, elements.mode, elements.rotateIntervalMs, elements.sampleLines, elements.visibleDurationMs].forEach(function (element) {
    if (!element) {
      return;
    }

    element.addEventListener('input', refreshPreview);
    element.addEventListener('change', refreshPreview);
  });

  if (typeof window.EcwidApp === 'undefined' || typeof window.EcwidApp.init !== 'function') {
    setConnectionState('Dashboard preview only. Open this page inside Ecwid admin to connect the store and save merchant settings.', 'warning');
    return;
  }

  var app = window.EcwidApp.init({
    app_id: state.appId || 'checkout-geo-flash',
    autoheight: true,
  });

  if (!app || typeof app.getPayload !== 'function') {
    setConnectionState('Dashboard preview only. Ecwid admin payload is unavailable in this local run, so saving is disabled.', 'warning');
    return;
  }

  app.getPayload(function (payload) {
    state.storeId = payload.store_id;
    state.accessToken = payload.access_token;

    updateStoreSummary();
    setConnectionState('Connected to store ' + state.storeId + '. This dashboard now manages the store owner settings for Checkout Geo Flash.', 'success');
    loadSettings();
    resizeIframe();
  });

  function loadSettings() {
    fetch(shared.buildStorageUrl(state.storeId, 'public'), {
      headers: {
        Authorization: 'Bearer ' + state.accessToken,
      },
    })
      .then(function (response) {
        if (response.status === 404) {
          return null;
        }

        if (!response.ok) {
          throw new Error('Unable to load App Storage public config.');
        }

        return response.json();
      })
      .then(function (payload) {
        var config = shared.parsePublicConfigRecord(payload || {});
        renderForm(config);
        updateStorefrontSnippet();
        refreshPreview();
        showStatus('Loaded saved merchant settings from Ecwid.', 'success');
      })
      .catch(function (error) {
        console.error('[checkout-geo-flash] load settings failed', error);
        renderForm(shared.DEFAULT_PUBLIC_CONFIG);
        updateStorefrontSnippet();
        refreshPreview();
        showStatus('No saved settings yet. Merchant defaults are ready to edit.', 'warning');
      });
  }

  function saveSettings() {
    if (!state.storeId || !state.accessToken) {
      showStatus('Open this page inside Ecwid admin before saving.', 'error');
      return;
    }

    if (elements.appId && elements.appId.value.trim() !== '') {
      state.appId = elements.appId.value.trim();
    }

    var config = buildConfigFromForm();

    fetch(shared.buildStorageUrl(state.storeId, 'public'), {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer ' + state.accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value: shared.serializePublicConfig(config),
      }),
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Save failed with status ' + response.status + '.');
        }

        return response.json();
      })
      .then(function () {
        updateStorefrontSnippet();
        updateStoreSummary();
        showStatus('Saved merchant settings to Ecwid App Storage.', 'success');
      })
      .catch(function (error) {
        console.error('[checkout-geo-flash] save settings failed', error);
        showStatus('Unable to save. Confirm the app has read_store_profile and update_store_profile scopes.', 'error');
      });
  }

  function buildConfigFromForm() {
    return shared.normalizePublicConfig({
      enabled: elements.enabled.checked,
      fallbackLocationLabel: elements.fallbackLocationLabel.value,
      locationMode: elements.locationMode.value,
      mode: elements.mode.value,
      rotateIntervalMs: elements.rotateIntervalMs.value,
      samples: shared.sampleLinesToArray(elements.sampleLines.value, elements.locationMode.value),
      visibleDurationMs: elements.visibleDurationMs.value,
    });
  }

  function renderForm(config) {
    var normalized = shared.normalizePublicConfig(config);

    elements.enabled.checked = normalized.enabled;
    elements.fallbackLocationLabel.value = normalized.fallbackLocationLabel;
    elements.locationMode.value = normalized.locationMode;
    elements.mode.value = normalized.mode;
    elements.rotateIntervalMs.value = String(normalized.rotateIntervalMs);
    elements.sampleLines.value = shared.samplesToLines(normalized.samples);
    elements.visibleDurationMs.value = String(normalized.visibleDurationMs);
  }

  function refreshPreview() {
    updateStorefrontSnippet();
    updateLiveStatus();

    if (state.isPreviewRunning) {
      stopPreviewTimer();
      startPreview();
      return;
    }

    renderPreviewStage();
  }

  function togglePreview() {
    if (state.isPreviewRunning) {
      stopPreview();
      return;
    }

    startPreview();
  }

  function startPreview() {
    var config = buildConfigFromForm();

    if (!config.enabled) {
      setPreviewStatus('Enable the feature first to run owner preview.');
      renderPreviewStage();
      return;
    }

    state.isPreviewRunning = true;
    state.previewIndex = 0;
    setPreviewToggleLabel();
    setPreviewStatus('Owner preview is running in the dashboard only.');
    renderPreviewStage();
    stopPreviewTimer();
    state.previewTimer = window.setInterval(function () {
      state.previewIndex += 1;
      renderPreviewStage();
    }, config.rotateIntervalMs);
  }

  function stopPreview() {
    state.isPreviewRunning = false;
    stopPreviewTimer();
    setPreviewToggleLabel();
    setPreviewStatus('Preview stopped.');
    renderPreviewStage();
  }

  function stopPreviewTimer() {
    if (state.previewTimer !== null) {
      window.clearInterval(state.previewTimer);
      state.previewTimer = null;
    }
  }

  function renderPreviewStage() {
    if (!elements.previewStage) {
      return;
    }

    var config = buildConfigFromForm();
    var previewItem = previewHelpers.buildPreviewItem(config, state.previewIndex);

    if (!config.enabled) {
      elements.previewStage.innerHTML = '<p class="cgf-preview-empty">Preview is unavailable while Checkout Geo Flash is disabled for this store.</p>';
      setPreviewToggleLabel();
      return;
    }

    if (!state.isPreviewRunning) {
      elements.previewStage.innerHTML = '<p class="cgf-preview-empty">Start owner preview to animate a sample notification using the current dashboard settings.</p>';
      setPreviewToggleLabel();
      return;
    }

    elements.previewStage.innerHTML = [
      '<article class="cgf-preview-toast">',
      '  <p class="cgf-preview-toast__eyebrow">' + escapeHtml(previewItem.eyebrow) + '</p>',
      '  <p class="cgf-preview-toast__title">' + escapeHtml(previewItem.title) + '</p>',
      '</article>'
    ].join('');
    setPreviewToggleLabel();
  }

  function getStorefrontAssetBase() {
    if (
      window.location &&
      window.location.protocol !== 'file:' &&
      window.location.origin &&
      window.location.origin !== 'null'
    ) {
      return window.location.origin + getDeploymentBasePath();
    }

    return '__CGF_STATIC_HOST__';
  }

  function getDeploymentBasePath() {
    if (!window.location || !window.location.pathname) {
      return '';
    }

    return window.location.pathname.replace(/\/public(?:\/index\.html)?$/, '');
  }

  function updateStorefrontSnippet() {
    if (!elements.storefrontSnippet) {
      return;
    }

    var config = buildConfigFromForm();
    var assetBase = getStorefrontAssetBase();
    var appId = state.appId || 'your-ecwid-app-id';

    elements.storefrontSnippet.value = [
      '<script>',
      'window.CheckoutGeoFlashEcwid = {',
      '  appId: ' + JSON.stringify(appId) + ',',
      '  publicConfig: ' + JSON.stringify(config, null, 2),
      '};',
      '</script>',
      '<script src="' + assetBase + '/src/storefront/custom-storefront.js" defer></script>',
    ].join('\n');
  }

  function updateStoreSummary() {
    if (elements.currentStoreId) {
      elements.currentStoreId.textContent = state.storeId ? String(state.storeId) : 'Not connected';
    }

    if (elements.currentAppId) {
      elements.currentAppId.textContent = state.appId || 'checkout-geo-flash';
    }
  }

  function setPreviewStatus(message) {
    if (elements.previewStatus) {
      elements.previewStatus.textContent = message;
    }
  }

  function setPreviewToggleLabel() {
    if (elements.previewToggle) {
      elements.previewToggle.textContent = previewHelpers.getPreviewToggleLabel(state.isPreviewRunning);
    }
  }

  function setConnectionState(message, type) {
    if (!elements.connectionState) {
      return;
    }

    var className = type === 'success' ? 'a-alert--success' : type === 'warning' ? 'a-alert--warning' : 'a-alert--error';
    elements.connectionState.innerHTML = '<div class="a-alert ' + className + '">' + escapeHtml(message) + '</div>';
  }

  function showStatus(message, type) {
    var className = type === 'success' ? 'a-alert--success' : type === 'warning' ? 'a-alert--warning' : 'a-alert--error';
    elements.statusMessage.innerHTML = '<div class="a-alert ' + className + '">' + escapeHtml(message) + '</div>';
    resizeIframe();
  }

  function resizeIframe() {
    if (typeof window.EcwidApp === 'undefined' || typeof window.EcwidApp.setSize !== 'function') {
      return;
    }

    window.setTimeout(function () {
      window.EcwidApp.setSize({ height: document.body.scrollHeight + 24 });
    }, 100);
  }

  function escapeHtml(value) {
    var element = document.createElement('div');
    element.appendChild(document.createTextNode(String(value)));
    return element.innerHTML;
  }

  function updateLiveStatus() {
    var config = buildConfigFromForm();
    var modeLabels = {
      'sample-loop': 'Sample loop',
      'hybrid': 'Hybrid',
      'order-confirmation': 'Order confirmation',
    };
    var modeSummaries = {
      'sample-loop': 'Your storefront is showing <strong>sample notification toasts</strong> to all visitors, rotating through your configured messages.',
      'hybrid': 'Your storefront is showing <strong>sample notifications</strong> to all visitors, plus <strong>real order confirmations</strong> to buyers after checkout.',
      'order-confirmation': 'Your storefront is showing a <strong>confirmation toast only to the shopper</strong> who just placed an order. No sample messages are displayed.',
    };

    if (elements.liveStatusBadge) {
      if (config.enabled) {
        elements.liveStatusBadge.className = 'cgf-live-badge cgf-live-badge--active';
        elements.liveStatusBadge.innerHTML = '<span class="cgf-live-badge__dot"></span> Active';
      } else {
        elements.liveStatusBadge.className = 'cgf-live-badge cgf-live-badge--inactive';
        elements.liveStatusBadge.innerHTML = '<span class="cgf-live-badge__dot"></span> Disabled';
      }
    }

    if (elements.liveStatusSummary) {
      if (config.enabled) {
        elements.liveStatusSummary.innerHTML = modeSummaries[config.mode] || modeSummaries['sample-loop'];
      } else {
        elements.liveStatusSummary.innerHTML = 'Checkout Geo Flash is <strong>disabled</strong> for this store. Enable it in Merchant Controls to start showing notifications.';
      }
    }

    if (elements.liveDetailMode) {
      elements.liveDetailMode.textContent = modeLabels[config.mode] || 'Sample loop';
    }

    if (elements.liveDetailSamples) {
      var sampleCount = config.samples ? config.samples.length : 0;
      elements.liveDetailSamples.textContent = sampleCount + ' configured';
    }

    if (elements.liveDetailRotation) {
      elements.liveDetailRotation.textContent = 'Every ' + (config.rotateIntervalMs / 1000).toFixed(1) + 's';
    }

    if (elements.liveDetailDuration) {
      elements.liveDetailDuration.textContent = (config.visibleDurationMs / 1000).toFixed(1) + 's';
    }
  }

  function initGuideToggle() {
    if (!elements.guideToggle || !elements.guideBody) {
      return;
    }

    elements.guideToggle.addEventListener('click', function () {
      var isOpen = !elements.guideBody.hidden;
      elements.guideBody.hidden = isOpen;
      elements.guideToggle.setAttribute('aria-expanded', String(!isOpen));

      if (elements.guideToggleLabel) {
        elements.guideToggleLabel.textContent = isOpen ? 'Show' : 'Hide';
      }

      resizeIframe();
    });
  }

  function initFaqAccordion() {
    if (!elements.faqList) {
      return;
    }

    elements.faqList.addEventListener('click', function (event) {
      var button = event.target.closest('.cgf-faq__question');

      if (!button) {
        return;
      }

      var expanded = button.getAttribute('aria-expanded') === 'true';
      var answer = button.nextElementSibling;

      button.setAttribute('aria-expanded', String(!expanded));

      if (answer) {
        answer.hidden = expanded;
      }

      resizeIframe();
    });
  }
})();
