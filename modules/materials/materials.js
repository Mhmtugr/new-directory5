/**
 * materials.js
 * Malzeme Yönetimi, Stok Takibi ve Tahminleme İşlevleri
 */

// Global state for materials page
let materialsData = {
    stockItems: [], // Tüm stok kalemleri
    filteredItems: [], // Filtrelenmiş kalemler
    currentFilter: 'critical', // Başlangıç filtresi (HTML'deki 'active' butona göre)
    forecastData: [], // Tahmin grafiği verisi
    recentPurchases: [], // Son satınalma siparişleri
    loaded: false
};

let forecastChartInstance = null;

/**
 * Malzeme/Stok verilerini yükler (Demo).
 */
async function loadMaterialsData() {
    console.log("Malzeme/Stok verileri yükleniyor...");
    if (materialsData.loaded && materialsData.stockItems.length > 0) {
        console.log("Malzeme verileri zaten yüklü.");
        applyMaterialFilters();
        renderMaterialForecastChart();
        renderRecentPurchases();
        return;
    }

    showLoadingIndicator('materials-table-body');
    showLoadingIndicator('materialForecastChart');
    showLoadingIndicator('recent-purchases-list');

    try {
        // Verileri ERPService'den al
        if (window.ERPService && typeof window.ERPService.getStockData === 'function') {
            materialsData.stockItems = await window.ERPService.getStockData(true);
            console.log("Malzeme verileri yüklendi:", materialsData.stockItems);
        } else {
            // Demo veri
            materialsData.stockItems = [
                {
                    id: 'M001',
                    code: 'M001',
                    name: 'Hücre Gövdesi',
                    currentStock: 150,
                    minStock: 200,
                    unit: 'adet',
                    status: 'critical',
                    reserved: 50,
                    pendingOrders: 2
                },
                {
                    id: 'M002',
                    code: 'M002',
                    name: 'Terminal',
                    currentStock: 300,
                    minStock: 100,
                    unit: 'adet',
                    status: 'in_stock',
                    reserved: 100,
                    pendingOrders: 1
                },
                {
                    id: 'M003',
                    code: 'M003',
                    name: 'Yalıtım Malzemesi',
                    currentStock: 50,
                    minStock: 200,
                    unit: 'metre',
                    status: 'critical',
                    reserved: 0,
                    pendingOrders: 0
                }
            ];
        }

        materialsData.loaded = true;
        applyMaterialFilters();
        renderMaterialForecastChart();
        renderRecentPurchases();
    } catch (error) {
        console.error("Malzeme verileri yüklenirken hata:", error);
        showToast("Malzeme verileri yüklenemedi.", "error");
    } finally {
        hideLoadingIndicator('materials-table-body');
        hideLoadingIndicator('materialForecastChart');
        hideLoadingIndicator('recent-purchases-list');
    }
}

/**
 * Malzeme tablosunu render eder.
 */
