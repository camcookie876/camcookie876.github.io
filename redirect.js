// redirect.js
// One file for department pages, 404.html & shared error.html.
// Edit only the config block below.

const config = {
  // query‐param for original URL
  paramKey:   "from",

  // full URL of your shared error page
  errorPage:  "https://camcookie876.github.io/error.html",

  // false → everything closed (override per‐section)
  // true  → honor each section’s open flag
  globalClose:false,

  // define each section by its ?web key:
  // rootURL needs the trailing slash
  sections: {
    game:  { rootURL: "https://camcookie876.github.io/game/",  open: false },
    music: { rootURL: "https://camcookie876.github.io/music/", open: true  },
    find:  { rootURL: "https://camcookie876.github.io/find/",  open: false }
  }
};

(function(){
  const { paramKey, errorPage, globalClose, sections } = config;
  const me         = document.currentScript.src;
  const sectionKey = new URL(me).searchParams.get("web");
  const fullURL    = window.location.href;
  const url        = new URL(fullURL);
  const pageName   = url.pathname.split("/").pop();
  const fromParam  = url.searchParams.get(paramKey) || "";

  // 1) Department pages: redirect if closed
  if (sectionKey) {
    const sec = sections[sectionKey];
    if (!sec) return;
    if (!globalClose || !sec.open) {
      const dest = new URL(errorPage);
      dest.searchParams.set(paramKey, fullURL);
      return window.location.replace(dest.toString());
    }
    return;
  }

  // 2) Error page or 404.html: show message & auto-return
  const errorName = new URL(errorPage).pathname.split("/").pop();
  if (pageName === errorName || pageName === "404.html") {
    const originalURL = fromParam || fullURL;
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

    // auto-return when that section reopens
    if (globalClose && matched && sections[matched].open) {
      window.location.replace(originalURL);
    }
  }
})();