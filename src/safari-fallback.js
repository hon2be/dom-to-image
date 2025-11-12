/**
 * 🍎 Safari Fallback 모듈
 * 
 * Safari에서만 Fallback Server를 사용하여 Puppeteer 렌더링
 * 다른 브라우저는 기존 Canvas 로직 사용
 * 
 * @module safari-fallback
 */

/**
 * 현재 브라우저가 Safari인지 감지
 *
 * @returns {boolean} Safari면 true
 * @example
 * if (isSafari()) {
 *   // Safari만 fallback 서버 사용
 * }
 */
function isSafari() {
  // Safari 감지: /Safari/ 있고, /Chrome|Firefox|Edge/ 없음
  const userAgent = navigator.userAgent;
  return /Safari/.test(userAgent) && 
         !/Chrome|Firefox|Edge|OPR/.test(userAgent);
}

/**
 * SVG Data URI → SVG 문자열로 변환
 *
 * @param {string} svgDataUri - SVG data URI (data:image/svg+xml;...)
 * @returns {string} SVG 문자열
 * @private
 */
function svgDataUriToString(svgDataUri) {
  if (!svgDataUri.startsWith('data:image/svg+xml')) {
    return svgDataUri;
  }

  // data:image/svg+xml;utf8,<svg>...</svg> 형태 처리
  let svgString = svgDataUri.split(',')[1];

  // URL 인코딩 해제
  try {
    svgString = decodeURIComponent(svgString);
  } catch (e) {
    // 이미 디코딩됨
  }

  return svgString;
}

/**
 * Fallback 서버로 SVG 렌더링 요청
 *
 * @async
 * @param {string} svgString - SVG 문자열
 * @param {string} format - 출력 형식 ('png', 'jpeg', 'webp')
 * @param {object} options - 옵션
 * @param {string} options.fallbackServer - Fallback 서버 URL (기본: /render)
 * @param {number} options.quality - JPEG 품질 (0-1)
 * @param {number} options.deviceScaleFactor - 해상도 배수 (1-3, 기본: 2)
 * @returns {Promise<Blob>} 렌더링된 이미지 Blob
 * @throws {Error} 서버 요청 실패
 *
 * @example
 * const blob = await fetchFallbackRender(svgString, 'png', {
 *   fallbackServer: 'http://localhost:3000/render',
 *   deviceScaleFactor: 2
 * });
 * const url = URL.createObjectURL(blob);
 */
async function fetchFallbackRender(svgString, format = 'png', options = {}) {
  const fallbackServer = options.fallbackServer || '/render';

  const payload = {
    svg: svgString,
    outputType: format,
    quality: options.quality || 1,
    deviceScaleFactor: options.deviceScaleFactor || 2,
  };

  const response = await fetch(fallbackServer, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Fallback render failed: ${error.error || response.statusText}`);
  }

  return response.blob();
}

/**
 * Safari Fallback을 사용하여 DOM → 이미지로 변환
 *
 * 핵심 로직:
 * 1. toSvg()로 SVG 생성
 * 2. SVG data URI → 문자열로 변환
 * 3. Fallback 서버로 POST 요청
 * 4. Puppeteer가 렌더링한 Blob 반환
 *
 * @async
 * @param {Node} node - DOM 노드
 * @param {string} format - 출력 형식 ('png', 'jpeg')
 * @param {function} toSvg - dom-to-image.toSvg 함수
 * @param {object} options - 옵션
 * @param {string} options.fallbackServer - Fallback 서버 URL
 * @param {number} options.quality - JPEG 품질
 * @param {number} options.deviceScaleFactor - 해상도 배수
 * @returns {Promise<Blob>} 렌더링된 이미지 Blob
 *
 * @example
 * const blob = await safariToPng(element, toSvg, {
 *   fallbackServer: 'http://localhost:3000/render'
 * });
 */
async function safariRenderToBlob(node, format, toSvgFunc, options = {}) {
  // 1️⃣ SVG 생성
  const svgDataUri = await toSvgFunc(node, options);

  // 2️⃣ SVG data URI → 문자열로 변환
  const svgString = svgDataUriToString(svgDataUri);

  // 3️⃣ Fallback 서버로 요청
  const blob = await fetchFallbackRender(svgString, format, options);

  return blob;
}

// ─────────────────────────────────────────────────────────────
// Exports (글로벌 및 모듈)
// ─────────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
  window.isSafari = isSafari;
  window.fetchFallbackRender = fetchFallbackRender;
  window.safariRenderToBlob = safariRenderToBlob;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isSafari,
    fetchFallbackRender,
    safariRenderToBlob,
  };
}

