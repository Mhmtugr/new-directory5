/**
 * orders.js
 * Sipariş yönetimi işlevleri
 */

/**
 * Sipariş listesini Firebase veya Local Storage'dan yükler ve gösterir.
 */
async function loadOrders() {
    console.log("Siparişler yükleniyor...");
    const container = document.getElementById('order-list-container');
    if (!container) {
        console.error("'order-list-container' elementi bulunamadı.");
        return;
    }
    container.innerHTML = '<div class="text-center p-5"><i class="bi bi-arrow-clockwise fs-3 spin"></i> Yükleniyor...</div>'; // Basit yükleniyor göstergesi

    try {
        let orders = [];
        let dataSource = 'Bilinmiyor';

        // Firebase Firestore kullanılıyorsa ve aktifse
        if (window.AppConfig?.firebase?.enabled && window.firebase?.firestore) {
            try {
                const snapshot = await window.firebase.firestore().collection('orders').orderBy('orderDate', 'desc').get();
                if (!snapshot.empty) {
                    orders = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        orderDate: doc.data().orderDate?.toDate ? doc.data().orderDate.toDate() : (doc.data().orderDate ? new Date(doc.data().orderDate) : null),
                        deliveryDate: doc.data().deliveryDate?.toDate ? doc.data().deliveryDate.toDate() : (doc.data().deliveryDate ? new Date(doc.data().deliveryDate) : null),
                        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : null
                    }));
                    dataSource = 'Firebase';
                    console.log("Siparişler Firebase'den yüklendi.");
                }
            } catch (fbError) {
                console.error("Siparişler Firebase'den yüklenirken hata:", fbError);
                // Hata olursa Local Storage'a fallback dene
            }
        }
        
        // Firebase'den veri gelmediyse veya Firebase kapalıysa Local Storage'a bak
        if (orders.length === 0 && dataSource !== 'Firebase') {
             try {
                const localData = localStorage.getItem('demoOrders');
                if (localData) {
                    orders = JSON.parse(localData);
                    orders = orders.map(order => ({
                        ...order,
                        orderDate: order.orderDate ? new Date(order.orderDate) : null,
                        deliveryDate: order.deliveryDate ? new Date(order.deliveryDate) : null
                    }));
                    dataSource = 'LocalStorage';
                    console.log("Siparişler Local Storage'dan yüklendi.");
                }
            } catch (lsError) {
                console.error("Siparişler Local Storage'dan yüklenirken hata:", lsError);
                orders = [];
            }
        }
        
        // Hala veri yoksa ERP demo verisini kullan (son çare)
        if (orders.length === 0 && dataSource === 'Bilinmiyor' && window.ERPService?.getDemoOrderData) {
             try {
                console.log("ERP Demo sipariş verisi kullanılıyor.");
                const demoData = await window.ERPService.getDemoOrderData();
                 orders = demoData.map(order => ({
                     ...order,
                     orderDate: order.orderDate ? new Date(order.orderDate) : null,
                     deliveryDate: order.deliveryDate ? new Date(order.deliveryDate) : null
                 }));
                 dataSource = 'Demo ERP';
            } catch (demoError) {
                console.error("ERP Demo sipariş verisi alınırken hata:", demoError);
                 orders = [];
            }
        }

        console.log(`Render edilecek ${orders.length} sipariş bulundu (Kaynak: ${dataSource})`);
        renderOrderList(orders);

    } catch (error) {
        console.error("Siparişleri yükleme işlemi sırasında genel hata:", error);
        container.innerHTML = `<div class="alert alert-danger">Siparişler yüklenirken bir hata oluştu: ${error.message}</div>`;
    }
}

/**
 * Verilen sipariş listesini HTML kartları olarak render eder.
 * @param {Array<object>} orders - Sipariş nesneleri dizisi
 */
