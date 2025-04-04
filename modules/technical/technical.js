/**
 * technical.js
 * Teknik Doküman Yönetimi ve Teknik Sorgulama İşlevleri
 */

// Global state for technical page
let technicalData = {
    documents: [],
    searchResults: [],
    currentQuery: '',
    aiResponse: ''
};

/**
 * Teknik dokümanları yükler (Demo).
 */
async function loadTechnicalDocuments() {
    console.log("Teknik dokümanlar yükleniyor...");
    showLoadingIndicator('technical-docs');

    try {
        // TODO: Backend API'den veya Firebase Storage'dan doküman listesini çek.
        // const response = await fetch('/api/documents');
        // technicalData.documents = await response.json();

        // --- Demo Veri ---
        await new Promise(resolve => setTimeout(resolve, 300)); // Yapay gecikme
        technicalData.documents = [
            { id: 'doc1', name: 'RM 36 CB Teknik Çizim', revision: '2.1', date: '15.10.2024', author: 'Ahmet Yılmaz', department: 'Elektrik Tasarım', url: '#doc1' },
            { id: 'doc2', name: 'RM 36 LB Montaj Talimatı', revision: '1.3', date: '10.10.2024', author: 'Mehmet Demir', department: 'Mekanik Tasarım', url: '#doc2' },
            { id: 'doc3', name: 'RM 36 FL Test Prosedürü', revision: '3.0', date: '05.10.2024', author: 'Ayşe Kaya', department: 'Test Birimi', url: '#doc3' },
            { id: 'doc4', name: 'RMU Kablaj Şeması', revision: '1.5', date: '01.10.2024', author: 'Fatma Şahin', department: 'Kablaj Birimi', url: '#doc4' },
            { id: 'doc5', name: 'Genel Montaj Akış Şeması', revision: '1.0', date: '25.09.2024', author: 'Ali Veli', department: 'Üretim', url: '#doc5' }
        ];
        technicalData.searchResults = technicalData.documents; // Başlangıçta tümü
        // --- Bitiş: Demo Veri ---

        renderDocumentList(technicalData.searchResults);

    } catch (error) {
        console.error("Teknik dokümanlar yüklenirken hata:", error);
        showErrorIndicator('technical-docs', `Dokümanlar yüklenemedi: ${error.message}`);
    } finally {
        hideLoadingIndicator('technical-docs');
    }
}

/**
 * Teknik doküman listesini arayüzde render eder.
 * @param {Array<object>} documents Gösterilecek dokümanlar
 */
function renderDocumentList(documents) {
    const listGroup = document.querySelector('#technical .list-group');
    if (!listGroup) return;

    listGroup.innerHTML = ''; // Listeyi temizle

    if (!documents || documents.length === 0) {
        listGroup.innerHTML = '<li class="list-group-item text-muted">Doküman bulunamadı.</li>';
        return;
    }

    let html = '';
    documents.forEach(doc => {
        html += `
            <a href="${doc.url || '#'}" class="list-group-item list-group-item-action" target="_blank" rel="noopener noreferrer">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${doc.name}</h6>
                    <small class="text-muted">${doc.date || '-'}</small>
                </div>
                <p class="mb-1">Rev. ${doc.revision || '-'} - Son güncelleme: ${doc.author || '-'}</p>
                <small class="text-muted">${doc.department || '-'}</small>
            </a>
        `;
    });
    listGroup.innerHTML = html;
}

/**
 * Doküman arama işlemini gerçekleştirir.
 */
function searchDocuments() {
    const searchInput = document.querySelector('#technical .input-group input');
    if (!searchInput) return;
    const searchTerm = searchInput.value.toLowerCase().trim();

    if (!searchTerm) {
        technicalData.searchResults = technicalData.documents; // Boşsa tümünü göster
    } else {
        technicalData.searchResults = technicalData.documents.filter(doc =>
            doc.name.toLowerCase().includes(searchTerm) ||
            doc.department.toLowerCase().includes(searchTerm) ||
            doc.author.toLowerCase().includes(searchTerm)
        );
    }
    renderDocumentList(technicalData.searchResults);
}

