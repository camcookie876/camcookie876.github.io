document.addEventListener("DOMContentLoaded", () => {

  //========================================
  // Inject CSS for custom menu + h1 links
  //========================================

  const style = document.createElement("style");
  style.textContent = `
    /* Right-click menu */
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

    /* Topbar H1 link styling */
    .Topbar-h1 {
      margin: 0 10px;
      padding: 0;
      font-size: 20px;
      display: inline-block;
    }

    .Topbar-h1 a {
      color: white;
      text-decoration: none;
    }
  `;
  document.head.appendChild(style);



  //========================================
  // Right Click Menu (JS‑only)
  //========================================

  const menu = document.createElement("div");
  menu.id = "customMenu";
  document.body.appendChild(menu);

  const menuItems = [
    { name: "Go Home", action: "home" },
    { name: "Camcookie", action: "camcookie" },
    { name: "Print", action: "print" }
  ];

  menuItems.forEach(item => {
    const div = document.createElement("div");
    div.className = "menu-item";
    div.dataset.action = item.action;
    div.textContent = item.name;
    menu.appendChild(div);
  });

  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    menu.style.left = e.pageX + "px";
    menu.style.top = e.pageY + "px";
    menu.style.display = "block";
  });

  document.addEventListener("click", () => {
    menu.style.display = "none";
  });

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
      setTimeout(() => window.print(), 500);
    }
  });



  //========================================
  // Topbar (JS‑only link injection)
  //========================================

  const mainLinks = [
    { name: "Home", url: "/" },
    { name: "Camcookie", url: "https://camcookie876.github.io/" },
    { name: "Books", url: "/books/" },
    { name: "Series", url: "/books/series/" },
    { name: "Authors", url: "/books/author/" },
    { name: "Github", url: "https://github.com/camcookieb/" }
  ];

  const linkContainer = document.querySelector(".Topbar-links");
  const dropdown = document.querySelector(".Topbar-dropdown");
  const menuBtn = document.querySelector(".Topbar-menu-btn");

  // DESKTOP LINKS — each link becomes its own <h1>
  if (linkContainer) {
    mainLinks.forEach(link => {
      const h1 = document.createElement("h1");
      h1.className = "Topbar-h1";

      const a = document.createElement("a");
      a.href = link.url;
      a.textContent = link.name;
      a.className = "Topbarlink";

      h1.appendChild(a);
      linkContainer.appendChild(h1);
    });
  }

  // MOBILE DROPDOWN
  if (dropdown) {
    mainLinks.forEach(link => {
      const a = document.createElement("a");
      a.href = link.url;
      a.textContent = link.name;
      dropdown.appendChild(a);
    });
  }

  // Hamburger toggle
  if (menuBtn && dropdown) {
    menuBtn.addEventListener("click", () => {
      dropdown.style.display =
        dropdown.style.display === "flex" ? "none" : "flex";
    });
  }

});