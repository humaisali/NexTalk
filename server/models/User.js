const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username:  { type: String, required: true, unique: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true },

  // ── NexTalk Number ──────────────────────────────────────────────
  // Format stored: "+1001234567" (11 chars, no space)
  // Format displayed: "+100 1234567"
  // Must be unique per user — this is the "WhatsApp number" of NexTalk
  nexTalkNumber: {
    type:     String,
    unique:   true,
    sparse:   true,        // allows null during migration
    trim:     true,
    match:    [/^\+100\d{7}$/, 'NexTalk number must be in format +100XXXXXXX']
  },

  avatar:    { type: String, default: '' },
  bio:        { type: String, default: '', maxlength: 250 },
  statusText: { type: String, default: '', maxlength: 80 },
  statusType: { type: String, enum: ['active', 'away', 'busy', 'dnd'], default: 'active' },
  language:  { type: String, default: 'en' },
  isOnline:  { type: Boolean, default: false },
  lastSeen:  { type: Date,   default: Date.now },
  pushSubscriptions: [
    {
      endpoint: { type: String, required: true },
      keys: {
        p256dh: { type: String, required: true },
        auth:   { type: String, required: true }
      }
    }
  ],
  tokenVersion: { type: Number, default: 0, select: false },
  createdAt: { type: Date,   default: Date.now }
});

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Strip password from JSON output
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.tokenVersion;
  return obj;
};

// Helper: format number for display "+100 1234567"
UserSchema.virtual('nexTalkNumberDisplay').get(function () {
  if (!this.nexTalkNumber) return null;
  return this.nexTalkNumber.replace(/^(\+100)(\d{7})$/, '$1 $2');
});


module.exports = mongoose.model('User', UserSchema);
