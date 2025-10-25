// ============================================
// SECTION 1: IMPORTS
// ============================================
import { GAME_CONFIG, getDifficultySettings, getEnemyConfig, calculateBubbleSize } from './gameConfig.js';

const LOG_PREFIX = '[SentimentGame]';

// ============================================
// SECTION 2: SENTIMENT GAME CLASS
// ============================================
// Main game controller - manages state, score, health, enemies, bullets

export class SentimentGame {
  
  // ----------------------------------------
  // 2.1: Constructor (UPDATED - Wave system)
  // ----------------------------------------
  constructor(canvas, gameData = {}, difficulty = 'normal') {
    console.log(`${LOG_PREFIX} 🎮 Initializing game...`);
    console.log(`${LOG_PREFIX} 📊 Game mode:`, gameData.mode);
    
    // Canvas setup
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    if (!this.ctx) {
      console.error(`${LOG_PREFIX} Failed to get canvas context`);
      throw new Error('Canvas context not available');
    }
    
    // Game dimensions
    this.width = GAME_CONFIG.canvas.width;
    this.height = GAME_CONFIG.canvas.height;
    
    // Difficulty settings
    this.difficulty = getDifficultySettings(difficulty);
    console.log(`${LOG_PREFIX} Difficulty: ${this.difficulty.name}`);
    
    // Player state
    this.player = {
      x: this.width / 2,
      y: this.height - 60,
      width: GAME_CONFIG.player.width,
      height: GAME_CONFIG.player.height,
      speed: GAME_CONFIG.player.speed,
      health: GAME_CONFIG.player.startingHealth,
      maxHealth: GAME_CONFIG.player.maxHealth,
      invulnerable: false,
      invulnerableUntil: 0,
    };
    
    // Weapon state
    this.currentWeapon = 'normal';
    this.weaponStats = GAME_CONFIG.weapons.normal;
    this.lastShotTime = 0;
    this.powerUpEndTime = 0;
    
    // Game state
    this.score = 0;
    this.wave = 1;
    this.gameOver = false;
    this.gameOverTriggered = false;
    this.paused = false;
    this.started = false;
    
    // ⏱️ PHASE 3: Timer tracking
    this.gameStartTime = 0;
    this.gameEndTime = 0;
    this.elapsedTime = 0;
    
    // 🏁 PHASE 3: Win/loss tracking
    this.isVictory = false;
    this.maxPossibleScore = 0;
    this.totalEnemies = 0;
    
    // 🎮 SINGLE MODE: No wave system (simplified)
    this.waveMode = false; // Always false now
    this.currentSubreddit = gameData.subreddit || 'Unknown';
    
    console.log(`${LOG_PREFIX} 🎮 Single-topic mode: r/${this.currentSubreddit}`);
    
    // Collections
    this.bullets = [];
    this.enemies = [];
    this.explosions = [];
    this.powerUps = [];
    
    // Combo system
    this.combo = 0;
    this.comboTimer = 0;
    
    // 🔫 Kill-based weapon upgrade system
    this.consecutiveNegativeKills = 0;
    this.consecutivePositiveKills = 0;
    this.consecutiveNeutralKills = 0;
    this.weaponPath = 'none'; // 'negative', 'positive', or 'none'
    
    // Process comments into enemies
    this.processComments(gameData);
    
    console.log(`${LOG_PREFIX} ✅ Game initialized`);
    console.log(`${LOG_PREFIX} Player: (${this.player.x}, ${this.player.y})`);
    console.log(`${LOG_PREFIX} Comments processed: ${this.enemies.length} enemies`);
    console.log(`${LOG_PREFIX} 📊 Max possible score: ${this.maxPossibleScore}`);
  }
  