function renderOrderList(orders) {
    const container = document.getElementById('order-list-container');
    if (!container) {
        console.error("'order-list-container' elementi render için bulunamadı.");
        return;
    }

    if (!orders || orders.length === 0) {
        container.innerHTML = '<div class="alert alert-info text-center mt-3">Gösterilecek sipariş bulunamadı.</div>';
        return;
    }

    // Filtreleme (varsa)
    const filteredOrders = applyOrderFilters(orders);

     if (filteredOrders.length === 0) {
        container.innerHTML = '<div class="alert alert-info text-center mt-3">Filtre kriterlerine uygun sipariş bulunamadı.</div>';
        return;
    }

    let html = '';
    filteredOrders.forEach(order => {
        const orderDateStr = order.orderDate instanceof Date ? order.orderDate.toLocaleDateString('tr-TR') : '-';
        const deliveryDateStr = order.deliveryDate instanceof Date ? order.deliveryDate.toLocaleDateString('tr-TR') : '-';
        
        const { statusClass, statusText } = getStatusInfo(order.status);
        const priorityClass = getPriorityClass(order); 
        const progress = order.progress || calculateOrderProgress(order); 
        const { hasNotification, notificationClass, notificationTitle, notificationCount } = getNotificationInfo(order);

        html += `
            <div class="card mb-3 order-card ${priorityClass}" onclick="showOrderDetails('${order.id}')" style="cursor: pointer;" title="Detayları görmek için tıkla">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-3 col-6 mb-2 mb-md-0">
                            <h6 class="mb-1 text-truncate">${order.orderNo || 'Sipariş No Yok'}</h6>
                            <small class="text-muted text-truncate d-block">${order.customer || 'Müşteri Yok'}</small>
                        </div>
                        <div class="col-md-3 col-6 mb-2 mb-md-0">
                            <span class="fw-bold">${order.cellType || 'Tip Yok'}</span> 
                            ${order.cellCount ? `(${order.cellCount} adet)` : ''}
                        </div>
                        <div class="col-md-2 col-6 mb-2 mb-md-0">
                            <span class="status-badge ${statusClass}">${statusText}</span>
                        </div>
                        <div class="col-md-3 col-6 mb-2 mb-md-0">
                            ${progress > 0 ? `
                            <div class="progress progress-thin mb-1" title="%${progress} tamamlandı">
                                <div class="progress-bar ${getProgressBarClass(progress)}" role="progressbar" style="width: ${progress}%;" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            ` : '<div style="height: 5px; margin-bottom: 4px;"></div>'}
                            <small class="text-muted">Teslimat: ${deliveryDateStr}</small>
                        </div>
                        <div class="col-md-1 col-12 text-md-end mt-2 mt-md-0">
                            ${hasNotification ? `
                             <span class="position-relative me-2" style="font-size: 1.1rem;">
                                <i class="bi ${notificationClass}" title="${notificationTitle}"></i>
                                ${notificationCount > 0 ? `<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style="font-size: 0.6rem; padding: 0.2em 0.4em;">${notificationCount}</span>` : ''} 
                            </span>
                            ` : ''}
                            <button class="btn btn-sm btn-outline-secondary" onclick="event.stopPropagation(); showOrderDetails('${order.id}')" title="Detay/Düzenle">
                                <i class="bi bi-pencil"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

/**
 * Belirli bir siparişin detaylarını modal pencerede gösterir.
 * @param {string} orderId Gösterilecek siparişin ID'si
 */
async function showOrderDetails(orderId) {
    console.log(`Sipariş detayları gösteriliyor: ${orderId}`);
    const modalElement = document.getElementById('order-detail-modal');
    if (!modalElement) {
        console.error("Sipariş detay modalı bulunamadı!");
        showToast("Detaylar gösterilemiyor.", "error");
        return;
    }

    const modalTitle = modalElement.querySelector('#modal-order-id');
    const modalBody = modalElement.querySelector('#order-detail-content');
    const materialStatusDiv = modalElement.querySelector('#order-material-status');
    const notesListDiv = modalElement.querySelector('#order-notes-list');
    const addNoteBtn = modalElement.querySelector('#add-order-note-btn');
    const newNoteTextarea = modalElement.querySelector('#new-order-note');
    const fieldset = modalElement.querySelector('#order-edit-fieldset');
    const editBtn = modalElement.querySelector('#edit-order-btn');
    const saveBtn = modalElement.querySelector('#save-order-btn');
    const descriptionTextarea = modalElement.querySelector('#order-description');

    // Modal içeriğini temizle ve yükleniyor göster
    modalTitle.textContent = orderId;
    modalBody.innerHTML = '<p class="text-center"><i class="bi bi-arrow-clockwise spin"></i> Detaylar yükleniyor...</p>';
    materialStatusDiv.innerHTML = '<p class="text-center"><i class="bi bi-arrow-clockwise spin"></i> Malzeme durumu yükleniyor...</p>';
    notesListDiv.innerHTML = '<p class="text-center"><i class="bi bi-arrow-clockwise spin"></i> Notlar yükleniyor...</p>';
    newNoteTextarea.value = ''; // Not alanını temizle
    descriptionTextarea.value = ''; // Açıklama alanını temizle
    fieldset.disabled = true; // Başlangıçta fieldset'i devre dışı bırak
    editBtn.classList.remove('d-none'); // Düzenle butonunu göster
    saveBtn.classList.add('d-none'); // Kaydet butonunu gizle

    // Modal instance'ını al veya oluştur
    const orderDetailModal = bootstrap.Modal.getOrCreateInstance(modalElement);
    orderDetailModal.show();

    try {
        // Sipariş verisini al (API veya local state)
        let orderData = null;
        if (window.ERPService && typeof window.ERPService.getOrderById === 'function') {
            orderData = await window.ERPService.getOrderById(orderId);
        } else {
            // Alternatif: currentOrders listesinden bul (currentOrders tanımlı varsayılır)
            // orderData = currentOrders.find(o => (o.orderId || o.id) === orderId);
            console.warn("ERPService.getOrderById bulunamadı, sipariş verisi alınamadı.")
        }

        if (!orderData) {
            throw new Error("Sipariş verisi bulunamadı.");
        }

        // Malzeme durumu ve notları al
        let materialStatus = [];
        if (window.ERPService && typeof window.ERPService.getOrderMaterialStatus === 'function') {
             materialStatus = await window.ERPService.getOrderMaterialStatus(orderId);
        }
        let notes = loadOrderNotes(orderId);

        // Modal içeriğini doldur (populateOrderDetailModal güncellenecek)
        populateOrderDetailModal(orderData, materialStatus, notes);

        // Olay Dinleyicileri (öncekileri kaldırıp yenilerini ekle)
        const newEditBtn = editBtn.cloneNode(true);
        editBtn.replaceWith(newEditBtn);
        newEditBtn.addEventListener('click', () => {
            fieldset.disabled = false;
            newEditBtn.classList.add('d-none');
            saveBtn.classList.remove('d-none');
        });

        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.replaceWith(newSaveBtn);
        newSaveBtn.addEventListener('click', async () => {
            await updateOrder(orderId); // Güncelleme fonksiyonunu çağır
            // updateOrder içinde fieldset disable edilir ve butonlar ayarlanır (başarılı olursa)
        });
        
        // Modal kapandığında düzenleme modunu sıfırla
        modalElement.addEventListener('hidden.bs.modal', () => {
             fieldset.disabled = true;
             newEditBtn.classList.remove('d-none');
             newSaveBtn.classList.add('d-none');
        }, { once: true }); // Sadece bir kere çalışsın

        const newAddNoteBtn = addNoteBtn.cloneNode(true); 
        addNoteBtn.replaceWith(newAddNoteBtn);
        newAddNoteBtn.addEventListener('click', () => addOrderNote(orderId));

    } catch (error) {
        console.error("Sipariş detayları yüklenirken hata:", error);
        modalBody.innerHTML = `<div class="alert alert-danger">Detaylar yüklenirken bir hata oluştu: ${error.message}</div>`;
        materialStatusDiv.innerHTML = '<p class="text-danger">Malzeme durumu yüklenemedi.</p>';
        notesListDiv.innerHTML = '<p class="text-danger">Notlar yüklenemedi.</p>';
    }
}

/**
 * Sipariş detay modalını verilerle ve form elemanlarıyla doldurur.
 * @param {object} orderData Sipariş bilgileri
 * @param {Array<object>} materialStatus Malzeme durumu listesi
 * @param {Array<object>} notes Sipariş notları listesi
 */
function populateOrderDetailModal(orderData, materialStatus, notes) {
    const modalBodyContent = document.querySelector('#order-detail-modal #order-detail-content');
    const materialStatusDiv = document.querySelector('#order-detail-modal #order-material-status');
    const notesListDiv = document.querySelector('#order-detail-modal #order-notes-list');
    const descriptionTextarea = document.querySelector('#order-detail-modal #order-description');

    // Açıklama alanını doldur
    descriptionTextarea.value = orderData.description || '';

    // Sipariş Genel Bilgileri (Form elemanları ile)
    // TODO: Daha fazla alan eklenebilir (Müşteri, Hücre Tipi vb. select olabilir)
    let detailsHtml = `
        <div class="row g-3">
            <div class="col-md-6">
                <label for="order-customer" class="form-label">Müşteri</label>
                <input type="text" class="form-control" id="order-customer" value="${orderData.customer || ''}" readonly> 
            </div>
            <div class="col-md-6">
                <label for="order-orderDate" class="form-label">Sipariş Tarihi</label>
                <input type="date" class="form-control" id="order-orderDate" value="${orderData.orderDate ? new Date(orderData.orderDate).toISOString().split('T')[0] : ''}"> 
            </div>
            <div class="col-md-6">
                 <label for="order-deliveryDate" class="form-label">İstenen Teslim Tarihi</label>
                 <input type="date" class="form-control" id="order-deliveryDate" value="${orderData.deliveryDate ? new Date(orderData.deliveryDate).toISOString().split('T')[0] : ''}">
            </div>
            <div class="col-md-6">
                <label for="order-status" class="form-label">Durum</label>
                <select class="form-select" id="order-status">
                    <option value="planning" ${orderData.status === 'planning' ? 'selected' : ''}>Planlama</option>
                    <option value="confirmed" ${orderData.status === 'confirmed' ? 'selected' : ''}>Onaylandı</option>
                    <option value="waiting" ${orderData.status === 'waiting' ? 'selected' : ''}>Malzeme Bekliyor</option>
                    <option value="production" ${orderData.status === 'production' ? 'selected' : ''}>Üretimde</option>
                    <option value="delayed" ${orderData.status === 'delayed' ? 'selected' : ''}>Gecikmiş</option>
                    <option value="ready" ${orderData.status === 'ready' ? 'selected' : ''}>Sevke Hazır</option>
                    <option value="completed" ${orderData.status === 'completed' ? 'selected' : ''}>Tamamlandı</option>
                    <!-- Diğer durumlar eklenebilir -->
                </select>
            </div>
            </div>
             <div class="row g-3 mt-1">
             <div class="col-md-4">
                 <label for="order-cellType" class="form-label">Hücre Tipi</label>
                 <input type="text" class="form-control" id="order-cellType" value="${orderData.cellType || ''}">
             </div>
             <div class="col-md-2">
                 <label for="order-quantity" class="form-label">Adet</label>
                 <input type="number" class="form-control" id="order-quantity" value="${orderData.quantity || orderData.cellCount || ''}">
             </div>
            <div class="col-md-3">
                 <label for="order-voltage" class="form-label">Gerilim/Akım</label>
                 <input type="text" class="form-control" id="order-voltage" value="${orderData.voltage || ''} / ${orderData.current || ''}">
             </div>
              <div class="col-md-3">
                 <label for="order-relayType" class="form-label">Röle Tipi</label>
                 <input type="text" class="form-control" id="order-relayType" value="${orderData.relayType || '-'}">
             </div>
             
        </div>
    `;
    modalBodyContent.innerHTML = detailsHtml;

    // Malzeme Durumu
    let materialHtml = '<p>Veri yok.</p>';
    if (materialStatus && materialStatus.length > 0) {
        materialHtml = '<ul class="list-group list-group-flush">';
        materialStatus.forEach(mat => {
            let statusText = 'Bilinmiyor';
            let statusClass = 'text-muted';
            if (mat.status === 'available') { statusText = 'Mevcut'; statusClass = 'text-success'; }
            else if (mat.status === 'missing' || mat.status === 'insufficient') { statusText = 'Eksik'; statusClass = 'text-danger'; }
            else if (mat.status === 'ordered') { statusText = 'Sipariş Edildi'; statusClass = 'text-info'; }
            else if (mat.status === 'reserved') { statusText = 'Rezerve'; statusClass = 'text-primary'; }

            materialHtml += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <span>${mat.name || mat.materialCode} (${mat.required || mat.quantity || 'N/A'})</span>
                    <span class="badge bg-${statusClass.split('-')[1] || 'secondary'} rounded-pill">${statusText} (${mat.available || mat.reserved || 0})</span>
                </li>`;
        });
        materialHtml += '</ul>';
    } else {
         materialHtml = '<p class="text-muted">Bu sipariş için malzeme listesi bulunamadı.</p>';
    }
    materialStatusDiv.innerHTML = materialHtml;

    // Sipariş Notları
    renderOrderNotes(notes, notesListDiv);
}

