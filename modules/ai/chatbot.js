/**
 * chatbot.js
 * Yapay zeka asistanı işlevleri
 */

import AppConfig from '../../config/app-config.js';
import AdvancedAI from './advanced-ai.js';
import AIIntegrationModule from './ai-integration.js';
import Logger from '../../utils/logger.js';
import { aiService } from '../../services/aiService.js';

class Chatbot {
    constructor() {
        this.container = document.querySelector('.ai-chatbot-container');
        this.messagesContainer = this.container.querySelector('.chat-messages');
        this.input = this.container.querySelector('input');
        this.sendButton = this.container.querySelector('.send-message');
        this.closeButton = this.container.querySelector('.close-chat');
        this.chatbotButton = document.querySelector('.ai-chatbot-btn');
        this.isOpen = false;
    }

    initialize() {
        this.setupEventListeners();
        this.addWelcomeMessage();
    }

    setupEventListeners() {
        // Chatbot butonuna tıklama
        this.chatbotButton.addEventListener('click', () => this.toggleChat());

        // Kapatma butonuna tıklama
        this.closeButton.addEventListener('click', () => this.closeChat());

        // Mesaj gönderme
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        this.container.style.display = this.isOpen ? 'flex' : 'none';
        if (this.isOpen) {
            this.input.focus();
        }
    }

    closeChat() {
        this.isOpen = false;
        this.container.style.display = 'none';
    }

    async sendMessage() {
        const message = this.input.value.trim();
        if (!message) return;

        // Kullanıcı mesajını ekle
        this.addMessage(message, 'user');
        this.input.value = '';

        try {
            // AI servisinden yanıt al
            const response = await aiService.processQuery(message);
            
            // AI yanıtını ekle
            this.addMessage(response, 'assistant');
        } catch (error) {
            console.error('Chatbot error:', error);
            this.addMessage('Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.', 'assistant');
        }
    }

    addMessage(content, type) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${type}`;
        
        const time = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        
        messageElement.innerHTML = `
            <div class="message-content">${content}</div>
            <div class="message-time">${time}</div>
        `;

        this.messagesContainer.appendChild(messageElement);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    addWelcomeMessage() {
        const welcomeMessage = `
            Merhaba! Ben MehmetEndüstriyel'in yapay zeka asistanıyım. Size nasıl yardımcı olabilirim?
            
