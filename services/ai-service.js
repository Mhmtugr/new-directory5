/**
 * AI Servisi
 */

// AI Servisi sınıfı
class AIService {
    constructor() {
        this.config = window.appConfig?.ai || {};
        this.initialized = false;
        this.context = [];
        
        this.init();
    }
    
    init() {
        console.log('AI Servisi başlatılıyor...');
        this.initialized = true;
    }
    
    async query(message, options = {}) {
        if (!this.initialized) {
            console.warn('AI Servisi başlatılmadı');
            return { error: 'AI Servisi başlatılmadı' };
        }
        
        try {
            console.log('AI sorgulama:', message);
            
            // Demo yanıt
            return this.generateDemoResponse(message);
        } catch (error) {
            console.error('AI sorgulaması sırasında hata', error);
            return { error: 'AI sorgulaması sırasında bir hata oluştu' };
        }
    }
    
    generateDemoResponse(message) {
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
        
        if (lowerMessage.includes('hücre') || lowerMessage.includes('rm 36')) {
            return {
                type: 'text',
                content: 'RM 36 hücre tipleri: CB (Kesicili), LB (Yük Ayırıcılı), FL (Sigortalı). Daha detaylı bilgi için teknik dokümanlar bölümüne bakabilirsiniz.'
            };
        }
        
        return { 
            type: 'text',
            content: 'Üzgünüm, sorunuzu anlamadım. Daha açık bir şekilde ifade edebilir misiniz?'
        };
    }
}

// Global olarak ai-service'i ata
window.aiService = new AIService();

console.log('AI Servisi başarıyla yüklendi');