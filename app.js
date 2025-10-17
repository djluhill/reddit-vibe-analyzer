// ===============================
// Reddit Vibe Analyzer - app.js
// (no external sentiment lib)
// ===============================

// ---------- DOM refs ----------
const analyzeBtn     = document.getElementById('analyzeBtn');
const inputText      = document.getElementById('inputText');
const scoreText      = document.getElementById('scoreText');
const resultsCard    = document.getElementById('results');
const chartContainer = document.getElementById('chartContainer');
let chart = null;

// ---------- Helpers ----------

// Tokenize text into words (letters/numbers), lowercase.
// Works with most languages; emojis will be ignored unless added to dictionary.
function tokenize(text) {
  const matches = text.toLowerCase().match(/[\p{L}\p{N}’']+/gu);
  return matches ? matches : [];
}

// Core scoring using the dictionary from data.js
function analyze(text) {
  const words = tokenize(text);
  let score = 0;
  const positiveHits = [];
  const negativeHits = [];

  for (const w of words) {
    const val = sentimentDictionary[w];
    if (typeof val === 'number') {
      score += val;
      if (val > 0) positiveHits.push(w);
      else if (val < 0) negativeHits.push(w);
    }
  }

  const positives = positiveHits.length;
  const negatives = negativeHits.length;
  const neutrals  = Math.max(0, words.length - positives - negatives);

  return { score, positives, negatives, neutrals, wordsCount: words.length };
}

// UI updates
function showResult({ score, positives, negatives, neutrals }) {
  resultsCard.style.display = 'block';

  if (score > 0) {
    scoreText.textContent = `😊 Positive vibe (Score: ${score})`;
    scoreText.style.color = 'green';
  } else if (score < 0) {
    scoreText.textContent = `😡 Negative vibe (Score: ${score})`;
    scoreText.style.color = 'red';
  } else {
    scoreText.textContent = `😐 Neutral vibe (Score: ${score})`;
    scoreText.style.color = 'gray';
  }

  updateChart(positives, negatives, neutrals);
}

function updateChart(positives, negatives, neutrals) {
  chartContainer.style.display = 'block';

  if (chart) chart.destroy();

  const ctx = document.getElementById('vibeChart').getContext('2d');
  chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Positive', 'Negative', 'Neutral'],
      datasets: [{
        data: [positives, negatives, neutrals],
        backgroundColor: ['#28a745', '#dc3545', '#6c757d']
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

// ---------- Events ----------

// 1) Analyze pasted text
analyzeBtn.addEventListener('click', () => {
  const text = inputText.value.trim();
  if (!text) {
    alert('Please paste some text to analyze.');
    return;
  }
  const result = analyze(text);
  showResult(result);
});

// 2) Load sample thread on page load (optional)
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('./data/sample-thread.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const thread = await res.json();

    // Combine all comments into one block and analyze
    const combined = Array.isArray(thread.comments) ? thread.comments.join(' ') : '';
    if (combined) {
      inputText.value = thread.comments.join('\n');
      const result = analyze(combined);
      showResult(result);
    }
  } catch (err) {
    // Non-fatal if the sample file is missing
    console.warn('Sample thread not loaded:', err.message);
  }
});