            Örnek sorular:
            - Sipariş durumunu nasıl öğrenebilirim?
            - Üretim planı nedir?
            - Stok durumu nasıl?
        `;
        this.addMessage(welcomeMessage, 'assistant');
    }
}

const chatbot = new Chatbot();
export const toggleChatbot = () => chatbot.toggleChat();
export default chatbot;

// Hoşgeldin mesajı göster
function showWelcomeMessage() {
    const chatBody = document.getElementById('chatbot-body');
    if (!chatBody) return;
    
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'chat-message bot';
    welcomeMessage.innerHTML = `
        <p>Merhaba! Ben Mehmet Endüstriyel Takip yapay zeka asistanıyım. Size nasıl yardımcı olabilirim?</p>
        <p>Örnek sorular:</p>
        <ul class="quick-questions">
            <li><a href="#" class="quick-question" data-question="Üretimdeki siparişlerin durumu nedir?">Üretimdeki siparişlerin durumu nedir?</a></li>
            <li><a href="#" class="quick-question" data-question="Hangi malzemelerde kritik eksiklik var?">Hangi malzemelerde kritik eksiklik var?</a></li>
            <li><a href="#" class="quick-question" data-question="CB hücre tipi için üretim süresi tahmini nedir?">CB hücre tipi için üretim süresi tahmini nedir?</a></li>
            <li><a href="#" class="quick-question" data-question="Üretimde gecikme riski olan siparişleri göster">Üretimde gecikme riski olan siparişleri göster</a></li>
        </ul>
    `;
    chatBody.appendChild(welcomeMessage);
    
    // Hızlı soru bağlantılarına tıklama olayları ekle
    welcomeMessage.querySelectorAll('.quick-question').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const question = this.getAttribute('data-question');
            document.getElementById('chatbot-input').value = question;
            sendChatMessage();
        });
    });
}

// Mesaj gönderme
async function sendChatMessage() {
    const input = document.getElementById('chatbot-input');
    const message = input.value.trim();
    
    if (message === '') return;
    
    // Kullanıcı mesajını ekle
    const chatBody = document.getElementById('chatbot-body');
    const userMessageElement = document.createElement('div');
    userMessageElement.className = 'chat-message user';
    userMessageElement.textContent = message;
    chatBody.appendChild(userMessageElement);
    
    // Input'u temizle
    input.value = '';
    
    // Yanıt oluşturma (yapay zeka ile entegrasyon)
    await generateBotResponse(message, chatBody);
    
    // Scroll to bottom
    chatBody.scrollTop = chatBody.scrollHeight;
}

// Yapay zeka yanıtı oluşturma
async function generateBotResponse(message, chatBody) {
    try {
        // Yükleniyor göster
        const loadingElement = document.createElement('div');
        loadingElement.className = 'chat-message bot';
        loadingElement.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Yanıt hazırlanıyor...';
        chatBody.appendChild(loadingElement);
        
        // Sohbet geçmişini al
        const chatHistory = getChatHistory();
        
        // Bağlam verilerini topla
        const context = await collectContextData(message);
        Logger.info("Chatbot bağlam verileri toplandı", { 
            messageLength: message.length, 
            contextLength: context.length,
            historyLength: chatHistory.length 
        });
        
        // AI yanıtını al
        let botResponse = '';
        let responseSource = '';
        
        // Yanıt önceliği:
        // 1. DeepSeek
        // 2. OpenAI
        // 3. AdvancedAI (yerel)
        // 4. Demo yanıt
        try {
            // DeepSeek API entegrasyonu ile yanıt almaya çalış
            if (window.AIIntegrationModule && typeof window.AIIntegrationModule.askDeepSeek === 'function') {
                Logger.info("DeepSeek AI modeli kullanılıyor");
                
                botResponse = await window.AIIntegrationModule.askDeepSeek(message, context);
                responseSource = 'deepseek';
                Logger.info("DeepSeek yanıtı alındı", { responseLength: botResponse.length });
            } else {
                Logger.warn("DeepSeek AI modülü bulunamadı veya askDeepSeek fonksiyonu yok");
                throw new Error("DeepSeek modülü bulunamadı");
            }
        } catch (deepseekError) {
            Logger.warn("DeepSeek yanıtı alınamadı, OpenAI deneniyor", { error: deepseekError.message });
            
            try {
                // OpenAI ile yanıt almaya çalış
                if (window.AIIntegrationModule && typeof window.AIIntegrationModule.askOpenAI === 'function') {
                    Logger.info("OpenAI modeli kullanılıyor");
                    
                    botResponse = await window.AIIntegrationModule.askOpenAI(message, context);
                    responseSource = 'openai';
                    Logger.info("OpenAI yanıtı alındı", { responseLength: botResponse.length });
                } else {
                    Logger.warn("OpenAI modülü bulunamadı veya askOpenAI fonksiyonu yok");
                    throw new Error("OpenAI modülü bulunamadı");
                }
            } catch (openaiError) {
                Logger.warn("OpenAI yanıtı alınamadı, AdvancedAI deneniyor", { error: openaiError.message });
                
                try {
                    // Yerel AdvancedAI ile yanıt almaya çalış
                    if (typeof AdvancedAI !== 'undefined' && typeof AdvancedAI.askQuestion === 'function') {
                        Logger.info("AdvancedAI modülü kullanılıyor");
                        
                        botResponse = await AdvancedAI.askQuestion(message, context);
                        responseSource = 'advanced';
                        Logger.info("AdvancedAI yanıtı alındı", { responseLength: botResponse.length });
                    } else {
                        Logger.warn("AdvancedAI modülü bulunamadı veya askQuestion fonksiyonu yok");
                        throw new Error("AdvancedAI modülü bulunamadı");
                    }
                } catch (advancedError) {
                    Logger.warn("AdvancedAI yanıtı alınamadı, demo yanıt kullanılıyor", { error: advancedError.message });
                    
                    // Demo yanıt oluştur
                    botResponse = generateDemoResponse(message);
                    responseSource = 'demo';
                    Logger.info("Demo yanıtı oluşturuldu", { responseLength: botResponse.length });
                }
            }
        }
        
        // Yükleniyor mesajını kaldır
        chatBody.removeChild(loadingElement);
        
        // Yanıtı işle ve göster
        botResponse = botResponse || "Üzgünüm, bir yanıt oluşturulamadı. Lütfen daha sonra tekrar deneyin.";
        
        // Yanıt kaynağına göre stil belirle
        let messageClass = 'chat-message bot';
        if (responseSource === 'deepseek') {
            messageClass += ' deepseek-response';
        } else if (responseSource === 'openai') {
            messageClass += ' openai-response';
        } else if (responseSource === 'demo') {
            messageClass += ' demo-response';
        }
        
        // Yanıtı formatla (markdown ve html desteği)
        botResponse = formatResponse(botResponse);
        
        // Gerçek yanıtı göster
        const timestamp = new Date().toLocaleTimeString();
        const botMessageElement = document.createElement('div');
        botMessageElement.className = messageClass;
        botMessageElement.innerHTML = `<span class="message-content">${botResponse}</span><span class="message-time">${timestamp}</span>`;
        chatBody.appendChild(botMessageElement);
        
        // Otomatik scroll
        chatBody.scrollTop = chatBody.scrollHeight;
        
        // Sohbet geçmişini kaydet
        saveChatHistory({
            role: 'assistant',
            content: botResponse,
            timestamp: new Date().toISOString(),
            source: responseSource
        });
        
        // Grafik ve veri görselleştirme işlemleri
        processVisualizationRequests(message, botResponse, botMessageElement);
        
        // Yanıta dayalı önerilen işlemleri göster
        if (botResponse.length > 50) {
            suggestActionsBasedOnResponse(message, botResponse, chatBody);
        }
    } catch (error) {
        Logger.error("Bot yanıtı oluşturulurken hata", { error: error.message });
        
        const errorElement = document.createElement('div');
        errorElement.className = 'chat-message bot error';
        errorElement.innerHTML = `<span class="message-content">Üzgünüm, bir hata oluştu: ${error.message}</span>`;
        chatBody.appendChild(errorElement);
        
        // Otomatik scroll
        chatBody.scrollTop = chatBody.scrollHeight;
    }
}

// Yanıt formatı (markdown vs html dönüşümü)
function formatResponse(response) {
    // HTML etiketleri kontrolü
    if (/<\/?[a-z][\s\S]*>/i.test(response)) {
        return response; // Zaten HTML varsa dokunma
    }
    
    // Basit markdown dönüşümleri
    // Kalın metin
    response = response.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // İtalik metin
    response = response.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Başlıklar
    response = response.replace(/#{3}(.*)/g, '<h3>$1</h3>');
    response = response.replace(/#{2}(.*)/g, '<h2>$1</h2>');
    response = response.replace(/#{1}(.*)/g, '<h1>$1</h1>');
    // Listeler
    response = response.replace(/- (.*)/g, '<li>$1</li>');
    response = response.replace(/<li>(.*)<\/li>/g, '<ul><li>$1</li></ul>');
    // Yeni satırlar
    response = response.replace(/\n/g, '<br>');
    
    return response;
}

// Veri görselleştirme işlemleri
function processVisualizationRequests(message, response, container) {
    // Üretim verileri gösterme isteği kontrolü
    if (message.toLowerCase().includes('üretim grafik') || 
        message.toLowerCase().includes('üretim verilerini göster') ||
        message.toLowerCase().includes('istatistik') ||
        message.toLowerCase().includes('grafik')) {
        
        // Grafik elementi oluştur
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chat-chart-container';
        chartContainer.innerHTML = '<canvas id="chat-chart"></canvas>';
        container.appendChild(chartContainer);
        
        // Örnek üretim verileri (gerçek uygulamada API'den alınır)
        const productionData = {
            labels: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'],
            datasets: [
                {
                    label: 'Tamamlanan Siparişler',
                    data: [12, 19, 15, 20, 18, 22],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Gecikmeli Siparişler',
                    data: [2, 3, 1, 2, 1, 0],
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        };
        
        // Chart.js ile grafik oluştur
        setTimeout(() => {
            const ctx = document.getElementById('chat-chart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: productionData,
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }, 100);
    }
}

// İlgili bağlam verilerini topla
async function collectContextData(message) {
    let context = "";
    
    try {
        Logger.info("Chatbot için bağlam verileri toplanıyor");
        
        // Temel veri kaynakları
        let orders = null;
        let materials = null;
        let production = null;
        let technicalData = null;
        
        // Sorgu içeriğini analiz et
        const lowerCaseMessage = message.toLowerCase();
        
        // Eşleşecek anahtar kelimeler
        const orderKeywords = ['sipariş', 'order', 'siparış', 'sıparış', 'musteri', 'müşteri', 'termin', 'teslim'];
        const materialKeywords = ['malzeme', 'material', 'stok', 'stoğumuz', 'depo', 'tedarik', 'sipariş ver', 'eksik'];
        const productionKeywords = ['üretim', 'production', 'imalat', 'montaj', 'gecik', 'tamamla', 'bitir', 'başla', 'durum'];
        const technicalKeywords = ['teknik', 'technical', 'hücre', 'role', 'röle', 'nominal', 'cell', 'cb', 'lb', 'fl', 'rmu', 'volt', 'ampere'];
        
        // Sipariş numarası formatını kontrol et (örn: 2405xx14, 24-05-xx-14, vb.)
        const orderNumberPattern = /\b(24|20)[-]?(\d{2})[-]?([A-Za-z0-9]{2,4})[-]?(\d{1,4})\b/;
        const hasOrderNumber = orderNumberPattern.test(message);
        
        // Sipariş numarasını ayıkla
        let orderNumberMatch = message.match(orderNumberPattern);
        let orderNumber = orderNumberMatch ? orderNumberMatch[0] : null;
        
        // Anahtar kelime kontrolü
        const containsOrderKeywords = orderKeywords.some(keyword => lowerCaseMessage.includes(keyword)) || hasOrderNumber;
        const containsMaterialKeywords = materialKeywords.some(keyword => lowerCaseMessage.includes(keyword));
        const containsProductionKeywords = productionKeywords.some(keyword => lowerCaseMessage.includes(keyword));
        const containsTechnicalKeywords = technicalKeywords.some(keyword => lowerCaseMessage.includes(keyword));
        
        // Paralel olarak tüm gerekli verileri topla
        const dataPromises = [];
        
        // Aktif siparişleri al
        if (containsOrderKeywords) {
            dataPromises.push(fetchActiveOrders().then(data => orders = data));
        }
        
        // Malzeme bilgilerini al
        if (containsMaterialKeywords) {
            dataPromises.push(fetchCriticalMaterials().then(data => materials = data));
        }
        
        // Üretim durumunu al
        if (containsProductionKeywords) {
            dataPromises.push(fetchProductionStatus().then(data => production = data));
        }
        
        // Teknik bilgileri al
        if (containsTechnicalKeywords) {
            dataPromises.push(fetchTechnicalData().then(data => technicalData = data));
        }
        
        // Belirli bir sipariş sorgulanıyorsa
        if (orderNumber) {
            dataPromises.push(fetchSpecificOrderDetails(orderNumber).then(data => {
                if (data) {
                    orders = orders || [];
                    // Eğer bu sipariş henüz orders listesinde yoksa ekle
                    if (!orders.some(order => order.orderNumber === data.orderNumber)) {
                        orders.push(data);
                    }
                }
            }));
        }
        
        // Tüm veri toplamalarının tamamlanmasını bekle
        await Promise.all(dataPromises);
        
        // Bağlam bilgisi oluştur
        if (orders && orders.length > 0) {
            context += "Aktif Siparişler:\n";
            orders.forEach((order, index) => {
                context += `${index + 1}. Sipariş No: ${order.orderNumber}, Müşteri: ${order.customer}, Hücre Tipi: ${order.cellType}, Durum: ${order.status}\n`;
                
                // Sipariş detaylarını ekle
                if (order.deliveryDate) context += `   Teslim Tarihi: ${order.deliveryDate}\n`;
                if (order.quantity) context += `   Miktar: ${order.quantity} adet\n`;
                if (order.progress) context += `   İlerleme: ${order.progress}%\n`;
                if (order.currentStage) context += `   Mevcut Aşama: ${order.currentStage}\n`;
                if (order.notes) context += `   Notlar: ${order.notes}\n`;
            });
        }
        
        if (materials && materials.length > 0) {
            context += "\nKritik Malzemeler:\n";
            materials.forEach((material, index) => {
                context += `${index + 1}. Kod: ${material.code}, Ad: ${material.name}, Stok: ${material.stock}, Gerekli: ${material.required}\n`;
                
                // Tedarik durumu bilgisi varsa ekle
                if (material.supplyStatus) context += `   Tedarik Durumu: ${material.supplyStatus}\n`;
                if (material.expectedDelivery) context += `   Beklenen Teslimat: ${material.expectedDelivery}\n`;
            });
        }
        
        if (production) {
            context += "\nÜretim Durumu:\n";
            context += `Devam Eden Siparişler: ${production.inProgress}\n`;
            context += `Geciken Siparişler: ${production.delayed}\n`;
            context += `Tamamlanan Siparişler (Bu Ay): ${production.completed}\n`;
            
            // Üretim kapasitesi/verimlilik bilgisi varsa ekle
            if (production.capacity) context += `Günlük Üretim Kapasitesi: ${production.capacity} birim\n`;
            if (production.efficiency) context += `Üretim Verimliliği: ${production.efficiency}%\n`;
            
            // Üretim aşamalarında bekleyen sipariş sayısı
            if (production.stageStats) {
                context += "\nÜretim Aşaması İstatistikleri:\n";
                Object.entries(production.stageStats).forEach(([stage, count]) => {
                    context += `   ${stage}: ${count} sipariş\n`;
                });
            }
        }
        
        if (technicalData) {
            context += "\nTeknik Veriler:\n";
            Object.entries(technicalData).forEach(([key, value]) => {
                context += `${key}: ${value}\n`;
            });
        }
        
        // "Geciken sipariş var mı?" gibi sorulara özgü ek bağlam ekle
        if (lowerCaseMessage.includes('gecik') && 
            (lowerCaseMessage.includes('sipariş') || lowerCaseMessage.includes('order'))) {
            try {
                const delayedOrders = await fetchDelayedOrders();
                if (delayedOrders && delayedOrders.length > 0) {
                    context += "\nGeciken Siparişler Detayı:\n";
                    delayedOrders.forEach((order, index) => {
                        context += `${index + 1}. Sipariş No: ${order.orderNumber}, Müşteri: ${order.customer}, Gecikme: ${order.delayDays} gün\n`;
                        if (order.delayReason) context += `   Gecikme Sebebi: ${order.delayReason}\n`;
                        if (order.newEstimatedDelivery) context += `   Yeni Tahmini Teslim: ${order.newEstimatedDelivery}\n`;
                    });
                } else {
                    context += "\nŞu anda geciken sipariş bulunmamaktadır.\n";
                }
            } catch (error) {
                Logger.error("Geciken sipariş bilgileri alınırken hata", { error: error.message });
            }
        }
        
        Logger.info("Bağlam verileri toplama tamamlandı", { contextLength: context.length });
        return context;
        
    } catch (error) {
        Logger.error("Bağlam verisi toplanırken hata", { error: error.message });
        console.error("Bağlam verisi toplanırken hata:", error);
        return "Veri toplama hatası: " + error.message;
    }
}

// Belirli bir sipariş detaylarını getir
async function fetchSpecificOrderDetails(orderNumber) {
    try {
        // Gerçek uygulamada API çağrısı yapılır
        // Demo amaçlı sabit veri
        const allOrders = [
            { 
                orderNumber: "0424-1251", 
                customer: "AYEDAŞ", 
                cellType: "RM 36 CB", 
                status: "Üretimde",
                deliveryDate: "15.07.2024",
                quantity: 5,
                progress: 45,
                currentStage: "Montaj",
                notes: "Müşteri acil olduğunu belirtti"
            },
            { 
                orderNumber: "0424-1245", 
                customer: "BEDAŞ", 
                cellType: "RM 36 CB", 
                status: "Malzeme Bekliyor",
                deliveryDate: "22.07.2024",
                quantity: 3,
                progress: 15,
                currentStage: "Malzeme Tedarik",
                notes: "Röle tedarikinde gecikme yaşanıyor"
            },
            { 
                orderNumber: "0424-1239", 
                customer: "TEİAŞ", 
                cellType: "RM 36 LB", 
                status: "Üretimde",
                deliveryDate: "10.08.2024",
                quantity: 10,
                progress: 30,
                currentStage: "Kablaj",
                notes: ""
            },
            { 
                orderNumber: "2405-1234", 
                customer: "UEDAŞ", 
                cellType: "RM 36 FL", 
                status: "Planlama",
                deliveryDate: "25.08.2024",
                quantity: 7,
                progress: 5,
                currentStage: "Tasarım",
                notes: "Müşteri teknik detayları revize etti"
            }
        ];
        
        // OrderNumber ile eşleşen siparişi bul
        const order = allOrders.find(order => 
            order.orderNumber === orderNumber || 
            order.orderNumber.replace(/[-]/g, '') === orderNumber
        );
        
        return order || null;
    } catch (error) {
        console.error("Sipariş detayları alınırken hata:", error);
        return null;
    }
}

// Geciken siparişleri getir
async function fetchDelayedOrders() {
    try {
        // Gerçek uygulamada API çağrısı yapılır
        // Demo amaçlı sabit veri
        return [
            { 
                orderNumber: "0424-1201", 
                customer: "EDAŞ A.Ş.", 
                cellType: "RM 36 CB", 
                status: "Gecikme",
                delayDays: 5,
                delayReason: "Malzeme tedarikinde yaşanan sorunlar",
                newEstimatedDelivery: "20.07.2024"
            },
            { 
                orderNumber: "0424-1187", 
                customer: "Enerji Ltd.", 
                cellType: "RM 36 RMU", 
                status: "Gecikme",
                delayDays: 3,
                delayReason: "Üretim kapasitesi aşıldı",
                newEstimatedDelivery: "16.07.2024"
            }
        ];
    } catch (error) {
        console.error("Geciken sipariş verileri alınırken hata:", error);
        return [];
    }
}

// Teknik veri bilgilerini getir
async function fetchTechnicalData() {
    try {
        // Gerçek uygulamada API çağrısı yapılır
        // Demo amaçlı sabit veri
        return {
            "CB_Hücre_Veri": "Orta gerilim kesicili hücre, 36kV, 31.5kA, 1250A nominal akım kapasitesi",
            "LB_Hücre_Veri": "Orta gerilim yük ayırıcılı hücre, 36kV, 25kA, 630A nominal akım kapasitesi",
            "FL_Hücre_Veri": "Orta gerilim sigortalı hücre, 36kV, 200A limit akım",
            "RMU_Hücre_Veri": "Ring Main Unit, kompakt metal muhafazalı gaz izoleli şalt cihazı, 36kV"
        };
    } catch (error) {
        console.error("Teknik veri bilgileri alınırken hata:", error);
        return null;
    }
}

// Aktif siparişleri getir
async function fetchActiveOrders() {
    try {
        // Gerçek uygulamada API çağrısı yapılır
        // Demo amaçlı sabit veri
        return [
            { orderNumber: "0424-1251", customer: "AYEDAŞ", cellType: "RM 36 CB", status: "Üretimde" },
            { orderNumber: "0424-1245", customer: "BEDAŞ", cellType: "RM 36 CB", status: "Malzeme Bekliyor" },
            { orderNumber: "0424-1239", customer: "TEİAŞ", cellType: "RM 36 LB", status: "Üretimde" }
        ];
    } catch (error) {
        console.error("Sipariş verileri alınırken hata:", error);
        return [];
    }
}

// Kritik malzemeleri getir
async function fetchCriticalMaterials() {
    try {
        // Gerçek uygulamada API çağrısı yapılır
        // Demo amaçlı sabit veri
        return [
            { code: "137998%", name: "Siemens 7SR1003-1JA20-2DA0+ZY20 24VDC", stock: 2, required: 8 },
            { code: "144866%", name: "KAP-80/190-95 Akım Trafosu", stock: 3, required: 5 },
            { code: "120170%", name: "M480TB/G-027-95.300UN5 Kablo Başlığı", stock: 12, required: 15 }
        ];
    } catch (error) {
        console.error("Malzeme verileri alınırken hata:", error);
        return [];
    }
}

// Üretim durumunu getir
async function fetchProductionStatus() {
    try {
        // Gerçek uygulamada API çağrısı yapılır
        // Demo amaçlı detaylı veri
        return {
            inProgress: 18,
            delayed: 3,
            completed: 42,
            capacity: 25, // Günlük kapasite
            efficiency: 89, // Üretim verimliliği
            
            // Üretim aşamalarına göre istatistikler
            stageStats: {
                "Tasarım": 4,
                "Malzeme Tedarik": 7,
                "Mekanik Üretim": 5,
                "Montaj": 8,
                "Kablaj": 3,
                "Test": 6
            },
            
            // Gecikme istatistikleri
            delayStats: {
                "Malzeme Tedarik Gecikmesi": 2,
                "Personel Eksikliği": 1,
                "Teknik Sorun": 0,
                "Müşteri Değişikliği": 1
            },
            
            // Üretim süresi ortalamaları (gün cinsinden)
            averageTimes: {
                "RM 36 CB": 18.5,
                "RM 36 LB": 15.2,
                "RM 36 FL": 20.3,
                "RM 36 RMU": 12.8
            },
            
            // Önümüzdeki dönem için üretim tahmini
            forecast: {
                "Gelecek Hafta": 12,
                "Gelecek Ay": 48,
                "Üç Aylık Dönem": 140
            }
        };
    } catch (error) {
        console.error("Üretim durumu alınırken hata:", error);
        return null;
    }
}

// Demo yanıt oluştur (Yapay Zeka mevcut değilse)
function generateDemoResponse(message) {
    message = message.toLowerCase();
    
    if (message.includes('merhaba') || message.includes('selam')) {
        return 'Merhaba! Size nasıl yardımcı olabilirim?';
    } else if (message.includes('sipariş') && message.includes('durum')) {
        return 'Aktif siparişlerinizi kontrol ediyorum... AYEDAŞ siparişi (24-03-A001) üretim aşamasında, BAŞKENT EDAŞ siparişi (24-03-B002) için malzeme tedarik sorunu bulunuyor.';
    } else if (message.includes('malzeme') || message.includes('stok')) {
        return 'Stok durumunu kontrol ediyorum... Kablo başlıkları ve gerilim gösterge malzemelerinde eksiklik var. Satın alma departmanı tedarik işlemlerini yürütüyor.';
    } else if (message.includes('üretim') && message.includes('süre')) {
        return 'Orta gerilim hücrelerinin üretim süreleri: CB tipi ~18 gün, LB tipi ~15 gün, FL tipi ~20 gün. Bu süreler; malzeme tedariki, mekanik üretim, montaj ve test süreçlerini içermektedir.';
    } else if (message.includes('kritik') || message.includes('acil')) {
        return 'Kritik durum listesi: Siemens 7SR1003-1JA20-2DA0+ZY20 24VDC rölesinde kritik stok seviyesi (2 adet kaldı, 8 adet gerekli). AYEDAŞ siparişi için tedarik bekliyor.';
    } else if (message.includes('teknik') || message.includes('hücre')) {
        return 'RM 36 serisi hücre tipleri: CB (Kesicili), LB (Yük Ayırıcılı), FL (Kontaktör+Sigortalı), RMU (Ring Main Unit). Nominal gerilim 36kV, kısa devre akımı 31.5kA, nominal akım 630-1250A arasında değişmektedir.';
    } else if (message.includes('analiz') || message.includes('rapor')) {
        return 'Son 6 ayın üretim analizi: 218 adet hücre tamamlandı (42 CB, 96 LB, 68 FL, 12 RMU). Ortalama tamamlanma süresi 17 gün. Gecikme oranı %8. Öncelikli iyileştirme alanı: Kablaj süreçleri.';
    } else if (message.includes('tedarikçi') || message.includes('satın alma')) {
        return 'En aktif tedarikçiler: 1) Elektrik Malzemeleri A.Ş. (Koruma röleleri) 2) Mekanik Parçalar Ltd. (Metal kasalar) 3) Kablo Sistemleri (Güç kabloları). En uzun tedarik süresi: İthal röle bileşenleri (ortalama 45 gün).';
    } else {
        return 'Bu konu hakkında şu anda detaylı bilgi sunamıyorum. Sorgunuzu daha spesifik hale getirmeyi veya başka bir konuda yardım istemeyi deneyebilirsiniz.';
    }
}

// Yanıta göre eylem öner
function suggestActionsBasedOnResponse(message, response, chatBody) {
    const actionButtons = document.createElement('div');
    actionButtons.className = 'action-buttons';
    
    // Sipariş durumu ile ilgili ise
    if (message.toLowerCase().includes('sipariş') || message.toLowerCase().includes('order')) {
        actionButtons.innerHTML = `
            <button class="action-btn" onclick="window.location.href='#orders-page'">
                <i class="fas fa-clipboard-list"></i> Sipariş Listesi
            </button>
            <button class="action-btn" onclick="window.showCreateOrderModal()">
                <i class="fas fa-plus"></i> Yeni Sipariş
            </button>
        `;
    }
    
    // Malzeme ve stok ile ilgili ise
    else if (message.toLowerCase().includes('malzeme') || message.toLowerCase().includes('stok') || message.toLowerCase().includes('material')) {
        actionButtons.innerHTML = `
            <button class="action-btn" onclick="window.location.href='#inventory-page'">
                <i class="fas fa-boxes"></i> Stok Yönetimi
            </button>
            <button class="action-btn" onclick="window.location.href='#purchasing-page'">
                <i class="fas fa-shopping-cart"></i> Satın Alma
            </button>
        `;
    }
    
    // Üretim ile ilgili ise
    else if (message.toLowerCase().includes('üretim') || message.toLowerCase().includes('production')) {
        actionButtons.innerHTML = `
            <button class="action-btn" onclick="window.location.href='#production-page'">
                <i class="fas fa-industry"></i> Üretim Takibi
            </button>
            <button class="action-btn" onclick="window.showProductionPlan()">
                <i class="fas fa-calendar-alt"></i> Üretim Planı
            </button>
        `;
    }
    
    // Teknik bilgiler ile ilgili ise
    else if (message.toLowerCase().includes('teknik') || message.toLowerCase().includes('hücre') || message.toLowerCase().includes('cell')) {
        actionButtons.innerHTML = `
            <button class="action-btn" onclick="window.location.href='#technical-page'">
                <i class="fas fa-cogs"></i> Teknik Dökümanlar
            </button>
            <button class="action-btn" onclick="window.showTechnicalSpecs()">
                <i class="fas fa-file-alt"></i> Teknik Şartnameler
            </button>
        `;
    }
    
    // Analiz ve rapor ile ilgili ise
    else if (message.toLowerCase().includes('analiz') || message.toLowerCase().includes('rapor')) {
        actionButtons.innerHTML = `
            <button class="action-btn" onclick="window.location.href='#dashboard-page'">
                <i class="fas fa-chart-bar"></i> Dashboard
            </button>
            <button class="action-btn" onclick="window.showReports()">
                <i class="fas fa-file-excel"></i> Raporlar
            </button>
        `;
    }
    
    // Eylem butonları varsa ekle
    if (actionButtons.innerHTML.trim() !== '') {
        chatBody.appendChild(actionButtons);
    }
}

// Chatbot UI bileşenini oluştur
function createChatbotUIIfNeeded() {
    if (document.getElementById('chatbot-window')) return;
    
    // Stil ekle
    const style = document.createElement('style');
    style.textContent = `
        /* Chatbot Stilleri */
        .ai-chatbot-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background-color: #1e40af;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            transition: all 0.3s ease;
        }
        
        .ai-chatbot-btn:hover {
            transform: scale(1.1);
            background-color: #1e3a8a;
        }
        
        .notification-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            background-color: #ef4444;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            font-size: 12px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .chatbot-window {
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 350px;
            height: 500px;
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            display: flex;
            flex-direction: column;
            z-index: 1000;
            overflow: hidden;
            transition: all 0.3s ease;
        }
        
        .chatbot-header {
            background-color: #1e40af;
            color: white;
            padding: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-shrink: 0;
        }
        
        .chatbot-title {
            font-weight: bold;
            font-size: 16px;
        }
        
        .chatbot-controls {
            display: flex;
            gap: 10px;
        }
        
        .chatbot-btn {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            width: 30px;
            height: 30px;
            display: flex;
            justify-content: center;
            align-items: center;
            border-radius: 50%;
            transition: all 0.2s ease;
        }
        
        .chatbot-btn:hover {
            background-color: rgba(255, 255, 255, 0.2);
        }
        
        .chatbot-body {
            flex-grow: 1;
            padding: 15px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .chatbot-footer {
            padding: 10px 15px;
            display: flex;
            gap: 10px;
            border-top: 1px solid #e5e7eb;
            flex-shrink: 0;
        }
        
        .chatbot-input {
            flex-grow: 1;
            padding: 10px 15px;
            border-radius: 20px;
            border: 1px solid #d1d5db;
            outline: none;
            transition: border 0.2s ease;
        }
        
        .chatbot-input:focus {
            border-color: #1e40af;
        }
        
        .chatbot-btn.send {
            background-color: #1e40af;
            color: white;
            border-radius: 50%;
            width: 40px;
            height: 40px;
        }
        
        .chatbot-btn.send:hover {
            background-color: #1e3a8a;
        }
        
        .chat-message {
            padding: 10px 15px;
            border-radius: 10px;
            max-width: 80%;
            line-height: 1.5;
        }
        
        .chat-message.user {
            background-color: #1e40af;
            color: white;
            align-self: flex-end;
        }
        
        .chat-message.bot {
            background-color: #f3f4f6;
            color: #1f2937;
            align-self: flex-start;
        }
        
        .chat-message.bot.error {
            background-color: #fee2e2;
            color: #b91c1c;
        }
        
        .chat-message.bot.deepseek-response {
            border-left: 4px solid #0891b2;
        }
        
        .chat-message.bot.openai-response {
            border-left: 4px solid #059669;
        }
        
        .chat-message.bot.demo-response {
            border-left: 4px solid #d97706;
        }
        
        .quick-questions {
            list-style: none;
            padding: 0;
            margin-top: 10px;
        }
        
        .quick-questions li {
            margin-bottom: 8px;
        }
        
        .quick-question {
            color: #1e40af;
            text-decoration: none;
            font-size: 14px;
            display: block;
            padding: 5px 10px;
            background-color: #e0e7ff;
            border-radius: 15px;
            transition: background-color 0.2s ease;
        }
        
        .quick-question:hover {
            background-color: #c7d2fe;
            text-decoration: none;
        }
        
        .action-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;
            align-self: flex-start;
        }
        
        .action-btn {
            background-color: #1e40af;
            color: white;
            border: none;
            border-radius: 5px;
            padding: 6px 12px;
            font-size: 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 5px;
            transition: background-color 0.2s ease;
        }
        
        .action-btn:hover {
            background-color: #1e3a8a;
        }
        
        .chat-chart-container {
            width: 100%;
            height: 200px;
            margin-top: 10px;
            background-color: white;
            border-radius: 5px;
            overflow: hidden;
        }
        
        @media (max-width: 768px) {
            .chatbot-window {
                width: 90%;
                height: 70vh;
                bottom: 80px;
                right: 5%;
            }
        }
    `;
    document.head.appendChild(style);
    
    const chatbotUI = document.createElement('div');
    chatbotUI.innerHTML = `
        <div id="chatbot-btn" class="ai-chatbot-btn" onclick="ChatBot.toggleChatbot()">
            <i class="fas fa-robot"></i>
            <span class="notification-badge">1</span>
        </div>
        <div id="chatbot-window" class="chatbot-window" style="display: none;">
            <div class="chatbot-header">
                <div class="chatbot-title">Mehmet Endüstriyel Takip AI Asistanı</div>
                <div class="chatbot-controls">
                    <button class="chatbot-btn minimize" onclick="ChatBot.toggleChatbot()">
                        <i class="fas fa-minus"></i>
                    </button>
                </div>
            </div>
            <div id="chatbot-body" class="chatbot-body"></div>
            <div class="chatbot-footer">
                <input type="text" id="chatbot-input" class="chatbot-input" placeholder="Bir soru sorun..." />
                <button class="chatbot-btn send" onclick="ChatBot.sendChatMessage()">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(chatbotUI);
    
    // Enter tuşuna basıldığında mesaj gönderme
    document.getElementById('chatbot-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            window.ChatBot.sendChatMessage();
        }
    });
    
    // Bildirim etkisini 3 saniye sonra kaldır
    setTimeout(() => {
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            badge.style.display = 'none';
        }
    }, 3000);
    
    Logger.info("Chatbot UI başarıyla oluşturuldu");
}

// Sayfa yüklendiğinde Chatbot UI'yi oluştur
document.addEventListener('DOMContentLoaded', function() {
    createChatbotUIIfNeeded();
});