/* 風景帖 Service Worker v4
 * v4変更点: キャッシュキーを pathname → pathname+search に変更
 * → ?v=xxxx によるバージョンバストが正しく機能するように修正
 */

var CACHE_STATIC = 'fk-static-v4';
var CACHE_PAGES  = 'fk-pages-v4';
var BASE = '/fukeichou-site';

var PRECACHE_STATIC = [
  BASE + '/assets/css/style.css?v=20260317n',
  BASE + '/assets/js/main.js?v=20260317n',
  BASE + '/assets/images/hero-fallback.jpg',
  BASE + '/assets/images/sample-clinic.jpg',
  BASE + '/assets/images/sample-care.jpg',
  BASE + '/assets/images/intro-clinic.jpg',
  BASE + '/assets/images/intro-care.jpg',
];

var PRECACHE_PAGES = [
  BASE + '/',
  BASE + '/simulator/',
  BASE + '/quality/',
  BASE + '/evidence/',
];

self.addEventListener('install', function(e){
  e.waitUntil(
    Promise.all([
      caches.open(CACHE_STATIC).then(function(c){
        return Promise.all(PRECACHE_STATIC.map(function(url){
          return fetch(url).then(function(res){
            if(res && res.ok) return c.put(url, res);
          }).catch(function(){});
        }));
      }),
      caches.open(CACHE_PAGES).then(function(c){
        return Promise.all(PRECACHE_PAGES.map(function(url){
          return fetch(url).then(function(res){
            if(res && res.ok) return c.put(url, res);
          }).catch(function(){});
        }));
      }),
    ]).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_STATIC && k !== CACHE_PAGES; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var url;
  try{ url = new URL(e.request.url); }catch(err){ return; }

  if(!url.protocol.startsWith('http')) return;
  if(e.request.method !== 'GET') return;

  /* 動画はpassthrough */
  if(url.pathname.endsWith('.mp4')) return;

  /* キャッシュキー = pathname + search（?v=xxxx を含める） */
  var cacheKey = url.pathname + url.search;

  /* 外部ドメイン（Fonts, CDN）→ cache-first */
  if(url.hostname !== self.location.hostname){
    e.respondWith(cacheFirst(url.origin + url.pathname, e.request, CACHE_STATIC));
    return;
  }

  var accept = e.request.headers.get('Accept') || '';

  /* HTMLナビゲーション → stale-while-revalidate */
  if(accept.includes('text/html')){
    e.respondWith(staleWhileRevalidate(url.pathname, e.request, CACHE_PAGES));
    return;
  }

  /* CSS / JS / 画像 → ?v= 込みのキーでcache-first */
  if(/\.(css|js|jpg|jpeg|png|webp|svg|ico|woff2?)/.test(url.pathname)){
    e.respondWith(cacheFirst(cacheKey, e.request, CACHE_STATIC));
    return;
  }
});

function cacheFirst(key, request, cacheName){
  return caches.open(cacheName).then(function(cache){
    return cache.match(key).then(function(cached){
      if(cached) return cached;
      return fetch(request).then(function(res){
        if(res && res.ok) cache.put(key, res.clone());
        return res;
      }).catch(function(){ return cached; });
    });
  });
}

function staleWhileRevalidate(key, request, cacheName){
  return caches.open(cacheName).then(function(cache){
    return cache.match(key).then(function(cached){
      var fetchPromise = fetch(request).then(function(res){
        if(res && res.ok) cache.put(key, res.clone());
        return res;
      }).catch(function(){ return null; });
      return cached || fetchPromise;
    });
  });
}
