const crypto = require('crypto');

/**
 * Generate a URL-safe invite code — 10 characters, alphanumeric.
 * Collision probability is negligible for typical scale.
 * Example: "aB3xK9mN2p"
 */
const generateInviteCode = () =>
  crypto.randomBytes(8).toString('base64url').slice(0, 10);

/**
 * Build the full invite URL for a room.
 * Uses CLIENT_ORIGIN env var so it works in both dev and production.
 */
const buildInviteUrl = (inviteCode) => {
  const base = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')[0]        // use first origin if multiple
    .trim()
    .replace(/\/$/, ''); // strip trailing slash
  return `${base}/join/${inviteCode}`;
};

module.exports = { generateInviteCode, buildInviteUrl };
