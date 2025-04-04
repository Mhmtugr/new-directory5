/**
 * reporting.js
 * Raporlama, Analiz ve Veri Görselleştirme İşlevleri
 */

// Global state for reporting page
let reportingData = {
    productionEfficiency: [],
    delayReasons: {},
    unitTimes: {},
    customerOrders: {},
    loaded: false
};

// Grafik instance'larını tutmak için değişkenler
let efficiencyChartInstance = null;
let delayChartInstance = null;
let unitTimeChartInstance = null;
let customerChartInstance = null;

/**
 * Raporlama için gerekli verileri yükler (Demo).
 */
async function loadReportingData() {
    console.log("Raporlama verileri yükleniyor...");
    if (reportingData.loaded) {
        console.log("Raporlama verileri zaten yüklü.");
        // Eğer veriler zaten varsa tekrar yüklemeye gerek yok,
        // sadece grafikleri yeniden çizmek yeterli olabilir.
        renderAllReports();
        return;
    }

    showLoadingIndicator('reports');

    try {
        // TODO: Gerçek uygulamada bu veriler backend API'den veya analiz servisinden çekilmeli.
        // Örnek API çağrısı:
        // const response = await fetch('/api/reports/summary?period=last90days');
        // const data = await response.json();
        // reportingData.productionEfficiency = data.efficiency;
        // reportingData.delayReasons = data.delays;
        // ... etc.

        // --- Demo Veri Üretimi --- 
        await new Promise(resolve => setTimeout(resolve, 500)); // Yapay gecikme

        reportingData.productionEfficiency = generateDemoEfficiencyData();
        reportingData.delayReasons = generateDemoDelayData();
        reportingData.unitTimes = generateDemoUnitTimeData();
        reportingData.customerOrders = generateDemoCustomerData();

        reportingData.loaded = true; // Verilerin yüklendiğini işaretle
        console.log("Demo raporlama verileri oluşturuldu:", reportingData);

        // Veriler yüklendikten sonra tüm raporları/grafikleri render et
        renderAllReports();

    } catch (error) {
        console.error("Raporlama verileri yüklenirken hata:", error);
        showErrorIndicator('reports', `Rapor verileri yüklenemedi: ${error.message}`);
    } finally {
        hideLoadingIndicator('reports');
    }
}

// --- Demo Veri Üretme Fonksiyonları ---
function generateDemoEfficiencyData() {
    // Son 6 ay için aylık verimlilik yüzdesi (rastgele)
    const data = [];
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran']; // Veya dinamik
    for (let i = 0; i < months.length; i++) {
        data.push({ month: months[i], efficiency: 70 + Math.random() * 25 }); // %70-%95 arası
    }
    return data;
}

function generateDemoDelayData() {
    // Gecikme nedenleri ve sayıları (rastgele)
    return {
        'Malzeme Eksikliği': Math.floor(Math.random() * 20) + 5,
        'Personel Yetersizliği': Math.floor(Math.random() * 10) + 2,
        'Ekipman Arızası': Math.floor(Math.random() * 8),
        'Planlama Hatası': Math.floor(Math.random() * 12) + 3,
        'Kalite Sorunları': Math.floor(Math.random() * 5),
        'Diğer': Math.floor(Math.random() * 7)
    };
}

function generateDemoUnitTimeData() {
    // Birim bazlı ortalama çalışma süreleri (saat, rastgele)
    return {
        'Elektrik Tasarım': 8 + Math.random() * 4,
        'Mekanik Tasarım': 10 + Math.random() * 5,
        'Satın Alma': 4 + Math.random() * 2,
        'Mekanik Üretim': 15 + Math.random() * 8,
        'İç Montaj': 12 + Math.random() * 6,
        'Kablaj': 18 + Math.random() * 7,
        'Genel Montaj': 16 + Math.random() * 6,
        'Test': 6 + Math.random() * 3
    };
}

function generateDemoCustomerData() {
    // Müşteri bazlı sipariş sayıları (rastgele)
    return {
        'Müşteri A': Math.floor(Math.random() * 15) + 5,
        'Müşteri B': Math.floor(Math.random() * 25) + 10,
        'Müşteri C': Math.floor(Math.random() * 8) + 2,
        'Müşteri D': Math.floor(Math.random() * 18) + 7,
        'Diğer Müşteriler': Math.floor(Math.random() * 30) + 15
    };
}
// --- Bitiş: Demo Veri Üretme Fonksiyonları ---


