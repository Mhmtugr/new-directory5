/**
 * system-test.js
 * Mehmet Endüstriyel Takip sistemi için otomatik test betiği
 */

console.log('Mehmet Endüstriyel Takip - Sistem Testi Başlatılıyor');

// Test konfigürasyonu
const testConfig = {
    runERPTests: true,
    runChatbotTests: true,
    runStorageTests: true,
    verbose: true
};

// Test sonuçları
const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
};

// Test yardımcı fonksiyonları
function assert(condition, message) {
    testResults.total++;
    if (condition) {
        testResults.passed++;
        if (testConfig.verbose) {
            console.log(`✅ TEST BAŞARILI: ${message}`);
        }
        return true;
    } else {
        testResults.failed++;
        console.error(`❌ TEST BAŞARISIZ: ${message}`);
        return false;
    }
}

function skipTest(message) {
    testResults.total++;
    testResults.skipped++;
    console.warn(`⚠️ TEST ATLANILDI: ${message}`);
}

// ERP Servis Testleri
async function testERPService() {
    console.log('\n📊 ERP SERVİS TESTLERİ BAŞLATILIYOR');
    
    try {
        // Örnek servis oluştur
        const erpService = new ERPService();
        
        // Constructor testi
        assert(erpService !== null, "ERP servisi başarıyla oluşturuldu");
        
        // Local storage testi
        assert(typeof erpService.saveDataLocally === 'function', "Local storage kaydetme metodu mevcut");
        assert(typeof erpService.loadDataLocally === 'function', "Local storage yükleme metodu mevcut");
        
        // Demo veri testleri
        const stockData = await erpService.getDemoStockData();
        assert(Array.isArray(stockData), "Demo stok verileri bir dizi döndürüyor");
        assert(stockData.length > 0, "Demo stok verileri boş değil");
        
        const orderData = await erpService.getDemoOrderData();
        assert(Array.isArray(orderData), "Demo sipariş verileri bir dizi döndürüyor");
        assert(orderData.length > 0, "Demo sipariş verileri boş değil");
        
        // Rezervasyon testi
        const testOrderId = 'test-order-123';
        const testMaterials = [
            { materialCode: '125790', quantity: 2, requiredDate: new Date() }
        ];
        
        const result = await erpService.reserveMaterialsForOrder(testOrderId, testMaterials);
        assert(typeof result === 'object', "Rezervasyon işlemi bir nesne döndürüyor");
        
        // Cache testi
        assert(erpService.cachedStockData !== null, "Stok verileri önbelleğe alındı");
        
        console.log('✅ ERP SERVİS TESTLERİ TAMAMLANDI');
    } catch (error) {
        console.error('❌ ERP SERVİS TESTLERİ SIRASINDA HATA:', error);
        testResults.failed++;
    }
}

// Chatbot Testleri
async function testChatbot() {
    console.log('\n🤖 CHATBOT TESTLERİ BAŞLATILIYOR');
    
    try {
        // Chatbot modülünü kontrol et
        assert(typeof Chatbot === 'object', "Chatbot modülü tanımlı");
        assert(typeof Chatbot.init === 'function', "Chatbot init metodu mevcut");
        assert(typeof Chatbot.generateResponse === 'function', "Chatbot cevap üretme metodu mevcut");
        
        // Basit cevap testi
        const response = await Chatbot.generateBotResponse("Merhaba", []);
        assert(typeof response === 'string' && response.length > 0, "Chatbot basit bir cevap üretiyor");
        
        // Özel sorgu testi
        const orderResponse = await Chatbot.generateBotResponse("Siparişleri göster", []);
        assert(typeof orderResponse === 'string' && orderResponse.length > 0, "Chatbot sipariş sorgusu işleyebiliyor");
        
        console.log('✅ CHATBOT TESTLERİ TAMAMLANDI');
    } catch (error) {
        console.error('❌ CHATBOT TESTLERİ SIRASINDA HATA:', error);
        testResults.failed++;
    }
}

// Yerel Depolama Testleri
function testLocalStorage() {
    console.log('\n💾 YEREL DEPOLAMA TESTLERİ BAŞLATILIYOR');
    
    try {
        // Test verisi
        const testData = { test: 'data', timestamp: Date.now() };
        
        // Kaydetme testi
        localStorage.setItem('mets:test', JSON.stringify(testData));
        assert(localStorage.getItem('mets:test') !== null, "Veri başarıyla localStorage'a kaydedildi");
        
        // Okuma testi
        const retrievedData = JSON.parse(localStorage.getItem('mets:test'));
        assert(retrievedData.test === testData.test, "Veri başarıyla localStorage'dan okundu");
        
        // Temizleme
        localStorage.removeItem('mets:test');
        
        console.log('✅ YEREL DEPOLAMA TESTLERİ TAMAMLANDI');
    } catch (error) {
        console.error('❌ YEREL DEPOLAMA TESTLERİ SIRASINDA HATA:', error);
        testResults.failed++;
    }
}

// Ana test fonksiyonu
async function runAllTests() {
    console.log('🧪 TÜM SİSTEM TESTLERİ BAŞLATILIYOR');
    const startTime = Date.now();
    
    // ERP Testleri
    if (testConfig.runERPTests) {
        await testERPService();
    } else {
        skipTest("ERP testleri konfigürasyonda devre dışı bırakılmış");
    }
    
    // Chatbot Testleri
    if (testConfig.runChatbotTests) {
        await testChatbot();
    } else {
        skipTest("Chatbot testleri konfigürasyonda devre dışı bırakılmış");
    }
    
    // Yerel Depolama Testleri
    if (testConfig.runStorageTests) {
        testLocalStorage();
    } else {
        skipTest("Yerel depolama testleri konfigürasyonda devre dışı bırakılmış");
    }
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    // Test sonuçlarını göster
    console.log('\n📋 TEST SONUÇLARI:');
    console.log(`Toplam: ${testResults.total} | Başarılı: ${testResults.passed} | Başarısız: ${testResults.failed} | Atlanan: ${testResults.skipped}`);
    console.log(`Süre: ${duration.toFixed(2)} saniye`);
    
    if (testResults.failed === 0) {
        console.log('\n✅ TÜM TESTLERİ BAŞARILI!');
    } else {
        console.log('\n⚠️ BAZI TESTLER BAŞARISIZ OLDU!');
    }
}

// Testleri çalıştır
runAllTests();
