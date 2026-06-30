/**
 * Camcookie Connect 26 - Usage Scoring & Leaderboard Service
 * Implements balanced scoring system:
 * - Friends Count (30%)
 * - Active Time (20%)
 * - Chats Joined (30%)
 * - General Activity (20%)
 */

const CC_SCORING_CONFIG = {
  weights: {
    friends: 0.30,
    activeTime: 0.20,
    chats: 0.30,
    activity: 0.20
  },
  // Max values for normalization (scores scale 0-1)
  maxValues: {
    friends: 100,
    activeTime: 1000,  // hours
    chatsPerWeek: 50,
    activity: 500      // page visits/interactions
  }
};

/**
 * Calculate balanced usage score
 * @param {Object} userInfo - User info from public.users.info
 * @returns {number} Total score (0-1000)
 */
function ccCalculateUsageScore(userInfo) {
  if (!userInfo) return 0;

  // Get values with defaults
  const friends = Math.min(userInfo.friends || 0, CC_SCORING_CONFIG.maxValues.friends);
  const activeTime = Math.min(userInfo.active_time || 0, CC_SCORING_CONFIG.maxValues.activeTime);
  const chatsPerWeek = Math.min(userInfo.chats_per_week || 0, CC_SCORING_CONFIG.maxValues.chatsPerWeek);
  const activity = Math.min(userInfo.general_activity || 0, CC_SCORING_CONFIG.maxValues.activity);

  // Normalize to 0-1
  const friendsScore = friends / CC_SCORING_CONFIG.maxValues.friends;
  const activeTimeScore = activeTime / CC_SCORING_CONFIG.maxValues.activeTime;
  const chatsScore = chatsPerWeek / CC_SCORING_CONFIG.maxValues.chatsPerWeek;
  const activityScore = activity / CC_SCORING_CONFIG.maxValues.activity;

  // Apply weights and scale to 0-1000
  const totalScore = (
    friendsScore * CC_SCORING_CONFIG.weights.friends +
    activeTimeScore * CC_SCORING_CONFIG.weights.activeTime +
    chatsScore * CC_SCORING_CONFIG.weights.chats +
    activityScore * CC_SCORING_CONFIG.weights.activity
  ) * 1000;

  return Math.round(totalScore);
}

/**
 * Calculate individual component scores
 * @param {Object} userInfo - User info from public.users.info
 * @returns {Object} Component scores
 */
function ccCalculateComponentScores(userInfo) {
  if (!userInfo) {
    return {
      friends_score: 0,
      active_time_score: 0,
      chat_score: 0,
      activity_score: 0
    };
  }

  const friends = Math.min(userInfo.friends || 0, CC_SCORING_CONFIG.maxValues.friends);
  const activeTime = Math.min(userInfo.active_time || 0, CC_SCORING_CONFIG.maxValues.activeTime);
  const chatsPerWeek = Math.min(userInfo.chats_per_week || 0, CC_SCORING_CONFIG.maxValues.chatsPerWeek);
  const activity = Math.min(userInfo.general_activity || 0, CC_SCORING_CONFIG.maxValues.activity);

  return {
    friends_score: Math.round((friends / CC_SCORING_CONFIG.maxValues.friends) * 1000 * CC_SCORING_CONFIG.weights.friends),
    active_time_score: Math.round((activeTime / CC_SCORING_CONFIG.maxValues.activeTime) * 1000 * CC_SCORING_CONFIG.weights.activeTime),
    chat_score: Math.round((chatsPerWeek / CC_SCORING_CONFIG.maxValues.chatsPerWeek) * 1000 * CC_SCORING_CONFIG.weights.chats),
    activity_score: Math.round((activity / CC_SCORING_CONFIG.maxValues.activity) * 1000 * CC_SCORING_CONFIG.weights.activity)
  };
}

/**
 * Format score for display
 * @param {number} score - Score value
 * @returns {string} Formatted score
 */
function ccFormatScore(score) {
  return Math.round(score).toLocaleString();
}

/**
 * Get rank badge (#1, #2, #3) or empty
 * @param {number} rank - User rank
 * @returns {string} Rank badge text
 */
function ccGetRankBadge(rank) {
  if (rank === 1) return '#1 ⭐';
  if (rank === 2) return '#2 🥈';
  if (rank === 3) return '#3 🥉';
  return '';
}

/**
 * Increment user activity metric
 * Used to update usage data when user performs actions
 * @param {string} userId - User ID
 * @param {string} metric - 'active_time', 'chats_per_week', 'general_activity'
 * @param {number} value - Value to add
 */
function ccIncrementActivity(userId, metric, value = 1) {
  // TODO: Implement Supabase update
  // UPDATE public.users
  // SET info = jsonb_set(info, '{METRIC}', COALESCE(info->METRIC, '0')::int + VALUE)
  // WHERE id = USER_ID
}

/**
 * Check if user participates in scoring/leaderboard
 * @param {Object} userInfo - User info from public.users.info
 * @returns {Object} {participate_usage, participate_leaderboard}
 */
function ccGetPrivacySettings(userInfo) {
  return {
    participate_usage: userInfo?.participate_usage !== false,
    participate_leaderboard: userInfo?.participate_leaderboard !== false
  };
}

/**
 * Calculate decaying score (score drops naturally if inactive)
 * Days inactive = Math.floor((Date.now() - lastActiveTime) / (1000 * 60 * 60 * 24))
 * @param {number} score - Current score
 * @param {number} daysInactive - Days since last activity
 * @returns {number} Adjusted score
 */
function ccApplyInactivityDecay(score, daysInactive) {
  const decayPerDay = 0.5; // 0.5% decay per day
  const decayFactor = Math.pow(1 - (decayPerDay / 100), daysInactive);
  return Math.round(score * decayFactor);
}