/**
 * Sipariş notlarını liste olarak render eder.
 * @param {Array<object>} notes Not listesi
 * @param {HTMLElement} targetDiv Notların render edileceği div
 */
function renderOrderNotes(notes, targetDiv) {
    if (!targetDiv) targetDiv = document.querySelector('#order-detail-modal #order-notes-list');
    if (!targetDiv) return;

    if (!notes || notes.length === 0) {
        targetDiv.innerHTML = '<p class="text-muted">Henüz not eklenmemiş.</p>';
        return;
    }

    let notesHtml = '<ul class="list-unstyled">';
    // Notları tarihe göre sondan başa sırala
    notes.sort((a, b) => new Date(b.date) - new Date(a.date)); 
    notes.forEach(note => {
        const noteDate = note.date ? new Date(note.date).toLocaleString('tr-TR') : 'Bilinmiyor';
        notesHtml += `
            <li class="mb-2 border-bottom pb-2">
                <small class="text-muted">${note.user || 'Sistem'} - ${noteDate}</small><br>
                <span>${note.text}</span>
            </li>
        `;
    });
    notesHtml += '</ul>';
    targetDiv.innerHTML = notesHtml;
}

/**
 * Belirli bir sipariş için notları yükler (Demo: Local Storage).
 * @param {string} orderId
 * @returns {Array<object>} Not listesi
 */
