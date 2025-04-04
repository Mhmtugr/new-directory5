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
        apiKey: "AIzaSyDELVs5CU3TfaLaOkoJhz_3vM2W7DFHkqA",
        authDomain: "mehmet-endustriyel-takip.firebaseapp.com",
        projectId: "mehmet-endustriyel-takip",
        storageBucket: "mehmet-endustriyel-takip.appspot.com",
        messagingSenderId: "682912134567",
        appId: "1:682912134567:web:9d7a5f8b3e6b23a142b678",
        measurementId: "G-63EPBR5LW2"
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
        // --- GÜVENLİK UYARISI ---
        // BU API ANAHTARLARI ÜRETİM ORTAMINDA ASLA DOĞRUDAN FRONTEND KODUNDA TUTULMAMALIDIR!
        // GÜVENLİK İÇİN BU ANAHTARLARI MUTLAKA ORTAM DEĞİŞKENLERİ (ENVIRONMENT VARIABLES) KULLANARAK
        // VEYA TERCİHEN BACKEND TARAFINDA GÜVENLİ BİR ŞEKİLDE SAKLAYIN.
        // BURADAKİ DEĞERLER SADECE GELİŞTİRME/DEMO AMAÇLIDIR VE GERÇEK DEĞERLERLE DEĞİŞTİRİLMEMELİDİR.
        // --- GÜVENLİK UYARISI ---
        deepseek: {
            apiKey: "sk-42d0185c484b4bf2907392864f4ae76d", // <-- DİKKAT: GÜVENLİ DEĞİL! BACKEND'E TAŞINMALI!
            model: "deepseek-r1-llm",
            maxTokens: 2000,
            temperature: 0.7,
            systemMessage: "Sen bir üretim takip ve planlama asistanısın. Orta gerilim anahtarlama ekipmanları üretimi konusunda uzmanlaşmışsın. Firma için imalat süreçlerini takip eden, tahmin ve analiz yapabilen bir yapay zeka asistanısın."
        },
        // OpenAI entegrasyonu
        openai: {
            apiKey: "", // <-- DİKKAT: GÜVENLİ DEĞİL! BOŞ BIRAKILMALI, BACKEND HALLETMELİ!
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
            // --- ÖNEMLİ NOT ---
            // Aşağıdaki host, port, username gibi Canias bağlantı bilgileri
            // ASLA frontend kodunda bulunmamalıdır. Bu bilgiler backend API
            // tarafında güvenli bir şekilde yönetilmelidir. Buradaki değerler
            // sadece örnek amaçlıdır ve kod içinde kullanılmamalıdır.
            // --- ÖNEMLİ NOT ---
            host: "192.168.1.100", // <-- ÖRNEK DEĞER - BACKEND'DE YÖNETİLMELİ
            port: 8080, // <-- ÖRNEK DEĞER - BACKEND'DE YÖNETİLMELİ
            username: "api_user", // <-- ÖRNEK DEĞER - BACKEND'DE YÖNETİLMELİ
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
