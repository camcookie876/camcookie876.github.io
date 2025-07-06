//=======================================================
// Redirect & Auto-Return Script (one file for all pages)
// Edit only the config block below.
//=======================================================
const config = {
  // query-param key to carry the original full URL
  paramKey:   "from",

  // the single shared error page filename
  errorPage:  "https://camcookie876.github.io/error.html",

  // if true, *all* departments are closed
  globalClose:false,

  // define each department:
  //   key: {
  //     rootURL: full URL prefix for that section,
  //     open:    true→allow live pages, false→send to error
  //   }
  sections: {
    games: { rootURL: "https://camcookie876.github.io/game", open: false },
    music: { rootURL: "https://camcookie876.github.io/music", open: true  },
    find:  { rootURL: "https://camcookie876.github.io/find",  open: false }
    // add more: blog, shop, docs, etc.
  }
};
//=======================================================

;(function(){
  const { paramKey, errorPage, globalClose, sections } = config;
  const scriptSrc = document.currentScript.src;
  const wsParam   = new URL(scriptSrc).searchParams.get("web");
  const pageURL   = window.location.href;
  const url       = new URL(pageURL);
  const pageName  = url.pathname.split("/").pop();
  const fromURL   = url.searchParams.get(paramKey) || "";

  // 1) DEPARTMENT-PAGE CONTEXT (we have ?web=…)
  if (wsParam) {
    const section = sections[wsParam];
    if (!section) return; // unknown section → do nothing

    // if globalClose OR this section is closed → redirect to error
    if (globalClose || !section.open) {
      const dest = new URL(errorPage, window.location.origin);
      dest.searchParams.set(paramKey, pageURL);
      window.location.replace(dest);
    }
    return;
  }

  // 2) ERROR-PAGE CONTEXT (no ?web, and on errorPage)
  if (pageName === config.errorPage) {
    // 2a) Show tailored message
    const el = document.getElementById("maintenance-message");
    let message = "Camcookie is under Maintenance.";
    let matched = null;

    for (let [name, sec] of Object.entries(sections)) {
      if (fromURL.startsWith(sec.rootURL)) {
        matched = name;
        const label = name.charAt(0).toUpperCase() + name.slice(1);
        message = `Camcookie ${label} is under maintenance.`;
        break;
      }
    }
    if (el) el.textContent = message;

    // 2b) Auto-return if maintenance ended
    const shouldReturn = 
      !globalClose &&
      matched &&
      sections[matched].open;

    if (shouldReturn) {
      window.location.replace(fromURL);
    }
  }

  // 3) OTHER PAGES (no action)
})();