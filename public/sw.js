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

// Push event - handle incoming push notifications (event.data.json() is async)
self.addEventListener('push', (event) => {
  const defaultData = {
    title: 'New Notification',
    body: 'You have a new notification',
    icon: NOTIFICATION_ICON,
    badge: NOTIFICATION_BADGE,
    data: { url: '/', timestamp: Date.now() }
  };

  const parseAndShow = (eventData) => {
    if (!eventData) {
      return self.registration.showNotification(defaultData.title, {
        body: defaultData.body,
        icon: defaultData.icon,
        badge: defaultData.badge,
        data: defaultData.data,
        dir: 'auto',
        lang: 'en'
      });
    }
    return eventData.json().then(function (data) {
      const payload = {
        title: data.title || defaultData.title,
        body: data.body || data.message || defaultData.body,
        icon: data.icon || NOTIFICATION_ICON,
        badge: data.badge || NOTIFICATION_BADGE,
        image: data.image,
        tag: data.tag || 'notification-' + Date.now(),
        requireInteraction: !!data.requireInteraction,
        silent: !!data.silent,
        vibrate: data.vibrate || [200, 100, 200],
        data: {
          url: data.url || data.actionUrl || '/',
          notificationId: data.notificationId || data.id,
          type: data.type || 'info',
          timestamp: Date.now()
        },
        actions: data.actions || [],
        dir: 'auto',
        lang: (data.lang || 'en').substring(0, 2)
      };
      return self.registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon,
        badge: payload.badge,
        image: payload.image,
        tag: payload.tag,
        requireInteraction: payload.requireInteraction,
        silent: payload.silent,
        vibrate: payload.vibrate,
        data: payload.data,
        actions: payload.actions,
        dir: payload.dir,
        lang: payload.lang,
        timestamp: Date.now()
      });
    }).catch(function () {
      return eventData.text().then(function (text) {
        return self.registration.showNotification(defaultData.title, {
          body: text || defaultData.body,
          icon: defaultData.icon,
          badge: defaultData.badge,
          data: defaultData.data,
          dir: 'auto',
          lang: 'en'
        });
      }).catch(function () {
        return self.registration.showNotification(defaultData.title, {
          body: defaultData.body,
          icon: defaultData.icon,
          badge: defaultData.badge,
          data: defaultData.data,
          dir: 'auto',
          lang: 'en'
        });
      });
    });
  };

  event.waitUntil(parseAndShow(event.data));
});

// Notification click event - open app at full URL (works across origins/locales)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let url = data.url || '/';
  // Ensure absolute URL so it works when app is deployed (any origin)
  if (url.startsWith('/')) {
    try {
      const base = self.registration.scope.replace(/\/$/, '');
      const origin = new URL(base).origin;
      url = origin + url;
    } catch (e) {
      url = (self.location && self.location.origin) ? self.location.origin + url : url;
    }
  }

  if (event.action) {
    // Custom action handling if needed
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        try {
          const clientUrl = new URL(client.url);
          const targetUrl = new URL(url);
          if (clientUrl.origin === targetUrl.origin && clientUrl.pathname === targetUrl.pathname && 'focus' in client) {
            client.focus();
            if (targetUrl.hash) client.navigate(url).catch(() => {});
            return;
          }
        } catch (e) {}
      }
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

