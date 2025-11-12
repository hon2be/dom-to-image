/**
 * 🖥️  Fallback Server 예제
 * Express + SVG Fullpage 렌더러
 * 
 * 사용법:
 * node examples/fallback-server.js
 * 
 * 그 후 다른 터미널에서:
 * curl -X POST http://localhost:3000/render \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "svg": "<svg width=\"200\" height=\"100\">...</svg>",
 *     "outputType": "png",
 *     "quality": 1
 *   }'
 */

const express = require('express');
const path = require('path');
const multer = require('multer');
const { renderSvgFullPage } = require('../src/renderer');

const app = express();
const upload = multer();
const PORT = process.env.PORT || 4000;

// ✅ 대용량 SVG 지원 (제한 없음)
app.use(express.json({ limit: '500mb' }));
app.use(express.text({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// ✅ 정적 파일 제공 (프로젝트 루트)
app.use(express.static(path.join(__dirname, '..')));

// ─────────────────────────────────────────────────────────────
// 🛣️  라우트
// ─────────────────────────────────────────────────────────────

/**
 * GET /health
 * 서버 상태 확인
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SVG Fullpage Renderer',
    version: '1.0.0',
  });
});

/**
 * POST /render
 * SVG 문자열 → 이미지 렌더링
 *
 * 요청 바디:
 * {
 *   "svg": "<svg>...</svg>",           // SVG 문자열 (필수)
 *   "outputType": "png|jpeg|webp",    // 출력 형식 (기본: png)
 *   "quality": 0-1,                    // JPEG 품질 (기본: 1)
 *   "deviceScaleFactor": 1-3           // 해상도 배수 (기본: 2)
 * }
 *
 * 응답:
 * - Content-Type: image/png (또는 jpeg/webp)
 * - Body: 이미지 바이너리
 */
app.post('/render', upload.single('svg'), async (req, res) => {
  try {
    const hasFile = req.file && req.file.buffer;
    const svg = hasFile ? req.file.buffer.toString('utf8') : (req.body && req.body.svg);
    const outputType = (req.body && req.body.outputType) ? String(req.body.outputType).toLowerCase() : 'png';

    const parsedQuality = req.body && typeof req.body.quality !== 'undefined'
      ? Number(req.body.quality)
      : NaN;
    const quality = Number.isFinite(parsedQuality) ? parsedQuality : 1;

    const parsedScale = req.body && typeof req.body.deviceScaleFactor !== 'undefined'
      ? Number(req.body.deviceScaleFactor)
      : NaN;
    const deviceScaleFactor = Number.isFinite(parsedScale) && parsedScale > 0 ? parsedScale : 2;

    const parsedTimeout = req.body && typeof req.body.timeout !== 'undefined'
      ? Number(req.body.timeout)
      : NaN;
    const timeout = Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : 30000;

    // ✅ 입력 검증
    if (!svg) {
      return res.status(400).json({
        error: 'SVG 문자열이 필요합니다 (svg 필드)',
      });
    }

    if (!['png', 'jpeg', 'webp'].includes(outputType)) {
      return res.status(400).json({
        error: 'outputType은 png, jpeg, webp 중 하나여야 합니다',
      });
    }

    // ✅ 렌더링
    console.log(`📝 렌더링 요청: ${outputType} (scale: ${deviceScaleFactor}x, quality: ${quality})`);

    const result = await renderSvgFullPage(svg, {
      outputType,
      quality,
      deviceScaleFactor,
      timeout,
    });

    // ✅ 응답
    res.set({
      'Content-Type': `image/${result.format}`,
      'X-Image-Width': result.width,
      'X-Image-Height': result.height,
      'X-Image-Format': result.format,
    });

    console.log(`✨ 완료: ${result.width}x${result.height} ${result.format}`);

    return res.send(result.buffer);
  } catch (error) {
    console.error('❌ 렌더링 에러:', error.message);
    return res.status(500).json({
      error: error.message,
      type: error.constructor.name,
    });
  }
});

/**
 * POST /render/batch
 * 여러 SVG 일괄 렌더링 (향후 기능)
 */
app.post('/render/batch', async (req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: '일괄 렌더링은 향후 지원 예정입니다',
  });
});

// ─────────────────────────────────────────────────────────────
// 📊 통계 미들웨어
// ─────────────────────────────────────────────────────────────

let requestCount = 0;

app.use((req, res, next) => {
  requestCount++;
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * GET /stats
 * 서버 통계
 */
app.get('/stats', (req, res) => {
  res.json({
    totalRequests: requestCount,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// ─────────────────────────────────────────────────────────────
// 🚀 서버 시작
// ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🚀 SVG Fullpage Renderer 서버 시작`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\n📍 주소: http://localhost:${PORT}`);
  console.log(`\n📝 사용 가능한 엔드포인트:`);
  console.log(`   GET  /health           - 서버 상태 확인`);
  console.log(`   POST /render           - SVG 렌더링`);
  console.log(`   GET  /stats            - 서버 통계`);
  console.log(`\n💡 예제 요청:`);
  console.log(`   curl -X POST http://localhost:${PORT}/render \\`);
  console.log(`     -H "Accept: image/png" \\`);
  console.log(`     -F "outputType=png" \\`);
  console.log(`     -F "deviceScaleFactor=2" \\`);
  console.log(`     -F "svg=@./examples/sample.svg" \\`);
  console.log(`     --output output.png`);
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});

// ─────────────────────────────────────────────────────────────
// ⛔ 에러 처리
// ─────────────────────────────────────────────────────────────

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 서버 종료...');
  process.exit(0);
});

