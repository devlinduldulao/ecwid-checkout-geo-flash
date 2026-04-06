(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }

  root.CheckoutGeoFlashEcwidShared = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var DEFAULT_MODE = 'sample-loop';
  var DEFAULT_LOCATION_MODE = 'city';
  var DEFAULT_PUBLIC_CONFIG = {
    enabled: true,
    mode: DEFAULT_MODE,
    locationMode: DEFAULT_LOCATION_MODE,
    fallbackLocationLabel: 'Nearby',
    rotateIntervalMs: 3200,
    visibleDurationMs: 5000,
    samples: [
      { productName: 'Weekend Tote', location: 'Austin', event: 'paid' },
      { productName: 'Desk Lamp', location: 'Berlin', event: 'checkout' },
      { productName: 'Trail Bottle', location: 'Manila', event: 'paid' },
    ],
  };

  function isPlainObject(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
  }

  function clampInteger(value, fallback, min, max) {
    var parsed = Number.parseInt(value, 10);

    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    return Math.min(Math.max(parsed, min), max);
  }

  function normalizeBoolean(value, fallback) {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      if (value === 'true') {
        return true;
      }

      if (value === 'false') {
        return false;
      }
    }

    return fallback;
  }

  function normalizeText(value, fallback) {
    if (typeof value !== 'string') {
      return fallback;
    }

    var trimmed = value.trim();
    return trimmed === '' ? fallback : trimmed;
  }

  function normalizeEvent(value) {
    return String(value).trim() === 'paid' ? 'paid' : 'checkout';
  }

  function normalizeMode(value) {
    return value === 'hybrid' || value === 'order-confirmation' ? value : DEFAULT_MODE;
  }

  function normalizeLocationMode(value) {
    return value === 'country' ? 'country' : DEFAULT_LOCATION_MODE;
  }

  function getDefaultLocationLabel(locationMode) {
    return locationMode === 'country' ? 'Unknown country' : 'Nearby';
  }

  function normalizeSample(sample, locationMode) {
    var source = isPlainObject(sample) ? sample : {};

    return {
      productName: normalizeText(source.productName, 'Recent order'),
      location: normalizeText(source.location, getDefaultLocationLabel(locationMode)),
      event: normalizeEvent(source.event),
    };
  }

  function normalizeSamples(samples, locationMode) {
    if (!Array.isArray(samples)) {
      return DEFAULT_PUBLIC_CONFIG.samples.map(function (sample) {
        return normalizeSample(sample, locationMode);
      });
    }

    var normalized = samples
      .filter(function (sample) {
        return isPlainObject(sample) || typeof sample === 'string';
      })
      .map(function (sample) {
        if (typeof sample === 'string') {
          return parseSampleLine(sample, locationMode);
        }

        return normalizeSample(sample, locationMode);
      })
      .slice(0, 12);

    if (normalized.length === 0) {
      return DEFAULT_PUBLIC_CONFIG.samples.map(function (sample) {
        return normalizeSample(sample, locationMode);
      });
    }

    return normalized;
  }

  function parseSampleLine(line, locationMode) {
    var parts = String(line || '')
      .split('|')
      .map(function (part) {
        return part.trim();
      });

    return normalizeSample(
      {
        productName: parts[0],
        location: parts[1],
        event: parts[2],
      },
      locationMode
    );
  }

  function sampleLinesToArray(lines, locationMode) {
    return String(lines || '')
      .split(/\r?\n/)
      .map(function (line) {
        return line.trim();
      })
      .filter(Boolean)
      .map(function (line) {
        return parseSampleLine(line, locationMode);
      });
  }

  function samplesToLines(samples) {
    return normalizeSamples(samples, DEFAULT_LOCATION_MODE)
      .map(function (sample) {
        return [sample.productName, sample.location, sample.event].join(' | ');
      })
      .join('\n');
  }

  function normalizePublicConfig(config) {
    var source = isPlainObject(config) ? config : {};
    var locationMode = normalizeLocationMode(source.locationMode);

    return {
      enabled: normalizeBoolean(source.enabled, DEFAULT_PUBLIC_CONFIG.enabled),
      mode: normalizeMode(source.mode),
      locationMode: locationMode,
      fallbackLocationLabel: normalizeText(
        source.fallbackLocationLabel,
        DEFAULT_PUBLIC_CONFIG.fallbackLocationLabel
      ),
      rotateIntervalMs: clampInteger(
        source.rotateIntervalMs,
        DEFAULT_PUBLIC_CONFIG.rotateIntervalMs,
        2000,
        15000
      ),
      visibleDurationMs: clampInteger(
        source.visibleDurationMs,
        DEFAULT_PUBLIC_CONFIG.visibleDurationMs,
        2500,
        12000
      ),
      samples: normalizeSamples(source.samples, locationMode),
    };
  }

  function tryParseJson(value) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  function parsePublicConfigRecord(record) {
    var candidate = record;

    if (Array.isArray(candidate)) {
      candidate = candidate.find(function (entry) {
        return isPlainObject(entry) && entry.key === 'public';
      }) || candidate[0] || null;
    }

    if (isPlainObject(candidate) && Object.prototype.hasOwnProperty.call(candidate, 'value')) {
      candidate = candidate.value;
    }

    if (typeof candidate === 'string') {
      var parsed = tryParseJson(candidate);
      return normalizePublicConfig(parsed || {});
    }

    if (isPlainObject(candidate)) {
      return normalizePublicConfig(candidate);
    }

    return normalizePublicConfig({});
  }

  function serializePublicConfig(config) {
    return JSON.stringify(normalizePublicConfig(config));
  }

  function buildStorageUrl(storeId, key) {
    return 'https://app.ecwid.com/api/v3/' + encodeURIComponent(String(storeId)) + '/storage/' + encodeURIComponent(String(key));
  }

  return {
    DEFAULT_PUBLIC_CONFIG: DEFAULT_PUBLIC_CONFIG,
    buildStorageUrl: buildStorageUrl,
    normalizePublicConfig: normalizePublicConfig,
    parsePublicConfigRecord: parsePublicConfigRecord,
    parseSampleLine: parseSampleLine,
    sampleLinesToArray: sampleLinesToArray,
    samplesToLines: samplesToLines,
    serializePublicConfig: serializePublicConfig,
  };
});