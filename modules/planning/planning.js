/**
 * planning.js
 * Üretim Planlama, Kapasite Yönetimi ve Teslimat Tahminleri
 */

// Global state for planning page
let planningData = {
    orders: [],
    productionUnits: [ // Örnek üretim birimleri ve kapasiteleri (saat/hafta)
        { id: 'elektrik_tasarim', name: 'Elektrik Tasarım', capacity: 160 },
        { id: 'mekanik_tasarim', name: 'Mekanik Tasarım', capacity: 120 },
        { id: 'satin_alma', name: 'Satın Alma', capacity: 80 },
        { id: 'mekanik_uretim', name: 'Mekanik Üretim', capacity: 200 },
        { id: 'ic_montaj', name: 'İç Montaj', capacity: 240 },
        { id: 'kablaj', name: 'Kablaj', capacity: 320 },
        { id: 'genel_montaj', name: 'Genel Montaj', capacity: 280 },
        { id: 'test', name: 'Test', capacity: 160 }
    ],
    schedule: [], // Planlanan görevler/siparişler için zaman çizelgesi
    capacityLoad: {}, // Birim bazında yük durumu
    deliveryEstimates: [] // Tahmini teslimatlar
};

let capacityChartInstance = null;
let deliveryChartInstance = null;

/**
 * Gerekli planlama verilerini yükler (siparişler, kaynaklar vb.)
 */
async function loadPlanningData() {
    console.log("Planlama verileri yükleniyor...");
    showLoadingIndicator('planning'); // Yükleniyor göstergesini aç

    try {
        // Demo: ERPService'den siparişleri alalım
        if (window.ERPService && typeof window.ERPService.getOrders === 'function') {
            const orders = await window.ERPService.getOrders();
            // Sadece tamamlanmamış veya yeni siparişleri alalım (varsayım)
            planningData.orders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
            console.log("Planlama için siparişler yüklendi:", planningData.orders);

            // Her sipariş için tahmini süreyi hesapla ve zaman çizelgesine ekle
            planningData.schedule = await generateDemoSchedule(planningData.orders);
            console.log("Demo zaman çizelgesi oluşturuldu:", planningData.schedule);

            // Kapasite yükünü hesapla (Demo)
            planningData.capacityLoad = calculateCapacityLoad(planningData.schedule);
            console.log("Demo kapasite yükü hesaplandı:", planningData.capacityLoad);

            // Teslimat tahminlerini oluştur (Demo)
            planningData.deliveryEstimates = generateDeliveryEstimates(planningData.schedule);
            console.log("Demo teslimat tahminleri oluşturuldu:", planningData.deliveryEstimates);

        } else {
            console.warn("ERPService.getOrders bulunamadı. Demo verisi kullanılamıyor.");
            planningData.orders = [];
            planningData.schedule = [];
            planningData.capacityLoad = {};
            planningData.deliveryEstimates = [];
        }

        // Veriler yüklendikten sonra arayüzü güncelle
        renderProductionCalendar(planningData.schedule);
        renderCapacityChart(planningData.capacityLoad); // Başlangıçta tüm birimler için
        renderDeliveryChart(planningData.deliveryEstimates); // Başlangıçta varsayılan zaman aralığı

    } catch (error) {
        console.error("Planlama verileri yüklenirken hata:", error);
        showErrorIndicator('planning', `Veri yüklenemedi: ${error.message}`);
    } finally {
        hideLoadingIndicator('planning'); // Yükleniyor göstergesini kapat
    }
}

/**
 * Bir sipariş için tahmini üretim süresini hesaplar (Demo Kural Bazlı).
 * @param {object} order Sipariş objesi
 * @returns {number} Tahmini süre (saat cinsinden)
 */
