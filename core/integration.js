/**
 * integration.js
 * Modüller arası entegrasyon ve iletişimi sağlayan merkezi modül
 */

import EventBus from '../utils/event-bus.js';
import Logger from '../utils/logger.js';

// Modül entegrasyonu sağlayan temel sınıf
class ModuleIntegration {
    static modules = {};
    static initialized = false;
    static serviceStatus = {
        erp: { status: 'pending', lastCheck: null },
        ai: { status: 'pending', lastCheck: null },
        database: { status: 'pending', lastCheck: null }
    };
    
    /**
     * Tüm modülleri başlat ve entegrasyonu sağla
     */
    static init() {
        if (this.initialized) {
            Logger.warn("Modül entegrasyonu zaten başlatılmış");
            return;
        }
        
        Logger.info("Modül entegrasyonu başlatılıyor");
        
        // Olay dinleyicilerini ekle
        this.setupEventListeners();
        
        // Servis durumlarını kontrol et
        this.checkServices();
        
        this.initialized = true;
        Logger.info("Modül entegrasyonu tamamlandı");
    }
    
    /**
     * Olay dinleyicilerini ekle
     */
    static setupEventListeners() {
        // ERP ve AI servis olaylarını dinle
        document.addEventListener('eventbus:erpConnected', this.handleERPConnected.bind(this));
        document.addEventListener('eventbus:erpConnectionError', this.handleERPConnectionError.bind(this));
        document.addEventListener('eventbus:ai:response', this.handleAIResponse.bind(this));
        document.addEventListener('eventbus:ai:error', this.handleAIError.bind(this));
        
        // Veri yükleme olaylarını dinle
        document.addEventListener('eventbus:stockDataReceived', this.handleStockDataReceived.bind(this));
        document.addEventListener('eventbus:orderDataReceived', this.handleOrderDataReceived.bind(this));
        
        // Rezervasyon olaylarını dinle
        document.addEventListener('eventbus:materialsReserved', this.handleMaterialsReserved.bind(this));
        document.addEventListener('eventbus:reservationCancelled', this.handleReservationCancelled.bind(this));
    }
    
    /**
     * Modül kaydet
     * @param {string} name Modül adı
     * @param {Object} instance Modül örneği
     */
    static registerModule(name, instance) {
        this.modules[name] = instance;
        Logger.info(`Modül kaydedildi: ${name}`);
        
        // Modül durumunu yayınla
        EventBus.emit('moduleRegistered', { name, instance });
    }
    
    /**
     * Modül getir
     * @param {string} name Modül adı
     * @returns {Object|null} Modül örneği
     */
    static getModule(name) {
        return this.modules[name] || null;
    }
    
    /**
     * Modülün mevcut olup olmadığını kontrol et
     * @param {string} name Modül adı
     * @returns {boolean} Modül mevcutsa true
     */
    static hasModule(name) {
        return !!this.modules[name];
    }
    
    /**
     * Servislerin durumunu kontrol et
     */
    static async checkServices() {
        try {
            // ERP servis kontrolü
            if (window.ERPService) {
                try {
                    const status = await window.ERPService.checkConnection();
                    this.serviceStatus.erp = {
                        status: status.connected ? 'connected' : 'disconnected',
                        lastCheck: new Date(),
                        details: status
                    };
                } catch (error) {
                    this.serviceStatus.erp = {
                        status: 'error',
                        lastCheck: new Date(),
                        error: error.message
                    };
                }
            }
            
            // AI servis kontrolü
            if (window.AIService) {
                this.serviceStatus.ai = {
                    status: 'available',
                    lastCheck: new Date()
                };
            }
            
            // Veritabanı kontrolü
            if (window.firebase && window.firebase.firestore) {
                this.serviceStatus.database = {
                    status: 'connected',
                    lastCheck: new Date(),
                    type: 'firebase'
                };
            } else if (window.indexedDB) {
                this.serviceStatus.database = {
                    status: 'available',
                    lastCheck: new Date(),
                    type: 'indexedDB'
                };
            }
            
            // Servis durumu olayını yayınla
            EventBus.emit('serviceStatusUpdated', this.serviceStatus);
            
        } catch (error) {
            Logger.error("Servis durumu kontrolü hatası:", error);
        }
    }
    
