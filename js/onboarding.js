// ============================================
// ONBOARDING.JS - First-Time User Experience
// ============================================
// Handles welcome modal, device detection, and Quick Demo

const ONBOARDING_PREFIX = '[Onboarding]';

// ============================================
// SECTION 1: DEVICE DETECTION
// ============================================

/**
 * Detect if user is on mobile device
 * @returns {boolean} True if mobile device detected
 */
function isMobileDevice() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isSmallScreen = window.innerWidth < 768;
  
  const result = isMobileUA || isSmallScreen;
  console.log(`${ONBOARDING_PREFIX} 📱 Device detection: ${result ? 'MOBILE' : 'DESKTOP'}`);
  console.log(`${ONBOARDING_PREFIX}   - User Agent Mobile: ${isMobileUA}`);
  console.log(`${ONBOARDING_PREFIX}   - Small Screen (<768px): ${isSmallScreen}`);
  console.log(`${ONBOARDING_PREFIX}   - Window Width: ${window.innerWidth}px`);
  
  return result;
}

/**
 * Detect if user is on tablet device
 * @returns {boolean} True if tablet detected
 */
function isTabletDevice() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const isTabletUA = /iPad|Android(?!.*Mobile)/i.test(userAgent);
  const isMediumScreen = window.innerWidth >= 768 && window.innerWidth < 1024;
  
  const result = isTabletUA || isMediumScreen;
  console.log(`${ONBOARDING_PREFIX} 📱 Tablet detection: ${result}`);
  
  return result;
}

// ============================================
// SECTION 2: VISIT TRACKING
// ============================================

/**
 * Check if this is user's first visit
 * @returns {boolean} True if first visit
 */
function isFirstVisit() {
  const hasVisited = localStorage.getItem('hasVisitedSentimentGame');
  const result = !hasVisited;
  
  console.log(`${ONBOARDING_PREFIX} 🔍 First visit check: ${result ? 'YES - NEW USER' : 'NO - RETURNING USER'}`);
  
  return result;
}

/**
 * Mark that user has visited
 */
function markAsVisited() {
  const timestamp = new Date().toISOString();
  localStorage.setItem('hasVisitedSentimentGame', 'true');
  localStorage.setItem('firstVisitDate', timestamp);
  
  console.log(`${ONBOARDING_PREFIX} ✅ User marked as visited at ${timestamp}`);
}

/**
 * Check if user opted out of onboarding
 * @returns {boolean} True if user doesn't want to see modal again
 */
function hasOptedOut() {
  const optedOut = localStorage.getItem('onboardingOptOut') === 'true';
  
  if (optedOut) {
    console.log(`${ONBOARDING_PREFIX} ⏭️ User has opted out of onboarding`);
  }
  
  return optedOut;
}

/**
 * Save user's opt-out preference
 */
function saveOptOutPreference() {
  localStorage.setItem('onboardingOptOut', 'true');
  console.log(`${ONBOARDING_PREFIX} 💾 User opted out - won't show modal again`);
}

/**
 * Reset onboarding (for testing)
 */
function resetOnboarding() {
  localStorage.removeItem('hasVisitedSentimentGame');
  localStorage.removeItem('firstVisitDate');
  localStorage.removeItem('onboardingOptOut');
  
  console.log(`${ONBOARDING_PREFIX} 🔄 Onboarding reset - will show on next reload`);
}

// Make reset available globally for testing
window.resetOnboarding = resetOnboarding;

// ============================================
// SECTION 3: MODAL CONTENT GENERATION
// ============================================

/**
 * Get modal content for mobile devices
 * @returns {string} HTML content for mobile modal
 */
