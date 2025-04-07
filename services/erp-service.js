/**
 * erp-service.js
 * Canias ERP sistemi ile entegrasyon
 */

import AppConfig from '../config/app-config.js';
import EventBus from '../utils/event-bus.js';
import Logger from '../utils/logger.js';

// ERP Servis Sınıfı
class ERPService {
    constructor() {
        this.sessionId = null;
        this.lastConnectionTime = null;
        this.connectionStatus = 'disconnected';
    }
    
    // ERP Bağlantısı Kur
    static async connect() {
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
            
            // Bağlantı olayını yayınla
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
    static async checkConnection() {
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
    
    // Stok bilgilerini al
    static async getStockData() {
        try {
            if (!AppConfig.erpIntegration.enabled) {
                return await this.getDemoStockData();
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
            
            // Stok verisi olayını yayınla
            EventBus.emit('stockDataReceived', {
                time: new Date(),
                count: data.length,
                source: 'erp'
            });
            
            return data;
        } catch (error) {
            Logger.error("ERP stok verisi alınırken hata:", error);
            
            // Hata olayını yayınla
            EventBus.emit('erpDataError', {
                time: new Date(),
                type: 'stock',
                error: error.message
            });
            
            return await this.getDemoStockData();
        }
    }
    
    // Sipariş bilgilerini al
    static async getOrderData() {
        try {
            if (!AppConfig.erpIntegration.enabled) {
                return await this.getDemoOrderData();
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
            
            // Sipariş verisi olayını yayınla
            EventBus.emit('orderDataReceived', {
                time: new Date(),
                count: data.length,
                source: 'erp'
            });
            
            return data;
        } catch (error) {
            Logger.error("ERP sipariş verisi alınırken hata:", error);
            
            // Hata olayını yayınla
            EventBus.emit('erpDataError', {
                time: new Date(),
                type: 'orders',
                error: error.message
            });
            
            return await this.getDemoOrderData();
        }
    }
    
    // Müşteri bilgilerini al
    static async getCustomerData() {
        try {
            if (!AppConfig.erpIntegration.enabled) {
                return await this.getDemoCustomerData();
            }
            
            // Bağlantı kontrolü
            const connectionStatus = await this.checkConnection();
            if (!connectionStatus.connected) {
                await this.connect();
            }
            
            Logger.info('Canias ERP\'den müşteri verisi alınıyor');
            
            const response = await fetch(`${AppConfig.erpIntegration.apiEndpoint}/customers`, {
                headers: {
                    'Authorization': `Bearer ${this.sessionId}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`ERP müşteri verisi alınamadı: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Müşteri verisi olayını yayınla
            EventBus.emit('customerDataReceived', {
                time: new Date(),
                count: data.length,
                source: 'erp'
            });
            
            return data;
        } catch (error) {
            Logger.error("ERP müşteri verisi alınırken hata:", error);
            
            // Hata olayını yayınla
            EventBus.emit('erpDataError', {
                time: new Date(),
                type: 'customers',
                error: error.message
            });
            
            return await this.getDemoCustomerData();
        }
    }
    
    // Malzeme listesini al
    static async getMaterialListData(orderType) {
        try {
            if (!AppConfig.erpIntegration.enabled) {
                return await this.getDemoMaterialListData(orderType);
            }
            
            // Bağlantı kontrolü
            const connectionStatus = await this.checkConnection();
            if (!connectionStatus.connected) {
                await this.connect();
            }
            
            Logger.info(`Canias ERP'den ${orderType} için malzeme listesi alınıyor`);
            
            const response = await fetch(`${AppConfig.erpIntegration.apiEndpoint}/material-lists?type=${orderType}`, {
                headers: {
                    'Authorization': `Bearer ${this.sessionId}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`ERP malzeme listesi alınamadı: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Malzeme listesi olayını yayınla
            EventBus.emit('materialListReceived', {
                time: new Date(),
                orderType,
                count: data.length,
                source: 'erp'
            });
            
            return data;
        } catch (error) {
            Logger.error("ERP malzeme listesi alınırken hata:", error);
            
            // Hata olayını yayınla
            EventBus.emit('erpDataError', {
                time: new Date(),
                type: 'materialList',
                orderType,
                error: error.message
            });
            
            return await this.getDemoMaterialListData(orderType);
        }
    }
    
    // Satınalma durumunu al
    static async getPurchaseStatus(materialCodes) {
        try {
            if (!AppConfig.erpIntegration.enabled || !AppConfig.erpIntegration.modules.purchasing) {
                return await this.getSimulatedPurchaseStatus(materialCodes);
            }
            
            // Bağlantı kontrolü
            const connectionStatus = await this.checkConnection();
            if (!connectionStatus.connected) {
                await this.connect();
            }
            
            Logger.info(`Canias ERP'den ${materialCodes.length} malzeme için satınalma durumu alınıyor`);
            
            const response = await fetch(`${AppConfig.erpIntegration.apiEndpoint}/purchase-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.sessionId}`
                },
                body: JSON.stringify({ materialCodes })
            });
            
            if (!response.ok) {
                throw new Error(`ERP satınalma durumu alınamadı: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            Logger.error("ERP satınalma durumu alınırken hata:", error);
            return await this.getSimulatedPurchaseStatus(materialCodes);
        }
    }
    
    // Simüle edilmiş satınalma durumu
    static async getSimulatedPurchaseStatus(materialCodes) {
        const result = {};
        const stockData = await this.getDemoStockData();
        
        // Her malzeme için simüle edilmiş satınalma durumu oluştur
        for (const code of materialCodes) {
            const material = stockData.find(item => item.code === code);
            
            if (material && material.onOrder > 0) {
                // Eğer sipariş edilmiş miktar varsa
                result[code] = {
                    code,
                    name: material.name,
                    onOrder: material.onOrder,
                    expectedDate: material.expectedDate,
                    supplier: "Demo Tedarikçi A.Ş.",
                    purchaseOrderNo: `PO-${Math.floor(Math.random() * 10000)}`,
                    status: "confirmed"
                };
            } else {
                // Sipariş edilmemiş
                result[code] = {
                    code,
                    name: material ? material.name : `Malzeme ${code}`,
                    onOrder: 0,
                    expectedDate: null,
                    supplier: null,
                    purchaseOrderNo: null,
                    status: "not_ordered"
                };
            }
        }
        
        return result;
    }
    
    // Üretim Planlama verilerini al
    static async getProductionPlanData() {
        try {
            if (!AppConfig.erpIntegration.enabled || !AppConfig.erpIntegration.modules.production) {
                return await this.getSimulatedProductionPlanData();
            }
            
            // Bağlantı kontrolü
            const connectionStatus = await this.checkConnection();
            if (!connectionStatus.connected) {
                await this.connect();
            }
            
            Logger.info('Canias ERP\'den üretim plan verisi alınıyor');
            
            const response = await fetch(`${AppConfig.erpIntegration.apiEndpoint}/production-plan`, {
                headers: {
                    'Authorization': `Bearer ${this.sessionId}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`ERP üretim plan verisi alınamadı: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            Logger.error("ERP üretim plan verisi alınırken hata:", error);
            return await this.getSimulatedProductionPlanData();
        }
    }
    
    // Simüle edilmiş üretim planlama verisi
    static async getSimulatedProductionPlanData() {
        const today = new Date();
        
        // Üretim bölümleri
        const departments = ["Montaj", "Kablaj", "Test", "Kalite Kontrol"];
        
        // Demo sipariş verilerini al
        const orders = await this.getDemoOrderData();
        
        // Her sipariş için üretim planı oluştur
        const productionPlans = [];
        
        for (const order of orders) {
            if (order.status === "production" || order.status === "planned") {
                // Üretim başlangıç tarihi
                const startDate = new Date(today);
                startDate.setDate(today.getDate() - Math.floor(Math.random() * 5)); // 0-5 gün önce
                
                // Her departman için iş planı oluştur
                const departmentPlans = [];
                let currentDate = new Date(startDate);
                
                for (const dept of departments) {
                    // Departman için gereken gün sayısı
                    const daysNeeded = Math.ceil(Math.random() * 3) + 1; // 1-4 gün
                    
                    // Bitiş tarihi
                    const endDate = new Date(currentDate);
                    endDate.setDate(currentDate.getDate() + daysNeeded);
                    
                    departmentPlans.push({
                        department: dept,
                        startDate: new Date(currentDate),
                        endDate,
                        status: currentDate < today ? (endDate < today ? "completed" : "in_progress") : "planned",
                        resources: ["Operatör" + Math.floor(Math.random() * 5 + 1)],
                        completionPercentage: currentDate < today ? (endDate < today ? 100 : Math.floor((today - currentDate) / (endDate - currentDate) * 100)) : 0
                    });
                    
                    // Sonraki departman için tarihi güncelle
                    currentDate = new Date(endDate);
                }
                
                productionPlans.push({
                    orderId: order.id,
                    customer: order.customer,
                    cellType: order.cellType,
                    quantity: order.quantity,
                    startDate,
                    plannedEndDate: departmentPlans[departmentPlans.length - 1].endDate,
                    status: order.status === "production" ? "in_progress" : "planned",
                    departments: departmentPlans
                });
            }
        }
        
        return productionPlans;
    }
    
    // Stok rezervasyonu
    static async reserveStock(materials, orderId) {
        try {
            if (!AppConfig.erpIntegration.enabled || !AppConfig.erpIntegration.modules.inventory) {
                return await this.simulateStockReservation(materials, orderId);
            }
            
            // Bağlantı kontrolü
            const connectionStatus = await this.checkConnection();
            if (!connectionStatus.connected) {
                await this.connect();
            }
            
            Logger.info(`Canias ERP'de ${orderId} siparişi için stok rezervasyonu yapılıyor`);
            
            const response = await fetch(`${AppConfig.erpIntegration.apiEndpoint}/reserve-stock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.sessionId}`
                },
                body: JSON.stringify({
                    materials,
                    orderId
                })
            });
            
            if (!response.ok) {
                throw new Error(`ERP stok rezervasyonu yapılamadı: ${response.status}`);
            }
            
            const result = await response.json();
            
            // Stok değişikliği olayını yayınla
            EventBus.emit('stockUpdated', {
                orderId,
                materials: result.reservedMaterials
            });
            
            return result;
        } catch (error) {
            Logger.error("ERP stok rezervasyonu yapılırken hata:", error);
            return await this.simulateStockReservation(materials, orderId);
        }
    }
    
    // Sipariş oluştur
    static async createOrder(orderData) {
        try {
            if (!AppConfig.erpIntegration.enabled || !AppConfig.erpIntegration.modules.sales) {
                return await this.simulateOrderCreation(orderData);
            }
            
            // Bağlantı kontrolü
            const connectionStatus = await this.checkConnection();
            if (!connectionStatus.connected) {
                await this.connect();
            }
            
            Logger.info(`Canias ERP'de yeni sipariş oluşturuluyor: ${orderData.customer} - ${orderData.cellType}`);
            
            const response = await fetch(`${AppConfig.erpIntegration.apiEndpoint}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.sessionId}`
                },
                body: JSON.stringify(orderData)
            });
            
            if (!response.ok) {
                throw new Error(`ERP sipariş oluşturulamadı: ${response.status}`);
            }
            
            const result = await response.json();
            
            // Yeni sipariş olayını yayınla
            EventBus.emit('newOrderCreated', result);
            
            return result;
        } catch (error) {
            Logger.error("ERP sipariş oluşturulurken hata:", error);
            return await this.simulateOrderCreation(orderData);
        }
    }
    
    // DEMO: Stok verisi
    static async getDemoStockData() {
        // Demo stok verisi
        return [
            { code: "137998%", name: "Siemens 7SR1003-1JA20-2DA0+ZY20 24VDC", quantity: 2, unit: "ADET", warehouse: "B01", minStock: 5, onOrder: 6, expectedDate: "2024-12-05" },
            { code: "144866%", name: "KAP-80/190-95 Akım Trafosu", quantity: 3, unit: "ADET", warehouse: "B01", minStock: 5, onOrder: 5, expectedDate: "2024-12-10" },
            { code: "120170%", name: "M480TB/G-027-95.300UN5 Kablo Başlığı", quantity: 12, unit: "ADET", warehouse: "B01", minStock: 10, onOrder: 0, expectedDate: null },
            { code: "109367%", name: "582mm Bara", quantity: 25, unit: "ADET", warehouse: "B01", minStock: 15, onOrder: 0, expectedDate: null },
            { code: "133278%", name: "36kV 630A Vakum Kesici", quantity: 5, unit: "ADET", warehouse: "B01", minStock: 3, onOrder: 2, expectedDate: "2024-12-15" },
            { code: "125444%", name: "36kV 630A Yük Ayırıcısı", quantity: 4, unit: "ADET", warehouse: "B01", minStock: 3, onOrder: 0, expectedDate: null },
            { code: "161220%", name: "36kV 200A Sigorta Taşıyıcısı", quantity: 7, unit: "ADET", warehouse: "B01", minStock: 5, onOrder: 0, expectedDate: null },
            { code: "118332%", name: "24kV 63A HRC Sigorta", quantity: 15, unit: "ADET", warehouse: "B01", minStock: 10, onOrder: 0, expectedDate: null },
            { code: "181337%", name: "36kV SF6 RMU Tank", quantity: 1, unit: "ADET", warehouse: "B01", minStock: 2, onOrder: 3, expectedDate: "2024-12-20" },
            { code: "142876%", name: "RMU Gaz Sensörü", quantity: 2, unit: "ADET", warehouse: "B01", minStock: 3, onOrder: 4, expectedDate: "2024-12-12" }
        ];
    }
    
    // DEMO: Sipariş verisi
    static async getDemoOrderData() {
        // Demo sipariş verisi
        return [
            { id: "0424-1251", customer: "AYEDAŞ", orderDate: "2024-11-01", deliveryDate: "2024-12-15", cellType: "RM 36 CB", quantity: 2, status: "production" },
            { id: "0424-1245", customer: "BEDAŞ", orderDate: "2024-11-05", deliveryDate: "2024-12-20", cellType: "RM 36 CB", quantity: 3, status: "waiting_material" },
            { id: "0424-1239", customer: "TEİAŞ", orderDate: "2024-11-10", deliveryDate: "2024-12-25", cellType: "RM 36 LB", quantity: 1, status: "production" },
            { id: "0424-1235", customer: "ENERJİSA", orderDate: "2024-11-15", deliveryDate: "2024-12-30", cellType: "RM 36 FL", quantity: 4, status: "planned" }
        ];
    }
    
    // DEMO: Müşteri verisi
    static async getDemoCustomerData() {
        // Demo müşteri verisi
        return [
            { id: "AYEDAŞ", name: "AYEDAŞ", contactName: "Ahmet Yılmaz", phone: "0212 555 11 22", email: "ahmet.yilmaz@ayedas.com" },
            { id: "BEDAŞ", name: "BEDAŞ", contactName: "Mehmet Kaya", phone: "0216 333 44 55", email: "mehmet.kaya@bedas.com" },
            { id: "TEİAŞ", name: "TEİAŞ", contactName: "Ayşe Demir", phone: "0312 444 77 88", email: "ayse.demir@teias.gov.tr" },
            { id: "ENERJİSA", name: "ENERJİSA", contactName: "Fatma Şahin", phone: "0322 666 99 00", email: "fatma.sahin@enerjisa.com" },
            { id: "OSMANİYE", name: "OSMANİYE ELEKTRİK", contactName: "Ali Veli", phone: "0328 123 45 67", email: "ali.veli@osmaniye.com" }
        ];
    }
    
    // DEMO: Malzeme listesi verisi
    static async getDemoMaterialListData(orderType) {
        // Temel malzeme listesi
        const commonMaterials = [
            { code: "137998%", name: "Siemens 7SR1003-1JA20-2DA0+ZY20 24VDC", quantity: 1 },
            { code: "144866%", name: "KAP-80/190-95 Akım Trafosu", quantity: 1 },
            { code: "120170%", name: "M480TB/G-027-95.300UN5 Kablo Başlığı", quantity: 1 },
            { code: "109367%", name: "582mm Bara", quantity: 2 }
        ];
        
        // Hücre tipine göre ek malzemeler
        let specificMaterials = [];
        
        switch (orderType) {
            case "RM 36 CB":
                specificMaterials = [
                    { code: "133278%", name: "36kV 630A Vakum Kesici", quantity: 1 },
                    { code: "104521%", name: "Kilit Seti CB Paneli", quantity: 1 }
                ];
                break;
            case "RM 36 LB":
                specificMaterials = [
                    { code: "125444%", name: "36kV 630A Yük Ayırıcısı", quantity: 1 },
                    { code: "104522%", name: "Kilit Seti LB Paneli", quantity: 1 }
                ];
                break;
            case "RM 36 FL":
                specificMaterials = [
                    { code: "161220%", name: "36kV 200A Sigorta Taşıyıcısı", quantity: 1 },
                    { code: "118332%", name: "24kV 63A HRC Sigorta", quantity: 3 }
                ];
                break;
            case "RMU":
                specificMaterials = [
                    { code: "181337%", name: "36kV SF6 RMU Tank", quantity: 1 },
                    { code: "142876%", name: "RMU Gaz Sensörü", quantity: 1 }
                ];
                break;
            default:
                specificMaterials = [];
        }
        
        return [...commonMaterials, ...specificMaterials];
    }
    
    // DEMO: Stok rezervasyon simülasyonu
    static async simulateStockReservation(materials, orderId) {
        Logger.info(`Demo stok rezervasyon simülasyonu: Sipariş ${orderId} için ${materials.length} malzeme rezerve edildi`);
        
        // Rezerve edilebilen ve edilemeyen malzemeleri belirle
        const stockData = await this.getDemoStockData();
        
        const result = {
            reservedMaterials: [],
            unavailableMaterials: []
        };
        
        for (const material of materials) {
            const stockItem = stockData.find(item => item.code === material.code);
            
            if (stockItem && stockItem.quantity >= material.quantity) {
                // Stokta yeterli miktar var, rezerve et
                result.reservedMaterials.push({
                    ...material,
                    warehouse: stockItem.warehouse,
                    reservationTime: new Date()
                });
            } else {
                // Stokta yeterli miktar yok
                result.unavailableMaterials.push({
                    ...material,
                    availableQuantity: stockItem ? stockItem.quantity : 0,
                    missingQuantity: stockItem ? material.quantity - stockItem.quantity : material.quantity
                });
            }
        }
        
        return result;
    }
    
    // DEMO: Sipariş oluşturma simülasyonu
    static async simulateOrderCreation(orderData) {
        Logger.info(`Demo sipariş oluşturma simülasyonu: ${orderData.customer} - ${orderData.cellType}`);
        
        // Sipariş numarası oluştur (yıl-ay-random)
        const date = new Date();
        const year = date.getFullYear().toString().substring(2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 9000 + 1000);
        
        const orderId = `${year}${month}-${random}`;
        
        // Malzeme listesini getir
        const materialList = await this.getDemoMaterialListData(orderData.cellType);
        
        // Malzeme miktarlarını sipariş miktarına göre ayarla
        const orderMaterials = materialList.map(material => ({
            ...material,
            quantity: material.quantity * orderData.quantity
        }));
        
        // Sipariş oluştur
        const order = {
            id: orderId,
            ...orderData,
            orderDate: new Date().toISOString().split('T')[0],
            status: 'created',
            materials: orderMaterials
        };
        
        return order;
    }
}

// Modülü dışa aktar
export default ERPService; 