// Load SVG icons
const script = document.createElement('script');
script.src = '/svg-icons.js';
document.head.appendChild(script);

const PADGE_FILE = '/padge.json';
const isDOCS = window.location.pathname.startsWith('/DOCS/');

const mainLinks = isDOCS ? [
  { name: 'Home', url: '/' },
  { name: 'DOCS', url: '/DOCS/' },
  { name: 'Music', url: '/DOCS/music/' },
  { name: 'Arduino', url: '/DOCS/arduino/' },
  { name: 'Books', url: '/books/' },
  { name: 'Games', url: 'https://camcookieg.github.io/' },
  { name: 'Connect', url: '/connect4now/' }
] : [
  { name: 'Home', url: '/' },
  { name: 'DOCS', url: '/DOCS/' },
  { name: 'Music', url: 'https://camcookiem.github.io/' },
  { name: 'Books', url: '/books/' },
  { name: 'Games', url: 'https://camcookieg.github.io/' },
  { name: 'Connect', url: '/connect4now/' },
  { name: 'Links', url: '/links/' }
];

const connectProfileLinks = [
  { name: 'Connect 26 Home', url: '/connect4now/26/' },
  { name: 'Chat', url: '/connect4now/26/chat/' },
  { name: 'Books', url: '/connect4now/26/books/' },
  { name: 'Draw', url: '/connect4now/26/draw/' }
];

