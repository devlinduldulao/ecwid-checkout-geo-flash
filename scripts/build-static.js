#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

function removeDirectory(targetPath) {
  fs.rmSync(targetPath, { force: true, recursive: true });
}

function ensureDirectory(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

function copyEntry(projectRoot, distRoot, relativePath) {
  const sourcePath = path.join(projectRoot, relativePath);
  const destinationPath = path.join(distRoot, relativePath);

  fs.cpSync(sourcePath, destinationPath, { recursive: true });
}

function writeRootIndex(distRoot) {
  const content = [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="UTF-8">',
    '  <meta http-equiv="refresh" content="0; url=./public/">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '  <title>Checkout Geo Flash for Ecwid</title>',
    '</head>',
    '<body>',
    '  <p>Redirecting to <a href="./public/">the merchant dashboard</a>…</p>',
    '</body>',
    '</html>',
    '',
  ].join('\n');

  fs.writeFileSync(path.join(distRoot, 'index.html'), content, 'utf8');
}

function writeBuildMetadata(distRoot, entriesToCopy) {
  const metadata = {
    builtAt: new Date().toISOString(),
    files: entriesToCopy,
    output: 'dist',
  };

  fs.writeFileSync(path.join(distRoot, 'build-meta.json'), JSON.stringify(metadata, null, 2) + '\n', 'utf8');
}

function buildStaticSite(options) {
  const projectRoot = options && options.projectRoot ? options.projectRoot : path.resolve(__dirname, '..');
  const distRoot = options && options.distRoot ? options.distRoot : path.join(projectRoot, 'dist');
  const entriesToCopy = options && Array.isArray(options.entriesToCopy) ? options.entriesToCopy : ['public', 'src', 'assets', '_headers'];

  removeDirectory(distRoot);
  ensureDirectory(distRoot);
  entriesToCopy.forEach(function (relativePath) {
    copyEntry(projectRoot, distRoot, relativePath);
  });
  writeRootIndex(distRoot);
  writeBuildMetadata(distRoot, entriesToCopy);

  return {
    distRoot: distRoot,
    entriesToCopy: entriesToCopy,
    projectRoot: projectRoot,
  };
}

function main() {
  buildStaticSite();
  process.stdout.write('Built static output in dist/\n');
}

if (require.main === module) {
  main();
}

module.exports = {
  buildStaticSite: buildStaticSite,
};