  // ----------------------------------------
  // 2.2: Process Comments into Enemies (UPDATED - Wave system)
  // ----------------------------------------
  processComments(gameData) {
    console.log(`${LOG_PREFIX} 🌊 processComments() - Mode: ${gameData.mode}`);
    
    // Get comments for current wave
    let comments = [];
    
    if (gameData.mode === 'waves') {
      // WAVE MODE: Only process first wave initially
      if (gameData.waves && gameData.waves.length > 0) {
        comments = gameData.waves[0].comments;
        console.log(`${LOG_PREFIX} 🌊 Wave 1/${gameData.waves.length}: r/${gameData.waves[0].subreddit}`);
        console.log(`${LOG_PREFIX} 🌊 Processing ${comments.length} comments for wave 1`);
      }
    } else if (gameData.mode === 'single') {
      // SINGLE MODE: Process all comments at once
      comments = gameData.comments || [];
      console.log(`${LOG_PREFIX} 📋 Processing ${comments.length} comments (single mode)`);
    } else {
      console.error(`${LOG_PREFIX} ❌ Unknown game mode: ${gameData.mode}`);
      return;
    }
    
    if (!Array.isArray(comments) || comments.length === 0) {
      console.warn(`${LOG_PREFIX} No comments to process`);
      return;
    }
    
    let negCount = 0;
    let posCount = 0;
    let neuCount = 0;
    let totalPoints = 0;
    
    console.log(`${LOG_PREFIX} 🎯 Creating ${comments.length} enemies...`);
    
    // 🔍 DEBUG: Check if comments have citation metadata
    if (comments.length > 0) {
      const firstComment = comments[0];
      console.log(`${LOG_PREFIX} 🔍 First comment structure:`, {
        hasText: !!firstComment.text,
        hasSentiment: !!firstComment.sentiment,
        hasCitationNumber: firstComment.citationNumber !== undefined,
        citationValue: firstComment.citationNumber,
        hasSubreddit: !!firstComment.subreddit,
        hasPermalink: !!firstComment.permalink,
        hasPostUrl: !!firstComment.postUrl,
        hasPostTitle: !!firstComment.postTitle,
      });
      console.log(`${LOG_PREFIX} 🔍 Full first comment:`, firstComment);
    }
    
    comments.forEach((comment, index) => {
      if (!comment || !comment.text) return;
      
      const sentiment = comment.sentiment || 'neutral';
      const config = getEnemyConfig(sentiment);
      const size = calculateBubbleSize(comment.text);
      
      // Apply global speed multiplier
      const baseSpeed = config.baseSpeed * this.difficulty.enemySpeedMultiplier;
      const globalMultiplier = GAME_CONFIG.gameBalance.globalEnemySpeedMultiplier;
      const finalSpeed = baseSpeed * globalMultiplier;
      
      // Check if this is the LAST enemy
      const isLastEnemy = (index === comments.length - 1);
      
      // 🔗 Extract citation metadata (if available from app.js)
      // CRITICAL: Use comment.citationNumber if available, otherwise fallback to index + 1
      const citationNumber = comment.citationNumber !== undefined ? comment.citationNumber : (index + 1);
      const subreddit = comment.subreddit || this.currentSubreddit || 'Unknown';
      const permalink = comment.permalink || null;
      const postUrl = comment.postUrl || null;
      const postTitle = comment.postTitle || 'Untitled';
      
      // 🔍 DEBUG: Log citation assignment for first 3 enemies
      if (index < 3) {
        console.log(`${LOG_PREFIX} 🔗 Enemy ${index}: citationNumber=${citationNumber}, from comment.citationNumber=${comment.citationNumber}`);
      }
      
      // Create enemy object
      const enemy = {
        id: `enemy_${index}`,
        text: comment.text,
        sentiment: sentiment,
        x: Math.random() * (this.width - size.width),
        y: -size.height - (Math.random() * 200), // Start above screen
        width: size.width,
        height: size.height,
        speed: finalSpeed,
        health: config.getHealth(comment.text.length),
        maxHealth: config.getHealth(comment.text.length),
        damage: config.damage * this.difficulty.playerDamageMultiplier,
        points: config.points,
        color: config.color,
        active: true,
        isLastEnemy: isLastEnemy, // 🔍 DEBUG MARKER
        
        // 🔗 CITATION METADATA
        citationNumber: citationNumber,
        subreddit: subreddit,
        permalink: permalink,
        postUrl: postUrl,
        postTitle: postTitle,
      };
      
      this.enemies.push(enemy);
      
      // Track max possible score
      totalPoints += config.points;
      
      // Count by type
      if (sentiment === 'negative') negCount++;
      else if (sentiment === 'positive') posCount++;
      else neuCount++;
      
      // 🔍 LOG FIRST AND LAST ENEMY WITH CITATION INFO
      if (index === 0) {
        console.log(`${LOG_PREFIX} 🔗 FIRST ENEMY: [${citationNumber}] ${sentiment} from r/${subreddit} "${comment.text.substring(0, 40)}..."`);
      }
      if (isLastEnemy) {
        console.log(`${LOG_PREFIX} 🎯 LAST ENEMY: [${citationNumber}] ${sentiment} from r/${subreddit} "${comment.text.substring(0, 40)}..."`);
      }
    });
    
    // PHASE 3: Set max score and enemy count
    this.maxPossibleScore = totalPoints;
    this.totalEnemies = comments.length;
    
    console.log(`${LOG_PREFIX} ✅ Enemies created: ${negCount} 💀 negative, ${posCount} 💚 positive, ${neuCount} 😐 neutral (${this.totalEnemies} total)`);
    console.log(`${LOG_PREFIX} 🔗 Citations: [1] to [${this.totalEnemies}] assigned`);
    
    // Check if citation metadata is present
    const hasCitations = comments[0]?.citationNumber !== undefined;
    const hasPermalinks = comments[0]?.permalink !== undefined;
    console.log(`${LOG_PREFIX} 📊 Citation metadata: ${hasCitations ? '✅ Present' : '⚠️ Missing'} | Permalinks: ${hasPermalinks ? '✅ Present' : '⚠️ Missing'}`);
    
    // Log final speed calculation for debugging
    const globalMultiplier = GAME_CONFIG.gameBalance.globalEnemySpeedMultiplier;
    const sampleSpeed = (2 * this.difficulty.enemySpeedMultiplier * globalMultiplier).toFixed(2);
    console.log(`${LOG_PREFIX} Enemy speed: base × difficulty (${this.difficulty.enemySpeedMultiplier}) × global (${globalMultiplier}) = ${sampleSpeed} px/frame`);
  }
  
