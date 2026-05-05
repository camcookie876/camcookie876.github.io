/**
 * Connect 26 App Initializer
 * Sets up authentication and fullscreen layout for all Connect 26 apps
 */

class Connect26App {
  constructor(appName, options = {}) {
    this.appName = appName;
    this.options = {
      requireAuth: true,
      fullscreen: true,
      showProfile: true,
      ...options
    };
    this.auth = null;
    this.user = null;
    this.userProfile = null;
    this.init();
  }

  async init() {
    try {
      // Initialize auth
      this.auth = getAuthManager();

      // Wait for auth to be ready
      await this.waitForAuth();

      // Check if authenticated
      if (this.options.requireAuth && !this.auth.isAuthenticated()) {
        window.location.href = '/connect4now/';
        return;
      }

      this.user = this.auth.getUser();
      this.userProfile = this.auth.getProfile();

      // Setup UI
      this.setupAppShell();
      this.setupAuth Listener();

      // Emit ready event
      window.dispatchEvent(new CustomEvent('app-ready', { detail: { app: this.appName, user: this.user, profile: this.userProfile } }));

    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.showError('Failed to load app. Please refresh the page.');
    }
  }

  async waitForAuth() {
    return new Promise((resolve) => {
      const checkAuth = () => {
        if (this.auth.getUser()) {
          resolve();
        } else if (this.auth.isAuthenticated()) {
          resolve();
        } else {
          setTimeout(checkAuth, 100);
        }
      };
      checkAuth();
    });
  }

  setupAppShell() {
    if (!this.options.fullscreen) return;

    // Add fullscreen app wrapper
    const appShell = document.createElement('div');
    appShell.className = 'fullscreen-app';
    appShell.style.position = 'fixed';
    appShell.style.top = '0';
    appShell.style.left = '0';
    appShell.style.right = '0';
    appShell.style.bottom = '0';
    appShell.style.width = '100%';
    appShell.style.height = '100%';
    appShell.style.display = 'flex';
    appShell.style.flexDirection = 'column';
    appShell.style.background = 'var(--primary-pale)';
    appShell.style.zIndex = '1000';

    // Get topbar
    const topbar = document.getElementById('topbar');
    if (topbar) {
      topbar.style.flexShrink = '0';
      topbar.style.position = 'static';
    }

    // Get main content
    const main = document.querySelector('main, #main, .content, [role="main"]');
    if (main) {
      main.style.flex = '1';
      main.style.overflow = 'auto';
      main.style.padding = '0';
      main.style.margin = '0';
      main.style.border = 'none';
      main.style.background = 'transparent';
      main.style.maxWidth = '100%';
    }
  }

  setupAuthListener() {
    this.auth.onAuthChange((user, profile) => {
      this.user = user;
      this.userProfile = profile;

      if (!user && this.options.requireAuth) {
        window.location.href = '/connect4now/';
      } else {
        this.updateProfileUI();
      }
    });
  }

  updateProfileUI() {
    if (!this.options.showProfile) return;

    const topbar = document.getElementById('topbar');
    if (!topbar) return;

    // Remove old profile UI
    const oldProfile = topbar.querySelector('.topbar-profile');
    if (oldProfile) oldProfile.remove();

    if (!this.user) return;

    // Create new profile UI
    const profileContainer = document.createElement('div');
    profileContainer.className = 'topbar-profile';
    profileContainer.style.display = 'flex';
    profileContainer.style.alignItems = 'center';
    profileContainer.style.gap = '12px';
    profileContainer.style.marginLeft = 'auto';

    const username = this.auth.getUsername();
    const profileImage = this.auth.getProfileImage();

    const avatar = document.createElement('img');
    avatar.src = profileImage || this.createInitialAvatar(username);
    avatar.alt = 'Profile';
    avatar.className = 'profile-image';
    avatar.style.width = '40px';
    avatar.style.height = '40px';
    avatar.style.borderRadius = '50%';
    avatar.style.background = 'rgba(255,255,255,0.3)';
    avatar.style.border = '2px solid rgba(255,255,255,0.5)';
    avatar.style.cursor = 'pointer';
    avatar.style.objectFit = 'cover';

    avatar.addEventListener('click', () => {
      window.location.href = '/connect/';
    });

    profileContainer.appendChild(avatar);
    topbar.appendChild(profileContainer);
  }

  createInitialAvatar(username) {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    const hue = username.charCodeAt(0) % 360;
    ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
    ctx.fillRect(0, 0, 100, 100);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(username.charAt(0).toUpperCase(), 50, 50);
    
    return canvas.toDataURL();
  }

  showError(message) {
    const error = document.getElementById('errorView');
    if (error) {
      error.innerHTML = `<div class="card"><h2>Error</h2><p>${message}</p></div>`;
      error.style.display = 'flex';
    } else {
      alert(message);
    }
  }

  getUser() {
    return this.user;
  }

  getProfile() {
    return this.userProfile;
  }

  getSupabase() {
    return getSupabase();
  }
}

// Initialize app on page load
let connect26App = null;

function initConnect26App(appName, options) {
  connect26App = new Connect26App(appName, options);
  return connect26App;
}

// Auto-init if data attribute is present
document.addEventListener('DOMContentLoaded', () => {
  const appElement = document.querySelector('[data-connect-app]');
  if (appElement) {
    const appName = appElement.getAttribute('data-connect-app');
    const requireAuth = appElement.getAttribute('data-require-auth') !== 'false';
    const fullscreen = appElement.getAttribute('data-fullscreen') !== 'false';
    
    initConnect26App(appName, { requireAuth, fullscreen });
  }
});
