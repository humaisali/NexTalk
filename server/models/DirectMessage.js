const mongoose = require('mongoose');

const DirectMessageSchema = new mongoose.Schema({
  conversation: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Conversation',
    required: true,
    index:    true
  },
  sender: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true
  },
  content: {
    type: String,
    required:  false,
    maxlength: 5000
  },
  type: {
    type:    String,
    enum:    ['text', 'code', 'file', 'voice'],
    default: 'text'
  },
  language: {
    type:    String,
    default: ''
  },
  fileUrl:  { type: String },
  fileName: { type: String },
  fileType: { type: String },
  fileSize: { type: Number },
  deliveredTo: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ],
  readBy: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ],
  createdAt: { type: Date, default: Date.now }
});

// Index for fast conversation message queries, newest first
DirectMessageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model('DirectMessage', DirectMessageSchema);
