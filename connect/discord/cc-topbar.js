/**
 * Camcookie Connect 26 - Unified Topbar Component
 * This ensures all pages have a consistent topbar design
 */

const TOPBAR_STYLES = `
  #topbar {
    position: sticky;
    top: 0;
    z-index: 100;
    padding: 12px 18px;
    background: var(--brand, #7c3aed);
    color: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  #topbar .brand {
    font-weight: 800;
    letter-spacing: 0.02em;
    font-size: 1rem;
  }

  .topbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-left: auto;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }

  .user-info span {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  #topbar button {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.55);
    border-radius: 999px;
    color: white;
    font-size: 0.9rem;
    padding: 6px 11px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: inherit;
  }

  #topbar button:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .dropdown-container {
    position: relative;
    display: inline-block;
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    background: white;
    border: 1px solid var(--border, #dbe4ff);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    min-width: 160px;
    margin-top: 4px;
    z-index: 1000;
    overflow: hidden;
    display: none;
  }

  .dropdown-menu.show {
    display: block;
  }

  .dropdown-item {
    display: block;
    padding: 10px 14px;
    color: var(--text, #0f172a);
    text-decoration: none;
    border-bottom: 1px solid var(--border, #dbe4ff);
    cursor: pointer;
    transition: background 0.15s ease;
    font-size: 14px;
  }

  .dropdown-item:last-child {
    border-bottom: none;
  }

  .dropdown-item:hover { background: #f6f2ff; }
  .dropdown-item.active { background: #f3eefe; font-weight:600; color: var(--brand-dark, #6d28d9); }

  #userPhoto {
    width: 36px;
    height: 36px;
    border-radius: 999px;
    border: 2px solid rgba(255, 255, 255, 0.65);
    object-fit: cover;
    cursor: pointer;
    transition: border-color 0.2s ease;
  }

  #userPhoto:hover {
    border-color: rgba(255, 255, 255, 1);
  }

  .rank-badge {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 18px;
    height: 18px;
    background: #fbbf24;
    border: 2px solid white;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 800;
    color: #78350f;
  }

  .user-photo-wrapper {
    position: relative;
    display: inline-block;
  }
`;

/**
 * Create the unified topbar HTML
 * @returns {string} HTML for topbar
 */
function ccCreateTopbarHTML() {
  const currentPath = window.location.pathname;
  const pages = [
    { name: 'Apps', path: '/connect/discord/apps/' },
    { name: 'Chat', path: '/connect/discord/chat/' },
    { name: 'Books', path: '/connect/discord/books/' },
    { name: 'Draw', path: '/connect/discord/draw/' },
    { name: 'AI', path: '/connect/discord/ai/' }
  ];

  const navItems = pages
    .map(page => `
      <a href="${page.path}" class="dropdown-item${currentPath.startsWith(page.path) ? ' active' : ''}">${page.name}</a>`)
    .join('');

  return `
    <div class="brand">Camcookie Connect 26</div>
    <div class="topbar-right">
      <div class="dropdown-container">
        <button id="navBtn">Apps ▼</button>
        <div class="dropdown-menu" id="navMenu">
          ${navItems}
        </div>
      </div>
      <div class="user-info" id="userInfo"></div>
      <div class="dropdown-container">
        <div class="user-photo-wrapper">
          <button id="userBtn" style="padding:0;border:none;background:transparent;"><img id="userPhoto" alt="Account"></button>
          <div id="rankBadge" class="rank-badge" style="display:none;"></div>
        </div>
        <div class="dropdown-menu" id="userMenu">
          <div class="dropdown-item" id="scoreDisplay" style="font-weight:600;color:var(--blue-dark, #1d4ed8);cursor:default;border-bottom:1px solid var(--border, #dbe4ff);"></div>
          <a href="/connect/discord/dashboard/" class="dropdown-item">Dashboard</a>
          <a href="/connect/discord/settings/" class="dropdown-item">Settings</a>
          <a href="/connect/discord/friends/" class="dropdown-item">Friends</a>
          <a href="#" class="dropdown-item" id="logoutBtn">Logout</a>
        </div>
      </div>
    </div>
  `;
}

