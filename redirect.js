// redirect.js
// One file for department pages & shared error.html (and 404.html).
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
  const scriptSrc   = document.currentScript.src;
  const sectionKey  = new URL(scriptSrc).searchParams.get("web");
  const fullURL     = window.location.href;
  const url         = new URL(fullURL);
  const pageName    = url.pathname.split("/").pop();
  const fromParam   = url.searchParams.get(paramKey) || "";

  // inject industrial-door & bounce CSS
  const style = document.createElement("style");
  style.textContent = `
    @keyframes door-close-left {
      0%   { transform: translateX(-100%); }
      70%  { transform: translateX(5%); }
      85%  { transform: translateX(-3%); }
      95%  { transform: translateX(2%); }
      100% { transform: translateX(0); }
    }
    @keyframes door-close-right {
      0%   { transform: translateX(100%); }
      70%  { transform: translateX(-5%); }
      85%  { transform: translateX(3%); }
      95%  { transform: translateX(-2%); }
      100% { transform: translateX(0); }
    }
    @keyframes door-open-left {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-100%); }
    }
    @keyframes door-open-right {
      0%   { transform: translateX(0); }
      100% { transform: translateX(100%); }
    }
    .door {
      position: fixed; top: 0; width: 50%; height: 100vh;
      background: #222;
      background-image:
        linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%),
        linear-gradient(-45deg, rgba(0,0,0,0.1) 25%, transparent 25%);
      background-size: 20px 20px;
      box-shadow: inset 0 0 120px #0099ff, 0 0 40px rgba(0,153,255,0.5);
      border-top: 6px solid #0099ff;
      border-bottom: 6px solid #0099ff;
      display: flex; align-items: center; justify-content: center;
      z-index: 9999; overflow: hidden;
    }
    .door-left  { left: 0;  transform: translateX(-100%); }
    .door-right { right: 0; transform: translateX(100%); }
    .door-logo {
      width: 160px; height: auto;
    }
    .door-logo img {
      width: 100%; height: auto; display: block;
    }
  `;
  document.head.appendChild(style);

  function animateDoors(close, callback) {
    // lock all interaction
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.pointerEvents = "none";

    const left  = document.createElement("div");
    const right = document.createElement("div");
    left.className  = "door door-left";
    right.className = "door door-right";

    // logo only
    [left, right].forEach(d => {
      const wrap = document.createElement("div");
      wrap.className = "door-logo";
      const img = document.createElement("img");
      img.src = "https://camcookie876.github.io/game/food-run/assets/images%20/camcookie-logo.gif";
      wrap.appendChild(img);
      d.appendChild(wrap);
    });

    document.body.appendChild(left);
    document.body.appendChild(right);

    // choose animation & duration
    if (close) {
      left.style.animation  = "door-close-left 1.6s ease-in-out forwards";
      right.style.animation = "door-close-right 1.6s ease-in-out forwards";
    } else {
      left.style.animation  = "door-open-left 1s ease-in-out forwards";
      right.style.animation = "door-open-right 1s ease-in-out forwards";
    }

    const duration = close ? 1600 : 1000;
    setTimeout(() => {
      if (!close) {
        left.remove(); right.remove();
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
        document.body.style.pointerEvents = "";
      }
      callback && callback();
    }, duration);
  }

  // 1) Dept pages: doors close then redirect
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

  // 2) error.html or 404.html: doors open then show content
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

    // auto-return
    if (globalClose && matched && sections[matched].open) {
      return window.location.replace(originalURL);
    }

    animateDoors(false);
  }
})();