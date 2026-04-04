
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
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginBox = document.getElementById('login-box');
    const registerBox = document.getElementById('register-box');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');

    const loginSection = document.getElementById('login-section');
    const userInfo = document.getElementById('user-info');
    const userDisplay = document.getElementById('user-display');
    const loginNavBtn = document.getElementById('login-nav-btn');
    const usernameDisplay = document.getElementById('username-display');
    const avatarDisplay = document.getElementById('avatar-display');
    const logoutBtn = document.getElementById('logout-btn');
    const currentRole = document.getElementById('current-role');

    const views = document.querySelectorAll('.view');
    const navButtons = document.querySelectorAll('.nav-btn');

    // Back home buttons
    const backHomeBtns = document.querySelectorAll('.back-home-btn');
    backHomeBtns.forEach(btn => {
        btn.addEventListener('click', () => switchView('home'));
    });


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
    let currentLevelFilter = '';
    let currentRoleFilter = '';

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
        userDisplay.classList.add('hidden');
        logoutBtn.classList.add('hidden');
        loginNavBtn.classList.remove('hidden');
        
        // Reset navigation to safe home
        switchView('home');
    };

    const switchView = (viewId, updateHistory = true) => {
        // Restrictions for guests
        if (!token && (viewId === 'dossier' || viewId === 'profile')) {
            sessionStorage.setItem('redirectViewId', viewId);
            switchView('login');
            return;
        }

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
            const url = viewId === 'home' ? '/pages/adventure' : `/pages/adventure/${viewId}`;
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
        if (path.startsWith('/pages/activities/')) {
            const id = path.split('/').pop();
            if (id && !isNaN(id)) {
                showActivityDetail(id, false);
                return;
            }
        }

        const view = path.replace('/pages/adventure', '').replace(/\//g, '') || 'home';
        const validViews = ['home', 'activities', 'dossier', 'profile', 'login'];
        switchView(validViews.includes(view) ? view : 'home', false);
    };
    const showApp = (user) => {
        currentUser = user;
        loginSection.classList.add('hidden');
        userDisplay.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
        loginNavBtn.classList.add('hidden');
        
        usernameDisplay.textContent = user.username;
        avatarDisplay.textContent = user.avatar || '👤';
        currentRole.textContent = user.role ? user.role.label : 'Utilisateur';
        
        loadMetadata();
    };

    // --- Data Loading ---
    const loadMetadata = async () => {
        const levels = await (await apiFetch('/levels')).json();
        levelFilter.innerHTML = '<option value="">Tous les niveaux</option>';
        
        const regLevel = document.getElementById('reg-level');
        if (regLevel) regLevel.innerHTML = '';
        levels.forEach(l => {
            const opt = `<option value="${l.id}">${l.label}</option>`;
            levelFilter.innerHTML += opt;
            if (regLevel) regLevel.innerHTML += opt;
        });

        const roles = await (await apiFetch('/roles')).json();
        const regRole = document.getElementById('reg-role');
        if (regRole) regRole.innerHTML = roles.filter(r => r.label !== 'admin').map(r => `<option value="${r.id}">${r.label}</option>`).join('');

        // Set default filter to user's level
        if (currentUser && currentUser.level_id) {
            levelFilter.value = currentUser.level_id;
        }
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
                loadActivities(btn.dataset.id, '');
                switchView('activities');
            });
        });

        document.querySelectorAll('.role-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                levelFilter.value = '';
                loadActivities('', btn.dataset.id);
                switchView('activities');
            });
        });
    };

    const loadActivities = async (levelId = '', roleId = '') => {
        currentLevelFilter = levelId;
        currentRoleFilter = roleId;
        
        let url = '/activities?';
        if (levelId) url += `level_id=${levelId}&`;
        if (roleId) url += `role_id=${roleId}&`;
        
        const activities = await (await apiFetch(url)).json();
        
        if (activities.length === 0) {
            activitiesList.innerHTML = '<p>Aucune quête disponible pour le moment.</p>';
            return;
        }

        // Group by theme
        const grouped = {};
        activities.forEach(a => {
            const themeLabel = a.theme ? a.theme.label : 'Autres Quêtes';
            if (!grouped[themeLabel]) grouped[themeLabel] = [];
            grouped[themeLabel].push(a);
        });

        activitiesList.innerHTML = Object.entries(grouped).map(([theme, items]) => `
            <div class="theme-section">
                <div class="theme-header">
                    <h3><span class="icon">📜</span> ${theme}</h3>
                    <span class="theme-toggle-icon">▼</span>
                </div>
                <div class="manga-grid">
                    ${items.map(a => `
                        <div class="activity-card">
                            <div class="activity-card-header">
                                <div class="activity-badges">
                                    ${a.type ? `<span class="badge badge-type">${a.type.label}</span>` : ''}
                                    ${a.role ? `<span class="badge badge-role">${a.role.label}</span>` : ''}
                                    ${a.level ? `<span class="badge badge-level">${a.level.label}</span>` : ''}
                                </div>
${a.logo_url ? `<img src="${a.logo_url}" alt="Logo" class="activity-card-logo">` : ""}
                                <h3>${a.title}</h3>
                            </div>
                            <div class="activity-card-body">
                                <p>${a.description || ''}</p>
                                ${a.documents && a.documents.length > 0 ? `<p class="mt-1"><strong>Documents :</strong> ${a.documents.length} fichier(s)</p>` : ''}
                                <button class="open-activity" data-id="${a.id}">Ouvrir la quête</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        // Collapsible logic
        document.querySelectorAll('.theme-header').forEach(header => {
            header.addEventListener('click', () => {
                header.parentElement.classList.toggle('collapsed');
            });
        });

        document.querySelectorAll('.open-activity').forEach(btn => {
            btn.addEventListener('click', () => showActivityDetail(btn.dataset.id));
        });
    };

    const showActivityDetail = async (id, updateHistory = true) => {
        currentActivityId = id;
        if (updateHistory) {
            history.pushState({ viewId: 'activity-detail', activityId: id }, '', `/pages/activities/${id}`);
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
                    <iframe src="${embedUrl}" width="560" height="315" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
            `;
        }

        let docsHtml = '';
        if (activity.documents && activity.documents.length > 0) {
            docsHtml = `
                <div class="documents-section-box">
                    <h4><span class="icon">📂</span> Documents pour l'aventure :</h4>
                    <div class="button-cloud" style="justify-content: flex-start; margin-top: 1rem;">
                        ${activity.documents.map(d => `
                            <a href="${d.url}" target="_blank" class="cloud-btn" style="min-width: auto; flex-direction: row; padding: 0.8rem 1.2rem;">
                                <span style="font-size: 1.5rem;">📄</span> ${d.filename}
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        activityContent.innerHTML = `
            <div class="activity-detail-header">
                <div class="activity-badges mb-1">
                    ${activity.type ? `<span class="badge badge-type">${activity.type.label}</span>` : ''}
                    ${activity.role ? `<span class="badge badge-role">${activity.role.label}</span>` : ''}
                    ${activity.level ? `<span class="badge badge-level">${activity.level.label}</span>` : ''}
                </div>
                ${activity.logo_url ? `<img src="${activity.logo_url}" alt="Logo" class="activity-card-logo">` : ""}
                <h2>${activity.title}</h2>
            </div>
            
            <div class="detail-body">
                <div class="quest-description-box">
                    <div>${activity.description || 'Bienvenue dans cette quête !'}</div>
                </div>
                
                ${activity.video_url ? `<div class="video-section">${videoHtml}</div>` : ''}
                ${docsHtml}
            </div>
        `;

        // Progression & Interaction based on Auth
        const authActions = document.getElementById('authenticated-actions');
        const guestActions = document.getElementById('guest-actions');
        const guestCommentMsg = document.getElementById('guest-comment-msg');

        if (token) {
            authActions.classList.remove('hidden');
            guestActions.classList.add('hidden');
            commentForm.classList.remove('hidden');
            guestCommentMsg.classList.add('hidden');

            const dossier = await (await apiFetch('/dossier')).json();
            const track = dossier.find(t => t.activity_id == id);
            questCompleted.checked = track ? track.is_completed : false;
            questNotes.value = track ? (track.notes || '') : '';
        } else {
            authActions.classList.add('hidden');
            guestActions.classList.remove('hidden');
            commentForm.classList.add('hidden');
            guestCommentMsg.classList.remove('hidden');
        }

        loadComments(id);
        switchView('activity-detail', false);
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
            dossierContent.innerHTML = '<p>Ton dossier est vide pour le moment. Aucune quête n\'est encore liée à ton niveau.</p>';
            return;
        }

        // Group by Level then Theme
        const hierarchy = {};
        dossier.forEach(t => {
            const levelLabel = (t.activity && t.activity.level) ? t.activity.level.label : 'Niveau Inconnu';
            const themeLabel = (t.activity && t.activity.theme) ? t.activity.theme.label : 'Autres Quêtes';
            
            if (!hierarchy[levelLabel]) hierarchy[levelLabel] = {};
            if (!hierarchy[levelLabel][themeLabel]) hierarchy[levelLabel][themeLabel] = [];
            hierarchy[levelLabel][themeLabel].push(t);
        });

        // --- Screen View HTML ---
        let screenHtml = `
            <div class="no-print">
                <p class="mb-2">Retrouve ici ton parcours d'aventurier classé par niveau et par thème.</p>
            </div>
        `;

        for (const [level, themes] of Object.entries(hierarchy)) {
            screenHtml += `
                <div class="level-group mb-3 no-print">
                    <h2 class="level-title-main"><span class="icon">🎓</span> ${level}</h2>
                    ${Object.entries(themes).map(([theme, items]) => `
                        <div class="theme-section">
                            <div class="theme-header">
                                <h3><span class="icon">📜</span> ${theme}</h3>
                                <span class="theme-toggle-icon">▼</span>
                            </div>
                            <div class="manga-grid">
                                ${items.map(t => `
                                    <div class="activity-card" style="background: ${t.is_completed ? '#f6ffed' : '#fff'}; border-color: ${t.is_completed ? '#52c41a' : 'black'}">
                                        <div class="activity-card-header" style="background: ${t.is_completed ? '#d9f7be' : 'var(--primary-color)'}">
                                            <h3>${t.activity ? t.activity.title : 'Activité ' + t.activity_id}</h3>
                                        </div>
                                        <div class="activity-card-body">
                                            <p><strong>Statut:</strong> ${t.is_completed ? '✅ Terminé' : '⏳ En cours'}</p>
                                            <p><strong>Mes notes:</strong> ${t.notes || '<em>Aucune note pour le moment.</em>'}</p>
                                            <button class="open-activity mt-1" data-id="${t.activity_id}">Ouvrir la quête</button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // --- Print View HTML ---
        const completedCount = dossier.filter(t => t.is_completed).length;
        const totalCount = dossier.length;
        const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        let printHtml = `
            <div class="only-print printable-folder">
                <!-- Cover Page -->
                <div class="print-cover">
                    <h1 class="print-main-title">MON DOSSIER D'ORIENTATION</h1>
                    
                    <div class="print-avatar-circle">
                        ${currentUser ? currentUser.avatar : '👤'}
                    </div>

                    <div class="print-user-box">
                        <h2 class="print-user-name">${currentUser ? currentUser.username : 'Aventurier'}</h2>
                        
                        <div style="display: flex; flex-direction: column; align-items: center; margin-top: 1rem;">
                            <strong>PROGRESSION DANS L'AVENTURE</strong>
                            <div class="print-progress-container">
                                <div class="print-progress-bar" style="width: ${progressPercent}%"></div>
                                <div class="print-progress-text">${completedCount} / ${totalCount} quêtes réussies</div>
                            </div>
                        </div>
                    </div>

                    <p class="print-date">Document d'orientation officiel - Généré le ${new Date().toLocaleDateString()}</p>
                </div>

                <!-- Table of Contents -->
                <div class="print-toc">
                    <h2>Sommaire de l'Aventure</h2>
                    <ul>
                        ${Object.entries(hierarchy).map(([level, themes]) => `
                            <li>
                                <strong>Chapitre : ${level}</strong>
                                <ul class="mt-1">
                                    ${Object.keys(themes).map(theme => `<li>- ${theme}</li>`).join('')}
                                </ul>
                            </li>
                        `).join('')}
                    </ul>
                </div>

                <!-- Content -->
                <div class="print-content">
                    ${Object.entries(hierarchy).map(([level, themes]) => `
                        <div class="print-level-section">
                            <h2 class="print-level-title">${level}</h2>
                            ${Object.entries(themes).map(([theme, items]) => `
                                <div class="print-theme-section">
                                    <h3 class="print-theme-title">${theme}</h3>
                                    ${items.map(t => `
                                        <div class="print-quest-item">
                                            <h4>${t.activity ? t.activity.title : 'Quête'}</h4>
                                            <div class="print-quest-meta">
                                                Statut : ${t.is_completed ? 'RÉUSSIE ✅' : 'EN COURS ⏳'}
                                            </div>
                                            <div class="print-quest-desc">
                                                <strong>📜 OBJECTIF :</strong>
                                                <div>${t.activity ? (t.activity.description || 'Découvrir ce domaine.') : ''}</div>
                                            </div>
                                            <div class="print-quest-notes">
                                                <strong>🖋️ MES NOTES D'AVENTURIER :</strong>
                                                <p>${t.notes || 'Aucune note consignée.'}</p>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        dossierContent.innerHTML = screenHtml + printHtml;

        // Collapsible logic
        document.querySelectorAll('.theme-header').forEach(header => {
            header.addEventListener('click', () => {
                header.parentElement.classList.toggle('collapsed');
            });
        });

        document.querySelectorAll('.open-activity').forEach(btn => {
            btn.addEventListener('click', () => showActivityDetail(btn.dataset.id));
        });
    };

    const loadProfile = async () => {
        if (!currentUser) return;
        
        // Metadata should already be loaded, but let's ensure roles/levels selects are populated
        const levels = await (await apiFetch('/levels')).json();
        const profLevel = document.getElementById('prof-level');
        if (profLevel) profLevel.innerHTML = levels.map(l => `<option value="${l.id}">${l.label}</option>`).join('');

        const roles = await (await apiFetch('/roles')).json();
        const profRole = document.getElementById('prof-role');
        if (profRole) profRole.innerHTML = roles.filter(r => r.label !== 'admin').map(r => `<option value="${r.id}">${r.label}</option>`).join('');

        // Fill current values
        const profUsername = document.getElementById('prof-username');
        if (profUsername) profUsername.value = currentUser.username;
        
        const profAge = document.getElementById('prof-age');
        if (profAge) profAge.value = currentUser.age || '';
        
        if (profRole) profRole.value = currentUser.role_id;
        if (profLevel) profLevel.value = currentUser.level_id || '';
        
        const profPassword = document.getElementById('prof-password');
        if (profPassword) profPassword.value = '';

        if (currentUser.avatar) {
            const avatarRadio = document.querySelector(`input[name="avatar"][value="${currentUser.avatar}"]`);
            if (avatarRadio) {
                avatarRadio.checked = true;
            }
        }
    };

    // --- Events ---
    if (profileForm) {
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

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({ detail: 'Une erreur de communication est survenue.' }));
                    let errorMessage = 'La mise à jour du profil a échoué.';
                    if (errorData && errorData.detail) {
                        if (Array.isArray(errorData.detail)) {
                            // Handle FastAPI/Pydantic validation errors
                            errorMessage = errorData.detail.map(err => {
                                const field = err.loc[err.loc.length - 1];
                                return `- ${field}: ${err.msg}`;
                            }).join('\n');
                        } else {
                            // Handle other string-based errors from the backend
                            errorMessage = errorData.detail;
                        }
                    }
                    throw new Error(errorMessage);
                }

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
                // Refresh metadata to update default level filter and synchronize views
                loadMetadata();
            } catch (error) {
                alert('Erreur lors de la mise à jour :\n' + error.message);
            }
        });
    }

    if (showRegister) {
        showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            loginBox.classList.add('hidden');
            registerBox.classList.remove('hidden');
            loadMetadata();
        });
    }

    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            registerBox.classList.add('hidden');
            loginBox.classList.remove('hidden');
        });
    }

    if (loginForm) {
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
                const redirectViewId = sessionStorage.getItem('redirectViewId');
                if (redirectViewId) {
                    sessionStorage.removeItem('redirectViewId');
                    showApp(user);
                    switchView(redirectViewId);
                } else {
                    showApp(user);
                    handleInitialRouting();
                }
            } else {
                alert('Identifiants incorrects.');
            }
        });
    }

    if (registerForm) {
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
    }

    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    if (loginNavBtn) loginNavBtn.addEventListener('click', () => switchView('login'));
    
    document.querySelectorAll('.start-adventure-btn').forEach(btn => {
        btn.addEventListener('click', () => switchView('login'));
    });

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.view) switchView(btn.dataset.view);
        });
    });

    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => switchView('activities'));
    });

    if (levelFilter) levelFilter.addEventListener('change', (e) => loadActivities(e.target.value));

    if (saveProgressBtn) {
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
    }

    if (commentForm) {
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await apiFetch(`/activities/${currentActivityId}/comments`, {
                method: 'POST',
                body: JSON.stringify({ content: document.getElementById('comment-input').value })
            });
            document.getElementById('comment-input').value = '';
            alert('Commentaire envoyé ! Il sera visible après modération.');
        });
    }

    if (printBtn) printBtn.addEventListener('click', () => window.print());

    if (token) {
        apiFetch('/users/me')
            .then(res => res.json())
            .then(user => {
                showApp(user);
                handleInitialRouting();
            })
            .catch(() => {
                logout();
                loadMetadata();
                handleInitialRouting();
            });
    } else {
        loadMetadata();
        handleInitialRouting();
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
