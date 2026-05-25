/**
 * Camcookie Connect 26 - Auth & Utility Module
 * New local storage format:
 *  - session_token (replaces cc-token)
 *  - user_id (UUID)
 *  - username (string)
 *  - profile_photo (URL or empty)
 *  - app_redirect (optional, for #app= redirects)
 */

const CC_STORAGE_KEY_TOKEN = 'session_token';
const CC_STORAGE_KEY_USER_ID = 'user_id';
const CC_STORAGE_KEY_USERNAME = 'username';
const CC_STORAGE_KEY_PHOTO = 'profile_photo';
const CC_STORAGE_KEY_APP_REDIRECT = 'app_redirect';

const CC_STORAGE_KEY_SESSION_MODE = 'cc_session_mode';

function ccGetStorage() {
  const mode = localStorage.getItem(CC_STORAGE_KEY_SESSION_MODE);
  return mode === 'session' ? sessionStorage : localStorage;
}

function ccSetSessionMode(mode) {
  localStorage.setItem(CC_STORAGE_KEY_SESSION_MODE, mode === 'session' ? 'session' : 'local');
}

// Legacy keys (for migration)
const CC_STORAGE_KEY_OLD_USER = 'cc-user';
const CC_STORAGE_KEY_OLD_TOKEN = 'cc-token';

/**
 * Get session token
 */
function ccGetToken() {
  return ccGetStorage().getItem(CC_STORAGE_KEY_TOKEN) || localStorage.getItem(CC_STORAGE_KEY_TOKEN) || sessionStorage.getItem(CC_STORAGE_KEY_TOKEN);
}

/**
 * Get user object with new format
 * @returns {Object|null} User object with {id, username, profile_photo}
 */
function ccGetUser() {
  const storage = ccGetStorage();
  const userId = storage.getItem(CC_STORAGE_KEY_USER_ID) || localStorage.getItem(CC_STORAGE_KEY_USER_ID) || sessionStorage.getItem(CC_STORAGE_KEY_USER_ID);
  const username = storage.getItem(CC_STORAGE_KEY_USERNAME) || localStorage.getItem(CC_STORAGE_KEY_USERNAME) || sessionStorage.getItem(CC_STORAGE_KEY_USERNAME);
  const photo = storage.getItem(CC_STORAGE_KEY_PHOTO) || localStorage.getItem(CC_STORAGE_KEY_PHOTO) || sessionStorage.getItem(CC_STORAGE_KEY_PHOTO) || '';

  if (!userId || !username) return null;
  return { id: userId, username, profile_photo: photo };
}

/**
 * Check if user is authenticated
 */
function ccIsAuthenticated() {
  return !!ccGetToken() && !!ccGetUser();
}

/**
 * Set user data in new format
 */
function ccSetUser(userId, username, profilePhoto = '') {
  const storage = ccGetStorage();
  storage.setItem(CC_STORAGE_KEY_USER_ID, userId);
  storage.setItem(CC_STORAGE_KEY_USERNAME, username);
  storage.setItem(CC_STORAGE_KEY_PHOTO, profilePhoto || '');
}

/**
 * Set session token
 */
function ccSetToken(token) {
  ccGetStorage().setItem(CC_STORAGE_KEY_TOKEN, token);
}

/**
 * Logout and redirect to login
 */
function ccLogout() {
  localStorage.removeItem(CC_STORAGE_KEY_TOKEN);
  sessionStorage.removeItem(CC_STORAGE_KEY_TOKEN);
  localStorage.removeItem(CC_STORAGE_KEY_USER_ID);
  sessionStorage.removeItem(CC_STORAGE_KEY_USER_ID);
  localStorage.removeItem(CC_STORAGE_KEY_USERNAME);
  sessionStorage.removeItem(CC_STORAGE_KEY_USERNAME);
  localStorage.removeItem(CC_STORAGE_KEY_PHOTO);
  sessionStorage.removeItem(CC_STORAGE_KEY_PHOTO);
  localStorage.removeItem(CC_STORAGE_KEY_APP_REDIRECT);
  sessionStorage.removeItem(CC_STORAGE_KEY_APP_REDIRECT);
  localStorage.removeItem(CC_STORAGE_KEY_OLD_USER);
  localStorage.removeItem(CC_STORAGE_KEY_OLD_TOKEN);
  window.location.href = '/connect/26/';
}

/**
 * Settings management
 */
function ccGetSetting(key, defaultValue = null) {
  const settings = JSON.parse(localStorage.getItem('cc-settings') || '{}');
  return settings[key] !== undefined ? settings[key] : defaultValue;
}

function ccSetSetting(key, value) {
  const settings = JSON.parse(localStorage.getItem('cc-settings') || '{}');
  settings[key] = value;
  localStorage.setItem('cc-settings', JSON.stringify(settings));
}

/**
 * Password hashing
 */
async function ccHashPassword(password) {
  const enc = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Require authentication - redirect to login if not authenticated
 */
function ccRequireAuth() {
  if (ccIsAuthenticated()) return;
  const hash = window.location.hash || '';
  const suffix = hash ? hash : '';
  window.location.href = '/connect/26/' + suffix;
}

/**
 * Get user rank from leaderboard
 * @param {string} userId - User ID
 * @returns {number|null} Rank (1, 2, 3) or null if not in top 3
 */
function ccGetUserRank(userId) {
  // TODO: Implement with actual leaderboard lookup from Supabase
  return null;
}

/**
 * Unified topbar initialization (requires cc-topbar.js)
 * This function is deprecated - use ccInitTopbar() from cc-topbar.js instead
 */
function ccInitTopbarLegacy() {
  const appsMenu = document.getElementById('appsMenu');
  const userBtn = document.getElementById('userBtn');
  const userMenu = document.getElementById('userMenu');
  const logoutBtn = document.getElementById('logoutBtn');
  const userInfo = document.getElementById('userInfo');
  const userPhoto = document.getElementById('userPhoto');
  if (!userBtn || !userMenu) return;

  const user = ccGetUser();
  if (userInfo && user?.username) userInfo.textContent = user.username;
  if (userPhoto) {
    if (user?.profile_photo) {
      userPhoto.src = user.profile_photo;
      userPhoto.alt = (user.username || 'User') + ' photo';
    }
    else {
      userPhoto.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="24" r="14" fill="%23bfdbfe"/><rect x="10" y="40" width="44" height="20" rx="10" fill="%2393c5fd"/></svg>');
    }
  }

  const apps = [
    { name: 'Apps Home', path: '/connect/26/apps/' },
    { name: 'Chat', path: '/connect/26/chat/' },
    { name: 'Books', path: '/connect/26/books/' },
    { name: 'Draw', path: '/connect/26/draw/' },
    { name: 'AI', path: '/connect/26/ai/' }
  ];

  if (appsMenu) {
    appsMenu.innerHTML = apps.map(app => `<a href="${app.path}" class="dropdown-item">${app.name}</a>`).join('');
  }

  userBtn.onclick = (e) => { e.stopPropagation(); userMenu.classList.toggle('show'); };
  const appsToggle = document.getElementById('appsToggle');
  if (appsToggle && appsMenu) {
    appsToggle.onclick = (e) => { e.preventDefault(); e.stopPropagation(); appsMenu.classList.toggle('show'); };
  }

  if (logoutBtn) logoutBtn.onclick = (e) => { e.preventDefault(); ccLogout(); };

  document.addEventListener('click', () => {
    userMenu.classList.remove('show');
    if (appsMenu) appsMenu.classList.remove('show');
  });
}
