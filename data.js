// =======================================================
// data.js
// Expanded sentiment dictionary (rule-based, no ML)
// =======================================================
//
// How scoring works (see /js/sentiment.js):
// - Words are matched case-insensitively (we boost ALL-CAPS).
// - Negations flip the next scored word (e.g., "not good" -> negative).
// - Boosters like "very" increase the next scored word's weight.
// - Punctuation '!' slightly amplifies the final score.
// - Emojis are scored by exact character (copy/paste them below).
//
// Tip: keep values small (-3..+3). Extremes can drown out context.
//

const sentimentDictionary = {
  // --- Core positives ---
  "love": 3, "loves": 3, "loved": 3,
  "great": 2, "awesome": 3, "amazing": 3, "excellent": 3, "fantastic": 3,
  "good": 1, "nice": 1, "cool": 1, "fun": 2, "happy": 2, "joy": 2,
  "like": 1, "liked": 1, "likes": 1, "enjoy": 2, "enjoyed": 2, "enjoys": 2,
  "win": 2, "wins": 2, "won": 2, "victory": 3, "progress": 2, "improve": 1, "improved": 1, "improving": 1,
  "support": 1, "supports": 1, "supported": 1, "approve": 1, "approved": 1, "approval": 1,
  "safe": 1, "safer": 1, "safest": 2, "secure": 1, "peace": 2, "peaceful": 2,
  "ethical": 1, "fair": 1, "kind": 1, "helpful": 2, "help": 1, "helps": 1, "helped": 1,
  "sustainable": 1, "green": 1, "clean": 1, "healthy": 2,
  "growth": 1, "surge": 1, "boom": 2, "record": 1, "gain": 1, "gains": 1, "bullish": 1,

  // --- Core negatives ---
  "bad": -1, "worse": -2, "worst": -3,
  "hate": -3, "hates": -3, "hated": -3,
  "terrible": -3, "awful": -3, "horrible": -3, "disaster": -3, "catastrophe": -3,
  "sad": -2, "angry": -2, "furious": -3, "upset": -2, "disgusting": -3, "annoying": -2, "boring": -1, "meh": -1,
  "fail": -2, "fails": -2, "failed": -2, "failure": -3, "collapse": -3, "crash": -3, "decline": -1, "drop": -1, "drops": -1, "fell": -1,
  "crime": -2, "criminal": -2, "scandal": -2, "fraud": -3, "scam": -3, "corrupt": -3, "corruption": -3,
  "ban": -2, "banned": -2, "blocked": -1, "block": -1, "restrict": -1, "restricted": -1,
  "risk": -1, "danger": -2, "dangerous": -2, "threat": -2, "threats": -2, "violent": -3, "violence": -3,
  "war": -3, "invasion": -3, "attack": -2, "attacks": -2, "bomb": -3, "missile": -2, "strike": -2,
  "guilty": -2, "lawsuit": -2, "charges": -2, "arrest": -2, "arrested": -2, "indicted": -2,
  "toxic": -2, "unsafe": -2, "unethical": -2, "lie": -2, "lies": -2, "lying": -2,

  // --- Newsy, policy & economy phrases (single tokens) ---
  "inflation": -1, "recession": -2, "debt": -1, "deficit": -1, "unemployment": -2,
  "shortage": -1, "outage": -1, "leak": -1, "breach": -2,
  "recall": -1, "boycott": -1, "protest": -1, "strikeaction": -1, // (won't usually appear, but safe)

  // --- Pos/Neg verbs & adjectives often seen in headlines ---
  "promise": 1, "promises": 1, "promised": 1,
  "deliver": 1, "delivers": 1, "delivered": 1,
  "boost": 1, "boosts": 1, "boosted": 1,
  "cut": -1, "cuts": -1, "cutting": -1, "slashed": -2,
  "warn": -1, "warns": -1, "warning": -1,
  "praise": 2, "praised": 2, "praises": 2,
  "condemn": -2, "condemns": -2, "condemned": -2,

  // --- Common neutral-ish that often signal sentiment when negated/boosted ---
  "goodbye": 0, "ok": 0, "fine": 0, "normal": 0,

  // --- Emojis (copy/paste exact glyphs) ---
  "😊": 2, "😀": 2, "😃": 2, "😄": 2, "😉": 1, "🙂": 1, "😁": 2, "🥳": 3, "🎉": 3,
  "😍": 3, "❤️": 3, "💖": 3, "💙": 2, "💚": 2, "🔥": 2, "💯": 3, "👍": 2, "🙏": 1,
  "😂": 2, "😆": 2,

  "😐": 0, "😑": 0,

  "😕": -1, "🙁": -1, "☹️": -1, "😞": -2, "😔": -2, "😢": -2, "😭": -3,
  "😡": -3, "🤬": -3, "😠": -2, "😤": -2, "🤮": -3, "💔": -3, "👎": -2,
  "😱": -2, "😨": -2, "😰": -2, "😓": -1, "😵": -1, "💀": -2, "🤡": -2
};

// Nothing to export; this file runs before the ES modules and exposes
// `sentimentDictionary` as a global used by /js/sentiment.js.
