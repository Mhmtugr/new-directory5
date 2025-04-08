/**
 * AI Servisi
 * Yapay zeka ile ilgili tüm istekleri ve işlevleri yöneten servis
 */

// Logger oluştur
const log = window.logger ? window.logger('AIService') : console;

// AI Servisi sınıfı
class AIService {
    constructor() {
        this.config = window.appConfig?.ai || {};
        this.initialized = false;
        this.context = [];
        
        this.init();
    }
    
    init() {
        log.info('AI Servisi başlatılıyor...');
        
        // Gelişmiş AI modülü kontrolü
        if (window.advancedAI) {
            this.advancedAI = window.advancedAI;
            log.info('Gelişmiş AI modülü bulundu ve entegre edildi');
        } else {
            log.warn('Gelişmiş AI modülü bulunamadı, basit AI kullanılacak');
        }
        
        this.initialized = true;
    }
    
    async query(message, options = {}) {
        if (!this.initialized) {
            log.warn('AI Servisi başlatılmadı');
            return { error: 'AI Servisi başlatılmadı' };
        }
        
        try {
            log.info('AI sorgulama:', message);
            
            // Gelişmiş AI varsa onu kullan
            if (this.advancedAI) {
                return await this.advancedAI.processQuery(message, options);
            }
            
            // Basit yanıt oluştur
            return this.generateSimpleResponse(message);
        } catch (error) {
            log.error('AI sorgulaması sırasında hata', error);
            return { error: 'AI sorgulaması sırasında bir hata oluştu' };
        }
    }
    
    generateSimpleResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('merhaba') || lowerMessage.includes('selam')) {
            return { 
                type: 'text',
                content: 'Merhaba! Size nasıl yardımcı olabilirim?'
            };
        }
        
        if (lowerMessage.includes('sipariş')) {
            return { 
                type: 'text',
                content: 'Siparişler modülünden sipariş durumunu kontrol edebilirsiniz.'
            };
        }
        
        if (lowerMessage.includes('malzeme') || lowerMessage.includes('stok')) {
            return { 
                type: 'text',
                content: 'Malzeme yönetimi modülünden stok durumunu kontrol edebilirsiniz.'
            };
        }
        
        return { 
            type: 'text',
            content: 'Üzgünüm, sorunuzu anlamadım. Lütfen daha açık bir şekilde ifade eder misiniz?'
        };
    }
    
    analyzeProductionData(data) {
        if (this.advancedAI) {
            return this.advancedAI.analyzeProduction(data);
        }
        
        return { 
            insights: ['Veri analizi için gelişmiş AI modülü gereklidir'],
            recommendations: ['Gelişmiş AI modülünü etkinleştirin']
        };
    }
    
    predictMaterialRequirements(orders, inventory) {
        if (this.advancedAI) {
            return this.advancedAI.predictMaterialNeeds(orders, inventory);
        }
        
        return {
            materials: [],
            message: 'Tahmin için gelişmiş AI modülü gereklidir'
        };
    }
}

// Global olarak ai-service'i ata
window.aiService = new AIService();

log.info('AI Servisi başarıyla yüklendi');