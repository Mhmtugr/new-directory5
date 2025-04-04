/**
 * chatbot.js
 * Mehmet Endüstriyel Takip Asistan Modülü
 */

import AppConfig from '../../config/app-config.js';
import EventBus from '../../utils/event-bus.js';
import Logger from '../../utils/logger.js';

class Chatbot {
    constructor() {
        this.isInitialized = false;
        this.isOpen = false;
        this.messageHistory = [];
        this.erpService = null;
        this.aiConnector = null;
        this.typing = false;
        this.lastUpdate = null;
        this.offlineResponses = {
            greeting: ["Merhaba! Size nasıl yardımcı olabilirim?", "Merhaba! Mehmet Endüstriyel Takip Asistanı olarak hizmetinizdeyim."],
            stockQuery: ["Stok bilgilerine şu anda çevrimdışı modda erişilemez. İnternet bağlantınızı kontrol edin.", "Üzgünüm, stok sorgulaması için internet bağlantısı gerekiyor."],
            orderQuery: ["Sipariş bilgilerine şu anda çevrimdışı modda sınırlı erişim var. Son bilinen veriler gösterilecek.", "Sipariş bilgileri için çevrimiçi olmak daha iyi olacaktır."],
            timeQuery: [`Şu anki tarih ve saat: ${new Date().toLocaleString('tr-TR')}`, "Size tarih ve saat bilgisini verebilirim."],
            unknownQuery: ["Üzgünüm, bu soruyu şu anda yanıtlayamıyorum.", "Bu konu hakkında daha fazla bilgi için çevrimiçi olmamız gerekebilir."]
        };
        
        // Chatbot DOM elementlerini oluştur
        this.createChatbotElements();
    }
    
    /**
     * Chatbot modülünü başlat
     * @param {Object} erpService - ERP servis nesnesi
     * @param {Object} aiConnector - AI bağlantı nesnesi
     */
    init(erpService, aiConnector = null) {
        if (this.isInitialized) return;
        
        this.erpService = erpService;
        this.aiConnector = aiConnector;
        
        // Event dinleyicileri
        this.setupEventListeners();
        
        // Yerel mesaj geçmişini yükle
        this.loadMessageHistory();
        
        // ERP olaylarını dinle
        this.setupERPEventListeners();
        
        this.isInitialized = true;
        Logger.info('Chatbot başlatıldı');
    }
    
    /**
     * Chatbot DOM elementlerini oluştur
     */
    createChatbotElements() {
        // Ana chatbot konteynerini bul
        this.chatbotContainer = document.querySelector('.ai-chatbot');
        
        if (!this.chatbotContainer) {
            Logger.error('Chatbot konteyneri bulunamadı');
            return;
        }
        
        // Chatbot penceresini oluştur
        const chatbotWindow = document.createElement('div');
        chatbotWindow.className = 'chatbot-window';
        chatbotWindow.innerHTML = `
            <div class="chatbot-header">
                <h5>M.E.T.S. Asistan</h5>
                <div class="chatbot-controls">
                    <button type="button" class="clear-chat" title="Sohbeti Temizle">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button type="button" class="close-chat" title="Kapat">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="chatbot-messages"></div>
            <div class="chatbot-typing">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
            <div class="chatbot-input-container">
                <input type="text" class="chatbot-input" placeholder="Sorunuzu yazın...">
                <button class="chatbot-send-btn">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        `;
        
        // Chatbot butonunu ve penceresini konteyner içine ekle
        this.chatbotContainer.appendChild(chatbotWindow);
        
        // Element referanslarını tut
        this.chatbotBtn = this.chatbotContainer.querySelector('.ai-chatbot-btn');
        this.chatbotWindow = this.chatbotContainer.querySelector('.chatbot-window');
        this.messagesContainer = this.chatbotContainer.querySelector('.chatbot-messages');
        this.inputField = this.chatbotContainer.querySelector('.chatbot-input');
        this.sendButton = this.chatbotContainer.querySelector('.chatbot-send-btn');
        this.clearButton = this.chatbotContainer.querySelector('.clear-chat');
        this.closeButton = this.chatbotContainer.querySelector('.close-chat');
        this.typingIndicator = this.chatbotContainer.querySelector('.chatbot-typing');
    }
    
    /**
     * Event dinleyicilerini ayarla
     */
    setupEventListeners() {
        // Chatbot butonuna tıklama
        this.chatbotBtn.addEventListener('click', () => this.toggleChatbot());
        
        // Mesaj gönderme butonuna tıklama
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Input alanında Enter tuşuna basma
        this.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        
        // Temizleme butonuna tıklama
        this.clearButton.addEventListener('click', () => this.clearChat());
        
        // Kapatma butonuna tıklama
        this.closeButton.addEventListener('click', () => this.toggleChatbot());
    }
    
    /**
     * ERP olaylarını dinle
     */
    setupERPEventListeners() {
        // Yeni sipariş olayını dinle
        EventBus.on('orderCreated', (data) => {
            if (!this.isOpen) {
                // Bildirim göster
                this.showNotification(`Yeni sipariş oluşturuldu: ${data.orderNumber}`);
            } else {
                // Otomatik mesaj ekle
                this.addBotMessage(`Yeni bir sipariş oluşturuldu: ${data.orderNumber}. Sipariş detaylarını görmek ister misiniz?`);
            }
        });
        
        // Stok uyarı olayını dinle
        EventBus.on('stockAlert', (data) => {
            if (!this.isOpen) {
                // Bildirim göster
                this.showNotification(`Stok uyarısı: ${data.materialCode} malzemesi kritik seviyede`);
            } else {
                // Otomatik mesaj ekle
                this.addBotMessage(`Stok uyarısı: ${data.materialCode} (${data.materialName}) malzemesi kritik seviyede. Güncel stok: ${data.currentStock} ${data.unit}`);
            }
        });
    }
    
    /**
     * Chatbot'u aç/kapat
     */
    toggleChatbot() {
        if (this.isOpen) {
            this.chatbotWindow.classList.remove('active');
            this.chatbotContainer.classList.remove('active');
        } else {
            this.chatbotWindow.classList.add('active');
            this.chatbotContainer.classList.add('active');
            this.inputField.focus();
            
            // İlk karşılama mesajını ekle
            if (this.messageHistory.length === 0) {
                this.addBotMessage(this.getOfflineResponse('greeting'));
            }
        }
        
        this.isOpen = !this.isOpen;
    }
    
