/**
 * utils.js
 * Yardımcı fonksiyonlar ve araçlar
 */

// Tarih formatla
function formatDate(date, format = 'DD.MM.YYYY') {
    if (!date) return '';
    
    // Tarih nesnesi değilse dönüştür
    if (!(date instanceof Date)) {
        // Firestore Timestamp kontrolü
        if (date && typeof date.toDate === 'function') {
            date = date.toDate();
        } else if (typeof date === 'string' || typeof date === 'number') {
            date = new Date(date);
        } else {
            return '';
        }
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    let result = format;
    result = result.replace('DD', day);
    result = result.replace('MM', month);
    result = result.replace('YYYY', year);
    
    return result;
}

// UUID Oluştur
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Metin Kısalt
function truncateText(text, maxLength = 50) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Para formatla
function formatCurrency(value, currency = 'TRY') {
    if (value === null || value === undefined) return '';
    
    const formatter = new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: currency
    });
    
    return formatter.format(value);
}

// LocalStorage yardımcıları
const LocalStorage = {
    /**
     * Veriyi yerel depolamaya kaydeder
     * @param {string} key - Anahtar
     * @param {any} value - Değer
     * @param {number} expiresIn - Süre (saniye cinsinden)
     * @returns {boolean} - Başarılı mı
     */
    set(key, value, expiresIn = null) {
        try {
            const item = {
                value: value,
                timestamp: Date.now()
            };
            
            if (expiresIn) {
                item.expires = Date.now() + (expiresIn * 1000);
            }
            
            localStorage.setItem(key, JSON.stringify(item));
            return true;
        } catch (error) {
            console.error('LocalStorage kayıt hatası:', error);
            return false;
        }
    },
    
    /**
     * Veriyi yerel depolamadan getirir
     * @param {string} key - Anahtar
     * @param {any} defaultValue - Varsayılan değer
     * @returns {any} - Değer
     */
    get(key, defaultValue = null) {
        try {
            const itemStr = localStorage.getItem(key);
            if (!itemStr) return defaultValue;
            
            const item = JSON.parse(itemStr);
            
            // Süre kontrolü
            if (item.expires && Date.now() > item.expires) {
                localStorage.removeItem(key);
                return defaultValue;
            }
            
            return item.value;
        } catch (error) {
            console.error('LocalStorage getirme hatası:', error);
            return defaultValue;
        }
    },
    
    /**
     * Veriyi yerel depolamadan siler
     * @param {string} key - Anahtar
     * @returns {boolean} - Başarılı mı
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('LocalStorage silme hatası:', error);
            return false;
        }
    },
    
    /**
     * Veri sona erme zamanını kontrol eder
     * @param {string} key - Anahtar
     * @returns {number|null} - Kalan süre (milisaniye)
     */
    getExpiryTime(key) {
        try {
            const itemStr = localStorage.getItem(key);
            if (!itemStr) return null;
            
            const item = JSON.parse(itemStr);
            if (!item.expires) return null;
            
            const remainingTime = item.expires - Date.now();
            return remainingTime > 0 ? remainingTime : 0;
        } catch (error) {
            console.error('LocalStorage süre hatası:', error);
            return null;
        }
    }
};

// Bağlantı durumu
const ConnectionManager = {
    isOnline: navigator.onLine,
    callbacks: { online: [], offline: [] },
    
    /**
     * Bağlantı durumu değiştiğinde çalıştırılacak fonksiyonları kaydeder
     * @param {string} eventType - Olay tipi ('online' veya 'offline')
     * @param {Function} callback - Çalıştırılacak fonksiyon
     */
    addListener(eventType, callback) {
        if (eventType === 'online' || eventType === 'offline') {
            this.callbacks[eventType].push(callback);
        }
    },
    
    /**
     * Bağlantı durumu değiştiğinde çalıştırılacak fonksiyonları kaldırır
     * @param {string} eventType - Olay tipi ('online' veya 'offline')
     * @param {Function} callback - Kaldırılacak fonksiyon
     */
    removeListener(eventType, callback) {
        if (eventType === 'online' || eventType === 'offline') {
            this.callbacks[eventType] = this.callbacks[eventType].filter(
                cb => cb !== callback
            );
        }
    },
    
    /**
     * Bağlantı durumunu kontrol eder
     * @returns {boolean} - Çevrimiçi mi
     */
    checkConnection() {
        return navigator.onLine;
    },
    
    /**
     * Bağlantı kurulduğunda yapılacak işlemleri çalıştırır
     */
    handleOnline() {
        this.isOnline = true;
        this.callbacks.online.forEach(callback => callback());
    },
    
    /**
     * Bağlantı kesildiğinde yapılacak işlemleri çalıştırır
     */
    handleOffline() {
        this.isOnline = false;
        this.callbacks.offline.forEach(callback => callback());
    },
    
    /**
     * Bağlantı durumunu dinlemeye başlar
     */
    startListening() {
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }
};