/**
 * Tüm rapor grafiklerini render eder.
 */
function renderAllReports() {
    console.log("Tüm raporlar render ediliyor...");
    renderEfficiencyChart(reportingData.productionEfficiency);
    renderDelayChart(reportingData.delayReasons);
    renderUnitTimeChart(reportingData.unitTimes);
    renderCustomerChart(reportingData.customerOrders);
}

/**
 * Üretim Verimliliği Grafiğini (efficiencyChart) render eder.
 * @param {Array<object>} efficiencyData [{month: string, efficiency: number}]
 */
function renderEfficiencyChart(efficiencyData) {
    const ctx = document.getElementById('efficiencyChart')?.getContext('2d');
    if (!ctx) return;

    if (!efficiencyData || efficiencyData.length === 0) {
        showChartPlaceholder(ctx, "Verimlilik verisi yok.");
        return;
    }

    const labels = efficiencyData.map(d => d.month);
    const data = efficiencyData.map(d => d.efficiency);

    if (efficiencyChartInstance) efficiencyChartInstance.destroy();

    efficiencyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Aylık Üretim Verimliliği (%)',
                data: data,
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false, // Verimlilik %0'dan başlamayabilir
                    // max: 100,
                    title: { display: true, text: 'Verimlilik (%)' }
                },
                 x: {
                     title: { display: true, text: 'Ay' }
                 }
            }
        }
    });
}

/**
 * Gecikme Nedenleri Grafiğini (delayChart) render eder.
 * @param {object} delayData { reason: count }
 */
function renderDelayChart(delayData) {
    const ctx = document.getElementById('delayChart')?.getContext('2d');
    if (!ctx) return;

    const labels = Object.keys(delayData || {});
    const data = Object.values(delayData || {});

    if (labels.length === 0) {
        showChartPlaceholder(ctx, "Gecikme verisi yok.");
        return;
    }

    if (delayChartInstance) delayChartInstance.destroy();

    delayChartInstance = new Chart(ctx, {
        type: 'pie', // veya 'doughnut'
        data: {
            labels: labels,
            datasets: [{
                label: 'Gecikme Sayısı',
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Gecikme Nedenleri Dağılımı'
                }
            }
        }
    });
}

/**
 * Birim Bazlı Çalışma Süreleri Grafiğini (unitTimeChart) render eder.
 * @param {object} unitTimeData { unitName: averageHours }
 */
function renderUnitTimeChart(unitTimeData) {
    const ctx = document.getElementById('unitTimeChart')?.getContext('2d');
    if (!ctx) return;

    const labels = Object.keys(unitTimeData || {});
    const data = Object.values(unitTimeData || {});

    if (labels.length === 0) {
         showChartPlaceholder(ctx, "Birim süresi verisi yok.");
         return;
     }

    if (unitTimeChartInstance) unitTimeChartInstance.destroy();

    unitTimeChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ortalama Çalışma Süresi (Saat)',
                data: data,
                backgroundColor: 'rgba(153, 102, 255, 0.6)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y', // Birimleri Y ekseninde göster
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    beginAtZero: true,
                    title: { display: true, text: 'Ortalama Süre (Saat)' }
                }
            },
            plugins: {
                legend: {
                   display: false // Tek dataset olduğu için gereksiz
                }
            }
        }
    });
}

/**
 * Müşteri Bazlı Sipariş Sayıları Grafiğini (customerChart) render eder.
 * @param {object} customerData { customerName: orderCount }
 */
