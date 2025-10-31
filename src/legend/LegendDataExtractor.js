/**
 * LegendDataExtractor.js
 * Utilities to extract legend-relevant data from grid aggregation and config
 */

export class LegendDataExtractor {
  /**
   * Extract color scale information from config
   * @param {Object} config - ScreenGridLayerGL config
   * @param {Object} gridData - Aggregation result
   * @returns {Object} Color scale legend data
   */
  static extractColorScale(config, gridData) {
    if (!gridData || !gridData.grid) return null;

    const values = gridData.grid.filter(v => v > 0);
    if (values.length === 0) return null;

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    // Sample color scale at different points
    const steps = 5;
    const colorStops = [];
    for (let i = 0; i <= steps; i++) {
      const normVal = i / steps;
      const value = minValue + (maxValue - minValue) * normVal;
      const [r, g, b, a] = config.colorScale(normVal);
      colorStops.push({
        value,
        normalizedValue: normVal,
        color: `rgba(${r}, ${g}, ${b}, ${a / 255})`,
        rgba: [r, g, b, a]
      });
    }

    return {
      type: 'color-scale',
      minValue,
      maxValue,
      colorStops,
      unit: config.legendUnit || ''
    };
  }

  /**
   * Extract categorical data from cell data
   * Used for pie charts, bar charts, etc.
   * @param {Object} gridData - Aggregation result
   * @param {Function} categoryExtractor - Function to extract category from data point
   * @param {Function} valueExtractor - Function to extract value from data point
   * @returns {Object} Categorical legend data
   */
  static extractCategorical(gridData, categoryExtractor, valueExtractor) {
    if (!gridData || !gridData.cellData) return null;

    const categories = new Map();
    let totalCount = 0;

    // Aggregate across all cells
    for (const cell of gridData.cellData) {
      if (!cell || cell.length === 0) continue;

      for (const item of cell) {
        const category = categoryExtractor(item.data);
        const value = valueExtractor ? valueExtractor(item.data) : 1;

        if (category != null) {
          if (!categories.has(category)) {
            categories.set(category, { category, count: 0, totalValue: 0 });
          }
          const catData = categories.get(category);
          catData.count += 1;
          catData.totalValue += value;
          totalCount += 1;
        }
      }
    }

    if (categories.size === 0) return null;

    const items = Array.from(categories.values())
      .sort((a, b) => b.totalValue - a.totalValue);

    return {
      type: 'categorical',
      items,
      totalCount
    };
  }

  /**
   * Extract temporal/time series data
   * @param {Object} gridData - Aggregation result
   * @param {Function} timeExtractor - Function to extract time/year from data point
   * @param {Function} valueExtractor - Function to extract value from data point
   * @returns {Object} Temporal legend data
   */
  static extractTemporal(gridData, timeExtractor, valueExtractor) {
    if (!gridData || !gridData.cellData) return null;

    const timePoints = new Map();

    // Aggregate across all cells
    for (const cell of gridData.cellData) {
      if (!cell || cell.length === 0) continue;

      for (const item of cell) {
        const time = timeExtractor(item.data);
        const value = valueExtractor ? valueExtractor(item.data) : 1;

        if (time != null && !isNaN(time)) {
          if (!timePoints.has(time)) {
            timePoints.set(time, { time, count: 0, totalValue: 0 });
          }
          const timeData = timePoints.get(time);
          timeData.count += 1;
          timeData.totalValue += value;
        }
      }
    }

    if (timePoints.size === 0) return null;

    const items = Array.from(timePoints.values())
      .sort((a, b) => a.time - b.time);

    const times = items.map(d => d.time);
    const values = items.map(d => d.totalValue);

    return {
      type: 'temporal',
      items,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      minValue: Math.min(...values),
      maxValue: Math.max(...values),
      timeRange: Math.max(...times) - Math.min(...times)
    };
  }

  /**
   * Extract size scale information
   * Used for scatter plots and size-encoded glyphs
   * @param {Object} gridData - Aggregation result
   * @param {Function} sizeExtractor - Function to extract size value from data point
   * @returns {Object} Size scale legend data
   */
  static extractSizeScale(gridData, sizeExtractor) {
    if (!gridData || !gridData.cellData) return null;

    const sizes = [];

    for (const cell of gridData.cellData) {
      if (!cell || cell.length === 0) continue;

      for (const item of cell) {
        const size = sizeExtractor(item.data);
        if (size != null && !isNaN(size) && size > 0) {
          sizes.push(size);
        }
      }
    }

    if (sizes.length === 0) return null;

    const minSize = Math.min(...sizes);
    const maxSize = Math.max(...sizes);

    return {
      type: 'size-scale',
      minSize,
      maxSize,
      sampleSizes: [minSize, minSize + (maxSize - minSize) * 0.5, maxSize]
    };
  }

  /**
   * Auto-detect legend type from config and gridData
   * @param {Object} config - ScreenGridLayerGL config
   * @param {Object} gridData - Aggregation result
   * @returns {string|null} Detected legend type
   */
  static detectLegendType(config, gridData) {
    // If custom glyph drawing function exists, try to infer from sample data
    if (config.onDrawCell && gridData && gridData.cellData) {
      // Sample a cell with data
      const sampleCell = gridData.cellData.find(cell => cell && cell.length > 0);
      if (sampleCell && sampleCell.length > 0) {
        const sampleData = sampleCell[0].data;
        
        // Check for temporal data (year, date, time fields)
        if (sampleData.year != null || sampleData.date != null || sampleData.time != null) {
          return 'temporal';
        }

        // Check for categorical data (string fields or limited numeric ranges)
        const keys = Object.keys(sampleData);
        const stringKeys = keys.filter(k => typeof sampleData[k] === 'string');
        if (stringKeys.length > 0) {
          return 'categorical';
        }
      }
    }

    // Default to color scale if no glyphs enabled
    if (!config.enableGlyphs) {
      return 'color-scale';
    }

    return 'color-scale'; // Default fallback
  }
}

