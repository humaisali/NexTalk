import { useEffect, useCallback } from 'react';
import { getVapidPublicKey, subscribePush } from '../services/api';

// Helper to convert base64 to Uint8Array for VAPID key parsing
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePushNotifications = (user) => {
  const registerAndSubscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !user) {
      console.warn('Push notifications or Service Workers are not supported in this environment.');
      return;
    }

    try {
      // 1. Register service worker at client root scope
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });
      console.log('🚀 Service Worker registered scope:', registration.scope);

      // 2. Wait until service worker is active
      if (registration.installing) {
        await new Promise((resolve) => {
          registration.installing.addEventListener('statechange', (e) => {
            if (e.target.state === 'activated') resolve();
          });
        });
      }

      // 3. Request Notification permissions
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('🔔 Notification permission was denied by the user.');
        return;
      }

      // 4. Fetch the dynamically generated or environment VAPID key
      const { data } = await getVapidPublicKey();
      const vapidKey = data.publicKey;
      if (!vapidKey) {
        console.error('❌ Failed to retrieve VAPID public key from backend.');
        return;
      }

      // 5. Subscribe using PushManager (with unsubscribe fallback for VAPID key mismatch)
      const applicationServerKey = urlBase64ToUint8Array(vapidKey);
      
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        let isMatch = false;
        try {
          if (existingSub.options && existingSub.options.applicationServerKey) {
            const existingKey = new Uint8Array(existingSub.options.applicationServerKey);
            if (existingKey.length === applicationServerKey.length) {
              isMatch = true;
              for (let i = 0; i < existingKey.length; i++) {
                if (existingKey[i] !== applicationServerKey[i]) {
                  isMatch = false;
                  break;
                }
              }
            }
          }
        } catch (compErr) {
          console.warn('⚠️ Error comparing subscription keys:', compErr);
        }

        if (!isMatch) {
          console.log('🔄 VAPID key mismatch detected. Unsubscribing from old subscription...');
          await existingSub.unsubscribe();
          console.log('✅ Unsubscribed old subscription successfully.');
        }
      }

      let subscription;
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        });
      } catch (subErr) {
        console.warn('⚠️ Push subscription failed, attempting to unsubscribe all and retry:', subErr);
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const reg of registrations) {
            const regSub = await reg.pushManager.getSubscription();
            if (regSub) {
              await regSub.unsubscribe();
              console.log('🔄 Unsubscribed from registration scope:', reg.scope);
            }
          }
        } catch (unsubErr) {
          console.error('❌ Failed to unsubscribe existing subscriptions:', unsubErr);
        }
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        });
      }

      console.log('✅ Push subscription established:', subscription);

      // 6. Sync subscription to user profile
      await subscribePush(subscription);
      console.log('📤 Push subscription synchronized on the server.');
    } catch (err) {
      console.error('❌ Error during Service Worker or Push registration:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // Delay slightly to allow page to fully load and avoid blocking initial paint
      const timer = setTimeout(() => {
        registerAndSubscribe();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, registerAndSubscribe]);

  return { registerAndSubscribe };
};

export default usePushNotifications;
