/**
 * erp-service.js
 * Canias ERP sistemi ile entegrasyon
 */

import AppConfig from '../config/app-config.js';
import EventBus from '../utils/event-bus.js';
import Logger from '../utils/logger.js';

// ERP Servis Sınıfı
class ERPService {
    // Sınıf özellikleri
    sessionId = null;
    lastConnectionTime = null;
    connectionStatus = 'disconnected';
    reservedMaterials = {}; // Sipariş bazlı rezerve edilmiş malzemeler
    cachedStockData = null; // Önbelleğe alınmış stok verileri
    cachedOrderData = null; // Önbelleğe alınmış sipariş verileri
    cachedProductionData = null; // Önbelleğe alınmış üretim verileri
    lastSyncTime = null; // Son senkronizasyon zamanı
    allocatedMaterials = {}; // Siparişlere atanmış malzemelerin durumu
    purchaseRequests = []; // Satın alma talepleri

    constructor() {
        // Yerel verileri yükle
        this.loadDataLocally();
        
        // Otomatik senkronizasyonu başlat
        this.setupAutoSync();
        
        // Çevrimiçi/çevrimdışı durum değişikliklerini izle
        this.setupConnectionMonitoring();
    }
    
    // Tüm verileri yerel olarak sakla
    saveDataLocally() {
        try {
            // LocalStorage'a kaydet
            localStorage.setItem('mets:stockData', JSON.stringify(this.cachedStockData || []));
            localStorage.setItem('mets:orderData', JSON.stringify(this.cachedOrderData || []));
            localStorage.setItem('mets:reservedMaterials', JSON.stringify(this.reservedMaterials || {}));
            localStorage.setItem('mets:allocatedMaterials', JSON.stringify(this.allocatedMaterials || {}));
            localStorage.setItem('mets:purchaseRequests', JSON.stringify(this.purchaseRequests || []));
            localStorage.setItem('mets:lastSyncTime', this.lastSyncTime?.toISOString() || new Date().toISOString());
            localStorage.setItem('mets:productionData', JSON.stringify(this.cachedProductionData || []));
            
            Logger.info('Veriler yerel olarak kaydedildi');
            return true;
        } catch (error) {
            Logger.error('Verileri yerel olarak kaydederken hata:', error);
            return false;
        }
    }
    
    // Yerel verileri yükle
    loadDataLocally() {
        try {
            // LocalStorage'dan yükle
            const stockData = localStorage.getItem('mets:stockData');
            const orderData = localStorage.getItem('mets:orderData');
            const reservedMaterials = localStorage.getItem('mets:reservedMaterials');
            const allocatedMaterials = localStorage.getItem('mets:allocatedMaterials');
            const purchaseRequests = localStorage.getItem('mets:purchaseRequests');
            const lastSyncTime = localStorage.getItem('mets:lastSyncTime');
            const productionData = localStorage.getItem('mets:productionData');
            
            if (stockData) this.cachedStockData = JSON.parse(stockData);
            if (orderData) this.cachedOrderData = JSON.parse(orderData);
            if (reservedMaterials) this.reservedMaterials = JSON.parse(reservedMaterials);
            if (allocatedMaterials) this.allocatedMaterials = JSON.parse(allocatedMaterials);
            if (purchaseRequests) this.purchaseRequests = JSON.parse(purchaseRequests);
            if (lastSyncTime) this.lastSyncTime = new Date(lastSyncTime);
            if (productionData) this.cachedProductionData = JSON.parse(productionData);
            
            Logger.info('Veriler yerel olarak yüklendi');
            
            // Çevrimdışı mod için bağlantı durumunu kontrol et
            if (!window.navigator.onLine) {
                this.connectionStatus = 'offline';
                Logger.info('Çevrimdışı mod aktif');
                
                // Çevrimdışı mod olayını yayınla
                EventBus.emit('erpOfflineMode', {
                    time: new Date(),
                    cachedDataAvailable: this.hasLocalData()
                });
            }
            
            return true;
        } catch (error) {
            Logger.error('Verileri yerel olarak yüklerken hata:', error);
            return false;
        }
    }
    
    // Otomatik periyodik senkronizasyon
    setupAutoSync() {
        // Her 5 dakikada bir verileri yerel olarak kaydet
        setInterval(() => {
            this.saveDataLocally();
        }, 5 * 60 * 1000); // 5 dakika
        
        // Sayfa kapatılırken verileri kaydet
        window.addEventListener('beforeunload', () => {
            this.saveDataLocally();
        });
        
        Logger.info('Otomatik senkronizasyon başlatıldı');
    }
    
