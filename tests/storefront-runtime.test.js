const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const storefrontScript = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'storefront', 'custom-storefront.js'),
  'utf8'
);

function createStorefrontDom(options) {
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
    runScripts: 'outside-only',
    url: 'https://example.test/storefront',
  });

  const window = dom.window;
  const state = {
    apiLoadedHandler: null,
    intervalCallback: null,
    orderPlacedHandler: null,
    publicConfigCalls: [],
  };

  window.requestAnimationFrame = function (callback) {
    callback();
    return 1;
  };

  window.setInterval = function (callback) {
    state.intervalCallback = callback;
    return 1;
  };

  window.clearInterval = function () {};

  window.Ecwid = Object.assign(
    {
      OnAPILoaded: {
        add: function (callback) {
          state.apiLoadedHandler = callback;
        },
      },
      OnOrderPlaced: {
        add: function (callback) {
          state.orderPlacedHandler = callback;
        },
      },
      getAppPublicConfig: function (appId) {
        state.publicConfigCalls.push(appId);
        return options && Object.prototype.hasOwnProperty.call(options, 'publicConfigRecord')
          ? options.publicConfigRecord
          : null;
      },
    },
    options && options.Ecwid ? options.Ecwid : {}
  );

  if (options && options.instantsite) {
    window.instantsite = options.instantsite;
  }

  if (options && options.globalConfig) {
    window.CheckoutGeoFlashEcwid = options.globalConfig;
  }

  window.eval(storefrontScript);

  return {
    dom,
    state,
    window,
  };
}

function getToastTexts(document) {
  return Array.from(document.querySelectorAll('.cgf-ecwid-toast__title')).map(function (element) {
    return element.textContent;
  });
}

test('storefront reads Ecwid public config and starts the sample loop for shoppers', function () {
  const instance = createStorefrontDom({
    globalConfig: { appId: 'checkout-geo-flash' },
    publicConfigRecord: {
      key: 'public',
      value: JSON.stringify({
        mode: 'sample-loop',
        samples: [{ productName: 'Weekend Tote', location: 'Austin', event: 'paid' }],
      }),
    },
  });

  instance.state.apiLoadedHandler();

  assert.deepEqual(instance.state.publicConfigCalls, ['checkout-geo-flash']);
  assert.match(getToastTexts(instance.window.document)[0], /Austin just paid for Weekend Tote/i);
  assert.equal(Boolean(instance.window.document.getElementById('cgf-ecwid-style')), true);
  assert.equal(typeof instance.state.orderPlacedHandler, 'function');

  instance.dom.window.close();
});

test('storefront supports Instant Site public config reads when Ecwid.getAppPublicConfig is unavailable', function () {
  const instantSiteCalls = [];
  const instance = createStorefrontDom({
    globalConfig: { appId: 'checkout-geo-flash' },
    Ecwid: {
      getAppPublicConfig: undefined,
    },
    instantsite: {
      getAppPublicConfig: function (appId) {
        instantSiteCalls.push(appId);
        return {
          key: 'public',
          value: JSON.stringify({
            mode: 'sample-loop',
            samples: [{ productName: 'Trail Bottle', location: 'Osaka', event: 'paid' }],
          }),
        };
      },
    },
  });

  instance.state.apiLoadedHandler();

  assert.deepEqual(instantSiteCalls, ['checkout-geo-flash']);
  assert.match(getToastTexts(instance.window.document)[0], /Osaka just paid for Trail Bottle/i);

  instance.dom.window.close();
});

