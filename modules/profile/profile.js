/**
 * profile.js
 * Kullanıcı Profili Yönetimi
 */

// Global state for profile management
let profileData = {
    loaded: false,
    user: null,
    activityLog: []
};

/**
 * Profil verilerini yükler.
 */
async function loadProfile() {
    console.log("Profil yükleniyor...");
    if (profileData.loaded) {
        console.log("Profil zaten yüklü.");
        renderProfile();
        return;
    }

    showLoadingIndicator('profile-container');

    try {
        // Kullanıcı bilgilerini ERPService'den al
        if (window.ERPService && typeof window.ERPService.getCurrentUser === 'function') {
            profileData.user = await window.ERPService.getCurrentUser();
            console.log("Profil yüklendi:", profileData.user);
        } else {
            // Demo veri
            profileData.user = {
                id: 1,
                username: 'admin',
                email: 'admin@example.com',
                firstName: 'Admin',
                lastName: 'User',
                role: 'admin',
                status: 'active',
                lastLogin: '2024-03-20T10:00:00',
                phone: '+90 555 123 4567',
                department: 'Yönetim',
                position: 'Sistem Yöneticisi',
                joinDate: '2024-01-01',
                avatar: 'https://via.placeholder.com/150',
                preferences: {
                    theme: 'light',
                    language: 'tr',
                    notifications: true,
                    emailNotifications: true
                }
            };
        }

        // Aktivite logunu yükle
        await loadActivityLog();

        profileData.loaded = true;
        renderProfile();
    } catch (error) {
        console.error("Profil yüklenirken hata:", error);
        showToast("Profil yüklenemedi.", "error");
    } finally {
        hideLoadingIndicator('profile-container');
    }
}

/**
 * Aktivite logunu yükler.
 */
async function loadActivityLog() {
    try {
        // Aktivite logunu ERPService'den al
        if (window.ERPService && typeof window.ERPService.getUserActivityLog === 'function') {
            profileData.activityLog = await window.ERPService.getUserActivityLog();
            console.log("Aktivite logu yüklendi:", profileData.activityLog);
        } else {
            // Demo veri
            profileData.activityLog = [
                {
                    id: 1,
                    type: 'login',
                    description: 'Sisteme giriş yapıldı',
                    date: '2024-03-20T10:00:00',
                    ip: '192.168.1.1'
                },
                {
                    id: 2,
                    type: 'order',
                    description: 'Yeni sipariş oluşturuldu: #12345',
                    date: '2024-03-19T15:30:00',
                    ip: '192.168.1.1'
                },
                {
                    id: 3,
                    type: 'material',
                    description: 'Malzeme stok güncellendi: ABC123',
                    date: '2024-03-18T09:15:00',
                    ip: '192.168.1.1'
                }
            ];
        }
    } catch (error) {
        console.error("Aktivite logu yüklenirken hata:", error);
    }
}

/**
 * Profili render eder.
 */