  // ----------------------------------------
  // 2.3: Start Game (UPDATED - Phase 3 + Wave banner)
  // ----------------------------------------
  start() {
    if (this.started) {
      console.warn(`${LOG_PREFIX} Game already started`);
      return;
    }
    
    this.started = true;
    this.gameOver = false;
    this.gameOverTriggered = false;
    this.isVictory = false;
    
    // ⏱️ PHASE 3: Start timer
    this.gameStartTime = Date.now();
    this.gameEndTime = 0;
    this.elapsedTime = 0;
    
    console.log(`${LOG_PREFIX} ▶️ Game started at ${new Date(this.gameStartTime).toLocaleTimeString()}`);
  }
  
  // ----------------------------------------
  // 2.4: Pause/Resume Game
  // ----------------------------------------
  pause() {
    this.paused = !this.paused;
    console.log(`${LOG_PREFIX} ${this.paused ? '⏸️ Paused' : '▶️ Resumed'}`);
  }
  
  // ----------------------------------------
  // 2.5: Reset Game (UPDATED - Phase 3)
  // ----------------------------------------
  reset() {
    console.log(`${LOG_PREFIX} 🔄 Resetting game...`);
    
    this.player.x = this.width / 2;
    this.player.y = this.height - 60;
    this.player.health = GAME_CONFIG.player.startingHealth;
    this.player.invulnerable = false;
    
    this.currentWeapon = 'normal';
    this.weaponStats = GAME_CONFIG.weapons.normal;
    
    this.score = 0;
    this.wave = 1;
    this.gameOver = false;
    this.gameOverTriggered = false;
    this.paused = false;
    this.started = false;
    
    // PHASE 3: Reset timer and victory state
    this.gameStartTime = 0;
    this.gameEndTime = 0;
    this.elapsedTime = 0;
    this.isVictory = false;
    
    this.bullets = [];
    this.explosions = [];
    this.powerUps = [];
    this.combo = 0;
    
    // Reset kill counters
    this.consecutiveNegativeKills = 0;
    this.consecutivePositiveKills = 0;
    this.consecutiveNeutralKills = 0;
    this.weaponPath = 'none';
    
    // Reset enemy positions
    this.enemies.forEach(enemy => {
      enemy.y = -enemy.height - (Math.random() * 200);
      enemy.active = true;
      enemy.health = enemy.maxHealth;
    });
    
    console.log(`${LOG_PREFIX} ✅ Game reset complete`);
  }
  
  // ----------------------------------------
  // 2.6: Move Player
  // ----------------------------------------
  movePlayer(dx) {
    const newX = this.player.x + dx;
    const margin = GAME_CONFIG.canvas.margin;
    
    // Keep player within bounds
    if (newX >= margin && newX <= this.width - this.player.width - margin) {
      this.player.x = newX;
    }
  }
  
