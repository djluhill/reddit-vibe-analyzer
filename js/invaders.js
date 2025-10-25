// ============================================
// SECTION 1: IMPORTS
// ============================================
import { GAME_CONFIG, getEndgameMessage } from './gameConfig.js';

const LOG_PREFIX = '[InvadersRenderer]';

// ============================================
// SECTION 2: INVADERS RENDERER CLASS
// ============================================
// Handles all rendering, game loop, and input for Sentiment Invaders

export class InvadersRenderer {
  
  // ----------------------------------------
  // 2.1: Constructor
  // ----------------------------------------
  constructor(gameInstance, controlMode = 'auto') {
    console.log(`${LOG_PREFIX} 🎨 Initializing renderer...`);
    
    this.game = gameInstance;
    this.canvas = gameInstance.canvas;
    this.ctx = gameInstance.ctx;
    
    // Detect control mode - IMPROVED DETECTION
    this.isTouchDevice = controlMode === 'auto' 
      ? this.detectTouch() 
      : controlMode === 'touch';
    
    console.log(`${LOG_PREFIX} Control mode: ${this.isTouchDevice ? 'TOUCH' : 'KEYBOARD'}`);
    
    // Input state
    this.keys = {
      left: false,
      right: false,
      shoot: false,
    };
    
    // Animation state
    this.animationId = null;
    this.lastFrameTime = 0;
    this.running = false;
    
    // Debug state
    this.frameCount = 0;
    this.lastPlayerX = this.game.player.x;
    this.citationCheckLogged = false; // Log citation check only once
    this.firstCitationLogged = false; // Log first citation render once
    this.missingCitationLogged = false; // Log missing citation once
    
    // Setup controls
    this.setupControls();
    
    console.log(`${LOG_PREFIX} ✅ Renderer initialized`);
  }
  
  // ----------------------------------------
  // 2.2: Detect Touch Device (IMPROVED)
  // ----------------------------------------
  detectTouch() {
    const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    
    // Always prefer keyboard on desktop, even if touchscreen present
    const isDesktop = window.innerWidth > 768;
    
    if (isDesktop && !hasTouch) {
      console.log(`${LOG_PREFIX} Detected: Desktop with keyboard`);
      return false;
    } else if (isDesktop && hasTouch) {
      console.log(`${LOG_PREFIX} Detected: Desktop with touchscreen - using keyboard`);
      return false; // Prefer keyboard on desktop with touchscreen
    } else {
      console.log(`${LOG_PREFIX} Detected: Mobile/tablet - using touch`);
      return true;
    }
  }
  
  // ----------------------------------------
  // 2.3: Setup Controls
  // ----------------------------------------
  setupControls() {
    if (this.isTouchDevice) {
      this.setupTouchControls();
      this.showTouchUI();
    } else {
      this.setupKeyboardControls();
      this.showKeyboardUI();
      this.ensureCanvasFocus();
    }
  }
  
  // ----------------------------------------
  // 2.4: Ensure Canvas Focus (NEW)
  // ----------------------------------------
  ensureCanvasFocus() {
    // Make canvas focusable
    if (this.canvas) {
      this.canvas.setAttribute('tabindex', '0');
      
      // Focus canvas when clicked
      this.canvas.addEventListener('click', () => {
        this.canvas.focus();
        console.log(`${LOG_PREFIX} Canvas focused`);
      });
      
      // Auto-focus on start
      setTimeout(() => {
        this.canvas.focus();
        console.log(`${LOG_PREFIX} Canvas auto-focused`);
      }, 100);
    }
  }
  
