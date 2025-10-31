/**
 * ScreenGridLayerGL.js
 * Main orchestrator class - composes all modular components
 */

import { ConfigManager } from './config/ConfigManager.js';
import { Projector } from './core/Projector.js';
import { Aggregator } from './core/Aggregator.js';
import { CellQueryEngine } from './core/CellQueryEngine.js';
import { CanvasManager } from './canvas/CanvasManager.js';
import { Renderer } from './canvas/Renderer.js';
import { EventBinder } from './events/EventBinder.js';
import { EventHandlers } from './events/EventHandlers.js';
import { GlyphUtilities } from './glyphs/GlyphUtilities.js';

export class ScreenGridLayerGL {
  /**
   * Create a new ScreenGrid layer
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    // Configuration
    this.config = ConfigManager.create(options);

    // Components
    this.projector = new Projector();
    this.aggregator = new Aggregator();
    this.cellQueryEngine = new CellQueryEngine();
    this.canvasManager = new CanvasManager();
    this.renderer = new Renderer();
    this.eventBinder = new EventBinder();

    // Internal state
    this.map = null;
    this.gl = null;
    this.pointsProjected = [];
    this.gridData = null;
  }

  // ============ MapLibre GL Interface ============

  get id() {
    return this.config.id;
  }

  get type() {
    return 'custom';
  }

  get renderingMode() {
    return '2d';
  }

  // ============ Lifecycle Hooks ============

  /**
   * Called when layer is added to map
   */
  onAdd(map, gl) {
    this.map = map;
    this.gl = gl;

    try {
      // Initialize canvas
      this.canvasManager.init(map);

      // Bind events
      this.eventBinder.bind(map, {
        handleHover: (e) => this._handleHover(e),
        handleClick: (e) => this._handleClick(e),
        handleZoom: () => this._handleZoom(),
        handleMove: () => this._handleMove(),
      });

      // Project initial data
      this._projectPoints();

      console.log('ScreenGridLayerGL added to map');
    } catch (error) {
      console.error('Error adding ScreenGridLayerGL to map:', error);
    }
  }

  /**
   * Called before each render
   */
  prerender() {
    this._projectPoints();
  }

  /**
   * Called when layer is removed from map
   */
  onRemove() {
    this.eventBinder.unbind();
    this.canvasManager.cleanup();

    this.map = null;
    this.pointsProjected = [];
    this.gridData = null;

    console.log('ScreenGridLayerGL removed from map');
  }

  /**
   * Called to render the layer
   */
  render() {
    if (!this.config.enabled || !this.canvasManager.getContext()) {
      return;
    }

    this._aggregate();
    this._draw();
  }

  // ============ Data & Config Management ============

  /**
   * Update data
   * @param {Array} newData - New data array
   */
  setData(newData) {
    this.config = ConfigManager.update(this.config, { data: newData });
    this._projectPoints();
  }

  /**
   * Update configuration
   * @param {Object} updates - Partial configuration updates
   */
  setConfig(updates) {
    this.config = ConfigManager.update(this.config, updates);
    this._projectPoints();
  }

  // ============ Public Query Methods ============

  /**
   * Get cell information at a point
   * @param {Object} point - {x, y}
   * @returns {Object|null} Cell information
   */
  getCellAt(point) {
    return this.cellQueryEngine.getCellAt(point);
  }

  /**
   * Get cells in a rectangular region
   * @param {Object} bounds - {minX, minY, maxX, maxY}
   * @returns {Array} Cells in bounds
   */
  getCellsInBounds(bounds) {
    return this.cellQueryEngine.getCellsInBounds(bounds);
  }

  /**
   * Get grid statistics
   * @returns {Object} Grid statistics
   */
  getGridStats() {
    if (!this.gridData) return null;
    return this.aggregator.getStats(this.gridData);
  }

  // ============ Internal Methods ============

  /**
   * Project geographic coordinates to screen space
   * @private
   */
  _projectPoints() {
    if (!this.map) return;

    this.pointsProjected = Projector.projectPoints(
      this.config.data,
      this.config.getPosition,
      this.config.getWeight,
      this.map
    );
  }

  /**
   * Aggregate points into grid
   * @private
   */
  _aggregate() {
    if (!this.map) return;

    const { width, height } = this.canvasManager.getDisplaySize();

    this.gridData = Aggregator.aggregate(
      this.pointsProjected,
      this.config.data,
      width,
      height,
      this.config.cellSizePixels
    );

    // Update cell query engine
    this.cellQueryEngine.setAggregationResult(this.gridData);

    // Trigger callback
    if (this.config.onAggregate) {
      this.config.onAggregate(this.gridData);
    }
  }

  /**
   * Draw grid to canvas
   * @private
   */
  _draw() {
    const ctx = this.canvasManager.getContext();
    const config = {
      colorScale: this.config.colorScale,
      enableGlyphs: this.config.enableGlyphs,
      onDrawCell: this.config.onDrawCell,
      glyphSize: this.config.glyphSize,
    };

    Renderer.render(this.gridData, ctx, config);
  }

  /**
   * Handle hover event
   * @private
   */
  _handleHover(e) {
    EventHandlers.handleHover(e, this.cellQueryEngine, this.config.onHover);
  }

  /**
   * Handle click event
   * @private
   */
  _handleClick(e) {
    EventHandlers.handleClick(e, this.cellQueryEngine, this.config.onClick);
  }

  /**
   * Handle zoom event
   * @private
   */
  _handleZoom() {
    EventHandlers.handleZoom(this.map, this.config, () => {
      this._projectPoints();
    });
  }

  /**
   * Handle move event
   * @private
   */
  _handleMove() {
    EventHandlers.handleMove(() => {
      this._projectPoints();
    });
  }

  // ============ Static Glyph Utilities ============

  static drawCircleGlyph = GlyphUtilities.drawCircleGlyph;
  static drawBarGlyph = GlyphUtilities.drawBarGlyph;
  static drawPieGlyph = GlyphUtilities.drawPieGlyph;
  static drawScatterGlyph = GlyphUtilities.drawScatterGlyph;
  static drawDonutGlyph = GlyphUtilities.drawDonutGlyph;
  static drawHeatmapGlyph = GlyphUtilities.drawHeatmapGlyph;
  static drawRadialBarGlyph = GlyphUtilities.drawRadialBarGlyph;
}
