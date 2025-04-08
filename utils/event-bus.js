/**
 * Event Bus
 * Uygulama genelinde olay yayın ve dinleme işlemlerini yönetir
 */

// Event Bus sınıfı
class EventBus {
    constructor() {
        this.events = {};
        console.log('EventBus oluşturuldu');
    }
    
    // Olay dinleyicisi ekle
    on(event, callback) {
        // Eğer bu olay için array yoksa oluştur
        if (!this.events[event]) {
            this.events[event] = [];
        }
        
        this.events[event].push(callback);
        return this; // Method chaining için
    }
    
    // Olay dinleyicisini kaldır
    off(event, callback) {
        if (!this.events[event]) return this;
        
        this.events[event] = this.events[event].filter(cb => cb !== callback);
        return this;
    }
    
    // Bir kez çalışacak olay dinleyicisi ekle
    once(event, callback) {
        const onceCallback = (...args) => {
            this.off(event, onceCallback);
            callback.apply(this, args);
        };
        
        return this.on(event, onceCallback);
    }
    
    // Olay yayınla
    emit(event, ...args) {
        if (!this.events[event]) return this;
        
        this.events[event].forEach(callback => {
            try {
                callback.apply(this, args);
            } catch (error) {
                console.error(`Event handler for ${event} caused an error:`, error);
            }
        });
        
        return this;
    }
    
    // Tüm olayları listele
    listEvents() {
        const eventList = {};
        
        for (const event in this.events) {
            eventList[event] = this.events[event].length;
        }
        
        return eventList;
    }
}

// Global olarak eventBus'ı ata
window.eventBus = new EventBus();

console.log('EventBus yüklendi ve hazır');
