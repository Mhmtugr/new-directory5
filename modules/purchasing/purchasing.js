/**
 * purchasing.js
 * Satın Alma Yönetimi
 */

// Global state for purchasing management
let purchasingData = {
    purchaseRequests: [], // Satın alma talepleri
    purchaseOrders: [], // Satın alma siparişleri
    loaded: false
};

/**
 * Satın alma verilerini yükler.
 */
async function loadPurchaseData() {
    console.log("Satın alma verileri yükleniyor...");
    if (purchasingData.loaded && purchasingData.purchaseRequests.length > 0) {
        console.log("Satın alma verileri zaten yüklü.");
        renderPurchaseRequestsTable();
        return;
    }

    showLoadingIndicator('purchase-requests-table-body');

    try {
        // Verileri ERPService'den al
        if (window.ERPService && typeof window.ERPService.getPurchaseRequests === 'function') {
            purchasingData.purchaseRequests = await window.ERPService.getPurchaseRequests();
            purchasingData.purchaseOrders = await window.ERPService.getPurchaseOrders();
            console.log("Satın alma verileri yüklendi:", purchasingData);
        } else {
            // Demo veri
            purchasingData.purchaseRequests = [
                {
                    id: 'PR-001',
                    materialCode: 'M001',
                    materialName: 'Orta Gerilim Devre Kesici',
                    requiredQuantity: 5,
                    unit: 'adet',
                    relatedOrderNo: 'ORD-001',
                    status: 'pending',
                    createdAt: '2024-03-15',
                    priority: 'high'
                },
                {
                    id: 'PR-002',
                    materialCode: 'M002',
                    materialName: 'Koruma Rölesi',
                    requiredQuantity: 10,
                    unit: 'adet',
                    relatedOrderNo: 'ORD-002',
                    status: 'approved',
                    createdAt: '2024-03-14',
                    priority: 'medium'
                },
                {
                    id: 'PR-003',
                    materialCode: 'M003',
                    materialName: 'Metal Kasalar',
                    requiredQuantity: 20,
                    unit: 'adet',
                    relatedOrderNo: 'ORD-003',
                    status: 'rejected',
                    createdAt: '2024-03-13',
                    priority: 'low'
                }
            ];

            purchasingData.purchaseOrders = [
                {
                    id: 'PO-001',
                    supplierId: 'SUP-001',
                    supplierName: 'ABC Tedarik Ltd.',
                    orderDate: '2024-03-15',
                    deliveryDate: '2024-03-25',
                    status: 'processing',
                    totalAmount: 15000,
                    items: [
                        {
                            materialCode: 'M001',
                            materialName: 'Orta Gerilim Devre Kesici',
                            quantity: 5,
                            unitPrice: 2500
                        }
                    ]
                },
                {
                    id: 'PO-002',
                    supplierId: 'SUP-002',
                    supplierName: 'XYZ Malzeme A.Ş.',
                    orderDate: '2024-03-14',
                    deliveryDate: '2024-03-24',
                    status: 'pending',
                    totalAmount: 8500,
                    items: [
                        {
                            materialCode: 'M002',
                            materialName: 'Koruma Rölesi',
                            quantity: 10,
                            unitPrice: 850
                        }
                    ]
                }
            ];
        }

        purchasingData.loaded = true;
        renderPurchaseRequestsTable();
    } catch (error) {
        console.error("Satın alma verileri yüklenirken hata:", error);
        showToast("Satın alma verileri yüklenemedi.", "error");
    } finally {
        hideLoadingIndicator('purchase-requests-table-body');
    }
}

/**
 * Satın alma talepleri tablosunu render eder.
 */
