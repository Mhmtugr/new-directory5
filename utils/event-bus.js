/**
 * EventBus.js - Basit bir olay yayın/dinleme sistemi
 */

// Daha önce tanımlanmış mı kontrol et
if (window.EventBus) {
    console.log("EventBus zaten yüklenmiş, tekrar yükleme atlanıyor.");
} else {
    // EventBus sınıfı
    const EventBus = {
        // Olay dinleyicileri için depolama
        listeners: {},
        
        /**
         * Yeni bir olay dinleyicisi ekle
         * @param {string} event - Olay adı
         * @param {Function} callback - Çağrılacak fonksiyon
         * @returns {Function} - Dinleyiciyi kaldırmak için kullanılabilecek fonksiyon
         */
        on(event, callback) {
            if (!this.listeners[event]) {
                this.listeners[event] = [];
            }
            
            this.listeners[event].push(callback);
            
            // Dinleyiciyi kaldırmak için bir fonksiyon döndür
            return () => {
                this.off(event, callback);
            };
        },
        
        /**
         * Bir olay dinleyicisini kaldır
         * @param {string} event - Olay adı
         * @param {Function} callback - Kaldırılacak olan callback
         */
        off(event, callback) {
            if (!this.listeners[event]) return;
            
            // Belirli bir callback'i kaldır
            if (callback) {
                this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
            } 
            // Tüm dinleyicileri kaldır
            else {
                delete this.listeners[event];
            }
        },
        
        /**
         * Bir olayı yayınla
         * @param {string} event - Olay adı
         * @param {any} data - Olayla birlikte gönderilecek veri
         */
        emit(event, data) {
            if (!this.listeners[event]) return;
            
            // Tüm dinleyicileri bilgilendir
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`EventBus olay işleyici hatası (${event}):`, error);
                }
            });
            
            // CustomEvent olarak da yayınla (DOM entegrasyonu için)
            try {
                const customEvent = new CustomEvent(`eventbus:${event}`, { detail: data });
                document.dispatchEvent(customEvent);
            } catch (error) {
                console.warn(`EventBus CustomEvent yayını hatası:`, error);
            }
        },
        
        /**
         * Bir kere çalışacak bir olay dinleyicisi ekle
         * @param {string} event - Olay adı
         * @param {Function} callback - Çağrılacak fonksiyon
         */
        once(event, callback) {
            const onceCallback = (data) => {
                callback(data);
                this.off(event, onceCallback);
            };
            
            return this.on(event, onceCallback);
        }
    };
    
    // Global olarak erişilebilir hale getir
    window.EventBus = EventBus;
    
    // ES modül uyumluluğu için
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { default: EventBus };
    }
    
    console.log("EventBus yüklendi ve hazır");
}
