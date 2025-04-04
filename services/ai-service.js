/**
 * ai-service.js
 * Yapay zeka servis fonksiyonları
 */

// Daha önce tanımlanmış mı kontrol et
if (window.AIService) {
    console.log("AIService zaten yüklenmiş, tekrar yükleme atlanıyor.");
} else {
    // Bağımlılıkları yükle
    let AppConfig, EventBus, Logger;
    
    try {
        // ES modülü olarak yüklemeyi dene
        if (typeof require !== 'undefined') {
            AppConfig = require('../config/app-config.js').default;
            EventBus = require('../utils/event-bus.js').default;
            Logger = require('../utils/logger.js').default;
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
            Logger = window.Logger || console;
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
        Logger = window.Logger || console;
    }
    
    // AIService sınıfı
    class AIService {
        static apiKey = AppConfig.ai?.deepseek?.apiKey || '';
        static model = AppConfig.ai?.deepseek?.model || 'deepseek-r1-llm';
        static maxTokens = AppConfig.ai?.deepseek?.maxTokens || 2000;
        static temperature = AppConfig.ai?.deepseek?.temperature || 0.7;
        static historyDB = {}; // Sohbet geçmişleri için in-memory veritabanı
        static lastQueries = []; // Son sorgular
        static trainingData = {}; // AI eğitim verileri
        
        /**
         * DeepSeek modeliyle yanıt üret
         * @param {string} question Kullanıcının sorusu
         * @param {string} context Bağlam (optional)
         * @returns {Promise<string>} Model yanıtı
         */
        static async askDeepSeek(question, context = "") {
            try {
                if (!this.apiKey) {
                    Logger.warn("DeepSeek API anahtarı eksik, yedek yanıt kullanılıyor");
                    return this.getLocalFallbackResponse(question, context);
                }
                
                Logger.info("DeepSeek API'sine sorgu gönderiliyor:", question);
                
                // API çağrısı
                try {
                    // Sorgu geçmişini kaydet
                    this.lastQueries.push({
                        question,
                        timestamp: new Date().toISOString()
                    });
                    
                    // API çağrısını yapılandır
                    const payload = {
                        model: this.model,
                        messages: [
                            {
                                role: "system",
                                content: AppConfig.ai.deepseek.systemMessage
                            }
                        ],
                        max_tokens: this.maxTokens,
                        temperature: this.temperature
                    };
                    
                    // Bağlam varsa ekle
                    if (context && context.trim()) {
                        payload.messages.push({
                            role: "system", 
                            content: `Analiz için gerekli veriler: ${context}`
                        });
                    }
                    
                    // Kullanıcı sorusunu ekle
                    payload.messages.push({
                        role: "user",
                        content: question
                    });
                    
                    // API'yi çağır
                    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${this.apiKey}`
                        },
                        body: JSON.stringify(payload)
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(`DeepSeek API Hatası: ${response.status} - ${errorData.error?.message || "Bilinmeyen hata"}`);
                    }
                    
                    const data = await response.json();
                    const answer = data.choices[0].message.content;
                    
                    // Yanıt olayını yayınla
                    EventBus.emit('ai:response', {
                        question,
                        answer,
                        source: 'deepseek',
                        timestamp: new Date().toISOString()
                    });
                    
                    return answer;
                    
                } catch (apiError) {
                    Logger.error("DeepSeek API hatası:", apiError);
                    
                    // OpenAI API'yi yedek olarak dene
                    try {
                        const openAIAnswer = await this.askOpenAI(question, context);
                        return openAIAnswer;
                    } catch (openAIError) {
                        Logger.error("OpenAI API hatası:", openAIError);
                        // Her iki API de başarısız olursa fallback yanıta dön
                        return this.getLocalFallbackResponse(question, context);
                    }
                }
            } catch (error) {
                Logger.error("AI sorgulama hatası:", error);
                
                // Hata durumunda başarısız olduğunu bildir
                EventBus.emit('ai:error', { 
                    source: 'deepseek', 
                    error: error.message
                });
                
                // Yerel demo yanıtı dön
                return this.getLocalFallbackResponse(question, context);
            }
        }
        
        /**
         * OpenAI ile yanıt üret
         * @param {string} question Kullanıcının sorusu
         * @param {string} context Bağlam (optional)
         * @returns {Promise<string>} Model yanıtı
         */
        static async askOpenAI(question, context = "") {
            try {
                if (!AppConfig.ai?.openai?.apiKey) {
                    Logger.warn("OpenAI API anahtarı eksik, yedek yanıt kullanılıyor");
                    return this.getLocalFallbackResponse(question, context);
                }
                
                Logger.info("OpenAI API'sine sorgu gönderiliyor:", question);
                
                // API çağrısı
                const payload = {
                    model: AppConfig.ai.openai.model || "gpt-4",
                    messages: [
                        {
                            role: "system",
                            content: AppConfig.ai.openai.systemMessage
                        }
                    ],
                    max_tokens: 2000,
                    temperature: 0.7
                };
                
                // Bağlam varsa ekle
                if (context && context.trim()) {
                    payload.messages.push({
                        role: "system", 
                        content: `Analiz için gerekli veriler: ${context}`
                    });
                }
                
                // Kullanıcı sorusunu ekle
                payload.messages.push({
                    role: "user",
                    content: question
                });
                
                // API'yi çağır
                const response = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${AppConfig.ai.openai.apiKey}`
                    },
                    body: JSON.stringify(payload)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`OpenAI API Hatası: ${response.status} - ${errorData.error?.message || "Bilinmeyen hata"}`);
                }
                
                const data = await response.json();
                const answer = data.choices[0].message.content;
                
                // Yanıt olayını yayınla
                EventBus.emit('ai:response', {
                    question,
                    answer,
                    source: 'openai',
                    timestamp: new Date().toISOString()
                });
                
                return answer;
                
            } catch (error) {
                Logger.error("OpenAI API hatası:", error);
                
                // Hata durumunda başarısız olduğunu bildir
                EventBus.emit('ai:error', { 
                    source: 'openai', 
                    error: error.message
                });
                
                // Yerel demo yanıtı dön
                return this.getLocalFallbackResponse(question, context);
            }
        }
        
        /**
         * Siparişe göre malzeme listesi tahmin et
         * @param {Object} orderData Sipariş detayları
         * @returns {Promise<Object>} Malzeme listesi ve tahmin bilgileri
         */
        static async predictMaterials(orderData) {
            try {
                if (!orderData || !orderData.cellType) {
                    throw new Error("Geçersiz sipariş verileri");
                }
                
                Logger.info("Sipariş için malzeme tahmini yapılıyor:", orderData.cellType);
                
                // Önce mevcut malzeme listelerine bak
                const matchedList = await this.findMatchingMaterialList(orderData);
                
                if (matchedList) {
                    Logger.info("Eşleşen malzeme listesi bulundu:", matchedList.id);
                    return {
                        materials: matchedList.materials,
                        source: "database",
                        matchConfidence: matchedList.confidence
                    };
                }
                
                // Veritabanında uygun liste yoksa, AI ile tahmin et
                Logger.info("Eşleşen malzeme listesi bulunamadı, AI ile tahmin ediliyor");
                
                // Prompta eklenecek sipariş bilgilerini hazırla
                const orderPrompt = `
                    Hücre Tipi: ${orderData.cellType}
                    Gerilim: ${orderData.voltage || 'Belirtilmemiş'}
                    Akım: ${orderData.current || 'Belirtilmemiş'}
                    Röle Tipi: ${orderData.relayType || 'Belirtilmemiş'}
                    Müşteri: ${orderData.customer || 'Belirtilmemiş'}
                    Adet: ${orderData.quantity || 1}
                    ${orderData.technicalDetails ? 'Teknik Detaylar: ' + orderData.technicalDetails : ''}
                `;
                
                // AI modelini çağır
                try {
                    // Önce DeepSeek dene
                    if (this.apiKey) {
                        const prompt = `
                            Bir orta gerilim hücre üretimi için malzeme listesi oluşturmam gerekiyor.
                            Aşağıdaki sipariş bilgilerine göre gerekli malzemelerin listesini JSON formatında çıkar:
                            ${orderPrompt}
                            
                            JSON formatında olmalı ve şu yapıda dönmelisin:
                            { 
                              "materials": [ 
                                { "code": "malzeme_kodu", "name": "malzeme_adı", "quantity": miktar }, 
                                ... 
                              ] 
                            }
                            SADECE JSON formatında cevap ver, fazladan açıklama yazma.
                        `;
                        
                        const response = await this.askDeepSeek(prompt);
                        
                        // JSON yanıtını ayrıştır
                        try {
                            const jsonMatch = response.match(/\{[\s\S]*\}/);
                            if (jsonMatch) {
                                const jsonStr = jsonMatch[0];
                                const materialList = JSON.parse(jsonStr);
                                
                                // Malzeme listesini kaydet (öğrenme için)
                                this.saveMaterialPrediction(orderData, materialList.materials);
                                
                                return {
                                    ...materialList,
                                    source: "ai",
                                    aiModel: "deepseek"
                                };
                            }
                            throw new Error("JSON formatında yanıt alınamadı");
                        } catch (e) {
                            Logger.error("JSON ayrıştırma hatası:", e, response);
                            throw new Error("Malzeme listesi oluşturulamadı");
                        }
                    } else {
                        throw new Error("AI API anahtarı eksik");
                    }
                } catch (aiError) {
                    Logger.error("AI ile malzeme tahmini hatası:", aiError);
                    
                    // Yerel veritabanı/demo verisi kullan
                    return {
                        materials: this.getLocalMaterialList(orderData.cellType),
                        source: "local_fallback"
                    };
                }
            } catch (error) {
                Logger.error("Malzeme tahmini hatası:", error);
                
                // Hata olduğunu bildir
                EventBus.emit('ai:error', { 
                    source: 'material-prediction', 
                    error: error.message
                });
                
                // Yerel demo yanıtı dön
                return {
                    materials: this.getLocalMaterialList(orderData.cellType),
                    source: "error_fallback"
                };
            }
        }
        
        /**
         * Siparişe göre üretim süresi tahmin et
         * @param {Object} orderData Sipariş detayları
         * @returns {Promise<Object>} Tahmin bilgileri
         */
        static async predictProductionTime(orderData) {
            try {
                if (!orderData || !orderData.cellType) {
                    throw new Error("Geçersiz sipariş verileri");
                }
                
                Logger.info("Sipariş için üretim süresi tahmini yapılıyor:", orderData.cellType);
                
                // Önceki üretim verileri ile benzer siparişleri bul
                const previousProductionData = await this.getPreviousProductionData(orderData.cellType);
                
                // Benzer veri varsa, üretim sürelerinin ortalamasını al
                if (previousProductionData && previousProductionData.length > 0) {
                    const avgProductionDays = this.calculateAverageProductionTime(previousProductionData);
                    
                    // Hücre sayısına göre çarpan ekle
                    const cellCount = orderData.quantity || 1;
                    const baseProductionDays = avgProductionDays;
                    
                    // Ölçekleme faktörü (hücre sayısı arttıkça birim başına üretim süresi azalır)
                    const scaleFactor = cellCount > 1 ? 0.8 : 1; // %20 verimlilik artışı
                    const estimatedDays = Math.round(baseProductionDays * cellCount * scaleFactor);
                    
                    return {
                        estimatedDays: estimatedDays,
                        confidence: 0.85,
                        source: "historical_data",
                        breakdown: {
                            planning: Math.round(estimatedDays * 0.1),
                            materialPreparation: Math.round(estimatedDays * 0.2),
                            production: Math.round(estimatedDays * 0.5),
                            testing: Math.round(estimatedDays * 0.15),
                            delivery: Math.round(estimatedDays * 0.05)
                        }
                    };
                }
                
                // Yeterli tarihsel veri yoksa, AI ile tahmin et
                try {
                    if (this.apiKey) {
                        const prompt = `
                            Bir orta gerilim hücre üretimi için üretim süresi tahmini yapıyorum.
                            Aşağıdaki sipariş bilgilerine göre tahmini üretim süresini gün olarak hesapla:
                            
                            Hücre Tipi: ${orderData.cellType}
                            Gerilim: ${orderData.voltage || 'Belirtilmemiş'}
                            Akım: ${orderData.current || 'Belirtilmemiş'}
                            Adet: ${orderData.quantity || 1}
                            
                            Yanıtı şu formatta ver:
                            {
                              "estimatedDays": tahmini_gün_sayısı,
                              "confidence": güven_oranı,
                              "breakdown": {
                                "planning": planlama_günü,
                                "materialPreparation": malzeme_hazırlık_günü,
                                "production": üretim_günü,
                                "testing": test_günü,
                                "delivery": teslimat_günü
                              }
                            }
                            
                            SADECE JSON yanıtı ver.
                        `;
                        
                        const response = await this.askDeepSeek(prompt);
                        
                        // JSON yanıtını ayrıştır
                        try {
                            const jsonMatch = response.match(/\{[\s\S]*\}/);
                            if (jsonMatch) {
                                const jsonStr = jsonMatch[0];
                                const timeEstimate = JSON.parse(jsonStr);
                                
                                return {
                                    ...timeEstimate,
                                    source: "ai"
                                };
                            }
                            throw new Error("JSON formatında yanıt alınamadı");
                        } catch (e) {
                            Logger.error("JSON ayrıştırma hatası:", e);
                            // Varsayılan yanıta geri dön
                        }
                    }
                } catch (aiError) {
                    Logger.error("AI ile üretim süresi tahmini hatası:", aiError);
                    // Varsayılan yanıta devam et
                }
                
                // Varsayılan/örnek tahmin
                return {
                    estimatedDays: this.getDefaultProductionDays(orderData.cellType, orderData.quantity || 1),
                    confidence: 0.7,
                    source: "default_estimate",
                    breakdown: {
                        planning: 1,
                        materialPreparation: 3,
                        production: 7,
                        testing: 2,
                        delivery: 1
                    }
                };
            } catch (error) {
                Logger.error("Üretim süresi tahmini hatası:", error);
                return {
                    estimatedDays: 14,
                    confidence: 0.6,
                    source: "fallback",
                    breakdown: {
                        planning: 1,
                        materialPreparation: 3,
                        production: 7,
                        testing: 2,
                        delivery: 1
                    }
                };
            }
        }
        
        /**
         * Eşleşen malzeme listesini bul
         * @private
         */
        static async findMatchingMaterialList(orderData) {
            try {
                // Firebase veya yerel veritabanından malzeme listelerini çek
                let materialLists = [];
                
                if (window.firebase && window.firebase.firestore) {
                    const snapshot = await firebase.firestore().collection('materialLists').get();
                    snapshot.forEach(doc => {
                        materialLists.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                } else if (localStorage.getItem('materialLists')) {
                    // Yerel depolamadan çek
                    try {
                        materialLists = JSON.parse(localStorage.getItem('materialLists')) || [];
                    } catch (e) {
                        materialLists = [];
                    }
                }
                
                if (materialLists.length === 0) {
                    return null;
                }
                
                // En iyi eşleşmeyi bul
                let bestMatch = null;
                let highestScore = 0;
                
                for (const list of materialLists) {
                    // Eşleşme skoru hesapla
                    let score = 0;
                    
                    // Hücre tipi eşleşmesi (en önemli)
                    if (list.cellType === orderData.cellType) {
                        score += 5;
                    } else if (list.cellType && list.cellType.includes(orderData.cellType)) {
                        score += 3;
                    }
                    
                    // Gerilim eşleşmesi
                    if (list.voltage === orderData.voltage) {
                        score += 2;
                    }
                    
                    // Akım eşleşmesi
                    if (list.current === orderData.current) {
                        score += 2;
                    }
                    
                    // Röle tipi eşleşmesi
                    if (list.relayType === orderData.relayType) {
                        score += 1;
                    }
                    
                    // En yüksek skoru güncelle
                    if (score > highestScore) {
                        highestScore = score;
                        bestMatch = list;
                    }
                }
                
                // Minimum eşleşme skoru kontrolü (en az hücre tipi eşleşmeli)
                if (highestScore >= 5) {
                    return {
                        ...bestMatch,
                        confidence: highestScore / 10 // 0-1 arası güven skoru
                    };
                }
                
                return null;
            } catch (error) {
                Logger.error("Malzeme listesi eşleştirme hatası:", error);
                return null;
            }
        }
        
        /**
         * Tahmin edilen malzeme listesini kaydet (eğitim için)
         * @private
         */
        static async saveMaterialPrediction(orderData, materials) {
            try {
                const predictionData = {
                    orderData,
                    materials,
                    timestamp: new Date().toISOString()
                };
                
                // Veritabanına kaydet
                if (window.firebase && window.firebase.firestore) {
                    await firebase.firestore().collection('materialPredictions').add(predictionData);
                } else {
                    // Yerel kayıt
                    const predictions = JSON.parse(localStorage.getItem('materialPredictions') || '[]');
                    predictions.push(predictionData);
                    localStorage.setItem('materialPredictions', JSON.stringify(predictions));
                }
                
                Logger.info("Malzeme tahmini kaydedildi");
            } catch (error) {
                Logger.error("Malzeme tahmini kaydetme hatası:", error);
            }
        }
        
        /**
         * Önceki üretim verilerini getir
         * @private
         */
        static async getPreviousProductionData(cellType) {
            try {
                let productionData = [];
                
                // Firebase'den çek
                if (window.firebase && window.firebase.firestore) {
                    const snapshot = await firebase.firestore()
                        .collection('production')
                        .where('cellType', '==', cellType)
                        .limit(20)
                        .get();
                    
                    snapshot.forEach(doc => {
                        productionData.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                } else if (localStorage.getItem('productionData')) {
                    // Yerel depolamadan çek
                    try {
                        const allData = JSON.parse(localStorage.getItem('productionData')) || [];
                        productionData = allData.filter(p => p.cellType === cellType).slice(0, 20);
                    } catch (e) {
                        productionData = [];
                    }
                }
                
                return productionData;
            } catch (error) {
                Logger.error("Üretim verisi çekme hatası:", error);
                return [];
            }
        }
        
        /**
         * Ortalama üretim süresini hesapla
         * @private
         */
        static calculateAverageProductionTime(productionData) {
            if (!productionData || productionData.length === 0) {
                return 14; // Varsayılan değer
            }
            
            let totalDays = 0;
            let validEntries = 0;
            
            productionData.forEach(entry => {
                if (entry.startDate && entry.endDate) {
                    const start = new Date(entry.startDate.toDate ? entry.startDate.toDate() : entry.startDate);
                    const end = new Date(entry.endDate.toDate ? entry.endDate.toDate() : entry.endDate);
                    
                    const daysInMillis = end - start;
                    const days = Math.round(daysInMillis / (1000 * 60 * 60 * 24));
                    
                    if (days > 0) {
                        totalDays += days;
                        validEntries++;
                    }
                }
            });
            
            if (validEntries === 0) {
                return 14; // Varsayılan değer
            }
            
            return Math.round(totalDays / validEntries);
        }
        
        /**
         * Hücre tipine göre varsayılan üretim süresi
         * @private
         */
        static getDefaultProductionDays(cellType, quantity) {
            const baseProductionDays = {
                "RM 36 CB": 14,
                "RM 36 LB": 12,
                "RM 36 FL": 10,
                "RM 36 BC": 16,
                "RM 36 D": 8,
                "RM 36 UDC": 15
            };
            
            const base = baseProductionDays[cellType] || 14;
            
            // Hücre sayısına göre ölçekle
            const scaleFactor = quantity > 1 ? 0.8 : 1; // %20 verimlilik artışı
            return Math.round(base * quantity * scaleFactor);
        }
        
        // Demo yanıtlar için yedek fonksiyon
        static getLocalFallbackResponse(question, context = "") {
            question = question.toLowerCase();
            const now = new Date();
            const formattedDate = now.toLocaleDateString('tr-TR', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            if (question.includes('sipariş') && question.match(/\d{2}-\d{2}-[A-Z]\d{3}/)) {
                // Sipariş numarası sorgusu
                const orderMatch = question.match(/\d{2}-\d{2}-[A-Z]\d{3}/);
                const orderNo = orderMatch ? orderMatch[0] : "24-03-A001";
                
                return `${orderNo} numaralı sipariş üretim aşamasındadır. Hücre montajı devam ediyor ve şu ana kadar %65 tamamlandı. Tahmini teslimat tarihi: 15.04.2024. Eksik malzeme bulunmuyor ve şu an için gecikme riski tespit edilmedi.`;
            } else if (question.includes('malzeme') || question.includes('stok')) {
                return "Kritik seviyenin altında 2 malzeme bulunuyor: Siemens 7SR1003-1JA20-2DA0+ZY20 24VDC (Stok: 2, Önerilen: 5) ve KAP-80/190-95 Akım Trafosu (Stok: 3, Önerilen: 5). Tedarik süreci başlatıldı ve 7 gün içinde teslim alınması bekleniyor.";
            } else if (question.includes('üretim') || question.includes('süre')) {
                return "Mevcut üretim planına göre ortalama tamamlama süresi 14 gün. Haftalık üretim kapasitesi 6 hücre olarak hesaplanıyor. Gecikme riski %15 olarak hesaplanmıştır. En son 27.03.2024 tarihinde 3 adet RM 36 CB tipi hücre üretimi tamamlandı.";
            } else if (question.includes('hücre') || question.includes('RM')) {
                return "RM 36 CB hücresinin ortalama üretim süresi 12 iş günüdür. Malzeme tedarik süreleri dahil değildir. Şu anda stokta 2 adet hazır RM 36 CB kesici hücresi bulunmaktadır. Son 30 günde 8 adet üretim tamamlandı.";
            } else if (question.includes('gecikme') || question.includes('risk')) {
                return "Mevcut siparişler için gecikme riski analizi: Düşük risk: %65, Orta risk: %25, Yüksek risk: %10. Yüksek riskli 2 sipariş tespit edildi: 24-03-B002 (BAŞKENT EDAŞ, malzeme tedarik gecikmesi) ve 24-04-E005 (AYEDAŞ, üretim kapasitesi aşımı).";
            } else if (question.includes('özet') || question.includes('rapor')) {
                return `Günlük özet (${formattedDate}):\n- Bugün tamamlanan üretim: 2 hücre\n- Devam eden üretim: 5 sipariş, 12 hücre\n- Kritik stok seviyesinde malzeme: 2 adet\n- Bekleyen tedarik siparişi: 4 adet\n- Planlanan sevkiyat: 1 sipariş (24-03-D004)\n- Kritik gecikme riski: 2 sipariş (24-03-B002, 24-04-E005)`;
            }
            
            return "Sorunuzu analiz ediyorum. Daha spesifik bilgiler için lütfen üretim, malzeme, stok, gecikme veya hücre tipi hakkında sorular sorun. Örneğin 'RM 36 CB için üretim süresi nedir?' veya '24-03-A001 numaralı sipariş hangi aşamada?' gibi sorular sorabilirsiniz.";
        }
        
        // Demo malzeme listesi (fallback için)
        static getLocalMaterialList(cellType) {
            const materials = {
                "RM 36 CB": [
                    { code: "137998", name: "Siemens 7SR1003-1JA20-2DA0+ZY20 24VDC", quantity: 1 },
                    { code: "144866", name: "KAP-80/190-95 Akım Trafosu", quantity: 3 },
                    { code: "120170", name: "M480TB/G-027-95.300UN5 Kablo Başlığı", quantity: 3 },
                    { code: "143756", name: "Kesici - Siemens 3AH5204-1", quantity: 1 },
                    { code: "135580", name: "Gösterge Lambası", quantity: 2 },
                    { code: "125790", name: "Analog Ampermetre", quantity: 1 },
                    { code: "132450", name: "Topraklama Anahtarı", quantity: 1 },
                    { code: "129654", name: "Bağlantı Kablosu - 95mm²", quantity: 6 }
                ],
                "RM 36 LB": [
                    { code: "143770", name: "Ayırıcı - Anahtar", quantity: 1 },
                    { code: "144866", name: "KAP-80/190-95 Akım Trafosu", quantity: 2 },
                    { code: "120170", name: "M480TB/G-027-95.300UN5 Kablo Başlığı", quantity: 3 },
                    { code: "135580", name: "Gösterge Lambası", quantity: 2 },
                    { code: "132450", name: "Topraklama Anahtarı", quantity: 1 },
                    { code: "129654", name: "Bağlantı Kablosu - 95mm²", quantity: 6 }
                ],
                "RM 36 FL": [
                    { code: "144866", name: "KAP-80/190-95 Akım Trafosu", quantity: 3 },
                    { code: "143590", name: "Sigorta 63A", quantity: 3 },
                    { code: "120170", name: "M480TB/G-027-95.300UN5 Kablo Başlığı", quantity: 3 },
                    { code: "135580", name: "Gösterge Lambası", quantity: 2 },
                    { code: "132450", name: "Topraklama Anahtarı", quantity: 1 }
                ],
                "RM 36 D": [
                    { code: "143770", name: "Ayırıcı - Anahtar", quantity: 1 },
                    { code: "135580", name: "Gösterge Lambası", quantity: 2 },
                    { code: "132450", name: "Topraklama Anahtarı", quantity: 1 },
                    { code: "129654", name: "Bağlantı Kablosu - 95mm²", quantity: 4 }
                ]
            };
            
            return materials[cellType] || materials["RM 36 CB"];
        }
    }
    
    // Global olarak erişilebilir hale getir
    window.AIService = AIService;
    
    // ES modül uyumluluğu
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { default: AIService };
    }
    
    Logger.info("AIService modülü yüklendi ve hazır");
} 
} 