/**
 * Camcookie Connect 26 - User Activity Tracking System
 * Tracks user activities when tracking is enabled
 */

const CC_TRACKING_STORAGE_KEY = 'cc_tracking_enabled';
const CC_TRACKING_DATA_KEY = 'cc_tracking_data';

/**
 * Check if tracking is enabled for current user
 * @param {string} userId - User ID
 * @returns {boolean} Is tracking enabled
 */
function ccIsTrackingEnabled(userId) {
  try {
    const settings = JSON.parse(localStorage.getItem('cc_user_settings') || '{}');
    return settings.tracking !== false; // Default to true
  } catch (e) {
    return true;
  }
}

/**
 * Set tracking preference
 * @param {string} userId - User ID
 * @param {boolean} enabled - Enable tracking
 */
function ccSetTrackingEnabled(userId, enabled) {
  try {
    const settings = JSON.parse(localStorage.getItem('cc_user_settings') || '{}');
    settings.tracking = enabled;
    localStorage.setItem('cc_user_settings', JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save tracking preference:', e);
  }
}

/**
 * Get tracking data for user
 * @param {string} userId - User ID
 * @returns {object} Tracking data with metrics
 */
function ccGetTrackingData(userId) {
  try {
    const key = `cc_tracking_${userId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : {
      visits: 0,
      active_time_ms: 0,
      chats: 0,
      friends: 0,
      actions: [],
      last_activity: null,
      created_at: new Date().toISOString()
    };
  } catch (e) {
    return {
      visits: 0,
      active_time_ms: 0,
      chats: 0,
      friends: 0,
      actions: [],
      last_activity: null,
      created_at: new Date().toISOString()
    };
  }
}

/**
 * Save tracking data
 * @param {string} userId - User ID
 * @param {object} data - Tracking data
 */
function ccSaveTrackingData(userId, data) {
  try {
    const key = `cc_tracking_${userId}`;
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save tracking data:', e);
  }
}

/**
 * Track a page visit
 * @param {string} userId - User ID
 * @param {string} page - Page name (e.g., 'dashboard', 'chat')
 */
function ccTrackPageVisit(userId, page) {
  if (!ccIsTrackingEnabled(userId)) return;

  const data = ccGetTrackingData(userId);
  data.visits = (data.visits || 0) + 1;
  data.last_activity = new Date().toISOString();

  // Track action
  data.actions.push({
    type: 'page_visit',
    page: page,
    timestamp: new Date().toISOString()
  });

  // Keep only last 100 actions
  if (data.actions.length > 100) {
    data.actions = data.actions.slice(-100);
  }

  ccSaveTrackingData(userId, data);
}

/**
 * Track active time on page
 * @param {string} userId - User ID
 * @param {number} milliseconds - Time spent in milliseconds
 */
function ccTrackActiveTime(userId, milliseconds) {
  if (!ccIsTrackingEnabled(userId)) return;

  const data = ccGetTrackingData(userId);
  data.active_time_ms = (data.active_time_ms || 0) + milliseconds;
  data.last_activity = new Date().toISOString();

  ccSaveTrackingData(userId, data);
}

/**
 * Track chat activity
 * @param {string} userId - User ID
 * @param {string} action - Action type (send, create, join)
 */
function ccTrackChatActivity(userId, action) {
  if (!ccIsTrackingEnabled(userId)) return;

  const data = ccGetTrackingData(userId);
  data.chats = (data.chats || 0) + 1;
  data.last_activity = new Date().toISOString();

  // Track action
  data.actions.push({
    type: 'chat_activity',
    action: action,
    timestamp: new Date().toISOString()
  });

  if (data.actions.length > 100) {
    data.actions = data.actions.slice(-100);
  }

  ccSaveTrackingData(userId, data);
}

/**
 * Track friend activity
 * @param {string} userId - User ID
 * @param {string} action - Action type (added, removed, invited)
 */
function ccTrackFriendActivity(userId, action) {
  if (!ccIsTrackingEnabled(userId)) return;

  const data = ccGetTrackingData(userId);
  data.friends = (data.friends || 0) + 1;
  data.last_activity = new Date().toISOString();

  // Track action
  data.actions.push({
    type: 'friend_activity',
    action: action,
    timestamp: new Date().toISOString()
  });

  if (data.actions.length > 100) {
    data.actions = data.actions.slice(-100);
  }

  ccSaveTrackingData(userId, data);
}

/**
 * Track custom event
 * @param {string} userId - User ID
 * @param {string} eventType - Event type
 * @param {object} eventData - Event data
 */
function ccTrackEvent(userId, eventType, eventData) {
  if (!ccIsTrackingEnabled(userId)) return;

  const data = ccGetTrackingData(userId);
  data.last_activity = new Date().toISOString();

  // Track action
  data.actions.push({
    type: eventType,
    data: eventData,
    timestamp: new Date().toISOString()
  });

  if (data.actions.length > 100) {
    data.actions = data.actions.slice(-100);
  }

  ccSaveTrackingData(userId, data);
}

/**
 * Calculate hours from milliseconds
 * @param {number} ms - Milliseconds
 * @returns {number} Hours
 */
function ccMsToHours(ms) {
  return Math.round((ms / 1000 / 60 / 60) * 100) / 100;
}

/**
 * Get tracking summary
 * @param {string} userId - User ID
 * @returns {object} Summary object
 */
function ccGetTrackingSummary(userId) {
  const data = ccGetTrackingData(userId);
  return {
    page_visits: data.visits || 0,
    active_hours: ccMsToHours(data.active_time_ms || 0),
    chat_activities: data.chats || 0,
    friend_activities: data.friends || 0,
    last_activity: data.last_activity,
    total_actions: data.actions ? data.actions.length : 0,
    tracking_enabled: ccIsTrackingEnabled(userId)
  };
}

/**
 * Clear all tracking data
 * @param {string} userId - User ID
 */
function ccClearTrackingData(userId) {
  try {
    const key = `cc_tracking_${userId}`;
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Failed to clear tracking data:', e);
  }
}

/**
 * Start session tracking (call on page load)
 * @param {string} userId - User ID
 * @param {string} pageName - Page name
 * @returns {object} Session tracker with stop function
 */
function ccStartSessionTracking(userId, pageName) {
  const sessionStart = Date.now();

  ccTrackPageVisit(userId, pageName);

  return {
    stop: function() {
      const sessionDuration = Date.now() - sessionStart;
      ccTrackActiveTime(userId, sessionDuration);
    }
  };
}
