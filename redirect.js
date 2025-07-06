// redirect.js
// One file for all department pages, 404.html & shared error.html.
// Edit only the config block below.

const config = {
  // query‐param key carrying the original full URL
  paramKey:    "from",

  // full URL of your shared error page
  errorPage:   "https://camcookie876.github.io/error.html",

  // false → EVERYTHING is closed (override per-section open flags)
  // true  → honor each section’s open flag
  globalClose: false,

  // define each department by its ?web key:
  // rootURL must include trailing slash!
  sections: {
    game:  { rootURL: "https://camcookie876.github.io/game/",  open: false },
    music: { rootURL: "https://camcookie876.github.io/music/", open: true  },
    find:  { rootURL: "https://camcookie876.github.io/find/",  open: false }
    // add more departments here...
  }
};

;(function(){
  const { paramKey, errorPage, globalClose, sections } = config;
  const scriptSrc    = document.currentScript.src;
  const sectionKey   = new URL(scriptSrc).searchParams.get("web");
  const fullURL      = window.location.href;
  const url          = new URL(fullURL);
  const pageName     = url.pathname.split("/").pop();
  const fromParam    = url.searchParams.get(paramKey) || "";

  // Inject styles for doors & glowing orbs
  const style = document.createElement("style");
  style.textContent = `
    @keyframes orb-pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.4); opacity: 0.7; }
      100% { transform: scale(1); opacity: 1; }
    }
    .door {
      position: fixed; top: 0; width: 50%; height: 100vh;
      background: #111;
      box-shadow: inset 0 0 80px #0099ff;
      border: 3px solid #0099ff;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden; z-index: 9999;
      transition: transform 1s ease-in-out;
    }
    .door-left  { left: 0; }
    .door-right { right: 0; }
    .orb {
      width: 50px; height: 50px; border-radius: 50%;
      background: radial-gradient(circle, rgba(0,153,255,0.8), transparent);
      box-shadow: 0 0 30px #0099ff;
      animation: orb-pulse 2s infinite;
      margin: 0 15px;
    }
  `;
  document.head.appendChild(style);

  // Animate doors: close=true closes, close=false opens
  function animateDoors(close, onComplete) {
    // lock scrolling & clicks
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.pointerEvents = "none";

    // create door elements
    const left  = document.createElement("div");
    const right = document.createElement("div");
    left.className  = "door door-left";
    right.className = "door door-right";

    // add orbs
    for (let i = 0; i < 3; i++) {
      const o1 = document.createElement("div");
      const o2 = document.createElement("div");
      o1.className = o2.className = "orb";
      left.appendChild(o1);
      right.appendChild(o2);
    }

    document.body.appendChild(left);
    document.body.appendChild(right);

    // set initial positions
    if (close) {
      left.style.transform  = "translateX(-100%)";
      right.style.transform = "translateX(100%)";
    } else {
      left.style.transform  = "translateX(0)";
      right.style.transform = "translateX(0)";
    }

    // trigger animation
    requestAnimationFrame(() => {
      if (close) {
        left.style.transform  = "translateX(0)";
        right.style.transform = "translateX(0)";
      } else {
        left.style.transform  = "translateX(-100%)";
        right.style.transform = "translateX(100%)";
      }
    });

    // cleanup or callback after animation
    setTimeout(() => {
      if (!close) {
        left.remove(); right.remove();
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
        document.body.style.pointerEvents = "";
      }
      onComplete && onComplete();
    }, 1000);
  }

  // 1) Department pages context: closing doors then redirect
  if (sectionKey) {
    const sec = sections[sectionKey];
    if (!sec) return;
    // redirect if globalClose==false OR this section is closed
    if (!globalClose || !sec.open) {
      const dest = new URL(errorPage);
      dest.searchParams.set(paramKey, fullURL);
      animateDoors(true, () => window.location.replace(dest));
    }
    return;
  }

  // 2) Error page or 404.html context: open doors to reveal content
  const errorName = new URL(errorPage).pathname.split("/").pop();
  if (pageName === errorName || pageName === "404.html") {
    // determine original URL
    const originalURL = fromParam || fullURL;

    // set maintenance message
    const el = document.getElementById("maintenance-message");
    let message = "Camcookie is under Maintenance.";
    let matched = null;
    if (globalClose) {
      for (let [name, sec] of Object.entries(sections)) {
        if (originalURL.startsWith(sec.rootURL)) {
          matched = name;
          const label = name.charAt(0).toUpperCase() + name.slice(1);
          message = `Camcookie ${label} is under maintenance.`;
          break;
        }
      }
    }
    if (el) el.textContent = message;

    // auto-return when section reopens (globalClose==true & sec.open)
    if (globalClose && matched && sections[matched].open) {
      return window.location.replace(originalURL);
    }

    // animate doors opening
    animateDoors(false);
  }

  // 3) all other pages: no action
})();