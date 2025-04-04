/**
 * ai-connector.js
 * Mehmet Endüstriyel Takip - AI Bağlantı Modülü
 * Chatbot ve yapay zeka fonksiyonlarının dış servislerle bağlantısını sağlar
 */

// ES Modül importları yerine global değişkenleri kullan
// import AppConfig from '../../config/app-config.js';
// import Logger from '../../utils/logger.js';

/**
 * AI Connector Sınıfı
 * Çeşitli AI servisleri için tek bir arayüz sağlar
 */
class AIConnector {
    constructor() {
        // Yapılandırmayı global AppConfig'den al
        this.config = window.AppConfig ? window.AppConfig.ai : {};
        this.isConnected = false;
        this.modelType = this.config?.modelType || 'deepseek';
        this.initialized = false;
        this.erpService = null;
        this.fetchOptions = {
            cache: 'no-store',
            credentials: 'same-origin'
        };
        
        // Demo mod kontrolü
        this.isDemoMode = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          window.location.hostname.includes('netlify.app') ||
                          window.location.search.includes('demo=true');
        
        // Logger varsa kullan, yoksa console.log kullan
        if (window.Logger) {
            window.Logger.info("AI Connector başlatıldı, model tipi:", this.modelType);
        } else {
            console.log("AI Connector başlatıldı, model tipi:", this.modelType);
        }
        
        // Local storage'dan API key'i al (güvenli bir şekilde saklanmalı, sadece demo amaçlı)
        if (localStorage.getItem('ai_api_key')) {
            this.apiKey = localStorage.getItem('ai_api_key');
            this.isConnected = true;
        }
    }
    
    /**
     * AI servisini başlat
     * @param {Object} erpService ERP servis bağlantısı
     */
    async init(erpService) {
        if (this.initialized) return;
        
        this.erpService = erpService;
        
        try {
            // Yapay zeka bağlantısını kontrol et
            if (this.config && this.config.enabled) {
                const connectionResult = await this.checkConnection();
                this.isConnected = connectionResult.success;
                
                if (this.isConnected) {
                    this.log('info', `AI bağlantısı başarılı: ${this.modelType} modeli kullanılıyor`);
                } else {
                    this.log('warn', `AI bağlantısı başarısız: ${connectionResult.error}`);
                }
            } else {
                this.log('info', 'AI servisi yapılandırmada devre dışı bırakılmış');
                this.isConnected = false;
            }
            
            this.initialized = true;
        } catch (error) {
            this.log('error', 'AI servisi başlatılırken hata oluştu:', error);
            this.isConnected = false;
            this.initialized = true; // Hataya rağmen başlatıldı kabul et
        }
    }
    
    // Logger yardımcı metodu
    log(level, message, data) {
        if (window.Logger) {
            window.Logger[level](message, data);
        } else {
            console[level === 'info' ? 'log' : level](message, data);
        }
    }
    
    /**
     * AI bağlantısını kontrol et
     * @returns {Object} Bağlantı durumu
     */
    async checkConnection() {
        if (this.isDemoMode) {
            return Promise.resolve({ success: true, status: 'connected', message: 'Demo modu aktif' });
        }
        
        if (!this.apiKey) {
            return Promise.resolve({ success: false, status: 'disconnected', message: 'API anahtarı tanımlanmamış' });
        }
        
        try {
            switch (this.modelType) {
                case 'deepseek':
                    // DeepSeek API bağlantı kontrolü
                    const deepseekResponse = await fetch('/api/ai/check-connection', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ modelType: 'deepseek' }),
                        ...this.fetchOptions
                    });
                    
                    if (deepseekResponse.ok) {
                        return { success: true };
                    }
                    
                    return { 
                        success: false, 
                        error: `DeepSeek API bağlantı hatası: ${deepseekResponse.status}` 
                    };
                
