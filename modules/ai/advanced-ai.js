/**
 * Üretim verilerini zaman çerçevesine göre filtrele
 * @param {Array} production - Üretim listesi
 * @param {string} timeframe - Zaman çerçevesi
 * @returns {Array} Filtrelenmiş üretim verileri
 */
function filterProductionByTimeframe(production, timeframe) {
    const now = new Date();
    
    switch (timeframe) {
        case 'day':
            return production.filter(p => {
                if (!p.startDate && !p.endDate) return false;
                
                const startDate = p.startDate ? new Date(p.startDate?.toDate ? p.startDate.toDate() : p.startDate) : null;
                const endDate = p.endDate ? new Date(p.endDate?.toDate ? p.endDate.toDate() : p.endDate) : null;
                
                return (startDate && startDate.toDateString() === now.toDateString()) || 
                       (endDate && endDate.toDateString() === now.toDateString()) ||
                       (startDate && endDate && startDate <= now && endDate >= now);
            });
            
        case 'week':
            const oneWeekLater = new Date(now);
            oneWeekLater.setDate(now.getDate() + 7);
            
            return production.filter(p => {
                if (!p.startDate && !p.endDate) return false;
                
                const startDate = p.startDate ? new Date(p.startDate?.toDate ? p.startDate.toDate() : p.startDate) : null;
                const endDate = p.endDate ? new Date(p.endDate?.toDate ? p.endDate.toDate() : p.endDate) : null;
                
                return (startDate && startDate >= now && startDate <= oneWeekLater) || 
                       (endDate && endDate >= now && endDate <= oneWeekLater) ||
                       (startDate && endDate && startDate <= now && endDate >= oneWeekLater);
            });
            
        case 'month':
            const oneMonthLater = new Date(now);
            oneMonthLater.setMonth(now.getMonth() + 1);
            
            return production.filter(p => {
                if (!p.startDate && !p.endDate) return false;
                
                const startDate = p.startDate ? new Date(p.startDate?.toDate ? p.startDate.toDate() : p.startDate) : null;
                const endDate = p.endDate ? new Date(p.endDate?.toDate ? p.endDate.toDate() : p.endDate) : null;
                
                return (startDate && startDate >= now && startDate <= oneMonthLater) || 
                       (endDate && endDate >= now && endDate <= oneMonthLater) ||
                       (startDate && endDate && startDate <= now && endDate >= oneMonthLater);
            });
            
        default:
            return production;
    }
}

/**
 * Demo sipariş verileri
 * @returns {Array} Demo sipariş verileri
 */
function getDemoOrders() {
    // Tarihler
    const today = new Date();
    const past15Days = new Date(today);
    past15Days.setDate(today.getDate() - 15);
    
    const past30Days = new Date(today);
    past30Days.setDate(today.getDate() - 30);
    
    const future15Days = new Date(today);
    future15Days.setDate(today.getDate() + 15);
    
    const future30Days = new Date(today);
    future30Days.setDate(today.getDate() + 30);
    
    return [
        {
            id: 'order-1',
            orderNo: '24-03-A001',
            customer: 'AYEDAŞ',
            cellType: 'RM 36 LB',
            cellCount: 3,
            missingMaterials: 0,
            orderDate: past30Days,
            deliveryDate: future15Days,
            status: 'production',
            hasWarning: true
        },
        {
            id: 'order-2',
            orderNo: '24-03-B002',
            customer: 'BAŞKENT EDAŞ',
            cellType: 'RM 36 FL',
            cellCount: 5,
            missingMaterials: 2,
            orderDate: past30Days,
            deliveryDate: past15Days, // Gecikmiş teslimat
            status: 'waiting',
            hasMaterialIssue: true
        },
        {
            id: 'order-3',
            orderNo: '24-03-C003',
            customer: 'ENERJİSA',
            cellType: 'RM 36 CB',
            cellCount: 4,
            missingMaterials: 0,
            orderDate: past30Days,
            deliveryDate: future30Days,
            status: 'ready'
        },
        {
            id: 'order-4',
            orderNo: '24-04-D004',
            customer: 'TOROSLAR EDAŞ',
            cellType: 'RM 36 LB',
            cellCount: 8,
            missingMaterials: 0,
            orderDate: past15Days,
            deliveryDate: future30Days,
            status: 'planning'
        },
        {
            id: 'order-5',
            orderNo: '24-04-E005',
            customer: 'AYEDAŞ',
            cellType: 'RM 36 CB',
            cellCount: 6,
            missingMaterials: 0,
            orderDate: past15Days,
            deliveryDate: future30Days,
            status: 'planning'
        }
    ];
}

/**
 * Demo malzeme verileri
 * @returns {Array} Demo malzeme verileri
 */
function getDemoMaterials() {
    // Tarihler
    const today = new Date();
    const future7Days = new Date(today);
    future7Days.setDate(today.getDate() + 7);
    
    const future14Days = new Date(today);
    future14Days.setDate(today.getDate() + 14);
    
    const future2Days = new Date(today);
    future2Days.setDate(today.getDate() + 2);
    
    const past2Days = new Date(today);
    past2Days.setDate(today.getDate() - 2);
    
    return [
        {
            id: 'material-1',
            name: 'Koruma Rölesi',
            code: 'Siemens 7SR1003-1JA20-2DA0+ZY20',
            stock: 5,
            minStock: 2,
            supplier: 'Siemens',
            inStock: true
        },
        {
            id: 'material-2',
            name: 'Kesici',
            code: 'ESİTAŞ KAP-80/190-115',
            stock: 3,
            minStock: 1,
            supplier: 'Esitaş',
            inStock: true
        },
        {
            id: 'material-3',
            name: 'Kablo Başlıkları',
            code: 'M480TB/G-027-95.300UN5',
            stock: 0,
            minStock: 5,
            supplier: 'Euromold',
            inStock: false,
            orderNo: '24-03-B002',
            orderId: 'order-2',
            expectedSupplyDate: future7Days,
            orderNeedDate: past2Days // Kritik gecikme: Tedarik tarihi ihtiyaç tarihinden sonra
        },
        {
            id: 'material-4',
            name: 'Gerilim Gösterge',
            code: 'OVI+S (10nf)',
            stock: 0,
            minStock: 3,
            supplier: 'Elektra',
            inStock: false,
            orderNo: '24-03-B002',
            orderId: 'order-2',
            expectedSupplyDate: future2Days,
            orderNeedDate: future7Days
        },
        {
            id: 'material-5',
            name: 'Ayırıcı Motor',
            code: 'M: 24 VDC B: 24 VDC',
            stock: 10,
            minStock: 4,
            supplier: 'Siemens',
            inStock: true
        }
    ];
}

/**
 * Demo üretim verileri
 * @returns {Array} Demo üretim verileri
 */
function getDemoProduction() {
    // Tarihler
    const today = new Date();
    const past7Days = new Date(today);
    past7Days.setDate(today.getDate() - 7);
    
    const past14Days = new Date(today);
    past14Days.setDate(today.getDate() - 14);
    
    const future7Days = new Date(today);
    future7Days.setDate(today.getDate() + 7);
    
    const future14Days = new Date(today);
    future14Days.setDate(today.getDate() + 14);
    
    const future21Days = new Date(today);
    future21Days.setDate(today.getDate() + 21);
    
    return [
        {
            id: 'production-1',
            orderNo: '24-03-A001',
            orderId: 'order-1',
            startDate: past7Days,
            endDate: future7Days,
            status: 'active',
            progress: 60,
            isDelayed: false,
            stages: [
                {
                    name: 'Malzeme Hazırlık',
                    status: 'completed',
                    startDate: past7Days,
                    endDate: past7Days
                },
                {
                    name: 'Kablo Montajı',
                    status: 'completed',
                    startDate: past7Days,
                    endDate: today
                },
                {
                    name: 'Panel Montajı',
                    status: 'active',
                    startDate: today,
                    endDate: future7Days
                },
                {
                    name: 'Test',
                    status: 'waiting',
                    startDate: future7Days,
                    endDate: future7Days
                }
            ]
        },
        {
            id: 'production-2',
            orderNo: '24-03-B002',
            orderId: 'order-2',
            startDate: past14Days,
            endDate: past7Days, // Bitiş tarihi geçmiş
            status: 'active',
            progress: 45,
            isDelayed: true, // Gecikmeli üretim
            delayReason: 'Malzeme tedarik gecikmesi',
            stages: [
                {
                    name: 'Malzeme Hazırlık',
                    status: 'delayed',
                    startDate: past14Days,
                    endDate: past7Days
                },
                {
                    name: 'Kablo Montajı',
                    status: 'active',
                    startDate: past7Days,
                    endDate: today
                },
                {
                    name: 'Panel Montajı',
                    status: 'waiting',
                    startDate: null,
                    endDate: null
                },
                {
                    name: 'Test',
                    status: 'waiting',
                    startDate: null,
                    endDate: null
                }
            ]
        },
        {
            id: 'production-3',
            orderNo: '24-03-C003',
            orderId: 'order-3',
            startDate: future7Days,
            endDate: future21Days,
            status: 'waiting',
            progress: 0,
            isDelayed: false
        }
    ];
}

/**
 * Demo müşteri verileri
 * @returns {Array} Demo müşteri verileri
 */
