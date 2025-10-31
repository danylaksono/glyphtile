/**
 * Projector.js
 * Pure function for projecting geographic coordinates to screen space
 */

export class Projector {
  /**
   * Project geographic coordinates to screen space
   * @param {Array} data - Array of data points
   * @param {Function} getPosition - Function to extract [lng, lat] from data point
   * @param {Function} getWeight - Function to extract weight from data point
   * @param {Object} map - MapLibre GL map instance
   * @returns {Array} Array of projected points {x, y, w}
   */
  static projectPoints(data, getPosition, getWeight, map) {
    if (!map || !data || data.length === 0) {
      return [];
    }

    console.log('Projecting points:', {
      dataLength: data.length,
    });

    const projected = data.map((d, i) => {
      const [lng, lat] = getPosition(d);
      const p = map.project([lng, lat]);
      const x = p.x;
      const y = p.y;

      if (i < 3) {
        console.log(`Point ${i}:`, { lng, lat, projected: p, transformed: { x, y } });
      }

      return { x, y, w: getWeight(d) };
    });

    console.log('Points projected:', {
      total: projected.length,
      samplePoints: projected.slice(0, 3),
    });

    return projected;
  }

  /**
   * Instance method for convenience when used as a class instance
   */
  constructor(map = null) {
    this.map = map;
  }

  /**
   * Set the map reference
   * @param {Object} map - MapLibre GL map instance
   */
  setMap(map) {
    this.map = map;
  }

  /**
   * Project points using stored map reference
   * @param {Array} data - Data points to project
   * @param {Function} getPosition - Position extractor
   * @param {Function} getWeight - Weight extractor
   * @returns {Array} Projected points
   */
  project(data, getPosition, getWeight) {
    return Projector.projectPoints(data, getPosition, getWeight, this.map);
  }
}
