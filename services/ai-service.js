/**
 * ai-service.js
 * Yapay zeka servis fonksiyonları
 */

// Daha önce tanımlanmış mı kontrol et
if (window.AIService) {
    console.log("AIService zaten yüklenmiş, tekrar yükleme atlanıyor.");
} else {
    // Bağımlılıkları yükle
    let AppConfig, EventBus;
    
    try {
        // ES modülü olarak yüklemeyi dene
        if (typeof require !== 'undefined') {
            AppConfig = require('../config/app-config.js').default;
            EventBus = require('../utils/event-bus.js').default;
        } else {
            // Global değişkenlerden çek
            AppConfig = window.AppConfig || {};
            EventBus = window.EventBus || {
                emit: function(event, data) {
                    console.log(`EventBus emit (placeholder): ${event}`, data);
                    const customEvent = new CustomEvent(event, { detail: data });
                    document.dispatchEvent(customEvent);
                }
            };
        }
    } catch (error) {
        console.warn("Modüller dinamik olarak yüklenemedi:", error);
        
        // Alternatif: Global değişkenleri kullan
        AppConfig = window.AppConfig || {};
        EventBus = window.EventBus || {
            emit: function(event, data) {
                console.log(`EventBus emit (placeholder): ${event}`, data);
                const customEvent = new CustomEvent(event, { detail: data });
                document.dispatchEvent(customEvent);
            }
        };
    }
    
    // AIService sınıfı
    class AIService {
        static apiKey = AppConfig.ai?.deepseek?.apiKey || '';
        static model = AppConfig.ai?.deepseek?.model || 'deepseek-r1-llm';
        static maxTokens = AppConfig.ai?.deepseek?.maxTokens || 2000;
        static temperature = AppConfig.ai?.deepseek?.temperature || 0.7;
        
        /**
         * DeepSeek modeliyle yanıt üret
         * @param {string} question Kullanıcının sorusu
         * @param {string} context Bağlam (optional)
         * @returns {Promise<string>} Model yanıtı
         */
        static async askDeepSeek(question, context = "") {
            try {
                if (!this.apiKey) {
                    console.error("DeepSeek API anahtarı eksik");
                    throw new Error("API anahtarı tanımlanmamış");
                }
                
                console.log("DeepSeek API'sine sorgu gönderiliyor:", question);
                
                // API çağrısını simüle et (gerçek uygulama backend üzerinden yapmalı)
                // Bunu gerçek bir API çağrısıyla değiştirin
                try {
                    // API çağrısını yap
                    return await this.simulateAPICall(question, context);
                } catch (apiError) {
                    console.error("DeepSeek API hatası:", apiError);
                    // Fallback yanıta geri dön
                    return this.getLocalFallbackResponse(question);
                }
            } catch (error) {
                console.error("DeepSeek API hatası:", error);
                // Hata durumunda başarısız olduğunu bildir
                EventBus.emit('ai:error', { 
                    source: 'deepseek', 
                    error: error.message
                });
                
                // Yerel demo yanıtı dön
                return this.getLocalFallbackResponse(question);
            }
        }
        
        // API çağrısını simüle et
        static async simulateAPICall(question, context) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    // Gerçek API bağlantısı olmadığında yedek yanıtlar
                    resolve(this.getLocalFallbackResponse(question));
                }, 500);
            });
        }
        
        /**
         * Siparişe göre malzeme listesi tahmin et
         * @param {Object} orderDetails Sipariş detayları
         * @returns {Promise<Object>} Malzeme listesi ve tahmin bilgileri
         */
        static async predictMaterials(orderData) {
            try {
                if (!this.apiKey) {
                    throw new Error("API anahtarı tanımlanmamış");
                }
                
                // Sipariş verilerini kontrol et
                if (!orderData || !orderData.cellType) {
                    throw new Error("Geçersiz sipariş verileri");
                }
                
                // Prompta eklenecek sipariş bilgilerini hazırla
                const orderPrompt = `
                    Hücre Tipi: ${orderData.cellType}
                    Gerilim: ${orderData.voltage || 'Belirtilmemiş'}
                    Akım: ${orderData.current || 'Belirtilmemiş'}
                    Röle Tipi: ${orderData.relayType || 'Belirtilmemiş'}
                    Müşteri: ${orderData.customer || 'Belirtilmemiş'}
                    Adet: ${orderData.quantity || 1}
                `;
                
                // DeepSeek API'sine istek
                const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${this.apiKey}`
                    },
                    body: JSON.stringify({
                        model: this.model,
                        messages: [
                            {
                                role: "system",
                                content: "Sen bir orta gerilim hücre üretimi malzeme uzmanısın. Verilen sipariş bilgilerine göre gerekli malzemeleri ve miktarlarını JSON formatında listelemelisin."
                            },
                            {
                                role: "user",
                                content: `Aşağıdaki sipariş için gereken malzemelerin listesini ve miktarlarını JSON formatında oluştur:\n${orderPrompt}\n\nJSON formatında olmalı ve şu şekilde döndürülmeli: { "materials": [ { "code": "malzeme_kodu", "name": "malzeme_adı", "quantity": miktar }, ... ] }`
                            }
                        ],
                        max_tokens: this.maxTokens,
                        temperature: 0.3
                    })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`DeepSeek API Hatası: ${response.status} - ${errorData.error?.message || "Bilinmeyen hata"}`);
                }
                
                const data = await response.json();
                const content = data.choices[0].message.content;
                
                // JSON yanıtını ayrıştır
                try {
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const jsonStr = jsonMatch[0];
                        return JSON.parse(jsonStr);
                    }
                    throw new Error("JSON formatında yanıt alınamadı");
                } catch (e) {
                    console.error("JSON ayrıştırma hatası:", e);
                    throw new Error("Malzeme listesi oluşturulamadı");
                }
                
            } catch (error) {
                console.error("Malzeme tahmini hatası:", error);
                // Hata olduğunu bildir
                EventBus.emit('ai:error', { 
                    source: 'material-prediction', 
                    error: error.message
                });
                
                // Yerel demo yanıtı dön
                return this.getLocalMaterialList(orderData.cellType);
            }
        }
        
        /**
         * Siparişe göre üretim süresi tahmin et
         * @param {Object} orderDetails Sipariş detayları
         * @returns {Promise<Object>} Tahmin bilgileri
         */
        static async predictProductionTime(orderData) {
            // Benzer şekilde implementasyon
            // ...
            
            // Şimdilik demo verisi döndür
            return {
                estimatedDays: 14,
                confidence: 0.85,
                breakdown: {
                    planning: 1,
                    materialPreparation: 3,
                    production: 7,
                    testing: 2,
                    delivery: 1
                }
            };
        }
        
        // Demo yanıtlar için yedek fonksiyon
        static getLocalFallbackResponse(question) {
            question = question.toLowerCase();
            
            if (question.includes('malzeme') || question.includes('stok')) {
                return "Kritik seviyenin altında 2 malzeme bulunuyor: Siemens 7SR1003-1JA20-2DA0+ZY20 24VDC (Stok: 2, Önerilen: 5) ve KAP-80/190-95 Akım Trafosu (Stok: 3, Önerilen: 5).";
            } else if (question.includes('üretim') || question.includes('süre')) {
                return "Mevcut üretim planına göre ortalama tamamlama süresi 14 gün. Gecikme riski %15 olarak hesaplanmıştır.";
            } else if (question.includes('hücre') || question.includes('RM')) {
                return "RM 36 CB hücresinin ortalama üretim süresi 12 iş günüdür. Malzeme temin süreleri dahil değildir.";
            } else if (question.includes('gecikme') || question.includes('risk')) {
                return "Mevcut siparişler için gecikme riski analizi: Düşük risk: %65, Orta risk: %25, Yüksek risk: %10";
            }
            
            return "Sorunuzu analiz ediyorum. Daha spesifik bilgiler için lütfen üretim, malzeme, stok, gecikme veya hücre tipi hakkında sorular sorun.";
        }
        
        // Demo malzeme listesi (fallback için)
        static getLocalMaterialList(cellType) {
            const materials = {
                "RM 36 CB": [
                    { code: "137998", name: "Siemens 7SR1003-1JA20-2DA0+ZY20 24VDC", quantity: 1 },
                    { code: "144866", name: "KAP-80/190-95 Akım Trafosu", quantity: 3 },
                    { code: "120170", name: "M480TB/G-027-95.300UN5 Kablo Başlığı", quantity: 3 },
                    { code: "143756", name: "Kesici - Siemens 3AH5204-1", quantity: 1 },
                    { code: "135580", name: "Gösterge Lambası", quantity: 2 }
                ],
                "RM 36 LB": [
                    { code: "143770", name: "Ayırıcı - Anahtar", quantity: 1 },
                    { code: "144866", name: "KAP-80/190-95 Akım Trafosu", quantity: 2 },
                    { code: "120170", name: "M480TB/G-027-95.300UN5 Kablo Başlığı", quantity: 3 },
                    { code: "135580", name: "Gösterge Lambası", quantity: 2 }
                ]
            };
            
            return { 
                materials: materials[cellType] || materials["RM 36 CB"] 
            };
        }
    }
    
    // Global olarak erişilebilir hale getir
    window.AIService = AIService;
    
    // ES modül uyumluluğu
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { default: AIService };
    }
}

// AI Service initialization function
function initializeAI() {
    console.log('AI Service initialized.');
}