function getDemoCustomers() {
    return [
        {
            id: 'customer-1',
            name: 'AYEDAŞ',
            contact: 'Ahmet Yılmaz',
            email: 'ahmet@ayedas.com.tr',
            phone: '0212 555 11 22'
        },
        {
            id: 'customer-2',
            name: 'ENERJİSA',
            contact: 'Mehmet Kaya',
            email: 'mehmet@enerjisa.com.tr',
            phone: '0216 333 44 55'
        },
        {
            id: 'customer-3',
            name: 'BAŞKENT EDAŞ',
            contact: 'Ayşe Demir',
            email: 'ayse@baskentedas.com.tr',
            phone: '0312 444 77 88'
        },
        {
            id: 'customer-4',
            name: 'TOROSLAR EDAŞ',
            contact: 'Fatma Şahin',
            email: 'fatma@toroslar.com.tr',
            phone: '0322 666 99 00'
        }
    ];
}

// Ana işlevleri dışa aktar
window.initAIAssistant = initAIAssistant;
window.toggleAIAssistant = toggleAIAssistant;
window.sendAIQuery = sendAIQuery;
window.refreshAssistantDataCache = refreshAssistantDataCache;

// Sayfa yüklendiğinde asistanı başlat
document.addEventListener('DOMContentLoaded', function() {
    // Asistanı başlat
    if (typeof initAIAssistant === 'function') {
        setTimeout(() => {
            initAIAssistant();
        }, 1000);
    }
});

// Orijinal chatbot fonksiyonunu geçersiz kıl
window.sendChatMessage = sendAIQuery;

/**
 * advanced-ai.js
 * Gelişmiş Yapay Zeka ve NLP destekli asistan işlevleri
 */

// AI Asistanı için global durum değişkenleri
const aiAssistantState = {
    isProcessing: false,
    lastQuery: null,
    context: {},
    conversation: [],
    dataCache: {
        orders: null,
        materials: null,
        production: null,
        customers: null
    },
    lastUpdate: null
};

/**
 * Chatbot'u başlat ve gerekli verileri yükle
 */
function initAIAssistant() {
    console.log("Yapay Zeka Asistanı başlatılıyor...");
    
    // Chatbot arayüzünü iyileştir
    enhanceChatbotUI();
    
    // İlk veri önbelleğini oluştur
    refreshAssistantDataCache();
    
    // Chatbot penceresini göster/gizle olayını bağla
    const chatbotTrigger = document.querySelector('.chatbot-trigger');
    if (chatbotTrigger) {
        chatbotTrigger.addEventListener('click', toggleAIAssistant);
    }
    
    // Chatbot mesaj gönderme olayını bağla
    const chatbotSend = document.querySelector('.chatbot-send');
    if (chatbotSend) {
        chatbotSend.addEventListener('click', sendAIQuery);
    }
    
    // Enter tuşu ile mesaj gönderme
    const chatbotInput = document.getElementById('chatbot-input');
    if (chatbotInput) {
        chatbotInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendAIQuery();
            }
        });
    }
    
    // Chatbot penceresini kapatma olayını bağla
    const chatbotClose = document.querySelector('.chatbot-close');
    if (chatbotClose) {
        chatbotClose.addEventListener('click', toggleAIAssistant);
    }
    
    // Karşılama mesajını göster
    setTimeout(() => {
        displayWelcomeMessage();
    }, 500);
    
    // Veri değişikliklerini dinle
    listenToDataChanges();
    
    console.log("Yapay Zeka Asistanı başlatıldı");
}

/**
 * Chatbot arayüzünü iyileştir ve bilgi göstergesi ekle
 */
function enhanceChatbotUI() {
    // Chatbot penceresine bilgi göstergesi ekle
    const chatbotWindow = document.getElementById('chatbot-window');
    if (!chatbotWindow) return;
    
    // AI Yeteneği göstergesi
    const aiCapabilityBadge = document.createElement('div');
    aiCapabilityBadge.className = 'ai-capability-badge';
    aiCapabilityBadge.style.position = 'absolute';
    aiCapabilityBadge.style.top = '10px';
    aiCapabilityBadge.style.right = '40px';
    aiCapabilityBadge.style.backgroundColor = '#1e40af';
    aiCapabilityBadge.style.color = 'white';
    aiCapabilityBadge.style.fontSize = '10px';
    aiCapabilityBadge.style.padding = '2px 6px';
    aiCapabilityBadge.style.borderRadius = '10px';
    aiCapabilityBadge.textContent = 'Yapay Zeka';
    
    const chatbotHeader = chatbotWindow.querySelector('.chatbot-header');
    if (chatbotHeader) {
        chatbotHeader.style.position = 'relative';
        chatbotHeader.appendChild(aiCapabilityBadge);
        
        // Asistan başlığını güncelle
        const chatbotTitle = chatbotHeader.querySelector('.chatbot-title span');
        if (chatbotTitle) {
            chatbotTitle.textContent = 'Akıllı Asistan';
        }
    }
    
    // Öneri kümeleri ekleyin
    const chatbotBody = document.getElementById('chatbot-body');
    if (chatbotBody) {
        chatbotBody.style.paddingBottom = '65px'; // Öneriler için yer açın
    }
    
    // Öneriler bölümü
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.id = 'ai-suggestions';
    suggestionsContainer.style.position = 'absolute';
    suggestionsContainer.style.bottom = '65px';
    suggestionsContainer.style.left = '0';
    suggestionsContainer.style.right = '0';
    suggestionsContainer.style.padding = '10px 15px';
    suggestionsContainer.style.backgroundColor = '#f8fafc';
    suggestionsContainer.style.borderTop = '1px solid #e2e8f0';
    suggestionsContainer.style.display = 'flex';
    suggestionsContainer.style.flexWrap = 'wrap';
    suggestionsContainer.style.gap = '8px';
    suggestionsContainer.style.overflowX = 'auto';
    suggestionsContainer.style.whiteSpace = 'nowrap';
    suggestionsContainer.style.maxHeight = '60px';
    
    // Örnek öneriler
    const suggestions = [
        'Aktif siparişler',
        'Malzeme durumu',
        'Geciken işler',
        'Üretim planı',
        'Aylık rapor'
    ];
    
    suggestions.forEach(suggestion => {
        const chip = document.createElement('button');
        chip.className = 'suggestion-chip';
        chip.textContent = suggestion;
        chip.style.backgroundColor = '#e2e8f0';
        chip.style.color = '#1e40af';
        chip.style.border = 'none';
        chip.style.borderRadius = '16px';
        chip.style.padding = '6px 12px';
        chip.style.fontSize = '12px';
        chip.style.cursor = 'pointer';
        chip.style.whiteSpace = 'nowrap';
        
        chip.addEventListener('click', () => {
            document.getElementById('chatbot-input').value = suggestion;
            sendAIQuery();
        });
        
        suggestionsContainer.appendChild(chip);
    });
    
    chatbotWindow.appendChild(suggestionsContainer);
    
    // Giriş metni alanını genişletin ve içeriğine göre büyüyüp küçülmesini sağlayın
    const chatbotInput = document.getElementById('chatbot-input');
    if (chatbotInput) {
        chatbotInput.style.minHeight = '24px';
        chatbotInput.style.maxHeight = '80px';
        chatbotInput.style.resize = 'none';
        chatbotInput.placeholder = 'Sipariş durumu, üretim planı, malzeme vb. sorgulayın...';
        
        // Metin alanını bir textarea'ya dönüştürün
        const textarea = document.createElement('textarea');
        textarea.id = 'chatbot-input';
        textarea.className = 'chatbot-input';
        textarea.placeholder = 'Sipariş durumu, üretim planı, malzeme vb. sorgulayın...';
        textarea.style.flex = '1';
        textarea.style.minHeight = '24px';
        textarea.style.maxHeight = '80px';
        textarea.style.resize = 'none';
        textarea.style.padding = '0.75rem 1rem';
        textarea.style.border = '1px solid var(--border)';
        textarea.style.borderRadius = '0.375rem';
        textarea.style.fontSize = '0.875rem';
        textarea.style.overflow = 'auto';
        
        // Otomatik boyutlandırma için olay dinleyicisi
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(80, this.scrollHeight) + 'px';
        });
        
        // Enter ile gönderme (Shift+Enter ile yeni satır)
        textarea.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendAIQuery();
            }
        });
        
        // Eski input alanını değiştirin
        chatbotInput.parentNode.replaceChild(textarea, chatbotInput);
    }
}

/**
 * Hoş geldin mesajını göster
 */
function displayWelcomeMessage() {
    const chatBody = document.getElementById('chatbot-body');
    if (!chatBody) return;
    
    // Eski mesajları temizle
    chatBody.innerHTML = '';
    
    // Karşılama mesajı
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'chat-message bot';
    welcomeMessage.innerHTML = `
        <p>Merhaba! Ben ElektroTrack'in yapay zeka destekli asistanıyım. Size şu konularda yardımcı olabilirim:</p>
        <ul style="margin-top: 8px; margin-left: 20px; list-style-type: disc;">
            <li>Sipariş durumları ve detayları</li>
            <li>Malzeme tedarik takibi</li>
            <li>Üretim planlaması ve gecikme riskleri</li>
            <li>Raporlama ve analizler</li>
            <li>Optimizasyon önerileri</li>
        </ul>
        <p style="margin-top: 8px;">Sorularınızı doğal dilde sorabilirsiniz. Örneğin: <em>"24-03-B002 siparişinin durumu nedir?"</em> veya <em>"Bu ay teslim edilecek siparişler hangileri?"</em></p>
    `;
    
    chatBody.appendChild(welcomeMessage);
    
    // Örnek önerileri güncelle
    updateSuggestions([
        'Aktif siparişler neler?',
        'Malzeme eksikleri',
        'Geciken işler hangileri?',
        'Bu ay teslim edilecekler',
        'Üretim optimizasyonu'
    ]);
}

