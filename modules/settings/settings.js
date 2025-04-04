/**
 * settings.js
 * Sistem Ayarları ve Kullanıcı Tercihleri
 */

// Global state for settings management
let settingsData = {
    loaded: false,
    settings: {
        general: {
            companyName: '',
            companyAddress: '',
            companyPhone: '',
            companyEmail: '',
            currency: 'TRY',
            dateFormat: 'DD.MM.YYYY',
            timeFormat: '24',
            language: 'tr'
        },
        notifications: {
            emailNotifications: true,
            browserNotifications: true,
            lowStockAlert: true,
            orderStatusChange: true,
            deliveryReminder: true
        },
        inventory: {
            autoReorder: true,
            reorderPoint: 10,
            criticalStockLevel: 5,
            defaultWarehouse: '',
            enableBarcode: true
        },
        orders: {
            autoAssignSupplier: true,
            defaultPaymentTerms: 30,
            enableOrderTracking: true,
            requireApproval: false
        },
        reporting: {
            defaultDateRange: 'month',
            exportFormat: 'pdf',
            enableCharts: true,
            autoRefresh: true,
            refreshInterval: 5
        }
    }
};

/**
 * Ayarları yükler.
 */
async function loadSettings() {
    console.log("Ayarlar yükleniyor...");
    if (settingsData.loaded) {
        console.log("Ayarlar zaten yüklü.");
        renderSettings();
        return;
    }

    showLoadingIndicator('settings-container');

    try {
        // Ayarları LocalStorage'dan al
        const savedSettings = localStorage.getItem('erp_settings');
        if (savedSettings) {
            settingsData.settings = JSON.parse(savedSettings);
            console.log("Ayarlar LocalStorage'dan yüklendi:", settingsData.settings);
        } else {
            // Varsayılan ayarları kullan
            console.log("Varsayılan ayarlar kullanılıyor.");
        }

        settingsData.loaded = true;
        renderSettings();
    } catch (error) {
        console.error("Ayarlar yüklenirken hata:", error);
        showToast("Ayarlar yüklenemedi.", "error");
    } finally {
        hideLoadingIndicator('settings-container');
    }
}

/**
 * Ayarları kaydeder.
 */
async function saveSettings() {
    try {
        // Ayarları LocalStorage'a kaydet
        localStorage.setItem('erp_settings', JSON.stringify(settingsData.settings));
        console.log("Ayarlar kaydedildi:", settingsData.settings);

        // ERPService'e kaydet
        if (window.ERPService && typeof window.ERPService.saveSettings === 'function') {
            await window.ERPService.saveSettings(settingsData.settings);
            console.log("Ayarlar ERPService'e kaydedildi.");
        }

        showToast("Ayarlar başarıyla kaydedildi.", "success");
    } catch (error) {
        console.error("Ayarlar kaydedilirken hata:", error);
        showToast("Ayarlar kaydedilemedi.", "error");
    }
}

/**
 * Ayarları render eder.
 */