// Bağlantı dinleyicisini başlat
ConnectionManager.startListening();

// Veri Senkronizasyon Manageri
const SyncManager = {
    syncQueue: [],
    isSyncing: false,
    
    /**
     * Senkronizasyon kuyruğuna ekler
     * @param {string} operation - İşlem ('create', 'update', 'delete')
     * @param {string} collection - Koleksiyon
     * @param {string} id - Döküman ID
     * @param {object} data - Veri
     */
    addToQueue(operation, collection, id, data = null) {
        const syncItem = {
            id: generateUUID(),
            timestamp: Date.now(),
            operation: operation,
            collection: collection,
            documentId: id,
            data: data
        };
        
        this.syncQueue.push(syncItem);
        this.saveQueue();
        
        // Çevrimiçiyse hemen senkronize et
        if (ConnectionManager.isOnline && !this.isSyncing) {
            this.sync();
        }
    },
    
    /**
     * Senkronizasyon kuyruğunu kaydeder
     */
    saveQueue() {
        LocalStorage.set('mets_sync_queue', this.syncQueue);
    },
    
    /**
     * Senkronizasyon kuyruğunu yükler
     */
    loadQueue() {
        const queue = LocalStorage.get('mets_sync_queue', []);
        this.syncQueue = queue;
    },
    
    /**
     * Senkronizasyon yapar
     */
    async sync() {
        // Çevrimdışıysa veya senkronizasyon yapılıyorsa çık
        if (!ConnectionManager.isOnline || this.isSyncing || this.syncQueue.length === 0) {
            return;
        }
        
        this.isSyncing = true;
        
        try {
            // Güvenli bir kopya al
            const queueCopy = [...this.syncQueue];
            
            for (const item of queueCopy) {
                try {
                    // Firebase veya API'ye gönder
                    if (window.firebase && window.firebase.firestore) {
                        const db = window.firebase.firestore();
                        const docRef = db.collection(item.collection).doc(item.documentId);
                        
                        if (item.operation === 'create' || item.operation === 'update') {
                            await docRef.set(item.data, { merge: true });
                        } else if (item.operation === 'delete') {
                            await docRef.delete();
                        }
                    } else {
                        // API ile senkronizasyon
                        console.log('API senkronizasyonu henüz uygulanmadı');
                        // Burada API çağrısı yapılabilir
                    }
                    
                    // Başarılıysa kuyruktan çıkar
                    this.syncQueue = this.syncQueue.filter(q => q.id !== item.id);
                } catch (error) {
                    console.error(`Senkronizasyon hatası (${item.collection}/${item.documentId}):`, error);
                    // Hata durumunda devam et (diğer öğeleri senkronize etmeye çalış)
                }
            }
            
            // Kuyruğu güncelle
            this.saveQueue();
        } catch (error) {
            console.error('Senkronizasyon işlemi hatası:', error);
        } finally {
            this.isSyncing = false;
        }
    },
    
    /**
     * Bağlantı durumu dinleyicilerini ekler
     */
    setupConnectionListeners() {
        // Çevrimiçi olduğunda senkronize et
        ConnectionManager.addListener('online', () => {
            console.log('Çevrimiçi, bekleyen değişiklikler senkronize ediliyor...');
            this.sync();
        });
    },
    
    /**
     * Senkronizasyon yöneticisini başlatır
     */
    init() {
        this.loadQueue();
        this.setupConnectionListeners();
        
        // Periyodik senkronizasyon kontrolü
        setInterval(() => {
            if (ConnectionManager.isOnline && !this.isSyncing && this.syncQueue.length > 0) {
                this.sync();
            }
        }, 60000); // Her 1 dakikada kontrol et
    }
};

// SyncManager'ı başlat
SyncManager.init();

// Fonksiyonları dışa aktar
const Utils = {
    formatDate,
    generateUUID,
    truncateText,
    formatCurrency,
    LocalStorage,
    ConnectionManager,
    SyncManager
};

// Global olarak ulaşılabilir yap
window.Utils = Utils;

// ES modülü olarak dışa aktar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
