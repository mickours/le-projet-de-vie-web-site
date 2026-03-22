document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginBox = document.getElementById('login-box');
    const registerBox = document.getElementById('register-box');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');

    const loginSection = document.getElementById('login-section');
    const userInfo = document.getElementById('user-info');
    const usernameDisplay = document.getElementById('username-display');
    const avatarDisplay = document.getElementById('avatar-display');
    const logoutBtn = document.getElementById('logout-btn');
    const currentRole = document.getElementById('current-role');

    const views = document.querySelectorAll('.view');
    const navButtons = document.querySelectorAll('.nav-btn');

    // Home View
    const homeSection = document.getElementById('home-section');
    const roleButtons = document.getElementById('role-buttons');
    const levelButtons = document.getElementById('level-buttons');

    // Activities View
    const activitiesSection = document.getElementById('activities-section');
    const activitiesList = document.getElementById('activities-list');
    const levelFilter = document.getElementById('level-filter');

    // Detail View
    const activityDetailSection = document.getElementById('activity-detail-section');
    const activityContent = document.getElementById('activity-content');
    const questCompleted = document.getElementById('quest-completed');
    const questNotes = document.getElementById('quest-notes');
    const saveProgressBtn = document.getElementById('save-progress-btn');
    const commentsList = document.getElementById('comments-list');
    const commentForm = document.getElementById('comment-form');

    // Dossier View
    const dossierSection = document.getElementById('dossier-section');
    const dossierContent = document.getElementById('dossier-content');
    const printBtn = document.getElementById('print-btn');

    // Profile View
    const profileForm = document.getElementById('profile-form');
    const menuToggle = document.getElementById('menu-toggle');
    const navWrapper = document.getElementById('nav-wrapper');

    let token = localStorage.getItem('token');
    let currentActivityId = null;
    let currentUser = null;

    // --- Helpers ---
    const apiFetch = async (url, options = {}) => {
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers
        };
        const response = await fetch(url, { ...options, headers });
        if (response.status === 401) { logout(); throw new Error('Unauthorized'); }
        return response;
    };

    const logout = () => {
        localStorage.removeItem('token');
        token = null;
        currentUser = null;
        userInfo.classList.add('hidden');
        loginSection.classList.remove('hidden');
        views.forEach(v => v.classList.add('hidden'));
    };

    const switchView = (viewId, updateHistory = true) => {
        views.forEach(v => v.classList.add('hidden'));
        const target = document.getElementById(`${viewId}-section`);
        if (target) target.classList.remove('hidden');
        
        // Update active nav state
        navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewId);
        });

        // Close mobile menu if open
        if (navWrapper) navWrapper.classList.remove('show');
        
        if (viewId === 'home') loadHome();
        if (viewId === 'activities') loadActivities(levelFilter.value);
        if (viewId === 'dossier') loadDossier();
        if (viewId === 'profile') loadProfile();

        if (updateHistory) {
            const url = viewId === 'home' ? '/' : `/${viewId}`;
            history.pushState({ viewId }, '', url);
        }
    };

    // --- Menu Toggle ---
    if (menuToggle && navWrapper) {
        menuToggle.addEventListener('click', () => {
            navWrapper.classList.toggle('show');
        });
    }

    // Handle browser back/forward buttons
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.viewId) {
            if (e.state.viewId === 'activity-detail' && e.state.activityId) {
                showActivityDetail(e.state.activityId, false);
            } else {
                switchView(e.state.viewId, false);
            }
        } else {
            // Re-evaluate current path if no state (e.g. first load)
            handleInitialRouting();
        }
    });

    const handleInitialRouting = () => {
        const path = window.location.pathname;
        if (path.startsWith('/activities/')) {
            const id = path.split('/').pop();
            if (id && !isNaN(id)) {
                showActivityDetail(id, false);
                return;
            }
        }
        
        const view = path.replace('/', '') || 'home';
        const validViews = ['home', 'activities', 'dossier', 'profile'];
        switchView(validViews.includes(view) ? view : 'home', false);
    };

    const showApp = (user) => {
        currentUser = user;
        loginSection.classList.add('hidden');
        userInfo.classList.remove('hidden');
        usernameDisplay.textContent = user.username;
        avatarDisplay.textContent = user.avatar || '👤';
        currentRole.textContent = user.role ? user.role.label : 'Utilisateur';
        
        loadMetadata();
        handleInitialRouting();
    };

    // --- Data Loading ---
    const loadMetadata = async () => {
        const levels = await (await apiFetch('/levels')).json();
        levelFilter.innerHTML = '<option value="">Tous les niveaux</option>';
        
        const regLevel = document.getElementById('reg-level');
        regLevel.innerHTML = '';
        levels.forEach(l => {
            const opt = `<option value="${l.id}">${l.label}</option>`;
            levelFilter.innerHTML += opt;
            regLevel.innerHTML += opt;
        });

        const roles = await (await apiFetch('/roles')).json();
        const regRole = document.getElementById('reg-role');
        regRole.innerHTML = roles.filter(r => r.label !== 'admin').map(r => `<option value="${r.id}">${r.label}</option>`).join('');
    };

    const loadHome = async () => {
        const roles = await (await apiFetch('/roles')).json();
        const roleIcons = {
            "élève": "🎒",
            "parent": "👨‍👩‍👧",
            "enseignant": "👨‍🏫",
            "professionnel de l'orientation": "🧭"
        };

        roleButtons.innerHTML = roles
            .filter(r => r.label !== 'admin')
            .map(r => `
                <button class="cloud-btn role-filter-btn" data-id="${r.id}">
                    <div class="role-icon">${roleIcons[r.label] || '👤'}</div>
                    ${r.label}
                </button>
            `).join('');

        const levelIcons = {
            "6ème": "🌱",
            "5ème": "🌿",
            "4ème": "🌳",
            "3ème": "⚔️",
            "2nde": "🛡️",
            "1ère": "🏹",
            "Terminale": "👑",
            "Apprenti": "🛠️",
            "Autre": "❓"
        };

        const levels = await (await apiFetch('/levels')).json();
        levelButtons.innerHTML = levels.map(l => `
            <button class="cloud-btn level-filter-btn" data-id="${l.id}">
                <div class="role-icon">${levelIcons[l.label] || '📚'}</div>
                ${l.label}
            </button>
        `).join('');

        document.querySelectorAll('.level-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                levelFilter.value = btn.dataset.id;
                switchView('activities');
            });
        });

        document.querySelectorAll('.role-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                levelFilter.value = '';
                switchView('activities');
            });
        });
    };

    const loadActivities = async (levelId = '') => {
        const url = levelId ? `/activities?level_id=${levelId}` : '/activities';
        const activities = await (await apiFetch(url)).json();
        activitiesList.innerHTML = activities.map(a => `
            <div class="activity-card">
                <h3>${a.title}</h3>
                <p>${a.description || ''}</p>
                ${a.documents && a.documents.length > 0 ? `<p>📄 ${a.documents.length} document(s)</p>` : ''}
                <button class="open-activity" data-id="${a.id}" style="margin-top:auto">Ouvrir</button>
            </div>
        `).join('');

        document.querySelectorAll('.open-activity').forEach(btn => {
            btn.addEventListener('click', () => showActivityDetail(btn.dataset.id));
        });
    };

    const showActivityDetail = async (id, updateHistory = true) => {
        currentActivityId = id;
        if (updateHistory) {
            history.pushState({ viewId: 'activity-detail', activityId: id }, '', `/activities/${id}`);
        }
        const activity = await (await apiFetch(`/activities/${id}`)).json();
        
        let videoHtml = '';
        if (activity.video_url) {
            let embedUrl = activity.video_url;
            // Basic YouTube URL to Embed conversion
            if (embedUrl.includes('youtube.com/watch?v=')) {
                embedUrl = embedUrl.replace('watch?v=', 'embed/');
            } else if (embedUrl.includes('youtu.be/')) {
                embedUrl = 'https://www.youtube.com/embed/' + embedUrl.split('/').pop();
            }
            
            videoHtml = `
                <div class="video-container">
                    <iframe src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
            `;
        }

        let docsHtml = '';
        if (activity.documents && activity.documents.length > 0) {
            docsHtml = `
                <div class="documents-list mt-2">
                    <h4>Documents pour l'aventure :</h4>
                    <div class="button-cloud" style="justify-content: flex-start; margin-top: 1rem;">
                        ${activity.documents.map(d => `
                            <a href="${d.url}" target="_blank" class="cloud-btn" style="min-width: auto; flex-direction: row; padding: 0.6rem 1rem;">
                                <span style="font-size: 1.2rem;">📄</span> ${d.filename}
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        activityContent.innerHTML = `
            <h2>${activity.title}</h2>
            <div class="content-box">
                <p class="mb-1">${activity.description || 'Bienvenue dans cette quête !'}</p>
                ${videoHtml}
                ${docsHtml}
            </div>
        `;

        const dossier = await (await apiFetch('/dossier')).json();
        const track = dossier.find(t => t.activity_id == id);
        questCompleted.checked = track ? track.is_completed : false;
        questNotes.value = track ? (track.notes || '') : '';

        loadComments(id);
        switchView('activity-detail');
    };

    const loadComments = async (id) => {
        const comments = await (await apiFetch(`/activities/${id}/comments`)).json();
        commentsList.innerHTML = comments.map(c => `
            <div class="comment-item">
                <p class="comment-author">${c.username}</p>
                <p>${c.content}</p>
                <small>${new Date(c.created_at).toLocaleDateString()}</small>
            </div>
        `).join('') || '<p>Aucun commentaire pour le moment.</p>';
    };

    const loadDossier = async () => {
        const dossier = await (await apiFetch('/dossier')).json();
        if (dossier.length === 0) {
            dossierContent.innerHTML = '<p>Ton dossier est vide pour le moment. Termine des quêtes !</p>';
            return;
        }
        dossierContent.innerHTML = dossier.map(t => `
            <div class="panel">
                <h3>${t.activity ? t.activity.title : 'Activité ' + t.activity_id}</h3>
                <p>Statut: ${t.is_completed ? '✅ Terminé' : '⏳ En cours'}</p>
                <p><strong>Mes notes:</strong> ${t.notes || 'Aucune note.'}</p>
            </div>
        `).join('');
    };

    const loadProfile = async () => {
        if (!currentUser) return;
        
        // Metadata should already be loaded, but let's ensure roles/levels selects are populated
        const levels = await (await apiFetch('/levels')).json();
        const profLevel = document.getElementById('prof-level');
        profLevel.innerHTML = levels.map(l => `<option value="${l.id}">${l.label}</option>`).join('');

        const roles = await (await apiFetch('/roles')).json();
        const profRole = document.getElementById('prof-role');
        profRole.innerHTML = roles.filter(r => r.label !== 'admin').map(r => `<option value="${r.id}">${r.label}</option>`).join('');

        // Fill current values
        document.getElementById('prof-username').value = currentUser.username;
        document.getElementById('prof-age').value = currentUser.age || '';
        document.getElementById('prof-role').value = currentUser.role_id;
        document.getElementById('prof-level').value = currentUser.level_id || '';
        document.getElementById('prof-password').value = '';

        if (currentUser.avatar) {
            const avatarRadio = document.querySelector(`input[name="avatar"][value="${currentUser.avatar}"]`);
            if (avatarRadio) {
                avatarRadio.checked = true;
            }
        }
    };

    // --- Events ---
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const selectedAvatar = document.querySelector('input[name="avatar"]:checked').value;
        const username = document.getElementById('prof-username').value;
        const age = document.getElementById('prof-age').value;
        const role_id = document.getElementById('prof-role').value;
        const level_id = document.getElementById('prof-level').value;
        const password = document.getElementById('prof-password').value;

        const updateData = {
            avatar: selectedAvatar,
            username: username,
            role_id: parseInt(role_id),
            level_id: level_id ? parseInt(level_id) : null,
            age: age ? parseInt(age) : null
        };

        if (password) {
            updateData.password = password;
        }
        
        try {
            const res = await apiFetch('/users/me', {
                method: 'PUT',
                body: JSON.stringify(updateData)
            });
            const data = await res.json();
            currentUser = data.user;
            
            // If token was refreshed
            if (data.access_token) {
                token = data.access_token;
                localStorage.setItem('token', token);
            }

            avatarDisplay.textContent = currentUser.avatar;
            usernameDisplay.textContent = currentUser.username;
            currentRole.textContent = currentUser.role ? currentUser.role.label : 'Utilisateur';
            
            alert('Profil mis à jour avec succès !');
        } catch (error) {
            alert('Erreur lors de la mise à jour : ' + error.message);
        }
    });
    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginBox.classList.add('hidden');
        registerBox.classList.remove('hidden');
        loadMetadata();
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerBox.classList.add('hidden');
        loginBox.classList.remove('hidden');
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('username', e.target.username.value);
        formData.append('password', e.target.password.value);
        const res = await fetch('/token', { method: 'POST', body: formData });
        if (res.ok) {
            const data = await res.json();
            token = data.access_token;
            localStorage.setItem('token', token);
            const user = await (await apiFetch('/users/me')).json();
            showApp(user);
        } else {
            alert('Identifiants incorrects.');
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userData = {
            username: e.target['reg-username'].value,
            password: e.target['reg-password'].value,
            role_id: parseInt(e.target['reg-role'].value),
            level_id: parseInt(e.target['reg-level'].value)
        };
        const res = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (res.ok) {
            alert('Inscription réussie ! Connecte-toi maintenant.');
            showLogin.click();
        } else {
            const err = await res.json();
            alert('Erreur: ' + (err.detail || 'Inscription échouée'));
        }
    });

    logoutBtn.addEventListener('click', logout);

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.view) switchView(btn.dataset.view);
        });
    });

    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => switchView('activities'));
    });

    levelFilter.addEventListener('change', (e) => loadActivities(e.target.value));

    saveProgressBtn.addEventListener('click', async () => {
        await apiFetch(`/activities/${currentActivityId}/track`, {
            method: 'POST',
            body: JSON.stringify({
                activity_id: parseInt(currentActivityId),
                is_completed: questCompleted.checked,
                notes: questNotes.value
            })
        });
        alert('Progression enregistrée !');
    });

    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await apiFetch(`/activities/${currentActivityId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content: document.getElementById('comment-input').value })
        });
        document.getElementById('comment-input').value = '';
        alert('Commentaire envoyé ! Il sera visible après modération.');
    });

    printBtn.addEventListener('click', () => window.print());

    if (token) {
        apiFetch('/users/me')
            .then(res => res.json())
            .then(user => showApp(user))
            .catch(() => logout());
    }
});
