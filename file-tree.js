/**
 * Interactive File Tree Component
 * Provides interactive, expandable directory trees for the DOCS section
 */

class FileTree {
  constructor(containerId, treeData, options = {}) {
    this.container = document.getElementById(containerId);
    this.treeData = treeData;
    this.options = {
      expandedByDefault: options.expandedByDefault || false,
      onItemClick: options.onItemClick || null,
      baseUrl: options.baseUrl || '',
      ...options
    };
    this.expandedNodes = new Set();
    this.render();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = '';
    const tree = this.createTreeElement(this.treeData);
    this.container.appendChild(tree);
  }

  createTreeElement(items, depth = 0) {
    const ul = document.createElement('div');
    ul.className = `file-tree`;
    ul.style.marginLeft = depth > 0 ? '20px' : '0';

    items.forEach((item, index) => {
      const itemElement = this.createItemElement(item, depth);
      ul.appendChild(itemElement);
    });

    return ul;
  }

  createItemElement(item, depth) {
    const wrapper = document.createElement('div');
    wrapper.className = 'file-tree-item-wrapper';
    wrapper.style.marginBottom = '4px';

    // Item container
    const itemContainer = document.createElement('div');
    itemContainer.className = `file-tree-item ${item.children ? 'folder' : 'file'}`;
    itemContainer.style.display = 'flex';
    itemContainer.style.alignItems = 'center';
    itemContainer.style.gap = '8px';
    itemContainer.style.paddingLeft = '4px';
    itemContainer.style.cursor = 'pointer';
    itemContainer.style.userSelect = 'none';

    // Toggle button for folders
    if (item.children && item.children.length > 0) {
      const toggle = document.createElement('button');
      toggle.className = 'file-tree-toggle';
      toggle.textContent = '▼';
      toggle.style.fontSize = '12px';
      toggle.style.color = 'var(--text-secondary)';
      toggle.style.padding = '0';
      toggle.style.width = '16px';
      toggle.style.height = '16px';
      toggle.style.display = 'flex';
      toggle.style.alignItems = 'center';
      toggle.style.justifyContent = 'center';
      toggle.style.border = 'none';
      toggle.style.background = 'none';
      toggle.style.cursor = 'pointer';

      const isExpanded = this.expandedNodes.has(item.name);
      if (!isExpanded) {
        toggle.textContent = '▶';
      }

      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFolder(item.name, toggle);
      });

      itemContainer.appendChild(toggle);
    } else {
      // Spacer for files
      const spacer = document.createElement('div');
      spacer.style.width = '16px';
      itemContainer.appendChild(spacer);
    }

    // Icon
    const icon = document.createElement('span');
    icon.textContent = item.icon || (item.children ? '📁' : '📄');
    icon.style.fontSize = '14px';
    itemContainer.appendChild(icon);

    // Label
    const label = document.createElement('span');
    label.textContent = item.name;
    label.style.fontSize = '14px';
    label.style.fontWeight = item.children ? '600' : '400';
    label.style.color = 'var(--text-primary)';
    itemContainer.appendChild(label);

    // Badge (optional)
    if (item.badge) {
      const badge = document.createElement('span');
      badge.textContent = item.badge;
      badge.style.fontSize = '11px';
      badge.style.background = 'var(--primary)';
      badge.style.color = 'white';
      badge.style.padding = '2px 6px';
      badge.style.borderRadius = '4px';
      badge.style.marginLeft = '8px';
      itemContainer.appendChild(badge);
    }

    itemContainer.addEventListener('click', (e) => {
      e.stopPropagation();
      if (item.children && item.children.length > 0) {
        // Folder click
        const toggle = itemContainer.querySelector('.file-tree-toggle');
        if (toggle) {
          toggle.click();
        }
      } else if (item.url) {
        // File click
        if (this.options.onItemClick) {
          this.options.onItemClick(item);
        } else {
          window.location.href = item.url;
        }
      }
    });

    wrapper.appendChild(itemContainer);

    // Children container
    if (item.children && item.children.length > 0) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'file-tree-children';
      childrenContainer.style.marginLeft = '8px';
      childrenContainer.style.borderLeft = '1px solid var(--border-subtle)';
      childrenContainer.style.paddingLeft = '12px';

      const isExpanded = this.expandedNodes.has(item.name);
      if (!isExpanded) {
        childrenContainer.style.display = 'none';
      }

      item.children.forEach(child => {
        const childElement = this.createItemElement(child, depth + 1);
        childrenContainer.appendChild(childElement);
      });

      wrapper.appendChild(childrenContainer);
    }

    return wrapper;
  }

  toggleFolder(folderName, toggle) {
    if (this.expandedNodes.has(folderName)) {
      this.expandedNodes.delete(folderName);
      toggle.textContent = '▶';
    } else {
      this.expandedNodes.add(folderName);
      toggle.textContent = '▼';
    }

    // Update visibility in DOM
    const folderElement = toggle.parentElement;
    const childrenContainer = folderElement.nextElementSibling;
    if (childrenContainer && childrenContainer.classList.contains('file-tree-children')) {
      childrenContainer.style.display = this.expandedNodes.has(folderName) ? 'block' : 'none';
    }
  }

  expandAll() {
    this.container.querySelectorAll('.file-tree-item-wrapper').forEach(item => {
      const toggle = item.querySelector('.file-tree-toggle');
      if (toggle && toggle.textContent === '▶') {
        toggle.click();
      }
    });
  }

  collapseAll() {
    this.container.querySelectorAll('.file-tree-item-wrapper').forEach(item => {
      const toggle = item.querySelector('.file-tree-toggle');
      if (toggle && toggle.textContent === '▼') {
        toggle.click();
      }
    });
  }
}

// Example usage:
// const myTree = new FileTree('tree-container', [
//   { name: 'src', icon: '📁', children: [
//     { name: 'index.js', icon: '📄', url: '/path/to/file' },
//     { name: 'utils', icon: '📁', children: [...] }
//   ]}
// ]);
