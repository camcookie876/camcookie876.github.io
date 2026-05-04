/**
 * Supabase Configuration
 * IMPORTANT: Update these values with your Supabase project credentials
 * Get these from: https://app.supabase.com/project/_/settings/api
 */

const SUPABASE_CONFIG = {
  // Your Supabase project URL - found in Settings > API
  url: 'https://YOUR_PROJECT_ID.supabase.co',
  
  // Your Supabase anonymous key - found in Settings > API
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};

// Initialize Supabase client (make sure supabase-js is loaded)
let supabaseClient = null;

function initSupabase() {
  if (supabaseClient) return supabaseClient;
  
  if (!window.supabase) {
    console.error('Supabase not loaded. Make sure to include <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
    return null;
  }
  
  supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  return supabaseClient;
}

// Get the Supabase client instance
function getSupabase() {
  if (!supabaseClient) {
    return initSupabase();
  }
  return supabaseClient;
}
