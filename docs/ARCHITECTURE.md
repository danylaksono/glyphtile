# ScreenGrid Library - Modular Architecture

## Overview

The refactored ScreenGrid library follows **clean architecture principles** with separated concerns and modular design. The monolithic `screengrid.js` has been decomposed into focused, reusable modules.

## Directory Structure

```
src/
├── index.js                              # Main export file
├── ScreenGridLayerGL.js                  # Orchestrator class (~220 lines)
│
├── config/
│   └── ConfigManager.js                  # Configuration management
│
├── core/
│   ├── Aggregator.js                     # Grid aggregation (pure logic)
│   ├── Projector.js                      # Coordinate projection
│   └── CellQueryEngine.js                # Cell queries & spatial analysis
│
├── canvas/
│   ├── CanvasManager.js                  # Canvas lifecycle & sizing
│   └── Renderer.js                       # Drawing logic
│
├── events/
│   ├── EventBinder.js                    # Event attachment/detachment
│   └── EventHandlers.js                  # Event handler implementations
│
└── glyphs/
    └── GlyphUtilities.js                 # Reusable glyph drawing functions
```

## Module Descriptions

### `config/ConfigManager.js`

**Purpose:** Centralized configuration management

**Key Methods:**
- `ConfigManager.create(options)` - Create config from options with defaults
- `ConfigManager.update(config, updates)` - Merge updates into existing config
- `ConfigManager.isValid(config)` - Validate configuration structure

**Usage:**
```javascript
import { ConfigManager } from 'screengrid';

const config = ConfigManager.create({
  data: myData,
  cellSizePixels: 50,
  colorScale: (v) => [255 * v, 100, 200, 200]
});

// Update config later
const updated = ConfigManager.update(config, { cellSizePixels: 75 });
```

**Benefits:**
- Single source of truth for defaults
- Easy to add configuration validation
- Consistent configuration structure

---

### `core/Projector.js`

**Purpose:** Transform geographic coordinates to screen space

**Key Methods:**
- `Projector.projectPoints(data, getPosition, getWeight, map)` - Static method
- Instance methods for convenience

**Usage:**
```javascript
import { Projector } from 'screengrid';

const projector = new Projector(map);
const projected = projector.project(
  data,
  (d) => d.coordinates,
  (d) => d.weight
);
// Returns: [{x, y, w}, {x, y, w}, ...]
```

**Benefits:**
- Pure function (no side effects)
- Reusable for other visualizations
- Easy to test in isolation

---

### `core/Aggregator.js`

**Purpose:** Pure grid aggregation logic

**Key Methods:**
- `Aggregator.aggregate(projectedPoints, originalData, width, height, cellSize)` - Static
- `getStats(aggregationResult)` - Get grid statistics

