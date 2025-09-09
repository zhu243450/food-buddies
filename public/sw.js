// Service Worker 激进缓存策略
const CACHE_NAME = 'dinner-app-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// 需要预缓存的关键资源
const STATIC_ASSETS = [
  '/',
  '/auth',
  '/my-dinners',
  '/discover',
  '/manifest.json'
];

// API路径缓存策略
const API_CACHE_PATTERNS = [
  /\/api\/dinners/,
  /\/api\/profiles/,
  /\/rest\/v1\//
];

// 安装事件 - 预缓存关键资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => 
        cache.addAll(STATIC_ASSETS)
      ),
      self.skipWaiting()
    ])
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys => 
        Promise.all(
          keys.filter(key => 
            key !== CACHE_NAME && 
            key !== STATIC_CACHE && 
            key !== DYNAMIC_CACHE
          ).map(key => caches.delete(key))
        )
      ),
      self.clients.claim()
    ])
  );
});

// 拦截请求 - 激进缓存策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只处理同域或API请求
  if (!url.origin.includes(self.location.origin) && 
      !url.href.includes('supabase')) {
    return;
  }

  // API请求策略：网络优先，失败则缓存
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(
      networkFirstStrategy(request)
    );
    return;
  }

  // 静态资源策略：缓存优先
  if (request.destination === 'script' || 
      request.destination === 'style' ||
      request.destination === 'image') {
    event.respondWith(
      cacheFirstStrategy(request)
    );
    return;
  }

  // HTML请求策略：网络优先，快速回退
  if (request.destination === 'document') {
    event.respondWith(
      networkFirstWithFastFallback(request)
    );
    return;
  }
});

// 网络优先策略
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// 缓存优先策略
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // 后台更新缓存
    fetch(request).then(response => {
      if (response.ok) {
        const cache = caches.open(STATIC_CACHE);
        cache.then(c => c.put(request, response));
      }
    }).catch(() => {});
    
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // 返回离线页面或默认资源
    if (request.destination === 'document') {
      return caches.match('/');
    }
    throw error;
  }
}

// 快速回退的网络优先策略
async function networkFirstWithFastFallback(request) {
  return Promise.race([
    fetch(request).catch(() => caches.match(request)),
    new Promise(resolve => 
      setTimeout(() => resolve(caches.match(request)), 500)
    )
  ]);
}