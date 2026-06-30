document.addEventListener("DOMContentLoaded", () => {

  //========================================
  // Right Click Menu (JS‑only)
  //========================================

  // Inject CSS
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

  // Create menu container
  const menu = document.createElement("div");
  menu.id = "customMenu";
  document.body.appendChild(menu);

  // Menu items (easy to expand)
  const menuItems = [
    { name: "Go Home", action: "home" },
    { name: "Camcookie", action: "camcookie" },
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

  // Right‑click handler
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

  // Menu actions
  menu.addEventListener("click", (e) => {
    const action = e.target.dataset.action;
    if (!action) return;

    if (action === "home") {
      window.location.href = "/";
    }

    if (action === "camcookie") {
      window.location.href = "https://camcookie876.github.io/";
    }

    if (action === "print") {
      menu.style.display = "none";
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  });



  //========================================
  // Topbar (JS‑only link injection)
  //========================================

  const mainLinks = [
    { name: "Camcookie", url: "https://camcookie876.github.io/" },
    { name: "Home", url: "https://camcookieg.github.io/" },
    { name: "Games", url: "https://camcookieg.github.io/game/" },
    { name: "Spaces", url: "https://camcookieg.github.io/space/" },
    { name: "Github", url: "https://github.com/camcookieg/" }
  ];

  const linkContainer = document.querySelector(".Topbar-links");
  const dropdown = document.querySelector(".Topbar-dropdown");
  const menuBtn = document.querySelector(".Topbar-menu-btn");

  if (linkContainer) {
    const h1 = document.createElement("h1");

    mainLinks.forEach((link, i) => {
      const a = document.createElement("a");
      a.href = link.url;
      a.textContent = link.name;
      a.className = "Topbarlink";
      h1.appendChild(a);

      if (i < mainLinks.length - 1) {
        h1.append(" | ");
      }
    });

    linkContainer.appendChild(h1);
  }

  if (dropdown) {
    mainLinks.forEach(link => {
      const a = document.createElement("a");
      a.href = link.url;
      a.textContent = link.name;
      dropdown.appendChild(a);
    });
  }

  if (menuBtn && dropdown) {
    menuBtn.addEventListener("click", () => {
      dropdown.style.display =
        dropdown.style.display === "flex" ? "none" : "flex";
    });
  }

});

document.addEventListener("DOMContentLoaded", () => {
  const gameFrame = document.getElementById("gameFrame");
  const fullscreenBtn = document.getElementById("fullscreenBtn");

  fullscreenBtn.addEventListener("click", () => {
    if (gameFrame.requestFullscreen) {
      gameFrame.requestFullscreen();
    } else if (gameFrame.webkitRequestFullscreen) {
      gameFrame.webkitRequestFullscreen();
    } else if (gameFrame.msRequestFullscreen) {
      gameFrame.msRequestFullscreen();
    }
  });
});
