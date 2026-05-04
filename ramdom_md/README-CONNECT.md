# Camcookie Connect 26 - Complete System Documentation

## Overview

Camcookie Connect 26 is a comprehensive authentication and multi-app platform featuring chat, drawing, and storytelling applications. All apps share a unified authentication system with Supabase as the backend.

## What's Been Created

### Core Authentication System

#### 1. **supabase.sql** - Database Schema
- Complete Supabase database schema with RLS (Row Level Security)
- Tables: `users`, `chat_messages`, `drawings`, `stories`
- Functions for username validation and updates
- Performance indices for fast queries

**Location:** `/supabase.sql`

#### 2. **config.js** - Supabase Configuration
- Centralized configuration for Supabase credentials
- Single place to set project URL and anonymous key
- Initializes Supabase client

**Location:** `/connect/config.js`
**Setup:** Replace `YOUR_PROJECT_ID` and `YOUR_ANON_KEY` with your Supabase credentials

#### 3. **auth-manager.js** - Core Authentication Logic
Comprehensive authentication manager class providing:
- User registration with username validation
- Login/logout functionality
- Session restoration from localStorage
- Password and username change capability
- Profile image management (base64 encoding)
- Token storage and management
- Auth state listeners for UI updates

**Location:** `/connect/auth-manager.js`
**Key Methods:**
- `signup(email, password, username)` - Create new account
- `signin(email, password)` - Login user
- `signout()` - Logout user
- `changePassword(newPassword)` - Update password
- `changeUsername(newUsername)` - Change username
- `uploadProfileImage(imageBase64)` - Store profile picture
- `onAuthChange(callback)` - Subscribe to auth changes

#### 4. **app-init.js** - App Initialization Helper
Automatically sets up authentication for Connect 26 apps:
- Checks user authentication status
- Redirects unauthenticated users to login
- Creates fullscreen app layout
- Manages profile display in topbar
- Provides access to Supabase client

**Location:** `/connect/app-init.js`
**Usage in HTML:** Add `data-connect-app="appname"` attribute to `<body>`

### Frontend Pages

#### 5. **connect/index.html** - Main Authentication Hub
Full authentication UI featuring:
- Login form with email/password
- Signup form with username validation and passwordconfirmation
- Profile management settings
- Account settings (username, password, profile image)
- Connected apps showcase
- Responsive design with smooth animations

**Features:**
- Direct switching between login and signup forms
- Real-time username availability checking
- Profile image upload (max 2MB)
- Password and username change with validation
- Profile image display on topbar

#### 6. **DOCS/index.html** - Documentation Hub
Updated to use unified styles for consistency with rest of platform.

#### 7. **connect/26/chat/index.html** - Chat Application
Enhanced with:
- Authentication integration via `app-init.js`
- Fullscreen layout support
- User token available in localStorage
- Automatic profile display

#### 8. **connect/26/draw/index.html** - Drawing Application  
Enhanced with:
- Authentication integration
- Fullscreen layout
- Token management
- Profile integration

#### 9. **connect/26/books/index.html** - Books Application
Enhanced with:
- Authentication integration
- Fullscreen layout
- User sessions
- Profile support

### Styling System

#### 10. **styles-unified.css** - Unified Design System
Comprehensive stylesheet providing:
- Consistent color palette and variables
- Topbar with profile dropdown
- Form elements and buttons
- Card and section components
- Grid and layout utilities
- Modal dialogs
- File tree styling
- Responsive breakpoints
- Animation and transitions
- Utility classes

**Location:** `/styles-unified.css`
**Features:**
- 40+ CSS variables for easy customization
- Mobile-first responsive design
- Smooth animations and transitions
- Accessible form inputs
- Professional card designs

### Utilities

#### 11. **file-tree.js** - Interactive File Tree Component
Reusable component for displaying directory structures:
- Expandable/collapsible folders
- File icons and custom badges
- Click handlers for navigation
- Recursive rendering
- Expand all / Collapse all methods

**Location:** `/file-tree.js`

**Usage:**
```javascript
const tree = new FileTree('container-id', [
  { name: 'Folder', icon: '📁', children: [...] },
  { name: 'File.txt', icon: '📄', url: '/path' }
]);
```

#### 12. **topbar-utils.js** - Navigation Utilities
Provides topbar dropdown navigation and form utilities.

### Documentation

#### 13. **CONNECT_SETUP.md** - Setup Instructions
Step-by-step guide for configuring and using the system:
- Supabase credential setup
- SQL schema import instructions
- Authentication flow explanation
- Integration examples
- LocalStorage keys reference
- Troubleshooting guide

**Location:** `/CONNECT_SETUP.md`

#### 14. **INTEGRATION_INSTRUCTIONS.html** - Developer Guide
Detailed instructions for integrating authentication into apps:
- Script inclusion steps
- Data attribute usage
- JavaScript API reference
- Event listeners
- Token usage examples
- Profile management

**Location:** `/INTEGRATION_INSTRUCTIONS.html`

## System Architecture

```
User Browser
    ↓
    ├─ /connect/index.html (Login/Signup)
    │   ├─ auth-manager.js
    │   ├─ config.js
    │   └─ styles-unified.css
    │
    └─ /connect/26/{app}/index.html (App)
        ├─ app-init.js
        ├─ auth-manager.js
        └─ Supabase Client
            ↓
        Supabase Backend
            ├─ Auth Service
            ├─ Database (PostgreSQL)
            ├─ Row Level Security
            └─ Real-time Subscriptions (optional)
```

