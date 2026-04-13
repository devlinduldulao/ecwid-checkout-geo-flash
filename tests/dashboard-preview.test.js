const test = require('node:test');
const assert = require('node:assert/strict');

const preview = require('../src/shared/dashboard-preview');

test('buildPreviewItem returns order confirmation text in order-confirmation mode', function () {
  const item = preview.buildPreviewItem({ mode: 'order-confirmation', samples: [] }, 0);

  assert.deepEqual(item, {
    eyebrow: 'Dashboard preview',
    title: 'Thank you for ordering Weekend Tote #1001.',
  });
});

test('buildPreviewItem uses fallback copy when no samples exist', function () {
  const item = preview.buildPreviewItem({ mode: 'sample-loop', fallbackLocationLabel: 'Nearby', samples: [] }, 1);

  assert.equal(item.eyebrow, 'Dashboard preview');
  assert.equal(item.title, 'Someone from Nearby just purchased a recent product.');
});

test('buildPreviewItem renders a sample-loop toast from fake data', function () {
  const item = preview.buildPreviewItem({
    mode: 'sample-loop',
    samples: [{ productName: 'Weekend Tote', location: 'Austin', event: 'paid' }],
  }, 0);

  assert.equal(item.title, 'Someone from Austin just paid for Weekend Tote.');
});

test('buildPreviewItem alternates hybrid mode into order-confirmation copy', function () {
  const item = preview.buildPreviewItem({
    mode: 'hybrid',
    samples: [{ productName: 'Desk Lamp', location: 'Berlin', event: 'checkout' }],
  }, 2);

  assert.equal(item.title, 'Thank you for ordering Desk Lamp #1003.');
});

test('getPreviewToggleLabel handles both happy and unhappy toggle states', function () {
  assert.equal(preview.getPreviewToggleLabel(true), 'Stop preview');
  assert.equal(preview.getPreviewToggleLabel(false), 'Start preview');
});