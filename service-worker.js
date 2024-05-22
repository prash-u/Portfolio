self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('static-v1').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/bio-tech-projects.html',
        '/personal-projects.html',
        '/about.html',
        '/pages/eeg.html',
        '/css/style.css',
        '/assets/images/banner1.jpg',
        '/assets/images/banner2.jpg',
        '/assets/images/banner3.jpg',
        '/assets/images/banner4.jpg',
        '/assets/images/banner5.jpg',
        '/assets/icons/icon-192x192.png',
        '/assets/icons/icon-512x512.png',
        'https://cdn.jsdelivr.net/npm/eeg-pipes@latest/dist/eeg-pipes.min.js',
        'https://cdn.jsdelivr.net/npm/eeglib@latest/dist/eeglib.min.js'
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
