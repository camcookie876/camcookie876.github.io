document.addEventListener("DOMContentLoaded", () => {

  //===========================
  // Search
  //===========================
  const searchBtn = document.getElementById("searchBtn");
  const query = document.getElementById("searchBtn");

  if (searchBtn) {
    searchBtn.addEventListener("keypress", (e) => {
      if (e.key === "Enter") performSearch();
    });
  }

  // Find the search button next to searchBtn and add click handler
  const searchButton = document.querySelector(".search-button");
  if (searchButton) {
    searchButton.addEventListener("click", performSearch);
  }

  function performSearch() {
    const encoded = encodeURIComponent(query.value);
    if (encoded) {
      window.location.href = `https://camcookiem.github.io/archive/?q=${encoded}`;
    }
  }

  //===========================
  // Topbar Links
  //===========================
  const mainLinks = [
    { name: "Home", url: "https://camcookiem.github.io/" },
    { name: "Radio", url: "https://camcookiem.github.io/archive/v/" },
    { name: "Connect 26", url: "https://camcookie876.github.io/connect/" }
  ];

  const linkContainer = document.querySelector(".Topbar-links");
  const dropdown = document.querySelector(".Topbar-dropdown");
  const menuBtn = document.querySelector(".Topbar-menu-btn");

  // Desktop links
  if (linkContainer) {
    const h1 = document.createElement("h1");
    mainLinks.forEach((link, i) => {
      const a = document.createElement("a");
      a.href = link.url;
      a.textContent = link.name;
      a.className = "Topbarlink";
      h1.appendChild(a);
      if (i < mainLinks.length - 1) {
        const separator = document.createElement("span");
        separator.textContent = " | ";
        separator.style.margin = "0 8px";
        h1.appendChild(separator);
      }
    });
    linkContainer.appendChild(h1);
  }

  // Mobile dropdown
  if (dropdown) {
    mainLinks.forEach(link => {
      const a = document.createElement("a");
      a.href = link.url;
      a.textContent = link.name;
      dropdown.appendChild(a);
    });
  }

  // Toggle dropdown
  if (menuBtn && dropdown) {
    menuBtn.addEventListener("click", () => {
      dropdown.style.display = dropdown.style.display === "flex" ? "none" : "flex";
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".Topbar")) {
        dropdown.style.display = "none";
      }
    });
  }

});