function renderMaterialsTable(items = materialsData.filteredItems) {
    const tbody = document.getElementById('materials-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.code}</td>
            <td>${item.name}</td>
            <td>${item.currentStock} ${item.unit}</td>
            <td>${item.minStock} ${item.unit}</td>
            <td>${item.reserved} ${item.unit}</td>
            <td>${item.pendingOrders || 0}</td>
            <td>
                <span class="badge ${getStatusBadgeClass(item.status)}">
                    ${getStatusText(item.status)}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="showMaterialDetails('${item.id}')">
                    <i class="fas fa-info-circle"></i> Detay
                </button>
                <button class="btn btn-sm btn-success" onclick="createPurchaseRequest('${item.id}')">
                    <i class="fas fa-shopping-cart"></i> Sipariş Ekle
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Malzeme detaylarını gösterir.
 */
async function showMaterialDetails(materialId) {
    const material = materialsData.stockItems.find(item => item.id === materialId);
    if (!material) {
        showToast("Malzeme bulunamadı.", "error");
        return;
    }

    // Modal içeriğini oluştur
    const modalContent = `
        <div class="modal-header">
            <h5 class="modal-title">Malzeme Detayları</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
            <div class="row">
                <div class="col-md-6">
                    <h6>Genel Bilgiler</h6>
                    <table class="table table-sm">
                        <tr>
                            <th>Kod:</th>
                            <td>${material.code}</td>
                        </tr>
                        <tr>
                            <th>Ad:</th>
                            <td>${material.name}</td>
                        </tr>
                        <tr>
                            <th>Birim:</th>
                            <td>${material.unit}</td>
                        </tr>
                        <tr>
                            <th>Durum:</th>
                            <td><span class="badge ${getStatusBadgeClass(material.status)}">${getStatusText(material.status)}</span></td>
                        </tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6>Stok Bilgileri</h6>
                    <table class="table table-sm">
                        <tr>
                            <th>Mevcut Stok:</th>
                            <td>${material.currentStock} ${material.unit}</td>
                        </tr>
                        <tr>
                            <th>Minimum Stok:</th>
                            <td>${material.minStock} ${material.unit}</td>
                        </tr>
                        <tr>
                            <th>Rezerve:</th>
                            <td>${material.reserved} ${material.unit}</td>
                        </tr>
                        <tr>
                            <th>Bekleyen Siparişler:</th>
                            <td>${material.pendingOrders || 0}</td>
                        </tr>
                    </table>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-12">
                    <h6>Stok Hareketleri</h6>
                    <div id="material-movements-chart" style="height: 200px;"></div>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
            <button type="button" class="btn btn-primary" onclick="createPurchaseRequest('${material.id}')">
                <i class="fas fa-shopping-cart"></i> Sipariş Ekle
            </button>
        </div>
    `;

    // Modal'ı göster
    const modal = new bootstrap.Modal(document.getElementById('material-detail-modal'));
    document.getElementById('material-detail-modal').querySelector('.modal-content').innerHTML = modalContent;
    modal.show();

    // Stok hareketleri grafiğini çiz
    renderMaterialMovementsChart(materialId);
}

/**
 * Malzeme stok hareketleri grafiğini çizer.
 */
function renderMaterialMovementsChart(materialId) {
    const ctx = document.getElementById('material-movements-chart');
    if (!ctx) return;

    // Demo veri
    const data = {
        labels: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'],
        datasets: [{
            label: 'Stok Miktarı',
            data: [200, 180, 220, 190, 150, 150],
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    };

    new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

/**
 * Satın alma talebi oluşturur.
 */
async function createPurchaseRequest(materialId) {
    const material = materialsData.stockItems.find(item => item.id === materialId);
    if (!material) {
        showToast("Malzeme bulunamadı.", "error");
        return;
    }

    // Satın alma talebi verilerini hazırla
    const requestData = {
        materialCode: material.code,
        materialName: material.name,
        requiredQuantity: material.minStock - material.currentStock,
        unit: material.unit,
        status: 'pending',
        requestDate: new Date().toISOString()
    };

    // Purchasing modülüne gönder
    if (window.PurchasingModule && typeof window.PurchasingModule.savePurchaseRequestDetails === 'function') {
        try {
            const result = await window.PurchasingModule.savePurchaseRequestDetails(null, requestData);
            if (result && result.success) {
                showToast("Satın alma talebi başarıyla oluşturuldu.", "success");
                // Modal'ı kapat
                bootstrap.Modal.getInstance(document.getElementById('material-detail-modal')).hide();
            } else {
                showToast("Satın alma talebi oluşturulamadı.", "error");
            }
        } catch (error) {
            console.error("Satın alma talebi oluşturma hatası:", error);
            showToast("Satın alma talebi oluşturulurken hata oluştu.", "error");
        }
    } else {
        showToast("Satın alma modülü aktif değil.", "error");
    }
}

/**
 * Malzeme filtresini uygular ve tabloyu yeniden çizer.
 */
function applyMaterialFilters() {
    const filter = materialsData.currentFilter;
    console.log(`Malzeme filtresi uygulanıyor: ${filter}`);

    if (!materialsData.stockItems) {
        materialsData.filteredItems = [];
    } else if (filter === 'all') {
        materialsData.filteredItems = materialsData.stockItems;
    } else if (filter === 'instock') {
        materialsData.filteredItems = materialsData.stockItems.filter(item => (item.availableQuantity !== undefined ? item.availableQuantity : item.quantity) > 0);
    } else if (filter === 'critical') {
        materialsData.filteredItems = materialsData.stockItems.filter(item => {
            const available = item.availableQuantity !== undefined ? item.availableQuantity : item.quantity;
            const minStock = item.minimumQuantity || 0;
            const criticalLevel = item.criticalLevel !== undefined ? item.criticalLevel : minStock / 2;
            return available <= criticalLevel;
        });
    } else if (filter === 'pendingorder') {
        // TODO: Bu filtre için veri gerekli (hangi malzemelerin sipariş beklediği)
        console.warn("'Sipariş Bekleyenler' filtresi henüz uygulanmadı.");
        // Şimdilik düşük stoktakileri gösterelim
        materialsData.filteredItems = materialsData.stockItems.filter(item => {
            const available = item.availableQuantity !== undefined ? item.availableQuantity : item.quantity;
            const minStock = item.minimumQuantity || 0;
             return available <= minStock && available > (item.criticalLevel !== undefined ? item.criticalLevel : minStock / 2);
        });
    } else {
        materialsData.filteredItems = materialsData.stockItems; // Bilinmeyen filtre ise tümünü göster
    }

    // Filtrelenmiş veriye göre tabloyu yeniden çiz
    renderMaterialsTable();
}

/**
 * Filtre butonu tıklama olayını yönetir.
 * @param {Event} event
 * @param {string} filterType
 */
function handleMaterialFilterChange(event, filterType) {
    // Aktif butonu güncelle
    const filterButtons = document.querySelectorAll('#materials .btn-group .btn');
    filterButtons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Filtreyi state'e kaydet ve uygula
    materialsData.currentFilter = filterType;
    applyMaterialFilters();
}

/**
 * Malzeme Tahmin Grafiğini (materialForecastChart) render eder.
 */
function renderMaterialForecastChart() {
    const ctx = document.getElementById('materialForecastChart')?.getContext('2d');
    if (!ctx) return;

    if (!materialsData.forecastData || !materialsData.forecastData.series || materialsData.forecastData.series.length === 0) {
        showChartPlaceholder(ctx, "Tahmin verisi yok.");
        return;
    }

    const labels = materialsData.forecastData.months;
    const datasets = materialsData.forecastData.series.map((s, index) => {
        const colors = [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)'
        ];
        return {
            label: s.material.length > 20 ? s.material.substring(0, 18) + '...' : s.material, // Uzun isimleri kısalt
            data: s.forecast,
            borderColor: colors[index % colors.length].replace('0.7', '1'),
            backgroundColor: colors[index % colors.length],
            tension: 0.1,
            fill: false
        };
    });

    if (forecastChartInstance) forecastChartInstance.destroy();

    forecastChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Tahmini İhtiyaç (Adet)' }
                },
                x: {
                    title: { display: true, text: 'Ay' }
                }
            },
            plugins: {
                 legend: {
                     position: 'bottom' // Çok fazla malzeme olursa okunması zor olabilir
                 }
            }
        }
    });
     hideLoadingIndicator('materialForecastChart');
}

