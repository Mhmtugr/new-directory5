/**
 * production.js
 * Üretim Takibi, İş Emri Yönetimi ve Operatör İşlemleri
 */

// Global state for production page
let productionData = {
    jobs: [], // Üretimdeki iş emirleri/operasyonlar
    unitStats: {}, // Birim bazlı istatistikler
    loaded: false
};

// Üretim birimleri (planning.js'deki ile aynı olabilir, merkezi bir yerden alınmalı)
const productionUnits = [
    { id: 'elektrik_tasarim', name: 'Elektrik Tasarım' },
    { id: 'mekanik_tasarim', name: 'Mekanik Tasarım' },
    { id: 'satin_alma', name: 'Satın Alma' }, // Satın alma bir üretim birimi mi? Gözden geçirilebilir.
    { id: 'mekanik_uretim', name: 'Mekanik Üretim' },
    { id: 'ic_montaj', name: 'İç Montaj' },
    { id: 'kablaj', name: 'Kablaj' },
    { id: 'genel_montaj', name: 'Genel Montaj' },
    { id: 'test', name: 'Test' }
];

/**
 * Üretim takip verilerini yükler (Demo).
 */
async function loadProductionData() {
    console.log("Üretim takip verileri yükleniyor...");
    if (productionData.loaded) {
        console.log("Üretim verileri zaten yüklü.");
        updateUnitStatsCards(); // Kartları tekrar güncelle
        renderProductionJobList(productionData.jobs); // İş listesini tekrar render et
        return;
    }

    showLoadingIndicator('production');

    try {
        // TODO: Gerçek uygulamada API'den üretimdeki iş emirlerini/operasyonları çek.
        // const response = await fetch('/api/production/jobs?status=active,pending');
        // productionData.jobs = await response.json();

        // --- Demo Veri Üretimi ---
        await new Promise(resolve => setTimeout(resolve, 400)); // Yapay gecikme
        // ERPService'den siparişleri alıp bunları işlere dönüştürelim (basitçe)
        let orders = [];
        if (window.ERPService && typeof window.ERPService.getOrders === 'function') {
            // Sadece demo siparişleri alalım veya mevcut siparişleri
             orders = await window.ERPService.getOrders(false); // Cache'den almayı dene
             if (!orders || orders.length === 0) {
                 orders = await window.ERPService.getDemoOrderData(); // Cache boşsa demo'yu al
             }
        } else {
            console.warn("ERPService.getOrders bulunamadı, boş üretim listesi.");
        }

        // Siparişleri basit işlere dönüştür (her sipariş için birkaç adım varsayalım)
        productionData.jobs = [];
        orders.forEach((order, index) => {
            // Sadece belirli durumlardaki siparişleri işleme al (örnek)
            if (order.status && ['planning', 'production', 'waiting', 'delayed'].includes(order.status)) {
                // Örnek adımlar ve durumları
                 const steps = [
                    { step: 'Tasarım Onayı', unitId: 'elektrik_tasarim', status: order.status === 'planning' ? 'pending' : 'completed' },
                    { step: 'Mekanik Hazırlık', unitId: 'mekanik_uretim', status: order.status === 'production' ? (index % 3 === 0 ? 'active' : 'pending') : (order.status === 'planning' ? 'pending' : 'completed') },
                    { step: 'İç Montaj', unitId: 'ic_montaj', status: order.status === 'production' && index % 3 !== 0 ? (index % 2 === 0 ? 'active' : 'pending') : (order.status === 'planning' ? 'pending' : 'completed') },
                    { step: 'Kablaj', unitId: 'kablaj', status: order.status === 'waiting' ? 'active' : (order.status === 'production' || order.status === 'planning' ? 'pending' : 'completed') },
                    { step: 'Genel Montaj', unitId: 'genel_montaj', status: order.status === 'delayed' ? 'active' : (order.status !== 'completed' ? 'pending' : 'completed') },
                    { step: 'Test', unitId: 'test', status: order.status !== 'completed' ? 'pending' : 'completed' }
                ];

                steps.forEach((stepInfo, stepIndex) => {
                   // Rastgele bazı adımları atlayabilir veya durumlarını değiştirebiliriz
                   let currentStatus = stepInfo.status;
                   if (currentStatus === 'completed' && Math.random() > 0.8) currentStatus = 'pending'; // Bazen tamamlanmışı beklemeye al
                   if (currentStatus === 'pending' && Math.random() > 0.9) currentStatus = 'active'; // Bazen bekleyeni aktife al

                   // Sadece tamamlanmamış veya aktif adımları ekleyelim (opsiyonel)
                   if(currentStatus === 'completed' && Math.random() > 0.5) return;

                    productionData.jobs.push({
                        id: `job-${order.id}-${stepIndex}`,
                        orderId: order.id,
                        orderNo: order.orderId || order.id, // Sipariş No
                        cellType: order.cellType,
                        customer: order.customer,
                        step: stepInfo.step,
                        unitId: stepInfo.unitId,
                        status: currentStatus, // pending, active, completed, paused
                        assignedTo: currentStatus === 'active' ? ['Operator A', 'Operator B', 'Operator C'][index % 3] : null, // Rastgele operatör ata
                        startTime: currentStatus === 'active' ? new Date(Date.now() - Math.random() * 2 * 3600000) : null, // Son 2 saat içinde
                        endTime: currentStatus === 'completed' ? new Date() : null,
                    });
                });
            }
        });
        productionData.loaded = true;
        console.log("Demo üretim işleri oluşturuldu:", productionData.jobs);
        // --- Bitiş: Demo Veri ---\

        // Veriler yüklendikten sonra arayüzü güncelle
        calculateAndStoreUnitStats(); // Önce istatistikleri hesapla
        updateUnitStatsCards(); // Sonra kartları güncelle
        renderProductionJobList(productionData.jobs); // İş listesini render et

    } catch (error) {
        console.error("Üretim verileri yüklenirken hata:", error);
        showErrorIndicator('production', `Üretim verileri yüklenemedi: ${error.message}`);
    } finally {
        hideLoadingIndicator('production');
    }
}

