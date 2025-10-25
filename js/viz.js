// /js/viz.js
import {
  chart,
  bellChart,
  setCharts,
  lastResult,
  lastScores,
  lastSeries
} from './state.js';

const chartContainer     = document.getElementById('chartContainer');
const tableContainer     = document.getElementById('tableContainer');
const tableBody          = document.getElementById('tableBody');
const bellCurveContainer = document.getElementById('bellCurveContainer');
const gridContainer      = document.getElementById('gridContainer');

// ---- Fixed sizes (px) ----
const MAIN_CHART_H = 280;   // pie / bar
const BELL_CHART_H = 320;   // bell curve
const MINI_CHART_H = 180;   // per-small-multiple canvas
const MINI_CARD_H  = 240;   // card body height to fit title + canvas comfortably

function lockContainerHeight(el, h) {
  if (!el) return;
  el.style.height = `${h}px`;
}
function unlockContainer(el) {
  if (!el) return;
  el.style.height = ''; // revert to default when hidden
}

// ---------- Utilities ----------
export function hideAllViz() {
  // Hide & reset sections
  if (tableContainer) {
    tableContainer.style.display = 'none';
  }
  if (chartContainer) {
    chartContainer.style.display = 'none';
    unlockContainer(chartContainer);
  }
  if (bellCurveContainer) {
    bellCurveContainer.style.display = 'none';
    unlockContainer(bellCurveContainer);
  }
  if (gridContainer) {
    gridContainer.style.display = 'none';
    gridContainer.innerHTML = '';
  }

  // Destroy charts
  if (chart)     { chart.destroy();     setCharts({ pieBar: null }); }
  if (bellChart) { bellChart.destroy(); setCharts({ bell:    null }); }
}

// ---------- Single-series: Pie / Bar ----------
export function renderPieBar(choice, { positives, negatives, neutrals }) {
  hideAllViz();

  chartContainer.style.display = 'block';
  lockContainerHeight(chartContainer, MAIN_CHART_H);

  const canvas = document.getElementById('vibeChart');
  if (canvas) canvas.height = MAIN_CHART_H; // lock canvas
  const ctx  = canvas.getContext('2d');
  const type = (choice === 'bar') ? 'bar' : 'pie';

  const c = new Chart(ctx, {
    type,
    data: {
      labels: ['Positive', 'Negative', 'Neutral'],
      datasets: [{
        data: [positives, negatives, neutrals],
        backgroundColor: ['#28a745', '#dc3545', '#6c757d']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // use fixed height above
      plugins: { legend: { position: 'bottom' } },
      ...(type === 'bar'
        ? { scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
        : {})
    }
  });
  setCharts({ pieBar: c });
}

// ---------- Single-series: Table ----------
export function renderTable({ positives, negatives, neutrals }) {
  hideAllViz();
  tableContainer.style.display = 'block';
  tableBody.innerHTML = `
    <tr><td>Positive</td><td>${positives}</td></tr>
    <tr><td>Negative</td><td>${negatives}</td></tr>
    <tr><td>Neutral</td><td>${neutrals}</td></tr>
    <tr class="table-active"><td>Total</td><td>${positives + negatives + neutrals}</td></tr>
  `;
}

// ---------- Single-series: Bell (histogram) ----------
export function renderBell(hist) {
  hideAllViz();

  bellCurveContainer.style.display = 'block';
  lockContainerHeight(bellCurveContainer, BELL_CHART_H);

  const canvas = document.getElementById('bellCurveChart');
  if (canvas) canvas.height = BELL_CHART_H;
  const ctx = canvas.getContext('2d');

  const c = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: hist.labels,
      datasets: [{ data: hist.counts, backgroundColor: '#6c757d' }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: () => 'Distribution',
            label: ({ dataIndex }) => {
              const bin = hist.bins[dataIndex];
              const pct = (bin.pct * 100).toFixed(1);
              const avg = bin.avg.toFixed(2);
              return [
                `Bin: ${bin.start} to ${bin.end}`,
                `Comments: ${bin.count} (${pct}%)`,
                `Avg score: ${avg}`
              ];
            }
          }
        }
      },
      scales: {
        x: { title: { display: true, text: 'Sentiment score bins' } },
        y: { beginAtZero: true, title: { display: true, text: 'Count' }, ticks: { precision: 0 } }
      }
    }
  });
  setCharts({ bell: c });
}

// ===================================================================
//                        MULTI-SUB VISUALS
// ===================================================================