function renderSettings() {
    const container = document.getElementById('settings-container');
    if (!container) return;

    container.innerHTML = `
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Genel Ayarlar</h5>
                    </div>
                    <div class="card-body">
                        <form id="general-settings-form">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Firma Adı</label>
                                        <input type="text" class="form-control" name="companyName" 
                                               value="${settingsData.settings.general.companyName}">
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Firma Adresi</label>
                                        <textarea class="form-control" name="companyAddress" rows="3">${settingsData.settings.general.companyAddress}</textarea>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Telefon</label>
                                        <input type="tel" class="form-control" name="companyPhone" 
                                               value="${settingsData.settings.general.companyPhone}">
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">E-posta</label>
                                        <input type="email" class="form-control" name="companyEmail" 
                                               value="${settingsData.settings.general.companyEmail}">
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label">Para Birimi</label>
                                        <select class="form-select" name="currency">
                                            <option value="TRY" ${settingsData.settings.general.currency === 'TRY' ? 'selected' : ''}>TRY</option>
                                            <option value="USD" ${settingsData.settings.general.currency === 'USD' ? 'selected' : ''}>USD</option>
                                            <option value="EUR" ${settingsData.settings.general.currency === 'EUR' ? 'selected' : ''}>EUR</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label">Tarih Formatı</label>
                                        <select class="form-select" name="dateFormat">
                                            <option value="DD.MM.YYYY" ${settingsData.settings.general.dateFormat === 'DD.MM.YYYY' ? 'selected' : ''}>DD.MM.YYYY</option>
                                            <option value="MM/DD/YYYY" ${settingsData.settings.general.dateFormat === 'MM/DD/YYYY' ? 'selected' : ''}>MM/DD/YYYY</option>
                                            <option value="YYYY-MM-DD" ${settingsData.settings.general.dateFormat === 'YYYY-MM-DD' ? 'selected' : ''}>YYYY-MM-DD</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label">Saat Formatı</label>
                                        <select class="form-select" name="timeFormat">
                                            <option value="24" ${settingsData.settings.general.timeFormat === '24' ? 'selected' : ''}>24 Saat</option>
                                            <option value="12" ${settingsData.settings.general.timeFormat === '12' ? 'selected' : ''}>12 Saat</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        <div class="row mt-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Bildirim Ayarları</h5>
                    </div>
                    <div class="card-body">
                        <form id="notification-settings-form">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" name="emailNotifications" 
                                                   ${settingsData.settings.notifications.emailNotifications ? 'checked' : ''}>
                                            <label class="form-check-label">E-posta Bildirimleri</label>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" name="browserNotifications" 
                                                   ${settingsData.settings.notifications.browserNotifications ? 'checked' : ''}>
                                            <label class="form-check-label">Tarayıcı Bildirimleri</label>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" name="lowStockAlert" 
                                                   ${settingsData.settings.notifications.lowStockAlert ? 'checked' : ''}>
                                            <label class="form-check-label">Düşük Stok Uyarısı</label>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" name="orderStatusChange" 
                                                   ${settingsData.settings.notifications.orderStatusChange ? 'checked' : ''}>
                                            <label class="form-check-label">Sipariş Durumu Değişikliği</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        <div class="row mt-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Stok Ayarları</h5>
                    </div>
                    <div class="card-body">
                        <form id="inventory-settings-form">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" name="autoReorder" 
                                                   ${settingsData.settings.inventory.autoReorder ? 'checked' : ''}>
                                            <label class="form-check-label">Otomatik Sipariş</label>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Sipariş Noktası</label>
                                        <input type="number" class="form-control" name="reorderPoint" 
                                               value="${settingsData.settings.inventory.reorderPoint}">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Kritik Stok Seviyesi</label>
                                        <input type="number" class="form-control" name="criticalStockLevel" 
                                               value="${settingsData.settings.inventory.criticalStockLevel}">
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Varsayılan Depo</label>
                                        <input type="text" class="form-control" name="defaultWarehouse" 
                                               value="${settingsData.settings.inventory.defaultWarehouse}">
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        <div class="row mt-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Sipariş Ayarları</h5>
                    </div>
                    <div class="card-body">
                        <form id="order-settings-form">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" name="autoAssignSupplier" 
                                                   ${settingsData.settings.orders.autoAssignSupplier ? 'checked' : ''}>
                                            <label class="form-check-label">Otomatik Tedarikçi Atama</label>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Varsayılan Ödeme Vadesi (Gün)</label>
                                        <input type="number" class="form-control" name="defaultPaymentTerms" 
                                               value="${settingsData.settings.orders.defaultPaymentTerms}">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" name="enableOrderTracking" 
                                                   ${settingsData.settings.orders.enableOrderTracking ? 'checked' : ''}>
                                            <label class="form-check-label">Sipariş Takibi</label>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" name="requireApproval" 
                                                   ${settingsData.settings.orders.requireApproval ? 'checked' : ''}>
                                            <label class="form-check-label">Onay Gerekli</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        <div class="row mt-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Raporlama Ayarları</h5>
                    </div>
                    <div class="card-body">
                        <form id="reporting-settings-form">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Varsayılan Tarih Aralığı</label>
                                        <select class="form-select" name="defaultDateRange">
                                            <option value="day" ${settingsData.settings.reporting.defaultDateRange === 'day' ? 'selected' : ''}>Günlük</option>
                                            <option value="week" ${settingsData.settings.reporting.defaultDateRange === 'week' ? 'selected' : ''}>Haftalık</option>
                                            <option value="month" ${settingsData.settings.reporting.defaultDateRange === 'month' ? 'selected' : ''}>Aylık</option>
                                            <option value="year" ${settingsData.settings.reporting.defaultDateRange === 'year' ? 'selected' : ''}>Yıllık</option>
                                        </select>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Dışa Aktarma Formatı</label>
                                        <select class="form-select" name="exportFormat">
                                            <option value="pdf" ${settingsData.settings.reporting.exportFormat === 'pdf' ? 'selected' : ''}>PDF</option>
                                            <option value="excel" ${settingsData.settings.reporting.exportFormat === 'excel' ? 'selected' : ''}>Excel</option>
                                            <option value="csv" ${settingsData.settings.reporting.exportFormat === 'csv' ? 'selected' : ''}>CSV</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" name="enableCharts" 
                                                   ${settingsData.settings.reporting.enableCharts ? 'checked' : ''}>
                                            <label class="form-check-label">Grafikleri Göster</label>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" name="autoRefresh" 
                                                   ${settingsData.settings.reporting.autoRefresh ? 'checked' : ''}>
                                            <label class="form-check-label">Otomatik Yenileme</label>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Yenileme Aralığı (Dakika)</label>
                                        <input type="number" class="form-control" name="refreshInterval" 
                                               value="${settingsData.settings.reporting.refreshInterval}">
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        <div class="row mt-4">
            <div class="col-12">
                <button type="button" class="btn btn-primary" onclick="saveSettings()">
                    <i class="fas fa-save"></i> Ayarları Kaydet
                </button>
            </div>
        </div>
    `;

    // Form değişikliklerini dinle
    setupFormListeners();
}

/**
 * Form değişikliklerini dinler.
 */
function setupFormListeners() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('change', (e) => {
            const target = e.target;
            const section = target.closest('form').id.replace('-settings-form', '');
            const setting = target.name;

            if (target.type === 'checkbox') {
                settingsData.settings[section][setting] = target.checked;
            } else {
                settingsData.settings[section][setting] = target.value;
            }

            console.log(`Ayar güncellendi: ${section}.${setting} = ${settingsData.settings[section][setting]}`);
        });
    });
}

// Global scope'a fonksiyonları ekle
if (window) {
    window.loadSettings = loadSettings;
    window.saveSettings = saveSettings;
}

console.log("Settings module loaded."); 