function renderPurchaseRequestsTable() {
    const tbody = document.getElementById('purchase-requests-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    purchasingData.purchaseRequests.forEach(request => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${request.id}</td>
            <td>${request.materialCode}</td>
            <td>${request.materialName}</td>
            <td>${request.requiredQuantity} ${request.unit}</td>
            <td>${request.relatedOrderNo}</td>
            <td>
                <span class="badge ${getRequestStatusBadgeClass(request.status)}">
                    ${getRequestStatusText(request.status)}
                </span>
            </td>
            <td>
                <span class="badge ${getPriorityBadgeClass(request.priority)}">
                    ${getPriorityText(request.priority)}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="showPurchaseRequestDetails('${request.id}')">
                    <i class="fas fa-info-circle"></i> Detay
                </button>
                ${request.status === 'pending' ? `
                    <button class="btn btn-sm btn-success" onclick="createPurchaseOrder('${request.id}')">
                        <i class="fas fa-shopping-cart"></i> Sipariş Oluştur
                    </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Satın alma talebi detaylarını gösterir.
 */
function showPurchaseRequestDetails(requestId) {
    const request = purchasingData.purchaseRequests.find(r => r.id === requestId);
    if (!request) {
        showToast("Satın alma talebi bulunamadı.", "error");
        return;
    }

    // Modal içeriğini oluştur
    const modalContent = `
        <div class="modal-header">
            <h5 class="modal-title">Satın Alma Talebi Detayları</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
            <div class="row">
                <div class="col-md-6">
                    <h6>Talep Bilgileri</h6>
                    <table class="table table-sm">
                        <tr>
                            <th>Talep No:</th>
                            <td>${request.id}</td>
                        </tr>
                        <tr>
                            <th>Malzeme Kodu:</th>
                            <td>${request.materialCode}</td>
                        </tr>
                        <tr>
                            <th>Malzeme Adı:</th>
                            <td>${request.materialName}</td>
                        </tr>
                        <tr>
                            <th>Miktar:</th>
                            <td>${request.requiredQuantity} ${request.unit}</td>
                        </tr>
                        <tr>
                            <th>İlişkili Sipariş:</th>
                            <td>${request.relatedOrderNo}</td>
                        </tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6>Durum Bilgileri</h6>
                    <table class="table table-sm">
                        <tr>
                            <th>Durum:</th>
                            <td><span class="badge ${getRequestStatusBadgeClass(request.status)}">${getRequestStatusText(request.status)}</span></td>
                        </tr>
                        <tr>
                            <th>Öncelik:</th>
                            <td><span class="badge ${getPriorityBadgeClass(request.priority)}">${getPriorityText(request.priority)}</span></td>
                        </tr>
                        <tr>
                            <th>Oluşturma Tarihi:</th>
                            <td>${new Date(request.createdAt).toLocaleDateString('tr-TR')}</td>
                        </tr>
                    </table>
                </div>
            </div>
            ${request.status === 'pending' ? `
                <div class="row mt-3">
                    <div class="col-12">
                        <button class="btn btn-success" onclick="createPurchaseOrder('${request.id}')">
                            <i class="fas fa-shopping-cart"></i> Sipariş Oluştur
                        </button>
                    </div>
                </div>
            ` : ''}
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
        </div>
    `;

    // Modal'ı göster
    const modal = new bootstrap.Modal(document.getElementById('purchase-request-detail-modal'));
    document.getElementById('purchase-request-detail-modal').querySelector('.modal-content').innerHTML = modalContent;
    modal.show();
}

/**
 * Satın alma siparişi oluşturma formunu gösterir.
 */
function createPurchaseOrder(requestId) {
    const request = purchasingData.purchaseRequests.find(r => r.id === requestId);
    if (!request) {
        showToast("Satın alma talebi bulunamadı.", "error");
        return;
    }

    // Tedarikçi listesini al
    const suppliers = window.supplierData?.suppliers || [];

    // Modal içeriğini oluştur
    const modalContent = `
        <div class="modal-header">
            <h5 class="modal-title">Satın Alma Siparişi Oluştur</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
            <form id="purchase-order-form">
                <input type="hidden" name="requestId" value="${request.id}">
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label">Tedarikçi</label>
                            <select class="form-select" name="supplierId" required>
                                <option value="">Tedarikçi Seçin</option>
                                ${suppliers.map(supplier => `
                                    <option value="${supplier.id}">${supplier.name}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Teslim Tarihi</label>
                            <input type="date" class="form-control" name="deliveryDate" required>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label">Birim Fiyat</label>
                            <div class="input-group">
                                <input type="number" class="form-control" name="unitPrice" required>
                                <span class="input-group-text">₺</span>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Miktar</label>
                            <div class="input-group">
                                <input type="number" class="form-control" name="quantity" value="${request.requiredQuantity}" required>
                                <span class="input-group-text">${request.unit}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">İptal</button>
            <button type="button" class="btn btn-primary" onclick="submitPurchaseOrder('${request.id}')">
                <i class="fas fa-save"></i> Kaydet
            </button>
        </div>
    `;

    // Modal'ı göster
    const modal = new bootstrap.Modal(document.getElementById('purchase-request-detail-modal'));
    document.getElementById('purchase-request-detail-modal').querySelector('.modal-content').innerHTML = modalContent;
    modal.show();
}

/**
 * Satın alma siparişini kaydeder.
 */
async function submitPurchaseOrder(requestId) {
    const form = document.getElementById('purchase-order-form');
    if (!form) return;

    const formData = new FormData(form);
    const request = purchasingData.purchaseRequests.find(r => r.id === requestId);
    if (!request) return;

    const orderData = {
        id: `PO-${Date.now()}`,
        requestId: formData.get('requestId'),
        supplierId: formData.get('supplierId'),
        supplierName: window.supplierData?.suppliers.find(s => s.id === formData.get('supplierId'))?.name || '',
        orderDate: new Date().toISOString().split('T')[0],
        deliveryDate: formData.get('deliveryDate'),
        status: 'pending',
        totalAmount: parseFloat(formData.get('unitPrice')) * parseInt(formData.get('quantity')),
        items: [
            {
                materialCode: request.materialCode,
                materialName: request.materialName,
                quantity: parseInt(formData.get('quantity')),
                unitPrice: parseFloat(formData.get('unitPrice'))
            }
        ]
    };

    try {
        // ERPService'e kaydet
        if (window.ERPService && typeof window.ERPService.createPurchaseOrder === 'function') {
            const result = await window.ERPService.createPurchaseOrder(orderData);
            if (result && result.success) {
                // Local state'i güncelle
                purchasingData.purchaseOrders.push(orderData);
                const requestIndex = purchasingData.purchaseRequests.findIndex(r => r.id === requestId);
                if (requestIndex !== -1) {
                    purchasingData.purchaseRequests[requestIndex].status = 'approved';
                }
                showToast("Satın alma siparişi başarıyla oluşturuldu.", "success");
                modal.hide();
                renderPurchaseRequestsTable();
            } else {
                showToast("Satın alma siparişi oluşturulamadı.", "error");
            }
        } else {
            // Demo: LocalStorage'a kaydet
            const orders = JSON.parse(localStorage.getItem('purchaseOrders') || '[]');
            orders.push(orderData);
            localStorage.setItem('purchaseOrders', JSON.stringify(orders));
            // Local state'i güncelle
            purchasingData.purchaseOrders.push(orderData);
            const requestIndex = purchasingData.purchaseRequests.findIndex(r => r.id === requestId);
            if (requestIndex !== -1) {
                purchasingData.purchaseRequests[requestIndex].status = 'approved';
            }
            showToast("Satın alma siparişi başarıyla oluşturuldu.", "success");
            modal.hide();
            renderPurchaseRequestsTable();
        }
    } catch (error) {
        console.error("Satın alma siparişi oluşturma hatası:", error);
        showToast("Satın alma siparişi oluşturulurken hata oluştu.", "error");
    }
}

/**
 * Talep durumuna göre badge sınıfını döndürür.
 */
function getRequestStatusBadgeClass(status) {
    switch (status) {
        case 'pending':
            return 'bg-warning';
        case 'approved':
            return 'bg-success';
        case 'rejected':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
}

/**
 * Talep durumuna göre metin döndürür.
 */
function getRequestStatusText(status) {
    switch (status) {
        case 'pending':
            return 'Beklemede';
        case 'approved':
            return 'Onaylandı';
        case 'rejected':
            return 'Reddedildi';
        default:
            return 'Bilinmiyor';
    }
}

/**
 * Öncelik durumuna göre badge sınıfını döndürür.
 */
function getPriorityBadgeClass(priority) {
    switch (priority) {
        case 'high':
            return 'bg-danger';
        case 'medium':
            return 'bg-warning';
        case 'low':
            return 'bg-info';
        default:
            return 'bg-secondary';
    }
}

/**
 * Öncelik durumuna göre metin döndürür.
 */
function getPriorityText(priority) {
    switch (priority) {
        case 'high':
            return 'Yüksek';
        case 'medium':
            return 'Orta';
        case 'low':
            return 'Düşük';
        default:
            return 'Bilinmiyor';
    }
}

// Global scope'a fonksiyonları ekle
if (window) {
    window.loadPurchaseData = loadPurchaseData;
    window.showPurchaseRequestDetails = showPurchaseRequestDetails;
    window.createPurchaseOrder = createPurchaseOrder;
    window.submitPurchaseOrder = submitPurchaseOrder;
}

console.log("Purchasing module loaded.");