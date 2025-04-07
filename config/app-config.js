const AppConfig = {
    apiEndpoints: {
        production: '/api/production',
        purchasing: '/api/purchasing',
        orders: '/api/orders',
        inventory: '/api/inventory',
        ai: '/api/ai',
        erp: '/api/erp'
    },
    firebase: {
        // Firebase config
    },
    logLevel: 'INFO', // DEBUG, INFO, WARN, ERROR, NONE
    modules: {
        dashboard: true,
        production: true,
        purchasing: true,
        inventory: true,
        ai: {
            enabled: true,
            modelType: 'deepseek', // hybrid, openai, deepseek, tensorflow
            chatbot: true,
            analytics: true,
            prediction: true,
            materialPrediction: true,
            technicalAssistant: true
        }
    },
    ai: {
        // Bu API anahtarlarını üretim ortamında asla doğrudan kodda tutmayın
        // Güvenlik için environment variables veya backend tarafında saklayın
        // Bu sadece demo/geliştirme amaçlıdır
        deepseek: {
            apiKey: "sk-42d0185c484b4bf2907392864f4ae76d",
            model: "deepseek-r1-llm",
            maxTokens: 2000,
            temperature: 0.7,
            systemMessage: "Sen bir üretim takip ve planlama asistanısın. Orta gerilim anahtarlama ekipmanları üretimi konusunda uzmanlaşmışsın. Firma için imalat süreçlerini takip eden, tahmin ve analiz yapabilen bir yapay zeka asistanısın."
        },
        // OpenAI entegrasyonu
        openai: {
            apiKey: "", // Sadece geliştirme/demo için
            model: "gpt-4", // GPT-4 modeline yükseltildi
            systemMessage: "Sen bir üretim takip ve planlama asistanısın. Orta gerilim anahtarlama ekipmanları üretimi konusunda uzmanlaşmışsın. Firma için imalat süreçlerini takip eden, tahmin ve analiz yapabilen bir yapay zeka asistanısın."
        },
        // Makine Öğrenmesi entegrasyonu
        machineLearning: {
            enabled: true,
            predictionModel: "regression", // regression, classification, timeseries
            trainingInterval: "weekly", // Modellerin yeniden eğitilme sıklığı
            minimumDataPoints: 100, // Eğitim için gereken minimum veri noktası sayısı
            features: [
                "hucre_tipi", "voltaj", "akim", "role_tipi", "uretim_suresi", 
                "malzeme_tedarik_suresi", "montaj_suresi", "test_suresi"
            ],
            advancedFeatures: {
                productionOptimization: true,
                delayPrediction: true,
                materialShortageAlert: true,
                supplierRating: true
            }
        }
    },
    erpIntegration: {
        type: "canias",
        enabled: true,
        apiEndpoint: "/api/erp/canias",
        syncInterval: 60, // dakika
        tables: {
            stock: "B01_STOK",
            orders: "SIPARIS",
            materials: "MALZEME",
            customers: "MUSTERI"
        },
        // Canias ERP'ye özel entegrasyon detayları
        canias: {
            host: "192.168.1.100",
            port: 8080,
            username: "api_user",
            modules: {
                inventory: {
                    enabled: true,
                    tables: ["B01_STOK", "SARF_MALZEME", "DEPO_HAREKET"]
                },
                production: {
                    enabled: true,
                    tables: ["URETIM_PLAN", "URETIM_EMIR", "URETIM_TAKIP"]
                },
                purchasing: {
                    enabled: true,
                    tables: ["SIPARIS", "SATINALMA_TALEP", "TEDARIKCI"]
                },
                sales: {
                    enabled: true,
                    tables: ["SATIS_SIPARIS", "MUSTERI", "TEKLIFLER"]
                }
            },
            // Sipariş için malzeme rezervasyonu özelliği
            reserveMaterials: true,
            // Stok güncelleme ayarları
            stockUpdateSettings: {
                realtime: true,
                checkReservedItems: true,
                alertThreshold: 5
            }
        }
    },
    notifications: {
        email: true,
        push: true,
        sms: false,
        delayWarning: {
            yellow: 1, // 1 gün gecikme uyarısı
            red: 3 // 3 gün gecikme kritik uyarı
        },
        materialShortage: {
            enabled: true,
            threshold: 5 // Eşik değerin altındaki malzemeler için uyarı
        },
        // Kullanıcı ve departman bazlı bildirim ayarları
        departments: {
            production: ["delay", "materialShortage", "optimization"],
            purchasing: ["materialShortage", "supplierDelay", "stockAlert"],
            sales: ["orderStatus", "deliveryDelay"],
            management: ["all"]
        },
        responseDeadline: 3 // Uyarılara maksimum 3 saatte yanıt verilmesi bekleniyor
    },
    security: {
        tokenExpiration: 24, // saat
        minimumPasswordLength: 8,
        requireMFA: false // Çok faktörlü kimlik doğrulama
    },
    ui: {
        theme: "light", // light, dark, auto
        dashboard: {
            refreshInterval: 5, // dakika
            charts: {
                enabled: true,
                colorPalette: ["#3498db", "#2ecc71", "#f39c12", "#e74c3c", "#9b59b6"]
            }
        }
    }
};

// Global olarak erişilebilir yap
window.AppConfig = AppConfig;

// ES modülleri için export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { default: AppConfig };
} else if (typeof define === 'function' && define.amd) {
    define([], function() { return AppConfig; });
} else {
    // Başka bir global erişim yok, window.AppConfig zaten ayarlandı
}
