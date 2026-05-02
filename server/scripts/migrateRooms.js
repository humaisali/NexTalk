/**
 * Run once to backfill inviteCode on all existing Room documents.
 * Usage: node server/scripts/migrateRooms.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { generateInviteCode } = require('../utils/inviteUtils');

const RoomSchema = new mongoose.Schema({
  name:        String,
  inviteCode:  String,
  members:     [mongoose.Schema.Types.ObjectId],
  isPrivate:   { type: Boolean, default: true },
  admins:      [mongoose.Schema.Types.ObjectId],
  createdBy:   mongoose.Schema.Types.ObjectId
}, { strict: false });

const Room = mongoose.model('Room', RoomSchema);

const migrate = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const rooms = await Room.find({ inviteCode: { $exists: false } });
  console.log(`Found ${rooms.length} rooms without inviteCode`);

  for (const room of rooms) {
    let code;
    let attempts = 0;
    // Ensure uniqueness
    do {
      code = generateInviteCode();
      attempts++;
    } while (await Room.findOne({ inviteCode: code }) && attempts < 10);

    await Room.findByIdAndUpdate(room._id, {
      $set: {
        inviteCode: code,
        isPrivate:  true,
        admins:     room.createdBy ? [room.createdBy] : [],
      }
    });
    console.log(`  ✓ Room "${room.name}" → ${code}`);
  }

  console.log('✅ Migration complete');
  await mongoose.connection.close();
  process.exit(0);
};

migrate().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
