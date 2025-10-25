// ============================================
// SECTION 1: IMPORTS
// ============================================
import { setStatus, showSpinner, disableControls } from './ui.js';
import { fetchJsonWithTimeout, fetchSubredditPosts } from './api.js';
import { analyze, scoreSegments } from './sentiment.js';
import {
  renderPieBar,
  renderTable,
  renderBestBell,          // smart single/multi bell chooser
  renderSmallMultiples,    // mini Pie/Bar grid
  renderTableCompare       // multi-sub table
} from './viz.js';
import { setAnalysis, lastResult, lastScores, lastSeries } from './state.js';

// Game imports
import { SentimentGame } from './game.js';
import { InvadersRenderer } from './invaders.js';
import { initDebugTest } from './game_debug_test.js'; // 🧪 PHASE 3 Debug test

// ============================================
// SECTION 2: DOM ELEMENT REFERENCES
// ============================================
// ANALYSIS TAB elements
const analyzeBtn      = document.getElementById('analyzeBtn');
const inputText       = document.getElementById('inputText');
const scoreText       = document.getElementById('scoreText');
const resultsCard     = document.getElementById('results');
const subredditInput  = document.getElementById('subredditInput');
const fetchBtn        = document.getElementById('fetchBtn');
const limitSelect     = document.getElementById('limitSelect');
const sortSelect      = document.getElementById('sortSelect');
const topTimeSelect   = document.getElementById('topTimeSelect');
const topTimeCol      = document.getElementById('topTimeCol');
const vizSelect       = document.getElementById('vizSelect');

// GAME TAB elements
const gameSubredditInput = document.getElementById('gameSubredditInput');
const gameFetchBtn       = document.getElementById('gameFetchBtn');
const gameLimitSelect    = document.getElementById('gameLimitSelect');
const gameSortSelect     = document.getElementById('gameSortSelect');
const gameTopTimeSelect  = document.getElementById('gameTopTimeSelect');
const gameTopTimeCol     = document.getElementById('gameTopTimeCol');
const gameInputText      = document.getElementById('gameInputText');
const gameAnalyzeBtn     = document.getElementById('gameAnalyzeBtn');
const gameSubredditDisplay = document.getElementById('gameSubredditDisplay');
const gameSubredditName    = document.getElementById('gameSubredditName');
const gameEnemyPreview     = document.getElementById('gameEnemyPreview');
const gameEnemyPreviewText = document.getElementById('gameEnemyPreviewText');

// Game section elements (shared)
const playGameBtn     = document.getElementById('playGameBtn');
const pauseGameBtn    = document.getElementById('pauseGameBtn');
const restartGameBtn  = document.getElementById('restartGameBtn');
const gameCanvas      = document.getElementById('gameCanvas');

const LOG_PREFIX = '[Vibe]';
const GAME_LOG_PREFIX = '[SentimentInvaders]';

// ============================================
// SECTION 3: GAME STATE
// ============================================
let currentGame = null;
let currentRenderer = null;
let gameReady = false; // Track if data has been analyzed
let currentGameSubreddit = ''; // Track current game subreddit

// ============================================
// SECTION 4: INITIALIZATION
// ============================================

// ----------------------------------------
// 4.1: Boot - Preload Sample
// ----------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  console.log(`${LOG_PREFIX} DOM ready`);
  setStatus('', 'info'); showSpinner(false); disableControls(false);
  
  // Setup sort/time handlers for both tabs
  if (sortSelect && topTimeCol) {
    topTimeCol.style.display = (sortSelect.value === 'top') ? '' : 'none';
  }
  if (gameSortSelect && gameTopTimeCol) {
    gameTopTimeCol.style.display = (gameSortSelect.value === 'top') ? '' : 'none';
  }

  // Force "Table" as default viz at runtime
  if (vizSelect) {
    vizSelect.value = 'table';
    console.log(`${LOG_PREFIX} Default viz set to TABLE`);
  }

  // Disable Play Game button initially
  if (playGameBtn) {
    playGameBtn.disabled = true;
    console.log(`${GAME_LOG_PREFIX} Play button disabled - awaiting analysis`);
  }

  // Disable Restart button initially
  if (restartGameBtn) {
    restartGameBtn.disabled = true;
    console.log(`${GAME_LOG_PREFIX} Restart button disabled - awaiting game over`);
  }

  try {
    const res = await fetchJsonWithTimeout('./data/sample-thread.json', {}, 6000);
    if (!res.ok) return;
    const thread = await res.json();
    const segments = Array.isArray(thread.comments) ? thread.comments : [];
    if (segments.length) {
      const scored = scoreSegments(segments);
      setAnalysis({ segments: scored });

      inputText.value = segments.join('\n');
      const result = analyze(segments.join(' '));
      setAnalysis({ result });
      paintResult();
      console.log(`${LOG_PREFIX} Sample thread analyzed.`);
      
      // Show game section and enable play button after sample analysis
      showGameSection();
      enableGamePlay();
    }
  } catch (e) {
    console.warn(`${LOG_PREFIX} Sample not loaded:`, e.message);
  }
});

