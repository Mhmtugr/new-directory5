/**
 * event-bus.js
 * Uygulama içi olay iletişimi için kullanılan Event Bus modülü
 */

class EventBus {
    constructor() {
        this.events = {};
        this.history = [];
        this.maxHistoryLength = 100; // Son 100 olayı sakla
        this.debug = false;
    }
    
    /**
     * Debug modunu etkinleştir/devre dışı bırak
     * @param {boolean} enabled Debug modu durumu
     */
    setDebug(enabled) {
        this.debug = !!enabled;
        return this;
    }
    
    /**
     * Bir olaya abone ol
     * @param {string} event Olay adı
     * @param {Function} callback Olay gerçekleştiğinde çağrılacak fonksiyon
     * @param {Object} context Callback içindeki 'this' değeri için bağlam
     * @returns {Function} Dinleyiciyi kaldırmak için kullanılabilecek fonksiyon
     */
    on(event, callback, context = null) {
        // Olaylar dizisini oluştur (yoksa)
        if (!this.events[event]) {
            this.events[event] = [];
        }
        
        // Callback ve bağlamı kaydet
        const listener = {
            callback: callback,
            context: context
        };
        
        this.events[event].push(listener);
        
        // Dinleyiciyi kaldırmak için kullanılabilecek fonksiyonu döndür
        return () => this.off(event, callback, context);
    }
    
    /**
     * Bir olaydan aboneliği kaldır
     * @param {string} event Olay adı
     * @param {Function} callback Kaldırılacak callback fonksiyonu
     * @param {Object} context Callback için bağlam
     */
    off(event, callback, context = null) {
        // Olay yoksa yapacak bir şey yok
        if (!this.events[event]) return;
        
        // Filtrele: Eşleşmeyen dinleyicileri tut
        this.events[event] = this.events[event].filter(listener => {
            return (listener.callback !== callback || listener.context !== context);
        });
        
        // Dinleyici kalmadıysa olayı temizle
        if (this.events[event].length === 0) {
            delete this.events[event];
        }
    }
    
    /**
     * Bir kez tetiklenecek olay dinleyicisi ekle
     * @param {string} event Olay adı
     * @param {Function} callback Callback fonksiyonu 
     * @param {Object} context Callback için bağlam
     */
    once(event, callback, context = null) {
        const removeListener = this.on(event, (...args) => {
            removeListener();
            callback.apply(context, args);
        }, context);
        
        return removeListener;
    }
    
    /**
     * Bir olayı tetikle ve dinleyicilere veri gönder
     * @param {string} event Olay adı
     * @param {any} data Dinleyicilere gönderilecek veri
     */
    emit(event, data) {
        // Geçmişe ekle
        this.addToHistory(event, data);
        
        // Debug mod kontrolü
        if (this.debug) {
            console.log(`[EventBus] Event: ${event}`, data);
        }
        
        // Olay yoksa yapacak bir şey yok
        if (!this.events[event]) return;
        
        // Tüm dinleyicileri çağır
        this.events[event].forEach(listener => {
            try {
                listener.callback.call(listener.context, data);
            } catch (error) {
                console.error(`[EventBus] Error in event listener for ${event}:`, error);
            }
        });
    }
    
    /**
     * Geçmişe olay ekle
     * @param {string} event Olay adı
     * @param {any} data Olay verisi
     * @private
     */
    addToHistory(event, data) {
        this.history.push({
            event: event,
            data: data,
            timestamp: new Date()
        });
        
        // Geçmiş maksimum uzunluğu aşıyorsa kırp
        if (this.history.length > this.maxHistoryLength) {
            this.history = this.history.slice(-this.maxHistoryLength);
        }
    }
    
    /**
     * Olay geçmişini döndür 
     * @returns {Array} Olay geçmişi
     */
    getHistory() {
        return this.history;
    }
    
    /**
     * Belirli bir olay için geçmişi döndür
     * @param {string} event Olay adı
     * @returns {Array} Filtrelenmiş olay geçmişi
     */
    getHistoryByEvent(event) {
        return this.history.filter(item => item.event === event);
    }
}

// Tek bir örnek oluştur (singleton)
const instance = new EventBus();

// EventBus'ı global window nesnesine ekle
window.EventBus = instance;

// ES Modüllerini destekleyen ortamlarda da çalışması için
if (typeof module !== 'undefined' && module.exports) {
    module.exports = instance;
}
