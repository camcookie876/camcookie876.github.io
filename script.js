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
    container.style.position = 'relative';

    if (isDropdown) {
      container.style.flexDirection = 'column';
      container.style.alignItems = 'stretch';
    }

    const inputContainer = document.createElement('div');
    inputContainer.style.display = 'flex';
    inputContainer.style.gap = '8px';
    inputContainer.style.width = '100%';
    inputContainer.style.position = 'relative';

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

    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'site-search-results';
    resultsContainer.style.position = 'absolute';
    resultsContainer.style.top = '100%';
    resultsContainer.style.left = '0';
    resultsContainer.style.right = isDropdown ? '0' : 'auto';
    resultsContainer.style.width = isDropdown ? '100%' : '220px';
    resultsContainer.style.marginTop = '4px';
    resultsContainer.style.background = '#fff';
    resultsContainer.style.border = '1px solid #ccc';
    resultsContainer.style.borderRadius = '4px';
    resultsContainer.style.maxHeight = '300px';
    resultsContainer.style.overflowY = 'auto';
    resultsContainer.style.display = 'none';
    resultsContainer.style.zIndex = '1000';
    resultsContainer.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';

    const message = document.createElement('div');
    message.className = 'site-search-message';
    message.style.fontSize = '12px';
    message.style.color = isDropdown ? '#000' : '#fff';
    message.style.minHeight = '18px';
    message.style.paddingTop = isDropdown ? '4px' : '0';

    button.addEventListener('click', () => {
      if (input.value.trim()) {
        performDropdownSearch(input.value.trim(), resultsContainer, pageIndex);
      }
    });

    input.addEventListener('input', () => {
      if (input.value.trim().length > 0) {
        performDropdownSearch(input.value.trim(), resultsContainer, pageIndex);
      } else {
        resultsContainer.style.display = 'none';
        resultsContainer.innerHTML = '';
      }
    });

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (input.value.trim()) {
          performDropdownSearch(input.value.trim(), resultsContainer, pageIndex);
        }
      }
    });

    // Close results when clicking outside
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        resultsContainer.style.display = 'none';
      }
    });

    inputContainer.appendChild(input);
    inputContainer.appendChild(button);
    container.appendChild(inputContainer);
    container.appendChild(resultsContainer);
    container.appendChild(message);

    return container;
  }

  function performDropdownSearch(query, resultsContainer, pageIndex) {
    const lowerQuery = query.toLowerCase();
    const matches = pageIndex.filter(page => {
      const title = page.title ? page.title.toLowerCase() : '';
      const url = page.url ? page.url.toLowerCase() : '';
      const desc = page.description ? page.description.toLowerCase() : '';
      return title.includes(lowerQuery) || url.includes(lowerQuery) || desc.includes(lowerQuery);
    });

    resultsContainer.innerHTML = '';

    if (matches.length === 0) {
      const noResult = document.createElement('div');
      noResult.style.padding = '12px';
      noResult.style.textAlign = 'center';
      noResult.style.color = '#999';
      noResult.textContent = 'No pages found';
      resultsContainer.appendChild(noResult);
      resultsContainer.style.display = 'block';
      return;
    }

    matches.slice(0, 10).forEach(page => {
      const item = document.createElement('div');
      item.style.padding = '10px 12px';
      item.style.borderBottom = '1px solid #eee';
      item.style.cursor = 'pointer';
      item.style.transition = 'background-color 0.2s';

      const titleEl = document.createElement('div');
      titleEl.style.fontWeight = '500';
      titleEl.style.color = '#000';
      titleEl.textContent = page.title || 'Untitled';

      const urlEl = document.createElement('div');
      urlEl.style.fontSize = '12px';
      urlEl.style.color = '#666';
      urlEl.style.marginTop = '2px';
      urlEl.textContent = page.url || '/';

      item.appendChild(titleEl);
      item.appendChild(urlEl);

      item.addEventListener('mouseover', () => {
        item.style.backgroundColor = '#f5f5f5';
      });

      item.addEventListener('mouseout', () => {
        item.style.backgroundColor = 'transparent';
      });

      item.addEventListener('click', () => {
        const targetUrl = page.url.startsWith('http') || page.url.startsWith('/') ? page.url : `/${page.url}`;
        window.location.href = targetUrl;
      });

      resultsContainer.appendChild(item);
    });

    resultsContainer.style.display = 'block';
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
