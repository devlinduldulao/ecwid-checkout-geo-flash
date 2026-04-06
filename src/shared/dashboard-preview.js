(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }

  root.CheckoutGeoFlashEcwidPreview = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function buildPreviewItem(config, previewIndex) {
    var safeConfig = config && typeof config === 'object' ? config : {};
    var mode = safeConfig.mode || 'sample-loop';
    var samples = Array.isArray(safeConfig.samples) ? safeConfig.samples : [];
    var fallbackLocationLabel = safeConfig.fallbackLocationLabel || 'Nearby';
    var sample = samples.length > 0 ? samples[Math.abs(previewIndex || 0) % samples.length] : null;
    var eventLabel;

    if (mode === 'order-confirmation') {
      return {
        eyebrow: 'Owner preview',
        title: 'Thank you for ordering Weekend Tote #1001.',
      };
    }

    if (!sample) {
      return {
        eyebrow: 'Owner preview',
        title: 'Someone from ' + fallbackLocationLabel + ' just purchased a recent product.',
      };
    }

    eventLabel = sample.event === 'paid' ? 'just paid for' : 'just purchased';

    if (mode === 'hybrid' && Math.abs(previewIndex || 0) % 3 === 2) {
      return {
        eyebrow: 'Owner preview',
        title: 'Thank you for ordering ' + sample.productName + ' #100' + ((Math.abs(previewIndex || 0) % 9) + 1) + '.',
      };
    }

    return {
      eyebrow: 'Owner preview',
      title: 'Someone from ' + sample.location + ' ' + eventLabel + ' ' + sample.productName + '.',
    };
  }

  function getPreviewToggleLabel(isPreviewRunning) {
    return isPreviewRunning ? 'Stop owner preview' : 'Start owner preview';
  }

  return {
    buildPreviewItem: buildPreviewItem,
    getPreviewToggleLabel: getPreviewToggleLabel,
  };
});