  // ----------------------------------------
  // 2.5: Setup Keyboard Controls (ENHANCED)
  // ----------------------------------------
  setupKeyboardControls() {
    console.log(`${LOG_PREFIX} Setting up keyboard controls`);
    console.log(`${LOG_PREFIX} Left keys:`, GAME_CONFIG.controls.keyboard.left);
    console.log(`${LOG_PREFIX} Right keys:`, GAME_CONFIG.controls.keyboard.right);
    console.log(`${LOG_PREFIX} Shoot keys:`, GAME_CONFIG.controls.keyboard.shoot);
    
    this.keydownHandler = (e) => {
      // IGNORE game controls if user is typing in an input/textarea
      const activeElement = document.activeElement;
      const isTyping = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'SELECT' ||
        activeElement.isContentEditable
      );
      
      if (isTyping) {
        return; // Don't process game controls
      }
      
      const key = e.key;
      let handled = false;
      
      if (GAME_CONFIG.controls.keyboard.left.includes(key)) {
        if (!this.keys.left) {
          console.log(`${LOG_PREFIX} ⬅️ LEFT key pressed: "${key}"`);
        }
        this.keys.left = true;
        handled = true;
      }
      if (GAME_CONFIG.controls.keyboard.right.includes(key)) {
        if (!this.keys.right) {
          console.log(`${LOG_PREFIX} ➡️ RIGHT key pressed: "${key}"`);
        }
        this.keys.right = true;
        handled = true;
      }
      if (GAME_CONFIG.controls.keyboard.shoot.includes(key)) {
        if (!this.keys.shoot) {
          console.log(`${LOG_PREFIX} 🔫 SHOOT key pressed: "${key}"`);
        }
        this.keys.shoot = true;
        handled = true;
      }
      if (GAME_CONFIG.controls.keyboard.pause.includes(key)) {
        console.log(`${LOG_PREFIX} ⏸️ PAUSE key pressed: "${key}"`);
        this.game.pause();
        handled = true;
      }
      
      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    
    this.keyupHandler = (e) => {
      // IGNORE game controls if user is typing in an input/textarea
      const activeElement = document.activeElement;
      const isTyping = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'SELECT' ||
        activeElement.isContentEditable
      );
      
      if (isTyping) {
        return; // Don't process game controls
      }
      
      const key = e.key;
      let handled = false;
      
      if (GAME_CONFIG.controls.keyboard.left.includes(key)) {
        console.log(`${LOG_PREFIX} ⬅️ LEFT key released`);
        this.keys.left = false;
        handled = true;
      }
      if (GAME_CONFIG.controls.keyboard.right.includes(key)) {
        console.log(`${LOG_PREFIX} ➡️ RIGHT key released`);
        this.keys.right = false;
        handled = true;
      }
      if (GAME_CONFIG.controls.keyboard.shoot.includes(key)) {
        console.log(`${LOG_PREFIX} 🔫 SHOOT key released`);
        this.keys.shoot = false;
        handled = true;
      }
      
      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    
    // Attach to document for global capture
    document.addEventListener('keydown', this.keydownHandler);
    document.addEventListener('keyup', this.keyupHandler);
    
    console.log(`${LOG_PREFIX} ✅ Keyboard controls ready`);
  }
  
  // ----------------------------------------
  // 2.6: Setup Touch Controls (ENHANCED)
  // ----------------------------------------
  setupTouchControls() {
    console.log(`${LOG_PREFIX} Setting up touch controls`);
    
    const leftBtn = document.getElementById('moveLeftBtn');
    const rightBtn = document.getElementById('moveRightBtn');
    const shootBtn = document.getElementById('shootBtn');
    
    if (leftBtn) {
      leftBtn.addEventListener('touchstart', (e) => {
        console.log(`${LOG_PREFIX} ⬅️ LEFT touch button pressed`);
        this.keys.left = true;
        e.preventDefault();
      });
      leftBtn.addEventListener('touchend', () => {
        console.log(`${LOG_PREFIX} ⬅️ LEFT touch button released`);
        this.keys.left = false;
      });
      leftBtn.addEventListener('mousedown', (e) => {
        console.log(`${LOG_PREFIX} ⬅️ LEFT mouse button pressed`);
        this.keys.left = true;
        e.preventDefault();
      });
      leftBtn.addEventListener('mouseup', () => {
        console.log(`${LOG_PREFIX} ⬅️ LEFT mouse button released`);
        this.keys.left = false;
      });
    }
    
    if (rightBtn) {
      rightBtn.addEventListener('touchstart', (e) => {
        console.log(`${LOG_PREFIX} ➡️ RIGHT touch button pressed`);
        this.keys.right = true;
        e.preventDefault();
      });
      rightBtn.addEventListener('touchend', () => {
        console.log(`${LOG_PREFIX} ➡️ RIGHT touch button released`);
        this.keys.right = false;
      });
      rightBtn.addEventListener('mousedown', (e) => {
        console.log(`${LOG_PREFIX} ➡️ RIGHT mouse button pressed`);
        this.keys.right = true;
        e.preventDefault();
      });
      rightBtn.addEventListener('mouseup', () => {
        console.log(`${LOG_PREFIX} ➡️ RIGHT mouse button released`);
        this.keys.right = false;
      });
    }
    
    if (shootBtn) {
      shootBtn.addEventListener('touchstart', (e) => {
        console.log(`${LOG_PREFIX} 🔫 SHOOT touch button pressed`);
        this.keys.shoot = true;
        e.preventDefault();
      });
      shootBtn.addEventListener('touchend', () => {
        console.log(`${LOG_PREFIX} 🔫 SHOOT touch button released`);
        this.keys.shoot = false;
      });
      shootBtn.addEventListener('mousedown', (e) => {
        console.log(`${LOG_PREFIX} 🔫 SHOOT mouse button pressed`);
        this.keys.shoot = true;
        e.preventDefault();
      });
      shootBtn.addEventListener('mouseup', () => {
        console.log(`${LOG_PREFIX} 🔫 SHOOT mouse button released`);
        this.keys.shoot = false;
      });
    }
    
    console.log(`${LOG_PREFIX} ✅ Touch controls ready`);
  }
  
