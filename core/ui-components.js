/**
 * ui-components.js
 * Temel UI bileşenleri ve yardımcı fonksiyonları
 */

// UI bileşenleri sınıfı
class UIComponents {
    constructor() {
        this.init();
        this.logger = window.Logger || console;
        this.logger.info('UI Bileşenleri başlatıldı');
    }
    
    // Başlangıç ayarları
    init() {
        // Sayfa yüklendiğinde
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
            this.setupTooltips();
            this.initializeStateCounts();
        });
    }
    
    // Olay dinleyicilerini kur
    setupEventListeners() {
        // Bildirim panelini aç/kapat
        const notificationToggle = document.querySelector('.notification-toggle');
        const notificationPanel = document.querySelector('.notification-panel');
        
        if (notificationToggle && notificationPanel) {
            notificationToggle.addEventListener('click', () => {
                notificationPanel.classList.toggle('active');
            });
        }
        
        // Profil menüsünü aç/kapat
        const profileMenu = document.querySelector('.profile-menu');
        const profileDropdown = document.querySelector('.profile-dropdown');
        
        if (profileMenu && profileDropdown) {
            profileMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                profileDropdown.classList.toggle('active');
            });
            
            // Dışarı tıklandığında kapat
            document.addEventListener('click', (e) => {
                if (profileDropdown.classList.contains('active') && !profileDropdown.contains(e.target)) {
                    profileDropdown.classList.remove('active');
                }
                
                if (notificationPanel && notificationPanel.classList.contains('active') && 
                    !notificationPanel.contains(e.target) && e.target !== notificationToggle) {
                    notificationPanel.classList.remove('active');
                }
            });
        }
        
        // Tablo sıralama özelliği
        const sortableHeaders = document.querySelectorAll('.sortable');
        if (sortableHeaders.length > 0) {
            sortableHeaders.forEach(header => {
                header.addEventListener('click', () => {
                    this.handleTableSort(header);
                });
            });
        }
    }
    
    // Tooltip'leri etkinleştir
    setupTooltips() {
        const tooltips = document.querySelectorAll('[data-tooltip]');
        
        tooltips.forEach(element => {
            const tooltipText = element.getAttribute('data-tooltip');
            
            element.addEventListener('mouseenter', (e) => {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = tooltipText;
                
                document.body.appendChild(tooltip);
                
                const rect = element.getBoundingClientRect();
                tooltip.style.top = `${rect.top - tooltip.offsetHeight - 5}px`;
                tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
                
                // Pozisyon kontrolleri
                const tooltipRect = tooltip.getBoundingClientRect();
                
                // Ekranın üstünden taşma kontrolü
                if (tooltipRect.top < 5) {
                    tooltip.style.top = `${rect.bottom + 5}px`;
                }
                
                // Ekranın solundan taşma kontrolü
                if (tooltipRect.left < 5) {
                    tooltip.style.left = '5px';
                }
                
                // Ekranın sağından taşma kontrolü
                if (tooltipRect.right > window.innerWidth - 5) {
                    tooltip.style.left = `${window.innerWidth - tooltip.offsetWidth - 5}px`;
                }
                
                tooltip.classList.add('visible');
            });
            
            element.addEventListener('mouseleave', () => {
                const tooltip = document.querySelector('.tooltip.visible');
                if (tooltip) {
                    tooltip.remove();
                }
            });
        });
    }
    
    // Durum sayılarını güncelle
    initializeStateCounts() {
        const stateCounts = document.querySelectorAll('.state-count');
        
        stateCounts.forEach(counter => {
            const targetClass = counter.getAttribute('data-target');
            const status = counter.getAttribute('data-status');
            
            if (targetClass && status) {
                const items = document.querySelectorAll(`${targetClass}[data-status="${status}"]`);
                counter.textContent = items.length;
                
                // Durum rengini ayarla
                if (status === 'waiting') {
                    counter.classList.add('status-waiting');
                } else if (status === 'production') {
                    counter.classList.add('status-production');
                } else if (status === 'completed') {
                    counter.classList.add('status-completed');
                } else if (status === 'cancelled') {
                    counter.classList.add('status-cancelled');
                }
            }
        });
    }
    
    // Tablo sıralama
    handleTableSort(headerElement) {
        const table = headerElement.closest('table');
        if (!table) return;
        
        const columnIndex = Array.from(headerElement.parentNode.children).indexOf(headerElement);
        const isAsc = headerElement.classList.contains('sort-asc');
        
        // Tüm başlıkların sınıflarını temizle
        const headers = table.querySelectorAll('th');
        headers.forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
        });
        
        // Sıralama sınıfı ekle
        headerElement.classList.add(isAsc ? 'sort-desc' : 'sort-asc');
        
        // Tabloyu sırala
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        
        rows.sort((rowA, rowB) => {
            const cellA = rowA.children[columnIndex].textContent;
            const cellB = rowB.children[columnIndex].textContent;
            
            if (this.isNumeric(cellA) && this.isNumeric(cellB)) {
                return isAsc ? parseFloat(cellA) - parseFloat(cellB) : parseFloat(cellB) - parseFloat(cellA);
            } else {
                return isAsc ? cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
            }
        });
        
        // Sıralanmış satırları tabloya ekle
        const tbody = table.querySelector('tbody');
        rows.forEach(row => tbody.appendChild(row));
    }
    
    // Sayısal değer kontrolü
    isNumeric(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    }
    
    // Bildirim oluştur
    createNotification(message, type = 'info', duration = 5000) {
        // Bildirim container'ı kontrol et
        let notificationContainer = document.querySelector('.notification-container');
        
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.className = 'notification-container';
            document.body.appendChild(notificationContainer);
        }
        
        // Yeni bildirim oluştur
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const iconMap = {
            'info': 'fa-info-circle',
            'success': 'fa-check-circle',
            'warning': 'fa-exclamation-triangle',
            'error': 'fa-times-circle'
        };
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${iconMap[type] || iconMap.info}"></i>
            </div>
            <div class="notification-content">
                <p>${message}</p>
            </div>
            <div class="notification-close">
                <i class="fas fa-times"></i>
            </div>
        `;
        
        // Kapatma butonu işlevselliği
        const closeButton = notification.querySelector('.notification-close');
        closeButton.addEventListener('click', () => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
        
        // Bildirimi ekle
        notificationContainer.appendChild(notification);
        
        // Otomatik kapatma
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.classList.add('fade-out');
                    setTimeout(() => {
                        notification.remove();
                    }, 300);
                }
            }, duration);
        }
        
        return notification;
    }
    
    // Modal dialog oluştur
    createModal(options = {}) {
        const {
            title = 'Bilgi',
            content = '',
            size = 'medium', // small, medium, large, full
            closable = true,
            buttons = [{ text: 'Kapat', action: 'close', style: 'secondary' }],
            onClose = null
        } = options;
        
        // Modal arkaplan
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        
        // Modal container
        const modalContainer = document.createElement('div');
        modalContainer.className = `modal-container modal-${size}`;
        
        // Modal içerik
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        // Modal başlık
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        modalHeader.innerHTML = `
            <h3 class="modal-title">${title}</h3>
            ${closable ? '<button class="modal-close"><i class="fas fa-times"></i></button>' : ''}
        `;
        
        // Modal body
        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        
        if (typeof content === 'string') {
            modalBody.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            modalBody.appendChild(content);
        }
        
        // Modal footer
        const modalFooter = document.createElement('div');
        modalFooter.className = 'modal-footer';
        
        buttons.forEach(button => {
            const btn = document.createElement('button');
            btn.className = `btn btn-${button.style || 'primary'}`;
            btn.textContent = button.text;
            
            btn.addEventListener('click', () => {
                if (button.action === 'close') {
                    closeModal();
                } else if (typeof button.onClick === 'function') {
                    button.onClick(modalContainer, closeModal);
                }
            });
            
            modalFooter.appendChild(btn);
        });
        
        // Modal birleştirme
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        modalContent.appendChild(modalFooter);
        modalContainer.appendChild(modalContent);
        modalOverlay.appendChild(modalContainer);
        
        // Modal kapanış işlevselliği
        function closeModal() {
            modalOverlay.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(modalOverlay);
                if (typeof onClose === 'function') {
                    onClose();
                }
            }, 300);
        }
        
        // Kapatma butonu
        if (closable) {
            const closeButton = modalHeader.querySelector('.modal-close');
            closeButton.addEventListener('click', closeModal);
            
            // Dışarı tıklandığında kapanma
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    closeModal();
                }
            });
        }
        
        // Sayfaya ekle
        document.body.appendChild(modalOverlay);
        
        // Animasyon
        setTimeout(() => {
            modalOverlay.classList.add('active');
        }, 10);
        
        return {
            element: modalContainer,
            close: closeModal
        };
    }
    
    // İlerleme çubuğu oluştur
    createProgressBar(container, options = {}) {
        const {
            value = 0,
            max = 100,
            showText = true,
            size = 'medium', // small, medium, large
            type = 'primary', // primary, success, warning, danger
            animated = false,
            striped = false
        } = options;
        
        // İlerleme çubuğu oluştur
        const progressContainer = document.createElement('div');
        progressContainer.className = `progress progress-${size}`;
        
        const progressBar = document.createElement('div');
        progressBar.className = `progress-bar progress-${type}`;
        
        if (striped) progressBar.classList.add('progress-striped');
        if (animated) progressBar.classList.add('progress-animated');
        
        const percent = (value / max) * 100;
        progressBar.style.width = `${percent}%`;
        
        if (showText) {
            progressBar.textContent = `${Math.round(percent)}%`;
        }
        
        progressContainer.appendChild(progressBar);
        
        // Container kontrolü
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        
        if (container instanceof HTMLElement) {
            container.appendChild(progressContainer);
        }
        
        // Güncelleme metodu
        const updateProgress = (newValue) => {
            const newPercent = (newValue / max) * 100;
            progressBar.style.width = `${newPercent}%`;
            
            if (showText) {
                progressBar.textContent = `${Math.round(newPercent)}%`;
            }
        };
        
        return {
            element: progressContainer,
            update: updateProgress
        };
    }
    
    // Tab oluştur
    createTabs(container, options = {}) {
        const {
            tabs = [],
            activeTab = 0,
            onChange = null
        } = options;
        
        // Container kontrolü
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        
        if (!(container instanceof HTMLElement)) {
            console.error('Tab container bulunamadı');
            return null;
        }
        
        // Tab container'ı temizle
        container.innerHTML = '';
        
        // Tab başlıkları
        const tabHeaders = document.createElement('div');
        tabHeaders.className = 'tab-headers';
        
        // Tab içeriği
        const tabContents = document.createElement('div');
        tabContents.className = 'tab-contents';
        
        // Tabları oluştur
        tabs.forEach((tab, index) => {
            // Tab başlığı
            const tabHeader = document.createElement('div');
            tabHeader.className = 'tab-header';
            tabHeader.textContent = tab.title;
            
            if (index === activeTab) {
                tabHeader.classList.add('active');
            }
            
            tabHeader.addEventListener('click', () => {
                // Aktif tab'ı değiştir
                const currentActive = tabHeaders.querySelector('.tab-header.active');
                if (currentActive) {
                    currentActive.classList.remove('active');
                }
                tabHeader.classList.add('active');
                
                // İçeriği güncelle
                const currentContent = tabContents.querySelector('.tab-content.active');
                if (currentContent) {
                    currentContent.classList.remove('active');
                }
                tabContents.children[index].classList.add('active');
                
                // Değişim callback'i
                if (typeof onChange === 'function') {
                    onChange(index, tab);
                }
            });
            
            tabHeaders.appendChild(tabHeader);
            
            // Tab içeriği
            const tabContent = document.createElement('div');
            tabContent.className = 'tab-content';
            
            if (index === activeTab) {
                tabContent.classList.add('active');
            }
            
            if (typeof tab.content === 'string') {
                tabContent.innerHTML = tab.content;
            } else if (tab.content instanceof HTMLElement) {
                tabContent.appendChild(tab.content);
            }
            
            tabContents.appendChild(tabContent);
        });
        
        container.appendChild(tabHeaders);
        container.appendChild(tabContents);
        
        return {
            element: container,
            setActiveTab: (index) => {
                if (index >= 0 && index < tabs.length) {
                    tabHeaders.children[index].click();
                }
            }
        };
    }
}

// Global olarak erişim için
window.UI = new UIComponents();

// ES module uyumluluğu
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UI: window.UI };
}
