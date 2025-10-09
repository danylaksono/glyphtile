// ============================================================================
// ScreenGridLayerGL
// Author: Dany Laksono style architecture reference
// GPU/Canvas hybrid Screen-Space Grid Aggregation for MapLibre GL JS
// ============================================================================

export class ScreenGridLayerGL {
    constructor(options = {}) {
      // Default configuration
      this.config = {
        id: options.id || "screen-grid-layer",
        data: options.data || [],
        getPosition: options.getPosition || ((d) => d.coordinates),
        getWeight: options.getWeight || (() => 1),
        cellSizePixels: options.cellSizePixels || 50,
        colorScale: options.colorScale || ((v) => [255 * v, 100, 200, 200]),
        onAggregate: options.onAggregate || null,
        onHover: options.onHover || null,
        onClick: options.onClick || null,
        onDrawCell: options.onDrawCell || null,
        enableGlyphs: options.enableGlyphs || false,
        glyphSize: options.glyphSize || 0.8,
        adaptiveCellSize: options.adaptiveCellSize || false,
        minCellSize: options.minCellSize || 20,
        maxCellSize: options.maxCellSize || 100,
        zoomBasedSize: options.zoomBasedSize || false,
        enabled: true,
      };
  
      // Internal references
      this.map = null;
      this.gl = null;
      this.ctx = null;
      this.pointsProjected = [];
      this.grid = null;
    }
  
    // ============ Core MapLibre Interface ============
    get id() {
      return this.config.id;
    }
  
    get type() {
      return "custom";
    }
  
    get renderingMode() {
      return "2d";
    }

    // ============ Lifecycle Hooks ============
    onAdd(map, gl) {
      this.map = map;
      this.gl = gl;

      // For 2D rendering in MapLibre GL JS, we use the canvas directly
      // The canvas is the WebGL canvas, but we need to create our own 2D overlay
      const canvas = map.getCanvas();
      if (!canvas) {
        console.error('Canvas not available');
        return;
      }

      // Create a 2D canvas overlay for our grid rendering
      const overlayCanvas = document.createElement('canvas');
      overlayCanvas.style.position = 'absolute';
      overlayCanvas.style.top = '0';
      overlayCanvas.style.left = '0';
      overlayCanvas.style.pointerEvents = 'none';

      // Insert the overlay canvas into the map container
      const container = map.getContainer();
      container.appendChild(overlayCanvas);

      this.overlayCanvas = overlayCanvas;
      this.ctx = overlayCanvas.getContext("2d");
      if (!this.ctx) {
        console.error('Could not get 2D context from overlay canvas');
        return;
      }
      
      console.log('ScreenGridLayerGL added to map', {
        canvasSize: { width: canvas.width, height: canvas.height },
        devicePixelRatio: window.devicePixelRatio
      });
      
      // Ensure overlay canvas matches map canvas size initially and on resize
      this._resizeOverlayCanvas();
      this._setupResizeObserver();

      this._bindEvents();
      this._projectPoints();
    }