  // ----------------------------------------
  // 2.7: Show Touch UI
  // ----------------------------------------
  showTouchUI() {
    const touchControls = document.getElementById('touchControls');
    const keyboardInstructions = document.getElementById('keyboardInstructions');
    
    if (touchControls) {
      touchControls.style.display = 'flex';
      console.log(`${LOG_PREFIX} Touch UI shown`);
    }
    if (keyboardInstructions) {
      keyboardInstructions.style.display = 'none';
    }
  }
  
  // ----------------------------------------
  // 2.8: Show Keyboard UI
  // ----------------------------------------
  showKeyboardUI() {
    const touchControls = document.getElementById('touchControls');
    const keyboardInstructions = document.getElementById('keyboardInstructions');
    
    if (touchControls) {
      touchControls.style.display = 'none';
    }
    if (keyboardInstructions) {
      keyboardInstructions.style.display = 'block';
      console.log(`${LOG_PREFIX} Keyboard UI shown`);
    }
  }
  
  // ----------------------------------------
  // 2.9: Start Rendering Loop
  // ----------------------------------------
  start() {
    if (this.running) {
      console.warn(`${LOG_PREFIX} Renderer already running`);
      return;
    }
    
    this.running = true;
    this.lastFrameTime = performance.now();
    console.log(`${LOG_PREFIX} 🎬 Starting render loop...`);
    
    this.gameLoop();
  }
  
  // ----------------------------------------
  // 2.10: Stop Rendering Loop
  // ----------------------------------------
  stop() {
    if (!this.running) return;
    
    this.running = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    console.log(`${LOG_PREFIX} ⏹️ Render loop stopped`);
  }
  
  // ----------------------------------------
  // 2.11: Game Loop (UPDATED)
  // ----------------------------------------
  gameLoop(currentTime = performance.now()) {
    if (!this.running) return;
    
    // Calculate delta time
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    this.frameCount++;
    
    // Process input (only if game is active and not paused)
    if (!this.game.gameOver && !this.game.paused && this.game.started) {
      this.processInput(currentTime);
    }
    
    // Update game state
    this.game.update(deltaTime, currentTime);
    
    // Render everything
    this.render();
    
    // Update UI badges
    this.updateUI();
    
    // Continue loop
    this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
  }
  
  // ----------------------------------------
  // 2.12: Process Input
  // ----------------------------------------
  processInput(currentTime) {
    // Movement
    if (this.keys.left) {
      this.game.movePlayer(-this.game.player.speed);
    }
    if (this.keys.right) {
      this.game.movePlayer(this.game.player.speed);
    }
    
    // Shooting
    if (this.keys.shoot) {
      this.game.shoot(currentTime);
    }
  }
  
