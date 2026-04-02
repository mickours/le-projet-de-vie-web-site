
// --- Custom UI Utilities ---
window.showModal = function(message) {
    return new Promise((resolve) => {
        let overlay = document.createElement("div");
        overlay.className = "gemini-modal-overlay-force-style";
        overlay.innerHTML = `
            <div class="custom-modal">
                <p>${message}</p>
                <button class="modal-btn" style="display: block; margin: 0 auto;">Compris !</button>
            </div>
        `;
        document.body.appendChild(overlay);

        // Show the modal
        overlay.style.display = 'block';
        
        const btn = overlay.querySelector("button");
        const closeModal = () => {
            overlay.style.display = 'none';
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
            resolve();
        };

        btn.addEventListener("click", closeModal);
        
        // Also close if user clicks outside the modal content
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                closeModal();
            }
        });
    });
};

window.alert = window.showModal;

window.showConfirm = function(message) {
    return new Promise((resolve) => {
        let overlay = document.createElement("div");
        overlay.className = "gemini-modal-overlay-force-style";
        overlay.innerHTML = `
            <div class="custom-modal">
                <p>${message}</p>
                <div class="modal-buttons">
                    <button id="modal-btn-confirm" class="approve-btn">Oui</button>
                    <button id="modal-btn-cancel" class="reject-btn">Non</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.style.display = 'block';

        const confirmBtn = overlay.querySelector("#modal-btn-confirm");
        const cancelBtn = overlay.querySelector("#modal-btn-cancel");

        const close = (value) => {
            overlay.style.display = 'none';
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
            resolve(value);
        };

        confirmBtn.addEventListener("click", () => close(true));
        cancelBtn.addEventListener("click", () => close(false));
    });
};

window.showPrompt = function(message, defaultValue = '') {
    return new Promise((resolve) => {
        let overlay = document.createElement("div");
        overlay.className = "gemini-modal-overlay-force-style";
        overlay.innerHTML = `
            <div class="custom-modal">
                <p>${message}</p>
                <input type="text" class="modal-input" value="${defaultValue}">
                <div class="modal-buttons">
                    <button id="modal-btn-confirm" class="approve-btn">OK</button>
                    <button id="modal-btn-cancel" class="reject-btn">Annuler</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.style.display = 'block';

        const confirmBtn = overlay.querySelector("#modal-btn-confirm");
        const cancelBtn = overlay.querySelector("#modal-btn-cancel");
        const input = overlay.querySelector(".modal-input");

        input.focus();

        const close = (value) => {
            overlay.style.display = 'none';
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
            resolve(value);
        };

        confirmBtn.addEventListener("click", () => close(input.value));
        cancelBtn.addEventListener("click", () => close(null));
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                close(input.value);
            } else if (e.key === "Escape") {
                close(null);
            }
        });
    });
};

// Global Fetch Interceptor for Button Loaders
const originalFetch = window.fetch;
window.activeActionButton = null;

document.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (btn) {
        window.activeActionButton = btn;
        // Clear it after a short delay in case no fetch is triggered
        setTimeout(() => { 
            if (window.activeActionButton === btn && !btn.classList.contains('loading')) {
                window.activeActionButton = null; 
            }
        }, 50);
    }
}, true);

document.addEventListener('submit', (e) => {
    const btn = e.submitter || e.target.querySelector("button[type='submit']");
    if (btn) {
        window.activeActionButton = btn;
    }
}, true);

window.fetch = async function(...args) {
    const btn = window.activeActionButton;
    let originalText, originalWidth;
    
    // Only wrap if it's a button and not already loading
    if (btn && !btn.classList.contains("loading")) {
        originalText = btn.innerHTML;
        originalWidth = btn.offsetWidth;
        btn.style.width = originalWidth + "px";
        btn.classList.add("loading");
    }
    
    try {
        return await originalFetch.apply(this, args);
    } finally {
        if (btn && btn.classList.contains("loading")) {
            btn.classList.remove("loading");
            btn.style.width = "";
            btn.innerHTML = originalText;
            window.activeActionButton = null;
        }
    }
};
// --- End Custom UI Utilities ---

