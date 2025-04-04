/**
 * users.js
 * Kullanıcı Yönetimi ve Yetkilendirme
 */

// Global state for user management
let usersData = {
    loaded: false,
    users: [],
    roles: [
        { id: 1, name: 'admin', description: 'Yönetici' },
        { id: 2, name: 'manager', description: 'Müdür' },
        { id: 3, name: 'user', description: 'Kullanıcı' }
    ],
    permissions: [
        { id: 1, name: 'view_orders', description: 'Siparişleri Görüntüleme' },
        { id: 2, name: 'create_orders', description: 'Sipariş Oluşturma' },
        { id: 3, name: 'edit_orders', description: 'Sipariş Düzenleme' },
        { id: 4, name: 'delete_orders', description: 'Sipariş Silme' },
        { id: 5, name: 'view_materials', description: 'Malzemeleri Görüntüleme' },
        { id: 6, name: 'create_materials', description: 'Malzeme Oluşturma' },
        { id: 7, name: 'edit_materials', description: 'Malzeme Düzenleme' },
        { id: 8, name: 'delete_materials', description: 'Malzeme Silme' },
        { id: 9, name: 'view_suppliers', description: 'Tedarikçileri Görüntüleme' },
        { id: 10, name: 'create_suppliers', description: 'Tedarikçi Oluşturma' },
        { id: 11, name: 'edit_suppliers', description: 'Tedarikçi Düzenleme' },
        { id: 12, name: 'delete_suppliers', description: 'Tedarikçi Silme' },
        { id: 13, name: 'view_reports', description: 'Raporları Görüntüleme' },
        { id: 14, name: 'manage_users', description: 'Kullanıcı Yönetimi' },
        { id: 15, name: 'manage_settings', description: 'Ayarları Yönetme' }
    ]
};

/**
 * Kullanıcıları yükler.
 */
async function loadUsers() {
    console.log("Kullanıcılar yükleniyor...");
    if (usersData.loaded) {
        console.log("Kullanıcılar zaten yüklü.");
        renderUsers();
        return;
    }

    showLoadingIndicator('users-container');

    try {
        // Kullanıcıları ERPService'den al
        if (window.ERPService && typeof window.ERPService.getUsers === 'function') {
            usersData.users = await window.ERPService.getUsers();
            console.log("Kullanıcılar yüklendi:", usersData.users);
        } else {
            // Demo veri
            usersData.users = [
                {
                    id: 1,
                    username: 'admin',
                    email: 'admin@example.com',
                    firstName: 'Admin',
                    lastName: 'User',
                    role: 'admin',
                    status: 'active',
                    lastLogin: '2024-03-20T10:00:00',
                    permissions: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
                },
                {
                    id: 2,
                    username: 'manager',
                    email: 'manager@example.com',
                    firstName: 'Manager',
                    lastName: 'User',
                    role: 'manager',
                    status: 'active',
                    lastLogin: '2024-03-19T15:30:00',
                    permissions: [1, 2, 3, 5, 6, 7, 9, 10, 11, 13]
                },
                {
                    id: 3,
                    username: 'user',
                    email: 'user@example.com',
                    firstName: 'Normal',
                    lastName: 'User',
                    role: 'user',
                    status: 'active',
                    lastLogin: '2024-03-18T09:15:00',
                    permissions: [1, 5, 9, 13]
                }
            ];
        }

        usersData.loaded = true;
        renderUsers();
    } catch (error) {
        console.error("Kullanıcılar yüklenirken hata:", error);
        showToast("Kullanıcılar yüklenemedi.", "error");
    } finally {
        hideLoadingIndicator('users-container');
    }
}

/**
 * Kullanıcıları render eder.
 */
