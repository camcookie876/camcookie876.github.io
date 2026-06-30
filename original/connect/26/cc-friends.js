/**
 * Camcookie Connect 26 - Friends Management System
 * Handles friend invitations, friend lists, and friend interactions
 */

const CC_FRIENDS_STORAGE_KEY = 'cc_friends_data';

/**
 * Get all friends data (both friends and pending invitations)
 * @returns {object} Friends data structure
 */
function ccGetFriendsData() {
  try {
    const data = localStorage.getItem(CC_FRIENDS_STORAGE_KEY);
    return data ? JSON.parse(data) : { friends: {}, invitations: {}, pending: {} };
  } catch (e) {
    return { friends: {}, invitations: {}, pending: {} };
  }
}

/**
 * Save friends data to storage
 */
function ccSaveFriendsData(data) {
  localStorage.setItem(CC_FRIENDS_STORAGE_KEY, JSON.stringify(data));
}

/**
 * Get list of friend user IDs for current user
 * @param {string} userId - User ID
 * @returns {array} Array of friend user IDs
 */
function ccGetFriends(userId) {
  const data = ccGetFriendsData();
  return data.friends[userId] ? Object.keys(data.friends[userId]) : [];
}

/**
 * Get list of pending invitations sent by current user
 * @param {string} userId - User ID
 * @returns {array} Array of friend user IDs with pending invitations
 */
function ccGetPendingInvitations(userId) {
  const data = ccGetFriendsData();
  return data.pending[userId] ? Object.keys(data.pending[userId]) : [];
}

/**
 * Get list of incoming friend invitations for current user
 * @param {string} userId - User ID
 * @returns {array} Array of user IDs who invited this user
 */
function ccGetIncomingInvitations(userId) {
  const data = ccGetFriendsData();
  return data.invitations[userId] ? Object.keys(data.invitations[userId]) : [];
}

/**
 * Invite someone to be a friend
 * @param {string} currentUserId - Current user ID
 * @param {object} currentUser - Current user object {username, profile_photo}
 * @param {string} targetUserId - Target user ID to invite
 * @param {object} targetUser - Target user object {username, profile_photo}
 * @returns {boolean} Success
 */
function ccInviteFriend(currentUserId, currentUser, targetUserId, targetUser) {
  if (currentUserId === targetUserId) {
    console.warn('Cannot invite yourself');
    return false;
  }

  const data = ccGetFriendsData();

  // Check if already friends
  if (data.friends[currentUserId]?.[targetUserId]) {
    console.warn('Already friends');
    return false;
  }

  // Check if invitation already pending
  if (data.pending[currentUserId]?.[targetUserId]) {
    console.warn('Invitation already pending');
    return false;
  }

  // Create pending invitation
  if (!data.pending[currentUserId]) data.pending[currentUserId] = {};
  data.pending[currentUserId][targetUserId] = {
    username: targetUser.username || 'User',
    profile_photo: targetUser.profile_photo || '',
    timestamp: new Date().toISOString()
  };

  // Create incoming invitation for target user
  if (!data.invitations[targetUserId]) data.invitations[targetUserId] = {};
  data.invitations[targetUserId][currentUserId] = {
    username: currentUser.username || 'User',
    profile_photo: currentUser.profile_photo || '',
    timestamp: new Date().toISOString()
  };

  ccSaveFriendsData(data);
  return true;
}

/**
 * Accept a friend invitation
 * @param {string} currentUserId - Current user ID
 * @param {object} currentUser - Current user object
 * @param {string} inviterUserId - User ID who sent the invitation
 * @param {object} inviterUser - Inviter user object
 * @returns {boolean} Success
 */
