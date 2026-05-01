const PADGE_FILE = '/padge.json';
const NAV_LINKS = [
  { name: 'Home', url: '/' },
  { name: 'DOCS', url: '/DOCS/' },
  { name: 'Music', url: 'https://camcookiem.github.io/' },
  { name: 'Books', url: '/books/' },
  { name: 'Games', url: 'https://camcookieg.github.io/' },
  { name: 'Connect', url: '/connect/' },
];

document.addEventListener('DOMContentLoaded', () => {
  const pageIndex = [];
  const topbar = createTopbar();
  const footer = createFooter();
  document.body.prepend(topbar);
  document.body.appendChild(footer);
  loadPageIndex();
  initContextMenu();

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
    NAV_LINKS.forEach(link => {
      const a = document.createElement('a');
      a.href = link.url;
      a.textContent = link.name;
      nav.appendChild(a);
    });

    const search = document.createElement('div');
    search.className = 'search-control';
    search.innerHTML = '<input type="search" placeholder="Search pages..." aria-label="Search pages"><div class="search-results"></div>';
    const searchInput = search.querySelector('input');
    const resultsBox = search.querySelector('.search-results');

    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim().toLowerCase();
      resultsBox.innerHTML = '';
      if (!query || pageIndex.length === 0) {
        resultsBox.classList.remove('show');
        return;
      }

      const matches = pageIndex.filter(page => {
        return page.title.toLowerCase().includes(query) ||
          page.description.toLowerCase().includes(query) ||
          page.path.toLowerCase().includes(query);
      }).slice(0, 8);

      if (matches.length === 0) {
        resultsBox.innerHTML = '<div class="result-empty">No results found</div>';
      } else {
        matches.forEach(page => {
          const item = document.createElement('a');
          item.href = page.url;
          item.className = 'search-result';
          item.innerHTML = `<strong>${page.title}</strong><span>${page.description}</span>`;
          resultsBox.appendChild(item);
        });
      }
      resultsBox.classList.add('show');
    });

    document.addEventListener('click', (event) => {
      if (!search.contains(event.target)) {
        resultsBox.classList.remove('show');
      }
    });

    inner.appendChild(brand);
    inner.appendChild(nav);
    inner.appendChild(search);

    const mobileToggle = document.createElement('button');
    mobileToggle.className = 'site-menu-toggle';
    mobileToggle.type = 'button';
    mobileToggle.textContent = 'Menu';
    mobileToggle.addEventListener('click', () => {
      bar.classList.toggle('menu-open');
    });

    inner.appendChild(mobileToggle);
    bar.appendChild(inner);
    return bar;
  }

  function createFooter() {
    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = `
      <div class="footer-copy">
        <strong>Copyright © 2025 Camcookie.</strong>
        <span>All rights reserved.</span>
      </div>
      <div class="footer-meta">
        <span>Browse docs, music, books, games, and more from one place.</span>
      </div>
    `;
    return footer;
  }

  async function loadPageIndex() {
    try {
      const response = await fetch(PADGE_FILE, { cache: 'no-store' });
      if (!response.ok) throw new Error('Page index not available');
      const json = await response.json();
      if (Array.isArray(json.pages)) {
        pageIndex.push(...json.pages);
      }
    } catch (error) {
      console.warn('Could not load page index:', error);
    }
  }

  function initContextMenu() {
    const menu = document.createElement('div');
    menu.id = 'customMenu';
    menu.innerHTML = `
      <div class="menu-item" data-action="home">Home</div>
      <div class="menu-item" data-action="search">Search</div>
      <div class="menu-item" data-action="print">Print</div>
    `;
    document.body.appendChild(menu);

    document.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      menu.style.left = event.pageX + 'px';
      menu.style.top = event.pageY + 'px';
      menu.style.display = 'block';
    });

    document.addEventListener('click', () => {
      menu.style.display = 'none';
    });

    menu.addEventListener('click', (event) => {
      const action = event.target.dataset.action;
      if (!action) return;
      if (action === 'home') window.location.href = '/';
      if (action === 'top') window.location.href = '/';
      if (action === 'search') document.querySelector('.search-control input')?.focus();
      if (action === 'print') window.print();
    });
  }
});