/**
 * Yeni doküman yükleme modalını açar.
 */
function openUploadDocumentModal() {
    console.log("Doküman yükleme modalı açılıyor...");
    const modalElement = document.getElementById('uploadDocumentModal');
    if (!modalElement) {
        console.error("Doküman yükleme modalı bulunamadı!");
        showToast("Yükleme ekranı açılamıyor.", "error");
        return;
    }

    // Formu sıfırla
    const form = modalElement.querySelector('#upload-document-form');
    form.reset();
    const messageDiv = modalElement.querySelector('#upload-message');
    messageDiv.classList.add('d-none');
    messageDiv.textContent = '';
    messageDiv.className = 'alert d-none'; // Sınıfları sıfırla

    // Modal instance'ını al veya oluştur ve göster
    const uploadModal = bootstrap.Modal.getOrCreateInstance(modalElement);
    uploadModal.show();

    // Yükleme butonu için olay dinleyici (submit olayını dinle)
    const uploadBtn = modalElement.querySelector('#upload-doc-btn');
    // Form submit'i dinlemek daha doğru
     form.removeEventListener('submit', handleDocumentUpload);
    form.addEventListener('submit', handleDocumentUpload);
}

/**
 * Doküman yükleme formunun submit olayını yönetir (Demo).
 * @param {Event} event
 */
async function handleDocumentUpload(event) {
    event.preventDefault(); // Formun varsayılan submit'ini engelle
    const form = event.target;
    const modalElement = form.closest('.modal');
    const messageDiv = modalElement.querySelector('#upload-message');
    const uploadBtn = modalElement.querySelector('#upload-doc-btn');

    const fileInput = form.querySelector('#docFile');
    const docName = form.querySelector('#docName').value.trim();
    const docRevision = form.querySelector('#docRevision').value.trim();
    const docDepartment = form.querySelector('#docDepartment').value;

    if (!fileInput.files || fileInput.files.length === 0) {
        messageDiv.textContent = "Lütfen bir doküman dosyası seçin.";
        messageDiv.className = 'alert alert-warning'; // Classları temizleyip ekle
        messageDiv.classList.remove('d-none');
        return;
    }
    if (!docName) {
         messageDiv.textContent = "Lütfen doküman adını girin.";
         messageDiv.className = 'alert alert-warning';
         messageDiv.classList.remove('d-none');
         return;
    }

    const file = fileInput.files[0];
    console.log("Doküman yükleniyor:", { name: docName, revision: docRevision, department: docDepartment, file: file.name, size: file.size });

    messageDiv.textContent = "Doküman yükleniyor...";
    messageDiv.className = 'alert alert-info';
    messageDiv.classList.remove('d-none');
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Yükleniyor...';

    // TODO: Gerçek yükleme işlemi (örn: Firebase Storage)
    // try {
    //     const storageRef = firebase.storage().ref();
    //     const fileRef = storageRef.child(`technical_docs/${Date.now()}_${file.name}`);
    //     const snapshot = await fileRef.put(file);
    //     const downloadURL = await snapshot.ref.getDownloadURL();
    //     console.log('Dosya yüklendi:', downloadURL);
    //
    //     // Firestore'a doküman bilgisini kaydet
    //     await firebase.firestore().collection('documents').add({
    //         name: docName,
    //         revision: docRevision || '1.0',
    //         department: docDepartment || 'Genel',
    //         url: downloadURL,
    //         fileName: file.name,
    //         size: file.size,
    //         uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
    //         author: "Mevcut Kullanıcı" // Gerçek kullanıcı adı
    //     });
    //
    //     messageDiv.textContent = "Doküman başarıyla yüklendi!";
    //     messageDiv.className = 'alert alert-success';
    //     await loadTechnicalDocuments(); // Listeyi yenile
    //     // Modalı kapat
    //     setTimeout(() => {
    //          const uploadModal = bootstrap.Modal.getInstance(modalElement);
    //          uploadModal.hide();
    //      }, 1500);
    // } catch (error) {
    //      console.error("Doküman yükleme hatası:", error);
    //      messageDiv.textContent = `Yükleme başarısız oldu: ${error.message}`;
    //      messageDiv.className = 'alert alert-danger';
    // }

    // --- Demo Yükleme ---
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newDoc = {
         id: `doc${Date.now()}`,
         name: docName,
         revision: docRevision || '1.0',
         date: new Date().toLocaleDateString('tr-TR'),
         author: 'Mevcut Kullanıcı',
         department: docDepartment || 'Genel',
         url: '#new-doc'
     };
     technicalData.documents.unshift(newDoc); // Yeni dokümanı başa ekle
     renderDocumentList(technicalData.documents); // Listeyi yenile
     messageDiv.textContent = "Doküman başarıyla yüklendi (Demo).";
     messageDiv.className = 'alert alert-success';
     setTimeout(() => {
         const uploadModal = bootstrap.Modal.getInstance(modalElement);
         uploadModal.hide();
     }, 1500);
     // --- Bitiş: Demo Yükleme ---

     // finally {
         uploadBtn.disabled = false;
         uploadBtn.innerHTML = 'Yükle';
     // }
}

