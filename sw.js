/* 風景帖 Service Worker
 * スコープ: /fukeichou-site/
 * 戦略:
 *   HTML       → stale-while-revalidate（即座に表示→バックグラウンド更新）
 *   CSS/JS/画像 → cache-first（長期キャッシュ、?v= で無効化）
 *   動画(mp4)   → network-first（大容量のためSWキャッシュ対象外）
 *   Google Fonts / CDN → cache-first（外部リソース）
 */

var CACHE_STATIC = 'fk-static-v1';
var CACHE_PAGES  = 'fk-pages-v1';
var BASE = '/fukeichou-site';

/* インストール時にプリキャッシュ */
var PRECACHE_STATIC = [
  BASE + '/assets/css/style.css',
  BASE + '/assets/js/main.js',
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
      caches.open(CACHE_STATIC).then(function(c){ return c.addAll(PRECACHE_STATIC); }),
      caches.open(CACHE_PAGES).then(function(c){ return c.addAll(PRECACHE_PAGES); }),
    ]).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  /* 古いキャッシュを削除 */
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
  var url = new URL(e.request.url);

  /* chrome-extension などは無視 */
  if(!url.protocol.startsWith('http')) return;

  /* 動画(mp4)はSWキャッシュしない — Rangeリクエストの複雑性を避ける */
  if(url.pathname.endsWith('.mp4')){
    e.respondWith(fetch(e.request));
    return;
  }

  /* 外部ドメイン（Fonts, CDN）→ cache-first */
  if(url.hostname !== self.location.hostname){
    e.respondWith(cacheFirst(e.request, CACHE_STATIC));
    return;
  }

  var path = url.pathname;

  /* HTML → stale-while-revalidate */
  if(e.request.headers.get('Accept') && e.request.headers.get('Accept').includes('text/html')){
    e.respondWith(staleWhileRevalidate(e.request, CACHE_PAGES));
    return;
  }

  /* CSS / JS / 画像 → cache-first（?v=パラメータで自動バージョン管理） */
  if(/\.(css|js|jpg|jpeg|png|webp|svg|ico|woff2?)(\?|$)/.test(path)){
    e.respondWith(cacheFirst(e.request, CACHE_STATIC));
    return;
  }

  /* それ以外 → network-first */
  e.respondWith(fetch(e.request).catch(function(){
    return caches.match(e.request);
  }));
});

/* ── 戦略関数 ── */

function cacheFirst(request, cacheName){
  return caches.open(cacheName).then(function(cache){
    return cache.match(request).then(function(cached){
      if(cached) return cached;
      return fetch(request).then(function(response){
        if(response.ok) cache.put(request, response.clone());
        return response;
      });
    });
  });
}

function staleWhileRevalidate(request, cacheName){
  return caches.open(cacheName).then(function(cache){
    return cache.match(request).then(function(cached){
      var fetchPromise = fetch(request).then(function(response){
        if(response.ok) cache.put(request, response.clone());
        return response;
      });
      /* キャッシュがあれば即座に返し、裏でネットワーク更新 */
      return cached || fetchPromise;
    });
  });
}
