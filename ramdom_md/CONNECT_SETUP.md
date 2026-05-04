# Camcookie Connect 26 - Implementation Guide

## Configuration Setup

Before using the Connect 26 system, you must configure your Supabase credentials:

### Step 1: Update `connect/config.js`

Open `/connect/config.js` and replace the placeholder values:

```javascript
const SUPABASE_CONFIG = {
  url: 'https://YOUR_PROJECT_ID.supabase.co',
  anonKey: 'YOUR_ANON_KEY_HERE'
};
```

**Where to find these:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy your **Project URL** and **Anon Key**

### Step 2: Import SQL Schema

1. In Supabase, go to **SQL Editor**
2. Create a new query
3. Paste the contents of `/supabase.sql`
4. Click **Run**

## File Structure

```
/connect/
├── config.js              ← Configure Supabase here
├── auth-manager.js        ← Authentication logic
├── app-init.js            ← App initialization helper
├── topbar-utils.js        ← Topbar utilities
├── index.html             ← Main login/signup page
└── 26/
    ├── index.html         ← User dashboard
    ├── chat/
    │   └── index.html     ← Chat app (requires token)
    ├── draw/
    │   └── index.html     ← Drawing app (requires token)
    └── books/
        └── index.html     ← Books app (requires token)
```

## Authentication Flow

When a user logs in on `/connect/`:
1. Email/password validated against Supabase Auth
2. Access token stored in `localStorage` (key: `cc_token`)
3. User ID stored in `localStorage` (key: `cc_user_id`)
4. Username stored in `localStorage` (key: `cc_username`)
5. Profile image stored in `localStorage` (key: `cc_profile_image`)

## Integrating Auth into Apps

For chat, draw, and books pages:

### Add to `<head>`
```html
<script src="/connect/config.js"></script>
<script src="/connect/auth-manager.js"></script>
<script src="/connect/app-init.js"></script>
```

### Add to `<body>` element
```html
<body data-connect-app="chat" data-require-auth="true" data-fullscreen="true">
```

### Use in JavaScript
```javascript
// Access the authenticated user
const app = window.connect26App;
const user = app.getUser();
const profile = app.getProfile();
const supabase = app.getSupabase();

// Listen for app ready
window.addEventListener('app-ready', (e) => {
  console.log('App loaded:', e.detail);
});

// Access auth token
const token = localStorage.getItem('cc_token');

// Access username
const username = localStorage.getItem('cc_username');
```

## Fullscreen Layouts

The `app-init.js` automatically sets up fullscreen layouts when `data-fullscreen="true"`.

To use:
1. Make sure your main content is in a `<main>`, `#main`, `.content`, or `[role="main"]` element
2. Your topbar should have `id="topbar"`
3. The layout will automatically take 100% of screen height

## Profile Image Management

Profile images are stored as base64 in Supabase. When displayed:

```javascript
// Get profile image
const profileImage = localStorage.getItem('cc_profile_image');

// Create img element
const img = document.createElement('img');
img.src = profileImage || createInitialAvatar(username);
```

## LocalStorage Keys Reference

| Key | Purpose | Example |
|-----|---------|---------|
| `cc_token` | Access token for API requests | `eyJ...` |
| `cc_user_id` | User's Supabase UUID | `123e4567-e89b-12d3-a456-426614174000` |
| `cc_username` | Username | `john_doe` |
| `cc_profile_image` | Base64 encoded profile image | `data:image/png;base64,...` |

## Using Supabase Client

Get the Supabase client instance:

```javascript
const supabase = getSupabase();

// Example: Query chat messages
const { data, error } = await supabase
  .from('chat_messages')
  .select('*')
  .order('created_at', { ascending: true });
```

## Important Notes

1. **Token Expiry**: Tokens are stored and should be refreshed periodically
2. **Base64 Images**: Max 2MB each to stay within localStorage limits
3. **RLS Policies**: All tables have Row Level Security enabled
4. **Offline Support**: Apps can access cached data from localStorage

## Testing

1. Go to `/connect/`
2. Create a test account
3. Verify token is stored in localStorage
4. Navigate to `/connect/26/chat/`
5. Check that you can access the app

## Troubleshooting

**Auth not working?**
- Verify `config.js` has correct Supabase URL and anon key
- Check browser console for errors
- Ensure cookies are enabled

**Profile image not showing?**
- Max 2MB file size
- Must be JPG or PNG
- Base64 encoding must succeed

**Can't access app?**
- Check that token exists in localStorage
- Verify you're logged in at `/connect/`
- Check browser console for auth errors

## Support

For issues with Supabase, visit: https://supabase.com/docs