function estimateProductionTime(order) {
    let estimatedHours = 0;
    const quantity = order.quantity || 1;
    const cellType = order.cellType || 'unknown';

    // Basit kural tabanlı tahmin (gerçek uygulamada daha karmaşık olabilir)
    switch (cellType.toLowerCase()) {
        case 'rm 36 cb': estimatedHours = 10; break;
        case 'rm 36 lb': estimatedHours = 12; break;
        case 'rm 36 fl': estimatedHours = 15; break;
        case 'rm 36 mb': estimatedHours = 18; break;
        default: estimatedHours = 8; // Bilinmeyen tip için varsayılan
    }

    // Miktar ve belki karmaşıklık faktörü ekle
    estimatedHours *= quantity;
    // estimatedHours *= (order.complexityFactor || 1); // Opsiyonel

    // Her adım için süre ekleyebiliriz (daha detaylı planlama için)
    // Örneğin: Tasarım: 2 saat, Mekanik: 4 saat, Montaj: 5 saat vs.

    return Math.max(1, estimatedHours); // Minimum 1 saat
}

/**
 * Siparişlere göre basit bir demo üretim zaman çizelgesi oluşturur.
 * @param {Array<object>} orders Sipariş listesi
 * @returns {Promise<Array<object>>} Zaman çizelgesi öğeleri (id, orderId, taskName, start, end, resourceId)
 */
async function generateDemoSchedule(orders) {
    let schedule = [];
    let currentTime = new Date(); // Başlangıç zamanı
    currentTime.setHours(8, 0, 0, 0); // Çalışma saati başlangıcı

    // Basit sıralı planlama (FIFO gibi)
    for (const order of orders) {
        const durationHours = estimateProductionTime(order);
        const durationMillis = durationHours * 60 * 60 * 1000;

        // Çalışma saatlerini (08:00-17:00 Pazartesi-Cuma) dikkate alarak bitiş zamanını hesapla (basitçe)
        // Bu kısım daha karmaşık bir algoritma gerektirebilir (kütüphane veya özel mantık)
        // Şimdilik basitçe ekleyelim
        let startTime = new Date(currentTime);
        let endTime = new Date(currentTime.getTime() + durationMillis);

        // Basit hafta sonu ve mesai dışı atlama (çok kaba)
        if (endTime.getDay() === 6) { // Cumartesi
            endTime.setDate(endTime.getDate() + 2); // Pazartesiye atla
            endTime.setHours(8, 0, 0, 0);
        } else if (endTime.getDay() === 0) { // Pazar
            endTime.setDate(endTime.getDate() + 1); // Pazartesiye atla
            endTime.setHours(8, 0, 0, 0);
        }
        // TODO: Mesai saatleri daha doğru hesaplanmalı

        schedule.push({
            id: `task-${order.orderId || order.id}`,
            orderId: order.orderId || order.id,
            taskName: `Sipariş: ${order.orderId || order.id} (${order.cellType || 'N/A'})`,
            start: startTime,
            end: endTime,
            resourceId: 'genel_montaj' // Şimdilik tek bir kaynağa atayalım
        });

        currentTime = new Date(endTime); // Bir sonraki görev bu görevin bitiminde başlar
    }
    return schedule;
}

/**
 * Zaman çizelgesine göre birimlerin kapasite yükünü hesaplar (Demo).
 * @param {Array<object>} schedule Zaman çizelgesi
 * @returns {object} Birim ID'si başına yüklenen saatleri içeren obje
 */
function calculateCapacityLoad(schedule) {
    const load = {};
    planningData.productionUnits.forEach(unit => load[unit.id] = 0); // Başlangıç yükleri

    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    schedule.forEach(task => {
        // Bu hafta içinde olan görevlerin yükünü hesapla (basitçe)
        if (task.start < nextWeek && task.end > now) {
             const resource = task.resourceId || 'genel_montaj'; // Varsayılan birim
             const durationHours = (task.end - task.start) / (1000 * 60 * 60);
             if (load[resource] !== undefined) {
                 load[resource] += durationHours;
             } else {
                 // Eğer görev bilinmeyen bir kaynağa atanmışsa, genel montaja ekleyelim
                 load['genel_montaj'] += durationHours;
             }
        }
    });
    return load;
}

/**
 * Zaman çizelgesine göre tahmini teslimatları oluşturur (Demo).
 * @param {Array<object>} schedule Zaman çizelgesi
 * @returns {Array<object>} Teslimat tahminleri (orderId, estimatedDeliveryDate)
 */