## LocalStorage Schema

When a user logs in, the following data is stored:

| Key | Value | Example |
|-----|-------|---------|
| `cc_token` | JWT Access Token | `eyJ...` |
| `cc_user_id` | User UUID | `550e8400-e29b-41d4-a716-446655440000` |
| `cc_username` | Display Username | `john_doe` |
| `cc_profile_image` | Base64 Image Data | `data:image/png;base64,...` |

## API Reference

### AuthManager Class

```javascript
const auth = getAuthManager();

// Authentication
auth.signup(email, password, username) → Promise<{user, error}>
auth.signin(email, password) → Promise<{user, error}>
auth.signout() → Promise<{error}>

// Profile Management
auth.changePassword(newPassword) → Promise<{error}>
auth.changeUsername(newUsername) → Promise<{error}>
auth.uploadProfileImage(base64) → Promise<{error}>
auth.fileToBase64(file) → Promise<string>

// Utilities
auth.isAuthenticated() → boolean
auth.getUser() → User|null
auth.getProfile() → Profile|null
auth.getUsername() → string
auth.getProfileImage() → string|null
auth.getToken() → string|null
auth.onAuthChange(callback) → void

// Session Management  
auth.restoreSession() → Promise<void>
auth.loadUserProfile() → Promise<Profile|null>
auth.clearSession() → void
```

### Connect26App Class

```javascript
const app = initConnect26App('appname', options);

app.getUser() → User|null
app.getProfile() → Profile|null
app.getSupabase() → SupabaseClient
app.showError(message) → void
```

## Security Considerations

1. **Row Level Security (RLS)**: All Supabase tables have RLS policies enabled
2. **Token Storage**: Access tokens stored in localStorage (vulnerable to XSS)
3. **Profile Images**: Stored as base64 in database (max 2MB recommended)
4. **Password Hashing**: Handled by Supabase Auth service
5. **Email Verification**: Can be enabled in Supabase settings

## File Locations Quick Reference

```
/
├── supabase.sql                          ← Database schema
├── styles-unified.css                    ← Global styles
├── file-tree.js                          ← File tree component
├── CONNECT_SETUP.md                      ← Setup guide
├── INTEGRATION_INSTRUCTIONS.html         ← Developer guide
│
└── /connect/
    ├── config.js                         ← Supabase config ★ EDIT THIS
    ├── auth-manager.js                   ← Auth logic
    ├── app-init.js                       ← App initialization
    ├── topbar-utils.js                   ← Topbar utilities
    ├── index.html                        ← Login/Signup page
    │
    └── /26/
        ├── index.html                    ← User dashboard
        ├── /chat/index.html              ← Chat app
        ├── /draw/index.html              ← Draw app
        └── /books/index.html             ← Books app
```

## Getting Started

### 1. Install Database Schema
```bash
Open /supabase.sql → Copy all content → Paste in Supabase SQL Editor → Run
```

### 2. Configure Supabase
```javascript
// Edit /connect/config.js
SUPABASE_CONFIG.url = 'https://YOUR_PROJECT.supabase.co'
SUPABASE_CONFIG.anonKey = 'YOUR_ANON_KEY'
```

### 3. Test Login
Visit `/connect/` and create a test account

### 4. Integrate into Apps
Add to app `<head>`:
```html
<script src="/connect/config.js"></script>
<script src="/connect/auth-manager.js"></script>
<script src="/connect/app-init.js"></script>
```

Add to app `<body>`:
```html
<body data-connect-app="appname" data-require-auth="true">
```

### 5. Use in App JavaScript
```javascript
window.addEventListener('app-ready', (event) => {
  const { user, profile } = event.detail;
  const token = localStorage.getItem('cc_token');
  // Your app initialization here
});
```

## Customization Guide

### Change Primary Color
Edit `styles-unified.css`:
```css
:root {
  --primary: #0f67ff;        ← Change this
  --primary-dark: #0a4cb8;   ← Change this
  /* ... */
}
```

### Change Logo/Branding
Edit topbar text in:
- `/connect/index.html`
- `/connect/26/index.html`

### Add Social Login
Implement in `auth-manager.js`:
```javascript
async socialLogin(provider) {
  // Use Supabase OAuth
}
```

### Custom Profile Fields
Extend `users` table schema in `supabase.sql`:
```sql
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN website VARCHAR(255);
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Supabase not loaded" | Ensure `<script src="...supabase-js@2"></script>` is in `<head>` |
| Token not storing | Check localStorage enabled; verify cookie settings |
| Profile image not showing | Max 2MB; must be valid data URL |
| Can't access app | Verify logged in status; check token in localStorage |
| CSS not loading | Clear browser cache; verify path to styles-unified.css |

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 14+)
- IE11: Not supported

## Performance Notes

- LocalStorage max ~5MB (test profile images size)
- Supabase REST API has rate limits
- Real-time subscriptions available for live features
- Consider CDN for static assets

## Future Enhancements

- [ ] Two-factor authentication
- [ ] Social login (Google, GitHub)
- [ ] Email verification
- [ ] Password reset flow
- [ ] User search/profiles
- [ ] Organization/team management
- [ ] Message encryption
- [ ] Push notifications
- [ ] Offline support

## Support & Resources

- **Supabase Docs:** https://supabase.com/docs
- **PostgreSQL Reference:** https://www.postgresql.org/docs/
- **MDN Web Docs:** https://developer.mozilla.org/

---

**Version:** 1.0.0  
**Last Updated:** 2026-05-04  
**Status:** Production Ready (Beta)
