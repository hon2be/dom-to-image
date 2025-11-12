/**
 * Utility Functions
 *
 * @module utils
 */

/**
 * Detect current runtime environment
 *
 * @returns {{isNode: boolean, isBrowser: boolean}} Environment info
 *
 * @example
 * const env = detectEnvironment();
 * if (env.isNode) {
 *   console.log('Node.js environment');
 * }
 */
function detectEnvironment() {
  const isNode =
    typeof window === 'undefined' &&
    typeof process !== 'undefined' &&
    process.versions &&
    process.versions.node;

  const isBrowser = typeof window !== 'undefined';

  return { isNode, isBrowser };
}

/**
 * Extract width/height from SVG string
 *
 * @param {string} svgString - SVG string
 * @returns {{width: number, height: number}} SVG dimensions
 *
 * @example
 * const dims = extractSvgDimensions('<svg width="300" height="150">...</svg>');
 * // { width: 300, height: 150 }
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
 * Round number to nearest ceiling integer
 *
 * @param {number} value - Value to round up
 * @returns {number} Rounded value
 */
function roundToCeil(value) {
  return Math.ceil(value);
}

/**
 * Merge default values with custom options
 *
 * @template T
 * @param {T} defaults - Default values object
 * @param {Partial<T>} custom - Custom options
 * @returns {T} Merged object
 *
 * @example
 * const merged = mergeDefaults(
 *   { quality: 1, format: 'png' },
 *   { quality: 0.8 }
 * );
 * // { quality: 0.8, format: 'png' }
 */
function mergeDefaults(defaults, custom = {}) {
  return Object.assign({}, defaults, custom);
}

// ─────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────

module.exports = {
  detectEnvironment,
  extractSvgDimensions,
  roundToCeil,
  mergeDefaults,
};
