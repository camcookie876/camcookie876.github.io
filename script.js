const PADGE_FILE = '/padge.json';

const mainLinks = [
  { name: 'Home', url: '/' },
  { name: 'DOCS', url: '/DOCS/' },
  { name: 'Music', url: '/DOCS/music/' },
  { name: 'Arduino', url: '/DOCS/arduino/' },
  { name: 'Books', url: '/books/' },
  { name: 'Games', url: '/game/' },
  { name: 'Connect', url: '/connect/' }
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

      const searchBar = createSearchBar();
      navContainer.insertAdjacentElement('afterend', searchBar);
    }

    // Mobile dropdown
    if (dropdown) {
      mainLinks.forEach(link => {
        const a = document.createElement('a');
        a.href = link.url;
        a.textContent = link.name;
        dropdown.appendChild(a);
      });

      const dropdownSearchBar = createSearchBar(true);
      dropdown.appendChild(dropdownSearchBar);
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
    brand.innerHTML = '<img src="/logo.png" alt="Camcookie Logo"> <span>Camcookie</span>';

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

    const topbarSearch = createSearchBar();
    inner.appendChild(topbarSearch);

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

  function createSearchBar(isDropdown = false) {
    const container = document.createElement('div');
    container.className = 'site-search';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.gap = '8px';
    container.style.marginTop = isDropdown ? '12px' : '0';
    container.style.width = isDropdown ? '100%' : 'auto';
    container.style.flex = isDropdown ? '0' : '1';

    if (isDropdown) {
      container.style.flexDirection = 'column';
      container.style.alignItems = 'stretch';
    }

    const input = document.createElement('input');
    input.type = 'search';
    input.placeholder = 'Search pages...';
    input.style.flex = '1';
    input.style.minWidth = '0';
    input.style.padding = '8px 10px';
    input.style.border = '1px solid #ccc';
    input.style.borderRadius = '4px';
    input.style.width = isDropdown ? '100%' : '220px';

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Search';
    button.style.padding = '8px 12px';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.background = '#007bff';
    button.style.color = '#fff';
    button.style.cursor = 'pointer';
    button.style.width = isDropdown ? '100%' : 'auto';

    const message = document.createElement('div');
    message.className = 'site-search-message';
    message.style.fontSize = '12px';
    message.style.color = isDropdown ? '#000' : '#fff';
    message.style.minHeight = '18px';
    message.style.paddingTop = isDropdown ? '4px' : '0';

    button.addEventListener('click', () => {
      performSearch(input, message);
    });

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        performSearch(input, message);
      }
    });

    container.appendChild(input);
    container.appendChild(button);
    container.appendChild(message);

    return container;
  }

  function performSearch(input, message) {
    const query = input.value.trim().toLowerCase();
    message.textContent = '';
    if (!query) {
      input.focus();
      return;
    }

    if (!pageIndex.length) {
      message.textContent = 'Loading pages...';
      return;
    }

    const match = pageIndex.find(page => {
      const title = page.title ? page.title.toLowerCase() : '';
      const url = page.url ? page.url.toLowerCase() : '';
      const desc = page.description ? page.description.toLowerCase() : '';
      return title.includes(query) || url.includes(query) || desc.includes(query);
    });

    if (match) {
      const targetUrl = match.url.startsWith('http') || match.url.startsWith('/') ? match.url : `/${match.url}`;
      window.location.href = targetUrl;
      return;
    }

    message.textContent = 'No page found.';
    setTimeout(() => {
      if (message.textContent === 'No page found.') {
        message.textContent = '';
      }
    }, 3000);
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
