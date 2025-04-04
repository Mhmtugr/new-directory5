/**
 * order-creation.js
 * Yeni sipariş oluşturma işlevleri (Basitleştirilmiş Form İçin)
 */

// import EventBus from '../../utils/event-bus.js'; // Gerekirse aktif edilebilir
// import Logger from '../../utils/logger.js'; // Gerekirse aktif edilebilir

/**
 * Yeni sipariş oluşturma işlemini başlatır.
 * index.html'deki create-order-form'dan verileri alır.
 */
async function createOrder() {
    const form = document.getElementById('create-order-form');
    if (!form) {
        console.error("'create-order-form' bulunamadı!");
        showToast("Sipariş formu bulunamadı.", "error");
        return;
    }
    const formData = new FormData(form);
    
    // Form verilerini topla
    const orderData = {
        id: `order-${Date.now()}`, // Geçici ID
        orderNo: `SO-${Date.now().toString().slice(-6)}`, // Geçici Sipariş No
        customer: formData.get('customer'),
        orderDate: formData.get('orderDate') || new Date().toISOString().split('T')[0],
        cellType: formData.get('cellType'),
        cellCount: parseInt(formData.get('cellCount')) || 1,
        voltage: formData.get('voltage') || null,
        current: formData.get('current') || null,
        relayType: formData.get('relayType') || null,
        deliveryDate: formData.get('deliveryDate') || null,
        status: formData.get('status') || 'planning',
        description: formData.get('description') || '',
        // Teknik detaylar
        technicalDetails: {
            voltage: formData.get('voltage') || null,
            current: formData.get('current') || null,
            relayType: formData.get('relayType') || null,
            protection: formData.get('protection') || null,
            busbarType: formData.get('busbarType') || null,
            cablingType: formData.get('cablingType') || null,
            specialRequirements: formData.get('specialRequirements') || '',
            standards: formData.get('standards') || [],
            testingRequirements: formData.get('testingRequirements') || []
        },
        // Meta bilgiler
        meta: {
            createdAt: new Date().toISOString(),
            createdBy: window.currentUser?.username || 'unknown',
            isComplete: false,
            priority: formData.get('priority') || 'medium',
            notes: []
        }
    };

    // Zorunlu teknik alan kontrolü
    const missingFields = [];
    
    // Temel zorunlu alanlar
    if (!orderData.customer) missingFields.push('Müşteri');
    if (!orderData.cellType) missingFields.push('Hücre Tipi');
    if (!orderData.cellCount) missingFields.push('Hücre Adedi');
    
    // Teknik detay zorunlu alanlar (kapsamda belirtildiği gibi tüm gerekli alanların girilmesini sağlıyoruz)
    if (!orderData.technicalDetails.voltage) missingFields.push('Gerilim (kV)');
    if (!orderData.technicalDetails.current) missingFields.push('Akım (A)');
    if (!orderData.technicalDetails.relayType) missingFields.push('Röle Tipi');
    
    if (missingFields.length > 0) {
        showToast(`Lütfen zorunlu alanları doldurun: ${missingFields.join(', ')}`, "warning", 10000);
        
        // Eksik alanları vurgula
        missingFields.forEach(field => {
            const inputField = document.querySelector(`[name="${field.toLowerCase().replace(/\s/g, '')}"]`);
            if (inputField) {
                inputField.classList.add('is-invalid');
                
                // 3 saniye sonra vurgulamayı kaldır
                setTimeout(() => {
                    inputField.classList.remove('is-invalid');
                }, 3000);
            }
        });
        
        return; 
    }

    console.log("Yeni Sipariş Verileri:", orderData);
    showToast("Sipariş verileri alındı, işleniyor...", "info");
    closeModal('create-order-modal');
    showLoadingInPage('orders-page'); // Siparişler sayfasında yükleniyor göster

    try {
        // 1. Malzeme Listesi Tahmini (AI Service)
        let materialList = [];
        if (window.AIService && typeof window.AIService.predictMaterials === 'function') {
            try {
                console.log("Malzeme listesi tahmini yapılıyor...");
                const predictionResult = await window.AIService.predictMaterials(orderData);
                materialList = predictionResult.materials || [];
                console.log("Tahmin Edilen Malzeme Listesi:", materialList);
                showToast(`Malzeme listesi ${predictionResult.source} kaynağından tahmin edildi.`, "info", 5000);
            } catch (aiError) {
                console.error("AI Malzeme tahmini hatası:", aiError);
                showToast("Malzeme listesi AI ile tahmin edilemedi, varsayılan kullanılacak.", "warning");
                materialList = window.AIService?.getLocalMaterialList(orderData.cellType) || [];
            }
        } else {
            console.warn("AIService veya predictMaterials fonksiyonu bulunamadı. Varsayılan malzeme listesi kullanılıyor.");
            showToast("AI Servisi bulunamadı, varsayılan malzeme listesi kullanılıyor.", "warning");
            materialList = window.AIService?.getLocalMaterialList(orderData.cellType) || []; 
        }
        orderData.materials = materialList; // Malzeme listesini sipariş verisine ekle

        // 2. Üretim Süresi Tahmini (AI Service)
        if (window.AIService && typeof window.AIService.predictProductionTime === 'function') {
            try {
                console.log("Üretim süresi tahmini yapılıyor...");
                const timePrediction = await window.AIService.predictProductionTime(orderData);
                orderData.estimatedProductionDays = timePrediction.estimatedDays;
                orderData.productionTimeSource = timePrediction.source;
                console.log("Tahmini Üretim Süresi:", timePrediction);
                if (timePrediction.estimatedDays) {
                     showToast(`Üretim süresi ${timePrediction.source} kaynağından ${timePrediction.estimatedDays} gün olarak tahmin edildi.`, "info", 5000);
                }
            } catch (aiError) {
                console.error("AI Üretim süresi tahmini hatası:", aiError);
                showToast("Üretim süresi AI ile tahmin edilemedi.", "warning");
            }
        }

        // 3. Üretim Planlama ve Teslimat Tarihi Hesaplama
        let deliveryDateEstimated = false;
        if (!orderData.deliveryDate && orderData.estimatedProductionDays) {
            // Teslimat tarihi girilmemişse ve üretim süresi tahmini varsa, tahmini teslimat tarihi hesapla
            const currentDate = new Date();
            const estimatedDeliveryDate = new Date(currentDate);
            estimatedDeliveryDate.setDate(currentDate.getDate() + orderData.estimatedProductionDays);
            
            // Hafta sonu ise bir sonraki iş gününe kaydır
            if (estimatedDeliveryDate.getDay() === 0) { // Pazar
                estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 1);
            } else if (estimatedDeliveryDate.getDay() === 6) { // Cumartesi
                estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 2);
            }
            
            orderData.deliveryDate = estimatedDeliveryDate.toISOString().split('T')[0];
            deliveryDateEstimated = true;
            
            showToast(`Teslimat tarihi tahmini: ${new Date(orderData.deliveryDate).toLocaleDateString('tr-TR')}`, "info", 5000);
        }

        // 4. Stok Kontrolü ve Malzeme Rezervasyonu
        if (window.ERPService && typeof window.ERPService.reserveMaterialsForOrder === 'function' && materialList && materialList.length > 0) {
            try {
                console.log("Stok kontrolü ve malzeme rezervasyonu yapılıyor...");
                const reservationResult = await window.ERPService.reserveMaterialsForOrder(orderData.id, materialList);
                console.log("Rezervasyon Sonucu:", reservationResult);
                
                if (reservationResult.success) {
                    showToast("Tüm malzemeler stokta mevcut ve rezerve edildi.", "success");
                    orderData.materialStatus = 'complete';
                } else if (reservationResult.shortages && reservationResult.shortages.length > 0) {
                    // Eksik malzemeler var, satın alma sürecini başlat
                    orderData.materialStatus = 'partial';
                    orderData.shortages = reservationResult.shortages;
                    
                    // Satın alma talebi oluştur
                    await triggerPurchaseRequests(orderData, reservationResult.shortages);
                    
                    // Eksik malzemeleri göster
                    const shortageCount = reservationResult.shortages.length;
                    showToast(`Dikkat: ${shortageCount} malzeme için stok yetersiz. Satın alma talepleri oluşturuldu.`, "warning", 8000);
                } else {
                    orderData.materialStatus = 'unknown';
                    showToast("Malzeme stok durumu belirlenemedi.", "warning");
                }
            } catch (erpError) {
                console.error("ERP Malzeme rezervasyon hatası:", erpError);
                showToast(`Malzeme rezervasyonu sırasında hata oluştu: ${erpError.message}`, "error");
                orderData.materialStatus = 'error';
            }
        } else {
            orderData.materialStatus = 'pending';
            if (!materialList || materialList.length === 0) {
                console.warn("Rezervasyon atlandı: Malzeme listesi boş veya tahmin edilemedi.");
            } else {
                console.warn("Rezervasyon atlandı: ERPService veya reserveMaterialsForOrder fonksiyonu bulunamadı.");
            }
        }
        
        // 5. Siparişi Kaydetme
        console.log("Sipariş kaydediliyor...", orderData);
        await saveOrderLocallyOrToFirebase(orderData);
        
        // 6. Bildirimleri ve Olayları Tetikle
        if (window.EventBus) {
            window.EventBus.emit('orderCreated', {
                orderId: orderData.id,
                orderNo: orderData.orderNo,
                customer: orderData.customer,
                cellType: orderData.cellType,
                cellCount: orderData.cellCount,
                estimatedDeliveryDate: orderData.deliveryDate,
                materialStatus: orderData.materialStatus,
                shortages: orderData.shortages || []
            });
        }
        
        // 7. UI Güncellemeleri
        // Sipariş Listesini Yenile
        if (typeof window.loadOrders === 'function') {
             window.loadOrders(); 
        } else if (window.pageLoadFunctions && typeof window.pageLoadFunctions.orders === 'function') { 
            window.pageLoadFunctions.orders(); 
        }
        
        // Gösterge Paneli Güncelle
        if (typeof window.loadDashboardData === 'function') {
             window.loadDashboardData(); 
        } else if (window.pageLoadFunctions && typeof window.pageLoadFunctions.dashboard === 'function') { 
            window.pageLoadFunctions.dashboard(); 
        }

        // 8. İşlem Tamamlandı Bildirimi
        const successMsg = deliveryDateEstimated ? 
            `Sipariş ${orderData.orderNo} başarıyla oluşturuldu! Tahmini teslimat: ${new Date(orderData.deliveryDate).toLocaleDateString('tr-TR')}` :
            `Sipariş ${orderData.orderNo} başarıyla oluşturuldu!`;
        
        showToast(successMsg, "success");

        // 9. Formu Temizle
        form.reset();

    } catch (error) {
        console.error("Sipariş oluşturma işlemi sırasında hata:", error);
        showToast(`Sipariş oluşturulamadı: ${error.message}`, "error", 10000);
    } finally {
        hideLoadingInPage('orders-page'); // Yükleniyor göstergesini kaldır
    }
}