/**
 * Mevcut işlere göre birim bazlı istatistikleri hesaplar ve saklar.
 */
function calculateAndStoreUnitStats() {
    productionData.unitStats = {}; // Sıfırla

    productionUnits.forEach(unit => {
        productionData.unitStats[unit.id] = { total: 0, active: 0, completed: 0, pending: 0 };
    });

    productionData.jobs.forEach(job => {
        // Sadece ilgili birime aitse say
        const stats = productionData.unitStats[job.unitId];
        if (stats) {
            // Toplam iş sayısını her adım için saymak yerine,
            // belki sadece o birimdeki aktif/bekleyen işleri saymak daha mantıklı olabilir.
            // Şimdilik her adımı sayıyoruz.
            stats.total++;
            if (job.status === 'active') {
                stats.active++;
            } else if (job.status === 'completed') {
                stats.completed++;
            } else if (job.status === 'pending') {
                 stats.pending++;
            }
        } else {
             console.warn(`İş için bilinmeyen birim ID: ${job.unitId}`);
        }
    });
    console.log("Birim istatistikleri hesaplandı:", productionData.unitStats);
}

/**
 * Hesaplanan birim istatistiklerini arayüzdeki kartlara yansıtır.
 */
function updateUnitStatsCards() {
    const productionPage = document.getElementById('production');
    if (!productionPage) return;

    // index.html'deki birim kartlarının olduğu container'ı daha sağlam seçelim
    const unitCardsContainer = productionPage.querySelector('.card-body > .row'); // Direk card-body altındaki row
    if (!unitCardsContainer) {
        console.error("Üretim sayfasında birim kartları konteyneri bulunamadı.");
        return;
    }

    productionUnits.forEach(unit => {
        const stats = productionData.unitStats[unit.id] || { total: 0, active: 0, completed: 0, pending: 0 };
        // İlgili birimin kartını bul (başlığa göre)
        const cardElement = Array.from(unitCardsContainer.querySelectorAll('.col-md-3 > .card')).find(card => { // Daha spesifik seçici
            const titleElement = card.querySelector('.card-title');
            return titleElement && titleElement.textContent.trim() === unit.name;
        });

        if (cardElement) {
            // İstatistikleri güncelle (Hata kontrolü eklendi)
             const totalEl = cardElement.querySelector('h3:nth-of-type(1)');
             const activeEl = cardElement.querySelector('h3:nth-of-type(2)');
             const completedEl = cardElement.querySelector('h3:nth-of-type(3)');

             if (totalEl) totalEl.textContent = stats.total; else console.warn(`${unit.name} kartında total H3 bulunamadı.`);
             if (activeEl) activeEl.textContent = stats.active; else console.warn(`${unit.name} kartında active H3 bulunamadı.`);
             if (completedEl) completedEl.textContent = stats.completed; else console.warn(`${unit.name} kartında completed H3 bulunamadı.`);


            // Progress bar'ı güncelle (Tamamlanan / Toplam, ama sadece tamamlanmamışları dikkate alarak)
            const progressBar = cardElement.querySelector('.progress-bar');
             if (progressBar) {
                const relevantTotal = stats.active + stats.pending + stats.completed; // Sadece bu birimdeki adımlar
                const progressPercent = relevantTotal > 0 ? (stats.completed / relevantTotal) * 100 : 0;
                progressBar.style.width = `${progressPercent.toFixed(0)}%`;
                progressBar.textContent = `${progressPercent.toFixed(0)}%`; // Yüzdeyi göster

                // Progress bar rengini duruma göre ayarla
                progressBar.classList.remove('bg-success', 'bg-warning', 'bg-danger', 'bg-info', 'bg-secondary');
                if (stats.active > 0) {
                     progressBar.classList.add('bg-warning'); // Devam eden varsa sarı
                } else if (stats.pending > 0) {
                     progressBar.classList.add('bg-info'); // Bekleyen varsa mavi
                } else if (progressPercent === 100 && relevantTotal > 0) {
                    progressBar.classList.add('bg-success'); // Hepsi tamamsa yeşil
                } else {
                     progressBar.classList.add('bg-secondary'); // Diğer durumlar gri (örn. hiç iş yoksa)
                }
             } else {
                  console.warn(`${unit.name} kartında progress bar bulunamadı.`);
             }

        } else {
            console.warn(`Arayüzde ${unit.name} birimi için kart bulunamadı.`);
        }
    });
}