function generateDeliveryEstimates(schedule) {
     return schedule.map(task => ({
         orderId: task.orderId,
         estimatedDeliveryDate: task.end // Görevin bitişini teslimat tarihi olarak varsayalım
     }));
}


/**
 * Üretim takvimini/zaman çizelgesini render eder.
 * @param {Array<object>} scheduleData Zaman çizelgesi verisi
 */
function renderProductionCalendar(scheduleData) {
    const calendarEl = document.getElementById('productionCalendar');
    if (!calendarEl) return;

    calendarEl.innerHTML = ''; // Önceki içeriği temizle

    if (!scheduleData || scheduleData.length === 0) {
        calendarEl.innerHTML = '<div class="text-center p-4 text-muted">Planlanmış üretim bulunmuyor.</div>';
        return;
    }

    // --- Basit Liste Görünümü (Başlangıç) ---
    let listHtml = '<ul class="list-group">';
    scheduleData.sort((a, b) => a.start - b.start).forEach(task => {
        listHtml += `
            <li class="list-group-item">
                <strong>${task.taskName}</strong><br>
                <small>Başlangıç: ${task.start.toLocaleString('tr-TR')}</small><br>
                <small>Bitiş: ${task.end.toLocaleString('tr-TR')}</small>
                <!-- <small>(Kaynak: ${task.resourceId})</small> -->
            </li>`;
    });
    listHtml += '</ul>';
    calendarEl.innerHTML = listHtml;
    // --- Bitiş: Basit Liste Görünümü ---

    // TODO: Buraya FullCalendar veya başka bir Gantt kütüphanesi entegrasyonu eklenebilir.
    // Örnek:
    // const calendar = new FullCalendar.Calendar(calendarEl, {
    //     initialView: 'timeGridWeek', // Veya 'resourceTimelineWeek'
    //     headerToolbar: { ... },
    //     events: scheduleData.map(task => ({
    //         id: task.id,
    //         title: task.taskName,
    //         start: task.start,
    //         end: task.end,
    //         resourceId: task.resourceId // Eğer kaynak görünümü kullanılıyorsa
    //     })),
    //     resources: planningData.productionUnits.map(unit => ({ id: unit.id, title: unit.name })) // Kaynak görünümü için
    // });
    // calendar.render();
}

/**
 * Kapasite kullanım grafiğini render eder (Chart.js).
 * @param {object} capacityLoadData Birim bazında yük verisi
 * @param {string|null} selectedUnit Gösterilecek belirli birim ID'si (null ise hepsi)
 */
