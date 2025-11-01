const cacheName = 'allin1-v1';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(cacheName).then(c => c.addAll(['/','/index.html','/style.css','/app.js','/icon.png','/manifest.json'])));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({type:'window'}).then(all=>{
    if(all.length) return all[0].focus();
    return clients.openWindow('/');
  }));
});
