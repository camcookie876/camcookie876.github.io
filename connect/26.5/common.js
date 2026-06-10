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
  // build nav depending on session state
  (async ()=>{
    const token = localStorage.getItem('session_token') || null;
    let user = null;
    if (token) {
      const { data } = await supabaseClient.from('tokens').select('token,expires_at,user_id,users(username,photo)').eq('token', token).maybeSingle();
      if (data && new Date(data.expires_at) > new Date()) user = { id: data.user_id, username: data.users?.username, photo: data.users?.photo };
    }
    const nav = document.createElement('div');
    nav.style.display = 'flex'; nav.style.alignItems = 'center'; nav.style.gap='12px';

    const brand = document.createElement('div'); brand.className='brand'; brand.textContent='Camcookie Connect 26.5';
    topbar.innerHTML = '';
    topbar.appendChild(brand);

    const navEl = document.createElement('nav'); navEl.className='topbar-nav';
    // always show home
    navEl.innerHTML += `<a href="/connect/26.5/" class="${activePage==='home'?'active':''}">Home</a>`;
    if (user) {
      navEl.innerHTML += `<a href="/connect/26.5/dashboard/" class="${activePage==='dashboard'?'active':''}">Dashboard</a>`;
      navEl.innerHTML += `<a href="/connect/26.5/organizations/" class="${activePage==='organizations'?'active':''}">Organizations</a>`;
    }

    topbar.appendChild(navEl);

    const right = document.createElement('div'); right.style.marginLeft='auto'; right.style.display='flex'; right.style.alignItems='center'; right.style.gap='10px';

    if (!user) {
      // show login / signup buttons
      if (activePage !== 'login') right.innerHTML += `<a class="button" href="/connect/26.5/login/">Sign in</a>`;
      if (activePage !== 'signup') right.innerHTML += `<a class="button secondary" href="/connect/26.5/signup/">Create account</a>`;
    } else {
      // show user avatar, username, multi-session switcher
      const avatar = document.createElement('img'); avatar.src = user.photo || '/connect/26.5/default-avatar.png'; avatar.style.width='36px'; avatar.style.height='36px'; avatar.style.borderRadius='999px'; avatar.style.objectFit='cover';
      const name = document.createElement('div'); name.textContent = user.username || user.id; name.style.marginRight='8px'; name.style.color='white'; name.style.fontWeight='600';
      const logoutBtn = document.createElement('button'); logoutBtn.className='secondary'; logoutBtn.textContent='Logout';
      logoutBtn.onclick = async ()=>{ localStorage.removeItem('session_token'); window.location.href='/connect/26.5/login/'; };

      right.appendChild(avatar); right.appendChild(name); right.appendChild(logoutBtn);

      // multi-session quick switcher: list stored sessions in localStorage
      const sessions = JSON.parse(localStorage.getItem('cc_sessions')||'[]');
      if (sessions.length>1) {
        const sel = document.createElement('select');
        sessions.forEach((s,idx)=>{ const opt=document.createElement('option'); opt.value=idx; opt.textContent=s.username||s.id; sel.appendChild(opt); });
        sel.onchange = async ()=>{ const s = sessions[sel.value]; if(s?.token) { localStorage.setItem('session_token', s.token); showToast('Switched session'); window.location.reload(); }};
        right.appendChild(sel);
      }
    }

    topbar.appendChild(right);
  })();
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
