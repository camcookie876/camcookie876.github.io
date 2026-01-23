const SHUTDOWN = "no";  // <-- flip to "yes" / "no" when needed

if (SHUTDOWN === "yes") {
  if (!window.location.pathname.includes("https://camcookie876.github.io/shutdown/chat/")) {
    window.location.href = "https://camcookie876.github.io/shutdown/chat/";
  }
}