/**
 * Öneri çiplerini güncelle
 * @param {Array} suggestions - Öneri metinleri dizisi
 */
function updateSuggestions(suggestions) {
    const suggestionsContainer = document.getElementById('ai-suggestions');
    if (!suggestionsContainer) return;
    
    // Mevcut önerileri temizle
    suggestionsContainer.innerHTML = '';
    
    // Yeni önerileri ekle
    suggestions.forEach(suggestion => {
        const chip = document.createElement('button');
        chip.className = 'suggestion-chip';
        chip.textContent = suggestion;
        chip.style.backgroundColor = '#e2e8f0';
        chip.style.color = '#1e40af';
        chip.style.border = 'none';
        chip.style.borderRadius = '16px';
        chip.style.padding = '6px 12px';
        chip.style.fontSize = '12px';
        chip.style.cursor = 'pointer';
        chip.style.whiteSpace = 'nowrap';
        
        chip.addEventListener('click', () => {
            document.getElementById('chatbot-input').value = suggestion;
            sendAIQuery();
        });
        
        suggestionsContainer.appendChild(chip);
    });
}

/**
 * Veri değişikliklerini dinle
 */
function listenToDataChanges() {
    // Sayfa değişikliği olayını dinle
    document.addEventListener('pageChanged', function(event) {
        // Veri önbelleğini yenile
        refreshAssistantDataCache();
    });
    
    // Dashboard verilerini güncelleme olayını dinle
    document.addEventListener('dashboardDataUpdated', function(event) {
        refreshAssistantDataCache();
    });
    
    // Sipariş verisi değişikliği olayını dinle
    document.addEventListener('orderDataChanged', function(event) {
        // Sipariş verilerini yenile
        loadOrdersData().then(orders => {
            aiAssistantState.dataCache.orders = orders;
        });
    });
    
    // Malzeme verisi değişikliği olayını dinle
    document.addEventListener('materialsDataChanged', function(event) {
        // Malzeme verilerini yenile
        loadMaterialsData().then(materials => {
            aiAssistantState.dataCache.materials = materials;
        });
    });
}

/**
 * AI Asistanı için tüm veri önbelleğini yenile
 */
async function refreshAssistantDataCache() {
    console.log("AI Asistanı veri önbelleği yenileniyor...");
    
    try {
        // Paralel veri yükleme
        const [orders, materials, production, customers] = await Promise.all([
            loadOrdersData(),
            loadMaterialsData(),
            loadProductionData(),
            loadCustomersData()
        ]);
        
        // Verileri önbelleğe kaydet
        aiAssistantState.dataCache = {
            orders,
            materials,
            production,
            customers
        };
        
        // Son güncelleme zamanını kaydet
        aiAssistantState.lastUpdate = new Date();
        
        console.log("AI Asistanı veri önbelleği güncellendi:", 
            orders?.length || 0, "sipariş,", 
            materials?.length || 0, "malzeme");
            
        // Veri güncellendiğini bildir
        document.dispatchEvent(new CustomEvent('aiDataCacheUpdated'));
        
        return aiAssistantState.dataCache;
    } catch (error) {
        console.error("AI Asistanı veri önbelleği yenilenemedi:", error);
        return null;
    }
}

/**
 * Sipariş verilerini yükle
 * @returns {Promise<Array>} Sipariş verileri
 */
