/**
 * Camcookie Connect 26 - Auth & Utility Module
 * Shared utilities for authentication and localStorage management
 */

const CC_STORAGE_KEY_TOKEN = 'cc-token';
const CC_STORAGE_KEY_USER = 'cc-user';
const CC_STORAGE_KEY_SETTINGS = 'cc-settings';

// Get current authentication token
function ccGetToken() {
  return localStorage.getItem(CC_STORAGE_KEY_TOKEN);
}

// Get current user data
function ccGetUser() {
  const userStr = localStorage.getItem(CC_STORAGE_KEY_USER);
  return userStr ? JSON.parse(userStr) : null;
}

// Get user ID
function ccGetUserId() {
  const user = ccGetUser();
  return user ? user.id : null;
}

// Get username
function ccGetUsername() {
  const user = ccGetUser();
  return user ? user.username : null;
}

// Check if user is authenticated
function ccIsAuthenticated() {
  return !!ccGetToken() && !!ccGetUser();
}

// Clear authentication
function ccLogout() {
  localStorage.removeItem(CC_STORAGE_KEY_TOKEN);
  localStorage.removeItem(CC_STORAGE_KEY_USER);
  localStorage.removeItem(CC_STORAGE_KEY_SETTINGS);
  window.location.href = '/connect/26/';
}

// Get setting value
function ccGetSetting(key, defaultValue = null) {
  const settings = JSON.parse(localStorage.getItem(CC_STORAGE_KEY_SETTINGS) || '{}');
  return settings[key] !== undefined ? settings[key] : defaultValue;
}

// Set setting value
function ccSetSetting(key, value) {
  const settings = JSON.parse(localStorage.getItem(CC_STORAGE_KEY_SETTINGS) || '{}');
  settings[key] = value;
  localStorage.setItem(CC_STORAGE_KEY_SETTINGS, JSON.stringify(settings));
}

// Hash password using SHA-256
async function ccHashPassword(password) {
  const enc = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// Encrypt text using SHA-256 (for message encryption)
async function ccEncryptMessage(message) {
  const enc = new TextEncoder().encode(message);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// For consistency, decrypted messages are just the hash
// In a real implementation, you would use proper encryption/decryption
async function ccDecryptMessage(hash) {
  return hash;
}

// Redirect to login if not authenticated
function ccRequireAuth() {
  if (!ccIsAuthenticated()) {
    window.location.href = '/connect/26/';
  }
}

// Initialize topbar with apps menu
function ccInitTopbar() {
  const topbar = document.getElementById('topbar');
  if (!topbar) return;

  const appsBtn = document.getElementById('appsBtn');
  const appsMenu = document.getElementById('appsMenu');
  const userBtn = document.getElementById('userBtn');
  const userMenu = document.getElementById('userMenu');
  const logoutBtn = document.getElementById('logoutBtn');

  if (!appsBtn || !appsMenu || !userBtn || !userMenu) {
    return; // Elements not found, skip initialization
  }

  const apps = [
    { name: 'Chat', path: '/connect/26/chat/' },
    { name: 'Books', path: '/connect/26/books/' },
    { name: 'Draw', path: '/connect/26/draw/' }
  ];

  appsMenu.innerHTML = apps.map(app => `
    <a href="${app.path}" class="dropdown-item">📱 ${app.name}</a>
  `).join('') + '<a href="/connect/26/settings/" class="dropdown-item">⚙️ Settings</a>';

  appsBtn.onclick = (e) => {
    e.stopPropagation();
    appsMenu.classList.toggle("show");
  };

  userBtn.onclick = (e) => {
    e.stopPropagation();
    userMenu.classList.toggle("show");
  };

  if (logoutBtn) {
    logoutBtn.onclick = (e) => {
      e.preventDefault();
      ccLogout();
    };
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-container')) {
      appsMenu.classList.remove("show");
      userMenu.classList.remove("show");
    }
  });
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ccInitTopbar);
} else {
  ccInitTopbar();
}
