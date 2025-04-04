/**
 * MehmetEndustriyelTakip Service Worker
 * Çevrimdışı çalışma ve PWA desteği için
 */

const CACHE_NAME = 'mehmet-industrial-cache-v2';
const OFFLINE_URL = 'offline.html';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 1 hafta (milisaniye cinsinden)

// Önbelleğe alınacak dosyalar
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/core/app.js',
  '/core/main.js',
  '/core/mock-firebase.js',
  '/core/compat-check.js',
  '/core/firebase-config.js',
  '/core/database.js',
  '/core/styles/main.css',
  '/utils/event-bus.js',
  '/utils/logger.js',
  '/services/api-service.js',
  '/services/erp-service.js',
  '/services/ai-service.js',
  '/modules/dashboard/dashboard.js',
  '/modules/orders/orders.js',
  '/modules/orders/order-creation.js',
  '/modules/orders/order-detail.js', 
  '/modules/production/production.js',
  '/modules/production/production-planning.js',
  '/modules/purchasing/purchasing.js',
  '/modules/inventory/materials.js',
  '/modules/inventory/stock-management.js',
  '/modules/ai/main.js',
  '/modules/ai/chatbot.js',
  '/modules/ai/ai-analytics.js',
  '/modules/ai/ai-integration.js',
  '/modules/ai/advanced-ai.js',
  '/modules/ai/data-viz.js',
  '/components/charts.js',
  '/components/forms.js',
  '/components/ui-components.js',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
  // Alternatif yollar (dosya yollarının başında / olmadığında)
  'index.html',
  'offline.html',
  'manifest.json',
  'core/app.js',
  'core/main.js',
  'utils/event-bus.js',
  'services/api-service.js',
  'services/erp-service.js',
  'services/ai-service.js',
  'modules/dashboard/dashboard.js',
  'modules/orders/orders.js',
  'modules/production/production.js',
  'modules/purchasing/purchasing.js',
  'modules/ai/chatbot.js',
  'modules/ai/ai-integration.js',
  'modules/ai/advanced-ai.js',
  'modules/ai/ai-analytics.js',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/index.global.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Önbelleğe fonksiyon: API-benzeri dosyalar hariç
const isExcluded = (url) => {
  // API isteklerini önbelleğe alma
  if (url.pathname.startsWith('/api/')) return true;
  
  // Analitik isteklerini önbelleğe alma
  if (url.hostname.includes('analytics') || url.hostname.includes('google-analytics')) return true;
  
  return false;
};

// Service Worker Yükleme
self.addEventListener('install', event => {
  console.log('Service Worker yükleniyor...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Dosyalar önbelleğe alınıyor...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('Service Worker kurulumu tamamlandı');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Önbellekleme hatası:', error);
      })
  );
});

// Service Worker Aktivasyon
self.addEventListener('activate', event => {
  console.log('Service Worker aktifleştiriliyor...');
  
  // Eski önbellekleri temizle
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eski önbellek temizleniyor:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker artık aktif ve kontrolü ele aldı');
      return self.clients.claim();
    })
  );
});

// Fetch İsteklerini Yakalama
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Hariç tutulan istekler için normal ağ işlemi
  if (isExcluded(url)) {
    return;
  }
  
  // Navigasyon istekleri için stale-while-revalidate yaklaşımı
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          const fetchPromise = fetch(event.request)
            .then(networkResponse => {
              // Başarılı yanıtı önbelleğe kaydet
              if (networkResponse && networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, responseClone);
                });
              }
              return networkResponse;
            })
            .catch(() => {
              // Ağ bağlantısı yoksa offline sayfasına yönlendir
              console.log('Navigasyon isteği başarısız, çevrimdışı sayfasına yönlendiriliyor');
              return caches.match(OFFLINE_URL);
            });
          
          // Önbellekteki yanıt varsa hemen kullan, arka planda güncelle
          return cachedResponse || fetchPromise;
        })
    );
    return;
  }
  
  // JavaScript dosyaları için
  if (event.request.url.endsWith('.js')) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          // Önbellekte varsa ve çok eski değilse kullan
          if (cachedResponse) {
            // Zamanı kontrol et (opsiyonel)
            const cachedTime = new Date(cachedResponse.headers.get('date') || 0);
            const now = new Date();
            
            if (now - cachedTime < CACHE_DURATION) {
              // Güncel önbellek, arka planda da güncelle
              fetchAndUpdateCache(event.request);
              return cachedResponse;
            }
          }
          
          // Önbellekte yok veya güncel değil, ağdan getir
          return fetchAndCacheWithFallback(event.request);
        })
    );
    return;
  }
  
  // CSS, Font ve Resimler için Cache-First stratejisi
  if (
    event.request.url.endsWith('.css') || 
    event.request.url.endsWith('.png') || 
    event.request.url.endsWith('.jpg') || 
    event.request.url.endsWith('.jpeg') || 
    event.request.url.endsWith('.svg') || 
    event.request.url.endsWith('.woff2') || 
    event.request.url.includes('bootstrap') || 
    event.request.url.includes('font-awesome')
  ) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          return cachedResponse || fetchAndCacheWithFallback(event.request);
        })
    );
    return;
  }
  
  // Diğer tüm istekler için Network-First yaklaşımı
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Başarılı yanıtı önbelleğe kaydet
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Ağ bağlantısı yoksa önbellekten dene
        return caches.match(event.request);
      })
  );
});

