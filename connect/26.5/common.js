const SUPABASE_URL = "https://vkplvxyxvuqltbkmhnaf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrcGx2eHl4dnVxbHRia21obmFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNjYzMzAsImV4cCI6MjA5NjY0MjMzMH0.aTcx-dBtyI4x8OWFz9R-9JMvGBVa-58Q8Rh-0CdiFaA";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function $(id) {
  return document.getElementById(id);
}

function showToast(message, type = "info") {
  const toast = $("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(12px)";
  }, 2500);
}

function showError(element, message) {
  if (!element) return;
  element.textContent = message;
  element.className = message ? "status error" : "status";
}

function renderTopbar(activePage = "home") {
  const topbar = $("topbar");
  if (!topbar) return;

  const navItems = [
    { title: "Home", href: "/connect/26.5/", page: "home" },
    { title: "Dashboard", href: "/connect/26.5/dashboard/", page: "dashboard" },
    { title: "Organizations", href: "/connect/26.5/organizations/", page: "organizations" }
  ];

  topbar.innerHTML = `
    <div class="brand">Camcookie Connect 26.5</div>
    <nav class="topbar-nav">
      ${navItems.map(item => `<a href="${item.href}" class="${activePage === item.page ? "active" : ""}">${item.title}</a>`).join("")}
    </nav>
    <button id="logoutBtn" class="secondary">Logout</button>
  `;

  const logoutBtn = $("logoutBtn");
  if (logoutBtn) {
    if (activePage === "login" || activePage === "signup" || activePage === "home") {
      logoutBtn.style.display = "none";
    } else {
      logoutBtn.addEventListener("click", async () => {
        await supabaseClient.auth.signOut();
        window.location.href = "/connect/26.5/login/";
      });
    }
  }
}

async function getSessionUser() {
  const { data } = await supabaseClient.auth.getSession();
  return data?.session?.user || null;
}

async function requireAuth() {
  const user = await getSessionUser();
  if (!user) {
    window.location.href = "/connect/26.5/login/";
    return null;
  }
  return user;
}

function generateJoinCode() {
  return crypto.randomUUID().split("-")[0];
}