                case 'openai':
                    // OpenAI API bağlantı kontrolü
                    const openaiResponse = await fetch('/api/ai/check-connection', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ modelType: 'openai' }),
                        ...this.fetchOptions
                    });
                    
                    if (openaiResponse.ok) {
                        return { success: true };
                    }
                    
                    return { 
                        success: false, 
                        error: `OpenAI API bağlantı hatası: ${openaiResponse.status}` 
                    };
                
                case 'hybrid':
                    // İlk olarak hızlı ve yerel modeli dene
                    const localResponse = await fetch('/api/ai/check-connection', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ modelType: 'local' }),
                        ...this.fetchOptions
                    });
                    
                    if (localResponse.ok) {
                        return { success: true, model: 'local' };
                    }
                    
                    // Yerel model başarısız olursa, OpenAI'ya geç
                    const fallbackResponse = await fetch('/api/ai/check-connection', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ modelType: 'openai' }),
                        ...this.fetchOptions
                    });
                    
                    if (fallbackResponse.ok) {
                        return { success: true, model: 'openai' };
                    }
                    
                    return { 
                        success: false, 
                        error: 'Hiçbir AI servisi bağlantısı kurulamadı' 
                    };
                
                default:
                    return { 
                        success: false, 
                        error: `Bilinmeyen model tipi: ${this.modelType}` 
                    };
            }
        } catch (error) {
            this.log('error', 'AI bağlantı kontrolü sırasında hata:', error);
            return { 
                success: false, 
                error: error.message || 'Bağlantı hatası' 
            };
        }
    }
    
    // API anahtarını ayarla
    setApiKey(apiKey) {
        if (!apiKey) return false;
        
        this.apiKey = apiKey;
        this.isConnected = true;
        
        // Demo amaçlı local storage'a kaydet (üretimde kesinlikle yapılmamalı)
        if (this.isDemoMode) {
            localStorage.setItem('ai_api_key', apiKey);
        }
        
        return true;
    }
    
    // Metin üret (chatbot için)
    async generateText(prompt, context = [], maxTokens = 150) {
        if (this.isDemoMode) {
            return this.generateDemoResponse(prompt, context);
        }
        
        if (!this.isConnected || !this.apiKey) {
            return Promise.reject({ status: 'error', message: 'AI servisine bağlantı yok' });
        }
        
        try {
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: prompt,
                    context: context,
                    model: this.modelType,
                    max_tokens: maxTokens
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.text;
            } else {
                throw new Error('AI metin üretme hatası');
            }
        } catch (error) {
            this.log('error', 'AI metin üretme hatası:', error);
            return this.generateDemoResponse(prompt, context);
        }
    }
    
    // Demo yanıt üret
    generateDemoResponse(prompt, context = []) {
        const lowerPrompt = prompt.toLowerCase();
        let response = '';
        
        // Basit sohbet yanıtları
        if (lowerPrompt.includes('merhaba') || lowerPrompt.includes('selam')) {
            response = 'Merhaba! Size nasıl yardımcı olabilirim?';
        } 
        else if (lowerPrompt.includes('teşekkür')) {
            response = 'Rica ederim! Başka bir konuda yardıma ihtiyacınız olursa bana sorabilirsiniz.';
        }
        // Sipariş ile ilgili sorular
        else if (lowerPrompt.includes('sipariş') && lowerPrompt.includes('durum')) {
            response = 'Siparişlerinizi "Siparişler" sayfasından görüntüleyebilirsiniz. Belirli bir sipariş kodu belirtirseniz, o sipariş hakkında daha detaylı bilgi verebilirim.';
        }
        else if (lowerPrompt.includes('sipariş') && lowerPrompt.includes('oluştur')) {
            response = 'Yeni sipariş oluşturmak için "Siparişler" sayfasına gidip "Yeni Sipariş" butonuna tıklayabilirsiniz.';
        }
        // Stok ile ilgili sorular
        else if (lowerPrompt.includes('stok') || lowerPrompt.includes('malzeme')) {
            response = 'Stok ve malzeme bilgilerini "Stok Yönetimi" sayfasından kontrol edebilirsiniz.';
        }
        // Üretim ile ilgili sorular
        else if (lowerPrompt.includes('üretim') || lowerPrompt.includes('plan')) {
            response = 'Üretim planları ve ilerleme durumunu "Üretim" sayfasından takip edebilirsiniz.';
        }
        // Genel yardım
        else if (lowerPrompt.includes('yardım') || lowerPrompt.includes('nasıl')) {
            response = 'Size nasıl yardımcı olabilirim? Siparişler, stok durumu, üretim planlaması veya satın alma talepleri hakkında sorular sorabilirsiniz.';
        }
        // Varsayılan yanıt
        else {
            response = 'Üzgünüm, bu konuda bilgim sınırlı. Size siparişler, stok durumu veya üretim planlaması konularında yardımcı olabilirim.';
        }
        
        return Promise.resolve(response);
    }
    
    // Malzeme tahmini yap
    async predictMaterials(orderData) {
        if (this.isDemoMode) {
            return this.generateDemoPrediction(orderData);
        }
        
        // Hücre tipine göre varsayılan malzeme listesini al
        const defaultMaterials = this.getLocalMaterialList(orderData.cellType);
        
        // Yapay zeka bağlı değilse yerel listeyi döndür
        if (!this.isConnected) {
            this.log('warn', 'AI servisi bağlı değil, yerel malzeme listesi kullanılıyor');
            return {
                materials: defaultMaterials,
                source: 'local',
                estimatedDays: this.getLocalProductionTime(orderData)
            };
        }
        
        try {
            // Hücre tipi ve detaylarına göre malzeme tahmini yap
            const promptData = {
                order: orderData,
                timestamp: new Date().toISOString()
            };
            
            const response = await fetch('/api/ai/predict-materials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    modelType: this.modelType,
                    prompt: promptData
                }),
                ...this.fetchOptions
            });
            
            if (!response.ok) {
                throw new Error(`Malzeme tahmini hatası: ${response.status}`);
            }
            
            const result = await response.json();
            
            // Sonuç kontrolü
            if (!result.materials || !Array.isArray(result.materials) || result.materials.length === 0) {
                this.log('warn', 'AI malzeme tahmini boş sonuç döndürdü, varsayılan malzeme listesi kullanılıyor');
                return {
                    materials: defaultMaterials,
                    source: 'local',
                    estimatedDays: this.getLocalProductionTime(orderData)
                };
            }
            
            return {
                materials: result.materials,
                source: 'ai',
                estimatedDays: result.estimatedDays || this.getLocalProductionTime(orderData)
            };
            
        } catch (error) {
            this.log('error', 'Malzeme tahmini hatası:', error);
            return {
                materials: defaultMaterials,
                source: 'local',
                estimatedDays: this.getLocalProductionTime(orderData),
                error: error.message
            };
        }
    }
    
    // Demo tahmin üret
    generateDemoPrediction(orderData) {
        // Demo için basit bir tahmin yapısı
        const materials = this.getLocalMaterialList(orderData.cellType);
        const estimatedDays = this.getLocalProductionTime(orderData);
        
        return Promise.resolve({
            materials: materials,
            source: 'demo',
            estimatedDays: estimatedDays
        });
    }

    /**
     * Stok verilerinden anlamlı özellik çıkarımı yap
     * @param {Array} stockData Ham stok verileri
     * @returns {Promise<Object>} Analiz sonuçları
     */
    async analyzeStockData(stockData) {
        if (!this.isConnected) {
            this.log('warn', 'AI servisi bağlı değil, stok analizi yapılamıyor');
            return {
                success: false,
                error: "AI servisi şu anda kullanılamıyor."
            };
        }
        
        try {
            // Stok verilerini analiz et (düşük stok, satın alma önerileri, vb.)
            const promptData = {
                stockData: this.simplifyStockData(stockData),
                timestamp: new Date().toISOString()
            };
            
            const response = await fetch('/api/ai/analyze-stock', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    modelType: this.modelType,
                    prompt: promptData
                }),
                ...this.fetchOptions
            });
            
            if (!response.ok) {
                throw new Error(`Stok analizi hatası: ${response.status}`);
            }
            
            return await response.json();
            
        } catch (error) {
            this.log('error', 'Stok analizi hatası:', error);
            return {
                success: false,
                error: error.message || "Stok analizi yapılırken bir hata oluştu."
            };
        }
    }

    /**
     * ERP verilerini basitleştir (boyutu küçültmek için)
     */
    simplifyOrderData(orders) {
        return orders.map(order => ({
            id: order.id,
            orderId: order.orderId || order.orderNo,
            customer: order.customer,
            status: order.status,
            cellType: order.cellType,
            cellCount: order.cellCount,
            orderDate: order.orderDate,
            deliveryDate: order.deliveryDate,
            progress: order.progress,
            priority: order.priority,
            materialStatus: order.materialStatus
        }));
    }

    simplifyStockData(stockData) {
        return stockData.map(item => ({
            code: item.code,
            name: item.name,
            currentStock: item.currentStock || item.quantity,
            minStock: item.minStock || item.minQuantity,
            unit: item.unit,
            status: item.status
        }));
    }

    /**
     * Hücre tipine göre yerel malzeme listesi döndür (yapay zeka yoksa kullanılır)
     * @param {string} cellType Hücre tipi
     * @returns {Array} Malzeme listesi
     */
    getLocalMaterialList(cellType) {
        // Farklı hücre tipleri için temel malzeme listeleri
        const materialLists = {
            'rm 36 cb': [
                { code: 'M001', name: 'Hücre Gövdesi (RM 36 CB)', quantity: 1, unit: 'adet' },
                { code: 'M002', name: 'Kesici Şalter', quantity: 1, unit: 'adet' },
                { code: 'M003', name: 'Kontrol Rölesi', quantity: 1, unit: 'adet' },
                { code: 'M004', name: 'Bara Seti', quantity: 1, unit: 'set' },
                { code: 'M005', name: 'Kablaj Seti', quantity: 1, unit: 'set' },
                { code: 'M006', name: 'Bağlantı Parçaları', quantity: 1, unit: 'set' },
                { code: 'M007', name: 'İzolasyon Malzemesi', quantity: 2, unit: 'metre' },
                { code: 'M008', name: 'Koruma Plakası', quantity: 1, unit: 'adet' }
            ],
            'rm 36 lb': [
                { code: 'M001', name: 'Hücre Gövdesi (RM 36 LB)', quantity: 1, unit: 'adet' },
                { code: 'M002', name: 'Yük Ayırıcı', quantity: 1, unit: 'adet' },
                { code: 'M003', name: 'Bara Seti', quantity: 1, unit: 'set' },
                { code: 'M004', name: 'Kablaj Seti', quantity: 1, unit: 'set' },
                { code: 'M005', name: 'Bağlantı Parçaları', quantity: 1, unit: 'set' },
                { code: 'M006', name: 'İzolasyon Malzemesi', quantity: 1.5, unit: 'metre' },
                { code: 'M007', name: 'Koruma Plakası', quantity: 1, unit: 'adet' }
            ],
            'rm 36 fl': [
                { code: 'M001', name: 'Hücre Gövdesi (RM 36 FL)', quantity: 1, unit: 'adet' },
                { code: 'M002', name: 'Sigorta Seti', quantity: 1, unit: 'set' },
                { code: 'M003', name: 'Yük Ayırıcı', quantity: 1, unit: 'adet' },
                { code: 'M004', name: 'Bara Seti', quantity: 1, unit: 'set' },
                { code: 'M005', name: 'Kablaj Seti', quantity: 1, unit: 'set' },
                { code: 'M006', name: 'Bağlantı Parçaları', quantity: 1, unit: 'set' },
                { code: 'M007', name: 'İzolasyon Malzemesi', quantity: 2, unit: 'metre' },
                { code: 'M008', name: 'Koruma Plakası', quantity: 1, unit: 'adet' }
            ],
            'rm 36 mb': [
                { code: 'M001', name: 'Hücre Gövdesi (RM 36 MB)', quantity: 1, unit: 'adet' },
                { code: 'M002', name: 'Ölçü Cihazları Seti', quantity: 1, unit: 'set' },
                { code: 'M003', name: 'Bara Seti', quantity: 1, unit: 'set' },
                { code: 'M004', name: 'Ölçü Trafoları', quantity: 3, unit: 'adet' },
                { code: 'M005', name: 'Kablaj Seti', quantity: 1, unit: 'set' },
                { code: 'M006', name: 'Bağlantı Parçaları', quantity: 1, unit: 'set' },
                { code: 'M007', name: 'İzolasyon Malzemesi', quantity: 1, unit: 'metre' },
                { code: 'M008', name: 'Koruma Plakası', quantity: 1, unit: 'adet' }
            ]
        };
        
        // Tipi küçük harfe çevir, basitleştir
        const simplifiedType = cellType ? cellType.toLowerCase().replace(/\s+/g, ' ').trim() : 'unknown';
        
        // Tam eşleşme kontrol et
        if (materialLists[simplifiedType]) {
            return materialLists[simplifiedType];
        }
        
        // Kısmi eşleşme kontrol et
        for (const type in materialLists) {
            if (simplifiedType.includes(type) || type.includes(simplifiedType)) {
                return materialLists[type];
            }
        }
        
        // Varsayılan liste (tip bilinmiyorsa)
        return materialLists['rm 36 cb'] || [];
    }

    /**
     * Sipariş verilerine göre basit üretim süresi tahmini yap
     * @param {Object} orderData Sipariş verisi
     * @returns {number} Tahmini üretim süresi (gün)
     */
    getLocalProductionTime(orderData) {
        if (!orderData) return 10; // Varsayılan
        
        // Hücre tipi ve adedine göre temel tahmin
        const cellType = orderData.cellType ? orderData.cellType.toLowerCase() : '';
        const cellCount = orderData.cellCount || 1;
        
        // Tip başına temel gün sayısı
        let baseDays = 10; // Varsayılan
        
        if (cellType.includes('cb')) {
            baseDays = 7;
        } else if (cellType.includes('lb')) {
            baseDays = 6;
        } else if (cellType.includes('fl')) {
            baseDays = 8;
        } else if (cellType.includes('mb')) {
            baseDays = 9;
        }
        
        // Her ek hücre için %60 süre ekle (tam lineer değil)
        const totalDays = Math.ceil(baseDays * (1 + (cellCount - 1) * 0.6));
        
        // Teknik gereksinimlere göre ek süre
        let complexityFactor = 1.0;
        
        // Teknik detaylar varsa, karmaşıklık faktörünü ayarla
        if (orderData.technicalDetails) {
            const tech = orderData.technicalDetails;
            
            // Özel gereksinimler varsa %20 ekle
            if (tech.specialRequirements && tech.specialRequirements.length > 0) {
                complexityFactor += 0.2;
            }
            
            // Test gereksinimleri varsa %10 ekle
            if (tech.testingRequirements && tech.testingRequirements.length > 0) {
                complexityFactor += 0.1;
            }
            
            // Standartlar sıkıysa %10 ekle
            if (tech.standards && tech.standards.length > 2) {
                complexityFactor += 0.1;
            }
        }
        
        // Son tahmini hesapla
        return Math.ceil(totalDays * complexityFactor);
    }
}

// Global olarak dışa aktar
window.AIConnector = new AIConnector();

// AI servisi için kısa bir yardımcı
window.AIService = window.AIConnector;
