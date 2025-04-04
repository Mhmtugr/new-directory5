/**
 * ui.js
 * Genel Kullanıcı Arayüzü Yardımcı Fonksiyonları
 */

/**
 * Bootstrap Toast bildirimini gösterir.
 * @param {string} message Gösterilecek mesaj.
 * @param {string} type Bildirim tipi ('success', 'info', 'warning', 'error'). Varsayılan 'info'.
 * @param {number} delay Gecikme süresi (ms). Varsayılan 5000.
 */
function showToast(message, type = 'info', delay = 5000) {
    // Toast container'ını bul veya oluştur
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1100'; // Modalların üzerinde olması için
        document.body.appendChild(toastContainer);
    }

    const toastId = `toast-${Date.now()}`;
    let iconHtml = '';
    let bgClass = '';

    switch (type) {
        case 'success':
            iconHtml = '<i class="bi bi-check-circle-fill me-2"></i>';
            bgClass = 'text-bg-success';
            break;
        case 'error':
            iconHtml = '<i class="bi bi-x-octagon-fill me-2"></i>';
            bgClass = 'text-bg-danger';
            break;
        case 'warning':
            iconHtml = '<i class="bi bi-exclamation-triangle-fill me-2"></i>';
            bgClass = 'text-bg-warning';
            break;
        case 'info':
        default:
            iconHtml = '<i class="bi bi-info-circle-fill me-2"></i>';
            bgClass = 'text-bg-info';
            break;
    }

    const toastHtml = `
        <div id="${toastId}" class="toast ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="${delay}">
            <div class="toast-header ${bgClass}">
                ${iconHtml}
                <strong class="me-auto">Bilgi</strong>
                <small class="text-white-50">Şimdi</small>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHtml);

    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement);

    // Toast kapandığında DOM'dan kaldır
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });

    toast.show();
    console.log(`Toast Gösterildi (${type}):`, message);
}

/**
 * Belirli bir bölüm için yükleniyor göstergesini aktif eder.
 * @param {string} sectionId Yükleniyor göstergesinin hedeflendiği bölümün ID'si veya özel bir anahtar kelime.
 * @param {string} [message='Yükleniyor...'] Gösterilecek mesaj.
 */
function showLoadingIndicator(sectionId, message = 'Yükleniyor...') {
    console.log(`${sectionId} için yükleniyor göstergesi açıldı.`);
    const loadingHtml = `<div class="loading-overlay-content text-center p-4"><i class="bi bi-arrow-clockwise fs-3 spin me-2"></i> ${message}</div>`;

    // Genel overlay (body için)
    if (sectionId === 'body' || !sectionId) {
        let overlay = document.getElementById('global-loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'global-loading-overlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
            overlay.style.zIndex = '1090'; // Toast'ların altında, modalların üstünde olabilir
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';
            document.body.appendChild(overlay);
        }
        overlay.innerHTML = loadingHtml;
        overlay.style.display = 'flex';
        return;
    }

    // Belirli bir konteyner için (örn: tablo tbody, chart alanı, list-group)
    const element = document.getElementById(sectionId);
    if (element) {
        // Eğer bir tablo body ise
        if (element.tagName === 'TBODY') {
            const colspan = element.closest('table')?.querySelector('thead th')?.colSpan || 1;
            element.innerHTML = `<tr><td colspan="${colspan}" class="text-center p-4">${loadingHtml}</td></tr>`;
        }
        // Eğer bir list-group ise
        else if (element.classList.contains('list-group')) {
             element.innerHTML = `<li class="list-group-item text-center p-4">${loadingHtml}</li>`;
        }
         // Eğer bir chart canvas ise (placeholder kullan)
         else if (element.tagName === 'CANVAS') {
             showChartPlaceholder(element.getContext('2d'), message);
         }
         // Genel div ise (içeriğini değiştir)
         else {
              // Eski içeriği saklamak yerine üzerine bir overlay ekleyebiliriz
              let overlay = element.querySelector('.loading-overlay');
              if(!overlay){
                    overlay = document.createElement('div');
                    overlay.className = 'loading-overlay';
                    overlay.style.position = 'absolute'; // Parent relative olmalı
                    overlay.style.top = '0';
                    overlay.style.left = '0';
                    overlay.style.width = '100%';
                    overlay.style.height = '100%';
                    overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                    overlay.style.display = 'flex';
                    overlay.style.justifyContent = 'center';
                    overlay.style.alignItems = 'center';
                    overlay.style.zIndex = '10';
                    element.style.position = 'relative'; // Parent'ı relative yap
                    element.appendChild(overlay);
              }
             overlay.innerHTML = loadingHtml;
             overlay.style.display = 'flex';
         }
    } else {
        console.warn(`showLoadingIndicator: ID'si '${sectionId}' olan element bulunamadı.`);
    }
}