/**
 * Üretimdeki işlerin listesini render eder (Yeni eklenecek bir alana).
 * @param {Array<object>} jobs Gösterilecek işler
 * @param {string|null} filterUnitId Sadece belirli bir birimin işlerini göster (null ise hepsi)
 */
function renderProductionJobList(jobs, filterUnitId = null) {
     // Konteynerı dinamik olarak oluştur veya seç
     let jobListContainer = document.getElementById('production-job-list-container');
     if (!jobListContainer) {
         // Birim kartlarının olduğu bölümün altına ekleyelim
         const unitStatsCard = document.querySelector('#production .card:has(#unitDropdown)'); // Birim istatistik kartını bul
         if (unitStatsCard) {
              jobListContainer = document.createElement('div');
              jobListContainer.id = 'production-job-list-container';
              jobListContainer.classList.add('mt-4', 'card'); // Yeni bir kart içine alalım
              jobListContainer.innerHTML = `
                    <div class="card-header">
                         <h5 class="mb-0">Aktif ve Bekleyen İşler</h5>
                    </div>
                    <div class="card-body" id="production-job-list">
                         <p class="text-muted">Yükleniyor...</p>
                    </div>
              `;
              // Birim kartının altına ekle
              unitStatsCard.parentNode.insertBefore(jobListContainer, unitStatsCard.nextSibling);
              console.log("'production-job-list-container' oluşturuldu.");
         } else {
              console.error("İş listesi konteyneri eklemek için referans kart bulunamadı.");
              return; // Konteyner yoksa çık
         }
     }

     const jobListDiv = jobListContainer.querySelector('#production-job-list');
     if (!jobListDiv) return;

     jobListDiv.innerHTML = ''; // Temizle

     let filteredJobs = jobs;
     if (filterUnitId) {
         filteredJobs = jobs.filter(job => job.unitId === filterUnitId);
     }

     // Sadece aktif ve bekleyenleri alıp sırala
     const activeJobs = filteredJobs
                          .filter(job => job.status === 'active' || job.status === 'pending')
                          .sort((a, b) => {
                              // Aktif olanlar, sonra bekleyenler
                              if (a.status === 'active' && b.status !== 'active') return -1;
                              if (a.status !== 'active' && b.status === 'active') return 1;
                              // Aynı durumdaysa başlangıç zamanına (varsa) veya ID'ye göre sırala
                              if (a.startTime && b.startTime) return a.startTime - b.startTime;
                              return a.id.localeCompare(b.id);
                          });

     if (activeJobs.length === 0) {
         jobListDiv.innerHTML = `<div class="alert alert-light text-center">Bu birimde aktif veya bekleyen iş bulunmuyor.</div>`;
         // Konteyner başlığını da güncelleyebiliriz
          const containerTitle = jobListContainer.querySelector('.card-header h5');
          if (containerTitle) containerTitle.textContent = filterUnitId
                ? `${productionUnits.find(u=>u.id === filterUnitId)?.name || filterUnitId} - Aktif/Bekleyen İş Yok`
                : "Aktif ve Bekleyen İş Yok";
         return;
     }

     // Konteyner başlığını güncelle
     const containerTitle = jobListContainer.querySelector('.card-header h5');
      if (containerTitle) containerTitle.textContent = filterUnitId
                ? `${productionUnits.find(u=>u.id === filterUnitId)?.name || filterUnitId} - Aktif/Bekleyen İşler`
                : "Tüm Aktif ve Bekleyen İşler";


     let html = '<div class="list-group list-group-flush">'; // list-group-flush kenarlıkları kaldırır
     activeJobs.forEach(job => {
         const unitName = productionUnits.find(u => u.id === job.unitId)?.name || job.unitId;
         let statusBadge = '';
         let actionButton = '';
         let assignedUser = job.assignedTo ? `<small class=\"text-muted d-block\">Operatör: ${job.assignedTo}</small>` : '';

         switch(job.status) {
             case 'pending':
                 statusBadge = '<span class="badge bg-secondary">Bekliyor</span>';
                 actionButton = `<button class="btn btn-sm btn-success" onclick="startProductionJob('${job.id}')"><i class="bi bi-play-fill"></i> Başlat</button>`;
                 break;
             case 'active':
                 statusBadge = '<span class="badge bg-warning text-dark">Devam Ediyor</span>';
                 actionButton = `<button class="btn btn-sm btn-primary" onclick="completeProductionJob('${job.id}')"><i class="bi bi-check-lg"></i> Tamamla</button>
                               <button class="btn btn-sm btn-outline-secondary ms-1" onclick="pauseProductionJob('${job.id}')" title="Duraklat"><i class="bi bi-pause-fill"></i></button>`;
                 break;
             default:
                  statusBadge = `<span class="badge bg-light text-dark">${job.status}</span>`;
                  break;
         }

         html += `
            <div class="list-group-item d-flex justify-content-between align-items-center flex-wrap">
                 <div class="me-3 mb-2 mb-md-0">
                     <strong>${job.orderNo || 'Sipariş Yok'} - ${job.step}</strong> (${unitName})<br>
                     <small class="text-muted">Müşteri: ${job.customer || '-'} | Hücre: ${job.cellType || '-'}</small>
                     ${assignedUser}
                 </div>
                 <div class="text-end">
                     ${statusBadge}
                     <div class="mt-1">${actionButton}</div>
                 </div>
             </div>
         `;
     });
     html += '</div>';
     jobListDiv.innerHTML = html;
}

