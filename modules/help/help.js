/**
 * help.js
 * Yardım ve Destek Modülü
 */

// Global state for help management
let helpData = {
    loaded: false,
    faqs: [],
    documents: [],
    searchTerm: ''
};

/**
 * Yardım verilerini yükler.
 */
async function loadHelpData() {
    console.log("Yardım verileri yükleniyor...");
    if (helpData.loaded) {
        console.log("Yardım verileri zaten yüklü.");
        renderHelpContent();
        return;
    }

    showLoadingIndicator('help-container');

    try {
        // Verileri ERPService'den veya lokalden al
        if (window.ERPService && typeof window.ERPService.getHelpData === 'function') {
            const data = await window.ERPService.getHelpData();
            helpData.faqs = data.faqs || [];
            helpData.documents = data.documents || [];
            console.log("Yardım verileri ERPService'den yüklendi.");
        } else {
            // Demo veri
            helpData.faqs = [
                {
                    id: 'faq-1',
                    question: 'Yeni bir sipariş nasıl oluşturulur?',
                    answer: 'Sol menüdeki "Siparişler" sekmesine gidin ve "Yeni Sipariş Oluştur" butonuna tıklayın. Açılan formdaki gerekli bilgileri doldurun ve kaydedin.',
                    category: 'orders'
                },
                {
                    id: 'faq-2',
                    question: 'Malzeme stok durumu nasıl kontrol edilir?',
                    answer: '"Malzeme Yönetimi" sekmesine gidin. Buradan tüm malzemelerin stok durumlarını, kritik seviyeleri ve detaylarını görebilirsiniz. Filtreleme seçeneklerini kullanarak aradığınız malzemeyi bulabilirsiniz.',
                    category: 'materials'
                },
                {
                    id: 'faq-3',
                    question: 'Raporları nasıl dışa aktarabilirim?',
                    answer: '"Raporlar & Analizler" sekmesinde, istediğiniz raporun üzerindeki "Rapor Al" butonuna tıklayarak PDF veya Excel formatında dışa aktarabilirsiniz.',
                    category: 'reports'
                },
                {
                    id: 'faq-4',
                    question: 'Şifremi nasıl değiştirebilirim?',
                    answer: 'Sağ üst köşedeki kullanıcı menüsünden "Profil" seçeneğine gidin. Profil sayfasındaki "Güvenlik" bölümünde "Şifre Değiştir" butonunu kullanabilirsiniz.',
                    category: 'profile'
                }
            ];
            helpData.documents = [
                {
                    id: 'doc-1',
                    title: 'Kullanım Kılavuzu v1.0',
                    description: 'Sistemin genel kullanımı hakkında detaylı bilgi.',
                    link: '/docs/user_manual_v1.pdf',
                    category: 'general'
                },
                {
                    id: 'doc-2',
                    title: 'Sipariş Yönetimi Rehberi',
                    description: 'Sipariş oluşturma, düzenleme ve takip işlemleri.',
                    link: '/docs/order_guide.pdf',
                    category: 'orders'
                }
            ];
            console.log("Demo yardım verileri yüklendi.");
        }

        helpData.loaded = true;
        renderHelpContent();
    } catch (error) {
        console.error("Yardım verileri yüklenirken hata:", error);
        showToast("Yardım verileri yüklenemedi.", "error");
    } finally {
        hideLoadingIndicator('help-container');
    }
}

/**
 * Yardım içeriğini render eder.
 */
