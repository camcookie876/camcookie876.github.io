/**
 * Camcookie Connect 26 - Auth & Utility Module
 */

const CC_STORAGE_KEY_TOKEN = 'cc-token';
const CC_STORAGE_KEY_USER = 'cc-user';
const CC_STORAGE_KEY_SETTINGS = 'cc-settings';

function ccGetToken() { return localStorage.getItem(CC_STORAGE_KEY_TOKEN); }
function ccGetUser() {
  const userStr = localStorage.getItem(CC_STORAGE_KEY_USER);
  if (!userStr) return null;
  try { return JSON.parse(userStr); } catch { return null; }
}
function ccIsAuthenticated() { return !!ccGetToken() && !!ccGetUser(); }

function ccLogout() {
  localStorage.removeItem(CC_STORAGE_KEY_TOKEN);
  localStorage.removeItem(CC_STORAGE_KEY_USER);
  localStorage.removeItem(CC_STORAGE_KEY_SETTINGS);
  window.location.href = '/connect/26/';
}

function ccGetSetting(key, defaultValue = null) {
  const settings = JSON.parse(localStorage.getItem(CC_STORAGE_KEY_SETTINGS) || '{}');
  return settings[key] !== undefined ? settings[key] : defaultValue;
}
function ccSetSetting(key, value) {
  const settings = JSON.parse(localStorage.getItem(CC_STORAGE_KEY_SETTINGS) || '{}');
  settings[key] = value;
  localStorage.setItem(CC_STORAGE_KEY_SETTINGS, JSON.stringify(settings));
}

function ccGetUserPhoto() {
  return localStorage.getItem('cc_profile_image');
}

function ccSetUserPhoto(photoBase64) {
  localStorage.setItem('cc_profile_image', photoBase64);
}

function ccGetUsername() {
  const user = ccGetUser();
  return user?.username || localStorage.getItem('cc_username') || 'User';
}

async function ccFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function ccHashPassword(password) {
  const enc = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function ccRequireAuth() {
  if (ccIsAuthenticated()) return;
  const hash = window.location.hash || '';
  const suffix = hash ? hash : '';
  window.location.href = '/connect/26/' + suffix;
}

function ccInitTopbar() {
  const appsMenu = document.getElementById('appsMenu');
  const userBtn = document.getElementById('userBtn');
  const userMenu = document.getElementById('userMenu');
  const logoutBtn = document.getElementById('logoutBtn');
  const userInfo = document.getElementById('userInfo');
  if (!userBtn || !userMenu) return;

  const user = ccGetUser();
  if (userInfo && user?.username) userInfo.textContent = user.username;

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

document.addEventListener('DOMContentLoaded', ccInitTopbar);