/**
 * Son Satın Alma Siparişleri listesini render eder.
 */
function renderRecentPurchases() {
     const listGroup = document.getElementById('recent-purchases-list'); // Bu ID'li bir div eklenmeli
     if (!listGroup) {
         console.error("'recent-purchases-list' ID'li liste konteyneri bulunamadı!");
         return;
     }

     listGroup.innerHTML = ''; // Temizle

     if (!materialsData.recentPurchases || materialsData.recentPurchases.length === 0) {
          listGroup.innerHTML = '<div class="list-group-item text-muted">Son sipariş bulunmuyor.</div>';
         return;
     }

     let html = '';
     materialsData.recentPurchases.forEach(po => {
         const dateDiff = Math.round((new Date() - po.date) / (1000 * 60 * 60 * 24));
         let dateText = `${dateDiff} gün önce`;
         if (dateDiff === 0) dateText = 'Bugün';
         else if (dateDiff === 1) dateText = 'Dün';
         else if (dateDiff > 7) dateText = `${Math.floor(dateDiff/7)} hafta önce`;

         html += `
            <a href="#" class="list-group-item list-group-item-action" onclick="showPurchaseOrderDetails('${po.id}')">
                 <div class="d-flex w-100 justify-content-between">
                     <h6 class="mb-1">${po.id}</h6>
                     <small class="text-muted">${dateText}</small>
                 </div>
                 <p class="mb-1 text-truncate">${po.material}</p>
                 <small class="text-muted">Miktar: ${po.quantity}, Tahmini Teslim: ${po.delivery}</small>
             </a>
         `;
     });
     listGroup.innerHTML = html;
     hideLoadingIndicator('recent-purchases-list');
}

