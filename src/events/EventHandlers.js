/**
 * EventHandlers.js
 * Event handler implementations
 */

export class EventHandlers {
  /**
   * Handle hover events
   * @param {Object} event - MapLibre mouse event
   * @param {Object} cellQueryEngine - CellQueryEngine instance
   * @param {Function} onHover - Hover callback from config
   */
  static handleHover(event, cellQueryEngine, onHover) {
    if (!onHover || !cellQueryEngine) return;

    const cell = cellQueryEngine.getCellAt({ x: event.point.x, y: event.point.y });
    if (cell) {
      onHover({ cell, event });
    }
  }

  /**
   * Handle click events
   * @param {Object} event - MapLibre click event
   * @param {Object} cellQueryEngine - CellQueryEngine instance
   * @param {Function} onClick - Click callback from config
   */
  static handleClick(event, cellQueryEngine, onClick) {
    if (!onClick || !cellQueryEngine) return;

    const cell = cellQueryEngine.getCellAt({ x: event.point.x, y: event.point.y });
    if (cell) {
      onClick({ cell, event });
    }
  }

  /**
   * Handle zoom events
   * @param {Object} map - MapLibre map instance
   * @param {Object} config - Layer configuration
   * @param {Function} onZoom - Callback after zoom handling
   */
  static handleZoom(map, config, onZoom) {
    if (config.zoomBasedSize) {
      EventHandlers._updateCellSizeBasedOnZoom(map, config);
    }
    if (onZoom) onZoom();
  }

  /**
   * Handle move events
   * @param {Function} onMove - Callback when map moves
   */
  static handleMove(onMove) {
    if (onMove) onMove();
  }

  /**
   * Update cell size based on zoom level
   * @private
   */
  static _updateCellSizeBasedOnZoom(map, config) {
    if (!map) return;

    const zoom = map.getZoom();
    const baseZoom = 11;
    const zoomFactor = Math.pow(2, zoom - baseZoom);
    const newCellSize = Math.max(
      config.minCellSize,
      Math.min(config.maxCellSize, config.cellSizePixels / zoomFactor)
    );

    if (Math.abs(newCellSize - config.cellSizePixels) > 1) {
      config.cellSizePixels = newCellSize;
      console.log('Cell size updated based on zoom:', {
        zoom,
        zoomFactor,
        newCellSize,
      });
    }
  }

  /**
   * Instance methods for convenience
   */
  handleHover(event, cellQueryEngine, onHover) {
    EventHandlers.handleHover(event, cellQueryEngine, onHover);
  }

  handleClick(event, cellQueryEngine, onClick) {
    EventHandlers.handleClick(event, cellQueryEngine, onClick);
  }

  handleZoom(map, config, onZoom) {
    EventHandlers.handleZoom(map, config, onZoom);
  }

  handleMove(onMove) {
    EventHandlers.handleMove(onMove);
  }
}
