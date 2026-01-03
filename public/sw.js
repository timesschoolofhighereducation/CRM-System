// Service Worker for Push Notifications
// Works on all browsers: Chrome, Firefox, Safari, Edge

const CACHE_NAME = 'tshe-crm-v1';
const NOTIFICATION_ICON = '/fav.png';
const NOTIFICATION_BADGE = '/fav.png';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  self.skipWaiting(); // Activate immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim(); // Take control of all pages immediately
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received', event);

  let notificationData = {
    title: 'New Notification',
    body: 'You have a new notification',
    icon: NOTIFICATION_ICON,
    badge: NOTIFICATION_BADGE,
    data: {
      url: '/',
      timestamp: Date.now()
    }
  };

  // Parse push data
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || data.message || notificationData.body,
        icon: data.icon || NOTIFICATION_ICON,
        badge: data.badge || NOTIFICATION_BADGE,
        image: data.image,
        tag: data.tag || `notification-${Date.now()}`,
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false,
        vibrate: data.vibrate || [200, 100, 200],
        data: {
          url: data.url || data.actionUrl || '/',
          notificationId: data.notificationId || data.id,
          type: data.type || 'info',
          ...data.data
        },
        actions: data.actions || []
      };
    } catch (e) {
      // If JSON parsing fails, try as text
      try {
        const text = event.data.text();
        if (text) {
          notificationData.body = text;
        }
      } catch (e2) {
        console.error('Error parsing push data:', e2);
      }
    }
  }

  // Show notification
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      image: notificationData.image,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      silent: notificationData.silent,
      vibrate: notificationData.vibrate,
      data: notificationData.data,
      actions: notificationData.actions,
      // Cross-browser compatibility
      dir: 'auto',
      lang: 'en',
      timestamp: Date.now()
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);

  event.notification.close();

  const data = event.notification.data || {};
  const url = data.url || '/';

  // Handle action buttons
  if (event.action) {
    // Handle specific action
    console.log('Action clicked:', event.action);
    // You can add custom logic here for different actions
    return;
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Service Worker: Notification closed', event);
  // You can track analytics here if needed
});

// Message event - handle messages from the app
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

