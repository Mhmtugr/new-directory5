/**
 * event-bus.js
 * Uygulama modülleri arasında iletişimi sağlar
 */

// EventBus sınıfı
class EventBusService {
    constructor() {
        this.events = {};
        this.debugMode = AppConfig?.logLevel === 'DEBUG';
        
        if (this.debugMode) {
            console.log('EventBus başlatıldı (Debug modu aktif)');
        }
    }
    
    /**
     * Olaya abone ol
     * @param {string} eventName - Olay adı
     * @param {Function} callback - Tetiklendiğinde çalıştırılacak fonksiyon
     */
    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        
        this.events[eventName].push(callback);
        
        if (this.debugMode) {
            console.log(`EventBus: '${eventName}' olayına yeni dinleyici eklendi`);
        }
        
        return () => this.off(eventName, callback);
    }
    
    /**
     * Abonelikten çık
     * @param {string} eventName - Olay adı
     * @param {Function} callback - Kaldırılacak callback fonksiyonu
     */
    off(eventName, callback) {
        if (!this.events[eventName]) return;
        
        this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
        
        if (this.debugMode) {
            console.log(`EventBus: '${eventName}' olayından bir dinleyici kaldırıldı`);
        }
    }
    
    /**
     * Bir kez için olaya abone ol
     * @param {string} eventName - Olay adı
     * @param {Function} callback - Tetiklendiğinde çalıştırılacak fonksiyon
     */
    once(eventName, callback) {
        const onceCallback = (...args) => {
            callback(...args);
            this.off(eventName, onceCallback);
        };
        
        return this.on(eventName, onceCallback);
    }
    
    /**
     * Olay yayınla
     * @param {string} eventName - Olay adı
     * @param {any} data - Olayla birlikte gönderilecek veri
     */
    emit(eventName, data) {
        if (!this.events[eventName]) return;
        
        if (this.debugMode) {
            console.log(`EventBus: '${eventName}' olayı yayınlandı`, data || '');
        }
        
        this.events[eventName].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`EventBus: '${eventName}' olayı işlenirken hata:`, error);
            }
        });
    }
    
    /**
     * Bir olayın dinleyici sayısını al
     * @param {string} eventName - Olay adı
     * @returns {number} Dinleyici sayısı
     */
    listenerCount(eventName) {
        return this.events[eventName]?.length || 0;
    }
    
    /**
     * Tüm olayları temizle
     */
    clear() {
        this.events = {};
        
        if (this.debugMode) {
            console.log('EventBus: Tüm olay dinleyicileri temizlendi');
        }
    }
    
    /**
     * Belirli bir olayın tüm dinleyicilerini temizle
     * @param {string} eventName - Olay adı
     */
    clearEvent(eventName) {
        if (this.events[eventName]) {
            delete this.events[eventName];
            
            if (this.debugMode) {
                console.log(`EventBus: '${eventName}' olayının tüm dinleyicileri temizlendi`);
            }
        }
    }
}

// Global erişim için EventBus nesnesini oluştur
window.EventBus = new EventBusService();

// ES module uyumluluğu
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EventBus: window.EventBus };
}
