// ============================================
// SECTION 1: UI STATE MANAGEMENT
// ============================================
// Handles status messages, spinner, control states, and theme toggling

const LOG_PREFIX = '[UI]';

// ============================================
// SECTION 2: DOM ELEMENT REFERENCES
// ============================================

const statusAlert = document.getElementById('statusAlert');
const statusText = document.getElementById('statusText');
const loadingSpinner = document.getElementById('loadingSpinner');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

// Control elements that can be disabled during loading
const controls = [
  document.getElementById('fetchBtn'),
  document.getElementById('analyzeBtn'),
  document.getElementById('subredditInput'),
  document.getElementById('inputText'),
  document.getElementById('sortSelect'),
  document.getElementById('limitSelect'),
  document.getElementById('topTimeSelect'),
];

// ============================================
// SECTION 3: STATUS MESSAGE FUNCTIONS
// ============================================

// ----------------------------------------
// 3.1: Set Status Message
// ----------------------------------------
export function setStatus(message, type = 'info') {
  if (!statusAlert || !statusText) {
    console.warn(`${LOG_PREFIX} Status elements not found`);
    return;
  }

  if (!message) {
    statusAlert.style.display = 'none';
    return;
  }

  // Remove old classes
  statusAlert.className = 'alert d-flex align-items-center';
  
  // Add appropriate class based on type
  switch (type) {
    case 'success':
      statusAlert.classList.add('alert-success');
      break;
    case 'warning':
      statusAlert.classList.add('alert-warning');
      break;
    case 'danger':
    case 'error':
      statusAlert.classList.add('alert-danger');
      break;
    case 'info':
    default:
      statusAlert.classList.add('alert-info');
      break;
  }

  statusText.textContent = message;
  statusAlert.style.display = 'flex';
  
  console.log(`${LOG_PREFIX} Status [${type}]: ${message}`);
}

// ============================================
// SECTION 4: LOADING SPINNER FUNCTIONS
// ============================================

// ----------------------------------------
// 4.1: Show/Hide Loading Spinner
// ----------------------------------------
export function showSpinner(show = true) {
  if (!loadingSpinner) {
    console.warn(`${LOG_PREFIX} Spinner element not found`);
    return;
  }
  
  loadingSpinner.style.display = show ? 'flex' : 'none';
  loadingSpinner.setAttribute('aria-hidden', show ? 'false' : 'true');
  
  console.log(`${LOG_PREFIX} Spinner ${show ? 'shown' : 'hidden'}`);
}

// ============================================
// SECTION 5: CONTROL STATE FUNCTIONS
// ============================================

// ----------------------------------------
// 5.1: Disable/Enable Form Controls
// ----------------------------------------
export function disableControls(disabled = true) {
  controls.forEach(ctrl => {
    if (ctrl) {
      ctrl.disabled = disabled;
    }
  });
  
  console.log(`${LOG_PREFIX} Controls ${disabled ? 'disabled' : 'enabled'}`);
}

// ============================================
// SECTION 6: THEME TOGGLE FUNCTIONALITY
// ============================================

// ----------------------------------------
// 6.1: Initialize Theme on Page Load
// ----------------------------------------
function initializeTheme() {
  // Check for saved theme preference or default to 'light'
  const savedTheme = localStorage.getItem('theme') || 'light';
  
  // Apply the theme
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  // Update icon
  updateThemeIcon(savedTheme);
  
  console.log(`${LOG_PREFIX} Theme initialized: ${savedTheme}`);
}

// ----------------------------------------
// 6.2: Update Theme Icon
// ----------------------------------------
function updateThemeIcon(theme) {
  if (!themeIcon) {
    console.warn(`${LOG_PREFIX} Theme icon element not found`);
    return;
  }
  
  // Update icon based on theme
  // Light mode shows moon (click to go dark)
  // Dark mode shows sun (click to go light)
  themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ----------------------------------------
// 6.3: Toggle Theme
// ----------------------------------------
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  // Apply new theme
  document.documentElement.setAttribute('data-theme', newTheme);
  
  // Save preference
  localStorage.setItem('theme', newTheme);
  
  // Update icon
  updateThemeIcon(newTheme);
  
  console.log(`${LOG_PREFIX} Theme switched to: ${newTheme}`);
  
  // Optional: Show brief confirmation
  setStatus(`Theme changed to ${newTheme} mode`, 'success');
  setTimeout(() => setStatus('', 'info'), 1500);
}

// ============================================
// SECTION 7: EVENT LISTENERS
// ============================================

// ----------------------------------------
// 7.1: Theme Toggle Button
// ----------------------------------------
if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
  console.log(`${LOG_PREFIX} Theme toggle button attached`);
} else {
  console.warn(`${LOG_PREFIX} Theme toggle button not found (will add in Phase 1)`);
}

// ============================================
// SECTION 8: INITIALIZATION
// ============================================

// Initialize theme when this module loads
initializeTheme();

console.log(`${LOG_PREFIX} ✅ UI module loaded`);

// ============================================
// SECTION 9: EXPORTED UTILITIES
// ============================================

// Export theme functions for external use if needed
export function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}

export function setTheme(theme) {
  if (theme !== 'light' && theme !== 'dark') {
    console.warn(`${LOG_PREFIX} Invalid theme: ${theme}`);
    return;
  }
  
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  updateThemeIcon(theme);
  
  console.log(`${LOG_PREFIX} Theme set to: ${theme}`);
}