// Main navigation links
const mainLinks = [
  { name: "DOCS", url: "https://camcookie876.github.io/DOCS/" },
  { name: "Music", url: "https://camcookiem.github.io/" },
  { name: "Games", url: "https://camcookieg.github.io/" },
  { name: "Books", url: "https://camcookieb.github.io/" },
  { name: "Connect", url: "https://camcookie876.github.io/connect/" }
];

// Insert main links into top bar
const linkContainer = document.querySelector(".Topbar-links");
mainLinks.forEach(link => {
  const a = document.createElement("a");
  a.href = link.url;
  a.textContent = link.name;
  linkContainer.appendChild(a);
});

// Insert links into mobile dropdown
const dropdown = document.querySelector(".Topbar-dropdown");
mainLinks.forEach(link => {
  const a = document.createElement("a");
  a.href = link.url;
  a.textContent = link.name;
  dropdown.appendChild(a);
});

// Toggle dropdown
document.querySelector(".Topbar-menu-btn").addEventListener("click", () => {
  dropdown.style.display =
    dropdown.style.display === "flex" ? "none" : "flex";
});