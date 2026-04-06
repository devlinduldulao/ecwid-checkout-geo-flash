const test = require('node:test');
const assert = require('node:assert/strict');

const shared = require('../src/shared/checkout-geo-flash-shared');

test('normalizePublicConfig clamps values and preserves supported modes', function () {
  const config = shared.normalizePublicConfig({
    enabled: 'false',
    mode: 'hybrid',
    locationMode: 'country',
    rotateIntervalMs: 999999,
    visibleDurationMs: 100,
    samples: [{ productName: 'Trail Bottle', location: '', event: 'unknown' }],
  });

  assert.equal(config.enabled, false);
  assert.equal(config.mode, 'hybrid');
  assert.equal(config.locationMode, 'country');
  assert.equal(config.rotateIntervalMs, 15000);
  assert.equal(config.visibleDurationMs, 2500);
  assert.deepEqual(config.samples, [
    {
      productName: 'Trail Bottle',
      location: 'Unknown country',
      event: 'checkout',
    },
  ]);
});

test('sampleLinesToArray parses pipe-delimited text safely', function () {
  const samples = shared.sampleLinesToArray('Desk Lamp | Berlin | paid\n Tote |  | checkout', 'city');

  assert.deepEqual(samples, [
    { productName: 'Desk Lamp', location: 'Berlin', event: 'paid' },
    { productName: 'Tote', location: 'Nearby', event: 'checkout' },
  ]);
});

test('parsePublicConfigRecord accepts Ecwid public storage payloads', function () {
  const config = shared.parsePublicConfigRecord({
    key: 'public',
    value: JSON.stringify({
      enabled: true,
      mode: 'order-confirmation',
      samples: [{ productName: 'Bag', location: 'Madrid', event: 'paid' }],
    }),
  });

  assert.equal(config.mode, 'order-confirmation');
  assert.deepEqual(config.samples, [
    { productName: 'Bag', location: 'Madrid', event: 'paid' },
  ]);
});

test('buildStorageUrl targets the Ecwid App Storage endpoint', function () {
  assert.equal(
    shared.buildStorageUrl(123456, 'public'),
    'https://app.ecwid.com/api/v3/123456/storage/public'
  );
});

test('normalizePublicConfig falls back to defaults for invalid inputs', function () {
  const config = shared.normalizePublicConfig(null);

  assert.equal(config.enabled, true);
  assert.equal(config.mode, 'sample-loop');
  assert.equal(config.locationMode, 'city');
  assert.equal(config.rotateIntervalMs, 3200);
  assert.equal(config.visibleDurationMs, 5000);
  assert.equal(config.samples.length, 3);
});

test('normalizePublicConfig trims oversized sample arrays and string inputs', function () {
  const config = shared.normalizePublicConfig({
    samples: [
      'One | Austin | paid',
      'Two | Berlin | checkout',
      'Three | Manila | paid',
      'Four | Paris | paid',
      'Five | Rome | paid',
      'Six | Osaka | paid',
      'Seven | Seoul | paid',
      'Eight | Cebu | paid',
      'Nine | Davao | paid',
      'Ten | Dubai | paid',
      'Eleven | Madrid | paid',
      'Twelve | Tokyo | paid',
      'Thirteen | Lisbon | paid'
    ],
  });

  assert.equal(config.samples.length, 12);
  assert.deepEqual(config.samples[0], { productName: 'One', location: 'Austin', event: 'paid' });
  assert.deepEqual(config.samples[11], { productName: 'Twelve', location: 'Tokyo', event: 'paid' });
});

test('parsePublicConfigRecord prefers the public key in an array payload', function () {
  const config = shared.parsePublicConfigRecord([
    { key: 'private', value: '{"enabled":false}' },
    { key: 'public', value: '{"enabled":true,"mode":"hybrid"}' },
  ]);

  assert.equal(config.enabled, true);
  assert.equal(config.mode, 'hybrid');
});

test('parsePublicConfigRecord falls back safely on malformed JSON', function () {
  const config = shared.parsePublicConfigRecord({ key: 'public', value: '{bad json' });

  assert.equal(config.mode, 'sample-loop');
  assert.equal(config.enabled, true);
  assert.equal(config.samples.length, 3);
});

test('samplesToLines round-trips normalized sample data', function () {
  const samples = [
    { productName: 'Weekend Tote', location: 'Austin', event: 'paid' },
    { productName: 'Desk Lamp', location: 'Berlin', event: 'checkout' },
  ];

  assert.equal(
    shared.samplesToLines(samples),
    'Weekend Tote | Austin | paid\nDesk Lamp | Berlin | checkout'
  );
});

test('serializePublicConfig returns normalized JSON for publishing to App Storage', function () {
  const json = shared.serializePublicConfig({
    enabled: 'false',
    mode: 'not-real',
    samples: [],
  });
  const config = JSON.parse(json);

  assert.equal(config.enabled, false);
  assert.equal(config.mode, 'sample-loop');
  assert.equal(config.samples.length, 3);
});