document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const adminLoginForm = document.getElementById('admin-login-form');
    const loginSection = document.getElementById('login-section');
    const adminSection = document.getElementById('admin-section');
    const userInfo = document.getElementById('user-info');
    const userControls = document.getElementById('user-controls');
    const usernameDisplay = document.getElementById('username-display');
    const logoutBtn = document.getElementById('logout-btn');
    const menuToggle = document.getElementById('menu-toggle');
    const navWrapper = document.getElementById('nav-wrapper');

    // Admin Tabs
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Activities Management
    const addActivityForm = document.getElementById('add-activity-form');
    const adminActivitiesList = document.getElementById('admin-activities-list');
    const pendingCommentsList = document.getElementById('pending-comments-list');
    const resourcesListInputs = document.getElementById('resources-list-inputs');
    const addResourceBtn = document.getElementById('add-resource-btn');

    // Users Management
    const adminAddUserForm = document.getElementById('admin-add-user-form');
    const adminUsersList = document.getElementById('admin-users-list');
    const manageChildrenModal = document.getElementById('manage-children-modal');
    const closeModalBtn = manageChildrenModal.querySelector('.close-modal');
    const childSelect = document.getElementById('child-select');
    const addChildBtn = document.getElementById('add-child-btn');
    const childrenList = document.getElementById('children-list');
    const parentNameDisplay = document.getElementById('parent-name-display');

    let token = localStorage.getItem('token_admin');
    let currentParentId = null;

    // --- Helpers ---
    const apiFetch = async (url, options = {}) => {
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers
        };
        const response = await fetch(url, { ...options, headers });
        if (response.status === 401 || response.status === 403) { 
            logout(); 
            throw new Error('Unauthorized'); 
        }
        return response;
    };

    const logout = () => {
        localStorage.removeItem('token_admin');
        token = null;
        userControls.classList.add('hidden');
        adminSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
    };

    const showAdminPanel = async (user) => {
        if (user.role.label !== 'admin') {
            alert("Accès refusé. Ce portail est réservé aux administrateurs.");
            logout();
            return;
        }
        loginSection.classList.add('hidden');
        adminSection.classList.remove('hidden');
        userControls.classList.remove('hidden');
        usernameDisplay.textContent = user.username + " (Maître)";
        
        // Initialize TinyMCE Editor
        initializeTinyMCE();
        
        await loadMetadata();
        await loadAdminData();
    };

    const initializeTinyMCE = async () => {
        try {
            const config = await (await fetch('/api/config')).json();
            const apiKey = config.tinymce_api_key || 'no-api-key';

            // Check if TinyMCE is already loaded
            if (window.tinymce) {
                tinymce.init({
                    selector: '#tinymce-editor',
                    plugins: 'paste image link lists',
                    toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist outdent indent | link image',
                    paste_data_images: true,
                    height: 350,
                });
                return;
            }

            const script = document.createElement('script');
            script.src = `https://cdn.tiny.cloud/1/${apiKey}/tinymce/7/tinymce.min.js`;
            script.referrerPolicy = 'origin';
            script.onload = () => {
                tinymce.init({
                    selector: '#tinymce-editor',
                    plugins: 'paste image link lists',
                    toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist outdent indent | link image',
                    paste_data_images: true,
                    height: 350,
                });
            };
            document.head.appendChild(script);
        } catch (error) {
            console.error('Failed to initialize TinyMCE:', error);
        }
    };

    // --- Menu Toggle ---
    if (menuToggle && navWrapper) {
        menuToggle.addEventListener('click', () => {
            navWrapper.classList.toggle('show');
        });
    }

    // --- Data Loading ---
    const loadMetadata = async () => {
        try {
            const [levels, roles, themes, types] = await Promise.all([
                (await apiFetch('/levels')).json(),
                (await apiFetch('/roles')).json(),
                (await apiFetch('/themes')).json(),
                (await apiFetch('/types')).json()
            ]);
            
            const populateSelect = (id, data, defaultOpt = null) => {
                const el = document.getElementById(id);
                if (!el) return;
                
                let html = '';
                if (defaultOpt) {
                    html += `<option value="">${defaultOpt}</option>`;
                }
                html += data.map(i => `<option value="${i.id}">${i.label}</option>`).join('');
                el.innerHTML = html;
            };

            const activeRoles = roles.filter(r => r.label !== 'admin');

            populateSelect('act-level', levels);
            populateSelect('adm-level', levels, 'Non défini');

            populateSelect('act-role', activeRoles);
            populateSelect('adm-role', activeRoles);

            populateSelect('act-theme', themes);
            populateSelect('act-type', types);
            
        } catch (err) {
            console.error("Erreur lors du chargement des métadonnées:", err);
        }
    };

    const loadAdminData = async () => {
        // Load Activities
        const activities = await (await apiFetch('/activities')).json();
        adminActivitiesList.innerHTML = activities.map(a => `
            <div class="admin-list-item">
                <div class="admin-list-item-info">
                    ${a.logo_url ? `<img src="${a.logo_url}" alt="Logo" class="admin-list-logo">` : ''}
                    <strong>${a.title}</strong>
                    <div class="meta-badges">
                        ${a.level ? `<span>${a.level.label}</span>` : ''}
                        ${a.role ? `<span>${a.role.label}</span>` : ''}
                        ${a.theme ? `<span>${a.theme.label}</span>` : ''}
                        ${a.type ? `<span>${a.type.label}</span>` : ''}
                    </div>
                </div>
                <div class="user-action-btns">
                    <a href="/pages/activities/${a.id}" target="_blank" class="manage-btn" style="background: var(--accent-color); color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer; text-decoration: none;">Voir l'Aventure</a>
                    <button class="manage-btn" onclick="editActivity(${a.id})" style="background: var(--primary-color); color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer;">Modifier</button>
                    <button class="delete-btn" onclick="deleteActivity(${a.id})">Supprimer</button>
                </div>
            </div>
        `).join('') || '<p>Aucune quête dans le grimoire.</p>';

        // Load Users
        const users = await (await apiFetch('/admin/users')).json();
        adminUsersList.innerHTML = users.map(u => `
            <div class="admin-list-item">
                <div class="admin-list-item-info">
                    <strong>${u.username}</strong>
                    <div class="meta-badges">
                        <span>${u.role ? u.role.label : 'Rôle ?'}</span>
                        ${u.level ? `<span>${u.level.label}</span>` : ''}
                        ${u.age ? `<span>${u.age} ans</span>` : ''}
                    </div>
                </div>
                <div class="user-action-btns">
                    ${u.role && u.role.label === 'parent' ? `<button class="manage-btn" onclick="openManageChildren(${u.id}, '${u.username}')">Gérer les Enfants</button>` : ''}
                    <button class="reset-btn" onclick="resetPassword(${u.id})">Pass</button>
                    <button class="delete-btn" onclick="deleteUser(${u.id})">X</button>
                </div>
            </div>
        `).join('') || '<p>Aucun aventurier inscrit.</p>';

        // Populate child select (only students)
        const students = users.filter(u => u.role && u.role.label === 'élève');
        childSelect.innerHTML = students.map(s => `<option value="${s.id}">${s.username} (${s.level ? s.level.label : 'Niveau ?'})</option>`).join('');

        // Load Pending Comments
        const pending = await (await apiFetch('/admin/comments/pending')).json();
        pendingCommentsList.innerHTML = pending.map(c => `
            <div class="moderation-card">
                <div class="moderation-meta">
                    <strong>${c.username}</strong> sur la quête #${c.activity_id}
                </div>
                <div class="moderation-content">
                    "${c.content}"
                </div>
                <div class="moderation-actions">
                    <button class="approve-btn" onclick="approveComment(${c.id})">Approuver</button>
                    <button class="reject-btn" onclick="deleteComment(${c.id})">Refuser</button>
                </div>
            </div>
        `).join('') || '<p>Pas de paroles en attente.</p>';
    };

    // Global scope for admin actions
    window.approveComment = async (id) => {
        await apiFetch(`/admin/comments/${id}/approve`, { method: 'POST' });
        loadAdminData();
    };
    window.deleteComment = async (id) => {
        await apiFetch(`/admin/comments/${id}`, { method: 'DELETE' });
        loadAdminData();
    };
    window.deleteActivity = async (id) => {
        if (await window.showConfirm('Bannir cette quête de l\'aventure ?')) {
            await apiFetch(`/activities/${id}`, { method: 'DELETE' });
            loadAdminData();
        }
    };

    window.deleteDocument = async (docId, actId) => {
        if (await window.showConfirm('Voulez-vous vraiment supprimer cette ressource ?')) {
            try {
                const res = await apiFetch(`/documents/${docId}`, { method: 'DELETE' });
                if (res.ok) {
                    window.editActivity(actId); // Refresh the edit view to show remaining resources
                } else {
                    alert("Erreur lors de la suppression de la ressource.");
                }
            } catch (err) {
                alert("Erreur réseau.");
            }
        }
    };

    window.editActivity = async (id) => {
        try {
            const act = await (await apiFetch(`/activities/${id}`)).json();
            document.getElementById('act-id').value = act.id;
            document.getElementById('act-title').value = act.title || '';
            tinymce.get('tinymce-editor').setContent(act.description || ''); // Set editor content
            document.getElementById('act-level').value = act.level_id || '';
            document.getElementById('act-role').value = act.role_id || '';
            document.getElementById('act-theme').value = act.theme_id || '';
            document.getElementById('act-type').value = act.type_id || '';

            const logoPreview = document.getElementById('logo-preview');
            logoPreview.innerHTML = '';
            if (act.logo_url) {
                logoPreview.innerHTML = `<img src="${act.logo_url}" alt="Logo preview" style="max-width: 100px; max-height: 100px;">`;
            }
            
            document.getElementById('form-act-title').textContent = "Modifier la quête";
            document.getElementById('submit-act-btn').textContent = "Mettre à jour la quête";
            document.getElementById('cancel-edit-btn').classList.remove('hidden');
            document.getElementById('quest-resources-section').style.display = 'block';
            resourcesListInputs.innerHTML = ''; // Clear new resources list

            const existingResList = document.getElementById('existing-resources-list');
            if (act.documents && act.documents.length > 0) {
                existingResList.innerHTML = act.documents.map(d => `
                    <div class="admin-list-item" style="background: var(--bg-body);">
                        <div class="resource-row-header" style="flex-grow: 1;">
                            <span style="font-weight: bold;">${d.doc_type === 'video_link' ? '🔗 Lien Vidéo' : '📄 Fichier'}:</span> 
                            <span style="margin-left: 0.5rem; word-break: break-all;">${d.filename}</span>
                        </div>
                        <button type="button" class="delete-btn" title="Supprimer cette ressource" onclick="deleteDocument(${d.id}, ${act.id})">Supprimer</button>
                    </div>
                `).join('');
            } else {
                existingResList.innerHTML = '<p style="font-size: 0.9rem; color: #666;">Aucune ressource existante pour cette quête.</p>';
            }

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            alert('Erreur lors de la récupération de la quête.');
        }
    };

    const resetActivityForm = () => {
        addActivityForm.reset();
        document.getElementById('act-id').value = '';
        if (tinymce.get('tinymce-editor')) {
            tinymce.get('tinymce-editor').setContent('');
        }
        document.getElementById('logo-preview').innerHTML = '';
        document.getElementById('form-act-title').textContent = "Ajouter une nouvelle quête";
        document.getElementById('submit-act-btn').textContent = "Sceller la quête";
        document.getElementById('cancel-edit-btn').classList.add('hidden');
        document.getElementById('quest-resources-section').style.display = 'block';
        document.getElementById('existing-resources-list').innerHTML = '';
        resourcesListInputs.innerHTML = '';
    };

    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', resetActivityForm);
    }

    window.deleteUser = async (id) => {
        if (await window.showConfirm('Bannir cet aventurier définitivement ?')) {
            await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
            loadAdminData();
        }
    };

    window.resetPassword = async (id) => {
        const newPass = await window.showPrompt("Entrez le nouveau mot de passe :");
        if (newPass) {
            await apiFetch(`/admin/users/${id}/reset-password`, {
                method: 'PUT',
                body: JSON.stringify({ new_password: newPass })
            });
            alert("Mot de passe réinitialisé !");
        }
    };

    window.openManageChildren = async (parentId, parentName) => {
        currentParentId = parentId;
        parentNameDisplay.textContent = parentName;
        manageChildrenModal.classList.remove('hidden');
        loadChildren();
    };

    const loadChildren = async () => {
        const users = await (await apiFetch('/admin/users')).json();
        const parent = users.find(u => u.id === currentParentId);
        if (parent && parent.children) {
            childrenList.innerHTML = parent.children.map(c => `
                <div class="admin-list-item">
                    <span>${c.username}</span>
                    <button class="delete-btn" onclick="removeRelationship(${c.id})">Détacher</button>
                </div>
            `).join('') || '<p>Aucun enfant associé.</p>';
        }
    };

    window.removeRelationship = async (childId) => {
        await apiFetch(`/admin/users/${currentParentId}/children/${childId}`, { method: 'DELETE' });
        loadChildren();
        loadAdminData();
    };

    addChildBtn.addEventListener('click', async () => {
        const childId = childSelect.value;
        if (childId) {
            await apiFetch(`/admin/users/${currentParentId}/children/${childId}`, { method: 'POST' });
            loadChildren();
            loadAdminData();
        }
    });

    closeModalBtn.addEventListener('click', () => {
        manageChildrenModal.classList.add('hidden');
    });

    // --- Events ---
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('username', e.target.username.value);
        formData.append('password', e.target.password.value);
        
        try {
            const res = await fetch('/token', { method: 'POST', body: formData });
            if (res.ok) {
                const data = await res.json();
                token = data.access_token;
                localStorage.setItem('token_admin', token);
                const user = await (await apiFetch('/users/me')).json();
                showAdminPanel(user);
            } else {
                alert('La clé de sécurité est incorrecte.');
            }
        } catch (err) {
            alert('Erreur de connexion au grand livre.');
        }
    });

    logoutBtn.addEventListener('click', logout);

    addActivityForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get content from TinyMCE and put it in the hidden input
        const description = tinymce.get('tinymce-editor').getContent();
        document.getElementById('act-desc').value = description;
        
        const actId = document.getElementById('act-id').value;
        const formData = new FormData(addActivityForm);
        // The description is already in formData from the hidden input
        
        // Collect new dynamic resources (works for both creation and update)
        const resourceRows = document.querySelectorAll('.resource-row');
        resourceRows.forEach(row => {
            const type = row.querySelector('.res-type').value;
            const input = row.querySelector('.res-input');
            if (type === 'link') {
                if (input.value) formData.append('video_links', input.value);
            } else if (type === 'file') {
                if (input.files.length > 0) formData.append('files', input.files[0]);
            }
        });

        const url = actId ? `/activities/${actId}` : '/activities';
        const method = actId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (res.ok) {
            alert(actId ? 'Quête mise à jour avec succès !' : 'Quête scellée avec succès !');
            resetActivityForm();
            loadAdminData();
        } else {
            const err = await res.json();
            let errorMessage = err.detail || 'Erreur Inconnue';
            if (Array.isArray(errorMessage)) {
                errorMessage = errorMessage.map(e => `${e.loc.join(' > ')}: ${e.msg}`).join('\n');
            }
            alert('Erreur lors de l\'enregistrement : \n' + errorMessage);
        }
    });

    // Dynamic resources logic
    if (addResourceBtn) {
        addResourceBtn.addEventListener('click', () => {
            const count = document.querySelectorAll('.resource-row').length;
            if (count >= 10) {
                alert("Maximum 10 ressources autorisées.");
                return;
            }

            const row = document.createElement('div');
            row.className = 'admin-list-item resource-row';
            row.innerHTML = `
                <div class="resource-row-header">
                    <select class="res-type">
                        <option value="file">Fichier (PDF/Vidéo)</option>
                        <option value="link">Lien Vidéo</option>
                    </select>
                    <button type="button" class="delete-btn remove-res-btn" title="Supprimer">X</button>
                </div>
                <div class="res-input-container">
                    <input type="file" class="res-input" accept=".pdf,video/*" required>
                </div>
            `;

            row.querySelector('.res-type').addEventListener('change', (e) => {
                const container = row.querySelector('.res-input-container');
                if (e.target.value === 'link') {
                    container.innerHTML = `<input type="url" class="res-input" placeholder="Lien YouTube/Vimeo..." required>`;
                } else {
                    container.innerHTML = `<input type="file" class="res-input" accept=".pdf,video/*" required>`;
                }
            });

            row.querySelector('.remove-res-btn').addEventListener('click', () => row.remove());

            resourcesListInputs.appendChild(row);
        });
    }

    adminAddUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userData = {
            username: document.getElementById('adm-username').value,
            password: document.getElementById('adm-password').value,
            role_id: parseInt(document.getElementById('adm-role').value),
            level_id: document.getElementById('adm-level').value ? parseInt(document.getElementById('adm-level').value) : null
        };
        
        const res = await apiFetch('/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        if (res.ok) {
            alert('Aventurier inscrit avec succès !');
            e.target.reset();
            loadAdminData();
        } else {
            const err = await res.json();
            alert('Erreur: ' + (err.detail || 'Échec'));
        }
    });

    // Tabs
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.add('hidden'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.remove('hidden');
        });
    });

    // --- Init ---
    if (token) {
        apiFetch('/users/me')
            .then(res => res.json())
            .then(user => showAdminPanel(user))
            .catch(() => logout());
    }
});



// Global function for password toggle
window.togglePasswordVisibility = function(button) {
    const input = button.parentElement.querySelector("input");
    if (input.type === "password") {
        input.type = "text";
        button.textContent = "🙈";
    } else {
        input.type = "password";
        button.textContent = "👁️";
    }
};
