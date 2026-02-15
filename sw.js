const CACHE_NAME = 'myfinance-v2';
const urlsToCache = ['./', './index.html', './manifest.json', './favicon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(urlsToCache)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(names => Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      if (res.status === 200 && res.type === 'basic') {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});

// Push notifications
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'MyFinance', body: '새 알림이 있어요' };
  e.waitUntil(
    self.registration.showNotification(data.title || 'MyFinance', {
      body: data.body, icon: './favicon.svg', badge: './favicon.svg',
      data: data.url || './', vibrate: [100, 50, 100],
      actions: data.actions || [],
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      if (list.length) { list[0].focus(); if (e.notification.data) list[0].navigate(e.notification.data); }
      else clients.openWindow(e.notification.data || './');
    })
  );
});

// Background sync for offline transactions
self.addEventListener('sync', e => {
  if (e.tag === 'sync-transactions') {
    e.waitUntil(syncPendingTransactions());
  }
});

async function syncPendingTransactions() {
  // Will be implemented when offline transaction queue is added
}