    _setupResizeObserver() {
      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          if (entry.target === this.map.getCanvas()) {
            this._resizeOverlayCanvas();
          }
        }
      });

      resizeObserver.observe(this.map.getCanvas());
      this.resizeObserver = resizeObserver;
    }

    _resizeOverlayCanvas() {
      const canvas = this.map.getCanvas();
      const rect = canvas.getBoundingClientRect();

      // Update overlay canvas size
      this.overlayCanvas.width = rect.width * window.devicePixelRatio;
      this.overlayCanvas.height = rect.height * window.devicePixelRatio;
      this.overlayCanvas.style.width = rect.width + 'px';
      this.overlayCanvas.style.height = rect.height + 'px';

      // Reset transform then scale so drawing uses CSS pixels
      const dpr = window.devicePixelRatio || 1;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    render() {
      if (!this.config.enabled || !this.ctx) {
        console.log('Grid layer disabled or context not available, skipping render');
        return;
      }
      console.log('Rendering grid layer');
      this._aggregate();
      this._draw();
    }
  
    prerender() {
      // Reproject before each draw if view changes
      this._projectPoints();
    }
  
    onRemove() {
      this._unbindEvents();

      // Clean up overlay canvas
      if (this.overlayCanvas && this.overlayCanvas.parentNode) {
        this.overlayCanvas.parentNode.removeChild(this.overlayCanvas);
      }

      // Clean up resize observer
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      }

      this.overlayCanvas = null;
      this.ctx = null;
      this.resizeObserver = null;
    }
  
    // ============ Data and Config Updates ============
    setData(newData) {
      this.config.data = newData;
      this._projectPoints();
    }
  
    setConfig(params) {
      Object.assign(this.config, params);
      this._projectPoints();
    }
  
    // ============ Internal Logic ============
  
    _projectPoints() {
      if (!this.map || !this.overlayCanvas) return;

      const { data, getPosition, getWeight } = this.config;

      console.log('Projecting points:', {
        dataLength: data.length,
        overlayCanvasSize: { width: this.overlayCanvas.width, height: this.overlayCanvas.height }
      });

      this.pointsProjected = data.map((d, i) => {
        const [lng, lat] = getPosition(d);
        const p = this.map.project([lng, lat]);
        const x = p.x; // MapLibre returns pixels relative to map container
        const y = p.y;

        if (i < 3) {
          console.log(`Point ${i}:`, { lng, lat, projected: p, transformed: { x, y } });
        }

        return { x: x, y: y, w: getWeight(d) };
      });

      console.log('Points projected:', {
        total: this.pointsProjected.length,
        samplePoints: this.pointsProjected.slice(0, 3)
      });
    }
  
    _aggregate() {
      if (!this.map || !this.overlayCanvas) return;

      const dpr = window.devicePixelRatio || 1;
      const width = this.overlayCanvas.width / dpr;
      const height = this.overlayCanvas.height / dpr;
      const { cellSizePixels } = this.config;

      const cols = Math.ceil(width / cellSizePixels);
      const rows = Math.ceil(height / cellSizePixels);
      const grid = new Array(rows * cols).fill(0);
      const cellData = new Array(rows * cols).fill(null).map(() => []);

      console.log('Aggregating points:', {
        totalPoints: this.pointsProjected.length,
        canvasSize: { width, height },
        cellSize: cellSizePixels,
        gridSize: { cols, rows }
      });

      for (let i = 0; i < this.pointsProjected.length; i++) {
        const p = this.pointsProjected[i];
        const col = Math.floor(p.x / cellSizePixels);
        const row = Math.floor(p.y / cellSizePixels);
        if (col >= 0 && col < cols && row >= 0 && row < rows) {
          const idx = row * cols + col;
          grid[idx] += p.w;
          // Store original data point for glyph rendering
          cellData[idx].push({
            data: this.config.data[i],
            weight: p.w,
            projectedX: p.x,
            projectedY: p.y
          });
        }
      }

      const cellsWithData = grid.filter(v => v > 0).length;
      console.log('Grid aggregation complete:', {
        cellsWithData,
        maxValue: Math.max(...grid),
        totalValue: grid.reduce((sum, v) => sum + v, 0)
      });

      this.grid = {
        grid,
        cellData,
        cols,
        rows,
        width,
        height,
        cellSizePixels
      };
      if (this.config.onAggregate) this.config.onAggregate(this.grid);
    }
  
    _draw() {
      if (!this.grid || !this.ctx) {
        console.log('No grid data or context available for drawing');
        return;
      }

      const { grid, cellData, cols, rows, cellSizePixels } = this.grid;
      const { colorScale, enableGlyphs, onDrawCell, glyphSize } = this.config;
      const ctx = this.ctx;
      const maxVal = Math.max(...grid);

      console.log('Drawing grid:', { cols, rows, maxVal, cellsWithData: grid.filter(v => v > 0).length });

      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, this.overlayCanvas.width / dpr, this.overlayCanvas.height / dpr);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const val = grid[idx];
          if (val > 0) {
            const x = c * cellSizePixels;
            const y = r * cellSizePixels;
            const norm = val / maxVal;

            if (enableGlyphs && onDrawCell) {
              // Draw glyph using custom callback
              const cellCenterX = x + cellSizePixels / 2;
              const cellCenterY = y + cellSizePixels / 2;
              const glyphRadius = (cellSizePixels * glyphSize) / 2;
              
              ctx.save();
              onDrawCell(ctx, cellCenterX, cellCenterY, norm, {
                cellData: cellData[idx],
                cellSize: cellSizePixels,
                glyphRadius: glyphRadius,
                col: c,
                row: r,
                value: val,
                normalizedValue: norm
              });
              ctx.restore();
            } else {
              // Traditional color-based rendering
              const [rC, gC, bC, aC] = colorScale(norm);
              ctx.fillStyle = `rgba(${rC}, ${gC}, ${bC}, ${aC / 255})`;
              ctx.fillRect(x, y, cellSizePixels, cellSizePixels);
            }
          }
        }
      }
    }
  
    _bindEvents() {
      this._onMouseMove = (e) => this._handleHover(e);
      this._onClick = (e) => this._handleClick(e);
      this._onZoom = () => this._handleZoom();
      this._onMove = () => this._handleMove();

      // Bind to map events (points are relative to map container)
      this.map.on("mousemove", this._onMouseMove);
      this.map.on("click", this._onClick);

      // Keep map events for zoom and move
      this.map.on("zoom", this._onZoom);
      this.map.on("move", this._onMove);
    }
  
    _unbindEvents() {
      this.map.off("mousemove", this._onMouseMove);
      this.map.off("click", this._onClick);
      this.map.off("zoom", this._onZoom);
      this.map.off("move", this._onMove);
    }
  
    _handleHover(e) {
      if (!this.config.onHover || !this.grid || !this.map || !this.overlayCanvas) return;

      // Map event points are already relative to map container
      const overlayX = e.point.x;
      const overlayY = e.point.y;

      const cell = this._getCellAt({ x: overlayX, y: overlayY });
      if (cell) this.config.onHover({ cell, event: e });
    }

    _handleClick(e) {
      if (!this.config.onClick || !this.grid || !this.map || !this.overlayCanvas) return;

      // Map event points are already relative to map container
      const overlayX = e.point.x;
      const overlayY = e.point.y;

      const cell = this._getCellAt({ x: overlayX, y: overlayY });
      if (cell) this.config.onClick({ cell, event: e });
    }

    _handleZoom() {
      if (!this.map) return;

      if (this.config.zoomBasedSize) {
        this._updateCellSizeBasedOnZoom();
      }
      this._projectPoints();
    }

    _handleMove() {
      if (!this.map) return;
      this._projectPoints();
    }

    _updateCellSizeBasedOnZoom() {
      if (!this.map) return;

      const zoom = this.map.getZoom();
      const baseZoom = 11;
      const zoomFactor = Math.pow(2, zoom - baseZoom);
      const newCellSize = Math.max(
        this.config.minCellSize,
        Math.min(this.config.maxCellSize, this.config.cellSizePixels / zoomFactor)
      );

      if (Math.abs(newCellSize - this.config.cellSizePixels) > 1) {
        this.config.cellSizePixels = newCellSize;
      }
    }
  
    _getCellAt(point) {
      if (!this.grid || !this.overlayCanvas) return null;

      const { grid, cellData, cols, rows, width, height } = this.grid;
      const { cellSizePixels } = this.config;
      const col = Math.floor(point.x / cellSizePixels);
      const row = Math.floor(point.y / cellSizePixels);
      if (col < 0 || col >= cols || row < 0 || row >= rows) return null;
      const idx = row * cols + col;
      return { 
        col, 
        row, 
        value: grid[idx], 
        cellData: cellData[idx],
        x: col * cellSizePixels, 
        y: row * cellSizePixels 
      };
    }

    // ============ Utility Methods for Glyph Drawing ============
    
    /**
     * Draw a simple circle glyph
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
     */
    static drawBarGlyph(ctx, x, y, values, maxValue, cellSize, colors = ['#ff6b6b', '#4ecdc4', '#45b7d1']) {
      const barWidth = cellSize / values.length;
      const maxHeight = cellSize * 0.8;
      
      values.forEach((value, i) => {
        const barHeight = (value / maxValue) * maxHeight;
        const barX = x - cellSize/2 + i * barWidth;
        const barY = y + maxHeight/2 - barHeight;
        
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(barX, barY, barWidth * 0.8, barHeight);
      });
    }

    /**
     * Draw a pie chart glyph
     */
    static drawPieGlyph(ctx, x, y, values, radius, colors = ['#ff6b6b', '#4ecdc4', '#45b7d1']) {
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
     */
    static drawScatterGlyph(ctx, x, y, points, cellSize, color = '#ff0000') {
      const maxRadius = cellSize * 0.3;
      const minRadius = 2;
      
      points.forEach(point => {
        const normalizedWeight = Math.max(0.1, point.weight);
        const radius = minRadius + (normalizedWeight * (maxRadius - minRadius));
        const alpha = Math.min(0.8, normalizedWeight);
        
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  }
  