function renderUsers() {
    const container = document.getElementById('users-container');
    if (!container) return;

    container.innerHTML = `
        <div class="row mb-4">
            <div class="col-12">
                <div class="d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Kullanıcı Listesi</h5>
                    <button type="button" class="btn btn-primary" onclick="showAddUserModal()">
                        <i class="fas fa-plus"></i> Yeni Kullanıcı
                    </button>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Kullanıcı Adı</th>
                                        <th>Ad Soyad</th>
                                        <th>E-posta</th>
                                        <th>Rol</th>
                                        <th>Durum</th>
                                        <th>Son Giriş</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${usersData.users.map(user => `
                                        <tr>
                                            <td>${user.username}</td>
                                            <td>${user.firstName} ${user.lastName}</td>
                                            <td>${user.email}</td>
                                            <td>
                                                <span class="badge bg-${getRoleBadgeClass(user.role)}">
                                                    ${getRoleText(user.role)}
                                                </span>
                                            </td>
                                            <td>
                                                <span class="badge bg-${getStatusBadgeClass(user.status)}">
                                                    ${getStatusText(user.status)}
                                                </span>
                                            </td>
                                            <td>${formatDate(user.lastLogin)}</td>
                                            <td>
                                                <button type="button" class="btn btn-sm btn-info" onclick="showEditUserModal(${user.id})">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button type="button" class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Yeni kullanıcı modalını gösterir.
 */
function showAddUserModal() {
    const modal = document.getElementById('user-modal');
    if (!modal) return;

    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Yeni Kullanıcı</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="add-user-form">
                        <div class="mb-3">
                            <label class="form-label">Kullanıcı Adı</label>
                            <input type="text" class="form-control" name="username" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">E-posta</label>
                            <input type="email" class="form-control" name="email" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Ad</label>
                            <input type="text" class="form-control" name="firstName" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Soyad</label>
                            <input type="text" class="form-control" name="lastName" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Şifre</label>
                            <input type="password" class="form-control" name="password" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Rol</label>
                            <select class="form-select" name="role" required>
                                ${usersData.roles.map(role => `
                                    <option value="${role.name}">${role.description}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">İzinler</label>
                            <div class="border p-3 rounded">
                                ${usersData.permissions.map(permission => `
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="permissions" 
                                               value="${permission.id}" id="permission-${permission.id}">
                                        <label class="form-check-label" for="permission-${permission.id}">
                                            ${permission.description}
                                        </label>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">İptal</button>
                    <button type="button" class="btn btn-primary" onclick="saveUser()">Kaydet</button>
                </div>
            </div>
        </div>
    `;

    new bootstrap.Modal(modal).show();
}

/**
 * Kullanıcı düzenleme modalını gösterir.
 */
function showEditUserModal(userId) {
    const user = usersData.users.find(u => u.id === userId);
    if (!user) return;

    const modal = document.getElementById('user-modal');
    if (!modal) return;

    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Kullanıcı Düzenle</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="edit-user-form">
                        <input type="hidden" name="id" value="${user.id}">
                        <div class="mb-3">
                            <label class="form-label">Kullanıcı Adı</label>
                            <input type="text" class="form-control" name="username" value="${user.username}" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">E-posta</label>
                            <input type="email" class="form-control" name="email" value="${user.email}" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Ad</label>
                            <input type="text" class="form-control" name="firstName" value="${user.firstName}" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Soyad</label>
                            <input type="text" class="form-control" name="lastName" value="${user.lastName}" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Şifre (Boş bırakılırsa değişmez)</label>
                            <input type="password" class="form-control" name="password">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Rol</label>
                            <select class="form-select" name="role" required>
                                ${usersData.roles.map(role => `
                                    <option value="${role.name}" ${user.role === role.name ? 'selected' : ''}>
                                        ${role.description}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Durum</label>
                            <select class="form-select" name="status" required>
                                <option value="active" ${user.status === 'active' ? 'selected' : ''}>Aktif</option>
                                <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Pasif</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">İzinler</label>
                            <div class="border p-3 rounded">
                                ${usersData.permissions.map(permission => `
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="permissions" 
                                               value="${permission.id}" id="permission-${permission.id}"
                                               ${user.permissions.includes(permission.id) ? 'checked' : ''}>
                                        <label class="form-check-label" for="permission-${permission.id}">
                                            ${permission.description}
                                        </label>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">İptal</button>
                    <button type="button" class="btn btn-primary" onclick="saveUser()">Kaydet</button>
                </div>
            </div>
        </div>
    `;

    new bootstrap.Modal(modal).show();
}

/**
 * Kullanıcıyı kaydeder.
 */
async function saveUser() {
    const form = document.querySelector('#add-user-form, #edit-user-form');
    if (!form) return;

    const formData = new FormData(form);
    const userData = {
        id: formData.get('id'),
        username: formData.get('username'),
        email: formData.get('email'),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        role: formData.get('role'),
        status: formData.get('status') || 'active',
        permissions: Array.from(formData.getAll('permissions')).map(Number)
    };

    if (formData.get('password')) {
        userData.password = formData.get('password');
    }

    try {
        // Kullanıcıyı ERPService'e kaydet
        if (window.ERPService && typeof window.ERPService.saveUser === 'function') {
            await window.ERPService.saveUser(userData);
            console.log("Kullanıcı kaydedildi:", userData);
        } else {
            // LocalStorage'a kaydet
            if (userData.id) {
                const index = usersData.users.findIndex(u => u.id === userData.id);
                if (index !== -1) {
                    usersData.users[index] = { ...usersData.users[index], ...userData };
                }
            } else {
                userData.id = usersData.users.length + 1;
                usersData.users.push(userData);
            }
            localStorage.setItem('erp_users', JSON.stringify(usersData.users));
        }

        showToast("Kullanıcı başarıyla kaydedildi.", "success");
        bootstrap.Modal.getInstance(document.getElementById('user-modal')).hide();
        loadUsers();
    } catch (error) {
        console.error("Kullanıcı kaydedilirken hata:", error);
        showToast("Kullanıcı kaydedilemedi.", "error");
    }
}

/**
 * Kullanıcıyı siler.
 */
async function deleteUser(userId) {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return;

    try {
        // Kullanıcıyı ERPService'den sil
        if (window.ERPService && typeof window.ERPService.deleteUser === 'function') {
            await window.ERPService.deleteUser(userId);
            console.log("Kullanıcı silindi:", userId);
        } else {
            // LocalStorage'dan sil
            usersData.users = usersData.users.filter(u => u.id !== userId);
            localStorage.setItem('erp_users', JSON.stringify(usersData.users));
        }

        showToast("Kullanıcı başarıyla silindi.", "success");
        loadUsers();
    } catch (error) {
        console.error("Kullanıcı silinirken hata:", error);
        showToast("Kullanıcı silinemedi.", "error");
    }
}

/**
 * Rol badge sınıfını döndürür.
 */
function getRoleBadgeClass(role) {
    switch (role) {
        case 'admin':
            return 'danger';
        case 'manager':
            return 'warning';
        case 'user':
            return 'info';
        default:
            return 'secondary';
    }
}

/**
 * Rol metnini döndürür.
 */
function getRoleText(role) {
    const roleObj = usersData.roles.find(r => r.name === role);
    return roleObj ? roleObj.description : role;
}

/**
 * Durum badge sınıfını döndürür.
 */
function getStatusBadgeClass(status) {
    switch (status) {
        case 'active':
            return 'success';
        case 'inactive':
            return 'danger';
        default:
            return 'secondary';
    }
}

/**
 * Durum metnini döndürür.
 */
function getStatusText(status) {
    switch (status) {
        case 'active':
            return 'Aktif';
        case 'inactive':
            return 'Pasif';
        default:
            return status;
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
    window.loadUsers = loadUsers;
    window.showAddUserModal = showAddUserModal;
    window.showEditUserModal = showEditUserModal;
    window.saveUser = saveUser;
    window.deleteUser = deleteUser;
}

console.log("Users module loaded."); 