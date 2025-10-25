// ============================================
// GAME DEBUG TEST - Collision Detection Verification
// ============================================
// This file adds debug logging to verify the game loop is working
// by spawning a test enemy directly above the player

const DEBUG_LOG_PREFIX = '[DEBUG-TEST]';

/**
 * Add debug enemy that will collide with player
 * This enemy spawns directly above player and falls straight down
 */
export function addDebugEnemy(game) {
  console.log(`${DEBUG_LOG_PREFIX} 🧪 Adding debug test enemy...`);
  
  const playerCenterX = game.player.x + (game.player.width / 2);
  
  // Create a test enemy directly above player
  const debugEnemy = {
    id: 'DEBUG_TEST_ENEMY',
    text: '🎯 DEBUG TEST TARGET',
    sentiment: 'negative',
    x: playerCenterX - 50, // Center on player
    y: -100, // Start at top
    width: 100,
    height: 50,
    speed: 2, // Moderate speed
    health: 1, // One-shot kill for easy testing
    maxHealth: 1,
    damage: 20,
    points: 100,
    color: {
      fill: '#ff00ff', // Magenta - highly visible
      stroke: '#ffffff',
      strokeWidth: 3,
      textColor: '#000000',
    },
    active: true,
    isDebugEnemy: true, // Mark as debug
  };
  
  // Add to front of enemies array so it's rendered on top
  game.enemies.unshift(debugEnemy);
  
  console.log(`${DEBUG_LOG_PREFIX} ✅ Debug enemy spawned at (${debugEnemy.x}, ${debugEnemy.y})`);
  console.log(`${DEBUG_LOG_PREFIX} Player position: (${game.player.x}, ${game.player.y})`);
  console.log(`${DEBUG_LOG_PREFIX} Expected collision in ~${Math.abs(debugEnemy.y - game.player.y) / debugEnemy.speed} frames`);
  
  return debugEnemy;
}

/**
 * Setup collision detection monitoring
 */
