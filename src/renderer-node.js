/**
 * 🖥️  렌더러 (Node.js Puppeteer)
 * SVG를 fullpage 방식으로 캡처하여 이미지화
 * 
 * 사용 시나리오:
 * 1. Safari에서 dom-to-image 호출
 * 2. dom-to-image가 SVG 생성
 * 3. SVG를 fallback 서버로 POST 요청
 * 4. 이 렌더러로 Puppeteer 렌더링
 * 5. 이미지 반환
 *
 * @module renderer
 */

const fs = require('fs');

/**
 * SVG 문자열에서 width/height 추출
 *
 * @param {string} svgString - SVG 문자열
 * @returns {{width: number, height: number}} SVG 치수
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
 * Puppeteer 동적 로드
 *
 * @returns {Promise<any>} Puppeteer 모듈
 * @private
 */
async function initPuppeteer() {
  try {
    return require('puppeteer');
  } catch (error) {
    throw new Error(
      'Puppeteer가 설치되지 않았습니다.\n' +
      '다음 명령어를 실행하세요: npm install puppeteer'
    );
  }
}

/**
 * SVG 문자열을 Puppeteer fullpage 스크린샷으로 렌더링
 *
 * @async
 * @param {string} svgString - SVG 문자열 (width/height 속성 필수)
 * @param {{
 *   outputType?: 'png'|'jpeg'|'webp',
 *   outputPath?: string,
 *   quality?: number,
 *   deviceScaleFactor?: number,
 *   timeout?: number
 * }} options - 렌더링 옵션
 *
 * @returns {Promise<{
 *   buffer: Buffer,
 *   width: number,
 *   height: number,
 *   format: string,
 *   path?: string
 * }>} 렌더링 결과
 *
 * @example
 * const result = await renderSvgFullPage(svgString, {
 *   outputType: 'png',
 *   outputPath: './output.png',
 *   deviceScaleFactor: 2
 * });
 * console.log(`저장: ${result.width}x${result.height}`);
 *
 * @throws {Error} SVG 크기 감지 실패 또는 렌더링 에러
 */
async function renderSvgFullPage(svgString, options = {}) {
  const puppeteer = await initPuppeteer();

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // SVG 크기 추출
    const { width: svgWidth, height: svgHeight } = extractSvgDimensions(svgString);

    // ✅ SVG를 중앙에 배치한 HTML 구성
    const html = `
      <!DOCTYPE html>
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
        <body>
          ${svgString}
        </body>
      </html>
    `;

    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: options.timeout || 30000,
    });

    // ✅ SVG 실제 크기 계산
    const boundingBox = await page.evaluate(() => {
      const svg = document.querySelector('svg');
      if (!svg) throw new Error('SVG 엘리먼트를 찾을 수 없습니다');

      const rect = svg.getBoundingClientRect();
      return {
        width: Math.max(rect.width, 1),
        height: Math.max(rect.height, 1),
      };
    });

    // ✅ 뷰포트를 SVG 크기에 맞게 조정
    const finalWidth = Math.ceil(boundingBox.width);
    const finalHeight = Math.ceil(boundingBox.height);

    await page.setViewport({
      width: finalWidth,
      height: finalHeight,
      deviceScaleFactor: options.deviceScaleFactor || 2,
    });

    // ✅ 페이지 전체 스크린샷
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

    // ✅ 파일로 저장할 경우
    let savedPath = null;
    if (options.outputPath) {
      await fs.promises.writeFile(options.outputPath, buffer);
      savedPath = options.outputPath;
    }

    return {
      buffer,
      width: finalWidth,
      height: finalHeight,
      format: outputType,
      path: savedPath,
    };
  } finally {
    await browser.close();
  }
}

/**
 * SVG 문자열을 PNG로 변환 (편의 함수)
 *
 * @async
 * @param {string} svgString - SVG 문자열
 * @param {object} options - 옵션
 * @returns {Promise<Buffer>} PNG 버퍼
 */
async function svgToPng(svgString, options = {}) {
  const result = await renderSvgFullPage(svgString, {
    ...options,
    outputType: 'png',
  });
  return result.buffer;
}

/**
 * SVG 문자열을 JPEG로 변환 (편의 함수)
 *
 * @async
 * @param {string} svgString - SVG 문자열
 * @param {object} options - 옵션
 * @returns {Promise<Buffer>} JPEG 버퍼
 */
async function svgToJpeg(svgString, options = {}) {
  const result = await renderSvgFullPage(svgString, {
    ...options,
    outputType: 'jpeg',
  });
  return result.buffer;
}

/**
 * SVG 문자열을 WebP로 변환 (편의 함수)
 *
 * @async
 * @param {string} svgString - SVG 문자열
 * @param {object} options - 옵션
 * @returns {Promise<Buffer>} WebP 버퍼
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

