/**
 * logger.js
 * Uygulama genelinde loglama işlemleri için kullanılır
 */

// Logger sınıfı
class LoggerService {
    constructor() {
        this.logLevel = this.getLogLevel();
        this.logHistory = [];
        this.maxLogHistory = 1000; // Hafızada tutulacak maksimum log sayısı
        
        // Log seviyeleri ve bunların sayısal değerleri
        this.LOG_LEVELS = {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3,
            NONE: 4
        };
        
        console.log(`Logger başlatıldı, log seviyesi: ${this.logLevel}`);
    }
    
    // AppConfig'den log seviyesini al
    getLogLevel() {
        if (window.AppConfig && window.AppConfig.logLevel) {
            return window.AppConfig.logLevel;
        }
        return 'INFO'; // Varsayılan log seviyesi
    }
    
    // Log seviyesini değiştir
    setLogLevel(level) {
        if (this.LOG_LEVELS.hasOwnProperty(level)) {
            this.logLevel = level;
            console.log(`Log seviyesi değiştirildi: ${level}`);
            return true;
        }
        return false;
    }
    
    // Log kaydı oluştur
    log(level, message, ...args) {
        // Log seviyesi kontrolü
        if (this.LOG_LEVELS[level] < this.LOG_LEVELS[this.logLevel]) {
            return;
        }
        
        const timestamp = new Date().toISOString();
        const logObject = {
            timestamp,
            level,
            message,
            details: args.length > 0 ? args : null
        };
        
        // Log geçmişine ekle
        this.logHistory.push(logObject);
        
        // Geçmiş log sayısı kontrol
        if (this.logHistory.length > this.maxLogHistory) {
            this.logHistory.shift(); // En eski logu sil
        }
        
        // Console'a log yaz
        switch (level) {
            case 'DEBUG':
                console.debug(`[${timestamp}] [DEBUG]`, message, ...args);
                break;
            case 'INFO':
                console.info(`[${timestamp}] [INFO]`, message, ...args);
                break;
            case 'WARN':
                console.warn(`[${timestamp}] [WARN]`, message, ...args);
                break;
            case 'ERROR':
                console.error(`[${timestamp}] [ERROR]`, message, ...args);
                break;
        }
        
        // Eğer EventBus mevcutsa, log olayını yayınla
        if (window.EventBus) {
            window.EventBus.emit('log', logObject);
        }
    }
    
    // Hata ayıklama logu
    debug(message, ...args) {
        this.log('DEBUG', message, ...args);
    }
    
    // Bilgi logu
    info(message, ...args) {
        this.log('INFO', message, ...args);
    }
    
    // Uyarı logu
    warn(message, ...args) {
        this.log('WARN', message, ...args);
    }
    
    // Hata logu
    error(message, ...args) {
        this.log('ERROR', message, ...args);
    }
    
    // Son n kadar logu getir
    getRecentLogs(count = 10, level = null) {
        let logs = [...this.logHistory];
        
        // Seviye filtreleme
        if (level) {
            logs = logs.filter(log => log.level === level);
        }
        
        // Son n logu döndür
        return logs.slice(-count);
    }
    
    // Logları temizle
    clearLogs() {
        this.logHistory = [];
        console.log('Log geçmişi temizlendi');
    }
    
    // Logları dosyaya indir
    downloadLogs() {
        const logs = JSON.stringify(this.logHistory, null, 2);
        const blob = new Blob([logs], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `application-logs-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Global olarak erişim için
window.Logger = new LoggerService();

// ES module uyumluluğu
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Logger: window.Logger };
}
