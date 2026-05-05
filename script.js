const PADGE_FILE = '/padge.json';
const isDOCS = window.location.pathname.startsWith('/DOCS/');

const mainLinks = isDOCS ? [
  { name: 'Home', url: '/' },
  { name: 'DOCS', url: '/DOCS/' },
  { name: 'Music', url: '/DOCS/music/' },
  { name: 'Arduino', url: '/DOCS/arduino/' },
  { name: 'Books', url: '/books/' },
  { name: 'Games', url: '/games/' },
  { name: 'Connect', url: '/connect/' }
] : [
  { name: 'Home', url: '/' },
  { name: 'DOCS', url: '/DOCS/' },
  { name: 'Music', url: 'https://camcookiem.github.io/' },
  { name: 'Books', url: '/books/' },
  { name: 'Games', url: 'https://camcookieg.github.io/' },
  { name: 'Connect', url: '/connect/' },
  { name: 'Links', url: '/links/' }
];

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
      return;
    }

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
