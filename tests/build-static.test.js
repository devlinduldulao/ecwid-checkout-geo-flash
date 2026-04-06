const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { buildStaticSite } = require('../scripts/build-static');

test('buildStaticSite copies entries and writes metadata files', function () {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cgf-ecwid-build-'));
  const projectRoot = path.join(tempRoot, 'project');
  const distRoot = path.join(projectRoot, 'dist-custom');

  fs.mkdirSync(path.join(projectRoot, 'public'), { recursive: true });
  fs.mkdirSync(path.join(projectRoot, 'src'), { recursive: true });
  fs.mkdirSync(path.join(projectRoot, 'assets', 'marketplace'), { recursive: true });
  fs.writeFileSync(path.join(projectRoot, 'public', 'index.html'), '<html></html>');
  fs.writeFileSync(path.join(projectRoot, 'src', 'app.js'), 'console.log("ok");');
  fs.writeFileSync(path.join(projectRoot, 'assets', 'marketplace', 'icon.png'), 'asset');

  const result = buildStaticSite({
    projectRoot,
    distRoot,
    entriesToCopy: ['public', 'src', 'assets'],
  });

  assert.equal(result.distRoot, distRoot);
  assert.equal(fs.existsSync(path.join(distRoot, 'public', 'index.html')), true);
  assert.equal(fs.existsSync(path.join(distRoot, 'src', 'app.js')), true);
  assert.equal(fs.existsSync(path.join(distRoot, 'assets', 'marketplace', 'icon.png')), true);
  assert.equal(fs.existsSync(path.join(distRoot, 'index.html')), true);
  assert.equal(fs.existsSync(path.join(distRoot, 'build-meta.json')), true);

  const rootIndex = fs.readFileSync(path.join(distRoot, 'index.html'), 'utf8');
  assert.match(rootIndex, /<html><\/html>/);
  assert.doesNotMatch(rootIndex, /url=\.\/public\//);

  const metadata = JSON.parse(fs.readFileSync(path.join(distRoot, 'build-meta.json'), 'utf8'));
  assert.deepEqual(metadata.files, ['public', 'src', 'assets']);
});

test('public html entry points use relative asset paths for GitHub Pages project deployments', function () {
  const dashboardHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
  const storefrontHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'storefront-test.html'), 'utf8');

  assert.match(dashboardHtml, /<script src="\.\.\/src\/shared\/checkout-geo-flash-shared\.js"><\/script>/);
  assert.match(dashboardHtml, /<script src="\.\.\/src\/shared\/dashboard-preview\.js"><\/script>/);
  assert.match(dashboardHtml, /<script src="\.\.\/src\/admin\/app\.js"><\/script>/);
  assert.match(storefrontHtml, /<script src="\.\.\/src\/storefront\/custom-storefront\.js"><\/script>/);
  assert.doesNotMatch(dashboardHtml, /<script src="\/src\//);
  assert.doesNotMatch(storefrontHtml, /<script src="\/src\//);
});