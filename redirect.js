//=======================================================
// redirect.js
// One file for all department pages, 404.html & error.html
// Edit only the config block below.
//=======================================================
const config = {
  // query-param key carrying the original full URL
  paramKey:    "from",

  // your shared error page (must live at this URL)
  errorPage:   "https://camcookie876.github.io/error.html",

  // false → EVERYTHING is closed (override)
  // true  → honor each section’s open flag
  globalClose: false,

  // define each department by its ?web key:
  // rootURL must include trailing slash!
  sections: {
    game:  { rootURL: "https://camcookie876.github.io/game/",  open: false },
    music: { rootURL: "https://camcookie876.github.io/music/", open: true  },
    find:  { rootURL: "https://camcookie876.github.io/find/",  open: false }
    // add more: blog, shop, docs, etc.
  }
};
//=======================================================

;(function(){
  const { paramKey, errorPage, globalClose, sections } = config;
  const scriptSrc = document.currentScript.src;
  const wsParam   = new URL(scriptSrc).searchParams.get("web");
  const fullURL   = window.location.href;
  const url       = new URL(fullURL);
  const pageName  = url.pathname.split("/").pop();
  const fromParam = url.searchParams.get(paramKey);

  // 1) Department-page context (?web=…)
  if (wsParam) {
    const section = sections[wsParam];
    if (!section) return;  // unrecognized section

    // if globalClose==false (all closed) OR this section.open==false
    if (!globalClose || !section.open) {
      const dest = new URL(errorPage, window.location.origin);
      dest.searchParams.set(paramKey, fullURL);
      window.location.replace(dest);
    }
    return;
  }

  // 2) 404 or shared error page context
  if (pageName === errorPage || pageName === "404.html") {
    // determine the original URL
    const originalURL = fromParam || fullURL;

    // on 404.html, if NOT from any section AND globalClose==true → do nothing
    if (pageName === "404.html") {
      let isDept = false;
      for (let sec of Object.values(sections)) {
        if (originalURL.startsWith(sec.rootURL)) {
          isDept = true;
          break;
        }
      }
      if (!isDept && globalClose) return;
    }

    // update the maintenance message
    const el = document.getElementById("maintenance-message");
    let message = "Camcookie is under Maintenance.";
    let matched = null;

    for (let [name, sec] of Object.entries(sections)) {
      if (originalURL.startsWith(sec.rootURL)) {
        matched = name;
        const label = name.charAt(0).toUpperCase() + name.slice(1);
        message = `Camcookie ${label} is under maintenance.`;
        break;
      }
    }
    if (el) el.textContent = message;

    // auto-return once maintenance ends:
    // only when globalClose==true AND this section.open==true
    if (
      globalClose &&
      matched !== null &&
      sections[matched].open
    ) {
      window.location.replace(originalURL);
    }
  }

  // 3) all other pages → no action
})();