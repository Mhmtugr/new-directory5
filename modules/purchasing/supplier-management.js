/**
 * supplier-management.js
 * Tedarikçi Yönetimi ve İlişkileri
 */

// Global state for supplier management
let supplierData = {
    suppliers: [], // Tedarikçiler
    loaded: false
};

/**
 * Tedarikçi verilerini yükler.
 */
async function loadSuppliers() {
    console.log("Tedarikçi verileri yükleniyor...");
    if (supplierData.loaded && supplierData.suppliers.length > 0) {
        console.log("Tedarikçi verileri zaten yüklü.");
        renderSuppliersTable();
        return;
    }

    showLoadingIndicator('suppliers-table-body');

    try {
        // Verileri ERPService'den al
        if (window.ERPService && typeof window.ERPService.getSuppliers === 'function') {
            supplierData.suppliers = await window.ERPService.getSuppliers();
            console.log("Tedarikçi verileri yüklendi:", supplierData.suppliers);
        } else {
            // Demo veri
            supplierData.suppliers = [
                {
                    id: 'SUP-001',
                    code: 'ABC',
                    name: 'ABC Tedarik Ltd.',
                    contactPerson: 'Ahmet Yılmaz',
                    email: 'ahmet@abctedarik.com',
                    phone: '0212 555 1234',
                    address: 'İstanbul, Türkiye',
                    status: 'active',
                    rating: 4.5,
                    lastOrderDate: '2024-03-15'
                },
                {
                    id: 'SUP-002',
                    code: 'XYZ',
                    name: 'XYZ Malzeme A.Ş.',
                    contactPerson: 'Mehmet Demir',
                    email: 'mehmet@xyzmalzeme.com',
                    phone: '0216 444 5678',
                    address: 'Ankara, Türkiye',
                    status: 'active',
                    rating: 4.0,
                    lastOrderDate: '2024-03-14'
                },
                {
                    id: 'SUP-003',
                    code: 'TEK',
                    name: 'Teknik Tedarik Ltd.',
                    contactPerson: 'Ayşe Kaya',
                    email: 'ayse@tekniktedarik.com',
                    phone: '0232 333 9012',
                    address: 'İzmir, Türkiye',
                    status: 'inactive',
                    rating: 3.5,
                    lastOrderDate: '2024-02-28'
                }
            ];
        }

        supplierData.loaded = true;
        renderSuppliersTable();
    } catch (error) {
        console.error("Tedarikçi verileri yüklenirken hata:", error);
        showToast("Tedarikçi verileri yüklenemedi.", "error");
    } finally {
        hideLoadingIndicator('suppliers-table-body');
    }
}

/**
 * Tedarikçiler tablosunu render eder.
 */
