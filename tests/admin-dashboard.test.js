const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const shared = require('../src/shared/checkout-geo-flash-shared');
const preview = require('../src/shared/dashboard-preview');

const adminScript = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'admin', 'app.js'),
  'utf8'
);

function createMarkup() {
  return [
    '<!DOCTYPE html>',
    '<html><body data-app-id="checkout-geo-flash">',
    '<div id="connection-state"></div>',
    '<input id="app-id" />',
    '<div id="current-app-id"></div>',
    '<div id="current-store-id"></div>',
    '<input id="feature-enabled" type="checkbox" checked />',
    '<input id="fallback-location-label" />',
    '<select id="feature-mode">',
    '  <option value="sample-loop">sample-loop</option>',
    '  <option value="hybrid">hybrid</option>',
    '  <option value="order-confirmation">order-confirmation</option>',
    '</select>',
    '<div id="preview-stage"></div>',
    '<div id="preview-status"></div>',
    '<button id="preview-toggle" type="button">Start preview</button>',
    '<input id="rotate-interval-ms" value="3200" />',
    '<textarea id="sample-lines"></textarea>',
    '<button id="save-btn" type="button">Save</button>',
    '<div id="status-message"></div>',
    '<textarea id="storefront-snippet"></textarea>',
    '<input id="visible-duration-ms" value="5000" />',
    '<select id="location-mode">',
    '  <option value="city">city</option>',
    '  <option value="country">country</option>',
    '</select>',
    '<div id="guide-body"></div>',
    '<div id="guide-toggle" aria-expanded="true"><span id="guide-toggle-label">Hide</span></div>',
    '<div id="faq-list"></div>',
    '<span id="live-status-badge" class="cgf-live-badge cgf-live-badge--active"></span>',
    '<p id="live-status-summary"></p>',
    '<span id="live-detail-mode"></span>',
    '<span id="live-detail-samples"></span>',
    '<span id="live-detail-rotation"></span>',
    '<span id="live-detail-duration"></span>',
    '</body></html>'
  ].join('');
}

function flush() {
  return new Promise(function (resolve) {
    setTimeout(resolve, 0);
  });
}

function createDom(options) {
  const dom = new JSDOM(createMarkup(), {
    runScripts: 'outside-only',
    url: (options && options.url) || 'https://example.test/public/index.html?appId=checkout-geo-flash',
  });

  dom.window.CheckoutGeoFlashEcwidShared = shared;
  dom.window.CheckoutGeoFlashEcwidPreview = preview;
  dom.window.console = console;

  if (options && options.fetch) {
    dom.window.fetch = options.fetch;
  }

  if (options && Object.prototype.hasOwnProperty.call(options, 'EcwidApp')) {
    dom.window.EcwidApp = options.EcwidApp;
  }

  dom.window.eval(adminScript);
  return dom;
}

test('dashboard shows local preview warning when EcwidApp is unavailable', async function () {
  const dom = createDom({
    url: 'file:///tmp/checkout-geo-flash/public/index.html',
  });

  await flush();

  assert.match(
    dom.window.document.getElementById('connection-state').textContent,
    /Dashboard preview only/i
  );
  assert.match(
    dom.window.document.getElementById('storefront-snippet').value,
    /__CGF_STATIC_HOST__\/src\/storefront\/custom-storefront\.js/
  );

  dom.window.close();
});

test('dashboard storefront snippet keeps the repository base path on GitHub Pages', async function () {
  const dom = createDom({
    url: 'https://devlinduldulao.github.io/ecwid-checkout-geo-flash/public/index.html?appId=checkout-geo-flash',
  });

  await flush();

  assert.match(
    dom.window.document.getElementById('storefront-snippet').value,
    /https:\/\/devlinduldulao\.github\.io\/ecwid-checkout-geo-flash\/src\/storefront\/custom-storefront\.js/
  );

  dom.window.close();
});

test('owner preview toggle renders fake data in the dashboard', async function () {
  const dom = createDom();
  const document = dom.window.document;

  document.getElementById('sample-lines').value = 'Weekend Tote | Austin | paid';
  document.getElementById('preview-toggle').click();

  await flush();

  assert.equal(document.getElementById('preview-toggle').textContent, 'Stop preview');
  assert.match(document.getElementById('preview-stage').textContent, /Austin just paid for Weekend Tote/i);

  dom.window.close();
});

test('dashboard loads saved settings from Ecwid App Storage happy path', async function () {
  const fetchCalls = [];
  const dom = createDom({
    fetch: function (url, options) {
      fetchCalls.push({ url, options });
      return Promise.resolve({
        ok: true,
        status: 200,
        json: function () {
          return Promise.resolve({
            key: 'public',
            value: JSON.stringify({
              mode: 'hybrid',
              samples: [{ productName: 'Desk Lamp', location: 'Berlin', event: 'checkout' }],
            }),
          });
        },
      });
    },
    EcwidApp: {
      init: function () {
        return {
          getPayload: function (callback) {
            callback({ access_token: 'secret_token', store_id: 12345 });
          },
        };
      },
      setSize: function () {},
    },
  });

  await flush();
  await flush();

  const document = dom.window.document;
  assert.match(document.getElementById('connection-state').textContent, /Connected to store 12345/i);
  assert.equal(document.getElementById('current-store-id').textContent, '12345');
  assert.equal(document.getElementById('feature-mode').value, 'hybrid');
  assert.match(document.getElementById('status-message').textContent, /Loaded saved merchant settings/i);
  assert.equal(fetchCalls.length, 1);
  assert.match(String(fetchCalls[0].url), /\/storage\/public$/);

  dom.window.close();
});