/**
 * İsteği ağdan getir ve önbelleğe kaydet
 * @param {Request} request İstek
 * @returns {Promise<Response>} Yanıt
 */
function fetchAndCacheWithFallback(request) {
  return fetch(request)
    .then(response => {
      // Yanıt geçerliyse önbelleğe kaydet
      if (response && response.status === 200) {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseClone);
        });
      }
      return response;
    })
    .catch(err => {
      // Ağ hatası - önbellekten dene
      console.warn('Ağ isteği başarısız, önbellekten deneniyor:', err);
      return caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Yol eşleşme denemesi - tam eşleşme bulunamazsa
          const url = new URL(request.url);
          const fileName = url.pathname.split('/').pop();
          
          return caches.open(CACHE_NAME)
            .then(cache => cache.keys())
            .then(keys => {
              const matchingKey = keys.find(key => {
                const keyUrl = new URL(key.url);
                return keyUrl.pathname.split('/').pop() === fileName;
              });
              
              if (matchingKey) {
                return caches.match(matchingKey);
              }
              
              throw new Error('Önbellekte eşleşme bulunamadı');
            });
        })
        .catch(cacheErr => {
          console.error('Önbellek erişim hatası:', cacheErr);
          // Son çare olarak varsayılan offline içeriği göster
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          
          // Diğer kaynaklar için basit hata yanıtı
          return new Response('Kaynak bulunamadı ve çevrimdışısınız', {
            status: 503,
            headers: {'Content-Type': 'text/plain'}
          });
        });
    });
}

/**
 * Arka planda isteği ağdan getir ve önbelleği güncelle
 * @param {Request} request İstek
 */
function fetchAndUpdateCache(request) {
  // Bu işlem tamamen arka planda yapılır, yanıtı döndürmez
  fetch(request)
    .then(response => {
      if (response && response.status === 200) {
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, response);
        });
      }
    })
    .catch(err => {
      console.warn('Arka plan güncelleme hatası:', err);
    });
}

// Çevrimdışı-çevrimiçi geçişlerini izle
self.addEventListener('online', () => {
  console.log('Çevrimiçi durumuna geçildi, kaynakları güncelleniyor...');
  
  // Önbellekteki kaynakları güncelle
  caches.open(CACHE_NAME)
    .then(cache => cache.keys())
    .then(requests => {
      requests.forEach(request => {
        // Her kaynağı arka planda güncelle
        fetchAndUpdateCache(request);
      });
    });
});

// Çalışma kapsamını genişlet
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    // İstemciden gelen ek URL'leri önbelleğe al
    if (event.data.urls && Array.isArray(event.data.urls)) {
      event.waitUntil(
        caches.open(CACHE_NAME)
          .then(cache => {
            return cache.addAll(event.data.urls);
          })
          .then(() => {
            event.ports[0].postMessage({
              status: 'SUCCESS',
              message: `${event.data.urls.length} adet ek kaynak önbelleğe alındı`
            });
          })
          .catch(error => {
            console.error('Dinamik önbellekleme hatası:', error);
            event.ports[0].postMessage({
              status: 'ERROR',
              message: error.message
            });
          })
      );
    }
  }
});

// Push Bildirim İşleme
self.addEventListener('push', event => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    // Varsayılan bildirim içeriği
    const title = data.title || 'MehmetEndüstriyelTakip';
    const options = {
      body: data.body || 'Yeni bir bildiriminiz var',
      icon: data.icon || '/assets/icons/icon-192x192.png',
      badge: data.badge || '/assets/icons/badge-72x72.png',
      data: { url: data.url || '/' }
    };
    
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (error) {
    console.error('Push bildirim işleme hatası:', error);
  }
});

// Bildirime Tıklama
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        const url = event.notification.data.url || '/';
        
        // Zaten açık olan bir pencere varsa odaklan
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Yoksa yeni bir pencere aç
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Çalışıyorum mesajı
console.log('Service Worker çalışıyor!');