// redirect.js
// One file for department pages, 404.html & error.html.
// Edit only the config block below.

const config = {
  paramKey:   "from",
  errorPage:  "error.html",
  // false→all departments closed, true→use each section.open
  globalClose:false,
  sections: {
    game:  { rootURL: "https://camcookie876.github.io/game/",  open: false },
    music: { rootURL: "https://camcookie876.github.io/music/", open: true  },
    find:  { rootURL: "https://camcookie876.github.io/find/",  open: false }
  }
};

;(function(){
  const { paramKey, errorPage, globalClose, sections } = config;
  const me       = document.currentScript.src;
  const sectionKey = new URL(me).searchParams.get("web");
  const fullURL  = window.location.href;
  const url      = new URL(fullURL);
  const pageName = url.pathname.split("/").pop();
  const fromURL  = url.searchParams.get(paramKey) || "";

  // Utility: add two sliding doors to the page
  function injectDoors(initialLeftX, initialRightX, finalLeftX, finalRightX, onComplete){
    // lock scrolling & clicks
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.pointerEvents = 'none';

    const left = document.createElement('div');
    const right = document.createElement('div');

    Object.assign(left.style, {
      position: 'fixed', top: '0', left: '0',
      width: '50%', height: '100vh', background: '#222',
      transform: `translateX(${initialLeftX})`,
      transition: 'transform 1s ease-in-out',
      zIndex: '9999'
    });
    Object.assign(right.style, {
      position: 'fixed', top: '0', right: '0',
      width: '50%', height: '100vh', background: '#222',
      transform: `translateX(${initialRightX})`,
      transition: 'transform 1s ease-in-out',
      zIndex: '9999'
    });

    document.body.appendChild(left);
    document.body.appendChild(right);

    // trigger reflow then animate
    requestAnimationFrame(() => {
      left.style.transform = `translateX(${finalLeftX})`;
      right.style.transform = `translateX(${finalRightX})`;
    });

    setTimeout(() => {
      onComplete && onComplete();
    }, 1000);
  }

  // 1) Department pages: ?web=…
  if (sectionKey) {
    const sec = sections[sectionKey];
    if (!sec) return;

    // need to redirect?
    if (!globalClose || !sec.open) {
      // animate doors closing, then redirect
      const dest = new URL(errorPage, window.location.origin);
      dest.searchParams.set(paramKey, fullURL);

      injectDoors('-100%','100%','0','0', () => {
        window.location.replace(dest.toString());
      });
    }
    return;
  }

  // 2) Error page or 404.html
  if (pageName === errorPage || pageName === '404.html') {
    // run after DOM ready
    const runError = () => {
      const msgEl = document.getElementById('maintenance-message');
      let message = "Camcookie is under Maintenance.";
      let matched = null;

      // if globalClose==false, always generic
      if (globalClose) {
        // detect department
        for (let [name, sec] of Object.entries(sections)) {
          if (fromURL.startsWith(sec.rootURL)) {
            matched = name;
            const label = name[0].toUpperCase() + name.slice(1);
            message = `Camcookie ${label} is under maintenance.`;
            break;
          }
        }
      }
      if (msgEl) msgEl.textContent = message;

      // auto-return if section reopened *and* globalClose==true
      if (globalClose && matched && sections[matched].open) {
        window.location.replace(fromURL);
        return;
      }

      // animate doors opening to reveal content
      // doors start closed: transform(0), then open to offscreen
      injectDoors('0','0','-100%','100%', () => {
        // remove doors and re-enable scroll/click
        const doors = document.querySelectorAll('body > div[style*="position: fixed"]');
        doors.forEach(d => d.remove());
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        document.body.style.pointerEvents = '';
      });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runError);
    } else runError();
  }
  // 3) other pages → no action
})();