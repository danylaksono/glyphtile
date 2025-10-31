/**
 * LegendRenderers.js
 * HTML renderers for different legend types
 */

export class LegendRenderers {
  /**
   * Render a color scale legend
   * @param {HTMLElement} container - Container element
   * @param {Object} data - Legend data from LegendDataExtractor
   * @param {Object} options - Rendering options
   */
  static renderColorScale(container, data, options = {}) {
    const {
      title = 'Value',
      showMinMax = true,
      orientation = 'vertical',
      height = orientation === 'vertical' ? 200 : 30,
      width = orientation === 'vertical' ? 20 : 200
    } = options;

    container.innerHTML = '';

    const titleEl = document.createElement('div');
    titleEl.className = 'glyph-legend-title';
    titleEl.textContent = title;
    container.appendChild(titleEl);

    const scaleContainer = document.createElement('div');
    scaleContainer.className = 'glyph-legend-scale';
    scaleContainer.style.display = 'flex';
    scaleContainer.style.flexDirection = orientation === 'vertical' ? 'column-reverse' : 'row';
    scaleContainer.style.height = orientation === 'vertical' ? `${height}px` : 'auto';
    scaleContainer.style.width = orientation === 'vertical' ? `${width}px` : `${width}px`;
    scaleContainer.style.margin = '8px 0';

    // Create gradient stops
    data.colorStops.forEach((stop, i) => {
      const stopEl = document.createElement('div');
      stopEl.className = 'glyph-legend-stop';
      stopEl.style.backgroundColor = stop.color;
      stopEl.style.flex = '1';
      stopEl.style.minHeight = orientation === 'vertical' ? '1px' : '100%';
      stopEl.style.minWidth = orientation === 'horizontal' ? '1px' : '100%';
      stopEl.title = `${stop.value.toFixed(2)}${data.unit ? ' ' + data.unit : ''}`;
      scaleContainer.appendChild(stopEl);
    });

    container.appendChild(scaleContainer);

    if (showMinMax) {
      const labelsContainer = document.createElement('div');
      labelsContainer.className = 'glyph-legend-labels';
      labelsContainer.style.display = 'flex';
      labelsContainer.style.justifyContent = 'space-between';
      labelsContainer.style.fontSize = '11px';
      labelsContainer.style.color = '#666';
      labelsContainer.style.marginTop = '4px';

      const minLabel = document.createElement('span');
      minLabel.textContent = `${data.minValue.toFixed(1)}${data.unit ? ' ' + data.unit : ''}`;
      labelsContainer.appendChild(minLabel);

      const maxLabel = document.createElement('span');
      maxLabel.textContent = `${data.maxValue.toFixed(1)}${data.unit ? ' ' + data.unit : ''}`;
      labelsContainer.appendChild(maxLabel);

      container.appendChild(labelsContainer);
    }
  }

  /**
   * Render a categorical legend (for pie charts, bar charts, etc.)
   * @param {HTMLElement} container - Container element
   * @param {Object} data - Legend data from LegendDataExtractor
   * @param {Object} options - Rendering options
   */
  static renderCategorical(container, data, options = {}) {
    const {
      title = 'Categories',
      colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a29bfe'],
      showCounts = true,
      maxItems = 10
    } = options;

    container.innerHTML = '';

    const titleEl = document.createElement('div');
    titleEl.className = 'glyph-legend-title';
    titleEl.textContent = title;
    container.appendChild(titleEl);

    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'glyph-legend-items';

    const itemsToShow = data.items.slice(0, maxItems);
    itemsToShow.forEach((item, i) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'glyph-legend-item';
      itemEl.style.display = 'flex';
      itemEl.style.alignItems = 'center';
      itemEl.style.marginBottom = '6px';

      const colorBox = document.createElement('div');
      colorBox.className = 'glyph-legend-color-box';
      colorBox.style.width = '16px';
      colorBox.style.height = '16px';
      colorBox.style.backgroundColor = colors[i % colors.length];
      colorBox.style.marginRight = '8px';
      colorBox.style.borderRadius = '2px';
      itemEl.appendChild(colorBox);

      const label = document.createElement('span');
      label.className = 'glyph-legend-label';
      label.style.flex = '1';
      label.style.fontSize = '12px';
      label.textContent = item.category;
      itemEl.appendChild(label);

      if (showCounts) {
        const count = document.createElement('span');
        count.className = 'glyph-legend-count';
        count.style.fontSize = '11px';
        count.style.color = '#999';
        count.style.marginLeft = '8px';
        count.textContent = `(${item.count})`;
        itemEl.appendChild(count);
      }

      itemsContainer.appendChild(itemEl);
    });

    if (data.items.length > maxItems) {
      const moreEl = document.createElement('div');
      moreEl.className = 'glyph-legend-more';
      moreEl.style.fontSize = '11px';
      moreEl.style.color = '#999';
      moreEl.style.fontStyle = 'italic';
      moreEl.textContent = `... and ${data.items.length - maxItems} more`;
      itemsContainer.appendChild(moreEl);
    }