test('storefront shows a real order confirmation toast from Ecwid OnOrderPlaced data', function () {
  const instance = createStorefrontDom({
    globalConfig: { appId: 'checkout-geo-flash' },
    publicConfigRecord: {
      key: 'public',
      value: JSON.stringify({
        mode: 'order-confirmation',
      }),
    },
  });

  instance.state.apiLoadedHandler();
  assert.equal(getToastTexts(instance.window.document).length, 0);

  instance.state.orderPlacedHandler({
    orderNumber: '1007',
    items: [{ name: 'Desk Lamp' }],
  });

  assert.match(getToastTexts(instance.window.document)[0], /Thanks for ordering Desk Lamp #1007/i);

  instance.dom.window.close();
});

test('storefront sample-loop mode ignores real order events from Ecwid shoppers', function () {
  const instance = createStorefrontDom({
    globalConfig: { appId: 'checkout-geo-flash' },
    publicConfigRecord: {
      key: 'public',
      value: JSON.stringify({
        mode: 'sample-loop',
        samples: [{ productName: 'Weekend Tote', location: 'Austin', event: 'paid' }],
      }),
    },
  });

  instance.state.apiLoadedHandler();
  instance.state.orderPlacedHandler({
    orderNumber: '9999',
    items: [{ name: 'Should Not Render' }],
  });

  assert.equal(getToastTexts(instance.window.document).length, 1);
  assert.match(getToastTexts(instance.window.document)[0], /Austin just paid for Weekend Tote/i);

  instance.dom.window.close();
});

test('storefront hybrid mode handles both sample notifications and real order events', function () {
  const instance = createStorefrontDom({
    globalConfig: { appId: 'checkout-geo-flash' },
    publicConfigRecord: {
      key: 'public',
      value: JSON.stringify({
        mode: 'hybrid',
        samples: [{ productName: 'Weekend Tote', location: 'Austin', event: 'paid' }],
      }),
    },
  });

  instance.state.apiLoadedHandler();
  assert.match(getToastTexts(instance.window.document)[0], /Austin just paid for Weekend Tote/i);

  instance.state.orderPlacedHandler({
    id: 'ecwid-42',
    items: [{ name: 'Trail Bottle' }],
  });

  assert.equal(getToastTexts(instance.window.document).length >= 2, true);
  assert.match(getToastTexts(instance.window.document)[0], /Thanks for ordering Trail Bottle #ecwid-42/i);

  instance.dom.window.close();
});

test('storefront stays disabled when the Ecwid public config disables the feature', function () {
  const instance = createStorefrontDom({
    globalConfig: { appId: 'checkout-geo-flash' },
    publicConfigRecord: {
      key: 'public',
      value: JSON.stringify({
        enabled: false,
        mode: 'hybrid',
      }),
    },
  });

  instance.state.apiLoadedHandler();

  assert.equal(instance.window.document.querySelector('.cgf-ecwid-toast'), null);
  assert.equal(instance.window.document.getElementById('cgf-ecwid-style'), null);
  assert.equal(instance.state.orderPlacedHandler, null);

  instance.dom.window.close();
});

test('storefront falls back safely when Ecwid public config is malformed', function () {
  const instance = createStorefrontDom({
    globalConfig: { appId: 'checkout-geo-flash' },
    publicConfigRecord: {
      key: 'public',
      value: '{bad json',
    },
  });

  instance.state.apiLoadedHandler();

  assert.match(getToastTexts(instance.window.document)[0], /Someone from Austin just paid for Weekend Tote/i);
  assert.equal(typeof instance.state.intervalCallback, 'function');

  instance.dom.window.close();
});

test('storefront uses fallback order copy when shopper order payload is missing item details', function () {
  const instance = createStorefrontDom({
    globalConfig: { appId: 'checkout-geo-flash' },
    publicConfigRecord: {
      key: 'public',
      value: JSON.stringify({
        mode: 'order-confirmation',
      }),
    },
  });

  instance.state.apiLoadedHandler();
  instance.state.orderPlacedHandler({});

  assert.match(getToastTexts(instance.window.document)[0], /Thanks for ordering your recent order/i);

  instance.dom.window.close();
});

test('storefront boots immediately when Ecwid OnAPILoaded is unavailable', function () {
  const instance = createStorefrontDom({
    globalConfig: {
      publicConfig: {
        mode: 'sample-loop',
        samples: [{ productName: 'Weekend Tote', location: 'Austin', event: 'paid' }],
      },
    },
    Ecwid: {
      OnAPILoaded: undefined,
    },
  });

  assert.match(getToastTexts(instance.window.document)[0], /Austin just paid for Weekend Tote/i);

  instance.dom.window.close();
});