  // ----------------------------------------
  // 2.13: Render (Master Renderer) - UPDATED with wave overlay
  // ----------------------------------------
  render() {
    // Clear canvas
    this.ctx.fillStyle = GAME_CONFIG.canvas.backgroundColor;
    this.ctx.fillRect(0, 0, this.game.width, this.game.height);
    
    // Render game objects
    this.renderPlayer();
    this.renderBullets();
    this.renderEnemies();
    this.renderExplosions();
    
    // Render overlays
    if (this.game.gameOver) {
      this.renderGameOver();
    } else if (this.game.paused) {
      this.renderPaused();
    } else if (this.game.waveTransitioning) {
      this.renderWaveTransition();
    } else if (this.game.showWaveStartBanner) {
      // FIX #4: Render Wave 1 start banner
      this.renderWaveStartBanner();
    }
  }
  
  // ----------------------------------------
  // 2.14: Render Player
  // ----------------------------------------
  renderPlayer() {
    const p = this.game.player;
    
    // Invulnerability flash effect
    if (p.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
      return; // Skip rendering every other frame when invulnerable
    }
    
    // Draw player ship (triangle)
    this.ctx.fillStyle = GAME_CONFIG.player.color;
    this.ctx.strokeStyle = GAME_CONFIG.player.strokeColor;
    this.ctx.lineWidth = GAME_CONFIG.player.strokeWidth;
    
    this.ctx.beginPath();
    this.ctx.moveTo(p.x + p.width / 2, p.y); // Top point
    this.ctx.lineTo(p.x, p.y + p.height); // Bottom left
    this.ctx.lineTo(p.x + p.width, p.y + p.height); // Bottom right
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }
  
  // ----------------------------------------
  // 2.15: Render Bullets
  // ----------------------------------------
  renderBullets() {
    this.game.bullets.forEach(bullet => {
      this.ctx.fillStyle = bullet.color;
      this.ctx.beginPath();
      this.ctx.arc(bullet.x, bullet.y, bullet.width / 2, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  // ----------------------------------------
  // 2.16: Render Enemies (UPDATED - Citation tracking)
  // ----------------------------------------
  renderEnemies() {
    // 🔗 Check for citation metadata on first render
    if (!this.citationCheckLogged && this.game.enemies.length > 0) {
      const firstEnemy = this.game.enemies[0];
      const hasCitation = firstEnemy.citationNumber !== undefined;
      const hasPermalink = firstEnemy.permalink !== undefined;
      
      console.log(`${LOG_PREFIX} 🔗 Citation display mode: TEXT SUFFIX`);
      console.log(`${LOG_PREFIX} 🔗 First enemy citation check:`);
      console.log(`${LOG_PREFIX}    Citation: ${hasCitation ? `✅ [${firstEnemy.citationNumber}] appended to text` : '⚠️ Missing'}`);
      console.log(`${LOG_PREFIX}    Subreddit: ${firstEnemy.subreddit || '⚠️ Missing'}`);
      console.log(`${LOG_PREFIX}    Permalink: ${hasPermalink ? '✅ Present' : '⚠️ Missing'}`);
      
      this.citationCheckLogged = true;
    }
    
    this.game.enemies.forEach(enemy => {
      if (!enemy.active) return;
      
      // Draw comment bubble with citation as text suffix
      this.drawCommentBubble(enemy);
    });
  }
  
  // ----------------------------------------
  // 2.17: Draw Comment Bubble (UPDATED WITH TEXT WRAPPING & TRUNCATION)
  // ----------------------------------------
  drawCommentBubble(enemy) {
    const { x, y, width, height, color, text, citationNumber } = enemy;
    
    // Draw rounded rectangle (bubble)
    this.ctx.fillStyle = color.fill;
    this.ctx.strokeStyle = color.stroke;
    this.ctx.lineWidth = color.strokeWidth;
    
    this.drawRoundedRect(x, y, width, height, GAME_CONFIG.text.cornerRadius);
    this.ctx.fill();
    this.ctx.stroke();
    
    // 🔗 SIMPLE CITATION: Append [#] to text instead of badge overlay
    let displayText = text;
    
    // Add citation number to the end of text
    if (citationNumber !== undefined && citationNumber !== null) {
      displayText = `${text} [${citationNumber}]`;
      
      // Debug log first citation render
      if (!this.firstCitationLogged) {
        console.log(`${LOG_PREFIX} 🔗 First citation render: "${text.substring(0, 30)}..." → "${displayText.substring(0, 40)}..."`);
        this.firstCitationLogged = true;
      }
    } else {
      // Debug: Log missing citation
      if (!this.missingCitationLogged) {
        console.warn(`${LOG_PREFIX} ⚠️ Enemy has no citationNumber! Text: "${text.substring(0, 30)}..."`);
        this.missingCitationLogged = true;
      }
    }
    
    // UPDATED: Truncate text if it exceeds max length
    const maxLength = GAME_CONFIG.text.maxCommentDisplayLength || 85;
    
    if (displayText.length > maxLength) {
      // Truncate at word boundary if possible (but preserve citation)
      const citationText = citationNumber ? ` [${citationNumber}]` : '';
      const availableLength = maxLength - citationText.length - 3; // -3 for "..."
      
      let truncated = text.substring(0, availableLength);
      const lastSpace = truncated.lastIndexOf(' ');
      if (lastSpace > availableLength * 0.7) {
        truncated = truncated.substring(0, lastSpace);
      }
      
      displayText = `${truncated}...${citationText}`;
    }
    
    // UPDATED: Draw multi-line wrapped text inside bubble
    this.ctx.fillStyle = color.textColor;
    this.ctx.font = `${GAME_CONFIG.text.fontSize}px ${GAME_CONFIG.text.font}`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    
    // Wrap text into multiple lines
    const lines = this.wrapText(displayText, width - GAME_CONFIG.text.padding * 1.5);
    const lineHeight = GAME_CONFIG.text.lineHeight;
    const totalTextHeight = lines.length * lineHeight;
    const startY = y + (height - totalTextHeight) / 2; // Center vertically
    
    // Draw each line
    lines.forEach((line, index) => {
      const lineY = startY + (index * lineHeight);
      this.ctx.fillText(line, x + width / 2, lineY);
    });
  }
  
  // ----------------------------------------
  // 2.18: Wrap Text into Lines (NEW)
  // ----------------------------------------
  wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach((word, index) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = this.ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        // Line is too long, push current line and start new one
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Add word to current line
        currentLine = testLine;
      }
      
      // Last word - push final line
      if (index === words.length - 1) {
        lines.push(currentLine);
      }
    });
    
    // Limit to 3 lines max and add ellipsis if needed
    if (lines.length > 3) {
      lines.length = 3;
      const lastLine = lines[2];
      if (lastLine.length > 20) {
        lines[2] = lastLine.substring(0, 17) + '...';
      }
    }
    
    return lines;
  }
  
  // ----------------------------------------
  // 2.19: Draw Rounded Rectangle
  // ----------------------------------------
  drawRoundedRect(x, y, width, height, radius) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }
  
