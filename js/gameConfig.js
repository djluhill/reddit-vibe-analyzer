// ============================================
// SECTION 1: GAME CONFIGURATION DATABASE
// ============================================
// Central configuration for all game parameters
// Tune these values to balance gameplay without touching game logic

const LOG_PREFIX = '[GameConfig]';

// ============================================
// SECTION 2: MAIN CONFIGURATION OBJECT
// ============================================

export const GAME_CONFIG = {
  
  // ============================================
  // 2.1: PLAYER CONFIGURATION
  // ============================================
  player: {
    width: 40,                    // Player ship width (pixels)
    height: 40,                   // Player ship height (pixels)
    speed: 6,                     // Movement speed (pixels per frame)
    maxHealth: 100,               // Maximum health points
    startingHealth: 100,          // Health at game start
    invulnerabilityTime: 1500,    // Milliseconds of invincibility after hit
    color: '#00ffff',             // Player ship color (cyan)
    strokeColor: '#ffffff',       // Player ship outline color
    strokeWidth: 2,               // Player ship outline width
  },
  
  // ============================================
  // 2.2: WEAPON CONFIGURATIONS
  // ============================================
  weapons: {
    normal: {
      name: 'Normal',
      fireRate: 200,              // UPDATED: 2x faster (was 400ms, now 200ms)
      bulletSpeed: 10,            // Bullet velocity (pixels per frame)
      bulletSize: 6,              // Bullet radius (pixels)
      bulletColor: '#ffff00',     // Yellow bullets
      damage: 10,                 // Damage per hit
    },
    fasterFireRate: {
      name: 'Rapid Fire',
      fireRate: 100,              // UPDATED: Even faster with power-up (was 200ms, now 100ms)
      bulletSpeed: 10,
      bulletSize: 6,
      bulletColor: '#ff9900',     // Orange bullets
      damage: 10,
      duration: 5000,             // Power-up lasts 5 seconds
      icon: '⚡',                 // Display icon
    },
    biggerBullets: {
      name: 'Heavy Shot',
      fireRate: 300,              // UPDATED: Slightly faster (was 400ms, now 300ms)
      bulletSpeed: 8,             // Slightly slower
      bulletSize: 14,             // Much bigger
      bulletColor: '#ff0099',     // Pink bullets
      damage: 25,                 // 2.5x damage
      duration: 5000,
      icon: '💥',
    },
    spreadShot: {
      name: 'Spread Shot',
      fireRate: 250,              // NEW: Moderate fire rate
      bulletSpeed: 10,            // Standard speed
      bulletSize: 7,              // Slightly bigger than normal
      bulletColor: '#ffcc00',     // Gold bullets
      damage: 12,                 // Slightly more damage than normal
      duration: 5000,
      icon: '✨',                 // Display icon
    },
    ultimate: {
      name: 'Ultimate',
      fireRate: 80,               // UPDATED: Ultra fast (was 150ms, now 80ms)
      bulletSpeed: 12,            // Super fast bullets
      bulletSize: 18,             // Huge bullets
      bulletColor: '#00ff00',     // Green bullets
      damage: 35,                 // Massive damage
      duration: 5000,
      icon: '🔥',
    }
  },
  
  // ============================================
  // 2.3: ENEMY (COMMENT) CONFIGURATIONS
  // ============================================
  enemies: {
    negative: {
      type: 'negative',
      baseSpeed: 2,               // Base falling speed (pixels per frame)
      damage: 20,                 // Damage to player on collision
      points: 100,                // Points for destroying
      color: {
        fill: '#000000',          // Black background
        stroke: '#ff0000',        // Red border
        strokeWidth: 3,
        textColor: '#ffffff',     // White text
      },
      // Health based on comment length (longer = tankier)
      getHealth: (textLength) => Math.max(1, Math.ceil(textLength / 50)),
      maxWidth: 180,              // Maximum bubble width
      minWidth: 100,              // Minimum bubble width
      baseHeight: 50,             // Base bubble height
    },
    positive: {
      type: 'positive',
      baseSpeed: 1.5,             // Falls slower than negative
      damage: 0,                  // Doesn't hurt player
      points: 50,                 // Points for collecting
      color: {
        fill: '#ffffff',          // White background
        stroke: '#00ff00',        // Green border
        strokeWidth: 3,
        textColor: '#000000',     // Black text
      },
      powerUpChance: 0.8,         // 80% chance to give power-up
      getHealth: (textLength) => 1, // Always destroyed in one hit
      maxWidth: 180,
      minWidth: 100,
      baseHeight: 50,
    },
    neutral: {
      type: 'neutral',
      baseSpeed: 1.5,             // Falls at medium speed
      damage: 0,                  // Doesn't hurt player
      points: 25,                 // Small points for collecting
      color: {
        fill: '#e8e8e8',          // Light gray background
        stroke: '#0088ff',        // Blue border
        strokeWidth: 3,
        textColor: '#333333',     // Dark gray text
      },
      shieldAmount: 15,           // Absorbs 15 damage when collected
      getHealth: (textLength) => 1,
      maxWidth: 180,
      minWidth: 100,
      baseHeight: 50,
    }
  },
  
  // ============================================
  // 2.4: DIFFICULTY SETTINGS
  // ============================================
  difficulty: {
    easy: {
      name: 'Easy',
      enemySpeedMultiplier: 0.4,  // UPDATED: 60% slower (was 0.6, now 0.4)
      spawnRate: 2000,            // 2 seconds between spawns
      maxEnemies: 8,              // Max enemies on screen
      playerDamageMultiplier: 0.7, // Take 30% less damage
    },
    normal: {
      name: 'Normal',
      enemySpeedMultiplier: 0.6,  // UPDATED: 40% slower for better playability (was 1.0, now 0.6)
      spawnRate: 1200,            // 1.2 seconds between spawns
      maxEnemies: 12,             // Standard max enemies
      playerDamageMultiplier: 1.0, // Standard damage
    },
    hard: {
      name: 'Hard',
      enemySpeedMultiplier: 1.0,  // UPDATED: Standard speed (was 1.5, now 1.0)
      spawnRate: 800,             // 0.8 seconds between spawns
      maxEnemies: 18,             // Lots of enemies
      playerDamageMultiplier: 1.3, // Take 30% more damage
    }
  },
  
  // ============================================
  // 2.5: GLOBAL GAME BALANCE
  // ============================================
  gameBalance: {
    globalEnemySpeedMultiplier: 0.6, // NEW: Global speed control (0.6 = 40% slower, makes game winnable)
    globalFireRateMultiplier: 1.0,   // NEW: Global fire rate control (future use)
  },
  
  // ============================================
  // 2.6: VISUAL EFFECTS CONFIGURATION
  // ============================================
  effects: {
    explosionDuration: 400,       // Milliseconds
    explosionParticles: 10,       // Number of particles per explosion
    explosionColors: ['#ff6600', '#ff9900', '#ffcc00'], // Orange to yellow
    flashDuration: 150,           // Player flash when hit (milliseconds)
    shakeIntensity: 4,            // Screen shake pixels when hit
    shakeDuration: 200,           // Screen shake duration (milliseconds)
    particleSpeed: 4,             // Explosion particle velocity
    particleFade: 0.95,           // Particle size reduction per frame
  },
  
  // ============================================
  // 2.7: CANVAS CONFIGURATION
  // ============================================
  canvas: {
    width: 800,                   // Canvas width (pixels)
    height: 600,                  // Canvas height (pixels)
    backgroundColor: '#000000',    // Black background
    margin: 20,                   // Safe zone from edges
  },
  
  // ============================================
  // 2.8: SCORING CONFIGURATION
  // ============================================
  scoring: {
    negativeDestroyed: 100,       // Points for destroying negative comment
    positiveCollected: 50,        // Points for collecting positive comment
    neutralCollected: 25,         // Points for collecting neutral comment
    comboMultiplier: 1.5,         // Bonus multiplier for combos
    comboTimeWindow: 2000,        // Milliseconds to maintain combo
    comboMinHits: 3,              // Minimum hits to start combo
  },
  
  // ============================================
  // 2.9: GAME FLOW CONFIGURATION
  // ============================================
  gameFlow: {
    startingWave: 1,              // Initial wave number
    commentsPerWave: 15,          // Comments to spawn per wave
    waveDelay: 2000,              // Milliseconds between waves
  },
  
  // ============================================
  // 2.10: ENDGAME CONFIGURATION (PHASE 3)
  // ============================================
  endgame: {
    // Performance thresholds (% of max possible score)
    // Aligned with game.js getPerformanceRating()
    performanceThresholds: {
      perfect: 100,    // 100% = Perfect!
      excellent: 90,   // 90-99% = Excellent!
      great: 75,       // 75-89% = Great!
      good: 60,        // 60-74% = Good Job!
      fair: 40,        // 40-59% = Keep Practicing!
      // 0-39% = Try Again!
    },
    
    // Victory messages (when all enemies cleared)
    victoryMessages: {
      perfect: {
        title: '🏆 PERFECT VICTORY!',
        subtitle: 'Flawless Vibe Mastery!',
        message: 'You neutralized every negative comment! Incredible!',
        color: '#ffd700', // Gold
      },
      excellent: {
        title: '⭐ EXCELLENT VICTORY!',
        subtitle: 'Nearly Flawless!',
        message: 'Outstanding performance! Just a few points shy of perfection.',
        color: '#4CAF50', // Green
      },
      great: {
        title: '🌟 GREAT VICTORY!',
        subtitle: 'Strong Performance!',
        message: 'Great job! You handled most of the negativity well.',
        color: '#2196F3', // Blue
      },
      good: {
        title: '👍 VICTORY!',
        subtitle: 'Solid Performance!',
        message: 'Good job! Keep practicing to improve your score.',
        color: '#00BCD4', // Cyan
      },
      fair: {
        title: '✅ VICTORY',
        subtitle: 'Room for Improvement',
        message: 'You survived! Try to destroy more enemies next time.',
        color: '#FF9800', // Orange
      },
      poor: {
        title: '🎮 VICTORY',
        subtitle: 'Keep Practicing!',
        message: 'Victory! Focus on accuracy and timing to score higher.',
        color: '#9E9E9E', // Gray
      },
    },
    
    // Game Over messages (when health reaches 0)
    defeatMessages: {
      perfect: {
        title: '💀 SO CLOSE!',
        subtitle: 'Nearly Perfect Run!',
        message: 'Amazing score! One more try and you\'ll ace it!',
        color: '#ffd700',
      },
      excellent: {
        title: '💀 IMPRESSIVE!',
        subtitle: 'Great Effort!',
        message: 'Excellent score! The negatives got overwhelming.',
        color: '#4CAF50',
      },
      great: {
        title: '💀 GAME OVER',
        subtitle: 'Strong Attempt!',
        message: 'Great score! Just need to dodge a bit better.',
        color: '#2196F3',
      },
      good: {
        title: '💀 GAME OVER',
        subtitle: 'Good Try!',
        message: 'Solid attempt! Focus on dodging negative comments.',
        color: '#00BCD4',
      },
      fair: {
        title: '💀 GAME OVER',
        subtitle: 'Keep Going!',
        message: 'Don\'t give up! Practice makes perfect.',
        color: '#FF9800',
      },
      poor: {
        title: '💀 GAME OVER',
        subtitle: 'Try Again!',
        message: 'Keep practicing! You\'ll get better with each game.',
        color: '#9E9E9E',
      },
    },
  },
  
  // ============================================
  // 2.11: TEXT RENDERING CONFIGURATION
  // ============================================
  text: {
    font: 'Arial, sans-serif',    // Font family for comment text
    fontSize: 13,                 // Font size for comments
    maxCharsPerLine: 25,          // Characters before wrapping
    lineHeight: 16,               // Spacing between lines
    padding: 8,                  // Padding inside comment bubbles
    cornerRadius: 10,             // Rounded corner radius for bubbles
    maxCommentDisplayLength: 85,  // Maximum characters to display in enemy bubbles (truncate longer comments)
  },
  
  // ============================================
  // 2.12: CONTROL CONFIGURATION
  // ============================================
  controls: {
    keyboard: {
      left: ['ArrowLeft', 'a', 'A'],
      right: ['ArrowRight', 'd', 'D'],
      shoot: [' ', 'ArrowUp', 'w', 'W'], // Space, up arrow, or W
      pause: ['p', 'P', 'Escape'],
    },
    touch: {
      buttonSize: 80,             // Touch button size (pixels)
      buttonGap: 15,              // Gap between buttons
    }
  },
};

