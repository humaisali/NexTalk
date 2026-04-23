const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  description: {
    type: String,
    default: '',
    maxlength: 200
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ],
  mood: {
    type: String,
    enum: ['positive', 'negative', 'neutral', 'tense', 'excited'],
    default: 'neutral'
  },
  moodScore: {
    type: Number,
    default: 50
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', RoomSchema);
