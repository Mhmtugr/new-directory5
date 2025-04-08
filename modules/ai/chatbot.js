/**
 * chatbot.js
 * Yapay zeka asistanı işlevleri
 */

(function() {
    console.log('Chatbot module loaded.');

    var AppConfig = window.AppConfig;
    var AdvancedAI = window.AdvancedAI;
    var AIIntegrationModule = window.AIIntegrationModule;
    var Logger = window.Logger;
    var aiService = window.aiService;

    function Chatbot() {
        this.container = document.querySelector('.ai-chatbot-container');
        this.messagesContainer = this.container.querySelector('.chat-messages');
        this.input = this.container.querySelector('input');
        this.sendButton = this.container.querySelector('.send-message');
        this.closeButton = this.container.querySelector('.close-chat');
        this.chatbotButton = document.querySelector('.ai-chatbot-btn');
        this.isOpen = false;
    }

    Chatbot.prototype.initialize = function() {
        this.setupEventListeners();
        this.addWelcomeMessage();
    };

    Chatbot.prototype.setupEventListeners = function() {
        var self = this;

        // Chatbot butonuna tıklama
        this.chatbotButton.addEventListener('click', function() {
            self.toggleChat();
        });

        // Kapatma butonuna tıklama
        this.closeButton.addEventListener('click', function() {
            self.closeChat();
        });

        // Mesaj gönderme
        this.sendButton.addEventListener('click', function() {
            self.sendMessage();
        });
        this.input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') self.sendMessage();
        });
    };

    Chatbot.prototype.toggleChat = function() {
        this.isOpen = !this.isOpen;
        this.container.style.display = this.isOpen ? 'flex' : 'none';
        if (this.isOpen) {
            this.input.focus();
        }
    };

    Chatbot.prototype.closeChat = function() {
        this.isOpen = false;
        this.container.style.display = 'none';
    };

    Chatbot.prototype.sendMessage = function() {
        var self = this;
        var message = this.input.value.trim();
        if (!message) return;

        // Kullanıcı mesajını ekle
        this.addMessage(message, 'user');
        this.input.value = '';

        aiService.processQuery(message).then(function(response) {
            // AI yanıtını ekle
            self.addMessage(response, 'assistant');
        }).catch(function(error) {
            console.error('Chatbot error:', error);
            self.addMessage('Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.', 'assistant');
        });
    };

    Chatbot.prototype.addMessage = function(content, type) {
        var messageElement = document.createElement('div');
        messageElement.className = 'chat-message ' + type;

        var time = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

        messageElement.innerHTML = `
            <div class="message-content">${content}</div>
            <div class="message-time">${time}</div>
        `;

        this.messagesContainer.appendChild(messageElement);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    };

    Chatbot.prototype.addWelcomeMessage = function() {
        var welcomeMessage = `
            Merhaba! Ben MehmetEndüstriyel'in yapay zeka asistanıyım. Size nasıl yardımcı olabilirim?
            
            Örnek sorular:
            - Sipariş durumunu nasıl öğrenebilirim?
            - Üretim planı nedir?
            - Stok durumu nasıl?
        `;
        this.addMessage(welcomeMessage, 'assistant');
    };

    var chatbot = new Chatbot();
    window.toggleChatbot = function() {
        chatbot.toggleChat();
    };
    window.chatbot = chatbot;

    // Hoşgeldin mesajı göster
    function showWelcomeMessage() {
        var chatBody = document.getElementById('chatbot-body');
        if (!chatBody) return;

        var welcomeMessage = document.createElement('div');
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
        welcomeMessage.querySelectorAll('.quick-question').forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                var question = this.getAttribute('data-question');
                document.getElementById('chatbot-input').value = question;
                sendChatMessage();
            });
        });
    }

    // Mesaj gönderme
    function sendChatMessage() {
        var input = document.getElementById('chatbot-input');
        var message = input.value.trim();

        if (message === '') return;

        // Kullanıcı mesajını ekle
        var chatBody = document.getElementById('chatbot-body');
        var userMessageElement = document.createElement('div');
        userMessageElement.className = 'chat-message user';
        userMessageElement.textContent = message;
        chatBody.appendChild(userMessageElement);

        // Input'u temizle
        input.value = '';

        // Yanıt oluşturma (yapay zeka ile entegrasyon)
        generateBotResponse(message, chatBody);

        // Scroll to bottom
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // Yapay zeka yanıtı oluşturma
    function generateBotResponse(message, chatBody) {
        var loadingElement = document.createElement('div');
        loadingElement.className = 'chat-message bot';
        loadingElement.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Yanıt hazırlanıyor...';
        chatBody.appendChild(loadingElement);

        var chatHistory = getChatHistory();

        collectContextData(message).then(function(context) {
            Logger.info("Chatbot bağlam verileri toplandı", {
                messageLength: message.length,
                contextLength: context.length,
                historyLength: chatHistory.length
            });

            var botResponse = '';
            var responseSource = '';

            var tryDeepSeek = function() {
                if (window.AIIntegrationModule && typeof window.AIIntegrationModule.askDeepSeek === 'function') {
                    Logger.info("DeepSeek AI modeli kullanılıyor");

                    return window.AIIntegrationModule.askDeepSeek(message, context).then(function(response) {
                        botResponse = response;
                        responseSource = 'deepseek';
                        Logger.info("DeepSeek yanıtı alındı", { responseLength: botResponse.length });
                    });
                } else {
                    Logger.warn("DeepSeek AI modülü bulunamadı veya askDeepSeek fonksiyonu yok");
                    return Promise.reject(new Error("DeepSeek modülü bulunamadı"));
                }
            };

            var tryOpenAI = function() {
                if (window.AIIntegrationModule && typeof window.AIIntegrationModule.askOpenAI === 'function') {
                    Logger.info("OpenAI modeli kullanılıyor");

                    return window.AIIntegrationModule.askOpenAI(message, context).then(function(response) {
                        botResponse = response;
                        responseSource = 'openai';
                        Logger.info("OpenAI yanıtı alındı", { responseLength: botResponse.length });
                    });
                } else {
                    Logger.warn("OpenAI modülü bulunamadı veya askOpenAI fonksiyonu yok");
                    return Promise.reject(new Error("OpenAI modülü bulunamadı"));
                }
            };

            var tryAdvancedAI = function() {
                if (typeof AdvancedAI !== 'undefined' && typeof AdvancedAI.askQuestion === 'function') {
                    Logger.info("AdvancedAI modülü kullanılıyor");

                    return AdvancedAI.askQuestion(message, context).then(function(response) {
                        botResponse = response;
                        responseSource = 'advanced';
                        Logger.info("AdvancedAI yanıtı alındı", { responseLength: botResponse.length });
                    });
                } else {
                    Logger.warn("AdvancedAI modülü bulunamadı veya askQuestion fonksiyonu yok");
                    return Promise.reject(new Error("AdvancedAI modülü bulunamadı"));
                }
            };

            var tryDemoResponse = function() {
                botResponse = generateDemoResponse(message);
                responseSource = 'demo';
                Logger.info("Demo yanıtı oluşturuldu", { responseLength: botResponse.length });
                return Promise.resolve();
            };

            tryDeepSeek().catch(function() {
                return tryOpenAI();
            }).catch(function() {
                return tryAdvancedAI();
            }).catch(function() {
                return tryDemoResponse();
            }).finally(function() {
                chatBody.removeChild(loadingElement);

                botResponse = botResponse || "Üzgünüm, bir yanıt oluşturulamadı. Lütfen daha sonra tekrar deneyin.";

                var messageClass = 'chat-message bot';
                if (responseSource === 'deepseek') {
                    messageClass += ' deepseek-response';
                } else if (responseSource === 'openai') {
                    messageClass += ' openai-response';
                } else if (responseSource === 'demo') {
                    messageClass += ' demo-response';
                }

                botResponse = formatResponse(botResponse);

                var timestamp = new Date().toLocaleTimeString();
                var botMessageElement = document.createElement('div');
                botMessageElement.className = messageClass;
                botMessageElement.innerHTML = `<span class="message-content">${botResponse}</span><span class="message-time">${timestamp}</span>`;
                chatBody.appendChild(botMessageElement);

                chatBody.scrollTop = chatBody.scrollHeight;

                saveChatHistory({
                    role: 'assistant',
                    content: botResponse,
                    timestamp: new Date().toISOString(),
                    source: responseSource
                });

                processVisualizationRequests(message, botResponse, botMessageElement);

                if (botResponse.length > 50) {
                    suggestActionsBasedOnResponse(message, botResponse, chatBody);
                }
            });
        }).catch(function(error) {
            Logger.error("Bot yanıtı oluşturulurken hata", { error: error.message });

            var errorElement = document.createElement('div');
            errorElement.className = 'chat-message bot error';
            errorElement.innerHTML = `<span class="message-content">Üzgünüm, bir hata oluştu: ${error.message}</span>`;
            chatBody.appendChild(errorElement);

            chatBody.scrollTop = chatBody.scrollHeight;
        });
    }

    // Sayfa yüklendiğinde Chatbot UI'yi oluştur
    document.addEventListener('DOMContentLoaded', function() {
        createChatbotUIIfNeeded();
    });
})();