/**
 * Bir üretim işini başlatır (Demo).
 * @param {string} jobId Başlatılacak işin ID'si
 */
async function startProductionJob(jobId) {
    console.log(`İş başlatılıyor: ${jobId}`);
    const index = productionData.jobs.findIndex(j => j.id === jobId);
    if (index > -1 && productionData.jobs[index].status === 'pending') {
        showToast("İş başlatılıyor...", "info");
        // TODO: API'ye istek gönder (operatör bilgisiyle birlikte)
        // const operator = prompt("Lütfen operatör adını girin:"); // Veya login bilgisinden al
        // if (!operator) { showToast("Operatör adı gerekli.", "warning"); return; }
        // await fetch(`/api/production/jobs/${jobId}/start`, { method: 'POST', body: JSON.stringify({ operator: operator }) });

        await new Promise(resolve => setTimeout(resolve, 300)); // Simülasyon

        productionData.jobs[index].status = 'active';
        productionData.jobs[index].startTime = new Date();
        productionData.jobs[index].assignedTo = "Demo Operatör"; // Demo

        calculateAndStoreUnitStats(); // İstatistikleri güncelle
        updateUnitStatsCards(); // Kartları güncelle
        // İş listesini mevcut filtreye göre güncelle
        const currentFilter = document.getElementById('unitDropdown')?.textContent.trim() || "Tüm Birimler";
        const filterUnit = productionUnits.find(u => u.name === currentFilter);
        renderProductionJobList(productionData.jobs, filterUnit ? filterUnit.id : null);

        showToast("İş başarıyla başlatıldı.", "success");
    } else {
        showToast("İş başlatılamadı veya zaten aktif/tamamlanmış.", "warning");
    }
}

