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

  const metadata = JSON.parse(fs.readFileSync(path.join(distRoot, 'build-meta.json'), 'utf8'));
  assert.deepEqual(metadata.files, ['public', 'src', 'assets']);
});