  // ----------------------------------------
  // 2.7: Shoot Bullet (UPDATED - Spread Shot support)
  // ----------------------------------------
  shoot(currentTime) {
    // Check fire rate
    if (currentTime - this.lastShotTime < this.weaponStats.fireRate) {
      return false;
    }
    
    // Check if spread shot weapon
    const isSpreadShot = this.currentWeapon === 'spreadShot';
    
    if (isSpreadShot) {
      // Spread shot: Fire 3 bullets in cone pattern
      const angles = [-15, 0, 15]; // Degrees: left, center, right
      
      angles.forEach(angle => {
        const bullet = {
          x: this.player.x + this.player.width / 2,
          y: this.player.y,
          width: this.weaponStats.bulletSize * 2,
          height: this.weaponStats.bulletSize * 2,
          speed: this.weaponStats.bulletSpeed,
          damage: this.weaponStats.damage,
          color: this.weaponStats.bulletColor,
          active: true,
          angle: angle, // Store angle for movement
        };
        this.bullets.push(bullet);
      });
      
      console.log(`${LOG_PREFIX} 🔫 Spread shot fired (3 bullets, ${this.bullets.length} total active)`);
    } else {
      // Normal shot: Single bullet
      const bullet = {
        x: this.player.x + this.player.width / 2,
        y: this.player.y,
        width: this.weaponStats.bulletSize * 2,
        height: this.weaponStats.bulletSize * 2,
        speed: this.weaponStats.bulletSpeed,
        damage: this.weaponStats.damage,
        color: this.weaponStats.bulletColor,
        active: true,
        angle: 0, // Straight up
      };
      this.bullets.push(bullet);
      
      console.log(`${LOG_PREFIX} 🔫 Bullet fired (${this.bullets.length} active)`);
    }
    
    this.lastShotTime = currentTime;
    return true;
  }
  
  // ----------------------------------------
  // 2.8: Update Game State (FIXED - Consistent time system)
  // ----------------------------------------
  update(deltaTime, currentTime) {
    if (this.gameOver || this.paused || !this.started) return;
    
    // BUG FIX: Use Date.now() consistently for all comparisons
    const now = Date.now();
    
    // ⏱️ PHASE 3: Update elapsed time
    this.elapsedTime = (now - this.gameStartTime) / 1000; // Convert to seconds
    
    // Update game systems
    this.updateBullets();
    this.updateEnemies();
    this.updateExplosions(deltaTime);
    this.checkCollisions(now);
    this.updatePowerUp(now);
    this.updateCombo(deltaTime);
    
    // 🏁 PHASE 3: Check win condition
    this.checkWinCondition();
    
    // Check game over (health depleted)
    if (this.player.health <= 0) {
      this.endGame(false); // false = defeat
    }
  }
  
