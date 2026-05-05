/**
 * Unified topbar navigation utility
 * Provides dropdown navigation and URL/query parameter handling
 */

// Load SVG icons
if (typeof getSVGIcon === 'undefined') {
  const script = document.createElement('script');
  script.src = '/svg-icons.js';
  document.head.appendChild(script);
}

// Helper to get current app/page
function getCurrentPageType() {
  const path = window.location.pathname;
  if (path.includes('/chat')) return 'chat';
  if (path.includes('/books')) return 'books';
  if (path.includes('/draw')) return 'draw';
  if (path.includes('/terms')) return 'terms';
  if (path.includes('/26')) return 'connect';
  return 'home';
}

// Initialize topbar with dropdown navigation
function initTopbar() {
  const topbar = document.getElementById('topbar');
  if (!topbar) return;

  const currentPage = getCurrentPageType();
  
  // Create dropdown button if it doesn't exist
  const brand = topbar.querySelector('.brand');
  if (brand && !topbar.querySelector('.cc-app-dropdown')) {
    // Create styles for dropdown
    const style = document.createElement('style');
    style.textContent = `
      .cc-dropdown-container {
        position: relative;
        display: inline-block;
      }
      .cc-app-dropdown {
        background: transparent !important;
        border: 1px solid rgba(255, 255, 255, 0.55) !important;
        border-radius: 999px !important;
        color: white !important;
        font-size: 0.9rem !important;
        padding: 6px 11px !important;
        cursor: pointer !important;
        margin-left: 12px !important;
        transition: all 0.2s ease !important;
        font-weight: inherit;
      }
      .cc-app-dropdown:hover {
        background: rgba(255, 255, 255, 0.2) !important;
      }
      .cc-app-menu {
        position: absolute;
        top: 100%;
        left: 0;
        background: white;
        border: 1px solid #dbe4ff;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        min-width: 160px;
        margin-top: 4px;
        z-index: 1000;
        overflow: hidden;
      }
      .cc-app-item {
        display: block;
        padding: 10px 14px;
        color: #0f172a;
        text-decoration: none;
        border-bottom: 1px solid #dbe4ff;
        cursor: pointer;
        transition: background 0.15s ease;
        font-size: 14px;
      }
      .cc-app-item:last-child {
        border-bottom: none;
      }
      .cc-app-item:hover {
        background: #f0f7ff;
      }
      .cc-app-item.active {
        background: #eff6ff;
        font-weight: 600;
        color: #1d4ed8;
      }
    `;
    document.head.appendChild(style);
    
    const dropdownContainer = document.createElement('div');
    dropdownContainer.className = 'cc-dropdown-container';
    
    const dropdownBtn = document.createElement('button');
    dropdownBtn.className = 'cc-app-dropdown';
    dropdownBtn.innerHTML = 'Apps ▼';
    
    const menu = document.createElement('div');
    menu.className = 'cc-app-menu';
    menu.style.display = 'none';
    
    const apps = [
      { name: 'Chat', path: '/connect4now/26/chat', icon: 'chat', type: 'chat' },
      { name: 'Books', path: '/connect4now/26/books', icon: 'books', type: 'books' },
      { name: 'Draw', path: '/connect4now/26/draw', icon: 'draw', type: 'draw' },
      { name: 'Dashboard', path: '/connect4now/26', icon: 'home', type: 'connect' },
    ];
    
    apps.forEach((app) => {
      const item = document.createElement('a');
      item.href = app.path;
      item.className = 'cc-app-item';
      if (app.type === currentPage) {
        item.classList.add('active');
      }
      
      // Try to use SVG icon if available
      if (typeof getSVGIcon !== 'undefined') {
        const iconSpan = document.createElement('span');
        iconSpan.innerHTML = getSVGIcon(app.icon);
        iconSpan.style.width = '18px';
        iconSpan.style.height = '18px';
        iconSpan.style.display = 'inline-flex';
        iconSpan.style.alignItems = 'center';
        iconSpan.style.marginRight = '8px';
        item.appendChild(iconSpan);
        
        const name = document.createElement('span');
        name.textContent = app.name;
        item.appendChild(name);
      } else {
        item.textContent = app.name;
      }
      menu.appendChild(item);
    });
    
    // Toggle menu
    dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    });
    
    // Close menu on outside click
    document.addEventListener('click', (e) => {
      if (!dropdownContainer.contains(e.target)) {
        menu.style.display = 'none';
      }
    });
    
    dropdownContainer.appendChild(dropdownBtn);
    dropdownContainer.appendChild(menu);
    brand.parentNode.insertBefore(dropdownContainer, brand.nextSibling);
  }
}

// Store query parameters in localStorage and clean URL
function handleQueryParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.size > 0) {
    // Store all params in localStorage
    const stored = {};
    params.forEach((value, key) => {
      stored[key] = value;
    });
    localStorage.setItem('cc-query-params', JSON.stringify(stored));
    
    // Clean URL without showing ?
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);
    
    return stored;
  }
  
  // Try to get stored params
  const stored = localStorage.getItem('cc-query-params');
  return stored ? JSON.parse(stored) : {};
}

// Get query parameter from localStorage (without exposing in URL)
function getQueryParam(key) {
  const params = JSON.parse(localStorage.getItem('cc-query-params') || '{}');
  return params[key] || null;
}

// Set query parameter in localStorage (without exposing in URL)
function setQueryParam(key, value) {
  const params = JSON.parse(localStorage.getItem('cc-query-params') || '{}');
  params[key] = value;
  localStorage.setItem('cc-query-params', JSON.stringify(params));
}

// Clear all query params
function clearQueryParams() {
  localStorage.removeItem('cc-query-params');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTopbar);
} else {
  initTopbar();
}
