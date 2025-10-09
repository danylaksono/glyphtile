# ScreenGrid Library

A GPU/Canvas hybrid Screen-Space Grid Aggregation library for MapLibre GL JS. This library provides efficient real-time aggregation of point data into screen-space grids with customizable styling and interactive features.

## Features

- **Real-time Aggregation**: Efficiently aggregates point data into screen-space grids
- **Customizable Styling**: Flexible color scales and cell sizing
- **Interactive Events**: Hover and click handlers for grid cells
- **Glyph Drawing**: Custom glyph rendering with Canvas 2D for advanced visualizations
- **MapLibre Integration**: Seamless integration with MapLibre GL JS
- **Performance Optimized**: Uses Canvas 2D rendering for optimal performance
- **Responsive Design**: Automatically adjusts to map viewport changes
- **Zoom-based Sizing**: Dynamic cell size adjustment based on zoom level
- **Multi-attribute Visualization**: Support for visualizing multiple data attributes per cell

## Installation

### Option 1: Direct Download
Download the `screengrid.js` file and include it in your project.

### Option 2: ES6 Module
```javascript
import { ScreenGridLayerGL } from './screengrid.js';
```

## Quick Start

### Basic Usage

```javascript
import { ScreenGridLayerGL } from './screengrid.js';

// Initialize MapLibre map
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json',
  center: [-122.4, 37.74],
  zoom: 11
});

map.on('load', async () => {
  // Load your data
  const data = await fetch('your-data.json').then(r => r.json());
  
  // Create grid layer
  const gridLayer = new ScreenGridLayerGL({
    data: data,
    getPosition: (d) => d.coordinates,
    getWeight: (d) => d.weight,
    cellSizePixels: 60,
    colorScale: (v) => [255 * v, 200 * (1 - v), 50, 220]
  });
  
  // Add to map
  map.addLayer(gridLayer);
});
```

### HTML Example

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/maplibre-gl@4.0.0/dist/maplibre-gl.js"></script>
  <link href="https://unpkg.com/maplibre-gl@4.0.0/dist/maplibre-gl.css" rel="stylesheet" />
</head>
<body>
  <div id="map" style="width: 100%; height: 400px;"></div>
  <script type="module">
    import { ScreenGridLayerGL } from './screengrid.js';
    // ... your code here
  </script>
</body>
</html>
```

## API Reference

### ScreenGridLayerGL

#### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | string | `"screen-grid-layer"` | Unique identifier for the layer |
| `data` | Array | `[]` | Array of data points to aggregate |
| `getPosition` | Function | `(d) => d.coordinates` | Function to extract coordinates from data |
| `getWeight` | Function | `() => 1` | Function to extract weight from data |
| `cellSizePixels` | number | `50` | Size of each grid cell in pixels |
| `colorScale` | Function | `(v) => [255 * v, 100, 200, 200]` | Color scale function |
| `onAggregate` | Function | `null` | Callback when grid is aggregated |
| `onHover` | Function | `null` | Callback when hovering over cells |
| `onClick` | Function | `null` | Callback when clicking cells |
| `onDrawCell` | Function | `null` | Callback for custom glyph drawing |
| `enableGlyphs` | boolean | `false` | Enable glyph-based rendering |
| `glyphSize` | number | `0.8` | Size of glyphs relative to cell size |
| `adaptiveCellSize` | boolean | `false` | Enable adaptive cell sizing |
| `minCellSize` | number | `20` | Minimum cell size in pixels |
| `maxCellSize` | number | `100` | Maximum cell size in pixels |
| `zoomBasedSize` | boolean | `false` | Adjust cell size based on zoom level |
| `enabled` | boolean | `true` | Whether the layer is enabled |

#### Methods

##### `setData(newData)`
Updates the data source for the layer.

```javascript
gridLayer.setData(newDataArray);
```

##### `setConfig(params)`
Updates layer configuration.

```javascript
gridLayer.setConfig({
  cellSizePixels: 80,
  colorScale: (v) => [255 * v, 0, 0, 200]
});
```

#### Event Callbacks

##### `onAggregate(grid)`
Called when the grid is aggregated. Receives grid object with:
- `grid`: Array of aggregated values
- `cols`: Number of columns
- `rows`: Number of rows
- `width`: Canvas width
- `height`: Canvas height

##### `onHover({ cell, event })`
Called when hovering over a grid cell. Receives:
- `cell`: Object with `col`, `row`, `value`, `x`, `y`
- `event`: MapLibre mouse event

##### `onClick({ cell, event })`
Called when clicking a grid cell. Receives same parameters as `onHover`.

##### `onDrawCell(ctx, x, y, normVal, cellInfo)`
Called for each cell when `enableGlyphs` is true. Receives:
- `ctx`: Canvas 2D rendering context
- `x`, `y`: Center coordinates of the cell
- `normVal`: Normalized value (0-1) for the cell
- `cellInfo`: Object containing:
  - `cellData`: Array of original data points in this cell
  - `cellSize`: Size of the cell in pixels
  - `glyphRadius`: Recommended radius for glyph drawing
  - `col`, `row`: Grid coordinates
  - `value`: Raw aggregated value
  - `normalizedValue`: Normalized value (0-1)

## Glyph Drawing

The library supports custom glyph drawing through the `onDrawCell` callback. This allows you to create rich visualizations that go beyond simple color encoding.

### Built-in Glyph Utilities

The library includes several utility methods for common glyph patterns:

```javascript
// Circle glyph
ScreenGridLayerGL.drawCircleGlyph(ctx, x, y, radius, color, alpha);

