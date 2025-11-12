/**
 * 📝 Node.js Renderer Usage Example
 * Puppeteer + SVG Fullpage Rendering
 */

const fs = require('fs');
const { renderSvgFullPage, svgToPng, svgToJpeg } = require('../src/renderer');

// ─────────────────────────────────────────────────────────────
// 📌 Example 1: Basic SVG → PNG
// ─────────────────────────────────────────────────────────────

const basicSvg = `
  <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:rgb(255,255,0);stop-opacity:1" />
        <stop offset="100%" style="stop-color:rgb(255,0,0);stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="400" height="200" fill="url(#grad1)"/>
    <circle cx="200" cy="100" r="50" fill="white" opacity="0.8"/>
    <text x="200" y="110" text-anchor="middle" font-size="24" fill="black">
      SVG Fullpage Render
    </text>
  </svg>
`;

// ─────────────────────────────────────────────────────────────
// 📌 Example 2: Complex SVG (Chart)
// ─────────────────────────────────────────────────────────────

const chartSvg = `
  <svg width="500" height="300" xmlns="http://www.w3.org/2000/svg">
    <style>
      .bar { fill: #3498db; transition: fill 0.3s; }
      .bar:hover { fill: #e74c3c; }
      .label { font-family: Arial; font-size: 12px; }
    </style>
    
    <!-- Y축 -->
    <line x1="50" y1="20" x2="50" y2="280" stroke="black" stroke-width="2"/>
    <!-- X축 -->
    <line x1="50" y1="280" x2="480" y2="280" stroke="black" stroke-width="2"/>
    
    <!-- 막대 그래프 -->
    <g class="bar-group">
      <rect x="70" y="200" width="40" height="80" class="bar"/>
      <text x="90" y="300" text-anchor="middle" class="label">A</text>
    </g>
    <g class="bar-group">
      <rect x="140" y="120" width="40" height="160" class="bar"/>
      <text x="160" y="300" text-anchor="middle" class="label">B</text>
    </g>
    <g class="bar-group">
      <rect x="210" y="80" width="40" height="200" class="bar"/>
      <text x="230" y="300" text-anchor="middle" class="label">C</text>
    </g>
    <g class="bar-group">
      <rect x="280" y="150" width="40" height="130" class="bar"/>
      <text x="300" y="300" text-anchor="middle" class="label">D</text>
    </g>
    <g class="bar-group">
      <rect x="350" y="100" width="40" height="180" class="bar"/>
      <text x="370" y="300" text-anchor="middle" class="label">E</text>
    </g>
    
    <!-- 제목 -->
    <text x="250" y="30" text-anchor="middle" font-size="20" font-weight="bold">
      Sample Bar Chart
    </text>
  </svg>
`;

// ─────────────────────────────────────────────────────────────
// 🚀 실행 함수
// ─────────────────────────────────────────────────────────────

async function run() {
  console.log('🚀 Node.js SVG 렌더러 예제 시작\n');

  try {
    // ✅ 예제 1: 기본 PNG
    console.log('📝 [1] 기본 SVG → PNG 변환...');
    const result1 = await renderSvgFullPage(basicSvg, {
      outputType: 'png',
      outputPath: './output/example-1-basic.png',
      deviceScaleFactor: 2,
    });
    console.log(`   ✨ 완료! (${result1.width}x${result1.height})\n`);

    // ✅ 예제 2: 고해상도 PNG (3x)
    console.log('📝 [2] 고해상도 PNG (3x) 렌더링...');
    const result2 = await renderSvgFullPage(basicSvg, {
      outputType: 'png',
      outputPath: './output/example-2-hires.png',
      deviceScaleFactor: 3,
    });
    console.log(`   ✨ 완료! (${result2.width}x${result2.height})\n`);

    // ✅ 예제 3: 고품질 JPEG
    console.log('📝 [3] 고품질 JPEG (95%) 변환...');
    const result3 = await renderSvgFullPage(basicSvg, {
      outputType: 'jpeg',
      outputPath: './output/example-3-quality.jpg',
      quality: 0.95,
      deviceScaleFactor: 2,
    });
    console.log(`   ✨ 완료! (${result3.width}x${result3.height})\n`);

    // ✅ 예제 4: 저압축 JPEG
    console.log('📝 [4] 저압축 JPEG (50%) 변환...');
    const result4 = await renderSvgFullPage(basicSvg, {
      outputType: 'jpeg',
      outputPath: './output/example-4-compact.jpg',
      quality: 0.5,
      deviceScaleFactor: 2,
    });
    console.log(`   ✨ 완료! (${result4.width}x${result4.height})\n`);

    // ✅ 예제 5: 차트 SVG → PNG
    console.log('📝 [5] 차트 SVG → PNG 변환...');
    const result5 = await renderSvgFullPage(chartSvg, {
      outputType: 'png',
      outputPath: './output/example-5-chart.png',
      deviceScaleFactor: 2,
    });
    console.log(`   ✨ 완료! (${result5.width}x${result5.height})\n`);

    // ✅ 예제 6: 버퍼 직접 반환 (파일 저장 X)
    console.log('📝 [6] 버퍼 직접 반환 (네트워크 전송 용)...');
    const result6 = await renderSvgFullPage(basicSvg, {
      outputType: 'png',
      deviceScaleFactor: 2,
      // outputPath 미지정 → 버퍼만 반환
    });
    console.log(`   ✨ 완료! Buffer 크기: ${result6.buffer.length} bytes\n`);

    // 요약
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 모든 렌더링 완료!\n');
    console.log('📂 생성된 파일:');
    console.log('   - ./output/example-1-basic.png');
    console.log('   - ./output/example-2-hires.png');
    console.log('   - ./output/example-3-quality.jpg');
    console.log('   - ./output/example-4-compact.jpg');
    console.log('   - ./output/example-5-chart.png');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
    process.exit(1);
  }
}

// 출력 디렉토리 생성
if (!fs.existsSync('./output')) {
  fs.mkdirSync('./output', { recursive: true });
}

// 실행
run();

