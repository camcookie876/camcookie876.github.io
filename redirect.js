// redirect.js
// One file for department pages & shared error page.
// Edit only the config block below.

const config = {
  paramKey:   "from",
  errorPage:  "error.html",
  // false → EVERYTHING closed, true → respect each section.open
  globalClose: false,
  sections: {
    game:  { rootURL: "https://camcookie876.github.io/game/",  open: false },
    music: { rootURL: "https://camcookie876.github.io/music/", open: true  },
    find:  { rootURL: "https://camcookie876.github.io/find/",  open: false }
  }
};

;(function(){
  const { paramKey, errorPage, globalClose, sections } = config;
  const me        = document.currentScript.src;
  const wsParam   = new URL(me).searchParams.get("web");
  const fullURL   = window.location.href;
  const url       = new URL(fullURL);
  const pageName  = url.pathname.split("/").pop();
  const fromParam = url.searchParams.get(paramKey) || "";

  // inject CSS keyframes for orb glow & door styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes orb-pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.3); opacity: 0.7; }
      100% { transform: scale(1); opacity: 1; }
    }
    .door { position:fixed; top:0; width:50%; height:100vh;
      background:#111; box-shadow: inset 0 0 60px #0099ff;
      border:2px solid #0099ff; overflow:hidden; z-index:9999;
      display:flex; align-items:center; justify-content:center;
      transition: transform 1s ease-in-out;
    }
    .door-left { left:0; transform: translateX(-100%); }
    .door-right{ right:0; transform: translateX(100%); }
    .orb { width:60px; height:60px; border-radius:50%;
      background: radial-gradient(circle, rgba(0,153,255,0.8), transparent);
      box-shadow: 0 0 30px #0099ff; animation: orb-pulse 2s infinite;
    }
  `;
  document.head.appendChild(style);

  function injectDoors(close, onComplete) {
    // lock scroll & clicks
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.pointerEvents = 'none';

    const left = document.createElement('div');
    const right = document.createElement('div');
    left.className  = 'door door-left';
    right.className = 'door door-right';

    // add orbs randomly inside doors
    for (let i = 0; i < 3; i++) {
      const orb1 = document.createElement('div');
      const orb2 = document.createElement('div');
      orb1.className = orb2.className = 'orb';
      // random position
      orb1.style.margin = `${Math.random()*40+10}%`;
      orb2.style.margin = `${Math.random()*40+10}%`;
      left.appendChild(orb1);
      right.appendChild(orb2);
    }

    document.body.appendChild(left);
    document.body.appendChild(right);

    // trigger animation
    requestAnimationFrame(() => {
      if (close) {
        left.style.transform  = 'translateX(0)';
        right.style.transform = 'translateX(0)';
      } else {
        left.style.transform  = 'translateX(-100%)';
        right.style.transform = 'translateX(100%)';
      }
    });

    setTimeout(() => {
      if (!close) {
        left.remove(); right.remove();
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        document.body.style.pointerEvents = '';
      }
      onComplete && onComplete();
    }, 1000);
  }

  // 1) department page context
  if (wsParam) {
    const sec = sections[wsParam];
    if (!sec) return;
    if (!globalClose || !sec.open) {
      const dest = new URL(errorPage, window.location.origin);
      dest.searchParams.set(paramKey, fullURL);
      injectDoors(true, () => window.location.replace(dest));
    }
    return;
  }

  // 2) error or 404 context
  if (pageName === errorPage || pageName === '404.html') {
    const originalURL = fromParam || fullURL;
    const el = document.getElementById('maintenance-message');
    let msg = "Camcookie is under Maintenance.";
    let matched = null;

    if (globalClose) {
      for (let [name, sec] of Object.entries(sections)) {
        if (originalURL.startsWith(sec.rootURL)) {
          matched = name;
          msg = `Camcookie ${name.charAt(0).toUpperCase() + name.slice(1)} is under maintenance.`;
          break;
        }
      }
    }
    if (el) el.textContent = msg;

    // auto-return when reopened
    if (globalClose && matched && sections[matched].open) {
      window.location.replace(originalURL);
      return;
    }

    // animate doors opening
    injectDoors(false);
  }
})();