function loadOrderNotes(orderId) {
    try {
        const allNotes = JSON.parse(localStorage.getItem('orderNotes') || '{}');
        return allNotes[orderId] || [];
    } catch (e) {
        console.error("Notlar local storage'dan okunamadı:", e);
        return [];
    }
}

/**
 * Siparişe yeni not ekler (Demo: Local Storage).
 * @param {string} orderId
 */
function addOrderNote(orderId) {
    const newNoteTextarea = document.querySelector('#order-detail-modal #new-order-note');
    const noteText = newNoteTextarea?.value.trim();

    if (!noteText) {
        showToast("Lütfen bir not girin.", "warning");
        return;
    }

    const newNote = {
        text: noteText,
        user: "Mevcut Kullanıcı", // TODO: Gerçek kullanıcı adını al
        date: new Date().toISOString()
    };

    try {
        const allNotes = JSON.parse(localStorage.getItem('orderNotes') || '{}');
        if (!allNotes[orderId]) {
            allNotes[orderId] = [];
        }
        allNotes[orderId].push(newNote);
        localStorage.setItem('orderNotes', JSON.stringify(allNotes));

        // Not listesini güncelle
        renderOrderNotes(allNotes[orderId]);
        newNoteTextarea.value = ''; // Textarea'yı temizle
        showToast("Not başarıyla eklendi.", "success");

        // TODO: İlgili sipariş kartındaki not göstergesini güncellemek gerekebilir.

    } catch (e) {
        console.error("Not kaydedilirken hata:", e);
        showToast("Not kaydedilemedi.", "error");
    }
}