/**
 * Bir üretim işini tamamlar (Demo).
 * @param {string} jobId Tamamlanacak işin ID'si
 */
async function completeProductionJob(jobId) {
     console.log(`İş tamamlanıyor: ${jobId}`);
     const index = productionData.jobs.findIndex(j => j.id === jobId);
     if (index > -1 && productionData.jobs[index].status === 'active') {
         showToast("İş tamamlanıyor...", "info");
         // TODO: API'ye istek gönder (belki tamamlanma notu veya süre ile?)
         // await fetch(`/api/production/jobs/${jobId}/complete`, { method: 'POST' });

         await new Promise(resolve => setTimeout(resolve, 400)); // Simülasyon

         productionData.jobs[index].status = 'completed';
         productionData.jobs[index].endTime = new Date();

         calculateAndStoreUnitStats(); // İstatistikleri güncelle
         updateUnitStatsCards(); // Kartları güncelle
         // İş listesini mevcut filtreye göre güncelle
         const currentFilter = document.getElementById('unitDropdown')?.textContent.trim() || "Tüm Birimler";
         const filterUnit = productionUnits.find(u => u.name === currentFilter);
         renderProductionJobList(productionData.jobs, filterUnit ? filterUnit.id : null);

         showToast("İş başarıyla tamamlandı.", "success");

         // TODO: Bir sonraki adıma geçişi tetikle veya sipariş durumunu güncelle (eğer bu son adımsa)
         // checkAndAdvanceOrderStatus(productionData.jobs[index].orderId);
     } else {
         showToast("İş tamamlanamadı veya aktif değil.", "warning");
     }
}

/**
 * Bir üretim işini duraklatır (Demo).
 * @param {string} jobId Duraklatılacak işin ID'si
 */
