// /js/sentiment.js

// 🔍 DEBUG FLAG - Set to true for detailed sentiment analysis logs
const DEBUG_SENTIMENT = false;

// Simple booster & negation lists
const boosters = ['very', 'really', 'super', 'extremely', 'so'];
const negations = ['not', "isn't", "wasn't", "don't", "doesn't", "didn't", "never", "no", "cannot"];

// Tokenize words and emojis
export function tokenize(text) {
  const wordMatches  = text.match(/[\p{L}\p{N}’']+/gu) || [];
  const emojiMatches = text.match(/[\u231A-\u231B\u23E9-\u23F3\u23F8-\u23FA\u2600-\u27BF\u2B50\u2B55\u2714\u2705\u274C\u2757\u2764\uFE0F\uD83C-\uDBFF\uDC00-\uDFFF]/g) || [];
  const punctuation  = text.match(/[!?.]+/g) || [];
  return { words: wordMatches, emojis: emojiMatches, punct: punctuation };
}

// Amplification helpers
function isAllCaps(word) {
  return word.length > 1 && word === word.toUpperCase();
}

function punctuationBoost(puncts) {
  // exclamation marks boost score a bit
  const count = puncts.join('').match(/!/g)?.length || 0;
  return Math.min(count * 0.2, 1.0);
}

export function analyze(text) {
  const { words, emojis, punct } = tokenize(text);

  let score = 0;
  let pos = 0;
  let neg = 0;

  let modifier = 1;
  let negationActive = false;

  // Loop through words with context
  for (let i = 0; i < words.length; i++) {
    const rawWord = words[i];
    const word = rawWord.toLowerCase();

    // Booster detection
    if (boosters.includes(word)) {
      modifier = 1.5;
      continue;
    }

    // Negation detection
    if (negations.includes(word)) {
      negationActive = true;
      continue;
    }

    // Sentiment lookup
    let val = sentimentDictionary[word];

    // Amplify for all caps
    if (val && isAllCaps(rawWord)) {
      val *= 1.3;
    }

    // Apply booster
    if (val && modifier > 1) {
      val *= modifier;
      modifier = 1; // reset
    }

    // Apply negation
    if (val && negationActive) {
      val *= -1;
      negationActive = false;
    }

    if (typeof val === 'number') {
      score += val;
      if (val > 0) pos++;
      else if (val < 0) neg++;
    }
  }

  // Emoji sentiment lookup
  for (const e of emojis) {
    const val = sentimentDictionary[e];
    if (typeof val === 'number') {
      score += val;
      if (val > 0) pos++;
      else if (val < 0) neg++;
    }
  }

  // Punctuation amplification
  const boost = punctuationBoost(punct);
  if (boost !== 0 && score !== 0) {
    score += score > 0 ? boost : -boost;
  }

  const totalTokens = words.length + emojis.length;
  const neu = Math.max(0, totalTokens - pos - neg);

  // 🔍 DEBUG LOGS (controlled by DEBUG_SENTIMENT flag)
  if (DEBUG_SENTIMENT) {
    console.log('[Sentiment] 🔹 TEXT:', text.substring(0, 50) + '...');
    console.log('[Sentiment] 🔸 Tokens:', { words: words.length, emojis: emojis.length, punct: punct.length });
    console.log('[Sentiment] 🔸 Final Score:', score.toFixed(2), 'Pos:', pos, 'Neg:', neg, 'Neu:', neu);
  }

  return { score, positives: pos, negatives: neg, neutrals: neu, wordsCount: totalTokens };
}

// 🔍 Classify sentiment based on score
function classifySentiment(score) {
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

// Score each segment individually (ENHANCED - Citation support)
export function scoreSegments(segments) {
  console.log(`[Sentiment] 📊 Scoring ${segments.length} segments...`);
  
  const scoredSegments = segments.map((segment, index) => {
    // Handle both string and object inputs
    const text = typeof segment === 'string' ? segment : segment.text;
    const metadata = typeof segment === 'object' ? segment : {};
    
    // Analyze sentiment
    const result = analyze(text);
    const sentiment = classifySentiment(result.score);
    
    // Build enhanced segment object
    const scoredSegment = {
      text: text,
      score: result.score,
      sentiment: sentiment,
      positives: result.positives,
      negatives: result.negatives,
      neutrals: result.neutrals,
      wordsCount: result.wordsCount,
      ...metadata // Preserve any existing metadata (citation, permalink, etc.)
    };
    
    // Debug log for first and last segments
    if (index === 0 || index === segments.length - 1) {
      console.log(`[Sentiment] 🔍 Segment ${index + 1}: ${sentiment} (${result.score.toFixed(2)}) "${text.substring(0, 40)}..."`);
      if (metadata.citationNumber) {
        console.log(`[Sentiment] 🔗 Citation [${metadata.citationNumber}] preserved`);
      }
    }
    
    return scoredSegment;
  });
  
  // 📊 Summary statistics
  const negCount = scoredSegments.filter(s => s.sentiment === 'negative').length;
  const posCount = scoredSegments.filter(s => s.sentiment === 'positive').length;
  const neuCount = scoredSegments.filter(s => s.sentiment === 'neutral').length;
  
  console.log(`[Sentiment] ✅ Scoring complete: ${negCount} 💀 negative | ${posCount} 💚 positive | ${neuCount} 😐 neutral`);
  
  return scoredSegments;
}

// Build histogram for bell curve
export function buildHistogram(scores, step = 1) {
  if (!scores.length) return { labels: [], counts: [], bins: [], total: 0 };
  let min = Math.max(Math.floor(Math.min(...scores)), -10);
  let max = Math.min(Math.ceil(Math.max(...scores)), 10);
  if (min > -1) min = -1;
  if (max < 1) max = 1;

  const bins = [];
  for (let start = min; start < max; start += step) {
    bins.push({ start, end: start + step, items: [], count: 0, avg: 0, pct: 0 });
  }

  for (const s of scores) {
    const idx = Math.min(bins.length - 1, Math.max(0, Math.floor((s - min) / step)));
    (bins[idx] || bins[bins.length - 1]).items.push(s);
  }

  const total = scores.length;
  for (const b of bins) {
    b.count = b.items.length;
    b.avg = b.count ? b.items.reduce((a, c) => a + c, 0) / b.count : 0;
    b.pct = total ? b.count / total : 0;
  }

  console.log('📊 Histogram:', bins);

  return {
    labels: bins.map(b => `${b.start}..${b.end}`),
    counts: bins.map(b => b.count),
    bins,
    total
  };
}