function getMobileModalContent() {
  console.log(`${ONBOARDING_PREFIX} 📱 Generating MOBILE modal content`);
  
  return `
    <div class="text-center">
      <h3 class="mb-3">🎮 Shoot Reddit Comments!</h3>
      
      <p class="lead mb-4">
        Turn any subreddit into a playable arcade game.<br>
        Destroy negative comments, collect positive ones!
      </p>
      
      <div class="alert alert-info mb-4">
        <strong>💡 Quick Start:</strong><br>
        Tap below to try a live demo with r/worldnews
      </div>
      
      <div class="d-grid gap-2 mb-3">
        <button id="quickDemoBtn" class="btn btn-primary btn-lg">
          ⚡ Quick Demo (r/worldnews)
        </button>
        <button id="chooseTopicBtn" class="btn btn-outline-secondary">
          Or choose your topic ▶
        </button>
      </div>
      
      <div class="form-check mt-4">
        <input class="form-check-input" type="checkbox" id="dontShowAgainCheckbox">
        <label class="form-check-label text-muted small" for="dontShowAgainCheckbox">
          Don't show this again
        </label>
      </div>
    </div>
  `;
}

/**
 * Get modal content for desktop devices
 * @returns {string} HTML content for desktop modal
 */
function getDesktopModalContent() {
  console.log(`${ONBOARDING_PREFIX} 🖥️ Generating DESKTOP modal content`);
  
  return `
    <div class="text-center">
      <h3 class="mb-3">Welcome to Reddit Vibe Analyzer</h3>
      
      <div class="row mb-4">
        <div class="col-md-6">
          <div class="p-3 border rounded">
            <h5>📊 Analyze Sentiment</h5>
            <p class="small">
              See sentiment distributions, word analysis, and visualizations for any subreddit
            </p>
          </div>
        </div>
        <div class="col-md-6">
          <div class="p-3 border rounded bg-light">
            <h5>🎮 Play The Game</h5>
            <p class="small">
              Turn Reddit posts into an arcade shooter - destroy negative comments!
            </p>
          </div>
        </div>
      </div>
      
      <p class="mb-4">
        <strong>Choose your path:</strong>
      </p>
      
      <div class="d-grid gap-2 mb-3">
        <button id="quickDemoBtn" class="btn btn-primary btn-lg">
          ⚡ Quick Demo - Play Now (r/worldnews)
        </button>
        <button id="chooseTopicBtn" class="btn btn-outline-primary">
          Choose My Own Topic
        </button>
      </div>
      
      <div class="form-check mt-4">
        <input class="form-check-input" type="checkbox" id="dontShowAgainCheckbox">
        <label class="form-check-label text-muted small" for="dontShowAgainCheckbox">
          Don't show this again
        </label>
      </div>
    </div>
  `;
}

// ============================================
// SECTION 4: MODAL CREATION & DISPLAY
// ============================================

/**
 * Create and show the onboarding modal
 */
