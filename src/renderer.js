/**
 * 🖥️ Renderer (Node.js Puppeteer)
 * Capture SVG as fullpage and convert to image
 * 
 * ┌─────────────────────────────────────┐
 * │ Safari User (Browser)               │
 * │  ↓ toPng(element)                   │
 * │  ↓ [Generate SVG]                   │
 * │  ↓ [Request fallback server]        │
 * └─────────────┬───────────────────────┘
 *               ↓
 * ┌─────────────────────────────────────┐
 * │ Fallback Server (Node.js)           │
 * │  ↓ POST /render                     │
 * │  ↓ [Call this file's renderer]      │
 * │  ↓ [Render with Puppeteer]         │
 * │  ← [Return image]                  │
 * └─────────────────────────────────────┘
 *
 * @module renderer
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Extract width/height from SVG string
 *
 * @param {string} svgString - SVG string
 * @returns {{width: number, height: number}} SVG dimensions
 * @private
 */
function extractSvgDimensions(svgString) {
  const widthMatch = svgString.match(/width="?(\d+(?:\.\d+)?)"?/);
  const heightMatch = svgString.match(/height="?(\d+(?:\.\d+)?)"?/);

  return {
    width: widthMatch ? parseFloat(widthMatch[1]) : 300,
    height: heightMatch ? parseFloat(heightMatch[1]) : 150,
  };
}

/**
 * Dynamically load Puppeteer
 *
 * @returns {Promise<any>} Puppeteer module
 * @private
 */
async function initPuppeteer() {
  try {
    return require('puppeteer');
  } catch (error) {
    throw new Error(
      'Puppeteer is not installed.\n' +
      'Run: npm install puppeteer'
    );
  }
}

/**
 * Render SVG string as Puppeteer fullpage screenshot
 *
 * ✨ Core Logic:
 * 1️⃣ Convert SVG to centered HTML
 * 2️⃣ Load on Puppeteer page
 * 3️⃣ Calculate actual SVG dimensions
 * 4️⃣ Adjust viewport to that size
 * 5️⃣ Take fullpage screenshot (fullPage: true)
 *
 * @async
 * @param {string} svgString - SVG string (width/height attributes required)
 * @param {{
 *   outputType?: 'png'|'jpeg'|'webp',
 *   outputPath?: string,
 *   quality?: number,
 *   deviceScaleFactor?: number,
 *   timeout?: number
 * }} options - Rendering options
 *
 * @returns {Promise<{
 *   buffer: Buffer,
 *   width: number,
 *   height: number,
 *   format: string,
 *   path?: string
 * }>} Rendering result
 *
 * @example
 * const result = await renderSvgFullPage(svgString, {
 *   outputType: 'png',
 *   outputPath: './output.png',
 *   deviceScaleFactor: 2
 * });
 *
 * @throws {Error} SVG dimension detection failure or rendering error
 */
async function renderSvgFullPage(svgString, options = {}) {
  const puppeteer = await initPuppeteer();

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Extract SVG dimensions (for reference)
    // eslint-disable-next-line no-unused-vars
    const { width: svgWidth, height: svgHeight } = extractSvgDimensions(svgString);

    // 🔍 Debug: Ensure temp directory exists
    const projectRoot = path.resolve(__dirname, '..');
    const tempDir = path.join(projectRoot, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // 🔍 Debug: Log SVG size
    const svgSize = Buffer.byteLength(svgString, 'utf8');
    console.log(`📥 SVG received: ${(svgSize / 1024).toFixed(2)} KB`);

    // ✅ Create HTML with centered SVG layout
    const htmlStyle = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
html, body {
  width: 100%;
  height: 100%;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
svg {
  display: block;
  max-width: 100vw;
  max-height: 100vh;
}
</style>
</head>
<body>`;

    const html = htmlStyle + svgString + `</body>
</html>`;

    // 🔍 Debug: Save HTML to temp (UTF-8 encoding)
    const htmlPath = path.join(tempDir, `html-${timestamp}.html`);
    await fs.promises.writeFile(htmlPath, html, 'utf8');
    const htmlSize = Buffer.byteLength(html, 'utf8');
    console.log(`📄 HTML saved: ${htmlPath} (${(htmlSize / 1024).toFixed(2)} KB)`);

    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: options.timeout || 30000,
    });

    // ✅ Calculate actual SVG dimensions
    const boundingBox = await page.evaluate(() => {
      const svg = document.querySelector('svg');
      if (!svg) throw new Error('SVG element not found');

      const rect = svg.getBoundingClientRect();
      return {
        width: Math.max(rect.width, 1),
        height: Math.max(rect.height, 1),
      };
    });

    // ✅ Adjust viewport to SVG dimensions
    const finalWidth = Math.ceil(boundingBox.width);
    const finalHeight = Math.ceil(boundingBox.height);

    await page.setViewport({
      width: finalWidth,
      height: finalHeight,
      deviceScaleFactor: options.deviceScaleFactor || 2,
    });

    // ✅ Take fullpage screenshot (fullPage: true is essential!)
    const outputType = options.outputType || 'png';
    const screenshotOptions = {
      type: outputType,
      fullPage: true,
      omitBackground: true,
    };

    if (outputType === 'jpeg') {
      screenshotOptions.quality = Math.round((options.quality || 1) * 100);
    }

    const buffer = await page.screenshot(screenshotOptions);

    // ✅ Save to file if needed
    let savedPath = null;
    if (options.outputPath) {
      await fs.promises.writeFile(options.outputPath, buffer);
      savedPath = options.outputPath;
    }

    // 🔍 Debug: Save PNG to temp directory
    const debugPath = path.join(tempDir, `png-${timestamp}.${outputType}`);
    await fs.promises.writeFile(debugPath, buffer);
    console.log(`📸 PNG saved: ${debugPath} (${buffer.length} bytes)`);

    return {
      buffer,
      width: finalWidth,
      height: finalHeight,
      format: outputType,
      path: savedPath,
      debugPath: debugPath,
    };
  } finally {
    await browser.close();
  }
}

/**
 * Convert SVG string to PNG (convenience function)
 *
 * @async
 * @param {string} svgString - SVG string
 * @param {object} options - Options
 * @returns {Promise<Buffer>} PNG buffer
 */
async function svgToPng(svgString, options = {}) {
  const result = await renderSvgFullPage(svgString, {
    ...options,
    outputType: 'png',
  });
  return result.buffer;
}

/**
 * Convert SVG string to JPEG (convenience function)
 *
 * @async
 * @param {string} svgString - SVG string
 * @param {object} options - Options
 * @returns {Promise<Buffer>} JPEG buffer
 */
async function svgToJpeg(svgString, options = {}) {
  const result = await renderSvgFullPage(svgString, {
    ...options,
    outputType: 'jpeg',
  });
  return result.buffer;
}

/**
 * Convert SVG string to WebP (convenience function)
 *
 * @async
 * @param {string} svgString - SVG string
 * @param {object} options - Options
 * @returns {Promise<Buffer>} WebP buffer
 */
async function svgToWebp(svgString, options = {}) {
  const result = await renderSvgFullPage(svgString, {
    ...options,
    outputType: 'webp',
  });
  return result.buffer;
}

// ─────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────

module.exports = {
  renderSvgFullPage,
  svgToPng,
  svgToJpeg,
  svgToWebp,
};