  // ----------------------------------------
  // 2.9: Update Bullets (UPDATED - Angled movement support)
  // ----------------------------------------
  updateBullets() {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      
      // Move bullet based on angle
      if (bullet.angle && bullet.angle !== 0) {
        // Angled shot (spread shot)
        const radians = (bullet.angle * Math.PI) / 180;
        bullet.x += Math.sin(radians) * bullet.speed; // Horizontal movement
        bullet.y -= Math.cos(radians) * bullet.speed; // Vertical movement
      } else {
        // Straight shot
        bullet.y -= bullet.speed;
      }
      
      // Remove if off screen
      if (bullet.y < -bullet.height || bullet.x < 0 || bullet.x > this.width) {
        this.bullets.splice(i, 1);
      }
    }
  }
  
  // ----------------------------------------
  // 2.10: Update Enemies
  // ----------------------------------------
  updateEnemies() {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      // 🔍 Remove inactive enemies from array (destroyed or off-screen)
      if (!enemy.active) {
        const wasLastEnemy = enemy.isLastEnemy;
        this.enemies.splice(i, 1);
        
        if (wasLastEnemy) {
          console.log(`${LOG_PREFIX} 🗑️ LAST ENEMY REMOVED FROM ARRAY! Enemies remaining: ${this.enemies.length}`);
        }
        continue;
      }
      
      enemy.y += enemy.speed;
      
      // Remove if off screen (past bottom)
      if (enemy.y > this.height) {
        enemy.active = false;
        console.log(`${LOG_PREFIX} 📉 Enemy fell off screen: ${enemy.id}`);
      }
    }
  }
  
  // ----------------------------------------
  // 2.11: Update Explosions
  // ----------------------------------------
  updateExplosions(deltaTime) {
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const explosion = this.explosions[i];
      explosion.age += deltaTime;
      
      // Update particles
      explosion.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.size *= GAME_CONFIG.effects.particleFade;
      });
      
      // Remove if expired
      if (explosion.age >= GAME_CONFIG.effects.explosionDuration) {
        this.explosions.splice(i, 1);
      }
    }
  }
  
  // ----------------------------------------
  // 2.12: Check Collisions
  // ----------------------------------------
  checkCollisions(currentTime) {
    // Bullet vs Enemy collisions
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];
        if (!enemy.active) continue;
        
        if (this.checkCollision(bullet, enemy)) {
          // Damage enemy
          enemy.health -= bullet.damage;
          this.bullets.splice(i, 1);
          
          if (enemy.health <= 0) {
            this.destroyEnemy(enemy, j);
          }
          
          break; // Bullet hit something, stop checking
        }
      }
    }
    
    // Player vs Enemy collisions
    if (!this.player.invulnerable) {
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const enemy = this.enemies[i];
        if (!enemy.active) continue;
        
        if (this.checkCollision(this.player, enemy)) {
          this.handlePlayerHit(enemy, i, currentTime);
        }
      }
    }
  }
  
  // ----------------------------------------
  // 2.13: Check Collision Helper
  // ----------------------------------------
  checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
  }
  
  // ----------------------------------------
  // 2.14: Destroy Enemy (UPDATED - Kill tracking for weapon upgrades)
  // ----------------------------------------
  destroyEnemy(enemy, index) {
    enemy.active = false;
    
    // Award points
    const points = Math.floor(enemy.points * (1 + this.combo * 0.1));
    this.score += points;
    
    // Increase combo
    this.combo++;
    this.comboTimer = GAME_CONFIG.scoring.comboTimeWindow;
    
    // Create explosion
    this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color.stroke);
    
    // 🔫 Track consecutive kills for weapon upgrades
    this.trackKill(enemy.sentiment);
    
    // 🔍 CHECK IF LAST ENEMY DESTROYED
    if (enemy.isLastEnemy) {
      console.log(`${LOG_PREFIX} 🎯🎯🎯 LAST ENEMY DESTROYED!`);
      console.log(`${LOG_PREFIX} 🔗 Citation: [${enemy.citationNumber}] from r/${enemy.subreddit}`);
      console.log(`${LOG_PREFIX} 🔍 Enemies remaining in array: ${this.enemies.length}`);
      console.log(`${LOG_PREFIX} 🔍 Active enemies: ${this.enemies.filter(e => e.active).length}`);
      console.log(`${LOG_PREFIX} 🔍 Total enemies spawned: ${this.totalEnemies}`);
      console.log(`${LOG_PREFIX} 🔍 Final score: ${this.score}/${this.maxPossibleScore}`);
    }
    
    // 🔗 Log citation info (every 5th enemy for debugging)
    if (index % 5 === 0 || enemy.isLastEnemy) {
      console.log(`${LOG_PREFIX} 💥 [${enemy.citationNumber}] ${enemy.sentiment} destroyed | Score: ${this.score} | Combo: ${this.combo} | Left: ${this.enemies.length}`);
    }
  }
  
  // ----------------------------------------
  // 2.15: Handle Player Hit
  // ----------------------------------------
  handlePlayerHit(enemy, enemyIndex, currentTime) {
    enemy.active = false;
    
    // Positive/Neutral enemies help player
    if (enemy.sentiment === 'positive') {
      // Grant power-up
      this.grantPowerUp();
      this.score += enemy.points;
      console.log(`${LOG_PREFIX} ✨ Positive comment collected! Power-up granted`);
    } else if (enemy.sentiment === 'neutral') {
      // Grant small shield
      this.score += enemy.points;
      console.log(`${LOG_PREFIX} 🛡️ Neutral comment absorbed`);
    } else {
      // Negative enemy damages player
      this.player.health -= enemy.damage;
      this.player.invulnerable = true;
      this.player.invulnerableUntil = currentTime + GAME_CONFIG.player.invulnerabilityTime;
      console.log(`${LOG_PREFIX} 💔 Player hit! Health: ${this.player.health}`);
    }
  }
  
  // ----------------------------------------
  // 2.15b: Track Kill (NEW - Kill-based weapon upgrades)
  // ----------------------------------------
  trackKill(sentiment) {
    console.log(`${LOG_PREFIX} 🎯 trackKill() called with sentiment: "${sentiment}"`);
    console.log(`${LOG_PREFIX} 📊 BEFORE - Neg: ${this.consecutiveNegativeKills}, Pos: ${this.consecutivePositiveKills}, Neu: ${this.consecutiveNeutralKills}`);
    
    // Reset other counters and increment the matching one
    if (sentiment === 'negative') {
      this.consecutiveNegativeKills++;
      this.consecutivePositiveKills = 0;
      this.consecutiveNeutralKills = 0;
      console.log(`${LOG_PREFIX} 💀 Negative kill: ${this.consecutiveNegativeKills}`);
    } else if (sentiment === 'positive') {
      this.consecutivePositiveKills++;
      this.consecutiveNegativeKills = 0;
      this.consecutiveNeutralKills = 0;
      console.log(`${LOG_PREFIX} 💚 Positive kill: ${this.consecutivePositiveKills}`);
    } else if (sentiment === 'neutral') {
      this.consecutiveNeutralKills++;
      this.consecutiveNegativeKills = 0;
      this.consecutivePositiveKills = 0;
      console.log(`${LOG_PREFIX} 😐 Neutral kill: ${this.consecutiveNeutralKills}`);
    } else {
      console.warn(`${LOG_PREFIX} ⚠️ Unknown sentiment: "${sentiment}" (type: ${typeof sentiment})`);
    }
    
    console.log(`${LOG_PREFIX} 📊 AFTER - Neg: ${this.consecutiveNegativeKills}, Pos: ${this.consecutivePositiveKills}, Neu: ${this.consecutiveNeutralKills}`);
    console.log(`${LOG_PREFIX} 🔫 Current weapon: ${this.currentWeapon}`);
    
    // Check for weapon upgrades
    this.checkWeaponUpgrade();
  }
  
  // ----------------------------------------
  // 2.15c: Check Weapon Upgrade (FIXED - Independent path checks + DEBUG LOGGING)
  // ----------------------------------------
  checkWeaponUpgrade() {
    const neg = this.consecutiveNegativeKills;
    const pos = this.consecutivePositiveKills;
    const neu = this.consecutiveNeutralKills;
    
    console.log(`${LOG_PREFIX} 🔍 checkWeaponUpgrade() - Neg: ${neg}, Pos: ${pos}, Neu: ${neu}`);
    
    // NEUTRAL RESET (check first - highest priority)
    if (neu >= 5) {
      console.log(`${LOG_PREFIX} 🔄 Neutral reset triggered (${neu} >= 5)`);
      this.upgradeWeapon('normal', 'none');
      return; // Exit after reset
    }
    
    // NEGATIVE PATH (Damage focus)
    if (neg >= 15) {
      console.log(`${LOG_PREFIX} 🔥 Negative path: Ultimate upgrade triggered (${neg} >= 15)`);
      this.upgradeWeapon('ultimate', 'negative');
    } else if (neg >= 10) {
      console.log(`${LOG_PREFIX} 💥 Negative path: Heavy Shot upgrade triggered (${neg} >= 10)`);
      this.upgradeWeapon('biggerBullets', 'negative');
    } else if (neg >= 5) {
      console.log(`${LOG_PREFIX} ⚡ Negative path: Rapid Fire upgrade triggered (${neg} >= 5)`);
      this.upgradeWeapon('fasterFireRate', 'negative');
    } else {
      console.log(`${LOG_PREFIX} ❌ Negative path: No upgrade (${neg} < 5)`);
    }
    
    // POSITIVE PATH (Utility focus) - separate from negative path
    if (pos >= 15) {
      console.log(`${LOG_PREFIX} 🔥 Positive path: Ultimate upgrade triggered (${pos} >= 15)`);
      this.upgradeWeapon('ultimate', 'positive');
    } else if (pos >= 10) {
      console.log(`${LOG_PREFIX} ✨ Positive path: Spread Shot II upgrade triggered (${pos} >= 10)`);
      this.upgradeWeapon('spreadShot', 'positive');
    } else if (pos >= 5) {
      console.log(`${LOG_PREFIX} ✨ Positive path: Spread Shot upgrade triggered (${pos} >= 5)`);
      this.upgradeWeapon('spreadShot', 'positive');
    } else {
      console.log(`${LOG_PREFIX} ❌ Positive path: No upgrade (${pos} < 5)`);
    }
  }
  
  // ----------------------------------------
  // 2.15d: Upgrade Weapon (NEW - Apply weapon change)
  // ----------------------------------------
  upgradeWeapon(weaponType, path) {
    console.log(`${LOG_PREFIX} 🎯 upgradeWeapon() called - Target: ${weaponType}, Path: ${path}`);
    console.log(`${LOG_PREFIX} 📊 Current weapon: ${this.currentWeapon}`);
    
    // Don't downgrade if already better
    if (this.currentWeapon === weaponType) {
      console.log(`${LOG_PREFIX} ⚠️ Already using ${weaponType} - no change`);
      return;
    }
    
    // Check if weapon exists in config
    if (!GAME_CONFIG.weapons[weaponType]) {
      console.error(`${LOG_PREFIX} ❌ ERROR: Weapon "${weaponType}" not found in config!`);
      return;
    }
    
    const oldWeapon = this.currentWeapon;
    this.currentWeapon = weaponType;
    this.weaponPath = path;
    this.weaponStats = GAME_CONFIG.weapons[weaponType];
    
    console.log(`${LOG_PREFIX} ⚡⚡⚡ WEAPON UPGRADE SUCCESS ⚡⚡⚡`);
    console.log(`${LOG_PREFIX} Old: ${oldWeapon} → New: ${weaponType}`);
    console.log(`${LOG_PREFIX} Path: ${path}`);
    console.log(`${LOG_PREFIX} New stats:`, {
      name: this.weaponStats.name,
      fireRate: this.weaponStats.fireRate,
      damage: this.weaponStats.damage,
      bulletColor: this.weaponStats.bulletColor
    });
  }
  
  // ----------------------------------------
  // 2.16: Grant Power-up
  // ----------------------------------------
  grantPowerUp() {
    // Upgrade weapon
    if (this.currentWeapon === 'normal') {
      this.currentWeapon = 'fasterFireRate';
    } else if (this.currentWeapon === 'fasterFireRate') {
      this.currentWeapon = 'biggerBullets';
    } else {
      this.currentWeapon = 'ultimate';
    }
    
    this.weaponStats = GAME_CONFIG.weapons[this.currentWeapon];
    this.powerUpEndTime = Date.now() + this.weaponStats.duration;
    
    console.log(`${LOG_PREFIX} ⚡ Power-up: ${this.weaponStats.name}`);
  }
  
  // ----------------------------------------
  // 2.17: Update Power-up Timer
  // ----------------------------------------
  updatePowerUp(currentTime) {
    if (this.powerUpEndTime > 0 && currentTime >= this.powerUpEndTime) {
      this.currentWeapon = 'normal';
      this.weaponStats = GAME_CONFIG.weapons.normal;
      this.powerUpEndTime = 0;
      console.log(`${LOG_PREFIX} Power-up expired`);
    }
    
    // Update invulnerability
    if (this.player.invulnerable && currentTime >= this.player.invulnerableUntil) {
      this.player.invulnerable = false;
    }
  }
  
  // ----------------------------------------
  // 2.18: Update Combo Timer
  // ----------------------------------------
  updateCombo(deltaTime) {
    if (this.combo > 0) {
      this.comboTimer -= deltaTime;
      if (this.comboTimer <= 0) {
        console.log(`${LOG_PREFIX} Combo broken at ${this.combo}x`);
        this.combo = 0;
      }
    }
  }
  
  // ----------------------------------------
  // 2.19: Create Explosion
  // ----------------------------------------
  createExplosion(x, y, color) {
    const explosion = {
      x, y,
      age: 0,
      particles: [],
    };
    
    const count = GAME_CONFIG.effects.explosionParticles;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i;
      explosion.particles.push({
        x, y,
        vx: Math.cos(angle) * GAME_CONFIG.effects.particleSpeed,
        vy: Math.sin(angle) * GAME_CONFIG.effects.particleSpeed,
        size: 4,
        color: color || '#ff6600',
      });
    }
    
    this.explosions.push(explosion);
  }
  
  // ----------------------------------------
  // 2.20: Check Win Condition (ENHANCED - Debug logging)
  // ----------------------------------------
  checkWinCondition() {
    // Count all enemies (both active and falling)
    const totalEnemies = this.enemies.length;
    const activeEnemies = this.enemies.filter(e => e.active).length;
    
    // 🔍 DEBUG LOG every 2 seconds
    const now = Date.now();
    if (!this.lastWinCheckLog || now - this.lastWinCheckLog > 2000) {
      console.log(`${LOG_PREFIX} 🔍 Win Check: ${totalEnemies} total enemies | ${activeEnemies} active | ${this.totalEnemies} spawned | gameOver: ${this.gameOver}`);
      this.lastWinCheckLog = now;
    }
    
    // Win if all enemies are gone
    if (totalEnemies === 0 && this.totalEnemies > 0 && !this.gameOver) {
      console.log(`${LOG_PREFIX} 🏆🏆🏆 VICTORY CONDITION MET! 🏆🏆🏆`);
      console.log(`${LOG_PREFIX} ✅ Total enemies in array: ${totalEnemies}`);
      console.log(`${LOG_PREFIX} ✅ Total enemies spawned: ${this.totalEnemies}`);
      console.log(`${LOG_PREFIX} ✅ Game over flag: ${this.gameOver}`);
      console.log(`${LOG_PREFIX} ✅ Final score: ${this.score}/${this.maxPossibleScore} (${this.getScorePercentage()}%)`);
      console.log(`${LOG_PREFIX} ✅ Calling endGame(true)...`);
      this.endGame(true); // true = victory
    }
  }
  
  // ----------------------------------------
  // 2.21: End Game (ENHANCED - Debug logging)
  // ----------------------------------------
  endGame(isVictory = false) {
    console.log(`${LOG_PREFIX} 🎬 endGame() CALLED! Victory: ${isVictory} | Already triggered: ${this.gameOverTriggered}`);
    
    if (this.gameOverTriggered) {
      console.log(`${LOG_PREFIX} ⚠️ endGame() already triggered, ignoring duplicate call`);
      return; // Prevent multiple triggers
    }
    
    this.gameOverTriggered = true;
    this.gameOver = true;
    this.started = false;
    this.isVictory = isVictory;
    
    // ⏱️ PHASE 3: Record end time
    this.gameEndTime = Date.now();
    this.elapsedTime = (this.gameEndTime - this.gameStartTime) / 1000;
    
    const status = isVictory ? '🏆 VICTORY' : '💀 GAME OVER';
    console.log(`${LOG_PREFIX} ═══════════════════════════════════`);
    console.log(`${LOG_PREFIX} ${status}!`);
    console.log(`${LOG_PREFIX} Final Score: ${this.score} / ${this.maxPossibleScore} (${this.getScorePercentage()}%)`);
    console.log(`${LOG_PREFIX} Survival Time: ${this.getFormattedTime()}`);
    console.log(`${LOG_PREFIX} Performance: ${this.getPerformanceRating()}`);
    console.log(`${LOG_PREFIX} Game Over Flag: ${this.gameOver}`);
    console.log(`${LOG_PREFIX} Is Victory Flag: ${this.isVictory}`);
    console.log(`${LOG_PREFIX} ═══════════════════════════════════`);
  }
  
  // ----------------------------------------
  // 2.22: Get Score Percentage (NEW - Phase 3)
  // ----------------------------------------
  getScorePercentage() {
    if (this.maxPossibleScore === 0) return 0;
    return Math.round((this.score / this.maxPossibleScore) * 100);
  }
  
  // ----------------------------------------
  // 2.23: Get Performance Rating (NEW - Phase 3)
  // ----------------------------------------
  getPerformanceRating() {
    const percentage = this.getScorePercentage();
    const thresholds = GAME_CONFIG.endScreen?.performanceThresholds || {
      perfect: 100,
      excellent: 90,
      great: 75,
      good: 60,
      fair: 40,
    };
    
    if (percentage >= thresholds.perfect) return 'Perfect!';
    if (percentage >= thresholds.excellent) return 'Excellent!';
    if (percentage >= thresholds.great) return 'Great!';
    if (percentage >= thresholds.good) return 'Good Job!';
    if (percentage >= thresholds.fair) return 'Keep Practicing!';
    return 'Try Again!';
  }
  
  // ----------------------------------------
  // 2.24: Get Formatted Time (NEW - Phase 3)
  // ----------------------------------------
  getFormattedTime() {
    const minutes = Math.floor(this.elapsedTime / 60);
    const seconds = Math.floor(this.elapsedTime % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  // ----------------------------------------
  // 2.25: Get Game State (SIMPLIFIED - Single mode)
  // ----------------------------------------
  getState() {
    return {
      score: this.score,
      health: this.player.health,
      maxHealth: this.player.maxHealth,
      wave: this.wave,
      weapon: this.currentWeapon,
      weaponName: this.weaponStats.name,
      combo: this.combo,
      gameOver: this.gameOver,
      paused: this.paused,
      started: this.started,
      
      // PHASE 3: New state properties
      elapsedTime: this.elapsedTime,
      formattedTime: this.getFormattedTime(),
      isVictory: this.isVictory,
      maxPossibleScore: this.maxPossibleScore,
      scorePercentage: this.getScorePercentage(),
      performanceRating: this.getPerformanceRating(),
      activeEnemies: this.enemies.filter(e => e.active).length,
      totalEnemies: this.totalEnemies,
      
      // Kill-based weapon upgrades
      negativeKills: this.consecutiveNegativeKills,
      positiveKills: this.consecutivePositiveKills,
      neutralKills: this.consecutiveNeutralKills,
      weaponPath: this.weaponPath,
      
      // Subreddit info
      currentSubreddit: this.currentSubreddit,
    };
  }
}