/**
 * Siparişi yerel depolamaya veya Firebase'e kaydeder (Demo/Geçici)
 * @param {object} orderData 
 */
async function saveOrderLocallyOrToFirebase(orderData) {
    // Firebase Firestore kullanılıyorsa ve aktifse
    if (window.AppConfig?.firebase?.enabled && window.firebase?.firestore) {
        try {
            // 'orders' koleksiyonuna belge ekle (ID'yi Firestore'un oluşturmasını sağla veya kendi ID'mizi kullanalım)
            await window.firebase.firestore().collection("orders").doc(orderData.id).set({
                ...orderData,
                createdAt: window.firebase.firestore.FieldValue.serverTimestamp() // Oluşturma zamanı ekle
            });
            console.log("Sipariş Firebase Firestore'a kaydedildi:", orderData.id);
            return true;
        } catch (error) {
            console.error("Sipariş Firestore'a kaydedilirken hata:", error);
            // Firebase hatası olursa yerel depolamaya fallback yap
            return saveOrderLocally(orderData);
        }
    } else {
        // Firebase yoksa veya aktif değilse yerel depolamayı kullan
        return saveOrderLocally(orderData);
    }
}

/**
 * Siparişi Tarayıcının Yerel Depolamasına Kaydeder
 * @param {object} orderData 
 */
