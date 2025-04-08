/**
 * AI Entegrasyon Modülü
 * Tüm yapay zeka özelliklerini sistemle entegre eder
 */

// AI Entegrasyon sınıfı
class AIIntegration {
    constructor() {
        this.initialized = false;
        this.services = {};
        
        this.init();
    }
    
    init() {
        console.log('AI modülleri başarıyla yüklendi');
        
        // Uygulama başlatıldığında AI entegrasyonunu gerçekleştir
        window.eventBus?.on('app:initialized', () => {
            this.integrate();
        });
        
        this.initialized = true;
    }
    
    integrate() {
        console.log('Yapay Zeka modülleri yükleniyor...');
        
        // AI servisleri kontrol et ve bağla
        if (window.aiService) {
            this.services.aiService = window.aiService;
        }
        
        // Chatbot kontrolü
        if (window.chatbot) {
            this.services.chatbot = window.chatbot;
            
            // Demo bildirim
            setTimeout(() => {
                this.services.chatbot.showNotification(3);
            }, 5000);
        }
        
        console.log('AI yetenekleri entegre edildi');
    }
}

// AI entegrasyonunu başlat
window.aiIntegration = new AIIntegration();

console.log('AI Entegrasyon Modülü başarıyla başlatıldı');