    /**
     * Sohbeti temizle
     */
    clearChat() {
        this.messagesContainer.innerHTML = '';
        this.messageHistory = [];
        this.saveMessageHistory();
        this.addBotMessage(this.getOfflineResponse('greeting'));
    }
    
    /**
     * Kullanıcı mesajını gönder
     */
    sendMessage() {
        const message = this.inputField.value.trim();
        
        if (message === '') return;
        
        // Kullanıcı mesajını ekle
        this.addUserMessage(message);
        
        // Giriş alanını temizle
        this.inputField.value = '';
        
        // Yazıyor göstergesi göster
        this.showTypingIndicator();
        
        // Bot yanıtını oluştur
        this.generateBotResponse(message);
    }
    
    /**
     * Bot yanıtını oluştur
     * @param {string} userMessage Kullanıcı mesajı
     */
    async generateBotResponse(userMessage) {
        try {
            let response = '';
            
            // Sipariş takibi için sorgu mu?
            const orderQuery = this.detectOrderQuery(userMessage);
            if (orderQuery) {
                Logger.info(`Sipariş sorgusu algılandı: ${JSON.stringify(orderQuery)}`);
                
                if (orderQuery.orderId) {
                    // Belirli bir sipariş hakkında bilgi istenmiş
                    let orderInfo;
                    
                    if (this.erpService && typeof this.erpService.getOrderById === 'function') {
                        // ERP'den veri al
                        orderInfo = await this.erpService.getOrderById(orderQuery.orderId);
                    } else if (this.erpService && typeof this.erpService.getOrderData === 'function') {
                        // Tüm siparişleri al ve filtreleme yap
                        const allOrders = await this.erpService.getOrderData();
                        orderInfo = allOrders.find(order => {
                            // ID, orderNo veya orderID ile eşleştir
                            return (order.id === orderQuery.orderId || 
                                   order.orderId === orderQuery.orderId || 
                                   order.orderNo === orderQuery.orderId);
                        });
                    }
                    
                    if (orderInfo) {
                        // Siparişle ilgili kapsamlı bilgi formatla
                        response = this.formatDetailedOrderInfo(orderInfo);
                        
                        // Eğer özel soru sorduysa (örn: "teslimat tarihi ne zaman?")
                        if (orderQuery.specificQuestion) {
                            response += this.formatSpecificOrderInfo(orderInfo, orderQuery.specificQuestion);
                        }
                        
                        // Sipariş malzeme durumunu kontrol et
                        const materialStatus = await this.checkOrderMaterialStatus(orderInfo.id || orderInfo.orderId);
                        if (materialStatus) {
                            response += materialStatus;
                        }
                        
                        // Üretim durumunu kontrol et
                        const productionStatus = await this.checkOrderProductionStatus(orderInfo.id || orderInfo.orderId);
                        if (productionStatus) {
                            response += productionStatus;
                        }
                    } else {
                        response = `Üzgünüm, "${orderQuery.orderId}" numaralı sipariş bulunamadı. Lütfen doğru sipariş numarasını girdiğinizden emin olun.`;
                    }
                } else if (orderQuery.general) {
                    // Genel sipariş bilgisi istenmiş
                    response = await this.getGeneralOrdersInfo();
                } else if (orderQuery.status) {
                    // Belirli durumdaki siparişler istenmiş
                    response = await this.getOrdersByStatus(orderQuery.status);
                } else if (orderQuery.customer) {
                    // Belirli müşterinin siparişleri istenmiş
                    response = await this.getOrdersByCustomer(orderQuery.customer);
                } else if (orderQuery.delayed) {
                    // Geciken siparişler istenmiş
                    response = await this.getDelayedOrders();
                } else {
                    // Sipariş sorgusu anlaşılamadı
                    response = "Sipariş sorgunuzu tam olarak anlayamadım. Lütfen sipariş numarası belirterek tekrar sorun. Örneğin: 'SO-123456 siparişi ne durumda?'";
                }
            } 
            // Stok sorgusu mu?
            else if (userMessage.toLowerCase().includes('stok') || 
                userMessage.toLowerCase().includes('malzeme') ||
                userMessage.toLowerCase().includes('depo')) {
                response = await this.handleStockQuery(userMessage);
            } 
            // Üretim sorgusu mu?
            else if (userMessage.toLowerCase().includes('üretim') || 
                    userMessage.toLowerCase().includes('imalat') ||
                    userMessage.toLowerCase().includes('hücre')) {
                response = await this.handleProductionQuery(userMessage);
            }
            // Gecikme sorgusu mu?
            else if (userMessage.toLowerCase().includes('gecik') || 
                    userMessage.toLowerCase().includes('termin') ||
                    userMessage.toLowerCase().includes('teslimat')) {
                response = await this.handleDelayQuery(userMessage);
            }
            // Rapor sorgusu mu?
            else if (userMessage.toLowerCase().includes('rapor') || 
                    userMessage.toLowerCase().includes('analiz') ||
                    userMessage.toLowerCase().includes('özet')) {
                response = await this.handleReportQuery(userMessage);
            }
            // Birim sorgusu mu?
            else if (userMessage.toLowerCase().includes('birim') || 
                    userMessage.toLowerCase().includes('departman') ||
                    userMessage.toLowerCase().includes('ekip')) {
                response = await this.handleDepartmentQuery(userMessage);
            }
            // Yardım/Selamlama sorgusu mu?
            else if (userMessage.toLowerCase().includes('merhaba') || 
                    userMessage.toLowerCase().includes('selam') ||
                    userMessage.toLowerCase().includes('yardım') ||
                    userMessage.toLowerCase().includes('nasıl')) {
                response = this.getGreetingResponse();
            }
            // Çevrimdışı sunucu sorgusu veya AI kullanımı
            else {
                // Çevrimiçi bağlantı kontrol et
                if (!window.navigator.onLine) {
                    response = this.getOfflineResponse('unknownQuery');
                } else if (this.aiConnector && typeof this.aiConnector.query === 'function') {
                    // AI'ya sorguyu gönder
                    try {
                        const aiResponse = await this.aiConnector.query(userMessage, this.messageHistory);
                        response = aiResponse || "Üzgünüm, sorunuza şu anda yanıt veremiyorum.";
                    } catch (aiError) {
                        Logger.error(`AI yanıt hatası: ${aiError.message}`);
                        response = "Yapay zeka servisine bağlanırken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.";
                    }
                } else {
                    // Basit yanıt ver
                    response = "Üzgünüm, bu konuda size yardımcı olamıyorum. Sipariş, stok veya üretim durumu hakkında sorular sorabilirsiniz.";
                }
            }
            
            // Yanıtı ekle
            this.addBotMessage(response);
            
        } catch (error) {
            Logger.error(`Bot yanıtı oluşturma hatası: ${error.message}`, error);
            this.addBotMessage("Bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
        } finally {
            this.hideTypingIndicator();
        }
    }
    
    /**
     * Sipariş sorgularını algılayarak analiz eder
     * @param {string} message Kullanıcı mesajı
     * @returns {object|null} Sorgu detayları veya null
     */
    detectOrderQuery(message) {
        const lowerMessage = message.toLowerCase();
        
        // Sipariş ile ilgili anahtar kelimeler
        const orderKeywords = ['sipariş', 'order', 'sip', 'so-', 'so:'];
        
        if (!orderKeywords.some(keyword => lowerMessage.includes(keyword))) {
            return null; // Sipariş ile ilgili değil
        }
        
        // Sonuç nesnesi
        const result = {
            isOrderQuery: true
        };
        
        // Sipariş numarası ara
        // Formatları kapsayan regex: SO-123456, SO:123456, S-123, SO123456, vs.
        const orderNoRegex = /\b(?:so[-:]?|sip[-:]?|sipariş[-:]?|order[-:]?)(\d{3,8})\b/i;
        const orderNoMatch = lowerMessage.match(orderNoRegex);
        
        if (orderNoMatch) {
            result.orderId = orderNoMatch[1]; // Numara kısmını al
            
            // Siparişle ilgili özel soru tespit et
            if (lowerMessage.includes('termin') || lowerMessage.includes('teslimat')) {
                result.specificQuestion = 'delivery';
            } else if (lowerMessage.includes('durum') || lowerMessage.includes('aşama')) {
                result.specificQuestion = 'status';
            } else if (lowerMessage.includes('malzeme') || lowerMessage.includes('stok')) {
                result.specificQuestion = 'materials';
            } else if (lowerMessage.includes('üretim') || lowerMessage.includes('imalat')) {
                result.specificQuestion = 'production';
            } else if (lowerMessage.includes('müşteri') || lowerMessage.includes('alıcı')) {
                result.specificQuestion = 'customer';
            }
        } 
        // Belirli numarada sipariş yoksa genel sorgu olabilir
        else {
            // Genel sipariş sorgusu
            if (lowerMessage.includes('tüm') || lowerMessage.includes('bütün') || lowerMessage.includes('listele')) {
                result.general = true;
            }
            
            // Duruma göre sorgu
            if (lowerMessage.includes('bekle') || lowerMessage.includes('planning')) {
                result.status = 'planning';
            } else if (lowerMessage.includes('üretim') || lowerMessage.includes('production')) {
                result.status = 'production';
            } else if (lowerMessage.includes('tamamla') || lowerMessage.includes('completed')) {
                result.status = 'completed';
            } else if (lowerMessage.includes('iptal') || lowerMessage.includes('cancelled')) {
                result.status = 'cancelled';
            } else if (lowerMessage.includes('gecik') || lowerMessage.includes('delayed')) {
                result.delayed = true;
            }
            
            // Müşteriye göre sorgu
            const customerRegex = /(?:müşteri|alıcı|customer)[:\s]+([a-zçğıöşü\s]+)/i;
            const customerMatch = lowerMessage.match(customerRegex);
            if (customerMatch) {
                result.customer = customerMatch[1].trim();
            }
        }
        
        return result;
    }
    
    /**
     * Belirli bir sipariş için malzeme durumunu kontrol eder
     * @param {string} orderId Sipariş ID'si
     * @returns {string} Malzeme durumu açıklaması veya boş string
     */
    async checkOrderMaterialStatus(orderId) {
        try {
            if (!this.erpService || typeof this.erpService.getOrderMaterialStatus !== 'function') {
                return "";
            }
            
            const materialStatus = await this.erpService.getOrderMaterialStatus(orderId);
            
            if (!materialStatus) {
                return "";
            }
            
            let result = "\n\n📦 **Malzeme Durumu:**\n";
            
            // Özet bilgiler
            const availableCount = materialStatus.filter(m => m.status === 'available').length;
            const partialCount = materialStatus.filter(m => m.status === 'partial').length;
            const missingCount = materialStatus.filter(m => m.status === 'missing').length;
            const totalCount = materialStatus.length;
            
            result += `- Toplam ${totalCount} malzeme gerekli\n`;
            result += `- ${availableCount} malzeme stokta mevcut\n`;
            
            if (partialCount > 0) {
                result += `- ${partialCount} malzeme için kısmi stok var\n`;
            }
            
            if (missingCount > 0) {
                result += `- ${missingCount} malzeme stokta eksik\n`;
                
                // Eksik malzemelerin durumunu ekle
                const missingItems = materialStatus.filter(m => m.status === 'missing' || m.status === 'partial');
                
                if (missingItems.length > 0) {
                    result += "\n**Tedariki Beklenen Malzemeler:**\n";
                    
                    missingItems.forEach(item => {
                        const purchaseInfo = item.purchaseInfo || {};
                        const requiredQty = item.requiredQuantity || 0;
                        const availableQty = item.availableQuantity || 0;
                        const missingQty = Math.max(0, requiredQty - availableQty);
                        
                        result += `- ${item.name} (${missingQty} ${item.unit || 'adet'})`;
                        
                        if (purchaseInfo.status) {
                            result += `, Satın Alma Durumu: ${this.getPurchaseStatusText(purchaseInfo.status)}`;
                            
                            if (purchaseInfo.estimatedDelivery) {
                                const deliveryDate = new Date(purchaseInfo.estimatedDelivery);
                                result += `, Tahmini Teslimat: ${deliveryDate.toLocaleDateString('tr-TR')}`;
                            }
                        }
                        
                        result += "\n";
                    });
                }
            } else {
                result += "\n✅ Sipariş için tüm malzemeler hazır.";
            }
            
            return result;
            
        } catch (error) {
            Logger.error(`Sipariş malzeme durumu kontrol hatası: ${error.message}`, error);
            return "\n\n⚠️ Malzeme durumu kontrol edilirken bir hata oluştu.";
        }
    }
    
    /**
     * Belirli bir sipariş için üretim durumunu kontrol eder
     * @param {string} orderId Sipariş ID'si
     * @returns {string} Üretim durumu açıklaması veya boş string
     */
    async checkOrderProductionStatus(orderId) {
        try {
            if (!this.erpService || typeof this.erpService.getProductionData !== 'function') {
                return "";
            }
            
            const productionData = await this.erpService.getProductionData();
            
            if (!productionData || !Array.isArray(productionData)) {
                return "";
            }
            
            // Siparişle ilgili iş emirlerini bul
            const productionJobs = productionData.filter(job => 
                job.orderId === orderId ||
                job.orderNo === orderId ||
                job.orderNo === `SO-${orderId}` ||
                job.orderNo === `SO:${orderId}`
            );
            
            if (!productionJobs || productionJobs.length === 0) {
                return "\n\n🏭 **Üretim Durumu:**\n- Henüz üretim planı oluşturulmamış.";
            }
            
            let result = "\n\n🏭 **Üretim Durumu:**\n";
            
            // Üretim aşamaları sayısı
            const completedStages = productionJobs.filter(job => job.status === 'completed').length;
            const activeStages = productionJobs.filter(job => job.status === 'active').length;
            const pendingStages = productionJobs.filter(job => job.status === 'pending').length;
            const totalStages = productionJobs.length;
            
            // Yüzde hesapla
            const completionPercentage = Math.round((completedStages / totalStages) * 100);
            
            result += `- Genel İlerleme: %${completionPercentage}\n`;
            result += `- Tamamlanan Adımlar: ${completedStages}/${totalStages}\n`;
            
            if (activeStages > 0) {
                result += `- Devam Eden Adımlar: ${activeStages}\n`;
                
                // Aktif işleri ekle
                const activeJobs = productionJobs.filter(job => job.status === 'active');
                
                result += "\n**Şu Anda Devam Eden İşlemler:**\n";
                
                activeJobs.forEach(job => {
                    result += `- ${job.step || job.taskName || 'İş'}`;
                    
                    if (job.assignedTo) {
                        result += `, Sorumlu: ${job.assignedTo}`;
                    }
                    
                    if (job.unitId) {
                        result += `, Birim: ${this.getUnitName(job.unitId)}`;
                    }
                    
                    if (job.startTime) {
                        const startDate = new Date(job.startTime);
                        const daysPassed = Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24));
                        
                        if (daysPassed === 0) {
                            result += `, Bugün başladı`;
                        } else if (daysPassed === 1) {
                            result += `, Dün başladı`;
                        } else {
                            result += `, ${daysPassed} gün önce başladı`;
                        }
                    }
                    
                    result += "\n";
                });
            }
            
            if (pendingStages > 0) {
                result += `\n- Bekleyen Adımlar: ${pendingStages}\n`;
                
                // Bekleyen bir sonraki işlemi göster
                const nextJob = productionJobs.find(job => job.status === 'pending');
                
                if (nextJob) {
                    result += `\n**Sıradaki İşlem:** ${nextJob.step || nextJob.taskName || 'İş'}`;
                    
                    if (nextJob.unitId) {
                        result += `, Birim: ${this.getUnitName(nextJob.unitId)}`;
                    }
                    
                    if (nextJob.estimatedStartTime) {
                        const startDate = new Date(nextJob.estimatedStartTime);
                        result += `, Planlanan Başlangıç: ${startDate.toLocaleDateString('tr-TR')}`;
                    }
                }
            }
            
            // Tahmini tamamlanma zamanı
            if (activeStages > 0 || pendingStages > 0) {
                const lastJob = productionJobs[productionJobs.length - 1];
                
                if (lastJob && lastJob.endTime) {
                    const endDate = new Date(lastJob.endTime);
                    result += `\n\n**Tahmini Tamamlanma Tarihi:** ${endDate.toLocaleDateString('tr-TR')}`;
                    
                    // Gecikme kontrolü
                    const order = await this.erpService.getOrderById(orderId);
                    
                    if (order && order.deliveryDate) {
                        const deliveryDate = new Date(order.deliveryDate);
                        
                        if (endDate > deliveryDate) {
                            const daysLate = Math.ceil((endDate - deliveryDate) / (1000 * 60 * 60 * 24));
                            result += `\n⚠️ **Uyarı:** Üretim planlanan teslimat tarihinden ${daysLate} gün geç tamamlanacak.`;
                        } else {
                            result += `\n✅ Üretim planlanan teslimat tarihinden önce tamamlanacak.`;
                        }
                    }
                }
            }
            
            return result;
            
        } catch (error) {
            Logger.error(`Sipariş üretim durumu kontrol hatası: ${error.message}`, error);
            return "\n\n⚠️ Üretim durumu kontrol edilirken bir hata oluştu.";
        }
    }
    
    /**
     * Birim ID'sine göre birim adını döndürür
     * @param {string} unitId Birim ID'si
     * @returns {string} Birim adı
     */
    getUnitName(unitId) {
        const unitMap = {
            'elektrik_tasarim': 'Elektrik Tasarım',
            'mekanik_tasarim': 'Mekanik Tasarım',
            'satin_alma': 'Satın Alma',
            'mekanik_uretim': 'Mekanik Üretim',
            'ic_montaj': 'İç Montaj',
            'kablaj': 'Kablaj',
            'genel_montaj': 'Genel Montaj',
            'test': 'Test'
        };
        
        return unitMap[unitId] || unitId;
    }
    
    /**
     * Satın alma durumu koduna göre durumu döndürür
     * @param {string} status Durum kodu
     * @returns {string} Durum açıklaması
     */
    getPurchaseStatusText(status) {
        const statusMap = {
            'pending': 'Beklemede',
            'ordered': 'Sipariş Verildi',
            'partial': 'Kısmi Teslimat',
            'delivered': 'Teslim Alındı',
            'cancelled': 'İptal Edildi',
            'processing': 'İşlemde'
        };
        
        return statusMap[status] || status;
    }
    
    /**
     * Özel bir sipariş sorusuna göre bilgi formatlar
     * @param {object} order Sipariş bilgisi
     * @param {string} question Soru türü ('delivery', 'status', vs.)
     * @returns {string} Formatlanmış bilgi
     */
    formatSpecificOrderInfo(order, question) {
        let result = "";
        
        switch (question) {
            case 'delivery':
                result = "\n\n📅 **Teslimat Bilgileri:**\n";
                
                if (order.deliveryDate) {
                    const deliveryDate = new Date(order.deliveryDate);
                    const now = new Date();
                    const daysLeft = Math.ceil((deliveryDate - now) / (1000 * 60 * 60 * 24));
                    
                    result += `- Planlanan Teslimat Tarihi: ${deliveryDate.toLocaleDateString('tr-TR')}\n`;
                    
                    if (daysLeft > 0) {
                        result += `- Teslimata kalan süre: ${daysLeft} gün`;
                    } else if (daysLeft === 0) {
                        result += `- Teslimat bugün gerçekleşecek`;
                    } else {
                        result += `- Teslimat ${Math.abs(daysLeft)} gün geçti`;
                    }
                } else {
                    result += "Teslimat tarihi henüz belirlenmemiş.";
                }
                break;
                
            case 'status':
                result = "\n\n🚦 **Detaylı Durum Bilgileri:**\n";
                
                result += `- Mevcut Durum: ${this.getOrderStatusText(order)}\n`;
                
                if (order.status === 'planning') {
                    result += "- Sipariş planlama aşamasında, üretim süreci başlamadı.\n";
                } else if (order.status === 'production') {
                    result += "- Üretim süreci devam ediyor.\n";
                } else if (order.status === 'waiting') {
                    result += "- Sipariş üretim için beklemede.\n";
                } else if (order.status === 'delayed') {
                    result += "- Sipariş gecikmeli durumda.\n";
                    
                    if (order.delayReason) {
                        result += `- Gecikme Nedeni: ${order.delayReason}\n`;
                    }
                } else if (order.status === 'completed') {
                    result += "- Sipariş tamamlandı ve teslim edildi.\n";
                    
                    if (order.completionDate) {
                        const completionDate = new Date(order.completionDate);
                        result += `- Tamamlanma Tarihi: ${completionDate.toLocaleDateString('tr-TR')}\n`;
                    }
                }
                
                if (order.progress) {
                    result += `- Genel İlerleme: %${order.progress}\n`;
                }
                break;
                
            case 'materials':
                // Bu kısım checkOrderMaterialStatus tarafından daha detaylı işlenecek
                result = "\n\nMalzeme bilgileri ayrıca kontrol ediliyor...";
                break;
                
            case 'production':
                // Bu kısım checkOrderProductionStatus tarafından daha detaylı işlenecek
                result = "\n\nÜretim bilgileri ayrıca kontrol ediliyor...";
                break;
                
            case 'customer':
                result = "\n\n👤 **Müşteri Bilgileri:**\n";
                
                if (order.customer) {
                    result += `- Müşteri: ${order.customer}\n`;
                    
                    // Müşteri detayları varsa ekle
                    if (order.customerDetails) {
                        const details = order.customerDetails;
                        
                        if (details.contactPerson) {
                            result += `- İlgili Kişi: ${details.contactPerson}\n`;
                        }
                        
                        if (details.phone) {
                            result += `- Telefon: ${details.phone}\n`;
                        }
                        
                        if (details.email) {
                            result += `- E-posta: ${details.email}\n`;
                        }
                        
                        if (details.address) {
                            result += `- Adres: ${details.address}\n`;
                        }
                    }
                } else {
                    result += "Müşteri bilgisi bulunmamaktadır.";
                }
                break;
                
            default:
                // Özel soru türü tanımlanmamış
                result = "";
        }
        
        return result;
    }
    
    /**
     * Yazıyor göstergesini göster
     */
    showTypingIndicator() {
        this.typing = true;
        this.typingIndicator.classList.add('active');
    }
    
    /**
     * Yazıyor göstergesini gizle
     */
    hideTypingIndicator() {
        this.typing = false;
        this.typingIndicator.classList.remove('active');
    }
    
    /**
     * Mesaj alanını en alta kaydır
     */
    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
    
    /**
     * Mesaj geçmişine ekle
     * @param {string} sender - Gönderen ('user' veya 'bot')
     * @param {string} message - Mesaj
     */
    addToMessageHistory(sender, message) {
        const messageObj = {
            id: this.generateMessageId(),
            sender: sender,
            message: message,
            timestamp: new Date().toISOString()
        };
        
        this.messageHistory.push(messageObj);
        
        // Mesaj geçmişini sınırla (son 50 mesaj)
        if (this.messageHistory.length > 50) {
            this.messageHistory = this.messageHistory.slice(-50);
        }
        
        // Yerel depolamaya kaydet
        this.saveMessageHistory();
    }
    
    /**
     * Mesaj ID'si oluştur
     * @returns {string} - Mesaj ID'si
     */
    generateMessageId() {
        return `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
    
    /**
     * Mesaj geçmişini yerel depolamaya kaydet
     */
    saveMessageHistory() {
        window.Utils.LocalStorage.set('mets:chatHistory', this.messageHistory);
    }
    
    /**
     * Mesaj geçmişini yerel depolamadan yükle
     */
    loadMessageHistory() {
        const savedHistory = window.Utils.LocalStorage.get('mets:chatHistory', []);
        this.messageHistory = savedHistory;
        
        // Önceki mesajları ekrana yükle
        if (this.messageHistory.length > 0) {
            // Sadece son 10 mesajı göster
            const recentMessages = this.messageHistory.slice(-10);
            
            this.messagesContainer.innerHTML = '';
            
            recentMessages.forEach(msg => {
                if (msg.sender === 'user') {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'chat-message user-message';
                    messageDiv.textContent = msg.message;
                    
                    const timeDiv = document.createElement('div');
                    timeDiv.className = 'message-time';
                    timeDiv.textContent = new Date(msg.timestamp).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});
                    
                    messageDiv.appendChild(timeDiv);
                    this.messagesContainer.appendChild(messageDiv);
                } else {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'chat-message bot-message';
                    
                    // Markdown formatlamasını işle
                    if (msg.message.includes('**') || msg.message.includes('- ') || msg.message.includes('\n')) {
                        // Basit markdown dönüşümünü yap
                        let formattedMessage = msg.message
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\n- /g, '<br>• ')
                            .replace(/\n/g, '<br>');
                        
                        messageDiv.innerHTML = formattedMessage;
                    } else {
                        messageDiv.textContent = msg.message;
                    }
                    
                    const timeDiv = document.createElement('div');
                    timeDiv.className = 'message-time';
                    timeDiv.textContent = new Date(msg.timestamp).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});
                    
                    messageDiv.appendChild(timeDiv);
                    this.messagesContainer.appendChild(messageDiv);
                }
            });
            
            // Mesaj alanını en alta kaydır
            this.scrollToBottom();
        }
    }
    
    /**
     * Bildirim göster
     * @param {string} message - Bildirim mesajı
     */
    showNotification(message) {
        // Bildirim desteğini kontrol et
        if (!('Notification' in window)) {
            return;
        }
        
        // İzin kontrolü
        if (Notification.permission === 'granted') {
            // Bildirim göster
            const notification = new Notification('M.E.T.S. Asistan', {
                body: message,
                icon: '/assets/images/logo.png'
            });
            
            // Bildirime tıklandığında chatbot'u aç
            notification.onclick = () => {
                window.focus();
                this.toggleChatbot();
            };
        } else if (Notification.permission !== 'denied') {
            // İzin iste
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.showNotification(message);
                }
            });
        }
    }
    
    /**
     * Çevrimdışı yanıt al
     * @param {string} type - Yanıt tipi
     * @returns {string} - Yanıt
     */
    getOfflineResponse(type) {
        const responses = this.offlineResponses[type] || this.offlineResponses.unknownQuery;
        const randomIndex = Math.floor(Math.random() * responses.length);
        return responses[randomIndex];
    }
    
    /**
     * Üretim bilgilerini formatla
     * @param {Array} productionData - Üretim verileri
     * @param {string} query - Sorgu
     * @returns {string} - Formatlanmış bilgi
     */
    formatProductionInfo(productionData, query) {
        if (!productionData || productionData.length === 0) {
            return "Üretim planı verisi bulunamadı. Lütfen ERP bağlantınızı kontrol edin.";
        }
        
        // Sorguya göre filtreleme yap
        let filteredProduction = productionData;
        const lowerQuery = query.toLowerCase();
        
        // Belirli bir sipariş için üretim bilgisi aranıyorsa
        if (lowerQuery.match(/[a-z0-9]{5,}/i)) {
            const orderNoMatch = lowerQuery.match(/[a-z0-9]{5,}/i);
            if (orderNoMatch) {
                const searchOrderNo = orderNoMatch[0];
                filteredProduction = productionData.filter(item => 
                    (item.orderNo && item.orderNo.toLowerCase().includes(searchOrderNo.toLowerCase())) || 
                    (item.orderId && item.orderId.toLowerCase().includes(searchOrderNo.toLowerCase()))
                );
            }
        }
        // Belirli bir aşamadaki üretimler aranıyorsa
        else if (lowerQuery.includes('tasarım') || lowerQuery.includes('montaj') || 
                lowerQuery.includes('test') || lowerQuery.includes('kablaj') ||
                lowerQuery.includes('kaynak') || lowerQuery.includes('cnc') ||
                lowerQuery.includes('kesim') || lowerQuery.includes('bükme')) {
            let stageFilter = '';
            
            if (lowerQuery.includes('tasarım')) stageFilter = 'design';
            else if (lowerQuery.includes('montaj')) stageFilter = 'assembly';
            else if (lowerQuery.includes('test')) stageFilter = 'testing';
            else if (lowerQuery.includes('kablaj')) stageFilter = 'wiring';
            else if (lowerQuery.includes('kaynak')) stageFilter = 'welding';
            else if (lowerQuery.includes('cnc')) stageFilter = 'cnc';
            else if (lowerQuery.includes('kesim')) stageFilter = 'cutting';
            else if (lowerQuery.includes('bükme')) stageFilter = 'bending';
            
            if (stageFilter) {
                filteredProduction = productionData.filter(item => item.currentStage === stageFilter);
            }
        }
        // Bugünkü üretim planı aranıyorsa
        else if (lowerQuery.includes('bugün') || lowerQuery.includes('günün')) {
            const today = new Date();
            filteredProduction = productionData.filter(item => {
                if (!item.scheduledDate) return false;
                const scheduleDate = new Date(item.scheduledDate);
                return scheduleDate.toDateString() === today.toDateString();
            });
            
            return this.formatDailyProductionPlan(filteredProduction, today);
        }
        // Bu haftaki üretim planı aranıyorsa
        else if (lowerQuery.includes('hafta')) {
            const today = new Date();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            
            filteredProduction = productionData.filter(item => {
                if (!item.scheduledDate) return false;
                const scheduleDate = new Date(item.scheduledDate);
                return scheduleDate >= startOfWeek && scheduleDate <= endOfWeek;
            });
            
            return this.formatWeeklyProductionPlan(filteredProduction, startOfWeek, endOfWeek);
        }
        // Belirli bir kişiye atanan üretimler aranıyorsa
        else if (lowerQuery.includes('sorumlu') || lowerQuery.includes('atanan')) {
            const keywords = lowerQuery.split(' ').filter(word => 
                word.length > 3 && 
                !['sorumlu', 'atanan', 'üretim', 'planı', 'kişi', 'olan'].includes(word)
            );
            
            if (keywords.length > 0) {
                filteredProduction = productionData.filter(item => {
                    if (!item.responsiblePerson) return false;
                    const lowerResponsible = item.responsiblePerson.toLowerCase();
                    return keywords.some(keyword => lowerResponsible.includes(keyword));
                });
            }
        }
        // Geciken üretimler aranıyorsa
        else if (lowerQuery.includes('geciken') || lowerQuery.includes('geç') || lowerQuery.includes('gecikmeli')) {
            const today = new Date();
            filteredProduction = productionData.filter(item => {
                if (!item.estimatedCompletion) return false;
                const estimatedDate = new Date(item.estimatedCompletion);
                return estimatedDate < today && item.status !== 'completed';
            });
            
            // Gecikme süresine göre sırala
            filteredProduction.sort((a, b) => {
                const dateA = new Date(a.estimatedCompletion);
                const dateB = new Date(b.estimatedCompletion);
                return dateA - dateB; // En çok geciken en üstte
            });
            
            return this.formatDelayedProductionInfo(filteredProduction);
        }
        // Özet bilgi isteniyorsa
        else if (lowerQuery.includes('özet') || lowerQuery.includes('tüm') || lowerQuery.includes('genel')) {
            return this.formatProductionSummary(productionData);
        }
        
        // Sonuçları formatlama
        if (filteredProduction.length === 0) {
            return "Aradığınız kriterlere uygun üretim planı bulunamadı. Lütfen farklı anahtar kelimeler kullanarak tekrar deneyin.";
        } else if (filteredProduction.length === 1) {
            return this.formatDetailedProductionInfo(filteredProduction[0]);
        } else if (filteredProduction.length <= 5) {
            let response = `**${filteredProduction.length} adet üretim planı bulundu:**\n\n`;
            
            filteredProduction.forEach(item => {
                const scheduleDate = new Date(item.scheduledDate).toLocaleDateString('tr-TR');
                const estimatedCompletion = new Date(item.estimatedCompletion).toLocaleDateString('tr-TR');
                const stageText = this.getProductionStageText(item.currentStage);
                
                response += `**${item.orderNo}** - ${item.productName || 'Belirtilmemiş'}\n`;
                response += `- Planlanan Tarih: ${scheduleDate}\n`;
                response += `- Tahmini Bitiş: ${estimatedCompletion}\n`;
                response += `- Mevcut Aşama: ${stageText}\n`;
                
                if (item.completionRate !== undefined) {
                    response += `- Tamamlanma: %${item.completionRate}\n`;
                }
                
                if (item.responsiblePerson) {
                    response += `- Sorumlu: ${item.responsiblePerson}\n`;
                }
                
                response += '\n';
            });
            
            return response;
        } else {
            let response = `**${filteredProduction.length} adet üretim planı bulundu.** İlk 5 tanesi:\n\n`;
            
            filteredProduction.slice(0, 5).forEach(item => {
                const scheduleDate = new Date(item.scheduledDate).toLocaleDateString('tr-TR');
                const stageText = this.getProductionStageText(item.currentStage);
                
                response += `**${item.orderNo}** - ${stageText} - ${scheduleDate} - %${item.completionRate || 0} tamamlandı\n`;
            });
            
            response += `\nDaha detaylı bilgi için lütfen sorgunuzu daraltın. Örneğin: "S12345 üretim durumu" veya "montaj aşamasındaki üretimler".`;
            return response;
        }
    }
    
    /**
     * Detaylı üretim bilgisi formatla
     * @param {Object} item - Üretim verisi
     * @returns {string} - Formatlanmış bilgi
     */
    formatDetailedProductionInfo(item) {
        if (!item) return "Üretim bilgisi bulunamadı.";
        
        const scheduleDate = new Date(item.scheduledDate).toLocaleDateString('tr-TR');
        const estimatedCompletion = new Date(item.estimatedCompletion).toLocaleDateString('tr-TR');
        const stageText = this.getProductionStageText(item.currentStage);
        
        let response = `**Üretim Planı: ${item.orderNo}**\n\n`;
        
        if (item.productName) {
            response += `- Ürün: ${item.productName}\n`;
        }
        
        response += `- Planlanan Başlangıç: ${scheduleDate}\n`;
        response += `- Tahmini Bitiş: ${estimatedCompletion}\n`;
        response += `- Mevcut Aşama: ${stageText}\n`;
        
        if (item.completionRate !== undefined) {
            response += `- Tamamlanma Oranı: %${item.completionRate}\n`;
        }
        
        if (item.responsiblePerson) {
            response += `- Sorumlu: ${item.responsiblePerson}\n`;
        }
        
        // Aşama detayları
        if (item.stages && item.stages.length > 0) {
            response += `\n**Üretim Aşamaları:**\n`;
            
            item.stages.forEach(stage => {
                const stageText = this.getProductionStageText(stage.name);
                let statusEmoji = '⬜';
                
                if (stage.status === 'completed') {
                    statusEmoji = '✅';
                } else if (stage.status === 'in_progress') {
                    statusEmoji = '🔄';
                } else if (stage.status === 'pending') {
                    statusEmoji = '⏳';
                }
                
                response += `${statusEmoji} ${stageText}`;
                
                if (stage.completionRate !== undefined) {
                    response += ` - %${stage.completionRate}`;
                }
                
                if (stage.startDate) {
                    const startDate = new Date(stage.startDate).toLocaleDateString('tr-TR');
                    response += ` - Başlangıç: ${startDate}`;
                }
                
                if (stage.endDate) {
                    const endDate = new Date(stage.endDate).toLocaleDateString('tr-TR');
                    response += ` - Bitiş: ${endDate}`;
                }
                
                response += '\n';
            });
        }
        
        // Malzeme durumu
        if (item.materials && item.materials.length > 0) {
            const missingMaterials = item.materials.filter(m => m.status === 'missing' || m.status === 'ordered');
            
            if (missingMaterials.length > 0) {
                response += `\n**Eksik Malzemeler:**\n`;
                
                missingMaterials.forEach(material => {
                    response += `- ${material.name || material.code}: `;
                    
                    if (material.status === 'missing') {
                        response += `Eksik, tedarik edilmesi gerekiyor\n`;
                    } else if (material.status === 'ordered') {
                        response += `Sipariş edildi, bekleniyor\n`;
                        
                        if (material.expectedDate) {
                            response += `  Beklenen Tarih: ${new Date(material.expectedDate).toLocaleDateString('tr-TR')}\n`;
                        }
                    }
                });
            }
        }
        
        if (item.notes) {
            response += `\n**Notlar:** ${item.notes}\n`;
        }
        
        return response;
    }
    
    /**
     * Günlük üretim planını formatla
     * @param {Array} productionItems - Günlük üretim verileri
     * @param {Date} date - Tarih
     * @returns {string} - Formatlanmış bilgi
     */
    formatDailyProductionPlan(productionItems, date) {
        if (!productionItems || productionItems.length === 0) {
            return `${date.toLocaleDateString('tr-TR')} tarihinde planlanan üretim bulunmamaktadır.`;
        }
        
        let response = `**${date.toLocaleDateString('tr-TR')} Tarihli Üretim Planı**\n\n`;
        
        // Aşamalara göre grupla
        const stageGroups = {};
        
        productionItems.forEach(item => {
            const stage = item.currentStage || 'unknown';
            if (!stageGroups[stage]) {
                stageGroups[stage] = [];
            }
            stageGroups[stage].push(item);
        });
        
        // Her aşama için üretimleri listele
        for (const [stage, items] of Object.entries(stageGroups)) {
            const stageText = this.getProductionStageText(stage);
            response += `**${stageText} (${items.length} adet):**\n`;
            
            items.forEach(item => {
                response += `- **${item.orderNo}** - ${item.productName || 'Belirtilmemiş'}\n`;
                
                if (item.completionRate !== undefined) {
                    response += `  Tamamlanma: %${item.completionRate}\n`;
                }
                
                response += '\n';
            });
            
            response += '\n';
        }
        
        return response;
    }
    
    /**
     * Haftalık üretim planını formatla
     * @param {Array} productionItems - Haftalık üretim verileri
     * @param {Date} startDate - Başlangıç tarihi
     * @param {Date} endDate - Bitiş tarihi
     * @returns {string} - Formatlanmış bilgi
     */
    formatWeeklyProductionPlan(productionItems, startDate, endDate) {
        if (!productionItems || productionItems.length === 0) {
            return `${startDate.toLocaleDateString('tr-TR')} - ${endDate.toLocaleDateString('tr-TR')} tarihleri arasında planlanan üretim bulunmamaktadır.`;
        }
        
        let response = `**${startDate.toLocaleDateString('tr-TR')} - ${endDate.toLocaleDateString('tr-TR')} Tarihleri Arası Üretim Planı**\n\n`;
        
        // Günlere göre grupla
        const dayGroups = {};
        
        productionItems.forEach(item => {
            if (!item.scheduledDate) return;
            
            const scheduleDate = new Date(item.scheduledDate);
            const dateStr = scheduleDate.toDateString();
            
            if (!dayGroups[dateStr]) {
                dayGroups[dateStr] = [];
            }
            dayGroups[dateStr].push(item);
        });
        
        // Her gün için üretimleri listele
        const sortedDays = Object.keys(dayGroups).sort((a, b) => new Date(a) - new Date(b));
        
        for (const dateStr of sortedDays) {
            const items = dayGroups[dateStr];
            const date = new Date(dateStr);
            const today = new Date();
            
            let dayHeader = `**${date.toLocaleDateString('tr-TR')}`;
            if (date.toDateString() === today.toDateString()) {
                dayHeader += ' (Bugün)';
            }
            dayHeader += ` - ${items.length} adet üretim:**\n`;
            
            response += dayHeader;
            
            items.forEach(item => {
                const stageText = this.getProductionStageText(item.currentStage);
                response += `- **${item.orderNo}** - ${item.productName || 'Belirtilmemiş'} - ${stageText} - %${item.completionRate || 0}\n`;
            });
            
            response += '\n';
        }
        
        return response;
    }
    
    /**
     * Geciken üretimler bilgisini formatla
     * @param {Array} delayedProduction - Geciken üretimler
     * @returns {string} - Formatlanmış bilgi
     */
    formatDelayedProductionInfo(delayedProduction) {
        if (!delayedProduction || delayedProduction.length === 0) {
            return "Geciken üretim bulunmamaktadır. Tüm üretimler zamanında tamamlanacak.";
        }
        
        const today = new Date();
        let response = `**Geciken Üretimler (${delayedProduction.length} adet):**\n\n`;
        
        delayedProduction.forEach(item => {
            const estimatedDate = new Date(item.estimatedCompletion);
            const delayDays = Math.floor((today - estimatedDate) / (1000 * 60 * 60 * 24));
            
            response += `**${item.orderNo}** - ${item.productName || 'Belirtilmemiş'}\n`;
            response += `- Tahmini Bitiş: ${estimatedDate.toLocaleDateString('tr-TR')} (${delayDays} gün gecikme)\n`;
            response += `- Mevcut Aşama: ${this.getProductionStageText(item.currentStage)}\n`;
            
            if (item.completionRate !== undefined) {
                response += `- Tamamlanma: %${item.completionRate}\n`;
            }
            
            if (item.responsiblePerson) {
                response += `- Sorumlu: ${item.responsiblePerson}\n`;
            }
            
            if (item.delayReason) {
                response += `- Gecikme Nedeni: ${item.delayReason}\n`;
            }
            
            response += '\n';
        });
        
        return response;
    }
    
    /**
     * Üretim özet bilgisini formatla
     * @param {Array} productionData - Tüm üretim verileri
     * @returns {string} - Formatlanmış özet bilgi
     */
    formatProductionSummary(productionData) {
        if (!productionData || productionData.length === 0) {
            return "Üretim verisi bulunamadı.";
        }
        
        // Aşama bazlı gruplama
        const stageCounts = {};
        let delayedCount = 0;
        const today = new Date();
        
        productionData.forEach(item => {
            // Aşama sayıları
            if (item.currentStage) {
                stageCounts[item.currentStage] = (stageCounts[item.currentStage] || 0) + 1;
            }
            
            // Gecikme kontrolü
            if (item.estimatedCompletion) {
                const estimatedDate = new Date(item.estimatedCompletion);
                if (estimatedDate < today && item.status !== 'completed') {
                    delayedCount++;
                }
            }
        });
        
        // Özet bilgi oluştur
        let response = `**Üretim Durumu Özeti**\n\n`;
        response += `Toplam ${productionData.length} adet üretim planı bulunmaktadır.\n`;
        
        if (delayedCount > 0) {
            response += `**${delayedCount} adet üretim gecikmiş durumda**\n`;
        }
        
        response += `\n**Aşama Bazlı Dağılım:**\n\n`;
        
        const stageNames = {
            'design': 'Tasarım',
            'procurement': 'Satın Alma',
            'cutting': 'Kesim',
            'bending': 'Bükme',
            'welding': 'Kaynak',
            'cnc': 'CNC İşleme',
            'assembly': 'Montaj',
            'wiring': 'Kablaj',
            'testing': 'Test',
            'packaging': 'Paketleme',
            'quality_control': 'Kalite Kontrol'
        };
        
        for (const [stage, count] of Object.entries(stageCounts)) {
            const stageText = stageNames[stage] || stage;
            response += `- ${stageText}: ${count} üretim\n`;
        }
        
        // Bugünkü üretimler
        const todayProduction = productionData.filter(item => {
            if (!item.scheduledDate) return false;
            const scheduleDate = new Date(item.scheduledDate);
            return scheduleDate.toDateString() === today.toDateString();
        });
        
        if (todayProduction.length > 0) {
            response += `\n**Bugün Planlanan Üretimler (${todayProduction.length} adet):**\n\n`;
            
            todayProduction.slice(0, 5).forEach(item => {
                const stageText = this.getProductionStageText(item.currentStage);
                response += `- **${item.orderNo}** - ${item.productName || 'Belirtilmemiş'} - ${stageText} - %${item.completionRate || 0}\n`;
            });
            
            if (todayProduction.length > 5) {
                response += `... ve ${todayProduction.length - 5} üretim daha\n`;
            }
        }
        
        return response;
    }
    
    /**
     * Üretim aşaması metni al
     * @param {string} stage - Aşama kodu
     * @returns {string} - Aşama metni
     */
    getProductionStageText(stage) {
        if (!stage) return "Bilinmiyor";
        
        switch(stage) {
            case 'design': return '📐 Tasarım';
            case 'procurement': return '🛒 Satın Alma';
            case 'cutting': return '✂️ Kesim';
            case 'bending': return '↩️ Bükme';
            case 'welding': return '🔥 Kaynak';
            case 'cnc': return '🔄 CNC İşleme';
            case 'assembly': return '🔧 Montaj';
            case 'wiring': return '🔌 Kablaj';
            case 'testing': return '🔍 Test';
            case 'packaging': return '📦 Paketleme';
            case 'quality_control': return '✅ Kalite Kontrol';
            default: return stage;
        }
    }
}

// Chatbot örneğini oluştur
const chatbot = new Chatbot();

// Global olarak erişilebilir yap
window.Chatbot = chatbot;

// ES modül uyumluluğu
export default chatbot;