//========================================
//Topbar
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
