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

  // inject neon doors & bouncing orb CSS
  const style = document.createElement("style");
  style.textContent = `
    @keyframes orb-pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.3); opacity: 0.7; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes orb-bounce {
      0% { transform: translateY(0); }
      50% { transform: translateY(-25px); }
      100% { transform: translateY(0); }
    }
    .door {
      position: fixed; top:0; width:50%; height:100vh;
      background: #000;
      box-shadow: inset 0 0 120px #0099ff, 0 0 30px #0099ff;
      border-left: none; border-right: none;
      border-top: none; border-bottom: none;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden; z-index: 9999;
      transition: transform 1s ease-in-out;
    }
    .door-left  { left:0; border-right: 4px solid #0099ff; }
    .door-right { right:0; border-left: 4px solid #0099ff; }
    .orb {
      width: 50px; height: 50px; border-radius: 50%;
      background: radial-gradient(circle, rgba(0,153,255,0.9), transparent);
      box-shadow: 0 0 40px #0099ff;
      animation: orb-pulse 2.5s infinite, orb-bounce 1.5s infinite ease-in-out;
      margin: 0 12px;
    }
  `;
  document.head.appendChild(style);

  function animateDoors(close, callback) {
    // lock scroll & clicks
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.pointerEvents = "none";

    const left  = document.createElement("div");
    const right = document.createElement("div");
    left.className  = "door door-left";
    right.className = "door door-right";

    // add orbs to each door
    for (let i = 0; i < 4; i++) {
      const o1 = document.createElement("div");
      const o2 = document.createElement("div");
      o1.className = o2.className = "orb";
      left.appendChild(o1);
      right.appendChild(o2);
    }

    document.body.appendChild(left);
    document.body.appendChild(right);

    // set initial transform
    if (close) {
      left.style.transform  = "translateX(-100%)";
      right.style.transform = "translateX(100%)";
    } else {
      left.style.transform  = "translateX(0)";
      right.style.transform = "translateX(0)";
    }

    // animate
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
        left.remove(); right.remove();
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

  // 2) error.html or 404.html: doors open to reveal message
  const errorName = new URL(errorPage).pathname.split("/").pop();
  if (pageName === errorName || pageName === "404.html") {
    // set message
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

    // auto-return when reopened
    if (globalClose && matched && sections[matched].open) {
      return window.location.replace(originalURL);
    }

    // open doors
    animateDoors(false);
  }

  // other pages: no action
})();
