const CACHE_NAME = 'vargos-v1';
const OFFLINE_URL = '/index.html';

// Список критичных ресурсов для кэширования
const CRITICAL_ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/main.js',
    '/js/config.js',
    '/js/project-models.js',
    '/js/helpers.js',
    '/js/auto-save.js',
    '/js/modals.js',
    '/js/pdf-generator.js',
    '/js/pdf-data.js',
    '/js/quotes-api.js',
    '/js/categories-api.js',
    '/js/categories-storage.js',
    '/js/pdf-settings-storage.js',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching critical assets');
                return cache.addAll(CRITICAL_ASSETS.map(url => {
                    return new Request(url, { cache: 'reload' });
                })).catch(err => {
                    console.warn('[Service Worker] Some assets failed to cache:', err);
                });
            })
            .then(() => self.skipWaiting())
    );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Стратегия кэширования: Network First с fallback на Cache
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Пропускаем запросы к API аутентификации
    if (url.pathname.startsWith('/auth/')) {
        return;
    }

    // Для API запросов - Network First
    if (url.pathname.startsWith('/quotes/') || 
        url.pathname.startsWith('/categories/') || 
        url.pathname.startsWith('/jobs/')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Клонируем ответ для кэширования
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, responseToCache);
                    });
                    return response;
                })
                .catch(() => {
                    // Если сеть недоступна, пытаемся взять из кэша
                    return caches.match(request).then(cachedResponse => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // Возвращаем offline страницу для навигационных запросов
                        if (request.mode === 'navigate') {
                            return caches.match(OFFLINE_URL);
                        }
                        return new Response('Offline', { status: 503 });
                    });
                })
        );
        return;
    }

    // Для статических ресурсов - Cache First
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                return fetch(request).then((response) => {
                    // Не кэшируем некорректные ответы
                    if (!response || response.status !== 200 || response.type === 'error') {
                        return response;
                    }

                    // Клонируем ответ для кэширования
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseToCache);
                    });

                    return response;
                }).catch(() => {
                    // Fallback для навигационных запросов
                    if (request.mode === 'navigate') {
                        return caches.match(OFFLINE_URL);
                    }
                    return new Response('Offline', { status: 503 });
                });
            })
    );
});

// Обработка сообщений от клиента
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    // Синхронизация данных при восстановлении соединения
    if (event.data && event.data.type === 'SYNC_DATA') {
        console.log('[Service Worker] Syncing offline data...');
        // Здесь можно добавить логику синхронизации
    }
});

// Background Sync для синхронизации данных
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-quotes') {
        event.waitUntil(syncQuotes());
    }
});

async function syncQuotes() {
    console.log('[Service Worker] Background sync: syncing quotes');
    // TODO: Реализовать логику синхронизации данных с сервером
    // Это можно будет расширить в будущем для отправки несохраненных смет
    // Текущая реализация использует localStorage и автоматическую синхронизацию
    // при восстановлении соединения через offline-manager.js
}
