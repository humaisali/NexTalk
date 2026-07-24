require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const io = require('../../client/node_modules/socket.io-client');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Room = require('../models/Room');

async function run() {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Database connected.');

  // Find a user and a conversation or room
  const user = await User.findOne();
  if (!user) {
    console.error('No users found in the database. Please register/create a user first.');
    await mongoose.connection.close();
    return;
  }
  console.log(`Using user: ${user.username} (${user._id})`);

  // Generate JWT token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // Connect to Socket.io server
  const socket = io('http://localhost:5000', {
    auth: { token }
  });

  socket.on('connect', async () => {
    console.log('🔌 Socket connected successfully!');

    // Find a DM conversation
    const conversation = await Conversation.findOne({ participants: user._id });
    if (conversation) {
      console.log(`Testing send_dm in conversation: ${conversation._id}`);
      socket.emit('send_dm', {
        conversationId: conversation._id.toString(),
        content: '',
        type: 'voice',
        fileUrl: 'http://localhost:5000/uploads/test.webm',
        fileName: 'test.webm',
        fileType: 'audio/webm',
        fileSize: 1000
      });
    } else {
      console.log('No DM conversations found for this user.');
    }

    // Find a Room
    const room = await Room.findOne({ members: user._id });
    if (room) {
      console.log(`Testing send_message in room: ${room._id} (#${room.name})`);
      
      // Join the room first (required by room check)
      socket.emit('join_room', { roomId: room._id.toString() });

      setTimeout(() => {
        socket.emit('send_message', {
          roomId: room._id.toString(),
          content: '',
          type: 'voice',
          fileUrl: 'http://localhost:5000/uploads/test.webm',
          fileName: 'test.webm',
          fileType: 'audio/webm',
          fileSize: 1000
        });
      }, 500);
    } else {
      console.log('No rooms found for this user.');
    }
  });

  socket.on('error', (err) => {
    console.error('❌ Socket received error:', err);
  });

  socket.on('receive_dm', (data) => {
    console.log('✅ Received DM response:', data);
  });

  socket.on('receive_message', (data) => {
    console.log('✅ Received room message response:', data);
  });

  // Keep alive for 3 seconds to catch errors
  setTimeout(async () => {
    socket.disconnect();
    await mongoose.connection.close();
    console.log('Done.');
  }, 4000);
}

run().catch(console.error);