function renderCustomerChart(customerData) {
    const ctx = document.getElementById('customerChart')?.getContext('2d');
    if (!ctx) return;

     const labels = Object.keys(customerData || {});
     const data = Object.values(customerData || {});

    if (labels.length === 0) {
        showChartPlaceholder(ctx, "Müşteri verisi yok.");
        return;
    }

    if (customerChartInstance) customerChartInstance.destroy();

    customerChartInstance = new Chart(ctx, {
        type: 'doughnut', // Veya 'pie'
        data: {
            labels: labels,
            datasets: [{
                label: 'Sipariş Sayısı',
                data: data,
                backgroundColor: [
                    'rgba(255, 159, 64, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(153, 102, 255, 0.6)'
                ],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                title: {
                    display: true,
                    text: 'Müşteri Bazlı Sipariş Dağılımı'
                }
            }
        }
    });
}

/**
 * Belirtilen tipte rapor oluşturur ve indirme işlemini başlatır (Placeholder).
 * @param {string} reportType Rapor tipi (örn: 'production', 'material', 'delay')
 */
function downloadReport(reportType) {
    console.log(`${reportType} raporu oluşturuluyor ve indiriliyor...`);

    // TODO: Gerçek rapor oluşturma mantığı (CSV, PDF, Excel vb.)
    // 1. Gerekli veriyi topla (reportingData veya API'den)
    // 2. Veriyi istenen formata dönüştür (örn: CSV string)
    // 3. Blob oluştur ve indirme linki yarat

    let reportContent = "";
    let filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`; // Örnek dosya adı

    switch (reportType) {
        case 'production':
            reportContent = "Ay,Verimlilik(%)\n"; // Başlık satırı
            reportingData.productionEfficiency.forEach(d => {
                reportContent += `${d.month},${d.efficiency.toFixed(1)}\n`;
            });
            break;
        case 'delay':
            reportContent = "Gecikme Nedeni,Sayı\n";
            for (const reason in reportingData.delayReasons) {
                reportContent += `"${reason}",${reportingData.delayReasons[reason]}\n`;
            }
            break;
        case 'material':
             reportContent = "Malzeme Kodu,Adı,Miktar,Birim\n"; // Örnek başlık
             // TODO: Malzeme verisi ERPService'den alınmalı
             reportContent += "MAT-001,Vida,1000,adet\nMAT-002,Kablo,500,metre\n";
             filename = `material_report_${new Date().toISOString().split('T')[0]}.csv`;
            break;
        // Diğer rapor tipleri eklenebilir
        default:
            showToast(`'${reportType}' tipi rapor henüz desteklenmiyor.`, 'warning');
            return;
    }

    // İndirme işlemini gerçekleştir
    try {
        const blob = new Blob([reportContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(`${filename} raporu indiriliyor...`, 'success');
    } catch (e) {
        console.error("Rapor indirme hatası:", e);
        showToast("Rapor indirilemedi.", 'error');
    }
}


/**
 * Raporlama sayfası için olay dinleyicilerini ve başlangıç yüklemelerini ayarlar.
 */
function initializeReportingPage() {
    console.log("Raporlama sayfası başlatılıyor...");

    // Rapor İndirme Dropdown Menüsü
    const reportDropdownItems = document.querySelectorAll('#reportsDropdown + .dropdown-menu .dropdown-item');
    if (reportDropdownItems.length > 0) {
        reportDropdownItems.forEach(item => {
            // Önceki listener'ları temizle (varsa)
            item.replaceWith(item.cloneNode(true));
        });
        // Yeni listener'ları ekle
        document.querySelectorAll('#reportsDropdown + .dropdown-menu .dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const reportText = e.target.textContent;
                let reportType = 'unknown';
                // Basit eşleştirme (daha sağlam hale getirilebilir)
                if (reportText.includes('Üretim')) reportType = 'production';
                else if (reportText.includes('Malzeme')) reportType = 'material';
                else if (reportText.includes('Gecikme')) reportType = 'delay';
                else if (reportText.includes('Verimlilik')) reportType = 'efficiency'; // Belki üretim ile aynı?
                else if (reportText.includes('Özel')) reportType = 'custom';

                if (reportType !== 'unknown' && reportType !== 'custom') {
                    downloadReport(reportType);
                } else if (reportType === 'custom') {
                    showToast('Özel rapor oluşturma henüz aktif değil.', 'info');
                } else {
                     showToast('Bu rapor türü için indirme fonksiyonu tanımlanmamış.', 'warning');
                }
            });
        });
    } else {
        console.warn("Rapor indirme dropdown elemanları bulunamadı.");
    }

    // Sayfa ilk yüklendiğinde veya sekmeye geçildiğinde verileri yükle
    loadReportingData();
}

// Raporlama sekmesi aktif olduğunda başlatıcıyı çağır
document.addEventListener('pageChanged', (e) => {
    if (e.detail && e.detail.page === 'reports') {
        initializeReportingPage();
    }
});

// Fonksiyonları globale ekle (Özellikle rapor indirme butonu için)
if (window) {
    window.downloadReport = downloadReport; // İndirme butonları doğrudan çağırabilir
    window.loadReportingData = loadReportingData; // Manuel yenileme için
}

console.log("Reporting module created and initialized."); 