  // ----------------------------------------
  // 2.20: Render Explosions
  // ----------------------------------------
  renderExplosions() {
    this.game.explosions.forEach(explosion => {
      explosion.particles.forEach(p => {
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      });
    });
  }
  
  // ----------------------------------------
  // 2.21: Render Game Over Screen (PHASE 3 ENHANCED)
  // ----------------------------------------
  renderGameOver() {
    const state = this.game.getState();
    const centerX = this.game.width / 2;
    const centerY = this.game.height / 2;
    
    // Get end game message based on victory status and score percentage
    const message = getEndgameMessage(state.isVictory, state.scorePercentage);
    
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(0, 0, this.game.width, this.game.height);
    
    // ============================================
    // TITLE (Victory or Game Over)
    // ============================================
    this.ctx.fillStyle = message.color;
    this.ctx.font = 'bold 56px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(message.title, centerX, centerY - 140);
    
    // ============================================
    // SUBTITLE
    // ============================================
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 28px Arial';
    this.ctx.fillText(message.subtitle, centerX, centerY - 90);
    
    // ============================================
    // SURVIVAL TIME ⏱️
    // ============================================
    this.ctx.fillStyle = '#00bcd4';
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`⏱️ Time: ${state.formattedTime}`, centerX, centerY - 40);
    
    // ============================================
    // SCORE BREAKDOWN 📊
    // ============================================
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 32px Arial';
    const scoreText = `${state.score.toLocaleString()} / ${state.maxPossibleScore.toLocaleString()}`;
    this.ctx.fillText(scoreText, centerX, centerY + 10);
    
    // Score percentage
    this.ctx.fillStyle = '#ffeb3b';
    this.ctx.font = '28px Arial';
    this.ctx.fillText(`(${state.scorePercentage}%)`, centerX, centerY + 45);
    
