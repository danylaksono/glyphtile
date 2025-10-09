# ScreenGrid Library v2.0

A GPU/Canvas hybrid Screen-Space Grid Aggregation library for MapLibre GL JS. This library provides efficient real-time aggregation of point data into screen-space grids with customizable styling, interactive features, and advanced glyph drawing capabilities.

## 🚀 Features

- **Real-time Aggregation**: Efficiently aggregates point data into screen-space grids
- **Customizable Styling**: Flexible color scales and cell sizing
- **Interactive Events**: Hover and click handlers for grid cells
- **Glyph Drawing**: Custom glyph rendering with Canvas 2D for advanced visualizations
- **MapLibre Integration**: Seamless integration with MapLibre GL JS
- **Performance Optimized**: Uses Canvas 2D rendering for optimal performance
- **Responsive Design**: Automatically adjusts to map viewport changes
- **Zoom-based Sizing**: Dynamic cell size adjustment based on zoom level
- **Multi-attribute Visualization**: Support for visualizing multiple data attributes per cell

## 📁 Project Structure

```
screengrid/
├── src/
│   └── screengrid.js          # Main library file
├── examples/
│   ├── index.html             # Full-featured demo
│   ├── simple-test.html       # Basic functionality test
│   └── test.html              # Original test file
├── docs/
│   ├── README.md              # This file
│   └── USAGE.md               # Detailed usage guide
├── assets/                    # Static assets
├── package.json
└── server.py                  # Development server
```

## 🚀 Quick Start

### Installation

```bash
# From npm
npm install screengrid

# Peer dependency (you manage this in your app)
npm install maplibre-gl

# Or clone the repository for development
git clone https://github.com/danylaksono/screengrid.git
cd screengrid
npm install
npm run build
```

### Basic Usage

```javascript
// ESM (bundlers / modern Node)
import { ScreenGridLayerGL } from 'screengrid';
import maplibregl from 'maplibre-gl';

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

### CommonJS (Node or older bundlers)

```javascript
// CJS require
const { ScreenGridLayerGL } = require('screengrid');
const maplibregl = require('maplibre-gl');
```

### CDN Usage

```html
<!-- UMD build exposes global `ScreenGrid` -->
<script src="https://unpkg.com/screengrid/dist/screengrid.umd.min.js"></script>
<!-- MapLibre (peer) must also be included on the page -->
<link href="https://unpkg.com/maplibre-gl@^4/dist/maplibre-gl.css" rel="stylesheet" />
<script src="https://unpkg.com/maplibre-gl@^4/dist/maplibre-gl.js"></script>
<script>
  const { ScreenGridLayerGL } = ScreenGrid;
  // use ScreenGridLayerGL here
  // ...
  // map.addLayer(new ScreenGridLayerGL({...}))
</script>
```

### Full Example (CDN)

```html
<div id="map" style="position:absolute;top:0;bottom:0;width:100%"></div>
<link href="https://unpkg.com/maplibre-gl@^4/dist/maplibre-gl.css" rel="stylesheet" />
<script src="https://unpkg.com/maplibre-gl@^4/dist/maplibre-gl.js"></script>
<script src="https://unpkg.com/screengrid/dist/screengrid.umd.min.js"></script>
<script>
  const map = new maplibregl.Map({
    container: 'map',
    style: 'https://demotiles.maplibre.org/style.json',
    center: [-122.4, 37.74],
    zoom: 11
  });

  map.on('load', async () => {
    const data = await fetch('your-data.json').then(r => r.json());
    const layer = new ScreenGrid.ScreenGridLayerGL({
      data,
      getPosition: d => d.coordinates,
      getWeight: d => d.weight,
      cellSizePixels: 60,
      colorScale: v => [255 * v, 200 * (1 - v), 50, 220]
    });
    map.addLayer(layer);
  });
  
  // Optional: hover/click handlers
  // layer.setConfig({ onHover: ({cell}) => console.log(cell) });
</script>
```

### Bundles

- ESM: `dist/screengrid.mjs`
- CJS: `dist/screengrid.cjs`
- UMD: `dist/screengrid.umd.js`
- UMD (min): `dist/screengrid.umd.min.js`

`maplibre-gl` is a peer dependency and is not bundled. In UMD builds, it is expected as a global `maplibregl`.

## 🎨 Glyph Drawing

The library supports custom glyph drawing through the `onDrawCell` callback:

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
    
    // Draw custom glyph
    ctx.fillStyle = `hsl(${200 + normVal * 60}, 70%, 50%)`;
    ctx.beginPath();
    ctx.arc(x, y, glyphRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(totalSpaces.toString(), x, y);
  }
});
```

## 📚 Examples

### Running the Examples

1. **Full Demo**: Open `examples/index.html` - Complete interactive demo with all features
2. **Simple Test**: Open `examples/simple-test.html` - Basic functionality verification
3. **Original Test**: Open `examples/test.html` - Original test implementation

### Example Features

- **Multiple Data Sources**: SF Bike Parking, Restaurants, NYC Taxis
- **Visualization Modes**: Color-based and Glyph-based rendering
- **Interactive Controls**: Real-time parameter adjustment
- **Live Preview**: Glyph preview and real-time updates
- **Debug Information**: Console logging and status updates

## 🔧 API Reference

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

## 🛠️ Built-in Glyph Utilities

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

## 🐛 Troubleshooting

### Common Issues

1. **Grid not visible**: Check browser console for errors, ensure data is loaded correctly
2. **Glyphs not rendering**: Verify `enableGlyphs: true` and `onDrawCell` callback is provided
3. **Performance issues**: Try increasing cell size or reducing data points
4. **Canvas issues**: Ensure MapLibre GL JS is properly loaded

### Debug Mode

Enable debug logging by opening browser console. The library provides detailed logging for:
- Layer initialization
- Data aggregation
- Rendering process
- Error states

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 Changelog

### v2.0.0
- **NEW**: Glyph drawing system with `onDrawCell` callback
- **NEW**: Built-in glyph utilities (circle, bar chart, pie chart, scatter plot)
- **NEW**: Enhanced aggregation storing raw data points per cell
- **NEW**: Zoom-based cell size adjustment
- **NEW**: Adaptive cell sizing options
- **NEW**: Multi-attribute visualization support
- **IMPROVED**: Enhanced cell interaction with detailed data access
- **IMPROVED**: Better performance with optimized rendering pipeline
- **IMPROVED**: Better folder structure and documentation

### v1.0.0
- Initial release
- Basic grid aggregation functionality
- MapLibre GL JS integration
- Interactive hover and click events
- Customizable styling options