function renderHelpContent() {
    const container = document.getElementById('help-container');
    if (!container) return;

    const filteredFaqs = helpData.faqs.filter(faq => 
        faq.question.toLowerCase().includes(helpData.searchTerm.toLowerCase()) || 
        faq.answer.toLowerCase().includes(helpData.searchTerm.toLowerCase())
    );
    const filteredDocs = helpData.documents.filter(doc => 
        doc.title.toLowerCase().includes(helpData.searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(helpData.searchTerm.toLowerCase())
    );

    container.innerHTML = `
        <div class="row mb-4">
            <div class="col-12">
                <div class="input-group">
                    <span class="input-group-text"><i class="fas fa-search"></i></span>
                    <input type="text" class="form-control" placeholder="Yardım konularında ara..." 
                           value="${helpData.searchTerm}" oninput="updateHelpSearchTerm(this.value)">
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-md-8">
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Sıkça Sorulan Sorular (SSS)</h5>
                    </div>
                    <div class="card-body">
                        <div class="accordion" id="faqAccordion">
                            ${filteredFaqs.length > 0 ? filteredFaqs.map((faq, index) => `
                                <div class="accordion-item">
                                    <h2 class="accordion-header" id="faqHeading-${index}">
                                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" 
                                                data-bs-target="#faqCollapse-${index}" aria-expanded="false" aria-controls="faqCollapse-${index}">
                                            ${faq.question}
                                        </button>
                                    </h2>
                                    <div id="faqCollapse-${index}" class="accordion-collapse collapse" 
                                         aria-labelledby="faqHeading-${index}" data-bs-parent="#faqAccordion">
                                        <div class="accordion-body">
                                            ${faq.answer}
                                        </div>
                                    </div>
                                </div>
                            `).join('') : '<p class="text-muted">Aramanızla eşleşen SSS bulunamadı.</p>'}
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Kullanım Kılavuzları ve Dokümanlar</h5>
                    </div>
                    <div class="card-body">
                        <ul class="list-group">
                             ${filteredDocs.length > 0 ? filteredDocs.map(doc => `
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="mb-1">${doc.title}</h6>
                                        <p class="mb-0 text-muted small">${doc.description}</p>
                                    </div>
                                    <a href="${doc.link}" target="_blank" class="btn btn-sm btn-outline-primary">
                                        <i class="fas fa-download"></i> Görüntüle/İndir
                                    </a>
                                </li>
                            `).join('') : '<p class="text-muted">Aramanızla eşleşen doküman bulunamadı.</p>'}
                        </ul>
                    </div>
                </div>
            </div>

            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Destek Talebi</h5>
                    </div>
                    <div class="card-body">
                        <p>Sorun yaşıyorsanız veya yardıma ihtiyacınız varsa destek talebi oluşturabilirsiniz.</p>
                        <form id="support-request-form">
                            <div class="mb-3">
                                <label class="form-label">Konu</label>
                                <input type="text" class="form-control" name="subject" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Açıklama</label>
                                <textarea class="form-control" name="description" rows="5" required></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Ek (İsteğe bağlı)</label>
                                <input type="file" class="form-control" name="attachment">
                            </div>
                            <button type="button" class="btn btn-primary w-100" onclick="submitSupportRequest()">
                                <i class="fas fa-paper-plane"></i> Gönder
                            </button>
                        </form>
                    </div>
                </div>
                <div class="card mt-4">
                    <div class="card-header">
                        <h5 class="card-title mb-0">İletişim</h5>
                    </div>
                    <div class="card-body">
                        <p><i class="fas fa-phone"></i> Telefon: +90 212 123 4567</p>
                        <p><i class="fas fa-envelope"></i> E-posta: destek@mehmetendustriyel.com</p>
                        <p><i class="fas fa-headset"></i> Canlı Destek (Yapay Zeka)</p>
                        <button class="btn btn-secondary btn-sm" onclick="openAIChatbot()">
                           <i class="bi bi-robot"></i> Yapay Zeka Asistanı Başlat
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Yardım arama terimini günceller ve içeriği yeniden render eder.
 */
function updateHelpSearchTerm(term) {
    helpData.searchTerm = term;
    renderHelpContent();
}

/**
 * Destek talebini gönderir.
 */
async function submitSupportRequest() {
    const form = document.getElementById('support-request-form');
    if (!form) return;

    const formData = new FormData(form);
    const requestData = {
        subject: formData.get('subject'),
        description: formData.get('description'),
        attachment: formData.get('attachment') // Dosya işleme sunucu tarafında yapılmalı
    };

    if (!requestData.subject || !requestData.description) {
        showToast("Lütfen konu ve açıklama alanlarını doldurun.", "warning");
        return;
    }

    try {
        // Talebi ERPService'e veya destek sistemine gönder
        if (window.ERPService && typeof window.ERPService.submitSupportRequest === 'function') {
            const result = await window.ERPService.submitSupportRequest(requestData);
             if (result && result.success) {
                 showToast("Destek talebiniz başarıyla gönderildi.", "success");
                 form.reset();
             } else {
                showToast("Destek talebi gönderilemedi.", "error");
             }
        } else {
            // Demo mesajı
            console.log("Destek Talebi Gönderildi (Demo):", requestData);
            showToast("Destek talebiniz başarıyla gönderildi (Demo).", "success");
            form.reset();
        }
    } catch (error) {
        console.error("Destek talebi gönderilirken hata:", error);
        showToast("Destek talebi gönderilirken bir hata oluştu.", "error");
    }
}

/**
 * Yapay zeka chatbot penceresini açar.
 */
function openAIChatbot() {
     if (typeof toggleChatbotWindow === 'function') {
         // Eğer chatbot penceresi kapalıysa aç
         const chatbotWindow = document.querySelector('.ai-chatbot-window');
         if(chatbotWindow && chatbotWindow.style.display === 'none') {
            toggleChatbotWindow();
         }
         // TODO: Belki chatbota yardım ile ilgili bir başlangıç mesajı gönderebiliriz.
         // sendChatMessage("Yardım istiyorum.", true); // true: kullanıcı mesajı değil, sistem mesajı
     } else {
        showToast("Yapay zeka asistanı şu an kullanılamıyor.", "info");
     }
}

// Global scope'a fonksiyonları ekle
if (window) {
    window.loadHelpData = loadHelpData;
    window.updateHelpSearchTerm = updateHelpSearchTerm;
    window.submitSupportRequest = submitSupportRequest;
    window.openAIChatbot = openAIChatbot;
}

console.log("Help module loaded."); 