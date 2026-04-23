const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  type: {
    type: String,
    enum: ['text', 'code'],
    default: 'text'
  },
  language: {
    type: String,
    default: ''       // programming language for code messages (e.g. 'javascript')
  },
  tone: {
    type: String,
    enum: ['aggressive', 'neutral', 'friendly', ''],
    default: ''
  },
  toneScore: {
    type: Number,
    default: null
  },
  codeExplanation: {
    type: String,
    default: ''       // AI explanation for code blocks
  },
  translations: {
    type: Map,
    of: String,
    default: {}       // { 'ur': 'translated text', 'hi': '...' }
  },
  readBy: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ],
  createdAt: { type: Date, default: Date.now }
});

// Index for fast room message queries (newest first)
MessageSchema.index({ room: 1, createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);
