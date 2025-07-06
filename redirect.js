// redirect.js
// One file for dept pages, 404.html & error.html.
// Edit only the config block.

const config = {
  paramKey:   "from",
  errorPage:  "error.html",
  globalClose:false,
  sections: {
    game:  { rootURL: "https://camcookie876.github.io/game/",  open: false },
    music: { rootURL: "https://camcookie876.github.io/music/", open: true  },
    find:  { rootURL: "https://camcookie876.github.io/find/",  open: false }
    // add more as needed
  }
};

(function(){
  function run() {
    const scripts    = document.getElementsByTagName('script');
    const me         = scripts[scripts.length - 1].src;
    const wsParam    = new URL(me).searchParams.get("web");
    const fullURL    = window.location.href;
    const url        = new URL(fullURL);
    const page       = url.pathname.split("/").pop();
    const orig       = url.searchParams.get(config.paramKey) || "";

    // 1) Department-page context
    if (wsParam) {
      const sec = config.sections[wsParam];
      if (!sec) return;
      if (!config.globalClose || !sec.open) {
        const dest = new URL(config.errorPage, window.location.origin);
        dest.searchParams.set(config.paramKey, fullURL);
        return window.location.replace(dest);
      }
      return;
    }

    // 2) Error or 404 context
    if (page === config.errorPage || page === "404.html") {
      const originalURL = orig || fullURL;

      // On 404, skip if not in any sec AND globalClose==true
      if (page === "404.html") {
        let inDept = false;
        for (let sec of Object.values(config.sections)) {
          if (originalURL.startsWith(sec.rootURL)) {
            inDept = true; break;
          }
        }
        if (!inDept && config.globalClose) return;
      }

      // Update maintenance-message
      const h = document.getElementById("maintenance-message");
      let msg = "Camcookie is under Maintenance.";
      let match = null;
      for (let [name, sec] of Object.entries(config.sections)) {
        if (originalURL.startsWith(sec.rootURL)) {
          match = name;
          const label = name[0].toUpperCase() + name.slice(1);
          msg = `Camcookie ${label} is under maintenance.`;
          break;
        }
      }
      if (h) h.textContent = msg;

      // Auto-return when maintenance ends (globalClose==true AND sec.open==true)
      if (config.globalClose && match && config.sections[match].open) {
        window.location.replace(originalURL);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else run();
})();