function renderCapacityChart(capacityLoadData, selectedUnit = null) {
    const ctx = document.getElementById('capacityChart')?.getContext('2d');
    if (!ctx) return;

    const labels = [];
    const data = [];
    const backgroundColors = [];
    const borderColors = [];
    const capacities = []; // Her birimin haftalık kapasitesi

    planningData.productionUnits.forEach(unit => {
        if (!selectedUnit || selectedUnit === unit.id) {
            labels.push(unit.name);
            const load = capacityLoadData[unit.id] || 0;
            const capacity = unit.capacity || 1; // Bölme hatasını önle
            capacities.push(capacity); // Kapasiteyi sakla
            data.push(Math.min(100, (load / capacity) * 100)); // Yüzde olarak yük, max %100

            // Renklendirme (örnek: %75 üstü kırmızı, %50 üstü sarı)
            if (load / capacity > 0.9) { // %90 üstü
                backgroundColors.push('rgba(255, 99, 132, 0.6)'); // Kırmızı
                borderColors.push('rgba(255, 99, 132, 1)');
            } else if (load / capacity > 0.7) { // %70 üstü
                 backgroundColors.push('rgba(255, 206, 86, 0.6)'); // Sarı
                 borderColors.push('rgba(255, 206, 86, 1)');
            } else {
                 backgroundColors.push('rgba(75, 192, 192, 0.6)'); // Yeşil/Mavi
                 borderColors.push('rgba(75, 192, 192, 1)');
            }
        }
    });

    if (capacityChartInstance) {
        capacityChartInstance.destroy(); // Önceki grafiği temizle
    }

     if (labels.length === 0) {
         ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
         ctx.textAlign = 'center';
         ctx.fillText("Seçili birim için kapasite verisi bulunamadı.", ctx.canvas.width / 2, ctx.canvas.height / 2);
         return;
     }


    capacityChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Haftalık Kapasite Kullanım Yüzdesi (%)',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1
            }
            // İsteğe bağlı: İkinci bir dataset olarak kapasiteyi (saat) gösterebiliriz
            // {
            //     label: 'Haftalık Kapasite (saat)',
            //     data: capacities,
            //     type: 'line', // Çizgi olarak göster
            //     borderColor: 'rgba(54, 162, 235, 1)',
            //     backgroundColor: 'rgba(54, 162, 235, 0.2)',
            //     fill: false,
            //     yAxisID: 'y-axis-capacity' // Farklı bir Y ekseni kullanabilir
            // }
          ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100, // Yüzde olduğu için max 100
                    title: {
                         display: true,
                         text: 'Kullanım Oranı (%)'
                     }
                }
                // İsteğe bağlı ikinci Y ekseni
                // 'y-axis-capacity': {
                //     position: 'right',
                //     beginAtZero: true,
                //     title: {
                //         display: true,
                //         text: 'Kapasite (saat)'
                //     },
                //     grid: {
                //         drawOnChartArea: false // Ana grid ile karışmasın
                //     }
                // }
            },
            plugins: {
                 tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(1) + '%';
                                // İlgili birimin yükünü ve kapasitesini de gösterebiliriz
                                const unitName = context.label;
                                const unit = planningData.productionUnits.find(u => u.name === unitName);
                                const load = capacityLoadData[unit?.id] || 0;
                                if(unit) {
                                     label += ` (${load.toFixed(1)} / ${unit.capacity} saat)`;
                                }
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}


/**
 * Teslimat tahminleri grafiğini render eder (Chart.js).
 * @param {Array<object>} deliveryData Teslimat tahminleri listesi
 * @param {string} timePeriod Zaman aralığı ('7d', '30d', '90d', '1y') - TODO: Henüz uygulanmadı
 */
function renderDeliveryChart(deliveryData, timePeriod = '30d') {
    const ctx = document.getElementById('deliveryChart')?.getContext('2d');
    if (!ctx) return;

    if (!deliveryData || deliveryData.length === 0) {
         if (deliveryChartInstance) deliveryChartInstance.destroy();
         ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
         ctx.textAlign = 'center';
         ctx.fillText("Teslimat tahmini verisi bulunamadı.", ctx.canvas.width / 2, ctx.canvas.height / 2);
         return;
    }

    // Veriyi tarihe göre grupla ve say (Örn: Son 30 gün için günlük)
    const countsByDate = {};
    const today = new Date();
    const startDate = new Date(); // Varsayılan: Son 30 gün
    startDate.setDate(today.getDate() - 30);

    deliveryData.forEach(delivery => {
         if (delivery.estimatedDeliveryDate >= startDate && delivery.estimatedDeliveryDate <= today) {
            const dateStr = delivery.estimatedDeliveryDate.toISOString().split('T')[0]; // YYYY-MM-DD
            countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
         }
    });

    // Grafik için etiketleri ve verileri oluştur
    const labels = [];
    const data = [];
    let currentDate = new Date(startDate);
    while (currentDate <= today) {
         const dateStr = currentDate.toISOString().split('T')[0];
         labels.push(dateStr); // Veya .toLocaleDateString('tr-TR')
         data.push(countsByDate[dateStr] || 0);
         currentDate.setDate(currentDate.getDate() + 1); // Sonraki gün
    }


    if (deliveryChartInstance) {
        deliveryChartInstance.destroy(); // Önceki grafiği temizle
    }

    deliveryChartInstance = new Chart(ctx, {
        type: 'line', // Veya 'bar'
        data: {
            labels: labels,
            datasets: [{
                label: 'Günlük Tahmini Teslimat Sayısı (Son 30 Gün)',
                data: data,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                         display: true,
                         text: 'Teslimat Sayısı'
                    }
                },
                x: {
                     title: {
                         display: true,
                         text: 'Tarih'
                     }
                }
            }
        }
    });
     // TODO: timePeriod parametresine göre filtreleme ve etiket ayarlaması yapılmalı.
}


