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

    let token = localStorage.getItem('token_admin');

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

    const showAdminPanel = (user) => {
        if (user.role.label !== 'admin') {
            alert("Accès refusé. Ce portail est réservé aux administrateurs.");
            logout();
            return;
        }
        loginSection.classList.add('hidden');
        adminSection.classList.remove('hidden');
        userControls.classList.remove('hidden');
        usernameDisplay.textContent = user.username + " (Maître)";
        loadMetadata();
        loadAdminData();
    };

    // --- Menu Toggle ---
    if (menuToggle && navWrapper) {
        menuToggle.addEventListener('click', () => {
            navWrapper.classList.toggle('show');
        });
    }

    // --- Data Loading ---
    const loadMetadata = async () => {
        const levels = await (await apiFetch('/levels')).json();
        const actLevel = document.getElementById('act-level');
        actLevel.innerHTML = levels.map(l => `<option value="${l.id}">${l.label}</option>`).join('');

        const roles = await (await apiFetch('/roles')).json();
        const actRole = document.getElementById('act-role');
        actRole.innerHTML = roles.filter(r => r.label !== 'admin').map(r => `<option value="${r.id}">${r.label}</option>`).join('');

        const themes = await (await apiFetch('/themes')).json();
        const actTheme = document.getElementById('act-theme');
        actTheme.innerHTML = themes.map(t => `<option value="${t.id}">${t.label}</option>`).join('');

        const types = await (await apiFetch('/types')).json();
        const actType = document.getElementById('act-type');
        actType.innerHTML = types.map(t => `<option value="${t.id}">${t.label}</option>`).join('');
    };

    const loadAdminData = async () => {
        // Load Activities
        const activities = await (await apiFetch('/activities')).json();
        adminActivitiesList.innerHTML = activities.map(a => `
            <div class="admin-list-item">
                <div class="admin-list-item-info">
                    <strong>${a.title}</strong>
                    <div class="meta-badges">
                        ${a.level ? `<span>${a.level.label}</span>` : ''}
                        ${a.role ? `<span>${a.role.label}</span>` : ''}
                        ${a.theme ? `<span>${a.theme.label}</span>` : ''}
                        ${a.type ? `<span>${a.type.label}</span>` : ''}
                    </div>
                </div>
                <button class="delete-btn" onclick="deleteActivity(${a.id})">Supprimer</button>
            </div>
        `).join('') || '<p>Aucune quête dans le grimoire.</p>';

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
        if (confirm('Bannir cette quête de l\'aventure ?')) {
            await apiFetch(`/activities/${id}`, { method: 'DELETE' });
            loadAdminData();
        }
    };

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
        const formData = new FormData();
        formData.append('title', document.getElementById('act-title').value);
        formData.append('description', document.getElementById('act-desc').value);
        formData.append('level_id', document.getElementById('act-level').value);
        formData.append('role_id', document.getElementById('act-role').value);
        formData.append('theme_id', document.getElementById('act-theme').value);
        formData.append('type_id', document.getElementById('act-type').value);
        
        const videoUrl = document.getElementById('act-video').value;
        if (videoUrl) {
            formData.append('video_url', videoUrl);
        }
        
        const fileInput = document.getElementById('act-file');
        for (let i = 0; i < fileInput.files.length; i++) {
            formData.append('files', fileInput.files[i]);
        }

        const res = await fetch('/activities', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (res.ok) {
            alert('Quête scellée avec succès !');
            e.target.reset();
            loadAdminData();
        } else {
            alert('Erreur lors du scellement.');
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