/**
 * Belirli bir malzeme için Satın Alma Talebi oluşturma işlemini başlatır (Placeholder).
 * @param {string} materialId
 */
function createPurchaseRequestForMaterial(materialId) {
    const material = materialsData.stockItems.find(item => item.id === materialId);
    if (!material) {
        showToast("Malzeme bulunamadı.", "error");
        return;
    }
    console.log(`Satın alma talebi oluşturuluyor: ${material.name} (${material.code})`);
    // TODO: Satın alma talebi oluşturma modalını aç veya doğrudan talep oluştur.
    // Purchasing modülündeki createPurchaseRequest fonksiyonunu çağırabilir.
    // Gerekli miktar hesaplanmalı: (minimumQuantity - availableQuantity)
    const requiredQty = Math.max(0, (material.minimumQuantity || 0) - (material.availableQuantity !== undefined ? material.availableQuantity : material.quantity));
    showToast(`${material.name} için ${requiredQty} adet satın alma talebi oluşturma işlemi henüz eklenmedi.`, "info");
    // Örnek: navigateToPage('purchasing', { action: 'create', materialCode: material.code, quantity: requiredQty });
}

/**
 * Satın alma siparişi detaylarını gösterme işlemini başlatır (Placeholder).
 * @param {string} purchaseOrderId
 */
function showPurchaseOrderDetails(purchaseOrderId) {
    console.log(`Satın alma siparişi detayları: ${purchaseOrderId}`);
    // TODO: Satın alma siparişini (PO) detaylandıran bir modal aç.
    // Bu bilgi purchasing modülünde veya ERPService'de olabilir.
    showToast(`'${purchaseOrderId}' ID'li satın alma siparişi detayı görüntüleme henüz eklenmedi.`, "info");
}

/**
 * Malzeme Yönetimi sayfası için olay dinleyicilerini ve başlangıç yüklemelerini ayarlar.
 */
function initializeMaterialsPage() {
    console.log("Malzeme Yönetimi sayfası başlatılıyor...");

    // Filtre Butonları
    const filterButtons = document.querySelectorAll('#materials .btn-group .btn');
    filterButtons.forEach(button => {
        // Buton metnine göre filtre tipini belirle
        let filterType = 'all';
        const text = button.textContent.toLowerCase();
        if (text.includes('stokta')) filterType = 'instock';
        else if (text.includes('kritik')) filterType = 'critical';
        else if (text.includes('sipariş')) filterType = 'pendingorder';

        // Listener ekle (öncekini kaldırarak)
         button.replaceWith(button.cloneNode(true)); // Eski listenerları temizle
         document.querySelector(`#materials .btn-group .btn:contains("${button.textContent}")`) // Yeniden seç
                 .addEventListener('click', (e) => handleMaterialFilterChange(e, filterType));

         // HTML'deki başlangıç active durumuna göre state'i ayarla
         if(button.classList.contains('active')){
            materialsData.currentFilter = filterType;
         }
    });

     // Tablo body'sine ID ekle (eğer yoksa)
     const tableBody = document.querySelector('#materials table tbody');
     if(tableBody && !tableBody.id) {
         tableBody.id = 'materials-table-body';
         console.log("'materials-table-body' ID'si tablo body'sine eklendi.");
     }

     // Son siparişler listesine ID ekle (eğer yoksa)
     const recentPurchasesList = document.querySelector('#materials .col-md-4 .list-group');
      if(recentPurchasesList && !recentPurchasesList.id) {
         recentPurchasesList.id = 'recent-purchases-list';
         console.log("'recent-purchases-list' ID'si listeye eklendi.");
     }


    // Sayfa ilk yüklendiğinde verileri çek
    loadMaterialsData();
}

