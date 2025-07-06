// redirect.js
// One file for department pages & shared error page.
// Edit only the config block below.

const config = {
  paramKey:   "from",
  errorPage:  "error.html",
  globalClose:false,
  sections: {
    game:  { rootURL: "https://camcookie876.github.io/game/",  open: false },
    music: { rootURL: "https://camcookie876.github.io/music/", open: true  },
    find:  { rootURL: "https://camcookie876.github.io/find/",  open: false }
  }
};

;(function(){
  const { paramKey, errorPage, globalClose, sections } = config;
  const me         = document.currentScript.src;
  const wsParam    = new URL(me).searchParams.get("web");
  const fullURL    = window.location.href;
  const url        = new URL(fullURL);
  const pageName   = url.pathname.split("/").pop();
  const fromParam  = url.searchParams.get(paramKey) || "";

  // door animation with glow orbs
  function injectDoors(close, callback) {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.pointerEvents = 'none';

    const left  = document.createElement('div');
    const right = document.createElement('div');
    [left, right].forEach(d => {
      Object.assign(d.style, {
        position: 'fixed', top: 0, width: '50%', height: '100vh',
        background: '#111',
        boxShadow: 'inset 0 0 60px #0099ff',
        border: '2px solid #0099ff',
        zIndex: 9999,
        overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      });
      const orb = document.createElement('div');
      Object.assign(orb.style, {
        width: '60px', height: '60px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,153,255,0.8), transparent)',
        boxShadow: '0 0 20px #0099ff',
        animation: 'pulse 2s infinite'
      });
      d.appendChild(orb);
      document.body.appendChild(d);
    });

    Object.assign(left.style,  { left: close ? '0' : '-100%', transition:'transform 1s ease-in-out' });
    Object.assign(right.style, { right:'0', transform: close ? 'translateX(0)' : 'translateX(100%)', transition:'transform 1s ease-in-out' });

    // start closing or opening
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
        document.querySelectorAll('body > div[style*="box-shadow"]').forEach(d=>d.remove());
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        document.body.style.pointerEvents = '';
      }
      callback && callback();
    }, 1000);
  }

  // 1) department pages context
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

  // 2) error page context
  if (pageName === errorPage || pageName === '404.html') {
    const originalURL = fromParam || fullURL;
    const el = document.getElementById('maintenance-message');
    let msg = "Camcookie is under Maintenance.";
    let matched = null;

    if (globalClose) {
      for (let [name, sec] of Object.entries(sections)) {
        if (originalURL.startsWith(sec.rootURL)) {
          matched = name;
          const label = name.charAt(0).toUpperCase() + name.slice(1);
          msg = `Camcookie ${label} is under maintenance.`;
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