// ============================================
// SECTION 5: RENDERING FUNCTIONS
// ============================================

// ----------------------------------------
// 5.1: Paint Result (Main Rendering)
// ----------------------------------------
function paintResult() {
  const multi = Array.isArray(lastSeries) && lastSeries.length >= 2;
  const mode = (vizSelect?.value || 'table').toLowerCase();   // DEFAULT = table

  if (multi) {
    const first = lastSeries[0].result;
    if (first) {
      resultsCard.style.display = 'block';
      const { score } = first;
      scoreText.textContent = score > 0 ? `😊 Positive vibe (Score: ${score})`
                           : score < 0 ? `😡 Negative vibe (Score: ${score})`
                                       : `😐 Neutral vibe (Score: ${score})`;
      scoreText.style.color = score > 0 ? 'green' : score < 0 ? 'red' : 'gray';
    }

    if (mode === 'bell') {
      return renderBestBell();
    } else if (mode === 'table') {
      return renderTableCompare(lastSeries);
    } else {
      return renderSmallMultiples(lastSeries, mode); // 'pie' | 'bar'
    }
  }

  // Single-series behavior
  if (!lastResult) return;
  resultsCard.style.display = 'block';
  const { score, positives, negatives, neutrals } = lastResult;
  scoreText.textContent = score > 0 ? `😊 Positive vibe (Score: ${score})`
                     : score < 0 ? `😡 Negative vibe (Score: ${score})`
                                 : `😐 Neutral vibe (Score: ${score})`;
  scoreText.style.color = score > 0 ? 'green' : score < 0 ? 'red' : 'gray';

  if (mode === 'table')      renderTable({ positives, negatives, neutrals });
  else if (mode === 'bell')  renderBestBell(); // single-series bell using lastScores
  else                       renderPieBar(mode, { positives, negatives, neutrals });
}

// ----------------------------------------
// 5.2: Enable Game Play
// ----------------------------------------
function enableGamePlay() {
  gameReady = true;
  
  if (playGameBtn) {
    playGameBtn.disabled = false;
    console.log(`${GAME_LOG_PREFIX} ✅ Play button enabled`);
  }
  
  // Update enemy preview
  updateGameEnemyPreview();
}

// ----------------------------------------
// 5.3: Update Game Enemy Preview
// ----------------------------------------
function updateGameEnemyPreview() {
  // Count sentiment types from lastScores
  if (!Array.isArray(lastScores) || lastScores.length === 0) return;
  
  let negCount = 0;
  let posCount = 0;
  let neuCount = 0;
  
  lastScores.forEach(item => {
    // Handle both object format and legacy number format
    const sentiment = item.sentiment || (item.score > 0 ? 'positive' : item.score < 0 ? 'negative' : 'neutral');
    
    if (sentiment === 'negative') negCount++;
    else if (sentiment === 'positive') posCount++;
    else neuCount++;
  });
  
  const total = negCount + posCount + neuCount;
  
  console.log(`${GAME_LOG_PREFIX} 📊 Enemy preview: ${total} total (${negCount} 💀 ${posCount} 💚 ${neuCount} 😐)`);
  
  // Update game tab enemy preview with styled badges
  if (gameEnemyPreview && gameEnemyPreviewText) {
    gameEnemyPreviewText.innerHTML = `
      <strong style="font-size: 1.1rem;">Ready to face:</strong> 
      <span class="badge" style="background-color: #dc3545; color: white; font-size: 1rem; margin: 0 4px;">${negCount} 💀</span>
      <span class="badge" style="background-color: #28a745; color: white; font-size: 1rem; margin: 0 4px;">${posCount} 💚</span>
      <span class="badge" style="background-color: #6c757d; color: white; font-size: 1rem; margin: 0 4px;">${neuCount} 😐</span>
      <span style="color: #666; font-weight: 600; margin-left: 8px;">(${total} total)</span>
    `;
    gameEnemyPreview.style.display = 'block';
  }
}