async function loadOrdersData() {
    try {
        // Firebase Firestore varsa
        if (firebase && firebase.firestore) {
            const ordersRef = firebase.firestore().collection('orders');
            const snapshot = await ordersRef.get();
            
            if (snapshot.empty) {
                return getDemoOrders();
            }
            
            const orders = [];
            snapshot.forEach(doc => {
                orders.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return orders;
        } else {
            // Firebase yoksa demo verilerini kullan
            return getDemoOrders();
        }
    } catch (error) {
        console.error("Sipariş verileri yüklenemedi:", error);
        return getDemoOrders();
    }
}

/**
 * Malzeme verilerini yükle
 * @returns {Promise<Array>} Malzeme verileri
 */
async function loadMaterialsData() {
    try {
        // Firebase Firestore varsa
        if (firebase && firebase.firestore) {
            const materialsRef = firebase.firestore().collection('materials');
            const snapshot = await materialsRef.get();
            
            if (snapshot.empty) {
                return getDemoMaterials();
            }
            
            const materials = [];
            snapshot.forEach(doc => {
                materials.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return materials;
        } else {
            // Firebase yoksa demo verilerini kullan
            return getDemoMaterials();
        }
    } catch (error) {
        console.error("Malzeme verileri yüklenemedi:", error);
        return getDemoMaterials();
    }
}

/**
 * Üretim verilerini yükle
 * @returns {Promise<Object>} Üretim verileri
 */
async function loadProductionData() {
    try {
        // Firebase Firestore varsa
        if (firebase && firebase.firestore) {
            const productionRef = firebase.firestore().collection('production');
            const snapshot = await productionRef.get();
            
            if (snapshot.empty) {
                return getDemoProduction();
            }
            
            const production = [];
            snapshot.forEach(doc => {
                production.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return production;
        } else {
            // Firebase yoksa demo verilerini kullan
            return getDemoProduction();
        }
    } catch (error) {
        console.error("Üretim verileri yüklenemedi:", error);
        return getDemoProduction();
    }
}

/**
 * Müşteri verilerini yükle
 * @returns {Promise<Array>} Müşteri verileri
 */
async function loadCustomersData() {
    try {
        // Firebase Firestore varsa
        if (firebase && firebase.firestore) {
            const customersRef = firebase.firestore().collection('customers');
            const snapshot = await customersRef.get();
            
            if (snapshot.empty) {
                return getDemoCustomers();
            }
            
            const customers = [];
            snapshot.forEach(doc => {
                customers.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return customers;
        } else {
            // Firebase yoksa demo verilerini kullan
            return getDemoCustomers();
        }
    } catch (error) {
        console.error("Müşteri verileri yüklenemedi:", error);
        return getDemoCustomers();
    }
}

/**
 * AI Asistanı penceresini göster/gizle
 */
function toggleAIAssistant() {
    const chatbotWindow = document.getElementById('chatbot-window');
    if (chatbotWindow) {
        // Şu anki durumunu tersine çevir
        const isVisible = chatbotWindow.style.display === 'flex';
        
        if (isVisible) {
            // Chatbot penceresini gizle
            chatbotWindow.style.display = 'none';
        } else {
            // Chatbot penceresini göster
            chatbotWindow.style.display = 'flex';
            
            // Veri önbelleğini yenile (gerekliyse)
            if (!aiAssistantState.lastUpdate || 
                (new Date() - aiAssistantState.lastUpdate) > 5 * 60 * 1000) { // 5 dakikadan eski ise
                refreshAssistantDataCache();
            }
            
            // Input alanına odaklan
            document.getElementById('chatbot-input')?.focus();
        }
    }
}

/**
 * AI asistanına sorgu gönder
 */
async function sendAIQuery() {
    const chatInput = document.getElementById('chatbot-input');
    if (!chatInput) return;
    
    const query = chatInput.value.trim();
    if (!query) return;
    
    // İşlem durumunu güncelle
    aiAssistantState.isProcessing = true;
    aiAssistantState.lastQuery = query;
    
    // Kullanıcı mesajını ekle
    const chatBody = document.getElementById('chatbot-body');
    const userMessageElement = document.createElement('div');
    userMessageElement.className = 'chat-message user';
    userMessageElement.textContent = query;
    chatBody.appendChild(userMessageElement);
    
    // Input alanını temizle
    chatInput.value = '';
    chatInput.style.height = 'auto';
    
    // Scroll down
    chatBody.scrollTop = chatBody.scrollHeight;
    
    // Yükleniyor mesajı göster
    const loadingElement = document.createElement('div');
    loadingElement.className = 'chat-message bot';
    loadingElement.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    chatBody.appendChild(loadingElement);
    chatBody.scrollTop = chatBody.scrollHeight;
    
    try {
        // Sorgu işleme
        const response = await processAIQuery(query);
        
        // Yükleniyor mesajını kaldır
        chatBody.removeChild(loadingElement);
        
        // Yanıtı ekle
        const botMessageElement = document.createElement('div');
        botMessageElement.className = 'chat-message bot';
        
        // HTML içeriği varsa doğrudan yerleştir, yoksa metin olarak ekle
        if (response.includes('<') && response.includes('>')) {
            botMessageElement.innerHTML = response;
        } else {
            botMessageElement.textContent = response;
        }
        
        chatBody.appendChild(botMessageElement);
        
        // Konuşmaya ekle
        aiAssistantState.conversation.push({
            role: 'user',
            content: query
        }, {
            role: 'assistant',
            content: response
        });
        
        // Önerileri güncelle
        updateSuggestionsBasedOnQuery(query);
    } catch (error) {
        console.error("AI sorgu işleme hatası:", error);
        
        // Yükleniyor mesajını kaldır
        chatBody.removeChild(loadingElement);
        
        // Hata mesajı ekle
        const errorElement = document.createElement('div');
        errorElement.className = 'chat-message bot';
        errorElement.textContent = 'Üzgünüm, sorunuzu işlerken bir hata oluştu. Lütfen tekrar deneyin.';
        chatBody.appendChild(errorElement);
    } finally {
        // İşlem durumunu güncelle
        aiAssistantState.isProcessing = false;
        
        // Scroll down
        chatBody.scrollTop = chatBody.scrollHeight;
    }
}

/**
 * AI sorgusunu işle ve yanıt oluştur
 * @param {string} query - Kullanıcı sorgusu
 * @returns {Promise<string>} AI yanıtı
 */
async function processAIQuery(query) {
    console.log("İşleniyor:", query);
    
    // Veri önbelleği dolu mu kontrol et
    if (!aiAssistantState.dataCache.orders || 
        !aiAssistantState.dataCache.materials) {
        await refreshAssistantDataCache();
    }
    
    // Sorgu anahtar kelimeleri ve konusu analizi
    const queryInfo = analyzeQuery(query);
    console.log("Sorgu analizi:", queryInfo);
    
    // Yanıt oluştur
    let response = '';
    
    switch (queryInfo.topic) {
        case 'order':
            response = await generateOrderResponse(query, queryInfo);
            break;
        case 'material':
            response = await generateMaterialResponse(query, queryInfo);
            break;
        case 'production':
            response = await generateProductionResponse(query, queryInfo);
            break;
        case 'report':
            response = await generateReportResponse(query, queryInfo);
            break;
        case 'optimization':
            response = await generateOptimizationResponse(query, queryInfo);
            break;
        case 'general':
        default:
            response = await generateGeneralResponse(query, queryInfo);
    }
    
    // Demo sistemlerde işleme gecikmesi simülasyonu (500-1500ms)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    return response;
}

/**
 * Malzeme ile ilgili yanıt oluştur
 * @param {string} query - Kullanıcı sorgusu
 * @param {Object} queryInfo - Sorgu analiz bilgisi
 * @returns {Promise<string>} Oluşturulan yanıt
 */
async function generateMaterialResponse(query, queryInfo) {
    // Veri önbelleğinden malzemeleri al
    const materials = aiAssistantState.dataCache.materials || [];
    
    // Eksik malzemeler sorgusu
    if (query.toLowerCase().includes('eksik') || query.toLowerCase().includes('stokta olmayan')) {
        const missingMaterials = materials.filter(m => !m.inStock);
        
        if (missingMaterials.length === 0) {
            return "Şu anda eksik malzeme bulunmamaktadır. Tüm malzemeler stokta mevcut.";
        }
        
        return generateMissingMaterialsResponse(missingMaterials);
    }
    
    // Sipariş numarası bazlı sorgu
    if (queryInfo.orderNumber) {
        const orderMaterials = materials.filter(m => m.orderNo === queryInfo.orderNumber);
        
        if (orderMaterials.length === 0) {
            return `"${queryInfo.orderNumber}" numaralı sipariş için malzeme bilgisi bulunamadı.`;
        }
        
        return generateOrderMaterialsResponse(orderMaterials, queryInfo.orderNumber);
    }
    
    // Genel malzeme durumu
    const totalMaterials = materials.length;
    const inStockMaterials = materials.filter(m => m.inStock).length;
    const missingMaterials = materials.filter(m => !m.inStock).length;
    
    // Kritik stok seviyesinin altında olanlar
    const criticalMaterials = materials.filter(m => m.stock < m.minStock);
    
    // Yanıt oluştur
    let response = `<strong>Malzeme Durumu Özeti:</strong><br><br>`;
    
    response += `- Toplam malzeme: ${totalMaterials}<br>`;
    response += `- Stokta mevcut: ${inStockMaterials}<br>`;
    
    if (missingMaterials > 0) {
        response += `- Eksik malzeme: <span style="color: #ef4444;">${missingMaterials}</span><br>`;
    }
    
    if (criticalMaterials.length > 0) {
        response += `- Kritik seviyede: <span style="color: #f59e0b;">${criticalMaterials.length}</span><br>`;
    }
    
    // Eksik malzemeler tablosu (en kritik 5 malzeme)
    if (missingMaterials > 0) {
        // Öncelik sırasına göre sırala
        const sortedMissingMaterials = [...materials]
            .filter(m => !m.inStock)
            .sort((a, b) => {
                // İlk önce kritiklik durumuna göre
                if (a.orderNeedDate && b.orderNeedDate) {
                    const aDate = new Date(a.orderNeedDate?.toDate ? a.orderNeedDate.toDate() : a.orderNeedDate);
                    const bDate = new Date(b.orderNeedDate?.toDate ? b.orderNeedDate.toDate() : b.orderNeedDate);
                    
                    return aDate - bDate;
                }
                
                if (a.orderNeedDate) return -1;
                if (b.orderNeedDate) return 1;
                
                return 0;
            });
        
        // En kritik 5 malzemeyi göster
        const topCriticalMaterials = sortedMissingMaterials.slice(0, 5);
        
        response += `<br><strong>Eksik Malzemeler:</strong><br><br>`;
        
        response += `<div style="overflow-x: auto;"><table style="width: 100%; border-collapse: collapse;">
            <tr style="background-color: #f8fafc;">
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Malzeme</th>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Sipariş No</th>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Tedarik Tarihi</th>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Öncelik</th>
            </tr>`;
        
        topCriticalMaterials.forEach(material => {
            // Öncelik belirleme
            let priority = 'Normal';
            let priorityColor = '#6b7280';
            
            if (material.expectedSupplyDate && material.orderNeedDate) {
                const supplyDate = new Date(material.expectedSupplyDate?.toDate ? material.expectedSupplyDate.toDate() : material.expectedSupplyDate);
                const needDate = new Date(material.orderNeedDate?.toDate ? material.orderNeedDate.toDate() : material.orderNeedDate);
                
                if (supplyDate > needDate) {
                    priority = 'Kritik';
                    priorityColor = '#ef4444';
                } else {
                    const today = new Date();
                    const daysToNeed = Math.floor((needDate - today) / (1000 * 60 * 60 * 24));
                    
                    if (daysToNeed <= 7) {
                        priority = 'Yüksek';
                        priorityColor = '#f59e0b';
                    }
                }
            }
            
            response += `<tr>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${material.name}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${material.orderNo || "-"}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${formatDate(material.expectedSupplyDate) || "Belirsiz"}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: ${priorityColor};">${priority}</td>
            </tr>`;
        });
        
        response += `</table></div>`;
        
        // Daha fazla malzeme varsa belirt
        if (missingMaterials > topCriticalMaterials.length) {
            response += `<br><em>...ve ${missingMaterials - topCriticalMaterials.length} eksik malzeme daha</em>`;
        }
        
        // Detaylı bilgi için öneri
        response += `<br><br>Daha detaylı bilgi için "eksik malzemeler" yazabilirsiniz.`;
    }
    
    return response;
}

/**
 * Eksik malzemeler yanıtı oluştur
 * @param {Array} materials - Eksik malzeme listesi
 * @returns {string} Oluşturulan yanıt
 */
function generateMissingMaterialsResponse(materials) {
    // Önceliğe göre sırala
    const sortedMaterials = [...materials].sort((a, b) => {
        // İlk önce kritiklik durumuna göre
        if (a.orderNeedDate && b.orderNeedDate) {
            const aDate = new Date(a.orderNeedDate?.toDate ? a.orderNeedDate.toDate() : a.orderNeedDate);
            const bDate = new Date(b.orderNeedDate?.toDate ? b.orderNeedDate.toDate() : b.orderNeedDate);
            
            return aDate - bDate;
        }
        
        if (a.orderNeedDate) return -1;
        if (b.orderNeedDate) return 1;
        
        return 0;
    });
    
    // Yanıt başlığı
    let response = `<strong>Eksik Malzemeler (${materials.length} adet):</strong><br><br>`;
    
    // Tablo oluştur
    response += `<div style="overflow-x: auto;"><table style="width: 100%; border-collapse: collapse;">
        <tr style="background-color: #f8fafc;">
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Malzeme</th>
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Kod</th>
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Sipariş No</th>
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Tedarikçi</th>
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Tedarik Tarihi</th>
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Öncelik</th>
        </tr>`;
    
    sortedMaterials.forEach(material => {
        // Öncelik belirleme
        let priority = 'Normal';
        let priorityColor = '#6b7280';
        let rowStyle = '';
        
        if (material.expectedSupplyDate && material.orderNeedDate) {
            const supplyDate = new Date(material.expectedSupplyDate?.toDate ? material.expectedSupplyDate.toDate() : material.expectedSupplyDate);
            const needDate = new Date(material.orderNeedDate?.toDate ? material.orderNeedDate.toDate() : material.orderNeedDate);
            
            if (supplyDate > needDate) {
                priority = 'Kritik';
                priorityColor = '#ef4444';
                rowStyle = 'background-color: #fff5f5;';
            } else {
                const today = new Date();
                const daysToNeed = Math.floor((needDate - today) / (1000 * 60 * 60 * 24));
                
                if (daysToNeed <= 7) {
                    priority = 'Yüksek';
                    priorityColor = '#f59e0b';
                    rowStyle = 'background-color: #fffbeb;';
                }
            }
        }
        
        response += `<tr style="${rowStyle}">
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${material.name}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${material.code || "-"}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${material.orderNo || "-"}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${material.supplier || "-"}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${formatDate(material.expectedSupplyDate) || "Belirsiz"}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: ${priorityColor};">${priority}</td>
        </tr>`;
    });
    
    response += `</table></div>`;
    
    // Öncelik dağılımı özeti
    const criticalCount = sortedMaterials.filter(m => {
        if (m.expectedSupplyDate && m.orderNeedDate) {
            const supplyDate = new Date(m.expectedSupplyDate?.toDate ? m.expectedSupplyDate.toDate() : m.expectedSupplyDate);
            const needDate = new Date(m.orderNeedDate?.toDate ? m.orderNeedDate.toDate() : m.orderNeedDate);
            
            return supplyDate > needDate;
        }
        return false;
    }).length;
    
    const highCount = sortedMaterials.filter(m => {
        if (m.expectedSupplyDate && m.orderNeedDate) {
            const supplyDate = new Date(m.expectedSupplyDate?.toDate ? m.expectedSupplyDate.toDate() : m.expectedSupplyDate);
            const needDate = new Date(m.orderNeedDate?.toDate ? m.orderNeedDate.toDate() : m.orderNeedDate);
            
            if (supplyDate > needDate) return false;
            
            const today = new Date();
            const daysToNeed = Math.floor((needDate - today) / (1000 * 60 * 60 * 24));
            
            return daysToNeed <= 7;
        }
        return false;
    }).length;
    
    response += `<br><strong>Öncelik Dağılımı:</strong><br>`;
    
    if (criticalCount > 0) {
        response += `- Kritik: <span style="color: #ef4444;">${criticalCount}</span><br>`;
    }
    
    if (highCount > 0) {
        response += `- Yüksek: <span style="color: #f59e0b;">${highCount}</span><br>`;
    }
    
    response += `- Normal: <span style="color: #6b7280;">${materials.length - criticalCount - highCount}</span><br>`;
    
    return response;
}

/**
 * Sipariş malzemeleri yanıtı oluştur
 * @param {Array} materials - Siparişe ait malzeme listesi
 * @param {string} orderNo - Sipariş numarası
 * @returns {string} Oluşturulan yanıt
 */
function generateOrderMaterialsResponse(materials, orderNo) {
    // Yanıt başlığı
    let response = `<strong>${orderNo} Sipariş Malzemeleri:</strong><br><br>`;
    
    // Malzeme durumu özeti
    const totalMaterials = materials.length;
    const inStockMaterials = materials.filter(m => m.inStock).length;
    const missingMaterials = materials.filter(m => !m.inStock).length;
    
    // Tamamlanma yüzdesi
    const completionPercentage = Math.round((inStockMaterials / totalMaterials) * 100) || 0;
    
    // İlerleme çubuğu
    const progressBarColor = completionPercentage < 60 ? '#ef4444' : completionPercentage < 90 ? '#f59e0b' : '#10b981';
    
    response += `<div style="margin-bottom: 15px;">
        <div style="margin-bottom: 5px; display: flex; justify-content: space-between;">
            <span>Malzeme Durumu: ${inStockMaterials}/${totalMaterials}</span>
            <span>${completionPercentage}%</span>
        </div>
        <div style="height: 8px; background-color: #e2e8f0; border-radius: 4px; overflow: hidden;">
            <div style="height: 100%; width: ${completionPercentage}%; background-color: ${progressBarColor};"></div>
        </div>
    </div>`;
    
    // Malzeme listesi tablosu
    response += `<div style="overflow-x: auto;"><table style="width: 100%; border-collapse: collapse;">
        <tr style="background-color: #f8fafc;">
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Malzeme</th>
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Kod</th>
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Durum</th>
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Tedarik Tarihi</th>
        </tr>`;
    
    materials.forEach(material => {
        const statusText = material.inStock ? 'Stokta' : 'Tedarik Edilecek';
        const statusColor = material.inStock ? '#10b981' : '#f59e0b';
        const rowStyle = material.inStock ? '' : (
            material.expectedSupplyDate && material.orderNeedDate && 
            new Date(material.expectedSupplyDate?.toDate ? material.expectedSupplyDate.toDate() : material.expectedSupplyDate) > 
            new Date(material.orderNeedDate?.toDate ? material.orderNeedDate.toDate() : material.orderNeedDate)
        ) ? 'background-color: #fff5f5;' : '';
        
        response += `<tr style="${rowStyle}">
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${material.name}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${material.code || "-"}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: ${statusColor};">${statusText}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${material.inStock ? '-' : (formatDate(material.expectedSupplyDate) || "Belirsiz")}</td>
        </tr>`;
    });
    
    response += `</table></div>`;
    
    // Kritik malzemeler uyarısı
    if (missingMaterials > 0) {
        const criticalMaterials = materials.filter(m => {
            if (!m.inStock && m.expectedSupplyDate && m.orderNeedDate) {
                const supplyDate = new Date(m.expectedSupplyDate?.toDate ? m.expectedSupplyDate.toDate() : m.expectedSupplyDate);
                const needDate = new Date(m.orderNeedDate?.toDate ? m.orderNeedDate.toDate() : m.orderNeedDate);
                
                return supplyDate > needDate;
            }
            return false;
        });
        
        if (criticalMaterials.length > 0) {
            response += `<br><div style="background-color: #fff5f5; padding: 12px; border-radius: 4px; border-left: 4px solid #ef4444;">
                <strong style="color: #ef4444;">⚠️ Kritik Uyarı:</strong> ${criticalMaterials.length} adet malzemenin tedarik tarihi, ihtiyaç tarihinden sonra. Bu durum siparişin teslim tarihinde gecikmeye yol açabilir.
            </div>`;
        }
    }
    
    return response;
}

/**
 * Üretim ile ilgili yanıt oluştur
 * @param {string} query - Kullanıcı sorgusu
 * @param {Object} queryInfo - Sorgu analiz bilgisi
 * @returns {Promise<string>} Oluşturulan yanıt
 */
async function generateProductionResponse(query, queryInfo) {
    // Veri önbelleğinden üretim verilerini al
    const production = aiAssistantState.dataCache.production || [];
    const orders = aiAssistantState.dataCache.orders || [];
    
    // Sipariş numarası bazlı sorgu
    if (queryInfo.orderNumber) {
        const orderProduction = production.find(p => p.orderNo === queryInfo.orderNumber);
        const order = orders.find(o => o.orderNo === queryInfo.orderNumber);
        
        if (!orderProduction) {
            if (order && order.status === 'planning') {
                return `"${queryInfo.orderNumber}" numaralı sipariş henüz planlama aşamasında. Üretim planı oluşturulmamış.`;
            }
            
            return `"${queryInfo.orderNumber}" numaralı sipariş için üretim bilgisi bulunamadı.`;
        }
        
        return generateOrderProductionResponse(orderProduction, order);
    }
    
    // Üretim planı genel sorgu
    if (query.toLowerCase().includes('plan') || query.toLowerCase().includes('çizelge')) {
        return generateProductionPlanResponse(production, orders, queryInfo);
    }
    
    // Aktif üretimler sorgusu
    const activeProduction = production.filter(p => p.status === 'active');
    
    if (activeProduction.length === 0) {
        return "Şu anda aktif üretimde sipariş bulunmamaktadır.";
    }
    
    return generateActiveProductionResponse(activeProduction, orders);
}

/**
 * Sipariş üretim yanıtı oluştur
 * @param {Object} production - Siparişe ait üretim verisi
 * @param {Object} order - Sipariş verisi
 * @returns {string} Oluşturulan yanıt
 */
function generateOrderProductionResponse(production, order) {
    // Siparişin durumunu kontrol et
    const statusDesc = {
        'planning': 'Planlama aşamasında',
        'waiting': 'Malzeme tedariki bekleniyor',
        'production': 'Üretim aşamasında',
        'ready': 'Üretime hazır',
        'testing': 'Test aşamasında',
        'completed': 'Tamamlanmış'
    };
    
    // Yanıt oluştur
    let response = `<strong>${production.orderNo}</strong> numaralı sipariş `;
    
    if (order) {
        response += `<strong>${statusDesc[order.status] || "Bilinmeyen durumda"}</strong>.`;
    } else {
        response += `<strong>${production.status === 'active' ? 'Üretim aşamasında' : 'Planlama aşamasında'}</strong>.`;
    }
    
    // Üretim tarihleri
    response += `<br><br><strong>Üretim Bilgileri:</strong><br>`;
    response += `- Planlanan başlangıç: ${formatDate(production.startDate)}<br>`;
    response += `- Planlanan bitiş: ${formatDate(production.endDate)}<br>`;
    
    // İlerleme bilgisi
    const progress = production.progress || 0;
    
    // İlerleme çubuğu
    const progressBarColor = progress < 30 ? '#ef4444' : progress < 70 ? '#f59e0b' : '#10b981';
    
    response += `<br><div style="margin-bottom: 15px;">
        <div style="margin-bottom: 5px; display: flex; justify-content: space-between;">
            <span>İlerleme Durumu</span>
            <span>${progress}%</span>
        </div>
        <div style="height: 8px; background-color: #e2e8f0; border-radius: 4px; overflow: hidden;">
            <div style="height: 100%; width: ${progress}%; background-color: ${progressBarColor};"></div>
        </div>
    </div>`;
    
    // Üretim aşamaları
    if (production.stages && production.stages.length > 0) {
        response += `<br><strong>Üretim Aşamaları:</strong><br><br>`;
        
        response += `<div style="overflow-x: auto;"><table style="width: 100%; border-collapse: collapse;">
            <tr style="background-color: #f8fafc;">
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Aşama</th>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Durum</th>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Başlangıç</th>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Bitiş</th>
            </tr>`;
        
        production.stages.forEach(stage => {
            let statusText = 'Bekliyor';
            let statusColor = '#6b7280';
            
            if (stage.status === 'completed') {
                statusText = 'Tamamlandı';
                statusColor = '#10b981';
            } else if (stage.status === 'active') {
                statusText = 'Devam Ediyor';
                statusColor = '#3b82f6';
            } else if (stage.status === 'delayed') {
                statusText = 'Gecikme';
                statusColor = '#ef4444';
            }
            
            response += `<tr>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${stage.name}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: ${statusColor};">${statusText}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${formatDate(stage.startDate) || "-"}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${formatDate(stage.endDate) || "-"}</td>
            </tr>`;
        });
        
        response += `</table></div>`;
    }
    
    // Gecikme bildirimi
    if (production.isDelayed) {
        response += `<br><div style="background-color: #fff5f5; padding: 12px; border-radius: 4px; border-left: 4px solid #ef4444;">
            <strong style="color: #ef4444;">⚠️ Gecikme Bildirimi:</strong> Bu siparişin üretiminde gecikme yaşanmaktadır. ${production.delayReason || ""}
        </div>`;
    }
    
    // Malzeme bilgisi
    if (order && order.status === 'waiting') {
        response += `<br><div style="background-color: #fffbeb; padding: 12px; border-radius: 4px; border-left: 4px solid #f59e0b;">
            <strong style="color: #f59e0b;">⚠️ Malzeme Bekleniyor:</strong> Bu sipariş için bazı malzemeler tedarik sürecindedir. Üretim, tüm malzemeler temin edildikten sonra başlayacaktır.
        </div>`;
    }
    
    return response;
}

/**
 * Üretim planı yanıtı oluştur
 * @param {Array} production - Üretim verileri
 * @param {Array} orders - Sipariş verileri
 * @param {Object} queryInfo - Sorgu analiz bilgisi
 * @returns {string} Oluşturulan yanıt
 */
function generateProductionPlanResponse(production, orders, queryInfo) {
    // Tarihe göre sırala
    const sortedProduction = [...production].sort((a, b) => {
        const aDate = new Date(a.startDate?.toDate ? a.startDate.toDate() : a.startDate);
        const bDate = new Date(b.startDate?.toDate ? b.startDate.toDate() : b.startDate);
        
        return aDate - bDate;
    });
    
    // Zaman filtresi
    let filteredProduction = sortedProduction;
    
    if (queryInfo.timeframe) {
        const now = new Date();
        
        switch(queryInfo.timeframe) {
            case 'day':
                filteredProduction = sortedProduction.filter(p => {
                    const startDate = new Date(p.startDate?.toDate ? p.startDate.toDate() : p.startDate);
                    const endDate = new Date(p.endDate?.toDate ? p.endDate.toDate() : p.endDate);
                    
                    return startDate.toDateString() === now.toDateString() || 
                           endDate.toDateString() === now.toDateString() ||
                           (startDate <= now && endDate >= now);
                });
                break;
            case 'week':
                const oneWeekLater = new Date(now);
                oneWeekLater.setDate(now.getDate() + 7);
                
                filteredProduction = sortedProduction.filter(p => {
                    const startDate = new Date(p.startDate?.toDate ? p.startDate.toDate() : p.startDate);
                    const endDate = new Date(p.endDate?.toDate ? p.endDate.toDate() : p.endDate);
                    
                    return (startDate >= now && startDate <= oneWeekLater) || 
                           (endDate >= now && endDate <= oneWeekLater) ||
                           (startDate <= now && endDate >= oneWeekLater);
                });
                break;
            case 'month':
                const oneMonthLater = new Date(now);
                oneMonthLater.setMonth(now.getMonth() + 1);
                
                filteredProduction = sortedProduction.filter(p => {
                    const startDate = new Date(p.startDate?.toDate ? p.startDate.toDate() : p.startDate);
                    const endDate = new Date(p.endDate?.toDate ? p.endDate.toDate() : p.endDate);
                    
                    return (startDate >= now && startDate <= oneMonthLater) || 
                           (endDate >= now && endDate <= oneMonthLater) ||
                           (startDate <= now && endDate >= oneMonthLater);
                });
                break;
        }
    }
}

/**
 * Kullanıcı sorgusunu analiz et
 * @param {string} query - Kullanıcı sorgusu
 * @returns {Object} Sorgu analiz sonucu
 */
function analyzeQuery(query) {
    // Sorguyu küçük harfe çevir
    const lowerQuery = query.toLowerCase();
    
    // Anahtar kelimeler için Türkçe kelime grupları
    const keywords = {
        order: ['sipariş', 'siparişler', 'siparis', 'iş', 'müşteri', 'sipariş no', 'sipariş numarası'],
        material: ['malzeme', 'stok', 'tedarik', 'malzemeler', 'eksik', 'temin'],
        production: ['üretim', 'planlama', 'plan', 'üretim planı', 'imalat', 'montaj', 'test'],
        status: ['durum', 'durumu', 'ne durumda', 'aşama', 'safha', 'hangi aşamada'],
        delay: ['gecikme', 'geç', 'bekleyen', 'geciken', 'ertelenen', 'gecikmeli'],
        report: ['rapor', 'analiz', 'raporla', 'aylık', 'haftalık', 'günlük', 'istatistik'],
        optimization: ['optimizasyon', 'öneri', 'tavsiye', 'iyileştirme', 'iyileştir']
    };
    
    // Sipariş numarası formatı (24-03-A001 gibi)
    const orderNumberPattern = /\d{2}-\d{2}-[A-Za-z]\d{3}/;
    const orderNumberMatch = query.match(orderNumberPattern);
    const orderNumber = orderNumberMatch ? orderNumberMatch[0] : null;
    
    // Müşteri ismi kontrolü
    const customerNames = ['AYEDAŞ', 'ENERJİSA', 'BAŞKENT EDAŞ', 'TOROSLAR EDAŞ'];
    const customerMatch = customerNames.find(name => lowerQuery.includes(name.toLowerCase()));
    const customer = customerMatch || null;
    
    // Gecikme sorgusunda mı?
    const isDelayQuery = keywords.delay.some(keyword => lowerQuery.includes(keyword));
    
    // Durum sorgusunda mı?
    const isStatusQuery = keywords.status.some(keyword => lowerQuery.includes(keyword));
    
    // Tarih bilgisi var mı?
    const datePatterns = [
        /bugün/i, /yarın/i, /dün/i,
        /bu (hafta|ay|yıl)/i, /geçen (hafta|ay|yıl)/i, /gelecek (hafta|ay|yıl)/i,
        /(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})/  // DD/MM/YYYY veya benzer formatlar
    ];
    const dateMatch = datePatterns.some(pattern => pattern.test(lowerQuery));
    
    // Ana konu belirleme
    let topic = 'general';
    
    if (keywords.order.some(keyword => lowerQuery.includes(keyword)) || orderNumber) {
        topic = 'order';
    } else if (keywords.material.some(keyword => lowerQuery.includes(keyword))) {
        topic = 'material';
    } else if (keywords.production.some(keyword => lowerQuery.includes(keyword))) {
        topic = 'production';
    } else if (keywords.report.some(keyword => lowerQuery.includes(keyword))) {
        topic = 'report';
    } else if (keywords.optimization.some(keyword => lowerQuery.includes(keyword))) {
        topic = 'optimization';
    }
    
    // Zaman çerçevesi belirleme
    let timeframe = null;
    
    if (lowerQuery.includes('bu ay') || lowerQuery.includes('aylık')) {
        timeframe = 'month';
    } else if (lowerQuery.includes('bu hafta') || lowerQuery.includes('haftalık')) {
        timeframe = 'week';
    } else if (lowerQuery.includes('bu yıl') || lowerQuery.includes('yıllık')) {
        timeframe = 'year';
    } else if (lowerQuery.includes('bugün') || lowerQuery.includes('günlük')) {
        timeframe = 'day';
    } else if (lowerQuery.includes('3 aylık') || lowerQuery.includes('çeyrek')) {
        timeframe = 'quarter';
    } else if (lowerQuery.includes('6 aylık') || lowerQuery.includes('yarıyıl')) {
        timeframe = 'half-year';
    }
    
    // Rapor analizi
    const isReportRequest = keywords.report.some(keyword => lowerQuery.includes(keyword));
    
    return {
        topic,
        orderNumber,
        customer,
        isDelayQuery,
        isStatusQuery,
        isReportRequest,
        hasDateInfo: dateMatch,
        timeframe,
        originalQuery: query
    };
}

/**
 * Sipariş ile ilgili yanıt oluştur
 * @param {string} query - Kullanıcı sorgusu
 * @param {Object} queryInfo - Sorgu analiz bilgisi
 * @returns {Promise<string>} Oluşturulan yanıt
 */
async function generateOrderResponse(query, queryInfo) {
    // Veri önbelleğinden siparişleri al
    const orders = aiAssistantState.dataCache.orders || [];
    
    // Belirli bir sipariş numarası sorgulanıyorsa
    if (queryInfo.orderNumber) {
        const order = orders.find(o => o.orderNo === queryInfo.orderNumber);
        
        if (!order) {
            return `"${queryInfo.orderNumber}" numaralı sipariş bulunamadı. Lütfen sipariş numarasını kontrol ediniz.`;
        }
        
        // Durum sorgusu ise durum bilgisine odaklan
        if (queryInfo.isStatusQuery) {
            return generateOrderStatusResponse(order);
        }
        
        // Genel sipariş detayları
        return generateOrderDetailsResponse(order);
    }
    
    // Müşteri bazlı sorgu
    if (queryInfo.customer) {
        const customerOrders = orders.filter(o => o.customer?.toLowerCase() === queryInfo.customer.toLowerCase());
        
        if (customerOrders.length === 0) {
            return `${queryInfo.customer} müşterisine ait sipariş bulunamadı.`;
        }
        
        // Gecikme sorgusu
        if (queryInfo.isDelayQuery) {
            const delayedOrders = customerOrders.filter(o => isOrderDelayed(o));
            
            if (delayedOrders.length === 0) {
                return `${queryInfo.customer} müşterisine ait geciken sipariş bulunmamaktadır.`;
            }
            
            return generateDelayedOrdersResponse(delayedOrders, queryInfo.customer);
        }
        
        // Müşterinin siparişlerini listele
        return generateCustomerOrdersResponse(customerOrders);
    }
    
    // Gecikmeli siparişler sorgusu
    if (queryInfo.isDelayQuery) {
        const delayedOrders = orders.filter(o => isOrderDelayed(o));
        
        if (delayedOrders.length === 0) {
            return "Şu anda geciken sipariş bulunmamaktadır.";
        }
        
        return generateDelayedOrdersResponse(delayedOrders);
    }
    
    // Aktif siparişler için genel sorgu
    const activeOrders = orders.filter(o => o.status !== 'completed');
    
    if (activeOrders.length === 0) {
        return "Şu anda aktif sipariş bulunmamaktadır.";
    }
    
    return generateActiveOrdersResponse(activeOrders, queryInfo);
}

/**
 * Sipariş durumu yanıtı oluştur
 * @param {Object} order - Sipariş verisi
 * @returns {string} Oluşturulan yanıt
 */
function generateOrderStatusResponse(order) {
    // Durum açıklamaları
    const statusDesc = {
        'planning': 'Planlama aşamasında',
        'waiting': 'Malzeme tedariki bekleniyor',
        'production': 'Üretim aşamasında',
        'ready': 'Üretime hazır',
        'testing': 'Test aşamasında',
        'completed': 'Tamamlanmış'
    };
    
    // Durum metni
    const statusText = statusDesc[order.status] || 'Bilinmeyen durum';
    
    // Eksik malzeme durumu
    const hasMissingMaterials = order.hasMaterialIssue || false;
    
    // Malzemeleri kontrol et
    const materials = aiAssistantState.dataCache.materials || [];
    const orderMaterials = materials.filter(m => m.orderId === order.id);
    const missingMaterials = orderMaterials.filter(m => !m.inStock);
    
    // Yanıt oluştur
    let response = `<strong>${order.orderNo}</strong> numaralı ${order.customer} siparişi <strong>${statusText}</strong>.`;
    
    // İlerleyiş bilgisi
    if (order.status === 'production') {
        response += ` Üretim ilerleyişi: ${order.progress || "Bilinmiyor"}`;
    }
    
    // Teslim tarihi
    if (order.deliveryDate) {
        const deliveryDate = formatDate(order.deliveryDate);
        response += `<br><br>Planlanan teslim tarihi: <strong>${deliveryDate}</strong>`;
    }
    
    // Eksik malzeme durumu
    if (hasMissingMaterials || missingMaterials.length > 0) {
        response += `<br><br>⚠️ <strong>Dikkat:</strong> Bu siparişte eksik malzeme bulunmaktadır.`;
        
        if (missingMaterials.length > 0) {
            response += `<br>Eksik malzemeler:<ul>`;
            missingMaterials.forEach(material => {
                response += `<li>${material.name}</li>`;
            });
            response += `</ul>`;
        }
    }
    
    // Sipariş notları
    if (order.notes && order.notes.length > 0) {
        response += `<br><br>📝 <strong>Sipariş notları:</strong><br>`;
        order.notes.slice(0, 2).forEach(note => {
            response += `- ${note.content}<br>`;
        });
        
        if (order.notes.length > 2) {
            response += `<em>...ve ${order.notes.length - 2} not daha</em>`;
        }
    }
    
    return response;
}

/**
 * Sipariş detayları yanıtı oluştur
 * @param {Object} order - Sipariş verisi
 * @returns {string} Oluşturulan yanıt
 */
function generateOrderDetailsResponse(order) {
    // Durum açıklamaları
    const statusDesc = {
        'planning': 'Planlama aşamasında',
        'waiting': 'Malzeme tedariki bekleniyor',
        'production': 'Üretim aşamasında',
        'ready': 'Üretime hazır',
        'testing': 'Test aşamasında',
        'completed': 'Tamamlanmış'
    };
    
    // Durum metni
    const statusText = statusDesc[order.status] || 'Bilinmeyen durum';
    
    // Malzemeleri kontrol et
    const materials = aiAssistantState.dataCache.materials || [];
    const orderMaterials = materials.filter(m => m.orderId === order.id);
    const missingMaterials = orderMaterials.filter(m => !m.inStock);
    
    // Yanıt oluştur
    let response = `<div style="border-left: 4px solid #1e40af; padding-left: 10px;">
        <h3 style="margin: 0 0 10px 0;">${order.orderNo} - ${order.customer}</h3>
        <p><strong>Durum:</strong> ${statusText}</p>
        <p><strong>Hücre Tipi:</strong> ${order.cellType || "Belirtilmemiş"}</p>
        <p><strong>Hücre Sayısı:</strong> ${order.cellCount || "Belirtilmemiş"}</p>
        <p><strong>Sipariş Tarihi:</strong> ${formatDate(order.orderDate)}</p>
        <p><strong>Planlanan Teslim:</strong> ${formatDate(order.deliveryDate)}</p>
    </div>`;
    
    // Eksik malzeme durumu
    if (missingMaterials.length > 0) {
        response += `<br><div style="background-color: #fff8e1; padding: 10px; border-radius: 4px; margin-top: 10px;">
            <p><strong>⚠️ Eksik Malzemeler:</strong></p>
            <ul style="margin: 5px 0;">`;
        
        missingMaterials.forEach(material => {
            response += `<li>${material.name}`;
            
            if (material.expectedSupplyDate) {
                response += ` - Beklenen tedarik: ${formatDate(material.expectedSupplyDate)}`;
            }
            
            response += `</li>`;
        });
        
        response += `</ul></div>`;
    }
    
    // Üretim bilgisi
    const production = aiAssistantState.dataCache.production || [];
    const orderProduction = production.find(p => p.orderId === order.id);
    
    if (orderProduction) {
        response += `<br><div style="background-color: #e1f5fe; padding: 10px; border-radius: 4px; margin-top: 10px;">
            <p><strong>🏭 Üretim Bilgisi:</strong></p>
            <p>Planlanan başlangıç: ${formatDate(orderProduction.startDate)}</p>
            <p>Planlanan bitiş: ${formatDate(orderProduction.endDate)}</p>
            <p>İlerleme: ${orderProduction.progress || "0"}%</p>
        </div>`;
    }
    
    return response;
}

/**
 * Aktif siparişler yanıtı oluştur
 * @param {Array} orders - Sipariş listesi
 * @param {Object} queryInfo - Sorgu analiz bilgisi
 * @returns {string} Oluşturulan yanıt
 */
function generateActiveOrdersResponse(orders, queryInfo) {
    // Zaman filtreleme
    let filteredOrders = orders;
    
    if (queryInfo.timeframe) {
        const now = new Date();
        
        switch(queryInfo.timeframe) {
            case 'day':
                filteredOrders = orders.filter(o => {
                    const orderDate = new Date(o.orderDate?.toDate ? o.orderDate.toDate() : o.orderDate);
                    return orderDate.toDateString() === now.toDateString();
                });
                break;
            case 'week':
                const oneWeekAgo = new Date(now);
                oneWeekAgo.setDate(now.getDate() - 7);
                
                filteredOrders = orders.filter(o => {
                    const orderDate = new Date(o.orderDate?.toDate ? o.orderDate.toDate() : o.orderDate);
                    return orderDate >= oneWeekAgo;
                });
                break;
            case 'month':
                const oneMonthAgo = new Date(now);
                oneMonthAgo.setMonth(now.getMonth() - 1);
                
                filteredOrders = orders.filter(o => {
                    const orderDate = new Date(o.orderDate?.toDate ? o.orderDate.toDate() : o.orderDate);
                    return orderDate >= oneMonthAgo;
                });
                break;
            // Diğer zaman dilimleri için benzer filtreler ekleyebilirsiniz
        }
    }
    
    // Duruma göre sırala
    const sortedOrders = [...filteredOrders].sort((a, b) => {
        // Önce geciken siparişler
        const aIsDelayed = isOrderDelayed(a);
        const bIsDelayed = isOrderDelayed(b);
        
        if (aIsDelayed && !bIsDelayed) return -1;
        if (!aIsDelayed && bIsDelayed) return 1;
        
        // Sonra teslim tarihine göre sırala
        const aDate = new Date(a.deliveryDate?.toDate ? a.deliveryDate.toDate() : a.deliveryDate);
        const bDate = new Date(b.deliveryDate?.toDate ? b.deliveryDate.toDate() : b.deliveryDate);
        
        return aDate - bDate;
    });
    
    // En fazla 5 sipariş göster
    const displayOrders = sortedOrders.slice(0, 5);
    
    // Yanıt oluştur
    let response = `<strong>Aktif Siparişler (${filteredOrders.length} adet):</strong><br><br>`;
    
    response += `<div style="overflow-x: auto;"><table style="width: 100%; border-collapse: collapse;">
        <tr style="background-color: #f8fafc;">
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Sipariş No</th>
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Müşteri</th>
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Durum</th>
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Teslim</th>
        </tr>`;
    
    displayOrders.forEach(order => {
        // Durum renkleri
        const statusColors = {
            'planning': '#6b7280',
            'waiting': '#f59e0b',
            'production': '#3b82f6',
            'ready': '#10b981',
            'testing': '#8b5cf6',
            'completed': '#1f2937'
        };
        
        // Durum açıklamaları
        const statusDesc = {
            'planning': 'Planlama',
            'waiting': 'Malzeme Bekleniyor',
            'production': 'Üretimde',
            'ready': 'Hazır',
            'testing': 'Test',
            'completed': 'Tamamlandı'
        };
        
        const isDelayed = isOrderDelayed(order);
        const rowStyle = isDelayed ? 'background-color: #fff5f5;' : '';
        
        response += `<tr style="${rowStyle}">
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${order.orderNo}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${order.customer}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">
                <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; background-color: ${statusColors[order.status] || '#6b7280'}; color: white;">
                    ${statusDesc[order.status] || 'Bilinmiyor'}
                </span>
                ${isDelayed ? ' <span style="color: #ef4444; font-size: 12px;">&#9888; Gecikme</span>' : ''}
            </td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${formatDate(order.deliveryDate)}</td>
        </tr>`;
    });
    
    response += `</table></div>`;
    
    // Daha fazla sipariş olduğunu belirt
    if (filteredOrders.length > displayOrders.length) {
        response += `<br><em>...ve ${filteredOrders.length - displayOrders.length} sipariş daha</em>`;
    }
    
    // Gecikme özeti
    const delayedOrders = filteredOrders.filter(o => isOrderDelayed(o));
    
    if (delayedOrders.length > 0) {
        response += `<br><br>⚠️ <strong>${delayedOrders.length} sipariş gecikmiş durumda.</strong> Daha detaylı bilgi için "geciken siparişler" yazabilirsiniz.`;
    }
    
    return response;
}

/**
 * Gecikmiş siparişler yanıtı oluştur
 * @param {Array} orders - Gecikmiş sipariş listesi
 * @param {string} customer - Müşteri adı (opsiyonel)
 * @returns {string} Oluşturulan yanıt
 */
function generateDelayedOrdersResponse(orders, customer = null) {
    // Müşteri filtresi varsa uygula
    let filteredOrders = orders;
    if (customer) {
        filteredOrders = orders.filter(o => o.customer === customer);
    }
    
    // Teslim tarihine göre sırala
    const sortedOrders = [...filteredOrders].sort((a, b) => {
        const aDate = new Date(a.deliveryDate?.toDate ? a.deliveryDate.toDate() : a.deliveryDate);
        const bDate = new Date(b.deliveryDate?.toDate ? b.deliveryDate.toDate() : b.deliveryDate);
        
        return aDate - bDate;
    });
    
    // Başlık
    let response = customer 
        ? `<strong>${customer} Müşterisine Ait Geciken Siparişler (${filteredOrders.length} adet):</strong><br><br>`
        : `<strong>Geciken Siparişler (${filteredOrders.length} adet):</strong><br><br>`;
    
    // Tablo oluştur
    response += `<div style="overflow-x: auto;"><table style="width: 100%; border-collapse: collapse;">
        <tr style="background-color: #f8fafc;">
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Sipariş No</th>
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Müşteri</th>
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Teslim Tarihi</th>
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Gecikme</th>
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Durum</th>
        </tr>`;
    
    sortedOrders.forEach(order => {
        // Durum açıklamaları
        const statusDesc = {
            'planning': 'Planlama',
            'waiting': 'Malzeme Bekleniyor',
            'production': 'Üretimde',
            'ready': 'Hazır',
            'testing': 'Test',
            'completed': 'Tamamlandı'
        };
        
        // Gecikme süresini hesapla
        const deliveryDate = new Date(order.deliveryDate?.toDate ? order.deliveryDate.toDate() : order.deliveryDate);
        const today = new Date();
        const delayDays = Math.floor((today - deliveryDate) / (1000 * 60 * 60 * 24));
        
        // Gecikme sebebi
        let delayReason = '';
        if (order.status === 'waiting') {
            delayReason = 'Malzeme tedarik sorunu';
        } else if (order.status === 'production') {
            delayReason = 'Üretim gecikmesi';
        } else {
            delayReason = 'Belirtilmemiş';
        }
        
        response += `<tr style="background-color: #fff5f5;">
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${order.orderNo}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${order.customer}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${formatDate(order.deliveryDate)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #ef4444;"><strong>${delayDays} gün</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${statusDesc[order.status] || 'Bilinmiyor'}</td>
        </tr>`;
    });
    
    response += `</table></div>`;
    
    // Gecikme nedenleri özeti
    const waitingOrders = sortedOrders.filter(o => o.status === 'waiting').length;
    const productionOrders = sortedOrders.filter(o => o.status === 'production').length;
    
    response += `<br><strong>Gecikme Nedenleri:</strong><br>`;
    
    if (waitingOrders > 0) {
        response += `- Malzeme bekleniyor: ${waitingOrders} sipariş<br>`;
    }
    
    if (productionOrders > 0) {
        response += `- Üretim gecikmesi: ${productionOrders} sipariş<br>`;
    }
    
    return response;
}

/**
 * Müşteri siparişleri yanıtı oluştur
 * @param {Array} orders - Müşteriye ait sipariş listesi
 * @returns {string} Oluşturulan yanıt
 */
function generateCustomerOrdersResponse(orders) {
    const customer = orders[0].customer;
    
    // Teslim tarihine göre sırala
    const sortedOrders = [...orders].sort((a, b) => {
        const aDate = new Date(a.deliveryDate?.toDate ? a.deliveryDate.toDate() : a.deliveryDate);
        const bDate = new Date(b.deliveryDate?.toDate ? b.deliveryDate.toDate() : b.deliveryDate);
        
        return aDate - bDate;
    });
    
    // Yanıt başlığı
    let response = `<strong>${customer} Müşterisine Ait Siparişler (${orders.length} adet):</strong><br><br>`;
    
    // Tablo oluştur
    response += `<div style="overflow-x: auto;"><table style="width: 100%; border-collapse: collapse;">
        <tr style="background-color: #f8fafc;">
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Sipariş No</th>
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Hücre Tipi</th>
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Adet</th>
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Durum</th>
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Teslim</th>
        </tr>`;
    
    sortedOrders.forEach(order => {
        // Durum renkleri
        const statusColors = {
            'planning': '#6b7280',
            'waiting': '#f59e0b',
            'production': '#3b82f6',
            'ready': '#10b981',
            'testing': '#8b5cf6',
            'completed': '#1f2937'
        };
        
        // Durum açıklamaları
        const statusDesc = {
            'planning': 'Planlama',
            'waiting': 'Malzeme Bekleniyor',
            'production': 'Üretimde',
            'ready': 'Hazır',
            'testing': 'Test',
            'completed': 'Tamamlandı'
        };
        
        const isDelayed = isOrderDelayed(order);
        const rowStyle = isDelayed ? 'background-color: #fff5f5;' : '';
        
        response += `<tr style="${rowStyle}">
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${order.orderNo}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${order.cellType || "Belirtilmemiş"}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${order.cellCount || "1"}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">
                <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; background-color: ${statusColors[order.status] || '#6b7280'}; color: white;">
                    ${statusDesc[order.status] || 'Bilinmiyor'}
                </span>
                ${isDelayed ? ' <span style="color: #ef4444; font-size: 12px;">&#9888; Gecikme</span>' : ''}
            </td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${formatDate(order.deliveryDate)}</td>
        </tr>`;
    });
    
    response += `</table></div>`;
    
    // Özet bilgi
    const activeOrders = sortedOrders.filter(o => o.status !== 'completed').length;
    const delayedOrders = sortedOrders.filter(o => isOrderDelayed(o)).length;
    
    response += `<br><strong>Özet:</strong><br>`;
    response += `- Toplam sipariş: ${orders.length}<br>`;
    response += `- Aktif sipariş: ${activeOrders}<br>`;
    
    if (delayedOrders > 0) {
        response += `- Geciken sipariş: <span style="color: #ef4444;">${delayedOrders}</span><br>`;
    }
    
    return response;
}

/**
 * Advanced AI module
 */
function advancedAI() {
    console.log('Advanced AI module loaded.');
}