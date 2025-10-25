// ============================================
// SECTION 1: STATE VARIABLES
// ============================================

// Single-series (legacy) state
export let chart = null;        // Pie/Bar Chart.js instance
export let bellChart = null;    // Bell/Bins Chart.js instance
export let lastResult = null;   // Aggregate result for the "primary" series

// UPDATED: Store full segment objects instead of just numbers
export let lastSegments = [];   // [{ text, score, sentiment }] - full objects with text
export let lastScores = [];     // [{ text, score, sentiment }] - CHANGED: now stores objects, not just numbers

// Multi-series compare state (each: { label, scores:[{text,score,sentiment}], result:{score, positives, negatives, neutrals} })
export let lastSeries = [];     

// ============================================
// SECTION 2: SETTERS
// ============================================

/**
 * Track current Chart.js instances so we can destroy them safely before re-rendering.
 */
export function setCharts({ pieBar = undefined, bell = undefined } = {}) {
  if (pieBar !== undefined) chart = pieBar;
  if (bell   !== undefined) bellChart = bell;
}

/**
 * Update analysis state. Any key omitted will be left unchanged.
 * 
 * UPDATED: Now properly stores segment objects with text, score, and sentiment
 */
export function setAnalysis({ result, segments, scores, series } = {}) {
  if (result !== undefined) {
    lastResult = result;
  }
  
  if (segments !== undefined) {
    lastSegments = segments;
    
    // IMPORTANT: If segments are provided, also update lastScores to match
    // This ensures lastScores contains full objects, not just numbers
    if (Array.isArray(segments) && segments.length > 0) {
      lastScores = segments.map(seg => {
        // Handle both object format {text, score} and just text string
        if (typeof seg === 'object' && seg !== null) {
          const score = seg.score || 0;
          let sentiment = 'neutral';
          if (score > 0) sentiment = 'positive';
          else if (score < 0) sentiment = 'negative';
          
          return {
            text: seg.text || '',
            score: score,
            sentiment: sentiment
          };
        } else if (typeof seg === 'string') {
          // If segment is just a string, analyze it
          return {
            text: seg,
            score: 0,
            sentiment: 'neutral'
          };
        }
        return { text: '', score: 0, sentiment: 'neutral' };
      });
    }
  }
  
  if (scores !== undefined) {
    // If scores is provided separately, convert to proper format
    if (Array.isArray(scores) && scores.length > 0) {
      // Check if scores are already objects or just numbers
      if (typeof scores[0] === 'object') {
        lastScores = scores; // Already in correct format
      } else {
        // Legacy format: just numbers, need to match with segments
        lastScores = scores.map((score, index) => {
          const text = lastSegments[index]?.text || `Comment ${index + 1}`;
          let sentiment = 'neutral';
          if (score > 0) sentiment = 'positive';
          else if (score < 0) sentiment = 'negative';
          
          return { text, score, sentiment };
        });
      }
    }
  }
  
  if (series !== undefined) {
    lastSeries = series;
  }
}

// ============================================
// SECTION 3: HELPERS
// ============================================

/**
 * Clear all chart instances (does not wipe analysis data).
 */
export function resetCharts() {
  if (chart)     { chart.destroy();     chart = null; }
  if (bellChart) { bellChart.destroy(); bellChart = null; }
}

/**
 * Clear all analysis data.
 */
export function resetAnalysis() {
  lastResult = null;
  lastSegments = [];
  lastScores = [];
  lastSeries = [];
}

/**
 * Get a summary of current state (useful for debugging)
 */
export function getStateSummary() {
  return {
    hasResult: lastResult !== null,
    segmentCount: lastSegments.length,
    scoreCount: lastScores.length,
    seriesCount: lastSeries.length,
    sampleSegment: lastSegments[0],
    sampleScore: lastScores[0]
  };
}