export function setupDebugMonitoring(game) {
  console.log(`${DEBUG_LOG_PREFIX} 🔍 Setting up collision monitoring...`);
  
  const startTime = Date.now();
  const maxWaitTime = 15000; // 15 seconds max before declaring failure
  
  let collisionDetected = false;
  let bulletFired = false;
  let playerMoved = false;
  let enemyDestroyed = false;
  
  const debugEnemy = game.enemies.find(e => e.isDebugEnemy);
  if (!debugEnemy) {
    console.error(`${DEBUG_LOG_PREFIX} ❌ Debug enemy not found!`);
    return;
  }
  
  const initialPlayerX = game.player.x;
  
  // Monitor game state every 100ms
  const monitorInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const elapsedSeconds = (elapsed / 1000).toFixed(1);
    
    // Check if max time exceeded
    if (elapsed > maxWaitTime) {
      console.error(`${DEBUG_LOG_PREFIX} ❌❌❌ TEST FAILED: Timeout after ${elapsedSeconds}s`);
      console.error(`${DEBUG_LOG_PREFIX} 🐛 DIAGNOSIS: Game loop appears to be frozen!`);
      console.error(`${DEBUG_LOG_PREFIX} 🐛 Enemy still at Y: ${debugEnemy.y} (should be moving down)`);
      console.error(`${DEBUG_LOG_PREFIX} 🐛 Game started: ${game.started}`);
      console.error(`${DEBUG_LOG_PREFIX} 🐛 Game paused: ${game.paused}`);
      console.error(`${DEBUG_LOG_PREFIX} 🐛 Game over: ${game.gameOver}`);
      clearInterval(monitorInterval);
      return;
    }
    
    // Check if player moved
    if (!playerMoved && game.player.x !== initialPlayerX) {
      playerMoved = true;
      console.log(`${DEBUG_LOG_PREFIX} ✅ Player movement detected at ${elapsedSeconds}s`);
      console.log(`${DEBUG_LOG_PREFIX} Player moved from X:${initialPlayerX} to X:${game.player.x}`);
    }
    
    // Check if bullet fired
    if (!bulletFired && game.bullets.length > 0) {
      bulletFired = true;
      console.log(`${DEBUG_LOG_PREFIX} ✅ Bullet fired at ${elapsedSeconds}s`);
      console.log(`${DEBUG_LOG_PREFIX} Bullet position: (${game.bullets[0].x}, ${game.bullets[0].y})`);
    }
    
    // Check if debug enemy is destroyed
    if (!enemyDestroyed && (!debugEnemy.active || debugEnemy.health <= 0)) {
      enemyDestroyed = true;
      collisionDetected = true;
      console.log(`${DEBUG_LOG_PREFIX} ✅✅✅ DEBUG ENEMY DESTROYED at ${elapsedSeconds}s!`);
      console.log(`${DEBUG_LOG_PREFIX} 🎯 TEST PASSED: Player shot the target!`);
      console.log(`${DEBUG_LOG_PREFIX} Final bullet count: ${game.bullets.length}`);
      console.log(`${DEBUG_LOG_PREFIX} Score: ${game.score}`);
      clearInterval(monitorInterval);
      return;
    }
    
    // Check if player was hit
    if (!collisionDetected && game.player.health < game.player.maxHealth) {
      collisionDetected = true;
      console.log(`${DEBUG_LOG_PREFIX} ✅✅✅ PLAYER HIT at ${elapsedSeconds}s!`);
      console.log(`${DEBUG_LOG_PREFIX} 🎯 TEST PASSED: Collision detection working!`);
      console.log(`${DEBUG_LOG_PREFIX} Player health: ${game.player.health}/${game.player.maxHealth}`);
      console.log(`${DEBUG_LOG_PREFIX} Player is ${game.player.invulnerable ? 'invulnerable' : 'vulnerable'}`);
      clearInterval(monitorInterval);
      return;
    }
    
    // Check if enemy fell off screen without collision
    if (!collisionDetected && debugEnemy.y > game.height) {
      console.log(`${DEBUG_LOG_PREFIX} ⚠️ DEBUG ENEMY FELL OFF SCREEN at ${elapsedSeconds}s`);
      console.log(`${DEBUG_LOG_PREFIX} 🎯 TEST PASSED: Player dodged! (Enemy missed)`);
      console.log(`${DEBUG_LOG_PREFIX} Player final position: (${game.player.x}, ${game.player.y})`);
      console.log(`${DEBUG_LOG_PREFIX} Enemy final position: (${debugEnemy.x}, ${debugEnemy.y})`);
      clearInterval(monitorInterval);
      return;
    }
    
    // Log progress every 2 seconds
    if (elapsed % 2000 < 100) {
      console.log(`${DEBUG_LOG_PREFIX} ⏱️ ${elapsedSeconds}s - Enemy Y: ${debugEnemy.y.toFixed(0)}, Player Health: ${game.player.health}, Bullets: ${game.bullets.length}`);
    }
    
  }, 100); // Check every 100ms
  
  console.log(`${DEBUG_LOG_PREFIX} ⏰ Monitoring started - waiting up to ${maxWaitTime/1000}s for collision...`);
}

/**
 * Initialize debug test mode
 */
export function initDebugTest(game) {
  console.log(`${DEBUG_LOG_PREFIX} ════════════════════════════════════════════`);
  console.log(`${DEBUG_LOG_PREFIX} 🧪 DEBUG TEST MODE ACTIVATED`);
  console.log(`${DEBUG_LOG_PREFIX} ════════════════════════════════════════════`);
  console.log(`${DEBUG_LOG_PREFIX} Test: Spawn enemy directly above player`);
  console.log(`${DEBUG_LOG_PREFIX} Expected outcomes:`);
  console.log(`${DEBUG_LOG_PREFIX}   1. Player shoots enemy → PASS`);
  console.log(`${DEBUG_LOG_PREFIX}   2. Enemy hits player → PASS`);
  console.log(`${DEBUG_LOG_PREFIX}   3. Player dodges → PASS`);
  console.log(`${DEBUG_LOG_PREFIX}   4. Nothing happens after 15s → FAIL`);
  console.log(`${DEBUG_LOG_PREFIX} ════════════════════════════════════════════`);
  
  addDebugEnemy(game);
  setupDebugMonitoring(game);
}