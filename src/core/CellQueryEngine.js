/**
 * CellQueryEngine.js
 * Query engine for finding and accessing grid cells
 */

export class CellQueryEngine {
  /**
   * Get cell information at a specific point
   * @param {Object} aggregationResult - Result from Aggregator.aggregate()
   * @param {Object} point - {x, y} coordinates
   * @returns {Object|null} Cell info: {col, row, value, cellData, x, y} or null
   */
  static getCellAt(aggregationResult, point) {
    if (!aggregationResult) return null;

    const { grid, cellData, cols, rows, cellSizePixels } = aggregationResult;
    const col = Math.floor(point.x / cellSizePixels);
    const row = Math.floor(point.y / cellSizePixels);

    // Bounds check
    if (col < 0 || col >= cols || row < 0 || row >= rows) {
      return null;
    }

    const idx = row * cols + col;
    return {
      col,
      row,
      value: grid[idx],
      cellData: cellData[idx],
      x: col * cellSizePixels,
      y: row * cellSizePixels,
      cellSize: cellSizePixels,
      index: idx,
    };
  }

  /**
   * Get all cells with data in a rectangular region
   * @param {Object} aggregationResult - Aggregation result
   * @param {Object} bounds - {minX, minY, maxX, maxY}
   * @returns {Array} Array of cell info objects
   */
  static getCellsInBounds(aggregationResult, bounds) {
    if (!aggregationResult) return [];

    const { grid, cellData, cols, rows, cellSizePixels } = aggregationResult;
    const minCol = Math.floor(bounds.minX / cellSizePixels);
    const minRow = Math.floor(bounds.minY / cellSizePixels);
    const maxCol = Math.floor(bounds.maxX / cellSizePixels);
    const maxRow = Math.floor(bounds.maxY / cellSizePixels);

    const cells = [];

    for (let row = Math.max(0, minRow); row <= Math.min(rows - 1, maxRow); row++) {
      for (let col = Math.max(0, minCol); col <= Math.min(cols - 1, maxCol); col++) {
        const idx = row * cols + col;
        if (grid[idx] > 0) {
          cells.push({
            col,
            row,
            value: grid[idx],
            cellData: cellData[idx],
            x: col * cellSizePixels,
            y: row * cellSizePixels,
            cellSize: cellSizePixels,
            index: idx,
          });
        }
      }
    }

    return cells;
  }

  /**
   * Get all cells with data values above a threshold
   * @param {Object} aggregationResult - Aggregation result
   * @param {number} threshold - Minimum value
   * @returns {Array} Array of cell info objects
   */
  static getCellsAboveThreshold(aggregationResult, threshold) {
    if (!aggregationResult) return [];

    const { grid, cellData, cols, rows, cellSizePixels } = aggregationResult;
    const cells = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        if (grid[idx] >= threshold) {
          cells.push({
            col,
            row,
            value: grid[idx],
            cellData: cellData[idx],
            x: col * cellSizePixels,
            y: row * cellSizePixels,
            cellSize: cellSizePixels,
            index: idx,
          });
        }
      }
    }

    return cells;
  }

  /**
   * Instance method for convenience
   */
  constructor(aggregationResult = null) {
    this.aggregationResult = aggregationResult;
  }

  /**
   * Set the aggregation result
   * @param {Object} aggregationResult - Result from aggregation
   */
  setAggregationResult(aggregationResult) {
    this.aggregationResult = aggregationResult;
  }

  /**
   * Query cell at point using stored result
   * @param {Object} point - {x, y}
   * @returns {Object|null} Cell info
   */
  getCellAt(point) {
    return CellQueryEngine.getCellAt(this.aggregationResult, point);
  }

  /**
   * Query cells in bounds
   * @param {Object} bounds - Bounding rectangle
   * @returns {Array} Cells in bounds
   */
  getCellsInBounds(bounds) {
    return CellQueryEngine.getCellsInBounds(this.aggregationResult, bounds);
  }

  /**
   * Query cells above threshold
   * @param {number} threshold - Threshold value
   * @returns {Array} Cells above threshold
   */
  getCellsAboveThreshold(threshold) {
    return CellQueryEngine.getCellsAboveThreshold(this.aggregationResult, threshold);
  }
}
