/* Family Rate Pro · service worker v8 */
const C = 'frp-v8';
const A = ['./','./index.html','./app.js','./style.css','./manifest.json','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./favicon.png'];

self.addEventListener('install', e => e.waitUntil(
  caches.open(C).then(c => c.addAll(A)).then(() => self.skipWaiting())
));

self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => self.clients.claim())
));

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  const font = u.origin === 'https://fonts.googleapis.com' || u.origin === 'https://fonts.gstatic.com';
  if (font || u.origin === location.origin){
    e.respondWith(
      caches.match(e.request).then(r =>
        r || fetch(e.request).then(res => {
          if (res.ok || font){
            const cl = res.clone();
            caches.open(C).then(c => c.put(e.request, cl));
          }
          return res;
        }).catch(() => u.origin === location.origin ? caches.match('./') : new Response('', { status: 504, statusText: 'offline' }))
      )
    );
  }
});
