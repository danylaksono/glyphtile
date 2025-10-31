# Spatio-Temporal Data Visualization Guide

This guide shows you how to visualize spatio-temporal data (data with both geographic and temporal dimensions) using custom glyph functions in the ScreenGrid library.

## Overview

When you have data that varies over both space and time, you can create custom glyphs that show temporal trends within each spatial grid cell. Each cell will display a mini time series chart showing how values change over time for that location.

## Example: Oxford Carbon Savings Data

The `oxford-timeseries.html` example demonstrates visualizing carbon savings from heat pumps across multiple years (2024-2032) in Oxford, UK.

### Data Structure

Your data should have:
- Geographic coordinates: `lat`, `lon` (or a `coordinates` array)
- Temporal dimension: `year` (or `date`, `time`, etc.)
- Value to visualize: `ashp_carbonsaved` (or any numeric field)

Example data point:
```javascript
{
  lsoa: "E01017987",
  postcode: "CB1 2BL",
  lat: 52.1964584904,
  lon: 0.1371597478,
  year: 2024,
  ashp_carbonsaved: 752.19,
  // ... other fields
}
```

## Implementation Steps

### 1. Create a Custom Glyph Function

The glyph function receives all data points in a cell and needs to:
1. Group data by time period (year, month, etc.)
2. Aggregate values per time period (sum, average, etc.)
3. Draw a time series visualization

```javascript
function drawTimeSeriesGlyph(ctx, x, y, normVal, cellInfo) {
    const { cellData, cellSize } = cellInfo;
    
    if (!cellData || cellData.length === 0) return;

    // Step 1: Group by year and aggregate
    const yearData = {};
    
    cellData.forEach(item => {
        const year = item.data.year;
        const value = item.data.ashp_carbonsaved;
        
        // Skip null/undefined values
        if (value == null || isNaN(value)) return;
        
        if (!yearData[year]) {
            yearData[year] = { total: 0, count: 0 };
        }
        
        yearData[year].total += value; // Sum
        // Or use: yearData[year].total += value; yearData[year].count += 1; for average
    });

    // Step 2: Convert to array format
    const timeSeriesData = Object.values(yearData).map(d => ({
        year: d.year,
        value: d.total // Use sum, or d.total / d.count for average
    }));

    if (timeSeriesData.length === 0) return;

    // Step 3: Draw using built-in utility
    GlyphUtilities.drawTimeSeriesGlyph(
        ctx, x, y,
        timeSeriesData,
        cellSize,
        {
            lineColor: '#2ecc71',
            pointColor: '#27ae60',
            showArea: true,
            areaColor: 'rgba(46, 204, 113, 0.15)'
        }
    );
}
```

### 2. Configure the Grid Layer

```javascript
const gridLayer = new ScreenGridLayerGL({
    data: yourData,
    getPosition: (d) => [d.lon, d.lat], // or d.coordinates
    getWeight: (d) => d.ashp_carbonsaved || 0,
    cellSizePixels: 80,
    enableGlyphs: true,
    glyphSize: 0.9,
    onDrawCell: drawTimeSeriesGlyph
});

map.addLayer(gridLayer);
```

## Built-in Time Series Glyph Utility

The library provides `GlyphUtilities.drawTimeSeriesGlyph()` with these options:

```javascript
GlyphUtilities.drawTimeSeriesGlyph(
    ctx,           // Canvas context
    x, y,          // Center coordinates
    timeSeriesData, // Array of {year, value} objects
    cellSize,      // Cell size in pixels
    {
        lineColor: '#3498db',        // Line color
        pointColor: '#e74c3c',       // Data point color
        lineWidth: 2,                 // Line width
        pointRadius: 2,               // Point radius
        showPoints: true,             // Show data points
        showArea: false,              // Fill area under line
        areaColor: 'rgba(52, 152, 219, 0.2)', // Area fill color
        padding: 0.1                  // Padding (0-1, fraction of cellSize)
    }
);
```

### Time Series Data Format

