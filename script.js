//========================================
// Right Click
//========================================

// CREATE CSS
const style = document.createElement("style");
style.textContent = `
  #customMenu {
    position: absolute;
    background: #0099ff;
    color: white;
    border-radius: 8px;
    padding: 6px 0;
    width: 150px;
    display: none;
    z-index: 99999;
    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    font-family: sans-serif;
  }

  #customMenu .menu-item {
    padding: 10px;
    cursor: pointer;
    font-size: 16px;
  }

  #customMenu .menu-item:hover {
    background: rgba(255,255,255,0.2);
  }
`;
document.head.appendChild(style);

// CREATE MENU HTML
const menu = document.createElement("div");
menu.id = "customMenu";
document.body.appendChild(menu);

// MENU ITEMS (EASY TO EXPAND)
const menuItems = [
  { name: "Go Home", action: "home" },
  { name: "Print", action: "print" }
];

// Build menu items
menuItems.forEach(item => {
  const div = document.createElement("div");
  div.className = "menu-item";
  div.dataset.action = item.action;
  div.textContent = item.name;
  menu.appendChild(div);
});

// RIGHT CLICK HANDLER
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();

  menu.style.left = e.pageX + "px";
  menu.style.top = e.pageY + "px";
  menu.style.display = "block";
});

// Hide menu on left click
document.addEventListener("click", () => {
  menu.style.display = "none";
});

// ACTION HANDLER
menu.addEventListener("click", (e) => {
  const action = e.target.dataset.action;
  if (!action) return;

  if (action === "home") {
    window.location.href = "/";
  }

  if (action === "print") {
    menu.style.display = "none";
    setTimeout(() => {
      window.print();
    }, 1000);
  }
});

//========================================
// Topbar
//========================================

// Main navigation links
const mainLinks = [
  { name: "DOCS", url: "https://camcookie876.github.io/DOCS/" },
  { name: "Music", url: "https://camcookiem.github.io/" },
  { name: "Games", url: "https://camcookieg.github.io/" },
  { name: "Books", url: "https://camcookieb.github.io/" },
  { name: "Connect", url: "https://camcookie876.github.io/connect/" }
];

// Insert main links into the top bar inside a single <h1>
const linkContainer = document.querySelector(".Topbar-links");
const h1 = document.createElement("h1");

mainLinks.forEach((link, i) => {
  const a = document.createElement("a");
  a.href = link.url;
  a.textContent = link.name;
  a.className = "Topbarlink";
  h1.appendChild(a);

  // Add separators except after the last link
  if (i < mainLinks.length - 1) {
    const separator = document.createTextNode(" | ");
    h1.appendChild(separator);
  }
});

linkContainer.appendChild(h1);

// Insert links into the mobile dropdown
const dropdown = document.querySelector(".Topbar-dropdown");
mainLinks.forEach(link => {
  const a = document.createElement("a");
  a.href = link.url;
  a.textContent = link.name;
  dropdown.appendChild(a);
});

// Toggle dropdown on hamburger click
document.querySelector(".Topbar-menu-btn").addEventListener("click", () => {
  dropdown.style.display =
    dropdown.style.display === "flex" ? "none" : "flex";
});