/**
 * Mevcut bir siparişi günceller.
 * @param {string} orderId Güncellenecek siparişin ID'si
 */
async function updateOrder(orderId) {
    console.log(`Sipariş güncelleniyor: ${orderId}`);
    const modalElement = document.getElementById('order-detail-modal');
    const fieldset = modalElement.querySelector('#order-edit-fieldset');
    const editBtn = modalElement.querySelector('#edit-order-btn');
    const saveBtn = modalElement.querySelector('#save-order-btn');
    
    showLoadingIndicator('save-order-btn'); // Kaydet butonu üzerinde göster
    saveBtn.disabled = true; // Kaydet butonunu devre dışı bırak
    fieldset.disabled = true; // Kayıt sırasında fieldset'i tekrar devre dışı bırak

    let originalOrderData = null; // Orijinal veriyi tutmak için

    try {
        // *** Adım 0: Orijinal sipariş verisini al (karşılaştırma için) ***
        if (window.ERPService && typeof window.ERPService.getOrderById === 'function') {
            originalOrderData = await window.ERPService.getOrderById(orderId);
        } else {
            console.warn("Orijinal sipariş verisi alınamadı (ERPService.getOrderById eksik), malzeme listesi güncellenemeyebilir.");
            // Alternatif: LocalStorage'dan veya başka bir önbellekten almayı deneyebiliriz
        }

        // 1. Modal'daki formdan güncellenmiş sipariş verilerini al
        const updatedData = {
            orderDate: document.getElementById('order-orderDate')?.value,
            deliveryDate: document.getElementById('order-deliveryDate')?.value,
            status: document.getElementById('order-status')?.value,
            cellType: document.getElementById('order-cellType')?.value,
            quantity: parseInt(document.getElementById('order-quantity')?.value || '0'),
            relayType: document.getElementById('order-relayType')?.value,
            description: document.getElementById('order-description')?.value,
            updatedAt: new Date()
        };
        
        // Gerekli alan kontrolleri yapılabilir
        if (!updatedData.deliveryDate || !updatedData.status || !updatedData.cellType || updatedData.quantity <= 0) {
             showToast("Lütfen Teslim Tarihi, Durum, Hücre Tipi ve Adet alanlarını doğru doldurun.", "warning");
             throw new Error("Form validation failed");
        }
        
        // Tarihleri Date nesnesine çevir (Firebase için)
        if (updatedData.orderDate) updatedData.orderDate = new Date(updatedData.orderDate);
        if (updatedData.deliveryDate) updatedData.deliveryDate = new Date(updatedData.deliveryDate);

        // 2. Güncellenmiş verilere göre yeni malzeme listesini al/tahmin et
        let newMaterials = []; 
        const quantityFieldName = originalOrderData?.quantity !== undefined ? 'quantity' : 'cellCount'; // Eski verideki adet alanı adı
        const typeChanged = originalOrderData && updatedData.cellType !== originalOrderData.cellType;
        const quantityChanged = originalOrderData && updatedData.quantity !== originalOrderData[quantityFieldName];

        if ((typeChanged || quantityChanged) && window.AIService && typeof window.AIService.predictMaterials === 'function') {
            console.log("Hücre tipi veya adet değişti, AI ile yeni malzeme listesi tahmin ediliyor...");
            try {
                 // AI servisine gönderilecek parametreler
                 const predictionParams = {
                     cellType: updatedData.cellType,
                     quantity: updatedData.quantity,
                     // Orijinal siparişteki diğer bilgiler (varsa)
                     voltage: originalOrderData?.voltage,
                     current: originalOrderData?.current,
                     customer: originalOrderData?.customer
                 };
                 const prediction = await window.AIService.predictMaterials(predictionParams);
                 newMaterials = prediction.materials || [];
                 if (newMaterials.length > 0) {
                     console.log("AI malzeme tahmini başarılı.", newMaterials);
                 } else {
                     console.warn("AI malzeme tahmini sonuç döndürmedi.");
                 }
            } catch (aiError) {
                console.error("AI malzeme tahmini sırasında hata:", aiError);
                 showToast("Malzeme listesi AI ile tahmin edilirken hata oluştu, manuel kontrol gerekebilir.", "warning", 6000);
                 // Hata olsa bile devam et, belki eski liste vardır?
                 if (originalOrderData && originalOrderData.materials) {
                    newMaterials = originalOrderData.materials;
                 }
            }
        } else if (originalOrderData && originalOrderData.materials) {
            // Tip/adet değişmedi veya AI yoksa, eski malzeme listesini kullan (varsa)
             console.log("Hücre tipi/adet değişmedi veya AI kullanılamıyor, mevcut malzeme listesi kullanılıyor (varsa).");
             newMaterials = originalOrderData.materials;
        } else {
            console.warn("Güncelleme için yeni malzeme listesi belirlenemedi.");
        }
        
        // Malzeme listesini updatedData'ya ekleyelim (kayıt için)
        if (newMaterials.length > 0) {
            updatedData.materials = newMaterials; // Veritabanına kaydetmek için
        }

        // 3. Eski rezervasyonu iptal et
        if (window.ERPService && typeof window.ERPService.cancelReservation === 'function') {
            console.log(`Eski rezervasyon iptal ediliyor: ${orderId}`);
            const cancelResult = await window.ERPService.cancelReservation(orderId);
             if (!cancelResult.success) {
                console.warn("Eski rezervasyon iptal edilemedi:", cancelResult.error);
            }
        }

        // 4. Yeni malzemeler için rezervasyon yap (eğer malzeme listesi varsa)
        let reservationResult = { success: true };
        if (window.ERPService && typeof window.ERPService.reserveMaterialsForOrder === 'function' && newMaterials && newMaterials.length > 0) {
            console.log(`Yeni malzemeler rezerve ediliyor: ${orderId}`);
            reservationResult = await window.ERPService.reserveMaterialsForOrder(orderId, newMaterials);
            if (!reservationResult.success) {
                showToast(`Malzeme rezervasyonu başarısız oldu: ${reservationResult.error || reservationResult.errors?.join(', ')}`, "warning", 8000);
            }
        }

        // 5. Güncellenmiş sipariş verisini Firebase/LocalStorage'a kaydet
        if (window.AppConfig?.firebase?.enabled && window.firebase?.firestore) {
            await window.firebase.firestore().collection('orders').doc(orderId).update(updatedData);
            console.log("Sipariş Firebase'e güncellendi.");
        } else {
            // LocalStorage güncelleme mantığı
            try {
                const localOrders = JSON.parse(localStorage.getItem('demoOrders') || '[]');
                const orderIndex = localOrders.findIndex(o => o.id === orderId);
                if (orderIndex > -1) {
                    const existingOrder = localOrders[orderIndex];
                    localOrders[orderIndex] = { ...existingOrder, ...updatedData, id: orderId }; 
                    localStorage.setItem('demoOrders', JSON.stringify(localOrders));
                    console.log("Sipariş Local Storage'a güncellendi.");
                } else {
                    console.warn("LocalStorage'da güncellenecek sipariş bulunamadı.");
                }
            } catch(lsError) {
                console.error("LocalStorage sipariş güncelleme hatası:", lsError);
                 throw new Error("Sipariş Local Storage'a kaydedilemedi.");
            }
        }

        // 6. Başarı bildirimi ve UI güncelleme
        showToast("Sipariş başarıyla güncellendi.", "success");
        loadOrders(); 

        // 7. Modal penceresini kapat
        const orderDetailModal = bootstrap.Modal.getInstance(modalElement);
        if (orderDetailModal) orderDetailModal.hide();

    } catch (error) {
        console.error("Sipariş güncellenirken hata:", error);
        // Fieldset'i tekrar etkinleştir ki kullanıcı tekrar deneyebilsin
        fieldset.disabled = false; 
        showToast(`Sipariş güncellenemedi: ${error.message}`, "error");
    } finally {
        hideLoadingIndicator('save-order-btn'); // Yükleme göstergesini gizle
        saveBtn.disabled = false; // Kaydet butonunu tekrar etkinleştir
        // 'hidden.bs.modal' event'i butonları ve fieldset'i son haline getirecek (modal kapanırsa)
        // Eğer modal kapanmazsa (örn. hata sonrası), butonları manuel ayarlamak gerekebilir:
        if (!bootstrap.Modal.getInstance(modalElement)?._isShown) {
             editBtn.classList.remove('d-none');
             saveBtn.classList.add('d-none');
             fieldset.disabled = true;
        }
    }
}