The `timeSeriesData` parameter should be an array of objects with:
- `year` (or `time`, `date`): The temporal dimension value
- `value`: The numeric value for that time period

Example:
```javascript
[
    { year: 2024, value: 752.19 },
    { year: 2025, value: 1234.56 },
    { year: 2026, value: 1890.23 }
]
```

The function will automatically:
- Sort data by year/time
- Scale values to fit the cell
- Handle missing/null values
- Draw the line chart with optional area fill

## Alternative Visualizations

### Bar Chart Over Time

Instead of a line chart, you can use bars:

```javascript
function drawTimeSeriesBarGlyph(ctx, x, y, normVal, cellInfo) {
    const { cellData, cellSize } = cellInfo;
    
    // Group by year (same as above)
    const yearData = {};
    // ... grouping logic ...
    
    const sortedYears = Object.keys(yearData)
        .map(y => parseInt(y))
        .sort((a, b) => a - b);
    
    const values = sortedYears.map(year => yearData[year].total);
    const maxValue = Math.max(...values, 1);

    // Use bar chart utility
    GlyphUtilities.drawBarGlyph(
        ctx, x, y,
        values,
        maxValue,
        cellSize,
        ['#3498db', '#2ecc71', '#e74c3c'] // Colors per bar
    );
}
```

### Custom Time Series Chart

You can also create completely custom visualizations:

```javascript
function drawCustomTimeSeries(ctx, x, y, normVal, cellInfo) {
    const { cellData, cellSize } = cellInfo;
    
    // Your custom grouping logic
    const yearData = {}; // ... group by year
    
    // Draw custom visualization
    const chartWidth = cellSize * 0.8;
    const chartHeight = cellSize * 0.8;
    
    // Calculate positions
    const years = Object.keys(yearData).sort();
    const values = years.map(y => yearData[y].total);
    const maxValue = Math.max(...values);
    
    // Draw axes, labels, custom shapes, etc.
    // ... your custom drawing code ...
}
```

## Tips for Spatio-Temporal Visualization

1. **Aggregation Strategy**: Decide whether to sum or average values per time period
   - Sum: Good for cumulative metrics (total carbon saved)
   - Average: Good for rates (average temperature, average speed)

2. **Temporal Granularity**: 
   - Group by year for long-term trends
   - Group by month for seasonal patterns
   - Group by day for daily patterns

3. **Handling Missing Data**:
   - Filter out null/undefined values
   - Consider interpolation for missing time periods
   - Show gaps explicitly if data is sparse

4. **Cell Size**:
   - Larger cells (80-100px) work better for time series glyphs
   - Smaller cells may make trends hard to see

5. **Color Coding**:
   - Use consistent colors across cells for comparison
   - Consider using color intensity to show overall magnitude

## Example: Multiple Metrics

You can visualize multiple metrics simultaneously:

```javascript
function drawMultiMetricTimeSeries(ctx, x, y, normVal, cellInfo) {
    const { cellData, cellSize } = cellInfo;
    
    // Group by year and aggregate multiple metrics
    const yearData = {};
    cellData.forEach(item => {
        const year = item.data.year;
        if (!yearData[year]) {
            yearData[year] = {
                carbon: 0,
                cost: 0
            };
        }
        yearData[year].carbon += item.data.ashp_carbonsaved || 0;
        yearData[year].cost += item.data.total_cost || 0;
    });
    
    // Draw multiple lines or use different visualizations
    // ... custom drawing code ...
}
```

## Running the Example

1. Make sure you have the Oxford data file at `examples/data/oxford.json`
2. Open `examples/oxford-timeseries.html` in a browser
3. You should see:
   - Grid cells showing line charts of carbon savings over years
   - Hover to see year-by-year breakdown in console
   - Click to see detailed information
   - Toggle button to switch between line and bar chart views

## API Reference

See the main README.md for complete API documentation. The time series glyph utility is available as:

- `GlyphUtilities.drawTimeSeriesGlyph()` (recommended)
- `ScreenGridLayerGL.drawTimeSeriesGlyph()` (backward compatibility)

