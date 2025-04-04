/**
 * data-service.js
 * Mehmet Endüstriyel Takip - Veri Servisi
 * Veritabanı işlemleri ve veri senkronizasyonu için genel servis
 */

// Veri servisi sınıfı
class DataService {
    constructor() {
        this.initialized = false;
        this.firebaseAvailable = false;
        this.localDataEnabled = true;
        this.logger = window.Logger || console;
        
        // Önbellek
        this.cache = {
            orders: null,
            materials: null,
            production: null,
            customers: null,
            lastSync: null
        };
        
        // Firebase referansları
        this.db = null;
        this.auth = null;
        
        // Demo mod kontrolü
        this.isDemoMode = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          window.location.hostname.includes('netlify.app') ||
                          !AppConfig.firebase.apiKey ||
                          window.location.search.includes('demo=true');
        
        this.init();
    }
    
    // Servis başlatma
    async init() {
        try {
            // Firebase kontrol
            if (typeof firebase !== 'undefined' && AppConfig.firebase.apiKey) {
                this.db = firebase.firestore();
                this.auth = firebase.auth();
                this.firebaseAvailable = true;
                this.logger.info('Firebase bağlantısı başarılı');
            } else {
                this.logger.warn('Firebase kullanılamıyor, yerel veriler kullanılacak');
            }
            
            // Demo mod uyarısı
            if (this.isDemoMode) {
                this.logger.info('Demo mod aktif, demo veriler kullanılacak');
            }
            
            // Yerel verileri yükle
            this.loadLocalData();
            
            // İlk veri senkronizasyonu
            await this.syncAllData();
            
            // Otomatik senkronizasyon
            this.setupAutoSync();
            
            this.initialized = true;
            
            // Olayı yayınla
            if (window.EventBus) {
                window.EventBus.emit('dataServiceReady', { time: new Date() });
            }
            
            return true;
        } catch (error) {
            this.logger.error('Veri servisi başlatma hatası:', error);
            
            // Yerel verileri yedek olarak yükle
            this.loadLocalData();
            
            return false;
        }
    }
    
    // Otomatik senkronizasyon
    setupAutoSync() {
        // Her 5 dakikada bir senkronize et
        const syncInterval = 5 * 60 * 1000; // 5 dakika
        
        setInterval(() => {
            this.syncAllData()
                .then(result => {
                    if (result) {
                        this.logger.debug('Otomatik veri senkronizasyonu tamamlandı');
                    }
                })
                .catch(error => {
                    this.logger.error('Otomatik senkronizasyon hatası:', error);
                });
        }, syncInterval);
    }
    
    // Tüm verileri senkronize et
    async syncAllData() {
        try {
            // Tüm veri türleri için senkronizasyon
            const orderResult = await this.syncData('orders');
            const materialResult = await this.syncData('materials');
            const productionResult = await this.syncData('production');
            const customerResult = await this.syncData('customers');
            
            this.cache.lastSync = new Date();
            
            // Yerel veriyi kaydet
            this.saveLocalData();
            
            // Senkronizasyon olayını yayınla
            if (window.EventBus) {
                window.EventBus.emit('dataSynced', { 
                    time: new Date(),
                    orders: orderResult?.length || 0,
                    materials: materialResult?.length || 0,
                    production: productionResult?.items?.length || 0,
                    customers: customerResult?.length || 0
                });
            }
            
            return true;
        } catch (error) {
            this.logger.error('Veri senkronizasyon hatası:', error);
            return false;
        }
    }
    