    // Belirli bir tür için yerel veri olup olmadığını kontrol et
    hasLocalData(dataType = null) {
        if (!dataType) {
            // Herhangi bir veri var mı kontrol et
            return !!(this.cachedStockData || this.cachedOrderData || this.cachedProductionData);
        }
        
        switch(dataType.toLowerCase()) {
            case 'stock':
                return !!(this.cachedStockData && this.cachedStockData.length > 0);
            case 'orders':
                return !!(this.cachedOrderData && this.cachedOrderData.length > 0);
            case 'production':
                return !!(this.cachedProductionData && this.cachedProductionData.length > 0);
            default:
                return false;
        }
    }
    
    // Tüm ERP verilerini getir (chatbot için)
    async getAllData(forceRefresh = false) {
        try {
            const stockData = await this.getStockData(forceRefresh);
            const orderData = await this.getOrderData(forceRefresh);
            const productionData = await this.getProductionData(forceRefresh);
            
            return {
                stockData,
                orderData,
                productionData,
                connectionStatus: this.connectionStatus,
                lastSyncTime: this.lastSyncTime
            };
        } catch (error) {
            Logger.error('Tüm ERP verilerini getirme hatası:', error);
            return {
                stockData: this.cachedStockData || [],
                orderData: this.cachedOrderData || [],
                productionData: this.cachedProductionData || [],
                connectionStatus: 'error',
                error: error.message
            };
        }
    }
    
