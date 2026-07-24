require('dotenv').config();
const mongoose = require('mongoose');
const DirectMessage = require('../models/DirectMessage');
const Message = require('../models/Message');

async function checkDb() {
  console.log('Connecting to:', process.env.MONGODB_URI);
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected!');

  try {
    const dmCollection = mongoose.connection.collection('directmessages');
    const msgCollection = mongoose.connection.collection('messages');

    console.log('\n--- DirectMessages Indexes ---');
    const dmIndexes = await dmCollection.indexes();
    console.log(JSON.stringify(dmIndexes, null, 2));

    console.log('\n--- Messages Indexes ---');
    const msgIndexes = await msgCollection.indexes();
    console.log(JSON.stringify(msgIndexes, null, 2));

    console.log('\n--- Testing DM Creation with Empty Content ---');
    const fakeUser = new mongoose.Types.ObjectId();
    const fakeConv = new mongoose.Types.ObjectId();

    const testDM = new DirectMessage({
      conversation: fakeConv,
      sender: fakeUser,
      content: '',
      type: 'voice',
      fileUrl: 'http://localhost:5000/uploads/test.webm',
      fileName: 'test.webm',
      fileType: 'audio/webm',
      fileSize: 1234,
      readBy: [fakeUser],
      deliveredTo: [fakeUser]
    });

    await testDM.validate();
    console.log('DM Validation Passed!');
    
    await testDM.save();
    console.log('DM Save Passed!');
    
    await DirectMessage.deleteOne({ _id: testDM._id });
    console.log('Test DM cleaned up successfully.');

  } catch (err) {
    console.error('ERROR ENCOUNTERED:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed.');
  }
}

checkDb();