function showOnboardingModal() {
  console.log(`${ONBOARDING_PREFIX} 🎬 Creating onboarding modal...`);
  
  // Detect device type
  const isMobile = isMobileDevice();
  const deviceType = isMobile ? 'mobile' : 'desktop';
  
  console.log(`${ONBOARDING_PREFIX} 📱 Device type: ${deviceType.toUpperCase()}`);
  
  // Get appropriate content
  const modalContent = isMobile ? getMobileModalContent() : getDesktopModalContent();
  
  // Create modal HTML
  const modalHTML = `
    <div class="modal fade" id="onboardingModal" tabindex="-1" aria-labelledby="onboardingModalLabel" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
      <div class="modal-dialog modal-dialog-centered ${isMobile ? '' : 'modal-lg'}">
        <div class="modal-content">
          <div class="modal-header border-0">
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" id="closeModalBtn"></button>
          </div>
          <div class="modal-body px-4 pb-4">
            ${modalContent}
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Remove existing modal if present
  const existingModal = document.getElementById('onboardingModal');
  if (existingModal) {
    console.log(`${ONBOARDING_PREFIX} 🗑️ Removing existing modal`);
    existingModal.remove();
  }
  
  // Insert modal into DOM
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  console.log(`${ONBOARDING_PREFIX} ✅ Modal HTML inserted into DOM`);
  
  // Attach event listeners
  attachModalEventListeners();
  
  // Show modal using Bootstrap
  const modalElement = document.getElementById('onboardingModal');
  const modal = new bootstrap.Modal(modalElement);
  
  console.log(`${ONBOARDING_PREFIX} 🎭 Showing modal...`);
  modal.show();
  
  // Mark as visited when modal is shown
  markAsVisited();
}

// ============================================
// SECTION 5: EVENT HANDLERS
// ============================================

/**
 * Attach event listeners to modal buttons
 */
function attachModalEventListeners() {
  console.log(`${ONBOARDING_PREFIX} 🔗 Attaching event listeners...`);
  
  // Quick Demo button
  const quickDemoBtn = document.getElementById('quickDemoBtn');
  if (quickDemoBtn) {
    quickDemoBtn.addEventListener('click', handleQuickDemo);
    console.log(`${ONBOARDING_PREFIX}   ✅ Quick Demo button listener attached`);
  } else {
    console.warn(`${ONBOARDING_PREFIX}   ⚠️ Quick Demo button not found`);
  }
  
  // Choose Topic button
  const chooseTopicBtn = document.getElementById('chooseTopicBtn');
  if (chooseTopicBtn) {
    chooseTopicBtn.addEventListener('click', handleChooseTopic);
    console.log(`${ONBOARDING_PREFIX}   ✅ Choose Topic button listener attached`);
  } else {
    console.warn(`${ONBOARDING_PREFIX}   ⚠️ Choose Topic button not found`);
  }
  
  // Close button
  const closeBtn = document.getElementById('closeModalBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', handleModalClose);
    console.log(`${ONBOARDING_PREFIX}   ✅ Close button listener attached`);
  }
  
  // Don't show again checkbox
  const checkbox = document.getElementById('dontShowAgainCheckbox');
  if (checkbox) {
    checkbox.addEventListener('change', handleOptOutChange);
    console.log(`${ONBOARDING_PREFIX}   ✅ Checkbox listener attached`);
  }
}

/**
 * Handle Quick Demo button click
 */
function handleQuickDemo() {
  console.log(`${ONBOARDING_PREFIX} 🚀 Quick Demo clicked!`);
  
  // Check if opt-out is selected
  const checkbox = document.getElementById('dontShowAgainCheckbox');
  if (checkbox && checkbox.checked) {
    saveOptOutPreference();
  }
  
  // Close modal
  closeModal();
  
  // Trigger Quick Demo
  console.log(`${ONBOARDING_PREFIX} 🎮 Triggering Quick Demo...`);
  triggerQuickDemo();
}

/**
 * Handle Choose Topic button click
 */
function handleChooseTopic() {
  console.log(`${ONBOARDING_PREFIX} 📋 Choose Topic clicked`);
  
  // Check if opt-out is selected
  const checkbox = document.getElementById('dontShowAgainCheckbox');
  if (checkbox && checkbox.checked) {
    saveOptOutPreference();
  }
  
  // Close modal
  closeModal();
  
  // Navigate to Game tab
  console.log(`${ONBOARDING_PREFIX} 🎮 Switching to Game tab...`);
  switchToGameTab();
}

/**
 * Handle modal close
 */
function handleModalClose() {
  console.log(`${ONBOARDING_PREFIX} ❌ Modal closed by user`);
  
  // Check if opt-out is selected
  const checkbox = document.getElementById('dontShowAgainCheckbox');
  if (checkbox && checkbox.checked) {
    saveOptOutPreference();
  }
  
  closeModal();
}

/**
 * Handle opt-out checkbox change
 */
function handleOptOutChange(event) {
  const isChecked = event.target.checked;
  console.log(`${ONBOARDING_PREFIX} ${isChecked ? '☑️' : '☐'} Don't show again: ${isChecked}`);
}

/**
 * Close the modal
 */
function closeModal() {
  const modalElement = document.getElementById('onboardingModal');
  if (modalElement) {
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) {
      modal.hide();
      console.log(`${ONBOARDING_PREFIX} 🚪 Modal closed`);
    }
  }
}

// ============================================
// SECTION 6: QUICK DEMO FUNCTIONALITY
// ============================================

/**
 * Trigger Quick Demo - auto-load and start game
 */
