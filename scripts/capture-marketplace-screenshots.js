#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const args = process.argv.slice(2);
  const baseUrlIndex = args.indexOf('--base-url');
  const baseUrl = baseUrlIndex >= 0 && args[baseUrlIndex + 1] ? args[baseUrlIndex + 1] : 'http://127.0.0.1:5010';
  const outputDir = path.resolve(__dirname, '..', 'assets', 'marketplace');
  const { chromium } = require('playwright');

  fs.mkdirSync(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: {
      width: 1440,
      height: 1400,
    },
    deviceScaleFactor: 1,
  });

  await page.goto(baseUrl + '/public/index?appId=checkout-geo-flash', {
    waitUntil: 'networkidle',
  });

  await page.screenshot({
    fullPage: true,
    path: path.join(outputDir, 'screenshot-dashboard.png'),
  });

  await page.locator('#sample-lines').fill([
    'Weekend Tote | Austin | paid',
    'Desk Lamp | Berlin | checkout',
    'Trail Bottle | Osaka | paid',
  ].join('\n'));
  await page.locator('#preview-toggle').click();
  await page.waitForTimeout(500);

  await page.screenshot({
    fullPage: true,
    path: path.join(outputDir, 'screenshot-preview.png'),
  });

  await browser.close();
  process.stdout.write('Captured marketplace screenshots in assets/marketplace/\n');
}

main().catch(function (error) {
  process.stderr.write(String(error && error.stack ? error.stack : error) + '\n');
  process.exitCode = 1;
});