function renderSuppliersTable() {
    const tbody = document.getElementById('suppliers-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    supplierData.suppliers.forEach(supplier => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${supplier.code}</td>
            <td>${supplier.name}</td>
            <td>${supplier.contactPerson}</td>
            <td>${supplier.email}</td>
            <td>${supplier.phone}</td>
            <td>
                <span class="badge ${getSupplierStatusBadgeClass(supplier.status)}">
                    ${getSupplierStatusText(supplier.status)}
                </span>
            </td>
            <td>
                <div class="d-flex align-items-center">
                    <span class="me-2">${supplier.rating.toFixed(1)}</span>
                    <div class="text-warning">
                        ${generateStarRating(supplier.rating)}
                    </div>
                </div>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="showSupplierDetails('${supplier.id}')">
                    <i class="fas fa-info-circle"></i> Detay
                </button>
                <button class="btn btn-sm btn-warning" onclick="editSupplier('${supplier.id}')">
                    <i class="fas fa-edit"></i> Düzenle
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Tedarikçi detaylarını gösterir.
 */
function showSupplierDetails(supplierId) {
    const supplier = supplierData.suppliers.find(s => s.id === supplierId);
    if (!supplier) {
        showToast("Tedarikçi bulunamadı.", "error");
        return;
    }

    // Modal içeriğini oluştur
    const modalContent = `
        <div class="modal-header">
            <h5 class="modal-title">Tedarikçi Detayları</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
            <div class="row">
                <div class="col-md-6">
                    <h6>Genel Bilgiler</h6>
                    <table class="table table-sm">
                        <tr>
                            <th>Kod:</th>
                            <td>${supplier.code}</td>
                        </tr>
                        <tr>
                            <th>Ad:</th>
                            <td>${supplier.name}</td>
                        </tr>
                        <tr>
                            <th>Durum:</th>
                            <td><span class="badge ${getSupplierStatusBadgeClass(supplier.status)}">${getSupplierStatusText(supplier.status)}</span></td>
                        </tr>
                        <tr>
                            <th>Değerlendirme:</th>
                            <td>
                                <div class="d-flex align-items-center">
                                    <span class="me-2">${supplier.rating.toFixed(1)}</span>
                                    <div class="text-warning">
                                        ${generateStarRating(supplier.rating)}
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6>İletişim Bilgileri</h6>
                    <table class="table table-sm">
                        <tr>
                            <th>İletişim Kişisi:</th>
                            <td>${supplier.contactPerson}</td>
                        </tr>
                        <tr>
                            <th>E-posta:</th>
                            <td>${supplier.email}</td>
                        </tr>
                        <tr>
                            <th>Telefon:</th>
                            <td>${supplier.phone}</td>
                        </tr>
                        <tr>
                            <th>Adres:</th>
                            <td>${supplier.address}</td>
                        </tr>
                    </table>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-12">
                    <h6>Son Siparişler</h6>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Sipariş No</th>
                                    <th>Tarih</th>
                                    <th>Tutar</th>
                                    <th>Durum</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${generateRecentOrders(supplier.id)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
            <button type="button" class="btn btn-warning" onclick="editSupplier('${supplier.id}')">
                <i class="fas fa-edit"></i> Düzenle
            </button>
        </div>
    `;

    // Modal'ı göster
    const modal = new bootstrap.Modal(document.getElementById('supplier-detail-modal'));
    document.getElementById('supplier-detail-modal').querySelector('.modal-content').innerHTML = modalContent;
    modal.show();
}

/**
 * Tedarikçi düzenleme formunu gösterir.
 */
function editSupplier(supplierId) {
    const supplier = supplierData.suppliers.find(s => s.id === supplierId);
    if (!supplier) {
        showToast("Tedarikçi bulunamadı.", "error");
        return;
    }

    // Modal içeriğini oluştur
    const modalContent = `
        <div class="modal-header">
            <h5 class="modal-title">Tedarikçi Düzenle</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
            <form id="supplier-edit-form">
                <input type="hidden" name="id" value="${supplier.id}">
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label">Kod</label>
                            <input type="text" class="form-control" name="code" value="${supplier.code}" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Ad</label>
                            <input type="text" class="form-control" name="name" value="${supplier.name}" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Durum</label>
                            <select class="form-select" name="status" required>
                                <option value="active" ${supplier.status === 'active' ? 'selected' : ''}>Aktif</option>
                                <option value="inactive" ${supplier.status === 'inactive' ? 'selected' : ''}>Pasif</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label">İletişim Kişisi</label>
                            <input type="text" class="form-control" name="contactPerson" value="${supplier.contactPerson}" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">E-posta</label>
                            <input type="email" class="form-control" name="email" value="${supplier.email}" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Telefon</label>
                            <input type="tel" class="form-control" name="phone" value="${supplier.phone}" required>
                        </div>
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">Adres</label>
                    <textarea class="form-control" name="address" rows="3" required>${supplier.address}</textarea>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">İptal</button>
            <button type="button" class="btn btn-primary" onclick="saveSupplierChanges('${supplier.id}')">
                <i class="fas fa-save"></i> Kaydet
            </button>
        </div>
    `;

    // Modal'ı göster
    const modal = new bootstrap.Modal(document.getElementById('supplier-detail-modal'));
    document.getElementById('supplier-detail-modal').querySelector('.modal-content').innerHTML = modalContent;
    modal.show();
}

/**
 * Tedarikçi değişikliklerini kaydeder.
 */
async function saveSupplierChanges(supplierId) {
    const form = document.getElementById('supplier-edit-form');
    if (!form) return;

    const formData = new FormData(form);
    const updatedData = {
        id: formData.get('id'),
        code: formData.get('code'),
        name: formData.get('name'),
        status: formData.get('status'),
        contactPerson: formData.get('contactPerson'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        address: formData.get('address')
    };

    try {
        // ERPService'e kaydet
        if (window.ERPService && typeof window.ERPService.updateSupplier === 'function') {
            const result = await window.ERPService.updateSupplier(updatedData);
            if (result && result.success) {
                // Local state'i güncelle
                const index = supplierData.suppliers.findIndex(s => s.id === supplierId);
                if (index !== -1) {
                    supplierData.suppliers[index] = { ...supplierData.suppliers[index], ...updatedData };
                }
                showToast("Tedarikçi bilgileri başarıyla güncellendi.", "success");
                modal.hide();
                renderSuppliersTable();
            } else {
                showToast("Tedarikçi bilgileri güncellenemedi.", "error");
            }
        } else {
            // Demo: LocalStorage'a kaydet
            const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
            const index = suppliers.findIndex(s => s.id === supplierId);
            if (index !== -1) {
                suppliers[index] = { ...suppliers[index], ...updatedData };
                localStorage.setItem('suppliers', JSON.stringify(suppliers));
            }
            // Local state'i güncelle
            const localIndex = supplierData.suppliers.findIndex(s => s.id === supplierId);
            if (localIndex !== -1) {
                supplierData.suppliers[localIndex] = { ...supplierData.suppliers[localIndex], ...updatedData };
            }
            showToast("Tedarikçi bilgileri başarıyla güncellendi.", "success");
            modal.hide();
            renderSuppliersTable();
        }
    } catch (error) {
        console.error("Tedarikçi güncelleme hatası:", error);
        showToast("Tedarikçi bilgileri güncellenirken hata oluştu.", "error");
    }
}

/**
 * Tedarikçi durumuna göre badge sınıfını döndürür.
 */
function getSupplierStatusBadgeClass(status) {
    switch (status) {
        case 'active':
            return 'bg-success';
        case 'inactive':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
}

/**
 * Tedarikçi durumuna göre metin döndürür.
 */
function getSupplierStatusText(status) {
    switch (status) {
        case 'active':
            return 'Aktif';
        case 'inactive':
            return 'Pasif';
        default:
            return 'Bilinmiyor';
    }
}

/**
 * Yıldız derecelendirmesi oluşturur.
 */
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';

    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }

    return stars;
}

/**
 * Son siparişleri oluşturur (demo).
 */
function generateRecentOrders(supplierId) {
    // Demo veri
    const orders = [
        {
            id: 'PO-001',
            date: '2024-03-15',
            amount: 15000,
            status: 'delivered'
        },
        {
            id: 'PO-002',
            date: '2024-03-10',
            amount: 8500,
            status: 'pending'
        },
        {
            id: 'PO-003',
            date: '2024-03-05',
            amount: 12000,
            status: 'processing'
        }
    ];

    return orders.map(order => `
        <tr>
            <td>${order.id}</td>
            <td>${new Date(order.date).toLocaleDateString('tr-TR')}</td>
            <td>${order.amount.toLocaleString('tr-TR')} ₺</td>
            <td><span class="badge ${getOrderStatusBadgeClass(order.status)}">${getOrderStatusText(order.status)}</span></td>
        </tr>
    `).join('');
}

/**
 * Sipariş durumuna göre badge sınıfını döndürür.
 */
function getOrderStatusBadgeClass(status) {
    switch (status) {
        case 'pending':
            return 'bg-warning';
        case 'processing':
            return 'bg-info';
        case 'delivered':
            return 'bg-success';
        case 'cancelled':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
}

/**
 * Sipariş durumuna göre metin döndürür.
 */
function getOrderStatusText(status) {
    switch (status) {
        case 'pending':
            return 'Beklemede';
        case 'processing':
            return 'İşleniyor';
        case 'delivered':
            return 'Teslim Edildi';
        case 'cancelled':
            return 'İptal Edildi';
        default:
            return 'Bilinmiyor';
    }
}

// Global scope'a fonksiyonları ekle
if (window) {
    window.loadSuppliers = loadSuppliers;
    window.showSupplierDetails = showSupplierDetails;
    window.editSupplier = editSupplier;
    window.saveSupplierChanges = saveSupplierChanges;
}

console.log("Supplier Management module loaded.");