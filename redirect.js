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

  // inject door & bounce CSS
  const style = document.createElement("style");
  style.textContent = `
    @keyframes door-close-left {
      0%   { transform: translateX(-100%); }
      80%  { transform: translateX(0); }
      90%  { transform: translateX(-5%); }
      100% { transform: translateX(0); }
    }
    @keyframes door-close-right {
      0%   { transform: translateX(100%); }
      80%  { transform: translateX(0); }
      90%  { transform: translateX(5%); }
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
      position: fixed; top:0; width:50%; height:100vh;
      background: #222;
      background-image:
        linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%),
        linear-gradient(-45deg, rgba(0,0,0,0.1) 25%, transparent 25%);
      background-size: 20px 20px;
      box-shadow: inset 0 0 100px #0099ff, 0 0 30px rgba(0,153,255,0.4);
      border-top: 4px solid #0099ff;
      border-bottom: 4px solid #0099ff;
      display: flex; flex-direction: column;
      align-items: center; padding-top: 2rem;
      z-index: 9999;
    }
    .door-left  { left:0;  transform: translateX(-100%); }
    .door-right { right:0; transform: translateX(100%); }
    .door-logo {
      width: 140px; margin-bottom: 1rem;
    }
    .door-logo img {
      width: 100%; display: block;
    }
    .door-title {
      color: #0099ff;
      font-family: sans-serif;
      font-size: 1.2rem;
      text-shadow: 0 0 8px #0099ff;
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

    // logo + title
    [left, right].forEach(d => {
      const logoWrap = document.createElement("div");
      logoWrap.className = "door-logo";
      const img = document.createElement("img");
      img.src = "https://camcookie876.github.io/game/food-run/assets/images%20/camcookie-logo.gif";
      logoWrap.appendChild(img);
      d.appendChild(logoWrap);

      const title = document.createElement("div");
      title.className = "door-title";
      title.textContent = "Camcookie";
      d.appendChild(title);
    });

    document.body.appendChild(left);
    document.body.appendChild(right);

    // apply animations
    if (close) {
      left.style.animation  = "door-close-left 1s forwards";
      right.style.animation = "door-close-right 1s forwards";
    } else {
      left.style.animation  = "door-open-left 1s forwards";
      right.style.animation = "door-open-right 1s forwards";
    }

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

  // 2) error.html or 404.html: doors open to reveal content
  const errorName = new URL(errorPage).pathname.split("/").pop();
  if (pageName === errorName || pageName === "404.html") {
    // update maintenance message
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
})();