# Camcookie Connect 26 - Quick Reference Card

## 🔑 Supabase Configuration

**File:** `/connect/config.js`

```javascript
SUPABASE_CONFIG = {
  url: 'https://YOUR_PROJECT_ID.supabase.co',  // ← Your project URL
  anonKey: 'YOUR_ANON_KEY_HERE'                // ← Your anon key
}
```

---

## 🔐 Authentication in Apps

### Include Scripts

```html
<script src="/connect/config.js"></script>
<script src="/connect/auth-manager.js"></script>
<script src="/connect/app-init.js"></script>
```

### Add to Body Tag

```html
<body data-connect-app="chat" data-require-auth="true" data-fullscreen="true">
```

Change `"chat"` to `"draw"` or `"books"` as needed.

---

## 👤 Access User Info

### Get Auth Manager

```javascript
const auth = getAuthManager();
```

### Get Current User

```javascript
const user = auth.getUser();              // Supabase Auth user
const profile = auth.getProfile();        // User profile from DB
const username = auth.getUsername();      // Display name
const token = auth.getToken();            // API token
```

### Get Profile Image

```javascript
const profileImage = auth.getProfileImage();  // Base64 data URL
```

### From LocalStorage

```javascript
const token = localStorage.getItem('cc_token');
const userId = localStorage.getItem('cc_user_id');
const username = localStorage.getItem('cc_username');
const image = localStorage.getItem('cc_profile_image');
```

---

## 💻 Using Supabase Client

### Get Client

```javascript
const supabase = window.connect26App.getSupabase();
// OR
const supabase = getSupabase();
```

### Query Database

```javascript
// Get data
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', userId);

// Insert data
const { error } = await supabase
  .from('table_name')
  .insert([{ field: 'value', user_id: userId }]);

// Update data
const { error } = await supabase
  .from('table_name')
  .update({ field: 'new_value' })
  .eq('id', record_id);

// Delete data
const { error } = await supabase
  .from('table_name')
  .delete()
  .eq('id', record_id);
```

---

## 📡 API Requests with Token

### Fetch with Token

```javascript
const token = localStorage.getItem('cc_token');

fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ data: 'value' })
});
```

### With Supabase Client

```javascript
// Token is automatically handled
const { data, error } = await supabase
  .from('messages')
  .insert([{ content: 'Hello' }]);
```

---

## 🎨 CSS Variables (Styling)

### Primary Colors

```css
var(--primary)           /* #0f67ff (blue) */
var(--primary-dark)      /* #0a4cb8 */
var(--primary-light)     /* #3d84ff */
var(--primary-pale)      /* #f0f7ff */
```

### Text Colors

```css
var(--text-primary)      /* #111f3f */
var(--text-secondary)    /* #556984 */
var(--text-muted)        /* #8fa3b0 */
```

### Backgrounds

```css
var(--bg-base)           /* #f6f9ff */
var(--bg-white)          /* #ffffff */
var(--bg-light)          /* #f8fbff */
```

### Status Colors

```css
var(--success)           /* #16a34a (green) */
var(--danger)            /* #dc2626 (red) */
var(--warning)           /* #f59e0b (amber) */
var(--secondary)         /* #06b6d4 (cyan) */
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile first */
@media (max-width: 480px) { }   /* Mobile */
@media (max-width: 768px) { }   /* Tablet */
@media (max-width: 980px) { }   /* Small desktop */
```

---

## 🔄 Event Listeners

### App Ready

```javascript
window.addEventListener('app-ready', (event) => {
  const { app, user, profile } = event.detail;
  console.log(`${app} app loaded for:`, user.email);
  // Initialize your app here
});
```

### Auth Changes

```javascript
auth.onAuthChange((user, profile) => {
  if (user) {
    console.log('User logged in:', user.email);
  } else {
    console.log('User logged out');
  }
});
```

---

## 🛠️ Common Tasks

### Upload File as Base64

```javascript
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (e) => {
  const base64 = await auth.fileToBase64(e.target.files[0]);
  await auth.uploadProfileImage(base64);
});
```

### Create Avatar from Initial

```javascript
function createAvatar(username) {
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  
  const hue = username.charCodeAt(0) % 360;
  ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
  ctx.fillRect(0, 0, 100, 100);
  
  ctx.fillStyle = 'white';
  ctx.font = 'bold 40px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(username[0].toUpperCase(), 50, 50);
  
  return canvas.toDataURL();
}
```

### Check if Authenticated

```javascript
if (auth.isAuthenticated()) {
  // User is logged in
} else {
  window.location.href = '/connect/';
}
```

### Sign Out User

```javascript
await auth.signout();
// Redirects or shows login screen automatically
```

---

## 📊 Database Tables

### Users
```sql
id (UUID)                    -- Supabase user ID
username (VARCHAR)           -- Display name
profile_image_base64 (TEXT)  -- Avatar
created_at (TIMESTAMP)       -- Account creation
updated_at (TIMESTAMP)       -- Last update
```

### Chat Messages
```sql
id (UUID)                    -- Message ID
user_id (UUID)               -- Sender
content (TEXT)               -- Message body
created_at (TIMESTAMP)       -- Sent time
```

### Drawings
```sql
id (UUID)                    -- Drawing ID
user_id (UUID)               -- Creator
drawing_data (TEXT)          -- Canvas data
created_at (TIMESTAMP)       -- Created time
```

### Stories
```sql
id (UUID)                    -- Story ID
user_id (UUID)               -- Author
title (VARCHAR)              -- Story title
content (TEXT)               -- Story body
created_at (TIMESTAMP)       -- Created time
updated_at (TIMESTAMP)       -- Last edit
```

---

## 🔒 Security Tips

1. **Never expose keys** - Keep anonKey secret in production
2. **Use RLS policies** - All tables have row-level security
3. **Validate input** - Check data before sending to DB
4. **Handle errors** - Always check error responses
5. **Expire tokens** - Consider token refresh strategy
6. **Use HTTPS** - Always in production

---

## ❌ Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Supabase not loaded" | Missing CDN script | Add `<script src="...supabase-js@2"></script>` |
| `null` user | Not authenticated | Check `/connect/` login page |
| `undefined` token | Session expired | User needs to login again |
| Database error | RLS violation | Check row-level security policies |
| Image won't upload | File too large | Limit to max 2MB |

---

## 📚 File Paths

| Purpose | File |
|---------|------|
| Config Supabase | `/connect/config.js` |
| Auth Logic | `/connect/auth-manager.js` |
| App Setup | `/connect/app-init.js` |
| Global Styles | `/styles-unified.css` |
| Database Schema | `/supabase.sql` |
| Full Docs | `/README-CONNECT.md` |

---

## 🚀 Deployment

1. Set `SUPABASE_CONFIG` values
2. Run `supabase.sql` in dashboard
3. Test locally
4. Push to production
5. Update domain in Supabase settings

---

## 📞 Resources

- **Supabase Docs:** https://supabase.com/docs
- **JS Client Reference:** https://supabase.com/docs/reference/javascript/auth-signup
- **Row Level Security:** https://supabase.com/docs/guides/auth/row-level-security
- **Your Docs:** `/README-CONNECT.md`

---

**Quick Tip:** Bookmark this page for quick reference during development!

Version: 1.0.0 | Last Updated: 2026-05-04