function renderProfile() {
    const container = document.getElementById('profile-container');
    if (!container) return;

    container.innerHTML = `
        <div class="row">
            <div class="col-md-4">
                <div class="card">
                    <div class="card-body text-center">
                        <img src="${profileData.user.avatar}" class="rounded-circle mb-3" width="150" height="150">
                        <h4>${profileData.user.firstName} ${profileData.user.lastName}</h4>
                        <p class="text-muted">${profileData.user.position}</p>
                        <button type="button" class="btn btn-outline-primary btn-sm" onclick="showEditProfileModal()">
                            <i class="fas fa-edit"></i> Profili Düzenle
                        </button>
                    </div>
                </div>
                <div class="card mt-4">
                    <div class="card-header">
                        <h5 class="card-title mb-0">İletişim Bilgileri</h5>
                    </div>
                    <div class="card-body">
                        <p><i class="fas fa-envelope"></i> ${profileData.user.email}</p>
                        <p><i class="fas fa-phone"></i> ${profileData.user.phone}</p>
                        <p><i class="fas fa-building"></i> ${profileData.user.department}</p>
                        <p><i class="fas fa-briefcase"></i> ${profileData.user.position}</p>
                    </div>
                </div>
                <div class="card mt-4">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Tercihler</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label">Tema</label>
                            <select class="form-select" name="theme" onchange="updatePreference('theme', this.value)">
                                <option value="light" ${profileData.user.preferences.theme === 'light' ? 'selected' : ''}>Açık</option>
                                <option value="dark" ${profileData.user.preferences.theme === 'dark' ? 'selected' : ''}>Koyu</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Dil</label>
                            <select class="form-select" name="language" onchange="updatePreference('language', this.value)">
                                <option value="tr" ${profileData.user.preferences.language === 'tr' ? 'selected' : ''}>Türkçe</option>
                                <option value="en" ${profileData.user.preferences.language === 'en' ? 'selected' : ''}>English</option>
                            </select>
                        </div>
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="checkbox" name="notifications" 
                                   ${profileData.user.preferences.notifications ? 'checked' : ''}
                                   onchange="updatePreference('notifications', this.checked)">
                            <label class="form-check-label">Bildirimler</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" name="emailNotifications" 
                                   ${profileData.user.preferences.emailNotifications ? 'checked' : ''}
                                   onchange="updatePreference('emailNotifications', this.checked)">
                            <label class="form-check-label">E-posta Bildirimleri</label>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Son Aktiviteler</h5>
                    </div>
                    <div class="card-body">
                        <div class="timeline">
                            ${profileData.activityLog.map(activity => `
                                <div class="timeline-item">
                                    <div class="timeline-marker bg-${getActivityTypeColor(activity.type)}"></div>
                                    <div class="timeline-content">
                                        <h6 class="mb-1">${activity.description}</h6>
                                        <p class="text-muted mb-0">
                                            ${formatDate(activity.date)} - IP: ${activity.ip}
                                        </p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="card mt-4">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Güvenlik</h5>
                    </div>
                    <div class="card-body">
                        <button type="button" class="btn btn-primary" onclick="showChangePasswordModal()">
                            <i class="fas fa-key"></i> Şifre Değiştir
                        </button>
                        <button type="button" class="btn btn-outline-danger ms-2" onclick="showTwoFactorModal()">
                            <i class="fas fa-shield-alt"></i> İki Faktörlü Doğrulama
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Profil düzenleme modalını gösterir.
 */
function showEditProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (!modal) return;

    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Profili Düzenle</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="edit-profile-form">
                        <div class="mb-3">
                            <label class="form-label">Ad</label>
                            <input type="text" class="form-control" name="firstName" 
                                   value="${profileData.user.firstName}" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Soyad</label>
                            <input type="text" class="form-control" name="lastName" 
                                   value="${profileData.user.lastName}" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">E-posta</label>
                            <input type="email" class="form-control" name="email" 
                                   value="${profileData.user.email}" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Telefon</label>
                            <input type="tel" class="form-control" name="phone" 
                                   value="${profileData.user.phone}">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Departman</label>
                            <input type="text" class="form-control" name="department" 
                                   value="${profileData.user.department}">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Pozisyon</label>
                            <input type="text" class="form-control" name="position" 
                                   value="${profileData.user.position}">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">İptal</button>
                    <button type="button" class="btn btn-primary" onclick="saveProfile()">Kaydet</button>
                </div>
            </div>
        </div>
    `;

    new bootstrap.Modal(modal).show();
}

/**
 * Şifre değiştirme modalını gösterir.
 */
function showChangePasswordModal() {
    const modal = document.getElementById('profile-modal');
    if (!modal) return;

    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Şifre Değiştir</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="change-password-form">
                        <div class="mb-3">
                            <label class="form-label">Mevcut Şifre</label>
                            <input type="password" class="form-control" name="currentPassword" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Yeni Şifre</label>
                            <input type="password" class="form-control" name="newPassword" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Yeni Şifre (Tekrar)</label>
                            <input type="password" class="form-control" name="confirmPassword" required>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">İptal</button>
                    <button type="button" class="btn btn-primary" onclick="changePassword()">Değiştir</button>
                </div>
            </div>
        </div>
    `;

    new bootstrap.Modal(modal).show();
}

/**
 * İki faktörlü doğrulama modalını gösterir.
 */
function showTwoFactorModal() {
    const modal = document.getElementById('profile-modal');
    if (!modal) return;

    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">İki Faktörlü Doğrulama</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i> İki faktörlü doğrulama, hesabınızı daha güvenli hale getirir.
                        Her girişte telefonunuza bir doğrulama kodu gönderilir.
                    </div>
                    <div class="form-check mb-3">
                        <input class="form-check-input" type="checkbox" name="twoFactorEnabled" 
                               onchange="toggleTwoFactor(this.checked)">
                        <label class="form-check-label">İki Faktörlü Doğrulamayı Etkinleştir</label>
                    </div>
                    <div id="two-factor-setup" style="display: none;">
                        <div class="mb-3">
                            <label class="form-label">Telefon Numarası</label>
                            <input type="tel" class="form-control" name="phoneNumber">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Doğrulama Kodu</label>
                            <input type="text" class="form-control" name="verificationCode">
                        </div>
                        <button type="button" class="btn btn-primary" onclick="verifyTwoFactor()">
                            Doğrula
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    new bootstrap.Modal(modal).show();
}

/**
 * Profili kaydeder.
 */
async function saveProfile() {
    const form = document.getElementById('edit-profile-form');
    if (!form) return;

    const formData = new FormData(form);
    const profileData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        department: formData.get('department'),
        position: formData.get('position')
    };

    try {
        // Profili ERPService'e kaydet
        if (window.ERPService && typeof window.ERPService.updateProfile === 'function') {
            await window.ERPService.updateProfile(profileData);
            console.log("Profil güncellendi:", profileData);
        } else {
            // LocalStorage'a kaydet
            profileData.user = { ...profileData.user, ...profileData };
            localStorage.setItem('erp_profile', JSON.stringify(profileData.user));
        }

        showToast("Profil başarıyla güncellendi.", "success");
        bootstrap.Modal.getInstance(document.getElementById('profile-modal')).hide();
        loadProfile();
    } catch (error) {
        console.error("Profil güncellenirken hata:", error);
        showToast("Profil güncellenemedi.", "error");
    }
}