    container.appendChild(itemsContainer);
  }

  /**
   * Render a temporal/time series legend
   * @param {HTMLElement} container - Container element
   * @param {Object} data - Legend data from LegendDataExtractor
   * @param {Object} options - Rendering options
   */
  static renderTemporal(container, data, options = {}) {
    const {
      title = 'Time Range',
      timeFormat = (t) => t.toString(),
      showRange = true,
      showSamplePoints = true
    } = options;

    container.innerHTML = '';

    const titleEl = document.createElement('div');
    titleEl.className = 'glyph-legend-title';
    titleEl.textContent = title;
    container.appendChild(titleEl);

    if (showRange) {
      const rangeEl = document.createElement('div');
      rangeEl.className = 'glyph-legend-range';
      rangeEl.style.fontSize = '12px';
      rangeEl.style.color = '#666';
      rangeEl.style.marginTop = '8px';
      rangeEl.textContent = `${timeFormat(data.minTime)} - ${timeFormat(data.maxTime)}`;
      container.appendChild(rangeEl);
    }

    if (showSamplePoints && data.items.length > 0) {
      const sampleContainer = document.createElement('div');
      sampleContainer.className = 'glyph-legend-sample';
      sampleContainer.style.marginTop = '12px';
      sampleContainer.style.fontSize = '11px';

      // Show min, mid, max sample points
      const samples = [
        data.items[0],
        data.items[Math.floor(data.items.length / 2)],
        data.items[data.items.length - 1]
      ].filter((item, i, arr) => {
        // Remove duplicates
        return i === 0 || item.time !== arr[i - 1].time;
      });

      samples.forEach((item, i) => {
        const sampleEl = document.createElement('div');
        sampleEl.style.display = 'flex';
        sampleEl.style.justifyContent = 'space-between';
        sampleEl.style.marginBottom = '4px';

        const timeLabel = document.createElement('span');
        timeLabel.textContent = timeFormat(item.time);
        sampleEl.appendChild(timeLabel);

        const valueLabel = document.createElement('span');
        valueLabel.style.color = '#999';
        valueLabel.textContent = `${item.totalValue.toFixed(1)}`;
        sampleEl.appendChild(valueLabel);

        sampleContainer.appendChild(sampleEl);
      });

      container.appendChild(sampleContainer);
    }
  }

  /**
   * Render a size scale legend
   * @param {HTMLElement} container - Container element
   * @param {Object} data - Legend data from LegendDataExtractor
   * @param {Object} options - Rendering options
   */
  static renderSizeScale(container, data, options = {}) {
    const {
      title = 'Size',
      maxRadius = 30,
      showLabels = true
    } = options;

    container.innerHTML = '';

    const titleEl = document.createElement('div');
    titleEl.className = 'glyph-legend-title';
    titleEl.textContent = title;
    container.appendChild(titleEl);

    const scaleContainer = document.createElement('div');
    scaleContainer.className = 'glyph-legend-size-scale';
    scaleContainer.style.display = 'flex';
    scaleContainer.style.flexDirection = 'column';
    scaleContainer.style.alignItems = 'center';
    scaleContainer.style.marginTop = '12px';
    scaleContainer.style.gap = '8px';

    data.sampleSizes.forEach((size, i) => {
      const itemContainer = document.createElement('div');
      itemContainer.style.display = 'flex';
      itemContainer.style.alignItems = 'center';
      itemContainer.style.gap = '12px';

      const radius = (size / data.maxSize) * maxRadius;
      const circle = document.createElement('div');
      circle.style.width = `${radius * 2}px`;
      circle.style.height = `${radius * 2}px`;
      circle.style.borderRadius = '50%';
      circle.style.backgroundColor = 'rgba(52, 152, 219, 0.6)';
      circle.style.border = '2px solid #3498db';
      itemContainer.appendChild(circle);

      if (showLabels) {
        const label = document.createElement('span');
        label.style.fontSize = '11px';
        label.style.color = '#666';
        label.textContent = size.toFixed(1);
        itemContainer.appendChild(label);
      }

      scaleContainer.appendChild(itemContainer);
    });

    container.appendChild(scaleContainer);
  }

  /**
   * Render a multi-dimensional legend (combining multiple encodings)
   * @param {HTMLElement} container - Container element
   * @param {Array} legendDataArray - Array of legend data objects
   * @param {Object} options - Rendering options
   */
  static renderMultiDimensional(container, legendDataArray, options = {}) {
    const { title = 'Legend' } = options;

    container.innerHTML = '';

    if (title) {
      const titleEl = document.createElement('div');
      titleEl.className = 'glyph-legend-title';
      titleEl.textContent = title;
      titleEl.style.marginBottom = '12px';
      container.appendChild(titleEl);
    }

    legendDataArray.forEach((legendData, i) => {
      const section = document.createElement('div');
      section.className = 'glyph-legend-section';
      section.style.marginBottom = i < legendDataArray.length - 1 ? '16px' : '0';

      switch (legendData.type) {
        case 'color-scale':
          LegendRenderers.renderColorScale(section, legendData, options.colorScaleOptions || {});
          break;
        case 'categorical':
          LegendRenderers.renderCategorical(section, legendData, options.categoricalOptions || {});
          break;
        case 'temporal':
          LegendRenderers.renderTemporal(section, legendData, options.temporalOptions || {});
          break;
        case 'size-scale':
          LegendRenderers.renderSizeScale(section, legendData, options.sizeScaleOptions || {});
          break;
      }

      container.appendChild(section);
    });
  }
}

