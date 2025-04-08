/**
 * AI Servisi
 * DeepSeek AI entegrasyonu için API ve yardımcı fonksiyonlar
 */

// AI Servisi sınıfı
class AIService {
    constructor() {
        this.config = {
            apiKey: window.DEEPSEEK_API_KEY || 'sk-3a17ae40b3e445528bc988f04805e54b',
            modelName: 'deepseek-chat',
            temperature: 0.7,
            maxTokens: 1000
        };
        this.initialized = false;
        this.context = [];
        
        this.init();
    }
    
    init() {
        console.log('AI Servisi başlatılıyor...');
        
        // Sistem mesajlarını hazırla
        this.systemPrompt = `
            Sen MehmetEndüstriyelTakip sisteminin yapay zeka asistanısın.
            Orta Gerilim Hücre Üretim Takip Sistemi hakkında uzman bir asistan olarak görev yapıyorsun.
            Her zaman doğru, net ve teknik bilgileri içeren yanıtlar vermelisin.
            Sistemdeki sipariş durumları, malzeme stokları ve teknik dokümantasyon hakkında detaylı bilgi sahibisin.
            Eğer sorular net değilse, daha net bilgi iste ve kullanıcıyı yönlendir.
        `;
        
        this.initialized = true;
        console.log('AI Servisi başlatıldı');
    }
    
    async query(message, options = {}) {
        if (!this.initialized) {
            console.warn('AI Servisi başlatılmadı');
            return { error: 'AI Servisi başlatılmadı' };
        }
        
        try {
            console.log('AI sorgulama:', message);
            
            // Sistem verilerini al
            const systemData = await this.getSystemData();
            
            // DeepSeek API entegrasyonu için hazırlık
            const context = this.prepareContext(message, systemData);
            
            // Demo modu veya gerçek API çağrısı
            if (options.demo) {
                return this.generateDemoResponse(message, systemData);
            } else {
                return this.callDeepSeekAPI(context);
            }
        } catch (error) {
            console.error('AI sorgulaması sırasında hata', error);
            return { error: 'AI sorgulaması sırasında bir hata oluştu', details: error.message };
        }
    }
    
    prepareContext(message, systemData) {
        // DeepSeek API için bağlam hazırla
        const ordersSummary = systemData.orders.map(o => 
            `Sipariş No: ${o.id}, Müşteri: ${o.customer}, Hücre Tipi: ${o.cellType}, Durum: ${o.status}, İlerleme: %${o.progress}`
        ).join('\n');
        
        const materialsSummary = systemData.materials.map(m => 
            `Kod: ${m.code}, Malzeme: ${m.name}, Stok: ${m.stock}, İhtiyaç: ${m.required}, Durum: ${m.status}`
        ).join('\n');
        
        const docsSummary = systemData.technicalDocs.map(d => 
            `Doküman: ${d.name}, Tarih: ${d.date}`
        ).join('\n');
        
        return [
            { role: "system", content: this.systemPrompt },
            { role: "system", content: "Mevcut sipariş bilgileri:\n" + ordersSummary },
            { role: "system", content: "Mevcut malzeme bilgileri:\n" + materialsSummary },
            { role: "system", content: "Mevcut teknik dokümanlar:\n" + docsSummary },
            { role: "user", content: message }
        ];
    }
    
    async callDeepSeekAPI(context) {
        // Demo modda gerçek API çağrısı yapmıyoruz
        // Gerçek uygulamada burada DeepSeek API'ye istek yapılabilir
        return window.generateAIResponse(context[context.length - 1].content, await this.getSystemData());
    }
    
    async getSystemData() {
        // Demo verileri (gerçek uygulamada API'den alınacak)
        return {
            orders: [
                { id: '#0424-1251', customer: 'AYEDAŞ', cellType: 'RM 36 CB', status: 'Gecikiyor', progress: 65 },
                { id: '#0424-1245', customer: 'TEİAŞ', cellType: 'RM 36 CB', status: 'Devam Ediyor', progress: 45 },
                { id: '#0424-1239', customer: 'BEDAŞ', cellType: 'RM 36 LB', status: 'Devam Ediyor', progress: 30 },
                { id: '#0424-1235', customer: 'OSMANİYE ELEKTRİK', cellType: 'RM 36 FL', status: 'Planlandı', progress: 10 }
            ],
            materials: [
                { code: '137998%', name: 'Siemens 7SR1003-1JA20-2DA0+ZY20 24VDC', stock: 2, required: 8, status: 'Kritik' },
                { code: '144866%', name: 'KAP-80/190-95 Akım Trafosu', stock: 3, required: 5, status: 'Düşük' },
                { code: '120170%', name: 'M480TB/G-027-95.300UN5 Kablo Başlığı', stock: 12, required: 15, status: 'Düşük' },
                { code: '109367%', name: '582mm Bara', stock: 25, required: 18, status: 'Yeterli' }
            ],
            technicalDocs: [
                { name: 'RM 36 CB Teknik Çizim', date: '15.10.2024', content: 'RM 36 CB hücresine ait teknik çizim detayları...' },
                { name: 'RM 36 LB Montaj Talimatı', date: '10.10.2024', content: 'RM 36 LB hücresi montaj talimatları...' },
                { name: 'Akım Trafosu Seçim Kılavuzu', date: '01.10.2024', content: 'Akım trafolarının seçimine ilişkin teknik bilgiler...' }
            ]
        };
    }
    
    generateDemoResponse(message, systemData) {
        // Demo yanıtlar için kod index.html dosyasında window.generateAIResponse içerisinde
        return { 
            type: 'text',
            content: window.generateAIResponse(message, systemData)
        };
    }
}

// Global olarak ai-service'i ata
window.aiService = new AIService();

console.log('AI Servisi başarıyla yüklendi');