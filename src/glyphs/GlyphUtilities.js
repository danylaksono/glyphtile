/**
 * GlyphUtilities.js
 * Static utility methods for drawing different glyph types
 */

export class GlyphUtilities {
  /**
   * Draw a simple circle glyph
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - Center X coordinate
   * @param {number} y - Center Y coordinate
   * @param {number} radius - Circle radius
   * @param {string} color - Fill color (default: '#ff0000')
   * @param {number} alpha - Opacity 0-1 (default: 0.8)
   */
  static drawCircleGlyph(ctx, x, y, radius, color = '#ff0000', alpha = 0.8) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
  }

  /**
   * Draw a bar chart glyph showing multiple values
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - Center X coordinate
   * @param {number} y - Center Y coordinate
   * @param {Array} values - Array of numeric values
   * @param {number} maxValue - Maximum value for scale
   * @param {number} cellSize - Cell size in pixels
   * @param {Array} colors - Array of colors for bars (default: ['#ff6b6b', '#4ecdc4', '#45b7d1'])
   */
  static drawBarGlyph(
    ctx,
    x,
    y,
    values,
    maxValue,
    cellSize,
    colors = ['#ff6b6b', '#4ecdc4', '#45b7d1']
  ) {
    const barWidth = cellSize / values.length;
    const maxHeight = cellSize * 0.8;

    values.forEach((value, i) => {
      const barHeight = (value / maxValue) * maxHeight;
      const barX = x - cellSize / 2 + i * barWidth;
      const barY = y + maxHeight / 2 - barHeight;

      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(barX, barY, barWidth * 0.8, barHeight);
    });
  }

  /**
   * Draw a pie chart glyph
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - Center X coordinate
   * @param {number} y - Center Y coordinate
   * @param {Array} values - Array of numeric values for slices
   * @param {number} radius - Pie radius
   * @param {Array} colors - Array of colors for slices (default: ['#ff6b6b', '#4ecdc4', '#45b7d1'])
   */
  static drawPieGlyph(
    ctx,
    x,
    y,
    values,
    radius,
    colors = ['#ff6b6b', '#4ecdc4', '#45b7d1']
  ) {
    const total = values.reduce((sum, val) => sum + val, 0);
    if (total === 0) return;

    let currentAngle = 0;
    values.forEach((value, i) => {
      const sliceAngle = (value / total) * 2 * Math.PI;
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();
      currentAngle += sliceAngle;
    });
  }

  /**
   * Draw a scatter plot glyph showing individual data points
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - Center X coordinate
   * @param {number} y - Center Y coordinate
   * @param {Array} points - Array of point objects with weight property
   * @param {number} cellSize - Cell size in pixels
   * @param {string} color - Point color (default: '#ff0000')
   */
  static drawScatterGlyph(ctx, x, y, points, cellSize, color = '#ff0000') {
    const maxRadius = cellSize * 0.3;
    const minRadius = 2;

    points.forEach((point) => {
      const normalizedWeight = Math.max(0.1, point.weight);
      const radius = minRadius + normalizedWeight * (maxRadius - minRadius);
      const alpha = Math.min(0.8, normalizedWeight);

      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
    });
  }

  /**
   * Draw a donut chart glyph (pie chart with hole)
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - Center X coordinate
   * @param {number} y - Center Y coordinate
   * @param {Array} values - Array of numeric values
   * @param {number} outerRadius - Outer radius
   * @param {number} innerRadius - Inner radius (hole size)
   * @param {Array} colors - Array of colors (default: ['#ff6b6b', '#4ecdc4', '#45b7d1'])
   */
  static drawDonutGlyph(
    ctx,
    x,
    y,
    values,
    outerRadius,
    innerRadius,
    colors = ['#ff6b6b', '#4ecdc4', '#45b7d1']
  ) {
    const total = values.reduce((sum, val) => sum + val, 0);
    if (total === 0) return;

    let currentAngle = 0;
    values.forEach((value, i) => {
      const sliceAngle = (value / total) * 2 * Math.PI;
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.arc(x, y, outerRadius, currentAngle, currentAngle + sliceAngle);
      ctx.arc(x, y, innerRadius, currentAngle + sliceAngle, currentAngle, true);
      ctx.closePath();
      ctx.fill();
      currentAngle += sliceAngle;
    });
  }

  /**
   * Draw a heatmap-style glyph (color intensity)
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - Center X coordinate
   * @param {number} y - Center Y coordinate
   * @param {number} radius - Circle radius
   * @param {number} normalizedValue - Value from 0-1
   * @param {Function} colorScale - Function: (value) => colorString
   */
  static drawHeatmapGlyph(ctx, x, y, radius, normalizedValue, colorScale) {
    ctx.fillStyle = colorScale(normalizedValue);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
  }

  /**
   * Draw a radial bar glyph (bars radiating from center)
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - Center X coordinate
   * @param {number} y - Center Y coordinate
   * @param {Array} values - Array of values
   * @param {number} maxValue - Max value for scaling
   * @param {number} maxRadius - Maximum bar length
   * @param {string} color - Bar color
   */
  static drawRadialBarGlyph(ctx, x, y, values, maxValue, maxRadius, color = '#ff0000') {
    const barCount = values.length;
    const angleStep = (2 * Math.PI) / barCount;

    values.forEach((value, i) => {
      const angle = i * angleStep;
      const barLength = (value / maxValue) * maxRadius;

      const x1 = x + Math.cos(angle) * (maxRadius - barLength);
      const y1 = y + Math.sin(angle) * (maxRadius - barLength);
      const x2 = x + Math.cos(angle) * maxRadius;
      const y2 = y + Math.sin(angle) * maxRadius;

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });
  }
}