function ccAcceptFriendInvitation(currentUserId, currentUser, inviterUserId, inviterUser) {
  const data = ccGetFriendsData();

  // Check if invitation exists
  if (!data.invitations[currentUserId]?.[inviterUserId]) {
    console.warn('Invitation not found');
    return false;
  }

  // Add as friends both ways
  if (!data.friends[currentUserId]) data.friends[currentUserId] = {};
  if (!data.friends[inviterUserId]) data.friends[inviterUserId] = {};

  data.friends[currentUserId][inviterUserId] = {
    username: inviterUser.username || 'User',
    profile_photo: inviterUser.profile_photo || '',
    timestamp: new Date().toISOString()
  };

  data.friends[inviterUserId][currentUserId] = {
    username: currentUser.username || 'User',
    profile_photo: currentUser.profile_photo || '',
    timestamp: new Date().toISOString()
  };

  // Remove invitation and pending
  delete data.invitations[currentUserId][inviterUserId];
  delete data.pending[inviterUserId]?.[currentUserId];

  ccSaveFriendsData(data);
  return true;
}

/**
 * Decline a friend invitation
 * @param {string} currentUserId - Current user ID
 * @param {string} inviterUserId - User ID who sent the invitation
 * @returns {boolean} Success
 */
function ccDeclineFriendInvitation(currentUserId, inviterUserId) {
  const data = ccGetFriendsData();

  // Check if invitation exists
  if (!data.invitations[currentUserId]?.[inviterUserId]) {
    console.warn('Invitation not found');
    return false;
  }

  // Remove invitation and pending
  delete data.invitations[currentUserId][inviterUserId];
  delete data.pending[inviterUserId]?.[currentUserId];

  ccSaveFriendsData(data);
  return true;
}

/**
 * Remove a friend
 * @param {string} currentUserId - Current user ID
 * @param {string} friendUserId - Friend user ID to remove
 * @returns {boolean} Success
 */
function ccRemoveFriend(currentUserId, friendUserId) {
  const data = ccGetFriendsData();

  if (!data.friends[currentUserId]?.[friendUserId]) {
    console.warn('Not friends');
    return false;
  }

  delete data.friends[currentUserId][friendUserId];
  delete data.friends[friendUserId]?.[currentUserId];

  ccSaveFriendsData(data);
  return true;
}

/**
 * Get friend count for user
 * @param {string} userId - User ID
 * @returns {number} Number of friends
 */
function ccGetFriendCount(userId) {
  return ccGetFriends(userId).length;
}

/**
 * Get detailed friend info
 * @param {string} userId - Current user ID
 * @returns {array} Array of friend objects with {id, username, profile_photo}
 */
function ccGetFriendsDetails(userId) {
  const friends = ccGetFriends(userId);
  const data = ccGetFriendsData();
  return friends.map(friendId => ({
    id: friendId,
    ...data.friends[userId][friendId]
  }));
}

/**
 * Check if two users are friends
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {boolean} Are they friends
 */
function ccAreFriends(userId1, userId2) {
  const data = ccGetFriendsData();
  return !!data.friends[userId1]?.[userId2];
}

/**
 * Search for a user by username
 * @param {string} query - Username to search for
 * @returns {array} Array of user objects (from localStorage, limited to friends list for now)
 */
function ccSearchUsers(query) {
  const data = ccGetFriendsData();
  const results = [];

  // Search through all known users in friends data
  for (let userId in data.friends) {
    for (let friendId in data.friends[userId]) {
      const friendData = data.friends[userId][friendId];
      if (friendData.username.toLowerCase().includes(query.toLowerCase())) {
        if (!results.find(r => r.id === friendId)) {
          results.push({ id: friendId, ...friendData });
        }
      }
    }
  }

  // Also search through invitations
  for (let userId in data.invitations) {
    for (let inviterId in data.invitations[userId]) {
      const inviterData = data.invitations[userId][inviterId];
      if (inviterData.username.toLowerCase().includes(query.toLowerCase())) {
        if (!results.find(r => r.id === inviterId)) {
          results.push({ id: inviterId, ...inviterData });
        }
      }
    }
  }

  return results;
}