// ============================================
// SECTION 3: HELPER FUNCTIONS
// ============================================

// ----------------------------------------
// 3.1: Get Difficulty Settings
// ----------------------------------------
export function getDifficultySettings(level = 'normal') {
  const difficulty = GAME_CONFIG.difficulty[level];
  if (!difficulty) {
    console.warn(`${LOG_PREFIX} Unknown difficulty: ${level}, using 'normal'`);
    return GAME_CONFIG.difficulty.normal;
  }
  console.log(`${LOG_PREFIX} Difficulty set to: ${difficulty.name}`);
  return difficulty;
}

// ----------------------------------------
// 3.2: Get Weapon Stats
// ----------------------------------------
export function getWeaponStats(type = 'normal') {
  const weapon = GAME_CONFIG.weapons[type];
  if (!weapon) {
    console.warn(`${LOG_PREFIX} Unknown weapon: ${type}, using 'normal'`);
    return GAME_CONFIG.weapons.normal;
  }
  console.log(`${LOG_PREFIX} Weapon: ${weapon.name}`);
  return weapon;
}

// ----------------------------------------
// 3.3: Get Enemy Configuration by Sentiment
// ----------------------------------------
export function getEnemyConfig(sentiment) {
  const type = sentiment === 'positive' ? 'positive' 
             : sentiment === 'negative' ? 'negative' 
             : 'neutral';
  
  const config = GAME_CONFIG.enemies[type];
  if (!config) {
    console.warn(`${LOG_PREFIX} Unknown sentiment: ${sentiment}, using 'neutral'`);
    return GAME_CONFIG.enemies.neutral;
  }
  return config;
}