async function pauseProductionJob(jobId) {
     console.log(`İş duraklatılıyor: ${jobId}`);

     const index = productionData.jobs.findIndex(j => j.id === jobId);
     if (index > -1 && productionData.jobs[index].status === 'active') {
          showToast("İş duraklatılıyor...", "info");
           // TODO: API'ye istek gönder
          // await fetch(`/api/production/jobs/${jobId}/pause`, { method: 'POST' });
         await new Promise(resolve => setTimeout(resolve, 200)); // Simülasyon

         productionData.jobs[index].status = 'paused'; // Durumu 'paused' yapalım
         productionData.jobs[index].assignedTo = null; // Atananı kaldır

         calculateAndStoreUnitStats(); // İstatistikleri güncelle
         updateUnitStatsCards(); // Kartları güncelle
          // İş listesini mevcut filtreye göre güncelle
         const currentFilter = document.getElementById('unitDropdown')?.textContent.trim() || "Tüm Birimler";
         const filterUnit = productionUnits.find(u => u.name === currentFilter);
         renderProductionJobList(productionData.jobs, filterUnit ? filterUnit.id : null); // Paused olanlar listede görünmeyecek

         showToast("İş duraklatıldı.", "success");
     } else {
         showToast("Sadece devam eden işler duraklatılabilir.", "warning");
     }
}

/**
 * Üretim Takip sayfası için olay dinleyicilerini ve başlangıç yüklemelerini ayarlar.
 */
function initializeProductionPage() {
    console.log("Üretim Takip sayfası başlatılıyor...");

    // Birim seçimi dropdown
    const unitDropdown = document.getElementById('unitDropdown');
    const unitMenuItems = document.querySelectorAll('#unitDropdown + .dropdown-menu .dropdown-item');
    const allUnitsItem = document.createElement('li'); // "Tüm Birimler" seçeneği ekle
    allUnitsItem.innerHTML = '<a class="dropdown-item active" href="#">Tüm Birimler</a>'; // Başlangıçta aktif

     if (unitDropdown && unitMenuItems.length > 0) {
         const dropdownMenu = unitDropdown.nextElementSibling; // ul elementini al
         // Önceki "Tüm Birimler"i temizle (varsa) ve yenisini başa ekle
         const existingAll = dropdownMenu.querySelector('a:contains("Tüm Birimler")');
         if(existingAll) existingAll.parentElement.remove();
         dropdownMenu.insertBefore(allUnitsItem, dropdownMenu.firstChild);

         // Tüm menü elemanları için listener
         dropdownMenu.querySelectorAll('.dropdown-item').forEach(item => {
             // Önceki listener'ları temizle
             item.replaceWith(item.cloneNode(true));
         });
         dropdownMenu.querySelectorAll('.dropdown-item').forEach(item => {
              item.addEventListener('click', (e) => {
                 e.preventDefault();
                 // Tüm elemanlardan 'active' sınıfını kaldır
                 dropdownMenu.querySelectorAll('.dropdown-item').forEach(el => el.classList.remove('active'));
                 // Tıklanana 'active' sınıfını ekle
                 e.target.classList.add('active');

                 const selectedUnitName = e.target.textContent.trim();
                 unitDropdown.textContent = selectedUnitName; // Buton metnini güncelle

                 console.log(`Birim filtresi değişti: ${selectedUnitName}`);

                 // Seçilen birime göre iş listesini filtrele
                  let filterUnitId = null;
                  if (selectedUnitName !== "Tüm Birimler") {
                       const selectedUnit = productionUnits.find(u => u.name === selectedUnitName);
                       filterUnitId = selectedUnit ? selectedUnit.id : null;
                  }
                  renderProductionJobList(productionData.jobs, filterUnitId);
             });
         });
    }

    // Sayfa ilk yüklendiğinde verileri çek
    loadProductionData();
}

// Üretim Takip sekmesi aktif olduğunda başlatıcıyı çağır
document.addEventListener('pageChanged', (e) => {
    if (e.detail && e.detail.page === 'production') {
        initializeProductionPage();
    }
});

// Fonksiyonları globale ekle (Butonlar için gerekli)
if (window) {
    window.loadProductionData = loadProductionData; // Manuel yenileme için
    window.startProductionJob = startProductionJob;
    window.completeProductionJob = completeProductionJob;
    window.pauseProductionJob = pauseProductionJob;
}

console.log("Production module created and initialized.");