/**
 * Yükleniyor göstergesini gizler.
 * @param {string} sectionId Gizlenecek göstergenin bölüm ID'si veya özel anahtar kelime.
 */
function hideLoadingIndicator(sectionId) {
    console.log(`${sectionId} için yükleniyor göstergesi kapatıldı.`);

     // Genel overlay
     if (sectionId === 'body' || !sectionId) {
         const overlay = document.getElementById('global-loading-overlay');
         if (overlay) {
             overlay.style.display = 'none';
         }
         return;
     }

     // Belirli konteyner
     const element = document.getElementById(sectionId);
     if (element) {
         // Overlay varsa kaldır
         const overlay = element.querySelector('.loading-overlay');
         if (overlay) {
             overlay.style.display = 'none';
         }
         // Tablo body veya list-group için özel bir temizleme gerekebilir,
         // ancak genellikle render fonksiyonları içeriği zaten günceller.
     } else {
        console.warn(`hideLoadingIndicator: ID'si '${sectionId}' olan element bulunamadı.`);
    }
}

/**
 * Belirli bir bölümde hata mesajı gösterir.
 * @param {string} sectionId Hata mesajının gösterileceği bölümün ID'si.
 * @param {string} message Gösterilecek hata mesajı.
 */
function showErrorIndicator(sectionId, message) {
    console.error(`${sectionId} hatası:`, message);
    const element = document.getElementById(sectionId);
    const errorHtml = `<div class="alert alert-danger p-3" role="alert">${message}</div>`;

    if (element) {
         // Eğer bir tablo body ise
         if (element.tagName === 'TBODY') {
            const colspan = element.closest('table')?.querySelector('thead th')?.colSpan || 1;
            element.innerHTML = `<tr><td colspan="${colspan}">${errorHtml}</td></tr>`;
        }
         // Eğer bir list-group ise
         else if (element.classList.contains('list-group')) {
             element.innerHTML = `<li class="list-group-item">${errorHtml}</li>`;
         }
          // Eğer bir chart canvas ise (placeholder kullan)
         else if (element.tagName === 'CANVAS') {
             showChartPlaceholder(element.getContext('2d'), message, 'error');
         }
         // Genel div ise (içeriğini değiştir)
         else {
             element.innerHTML = errorHtml;
         }
    } else {
        console.warn(`showErrorIndicator: ID'si '${sectionId}' olan element bulunamadı. Toast gösteriliyor.`);
        showToast(message, 'error'); // Element yoksa toast göster
    }
}

/**
 * Chart.js canvas'ına bir placeholder metni (örn: Yükleniyor, Veri Yok) çizer.
 * @param {CanvasRenderingContext2D} ctx Çizim yapılacak context.
 * @param {string} message Gösterilecek metin.
 * @param {'loading'|'info'|'error'} [type='info'] Placeholder tipi (renklendirme için).
 */
function showChartPlaceholder(ctx, message, type = 'info') {
    if (!ctx) return;

    const canvas = ctx.canvas;
    // Önceki Chart instance'ını bul ve yok et (varsa)
    // Chart.js 3.x ve sonrası için:
    const chartInstance = Chart.getChart(canvas);
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Canvas'ı temizle
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Metni ortaya yaz
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '14px sans-serif';

    if (type === 'error') {
        ctx.fillStyle = '#dc3545'; // Bootstrap danger color
    } else {
        ctx.fillStyle = '#6c757d'; // Bootstrap muted color
    }

    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
    ctx.restore();
}

// Fonksiyonları global scope'a ekle (tüm modüllerin erişebilmesi için)
if (window) {
    window.showToast = showToast;
    window.showLoadingIndicator = showLoadingIndicator;
    window.hideLoadingIndicator = hideLoadingIndicator;
    window.showErrorIndicator = showErrorIndicator;
    window.showChartPlaceholder = showChartPlaceholder;
}

console.log("UI Utilities loaded."); 