async function triggerQuickDemo() {
  console.log(`${ONBOARDING_PREFIX} ⚡ Starting Quick Demo sequence...`);
  
  try {
    // Step 1: Switch to Game tab
    console.log(`${ONBOARDING_PREFIX} 1️⃣ Switching to Game tab...`);
    switchToGameTab();
    
    // Step 2: Wait a moment for tab to render
    await sleep(500);
    
    // Step 3: Auto-fill subreddit input
    const subredditInput = document.getElementById('gameSubredditInput');
    if (subredditInput) {
      subredditInput.value = 'worldnews';
      console.log(`${ONBOARDING_PREFIX} 2️⃣ Filled subreddit: worldnews`);
    } else {
      console.error(`${ONBOARDING_PREFIX} ❌ gameSubredditInput not found`);
    }
    
    // Step 4: Trigger fetch button click
    console.log(`${ONBOARDING_PREFIX} 3️⃣ Triggering fetch...`);
    const fetchBtn = document.getElementById('gameFetchBtn');
    if (fetchBtn) {
      fetchBtn.click();
      console.log(`${ONBOARDING_PREFIX} ✅ Fetch button clicked`);
    } else {
      console.error(`${ONBOARDING_PREFIX} ❌ gameFetchBtn not found`);
      return;
    }
    
    // Step 5: Wait for data to load (listen for game ready state)
    console.log(`${ONBOARDING_PREFIX} 4️⃣ Waiting for data to load...`);
    
    // Poll for Play Game button to be enabled
    const maxWaitTime = 15000; // 15 seconds max
    const pollInterval = 500; // Check every 500ms
    let elapsed = 0;
    
    const waitForGameReady = setInterval(() => {
      const playBtn = document.getElementById('playGameBtn');
      
      if (playBtn && !playBtn.disabled) {
        clearInterval(waitForGameReady);
        console.log(`${ONBOARDING_PREFIX} ✅ Game ready! Data loaded.`);
        
        // Step 6: Auto-start game after 2 seconds
        console.log(`${ONBOARDING_PREFIX} 5️⃣ Auto-starting game in 2 seconds...`);
        setTimeout(() => {
          playBtn.click();
          console.log(`${ONBOARDING_PREFIX} 🎮 Game started! Quick Demo complete!`);
        }, 2000);
        
      } else if (elapsed >= maxWaitTime) {
        clearInterval(waitForGameReady);
        console.error(`${ONBOARDING_PREFIX} ⏱️ Timeout waiting for game to be ready`);
      }
      
      elapsed += pollInterval;
    }, pollInterval);
    
  } catch (error) {
    console.error(`${ONBOARDING_PREFIX} ❌ Error in Quick Demo:`, error);
  }
}

/**
 * Switch to Game tab
 */
function switchToGameTab() {
  // Try to find and click the Game tab
  const gameTab = document.querySelector('a[href="#game"]');
  if (gameTab) {
    gameTab.click();
    console.log(`${ONBOARDING_PREFIX} ✅ Switched to Game tab`);
  } else {
    console.error(`${ONBOARDING_PREFIX} ❌ Game tab not found`);
  }
}

/**
 * Helper: Sleep function
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// SECTION 7: INITIALIZATION
// ============================================

/**
 * Initialize onboarding on page load
 */
function initOnboarding() {
  console.log(`${ONBOARDING_PREFIX} 🚀 Initializing onboarding system...`);
  
  // Check if should show onboarding
  if (isFirstVisit() && !hasOptedOut()) {
    console.log(`${ONBOARDING_PREFIX} ✅ Conditions met - will show onboarding modal`);
    
    // Show modal after a short delay (let page finish loading)
    setTimeout(() => {
      showOnboardingModal();
    }, 1000);
  } else {
    console.log(`${ONBOARDING_PREFIX} ⏭️ Skipping onboarding - user has already visited or opted out`);
  }
  
  console.log(`${ONBOARDING_PREFIX} 💡 To reset onboarding, run: resetOnboarding() in console`);
}

// ============================================
// SECTION 8: AUTO-INITIALIZE
// ============================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOnboarding);
  console.log(`${ONBOARDING_PREFIX} ⏳ Waiting for DOM to load...`);
} else {
  // DOM already loaded
  initOnboarding();
}

// Export functions for external use (if using modules)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    showOnboardingModal,
    resetOnboarding,
    isMobileDevice,
    isFirstVisit
  };
}