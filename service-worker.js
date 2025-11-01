const cacheName='dashboard-v1';
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(cacheName).then(c=>c.addAll(['/','/index.html','/style.css','/app.js','/icon.png'])));
});
self.addEventListener('fetch',e=>{
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