function createConnectProfiles(bar, inner) {
  if (!bar || bar.querySelector('.connect-profile-btn')) return;
  const profileMenu = document.createElement('div');
  profileMenu.className = 'connect-profile-menu';
  profileMenu.style.position = 'relative';
  profileMenu.style.display = 'flex';
  profileMenu.style.alignItems = 'center';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'connect-profile-btn';
  button.textContent = 'Profiles ▼';
  button.style.border = '1px solid rgba(255,255,255,0.35)';
  button.style.borderRadius = '999px';
  button.style.background = 'rgba(255,255,255,0.16)';
  button.style.color = 'white';
  button.style.padding = '8px 16px';
  button.style.cursor = 'pointer';
  button.style.fontWeight = '700';
  button.style.transition = 'background 0.2s ease';
  button.addEventListener('mouseenter', () => button.style.background = 'rgba(255,255,255,0.28)');
  button.addEventListener('mouseleave', () => button.style.background = 'rgba(255,255,255,0.16)');

  const dropdown = document.createElement('div');
  dropdown.className = 'connect-profile-dropdown';
  dropdown.style.display = 'none';
  dropdown.style.position = 'absolute';
  dropdown.style.top = 'calc(100% + 10px)';
  dropdown.style.right = '0';
  dropdown.style.background = 'white';
  dropdown.style.border = '1px solid rgba(15, 103, 255, 0.18)';
  dropdown.style.borderRadius = '16px';
  dropdown.style.boxShadow = '0 22px 50px rgba(15, 103, 255, 0.18)';
  dropdown.style.overflow = 'hidden';
  dropdown.style.minWidth = '220px';
  dropdown.style.zIndex = '10001';

  connectProfileLinks.forEach(link => {
    const a = document.createElement('a');
    a.className = 'connect-profile-link';
    a.href = link.url;
    a.style.display = 'block';
    a.style.padding = '12px 16px';
    a.style.color = 'var(--text-primary)';
    a.style.background = 'white';
    a.style.textDecoration = 'none';
    a.style.fontWeight = '600';
    a.style.display = 'flex';
    a.style.alignItems = 'center';
    a.style.gap = '10px';
    
    // Determine icon for this link
    let icon = '';
    if (link.name.includes('Chat')) icon = 'chat';
    else if (link.name.includes('Books')) icon = 'books';
    else if (link.name.includes('Draw')) icon = 'draw';
    else if (link.name.includes('Home')) icon = 'home';
    
    // Add icon if getSVGIcon is available
    if (icon && typeof getSVGIcon !== 'undefined') {
      const iconSpan = document.createElement('span');
      iconSpan.innerHTML = getSVGIcon(icon);
      iconSpan.style.width = '18px';
      iconSpan.style.height = '18px';
      iconSpan.style.display = 'flex';
      iconSpan.style.alignItems = 'center';
      iconSpan.style.justifyContent = 'center';
      a.appendChild(iconSpan);
    }
    
    const nameSpan = document.createElement('span');
    nameSpan.textContent = link.name;
    a.appendChild(nameSpan);
    
    a.addEventListener('mouseenter', () => a.style.background = '#f7faff');
    a.addEventListener('mouseleave', () => a.style.background = 'white');
    dropdown.appendChild(a);
  });

  button.addEventListener('click', (event) => {
    event.stopPropagation();
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  });

  document.addEventListener('click', (e) => {
    if (!profileMenu.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });

  profileMenu.appendChild(button);
  profileMenu.appendChild(dropdown);
  inner.insertBefore(profileMenu, inner.querySelector('.site-nav'));
}

document.addEventListener('DOMContentLoaded', () => {
  const pageIndex = [];
  
  // Initialize topbar
  initTopbar();
  
  // Initialize footer
  initFooter();
  
  // Load page index and init context menu
  loadPageIndex();
  initContextMenu();

  function initTopbar() {
    const navContainer = document.querySelector('.site-nav');
    const dropdown = document.querySelector('.site-dropdown');
    const menuBtn = document.querySelector('.site-menu-btn');

    if (!navContainer && !dropdown) {
      // Topbar doesn't exist, create it
      const topbar = createTopbar();
      document.body.prepend(topbar);
      createConnectProfiles(topbar, topbar.querySelector('.site-topbar-inner'));
      return;
    }

    const topbar = document.querySelector('.site-topbar');

    // Desktop links
    if (navContainer) {
      mainLinks.forEach(link => {
        const a = document.createElement('a');
        a.href = link.url;
        a.textContent = link.name;
        navContainer.appendChild(a);
      });
    }

    // Mobile dropdown
    if (dropdown) {
      mainLinks.forEach(link => {
        const a = document.createElement('a');
        a.href = link.url;
        a.textContent = link.name;
        dropdown.appendChild(a);
      });
    }

    // Toggle dropdown
    if (menuBtn && dropdown) {
      menuBtn.addEventListener('click', () => {
        dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.site-topbar')) {
          dropdown.style.display = 'none';
        }
      });
    }

    if (topbar) {
      createConnectProfiles(topbar, topbar.querySelector('.site-topbar-inner'));
    }
  }

  function createTopbar() {
    const bar = document.createElement('div');
    bar.className = 'site-topbar';

    const inner = document.createElement('div');
    inner.className = 'site-topbar-inner';

    const brand = document.createElement('a');
    brand.className = 'site-brand';
    brand.href = '/';
    brand.innerHTML = isDOCS 
      ? '<img src="/DOCS/logo.png" alt="Camcookie DOCS"> <span>Camcookie DOCS</span>' 
      : '<img src="/logo.png" alt="Camcookie Logo"> <span>Camcookie</span>';

    const nav = document.createElement('nav');
    nav.className = 'site-nav';
    
    mainLinks.forEach(link => {
      const a = document.createElement('a');
      a.href = link.url;
      a.textContent = link.name;
      nav.appendChild(a);
    });

    const menuBtn = document.createElement('button');
    menuBtn.className = 'site-menu-btn';
    menuBtn.setAttribute('aria-label', 'Menu');
    menuBtn.setAttribute('title', 'Menu');
    menuBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';

    const dropdown = document.createElement('div');
    dropdown.className = 'site-dropdown';
    
    mainLinks.forEach(link => {
      const a = document.createElement('a');
      a.href = link.url;
      a.textContent = link.name;
      dropdown.appendChild(a);
    });

    inner.appendChild(brand);
    inner.appendChild(nav);
    inner.appendChild(menuBtn);
    inner.appendChild(dropdown);
    
    bar.appendChild(inner);

    // Toggle dropdown
    menuBtn.addEventListener('click', () => {
      dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.site-topbar')) {
        dropdown.style.display = 'none';
      }
    });

    createConnectProfiles(bar, inner);
    return bar;
  }

  function initFooter() {
    const existingFooter = document.querySelector('.footer');
    if (existingFooter) return;

    const footer = document.createElement('footer');
    footer.className = 'footer';
    footer.innerHTML = `
      <p>&copy; 2024 Camcookie. All rights reserved.</p>
      <p><a href="/links/">Links</a> | <a href="/DOCS/">Docs</a></p>
    `;
    document.body.appendChild(footer);
  }

  function loadPageIndex() {
    fetch(PADGE_FILE)
      .then(response => response.json())
      .then(data => {
        if (data.pages && Array.isArray(data.pages)) {
          pageIndex.push(...data.pages);
        }
      })
      .catch(error => console.error('Error loading page index:', error));
  }

  function initContextMenu() {
    document.addEventListener('contextmenu', (e) => {
      const target = e.target;
      if (target.tagName === 'A' || target.closest('a')) {
        return;
      }
    });
  }
});