/**
 * Siparişleri filtreler.
 * TODO: Filtreleme mantığını uygula.
 * @param {Array<object>} orders Filtrelenecek siparişler dizisi
 * @returns {Array<object>} Filtrelenmiş siparişler dizisi
 */
function applyOrderFilters(orders) {
    const searchTerm = document.querySelector('#orders-page .search-input')?.value.toLowerCase() || '';
    const statusFilter = document.querySelector('#orders-page select:nth-of-type(1)')?.value || '';
    const typeFilter = document.querySelector('#orders-page select:nth-of-type(2)')?.value || '';
    const startDate = document.querySelector('#orders-page input[type="date"]:nth-of-type(1)')?.value || '';
    const endDate = document.querySelector('#orders-page input[type="date"]:nth-of-type(2)')?.value || '';

    if (!searchTerm && !statusFilter && !typeFilter && !startDate && !endDate) {
        return orders; // Filtre yoksa tümünü dön
    }

    return orders.filter(order => {
        const orderDate = order.orderDate;
        
        const matchesSearch = !searchTerm || 
                              order.orderNo?.toLowerCase().includes(searchTerm) ||
                              order.customer?.toLowerCase().includes(searchTerm) ||
                              order.cellType?.toLowerCase().includes(searchTerm);
                              
        const matchesStatus = !statusFilter || order.status === statusFilter;
        const matchesType = !typeFilter || order.cellType === typeFilter;
        
        const matchesStartDate = !startDate || (orderDate && orderDate >= new Date(startDate));
        const matchesEndDate = !endDate || (orderDate && orderDate <= new Date(endDate));

        return matchesSearch && matchesStatus && matchesType && matchesStartDate && matchesEndDate;
    });
}

