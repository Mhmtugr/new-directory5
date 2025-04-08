/**
 * API Servisi
 * Tüm dış API isteklerini yöneten servis
 */

// Logger oluştur
const log = window.logger ? window.logger('APIService') : console;

// API Servisi sınıfı
class APIService {
    constructor() {
        this.config = window.appConfig || {};
        this.baseUrl = this.config.apiUrl || 'https://api.example.com';
        this.mockMode = this.config.useDemoMode || true;
        
        log.info('API Servisi başlatılıyor', { baseUrl: this.baseUrl, mockMode: this.mockMode });
    }
    
    async get(endpoint, params = {}) {
        if (this.mockMode) {
            return this.getMockData(endpoint, params);
        }
        
        try {
            const url = new URL(this.baseUrl + endpoint);
            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
            
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            return await response.json();
        } catch (error) {
            log.error(`GET ${endpoint} başarısız:`, error);
            throw error;
        }
    }
    
    async post(endpoint, data = {}) {
        if (this.mockMode) {
            return this.postMockData(endpoint, data);
        }
        
        try {
            const response = await fetch(this.baseUrl + endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify(data)
            });
            
            return await response.json();
        } catch (error) {
            log.error(`POST ${endpoint} başarısız:`, error);
            throw error;
        }
    }
    
    getAuthToken() {
        // Tarayıcı localStorage'dan token alma
        return localStorage.getItem('auth_token') || '';
    }
    
    // Mock veri metotları
    getMockData(endpoint, params) {
        log.info(`Mock GET: ${endpoint}`, params);
        
        // Endpoint'e göre demo veri döndür
        if (endpoint.includes('/orders')) {
            return Promise.resolve(window.mockFirebase ? window.mockFirebase.orders : []);
        }
        
        if (endpoint.includes('/materials')) {
            return Promise.resolve(window.mockFirebase ? window.mockFirebase.materials : []);
        }
        
        return Promise.resolve({ message: 'Mock veri bulunamadı' });
    }
    
    postMockData(endpoint, data) {
        log.info(`Mock POST: ${endpoint}`, data);
        
        // Sipariş ekleme
        if (endpoint.includes('/orders')) {
            if (window.mockFirebase) {
                window.mockFirebase.addOrder(data);
                return Promise.resolve({ success: true, id: `ORDER-${Date.now()}` });
            }
        }
        
        return Promise.resolve({ success: true, message: 'İşlem başarılı (mock)' });
    }
}

// Global olarak api-service'i ata
window.apiService = new APIService();

log.info('API Servisi başarıyla yüklendi');