// ----------------------------------------
// 5.4: Update Game Subreddit Display
// ----------------------------------------
function updateGameSubredditDisplay() {
  if (!gameSubredditDisplay || !gameSubredditName) return;
  
  if (currentGameSubreddit) {
    gameSubredditName.textContent = `r/${currentGameSubreddit}`;
    gameSubredditDisplay.style.display = 'block';
    console.log(`${GAME_LOG_PREFIX} 📋 Displaying game subreddit: r/${currentGameSubreddit}`);
  } else {
    gameSubredditDisplay.style.display = 'none';
  }
}

// ----------------------------------------
// 5.5: Build Source Table (NEW - Citation tracking)
// ----------------------------------------
function buildSourceTable(segments) {
  console.log(`${GAME_LOG_PREFIX} 📊 Building source table with ${segments.length} comments...`);
  
  const tableBody = document.getElementById('sourceTableBody');
  if (!tableBody) {
    console.warn(`${GAME_LOG_PREFIX} ⚠️ Source table body element not found`);
    return;
  }
  
  // Clear existing rows
  tableBody.innerHTML = '';
  
  // Count comments per source
  const sourceCount = {};
  segments.forEach(seg => {
    const key = seg.postUrl || seg.subreddit;
    sourceCount[key] = (sourceCount[key] || 0) + 1;
  });
  
  console.log(`${GAME_LOG_PREFIX} 📈 Source distribution:`, sourceCount);
  
  // Build table rows
  segments.forEach((seg, index) => {
    const row = document.createElement('tr');
    
    // Citation number
    const citationCell = document.createElement('td');
    citationCell.textContent = `[${seg.citationNumber}]`;
    citationCell.className = 'text-center';
    citationCell.style.fontWeight = 'bold';
    row.appendChild(citationCell);
    
    // Comment preview (first 40 chars)
    const commentCell = document.createElement('td');
    const preview = seg.text.length > 40 ? seg.text.substring(0, 40) + '...' : seg.text;
    commentCell.textContent = preview;
    commentCell.title = seg.text; // Full text on hover
    row.appendChild(commentCell);
    
    // Sentiment
    const sentimentCell = document.createElement('td');
    const sentimentBadge = document.createElement('span');
    sentimentBadge.className = 'badge';
    
    if (seg.sentiment === 'negative') {
      sentimentBadge.style.backgroundColor = '#dc3545';
      sentimentBadge.textContent = '💀 Neg';
    } else if (seg.sentiment === 'positive') {
      sentimentBadge.style.backgroundColor = '#28a745';
      sentimentBadge.textContent = '💚 Pos';
    } else {
      sentimentBadge.style.backgroundColor = '#6c757d';
      sentimentBadge.textContent = '😐 Neu';
    }
    sentimentBadge.style.color = 'white';
    sentimentCell.appendChild(sentimentBadge);
    row.appendChild(sentimentCell);
    
    // Subreddit
    const subredditCell = document.createElement('td');
    subredditCell.textContent = `r/${seg.subreddit}`;
    row.appendChild(subredditCell);
    
    // Post link
    const linkCell = document.createElement('td');
    if (seg.postUrl) {
      const link = document.createElement('a');
      link.href = seg.postUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = '🔗 View Thread';
      link.className = 'btn btn-sm btn-outline-primary';
      linkCell.appendChild(link);
    } else {
      linkCell.textContent = 'N/A';
    }
    row.appendChild(linkCell);
    
    tableBody.appendChild(row);
  });
  
  // Update table header count
  const tableCount = document.getElementById('sourceTableCount');
  if (tableCount) {
    tableCount.textContent = segments.length;
  }
  
  // Show the table section
  const tableSection = document.getElementById('sourceTableSection');
  if (tableSection) {
    tableSection.style.display = 'block';
    console.log(`${GAME_LOG_PREFIX} ✅ Source table built with ${segments.length} rows`);
  }
}

// ============================================
// SECTION 6: GAME FUNCTIONS
// ============================================

