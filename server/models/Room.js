const mongoose = require('mongoose');
const { generateInviteCode } = require('../utils/inviteUtils');

const RoomSchema = new mongoose.Schema({
  name: {
    type: String, required: true, unique: true,
    trim: true, minlength: 2, maxlength: 50
  },
  description: { type: String, default: '', maxlength: 200 },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  members:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admins:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // ── Invite system ──────────────────────────────────────────────
  inviteCode: {
    type:    String,
    unique:  true,
    default: generateInviteCode
  },
  isPrivate: { type: Boolean, default: true },  // true = invite-only
  maxMembers: { type: Number, default: 200 },

  // ── Mood ───────────────────────────────────────────────────────
  mood:      { type: String, enum: ['positive','negative','neutral','tense','excited'], default: 'neutral' },
  moodScore: { type: Number, default: 50 },

  createdAt: { type: Date, default: Date.now }
});

// Index for fast invite-code lookups
RoomSchema.index({ inviteCode: 1 });

module.exports = mongoose.model('Room', RoomSchema);
