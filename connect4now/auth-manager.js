/**
 * Camcookie Connect 26 - Authentication Manager
 * Handles all user authentication, profile management, and session storage
 */

class AuthManager {
  constructor() {
    this.supabase = null;
    this.currentUser = null;
    this.userProfile = null;
    this.authListeners = [];
    this.init();
  }

  /**
   * Initialize the auth manager
   */
  async init() {
    this.supabase = getSupabase();
    if (!this.supabase) {
      console.error('Failed to initialize Supabase');
      return;
    }

    // Restore session from local storage
    this.restoreSession();

    // Set up auth state listener
    this.supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        this.currentUser = session.user;
        localStorage.setItem('cc_token', session.session?.access_token || '');
        localStorage.setItem('cc_user_id', session.user.id);
        this.loadUserProfile();
      } else {
        this.currentUser = null;
        this.userProfile = null;
        localStorage.removeItem('cc_token');
        localStorage.removeItem('cc_user_id');
        localStorage.removeItem('cc_username');
        localStorage.removeItem('cc_profile_image');
      }
      this.notifyListeners();
    });
  }

  /**
   * Restore session from local storage
   */
  async restoreSession() {
    const token = localStorage.getItem('cc_token');
    const userId = localStorage.getItem('cc_user_id');

    if (token && userId) {
      try {
        // Verify token is still valid by fetching user
        const { data: { user } } = await this.supabase.auth.getUser(token);
        if (user) {
          this.currentUser = user;
          await this.loadUserProfile();
          this.notifyListeners();
        } else {
          this.clearSession();
        }
      } catch (error) {
        console.warn('Session restore failed:', error);
        this.clearSession();
      }
    }
  }

  /**
   * Load user profile from database
   */
  async loadUserProfile() {
    if (!this.currentUser) return;

    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', this.currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      this.userProfile = data || null;
      
      if (this.userProfile) {
        localStorage.setItem('cc_username', this.userProfile.username);
        if (this.userProfile.photo) {
          localStorage.setItem('cc_profile_image', this.userProfile.photo);
        }
      }
      return this.userProfile;
    } catch (error) {
      console.error('Failed to load user profile:', error);
      return null;
    }
  }

  /**
   * Sign up new user
   */
  async signup(email, password, username) {
    try {
      // Check if username already exists
      const { data: existingUser } = await this.supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single();

      if (existingUser) {
        return { error: 'Username already taken' };
      }

      // Sign up with Supabase auth
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email,
        password
      });

      if (authError) {
        return { error: authError.message };
      }

      // Create user profile
      const { error: profileError } = await this.supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          username: username,
          photo: null
        }]);

      if (profileError) {
        return { error: profileError.message };
      }

      return { user: authData.user, error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Sign in user
   */
  async signin(email, password) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { error: error.message };
      }

      this.currentUser = data.user;
      const token = data.session?.access_token;

      localStorage.setItem('cc_token', token);
      localStorage.setItem('cc_user_id', data.user.id);

      await this.loadUserProfile();
      this.notifyListeners();

      return { user: data.user, error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Sign out user
   */
  async signout() {
    try {
      await this.supabase.auth.signOut();
      this.clearSession();
      this.notifyListeners();
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Change password
   */
  async changePassword(newPassword) {
    if (!this.currentUser) {
      return { error: 'Not authenticated' };
    }

    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Change username
   */
  async changeUsername(newUsername) {
    if (!this.currentUser || !this.userProfile) {
      return { error: 'Not authenticated' };
    }

    try {
      // Check if new username is already taken
      const { data: existingUser } = await this.supabase
        .from('users')
        .select('username')
        .eq('username', newUsername)
        .neq('id', this.currentUser.id)
        .single();

      if (existingUser) {
        return { error: 'Username already taken' };
      }

      // Update username
      const { error } = await this.supabase
        .from('users')
        .update({ username: newUsername })
        .eq('id', this.currentUser.id);

      if (error) {
        return { error: error.message };
      }

      this.userProfile.username = newUsername;
      localStorage.setItem('cc_username', newUsername);
      this.notifyListeners();

      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Upload profile image as base64
   */
  async uploadProfileImage(imageBase64) {
    if (!this.currentUser) {
      return { error: 'Not authenticated' };
    }

    try {
      const { error } = await this.supabase
        .from('users')
        .update({ photo: imageBase64 })
        .eq('id', this.currentUser.id);

      if (error) {
        return { error: error.message };
      }

      this.userProfile.photo = imageBase64;
      localStorage.setItem('cc_profile_image', imageBase64);
      this.notifyListeners();

      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Convert file to base64
   */
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Clear session
   */
  clearSession() {
    this.currentUser = null;
    this.userProfile = null;
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user_id');
    localStorage.removeItem('cc_username');
    localStorage.removeItem('cc_profile_image');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.currentUser;
  }

  /**
   * Get current user
   */
  getUser() {
    return this.currentUser;
  }

  /**
   * Get user profile
   */
  getProfile() {
    return this.userProfile;
  }

  /**
   * Get username from local storage (faster than loading profile)
   */
  getUsername() {
    return localStorage.getItem('cc_username') || 'User';
  }

  /**
   * Get profile image
   */
  getProfileImage() {
    return localStorage.getItem('cc_profile_image');
  }

  /**
   * Get auth token
   */
  getToken() {
    return localStorage.getItem('cc_token');
  }

  /**
   * Subscribe to auth changes
   */
  onAuthChange(callback) {
    this.authListeners.push(callback);
    // Call immediately with current state
    callback(this.currentUser, this.userProfile);
  }

  /**
   * Notify all listeners of auth changes
   */
  notifyListeners() {
    this.authListeners.forEach(callback => {
      callback(this.currentUser, this.userProfile);
    });
  }
}

// Global auth manager instance
let authManager = null;

function getAuthManager() {
  if (!authManager) {
    authManager = new AuthManager();
  }
  return authManager;
}

// Initialize on script load
document.addEventListener('DOMContentLoaded', () => {
  getAuthManager();
});