/**
 * Şifreyi değiştirir.
 */
async function changePassword() {
    const form = document.getElementById('change-password-form');
    if (!form) return;

    const formData = new FormData(form);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    if (newPassword !== confirmPassword) {
        showToast("Yeni şifreler eşleşmiyor.", "error");
        return;
    }

    try {
        // Şifreyi ERPService'de güncelle
        if (window.ERPService && typeof window.ERPService.changePassword === 'function') {
            await window.ERPService.changePassword(currentPassword, newPassword);
            console.log("Şifre değiştirildi.");
        } else {
            // LocalStorage'da güncelle
            profileData.user.password = newPassword;
            localStorage.setItem('erp_profile', JSON.stringify(profileData.user));
        }

        showToast("Şifre başarıyla değiştirildi.", "success");
        bootstrap.Modal.getInstance(document.getElementById('profile-modal')).hide();
    } catch (error) {
        console.error("Şifre değiştirilirken hata:", error);
        showToast("Şifre değiştirilemedi.", "error");
    }
}

/**
 * İki faktörlü doğrulamayı açıp kapatır.
 */
async function toggleTwoFactor(enabled) {
    const setupDiv = document.getElementById('two-factor-setup');
    if (!setupDiv) return;

    if (enabled) {
        setupDiv.style.display = 'block';
    } else {
        setupDiv.style.display = 'none';
        try {
            // İki faktörlü doğrulamayı ERPService'de devre dışı bırak
            if (window.ERPService && typeof window.ERPService.disableTwoFactor === 'function') {
                await window.ERPService.disableTwoFactor();
                console.log("İki faktörlü doğrulama devre dışı bırakıldı.");
            } else {
                // LocalStorage'da güncelle
                profileData.user.twoFactorEnabled = false;
                localStorage.setItem('erp_profile', JSON.stringify(profileData.user));
            }

            showToast("İki faktörlü doğrulama devre dışı bırakıldı.", "success");
        } catch (error) {
            console.error("İki faktörlü doğrulama devre dışı bırakılırken hata:", error);
            showToast("İki faktörlü doğrulama devre dışı bırakılamadı.", "error");
        }
    }
}

/**
 * İki faktörlü doğrulamayı doğrular.
 */
async function verifyTwoFactor() {
    const form = document.getElementById('change-password-form');
    if (!form) return;

    const formData = new FormData(form);
    const phoneNumber = formData.get('phoneNumber');
    const verificationCode = formData.get('verificationCode');

    try {
        // İki faktörlü doğrulamayı ERPService'de etkinleştir
        if (window.ERPService && typeof window.ERPService.enableTwoFactor === 'function') {
            await window.ERPService.enableTwoFactor(phoneNumber, verificationCode);
            console.log("İki faktörlü doğrulama etkinleştirildi.");
        } else {
            // LocalStorage'da güncelle
            profileData.user.twoFactorEnabled = true;
            profileData.user.twoFactorPhone = phoneNumber;
            localStorage.setItem('erp_profile', JSON.stringify(profileData.user));
        }

        showToast("İki faktörlü doğrulama etkinleştirildi.", "success");
        bootstrap.Modal.getInstance(document.getElementById('profile-modal')).hide();
        loadProfile();
    } catch (error) {
        console.error("İki faktörlü doğrulama etkinleştirilirken hata:", error);
        showToast("İki faktörlü doğrulama etkinleştirilemedi.", "error");
    }
}

/**
 * Tercihi günceller.
 */
async function updatePreference(key, value) {
    try {
        // Tercihi ERPService'de güncelle
        if (window.ERPService && typeof window.ERPService.updatePreference === 'function') {
            await window.ERPService.updatePreference(key, value);
            console.log("Tercih güncellendi:", key, value);
        } else {
            // LocalStorage'da güncelle
            profileData.user.preferences[key] = value;
            localStorage.setItem('erp_profile', JSON.stringify(profileData.user));
        }

        showToast("Tercih güncellendi.", "success");
    } catch (error) {
        console.error("Tercih güncellenirken hata:", error);
        showToast("Tercih güncellenemedi.", "error");
    }
}

/**
 * Aktivite tipi rengini döndürür.
 */
function getActivityTypeColor(type) {
    switch (type) {
        case 'login':
            return 'primary';
        case 'order':
            return 'success';
        case 'material':
            return 'info';
        default:
            return 'secondary';
    }
}

/**
 * Tarihi formatlar.
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Global scope'a fonksiyonları ekle
if (window) {
    window.loadProfile = loadProfile;
    window.showEditProfileModal = showEditProfileModal;
    window.showChangePasswordModal = showChangePasswordModal;
    window.showTwoFactorModal = showTwoFactorModal;
    window.saveProfile = saveProfile;
    window.changePassword = changePassword;
    window.toggleTwoFactor = toggleTwoFactor;
    window.verifyTwoFactor = verifyTwoFactor;
    window.updatePreference = updatePreference;
}

console.log("Profile module loaded."); 