    // Belirli veri türünü senkronize et
    async syncData(dataType) {
        try {
            if (this.isDemoMode || !this.firebaseAvailable) {
                // Demo veriler için
                return this.getDemoData(dataType);
            }
            
            // Firebase'den veri çekme
            const collection = this.db.collection(dataType);
            const snapshot = await collection.get();
            
            const data = snapshot.docs.map(doc => {
                return { id: doc.id, ...doc.data() };
            });
            
            // Önbelleğe kaydet
            this.cache[dataType] = data;
            
            return data;
        } catch (error) {
            this.logger.error(`${dataType} senkronizasyon hatası:`, error);
            
            // Hata olayını yayınla
            if (window.EventBus) {
                window.EventBus.emit('dataSyncError', { 
                    time: new Date(),
                    type: dataType,
                    error: error.message
                });
            }
            
            // Önbellekte veri varsa onu kullan
            if (this.cache[dataType]) {
                return this.cache[dataType];
            }
            
            // Yoksa demo verileri kullan
            return this.getDemoData(dataType);
        }
    }
    
    // Demo veriler
    getDemoData(dataType) {
        switch (dataType) {
            case 'orders':
                return window.getDemoOrders ? window.getDemoOrders() : [];
            case 'materials':
                return window.getDemoMaterials ? window.getDemoMaterials() : [];
            case 'production':
                return window.getDemoProduction ? window.getDemoProduction() : { items: [] };
            case 'customers':
                return window.getDemoCustomers ? window.getDemoCustomers() : [];
            default:
                return [];
        }
    }
    
    // Yerel verileri kaydet
    saveLocalData() {
        if (!this.localDataEnabled) return;
        
        try {
            localStorage.setItem('mets_cache', JSON.stringify({
                orders: this.cache.orders,
                materials: this.cache.materials,
                production: this.cache.production,
                customers: this.cache.customers,
                lastSync: this.cache.lastSync
            }));
            
            this.logger.debug('Yerel veriler kaydedildi');
        } catch (error) {
            this.logger.error('Yerel veri kaydetme hatası:', error);
        }
    }
    
    // Yerel verileri yükle
    loadLocalData() {
        if (!this.localDataEnabled) return;
        
        try {
            const cachedData = localStorage.getItem('mets_cache');
            
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                
                this.cache.orders = parsed.orders || null;
                this.cache.materials = parsed.materials || null;
                this.cache.production = parsed.production || null;
                this.cache.customers = parsed.customers || null;
                this.cache.lastSync = parsed.lastSync ? new Date(parsed.lastSync) : null;
                
                this.logger.debug('Yerel veriler yüklendi');
            } else {
                this.logger.debug('Kayıtlı yerel veri bulunamadı');
            }
        } catch (error) {
            this.logger.error('Yerel veri yükleme hatası:', error);
        }
    }
    
    // ---- Veri erişim metodları ----
    
    // Sipariş verileri
    async getOrders(forceRefresh = false) {
        if (forceRefresh || !this.cache.orders) {
            await this.syncData('orders');
        }
        return this.cache.orders || [];
    }
    
    // Malzeme verileri
    async getMaterials(forceRefresh = false) {
        if (forceRefresh || !this.cache.materials) {
            await this.syncData('materials');
        }
        return this.cache.materials || [];
    }
    
    // Üretim verileri
    async getProduction(forceRefresh = false) {
        if (forceRefresh || !this.cache.production) {
            await this.syncData('production');
        }
        return this.cache.production || { items: [] };
    }
    
    // Müşteri verileri
    async getCustomers(forceRefresh = false) {
        if (forceRefresh || !this.cache.customers) {
            await this.syncData('customers');
        }
        return this.cache.customers || [];
    }
    
    // ID'ye göre sipariş getir
    async getOrderById(orderId) {
        const orders = await this.getOrders();
        return orders.find(order => order.id === orderId);
    }
    
    // Malzeme kodu veya ID'ye göre malzeme getir
    async getMaterialByCode(code) {
        const materials = await this.getMaterials();
        return materials.find(material => 
            material.code === code || material.id === code
        );
    }
    
    // Sipariş numarasına göre sipariş getir
    async getOrderByOrderNo(orderNo) {
        const orders = await this.getOrders();
        return orders.find(order => order.orderNo === orderNo);
    }
}

// Global olarak dışa aktar
window.DataService = new DataService();

// ES modul uyumluluğu
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataService: window.DataService };
}