    // ============================================
    // PERFORMANCE RATING ⭐
    // ============================================
    this.ctx.fillStyle = message.color;
    this.ctx.font = 'bold 36px Arial';
    this.ctx.fillText(state.performanceRating, centerX, centerY + 95);
    
    // ============================================
    // MESSAGE
    // ============================================
    this.ctx.fillStyle = '#cccccc';
    this.ctx.font = '18px Arial';
    this.ctx.fillText(message.message, centerX, centerY + 140);
    
    // ============================================
    // RESTART INSTRUCTION
    // ============================================
    this.ctx.fillStyle = '#999999';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Click Restart to play again', centerX, centerY + 180);
  }
  
  // ----------------------------------------
  // 2.22: Render Paused Screen
  // ----------------------------------------
  renderPaused() {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, this.game.width, this.game.height);
    
    // Paused text
    this.ctx.fillStyle = '#ffff00';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('PAUSED', this.game.width / 2, this.game.height / 2);
    
    // Resume instruction
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '20px Arial';
    this.ctx.fillText('Press P to resume', this.game.width / 2, this.game.height / 2 + 40);
  }
  
  // ----------------------------------------
  // 2.22b: Render Wave Transition (FIXED - Date.now() + simple wave number)
  // ----------------------------------------
  renderWaveTransition() {
    const state = this.game.getState();
    
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 50, 0.8)';
    this.ctx.fillRect(0, 0, this.game.width, this.game.height);
    
    // BUG FIX: Use Date.now() consistently with game.js timing
    const currentTime = Date.now();
    const elapsed = currentTime - state.waveTransitionStartTime;
    const remaining = Math.ceil((state.waveTransitionDuration - elapsed) / 1000);
    
    const nextWave = state.currentWave + 1;
    const nextSubreddit = this.game.waves[this.game.currentWaveIndex + 1]?.subreddit || 'Unknown';
    
    console.log(`${LOG_PREFIX} 🌊 Rendering wave transition - Next: Wave ${nextWave} (r/${nextSubreddit}) - ${remaining}s`);
    
    // BUG FIX #2: Wave number only (not "2/3")
    this.ctx.fillStyle = '#00ffff';
    this.ctx.font = 'bold 64px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(`Wave ${nextWave}`, this.game.width / 2, this.game.height / 2 - 60);
    
    // Subreddit name
    this.ctx.fillStyle = '#ffff00';
    this.ctx.font = 'bold 36px Arial';
    this.ctx.fillText(`r/${nextSubreddit}`, this.game.width / 2, this.game.height / 2);
    
    // "Wave Starting" text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 28px Arial';
    this.ctx.fillText('Wave Starting...', this.game.width / 2, this.game.height / 2 + 50);
    
    // Countdown
    this.ctx.fillStyle = '#ff6600';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.fillText(remaining.toString(), this.game.width / 2, this.game.height / 2 + 110);
  }
  
  // ----------------------------------------
  // 2.22c: Render Wave Start Banner (FIXED - Show wave number only)
  // ----------------------------------------
  renderWaveStartBanner() {
    const state = this.game.getState();
    
    console.log(`${LOG_PREFIX} 🌊 Rendering Wave ${state.currentWave} start banner`);
    
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 50, 0.8)';
    this.ctx.fillRect(0, 0, this.game.width, this.game.height);
    
    // BUG FIX #2: Wave number only (not "1/2")
    this.ctx.fillStyle = '#00ffff';
    this.ctx.font = 'bold 64px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(`Wave ${state.currentWave}`, this.game.width / 2, this.game.height / 2 - 60);
    
    // Subreddit name
    this.ctx.fillStyle = '#ffff00';
    this.ctx.font = 'bold 36px Arial';
    this.ctx.fillText(`r/${state.currentSubreddit}`, this.game.width / 2, this.game.height / 2);
    
    // "Wave Starting" text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 28px Arial';
    this.ctx.fillText('Wave Starting...', this.game.width / 2, this.game.height / 2 + 50);
    
    // "Get Ready!" text
    this.ctx.fillStyle = '#00ff00';
    this.ctx.font = 'bold 32px Arial';
    this.ctx.fillText('Get Ready!', this.game.width / 2, this.game.height / 2 + 100);
  }
  
  // ----------------------------------------
  // 2.23: Update UI (HUD) - ENHANCED WITH PHASE 3
  // ----------------------------------------
  updateUI() {
    const state = this.game.getState();
    
    // Update score
    const scoreEl = document.getElementById('gameScore');
    if (scoreEl) scoreEl.textContent = state.score;
    
    // Update health
    const healthEl = document.getElementById('gameHealth');
    if (healthEl) healthEl.textContent = state.health;
    
    // PHASE 3: Update timer
    const timeEl = document.getElementById('gameTime');
    if (timeEl && state.formattedTime) {
      timeEl.textContent = state.formattedTime;
    }
    
    // 🌊 WAVE SYSTEM: Update wave/subreddit display
    if (state.waveMode) {
      // Multi-wave mode - show wave progress
      const subredditDisplay = document.getElementById('subredditTopicsList');
      if (subredditDisplay) {
        subredditDisplay.textContent = `Wave ${state.currentWave}/${state.totalWaves}: r/${state.currentSubreddit}`;
        console.log(`${LOG_PREFIX} 🌊 HUD updated - Wave ${state.currentWave}/${state.totalWaves}: r/${state.currentSubreddit}`);
      }
    }
    
    // Update wave (legacy - for future use if we enable wave badge)
    const waveEl = document.getElementById('gameWave');
    if (waveEl) waveEl.textContent = state.wave;
    
    // Update weapon status (if we add that element later)
    const weaponEl = document.getElementById('weaponStatus');
    if (weaponEl) {
      weaponEl.textContent = `Weapon: ${state.weaponName}`;
      weaponEl.style.backgroundColor = state.weapon !== 'normal' ? '#ffc107' : '#666';
    }
    
    // 🔫 NEW: Update kill progress for weapon upgrades
    const killProgressEl = document.getElementById('killProgress');
    if (killProgressEl) {
      // Determine which path is active and what the next threshold is
      const negKills = state.negativeKills || 0;
      const posKills = state.positiveKills || 0;
      const neuKills = state.neutralKills || 0;
      
      // Determine next threshold for each path
      const negNext = negKills < 5 ? 5 : negKills < 10 ? 10 : negKills < 15 ? 15 : 15;
      const posNext = posKills < 5 ? 5 : posKills < 10 ? 10 : posKills < 15 ? 15 : 15;
      const neuNext = 5;
      
      killProgressEl.innerHTML = `
        <span style="color: #ff4444;">💀 Neg: ${negKills}/${negNext}</span> | 
        <span style="color: #44ff44;">💚 Pos: ${posKills}/${posNext}</span> | 
        <span style="color: #4444ff;">😐 Neu: ${neuKills}/${neuNext}</span>
      `;
    }
    
    // UPDATED: Enable/disable restart button on game over
    // 🔧 FIX: Only update button states when they change (prevents logging spam)
    const restartBtn = document.getElementById('restartGameBtn');
    if (restartBtn) {
      const shouldBeEnabled = state.gameOver;
      if (restartBtn.disabled === shouldBeEnabled) {
        // State needs to change
        restartBtn.disabled = !shouldBeEnabled;
        if (shouldBeEnabled) {
          console.log(`${LOG_PREFIX} 🔄 Restart button enabled`);
        }
      }
    }
    
    // UPDATED: Show/hide pause button, hide on game over
    const pauseBtn = document.getElementById('pauseGameBtn');
    if (pauseBtn) {
      if (state.gameOver) {
        pauseBtn.style.display = 'none';
      } else if (state.started) {
        pauseBtn.style.display = 'inline-block';
        pauseBtn.textContent = state.paused ? '▶️ Resume' : '⏸️ Pause';
      }
    }
    
    // UPDATED: Hide play button when game started
    const playBtn = document.getElementById('playGameBtn');
    if (playBtn && state.started) {
      playBtn.disabled = true;
    }
  }
  
  // ----------------------------------------
  // 2.24: Cleanup
  // ----------------------------------------
  cleanup() {
    console.log(`${LOG_PREFIX} 🧹 Cleaning up...`);
    
    // Stop game loop
    this.stop();
    
    // Remove event listeners
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      document.removeEventListener('keyup', this.keyupHandler);
    }
    
    console.log(`${LOG_PREFIX} ✅ Cleanup complete`);
  }
}