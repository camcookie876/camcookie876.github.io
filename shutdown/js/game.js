const SHUTDOWN = "yes";  // <-- flip to "yes" / "no" when needed

if (SHUTDOWN === "yes") {
  if (!window.location.pathname.includes("https://camcookie876.github.io/shutdown/games/")) {
    window.location.href = "https://camcookie876.github.io/shutdown/games/";
  }
}