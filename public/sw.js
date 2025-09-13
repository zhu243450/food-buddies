// Service Worker 优化缓存策略 - 避免 MIME type 冲突
const CACHE_NAME = 'dinner-app-v2';
const STATIC_CACHE = 'static-v2';
const DYNAMIC_CACHE = 'dynamic-v2';

// 需要预缓存的关键资源
const STATIC_ASSETS = [
  '/',
  '/manifest.json'
];

// API路径缓存策略
const API_CACHE_PATTERNS = [
  /\/rest\/v1\//
];

// 安装事件 - 预缓存关键资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => 
        cache.addAll(STATIC_ASSETS).catch(() => {})
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

// 拦截请求 - 避免缓存 JS 模块和开发资源
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 不缓存开发服务器资源和模块
  if (url.pathname.includes('/@') || 
      url.pathname.includes('/src/') ||
      url.pathname.includes('.tsx') ||
      url.pathname.includes('.ts') ||
      url.pathname.includes('/node_modules/') ||
      url.pathname.includes('/__vite') ||
      request.destination === 'script' && url.pathname.includes('/src/')) {
    return; // 让浏览器正常处理这些请求
  }

  // 只处理 API 请求
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(
      networkFirstStrategy(request)
    );
    return;
  }

  // 对于其他静态资源，使用简单的网络优先策略
  if (request.destination === 'image' || 
      request.destination === 'font' ||
      url.pathname.includes('/manifest.json')) {
    event.respondWith(
      networkFirstStrategy(request)
    );
  }
});

// 简化的网络优先策略
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && request.method === 'GET' && 
        !request.url.includes('/src/') && 
        !request.url.includes('.tsx')) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone()).catch(() => {});
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