// ----------------------------------------
// 6.1: Prepare Comments for Game (UPDATED - Multi-wave support)
// ----------------------------------------
function prepareCommentsForGame() {
  console.log(`${GAME_LOG_PREFIX} 📝 Preparing comments for game...`);
  
  // Check if we have multi-subreddit data (waves mode)
  const isMultiMode = Array.isArray(lastSeries) && lastSeries.length > 1;
  
  if (isMultiMode) {
    console.log(`${GAME_LOG_PREFIX} 🌊 MULTI-WAVE MODE: ${lastSeries.length} subreddits detected`);
    
    // Create wave structure
    const waves = lastSeries.map((seriesItem, waveIndex) => {
      const segments = seriesItem.segments || [];
      const subreddit = seriesItem.label || `Topic ${waveIndex + 1}`;
      
      console.log(`${GAME_LOG_PREFIX} 🌊 Wave ${waveIndex + 1}: r/${subreddit} - ${segments.length} comments`);
      
      // Convert segments to game format
      const comments = segments.map((item, index) => {
        let text, score, sentiment;
        
        if (typeof item === 'object' && item !== null) {
          text = item.text || `Comment ${index + 1}`;
          score = item.score || 0;
          sentiment = item.sentiment || (score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral');
        } else {
          score = typeof item === 'number' ? item : 0;
          text = `Comment ${index + 1}`;
          sentiment = score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral';
        }
        
        return { text, sentiment, score };
      });
      
      return {
        subreddit: subreddit,
        comments: comments,
        waveNumber: waveIndex + 1
      };
    });
    
    console.log(`${GAME_LOG_PREFIX} ✅ Prepared ${waves.length} waves`);
    waves.forEach((wave, i) => {
      const negCount = wave.comments.filter(c => c.sentiment === 'negative').length;
      const posCount = wave.comments.filter(c => c.sentiment === 'positive').length;
      const neuCount = wave.comments.filter(c => c.sentiment === 'neutral').length;
      console.log(`${GAME_LOG_PREFIX}   Wave ${i + 1} (r/${wave.subreddit}): ${negCount} neg, ${posCount} pos, ${neuCount} neu`);
    });
    
    return { mode: 'waves', waves: waves };
  }
  
  // SINGLE MODE (original logic)
  console.log(`${GAME_LOG_PREFIX} 📋 SINGLE MODE: Using single comment set`);
  
  const segments = lastScores || [];
  
  if (segments.length === 0) {
    console.warn(`${GAME_LOG_PREFIX} No comments available`);
    return { mode: 'single', comments: [] };
  }
  
  console.log(`${GAME_LOG_PREFIX} Raw segments:`, segments.slice(0, 3));
  
  // Convert to game format
  const comments = segments.map((item, index) => {
    let text, score, sentiment;
    
    if (typeof item === 'object' && item !== null) {
      text = item.text || `Comment ${index + 1}`;
      score = item.score || 0;
      sentiment = item.sentiment || (score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral');
    } else {
      score = typeof item === 'number' ? item : 0;
      text = `Comment ${index + 1}`;
      sentiment = score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral';
    }
    
    return { text, sentiment, score };
  });
  
  const negCount = comments.filter(c => c.sentiment === 'negative').length;
  const posCount = comments.filter(c => c.sentiment === 'positive').length;
  const neuCount = comments.filter(c => c.sentiment === 'neutral').length;
  
  console.log(`${GAME_LOG_PREFIX} ✅ Prepared ${comments.length} comments (single mode)`);
  console.log(`${GAME_LOG_PREFIX} Breakdown: ${negCount} neg, ${posCount} pos, ${neuCount} neu`);
  console.log(`${GAME_LOG_PREFIX} Sample comment:`, comments[0]);
  
  return { mode: 'single', comments: comments };
}

// ----------------------------------------
// 6.2: Start Game
// ----------------------------------------
function startGame() {
  console.log(`${GAME_LOG_PREFIX} 🎮 Play Game button clicked!`);
  
  if (!gameReady) {
    console.warn(`${GAME_LOG_PREFIX} ⚠️ Game not ready - please analyze text first`);
    alert('Please analyze a subreddit or paste text first!');
    return;
  }
  
  // Check if canvas exists
  if (!gameCanvas) {
    console.error(`${GAME_LOG_PREFIX} ❌ Canvas element not found`);
    return;
  }
  
  // Get difficulty setting
  const difficultyRadios = document.querySelectorAll('input[name="difficulty"]');
  let difficulty = 'normal';
  difficultyRadios.forEach(radio => {
    if (radio.checked) difficulty = radio.value;
  });
  console.log(`${GAME_LOG_PREFIX} Difficulty selected: ${difficulty}`);
  
  // Prepare comments/waves
  const gameData = prepareCommentsForGame();
  
  console.log(`${GAME_LOG_PREFIX} 🎮 Game mode:`, gameData.mode);
  
  // Validate data
  if (gameData.mode === 'single' && (!gameData.comments || gameData.comments.length === 0)) {
    console.warn(`${GAME_LOG_PREFIX} ⚠️ No comments to use for game`);
    alert('No comments available. Please analyze some text first!');
    return;
  }
  
  if (gameData.mode === 'waves' && (!gameData.waves || gameData.waves.length === 0)) {
    console.warn(`${GAME_LOG_PREFIX} ⚠️ No waves to use for game`);
    alert('No subreddit data available. Please analyze subreddits first!');
    return;
  }
  
  try {
    // Clean up existing game if any
    if (currentRenderer) {
      console.log(`${GAME_LOG_PREFIX} Cleaning up existing game...`);
      currentRenderer.cleanup();
    }
    
    // Create new game instance with wave/single data
    console.log(`${GAME_LOG_PREFIX} Creating new game instance...`);
    currentGame = new SentimentGame(gameCanvas, gameData, difficulty);
    
    console.log(`${GAME_LOG_PREFIX} ✅ Game instance created`);
    console.log(`${GAME_LOG_PREFIX} Player starting position: (${currentGame.player.x}, ${currentGame.player.y})`);
    console.log(`${GAME_LOG_PREFIX} Enemies created: ${currentGame.enemies.length}`);
    
    // Create renderer
    console.log(`${GAME_LOG_PREFIX} Creating renderer...`);
    currentRenderer = new InvadersRenderer(currentGame);
    
    console.log(`${GAME_LOG_PREFIX} ✅ Renderer created`);
    
    // Start the game (PHASE 3 FIX + DEBUG TEST)
    console.log(`${GAME_LOG_PREFIX} Starting game loop...`);
    currentGame.start();        // 🔧 FIX: Start game logic FIRST
    currentRenderer.start();    // Then start render loop
    
    // 🧪 PHASE 3 DEBUG TEST: Spawn test enemy to verify game loop
    initDebugTest(currentGame);
    
    console.log(`${GAME_LOG_PREFIX} ✅ Game started! Use arrow keys (or touch buttons) to move, spacebar to shoot`);
    
    // Update button states
    if (playGameBtn) playGameBtn.disabled = true;
    if (pauseGameBtn) pauseGameBtn.style.display = 'inline-block';
    if (restartGameBtn) restartGameBtn.style.display = 'inline-block';
    
  } catch (error) {
    console.error(`${GAME_LOG_PREFIX} ❌ Failed to start game:`, error);
    alert('Failed to start game. Check console for details.');
  }
}

// ----------------------------------------
// 6.3: Pause/Resume Game
// ----------------------------------------
function togglePause() {
  if (!currentGame) return;
  
  currentGame.start();
  currentGame.pause();
  const state = currentGame.getState();
  
  console.log(`${GAME_LOG_PREFIX} ${state.paused ? '⏸️ Game paused' : '▶️ Game resumed'}`);
  
  // Update pause button text
  if (pauseGameBtn) {
    pauseGameBtn.textContent = state.paused ? '▶️ Resume' : '⏸️ Pause';
  }
}

// ----------------------------------------
// 6.4: Restart Game
// ----------------------------------------
function restartGame() {
  console.log(`${GAME_LOG_PREFIX} 🔄 Restart button clicked`);
  
  if (!currentGame || !currentRenderer) {
    console.warn(`${GAME_LOG_PREFIX} No active game to restart`);
    startGame(); // Start fresh
    return;
  }
  
  // Reset game state
  currentGame.reset();
  console.log(`${GAME_LOG_PREFIX} ✅ Game reset`);
  console.log(`${GAME_LOG_PREFIX} Player position: (${currentGame.player.x}, ${currentGame.player.y})`);
  
  // 🔧 FIX: Start the game logic after reset!
  currentGame.start();
  console.log(`${GAME_LOG_PREFIX} ▶️ Game logic restarted`);
  
  // Restart renderer
  currentRenderer.stop();
  currentRenderer.start();
  
  console.log(`${GAME_LOG_PREFIX} ✅ Game restarted - using same enemies`);
  
  // Update button states
  if (playGameBtn) playGameBtn.disabled = true;
  if (pauseGameBtn) {
    pauseGameBtn.style.display = 'inline-block';
    pauseGameBtn.textContent = '⏸️ Pause';
  }
  if (restartGameBtn) restartGameBtn.disabled = true; // Disable until next game over
}

// ============================================
// SECTION 7: HELPER FUNCTIONS
// ============================================

// ----------------------------------------
// 7.1: Parse Subreddit Input
// ----------------------------------------
function parseSubs(input, cap = 5) {
  const clean = (input || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => s.replace(/[^\w]/g, '')) // subreddit-safe
    .filter(Boolean);

  if (clean.length > cap) {
    clean.length = cap;
    setStatus(`You entered more than ${cap} subreddits. Using the first ${cap}.`, 'warning');
  }
  return clean;
}

// ============================================
// SECTION 8: EVENT LISTENERS
// ============================================

// ----------------------------------------
// 8.1: Visualization Change
// ----------------------------------------
vizSelect?.addEventListener('change', paintResult);

// ----------------------------------------
// 8.2: Analyze Button (Manual Text)
// ----------------------------------------
// 8.2: Analyze Button (ANALYSIS TAB - Manual Text)
// ----------------------------------------
analyzeBtn?.addEventListener('click', () => {
  const text = inputText.value.trim();
  if (!text) return setStatus('Please paste some text to analyze.', 'warning');
  setStatus('Analyzing pasted text…', 'info');

  const segs = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const scored = scoreSegments(segs.length ? segs : [text]);
  setAnalysis({ segments: scored });

  setAnalysis({ result: analyze(text), series: [] }); // clear multi-series when manual
  paintResult();
  setStatus('Done.', 'success');
});

// ----------------------------------------
// 8.2b: Game Analyze Button (GAME TAB - Manual Text)
// ----------------------------------------
gameAnalyzeBtn?.addEventListener('click', () => {
  const text = gameInputText.value.trim();
  if (!text) return setStatus('Please paste some text to create enemies.', 'warning');
  setStatus('Loading game from text…', 'info');

  const segs = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  
  console.log(`${GAME_LOG_PREFIX} 📝 Processing ${segs.length} manual text segments...`);
  
  // Add citation metadata to manual text
  const segmentsWithMetadata = segs.map((seg, index) => ({
    text: seg,
    citationNumber: index + 1,
    subreddit: 'Manual',
    permalink: null,
    postTitle: 'Manual Entry',
    postUrl: null
  }));
  
  const scored = scoreSegments(segs.length ? segs : [text]);
  
  // Merge metadata
  const scoredWithMetadata = scored.map((scoreObj, index) => ({
    ...scoreObj,
    ...segmentsWithMetadata[index]
  }));
  
  console.log(`${GAME_LOG_PREFIX} ✅ Created ${scoredWithMetadata.length} segments with citations`);
  
  setAnalysis({ 
    segments: scoredWithMetadata,
    result: analyze(text), 
    series: [] 
  });
  
  // Build source table
  buildSourceTable(scoredWithMetadata);
  
  // Update game displays
  currentGameSubreddit = 'Custom Text';
  updateGameSubredditDisplay();
  enableGamePlay();
  
  setStatus('Game ready! Click Play Game.', 'success');
  console.log(`${GAME_LOG_PREFIX} ✅ Game loaded from custom text with ${scoredWithMetadata.length} citations`);
});

// ----------------------------------------
// 8.2c: Game Fetch Button (GAME TAB - Single Subreddit)
// ----------------------------------------
gameFetchBtn?.addEventListener('click', async () => {
  setStatus('', 'info');
  
  const subInput = gameSubredditInput?.value.trim();
  if (!subInput) return setStatus('Please enter a subreddit name.', 'warning');
  
  // Strip 'r/' if user included it
  const sub = subInput.replace(/^r\//, '');
  
  // Validate single subreddit (no commas allowed)
  if (sub.includes(',')) {
    return setStatus('⚠️ Game mode only supports ONE subreddit. Remove commas.', 'warning');
  }

  const limit = parseInt(gameLimitSelect?.value || '100', 10);
  const sort  = (gameSortSelect?.value || 'hot').toLowerCase();
  const t     = (sort === 'top' && gameTopTimeSelect) ? (gameTopTimeSelect.value || 'day') : '';

  setStatus(`Loading game from r/${sub} (${sort}${t ? `, ${t}` : ''})…`, 'info');
  showSpinner(true); disableControls(true);

  try {
    const res = await fetchSubredditPosts(sub, { limit: isNaN(limit) ? 100 : limit, sort, t });
    
    if (!res.ok) {
      return setStatus(`Failed to fetch r/${sub} (HTTP ${res.status})`, 'danger');
    }

    const json = await res.json();
    const posts = json?.data?.children || [];
    
    if (!posts.length) {
      return setStatus(`No posts found for r/${sub}`, 'warning');
    }

    // Filter text-only posts
    const textOnlyPosts = posts.filter(p => {
      const post = p?.data;
      if (!post) return false;
      
      const hasImage = post.post_hint === 'image' || post.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
      const hasVideo = post.is_video || post.post_hint === 'video' || post.url?.includes('v.redd.it');
      const hasGif = post.url?.includes('.gif') || post.url?.includes('gfycat');
      const hasAudio = post.url?.match(/\.(mp3|wav|ogg|m4a)$/i);
      const hasYouTube = post.url?.includes('youtube.com') || post.url?.includes('youtu.be');
      const hasExternal = post.is_gallery || post.media || post.secure_media;
      
      return !hasImage && !hasVideo && !hasGif && !hasAudio && !hasYouTube && !hasExternal;
    });
    
    console.log(`${GAME_LOG_PREFIX} 📝 Filtered r/${sub}: ${posts.length} total → ${textOnlyPosts.length} text posts`);

    if (!textOnlyPosts.length) {
      return setStatus(`No text posts found for r/${sub} after filtering media`, 'warning');
    }

    // 🔗 CITATION ENHANCEMENT: Build segments with metadata
    const segmentsWithMetadata = textOnlyPosts.map((p, index) => {
      const postData = p?.data;
      const text = `${postData?.title || ''} ${postData?.selftext || ''}`.trim();
      const permalink = postData?.permalink || '';
      const postTitle = postData?.title || 'Untitled';
      
      console.log(`${GAME_LOG_PREFIX} 🔗 Citation ${index + 1}: "${text.substring(0, 40)}..." → ${permalink}`);
      
      return {
        text: text,
        citationNumber: index + 1,
        subreddit: sub,
        permalink: permalink,
        postTitle: postTitle,
        postUrl: permalink ? `https://reddit.com${permalink}` : null
      };
    });

    console.log(`${GAME_LOG_PREFIX} ✅ Created ${segmentsWithMetadata.length} segments with citation metadata`);

    // Extract just text for scoring
    const segments = segmentsWithMetadata.map(s => s.text).filter(Boolean);
    
    console.log(`${GAME_LOG_PREFIX} 📊 Scoring ${segments.length} text segments...`);
    const scored = scoreSegments(segments);
    
    // 🔗 MERGE: Add metadata back to scored segments
    const scoredWithMetadata = scored.map((scoreObj, index) => {
      const metadata = segmentsWithMetadata[index];
      return {
        ...scoreObj,
        citationNumber: metadata.citationNumber,
        subreddit: metadata.subreddit,
        permalink: metadata.permalink,
        postTitle: metadata.postTitle,
        postUrl: metadata.postUrl
      };
    });
    
    console.log(`${GAME_LOG_PREFIX} ✅ Merged metadata with sentiment scores`);
    console.log(`${GAME_LOG_PREFIX} 📋 Sample citation: #${scoredWithMetadata[0]?.citationNumber} - ${scoredWithMetadata[0]?.sentiment} - "${scoredWithMetadata[0]?.text?.substring(0, 30)}..."`);

    const result = analyze(segments.join(' '));

    setAnalysis({ 
      result, 
      segments: scoredWithMetadata, // Now includes citation metadata!
      series: [{ label: sub, segments: scoredWithMetadata, result }]
    });
    
    // 📊 BUILD SOURCE TABLE
    buildSourceTable(scoredWithMetadata);

    // Update game displays
    currentGameSubreddit = sub;
    updateGameSubredditDisplay();
    enableGamePlay();

    setStatus(`✅ Game ready! Loaded ${textOnlyPosts.length} posts from r/${sub}. Click Play Game!`, 'success');

  } catch (err) {
    console.error('Game fetch error:', err);
    setStatus(err.name === 'AbortError'
      ? 'Request timed out. Try again.'
      : `Failed to fetch r/${sub}`, 'danger');
  } finally {
    showSpinner(false); disableControls(false);
  }
});

// ----------------------------------------
// 8.3: Play Game Button
// ----------------------------------------
playGameBtn?.addEventListener('click', () => {
  startGame();
});

// ----------------------------------------
// 8.4: Pause Game Button
// ----------------------------------------
pauseGameBtn?.addEventListener('click', () => {
  togglePause();
});

// ----------------------------------------
// 8.5: Restart Game Button
// ----------------------------------------
restartGameBtn?.addEventListener('click', () => {
  restartGame();
});

// ----------------------------------------
// 8.6: Difficulty Change
// ----------------------------------------
const difficultyRadios = document.querySelectorAll('input[name="difficulty"]');
difficultyRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    console.log(`${GAME_LOG_PREFIX} Difficulty changed to: ${radio.value}`);
    // Note: Difficulty only applies when starting a new game
  });
});