/**
 * Teknik sorguyu yapay zekaya gönderir ve cevabı gösterir (Demo).
 * @param {string} query Kullanıcının sorusu
 */
async function submitTechnicalQuery() {
    const queryInput = document.getElementById('technicalQuestion');
    const query = queryInput?.value.trim();
    const responseArea = document.querySelector('#technical .alert'); // Cevap alanı
    const responseText = responseArea?.querySelector('p:not(.mb-0)'); // Cevap metni
    const relatedDocsList = document.querySelector('#technical .mt-3 ul'); // İlgili doküman listesi

    if (!query || !responseArea || !responseText || !relatedDocsList) {
        console.error("Sorgu elemanları bulunamadı.");
        return;
    }

    console.log("Teknik sorgu gönderiliyor:", query);
    technicalData.currentQuery = query;
    technicalData.aiResponse = ''; // Önceki cevabı temizle

    // Yükleniyor durumunu göster
    responseArea.classList.remove('alert-info', 'alert-danger');
    responseArea.classList.add('alert-warning');
    responseArea.querySelector('h6').innerHTML = '<i class="bi bi-hourglass-split"></i> Yapay Zeka Düşünüyor...';
    responseText.textContent = 'Lütfen bekleyin...';
    relatedDocsList.innerHTML = ''; // İlgili dokümanları temizle

    try {
        // TODO: Gerçek AIService çağrısı yapılmalı.
        // const aiResult = await AIService.getTechnicalAnswer(query, technicalData.documents);
        // technicalData.aiResponse = aiResult.answer;
        // const relatedDocs = aiResult.relatedDocuments; // ['doc1', 'doc4'] gibi ID'ler

        // --- Demo Cevap ---
        await new Promise(resolve => setTimeout(resolve, 1500)); // Yapay gecikme
        let demoResponse = "Bu sorgu için demo cevap üretilemedi.";
        let demoRelated = [];
        if (query.toLowerCase().includes('akım trafosu')) {
            demoResponse = "RM 36 CB hücresinde genellikle 200-400/5-5A 5P20 7,5/15VA veya 300-600/5-5A 5P20 7,5/15VA özelliklerinde toroidal tip akım trafoları kullanılmaktadır. Canias kodları: 144866% (KAP-80/190-95) veya 142227% (KAT-85/190-95).";
            demoRelated = ['doc1', 'doc4']; // Örnek ilgili doküman ID'leri
        } else if (query.toLowerCase().includes('montaj')) {
            demoResponse = "RM 36 LB hücresinin montajı için özel talimatlar bulunmaktadır. Lütfen ilgili dokümanı inceleyiniz.";
            demoRelated = ['doc2'];
        }
        technicalData.aiResponse = demoResponse;
        // --- Bitiş: Demo Cevap ---

        // Cevabı göster
        responseArea.classList.remove('alert-warning');
        responseArea.classList.add('alert-info');
        responseArea.querySelector('h6').innerHTML = '<i class="bi bi-lightbulb"></i> Yapay Zeka Cevabı:';
        responseText.textContent = technicalData.aiResponse;

        // İlgili dokümanları listele
        let relatedHtml = '';
        demoRelated.forEach(docId => {
            const doc = technicalData.documents.find(d => d.id === docId);
            if (doc) {
                 relatedHtml += `<li><a href="${doc.url || '#'}" target="_blank" rel="noopener noreferrer">${doc.name}</a> - Rev.${doc.revision || '-'}</li>`;
            }
        });
        relatedDocsList.innerHTML = relatedHtml || '<li>İlgili doküman bulunamadı.</li>';

    } catch (error) {
        console.error("Teknik sorgu hatası:", error);
        responseArea.classList.remove('alert-warning');
        responseArea.classList.add('alert-danger');
        responseArea.querySelector('h6').innerHTML = '<i class="bi bi-exclamation-triangle"></i> Hata!';
        responseText.textContent = `Yapay zeka sorgusu sırasında bir hata oluştu: ${error.message}`;
        relatedDocsList.innerHTML = '';
    } finally {
        queryInput.value = ''; // Sorgu alanını temizle (isteğe bağlı)
    }
}

