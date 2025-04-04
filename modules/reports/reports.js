/**
 * reports.js
 * Raporlar ve İstatistikler
 */

// Global state for reports management
let reportsData = {
    loaded: false,
    dateRange: {
        start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        end: new Date()
    }
};

/**
 * Rapor verilerini yükler.
 */
async function loadReportsData() {
    console.log("Rapor verileri yükleniyor...");
    if (reportsData.loaded) {
        console.log("Rapor verileri zaten yüklü.");
        renderReports();
        return;
    }

    showLoadingIndicator('reports-container');

    try {
        // Verileri ERPService'den al
        if (window.ERPService && typeof window.ERPService.getReportsData === 'function') {
            const data = await window.ERPService.getReportsData(reportsData.dateRange);
            reportsData = { ...reportsData, ...data };
            console.log("Rapor verileri yüklendi:", reportsData);
        } else {
            // Demo veri
            reportsData = {
                ...reportsData,
                orders: {
                    total: 25,
                    completed: 20,
                    pending: 5,
                    revenue: 150000,
                    averageOrderValue: 6000
                },
                materials: {
                    total: 150,
                    critical: 5,
                    low: 10,
                    inStock: 135,
                    totalValue: 250000
                },
                suppliers: {
                    total: 12,
                    active: 10,
                    inactive: 2,
                    totalOrders: 45,
                    averageDeliveryTime: 7
                },
                performance: {
                    onTimeDelivery: 85,
                    orderAccuracy: 95,
                    supplierPerformance: 88,
                    inventoryTurnover: 4.5
                }
            };
        }

        reportsData.loaded = true;
        renderReports();
    } catch (error) {
        console.error("Rapor verileri yüklenirken hata:", error);
        showToast("Rapor verileri yüklenemedi.", "error");
    } finally {
        hideLoadingIndicator('reports-container');
    }
}

/**
 * Raporları render eder.
 */
function renderReports() {
    const container = document.getElementById('reports-container');
    if (!container) return;

    container.innerHTML = `
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Sipariş Özeti</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <h6>Toplam Sipariş</h6>
                                    <h3>${reportsData.orders.total}</h3>
                                </div>
                                <div class="mb-3">
                                    <h6>Tamamlanan</h6>
                                    <h3 class="text-success">${reportsData.orders.completed}</h3>
                                </div>
                                <div class="mb-3">
                                    <h6>Bekleyen</h6>
                                    <h3 class="text-warning">${reportsData.orders.pending}</h3>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <h6>Toplam Gelir</h6>
                                    <h3>${reportsData.orders.revenue.toLocaleString('tr-TR')} ₺</h3>
                                </div>
                                <div class="mb-3">
                                    <h6>Ortalama Sipariş Değeri</h6>
                                    <h3>${reportsData.orders.averageOrderValue.toLocaleString('tr-TR')} ₺</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Malzeme Durumu</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <h6>Toplam Malzeme</h6>
                                    <h3>${reportsData.materials.total}</h3>
                                </div>
                                <div class="mb-3">
                                    <h6>Kritik Stok</h6>
                                    <h3 class="text-danger">${reportsData.materials.critical}</h3>
                                </div>
                                <div class="mb-3">
                                    <h6>Düşük Stok</h6>
                                    <h3 class="text-warning">${reportsData.materials.low}</h3>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <h6>Stokta</h6>
                                    <h3 class="text-success">${reportsData.materials.inStock}</h3>
                                </div>
                                <div class="mb-3">
                                    <h6>Toplam Stok Değeri</h6>
                                    <h3>${reportsData.materials.totalValue.toLocaleString('tr-TR')} ₺</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Tedarikçi Özeti</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <h6>Toplam Tedarikçi</h6>
                                    <h3>${reportsData.suppliers.total}</h3>
                                </div>
                                <div class="mb-3">
                                    <h6>Aktif</h6>
                                    <h3 class="text-success">${reportsData.suppliers.active}</h3>
                                </div>
                                <div class="mb-3">
                                    <h6>Pasif</h6>
                                    <h3 class="text-danger">${reportsData.suppliers.inactive}</h3>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <h6>Toplam Sipariş</h6>
                                    <h3>${reportsData.suppliers.totalOrders}</h3>
                                </div>
                                <div class="mb-3">
                                    <h6>Ortalama Teslimat Süresi</h6>
                                    <h3>${reportsData.suppliers.averageDeliveryTime} gün</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Performans Göstergeleri</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <h6>Zamanında Teslimat</h6>
                                    <div class="progress">
                                        <div class="progress-bar bg-success" style="width: ${reportsData.performance.onTimeDelivery}%">
                                            ${reportsData.performance.onTimeDelivery}%
                                        </div>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <h6>Sipariş Doğruluğu</h6>
                                    <div class="progress">
                                        <div class="progress-bar bg-info" style="width: ${reportsData.performance.orderAccuracy}%">
                                            ${reportsData.performance.orderAccuracy}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <h6>Tedarikçi Performansı</h6>
                                    <div class="progress">
                                        <div class="progress-bar bg-warning" style="width: ${reportsData.performance.supplierPerformance}%">
                                            ${reportsData.performance.supplierPerformance}%
                                        </div>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <h6>Stok Devir Hızı</h6>
                                    <div class="progress">
                                        <div class="progress-bar bg-primary" style="width: ${(reportsData.performance.inventoryTurnover / 10) * 100}%">
                                            ${reportsData.performance.inventoryTurnover}x
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Gelir Grafiği</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="revenue-chart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Gelir grafiğini oluştur
    renderRevenueChart();
}

/**
 * Gelir grafiğini oluşturur.
 */
function renderRevenueChart() {
    const ctx = document.getElementById('revenue-chart');
    if (!ctx) return;

    // Demo veri
    const data = {
        labels: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'],
        datasets: [
            {
                label: 'Gelir',
                data: [120000, 135000, 150000, 145000, 160000, 155000],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
                fill: true,
                backgroundColor: 'rgba(75, 192, 192, 0.1)'
            }
        ]
    };

    new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('tr-TR') + ' ₺';
                        }
                    }
                }
            }
        }
    });
}

/**
 * Tarih aralığını günceller.
 */
function updateDateRange(startDate, endDate) {
    reportsData.dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
    };
    reportsData.loaded = false;
    loadReportsData();
}

// Global scope'a fonksiyonları ekle
if (window) {
    window.loadReportsData = loadReportsData;
    window.updateDateRange = updateDateRange;
}

console.log("Reports module loaded."); 