/**
 * Initialize the unified topbar
 * Inject styles and setup topbar events
 */
function ccInitTopbar() {
  // Inject topbar styles if not already present
  if (!document.getElementById('cc-topbar-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'cc-topbar-styles';
    styleEl.textContent = TOPBAR_STYLES;
    document.head.appendChild(styleEl);
  }

  const userBtn = document.getElementById('userBtn');
  const userMenu = document.getElementById('userMenu');
  const navBtn = document.getElementById('navBtn');
  const navMenu = document.getElementById('navMenu');
  const logoutBtn = document.getElementById('logoutBtn');
  const userInfo = document.getElementById('userInfo');
  const userPhoto = document.getElementById('userPhoto');
  const rankBadge = document.getElementById('rankBadge');
  const scoreDisplay = document.getElementById('scoreDisplay');

  if (!userBtn || !userMenu) return;

  // Get user from new local storage format
  const user = ccGetUser();
  const userRank = ccGetUserRank();
  
  // Get user score
  let userScore = 0;
  if (typeof ccCalculateUsageScore === 'function' && user?.id) {
    // Try to get user data and calculate score
    try {
      const friendCount = ccGetFriendCount(user.id);
      // For demo: simple score based on friends
      userScore = friendCount * 50 || 0;
    } catch (e) {
      userScore = 0;
    }
  }

  // Update score display
  if (scoreDisplay) {
    scoreDisplay.textContent = `Points: ${userScore}`;
  }

  // Update user info display
  if (userInfo && user?.username) {
    userInfo.innerHTML = `<span>${user.username}</span>`;
  }

  // Update user photo
  if (userPhoto) {
    if (user?.profile_photo) {
      userPhoto.src = user.profile_photo;
      userPhoto.alt = (user.username || 'User') + ' profile';
    } else {
      // Default user avatar SVG
      userPhoto.src = 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
          <circle cx="32" cy="24" r="14" fill="#bfdbfe"/>
          <rect x="10" y="40" width="44" height="20" rx="10" fill="#93c5fd"/>
        </svg>
      `);
    }
  }

  // Update rank badge if user is in top 3
  if (rankBadge && userRank && userRank <= 3) {
    rankBadge.textContent = '#' + userRank;
    rankBadge.style.display = 'flex';
  }

  // Setup user menu toggle
  userBtn.onclick = (e) => {
    e.stopPropagation();
    userMenu.classList.toggle('show');
    if (navMenu) navMenu.classList.remove('show');
  };

  // Setup nav menu toggle
  if (navBtn && navMenu) {
    navBtn.onclick = (e) => {
      e.stopPropagation();
      navMenu.classList.toggle('show');
      userMenu.classList.remove('show');
    };
  }

  // Setup logout
  if (logoutBtn) {
    logoutBtn.onclick = (e) => {
      e.preventDefault();
      ccLogout();
    };
  }

  // Close menu when clicking outside
  document.addEventListener('click', () => {
    userMenu.classList.remove('show');
    if (navMenu) navMenu.classList.remove('show');
  });

  // Stop propagation when clicking inside menus
  userMenu.addEventListener('click', (e) => e.stopPropagation());
  if (navMenu) navMenu.addEventListener('click', (e) => e.stopPropagation());
}

/**
 * Get user rank from leaderboard
 * This is a placeholder - should be implemented with actual leaderboard lookup
 */
function ccGetUserRank() {
  // TODO: Implement leaderboard lookup
  // For now, return null (no rank badge)
  return null;
}

// Auto-initialize on DOM load
document.addEventListener('DOMContentLoaded', ccInitTopbar);
