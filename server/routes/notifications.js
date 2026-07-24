const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const { vapidKeys, sendPushNotification } = require('../utils/pushHelper');

// GET /api/notifications/vapid-public-key
router.get('/vapid-public-key', (req, res) => {
  res.status(200).json({ publicKey: vapidKeys.publicKey });
});

// POST /api/notifications/subscribe
router.post('/subscribe', authMiddleware, async (req, res) => {
  try {
    const subscription = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: 'Subscription object required.' });
    }

    // Add subscription to user if it doesn't already exist
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const alreadySubscribed = user.pushSubscriptions.some(
      (sub) => sub.endpoint === subscription.endpoint
    );

    if (!alreadySubscribed) {
      user.pushSubscriptions.push(subscription);
      await user.save();
    }

    // Send a welcome push notification to confirm setup
    setImmediate(async () => {
      await sendPushNotification(
        user._id,
        'Notifications Enabled! 🔔',
        'You will now receive alerts for new messages even when NexTalk is closed.',
        { url: '/chat' }
      );
    });

    res.status(200).json({ message: 'Subscribed successfully!' });
  } catch (err) {
    console.error('Subscription error:', err);
    res.status(500).json({ message: 'Failed to subscribe.' });
  }
});

// POST /api/notifications/unsubscribe
router.post('/unsubscribe', authMiddleware, async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ message: 'endpoint parameter is required.' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { pushSubscriptions: { endpoint } }
    });

    res.status(200).json({ message: 'Unsubscribed successfully!' });
  } catch (err) {
    console.error('Unsubscribe error:', err);
    res.status(500).json({ message: 'Failed to unsubscribe.' });
  }
});

module.exports = router;