// ----------------------------------------
// 8.7: Subreddit Input Enter Key
// ----------------------------------------
subredditInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    fetchBtn?.click();
  }
});

// ----------------------------------------
// 8.8: Fetch Button (Live Subreddit)
// ----------------------------------------
fetchBtn?.addEventListener('click', async () => {
  setStatus('', 'info');
  const subs = parseSubs(subredditInput?.value, 5);
  if (!subs.length) return setStatus('Please enter at least one valid subreddit.', 'warning');

  const limit = parseInt(limitSelect?.value || '100', 10);
  const sort  = (sortSelect?.value || 'hot').toLowerCase();
  const t     = (sort === 'top' && topTimeSelect) ? (topTimeSelect.value || 'day') : '';

  setStatus(`Fetching ${sort}${t ? ` (${t})` : ''} for ${subs.map(s => `r/${s}`).join(', ')}…`, 'info');
  showSpinner(true); disableControls(true);

  try {
    // fetch in parallel
    const responses = await Promise.allSettled(
      subs.map(s => fetchSubredditPosts(s, { limit: isNaN(limit) ? 100 : limit, sort, t }))
    );

    const series = [];
    let firstTitles = [];

    for (let i = 0; i < responses.length; i++) {
      const sub = subs[i];
      const r = responses[i];

      if (r.status !== 'fulfilled') {
        console.warn(`${LOG_PREFIX} Fetch failed for r/${sub}:`, r.reason);
        continue;
      }

      const res = r.value;
      if (!res.ok) {
        console.warn(`${LOG_PREFIX} HTTP ${res.status} for r/${sub}`);
        continue;
      }

      const json  = await res.json();
      const posts = json?.data?.children || [];
      if (!posts.length) {
        console.log(`${LOG_PREFIX} No posts for r/${sub}`);
        continue;
      }

      // FIX #2: Filter out media posts - only keep text-based content
      const textOnlyPosts = posts.filter(p => {
        const post = p?.data;
        if (!post) return false;
        
        // Exclude posts with media
        const hasImage = post.post_hint === 'image' || post.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
        const hasVideo = post.is_video || post.post_hint === 'video' || post.url?.includes('v.redd.it');
        const hasGif = post.url?.includes('.gif') || post.url?.includes('gfycat') || post.url?.includes('imgur.com/a/');
        const hasAudio = post.url?.match(/\.(mp3|wav|ogg|m4a)$/i);
        const hasYouTube = post.url?.includes('youtube.com') || post.url?.includes('youtu.be');
        const hasExternal = post.is_gallery || post.media || post.secure_media;
        
        // Only include if it's text-based
        const isTextPost = !hasImage && !hasVideo && !hasGif && !hasAudio && !hasYouTube && !hasExternal;
        
        return isTextPost;
      });
      
      console.log(`${LOG_PREFIX} 📝 Filtered r/${sub}: ${posts.length} total → ${textOnlyPosts.length} text posts (${posts.length - textOnlyPosts.length} media filtered)`);

      if (!textOnlyPosts.length) {
        console.log(`${LOG_PREFIX} No text posts for r/${sub} after filtering`);
        continue;
      }

      const segments = textOnlyPosts
        .map(p => `${p?.data?.title || ''} ${p?.data?.selftext || ''}`.trim())
        .filter(Boolean);

      const scored = scoreSegments(segments);
      // FIXED: Keep full objects with text, not just scores
      const result = analyze(segments.join(' '));

      series.push({ label: sub, segments: scored, result });

      if (!firstTitles.length) {
        firstTitles = textOnlyPosts.map(p => p?.data?.title || '').filter(Boolean).slice(0, 50);
      }
    }

    if (!series.length) {
      return setStatus(`No ${sort} posts available for the requested subreddit(s).`, 'warning');
    }

    setAnalysis({
      result: series[0].result,
      segments: series[0].segments,  // FIXED: Save full segment objects
      series
    });

    if (firstTitles.length) {
      inputText.value = firstTitles.join('\n');
    }

    // Decide which visualization to render now (DEFAULT = table)
    const viz = (vizSelect?.value || 'table').toLowerCase();
    if (series.length >= 2) {
      if (viz === 'bell')       renderBestBell();                 // overlay lines
      else if (viz === 'table') renderTableCompare(series);       // compare rows
      else                      renderSmallMultiples(series, viz);// pie/bar grid
    } else {
      paintResult(); // single-series path uses current default
    }

    const okList = series.map(s => `r/${s.label}`).join(', ');
    setStatus(`Analyzed ${okList} (${sort}${t ? `, ${t}` : ''}). Tip: choose "Bell Curve" to compare.`, 'success');

  } catch (err) {
    console.error('Subreddit fetch error:', err);
    setStatus(err.name === 'AbortError'
      ? 'Request timed out. Try again.'
      : 'Failed to fetch one or more subreddits.', 'danger');
  } finally {
    showSpinner(false); disableControls(false);
  }
});

// ----------------------------------------
// 8.9: Sort Select Change Handlers
// ----------------------------------------
sortSelect?.addEventListener('change', () => {
  if (!topTimeCol) return;
  topTimeCol.style.display = (sortSelect.value === 'top') ? '' : 'none';
});

gameSortSelect?.addEventListener('change', () => {
  if (!gameTopTimeCol) return;
  gameTopTimeCol.style.display = (gameSortSelect.value === 'top') ? '' : 'none';
});