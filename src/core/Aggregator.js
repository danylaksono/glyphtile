/**
 * Aggregator.js
 * Pure business logic for aggregating points into grid cells
 */

export class Aggregator {
  /**
   * Aggregate projected points into a grid
   * @param {Array} projectedPoints - Array of {x, y, w} projected points
   * @param {Array} originalData - Original data array for reference
   * @param {number} width - Canvas width in pixels
   * @param {number} height - Canvas height in pixels
   * @param {number} cellSizePixels - Size of each grid cell
   * @returns {Object} Aggregation result: {grid, cellData, cols, rows, width, height, cellSizePixels}
   */
  static aggregate(projectedPoints, originalData, width, height, cellSizePixels) {
    const cols = Math.ceil(width / cellSizePixels);
    const rows = Math.ceil(height / cellSizePixels);
    const grid = new Array(rows * cols).fill(0);
    const cellData = new Array(rows * cols).fill(null).map(() => []);

    console.log('Aggregating points:', {
      totalPoints: projectedPoints.length,
      canvasSize: { width, height },
      cellSize: cellSizePixels,
      gridSize: { cols, rows },
    });

    // Aggregate points into grid cells
    for (let i = 0; i < projectedPoints.length; i++) {
      const p = projectedPoints[i];
      const col = Math.floor(p.x / cellSizePixels);
      const row = Math.floor(p.y / cellSizePixels);

      // Bounds check
      if (col >= 0 && col < cols && row >= 0 && row < rows) {
        const idx = row * cols + col;
        grid[idx] += p.w;

        // Store original data point for glyph rendering
        cellData[idx].push({
          data: originalData[i],
          weight: p.w,
          projectedX: p.x,
          projectedY: p.y,
        });
      }
    }

    const cellsWithData = grid.filter((v) => v > 0).length;
    // console.log('Grid aggregation complete:', {
    //   cellsWithData,
    //   maxValue: Math.max(...grid),
    //   totalValue: grid.reduce((sum, v) => sum + v, 0),
    // });

    return {
      grid,
      cellData,
      cols,
      rows,
      width,
      height,
      cellSizePixels,
    };
  }

  /**
   * Instance method for convenience
   */
  constructor() {}

  /**
   * Aggregate using instance method
   * @param {Array} projectedPoints - Projected points
   * @param {Array} originalData - Original data
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {number} cellSizePixels - Cell size
   * @returns {Object} Aggregation result
   */
  aggregate(projectedPoints, originalData, width, height, cellSizePixels) {
    return Aggregator.aggregate(projectedPoints, originalData, width, height, cellSizePixels);
  }

  /**
   * Get statistics about a grid
   * @param {Object} aggregationResult - Result from aggregate()
   * @returns {Object} Statistics: {totalCells, cellsWithData, maxValue, minValue, avgValue}
   */
  getStats(aggregationResult) {
    const { grid } = aggregationResult;
    const cellsWithData = grid.filter((v) => v > 0);

    return {
      totalCells: grid.length,
      cellsWithData: cellsWithData.length,
      maxValue: cellsWithData.length > 0 ? Math.max(...cellsWithData) : 0,
      minValue: cellsWithData.length > 0 ? Math.min(...cellsWithData) : 0,
      avgValue: cellsWithData.length > 0 ? cellsWithData.reduce((a, b) => a + b) / cellsWithData.length : 0,
      totalValue: grid.reduce((sum, v) => sum + v, 0),
    };
  }
}
