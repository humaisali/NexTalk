const mongoose = require('mongoose');

/**
 * Conversation — a private channel between exactly 2 users.
 * Identified by the pair of participant IDs (sorted, so order doesn't matter).
 */
const ConversationSchema = new mongoose.Schema({
  // Always exactly 2 participants — sorted for dedup lookup
  participants: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  ],

  // Snapshot of the last message for sidebar preview
  lastMessage: {
    content:   { type: String,  default: '' },
    sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type:      { type: String,  default: 'text' },
    createdAt: { type: Date,    default: null }
  },

  // Unread counts per user: { userId: count }
  unreadCount: {
    type: Map,
    of:   Number,
    default: {}
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for O(1) lookup by participant pair
ConversationSchema.index({ participants: 1 });

// Update timestamp on save
ConversationSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

/**
 * Static: find or create a conversation between two users.
 * Ensures only ONE conversation ever exists per pair.
 */
ConversationSchema.statics.findOrCreate = async function (userIdA, userIdB) {
  // Sort IDs so lookup is always consistent regardless of argument order
  const sorted = [userIdA.toString(), userIdB.toString()].sort();

  let conversation = await this.findOne({
    participants: { $all: sorted, $size: 2 }
  })
    .populate('participants', 'username avatar nexTalkNumber isOnline lastSeen bio statusText statusType')
    .populate('lastMessage.sender', 'username');

  if (!conversation) {
    conversation = await this.create({ participants: sorted });
    await conversation.populate('participants', 'username avatar nexTalkNumber isOnline lastSeen bio statusText statusType');
  }

  return conversation;
};

module.exports = mongoose.model('Conversation', ConversationSchema);