    /**
     * Sipariş için gereken malzemeleri kontrol et ve rezerve et
     * @param {Object} order Sipariş
     * @returns {Promise<Object>} Sonuç
     */
    static async checkAndReserveMaterials(order) {
        try {
            Logger.info(`Sipariş için malzeme kontrolü yapılıyor: ${order.id || order.orderNo}`);
            
            // Malzeme listesini al veya tahmin et
            let materials = [];
            
            if (order.materials && Array.isArray(order.materials) && order.materials.length > 0) {
                materials = order.materials;
            } else {
                // Malzeme listesini tahmin et
                try {
                    if (window.AIService && typeof window.AIService.predictMaterials === 'function') {
                        const prediction = await window.AIService.predictMaterials({
                            cellType: order.cellType,
                            voltage: order.voltage,
                            current: order.current,
                            customer: order.customer,
                            quantity: order.cellCount || 1
                        });
                        
                        materials = prediction.materials || [];
                    }
                } catch (error) {
                    Logger.error("Malzeme tahmini hatası:", error);
                    return {
                        success: false,
                        error: "Malzeme listesi tahmin edilemedi: " + error.message
                    };
                }
            }
            
            if (materials.length === 0) {
                return {
                    success: false,
                    error: "Malzeme listesi bulunamadı"
                };
            }
            
            // Stok kontrolü
            let stockItems = [];
            
            if (window.ERPService && typeof window.ERPService.getStockData === 'function') {
                stockItems = await window.ERPService.getStockData();
            }
            
            // Malzemelerin stokta olup olmadığını kontrol et
            const availabilityCheck = materials.map(material => {
                const stockItem = stockItems.find(item => item.code === material.code);
                
                if (!stockItem) {
                    return {
                        code: material.code,
                        name: material.name,
                        quantity: material.quantity,
                        available: 0,
                        status: 'not_found',
                        message: 'Malzeme stokta bulunamadı'
                    };
                }
                
                const availableQuantity = stockItem.availableQuantity !== undefined ? 
                    stockItem.availableQuantity : stockItem.quantity;
                
                if (availableQuantity < material.quantity) {
                    return {
                        code: material.code,
                        name: material.name,
                        quantity: material.quantity,
                        available: availableQuantity,
                        status: 'insufficient',
                        message: `Yetersiz stok (İstenilen: ${material.quantity}, Mevcut: ${availableQuantity})`
                    };
                }
                
                return {
                    code: material.code,
                    name: material.name,
                    quantity: material.quantity,
                    available: availableQuantity,
                    status: 'available',
                    message: 'Stokta mevcut'
                };
            });
            
            // Sonuçları hesapla
            const allAvailable = availabilityCheck.every(item => item.status === 'available');
            const notFound = availabilityCheck.filter(item => item.status === 'not_found');
            const insufficient = availabilityCheck.filter(item => item.status === 'insufficient');
            
            // Tüm malzemeler mevcutsa rezervasyon yap
            if (allAvailable && window.ERPService && typeof window.ERPService.reserveMaterialsForOrder === 'function') {
                const reservationResult = await window.ERPService.reserveMaterialsForOrder(
                    order.id, 
                    materials
                );
                
                return {
                    success: reservationResult.success,
                    message: "Tüm malzemeler rezerve edildi",
                    details: reservationResult
                };
            }
            
            return {
                success: false,
                allAvailable,
                notFound: notFound.length > 0 ? notFound : null,
                insufficient: insufficient.length > 0 ? insufficient : null,
                message: `Malzeme kontrolü tamamlandı: ${availabilityCheck.filter(i => i.status === 'available').length}/${materials.length} malzeme mevcut`,
                details: availabilityCheck
            };
            
        } catch (error) {
            Logger.error("Malzeme kontrolü ve rezervasyon hatası:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Üretim süresi tahmin et
     * @param {Object} orderData Sipariş verileri
     * @returns {Promise<Object>} Tahmin bilgileri
     */
    static async predictProductionTime(orderData) {
        try {
            Logger.info(`Üretim süresi tahmini yapılıyor: ${orderData.cellType}`);
            
            if (window.AIService && typeof window.AIService.predictProductionTime === 'function') {
                return await window.AIService.predictProductionTime(orderData);
            }
            
            // AI servisi yoksa varsayılan değerler
            return {
                estimatedDays: this.getDefaultProductionDays(orderData.cellType, orderData.quantity || 1),
                confidence: 0.7,
                source: "integration_default",
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
                success: false,
                error: error.message
            };
        }
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
    
    /**
     * Servis durum bilgilerini getir
     * @returns {Object} Servis durumları
     */
    static getServiceStatus() {
        return {...this.serviceStatus};
    }
    
    // Event Handlers
    
    static handleERPConnected(event) {
        const data = event.detail;
        Logger.info("ERP bağlantısı sağlandı", data);
        
        this.serviceStatus.erp = {
            status: 'connected',
            lastCheck: new Date(),
            details: data
        };
        
        EventBus.emit('serviceStatusUpdated', this.serviceStatus);
    }
    
    static handleERPConnectionError(event) {
        const data = event.detail;
        Logger.warn("ERP bağlantı hatası", data);
        
        this.serviceStatus.erp = {
            status: 'error',
            lastCheck: new Date(),
            error: data.error
        };
        
        EventBus.emit('serviceStatusUpdated', this.serviceStatus);
    }
    
    static handleAIResponse(event) {
        const data = event.detail;
        Logger.info("AI yanıt alındı", { source: data.source });
        
        this.serviceStatus.ai = {
            status: 'connected',
            lastCheck: new Date(),
            source: data.source
        };
        
        EventBus.emit('serviceStatusUpdated', this.serviceStatus);
    }
    
    static handleAIError(event) {
        const data = event.detail;
        Logger.warn("AI hatası", data);
        
        this.serviceStatus.ai = {
            status: 'error',
            lastCheck: new Date(),
            error: data.error
        };
        
        EventBus.emit('serviceStatusUpdated', this.serviceStatus);
    }
    
    static handleStockDataReceived(event) {
        const data = event.detail;
        Logger.info("Stok verisi alındı", { count: data.count, source: data.source });
        
        // Stok verisi olayını yeniden yayınla
        EventBus.emit('stockUpdated', data);
    }
    
    static handleOrderDataReceived(event) {
        const data = event.detail;
        Logger.info("Sipariş verisi alındı", { count: data.count, source: data.source });
        
        // Sipariş verisi olayını yeniden yayınla
        EventBus.emit('ordersUpdated', data);
    }
    
    static handleMaterialsReserved(event) {
        const data = event.detail;
        Logger.info("Malzeme rezervasyonu yapıldı", { orderId: data.orderId });
        
        // Rezervasyon olayını yeniden yayınla
        EventBus.emit('materialReservationSuccess', data);
    }
    
    static handleReservationCancelled(event) {
        const data = event.detail;
        Logger.info("Rezervasyon iptal edildi", { orderId: data.orderId });
        
        // İptal olayını yeniden yayınla
        EventBus.emit('reservationCancelSuccess', data);
    }
}

// Global olarak erişilebilir yap
window.ModuleIntegration = ModuleIntegration;

// ES modülü olarak dışa aktar
export default ModuleIntegration; 