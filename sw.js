/* 風景帖 Service Worker v2
 * Safari対応強化版
 *
 * Safari固有の対応:
 *   - cache:'reload' でプリキャッシュ → SafariのHTTPキャッシュをバイパス
 *   - URLクエリ正規化 → ?v=付きCSSも style.css キャッシュにヒット
 *   - HTML fetch に cache:'no-store' → SafariのSW内fetchがHTTPキャッシュを見ない
 *   - mp4はpassthrough（Rangeリクエスト問題を回避）
 */

var CACHE_STATIC = 'fk-static-v2';
var CACHE_PAGES  = 'fk-pages-v2';
var BASE = '/fukeichou-site';

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
      caches.open(CACHE_STATIC).then(function(c){
        return Promise.all(PRECACHE_STATIC.map(function(url){
          return fetch(new Request(url, {cache:'reload'})).then(function(res){
            if(res.ok) return c.put(url, res);
          }).catch(function(){});
        }));
      }),
      caches.open(CACHE_PAGES).then(function(c){
        return Promise.all(PRECACHE_PAGES.map(function(url){
          return fetch(new Request(url, {cache:'reload'})).then(function(res){
            if(res.ok) return c.put(url, res);
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
        keys.filter(function(k){ return k!==CACHE_STATIC && k!==CACHE_PAGES; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var url;
  try{ url=new URL(e.request.url); }catch(err){ return; }

  if(!url.protocol.startsWith('http')) return;
  if(e.request.method!=='GET') return;

  /* 動画はpassthrough — RangeリクエストをSWで処理しない */
  if(url.pathname.endsWith('.mp4')) return;

  /* 外部ドメイン（Fonts, CDN）*/
  if(url.hostname!==self.location.hostname){
    e.respondWith(cacheFirst(url.origin+url.pathname, e.request, CACHE_STATIC));
    return;
  }

  var accept = e.request.headers.get('Accept')||'';

  /* HTMLナビゲーション */
  if(accept.includes('text/html')){
    e.respondWith(staleWhileRevalidate(url.pathname, e.request, CACHE_PAGES));
    return;
  }

  /* CSS/JS/画像（?v=クエリを除いたpathをキーに） */
  if(/\.(css|js|jpg|jpeg|png|webp|svg|ico|woff2?)/.test(url.pathname)){
    e.respondWith(cacheFirst(url.pathname, e.request, CACHE_STATIC));
    return;
  }
});

function cacheFirst(key, request, cacheName){
  return caches.open(cacheName).then(function(cache){
    return cache.match(key).then(function(cached){
      if(cached) return cached;
      return fetch(request).then(function(res){
        if(res&&res.ok) cache.put(key, res.clone());
        return res;
      }).catch(function(){ return cached; });
    });
  });
}

function staleWhileRevalidate(key, request, cacheName){
  return caches.open(cacheName).then(function(cache){
    return cache.match(key).then(function(cached){
      var fetchPromise = fetch(new Request(request,{cache:'no-store'})).then(function(res){
        if(res&&res.ok) cache.put(key, res.clone());
        return res;
      }).catch(function(){ return null; });
      return cached||fetchPromise;
    });
  });
}