test('dashboard save uses PUT and shows success on happy path', async function () {
  const fetchCalls = [];
  let requestCount = 0;
  const dom = createDom({
    fetch: function (url, options) {
      requestCount += 1;
      fetchCalls.push({ url, options });

      if (requestCount === 1) {
        return Promise.resolve({
          ok: false,
          status: 404,
        });
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: function () {
          return Promise.resolve({ success: true });
        },
      });
    },
    EcwidApp: {
      init: function () {
        return {
          getPayload: function (callback) {
            callback({ access_token: 'secret_token', store_id: 555 });
          },
        };
      },
      setSize: function () {},
    },
  });

  await flush();
  await flush();

  const document = dom.window.document;
  document.getElementById('sample-lines').value = 'Weekend Tote | Austin | paid';
  document.getElementById('save-btn').click();

  await flush();
  await flush();

  assert.equal(fetchCalls.length, 2);
  assert.equal(fetchCalls[1].options.method, 'PUT');
  assert.match(document.getElementById('status-message').textContent, /Saved merchant settings/i);

  const body = JSON.parse(fetchCalls[1].options.body);
  const parsedConfig = JSON.parse(body.value);
  assert.equal(parsedConfig.samples[0].productName, 'Weekend Tote');

  dom.window.close();
});

test('dashboard save shows an unhappy-path error when PUT fails', async function () {
  let requestCount = 0;
  const dom = createDom({
    fetch: function () {
      requestCount += 1;

      if (requestCount === 1) {
        return Promise.resolve({ ok: false, status: 404 });
      }

      return Promise.resolve({ ok: false, status: 500 });
    },
    EcwidApp: {
      init: function () {
        return {
          getPayload: function (callback) {
            callback({ access_token: 'secret_token', store_id: 999 });
          },
        };
      },
      setSize: function () {},
    },
  });

  await flush();
  await flush();

  dom.window.document.getElementById('save-btn').click();

  await flush();
  await flush();

  assert.match(
    dom.window.document.getElementById('status-message').textContent,
    /Unable to save/i
  );

  dom.window.close();
});

test('live status panel shows active state and configuration summary', async function () {
  const dom = createDom();
  const document = dom.window.document;

  await flush();

  assert.match(document.getElementById('live-status-badge').textContent, /Active/i);
  assert.match(document.getElementById('live-status-summary').textContent, /sample notification toasts/i);
  assert.equal(document.getElementById('live-detail-mode').textContent, 'Sample loop');
  assert.match(document.getElementById('live-detail-samples').textContent, /configured/);
  assert.match(document.getElementById('live-detail-rotation').textContent, /3\.2s/);
  assert.match(document.getElementById('live-detail-duration').textContent, /5\.0s/);

  dom.window.close();
});

test('live status panel shows disabled state when feature is off', async function () {
  const dom = createDom();
  const document = dom.window.document;

  document.getElementById('feature-enabled').checked = false;
  document.getElementById('feature-enabled').dispatchEvent(new dom.window.Event('change'));

  await flush();

  assert.match(document.getElementById('live-status-badge').textContent, /Disabled/i);
  assert.match(document.getElementById('live-status-summary').textContent, /disabled/i);

  dom.window.close();
});

test('guide toggle collapses and expands the quick start guide', async function () {
  const dom = createDom();
  const document = dom.window.document;

  await flush();

  const guideBody = document.getElementById('guide-body');
  const guideToggle = document.getElementById('guide-toggle');

  assert.equal(guideBody.hidden, false);

  guideToggle.click();
  assert.equal(guideBody.hidden, true);
  assert.equal(document.getElementById('guide-toggle-label').textContent, 'Show');

  guideToggle.click();
  assert.equal(guideBody.hidden, false);
  assert.equal(document.getElementById('guide-toggle-label').textContent, 'Hide');

  dom.window.close();
});

test('faq accordion toggles answer visibility', async function () {
  const dom = createDom();
  const document = dom.window.document;

  const faqList = document.getElementById('faq-list');
  faqList.innerHTML = [
    '<div class="cgf-faq__item">',
    '  <button class="cgf-faq__question" type="button" aria-expanded="false" data-faq="0">Question?</button>',
    '  <p class="cgf-faq__answer" hidden>Answer.</p>',
    '</div>',
  ].join('');

  await flush();

  const button = faqList.querySelector('.cgf-faq__question');
  const answer = faqList.querySelector('.cgf-faq__answer');

  assert.equal(answer.hidden, true);

  button.click();
  assert.equal(button.getAttribute('aria-expanded'), 'true');
  assert.equal(answer.hidden, false);

  button.click();
  assert.equal(button.getAttribute('aria-expanded'), 'false');
  assert.equal(answer.hidden, true);

  dom.window.close();
});