    // Üretim planı verilerini al
    async getProductionData(forceRefresh = false) {
        try {
            // Önbellekten veri dönme
            if (!forceRefresh && this.cachedProductionData && this.lastSyncTime) {
                const cacheAge = new Date() - this.lastSyncTime;
                const maxCacheAge = AppConfig.erpIntegration.syncInterval * 60 * 1000; // dakika -> milisaniye
                
                if (cacheAge < maxCacheAge) {
                    Logger.info('Önbellekten üretim planı verisi kullanılıyor');
                    return this.cachedProductionData;
                }
            }
            
            if (!AppConfig.erpIntegration.enabled) {
                const demoData = await this.getDemoProductionData();
                this.cachedProductionData = demoData;
                this.lastSyncTime = new Date();
                this.saveDataLocally();
                return demoData;
            }
            
            // Çevrimdışı kontrol
            if (!window.navigator.onLine) {
                Logger.info('Çevrimdışı mod: Önbellekten üretim planı verisi kullanılıyor');
                return this.cachedProductionData || [];
            }
            
            // Gerçek API çağrısı
            const response = await fetch(`${AppConfig.erpIntegration.apiEndpoint}/production`, {
                headers: {
                    'Authorization': `Bearer ${this.sessionId}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Üretim planı verisi alınamadı: ${response.status}`);
            }
            
            const data = await response.json();
            this.cachedProductionData = data;
            this.lastSyncTime = new Date();
            
            // Yerel olarak kaydet
            this.saveDataLocally();
            
            return data;
        } catch (error) {
            Logger.error('Üretim planı verisi getirme hatası:', error);
            
            // Hata durumunda önbelleği kullan
            if (this.cachedProductionData) {
                return this.cachedProductionData;
            }
            
            // Önbellek yoksa demo veri kullan
            return this.getDemoProductionData();
        }
    }
    
    // Demo üretim planı verileri
    async getDemoProductionData() {
        // Demo üretim planı verileri
        const demoData = [
            {
                orderId: 'ORD001',
                orderNo: 'S12345',
                scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 gün sonra
                estimatedCompletion: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 gün sonra
                currentStage: 'design',
                progress: 15,
                responsiblePerson: 'Ahmet Yılmaz',
                notes: 'Tasarım aşamasında, elektrik şemaları hazırlanıyor'
            },
            {
                orderId: 'ORD002',
                orderNo: 'S12346',
                scheduledDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 gün önce
                estimatedCompletion: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 gün sonra
                currentStage: 'assembly',
                progress: 60,
                responsiblePerson: 'Mehmet Demir',
                notes: 'Montaj devam ediyor, malzeme tedariki tamamlandı'
            },
            {
                orderId: 'ORD003',
                orderNo: 'S12347',
                scheduledDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 gün önce
                estimatedCompletion: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 gün sonra
                currentStage: 'wiring',
                progress: 85,
                responsiblePerson: 'Ali Kaya',
                notes: 'Kablaj işlemleri devam ediyor, test aşamasına hazırlanıyor'
            },
            {
                orderId: 'ORD004',
                orderNo: 'S12348',
                scheduledDate: new Date(Date.now()),
                estimatedCompletion: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 gün sonra
                currentStage: 'procurement',
                progress: 30,
                responsiblePerson: 'Ayşe Yıldız',
                notes: 'Malzeme tedariki devam ediyor, bazı parçalar için tedarik sorunu var'
            },
            {
                orderId: 'ORD005',
                orderNo: 'S12349',
                scheduledDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 gün önce
                estimatedCompletion: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 gün sonra
                currentStage: 'testing',
                progress: 95,
                responsiblePerson: 'Fatma Şahin',
                notes: 'Test aşamasında, son kontroller yapılıyor'
            }
        ];
        
        return demoData;
    }
    
    // Çevrimiçi/çevrimdışı durum değişikliklerini izle
    setupConnectionMonitoring() {
        // Çevrimiçi olunca
        window.addEventListener('online', () => {
            Logger.info('İnternet bağlantısı kuruldu');
            this.connectionStatus = 'reconnecting';
            
            // Bağlantıyı yeniden kur
            this.connect().then(() => {
                // Verileri senkronize et
                this.getStockData(true);
                this.getOrderData(true);
                this.getProductionData(true);
                
                // Çevrimiçi olayını yayınla
                EventBus.emit('erpOnlineMode', {
                    time: new Date(),
                    sessionId: this.sessionId
                });
            });
        });
        
        // Çevrimdışı olunca
        window.addEventListener('offline', () => {
            Logger.info('İnternet bağlantısı kesildi');
            this.connectionStatus = 'offline';
            
            // Çevrimdışı olayını yayınla
            EventBus.emit('erpOfflineMode', {
                time: new Date(),
                cachedDataAvailable: this.hasLocalData()
            });
        });
    }
    
    // ERP Bağlantısı Kur
    async connect() {
        try {
            if (!AppConfig.erpIntegration.enabled) {
                Logger.info('ERP entegrasyonu devre dışı, demo mod kullanılıyor');
                return { success: true, mode: 'demo' };
            }
            
            const { host, port, username, password } = AppConfig.erpIntegration;
            
            Logger.info(`Canias ERP'ye bağlanılıyor: ${host}:${port}`);
            
            const response = await fetch(`${AppConfig.erpIntegration.apiEndpoint}/connect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password,
                    client: 'MehmetEndustriyelTakip'
                })
            });
            
            if (!response.ok) {
                throw new Error(`ERP bağlantısı başarısız: ${response.status}`);
            }
            
            const data = await response.json();
            
            this.sessionId = data.sessionId;
            this.lastConnectionTime = new Date();
            this.connectionStatus = 'connected';
            
            Logger.info('Canias ERP bağlantısı başarılı');
            
            // Rezerve edilen malzemeleri yükle
            await this.loadReservedMaterials();
            
            // Bağlantıyı yayınla
            EventBus.emit('erpConnected', {
                time: this.lastConnectionTime,
                sessionId: this.sessionId
            });
            
            return data;
        } catch (error) {
            Logger.error("ERP bağlantısı sırasında hata:", error);
            this.connectionStatus = 'error';
            
            // Bağlantı hatası olayını yayınla
            EventBus.emit('erpConnectionError', {
                time: new Date(),
                error: error.message
            });
            
            return { success: false, error: error.message };
        }
    }
    
    // Bağlantıyı Kontrol Et
    async checkConnection() {
        if (!AppConfig.erpIntegration.enabled) {
            return { connected: true, mode: 'demo' };
        }
        
        if (!this.sessionId) {
            return { connected: false, error: 'Oturum başlatılmamış' };
        }
        
        try {
            const response = await fetch(`${AppConfig.erpIntegration.apiEndpoint}/ping`, {
                headers: {
                    'Authorization': `Bearer ${this.sessionId}`
                }
            });
            
            if (!response.ok) {
                this.connectionStatus = 'disconnected';
                return { connected: false, error: 'Bağlantı kesildi' };
            }
            
            this.connectionStatus = 'connected';
            return { connected: true };
        } catch (error) {
            this.connectionStatus = 'error';
            return { connected: false, error: error.message };
        }
    }
    
    /**
     * Stok bilgilerini al
     * @param {boolean} forceRefresh Önbelleği zorla yenile
     * @returns {Promise<Array>} Stok verileri
     */
    async getStockData(forceRefresh = false) {
        try {
            // Önbellekten veri dönme
            if (!forceRefresh && this.cachedStockData && this.lastSyncTime) {
                const cacheAge = new Date() - this.lastSyncTime;
                const maxCacheAge = AppConfig.erpIntegration.syncInterval * 60 * 1000; // dakika -> milisaniye
                
                if (cacheAge < maxCacheAge) {
                    Logger.info('Önbellekten stok verisi kullanılıyor');
                    return this.cachedStockData;
                }
            }
            
            if (!AppConfig.erpIntegration.enabled) {
                const demoData = await this.getDemoStockData();
                this.cachedStockData = demoData;
                this.lastSyncTime = new Date();
                return demoData;
            }
            
            // Bağlantı kontrolü
            const connectionStatus = await this.checkConnection();
            if (!connectionStatus.connected) {
                await this.connect();
            }
            
            Logger.info('Canias ERP\'den stok verisi alınıyor');
            
            const response = await fetch(`${AppConfig.erpIntegration.apiEndpoint}/stock`, {
                headers: {
                    'Authorization': `Bearer ${this.sessionId}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`ERP stok verisi alınamadı: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Rezervasyon bilgilerini ekle ve önbelleğe al
            const processedData = this.processStockDataWithReservations(data);
            this.cachedStockData = processedData;
            this.lastSyncTime = new Date();
            
            // Stok verisi olayını yayınla
            EventBus.emit('stockDataReceived', {
                time: new Date(),
                count: data.length,
                source: 'erp'
            });
            
            return processedData;
        } catch (error) {
            Logger.error("ERP stok verisi alınırken hata:", error);
            
            // Hata olayını yayınla
            EventBus.emit('erpDataError', {
                time: new Date(),
                type: 'stock',
                error: error.message
            });
            
            // Önbellek varsa onu kullan, yoksa demo verisi dön
            if (this.cachedStockData) {
                return this.cachedStockData;
            }
            
            const demoData = await this.getDemoStockData();
            this.cachedStockData = demoData;
            this.lastSyncTime = new Date();
            return demoData;
        }
    }
    
    /**
     * Sipariş bilgilerini al
     * @param {boolean} forceRefresh Önbelleği zorla yenile
     * @returns {Promise<Array>} Sipariş verileri
     */
    async getOrderData(forceRefresh = false) {
        try {
            // Önbellekten veri dönme
            if (!forceRefresh && this.cachedOrderData && this.lastSyncTime) {
                const cacheAge = new Date() - this.lastSyncTime;
                const maxCacheAge = AppConfig.erpIntegration.syncInterval * 60 * 1000; // dakika -> milisaniye
                
                if (cacheAge < maxCacheAge) {
                    Logger.info('Önbellekten sipariş verisi kullanılıyor');
                    return this.cachedOrderData;
                }
            }
            
            if (!AppConfig.erpIntegration.enabled) {
                const demoData = await this.getDemoOrderData();
                this.cachedOrderData = demoData;
                this.lastSyncTime = new Date();
                return demoData;
            }
            
            // Bağlantı kontrolü
            const connectionStatus = await this.checkConnection();
            if (!connectionStatus.connected) {
                await this.connect();
            }
            
            Logger.info('Canias ERP\'den sipariş verisi alınıyor');
            
            const response = await fetch(`${AppConfig.erpIntegration.apiEndpoint}/orders`, {
                headers: {
                    'Authorization': `Bearer ${this.sessionId}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`ERP sipariş verisi alınamadı: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Malzeme rezervasyon bilgilerini ekleyerek siparişleri işle
            const processedData = await this.processOrdersWithReservations(data);
            this.cachedOrderData = processedData;
            this.lastSyncTime = new Date();
            
            // Sipariş verisi olayını yayınla
            EventBus.emit('orderDataReceived', {
                time: new Date(),
                count: data.length,
                source: 'erp'
            });
            
            return processedData;
        } catch (error) {
            Logger.error("ERP sipariş verisi alınırken hata:", error);
            
            // Hata olayını yayınla
            EventBus.emit('erpDataError', {
                time: new Date(),
                type: 'orders',
                error: error.message
            });
            
            // Önbellek varsa onu kullan, yoksa demo verisi dön
            if (this.cachedOrderData) {
                return this.cachedOrderData;
            }
            
            const demoData = await this.getDemoOrderData();
            this.cachedOrderData = demoData;
            this.lastSyncTime = new Date();
            return demoData;
        }
    }
    
    /**
     * Bir sipariş için malzemeleri rezerve eder ve stokta bulunmayanlar için satın alma süreci başlatır.
     * @param {string} orderId Sipariş ID
     * @param {Array<object>} materials Sipariş için gerekli malzemeler
     * @returns {Promise<object>} Rezervasyon sonuçları
     */
    async reserveMaterialsForOrder(orderId, materials) {
        const result = {
            success: true,
            errors: [],
            reservations: [],
            shortages: []
        };

        if (!materials || !Array.isArray(materials) || materials.length === 0) {
            result.success = false;
            result.errors.push('Geçerli malzeme listesi sağlanmadı');
            Logger.error(`[${orderId}] Sipariş için malzeme rezervasyonu yapılamadı: Geçerli malzeme listesi sağlanmadı`);
            return result;
        }

        Logger.info(`[${orderId}] Sipariş için ${materials.length} malzeme rezervasyonu başlatılıyor...`);

        try {
            // Stok verilerini getir
            const stockData = await this.getStockData(true); // Güncel verileri al
            
            if (!stockData || stockData.length === 0) {
                result.success = false;
                result.errors.push('Stok verileri alınamadı');
                Logger.error(`[${orderId}] Sipariş için malzeme rezervasyonu yapılamadı: Stok verileri alınamadı`);
                return result;
            }

            // Malzemeleri döngüye al ve her biri için rezervasyon işlemi yap
            for (const material of materials) {
                const { code, quantity = 1, name = 'Bilinmeyen Malzeme' } = material;
                
                if (!code) {
                    result.errors.push(`Malzeme kodu boş: ${name}`);
                    Logger.warn(`[${orderId}] Bir malzeme için kod belirtilmedi: ${name}`);
                    continue;
                }

                // Stokta malzemeyi bul
                const stockItem = stockData.find(item => item.code === code);
                
                if (!stockItem) {
                    result.errors.push(`Malzeme stokta bulunamadı: ${code} - ${name}`);
                    result.shortages.push({
                        code,
                        name,
                        requiredQuantity: quantity,
                        availableQuantity: 0,
                        shortage: quantity
                    });
                    Logger.warn(`[${orderId}] Malzeme stokta bulunamadı: ${code} - ${name}`);
                    continue;
                }

                // Mevcut rezervasyonları hesaba kat
                const currentReservations = this.getReservationsForMaterial(code);
                const totalReserved = Object.values(currentReservations).reduce((sum, qty) => sum + qty, 0);
                
                // Kullanılabilir stok = Mevcut stok - Toplam rezerve miktar
                const availableStock = Math.max(0, stockItem.currentStock - totalReserved);
                
                if (availableStock >= quantity) {
                    // Yeterli stok var, rezervasyon yap
                    if (!this.reservedMaterials[orderId]) {
                        this.reservedMaterials[orderId] = {};
                    }
                    
                    // Önceki rezervasyonu güncelle veya yeni oluştur
                    this.reservedMaterials[orderId][code] = (this.reservedMaterials[orderId][code] || 0) + quantity;
                    
                    result.reservations.push({
                        code,
                        name: stockItem.name || name,
                        quantity,
                        unit: stockItem.unit || 'adet',
                        stockBefore: availableStock,
                        stockAfter: availableStock - quantity
                    });
                    
                    Logger.info(`[${orderId}] Malzeme rezerve edildi: ${code} - ${quantity} ${stockItem.unit || 'adet'} (Kalan: ${availableStock - quantity})`);
                } else {
                    // Stok yetersiz
                    const shortage = quantity - availableStock;
                    
                    // Mevcut stok kadar rezerve et
                    if (availableStock > 0) {
                        if (!this.reservedMaterials[orderId]) {
                            this.reservedMaterials[orderId] = {};
                        }
                        
                        this.reservedMaterials[orderId][code] = (this.reservedMaterials[orderId][code] || 0) + availableStock;
                        
                        result.reservations.push({
                            code,
                            name: stockItem.name || name,
                            quantity: availableStock,
                            unit: stockItem.unit || 'adet',
                            stockBefore: availableStock,
                            stockAfter: 0,
                            partial: true
                        });
                        
                        Logger.info(`[${orderId}] Malzeme kısmen rezerve edildi: ${code} - ${availableStock}/${quantity} ${stockItem.unit || 'adet'} (Eksik: ${shortage})`);
                    }
                    
                    result.errors.push(`${code} - ${stockItem.name || name} için stok yetersiz (Gerekli: ${quantity}, Mevcut: ${availableStock}, Eksik: ${shortage})`);
                    result.shortages.push({
                        code,
                        name: stockItem.name || name,
                        requiredQuantity: quantity,
                        availableQuantity: availableStock,
                        shortage,
                        unit: stockItem.unit || 'adet'
                    });
                    
                    Logger.warn(`[${orderId}] Malzeme için stok yetersiz: ${code} - ${stockItem.name || name} (Gerekli: ${quantity}, Mevcut: ${availableStock}, Eksik: ${shortage})`);
                }
            }
            
            // Rezervasyon bilgilerini yerel olarak kaydet
            this.saveReservedMaterials();
            
            // Eksik malzemeler varsa satın alma event'i tetikle
            if (result.shortages.length > 0) {
                EventBus.emit('materialShortage', {
                    orderId,
                    shortages: result.shortages,
                    time: new Date()
                });
                
                result.success = false; // En az bir malzeme eksiği var
            }
            
            // Sipariş için malzeme durumunu güncelle
            await this.updateOrderMaterialStatus(orderId);
            
            return result;
        } catch (error) {
            Logger.error(`[${orderId}] Malzeme rezervasyonu sırasında hata: ${error.message}`, error);
            result.success = false;
            result.errors.push(`Sistem hatası: ${error.message}`);
            return result;
        }
    }
    
    // Satın alma talebi oluştur
    async createPurchaseRequest(orderId, materialCode, quantity, requiredDate) {
        try {
            if (!orderId || !materialCode || !quantity) {
                throw new Error("Geçersiz sipariş veya malzeme bilgileri");
            }
            
            const purchaseRequest = {
                id: `PR-${Date.now()}`,
                orderId,
                materialCode,
                quantity,
                requiredDate: requiredDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // varsayılan 1 hafta
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date(),
                priority: this.calculatePurchaseRequestPriority(orderId, requiredDate)
            };
            
            Logger.info(`Satın alma talebi oluşturuldu: ${purchaseRequest.id} (${materialCode}, ${quantity} adet)`);
            
            // Siparişe bağlı satın alma talebini kaydet
            if (this.allocatedMaterials[orderId]) {
                this.allocatedMaterials[orderId].purchaseRequests.push(purchaseRequest);
            }
            
            // Küresel satın alma talepleri listesini güncelle
            if (!this.purchaseRequests) {
                this.purchaseRequests = [];
            }
            
            this.purchaseRequests.push(purchaseRequest);
            
            // Satın alma talebi olayını yayınla
            EventBus.emit('purchaseRequestCreated', {
                purchaseRequest,
                time: new Date()
            });
            
            return {
                success: true,
                purchaseRequest
            };
        } catch (error) {
            Logger.error(`Satın alma talebi oluşturma hatası: ${error.message}`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Satın alma talebi önceliğini hesapla
    calculatePurchaseRequestPriority(orderId, requiredDate) {
        try {
            // Varsayılan öncelik: normal
            let priority = 'normal';
            
            // Sipariş bilgilerini kontrol et
            const orderData = this.cachedOrderData?.find(order => order.id === orderId || order.orderNo === orderId);
            
            if (!orderData) {
                return priority;
            }
            
            // Müşteri önceliği kontrol et (VIP müşteriler)
            if (orderData.customerPriority === 'high' || orderData.customerType === 'vip') {
                priority = 'high';
            }
            
            // Termin tarihi kontrol et
            if (requiredDate) {
                const now = new Date();
                const dayDiff = Math.ceil((new Date(requiredDate) - now) / (1000 * 60 * 60 * 24));
                
                // 7 günden az kaldıysa yüksek öncelik
                if (dayDiff <= 7) {
                    priority = 'high';
                }
                
                // 3 günden az kaldıysa kritik öncelik
                if (dayDiff <= 3) {
                    priority = 'critical';
                }
            }
            
            return priority;
        } catch (error) {
            Logger.error(`Satın alma talebi öncelik hesaplama hatası: ${error.message}`);
            return 'normal';
        }
    }
    
    // Belirli bir malzeme için tüm rezervasyonları hesaplar
    getReservationsForMaterial(materialCode) {
        let totalReserved = 0;
        
        // Tüm siparişlerdeki rezervasyonları kontrol et
        Object.values(this.reservedMaterials).forEach(orderReservations => {
            orderReservations.forEach(reservation => {
                if (reservation.materialCode === materialCode) {
                    totalReserved += reservation.quantity;
                }
            });
        });
        
        return totalReserved;
    }
    
    // Stok verilerine rezervasyon bilgilerini ekle
    processStockDataWithReservations(stockData) {
        if (!stockData || !Array.isArray(stockData)) {
            return [];
        }
        
        // Kopya oluştur
        const processedData = stockData.map(item => ({ ...item }));
        
        // Her stok kalemi için rezervasyon miktarını hesapla
        processedData.forEach(item => {
            const reservedQuantity = this.getReservationsForMaterial(item.materialCode);
            
            // Rezerve edilmiş miktarı ekle
            item.reserved = reservedQuantity;
            
            // Kullanılabilir miktarı hesapla
            item.available = Math.max(0, item.quantity - reservedQuantity);
            
            // Kritik stok seviyesini kontrol et
            item.isCritical = item.available <= (item.criticalLevel || 5);
        });
        
        return processedData;
    }
    
    // Siparişe atanmış malzemelerin durumunu getir
    async getOrderMaterialStatus(orderId) {
        try {
            if (!orderId) {
                throw new Error("Geçersiz sipariş ID'si");
            }
            
            // Sipariş için atanmış malzemeler yoksa boş dön
            if (!this.allocatedMaterials[orderId]) {
                return {
                    success: true,
                    message: "Sipariş için atanmış malzeme bulunamadı",
                    materials: [],
                    missingMaterials: [],
                    purchaseRequests: []
                };
            }
            
            const orderMaterials = this.allocatedMaterials[orderId];
            
            // Satın alma talebi durumlarını güncelle
            if (orderMaterials.purchaseRequests && orderMaterials.purchaseRequests.length > 0) {
                // Her satın alma talebi için durum güncellemesini simüle et
                orderMaterials.purchaseRequests.forEach(request => {
                    // Durum güncelleme mantığı (gerçek sistemde ERP'den güncel veri alınır)
                    // Bu örnek için rastgele durumlar atıyoruz, gerçek sistemde ERP ile senkronize edilmeli
                    const now = new Date();
                    const createdAt = new Date(request.createdAt);
                    const daysPassed = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
                    
                    if (daysPassed > 5 && request.status === 'pending') {
                        request.status = 'ordered';
                        request.updatedAt = now;
                        request.estimatedArrival = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 hafta
                    } else if (daysPassed > 10 && request.status === 'ordered') {
                        request.status = 'received';
                        request.updatedAt = now;
                        request.receivedAt = now;
                    }
                });
            }
            
            return {
                success: true,
                materials: orderMaterials.allocatedMaterials || [],
                missingMaterials: orderMaterials.missingMaterials || [],
                purchaseRequests: orderMaterials.purchaseRequests || [],
                lastUpdated: orderMaterials.lastUpdated
            };
        } catch (error) {
            Logger.error(`Sipariş malzeme durumu getirme hatası: ${error.message}`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Rezerve edilmiş malzemeleri local storage'a kaydet
    saveReservedMaterials() {
        try {
            localStorage.setItem('reservedMaterials', JSON.stringify(this.reservedMaterials));
            localStorage.setItem('allocatedMaterials', JSON.stringify(this.allocatedMaterials));
            localStorage.setItem('purchaseRequests', JSON.stringify(this.purchaseRequests || []));
            
            Logger.info("Rezerve edilmiş malzemeler kaydedildi");
        } catch (error) {
            Logger.error("Rezerve edilmiş malzemeleri kaydetme hatası:", error);
        }
    }
    
    // Rezerve edilmiş malzemeleri local storage'dan yükle
    loadReservedMaterials() {
        try {
            const reservedData = localStorage.getItem('reservedMaterials');
            const allocatedData = localStorage.getItem('allocatedMaterials');
            const purchaseRequestsData = localStorage.getItem('purchaseRequests');
            
            if (reservedData) {
                this.reservedMaterials = JSON.parse(reservedData);
                Logger.info("Rezerve edilmiş malzemeler yüklendi");
            }
            
            if (allocatedData) {
                this.allocatedMaterials = JSON.parse(allocatedData);
                Logger.info("Atanmış malzemeler yüklendi");
            }
            
            if (purchaseRequestsData) {
                this.purchaseRequests = JSON.parse(purchaseRequestsData);
                Logger.info("Satın alma talepleri yüklendi");
            }
        } catch (error) {
            Logger.error("Rezerve edilmiş malzemeleri yükleme hatası:", error);
            this.reservedMaterials = {};
            this.allocatedMaterials = {};
            this.purchaseRequests = [];
        }
    }
    
    /**
     * Demo stok verileri
     * @returns {Promise<Array>}
     */
    async getDemoStockData() {
        // Demo stok verilerini oluştur
        const today = new Date();
        
        return [
            {
                id: 'material-1',
                code: '137998',
                name: 'Siemens 7SR1003-1JA20-2DA0+ZY20 24VDC',
                type: 'elektronik',
                quantity: 5,
                minimumQuantity: 2,
                criticalLevel: true,
                supplier: 'Siemens',
                lastUpdate: today.toISOString(),
                location: 'B01',
                unitPrice: 1870
            },
            {
                id: 'material-2',
                code: '144866',
                name: 'KAP-80/190-95 Akım Trafosu',
                type: 'elektronik',
                quantity: 12,
                minimumQuantity: 5,
                criticalLevel: false,
                supplier: 'ESİTAŞ',
                lastUpdate: today.toISOString(),
                location: 'B01',
                unitPrice: 735
            },
            {
                id: 'material-3',
                code: '120170',
                name: 'M480TB/G-027-95.300UN5 Kablo Başlığı',
                type: 'mekanik',
                quantity: 25,
                minimumQuantity: 10,
                criticalLevel: false,
                supplier: 'Euromold',
                lastUpdate: today.toISOString(),
                location: 'B01',
                unitPrice: 275
            },
            {
                id: 'material-4',
                code: '143756',
                name: 'Kesici - Siemens 3AH5204-1',
                type: 'elektronik',
                quantity: 3,
                minimumQuantity: 2,
                criticalLevel: false,
                supplier: 'Siemens',
                lastUpdate: today.toISOString(),
                location: 'B01',
                unitPrice: 5230
            },
            {
                id: 'material-5',
                code: '135580',
                name: 'Gösterge Lambası',
                type: 'elektronik',
                quantity: 42,
                minimumQuantity: 15,
                criticalLevel: false,
                supplier: 'Schneider',
                lastUpdate: today.toISOString(),
                location: 'B01',
                unitPrice: 75
            },
            {
                id: 'material-6',
                code: '143770',
                name: 'Ayırıcı - Anahtar',
                type: 'mekanik',
                quantity: 7,
                minimumQuantity: 3,
                criticalLevel: false,
                supplier: 'ABB',
                lastUpdate: today.toISOString(),
                location: 'B01',
                unitPrice: 890
            },
            {
                id: 'material-7',
                code: '143590',
                name: 'Sigorta 63A',
                type: 'elektronik',
                quantity: 18,
                minimumQuantity: 10,
                criticalLevel: false,
                supplier: 'Schneider',
                lastUpdate: today.toISOString(),
                location: 'B01',
                unitPrice: 45
            },
            {
                id: 'material-8',
                code: '125790',
                name: 'Analog Ampermetre',
                type: 'elektronik',
                quantity: 0,
                minimumQuantity: 5,
                criticalLevel: true,
                supplier: 'Schneider',
                lastUpdate: today.toISOString(),
                location: 'B01',
                unitPrice: 120
            },
            {
                id: 'material-9',
                code: '132450',
                name: 'Topraklama Anahtarı',
                type: 'mekanik',
                quantity: 9,
                minimumQuantity: 5,
                criticalLevel: false,
                supplier: 'ABB',
                lastUpdate: today.toISOString(),
                location: 'B01',
                unitPrice: 350
            },
            {
                id: 'material-10',
                code: '129654',
                name: 'Bağlantı Kablosu - 95mm²',
                type: 'kablo',
                quantity: 150,
                minimumQuantity: 50,
                criticalLevel: false,
                supplier: 'Prysmian',
                lastUpdate: today.toISOString(),
                location: 'B01',
                unitPrice: 65
            }
        ];
    }
    
    // Demo sipariş verileri
    async getDemoOrderData() {
        // Tarihler
        const today = new Date();
        const past15Days = new Date(today);
        past15Days.setDate(today.getDate() - 15);
        
        const past30Days = new Date(today);
        past30Days.setDate(today.getDate() - 30);
        
        const future15Days = new Date(today);
        future15Days.setDate(today.getDate() + 15);
        
        const future30Days = new Date(today);
        future30Days.setDate(today.getDate() + 30);
        
        return [
            {
                id: 'order-1',
                orderNo: '24-03-A001',
                customer: 'AYEDAŞ',
                cellType: 'RM 36 LB',
                cellCount: 3,
                voltage: '36kV',
                current: '1250A',
                relayType: 'Siemens 7SR1003',
                orderDate: past30Days.toISOString(),
                deliveryDate: future15Days.toISOString(),
                status: 'production',
                progress: 65,
                responsibleUser: 'Ahmet Yılmaz',
                hasWarning: true,
                warningMessage: 'Topraklama anahtarı montaj testi gerekiyor',
                notes: [
                    {
                        id: 'note-1',
                        text: 'Müşteri özel test raporu talep ediyor',
                        type: 'warning',
                        user: 'Mehmet Can',
                        date: past15Days.toISOString()
                    }
                ]
            },
            {
                id: 'order-2',
                orderNo: '24-03-B002',
                customer: 'BAŞKENT EDAŞ',
                cellType: 'RM 36 FL',
                cellCount: 5,
                voltage: '36kV',
                current: '630A',
                relayType: 'ABB REF615',
                orderDate: past30Days.toISOString(),
                deliveryDate: past15Days.toISOString(), // Gecikmiş teslimat
                status: 'waiting',
                progress: 40,
                responsibleUser: 'Ayşe Demir',
                hasWarning: true,
                warningMessage: 'Gecikmiş teslimat',
                hasMaterialIssue: true,
                notes: [
                    {
                        id: 'note-2',
                        text: 'M480TB/G-027-95.300UN5 Kablo Başlığı tedarik sorunu var',
                        type: 'danger',
                        user: 'Ayşe Demir',
                        date: past15Days.toISOString()
                    }
                ]
            },
            {
                id: 'order-3',
                orderNo: '24-03-C003',
                customer: 'ENERJİSA',
                cellType: 'RM 36 CB',
                cellCount: 4,
                voltage: '36kV',
                current: '1250A',
                relayType: 'Siemens 7SR1003',
                orderDate: past30Days.toISOString(),
                deliveryDate: future30Days.toISOString(),
                status: 'ready',
                progress: 100,
                responsibleUser: 'Mehmet Can',
                notes: []
            },
            {
                id: 'order-4',
                orderNo: '24-04-D004',
                customer: 'TOROSLAR EDAŞ',
                cellType: 'RM 36 LB',
                cellCount: 8,
                voltage: '36kV',
                current: '1250A',
                relayType: 'Siemens 7SR1003',
                orderDate: past15Days.toISOString(),
                deliveryDate: future30Days.toISOString(),
                status: 'planning',
                progress: 10,
                responsibleUser: 'Ayşe Demir',
                notes: []
            },
            {
                id: 'order-5',
                orderNo: '24-04-E005',
                customer: 'AYEDAŞ',
                cellType: 'RM 36 CB',
                cellCount: 6,
                voltage: '36kV',
                current: '2000A',
                relayType: 'ABB REF615',
                orderDate: past15Days.toISOString(),
                deliveryDate: future30Days.toISOString(),
                status: 'planning',
                progress: 5,
                responsibleUser: 'Mehmet Can',
                notes: []
            }
        ];
    }
}

// Global olarak erişilebilir hale getir
window.ERPService = ERPService;

// ES modül uyumluluğu
export default ERPService;