📖 **For detailed explanation of the aggregation and normalization process, see [API_REFERENCE.md](./API_REFERENCE.md#data-normalization-and-aggregation-procedure)**

**Usage:**
```javascript
import { Aggregator } from 'screengrid';

const aggregator = new Aggregator();
const result = aggregator.aggregate(
  projectedPoints,      // [{x, y, w}, ...]
  data,                 // Original data array
  800,                  // Canvas width
  600,                  // Canvas height
  50                    // Cell size
);

// Result contains:
// {
//   grid: [0, 5, 10, ...],           // Aggregated values
//   cellData: [[], [item1, ...], ...], // Raw data per cell
//   cols: 16,
//   rows: 12,
//   ...
// }

const stats = aggregator.getStats(result);
// Returns: {totalCells, cellsWithData, maxValue, minValue, avgValue, totalValue}
```

**Benefits:**
- Zero dependencies on UI/Canvas
- Pure algorithm - easily unit tested
- Reusable in any context (server-side, different UI)

---

### `core/CellQueryEngine.js`

**Purpose:** Spatial queries on the aggregated grid

**Key Methods:**
- `CellQueryEngine.getCellAt(aggregationResult, point)` - Get cell at position
- `getCellsInBounds(aggregationResult, bounds)` - Get cells in rectangle
- `getCellsAboveThreshold(aggregationResult, threshold)` - Filter by value

**Usage:**
```javascript
import { CellQueryEngine } from 'screengrid';

const engine = new CellQueryEngine(aggregationResult);

// Get cell at mouse position
const cell = engine.getCellAt({x: 100, y: 200});
// Returns: {col, row, value, cellData, x, y, cellSize, index}

// Get all cells in a region
const cells = engine.getCellsInBounds({
  minX: 0, minY: 0, maxX: 400, maxY: 300
});

// Get high-value cells
const hotspots = engine.getCellsAboveThreshold(50);
```

**Benefits:**
- Enables interactive queries without tight coupling
- Foundation for hover/click interactions
- Enables custom filtering logic

---

### `canvas/CanvasManager.js`

**Purpose:** Canvas lifecycle management (create, resize, cleanup, DPI handling)

**Key Methods:**
- `init(map)` - Initialize overlay canvas on map
- `getContext()` - Get 2D rendering context
- `resize()` - Handle canvas resizing with DPI scaling
- `clear()` - Clear canvas content
- `getDisplaySize()` - Get canvas dimensions in CSS pixels
- `cleanup()` - Remove canvas and cleanup observers

**Usage:**
```javascript
import { CanvasManager } from 'screengrid';

const canvasManager = new CanvasManager();
canvasManager.init(map);

const ctx = canvasManager.getContext();
ctx.fillStyle = 'red';
ctx.fillRect(10, 10, 50, 50);

// Automatically handles resize
// On cleanup:
canvasManager.cleanup();
```

**Benefits:**
- Isolates DOM manipulation
- Handles DPI scaling automatically
- ResizeObserver for responsive sizing
- Clean lifecycle management

---

### `canvas/Renderer.js`

**Purpose:** Draw grid cells (color-based or glyph-based)

**Key Methods:**
- `Renderer.render(aggregationResult, ctx, config)` - Render grid
- `renderGlyphs(aggregationResult, ctx, onDrawCell, glyphSize)` - Glyph mode
- `renderColors(aggregationResult, ctx, colorScale)` - Color mode

**Usage:**
```javascript
import { Renderer } from 'screengrid';

const renderer = new Renderer();

// Color-based rendering
renderer.renderColors(aggregationResult, ctx, (value) => {
  return [255 * value, 100, 200, 200]; // [r, g, b, a]
});

// Custom glyph rendering
renderer.renderGlyphs(
  aggregationResult,
  ctx,
  (ctx, x, y, normVal, cellInfo) => {
    // Draw custom visualization
    ctx.fillStyle = 'blue';
    ctx.fillRect(x - 10, y - 10, 20, 20);
  },
  0.8 // glyphSize
);
```

**Benefits:**
- Separated from canvas management
- Supports multiple rendering modes
- Error handling for custom callbacks
- Reusable rendering logic

---

### `events/EventHandlers.js`

**Purpose:** Event handler implementations

**Key Methods:**
- `EventHandlers.handleHover(event, cellQueryEngine, onHover)`
- `handleClick(event, cellQueryEngine, onClick)`
- `handleZoom(map, config, onZoom)`
- `handleMove(onMove)`

**Usage:**
```javascript
import { EventHandlers } from 'screengrid';

// Hover handling
EventHandlers.handleHover(
  mapLibreEvent,
  cellQueryEngine,
  ({cell, event}) => {
    console.log('Hovered cell:', cell);
  }
);

// Zoom handling with cell size adjustment
EventHandlers.handleZoom(map, config, () => {
  console.log('Map zoomed');
});
```

**Benefits:**
- Pure event logic (testable)
- Decoupled from rendering
- Reusable event handlers
- Easy to test independently

---

### `events/EventBinder.js`

**Purpose:** Manage event attachment and detachment

**Key Methods:**
- `bind(map, eventHandlers)` - Attach events to map
- `unbind()` - Detach all events
- `bindEvent(eventName, handler)` - Bind specific event
- `unbindEvent(eventName)` - Unbind specific event

**Usage:**
```javascript
import { EventBinder } from 'screengrid';

const binder = new EventBinder();
binder.bind(map, {
  handleHover: (e) => console.log('hover'),
  handleClick: (e) => console.log('click'),
  handleZoom: () => console.log('zoom'),
  handleMove: () => console.log('move')
});

// Later, unbind
binder.unbind();
```

**Benefits:**
- Clean event lifecycle
- Prevents memory leaks
- Easy to add/remove events dynamically

---

### `glyphs/GlyphUtilities.js`

**Purpose:** Reusable glyph drawing functions

**Key Methods:**
- `GlyphUtilities.drawCircleGlyph(ctx, x, y, radius, color, alpha)`
- `drawBarGlyph(ctx, x, y, values, maxValue, cellSize, colors)`
- `drawPieGlyph(ctx, x, y, values, radius, colors)`
- `drawScatterGlyph(ctx, x, y, points, cellSize, color)`
- `drawDonutGlyph(ctx, x, y, values, outerRadius, innerRadius, colors)` ✨ NEW
- `drawHeatmapGlyph(ctx, x, y, radius, normalizedValue, colorScale)` ✨ NEW
- `drawRadialBarGlyph(ctx, x, y, values, maxValue, maxRadius, color)` ✨ NEW

**Usage:**
```javascript
import { GlyphUtilities } from 'screengrid';

// Use in custom glyph drawing
const onDrawCell = (ctx, x, y, normVal, cellInfo) => {
  GlyphUtilities.drawCircleGlyph(ctx, x, y, 15, '#ff0000', 0.8);
};

// Or use directly
GlyphUtilities.drawPieGlyph(ctx, 100, 100, [30, 20, 10], 20, ['red', 'green', 'blue']);
```

**Benefits:**
- Pre-built visualizations
- Consistent glyph styling
- Highly reusable
- Easy to extend with new glyph types

---

## ScreenGridLayerGL - Orchestrator

**Purpose:** Main class that composes all modules

**Key Methods:**
- `constructor(options)` - Create layer
- `onAdd(map, gl)` - MapLibre lifecycle
- `render()` - Render the layer
- `onRemove()` - Cleanup
- `setData(newData)` - Update data
- `setConfig(updates)` - Update config
- `getCellAt(point)` - Query cell
- `getCellsInBounds(bounds)` - Query region
- `getGridStats()` - Get statistics

**Usage (Unchanged from user perspective):**
```javascript
import { ScreenGridLayerGL } from 'screengrid';

const gridLayer = new ScreenGridLayerGL({
  data: myData,
  getPosition: (d) => d.coordinates,
  getWeight: (d) => d.weight,
  cellSizePixels: 50
});

map.addLayer(gridLayer);
```

**Benefits:**
- Clean, focused class
- Easy to understand
- Composition over inheritance
- Simple to test (mocks each component)

---

## Advanced Usage Examples

### Using Core Modules Independently

```javascript
import { Projector, Aggregator, CellQueryEngine } from 'screengrid';

// Use aggregation without rendering
const projector = new Projector(map);
const projected = projector.project(data, getPos, getWeight);

const aggregator = new Aggregator();
const result = aggregator.aggregate(projected, data, 800, 600, 50);

// Query results
const engine = new CellQueryEngine(result);
const stats = aggregator.getStats(result);

console.log(`Grid has ${stats.cellsWithData} cells with data`);
```

### Custom Rendering

```javascript
import { Renderer, GlyphUtilities } from 'screengrid';

const renderer = new Renderer();
renderer.renderGlyphs(result, ctx, (ctx, x, y, normVal, cellInfo) => {
  // Use multiple glyphs
  GlyphUtilities.drawCircleGlyph(ctx, x, y, 10, '#ff0000', normVal);
  GlyphUtilities.drawRadialBarGlyph(
    ctx, x, y,
    cellInfo.cellData.map(d => d.weight),
    Math.max(...cellInfo.cellData.map(d => d.weight)),
    15,
    '#ffffff'
  );
});
```

### Dynamic Event Binding

```javascript
import { EventBinder, EventHandlers, CellQueryEngine } from 'screengrid';

const binder = new EventBinder();
const engine = new CellQueryEngine(aggregationResult);

binder.bind(map, {
  handleHover: (e) => {
    const cell = engine.getCellAt({x: e.point.x, y: e.point.y});
    if (cell) updateTooltip(cell);
  },
  handleClick: (e) => { /* ... */ },
  handleZoom: () => { /* ... */ },
  handleMove: () => { /* ... */ }
});
```

---

## Benefits of Modular Architecture

| Aspect | Before | After |
|--------|--------|-------|
| **File Size** | 470 lines | 50-120 lines per module |
| **Single Responsibility** | Multiple per class | One per module |
| **Testability** | Hard to isolate logic | Pure functions, easy to test |
| **Reusability** | Tied to ScreenGridLayerGL | Modules reusable independently |
| **Maintainability** | Large monolith | Clear, focused modules |
| **Extensibility** | Hard to extend | Easy to add features |
| **Coupling** | High inter-dependencies | Loose coupling via composition |
| **Code Cohesion** | Mixed concerns | High cohesion per module |

---

## Migration from Old Code

### For Users of the Library

**No changes needed!** The public API is identical:

```javascript
// This still works exactly the same
import { ScreenGridLayerGL } from 'screengrid';

const layer = new ScreenGridLayerGL(options);
map.addLayer(layer);
```

### For Library Developers

**New options for advanced usage:**

```javascript
// Import individual modules
import { Aggregator, Projector, CellQueryEngine } from 'screengrid';

// Use modules independently
const agg = new Aggregator();
const result = agg.aggregate(...);
```

---

## Testing Strategy

### Unit Tests by Module

```javascript
// test/core/Aggregator.test.js
import { Aggregator } from 'screengrid';

describe('Aggregator', () => {
  it('should aggregate points correctly', () => {
    const result = Aggregator.aggregate(
      [{x: 10, y: 10, w: 1}],
      data,
      100, 100, 50
    );
    expect(result.grid[0]).toBe(1);
  });
});
```

### Integration Tests

```javascript
// test/ScreenGridLayerGL.integration.test.js
import { ScreenGridLayerGL } from 'screengrid';

describe('ScreenGridLayerGL', () => {
  it('should render grid on map', () => {
    const layer = new ScreenGridLayerGL(options);
    map.addLayer(layer);
    expect(layer.gridData).toBeDefined();
  });
});
```

---

## Future Enhancements

The modular structure enables:

1. **Plugin System** - Load custom renderers/glyphs
2. **Server-side Aggregation** - Use `Aggregator` on backend
3. **Alternative Renderers** - WebGL renderer via separate module
4. **Extended Glyphs** - Community glyph library
5. **Performance Optimizations** - Optimize individual modules
6. **Framework Adapters** - React, Vue bindings

---

## Summary

The refactored ScreenGrid library provides:

✅ **Modularity** - Independent, composable modules  
✅ **Testability** - Pure functions, easy unit tests  
✅ **Reusability** - Use modules anywhere  
✅ **Maintainability** - Clear separation of concerns  
✅ **Extensibility** - Easy to add features  
✅ **Backward Compatibility** - Public API unchanged  

This architecture follows SOLID principles and makes the codebase more professional and sustainable for long-term development.