/**
 * Planlama sayfası için olay dinleyicilerini ve başlangıç yüklemelerini ayarlar.
 */
function initializePlanningPage() {
    console.log("Planlama sayfası başlatılıyor...");

    // Kapasite birimi seçimi dropdown
    const capacityDropdown = document.getElementById('capacityDropdown');
    const capacityMenuItems = document.querySelectorAll('#capacityDropdown + .dropdown-menu .dropdown-item');
    if (capacityDropdown && capacityMenuItems.length > 0) {
        capacityMenuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const selectedUnitName = e.target.textContent;
                const selectedUnit = planningData.productionUnits.find(u => u.name === selectedUnitName);
                capacityDropdown.textContent = selectedUnitName; // Buton metnini güncelle
                renderCapacityChart(planningData.capacityLoad, selectedUnit ? selectedUnit.id : null); // Grafiği yeniden çiz
            });
        });
        // "Tüm Birimler" seçeneğini de ekleyelim (varsa)
        // TODO: 'Tüm Birimler' için ayrı bir eleman veya kontrol eklemek daha iyi olabilir. Şimdilik manuel sıfırlama varsayılıyor.
    }

    // Teslimat zaman aralığı seçimi dropdown
    const deliveryDropdown = document.getElementById('deliveryDropdown');
    const deliveryMenuItems = document.querySelectorAll('#deliveryDropdown + .dropdown-menu .dropdown-item');
     if (deliveryDropdown && deliveryMenuItems.length > 0) {
        deliveryMenuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const selectedText = e.target.textContent;
                let timePeriod = '30d'; // Varsayılan
                if (selectedText.includes('7 Gün')) timePeriod = '7d';
                else if (selectedText.includes('90 Gün')) timePeriod = '90d';
                else if (selectedText.includes('Bu Yıl')) timePeriod = '1y';

                deliveryDropdown.textContent = selectedText;
                 // TODO: renderDeliveryChart fonksiyonunu timePeriod'a göre güncelle
                 console.warn(`Teslimat grafiği için zaman periyodu (${timePeriod}) filtrelemesi henüz tam uygulanmadı.`);
                renderDeliveryChart(planningData.deliveryEstimates, timePeriod);
            });
        });
     }

     // Günlük/Haftalık/Aylık görünüm butonları (Takvim/Gantt için)
     const viewButtons = document.querySelectorAll('#planning .btn-group .btn');
     viewButtons.forEach(button => {
         button.addEventListener('click', (e) => {
             viewButtons.forEach(btn => btn.classList.remove('active')); // Diğerlerini pasif yap
             e.target.classList.add('active'); // Tıklananı aktif yap
             const viewType = e.target.textContent.toLowerCase(); // günlük, haftalık, aylık
             // TODO: renderProductionCalendar fonksiyonunu görünüm tipine göre güncelle
             console.warn(`Takvim görünümü (${viewType}) değişikliği henüz uygulanmadı.`);
             // renderProductionCalendar(planningData.schedule, viewType);
         });
     });


    // Sayfa ilk yüklendiğinde verileri çek
    loadPlanningData();
}

// Helper: Yükleniyor/Hata göstergeleri (main.js'den beklenebilir) - ui.js'ye taşındı
/*
function showLoadingIndicator(sectionId) { ... }
function hideLoadingIndicator(sectionId) { ... }
function showErrorIndicator(sectionId, message) { ... }
*/

// Planlama sekmesi aktif olduğunda başlatıcıyı çağır
document.addEventListener('pageChanged', (e) => {
    if (e.detail && e.detail.page === 'planning') {
        initializePlanningPage();
    }
});

// Fonksiyonları globale ekle (Gerekiyorsa, ancak initialize yeterli olabilir)
if (window) {
    window.loadPlanningData = loadPlanningData; // Manuel yenileme için
    // Diğer fonksiyonlar genellikle initializePlanningPage içinden çağrıldığı için globale eklemek gerekmeyebilir.
}

console.log("Planning module created and initialized."); 