/**
 * Teknik Dokümanlar sayfası için olay dinleyicilerini ve başlangıç yüklemelerini ayarlar.
 */
function initializeTechnicalPage() {
    console.log("Teknik Dokümanlar sayfası başlatılıyor...");

    // Arama Butonu ve Input Enter
    const searchButton = document.querySelector('#technical .input-group button');
    const searchInput = document.querySelector('#technical .input-group input');
    if (searchButton) {
        searchButton.addEventListener('click', searchDocuments);
    }
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                searchDocuments();
            }
        });
    }

    // Doküman Yükle Butonu
    const uploadButton = document.querySelector('#technical .card-header button');
    if (uploadButton && uploadButton.dataset.bsTarget === '#uploadDocumentModal') {
        // Buton zaten modalı hedefliyor, ancak JS ile açmak için listener ekleyebiliriz (opsiyonel)
         uploadButton.addEventListener('click', (e) => {
             // e.preventDefault(); // Eğer modal data-bs-target ile açılıyorsa buna gerek yok
             openUploadDocumentModal();
         });
    }

    // Teknik Sorgu Butonu
    const queryButton = document.querySelector('#technical .card-body button.btn-primary'); // Daha spesifik seçici
    if (queryButton && queryButton.textContent.trim() === 'Sorgula') { // Butonu metinden tanıyalım
        queryButton.addEventListener('click', submitTechnicalQuery);
    }

    // Sayfa ilk yüklendiğinde dokümanları çek
    loadTechnicalDocuments();
}

// Helper fonksiyonlar (reporting.js'den alınabilir veya main.js'e taşınabilir) - ui.js'ye taşındı
/*
function showLoadingIndicator(sectionId) { ... }
function hideLoadingIndicator(sectionId) { ... }
function showErrorIndicator(sectionId, message) { ... }
*/

// showToast için global bir fonksiyon bekleniyor - ui.js'de tanımlandı
/*
if (typeof showToast !== 'function') { ... }
*/

// Teknik Dokümanlar sekmesi aktif olduğunda başlatıcıyı çağır
document.addEventListener('pageChanged', (e) => {
    if (e.detail && e.detail.page === 'technical') {
        initializeTechnicalPage();
    }
});

// Fonksiyonları globale ekle (Gerekiyorsa)
if (window) {
    window.loadTechnicalDocuments = loadTechnicalDocuments;
    window.searchDocuments = searchDocuments;
    window.submitTechnicalQuery = submitTechnicalQuery;
    window.openUploadDocumentModal = openUploadDocumentModal;
}

console.log("Technical module created and initialized."); 