// Bar chart glyph
ScreenGridLayerGL.drawBarGlyph(ctx, x, y, values, maxValue, cellSize, colors);

// Pie chart glyph
ScreenGridLayerGL.drawPieGlyph(ctx, x, y, values, radius, colors);

// Scatter plot glyph
ScreenGridLayerGL.drawScatterGlyph(ctx, x, y, points, cellSize, color);
```

### Custom Glyph Example

```javascript
const gridLayer = new ScreenGridLayerGL({
  data: bikeData,
  getPosition: (d) => d.COORDINATES,
  getWeight: (d) => d.SPACES,
  enableGlyphs: true,
  onDrawCell: (ctx, x, y, normVal, cellInfo) => {
    const { cellData, glyphRadius } = cellInfo;
    
    // Calculate aggregated values
    const totalRacks = cellData.reduce((sum, item) => sum + item.data.RACKS, 0);
    const totalSpaces = cellData.reduce((sum, item) => sum + item.data.SPACES, 0);
    
    // Draw background circle
    ctx.fillStyle = `hsl(${200 + normVal * 60}, 70%, 50%)`;
    ctx.beginPath();
    ctx.arc(x, y, glyphRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw text showing total spaces
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(totalSpaces.toString(), x, y);
  }
});
```

## Examples

### Running the Demo

1. Clone or download this repository
2. Start a local server:
   ```bash
   npm start
   # or
   python3 -m http.server 8000
   ```
3. Open `http://localhost:8000` in your browser

### Custom Color Scales

```javascript
// Heatmap (red to yellow)
const heatmapScale = (v) => [255 * v, 200 * (1 - v), 50, 220];

// Blue scale
const blueScale = (v) => [50, 100, 255 * v, 220];

// Green scale
const greenScale = (v) => [50, 255 * v, 100, 220];

// Custom gradient
const customScale = (v) => {
  const r = Math.floor(255 * Math.sin(v * Math.PI));
  const g = Math.floor(255 * Math.cos(v * Math.PI));
  const b = Math.floor(255 * v);
  return [r, g, b, 200];
};
```

### Data Format Examples

#### Bike Parking Data with Glyphs
```javascript
const data = [
  {
    COORDINATES: [-122.4, 37.74],
    RACKS: 2,
    SPACES: 4
  },
  // ... more data points
];

const gridLayer = new ScreenGridLayerGL({
  data: data,
  getPosition: (d) => d.COORDINATES,
  getWeight: (d) => d.SPACES,
  enableGlyphs: true,
  onDrawCell: (ctx, x, y, normVal, cellInfo) => {
    const { cellData, glyphRadius } = cellInfo;
    const totalRacks = cellData.reduce((sum, item) => sum + item.data.RACKS, 0);
    const totalSpaces = cellData.reduce((sum, item) => sum + item.data.SPACES, 0);
    
    // Draw pie chart showing racks vs spaces
    ScreenGridLayerGL.drawPieGlyph(ctx, x, y, [totalRacks, totalSpaces], glyphRadius);
  }
});
```

#### Restaurant Data with Bar Charts
```javascript
const data = [
  {
    coordinates: [-122.4, 37.74],
    rating: 4.5,
    priceLevel: 2,
    reviews: 150
  },
  // ... more data points
];

const gridLayer = new ScreenGridLayerGL({
  data: data,
  getPosition: (d) => d.coordinates,
  getWeight: (d) => d.reviews,
  enableGlyphs: true,
  onDrawCell: (ctx, x, y, normVal, cellInfo) => {
    const { cellData, cellSize } = cellInfo;
    const avgRating = cellData.reduce((sum, item) => sum + item.data.rating, 0) / cellData.length;
    const avgPrice = cellData.reduce((sum, item) => sum + item.data.priceLevel, 0) / cellData.length;
    
    // Draw bar chart showing rating and price level
    ScreenGridLayerGL.drawBarGlyph(ctx, x, y, [avgRating, avgPrice], 5, cellSize);
  }
});
```

#### Zoom-based Cell Sizing
```javascript
const gridLayer = new ScreenGridLayerGL({
  data: data,
  getPosition: (d) => d.coordinates,
  getWeight: (d) => d.value,
  zoomBasedSize: true,
  minCellSize: 20,
  maxCellSize: 100,
  cellSizePixels: 60 // Base size at zoom level 11
});
```

## Performance Tips

1. **Cell Size**: Larger cells improve performance but reduce detail
2. **Data Size**: Consider filtering data based on zoom level
3. **Color Scale**: Simple color calculations perform better
4. **Updates**: Use `setData()` and `setConfig()` for efficient updates

## Browser Support

- Modern browsers with Canvas 2D support
- ES6 module support required
- MapLibre GL JS 4.0+

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Changelog

### v2.0.0
- **NEW**: Glyph drawing system with `onDrawCell` callback
- **NEW**: Built-in glyph utilities (circle, bar chart, pie chart, scatter plot)
- **NEW**: Enhanced aggregation storing raw data points per cell
- **NEW**: Zoom-based cell size adjustment
- **NEW**: Adaptive cell sizing options
- **NEW**: Multi-attribute visualization support
- **IMPROVED**: Enhanced cell interaction with detailed data access
- **IMPROVED**: Better performance with optimized rendering pipeline

### v1.0.0
- Initial release
- Basic grid aggregation functionality
- MapLibre GL JS integration
- Interactive hover and click events
- Customizable styling options