// ----------------------------------------
// 3.4: Calculate Comment Bubble Size
// ----------------------------------------
export function calculateBubbleSize(text) {
  const charCount = text.length;
  const config = GAME_CONFIG.text;
  
  // Width grows with text length, capped at maxWidth
  const width = Math.min(
    GAME_CONFIG.enemies.negative.maxWidth,
    GAME_CONFIG.enemies.negative.minWidth + Math.floor(charCount / 3)
  );
  
  // UPDATED: Height based on actual text lines with minimal padding
  // Calculate how many lines the text will wrap to
  const lines = Math.ceil(charCount / config.maxCharsPerLine);
  
  // Height = (number of lines × line height) + top/bottom padding
  const textHeight = lines * config.lineHeight;
  const height = textHeight + (config.padding * 2); // Top + bottom padding
  
  return { width, height, lines };
}

// ----------------------------------------
// 3.5: Get Performance Tier (PHASE 3)
// ----------------------------------------
export function getPerformanceTier(scorePercentage) {
  const thresholds = GAME_CONFIG.endgame.performanceThresholds;
  
  if (scorePercentage >= thresholds.perfect) return 'perfect';
  if (scorePercentage >= thresholds.excellent) return 'excellent';
  if (scorePercentage >= thresholds.great) return 'great';
  if (scorePercentage >= thresholds.good) return 'good';
  if (scorePercentage >= thresholds.fair) return 'fair';
  return 'poor';
}

