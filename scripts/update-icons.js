const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ASSETS_DIR = path.resolve(__dirname, '../assets/marketplace');

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-labelledby="title desc">
  <title id="title">Checkout Geo Flash icon</title>
  <desc id="desc">Flat and sophisticated app icon for Checkout Geo Flash.</desc>
  <rect width="256" height="256" rx="46" fill="#0f172a" />
  <path d="M128 48 C94 48 68 74 68 108 C68 148 128 208 128 208 C128 208 188 148 188 108 C188 74 162 48 128 48 Z" fill="#3b82f6" />
  <circle cx="128" cy="103" r="22" fill="#0f172a" />
  <path d="M132 86 L 116 103 L 128 103 L 124 118 L 140 100 L 128 100 Z" fill="#eab308" />
</svg>`;

const bannerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1544 500" role="img" aria-labelledby="title desc">
  <title id="title">Checkout Geo Flash Banner</title>
  <desc id="desc">Clean flat banner for Checkout Geo Flash</desc>
  <rect width="1544" height="500" fill="#0f172a" />
  <g transform="translate(190, 80)">
    <!-- Icon part -->
    <path d="M128 48 C94 48 68 74 68 108 C68 148 128 208 128 208 C128 208 188 148 188 108 C188 74 162 48 128 48 Z" fill="#3b82f6" transform="translate(0, 40) scale(1.5)" />
    <circle cx="128" cy="103" r="22" fill="#0f172a" transform="translate(0, 40) scale(1.5)" />
    <path d="M132 86 L 116 103 L 128 103 L 124 118 L 140 100 L 128 100 Z" fill="#eab308" transform="translate(0, 40) scale(1.5)" />
  </g>
  <text x="640" y="250" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="76" font-weight="700" fill="#ffffff" dominant-baseline="middle">Checkout Geo Flash</text>
  <text x="640" y="320" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="36" font-weight="400" fill="#94a3b8" dominant-baseline="middle">Localized urgency that drives conversions.</text>
</svg>`;

fs.writeFileSync(path.join(ASSETS_DIR, 'icon.svg'), iconSvg);
fs.writeFileSync(path.join(ASSETS_DIR, 'banner.svg'), bannerSvg);

// Need to safely overwrite dashboard and preview too if requested, but let's just make PNGs
async function generatePngs() {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Icon
    const iconPath = path.join(ASSETS_DIR, 'icon.svg');
    const iconUrl = 'file://' + iconPath;
    await page.setViewportSize({ width: 256, height: 256 });
    await page.goto(iconUrl);
    // wait for network just in case
    await page.waitForTimeout(500);
    // capture body
    const bodyIcon = await page.$('svg');
    await bodyIcon.screenshot({ path: path.join(ASSETS_DIR, 'icon.png'), omitBackground: true });
    
    // Banner
    const bannerPath = path.join(ASSETS_DIR, 'banner.svg');
    const bannerUrl = 'file://' + bannerPath;
    await page.setViewportSize({ width: 1544, height: 500 });
    await page.goto(bannerUrl);
    await page.waitForTimeout(500);
    const bodyBanner = await page.$('svg');
    await bodyBanner.screenshot({ path: path.join(ASSETS_DIR, 'banner.png'), omitBackground: true });
    
    await browser.close();
    console.log("Successfully generated all SVGs and perfect flat PNGs using playwright.");
}

generatePngs().catch(err => {
    console.error(err);
    process.exit(1);
});