function saveOrderLocally(orderData) {
     try {
        // Mevcut siparişleri al veya boş bir dizi oluştur
        const existingOrders = JSON.parse(localStorage.getItem('demoOrders') || '[]');
        // Yeni siparişi ekle
        existingOrders.push(orderData);
        // Güncellenmiş listeyi kaydet
        localStorage.setItem('demoOrders', JSON.stringify(existingOrders));
        console.log("Sipariş Local Storage'a kaydedildi:", orderData.id);
        return true;
    } catch (error) {
        console.error("Sipariş Local Storage'a kaydedilirken hata:", error);
        showToast("Sipariş yerel olarak kaydedilemedi.", "error");
        return false;
    }
}

/**
 * Eksik malzemeler için satın alma taleplerini oluşturur
 * @param {object} orderData Sipariş verisi
 * @param {Array<object>} shortages Eksik malzemeler listesi
 */
async function triggerPurchaseRequests(orderData, shortages) {
    if (!window.ERPService || typeof window.ERPService.createPurchaseRequest !== 'function') {
        console.warn("ERPService veya createPurchaseRequest fonksiyonu bulunamadı. Satın alma talepleri oluşturulamadı.");
        return false;
    }
    
    const results = [];
    
    for (const shortage of shortages) {
        try {
            const { code, name, shortage: quantity, unit = 'adet' } = shortage;
            
            // Teslimat tarihinden 7 gün önce olacak şekilde gereken tarih hesapla
            const requiredDate = new Date(orderData.deliveryDate);
            requiredDate.setDate(requiredDate.getDate() - 7); // Teslimat tarihinden 1 hafta önce
            
            const result = await window.ERPService.createPurchaseRequest(
                orderData.id,
                code,
                quantity,
                requiredDate.toISOString().split('T')[0]
            );
            
            console.log(`Satın alma talebi oluşturuldu: ${code} - ${name}, Miktar: ${quantity} ${unit}`, result);
            results.push({
                code,
                name,
                quantity,
                result
            });
            
        } catch (error) {
            console.error(`Satın alma talebi oluşturulurken hata: ${shortage.code}`, error);
            results.push({
                code: shortage.code,
                name: shortage.name,
                error: error.message
            });
        }
    }
    
    return results;
}

// Helper fonksiyonlar (showToast, closeModal, showLoadingInPage, hideLoadingInPage gibi)
// Bu fonksiyonların core/main.js içinde global olarak tanımlı olduğu varsayılıyor.
// Eğer tanımlı değillerse, buraya eklenmeleri veya import edilmeleri gerekir.

// createOrder fonksiyonunu global scope'a ekle
if (window) {
   window.createOrder = createOrder;
}

console.log("Order Creation module (simplified) loaded.");

// --- Önceki Karmaşık Form Fonksiyonları (Yoruma Alındı/Kaldırıldı) ---
/*
document.addEventListener('DOMContentLoaded', function() {
    // Form gönderildiğinde
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitOrderForm();
        });
    }
    // ... (Diğer olay dinleyicileri)
});

function collectFormData() { ... }
function addCell() { ... }
function removeCell(button) { ... }
function addProject() { ... }
function removeProject(button) { ... }
function submitOrderForm() { ... }
*/