/**
 * Filtreleme elemanları değiştiğinde sipariş listesini yeniden render eder.
 */
function handleFilterChange() {
    // loadOrders tekrar çağrılarak hem veri çekilir hem de filtre uygulanmış liste render edilir.
    // Daha verimli olması için sadece renderOrderList(mevcutOrders) çağrılabilir 
    // ama veri kaynağını (Firebase/LocalStorage) tekrar kontrol etmek için loadOrders daha garanti.
    loadOrders(); 
}

// --- Yardımcı Fonksiyonlar (Status, Priority, Progress, Notification) ---

function getStatusInfo(status) {
    let statusClass = 'bg-secondary';
    let statusText = 'Bilinmiyor';
    switch (status) {
        case 'planning': statusClass = 'status-planned'; statusText = 'Planlama'; break;
        case 'confirmed': statusClass = 'bg-info text-dark'; statusText = 'Onaylandı'; break;
        case 'waiting': statusClass = 'status-in-progress'; statusText = 'Malzeme Bekliyor'; break;
        case 'production': statusClass = 'status-in-progress'; statusText = 'Üretimde'; break;
        case 'delayed': statusClass = 'status-delayed'; statusText = 'Gecikmiş'; break;
        case 'ready': statusClass = 'bg-primary'; statusText = 'Sevke Hazır'; break;
        case 'completed': statusClass = 'status-completed'; statusText = 'Tamamlandı'; break;
        default: statusText = status ? capitalizeFirstLetter(status) : 'Bilinmiyor';
    }
    return { statusClass, statusText };
}