// ----------------------------------------
// 3.6: Get Endgame Message (PHASE 3)
// ----------------------------------------
export function getEndgameMessage(isVictory, scorePercentage) {
  const tier = getPerformanceTier(scorePercentage);
  const messages = isVictory 
    ? GAME_CONFIG.endgame.victoryMessages 
    : GAME_CONFIG.endgame.defeatMessages;
  
  return messages[tier];
}

// ============================================
// SECTION 4: INITIALIZATION LOG
// ============================================
console.log(`${LOG_PREFIX} ✅ Configuration loaded successfully`);
console.log(`${LOG_PREFIX} Canvas: ${GAME_CONFIG.canvas.width}x${GAME_CONFIG.canvas.height}`);
console.log(`${LOG_PREFIX} Difficulty levels: ${Object.keys(GAME_CONFIG.difficulty).join(', ')}`);
console.log(`${LOG_PREFIX} Weapon types: ${Object.keys(GAME_CONFIG.weapons).length}`);
console.log(`${LOG_PREFIX} Enemy types: ${Object.keys(GAME_CONFIG.enemies).length}`);
console.log(`${LOG_PREFIX} Global enemy speed: ${GAME_CONFIG.gameBalance.globalEnemySpeedMultiplier}x`);
console.log(`${LOG_PREFIX} Performance tiers: ${Object.keys(GAME_CONFIG.endgame.performanceThresholds).length}`);