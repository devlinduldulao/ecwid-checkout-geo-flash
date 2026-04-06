const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.join(__dirname, '..');
const profilePath = path.join(projectRoot, 'config', 'publishing-profile.json');

test('publishing profile points at real local assets and public pages', function () {
  const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));

  assert.equal(profile.hostBaseUrl, 'https://devlinduldulao.github.io/ecwid-checkout-geo-flash');
  assert.match(profile.supportUrl, /^\/public\/.+\.html$/);
  assert.match(profile.privacyPolicyUrl, /^\/public\/.+\.html$/);
  assert.match(profile.termsOfServiceUrl, /^\/public\/.+\.html$/);
  assert.match(profile.demoUrl, /^\/public\/.+\.html$/);

  [
    profile.supportUrl,
    profile.privacyPolicyUrl,
    profile.termsOfServiceUrl,
    profile.demoUrl,
    ...profile.screenshots,
    profile.assets.iconSource,
    profile.assets.iconPng,
    profile.assets.listingBannerSource,
    profile.assets.listingBannerPng,
  ].forEach(function (relativePath) {
    const normalizedPath = relativePath.replace(/^\//, '');
    assert.equal(fs.existsSync(path.join(projectRoot, normalizedPath)), true, normalizedPath + ' should exist');
  });

  assert.equal(profile.technicalNotes.backendRequired, false);
  assert.equal(profile.technicalNotes.databaseRequired, false);
  assert.equal(profile.technicalNotes.redisRequired, false);
});