function getPriorityClass(order) {
    // Öncelik belirleme mantığı
    if (order.status === 'delayed') return 'priority-high';
    const today = new Date();
    const deliveryDate = order.deliveryDate;
    if (deliveryDate) {
         const timeDiff = deliveryDate.getTime() - today.getTime();
         const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
         if (daysDiff <= 7 && order.status !== 'completed') return 'priority-medium'; // 1 hafta veya daha az kaldıysa
    }
    if (order.hasMaterialIssue) return 'priority-medium';
    return ''; // Düşük öncelik için özel sınıf yok
}

function calculateOrderProgress(order) {
    // Basit ilerleme hesaplama (demo)
    switch (order.status) {
        case 'planning': return 10;
        case 'confirmed': return 20;
        case 'waiting': return 30;
        case 'production': return order.progress || 60; // Üretimdeki ilerleme daha detaylı olabilir
        case 'delayed': return order.progress || 50;
        case 'ready': return 95;
        case 'completed': return 100;
        default: return 0;
    }
}

function getProgressBarClass(progress) {
    if (progress < 30) return 'bg-danger';
    if (progress < 70) return 'bg-warning';
    return 'bg-success';
}

function getNotificationInfo(order) {
    // Bu bilgiler normalde sipariş verisiyle birlikte gelmeli (örn. okunmamış not sayısı)
    const hasCriticalWarning = order.hasWarning || order.hasMaterialIssue; // Kritik durum var mı?
    const hasNormalNote = order.notes && order.notes.length > 0; // Not var mı?
    
    let notificationClass = '';
    let notificationTitle = '';
    let notificationCount = 0; // Okunmamış sayısı?

    if (hasCriticalWarning) {
        notificationClass = 'bi-exclamation-triangle-fill text-danger';
        notificationTitle = 'Acil Uyarı Var';
        notificationCount = 1; // Şimdilik 1 varsayalım
    } else if (hasNormalNote) {
         notificationClass = 'bi-chat-dots-fill text-warning';
         notificationTitle = 'Yeni Not Var';
         // notificationCount = order.notes.filter(n => !n.isRead).length;
    }

    return {
        hasNotification: hasCriticalWarning || hasNormalNote,
        notificationClass,
        notificationTitle,
        notificationCount
    };
}

/**
 * Helper fonksiyon: String'in ilk harfini büyük yapar
 * @param {string} string 
 * @returns {string}
 */
function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Olay Dinleyicileri (Sayfa yüklendiğinde filtreleri bağlamak için)
document.addEventListener('DOMContentLoaded', () => {
    const orderPage = document.getElementById('orders-page');
    if (orderPage) {
        const searchInput = orderPage.querySelector('.search-input');
        const selects = orderPage.querySelectorAll('.filter-item select');
        const dateInputs = orderPage.querySelectorAll('.filter-item input[type="date"]');
        const filterButton = orderPage.querySelector('.filter-item button');

        if (searchInput) {
            searchInput.addEventListener('keyup', (event) => {
                if (event.key === 'Enter') {
                    handleFilterChange();
                }
            });
        }
        selects.forEach(select => select.addEventListener('change', handleFilterChange));
        dateInputs.forEach(input => input.addEventListener('change', handleFilterChange));
        if (filterButton) { // Explicit filter button click
            filterButton.addEventListener('click', handleFilterChange);
        }
    }
});

// Fonksiyonları globale ekle
if (window && !window.showOrderDetails) {
    window.showOrderDetails = showOrderDetails;
}

console.log("Orders module loaded and updated.");

// Helper: Status'a göre CSS sınıfı döndürür
function getStatusClass(status) {
    switch (status) {
        case 'planning': return 'bg-secondary';
        case 'production': return 'bg-warning text-dark';
        case 'waiting': return 'bg-info text-dark';
        case 'delayed': return 'bg-danger';
        case 'completed': return 'bg-success';
        default: return 'bg-light text-dark';
    }
}

// showToast fonksiyonu globalde olmalı (utils/ui.js) - ui.js'de tanımlandı