// Malzeme Yönetimi sekmesi aktif olduğunda başlatıcıyı çağır
document.addEventListener('pageChanged', (e) => {
    if (e.detail && e.detail.page === 'materials') { // 'materials' ID'li sekmeyi dinle
        initializeMaterialsPage();
    }
});

// Fonksiyonları globale ekle
if (window) {
    window.loadMaterialsData = loadMaterialsData; // Manuel yenileme için
    window.createPurchaseRequestForMaterial = createPurchaseRequestForMaterial;
    window.showMaterialDetails = showMaterialDetails;
    window.showPurchaseOrderDetails = showPurchaseOrderDetails;
}

console.log("Materials module created and initialized.");

/**
 * Malzeme durumuna göre badge sınıfını döndürür.
 */
function getStatusBadgeClass(status) {
    switch (status) {
        case 'critical':
            return 'bg-danger';
        case 'low':
            return 'bg-warning';
        case 'in_stock':
            return 'bg-success';
        default:
            return 'bg-secondary';
    }
}

/**
 * Malzeme durumuna göre metin döndürür.
 */
function getStatusText(status) {
    switch (status) {
        case 'critical':
            return 'Kritik';
        case 'low':
            return 'Düşük';
        case 'in_stock':
            return 'Yeterli';
        default:
            return 'Bilinmiyor';
    }
}

/**
 * Malzeme filtrelerini uygular.
 */
function applyMaterialFilters() {
    const filter = materialsData.currentFilter;
    let filteredItems = [...materialsData.stockItems];

    switch (filter) {
        case 'critical':
            filteredItems = filteredItems.filter(item => item.status === 'critical');
            break;
        case 'low':
            filteredItems = filteredItems.filter(item => item.status === 'low');
            break;
        case 'pending':
            filteredItems = filteredItems.filter(item => item.pendingOrders > 0);
            break;
        // 'all' için filtreleme yapma
    }

    materialsData.filteredItems = filteredItems;
    renderMaterialsTable();
}

/**
 * Malzeme filtre değişikliğini işler.
 */
function handleMaterialFilterChange(filter) {
    materialsData.currentFilter = filter;
    applyMaterialFilters();
}

/**
 * Malzeme tahmin grafiğini render eder.
 */
function renderMaterialForecastChart() {
    const ctx = document.getElementById('materialForecastChart');
    if (!ctx) return;

    // Demo veri
    const data = {
        labels: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'],
        datasets: [{
            label: 'Tahmini İhtiyaç',
            data: [150, 180, 200, 170, 190, 220],
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    };

    if (forecastChartInstance) {
        forecastChartInstance.destroy();
    }

    forecastChartInstance = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

/**
 * Son satın alma siparişlerini render eder.
 */
function renderRecentPurchases() {
    const container = document.getElementById('recent-purchases-list');
    if (!container) return;

    // Demo veri
    const recentPurchases = [
        {
            id: 'PO-001',
            date: '2024-03-15',
            material: 'Hücre Gövdesi',
            quantity: 100,
            status: 'pending'
        },
        {
            id: 'PO-002',
            date: '2024-03-14',
            material: 'Terminal',
            quantity: 200,
            status: 'approved'
        },
        {
            id: 'PO-003',
            date: '2024-03-13',
            material: 'Yalıtım Malzemesi',
            quantity: 150,
            status: 'delivered'
        }
    ];

    container.innerHTML = recentPurchases.map(purchase => `
        <div class="list-group-item">
            <div class="d-flex w-100 justify-content-between">
                <h6 class="mb-1">${purchase.material}</h6>
                <small>${new Date(purchase.date).toLocaleDateString('tr-TR')}</small>
            </div>
            <p class="mb-1">Sipariş No: ${purchase.id} | Miktar: ${purchase.quantity}</p>
            <small class="text-muted">Durum: ${getStatusText(purchase.status)}</small>
        </div>
    `).join('');
}

// Global scope'a fonksiyonları ekle
if (window) {
    window.loadMaterialsData = loadMaterialsData;
    window.showMaterialDetails = showMaterialDetails;
    window.createPurchaseRequest = createPurchaseRequest;
    window.handleMaterialFilterChange = handleMaterialFilterChange;
}

console.log("Materials module loaded."); 