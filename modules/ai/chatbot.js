/**
 * Chatbot Modülü
 * Yapay zeka asistanı ile iletişim arayüzü sağlar
 */

// Logger oluştur
const log = window.logger ? window.logger('Chatbot') : console;

// Chatbot sınıfı
class Chatbot {
    constructor() {
        this.messages = [];
        this.initialized = false;
        this.aiService = window.aiService;
        
        this.init();
    }
    
    init() {
        log.info('Chatbot başlatılıyor...');
        
        // DOM elementleri
        this.chatModal = document.getElementById('aiChatModal');
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('aiChatInput');
        this.sendButton = document.getElementById('sendChatBtn');
        
        // Event listeners
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => this.sendMessage());
        }
        
        if (this.chatInput) {
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }
        
        // Hoşgeldin mesajı ekle
        this.addMessage('ai', 'Merhaba! Ben MehmetEndüstriyelTakip yapay zeka asistanı. Size nasıl yardımcı olabilirim?');
        
        this.initialized = true;
        log.info('Chatbot başarıyla başlatıldı');
    }
    
    async sendMessage() {
        if (!this.initialized || !this.chatInput || !this.aiService) {
            log.error('Chatbot henüz hazır değil');
            return;
        }
        
        const message = this.chatInput.value.trim();
        if (!message) return;
        
        // Kullanıcı mesajını ekle
        this.addMessage('user', message);
        this.chatInput.value = '';
        
        try {
            // Yapay zeka yanıtını al
            const response = await this.aiService.query(message);
            
            if (response.error) {
                this.addMessage('ai', 'Üzgünüm, bir hata oluştu: ' + response.error);
                return;
            }
            
            // Yanıta göre mesaj formatı
            if (response.type === 'text' || !response.type) {
                this.addMessage('ai', response.content || response.text);
            } else if (response.type === 'orderStatus') {
                let content = `${response.content}\n\n`;
                response.data.forEach(order => {
                    content += `- ${order.id} (${order.customer}): ${order.status}, İlerleme: %${order.progress}\n`;
                });
                this.addMessage('ai', content);
            } else if (response.type === 'materialStatus') {
                let content = `${response.content}\n\n`;
                response.data.forEach(material => {
                    content += `- ${material.code} (${material.name}): Stok ${material.stock}, İhtiyaç: ${material.required}\n`;
                });
                this.addMessage('ai', content);
            } else if (response.type === 'technicalInfo') {
                let content = `${response.content}\n\n`;
                content += `Tipler: ${response.data.types.join(', ')}\n`;
                content += `Gerilim: ${response.data.voltage}\n`;
                content += `Akım: ${response.data.current}\n`;
                content += `Kısa Devre: ${response.data.shortCircuit}`;
                this.addMessage('ai', content);
            } else {
                this.addMessage('ai', JSON.stringify(response));
            }
        } catch (error) {
            log.error('Mesaj gönderilirken hata oluştu', error);
            this.addMessage('ai', 'Üzgünüm, bir sorun oluştu. Lütfen tekrar deneyin.');
        }
    }
    
    addMessage(type, text) {
        if (!this.chatMessages) return;
        
        // Mesajı listeye ekle
        this.messages.push({ type, text, timestamp: new Date() });
        
        // Mesajı DOM'a ekle
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type === 'user' ? 'user-message' : 'ai-message'}`;
        
        // Mesaj metnini formatlama (basit markdown benzeri)
        let formattedText = text;
        
        // Satır sonlarını <br> yap
        formattedText = formattedText.replace(/\n/g, '<br>');
        
        messageDiv.innerHTML = formattedText;
        this.chatMessages.appendChild(messageDiv);
        
        // Sohbeti en alta kaydır
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    showNotification(count = 1) {
        const badge = document.querySelector('.ai-chatbot-btn .notification-badge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = 'flex';
        }
    }
    
    clearNotifications() {
        const badge = document.querySelector('.ai-chatbot-btn .notification-badge');
        if (badge) {
            badge.style.display = 'none';
        }
    }
}

// Global olarak chatbot nesnesini oluştur
window.chatbot = new Chatbot();

// Chatbot toggle fonksiyonu
function toggleChatbot() {
    log.info('Chatbot açılıyor');
    const chatModal = new bootstrap.Modal(document.getElementById('aiChatModal'));
    chatModal.show();
    
    // Bildirim işaretini temizle
    if (window.chatbot) {
        window.chatbot.clearNotifications();
    }
}

// Global olarak toggleChatbot fonksiyonunu ekle
window.toggleChatbot = toggleChatbot;

log.info('Chatbot modülü başarıyla yüklendi');