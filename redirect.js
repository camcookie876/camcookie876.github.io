// redirect.js
// One file for dept pages & shared error.html (and 404.html).
// Edit only the config block below.

const config = {
  paramKey:    "from",
  errorPage:   "https://camcookie876.github.io/error.html",
  globalClose: false,
  sections: {
    game:  { rootURL: "https://camcookie876.github.io/game/",  open: false },
    music: { rootURL: "https://camcookie876.github.io/music/", open: true  },
    find:  { rootURL: "https://camcookie876.github.io/find/",  open: false }
  }
};

;(function(){
  const { paramKey, errorPage, globalClose, sections } = config;
  const scriptSrc  = document.currentScript.src;
  const sectionKey = new URL(scriptSrc).searchParams.get("web");
  const fullURL    = window.location.href;
  const url        = new URL(fullURL);
  const pageName   = url.pathname.split("/").pop();
  const fromParam  = url.searchParams.get(paramKey) || "";

  // inject door + button styles
  const style = document.createElement("style");
  style.textContent = `
    .door {
      position: fixed;
      top: 0; width: 50%; height: 100vh;
      background: #111;
      box-shadow: inset 0 0 80px #0099ff, 0 0 20px rgba(0,153,255,0.5);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      align-items: center;
      transition: transform 1s ease-in-out;
    }
    .door-left  { left: 0;  transform: translateX(-100%); }
    .door-right { right: 0; transform: translateX(100%); }
    .door-button {
      width: 60px; height: 24px;
      background: linear-gradient(145deg, #33b5ff, #0088cc);
      border: 2px solid #005f99;
      border-radius: 4px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.4);
      cursor: default;
    }
  `;
  document.head.appendChild(style);

  function animateDoors(close, callback) {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.pointerEvents = "none";

    const left  = document.createElement("div");
    const right = document.createElement("div");
    left.className  = "door door-left";
    right.className = "door door-right";

    // add buttons to each door
    for (let i = 0; i < 3; i++) {
      left.appendChild(document.createElement("div")).className  = "door-button";
      right.appendChild(document.createElement("div")).className = "door-button";
    }

    document.body.appendChild(left);
    document.body.appendChild(right);

    // trigger slide
    requestAnimationFrame(() => {
      if (close) {
        left.style.transform  = "translateX(0)";
        right.style.transform = "translateX(0)";
      } else {
        left.style.transform  = "translateX(-100%)";
        right.style.transform = "translateX(100%)";
      }
    });

    setTimeout(() => {
      if (!close) {
        left.remove();
        right.remove();
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
        document.body.style.pointerEvents = "";
      }
      callback && callback();
    }, 1000);
  }

  // 1) Department pages: doors close then redirect
  if (sectionKey) {
    const sec = sections[sectionKey];
    if (!sec) return;
    if (!globalClose || !sec.open) {
      const dest = new URL(errorPage);
      dest.searchParams.set(paramKey, fullURL);
      animateDoors(true, () => window.location.replace(dest));
    }
    return;
  }

  // 2) Error page or 404.html: doors open to reveal message
  const errorName = new URL(errorPage).pathname.split("/").pop();
  if (pageName === errorName || pageName === "404.html") {
    const originalURL = fromParam || fullURL;
    const el = document.getElementById("maintenance-message");
    let msg = "Camcookie is under Maintenance.";
    let matched = null;
    if (globalClose) {
      for (let [name, sec] of Object.entries(sections)) {
        if (originalURL.startsWith(sec.rootURL)) {
          matched = name;
          msg = `Camcookie ${name.charAt(0).toUpperCase()+name.slice(1)} is under maintenance.`;
          break;
        }
      }
    }
    if (el) el.textContent = msg;

    if (globalClose && matched && sections[matched].open) {
      return window.location.replace(originalURL);
    }

    animateDoors(false);
  }
})();