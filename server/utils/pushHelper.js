const webpush = require('web-push');
const User = require('../models/User');

let vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};
let pushEnabled = Boolean(vapidKeys.publicKey && vapidKeys.privateKey);

if (!pushEnabled && process.env.NODE_ENV !== 'production') {
  const generated = webpush.generateVAPIDKeys();
  vapidKeys.publicKey = generated.publicKey;
  vapidKeys.privateKey = generated.privateKey;
  pushEnabled = true;
  console.log('🔑 Web Push: Using temporary generated VAPID keys.');
} else if (!pushEnabled) {
  console.error('🔑 Web Push disabled: persistent VAPID keys are required in production.');
} else {
  console.log('🔑 Web Push: Using environment VAPID keys.');
}

if (pushEnabled) {
  webpush.setVapidDetails(
    'mailto:support@nextalk.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
}

/**
 * Sends a push notification to all subscriptions of a user
 */
const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    if (!pushEnabled) return;
    const user = await User.findById(userId);
    if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      return;
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: user.avatar || '/icon-192.png',
      data: {
        url: '/chat',
        ...data
      }
    });

    console.log(`📤 Sending push notification to ${user.username}...`);

    const promises = user.pushSubscriptions.map((sub) => {
      return webpush.sendNotification(sub, payload)
        .catch(async (err) => {
          // If subscription has expired or is invalid, remove it
          if (err.statusCode === 404 || err.statusCode === 410) {
            console.log(`🗑️ Removing expired push subscription for ${user.username}`);
            await User.findByIdAndUpdate(userId, {
              $pull: { pushSubscriptions: { endpoint: sub.endpoint } }
            });
          } else {
            console.error('Push notification error:', err.message);
          }
        });
    });

    await Promise.all(promises);
  } catch (err) {
    console.error('sendPushNotification helper error:', err);
  }
};

module.exports = {
  vapidKeys,
  pushEnabled,
  sendPushNotification
};
