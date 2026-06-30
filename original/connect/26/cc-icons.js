/**
 * Camcookie Connect 26 - SVG Icons Library
 * Centralized SVG icons for all UI elements
 */

const CC_ICONS = {
  // App icons
  chat: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
    <g fill="none" stroke="#0099ff" stroke-width="55" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="480" cy="512" r="360" />
      <path d="M 300 450 Q 300 380 380 380 L 580 380 Q 660 380 660 450 L 660 560 Q 660 630 580 630 L 420 630 L 350 690 Q 360 640 300 560 Z" />
      <polygon points="860,450 1040,512 860,574" />
    </g>
  </svg>`,

  books: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
    <g fill="none" stroke="#0099ff" stroke-width="55" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="480" cy="512" r="360" />
      <path d="M 300 350 L 470 350 Q 520 350 550 380 L 550 675 Q 520 645 470 645 L 300 645 Z" />
      <path d="M 490 350 L 660 350 Q 710 350 740 380 L 740 675 Q 710 645 660 645 L 490 645 Z" />
      <line x1="480" y1="350" x2="480" y2="675" />
      <polygon points="860,450 1040,512 860,574" />
    </g>
  </svg>`,

  draw: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
    <g fill="none" stroke="#0099ff" stroke-width="55" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="480" cy="512" r="360" />
      <path d="M 300 650 Q 350 400 600 350 Q 750 330 800 450" />
      <line x1="500" y1="700" x2="550" y2="500" />
      <line x1="550" y1="500" x2="700" y2="550" />
      <polygon points="860,450 1040,512 860,574" />
    </g>
  </svg>`,

  ai: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
    <g fill="none" stroke="#0099ff" stroke-width="55" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="480" cy="512" r="360" />
      <circle cx="380" cy="480" r="30" />
      <circle cx="580" cy="480" r="30" />
      <path d="M 380 550 Q 480 600 580 550" />
      <polygon points="860,450 1040,512 860,574" />
    </g>
  </svg>`,

  // UI icons
  users: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>`,

  trophy: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" />
    <path d="M6 9c0 1 .89 2 2 2h8c1.11 0 2-1 2-2" />
    <path d="M9 5v4" />
    <path d="M15 5v4" />
    <path d="M6 13h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2" />
  </svg>`,

  zap: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>`,

  heart: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>`,

  settings: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m3.08 3.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m3.08-3.08l4.24-4.24M19.78 19.78l-4.24-4.24m-3.08-3.08l-4.24-4.24" />
  </svg>`,

  lock: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>`,

  shield: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>`,

  // Navigation icons
  menu: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>`,

  x: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>`,

  chevronDown: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <polyline points="6 9 12 15 18 9" />
  </svg>`,

  home: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>`,

  back: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>`,

  /**
   * Get SVG as data URL for use in img tags
   */
  getDataURL: function(key) {
    if (!this[key]) return '';
    return 'data:image/svg+xml;base64,' + btoa(this[key]);
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CC_ICONS;
}