// Small-multiples grid for Pie/Bar: one mini chart per subreddit
export function renderSmallMultiples(series, mode /* 'pie' | 'bar' */) {
  hideAllViz();
  if (!gridContainer) return;

  gridContainer.style.display = 'flex';
  gridContainer.classList.add('row', 'g-3');
  gridContainer.innerHTML = '';

  // Bootstrap columns: 1–2 per row on mobile, 3 per row desktop
  const colClass = 'col-12 col-md-6 col-lg-4';

  series.forEach((s, i) => {
    const { positives, negatives, neutrals } = s.result;

    const col = document.createElement('div');
    col.className = colClass;
    col.innerHTML = `
      <div class="card h-100">
        <div class="card-body" style="height:${MINI_CARD_H}px;">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="card-title mb-0">r/${s.label}</h6>
            <span class="badge text-bg-secondary">n=${s.scores.length}</span>
          </div>
          <div style="height:${MINI_CHART_H}px;">
            <canvas id="miniChart_${i}" height="${MINI_CHART_H}" aria-label="Mini chart for r/${s.label}"></canvas>
          </div>
        </div>
      </div>
    `;
    gridContainer.appendChild(col);

    const ctx = col.querySelector('canvas').getContext('2d');
    new Chart(ctx, {
      type: mode,
      data: {
        labels: ['Positive', 'Negative', 'Neutral'],
        datasets: [{
          data: [positives, negatives, neutrals],
          backgroundColor: ['#28a745', '#dc3545', '#6c757d']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: mode === 'pie', position: 'bottom' } },
        ...(mode === 'bar'
          ? { scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
          : {})
      }
    });
  });
}

// Comparison table: one row per subreddit
export function renderTableCompare(series) {
  hideAllViz();
  tableContainer.style.display = 'block';

  tableBody.innerHTML = `
    <tr class="table-secondary">
      <th>Subreddit</th><th>Positive</th><th>Negative</th>
      <th>Neutral</th><th>Total</th><th>Score</th>
    </tr>
    ${series.map(s => {
      const { positives, negatives, neutrals, score } = s.result;
      const total = positives + negatives + neutrals;
      return `
        <tr>
          <td>r/${s.label}</td>
          <td>${positives}</td>
          <td>${negatives}</td>
          <td>${neutrals}</td>
          <td>${total}</td>
          <td>${score}</td>
        </tr>
      `;
    }).join('')}
  `;
}

// Bell curve overlay (line chart) for multiple subreddits
function buildCommonBins(series, step = 1) {
  const allScores = series.flatMap(s => s.scores);
  if (!allScores.length) return { edges: [], min: 0, max: 0, step };

  let min = Math.max(Math.floor(Math.min(...allScores)), -10);
  let max = Math.min(Math.ceil (Math.max(...allScores)),  10);
  if (min > -1) min = -1;
  if (max <  1) max =  1;

  const edges = [];
  for (let x = min; x <= max; x += step) edges.push(x);
  return { edges, min, max, step };
}
function histogramToDensity(scores, edges) {
  if (!edges.length) return [];
  const counts = new Array(edges.length - 1).fill(0);
  const step = edges[1] - edges[0];

  for (const s of scores) {
    let i = Math.floor((s - edges[0]) / step);
    i = Math.max(0, Math.min(counts.length - 1, i));
    counts[i]++;
  }
  const total = scores.length || 1;
  return counts.map(c => c / total);
}

export function renderBellCompare(series) {
  hideAllViz();
  if (!series.length) return;

  const { edges } = buildCommonBins(series, 1);
  const labels = edges.slice(0, -1).map((_, i) => `${edges[i]}..${edges[i+1]}`);

  const palette = ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd'];

  const datasets = series.map((s, idx) => ({
    label: `r/${s.label}`,
    data: histogramToDensity(s.scores, edges),
    borderColor: palette[idx % palette.length],
    backgroundColor: 'transparent',
    borderWidth: 2,
    tension: 0.3,
    pointRadius: 0
  }));

  const canvas = document.getElementById('bellCurveChart');
  if (canvas) canvas.height = BELL_CHART_H;

  bellCurveContainer.style.display = 'block';
  lockContainerHeight(bellCurveContainer, BELL_CHART_H);

  const ctx = canvas.getContext('2d');
  const c = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            title: items => `Score bin ${labels[items[0].dataIndex]}`,
            label: item => `${item.dataset.label}: ${(item.raw * 100).toFixed(1)}%`
          }
        }
      },
      scales: {
        x: { title: { display: true, text: 'Sentiment score bins' } },
        y: { beginAtZero: true, title: { display: true, text: 'Relative frequency' } }
      }
    }
  });
  setCharts({ bell: c });
}

// Decide best bell depending on whether we have multiple series
export function renderBestBell() {
  const multi = Array.isArray(lastSeries) && lastSeries.length >= 2;
  if (multi) {
    renderBellCompare(lastSeries);
    return;
  }

  // Build single-series histogram from lastScores
  const scores = lastScores || [];
  if (!scores.length) {
    hideAllViz();
    return;
  }

  // Build simple bins for single series
  const step = 1;
  let min = Math.max(Math.floor(Math.min(...scores)), -10);
  let max = Math.min(Math.ceil (Math.max(...scores)),  10);
  if (min > -1) min = -1;
  if (max <  1) max =  1;

  const labels = [], counts = [], bins = [];
  for (let start = min; start < max; start += step) {
    const end = start + step;
    labels.push(`${start}..${end}`);
    bins.push({ start, end, items: [] });
  }
  scores.forEach(s => {
    const idx = Math.min(bins.length - 1, Math.max(0, Math.floor((s - min) / step)));
    bins[idx].items.push(s);
  });
  const total = scores.length;
  bins.forEach(b => {
    const c = b.items.length;
    b.count = c;
    b.pct   = total ? c / total : 0;
    b.avg   = c ? (b.items.reduce((a,v)=>a+v,0) / c) : 0;
    counts.push(c);
  });

  renderBell({ labels, counts, bins, total });
}
